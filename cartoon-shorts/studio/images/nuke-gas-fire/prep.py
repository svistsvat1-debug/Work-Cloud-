# prep.py - trim, normalise colours, measure heads / feet / stick tips / pipe / bomb ring -> public/nuke-gas-fire + src/nuke-gas-fire/sprites.ts
# run from images/nuke-gas-fire (keyed/ holds the keyed cut-outs, raw/ the plates)
import json, os
import numpy as np, cv2
from PIL import Image

OUT = '../../public/nuke-gas-fire'
os.makedirs(OUT, exist_ok=True)
PAL = np.array([[254, 253, 253], [237, 235, 235], [252, 141, 144]], float)  # channel palette (memory/STYLE.md)

def load(n): return np.asarray(Image.open(f'keyed/{n}.png').convert('RGBA')).copy()

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

def head_feet(a):
    al = a[..., 3]; h, w = al.shape
    white = ((a[..., :3].astype(int).sum(2) > 600) & (al > 128)).astype(np.uint8)
    ff = white.copy(); cv2.floodFill(ff, np.zeros((h + 2, w + 2), np.uint8), (0, 0), 2)
    solid = np.where(ff == 2, 0, 1).astype(np.uint8)
    solid[int(h * 0.6):] = 0
    dt = cv2.distanceTransform(solid, cv2.DIST_L2, 5)
    hy, hx = np.unravel_index(dt.argmax(), dt.shape)
    ys, xs = np.where(al > 128); yb = ys.max(); band = ys > yb - 0.035 * (yb - ys.min())
    return dict(head=[int(hx), int(hy), float(dt[hy, hx])], feet=[float((xs[band].min() + xs[band].max()) / 2), int(yb)])

def stick_tip(a):
    rgb = a[..., :3].astype(int); al = a[..., 3]
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    m = (al > 200) & (r > 140) & (r - b > 50) & (g > 90) & (r > g)
    ys, xs = np.where(m)
    i = np.argmax(xs - ys)                       # up-right extreme of the light-brown stick
    pts = np.stack([xs, ys], 1).astype(float); c = pts.mean(0)
    v = np.linalg.svd(pts - c)[2][0]             # main direction of the stick pixels
    if v[0] < 0: v = -v
    return [int(xs[i]), int(ys[i])], float(np.degrees(np.arctan2(v[1], v[0])))

info = {}
def save(name, a, char=True, extra=None):
    if char: a = normalise(a)
    a, off = trim(a)
    Image.fromarray(a, 'RGBA').save(f'{OUT}/{name}.png', optimize=True)
    d = dict(w=a.shape[1], h=a.shape[0])
    if char: d.update(head_feet(a))
    if extra: d.update(extra(a))
    info[name] = d
    return a

for n in ['hero', 'shock']: save(n, load(n))
save('roast', load('roast'), extra=lambda a: dict(zip(['tip', 'ang'], stick_tip(a))))
save('sad', load('sad'), extra=lambda a: dict(zip(['tip', 'ang'], stick_tip(a))))
def push_hands(a):
    al = a[..., 3] > 128; ys, xs = np.where(al)
    i = np.argmax(xs); return dict(hands=[int(xs[i]), int(ys[i])])
save('push', load('push'), extra=push_hands)
def front_foot(a):
    # the two feet are separate clusters in the bottom 5 % rows; the front foot is the right cluster (it sits a bit higher)
    al = a[..., 3] > 128; h, w = al.shape; ys, xs = np.where(al); yb = ys.max()
    xx = np.where(al[int(yb - 0.05 * h):yb + 1].any(0))[0]
    g = np.where(np.diff(xx) > 1)[0]; x0, x1 = (xx[g[-1] + 1], xx[-1]) if len(g) else (xx[0], xx[-1])
    fy = int(np.where(al[:, x0:x1 + 1].any(1))[0].max())
    return dict(foot=[float((x0 + x1) / 2), fy], footW=float(x1 - x0))
save('step', load('step'), extra=front_foot)

# bomb: the ring on top (rope point), body centre line, widest body row
def bomb(a):
    al = a[..., 3] > 128; ys, xs = np.where(al); h, w = al.shape
    top = ys.min(); row = al[top + 3]; rx = np.where(row)[0]
    wr = al.sum(1); yw = int(np.argmax(wr[int(h * 0.3):]) + int(h * 0.3)); xw = np.where(al[yw])[0]
    yel = (a[..., 0] > 200) & (a[..., 1] > 150) & (a[..., 2] < 120) & (a[..., 3] > 200)
    return dict(ring=[float((rx.min() + rx.max()) / 2), int(top)], body=[float((xw.min() + xw.max()) / 2), yw, float(xw.max() - xw.min())],
                nose=int(ys.max()))
save('nuke', load('nuke'), char=False, extra=bomb)

# rig: split into derrick | wellhead mound | beams at the emptiest columns, measure the pipe top
rig = load('rig'); al = rig[..., 3] > 128; h, w = al.shape
cols = al.sum(0)
def cut_between(x0, x1):
    seg = cols[x0:x1]; return int(x0 + np.argmin(seg))
