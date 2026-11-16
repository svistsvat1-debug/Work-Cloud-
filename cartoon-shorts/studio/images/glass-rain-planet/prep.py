# prep.py - split pose sheets, trim, normalise colours, measure anchors
# -> public/glass-rain-planet/*.png + src/glass-rain-planet/sprites.ts   (run from images/glass-rain-planet)
import json, os
import numpy as np, cv2
from PIL import Image

OUT = '../../public/glass-rain-planet'
os.makedirs(OUT, exist_ok=True)
# channel palette (memory/STYLE.md) + this video's swim add-ons (measured on the hero)
PAL = np.array([[254, 253, 253], [237, 235, 235], [252, 141, 144], [241, 48, 29], [90, 203, 246], [28, 127, 188]], float)

def load(n): return np.asarray(Image.open(f'keyed/{n}.png').convert('RGBA')).copy()

def despill(a):  # greenish leftovers of the key -> transparent (the character has no green)
    r, g, b = [a[..., i].astype(int) for i in range(3)]
    a[(g > r + 25) & (g > b + 25), 3] = 0
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

def head_disc(a, top_frac=1.0):
    h, w = a.shape[:2]
    a8 = np.pad((a[..., 3] > 128).astype(np.uint8), 2); ff = a8.copy()
    cv2.floodFill(ff, np.zeros((h + 6, w + 6), np.uint8), (0, 0), 2)
    solid = np.where(ff == 2, 0, 1).astype(np.uint8)[2:-2, 2:-2]
    dt = cv2.distanceTransform(solid, cv2.DIST_L2, 5)
    hy, hx = np.unravel_index(dt.argmax(), dt.shape)
    return [float(hx), float(hy), float(dt[hy, hx])]

def box(a):
    ys, xs = np.where(a[..., 3] > 128)
    return dict(left=int(xs.min()), right=int(xs.max()), top=int(ys.min()), bottom=int(ys.max()))

def split_n(a, n):
    """split a sheet into its n biggest blobs (left to right); drop small loose bits such as motion marks"""
    m = (a[..., 3] > 10).astype(np.uint8)
    m2 = cv2.dilate(m, np.ones((9, 9), np.uint8))  # join pieces that nearly touch
    cnt, lab, stats, _ = cv2.connectedComponentsWithStats(m2, connectivity=8)
    idx = sorted(range(1, cnt), key=lambda i: stats[i, cv2.CC_STAT_AREA], reverse=True)[:n]
    idx.sort(key=lambda i: stats[i, cv2.CC_STAT_LEFT])
    out = []
    for i in idx:
        sub = a.copy(); sub[lab != i, 3] = 0; out.append(sub)
    small = [int(stats[i, cv2.CC_STAT_AREA]) for i in range(1, cnt) if i not in idx]
    if small: print('   dropped loose bits', small)
    return out

def drop_specks(a, min_area=60):
    """remove tiny loose opaque specks inside one sprite (after the split)"""
    m = (a[..., 3] > 10).astype(np.uint8)
    cnt, lab, stats, _ = cv2.connectedComponentsWithStats(m, connectivity=8)
    for i in range(1, cnt):
        if stats[i, cv2.CC_STAT_AREA] < min_area: a[lab == i, 3] = 0
    return a


def fix_outline(a, out_px=4, in_px=2):
    """paint the black outline back where a LOW picture left white fill touching the silhouette edge"""
    m = (a[..., 3] > 128).astype(np.uint8)
    er = cv2.erode(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
    inner = (m > 0) & (er == 0)
    light = inner & (a[..., :3].astype(int).sum(2) > 400)
    lab_n, lab = cv2.connectedComponents(light.astype(np.uint8))
    keep = np.zeros_like(light)
    for i in range(1, lab_n):  # ignore isolated single light pixels (anti-aliasing), fix runs of >= 12 px
        if (lab == i).sum() >= 12: keep |= lab == i
    if not keep.any(): return a, 0
    k_out = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * out_px + 1, 2 * out_px + 1))
    near = cv2.dilate(keep.astype(np.uint8), k_out) > 0
    m_in = cv2.erode(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * in_px + 1, 2 * in_px + 1))) > 0
    band = near & ~m_in & (cv2.dilate(m, k_out) > 0)
    a[band, :3] = 0; a[band, 3] = 255
    return a, int(keep.sum())

