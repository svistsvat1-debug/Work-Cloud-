#!/usr/bin/env python3
"""Word-accurate sync of a voice-over with its script.

1. rough word times from faster-whisper (words_fw.json [+ words_patch.json])
2. split audio at clear pauses, CTC forced alignment (wav2vec2, ONNX) of the exact script words per chunk
3. snap phrase-initial words to the real acoustic onset (energy detector)

writes  words.json (every script word: s/e seconds), cues.json, vo_synced.srt
usage: align_ctc.py <project_dir> <wav16k> <dir with model.onnx + vocab.json>
"""
import json, re, sys, wave, difflib, unicodedata
import numpy as np
import onnxruntime as ort

proj, wav, mdir = sys.argv[1], sys.argv[2], sys.argv[3]

# ───────── script tokens (from the SRT text = exact script) ─────────
srt_raw = open(f"{proj}/vo.srt", encoding="utf-8").read().strip()
blocks = re.split(r"\n\s*\n", srt_raw)
cues = [" ".join(b.splitlines()[2:]) for b in blocks]

def norm(t):
    t = unicodedata.normalize("NFKD", t.lower().replace("’", "'"))
    return re.sub(r"[^a-z0-9']+", "", t)

script = []
for ci, text in enumerate(cues):
    for raw in re.split(r"\s+", text.replace("—", " ").replace("…", " ")):
        if norm(raw):
            script.append({"w": raw, "n": norm(raw), "c": ci})
