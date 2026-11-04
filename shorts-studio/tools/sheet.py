"""Combine images/birdwire/qa/beat-*.png into one labelled grid: qa/sheet.png"""
import json
import os
import sys

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
QA = os.path.join(ROOT, "images/birdwire/qa")
beats = json.load(open(os.path.join(QA, "beats.json")))
cols = int(sys.argv[1]) if len(sys.argv) > 1 else 6
tw, th = 270, 480
rows = (len(beats) + cols - 1) // cols
sheet = Image.new("RGB", (cols * tw, rows * (th + 26)), "white")
d = ImageDraw.Draw(sheet)
for n, b in enumerate(beats):
    im = Image.open(b["file"]).convert("RGB").resize((tw, th))
    x, y = (n % cols) * tw, (n // cols) * (th + 26)
    sheet.paste(im, (x, y + 26))
    d.text((x + 6, y + 6), f'{b["i"]:02d} {b["t"]:.2f}s {b["label"]}', fill="black")
sheet.save(os.path.join(QA, "sheet.png"))
print(os.path.join(QA, "sheet.png"), sheet.size)
