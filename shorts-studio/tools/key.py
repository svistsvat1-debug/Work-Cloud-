"""Chroma-key a Flow picture on flat green (or magenta, for green subjects like leaves)
-> transparent PNG trimmed to its alpha box (+12 px).

usage: python3 -I tools/key.py in.png out.png
Background = every pixel close to the flat border colour, including green gaps enclosed by the
subject (between legs / tail) - safe because the prompts forbid green on the subjects.
Edge band: alpha from colour distance, colour un-blended towards the ink, green spill removed.
"""
import sys
import numpy as np
import cv2
from PIL import Image

src, dst = sys.argv[1], sys.argv[2]
im = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
h, w, _ = im.shape

border = np.concatenate([im[0], im[-1], im[:, 0], im[:, -1]])
bgc = np.median(border, 0)
dist = np.sqrt(((im - bgc) ** 2).sum(2))
is_magenta = min(bgc[0], bgc[2]) > bgc[1] + 60
if is_magenta:   # how strongly a pixel leans to the background hue
    dom = np.minimum(im[..., 0], im[..., 2]) - im[..., 1]
else:
    dom = im[..., 1] - np.maximum(im[..., 0], im[..., 2])
near = (dist < 90) | (dom > 60)

# background = all near-bg pixels (thin slivers too), minus isolated specks under 6 px
n, lab, stats, _ = cv2.connectedComponentsWithStats(near.astype(np.uint8), connectivity=8)
keep = np.zeros(n, bool); keep[1:] = stats[1:, cv2.CC_STAT_AREA] >= 6
bg = keep[lab]

alpha = np.where(bg, 0.0, 1.0)
# soft edge: a 3 px band of the subject next to the background
band = cv2.dilate(bg.astype(np.uint8), np.ones((7, 7), np.uint8)).astype(bool) & ~bg
ink_d = np.percentile(dist[~bg & ~band], 5) if (~bg & ~band).any() else 255
ink_d = max(ink_d, 120.0)
alpha[band] = np.clip(dist[band] / ink_d, 0, 1)

out = im.copy()
# un-blend edge colours: c = a*fg + (1-a)*bg  ->  fg = (c - (1-a)*bg) / a
a3 = alpha[..., None]
fg = (im - (1 - a3) * bgc) / np.maximum(a3, 1e-3)
out = np.where(band[..., None], np.clip(fg, 0, 255), out)
# spill on edge pixels: green bg -> G <= max(R, B); magenta bg -> min(R, B) <= G
if is_magenta:
    ex = np.clip(np.minimum(out[..., 0], out[..., 2]) - out[..., 1], 0, None) * band
    out[..., 0] -= ex
    out[..., 2] -= ex
else:
    spill = band & (out[..., 1] > np.maximum(out[..., 0], out[..., 2]))
    out[..., 1] = np.where(spill, np.maximum(out[..., 0], out[..., 2]), out[..., 1])
alpha[alpha < 0.04] = 0

rgba = np.dstack([out, alpha * 255]).astype(np.uint8)
ys, xs = np.nonzero(alpha > 0.5)
pad = 12
y0, y1 = max(ys.min() - pad, 0), min(ys.max() + pad + 1, h)
x0, x1 = max(xs.min() - pad, 0), min(xs.max() + pad + 1, w)
Image.fromarray(rgba[y0:y1, x0:x1]).save(dst)
print(f'{dst}: {x1 - x0}x{y1 - y0} trim_offset=({x0},{y0}) source={w}x{h} bg={bgc.round().tolist()}')
