# prep.py - split pair sheets, trim, normalise colours, measure heads / feet / boards / door
# -> public/nuclear-warning/*.png + src/nuclear-warning/sprites.ts   (run from images/nuclear-warning; keyed/ = cut-outs, raw/ = plate)
import json, os
import numpy as np, cv2
from PIL import Image

OUT = '../../public/nuclear-warning'
os.makedirs(OUT, exist_ok=True)
PAL = np.array([[254, 253, 253], [237, 235, 235], [252, 141, 144]], float)  # channel palette (memory/STYLE.md)

def load(n): return np.asarray(Image.open(f'keyed/{n}.png').convert('RGBA')).copy()

def trim(a, pad=12):
    ys, xs = np.where(a[..., 3] > 10)
    y0, y1, x0, x1 = max(ys.min() - pad, 0), min(ys.max() + pad + 1, a.shape[0]), max(xs.min() - pad, 0), min(xs.max() + pad + 1, a.shape[1])
    return a[y0:y1, x0:x1].copy(), (int(x0), int(y0))

def normalise(a):
    rgb = a[..., :3].astype(float); op = a[..., 3] == 255
    D = np.stack([np.sqrt(((rgb - c) ** 2).sum(2)) for c in PAL])   # nearest palette colour wins
    k = D.argmin(0); dm = D.min(0)
    for i, c in enumerate(PAL):
        m = op & (dm < 40) & (k == i); rgb[m] = c
    d = np.sqrt((rgb ** 2).sum(2)); rgb[op & (d < 25)] = 0
    a[..., :3] = rgb.astype(np.uint8); return a

def head_feet(a, closeup=False, top=0.6):
    al = a[..., 3]; h, w = al.shape
    white = ((a[..., :3].astype(int).sum(2) > 600) & (al > 128)).astype(np.uint8)
    ff = white.copy(); cv2.floodFill(ff, np.zeros((h + 2, w + 2), np.uint8), (0, 0), 2)
    solid = np.where(ff == 2, 0, 1).astype(np.uint8)
    if not closeup: solid[int(h * top):] = 0
    dt = cv2.distanceTransform(solid, cv2.DIST_L2, 5)
    hy, hx = np.unravel_index(dt.argmax(), dt.shape)
    ys, xs = np.where(al > 128); yb = ys.max(); band = ys > yb - 0.035 * (yb - ys.min())
    return dict(head=[int(hx), int(hy), float(dt[hy, hx])], feet=[float((xs[band].min() + xs[band].max()) / 2), int(yb)])

def colour_box(a, test):
    rgb = a[..., :3].astype(int); m = test(rgb) & (a[..., 3] > 200)
    ys, xs = np.where(m)
    return [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())]

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
def save(name, a, char=True, extra=None, closeup=False, top=0.6):
    if char: a = normalise(a)
    a, off = trim(a)
    Image.fromarray(a, 'RGBA').save(f'{OUT}/{name}.png', optimize=True)
    d = dict(w=a.shape[1], h=a.shape[0], off=list(off))
    if char: d.update(head_feet(a, closeup, top))
    if extra: d.update(extra(a))
    info[name] = d
    return a

brown = lambda r: (r[..., 0] > r[..., 2] + 40) & (r[..., 0] > 120) & (r[..., 1] > 60) & (r.sum(2) < 600)
# hero pair: mallet up / mallet down (split on the empty gap; the mallet heads are brown)
up, down = split(load('hero'), 2)
save('up', up, extra=lambda a: dict(mallet=colour_box(a, brown)))
save('down', down, extra=lambda a: dict(mallet=colour_box(a, brown)))
save('scroll', load('scroll'), closeup=True, extra=lambda a: dict(paper=colour_box(a, lambda r: (r[..., 0] > 215) & (r[..., 1] > 190) & (r[..., 2] < 190) & (r[..., 2] > 120))))
save('run', load('run'), top=0.5)
save('skull', load('skull'), top=1.0, extra=lambda a: dict(board=colour_box(a, lambda r: r.sum(2) > 720)))
save('robber', load('robber'), extra=lambda a: dict(sack=colour_box(a, brown)))
save('nerd', load('nerd'))
calm, green = split(load('cat'), 2)
save('cat', calm, char=False)
save('catg', green, char=False)
sign, gold, shovel = split(load('props'), 3)
yellow = lambda r: (r[..., 0] > 200) & (r[..., 1] > 170) & (r[..., 2] < 90)
def post(a):
    h = a.shape[0]; rgb = a[..., :3].astype(int)
    m = (rgb[..., 0] > rgb[..., 2] + 30) & (rgb[..., 0] < 200) & (a[..., 3] > 200); m[: int(h * 0.8)] = 0
    ys, xs = np.where(m); yb = np.where(a[..., 3] > 128)[0].max()
    return dict(board=colour_box(a, yellow), post=[float(np.median(xs)), int(yb)])
save('sign', sign, char=False, extra=post)
save('gold', gold, char=False)
save('shovel', shovel, char=False)
def door(a):
    h, w = a.shape[:2]; rgb = a[..., :3].astype(int)
    m = (rgb.sum(2) < 200) & (a[..., 3] > 200); m[:, : int(w * 0.3)] = 0; m[:, int(w * 0.7):] = 0; m[: int(h * 0.25)] = 0
    ys, xs = np.where(m)
    return dict(door=[int(np.percentile(xs, 2)), int(np.percentile(ys, 1)), int(np.percentile(xs, 98)), int(ys.max())])
save('tomb', load('tomb'), char=False, extra=door)

# background plate: horizon = first non-sky row in the middle column below the clouds
bg = np.asarray(Image.open('raw/bg.png').convert('RGB')).astype(int)
mid = bg[:, bg.shape[1] // 3]; sky = (mid[:, 2] > mid[:, 0] + 30) & (mid[:, 2] > 180)
nz = np.where(~sky)[0]; hz = int(nz[nz > 300].min())
Image.fromarray(bg.astype(np.uint8)).save(f'{OUT}/bg.png', optimize=True)
info['bg'] = dict(w=bg.shape[1], h=bg.shape[0], horizon=hz, sky=list(map(int, bg[30, 30])), grass=list(map(int, bg[1400, 200])))

# head circles from heads.py + heads2.py (rays to the silhouette edge, circle fit; checked on qa/heads.png)
if os.path.exists('heads.json'):
    for k, v in json.load(open('heads.json')).items(): info[k]['head'] = v
os.makedirs('../../src/nuclear-warning', exist_ok=True)
open('../../src/nuclear-warning/sprites.ts', 'w').write('// generated by images/nuclear-warning/prep.py\nexport const SPR = ' + json.dumps(info) + ' as const;\n')
for k, v in info.items(): print(k, v)
