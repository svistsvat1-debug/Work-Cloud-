# prep.py - split pose sheets, trim, normalise colours, measure anchors
# -> public/satellite-storm/*.png + src/satellite-storm/sprites.ts   (run from images/satellite-storm)
import json, os
import numpy as np, cv2
from PIL import Image

OUT = '../../public/satellite-storm'
os.makedirs(OUT, exist_ok=True)
# channel palette (memory/STYLE.md) + this video's add-ons (headset cup #424141, chair red #EC2F32, frame #D3D3D3)
PAL = np.array([[254, 253, 253], [237, 235, 235], [252, 141, 144], [66, 65, 65], [236, 47, 50], [211, 211, 211]], float)  # + headset cup, chair red, chair frame grey

def load(n): return np.asarray(Image.open(f'keyed/{n}.png').convert('RGBA')).copy()

def despill(a):  # greenish / magenta leftovers of the key -> transparent (nothing here is green or magenta)
    r, g, b = [a[..., i].astype(int) for i in range(3)]
    a[(g > r + 25) & (g > b + 25), 3] = 0
    a[(r > g + 60) & (b > g + 60) & (r > 150) & (b > 150), 3] = 0
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
def ray_head(a, rng, r0=None):
    """rays from a seed centre to the silhouette edge inside an angle range + least-squares circle fit (memory/STYLE.md)"""
    al = a[..., 3] > 128; h, w = al.shape
    ys, xs = np.where(al); y0 = ys.min()
    top = al[y0:y0 + 30]; tx = np.where(top.any(0))[0]; x = float(tx.mean())
    r = r0 or 0.33 * w; y = y0 + r
    for it in range(6):
        pts = []
        for ang in np.radians(np.arange(rng[0], rng[1], 2)):
            dx, dy = np.cos(ang), np.sin(ang)
            for d in np.arange(0.5 * r, 1.6 * r, 1.0):
                px, py = int(round(x + dx * d)), int(round(y + dy * d))
                if px < 0 or py < 0 or px >= w or py >= h or not al[py, px]:
                    pts.append((x + dx * d, y + dy * d)); break
        P = np.array(pts); dist = np.hypot(P[:, 0] - x, P[:, 1] - y); med = np.median(dist)
        P = P[np.abs(dist - med) < 0.08 * med]
        A = np.c_[2 * P[:, 0], 2 * P[:, 1], np.ones(len(P))]; b = (P ** 2).sum(1)
        cx, cy, c = np.linalg.lstsq(A, b, rcond=None)[0]; x, y, r = cx, cy, np.sqrt(c + cx * cx + cy * cy)
    return [float(x), float(y), float(r)]
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


top = lambda a: extreme(a, lambda x, y: -y, 20)
left = lambda a: extreme(a, lambda x, y: -x, 20)
save('hero', load('hero'), extra=lambda a: dict(finger=top(a)))
for sheet, names in [('chair3', ['relax', 'shrug', 'wish']), ('ctrl3', ['press', 'cheeks', 'sad']), ('car3', ['ride', 'shade', 'wave'])]:
    parts = split_n(load(sheet), 3)
    for nm, p in zip(names, parts):
        ex = None
        if nm == 'ride': ex = lambda a: dict(hand=left(a))
        if nm == 'wave': ex = lambda a: dict(hand=extreme(a, lambda x, y: x - y, 25))
        a2 = save(nm, p, extra=ex)
        if sheet == 'chair3':  # the chair is the widest round part: ray fit on the upper head arc (heads2.py method)
            info[nm]['head'] = ray_head(a2, (-160, -20))
# props (magenta key): rocket stage + satellite, no colour normalising
R, S = split_n(load('props2'), 2)
rk = save('stage', R, guy=False)
sat = save('sat', S, guy=False)
rgb = sat[..., :3].astype(int); al = sat[..., 3]
body = (abs(rgb[..., 0] - rgb[..., 1]) < 14) & (abs(rgb[..., 1] - rgb[..., 2]) < 14) & (rgb[..., 0] > 150) & (al > 200)
ys, xs = np.where(body)
# body = the grey box (left part); keep only columns left of the panel arm
panel = (rgb[..., 2] > rgb[..., 0] + 40) & (al > 200)
px = np.where(panel)[1]
info['sat']['panel_x0'] = int(px.min())
selb = xs < px.min() - 30
info['sat']['body'] = dict(x0=int(xs[selb].min()), x1=int(xs[selb].max()), y0=int(ys[selb].min()), y1=int(ys[selb].max()),
                           cx=float(xs[selb].mean()), cy=float(ys[selb].mean()))
print('sat body', info['sat']['body'], 'panel x0', px.min())
rgb = rk[..., :3].astype(int); al = rk[..., 3]
# rocket: top rim (first opaque row) and nozzle bottom
info['stage']['topY'] = int(np.where(al.max(1) > 128)[0][0])
bg = Image.open('raw/space.png').convert('RGB'); bg.save(f'{OUT}/space.png', optimize=True); info['space'] = dict(w=bg.width, h=bg.height)
os.makedirs('../../src/satellite-storm', exist_ok=True)
open('../../src/satellite-storm/sprites.ts', 'w').write('// generated by images/satellite-storm/prep.py\nexport const SPR = ' + json.dumps(info) + ' as const;\n')
for k, v in info.items(): print(k, v.get('w'), v.get('h'), 'head', [round(t) for t in v['head']] if 'head' in v else '-', 'feet', v.get('feet'))
