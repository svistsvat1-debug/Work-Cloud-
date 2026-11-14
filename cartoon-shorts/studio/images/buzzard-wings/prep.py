# prep.py - split sheets, trim, normalise character colours, measure anchors
# -> public/buzzard-wings/*.png + src/buzzard-wings/sprites.ts   (run from images/buzzard-wings)
import json, os
import numpy as np, cv2
from PIL import Image

OUT = '../../public/buzzard-wings'
os.makedirs(OUT, exist_ok=True)
PAL = np.array([[254, 253, 253], [237, 235, 235], [252, 141, 144]], float)  # memory/STYLE.md

def load(n): return np.asarray(Image.open(f'keyed/{n}.png').convert('RGBA')).copy()

def trim(a, pad=12):
    ys, xs = np.where(a[..., 3] > 10)
    y0, y1, x0, x1 = max(ys.min() - pad, 0), min(ys.max() + pad + 1, a.shape[0]), max(xs.min() - pad, 0), min(xs.max() + pad + 1, a.shape[1])
    return a[y0:y1, x0:x1].copy(), (int(x0), int(y0))

def normalise(a):  # nearest palette colour wins (STYLE lesson)
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

def head_disc(a):
    h, w = a.shape[:2]
    a8 = (a[..., 3] > 128).astype(np.uint8); ff = a8.copy()
    cv2.floodFill(ff, np.zeros((h + 2, w + 2), np.uint8), (0, 0), 2)
    solid = np.where(ff == 2, 0, 1).astype(np.uint8)
    dt = cv2.distanceTransform(solid, cv2.DIST_L2, 5)
    hy, hx = np.unravel_index(dt.argmax(), dt.shape)
    return [float(hx), float(hy), float(dt[hy, hx])]

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

def box(a):
    ys, xs = np.where(a[..., 3] > 128)
    return dict(left=int(xs.min()), right=int(xs.max()), top=int(ys.min()), bottom=int(ys.max()))

def extremes(a):
    al = a[..., 3] > 128; ys, xs = np.where(al)
    l = xs.min(); r = xs.max()
    return dict(tipL=[int(l), float(np.median(ys[xs <= l + 3]))], tipR=[int(r), float(np.median(ys[xs >= r - 3]))])

info = {}
def save(name, a, guy=False, extra=None, pad=12):
    if guy: a = normalise(a)
    a, off = trim(a, pad)
    ex = extra(a) if extra else {}
    Image.fromarray(a, 'RGBA').save(f'{OUT}/{name}.png', optimize=True)
    d = dict(w=a.shape[1], h=a.shape[0], off=list(off), feet=feet(a), **box(a), **ex)
    if guy: d['head'] = head_disc(a)
    info[name] = d
    return a

# --- the guy ---
save('hero', load('hero_lookup'), guy=True)
def fists(a):  # the two raised fists = topmost blobs; grip point = their mean top-centre
    al = (a[..., 3] > 128).astype(np.uint8); ys, xs = np.where(al)
    top = ys.min(); band = al.copy(); band[top + 70:] = 0
    n, lab, st, cen = cv2.connectedComponentsWithStats(band)
    c = [cen[i] for i in range(1, n) if st[i][4] > 200]
    return dict(grip=[float(np.mean([p[0] for p in c])), float(top + 30)], fistsX=[float(p[0]) for p in c])
worry, strain = split(load('guy_hang_pair'), 2)
save('hang', worry, guy=True, extra=fists)
save('strain', strain, guy=True, extra=fists)
crash, pull = split(load('guy_crash_pull'), 2)
save('crash', crash, guy=True)
def hands(a):  # fists of the pull pose = rightmost opaque point region
    al = a[..., 3] > 128; ys, xs = np.where(al); r = xs.max()
    sel = xs >= r - 40
    return dict(hand=[float(xs[sel].mean()), float(ys[sel].mean())])
save('pull', pull, guy=True, extra=hands)

