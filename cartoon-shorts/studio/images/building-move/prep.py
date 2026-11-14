# prep.py - split pair sheets, trim, normalise the character colours, measure anchors
# -> public/building-move/*.png + src/building-move/sprites.ts   (run from images/building-move)
import json, os
import numpy as np, cv2
from PIL import Image

OUT = '../../public/building-move'
os.makedirs(OUT, exist_ok=True)
PAL = np.array([[254, 253, 253], [237, 235, 235], [252, 141, 144]], float)  # channel palette (memory/STYLE.md)

def load(n): return np.asarray(Image.open(f'keyed/{n}.png').convert('RGBA')).copy()

def trim(a, pad=12):
    ys, xs = np.where(a[..., 3] > 10)
    y0, y1, x0, x1 = max(ys.min() - pad, 0), min(ys.max() + pad + 1, a.shape[0]), max(xs.min() - pad, 0), min(xs.max() + pad + 1, a.shape[1])
    return a[y0:y1, x0:x1].copy(), (int(x0), int(y0))

def normalise(a):
    rgb = a[..., :3].astype(float); op = a[..., 3] == 255
    D = np.stack([np.sqrt(((rgb - c) ** 2).sum(2)) for c in PAL])
    k = D.argmin(0); dm = D.min(0)
    for i, c in enumerate(PAL):
        m = op & (dm < 40) & (k == i); rgb[m] = c
    d = np.sqrt((rgb ** 2).sum(2)); rgb[op & (d < 25)] = 0
    a[..., :3] = rgb.astype(np.uint8); return a

def feet(a):
    al = a[..., 3]; ys, xs = np.where(al > 128); yb = ys.max(); band = ys > yb - 0.035 * (yb - ys.min())
    return [float((xs[band].min() + xs[band].max()) / 2), int(yb)]