N = len(script)

ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
TENS = "x x twenty thirty forty fifty sixty seventy eighty ninety".split()
def two(n):
    if n < 20: return ONES[n]
    return TENS[n // 10] + ("" if n % 10 == 0 else " " + ONES[n % 10])
def spoken(raw):
    """letters the aligner should expect for a script word (list of sub-words)"""
    t = unicodedata.normalize("NFKD", raw).encode("ascii", "ignore").decode().replace("’", "'")
    m = re.fullmatch(r"\D*(\d{4})\D*", t)
    if m:
        y = int(m.group(1)); return (two(y // 100) + " " + two(y % 100)).upper().split()
    parts = re.split(r"[^A-Za-z']+", t)
    return [p.upper() for p in parts if p.strip("'")]

# ───────── rough times from whisper ─────────
fw = json.load(open(f"{proj}/words_fw.json"))
try:
    patch = json.load(open(f"{proj}/words_patch.json"))
    a, b = patch["range"]
    fw = [x for x in fw if not (a <= x["s"] < b)] + patch["words"]
    fw.sort(key=lambda x: x["s"])
except FileNotFoundError:
    pass
fw = [x for x in fw if norm(x["w"])]
fwn = [norm(x["w"]) for x in fw]
sm = difflib.SequenceMatcher(None, [s["n"] for s in script], fwn, autojunk=False)
S = [None] * N; E = [None] * N; exact = [False] * N
for tag, i1, i2, j1, j2 in sm.get_opcodes():
    if tag == "equal":
        for k in range(i2 - i1):
            S[i1 + k] = fw[j1 + k]["s"]; E[i1 + k] = fw[j1 + k]["e"]; exact[i1 + k] = True
    elif tag == "replace":
        t0, t1 = fw[j1]["s"], fw[j2 - 1]["e"]
        lens = [max(1, len(script[i]["n"])) for i in range(i1, i2)]; tot = sum(lens); acc = 0
        for k, i in enumerate(range(i1, i2)):
            S[i] = t0 + (t1 - t0) * acc / tot; acc += lens[k]; E[i] = t0 + (t1 - t0) * acc / tot
i = 0
while i < N:
    if S[i] is None:
        j = i
        while j < N and S[j] is None: j += 1
        t0 = E[i - 1] if i else 0.0; t1 = S[j] if j < N else t0 + 0.3 * (j - i)
        for k in range(i, j):
            S[k] = t0 + (t1 - t0) * (k - i) / (j - i); E[k] = t0 + (t1 - t0) * (k - i + 1) / (j - i)
        i = j
    else: i += 1
roughS = list(S)

# ───────── audio + energy envelope ─────────
w = wave.open(wav); sr = w.getframerate(); assert sr == 16000
x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
DUR = len(x) / sr
HOP = 0.005; hop = int(sr * HOP); win = int(sr * 0.015)
nfr = (len(x) - win) // hop
cs = np.concatenate([[0.0], np.cumsum(x.astype(np.float64) ** 2)])
idx = np.arange(nfr) * hop
db = 10 * np.log10((cs[idx + win] - cs[idx]) / win + 1e-12)
voiced = db > -50.0
# pauses: runs of unvoiced frames
pauses = []
k = 0
while k < nfr:
    if not voiced[k]:
        j = k
        while j < nfr and not voiced[j]: j += 1
        if (j - k) * HOP >= 0.10: pauses.append((k * HOP, j * HOP))
        k = j
    else: k += 1

# ───────── chunking at confident long pauses ─────────
bounds = [(0.0, 0)]      # (audio time, first script word index of chunk)
for (p0, p1) in pauses:
    if p1 - p0 < 0.34 or p0 < 0.2: continue
    # first word after the pause
    cand = min(range(N), key=lambda i: abs(roughS[i] - p1))
    if abs(roughS[cand] - p1) > 0.4 or cand == 0: continue
    if not (exact[cand] and exact[cand - 1]): continue
    if E[cand - 1] > p0 + 0.4: continue
    if cand <= bounds[-1][1]: continue
    bounds.append(((p0 + p1) / 2, cand))
bounds.append((DUR, N))

# ───────── CTC forced alignment per chunk ─────────
vocab = json.load(open(f"{mdir}/vocab.json")); BLANK = vocab["<pad>"]; BAR = vocab["|"]
so = ort.SessionOptions(); so.intra_op_num_threads = 4
sess = ort.InferenceSession(f"{mdir}/model.onnx", sess_options=so, providers=["CPUExecutionProvider"])

def emissions(seg):
    seg = (seg - seg.mean()) / (seg.std() + 1e-7)
    lg = sess.run(None, {"input_values": seg[None, :].astype(np.float32)})[0][0]
    lg = lg - lg.max(axis=1, keepdims=True)
    return lg - np.log(np.exp(lg).sum(axis=1, keepdims=True))

def viterbi(em, toks):
    T, L = em.shape[0], len(toks)
    Sn = 2 * L + 1
    sym = np.full(Sn, BLANK, dtype=np.int64); sym[1::2] = toks
    can_skip = np.zeros(Sn, dtype=bool)
    for s in range(3, Sn, 2): can_skip[s] = toks[(s - 1) // 2] != toks[(s - 3) // 2]
    NEG = -1e30
    dp = np.full(Sn, NEG); dp[0] = em[0, BLANK]; dp[1] = em[0, sym[1]]
    bp = np.zeros((T, Sn), dtype=np.int8)
    for t in range(1, T):
        stay = dp
        prev = np.concatenate([[NEG], dp[:-1]])
        skip = np.concatenate([[NEG, NEG], dp[:-2]]); skip = np.where(can_skip, skip, NEG)
        stack = np.stack([stay, prev, skip])
        ch = stack.argmax(axis=0)
        dp = stack[ch, np.arange(Sn)] + em[t, sym]
        bp[t] = ch
    s = Sn - 1 if dp[Sn - 1] >= dp[Sn - 2] else Sn - 2
    path = np.zeros(T, dtype=np.int64)
    for t in range(T - 1, -1, -1):
        path[t] = s; s -= int(bp[t, s])
    return path

FR = 0.02
cS = [None] * N; cE = [None] * N
for bi in range(len(bounds) - 1):
    (t0, i0), (t1, i1) = bounds[bi], bounds[bi + 1]
    if i1 <= i0: continue
    a = max(0.0, t0 - 0.05); b = min(DUR, t1 + 0.05)
    seg = x[int(a * sr):int(b * sr)]
    em = emissions(seg)
    toks = []; spans = []
    for i in range(i0, i1):
        subs = spoken(script[i]["w"]) or ["A"]
        st = len(toks)
        for si, sw in enumerate(subs):
            if toks: toks.append(BAR)
            if si == 0: st = len(toks)
            toks.extend(vocab.get(ch, vocab["<unk>"]) for ch in sw)
        spans.append((st, len(toks) - 1))
    if em.shape[0] < len(toks) + 2:      # degenerate, keep rough times
        continue
    path = viterbi(em, np.array(toks))
    for (st, en), i in zip(spans, range(i0, i1)):
        fs = np.where(path == 2 * st + 1)[0]; fe = np.where(path == 2 * en + 1)[0]
        if len(fs) == 0 or len(fe) == 0: continue
        cS[i] = a + fs[0] * FR - 0.005
        cE[i] = a + (fe[-1] + 1) * FR + 0.01
for i in range(N):
    if cS[i] is None: cS[i], cE[i] = S[i], E[i]
diff = np.array([abs(cS[i] - roughS[i]) for i in range(N)])
S, E = list(cS), list(cE)

# ───────── snap phrase-initial words to the acoustic onset ─────────
snapped = 0
used = set()
for (p0, p1) in pauses:
    if p1 >= DUR - 0.05: continue
    i = min(range(N), key=lambda k: abs(S[k] - p1))
    if abs(S[i] - p1) > 0.22 or i in used: continue
    used.add(i)
    if abs(S[i] - p1) > 0.008: snapped += 1
    S[i] = p1
    if i > 0:
        E[i - 1] = min(max(E[i - 1], S[i - 1] + 0.04), p0 + 0.02) if p0 > S[i - 1] else E[i - 1]
for i in range(N):
    nxt = S[i + 1] if i + 1 < N else DUR
    if i and S[i] <= S[i - 1]: S[i] = S[i - 1] + 0.02
    E[i] = max(S[i] + 0.04, min(E[i], nxt))

words = [{"w": script[i]["w"], "n": script[i]["n"], "s": round(float(S[i]), 3), "e": round(float(E[i]), 3), "c": script[i]["c"]} for i in range(N)]
json.dump(words, open(f"{proj}/words.json", "w"), ensure_ascii=False)

# ───────── re-timed cues + corrected SRT ─────────
out = []
for ci, text in enumerate(cues):
    ws = [q for q in words if q["c"] == ci]
    out.append({"i": ci + 1, "text": text, "lines": blocks[ci].splitlines()[2:], "s": ws[0]["s"], "e": ws[-1]["e"]})
for k in range(len(out)):
    nxt = out[k + 1]["s"] if k + 1 < len(out) else DUR
    out[k]["e2"] = round(max(out[k]["e"], min(nxt - 0.03, out[k]["e"] + 0.8)), 3)
json.dump(out, open(f"{proj}/cues.json", "w"), ensure_ascii=False, indent=0)
def ts(t):
    ms = int(round(t * 1000)); return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"
with open(f"{proj}/vo_synced.srt", "w", encoding="utf-8") as f:
    for c in out:
        f.write(f"{c['i']}\n{ts(c['s'])} --> {ts(c['e2'])}\n" + "\n".join(c["lines"]) + "\n\n")

print(f"script words {N} | chunks {len(bounds) - 1} | pauses {len(pauses)} | snapped onsets {snapped}")
print(f"CTC vs whisper start: median {np.median(diff) * 1000:.0f} ms, p90 {np.percentile(diff, 90) * 1000:.0f} ms, max {diff.max():.2f} s")
big = np.argsort(-diff)[:12]
print("largest corrections:", [(script[i]["w"], round(roughS[i], 2), round(cS[i], 2)) for i in sorted(big)])
