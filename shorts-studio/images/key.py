"""key.py in.png out.png  -  flat background colour -> transparent.

Pictures are generated on a plain light-blue background (#9BCFFD). Every pixel close to the border colour is
removed when it belongs to a big enough connected area (border-connected or enclosed, e.g. between an arm and the
body). A thin band next to the removed area gets a soft alpha and is un-blended from the background colour.
"""
import sys
import numpy as np
import cv2
from PIL import Image


def key(src: str, dst: str, thr: float = 60.0, min_area: int = 250) -> None:
    im = np.asarray(Image.open(src).convert("RGB")).astype(np.float32)
    h, w, _ = im.shape
    border = np.concatenate([im[0], im[-1], im[:, 0], im[:, -1]])
    bgc = np.median(border, 0)
    dist = np.sqrt(((im - bgc) ** 2).sum(2))
    near = (dist < thr).astype(np.uint8)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(near, connectivity=4)
    bg = np.zeros((h, w), bool)
    for i in range(1, n):
        x, y, bw, bh, area = stats[i]
        touches = x == 0 or y == 0 or x + bw == w or y + bh == h
        if touches or area >= min_area:
            bg |= lab == i
    # soft edge: pixels within 2 px of the background, alpha from colour distance
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    band = cv2.dilate(bg.astype(np.uint8), k).astype(bool) & ~bg
    alpha = np.ones((h, w), np.float32)
    alpha[bg] = 0
    a_band = np.clip((dist - thr * 0.35) / (thr * 1.6), 0, 1)
    alpha[band] = np.maximum(a_band[band], 0.0)
    # un-blend: C = a*F + (1-a)*B  ->  F = (C - (1-a)*B) / a
    out = im.copy()
    a3 = np.clip(alpha, 0.08, 1)[..., None]
    unb = (im - (1 - a3) * bgc) / a3
    out[band] = np.clip(unb[band], 0, 255)
    rgba = np.dstack([out, alpha * 255]).astype(np.uint8)
    Image.fromarray(rgba, "RGBA").save(dst)
    print(f"{dst}: bg={bgc.astype(int).tolist()} removed={bg.mean():.1%}")


if __name__ == "__main__":
    key(sys.argv[1], sys.argv[2])
