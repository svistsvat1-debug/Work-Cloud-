# prep.py - trim, normalise colours, measure head/feet, fix the helmet glass, split the lander and the background
# layers -> public/moon-trash + src/moon-trash/sprites.ts
import json, os
import numpy as np, cv2
from PIL import Image

OUT = '../../public/moon-trash'
os.makedirs(OUT, exist_ok=True)
PAL = np.array([[254, 253, 253], [237, 235, 235], [252, 141, 144]], float)  # channel palette (memory/STYLE.md)

def load(n): return np.asarray(Image.open(f'keyed/{n}.png').convert('RGBA')).copy()

def trim(a, pad=12):
    ys, xs = np.where(a[..., 3] > 10)
    y0, y1, x0, x1 = max(ys.min() - pad, 0), min(ys.max() + pad + 1, a.shape[0]), max(xs.min() - pad, 0), min(xs.max() + pad + 1, a.shape[1])
    return a[y0:y1, x0:x1].copy(), (int(x0), int(y0))

def normalise(a):
    rgb = a[..., :3].astype(float); op = a[..., 3] == 255
    D = np.stack([np.sqrt(((rgb - c) ** 2).sum(2)) for c in PAL])  # nearest palette colour wins
    k = D.argmin(0); m = op & (D.min(0) < 40)
    rgb[m] = PAL[k[m]]
    d = np.sqrt((rgb ** 2).sum(2)); rgb[op & (d < 25)] = 0
    a[..., :3] = rgb.astype(np.uint8); return a

def head_feet(a):
    al = a[..., 3]; h, w = al.shape
    white = ((a[..., :3].astype(int).sum(2) > 600) & (al > 128)).astype(np.uint8)
    ff = white.copy(); cv2.floodFill(ff, np.zeros((h + 2, w + 2), np.uint8), (0, 0), 2)
    solid = np.where(ff == 2, 0, 1).astype(np.uint8)
    dt = cv2.distanceTransform(solid, cv2.DIST_L2, 5)
    hy, hx = np.unravel_index(dt.argmax(), dt.shape)
    ys, xs = np.where(al > 128); yb = ys.max(); band = ys > yb - 0.035 * (yb - ys.min())
    return dict(head=[int(hx), int(hy), round(float(dt[hy, hx]), 1)], feet=[round(float(xs[band].mean()), 1), int(yb)])

info = {}
def save(name, a, char=True, extra=None):
    if char: a = normalise(a)
    a, off = trim(a)
    Image.fromarray(a, 'RGBA').save(f'{OUT}/{name}.png', optimize=True)
    d = dict(w=a.shape[1], h=a.shape[0])
    if char: d.update(head_feet(a))
    if extra: d.update(extra(a))
    info[name] = d
    return a, off

for n in ['hero_hold', 'windup', 'throw_follow', 'shocked_cu', 'shocked_full']:
    save(n, load(n))

# astronaut: measure on the plain white pixels, then turn the green-tinted helmet glass into pale blue glass
a = normalise(load('astronaut_toss'))
a, off = trim(a)
hf = head_feet(a)
rgb = a[..., :3].astype(int); al = a[..., 3]
greenish = (rgb[..., 1] > rgb[..., 0] + 25) & (rgb[..., 1] > rgb[..., 2] + 25) & (al > 0)
a[greenish, :3] = [206, 232, 246]
a[greenish, 3] = np.minimum(al[greenish], 150)
Image.fromarray(a, 'RGBA').save(f'{OUT}/astronaut_toss.png', optimize=True)
info['astronaut_toss'] = dict(w=a.shape[1], h=a.shape[0], **hf, glass_px=int(greenish.sum()))

# props
save('trash_bag', load('trash_bag'), char=False)
def disc(a):
    al = (a[..., 3] > 128).astype(np.uint8)
    dt = cv2.distanceTransform(al, cv2.DIST_L2, 5); y, x = np.unravel_index(dt.argmax(), dt.shape)
    return dict(disc=[int(x), int(y), round(float(dt[y, x]), 1)])
save('moon', load('moon'), char=False, extra=disc)

