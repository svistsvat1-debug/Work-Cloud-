# prep.py - split sheets, trim, normalise character colours, measure anchors
# -> public/iceberg-tow/*.png + src/iceberg-tow/sprites.ts   (run from images/iceberg-tow)
import json, os
import numpy as np, cv2
from PIL import Image

OUT = '../../public/iceberg-tow'
os.makedirs(OUT, exist_ok=True)
PAL = np.array([[254, 253, 253], [237, 235, 235], [252, 141, 144]], float)  # memory/STYLE.md

def load(n): return np.asarray(Image.open(f'keyed/{n}.png').convert('RGBA')).copy()

def kill_key_gaps(n, a):
    raw = np.asarray(Image.open(f'raw/{n}.png').convert('RGB')).astype(float)
    border = np.concatenate([raw[0], raw[-1], raw[:, 0], raw[:, -1]]); key = np.median(border, 0)
    d = np.sqrt(((raw - key) ** 2).sum(2)); a[d < 70, 3] = 0
    return a

def despill(a):  # objects with no green in them: greenish pixels -> transparent
    r, g, b = [a[..., i].astype(int) for i in range(3)]
    a[(g > r + 15) & (g > b + 15), 3] = 0
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
    ex = extra(a) if extra else {}
    Image.fromarray(a, 'RGBA').save(f'{OUT}/{name}.png', optimize=True)
    d = dict(w=a.shape[1], h=a.shape[0], feet=feet(a), **box(a), **ex)
    if guy: d['head'] = head_disc(a)
    info[name] = d
    return a

def extreme(a, f, band=30):  # mean of the opaque pixels within `band` of the max of f(x, y)
    ys, xs = np.where(a[..., 3] > 128); v = f(xs, ys); sel = v >= v.max() - band
    return [float(xs[sel].mean()), float(ys[sel].mean())]

def bagbox(a):
    rgb = a[..., :3].astype(int); al = a[..., 3] > 128
    dark = (al & (rgb.max(2) < 90)).astype(np.uint8)
    dark = cv2.morphologyEx(dark, cv2.MORPH_OPEN, np.ones((31, 31), np.uint8))  # drop thin outlines, keep the bag body
    n, lab, st, _ = cv2.connectedComponentsWithStats(dark, connectivity=4)
    i = 1 + int(np.argmax(st[1:, 4])); x, y, w, h, _ = st[i]
    return dict(bag=[int(x), int(y), int(x + w), int(y + h)])

def glassfix(a):  # clear glass drawn on the green key -> pale blue glass
    r, g, b = [a[..., i].astype(int) for i in range(3)]
    m = (g > r + 25) & (g > b + 10) & (a[..., 3] > 0)
    a[m, 0], a[m, 1], a[m, 2], a[m, 3] = 200, 232, 250, 150
    return a

def cityfix(a):  # drop the drawn sea strip under the sand
    h = a.shape[0]; r, g, b = [a[..., i].astype(int) for i in range(3)]
    ys = np.arange(h)[:, None] * np.ones((1, a.shape[1]))
    m = (b > r + 40) & (ys > 0.72 * h)
    a[m, 3] = 0
    sand = (r > 200) & (g > 160) & (b < 160) & (a[..., 3] > 200)
    rows = np.where(sand.sum(1) > 20)[0]; yb = rows.max() + 6
    a[yb:, :, 3] = 0
    # also drop isolated ink below the sand (wave lines): keep only the largest component
    al = (a[..., 3] > 10).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(al, connectivity=8)
    i = 1 + int(np.argmax(st[1:, 4])); a[lab != i, 3] = 0
    return a

save('hero', load('hero'), guy=True, extra=lambda a: dict(rope=extreme(a, lambda x, y: -x, 10), hand=extreme(a, lambda x, y: x, 20)))
s1, s2 = split(load('shock_tired'), 2)
save('shock', s1, guy=True); save('tired', s2, guy=True)
g1, g2 = split(load('glass_strain'), 2)
save('glass', glassfix(g1), guy=True)
save('strain', g2, guy=True, extra=lambda a: dict(hand=extreme(a, lambda x, y: -x, 20)))
save('tug', despill(kill_key_gaps('tug', load('tug'))))
save('iceberg', kill_key_gaps('iceberg', load('iceberg')))
save('city', cityfix(kill_key_gaps('city', load('city'))))
bg = np.asarray(Image.open('raw/bg.png').convert('RGB'))
Image.fromarray(bg).save(f'{OUT}/bg.png', optimize=True)
info['bg'] = dict(w=bg.shape[1], h=bg.shape[0])
open('../../src/iceberg-tow/sprites.ts', 'w').write('// generated by images/iceberg-tow/prep.py\nexport const SPR = ' + json.dumps(info) + ' as const;\n')
for k, v in info.items(): print(k, v)
