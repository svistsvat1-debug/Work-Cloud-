#!/usr/bin/env python3
"""Map faster-whisper word timings onto the exact script (taken from the SRT text),
refine word onsets that follow a pause with an energy detector, and write:
  words.json   – every script word with start/end seconds
  cues.json    – SRT cues re-timed from the aligned words
  vo_synced.srt – corrected subtitle file
usage: align.py <project_dir> <wav16k>"""
import json, re, sys, wave, difflib
import numpy as np

proj, wav = sys.argv[1], sys.argv[2]

# ---------- script tokens from SRT ----------
cues = []
blk = []
for line in open(f"{proj}/vo.srt", encoding="utf-8").read().splitlines() + [""]:
    if line.strip() == "":
        if len(blk) >= 3:
            cues.append(" ".join(blk[2:]))
        blk = []
    else:
        blk.append(line.strip())

def norm(t):
    t = t.lower().replace("’", "'")
    t = re.sub(r"[^a-z0-9']+", "", t)
    return t

NUM = {"0":"zero","1":"one","2":"two","3":"three","4":"four","5":"five","6":"six","7":"seven","8":"eight","9":"nine","10":"ten",
       "15":"fifteen","22":"twentytwo","29":"twentynine","48":"fortyeight"}
script = []   # (raw, norm, cue_index)
for ci, text in enumerate(cues):
    for raw in re.split(r"\s+", text.replace("—", " ").replace("…", " ")):
        n = norm(raw)
        if n:
            script.append([raw, n, ci])

fw = json.load(open(f"{proj}/words_fw.json"))
fwn = [norm(x["w"]) for x in fw]
keep = [i for i, n in enumerate(fwn) if n]
fw = [fw[i] for i in keep]; fwn = [fwn[i] for i in keep]

a = [s[1] for s in script]
sm = difflib.SequenceMatcher(None, a, fwn, autojunk=False)
S = [None] * len(script); E = [None] * len(script)
for tag, i1, i2, j1, j2 in sm.get_opcodes():
    if tag == "equal":
        for k in range(i2 - i1):
            S[i1 + k] = fw[j1 + k]["s"]; E[i1 + k] = fw[j1 + k]["e"]
    elif tag == "replace":
        t0, t1 = fw[j1]["s"], fw[j2 - 1]["e"]
        # distribute by character length
        lens = [max(1, len(script[i][1])) for i in range(i1, i2)]
        tot = sum(lens); acc = 0
        for k, i in enumerate(range(i1, i2)):
            S[i] = t0 + (t1 - t0) * acc / tot; acc += lens[k]; E[i] = t0 + (t1 - t0) * acc / tot
    # 'delete' (script words missing in whisper) are interpolated below; 'insert' ignored
# interpolate missing
n = len(script)
i = 0
while i < n:
    if S[i] is None:
        j = i
        while j < n and S[j] is None: j += 1
        t0 = E[i - 1] if i > 0 else 0.0
        t1 = S[j] if j < n else t0 + 0.3 * (j - i)
        for k in range(i, j):
            S[k] = t0 + (t1 - t0) * (k - i) / (j - i); E[k] = t0 + (t1 - t0) * (k - i + 1) / (j - i)
        i = j
    else:
        i += 1

# ---------- energy onset refinement ----------
w = wave.open(wav); sr = w.getframerate()
x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
hop = int(sr * 0.005); win = int(sr * 0.02)
nfr = (len(x) - win) // hop
rms = np.array([np.sqrt(np.mean(x[i * hop:i * hop + win] ** 2) + 1e-12) for i in range(nfr)])
db = 20 * np.log10(rms + 1e-9)
thr = -40.0
voiced = db > thr
def t2f(t): return int(max(0, min(nfr - 1, round(t / 0.005))))
refined = 0
for i in range(n):
    f = t2f(S[i])
    lo, hi = max(0, f - 60), min(nfr - 1, f + 50)     # -0.30s .. +0.25s
    # find a silence run (>=120ms) ending inside the window
    best = None
    run = 0
    for k in range(lo, hi + 1):
        if not voiced[k]:
            run += 1
        else:
            if run >= 24:           # 120 ms of silence right before frame k
                # onset must persist for >= 30 ms
                if voiced[k:k + 6].all():
                    if best is None or abs(k - f) < abs(best - f): best = k
            run = 0
    if best is not None:
        newt = best * 0.005
        if abs(newt - S[i]) > 0.012: refined += 1
        S[i] = round(newt, 3)
        if i > 0 and E[i - 1] > S[i]: E[i - 1] = S[i]
# word end refinement: if a pause follows, end at last voiced frame
for i in range(n):
    nxt = S[i + 1] if i + 1 < n else len(x) / sr
    f0, f1 = t2f(E[i]) , t2f(nxt)
    if nxt - E[i] > 0.12 or i + 1 == n:
        k = min(f1, nfr - 1)
        while k > t2f(S[i]) and not voiced[k]: k -= 1
        E[i] = round(min(nxt, (k + 4) * 0.005), 3)
    E[i] = max(E[i], S[i] + 0.03)
# monotonic guard
for i in range(1, n):
    if S[i] < S[i - 1]: S[i] = S[i - 1] + 0.01

words = [{"w": script[i][0], "n": script[i][1], "s": round(float(S[i]), 3), "e": round(float(E[i]), 3), "c": script[i][2]} for i in range(n)]
json.dump(words, open(f"{proj}/words.json", "w"), ensure_ascii=False)

# ---------- re-timed cues ----------
out = []
for ci, text in enumerate(cues):
    ws = [w_ for w_ in words if w_["c"] == ci]
    out.append({"i": ci + 1, "text": text, "s": ws[0]["s"], "e": ws[-1]["e"]})
for k in range(len(out) - 1):          # hold each caption until just before the next one (max +0.9s)
    out[k]["e2"] = round(min(out[k + 1]["s"] - 0.02, out[k]["e"] + 0.9), 3)
out[-1]["e2"] = round(out[-1]["e"] + 0.9, 3)
json.dump(out, open(f"{proj}/cues.json", "w"), ensure_ascii=False, indent=0)
def ts(t):
    ms = int(round(t * 1000)); h = ms // 3600000; m = ms // 60000 % 60; s = ms // 1000 % 60
    return f"{h:02d}:{m:02d}:{s:02d},{ms % 1000:03d}"
# keep the original two-line layout of each cue
orig_blocks = [b for b in re.split(r"\n\s*\n", open(f"{proj}/vo.srt", encoding="utf-8").read().strip())]
with open(f"{proj}/vo_synced.srt", "w", encoding="utf-8") as f:
    for c, b in zip(out, orig_blocks):
        lines = b.splitlines()[2:]
        f.write(f"{c['i']}\n{ts(c['s'])} --> {ts(c['e2'])}\n" + "\n".join(lines) + "\n\n")

ratio = sm.ratio()
unmatched = sum(1 for tag, i1, i2, j1, j2 in sm.get_opcodes() if tag != "equal" for _ in range(i2 - i1))
print(f"script words {n}, whisper words {len(fw)}, match ratio {ratio:.4f}, non-equal script words {unmatched}, onsets refined {refined}")
for tag, i1, i2, j1, j2 in sm.get_opcodes():
    if tag != "equal":
        print(tag, [script[i][0] for i in range(i1, i2)], "<->", [fw[j]["w"] for j in range(j1, j2)], round(S[i1], 2) if i1 < n else "")
