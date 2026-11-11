"""Spot-check that visuals land on their VO keywords: pick N random scenes, take a cue word from sfx_cues.tsv,
export a frame 0.3 s before and 0.9 s after the word, and build one labelled contact sheet."""
import json, random, re, subprocess, sys
from PIL import Image, ImageDraw
tl, cues_tsv, video, out_png = sys.argv[1:5]
n = int(sys.argv[5]) if len(sys.argv) > 5 else 5
T = json.load(open(tl))
norm = lambda s: re.sub(r"[^a-z0-9]", "", s.lower())
cues = [l.rstrip("\n").split("\t") for l in open(cues_tsv) if l.strip() and not l.startswith("#")]
random.seed(20261111)
scenes = random.sample(sorted({int(c[0]) for c in cues}), n)
rows = []
for sid in sorted(scenes):
    c = random.choice([c for c in cues if int(c[0]) == sid])
    sc = next(s for s in T["scenes"] if s["id"] == sid)
    hits = [w for w in sc["words"] if norm(w["w"]) == norm(c[1].split()[0])]
    t = hits[int(c[2]) - 1]["t"]
    ims = []
    for dt in (-0.3, 0.9):
        p = f"/tmp/spot_{sid}_{dt}.png"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t + dt:.3f}", "-i", video, "-frames:v", "1", "-vf", "scale=640:360", p], check=True)
        ims.append(Image.open(p))
    rows.append((sid, c[1], t, ims))
sheet = Image.new("RGB", (1280, 400 * len(rows)), "white")
d = ImageDraw.Draw(sheet)
for i, (sid, word, t, ims) in enumerate(rows):
    sheet.paste(ims[0], (0, 400 * i + 36)); sheet.paste(ims[1], (640, 400 * i + 36))
    d.text((8, 400 * i + 8), f"Scene {sid} | word '{word}' at {int(t // 60)}:{t % 60:05.2f} | left: -0.3 s, right: +0.9 s", fill="red")
sheet.save(out_png)
print([(sid, w, round(t, 2)) for sid, w, t, _ in rows])
