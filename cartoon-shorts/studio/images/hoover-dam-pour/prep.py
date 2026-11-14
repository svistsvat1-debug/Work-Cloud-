# prep.py - split pair sheets, trim, normalise the character colours, measure anchors
# -> public/hoover-dam-pour/*.png + src/hoover-dam-pour/sprites.ts   (run from images/hoover-dam-pour)
import json, os
import numpy as np, cv2
from PIL import Image

OUT = '../../public/hoover-dam-pour'
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

def head_fit(a, top=0.5):
    # least-squares circle through the head silhouette edge: outer contour points in the top part, angles away from the arms
    al = (a[..., 3] > 128).astype(np.uint8); h, w = al.shape
    ys, xs = np.where(al); y0 = ys.min()
    cnts, _ = cv2.findContours(al, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    c = max(cnts, key=cv2.contourArea)[:, 0, :].astype(float)
    # seed: widest row in the top 40 % of the silhouette
    H = ys.max() - y0
    best = None
    for y in range(y0, int(y0 + 0.4 * H)):
        r = np.where(al[y])[0]
        if len(r) and (best is None or r.max() - r.min() > best[1]): best = (y, r.max() - r.min(), (r.max() + r.min()) / 2)
    cy, wd, cx = best; R = wd / 2
    for _ in range(3):
        d = np.hypot(c[:, 0] - cx, c[:, 1] - cy)
        ang = np.degrees(np.arctan2(c[:, 1] - cy, c[:, 0] - cx))
        sel = (np.abs(d - R) < 0.18 * R) & ((ang < 40) | (ang > 140))  # upper half + sides, not the bottom (neck/arms)
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

def drop_specks(a, minarea=400, keep_near=None):
    al = (a[..., 3] > 10).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(al, connectivity=8)
    for i in range(1, n):
        if st[i][4] < minarea: a[lab == i, 3] = 0
    return a

info = {}
def save(name, a, guy=False, extra=None):
    if guy: a = normalise(a)
    a, off = trim(a)
    Image.fromarray(a, 'RGBA').save(f'{OUT}/{name}.png', optimize=True)
    d = dict(w=a.shape[1], h=a.shape[0], off=list(off), feet=feet(a))
    if guy: d['head'] = head_fit(a)
    if extra: d.update(extra(a))
    info[name] = d
    return a

save('hero', load('hero'), guy=True, extra=lambda a: dict(tip=[int(np.where(a[..., 3] > 128)[1].max()), int(np.median(np.where(a[..., 3] > 128)[0][np.where(a[..., 3] > 128)[1] >= np.where(a[..., 3] > 128)[1].max() - 3]))]))
shock, bored = split(load('guyA'), 2)
save('shock', shock, guy=True)
save('bored', bored, guy=True)
cheer, drink = split(load('guyB'), 2)
save('cheer', cheer, guy=True)
def can_extra(a):
    rgb = a[..., :3].astype(int); red = (rgb[..., 0] > 170) & (rgb[..., 1] < 90) & (rgb[..., 2] < 90) & (a[..., 3] > 128)
    ys, xs = np.where(red)
    return dict(can=[float(xs.mean()), float(ys.mean()), int(xs.max() - xs.min()), int(ys.max() - ys.min())])
save('drink', drink, guy=True, extra=can_extra)

def truck_extra(a):
    al = a[..., 3] > 128; h, w = al.shape; ys, xs = np.where(al)
    rgb = a[..., :3].astype(int)
    org = (rgb[..., 0] > 200) & (rgb[..., 1] > 100) & (rgb[..., 1] < 190) & (rgb[..., 2] < 90) & al
    oy, ox = np.where(org)
    # chute tip: the right-most opaque point
    xr = int(xs.max()); yr = int(np.median(ys[xs >= xr - 3]))
    # lowest point of the chute region (right 12 %)
    cm = al.copy(); cm[:, : int(w * 0.85)] = False; cy_, cx_ = np.where(cm)
    lowc = [int(np.median(cx_[cy_ >= cy_.max() - 3])), int(cy_.max())]
    return dict(drum=[int(ox.min()), int(oy.min()), int(ox.max()), int(oy.max())], tip=[xr, yr], chuteLow=lowc, wheel=int(ys.max()))
save('truck', load('truck'), extra=truck_extra)

def fridge_extra(a):
    al = a[..., 3] > 128; ys, xs = np.where(al)
    return dict(left=int(xs.min()), right=int(xs.max()), top=int(ys.min()), bottom=int(ys.max()))
save('fridge', load('fridge'), extra=fridge_extra)

# canyon walls: trim, extend left/right by repeating a column just inside the outer outline (horizontal strata continue)
w0, off = trim(load('walls'), pad=0)
al = w0[..., 3] > 128; h, w = al.shape
EXT = 700
def inner_col(side):
    # first column (from the outer edge) where the cliff is opaque over most rows, then step 16 px inwards past the outline
    cols = range(0, w) if side == 'L' else range(w - 1, -1, -1)
    for x in cols:
        if al[:, x].sum() > 0.6 * h: return x + 16 if side == 'L' else x - 16
L = inner_col('L'); R = inner_col('R')
core = w0[:, L:R + 1]
left = np.repeat(w0[:, L:L + 1], EXT, axis=1)
right = np.repeat(w0[:, R:R + 1], EXT, axis=1)
walls = np.concatenate([left, core, right], axis=1)
# also extend downward by repeating a row near the bottom (inside the outline) so the camera can never see under it
al2 = walls[..., 3] > 128; colc = al2[:, walls.shape[1] // 2]
yb = np.where(colc)[0].max()
# below the bottom: one flat rock colour (a repeated row would carry the floor band's vertical outline seams)
rock = np.median(walls[yb - 60, EXT // 2: EXT // 2 + 200, :3], axis=0).astype(np.uint8)
ext = np.zeros((400, walls.shape[1], 4), np.uint8); ext[..., :3] = rock; ext[..., 3] = 255
walls = np.concatenate([walls[: yb - 14], ext], axis=0)
PRE = 1.6  # pre-scaled with Lanczos so the browser only ever scales it down (shown up to ~1.7x native)
Image.fromarray(walls, 'RGBA').resize((int(walls.shape[1] * PRE), int(walls.shape[0] * PRE)), Image.LANCZOS).save(f'{OUT}/walls.png', optimize=True)
al = walls[..., 3] > 128; H, W = al.shape
# cliff tops: first opaque row at x = 25 % and 75 % of the core
xl = EXT + int(0.10 * core.shape[1]); xr = EXT + int(0.90 * core.shape[1])
topL = int(np.where(al[:, xl])[0].min()); topR = int(np.where(al[:, xr])[0].min())
# gap profile: for each row, the transparent run that contains the centre column of the gap
xc = EXT + core.shape[1] // 2
gapcol = np.where(~al[:, xc])[0]
floor = int(gapcol.max()) + 1  # first opaque row under the gap at the centre
prof = []
for y in range(max(topL, topR) + 6, floor, 10):
    row = al[y]
    xa = xc
    while xa > 0 and not row[xa - 1]: xa -= 1
    xb = xc
    while xb < W - 1 and not row[xb + 1]: xb += 1
    prof.append([y, int(xa), int(xb)])
info['walls'] = dict(w=W, h=H, pre=PRE, ext=EXT, core=[int(L), int(R)], topL=topL, topR=topR, floor=floor, xc=int(xc), prof=prof)

bg = Image.open('raw/bg.png').convert('RGB')
bg.save(f'{OUT}/bg.png', optimize=True)
info['bg'] = dict(w=bg.width, h=bg.height)
os.makedirs('../../src/hoover-dam-pour', exist_ok=True)
open('../../src/hoover-dam-pour/sprites.ts', 'w').write('// generated by images/hoover-dam-pour/prep.py\nexport const SPR = ' + json.dumps(info) + ' as const;\n')
for k, v in info.items(): print(k, {kk: vv for kk, vv in v.items() if kk != 'prof'})
print('prof', info['walls']['prof'][::8])
