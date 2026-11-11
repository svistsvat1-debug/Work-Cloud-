#!/usr/bin/env python3
"""captions.srt from the script text + aligned word timings.

Usage: build_captions.py <video_dir> <out.srt>
Rules: max 2 lines, max 42 chars per line, 1-6 s per cue, cues break at sentence ends.
"""
import json
import re
import sys
from pathlib import Path

MAXL = 42


def ntok(word):
    core = re.sub(r"[^A-Za-z0-9'\-\.]", "", word)
    return len([p for p in core.split("-") if re.sub(r"[^a-z0-9]", "", p.lower())])


def fmt(t):
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def split2(text):
    if len(text) <= MAXL:
        return [text]
    words = text.split()
    best = None
    for i in range(1, len(words)):
        a, b = " ".join(words[:i]), " ".join(words[i:])
        if len(a) <= MAXL and len(b) <= MAXL:
            score = abs(len(a) - len(b))
            if best is None or score < best[0]:
                best = (score, [a, b])
    return best[1] if best else None


def main():
    vdir = Path(sys.argv[1])
    out = Path(sys.argv[2])
    scenes = json.loads((vdir / "phase-a" / "scenes.json").read_text())
    tl = json.loads((vdir / "work" / "timeline.json").read_text())
    words = []  # (display, start, end)
    for sc, ts in zip(scenes, tl["scenes"]):
        k = 0
        tw = ts["words"]
        for w in sc["vo"].split():
            n = ntok(w)
            if n == 0:
                continue
            seg = tw[k : k + n]
            k += n
            words.append((w, seg[0]["s"], seg[-1]["e"]))
        assert k == len(tw), f"scene {ts['i']}: token mismatch {k} vs {len(tw)}"

    cues = []
    cur = []
    for i, (w, s, e) in enumerate(words):
        cand = cur + [(w, s, e)]
        text = " ".join(x[0] for x in cand)
        too_long = split2(text) is None or (e - cand[0][1]) > 5.6
        if cur and too_long:
            cues.append(cur)
            cur = [(w, s, e)]
        else:
            cur = cand
        end_sentence = re.search(r"[.?!]$", w)
        nxt_gap = words[i + 1][1] - e if i + 1 < len(words) else 9
        dur = cur[-1][2] - cur[0][1]
        if end_sentence and (dur >= 1.0 or nxt_gap > 0.5):
            cues.append(cur)
            cur = []
        elif re.search(r"[,;:]$", w) and len(" ".join(x[0] for x in cur)) > 48:
            cues.append(cur)
            cur = []
    if cur:
        cues.append(cur)

    # merge cues that are too short into a neighbour when it still fits
    merged = []
    for c in cues:
        if merged:
            prev = merged[-1]
            dur = c[-1][2] - c[0][1]
            pdur = prev[-1][2] - prev[0][1]
            joined = " ".join(x[0] for x in prev + c)
            if (dur < 1.0 or pdur < 1.0) and split2(joined) and (c[-1][2] - prev[0][1]) <= 6.0 and c[0][1] - prev[-1][2] < 0.7:
                merged[-1] = prev + c
                continue
        merged.append(c)

    lines = []
    for i, c in enumerate(merged):
        st = c[0][1]
        en = c[-1][2] + 0.2
        nxt = merged[i + 1][0][1] if i + 1 < len(merged) else en + 2
        if en - st < 1.0:
            en = st + 1.0
        en = min(en, nxt - 0.04, st + 6.0)
        text = " ".join(x[0] for x in c)
        ls = split2(text) or [text[:MAXL], text[MAXL:]]
        lines.append(f"{i + 1}\n{fmt(st)} --> {fmt(en)}\n" + "\n".join(ls) + "\n")
    out.write_text("\n".join(lines))
    durs = [(c[-1][2] - c[0][1]) for c in merged]
    print(f"cues={len(merged)} min={min(durs):.2f}s max={max(durs):.2f}s")


if __name__ == "__main__":
    main()