# the dark-grey pipe: grey pixels (r~g~b, 60..140) - its column range
rgb = rig[..., :3].astype(int)
grey = al & (np.abs(rgb[..., 0] - rgb[..., 1]) < 14) & (np.abs(rgb[..., 1] - rgb[..., 2]) < 14) & (rgb[..., 0] > 55) & (rgb[..., 0] < 150)
gc = grey.sum(0); px = np.where(gc > 0.5 * gc.max())[0]
p0, p1 = int(px.min()), int(px.max())
c1 = cut_between(p0 - 260, p0 - 60)
c2 = cut_between(p1 + 60, p1 + 300)
parts = {'derrick': rig[:, :c1], 'well': rig[:, c1:c2], 'beams': rig[:, c2:]}
for nm, part in parts.items():
    a2, off = trim(part.copy())
    Image.fromarray(a2, 'RGBA').save(f'{OUT}/{nm}.png', optimize=True)
    d = dict(w=a2.shape[1], h=a2.shape[0])
    ys2, xs2 = np.where(a2[..., 3] > 128); d['base'] = int(ys2.max())
    if nm == 'well':
        g2 = (np.abs(a2[..., 0].astype(int) - a2[..., 1]) < 14) & (a2[..., 0] > 55) & (a2[..., 0] < 150) & (a2[..., 3] > 200)
        gy, gx = np.where(g2)
        # pipe columns (dense grey), the top of the pipe = first row where the pipe columns are mostly grey/black
        gcc = g2.sum(0); pcols = np.where(gcc > 0.5 * gcc.max())[0]
        q0, q1 = int(pcols.min()), int(pcols.max())
        dark = (a2[..., 3] > 128)[:, q0:q1 + 1].mean(1)
        top = int(np.where(dark > 0.6)[0].min())
        d['pipe'] = [float((q0 + q1) / 2), top, float(q1 - q0 + 1)]
        # mound: the sandy part - its top row near the pipe
        sand = (a2[..., 0] > 170) & (a2[..., 1] > 120) & (a2[..., 2] < 130) & (a2[..., 3] > 200)
        sy, sx = np.where(sand); d['moundTop'] = int(sy.min())
    info[nm] = d

# props: split into cork | valve | valve at the widest empty column gaps
pr = load('props'); al = pr[..., 3] > 10; cols = al.sum(0)
empty = cols == 0; runs = []; x = 0; W = len(cols)
while x < W:
    if empty[x]:
        s = x
        while x < W and empty[x]: x += 1
        runs.append((s, x))
    else: x += 1
runs = sorted([r for r in runs if r[0] > 0 and r[1] < W], key=lambda r: r[1] - r[0], reverse=True)[:2]
cuts = sorted([(s + e) // 2 for s, e in runs])
for nm, part in zip(['cork', 'valve1', 'valve2'], [pr[:, :cuts[0]], pr[:, cuts[0]:cuts[1]], pr[:, cuts[1]:]]):
    a2, off = trim(part.copy())
    Image.fromarray(a2, 'RGBA').save(f'{OUT}/{nm}.png', optimize=True)
    al2 = a2[..., 3] > 128; ys2, xs2 = np.where(al2)
    d = dict(w=a2.shape[1], h=a2.shape[0], base=int(ys2.max()))
    if nm == 'cork':
        rowsw = al2.sum(1); d['bottomW'] = float(rowsw[ys2.max() - 6]); d['topW'] = float(rowsw[ys2.min() + 30])
    else:
        # the vertical pipe width at the bottom flange is wider: take the pipe body width at 70 % height
        y7 = int(ys2.min() + 0.72 * (ys2.max() - ys2.min())); xx = np.where(al2[y7])[0]
        d['body'] = [float((xx.min() + xx.max()) / 2), y7, float(xx.max() - xx.min())]
        d['top'] = int(ys2.min())
    info[nm] = d

# plates
for nm in ['bg_desert', 'bg_under']:
    b = Image.open(f'raw/{nm}.png').convert('RGB'); b.save(f'{OUT}/{nm}.png', optimize=True); info[nm] = dict(w=b.width, h=b.height)
de = np.asarray(Image.open('raw/bg_desert.png').convert('RGB')).astype(int)
col = de[:, 40]; blue = (col[:, 2] > col[:, 0] + 30)
info['bg_desert']['horizon'] = int(np.where(blue)[0].max())   # last sky row at the left edge (hills start later)
info['bg_desert']['sky'] = '#%02x%02x%02x' % tuple(np.median(de[300:400, 450:600].reshape(-1, 3), 0).astype(int))
info['bg_desert']['sand'] = '#%02x%02x%02x' % tuple(np.median(de[1300:1500, 300:700].reshape(-1, 3), 0).astype(int))
un = np.asarray(Image.open('raw/bg_under.png').convert('RGB')).astype(int)
c = un[:, 512]; dk = c.sum(1) < 120
lines = []; y = 0
while y < len(c):
    if dk[y]:
        s = y
        while y < len(c) and dk[y]: y += 1
        lines.append((s + y) // 2)
    else: y += 1
info['bg_under']['lines'] = lines
bands = []
for i in range(len(lines) + 1):
    y0 = 0 if i == 0 else lines[i - 1] + 6; y1 = len(c) if i == len(lines) else lines[i] - 6
    if y1 - y0 > 30: bands.append([y0, y1, '#%02x%02x%02x' % tuple(np.median(un[y0:y1, 300:700].reshape(-1, 3), 0).astype(int))])
info['bg_under']['bands'] = bands

os.makedirs('../../src/nuke-gas-fire', exist_ok=True)
with open('../../src/nuke-gas-fire/sprites.ts', 'w') as f:
    f.write('// generated by images/nuke-gas-fire/prep.py\nexport const SPR = ' + json.dumps(info) + ' as const;\n')
for k, v in info.items(): print(k, v)
