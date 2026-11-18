# prep.py - split pose sheets, trim, normalise colours, measure anchors, make the code "tan" versions
# -> public/shark-storm/*.png + src/sun-vanish/sprites.ts   (run from images/sun-vanish)
import json, os
import numpy as np, cv2
from PIL import Image

OUT = OUT if 'OUT' in dir() else '../../public/sunken-lunch'
os.makedirs(OUT, exist_ok=True)
# channel palette (memory/STYLE.md) + pink tongue; the sunglasses are black (outline colour)
PAL = np.array([[254, 253, 253], [237, 235, 235], [252, 141, 144]], float)
TAN = np.array([233, 176, 122], float)        # tanned fill  (#E9B07A)
TAN_SH = np.array([214, 150, 96], float)      # tanned shade (#D69660)

def load(n): return np.asarray(Image.open(f'keyed/{n}.png').convert('RGBA')).copy()

def despill(a):  # greenish leftovers of the key -> transparent (nothing in these sprites is green)
    r, g, b = [a[..., i].astype(int) for i in range(3)]
    a[(g > r + 25) & (g > b + 25), 3] = 0
    return a

def trim(a, pad=12):
    ys, xs = np.where(a[..., 3] > 10)
    y0, y1, x0, x1 = max(ys.min() - pad, 0), min(ys.max() + pad + 1, a.shape[0]), max(xs.min() - pad, 0), min(xs.max() + pad + 1, a.shape[1])
    return a[y0:y1, x0:x1].copy(), (int(x0), int(y0))

def normalise(a):
    rgb = a[..., :3].astype(float); op = a[..., 3] == 255
    D = np.stack([np.sqrt(((rgb - c) ** 2).sum(2)) for c in PAL]); k = D.argmin(0); dm = D.min(0)
    for i, c in enumerate(PAL):
        m = op & (dm < 40) & (k == i); rgb[m] = c
    d = np.sqrt((rgb ** 2).sum(2)); rgb[op & (d < 25)] = 0
    a[..., :3] = rgb.astype(np.uint8); return a

def feet(a):
    al = a[..., 3]; ys, xs = np.where(al > 128); yb = ys.max(); band = ys > yb - 0.035 * (yb - ys.min())
    return [float((xs[band].min() + xs[band].max()) / 2), int(yb)]

def head_disc(a):
    h, w = a.shape[:2]
    a8 = np.pad((a[..., 3] > 128).astype(np.uint8), 2); ff = a8.copy()
    cv2.floodFill(ff, np.zeros((h + 6, w + 6), np.uint8), (0, 0), 2)
    solid = np.where(ff == 2, 0, 1).astype(np.uint8)[2:-2, 2:-2]
    dt = cv2.distanceTransform(solid, cv2.DIST_L2, 5)
    hy, hx = np.unravel_index(dt.argmax(), dt.shape)
    return [float(hx), float(hy), float(dt[hy, hx])]

def box(a):
    ys, xs = np.where(a[..., 3] > 128)
    return dict(left=int(xs.min()), right=int(xs.max()), top=int(ys.min()), bottom=int(ys.max()))

def split_n(a, n, axis='x'):
    """split a sheet into its n biggest blobs (left to right, or top to bottom); drop small loose bits (motion marks)"""
    m = (a[..., 3] > 10).astype(np.uint8)
    m2 = cv2.dilate(m, np.ones((9, 9), np.uint8))
    cnt, lab, stats, _ = cv2.connectedComponentsWithStats(m2, connectivity=8)
    idx = sorted(range(1, cnt), key=lambda i: stats[i, cv2.CC_STAT_AREA], reverse=True)[:n]
    idx.sort(key=lambda i: stats[i, cv2.CC_STAT_LEFT if axis == 'x' else cv2.CC_STAT_TOP])
    out = []
    for i in idx:
        sub = a.copy(); sub[lab != i, 3] = 0; out.append(sub)
    small = [int(stats[i, cv2.CC_STAT_AREA]) for i in range(1, cnt) if i not in idx]
    if small: print('   dropped loose bits', small)
    return out

