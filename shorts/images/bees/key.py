"""key.py in.jpg out.png  -  flat background (connected to border, plus big enclosed pockets of the same colour)
-> transparent; the black outline edge is un-blended (alpha along the bg->black line)."""
import sys, numpy as np, cv2
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
im = np.asarray(Image.open(src).convert("RGB")).astype(np.float32)
h, w, _ = im.shape
bgc = np.median(np.concatenate([im[0], im[-1], im[:, 0], im[:, -1]]), 0)
dist = np.sqrt(((im - bgc) ** 2).sum(2))
near = (dist < 40).astype(np.uint8)
n, lab, stats, _ = cv2.connectedComponentsWithStats(near, 4)
border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])))
bg = np.zeros((h, w), bool)
for i in range(1, n):
    m = lab == i
    if i in border and near[m].all():
        bg |= m
    elif stats[i, cv2.CC_STAT_AREA] > 150 and dist[m].mean() < 12:   # enclosed pocket (e.g. between arm and body)
        bg |= m
band = cv2.dilate(bg.astype(np.uint8), np.ones((7, 7), np.uint8)).astype(bool) & ~bg
a_ink = np.clip(1 - (im @ bgc) / (bgc @ bgc), 0, 1)
resid = np.sqrt(((im - (1 - a_ink)[..., None] * bgc) ** 2).sum(2))
alpha = np.ones((h, w), np.float32); alpha[bg] = 0
rgb = im.copy()
inkish = band & (resid < 35)
alpha[inkish] = a_ink[inkish]; rgb[inkish] = 0
alpha[band & (dist < 40)] = np.minimum(alpha[band & (dist < 40)], 0)  # stray bg-coloured pixels in the band
out = np.dstack([rgb, alpha * 255]).clip(0, 255).astype(np.uint8)
Image.fromarray(out, "RGBA").save(dst)
