"""Align script words (script_scenes.md) to faster-whisper word timestamps.
Usage: python3 align.py script_scenes.md words.json voice_duration_sec out_timeline.json
"""
import json, re, sys, difflib

def norm(w):
    return re.sub(r"[^a-z0-9]", "", w.lower())

scenes = []
for m in re.finditer(r"\[SCENE (\d+) \|[^\]]*\]\nVO: \"(.*)\"", open(sys.argv[1]).read()):
    scenes.append({"id": int(m.group(1)), "vo": m.group(2)})
script = []  # (scene_idx, display_word)
for si, s in enumerate(scenes):
    for w in s["vo"].split():
        script.append((si, w))
ww = json.load(open(sys.argv[2]))
dur = float(sys.argv[3])
a = [norm(w) for _, w in script]
b = [norm(x["w"]) for x in ww]
sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
times = [None] * len(a)
report = []
for tag, i1, i2, j1, j2 in sm.get_opcodes():
    if tag == "equal":
        for k in range(i2 - i1):
            times[i1 + k] = (ww[j1 + k]["s"], ww[j1 + k]["e"])
    elif tag in ("replace", "delete"):
        if j2 > j1:
            t0, t1 = ww[j1]["s"], ww[j2 - 1]["e"]
        else:  # deletion: squeeze between neighbours
            t0 = ww[j1 - 1]["e"] if j1 > 0 else 0.0
            t1 = ww[j1]["s"] if j1 < len(ww) else dur
        n = i2 - i1
        for k in range(n):
            times[i1 + k] = (t0 + (t1 - t0) * k / n, t0 + (t1 - t0) * (k + 1) / n)
        report.append((tag, " ".join(w for _, w in script[i1:i2]), " ".join(x["w"] for x in ww[j1:j2])))
    elif tag == "insert":
        report.append((tag, "", " ".join(x["w"] for x in ww[j1:j2])))
out = {"fps": 30, "duration": dur, "scenes": []}
for si, s in enumerate(scenes):
    idx = [i for i, (sj, _) in enumerate(script) if sj == si]
    words = [{"w": script[i][1], "t": round(times[i][0], 3), "e": round(times[i][1], 3)} for i in idx]
    out["scenes"].append({"id": s["id"], "vo": s["vo"], "words": words})
for si, s in enumerate(out["scenes"]):
    s["start"] = 0.0 if si == 0 else round(max(0.0, s["words"][0]["t"] - 0.15), 3)
for si, s in enumerate(out["scenes"]):
    s["end"] = out["scenes"][si + 1]["start"] if si + 1 < len(out["scenes"]) else round(dur + 1.5, 3)
out["total"] = round(dur + 1.5, 3)
json.dump(out, open(sys.argv[4], "w"), indent=1)
print("match ratio", round(sm.ratio(), 4), "script words", len(a), "whisper words", len(b))
for r in report:
    print(r)
