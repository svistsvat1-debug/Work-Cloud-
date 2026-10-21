#!/usr/bin/env python3
"""Trend "story wall" YouTube thumbnail (1280x720): photo on the right, the story setup
in big colored uppercase text on the left, a label bar at the bottom left.

Usage: python3 tools/story_thumb.py spec.json out.jpg
spec: {"photo": "path", "crop": [x0, y0, x1, y1] (optional), "label": "TRUCKER STORY",
       "max_size": 64 (bigger for short text), "center": false,
       "text": [["white", "MY DAD DIED "], ["yellow", "16 YEARS AGO."], ...]}
"""
import json
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

FONT = "/usr/share/fonts/opentype/inter/InterDisplay-Black.otf"
COLORS = {"white": (255, 255, 255), "yellow": (255, 212, 0), "green": (60, 230, 90),
          "cyan": (70, 200, 255), "red": (255, 40, 40)}
W, H = 1280, 720
TEXT_W, TOP, BOTTOM = 640, 26, 600


def layout(words, size):
    font = ImageFont.truetype(FONT, size)
    space = font.getlength(" ")
    lines, cur, x = [], [], 0.0
    for color, w in words:
        wl = font.getlength(w)
        if cur and x + wl > TEXT_W:
            lines.append(cur)
            cur, x = [], 0.0
        cur.append((color, w, x))
        x += wl + space
    lines.append(cur)
    return font, lines, size * 1.04


def main(spec_path, out):
    spec = json.load(open(spec_path))
    photo = Image.open(spec["photo"]).convert("RGB")
    if spec.get("crop"):
        photo = photo.crop(spec["crop"])
    ph = photo.resize((int(photo.width * H / photo.height), H), Image.LANCZOS)
    canvas = Image.new("RGB", (W, H), (12, 18, 30))
    canvas.paste(ph, (W - ph.width, 0))
    # fade the photo's left edge into the dark text panel
    x0 = W - ph.width
    ramp = 1 - np.clip((np.arange(W) - x0) / 260.0, 0, 1)
    grad = np.ascontiguousarray(np.repeat(ramp[None, :], H, 0))
    dark = Image.new("RGB", (W, H), (10, 14, 24))
    canvas = Image.composite(dark, canvas, Image.fromarray((grad * 235).astype(np.uint8)))
    words = [(c, w) for c, chunk in spec["text"] for w in chunk.upper().split(" ") if w]
    size = spec.get("max_size", 64)
    while True:
        font, lines, lh = layout(words, size)
        if TOP + lh * len(lines) <= BOTTOM or size <= 26:
            break
        size -= 1
    d = ImageDraw.Draw(canvas)
    y = TOP + (BOTTOM - TOP - lh * len(lines)) / 2 if spec.get("center") else TOP
    for ln in lines:
        for color, w, x in ln:
            d.text((22 + x, y), w, font=font, fill=COLORS[color], stroke_width=max(2, size // 14),
                   stroke_fill=(0, 0, 0))
        y += lh
    if spec.get("label"):
        lf = ImageFont.truetype(FONT, 52)
        tw = lf.getlength(spec["label"])
        d.rectangle([0, H - 84, tw + 60, H - 10], fill=(220, 20, 30))
        d.text((30, H - 78), spec["label"], font=lf, fill=(255, 255, 255))
    canvas.save(out, quality=92)
    print("font size", size, "lines", len(lines))


if __name__ == "__main__":
    main(*sys.argv[1:3])
