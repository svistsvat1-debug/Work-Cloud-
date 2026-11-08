"""key.py IN.png OUT.png - flat background colour -> transparent (for pictures made without real transparency,
e.g. Google Flow on a flat light-blue #9BCFFD background). Usable as a module: key(img_rgba) -> img_rgba.

- background colour = median of the border pixels
- everything near that colour and connected to the border -> transparent
- enclosed pockets of background colour (gap between arm and body) -> transparent too (stricter threshold, min area)
- 3 px band around the background: alpha from colour distance, colour = ink (un-blends the black outline)
"""
import sys
import cv2
import numpy as np

NEAR = 60.0      # colour distance that still counts as background (border-connected)
POCKET = 34.0    # stricter distance for enclosed pockets
POCKET_MIN = 0.0004  # pocket area as a fraction of the image


def key(rgba: np.ndarray) -> np.ndarray:
    im = rgba[..., :3].astype(np.float32)
    h, w = im.shape[:2]
    border = np.concatenate([im[0], im[-1], im[:, 0], im[:, -1]])
    bgc = np.median(border, 0)
    dist = np.sqrt(((im - bgc) ** 2).sum(2))
    near = (dist < NEAR).astype(np.uint8)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(near, 4)
    edge_labels = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(edge_labels)) & (near > 0)
    strict = (dist < POCKET).astype(np.uint8)
    n2, lab2, stats2, _ = cv2.connectedComponentsWithStats(strict, 4)
    for i in range(1, n2):
        if stats2[i, cv2.CC_STAT_AREA] >= POCKET_MIN * h * w:
            bg |= lab2 == i
    bg8 = bg.astype(np.uint8)
    band = cv2.dilate(bg8, np.ones((7, 7), np.uint8)) - bg8           # 3 px band outside the background
    inside = (1 - bg8).astype(bool)
    # ink colour: darkest pixels near the edge (the outline)
    ink_mask = band.astype(bool) & (im.sum(2) < 200)
    ink = np.median(im[ink_mask], 0) if ink_mask.sum() > 50 else np.array([20, 20, 20], np.float32)
    dink = max(np.sqrt(((ink - bgc) ** 2).sum()), 1.0)
    alpha = np.ones((h, w), np.float32)
    alpha[bg] = 0
    b = band.astype(bool)
    a_band = np.clip(dist[b] / dink, 0, 1)
    alpha[b] = a_band
    out = np.dstack([im, alpha * 255]).astype(np.float32)
    # un-blend: on the band the visible colour is ink with partial alpha
    out[b, :3] = ink
    # keep original alpha if the picture already had some
    if rgba.shape[2] == 4:
        out[..., 3] = np.minimum(out[..., 3], rgba[..., 3])
    del inside
    return np.clip(out, 0, 255).astype(np.uint8)


def has_transparency(rgba: np.ndarray) -> bool:
    return rgba.shape[2] == 4 and (rgba[..., 3] < 250).mean() > 0.02


if __name__ == "__main__":
    src = cv2.imread(sys.argv[1], cv2.IMREAD_UNCHANGED)
    if src.ndim == 2:
        src = cv2.cvtColor(src, cv2.COLOR_GRAY2BGRA)
    if src.shape[2] == 3:
        src = cv2.cvtColor(src, cv2.COLOR_BGR2BGRA)
    rgba = cv2.cvtColor(src, cv2.COLOR_BGRA2RGBA)
    out = rgba if has_transparency(rgba) else key(rgba)
    cv2.imwrite(sys.argv[2], cv2.cvtColor(out, cv2.COLOR_RGBA2BGRA))