def head_fit(a):
    al = (a[..., 3] > 128).astype(np.uint8)
    ys, xs = np.where(al); y0 = ys.min()
    cnts, _ = cv2.findContours(al, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    c = max(cnts, key=cv2.contourArea)[:, 0, :].astype(float)
    H = ys.max() - y0
    best = None
    for y in range(y0, int(y0 + 0.4 * H)):
        r = np.where(al[y])[0]
        if len(r) and (best is None or r.max() - r.min() > best[1]): best = (y, r.max() - r.min(), (r.max() + r.min()) / 2)
    cy, wd, cx = best; R = wd / 2
    for _ in range(3):
        d = np.hypot(c[:, 0] - cx, c[:, 1] - cy)
        ang = np.degrees(np.arctan2(c[:, 1] - cy, c[:, 0] - cx))
        sel = (np.abs(d - R) < 0.18 * R) & ((ang < 40) | (ang > 140))
        P = c[sel]
        if len(P) < 20: break
        A = np.c_[2 * P[:, 0], 2 * P[:, 1], np.ones(len(P))]; b = (P ** 2).sum(1)
        sx, sy, s0 = np.linalg.lstsq(A, b, rcond=None)[0]
        cx, cy, R = sx, sy, np.sqrt(s0 + sx * sx + sy * sy)
    return [float(cx), float(cy), float(R)]

def split(a, k):
    col = (a[..., 3] > 10).any(0); xs = np.where(col)[0]
    runs = []; s = xs[0]
    for i in range(1, len(xs)):
        if xs[i] > xs[i - 1] + 1: runs.append((s, xs[i - 1])); s = xs[i]
    runs.append((s, xs[-1])); runs = sorted(runs, key=lambda r: r[1] - r[0], reverse=True)[:k]; runs.sort()
    out = []
    for x0, x1 in runs:
        sub = a.copy(); sub[:, :max(x0 - 4, 0)] = 0; sub[:, x1 + 5:] = 0; out.append(sub)
    return out

info = {}
def save(name, a, guy=False, extra=None, pad=12):
    if guy: a = normalise(a)
    a, off = trim(a, pad)
    Image.fromarray(a, 'RGBA').save(f'{OUT}/{name}.png', optimize=True)
    d = dict(w=a.shape[1], h=a.shape[0], off=list(off), feet=feet(a))
    if guy: d['head'] = head_fit(a)
    if extra: d.update(extra(a))
    info[name] = d
    return a

def tip_extra(a):  # right-most point (pointing finger / pushing palms)
    al = a[..., 3] > 128; ys, xs = np.where(al); xr = xs.max()
    return dict(tip=[int(xr), int(np.median(ys[xs >= xr - 3]))])
save('hero', load('hero'), guy=True, extra=tip_extra)
shock, idea = split(load('guyA'), 2)
save('shock', shock, guy=True)
save('idea', idea, guy=True, extra=lambda a: dict(top=[int(np.where(a[..., 3] > 128)[1][np.where(a[..., 3] > 128)[0] <= np.where(a[..., 3] > 128)[0].min() + 3].mean()), int(np.where(a[..., 3] > 128)[0].min())]))
push, cheer = split(load('guyB'), 2)
save('push', push, guy=True, extra=tip_extra)
save('cheer', cheer, guy=True)

def op_extra(a):
    al = a[..., 3] > 128; rgb = a[..., :3].astype(int)
    h = head_fit(a)
    # eyes: dark blobs inside the head disc, above its centre + a bit
    dark = (rgb.sum(2) < 120) & al
    n, lab, st, cen = cv2.connectedComponentsWithStats(dark.astype(np.uint8), connectivity=8)
    eyes = []
    for i in range(1, n):
        x, y, w, hh, ar = st[i]
        cx, cy = cen[i]
        if 150 < ar < 6000 and hh > w * 1.1 and np.hypot(cx - h[0], cy - h[1]) < 0.75 * h[2] and cy < h[1] + 0.3 * h[2]:
            eyes.append([float(cx), float(cy), int(w), int(hh)])
    eyes.sort()
    # coffee: dark-brown pixels (the coffee surface)
    br = (rgb[..., 0] > 60) & (rgb[..., 0] < 140) & (rgb[..., 1] < 90) & (rgb[..., 2] < 70) & (rgb[..., 0] > rgb[..., 2] + 20) & al
    ys, xs = np.where(br)
    cup = [float(xs.mean()), float(ys.mean()), int(xs.min()), int(xs.max()), int(ys.min())] if len(xs) else None
    return dict(head=h, eyes=eyes, cup=cup, bottom=int(np.where(al)[0].max()))
save('operator', normalise(load('operator')), extra=op_extra)

# building: front + side, windows = pale-yellow components
front, side = split(load('building'), 2)
def bld_extra(a):
    al = a[..., 3] > 128; rgb = a[..., :3].astype(int)
    ys, xs = np.where(al)
    yel = (rgb[..., 0] > 215) & (rgb[..., 1] > 195) & (rgb[..., 2] > 110) & (rgb[..., 2] < 200) & al
    n, lab, st, cen = cv2.connectedComponentsWithStats(yel.astype(np.uint8), connectivity=4)
    pan = []
    for i in range(1, n):
        x, y, w, hh, ar = st[i]
        if ar > 60: pan.append([int(x), int(y), int(w), int(hh)])
    # group panes into windows: merge boxes that are close (window = 4 panes)
    boxes = []
    used = [False] * len(pan)
    for i, p in enumerate(pan):
        if used[i]: continue
        x0, y0, x1, y1 = p[0], p[1], p[0] + p[2], p[1] + p[3]; used[i] = True
        changed = True
        while changed:
            changed = False
            for j, q in enumerate(pan):
                if used[j]: continue
                if q[0] < x1 + 9 and q[0] + q[2] > x0 - 9 and q[1] < y1 + 9 and q[1] + q[3] > y0 - 9:
                    x0, y0, x1, y1 = min(x0, q[0]), min(y0, q[1]), max(x1, q[0] + q[2]), max(y1, q[1] + q[3]); used[j] = True; changed = True
        boxes.append([x0, y0, x1 - x0, y1 - y0])
    boxes = [b for b in boxes if b[2] > 12 and b[3] > 20]
    boxes.sort(key=lambda b: (round(b[1] / 30), b[0]))
    return dict(left=int(xs.min()), right=int(xs.max()), top=int(ys.min()), bottom=int(ys.max()), win=boxes)
save('front', front, extra=bld_extra)
save('side', side, extra=bld_extra)

# crane: remove the drawn cable + hook (code draws the cable + ball), measure the boom tip
cr = load('crane')
al = cr[..., 3] > 128; ys, xs = np.where(al)
ty = ys.min(); tx = int(np.median(xs[ys <= ty + 4]))
m = np.zeros_like(al); m[ty + 40:, : tx + 11] = True
cr[m, 3] = 0
# keep only the largest component (drop cable leftovers)
n, lab, st, _ = cv2.connectedComponentsWithStats((cr[..., 3] > 10).astype(np.uint8), connectivity=8)
big = 1 + np.argmax(st[1:, 4]); cr[lab != big, 3] = 0
# tip: the boom's top end ring centre (top 40 px of the sprite)
al = cr[..., 3] > 128; ys, xs = np.where(al); band = ys <= ys.min() + 30
save('crane', cr, extra=lambda a: dict(tip=[float(np.where(a[..., 3] > 128)[1][np.where(a[..., 3] > 128)[0] <= np.where(a[..., 3] > 128)[0].min() + 30].mean()), float(np.where(a[..., 3] > 128)[0].min() + 15)]))

phone, ball = split(load('props'), 2)
save('phone', phone)
def ball_extra(a):
    al = (a[..., 3] > 128).astype(np.uint8)
    dt = cv2.distanceTransform(al, cv2.DIST_L2, 5); cy, cx = np.unravel_index(dt.argmax(), dt.shape)
    ys, xs = np.where(al)
    return dict(c=[int(cx), int(cy)], r=float(dt.max()), top=[int(np.median(xs[ys <= ys.min() + 4])), int(ys.min())])
save('ball', ball, extra=ball_extra)

bg = Image.open('raw/bg.png').convert('RGB')
bg.save(f'{OUT}/bg.png', optimize=True)
info['bg'] = dict(w=bg.width, h=bg.height)
os.makedirs('../../src/building-move', exist_ok=True)
open('../../src/building-move/sprites.ts', 'w').write('// generated by images/building-move/prep.py\nexport const SPR = ' + json.dumps(info) + ' as const;\n')
for k, v in info.items(): print(k, {kk: (vv if kk != 'win' else (len(vv), vv[:3])) for kk, vv in v.items()})