def drop_specks(a, min_area=60):
    m = (a[..., 3] > 10).astype(np.uint8)
    cnt, lab, stats, _ = cv2.connectedComponentsWithStats(m, connectivity=8)
    for i in range(1, cnt):
        if stats[i, cv2.CC_STAT_AREA] < min_area: a[lab == i, 3] = 0
    return a

def fix_outline(a, out_px=4, in_px=2):
    """paint the black outline back where a LOW picture left white fill touching the silhouette edge"""
    m = (a[..., 3] > 128).astype(np.uint8)
    er = cv2.erode(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
    inner = (m > 0) & (er == 0)
    light = inner & (a[..., :3].astype(int).sum(2) > 400)
    lab_n, lab = cv2.connectedComponents(light.astype(np.uint8))
    keep = np.zeros_like(light)
    for i in range(1, lab_n):
        if (lab == i).sum() >= 12: keep |= lab == i
    if not keep.any(): return a, 0
    k_out = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * out_px + 1, 2 * out_px + 1))
    near = cv2.dilate(keep.astype(np.uint8), k_out) > 0
    m_in = cv2.erode(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * in_px + 1, 2 * in_px + 1))) > 0
    band = near & ~m_in & (cv2.dilate(m, k_out) > 0)
    a[band, :3] = 0; a[band, 3] = 255
    return a, int(keep.sum())

def find_eyes(a, head):
    """solid black vertical ovals inside the head disc (below the forehead): returns [[cx, cy, rx, ry], ...]"""
    hx, hy, R = head
    dark = (a[..., :3].astype(int).sum(2) < 120) & (a[..., 3] > 200)
    n, lab, st, cen = cv2.connectedComponentsWithStats(dark.astype(np.uint8), connectivity=8)
    eyes = []
    for i in range(1, n):
        x, y, w, h, area = st[i]
        cx, cy = cen[i]
        if np.hypot(cx - hx, cy - hy) > 0.7 * R or cy < hy - 0.35 * R: continue
        if not (0.02 * R * R < area < 0.12 * R * R): continue
        if h < 0.7 * w or area < 0.5 * w * h: continue        # solid blobs (open or half-lidded), not brows / mouth
        eyes.append([float(cx), float(cy), float(w / 2), float(h / 2)])
    eyes.sort(key=lambda e: e[0])
    return eyes

def tan_version(a, head, rings=None):
    """recolour the white/grey fill to a tan (outline, glasses, tongue, teeth, eye glints stay); optional pale rings"""
    t = a.copy(); rgb = t[..., :3].astype(int); op = t[..., 3] > 200
    fill = op & (np.abs(rgb - PAL[0]).sum(2) < 12)
    shade = op & (np.abs(rgb - PAL[1]).sum(2) < 12)
    # keep small white islands inside the head (teeth, glints)
    hx, hy, R = head
    lit = (fill | shade).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(lit, connectivity=4)
    yy, xx = np.mgrid[0:a.shape[0], 0:a.shape[1]]
    for i in range(1, n):
        x, y, w, h, area = st[i]
        cx, cy = x + w / 2, y + h / 2
        if area < 0.08 * R * R and np.hypot(cx - hx, cy - hy) < 0.95 * R:
            fill[lab == i] = False; shade[lab == i] = False
    keep = np.zeros(a.shape[:2], bool)
    if rings:
        for (ex, ey, rx, ry) in rings:
            keep |= ((xx - ex) / (0.34 * R)) ** 2 + ((yy - ey) / (0.30 * R)) ** 2 <= 1
    t[fill & ~keep, :3] = TAN.astype(np.uint8)
    t[shade & ~keep, :3] = TAN_SH.astype(np.uint8)
    return t

