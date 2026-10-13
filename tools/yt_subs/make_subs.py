import json, re, sys, unicodedata, difflib

ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
TENS = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split()


def n2w(n):
    if n < 20:
        return ONES[n].split()
    if n < 100:
        return [TENS[n // 10]] + ([ONES[n % 10]] if n % 10 else [])
    if n < 1000:
        return [ONES[n // 100], "hundred"] + (n2w(n % 100) if n % 100 else [])
    if 1100 <= n < 2000 or 2010 <= n < 2100:  # years: nineteen fifty six
        hi, lo = divmod(n, 100)
        return n2w(hi) + (n2w(lo) if lo >= 10 else (["oh"] + n2w(lo) if lo else ["hundred"]))
    th, r = divmod(n, 1000)
    return n2w(th) + ["thousand"] + (n2w(r) if r else [])


def norm(word):
    """Display word -> list of normalized match tokens."""
    w = unicodedata.normalize("NFKD", word).encode("ascii", "ignore").decode().lower()
    w = w.replace("’", "'")
    out = []
    for part in re.split(r"[-\s]+", w):
        m = re.fullmatch(r"(\d+)(st|nd|rd|th|s)?", re.sub(r"[^\w]", "", part))
        if m:
            out += n2w(int(m.group(1)))
            continue
        p = re.sub(r"[^a-z0-9']", "", part).strip("'")
        if p:
            out.append(p)
    return out


# ---------- ASR words with times ----------
asr = json.load(open(sys.argv[1]))
aw = []  # (text, start, end)
for seg in asr:
    toks, ts, du = seg["tokens"], seg["ts"], seg.get("dur") or []
    cur = None
    for i, (t, s) in enumerate(zip(toks, ts)):
        e = s + (du[i] if i < len(du) and du[i] > 0 else 0.08)
        if t.startswith(("▁", " ")) or cur is None:
            if cur:
                aw.append(cur)
            cur = [t.lstrip("▁ "), s, e]
        else:
            cur[0] += t
            cur[2] = e
    if cur:
        aw.append(cur)
    # clamp last word end to segment end
    if aw:
        aw[-1][2] = min(aw[-1][2], seg["end"] + 0.1)

atoks, atime = [], []
for w, s, e in aw:
    ns = norm(w)
    for k, n in enumerate(ns):
        atoks.append(n)
        span = (e - s) / len(ns)
        atime.append((s + k * span, s + (k + 1) * span))

# ---------- Script words ----------
text = open(sys.argv[2]).read()
paras = [p.strip() for p in text.split("\n\n") if p.strip()]
words = []  # dict(text, para_end)
for p in paras:
    toks = p.split()
    for i, t in enumerate(toks):
        words.append({"t": t, "pend": i == len(toks) - 1})

stoks, sidx = [], []
for wi, w in enumerate(words):
    for n in norm(w["t"]):
        stoks.append(n)
        sidx.append(wi)

sm = difflib.SequenceMatcher(None, stoks, atoks, autojunk=False)
for w in words:
    w["s"] = w["e"] = None
matched = 0
for a, b, size in sm.get_matching_blocks():
    for k in range(size):
        w = words[sidx[a + k]]
        s, e = atime[b + k]
        if w["s"] is None:
            w["s"] = s
        w["e"] = e
        matched += 1
print(f"matched {matched}/{len(stoks)} script tokens", file=sys.stderr)

# interpolate unmatched words by character length between anchors
i = 0
N = len(words)
while i < N:
    if words[i]["s"] is not None:
        i += 1
        continue
    j = i
    while j < N and words[j]["s"] is None:
        j += 1
    t0 = words[i - 1]["e"] if i > 0 else 0.0
    t1 = words[j]["s"] if j < N else t0 + 0.35 * (j - i)
    total = sum(len(words[k]["t"]) + 1 for k in range(i, j))
    acc = t0
    for k in range(i, j):
        d = (t1 - t0) * (len(words[k]["t"]) + 1) / total
        words[k]["s"], words[k]["e"] = acc, acc + d
        acc += d
    i = j
# enforce monotonic
for k in range(1, N):
    if words[k]["s"] < words[k - 1]["s"]:
        words[k]["s"] = words[k - 1]["s"] + 0.01
    words[k]["e"] = max(words[k]["e"], words[k]["s"] + 0.05)

# ---------- Chunking ----------
MAXC = 28
WEAK = set("i a an the to of in on at and but or so for with my his her your our their that it is was he she we they you".split())
chunks, cur = [], []
for k, w in enumerate(words):
    cur.append(w)
    length = len(" ".join(x["t"] for x in cur))
    nxt = words[k + 1] if k + 1 < N else None
    t = w["t"]
    brk = False
    if nxt is None or w["pend"]:
        brk = True
    elif re.search(r"[.!?…]['\"”]?$", t):
        brk = True
    elif nxt["s"] - w["e"] > 0.45:
        brk = True
    elif re.search(r"[,;:]['\"”]?$", t) and length >= 12:
        brk = True
    elif length + 1 + len(nxt["t"]) > MAXC:
        brk = True
        # don't leave a weak word dangling at the end of a line ("something I")
        if len(cur) > 2 and t.lower() in WEAK:
            chunks.append(cur[:-1])
            cur = [cur[-1]]
            continue
    if brk:
        chunks.append(cur)
        cur = []

# avoid single orphan short words glued to a long phrase: fine as-is


# ---------- ASS ----------
def ts(t):
    t = max(0, t)
    h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
    return f"{h}:{m:02d}:{s:05.2f}"


def esc(s):
    return s.replace("{", "(").replace("}", ")").replace("\\", "/")


WHITE = "&HFFFFFF&"
GOLD = "&H5AD2FF&"      # #FFD25A — warm headlight yellow
GLOW = "&H1E8CFF&"      # #FF8C1E — amber glow behind active word
POS = r"\an5\pos(960,575)"

head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Main,Inter Display Black,104,&H00FFFFFF,&H00FFFFFF,&H00100A05,&H96000000,0,0,0,0,100,100,1,0,1,4,5,5,80,80,0,1
Style: Glow,Inter Display Black,104,&HFF000000,&HFF000000,&H50000000,&HFF000000,0,0,0,0,100,100,1,0,1,18,0,5,80,80,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
ev = []
for ci, ch in enumerate(chunks):
    nxt_start = chunks[ci + 1][0]["s"] if ci + 1 < len(chunks) else ch[-1]["e"] + 1.5
    c_end = min(ch[-1]["e"] + 0.5, nxt_start)
    if nxt_start - c_end < 0.35:  # tiny gaps flicker — bridge them
        c_end = nxt_start
    for wi, w in enumerate(ch):
        s = w["s"] if wi else ch[0]["s"]
        e = ch[wi + 1]["s"] if wi + 1 < len(ch) else c_end
        if e - s <= 0.005:
            continue
        fad = r"\fad(110,0)" if wi == 0 else ""
        out_fad = r"\fad(0,140)" if wi == len(ch) - 1 and c_end != nxt_start else ""
        if wi == 0 and out_fad:
            fad = r"\fad(110,140)"
            out_fad = ""
        main, glow = [], []
        for k, x in enumerate(ch):
            t = esc(x["t"])
            if k == wi:
                main.append(r"{\1c" + GOLD + "}" + t + r"{\1c" + WHITE + "}")
                glow.append(r"{\3c" + GLOW + r"\3a&H60&}" + t + r"{\3c&H000000&\3a&H50&}")
            else:
                main.append(t)
                glow.append(t)
        ev.append(f"Dialogue: 0,{ts(s)},{ts(e)},Glow,,0,0,0,,{{{POS}\\blur16{fad}{out_fad}}}" + " ".join(glow))
        ev.append(f"Dialogue: 1,{ts(s)},{ts(e)},Main,,0,0,0,,{{{POS}\\blur0.6{fad}{out_fad}}}" + " ".join(main))

open(sys.argv[3], "w").write(head + "\n".join(ev) + "\n")
print(f"{len(chunks)} chunks, {len(ev)} events, longest chunk: "
      f"{max(len(' '.join(x['t'] for x in c)) for c in chunks)} chars", file=sys.stderr)
json.dump([{"t": w["t"], "s": round(w["s"], 2), "e": round(w["e"], 2)} for w in words],
          open(sys.argv[3] + ".words.json", "w"))
