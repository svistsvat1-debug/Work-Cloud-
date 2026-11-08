# key.py raw_dir out_dir [names...] - flat background colour connected to the border -> transparent, un-blend the edge
import sys, os, glob, numpy as np, cv2
from PIL import Image
raw, out = sys.argv[1], sys.argv[2]
names = sys.argv[3:] or [os.path.splitext(os.path.basename(f))[0] for f in sorted(glob.glob(f"{raw}/*.jpg"))]
POCKETS = {"grass_row", "trees_strip", "scientist", "lamp_on", "lamp_off_alt", "moth_up", "moth_crashed_alt",
           "moth_extra_a", "moth_extra_b", "moth_extra_c"}   # enclosed bg holes (between legs, tripod, branches)
for n in names:
    im = np.asarray(Image.open(f"{raw}/{n}.jpg").convert("RGB")).astype(np.float32)
    h, w, _ = im.shape
    border = np.concatenate([im[0], im[-1], im[:, 0], im[:, -1]])
    bgc = np.median(border, 0)
    dist = np.sqrt(((im - bgc) ** 2).sum(2))
    near = (dist < 48).astype(np.uint8)
    nl, lab, stats, _ = cv2.connectedComponentsWithStats(near, connectivity=4)
    edge_labels = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(edge_labels))
    if n in POCKETS:   # enclosed pockets that are clearly background colour and not tiny
        for l in range(1, nl):
            if l in edge_labels or stats[l, cv2.CC_STAT_AREA] < 60: continue
            m = lab == l
            if dist[m].mean() < 16: bg |= m
    bg = cv2.morphologyEx(bg.astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8)).astype(bool)
    ink_d = np.linalg.norm(bgc - np.array([25, 25, 25]))
    band = cv2.dilate(bg.astype(np.uint8), np.ones((7, 7), np.uint8)).astype(bool) & ~bg
    a = np.ones((h, w), np.float32); a[bg] = 0
    a[band] = np.clip((dist[band] - 10) / (ink_d * 0.85 - 10), 0, 1)
    rgb = im.copy()
    ab = np.maximum(a[band], 1e-3)[:, None]
    rgb[band] = np.clip((im[band] - (1 - ab) * bgc) / ab, 0, 255)
    rgba = np.dstack([rgb, a * 255]).astype(np.uint8)
    ys, xs = np.where(a > 0.05)
    y0, y1, x0, x1 = max(ys.min() - 12, 0), min(ys.max() + 13, h), max(xs.min() - 12, 0), min(xs.max() + 13, w)
    Image.fromarray(rgba[y0:y1, x0:x1]).save(f"{out}/{n}.png")
    print(f"{n:18s} bg={bgc.astype(int)} crop=({x0},{y0})-({x1},{y1}) size={x1-x0}x{y1-y0}")
