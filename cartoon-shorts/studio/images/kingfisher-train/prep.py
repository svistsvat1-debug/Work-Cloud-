# prep.py - split pair sheets, trim, normalise the character colours, measure anchors
# -> public/kingfisher-train/*.png + src/kingfisher-train/sprites.ts   (run from images/kingfisher-train)
import json, os
import numpy as np, cv2
from PIL import Image

OUT = '../../public/kingfisher-train'
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

def head_disc(a, top=0.55):
    al = a[..., 3]; h, w = al.shape
    white = ((a[..., :3].astype(int).sum(2) > 600) & (al > 128)).astype(np.uint8)
    ff = white.copy(); cv2.floodFill(ff, np.zeros((h + 2, w + 2), np.uint8), (0, 0), 2)
    solid = np.where(ff == 2, 0, 1).astype(np.uint8)
    solid[int(h * top):] = 0
    dt = cv2.distanceTransform(solid, cv2.DIST_L2, 5)
    hy, hx = np.unravel_index(dt.argmax(), dt.shape)
    return [int(hx), int(hy), float(dt[hy, hx])]

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
def save(name, a, guy=False, extra=None):
    if guy: a = normalise(a)
    a, off = trim(a)
    Image.fromarray(a, 'RGBA').save(f'{OUT}/{name}.png', optimize=True)
    d = dict(w=a.shape[1], h=a.shape[0], off=list(off), feet=feet(a))
    if guy: d['head'] = head_disc(a)
    if extra: d.update(extra(a))
    info[name] = d
    return a

save('hero', load('hero'), guy=True)
ears, thumbs = split(load('guy2'), 2)
save('ears', ears, guy=True)
save('thumbs', thumbs, guy=True)

def train_extra(a):
    al = a[..., 3] > 128; h, w = al.shape
    ys, xs = np.where(al)
    # body rows: columns near the left end (x 30..60) -> top of roof and bottom of body (white/blue, not the wheels)
    col = al[:, 40]; yy = np.where(col)[0]
    roof, under = int(yy.min()), int(yy.max())
    # wheels: lowest opaque rows
    wheel = int(ys.max())
    # nose tip: right-most opaque pixel and its row
    xr = int(xs.max()); yr = int(np.median(ys[xs >= xr - 2]))
    # left flat end x
    xl = int(xs.min())
    # cockpit window: darkest blob in the right 35 % above the middle
    rgb = a[..., :3].astype(int); dark = (rgb.sum(2) < 260) & al
    dark[:, : int(w * 0.62)] = False; dark[(roof + under) // 2:, :] = False
    n, lab, st, cen = cv2.connectedComponentsWithStats(dark.astype(np.uint8))
    best = max(range(1, n), key=lambda i: st[i][4]) if n > 1 else None
    win = [float(cen[best][0]), float(cen[best][1]), int(st[best][2]), int(st[best][3])] if best else None
    return dict(roof=roof, under=under, wheel=wheel, tip=[xr, yr], left=xl, win=win)

old = save('oldtrain', load('oldtrain'), extra=train_extra)
new = save('newtrain', load('newtrain'), extra=train_extra)

# rear car: the left part of the old train (flat left end), cut before the nose, closed with an outline on the right
o = info['oldtrain']; a = np.asarray(Image.open(f'{OUT}/oldtrain.png')).copy()
cut = int(o['left'] + 0.70 * (o['tip'][0] - o['left']))
car = a[:, :cut + 1].copy()
# close the right end: copy the left end mirrored (flat end with its outline)
endw = 40
car[:, -endw:] = a[:, o['left']:o['left'] + endw][:, ::-1]
Image.fromarray(car, 'RGBA').save(f'{OUT}/car.png', optimize=True)
info['car'] = dict(w=car.shape[1], h=car.shape[0], left=o['left'], right=car.shape[1] - 1 - o['left'])

def bird_extra(a):
    al = a[..., 3] > 128; ys, xs = np.where(al)
    rgb = a[..., :3].astype(int)
    black = (rgb.sum(2) < 200) & al
    # beak tip = extreme opaque point in the beak direction
    return dict(right=[int(xs.max()), int(np.median(ys[xs >= xs.max() - 2]))], bottom=[int(np.median(xs[ys >= ys.max() - 2])), int(ys.max())], top=int(ys.min()), left=int(xs.min()))
perch, dive = split(load('bird2'), 2)
save('perch', perch, extra=bird_extra)
save('dive', dive, extra=bird_extra)

def hill_extra(a):
    al = a[..., 3] > 128; h, w = al.shape
    rgb = a[..., :3].astype(int)
    blk = ((rgb.sum(2) < 90) & al).astype(np.uint8)
    blk[: int(h * 0.5)] = 0
    n, lab, st, cen = cv2.connectedComponentsWithStats(blk)
    big = sorted([i for i in range(1, n)], key=lambda i: -st[i][4])[:2]
    big.sort(key=lambda i: st[i][0])
    arches = [[int(st[i][0]), int(st[i][1]), int(st[i][2]), int(st[i][3])] for i in big]
    ys, xs = np.where(al)
    base = int(ys.max()); top = int(ys.min())
    # silhouette top profile every 20 px
    prof = []
    for x in range(0, w, 20):
        c = np.where(al[:, x])[0]; prof.append(int(c.min()) if len(c) else base)
    return dict(arches=arches, base=base, top=top, prof=prof, left=int(xs.min()), right=int(xs.max()))
save('hill', load('hill'), extra=hill_extra)

bg = np.asarray(Image.open('raw/bg.png').convert('RGB')).astype(int)
col = bg[:, 512]; dark = np.where(col.sum(1) < 200)[0]
G = int(dark[(dark > 900) & (dark < 1150)].min()) if ((dark > 900) & (dark < 1150)).any() else 998
# sky part only (above the grass strip line) -> sky.png; ground is drawn in code
gr = [int(y) for y in dark if 900 < y < 1150]
Image.fromarray(bg.astype(np.uint8)).save(f'{OUT}/bg.png', optimize=True)
info['bg'] = dict(w=bg.shape[1], h=bg.shape[0], darkrows=gr, sky=list(map(int, bg[20, 500])), grass=list(map(int, bg[min(gr) + 8 if gr else 1005, 500])), soil=list(map(int, bg[1400, 300])))
os.makedirs('../../src/kingfisher-train', exist_ok=True)
open('../../src/kingfisher-train/sprites.ts', 'w').write('// generated by images/kingfisher-train/prep.py\nexport const SPR = ' + json.dumps(info) + ' as const;\n')
for k, v in info.items(): print(k, {kk: vv for kk, vv in v.items() if kk != 'prof'})
