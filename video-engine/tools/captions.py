"""Build captions.srt from timeline.json (script words + aligned times).
Rules: max 2 lines, max 42 chars per line, each cue 1-6 s. Sentence-first, balanced splits.
Usage: python3 captions.py timeline.json out.srt
"""
import json, sys, math, textwrap

MAXC, MAXD, MIND = 42, 6.0, 1.0
def wrap(t, n=MAXC):
    return textwrap.wrap(t, n, break_on_hyphens=False, break_long_words=False)
def text(ws): return " ".join(w["w"] for w in ws)
def dur(ws): return ws[-1]["e"] - ws[0]["t"]
def fits(ws): return len(wrap(text(ws))) <= 2 and dur(ws) <= MAXD

T = json.load(open(sys.argv[1]))
words = [w for s in T["scenes"] for w in s["words"]]
sents, cur = [], []
for w in words:
    cur.append(w)
    if w["w"][-1] in ".?!": sents.append(cur); cur = []
if cur: sents.append(cur)

def split(ws):
    if fits(ws): return [ws]
    n = max(2, math.ceil(len(text(ws)) / 80), math.ceil(dur(ws) / MAXD))
    while n <= len(ws):
        total = len(text(ws)); target = total / n
        parts, start, acc = [], 0, 0
        for i in range(len(ws)):
            acc += len(ws[i]["w"]) + 1
            remaining_parts = n - len(parts) - 1
            if remaining_parts > 0 and acc >= target * (len(parts) + 1) - 6:
                # prefer a comma within the next 2 words
                j = i
                for k in range(i, min(i + 3, len(ws) - 1)):
                    if ws[k]["w"][-1] in ",:;": j = k; break
                if j > i: continue
                parts.append(ws[start:i + 1]); start = i + 1
        parts.append(ws[start:])
        parts = [p for p in parts if p]
        if all(fits(p) for p in parts): return parts
        n += 1
    return [[w] for w in ws]

chunks = [p for s in sents for p in split(s)]
# merge very short chunks with a neighbour when the result still fits
merged = []
for c in chunks:
    if merged and (dur(c) < MIND or len(c) <= 1) and fits(merged[-1] + c):
        merged[-1] = merged[-1] + c
    elif merged and (dur(merged[-1]) < MIND or len(merged[-1]) <= 1) and fits(merged[-1] + c):
        merged[-1] = merged[-1] + c
    else:
        merged.append(c)

def ts(t):
    t = max(0, t); h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
    ms = int(round((s - int(s)) * 1000))
    if ms == 1000: ms = 999
    return f"{h:02d}:{m:02d}:{int(s):02d},{ms:03d}"

def lines_for(t):
    ls = wrap(t)
    if len(ls) == 2:
        ws = t.split(); best = None
        for j in range(1, len(ws)):
            a, b = " ".join(ws[:j]), " ".join(ws[j:])
            if len(a) <= MAXC and len(b) <= MAXC:
                sc = abs(len(a) - len(b)) - (8 if a[-1] in ",.:;?!" else 0)
                if best is None or sc < best[0]: best = (sc, [a, b])
        if best: ls = best[1]
    return ls

starts = [c[0]["t"] for c in merged]
ends = [c[-1]["e"] + 0.2 for c in merged]
for k in range(len(merged)):
    if k + 1 < len(merged): ends[k] = min(ends[k], starts[k + 1] - 0.02)
    if ends[k] - starts[k] < MIND:
        # borrow time: start earlier into the gap before, then push the next cue's start
        prev_end = ends[k - 1] if k else 0
        starts[k] = max(prev_end + 0.02, ends[k] - MIND, starts[k] - 0.3)
        if ends[k] - starts[k] < MIND:
            ends[k] = starts[k] + MIND
            if k + 1 < len(merged) and starts[k + 1] < ends[k] + 0.02:
                starts[k + 1] = ends[k] + 0.02
out, bad = [], []
for k, c in enumerate(merged):
    st = starts[k]; en = ends[k]
    nxt = starts[k + 1] if k + 1 < len(merged) else T["duration"] + 1
    en = min(en, nxt - 0.02, st + MAXD)
    ls = lines_for(text(c))
    if not (MIND - 0.05 <= en - st <= MAXD) or len(ls) > 2 or max(map(len, ls)) > MAXC:
        bad.append((k + 1, round(en - st, 2), ls))
    out.append(f"{k + 1}\n{ts(st)} --> {ts(en)}\n" + "\n".join(ls) + "\n")
open(sys.argv[2], "w").write("\n".join(out))
print(len(merged), "cues; rule violations:", bad)
print("one-word cues:", [text(c) for c in merged if len(c) == 1])
