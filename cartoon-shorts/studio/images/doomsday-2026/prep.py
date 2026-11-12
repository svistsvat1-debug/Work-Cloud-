# prep.py - trim, normalise colours, measure head/feet/page/reels/board -> public/doomsday-2026 + src/doomsday-2026/sprites.ts
import json, os
import numpy as np, cv2
from PIL import Image

OUT = '../../public/doomsday-2026'
os.makedirs(OUT, exist_ok=True)
PAL = np.array([[254, 253, 253], [237, 235, 235], [252, 141, 144]], float)  # channel palette (memory/STYLE.md)

def load(n): return np.asarray(Image.open(f'keyed/{n}.png').convert('RGBA')).copy()

def split(a):
    al = a[..., 3]; h, w = al.shape
    empty = (al > 10).sum(0) == 0
    runs = []; x = 0
    while x < w:
        if empty[x]:
            s = x
            while x < w and empty[x]: x += 1
            runs.append((s, x))
        else: x += 1
    runs = [r for r in runs if r[0] > 0 and r[1] < w]
    s, e = max(runs, key=lambda r: r[1] - r[0]); c = (s + e) // 2
    return a[:, :c], a[:, c:]

def trim(a, pad=12):
    ys, xs = np.where(a[..., 3] > 10)
    y0, y1, x0, x1 = max(ys.min() - pad, 0), min(ys.max() + pad + 1, a.shape[0]), max(xs.min() - pad, 0), min(xs.max() + pad + 1, a.shape[1])
    return a[y0:y1, x0:x1].copy(), (int(x0), int(y0))

def normalise(a, protect=None):
    rgb = a[..., :3].astype(float); op = a[..., 3] == 255
    if protect is not None: op = op & ~protect
    D = np.stack([np.sqrt(((rgb - c) ** 2).sum(2)) for c in PAL])   # nearest palette colour wins
    k = D.argmin(0); dm = D.min(0)
    for i, c in enumerate(PAL):
        m = op & (dm < 40) & (k == i); rgb[m] = c
    d = np.sqrt((rgb ** 2).sum(2)); rgb[op & (d < 25)] = 0
    a[..., :3] = rgb.astype(np.uint8); return a

def head_feet(a, feet=True):
    al = a[..., 3]; h, w = al.shape
    white = ((a[..., :3].astype(int).sum(2) > 600) & (al > 128)).astype(np.uint8)
    ff = white.copy(); cv2.floodFill(ff, np.zeros((h + 2, w + 2), np.uint8), (0, 0), 2)
    solid = np.where(ff == 2, 0, 1).astype(np.uint8)
    # the head: largest inscribed disc in the upper half (the page / body below never wins)
    solid[int(h * 0.55):] = 0
    dt = cv2.distanceTransform(solid, cv2.DIST_L2, 5)
    hy, hx = np.unravel_index(dt.argmax(), dt.shape)
    d = dict(head=[int(hx), int(hy), float(dt[hy, hx])])
    if feet:
        ys, xs = np.where(al > 128); yb = ys.max(); band = ys > yb - 0.035 * (yb - ys.min())
        d['feet'] = [float((xs[band].min() + xs[band].max()) / 2), int(yb)]
    return d

info = {}
def save(name, a, char=True, protect=None, feet=True, extra=None):
    if char: a = normalise(a, protect)
    a, off = trim(a)
    Image.fromarray(a, 'RGBA').save(f'{OUT}/{name}.png', optimize=True)
    d = dict(w=a.shape[1], h=a.shape[0])
    if char: d.update(head_feet(a, feet))
    if extra: d.update(extra(a))
    info[name] = d

# calendar: protect the cream page + red band from the palette snap, measure the page and the band
cal = load('calendar')
rgb = cal[..., :3].astype(int)
cream = (np.abs(rgb - [252, 244, 217]).sum(2) < 40) & (cal[..., 3] > 200)
red = (rgb[..., 0] > 180) & (rgb[..., 1] < 110) & (rgb[..., 2] < 110) & (cal[..., 3] > 200)
n, lab, st, _ = cv2.connectedComponentsWithStats(cream.astype(np.uint8), connectivity=4)
big = 1 + np.argmax(st[1:, 4])
px, py, pw, ph, _ = st[big]
ry = np.where(red.any(1))[0]; rx = np.where(red.any(0))[0]
prot = np.zeros(cream.shape, bool); prot[py - 40:py + ph + 20, px - 20:px + pw + 20] = True
def page(a):
    # the trim offset is applied below
    return {}
