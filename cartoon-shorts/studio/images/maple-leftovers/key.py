# key.py IN.png OUT.png - flat key-colour background -> transparent cut-out (free, local)
import sys
import numpy as np
import cv2
from PIL import Image

src, dst = sys.argv[1], sys.argv[2]
im = np.asarray(Image.open(src).convert("RGB")).astype(np.float32)
h, w, _ = im.shape
border = np.concatenate([im[0], im[-1], im[:, 0], im[:, -1]])
key = np.median(border, 0)
dist = np.sqrt(((im - key) ** 2).sum(2))
near = (dist < 60).astype(np.uint8)
n, lab, stats, _ = cv2.connectedComponentsWithStats(near, connectivity=4)
bg = np.zeros((h, w), bool)
for i in range(1, n):
    x, y, ww, hh, area = stats[i]
    if x == 0 or y == 0 or x + ww == w or y + hh == h or area > 40:
        bg |= lab == i
ring = cv2.dilate(bg.astype(np.uint8), np.ones((7, 7), np.uint8)).astype(bool) & ~bg
ink = np.array([20.0, 20.0, 20.0])
alpha = np.ones((h, w), np.float32)
alpha[bg] = 0
alpha[ring] = np.clip(dist / np.sqrt(((ink - key) ** 2).sum()), 0, 1)[ring]
a = np.maximum(alpha[..., None], 1e-3)
rgb = np.where(ring[..., None], np.clip((im - (1 - a) * key) / a, 0, 255), im)
Image.fromarray(np.dstack([rgb, alpha * 255]).astype(np.uint8), "RGBA").save(dst)
