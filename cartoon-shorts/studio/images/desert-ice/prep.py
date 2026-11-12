# prep.py - trim, normalise colours, measure heads / feet / ice / bucket / pool basin / dome door
# -> public/desert-ice/*.png + src/desert-ice/sprites.ts   (run from images/desert-ice; keyed/ = cut-outs, raw/ = plate)
import json, os
import numpy as np, cv2
from PIL import Image

OUT = '../../public/desert-ice'
os.makedirs(OUT, exist_ok=True)
PAL = np.array([[254, 253, 253], [237, 235, 235], [252, 141, 144]], float)  # channel palette (memory/STYLE.md)

def load(n): return np.asarray(Image.open(f'keyed/{n}.png').convert('RGBA')).copy()

def trim(a, pad=12):
    ys, xs = np.where(a[..., 3] > 10)
    y0, y1, x0, x1 = max(ys.min() - pad, 0), min(ys.max() + pad + 1, a.shape[0]), max(xs.min() - pad, 0), min(xs.max() + pad + 1, a.shape[1])
    return a[y0:y1, x0:x1].copy(), (int(x0), int(y0))

def bluish(a):
    rgb = a[..., :3].astype(int)
    return (rgb[..., 2] - rgb[..., 0] > 40) & (rgb[..., 1] > 120) & (a[..., 3] > 128)

def normalise(a):
    rgb = a[..., :3].astype(float); op = (a[..., 3] == 255) & ~bluish(a)
    # protect wood (bucket) too: brown pixels are far from the palette anyway
    D = np.stack([np.sqrt(((rgb - c) ** 2).sum(2)) for c in PAL])   # nearest palette colour wins
    k = D.argmin(0); dm = D.min(0)
    for i, c in enumerate(PAL):
        m = op & (dm < 40) & (k == i); rgb[m] = c
    d = np.sqrt((rgb ** 2).sum(2)); rgb[op & (d < 25)] = 0
    a[..., :3] = rgb.astype(np.uint8); return a

def head_feet(a, closeup=False):
    al = a[..., 3]; h, w = al.shape
    white = ((a[..., :3].astype(int).sum(2) > 600) & (al > 128) & ~bluish(a)).astype(np.uint8)
    ff = white.copy(); cv2.floodFill(ff, np.zeros((h + 2, w + 2), np.uint8), (0, 0), 2)
    solid = np.where(ff == 2, 0, 1).astype(np.uint8)
    if not closeup: solid[int(h * 0.6):] = 0
    dt = cv2.distanceTransform(solid, cv2.DIST_L2, 5)
    hy, hx = np.unravel_index(dt.argmax(), dt.shape)
    ys, xs = np.where(al > 128); yb = ys.max(); band = ys > yb - 0.035 * (yb - ys.min())
    return dict(head=[int(hx), int(hy), float(dt[hy, hx])], feet=[float((xs[band].min() + xs[band].max()) / 2), int(yb)])

def blue_box(a):
    ys, xs = np.where(bluish(a))
    return dict(ice=[int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())])

info = {}
def save(name, a, char=True, extra=None, closeup=False):
    if char: a = normalise(a)
    a, off = trim(a)
    Image.fromarray(a, 'RGBA').save(f'{OUT}/{name}.png', optimize=True)
    d = dict(w=a.shape[1], h=a.shape[0])
    if char: d.update(head_feet(a, closeup))
    if extra: d.update(extra(a))
    info[name] = d
    return a

save('hero', load('hero'), extra=blue_box)
save('carry', load('carry'), extra=blue_box)
info['carry']['head'] = [390, 595, 215.0]  # arms cross the head: read off qa/carry_head.png (grid)
save('shrug', load('shrug'))
save('slide', load('slide'))
def stream(a):
    b = blue_box(a)['ice']   # the water stream: lowest blue pixel = where it lands
    ys, xs = np.where(bluish(a)); i = ys.argmax()
    return dict(stream=b, land=[int(xs[i]), int(ys[i])])
save('pour', load('pour'), extra=stream)
def pour_feet(n='pour'):  # the water stream also reaches the bottom rows: feet = non-blue pixels left of the stream
    a = np.asarray(Image.open(f'{OUT}/{n}.png')); al = (a[..., 3] > 128) & ~bluish(a); al[:, info[n]['stream'][0] - 10:] = False
    ys, xs = np.where(al); yb = ys.max(); band = ys > yb - 0.035 * (yb - ys.min())
    info[n]['feet'] = [float((xs[band].min() + xs[band].max()) / 2), int(yb)]
pour_feet()
save('awe', load('awe'), closeup=True)

# props sheet: split at the widest empty column gaps -> block, cube, bucket
p = load('props'); col = (p[..., 3] > 10).any(0); xs = np.where(col)[0]
runs = []; s = xs[0]
for i in range(1, len(xs)):
    if xs[i] > xs[i - 1] + 1: runs.append((s, xs[i - 1])); s = xs[i]
runs.append((s, xs[-1])); runs = sorted(runs, key=lambda r: r[1] - r[0], reverse=True)[:3]; runs.sort()
for n, (x0, x1) in zip(['block', 'cube', 'bucket'], runs):
    sub = p.copy(); sub[:, :x0 - 4] = 0; sub[:, x1 + 5:] = 0
    save(n, sub, char=False)

# dome: door = dark pixels in the bottom 25 % near the centre column
def door(a):
    h, w = a.shape[:2]; rgb = a[..., :3].astype(int)
    m = (rgb.sum(2) < 260) & (rgb[..., 0] > rgb[..., 2] + 10) & (a[..., 3] > 200)
    m[: int(h * 0.75)] = 0; m[:, : int(w * 0.35)] = 0; m[:, int(w * 0.65):] = 0
    ys, xs = np.where(m)
    ys2, xs2 = np.where(a[..., 3] > 128)
    return dict(door=[int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())], base=int(ys2.max()), cx=float((xs2.min() + xs2.max()) / 2))
save('dome', load('dome'), char=False, extra=door)

# pool: basin interior measured on the raw sheet (outline rows y 598 / 650, inner side lines), shifted by the trim offset
pl = load('pool'); t, off = trim(pl); Image.fromarray(t, 'RGBA').save(f'{OUT}/pool.png', optimize=True)
basin = [[66, 599], [1466, 599], [1486, 649], [46, 649]]
info['pool'] = dict(w=t.shape[1], h=t.shape[0], basin=[[x - off[0], y - off[1]] for x, y in basin], wallTop=311 - off[1], rimTop=591 - off[1])

# background plate: horizon = the row where the sky blue ends in the middle column
bg = np.asarray(Image.open('raw/bg.png').convert('RGB')).astype(int)
mid = bg[:, bg.shape[1] // 2]; sky = (mid[:, 2] > mid[:, 0] + 30)
hz = int(np.where(~sky)[0][np.where(~sky)[0] > 100].min())
Image.fromarray(bg.astype(np.uint8)).save(f'{OUT}/bg.png', optimize=True)
info['bg'] = dict(w=bg.shape[1], h=bg.shape[0], horizon=hz, sky=list(map(int, bg[50, 500])), sand=list(map(int, bg[1300, 500])))

os.makedirs('../../src/desert-ice', exist_ok=True)
open('../../src/desert-ice/sprites.ts', 'w').write('// generated by images/desert-ice/prep.py\nexport const SPR = ' + json.dumps(info) + ' as const;\n')
for k, v in info.items(): print(k, {kk: vv for kk, vv in v.items()})