save('calendar', cal, protect=prot)
# recompute page boxes in trimmed coordinates
_, off = trim(load('calendar'))
info['calendar']['page'] = [int(px - off[0]), int(py - off[1]), int(pw), int(ph)]          # cream area (x, y, w, h)
info['calendar']['band'] = [int(rx.min() - off[0]), int(ry.min() - off[1]), int(rx.max() - rx.min() + 1), int(ry.max() - ry.min() + 1)]
# the page cuts the inscribed disc: take the head radius from its widest row above the hands (x 0.92 = dt / width ratio of the hero)
ca = np.asarray(Image.open(f'{OUT}/calendar.png'))[..., 3] > 128
top = info['calendar']['band'][1] - 40
wr = [ca[y].sum() for y in range(top)]; yw = int(np.argmax(wr)); xs = np.where(ca[yw])[0]
info['calendar']['head'] = [float((xs.min() + xs.max()) / 2), yw, float(0.92 * (xs.max() - xs.min()) / 2)]

for n_ in ['hero', 'panic', 'shrug', 'happy']: save(n_, load(n_))
save('squeezed', load('squeezed_cu'))
A_, B_ = split(load('kids'))
save('kid_wave', A_); save('kid_hug', B_)

# Earth: circle from the alpha box
def circ(a):
    ys, xs = np.where(a[..., 3] > 128)
    return dict(c=[float((xs.min() + xs.max()) / 2), float((ys.min() + ys.max()) / 2)], r=float((xs.max() - xs.min() + ys.max() - ys.min()) / 4))
save('earth', load('earth'), char=False, extra=circ)

# computer: the two tape reels (white discs in the upper half) and the paper slot (dark bar in the lower half)
def comp(a):
    rgb = a[..., :3].astype(int); al = a[..., 3]; h, w = al.shape
    light = ((rgb.sum(2) > 640) & (al > 200)).astype(np.uint8); light[int(h * 0.45):] = 0
    n, lab, st, cen = cv2.connectedComponentsWithStats(light, connectivity=4)
    order = np.argsort(-st[1:, 4])[:2] + 1
    reels = []
    for i in order:
        x, y, ww, hh, area = st[i]
        reels.append([float(x + ww / 2), float(y + hh / 2), float((ww + hh) / 4)])
    reels.sort()
    dark = ((rgb.sum(2) < 200) & (al > 200)).astype(np.uint8); dark[: int(h * 0.55)] = 0; dark[int(h * 0.92):] = 0
    n, lab, st, cen = cv2.connectedComponentsWithStats(dark, connectivity=4)
    cand = [s for s in st[1:] if s[2] > 0.3 * w and s[3] < 0.06 * h]
    s = max(cand, key=lambda s: s[2]) if cand else [0, 0, 0, 0]
    ys, xs = np.where(al > 128)
    # the paper slot was read off the marked-up sheet (qa/measure.png): the dark gap of the slot, trimmed coordinates
    return dict(reels=reels, slot=[140, 893, 415, 26], feet=[float((xs.min() + xs.max()) / 2), int(ys.max())])
save('computer', load('computer'), char=False, extra=comp)

# plates
for nm in ['bg_lab', 'bg_space']:
    b = Image.open(f'raw/{nm}.png').convert('RGB'); b.save(f'{OUT}/{nm}.png', optimize=True); info[nm] = dict(w=b.width, h=b.height)
lab = np.asarray(Image.open('raw/bg_lab.png').convert('RGB')).astype(int)
g = (lab[..., 1] > lab[..., 0] + 15) & (lab[..., 1] > lab[..., 2]) & (lab.sum(2) < 330)
n, lb, st, _ = cv2.connectedComponentsWithStats(g.astype(np.uint8), connectivity=4)
i = 1 + np.argmax(st[1:, 4]); x, y, ww, hh, _ = st[i]
info['bg_lab']['board'] = [int(x), int(y), int(ww), int(hh)]
col = lab[:, 100].sum(1); dd = np.abs(np.diff(col)); fl = [yy for yy in np.where(dd > 150)[0] if 700 < yy < 1000]
info['bg_lab']['floor'] = int(fl[0]) if fl else 845
info['bg_lab']['wall'] = '#%02x%02x%02x' % tuple(np.median(lab[20:60, 400:700].reshape(-1, 3), 0).astype(int))
info['bg_lab']['wood'] = '#%02x%02x%02x' % tuple(np.median(lab[1480:1530, 200:800].reshape(-1, 3), 0).astype(int))
sp = np.asarray(Image.open('raw/bg_space.png').convert('RGB')).astype(int)
info['bg_space']['sky'] = '#%02x%02x%02x' % tuple(np.median(sp.reshape(-1, 3), 0).astype(int))

os.makedirs('../../src/doomsday-2026', exist_ok=True)
with open('../../src/doomsday-2026/sprites.ts', 'w') as f:
    f.write('// generated by images/doomsday-2026/prep.py\nexport const SPR = ' + json.dumps(info) + ' as const;\n')
for k, v in info.items(): print(k, v)
