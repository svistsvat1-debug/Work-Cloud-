# prep.py - split the pose / object sheets, trim, normalise colours, measure anchors
# -> public/titanic-cover/*.png + src/titanic-cover/sprites.ts   (run from images/titanic-cover)
import json, os
import numpy as np, cv2
from PIL import Image
OUT = '../../public/titanic-cover'
os.makedirs(OUT, exist_ok=True)
exec(open('prep_lib.py').read())   # load, despill, trim, normalise, feet, head_disc, box, split_n, drop_specks, fix_outline, find_eyes

info = {}
def white_head(a):
    w = ((a[..., :3].astype(int).sum(2) > 560) & (a[..., 3] > 200)).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(w, connectivity=4)
    best = None
    for i in range(1, n):
        m = (lab == i).astype(np.uint8)
        inv = (1 - np.pad(m, 1)).astype(np.uint8); cv2.floodFill(inv, None, (0, 0), 2)
        filled = np.where(inv == 2, 0, 1)[1:-1, 1:-1].astype(np.uint8)
        dt = cv2.distanceTransform(filled, cv2.DIST_L2, 5); r = float(dt.max())
        if best is None or r > best[2]:
            y, x = np.unravel_index(dt.argmax(), dt.shape); best = [float(x), float(y), r]
    return best

def despill_strong(a, k=18):
    r, g, b = [a[..., i].astype(int) for i in range(3)]
    a[(g > r + k) & (g > b + k), 3] = 0
    return a

def save(name, a, guy=True, pad=12, strong=False):
    a = despill_strong(a) if strong else despill(a)
    a = drop_specks(a)
    if guy:
        a = normalise(a)
        a, nfix = fix_outline(a)
        if nfix: print('   outline fixed', name, nfix, 'px')
    a, off = trim(a, pad)
    Image.fromarray(a, 'RGBA').save(f'{OUT}/{name}.png', optimize=True)
    d = dict(w=a.shape[1], h=a.shape[0], feet=feet(a), **box(a))
    if guy: d['hw'] = white_head(a); d['hd'] = head_disc(a)
    info[name] = d
    return a

def extreme(a, fn, mask=None):
    al = a[..., 3] > 128
    if mask is not None: al &= mask
    ys, xs = np.where(al); i = np.argmax(fn(xs, ys)); return [int(xs[i]), int(ys[i])]

def red_cover(a):
    """the dark-red book cover: bbox of the biggest red component (front cover + spine)"""
    rgb = a[..., :3].astype(int); op = a[..., 3] > 200
    red = op & (rgb[..., 0] > 110) & (rgb[..., 1] < 80) & (rgb[..., 2] < 80)
    n, lab, st, _ = cv2.connectedComponentsWithStats(red.astype(np.uint8), connectivity=8)
    i = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
    x, y, w, h, _ = st[i]
    return [int(x), int(y), int(x + w), int(y + h)]

# ---- the hunter (navy watch cap) ----
a = save('hero', load('hero'))
H, W = a.shape[:2]
info['hero']['palm'] = extreme(a, lambda x, y: x)                       # the far (right) open palm
for nm, p in zip(['book', 'worried', 'idea'], split_n(load('hunter3'), 3)):
    a = save(nm, p)
    if nm == 'book': info[nm]['cover'] = red_cover(a)
    if nm == 'idea': info[nm]['tip'] = extreme(a, lambda x, y: -y - 10000 * (x < 0.55 * a.shape[1]))   # finger tip
for nm, p in zip(['doze', 'joy', 'proud'], split_n(load('hunter3b'), 3)):
    a = save(nm, p)
    if nm == 'proud': info[nm]['cover'] = red_cover(a)
# ---- the navy officer (white peaked cap) ----
for nm, p in zip(['hand', 'shh', 'facepalm'], split_n(load('officer3'), 3)):
    a = save(nm, p)
    if nm == 'hand': info[nm]['palm'] = extreme(a, lambda x, y: -x)     # the open palm (leftmost)

# ---- objects ----
a = save('ship', load('ship'), guy=False, strong=True)
rgb = a[..., :3].astype(int); op = a[..., 3] > 200
org = op & (rgb[..., 0] > 200) & (rgb[..., 1] > 100) & (rgb[..., 1] < 175) & (rgb[..., 2] < 80)
ys, xs = np.where(org)
info['ship']['aframe'] = [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())]
red = op & (rgb[..., 0] > 150) & (rgb[..., 1] < 70) & (rgb[..., 2] < 70)
ys, xs = np.where(red); info['ship']['redTop'] = int(np.percentile(ys, 5)); info['ship']['keel'] = int(ys.max())
print('ship', info['ship'])