info = {}
def save(name, a, guy=True, extra=None, pad=12):
    a = drop_specks(despill(a))
    if guy:
        a = normalise(a)
        a, nfix = fix_outline(a)
        if nfix: print('   outline fixed', name, nfix, 'px')
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

save('hero', load('hero'))
for sheet, names in [('jump3', ['toe', 'leap', 'ball']), ('fall3', ['star', 'pinch', 'scratch']), ('shock3', ['cheeks', 'flail', 'smug']),
                     ('wind3', ['lean', 'curl', 'hang']), ('extra3', ['crouch', 'diver', 'paddle'])]:
    if not os.path.exists(f'keyed/{sheet}.png'):
        print('missing', sheet); continue
    parts = split_n(load(sheet), 3)
    for nm, p in zip(names, parts):
        ex = None
        if nm == 'smug': ex = lambda a: dict(fist=extreme(a, lambda x, y: -y, 25))      # raised fist = top-most point
        if nm == 'hang': ex = lambda a: dict(fists=extreme(a, lambda x, y: -y, 25))
        save(nm, p, extra=ex)
L, R = split_n(load('nose2'), 2)
save('breath', L); save('yuck', R)
# ship: object (no colour normalising); measure the porthole glass (light blue) and the door
ship = save('ship', load('ship'), guy=False)
rgb = ship[..., :3].astype(int); al = ship[..., 3]
glass = (rgb[..., 2] > 200) & (rgb[..., 1] > 170) & (rgb[..., 0] < 200) & (al > 200)
ys, xs = np.where(glass)
info['ship']['port'] = [float(xs.mean()), float(ys.mean()), float((xs.max() - xs.min() + ys.max() - ys.min()) / 4)]
white = (rgb.sum(2) > 690) & (al > 200)
print('ship port', info['ship']['port'])
# plates
for n in ['space', 'sky']:
    bg = Image.open(f'raw/{n}.png').convert('RGB'); bg.save(f'{OUT}/{n}.png', optimize=True); info[n] = dict(w=bg.width, h=bg.height)
# planet rim on the space plate: top-most planet pixel per column -> circle fit
sp = np.asarray(Image.open('raw/space.png').convert('RGB')).astype(int)
H, W = sp.shape[:2]
pts = []
for x in range(20, W - 20, 8):
    col = sp[:, x]
    blue = (col[:, 2] > 150) & (col[:, 0] < 120) & (np.arange(H) > H * 0.3)
    yy = np.where(blue)[0]
    if len(yy): pts.append((x, yy[0]))
P = np.array(pts, float)
A = np.c_[2 * P[:, 0], 2 * P[:, 1], np.ones(len(P))]; bvec = (P ** 2).sum(1)
cx, cy, c = np.linalg.lstsq(A, bvec, rcond=None)[0]; r = np.sqrt(c + cx ** 2 + cy ** 2)
info['space']['planet'] = [float(cx), float(cy), float(r)]
print('planet circle', round(cx), round(cy), round(r))
os.makedirs('../../src/glass-rain-planet', exist_ok=True)
open('../../src/glass-rain-planet/sprites.ts', 'w').write('// generated by images/glass-rain-planet/prep.py\nexport const SPR = ' + json.dumps(info) + ' as const;\n')
for k, v in info.items(): print(k, v.get('w'), v.get('h'), 'head', [round(t) for t in v['head']] if 'head' in v else '-', 'feet', v.get('feet'))