# --- buzzard pair: align the twisted copy onto the flat one by the body (centre band) ---
flat, twist = split(load('buzzard_pair'), 2)
def bird_extra(a):
    al = a[..., 3] > 128; h, w = al.shape; ys, xs = np.where(al)
    cx = (xs.min() + xs.max()) / 2
    # body centre = column band around the middle with the tallest opaque run
    cols = [(x, np.where(al[:, x])[0]) for x in range(int(cx) - 60, int(cx) + 61)]
    body = [c for c in cols if len(c[1])]
    bx = float(np.mean([c[0] for c in body])); btop = int(min(c[1].min() for c in body)); bbot = int(max(c[1].max() for c in body))
    # eyes: white blobs in the head region
    rgb = a[..., :3].astype(int)
    wh = al & (rgb.min(2) > 225)
    wh[:btop] = False; wh[btop + 120:] = False; wh[:, :int(bx) - 90] = False; wh[:, int(bx) + 90:] = False
    n, lab, st, cen = cv2.connectedComponentsWithStats(wh.astype(np.uint8))
    eyes = sorted([[float(cen[i][0]), float(cen[i][1]), int(max(st[i][2], st[i][3]))] for i in range(1, n) if st[i][4] > 30], key=lambda e: e[0])
    return dict(body=[bx, btop, bbot], eyes=eyes, **extremes(a))
save('birdFlat', flat, extra=bird_extra)
save('birdTwist', twist, extra=bird_extra)

# --- props ---
glider, plane = split(load('props'), 2)
def glider_extra(a):
    al = a[..., 3] > 128; ys, xs = np.where(al)
    rgb = a[..., :3].astype(int)
    # bar frame bottom = lowest opaque row near the centre
    cx = (xs.min() + xs.max()) / 2
    mid = al[:, int(cx) - 40:int(cx) + 41].any(1); yb = np.where(mid)[0].max()
    return dict(cx=float(cx), barY=int(yb), **extremes(a))
save('glider', glider, extra=glider_extra)
def plane_extra(a):
    ex = extremes(a)
    al = a[..., 3] > 128; ys, xs = np.where(al)
    return dict(cx=float((xs.min() + xs.max()) / 2), **ex)
save('plane', plane, extra=plane_extra)
def wright_extra(a):
    al = a[..., 3] > 128; h, w = al.shape; ys, xs = np.where(al)
    rows = al.sum(1); wingRows = np.where(rows > 0.8 * w)[0]
    # split the wing rows into the upper and lower wing
    gaps = np.where(np.diff(wingRows) > 5)[0]
    up = wingRows[:gaps[0] + 1] if len(gaps) else wingRows; lo = wingRows[gaps[0] + 1:] if len(gaps) else wingRows
    return dict(upper=[int(up.min()), int(up.max())], lower=[int(lo.min()), int(lo.max())], **extremes(a))
save('wright', load('wright_glider'), extra=wright_extra)

# --- background plate (not keyed) ---
bg = np.asarray(Image.open('raw/bg.png').convert('RGB')).astype(int)
Image.fromarray(bg.astype(np.uint8)).save(f'{OUT}/bg.png', optimize=True)
h, w, _ = bg.shape
sky = [int(c) for c in np.median(bg[5:300, :].reshape(-1, 3), 0)]
sand = [int(c) for c in np.median(bg[h - 200:h - 5, :].reshape(-1, 3), 0)]
seaTop = next(y for y in range(300, h) if bg[y, w // 2][2] < 235 and bg[y, w // 2][0] < 80)
info['bg'] = dict(w=w, h=h, sky=sky, sand=sand, seaTop=seaTop,
                  edgeL=[[int(c) for c in bg[y, 2]] for y in range(0, h, 8)], edgeR=[[int(c) for c in bg[y, w - 3]] for y in range(0, h, 8)])
os.makedirs('../../src/buzzard-wings', exist_ok=True)
open('../../src/buzzard-wings/sprites.ts', 'w').write('// generated by images/buzzard-wings/prep.py\nexport const SPR = ' + json.dumps(info) + ' as const;\n')
for k, v in info.items(): print(k, {kk: vv for kk, vv in v.items() if kk not in ('edgeL', 'edgeR')})