sled, boiler = split_n(despill_strong(load('sled_boiler')), 2)
a = save('sled', sled, guy=False, strong=True)
# camera lenses: the two biggest near-black discs
rgb = a[..., :3].astype(int); op = a[..., 3] > 200
dk = (op & (rgb.sum(2) < 110)).astype(np.uint8)
n, lab, st, cen = cv2.connectedComponentsWithStats(dk, connectivity=8)
blobs = sorted([(st[i, cv2.CC_STAT_AREA], cen[i], st[i]) for i in range(1, n)], key=lambda b: -b[0])
lens = []
for area, c, s in blobs:
    x, y, w, h, _ = s
    if 0.6 < w / max(h, 1) < 1.6 and w > 40: lens.append([float(c[0]), float(c[1]), float(max(w, h) / 2)])
    if len(lens) == 2: break
lens.sort(key=lambda l: l[0]); info['sled']['lens'] = lens
info['sled']['top'] = extreme(a, lambda x, y: -y)
print('sled', info['sled'])
save('boiler', boiler, guy=False, strong=True)

# the submarine: three hull pieces + loose bits (all separate sprites)
s = despill_strong(load('sub'))
m = (s[..., 3] > 10).astype(np.uint8)
n, lab, st, _ = cv2.connectedComponentsWithStats(cv2.dilate(m, np.ones((5, 5), np.uint8)), connectivity=8)
idx = sorted(range(1, n), key=lambda i: st[i, cv2.CC_STAT_AREA], reverse=True)
pieces = sorted(idx[:3], key=lambda i: st[i, cv2.CC_STAT_LEFT])
bits = sorted([i for i in idx[3:] if st[i, cv2.CC_STAT_AREA] > 300], key=lambda i: st[i, cv2.CC_STAT_LEFT])
sub_layout = {}
for nm, i in zip(['subA', 'subB', 'subC'], pieces):
    p = s.copy(); p[lab != i, 3] = 0; save(nm, p, guy=False, pad=8)
    sub_layout[nm] = [int(st[i, 0]), int(st[i, 1]), int(st[i, 2]), int(st[i, 3])]
for k, i in enumerate(bits):
    p = s.copy(); p[lab != i, 3] = 0; save(f'bit{k}', p, guy=False, pad=6)
    sub_layout[f'bit{k}'] = [int(st[i, 0]), int(st[i, 1]), int(st[i, 2]), int(st[i, 3])]
info['subLayout'] = sub_layout
print('sub pieces', len(pieces), 'bits', len(bits))

save('bow', load('bow'), guy=False, strong=True)

# ---- the night plate: horizon + colours ----
b = np.asarray(Image.open('raw/night.png').convert('RGB')).astype(int)
Hh, Ww = b.shape[:2]
Image.fromarray(b.astype(np.uint8)).save(f'{OUT}/night.png', optimize=True)
dark = b.sum(2) < 90
hor = [int(np.argmax(dark[700:950, x]) + 700) for x in range(400, 1000, 20) if dark[700:950, x].any()]
horizon = int(np.median(hor)) if hor else int(0.55 * Hh)
cols = {k: '#%02x%02x%02x' % tuple(int(v) for v in b[y, x]) for k, (x, y) in
        dict(sky=(700, 20), skyLow=(700, horizon - 20), seaTop=(700, horizon + 20), sea=(700, 1300), seaLow=(700, 1520)).items()}
info['night'] = dict(w=Ww, h=Hh, horizon=horizon, cols=cols)
print('night', info['night'])

# hero eyes (for a code blink)
for nm in ['hero']:
    h = np.asarray(Image.open(f'{OUT}/{nm}.png')).copy()
    info[nm]['eyes'] = find_eyes(h, head_disc(h))
os.makedirs('../../src/titanic-cover', exist_ok=True)
open('../../src/titanic-cover/sprites.ts', 'w').write('// generated by images/titanic-cover/prep.py\nexport const SPR = ' + json.dumps(info) + ' as const;\n')
for k, v in info.items():
    if not isinstance(v, dict) or 'w' not in v: continue
    print(k, v.get('w'), v.get('h'), 'hd', [round(t) for t in v['hd']] if 'hd' in v else '-', 'feet', [round(t) for t in v.get('feet', [0, 0])],
          {kk: vv for kk, vv in v.items() if kk in ('palm', 'tip', 'cover', 'lens', 'eyes')})
