# prep.py - split sheets, trim, normalise character colours, measure anchors
# -> public/antarctic-trash/*.png + src/antarctic-trash/sprites.ts   (run from images/antarctic-trash)
import json, os
import numpy as np, cv2
from PIL import Image

OUT = '../../public/antarctic-trash'
os.makedirs(OUT, exist_ok=True)
PAL = np.array([[254, 253, 253], [237, 235, 235], [252, 141, 144]], float)  # memory/STYLE.md

def load(n): return np.asarray(Image.open(f'keyed/{n}.png').convert('RGBA')).copy()

def kill_key_gaps(n, a):  # any leftover key-coloured pixels (tiny enclosed gaps, e.g. mast lattice) -> transparent
    raw = np.asarray(Image.open(f'raw/{n}.png').convert('RGB')).astype(float)
    h, w, _ = raw.shape
    border = np.concatenate([raw[0], raw[-1], raw[:, 0], raw[:, -1]]); key = np.median(border, 0)
    d = np.sqrt(((raw - key) ** 2).sum(2))
    a[d < 70, 3] = 0
    return a

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
    ex = extra(a) if extra else {}
    Image.fromarray(a, 'RGBA').save(f'{OUT}/{name}.png', optimize=True)
    d = dict(w=a.shape[1], h=a.shape[0], off=list(off), feet=feet(a), **box(a), **ex)
    if guy: d['head'] = head_disc(a)
    info[name] = d
    return a

def rightmost(a, band=40):
    al = a[..., 3] > 128; ys, xs = np.where(al); r = xs.max(); sel = xs >= r - band
    return [float(xs[sel].mean()), float(ys[sel].mean())]

def topright_hand(a):  # bag knot / raised hand: topmost point in the right third
    al = a[..., 3] > 128; h, w = al.shape; ys, xs = np.where(al)
    return dict(hand=rightmost(a))

save('hero', load('hero'), guy=True)
# bag in the hero's hand: dark pixels in the lower right
def bagbox(a):
    rgb = a[..., :3].astype(int); al = a[..., 3] > 128
    dark = al & (rgb.max(2) < 90); ys, xs = np.where(dark)
    sel = (ys > a.shape[0] * 0.5) & (xs > a.shape[1] * 0.45)
    return dict(bag=[int(xs[sel].min()), int(ys[sel].min()), int(xs[sel].max()), int(ys[sel].max())])
info['hero'].update(bagbox(np.asarray(Image.open(f'{OUT}/hero.png'))))
pull, dig = split(load('pull_dig'), 2)
def fists(a):  # pull pose: the fists at the shoulder = the dark-outlined blob near the head on the left-top
    return dict(hand=[float(a.shape[1] * 0.42), float(a.shape[0] * 0.38)])
save('pull', pull, guy=True, extra=fists)
def blade(a):  # shovel blade tip = lowest point on the right
    al = a[..., 3] > 128; ys, xs = np.where(al); sel = xs > a.shape[1] * 0.6
    i = ys[sel].argmax(); return dict(tip=[int(xs[sel][i]), int(ys[sel][i])])
save('dig', dig, guy=True, extra=blade)
shock, wave = split(load('shock_wave'), 2)
save('shock', shock, guy=True)
save('wave', wave, guy=True)
sled, bag = split(load('props'), 2)
def rope(a): return dict(rope=rightmost(a, 20))
save('sled', sled, extra=rope)
save('bag', bag)
save('ship', kill_key_gaps('ship', load('ship')))
save('base', kill_key_gaps('base', load('base')))
pj, pw = split(kill_key_gaps('penguin', load('penguin')), 2)
save('pengJudge', pj); save('pengWave', pw)

# --- background plate: keep the sky + mountains down to the horizon line (the lower field is drawn in code) ---
bg = np.asarray(Image.open('raw/bg.png').convert('RGB')).astype(int)
h, w, _ = bg.shape
dark = (bg.max(2) < 80)
rows = dark.sum(1)
hz = int(np.argmax(rows > 0.8 * w))  # the long black horizon line
sky = bg[:hz + 4].astype(np.uint8)
Image.fromarray(sky).save(f'{OUT}/sky.png', optimize=True)
info['sky'] = dict(w=w, h=hz + 4, horizon=hz, skyTop=[int(c) for c in bg[5, w // 2]], snow=[int(c) for c in bg[hz + 40, w // 2]])
os.makedirs('../../src/antarctic-trash', exist_ok=True)
open('../../src/antarctic-trash/sprites.ts', 'w').write('// generated by images/antarctic-trash/prep.py\nexport const SPR = ' + json.dumps(info) + ' as const;\n')
for k, v in info.items(): print(k, v)