# lander: split ascent / descent stage at the dark seam line between the grey cabin and the gold foil
L = load('lunar_module'); rgb = L[..., :3].astype(int); al = L[..., 3]
dark = (rgb.sum(2) < 150) & (al > 128)
ys, xs = np.where(al > 128); cx0, cx1 = xs.min(), xs.max()
rows = list(range(490, 525)); dk = [dark[y, cx0:cx1].sum() for y in rows]
yline = rows[int(np.argmax(dk))]
y0 = yline - 6; y1 = yline + 6
while y0 > 470 and dark[y0, cx0:cx1].sum() > 0.5 * max(dk): y0 -= 1
while y1 < 540 and dark[y1, cx0:cx1].sum() > 0.5 * max(dk): y1 += 1
asc = L.copy(); asc[y1 + 1:] = 0
des = L.copy(); des[:y0] = 0
full, offf = trim(L)
Image.fromarray(full, 'RGBA').save(f'{OUT}/lander.png', optimize=True)
A, oa = trim(asc); D, od = trim(des)
Image.fromarray(A, 'RGBA').save(f'{OUT}/lm_ascent.png', optimize=True)
Image.fromarray(D, 'RGBA').save(f'{OUT}/lm_descent.png', optimize=True)
info['lander'] = dict(w=full.shape[1], h=full.shape[0], seam=[int(y0 - offf[1]), int(y1 - offf[1])])
info['lm_ascent'] = dict(w=A.shape[1], h=A.shape[0], at=[oa[0] - offf[0], oa[1] - offf[1]])
info['lm_descent'] = dict(w=D.shape[1], h=D.shape[0], at=[od[0] - offf[0], od[1] - offf[1]])

# backgrounds: front layer (hill / lunar ground) as RGBA + far layer (sky) with the front region filled in
PAD = 500
def split_bg(name, front_top, fill_from):
    b = np.asarray(Image.open(f'raw/{name}.png').convert('RGB')).copy(); h, w, _ = b.shape
    top = np.array([front_top(b, x) for x in range(w)])
    top = np.array([np.median(top[max(0, x - 12):x + 13]) for x in range(w)])  # drop outliers (tufts, rocks)
    top = np.round(cv2.GaussianBlur(top.astype(np.float32).reshape(1, -1), (1, 9), 0).ravel()).astype(int)
    front = np.zeros((h, w, 4), np.uint8); front[..., :3] = b
    yy = np.arange(h)[:, None]
    front[..., 3] = np.where(yy >= top[None, :], 255, 0)
    sky = b.copy()
    fills = []
    for x in range(w):  # median non-outline colour just above the front edge
        band = b[max(top[x] - 3 * fill_from, 0):max(top[x] - fill_from, 1), x].astype(int)
        lit = band[band.sum(1) > 90]
        fills.append(np.median(lit if len(lit) > 3 else band, 0))
    fills = np.array(fills, float)
    for c in range(3):
        v = fills[:, c]; ok = ~np.isnan(v); v[~ok] = np.interp(np.where(~ok)[0], np.where(ok)[0], v[ok]); fills[:, c] = v
    fills = np.array([np.median(fills[max(0, x - 20):x + 21], 0) for x in range(w)])
    for x in range(w):
        sky[top[x] - 2:, x] = fills[x].astype(np.uint8)
    Image.fromarray(front, 'RGBA').save(f'{OUT}/{name}_front.png', optimize=True)
    # pad the sky upward (the camera tilts above the plate): repeat a smoothed copy of the top band's colour
    row = np.median(sky[:40], 0).astype(np.uint8)[None].repeat(PAD, 0)
    Image.fromarray(np.concatenate([row, sky], 0)).save(f'{OUT}/{name}_sky.png', optimize=True)
    info[name] = dict(w=w, h=h, pad=PAD, top=[int(v) for v in top[::16]])  # front top every 16 px

def hill_top(b, x):  # first light-green row of the front hill, minus its black outline (~6 px)
    col = b[950:1300, x].astype(int); light = (col[:, 1] > 115) & (col[:, 1] > col[:, 2] + 40) & (col[:, 0] < col[:, 1] - 25)
    run = np.convolve(light, np.ones(8), 'valid') >= 8
    return 950 + int(np.argmax(run)) - 7
def ground_top(b, x):  # first light-grey row below the black lunar sky
    col = b[900:1200, x].astype(int).sum(1) > 420
    run = np.convolve(col, np.ones(10), 'valid') >= 10
    return 900 + int(np.argmax(run)) - 5
split_bg('bg_night', hill_top, 10)
split_bg('bg_lunar', ground_top, 8)

os.makedirs('../../src/moon-trash', exist_ok=True)
with open('../../src/moon-trash/sprites.ts', 'w') as f:
    f.write('// generated by images/moon-trash/prep.py\nexport const SPR = ' + json.dumps(info, indent=1) + ' as const;\n')
print(json.dumps({k: {kk: vv for kk, vv in v.items() if kk != 'top'} for k, v in info.items()}, indent=0))
print('night top', info['bg_night']['top']); print('lunar top', info['bg_lunar']['top'])
