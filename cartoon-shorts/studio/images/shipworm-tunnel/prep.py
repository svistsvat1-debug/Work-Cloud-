# prep.py - split sheets, trim, normalise character colours, measure anchors
# -> public/shipworm-tunnel/*.png + src/shipworm-tunnel/sprites.ts   (run from images/shipworm-tunnel)
import json, os
import numpy as np, cv2
from PIL import Image

OUT = '../../public/shipworm-tunnel'
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

info = {}
def save(name, a, guy=False, extra=None, pad=12):
    if guy: a = normalise(a)
    a, off = trim(a, pad)
    if extra: ex = extra(a)
    Image.fromarray(a, 'RGBA').save(f'{OUT}/{name}.png', optimize=True)
    d = dict(w=a.shape[1], h=a.shape[0], off=list(off), feet=feet(a), **box(a))
    if guy: d['head'] = head_disc(a)
    if extra: d.update(ex)
    info[name] = d
    return a

save('hero', load('hero'), guy=True)
panic, plank = split(load('guyA'), 2)
save('panic', panic, guy=True)
def look_extra(a):
    rgb = a[..., :3].astype(int); al = a[..., 3] > 128
    br = al & (rgb[..., 0] > 90) & (rgb[..., 0] - rgb[..., 2] > 40)
    ys, xs = np.where(br); return dict(plankBox=[int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())])
save('look', plank, guy=True, extra=look_extra)
point, cheer = split(load('guyB'), 2)
save('point', point, guy=True); save('cheer', cheer, guy=True)

def worm_extra(a):
    al = a[..., 3] > 128; ys, xs = np.where(al)
    rgb = a[..., :3].astype(int)
    shell = al & (rgb.sum(2) > 640) & (np.abs(rgb[..., 0] - rgb[..., 2]) < 40)
    sy, sx = np.where(shell)
    return dict(shell=[float(sx.mean()), float(sy.mean()), int(sx.min()), int(sx.max()), int(sy.min()), int(sy.max())],
                nose=[int(xs.max()), int(np.median(ys[xs >= xs.max() - 4]))], tail=[int(xs.min()), int(np.median(ys[xs <= xs.min() + 4]))])
wa = save('worm', load('worm'), extra=worm_extra)
sh = info['worm']['shell']; hx0 = max(sh[2] - 50, 0)
hd = wa.copy(); hd[:, :hx0] = 0
save('wormHead', hd, extra=lambda a: dict(cut=hx0))
mid = wa[:, 600]; ys = np.where(mid[:, 3] > 128)[0]
body = wa[(ys.min() + ys.max()) // 2, 600, :3]
info['worm']['body'] = dict(top=int(ys.min()), bottom=int(ys.max()), col=[int(c) for c in body])

# plank: tunnel = the region between the lining strokes (dark inside + lining); make a "filled" copy (undug wood)
def plank_extra(a):
    rgb = a[..., :3].astype(int); al = a[..., 3] > 128; h, w = al.shape
    lin = al & (rgb.sum(2) > 540) & (rgb[..., 0] > 200)
    reg = np.zeros((h, w), bool); path = []
    for x in range(w):
        ys = np.where(lin[:, x])[0]
        if len(ys) < 2 or ys.max() - ys.min() < 25: continue
        y0, y1 = ys.min(), ys.max(); reg[max(y0 - 4, 0):y1 + 5, x] = True
        if x % 8 == 0: path.append([int(x), float((y0 + y1) / 2), float(y1 - y0)])
    reg = cv2.morphologyEx(reg.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((1, 15), np.uint8)).astype(bool) & al
    wood = al & ~reg & (rgb[..., 0] > 135) & (rgb[..., 0] < 170)
    wc = np.median(rgb[wood], 0)
    f = a.copy(); f[reg, :3] = wc.astype(np.uint8)
    ys = np.where(reg.any(1))[0]
    for yy in np.linspace(ys.min() + 20, ys.max() - 20, 4).astype(int):
        for x in range(w):
            if reg[yy, x] and (x // 70) % 3 != 2: f[yy - 1:yy + 2, x, :3] = (wc * 0.75).astype(np.uint8)
    Image.fromarray(f, 'RGBA').save(f'{OUT}/plankFilled.png', optimize=True)
    xs = np.where(reg.any(0))[0]
    return dict(path=path, region=[int(xs.min()), int(xs.max())])
save('plank', load('plank'), extra=plank_extra)

def shield_extra(a):
    al = a[..., 3] > 128; h, w = al.shape
    holes = (~al).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(holes, connectivity=4)
    H = [[int(x), int(y), int(x + ww), int(y + hh)] for x, y, ww, hh, ar in st[1:] if ar > 3000 and x > 0 and y > 0 and x + ww < w and y + hh < h]
    return dict(holes=sorted(H, key=lambda b: b[1]))
save('shield', load('shield'), extra=shield_extra)
save('train', load('train'))

bg = np.asarray(Image.open('raw/bg.png').convert('RGB')).astype(int)
Image.fromarray(bg.astype(np.uint8)).save(f'{OUT}/bg.png', optimize=True)
h, w, _ = bg.shape
brown = lambda p: p[0] > 110 and p[0] - p[2] > 45 and p[1] < 110
water = lambda p: p[0] < 140 and p[2] > 180 and p[1] > 130
bankY = next(y for y in range(400, h) if bg[y, 60].sum() < 60)
bankYr = next(y for y in range(400, h) if bg[y, w - 60].sum() < 60)
surf = next(y for y in range(400, h) if water(bg[y, w // 2]))
# river extent at surface + 6 and bed profile
row = surf + 6
xs = [x for x in range(w) if water(bg[row, x])]
bed = []
for x in range(min(xs), max(xs) + 1, 16):
    ys = [y for y in range(surf, h) if water(bg[y, x])]
    bed.append([x, max(ys) if ys else surf])
info['bg'] = dict(w=w, h=h, bankY=bankY, bankYr=bankYr, surf=surf, riverL=min(xs), riverR=max(xs), bed=bed,
                  mud=[int(c) for c in bg[h - 40, w // 2]], mudTop=[int(c) for c in bg[bankY + 60, 10]])
os.makedirs('../../src/shipworm-tunnel', exist_ok=True)
open('../../src/shipworm-tunnel/sprites.ts', 'w').write('// generated by images/shipworm-tunnel/prep.py\nexport const SPR = ' + json.dumps(info) + ' as const;\n')
for k, v in info.items(): print(k, {kk: vv for kk, vv in v.items() if kk not in ('path', 'bed')})
print('path', info['plank']['path'][:5], len(info['plank']['path']))
print('bed', info['bg']['bed'])
