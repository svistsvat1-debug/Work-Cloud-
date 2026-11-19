# prep.py - split the pose / object sheets, trim, normalise colours, measure anchors
# -> public/roswell-balloon/*.png + src/roswell-balloon/sprites.ts   (run from images/roswell-balloon)
import json, os
import numpy as np, cv2
from PIL import Image
OUT = '../../public/roswell-balloon'
os.makedirs(OUT, exist_ok=True)
exec(open('prep_lib.py').read())   # load, despill, trim, normalise, feet, head_disc, box, split_n, drop_specks, fix_outline
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

def save(name, a, guy=True, pad=12):
    a = despill(a)
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
    print(name, a.shape[1], 'x', a.shape[0], 'head', [round(v, 1) for v in d['hw']] if guy else '')
    return a

def extreme(a, fn, mask=None):
    al = a[..., 3] > 128
    if mask is not None: al &= mask
    ys, xs = np.where(al); i = np.argmax(fn(xs, ys)); return [int(xs[i]), int(ys[i])]

def biggest_white_rect(a, above_y=None, below_y=None):
    rgb = a[..., :3].astype(int); op = a[..., 3] > 200
    wht = op & (rgb.sum(2) > 650)
    if above_y is not None: wht[int(above_y):, :] = False
    if below_y is not None: wht[:int(below_y), :] = False
    n, lab, st, _ = cv2.connectedComponentsWithStats(wht.astype(np.uint8), connectivity=4)
    i = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA])); x, y, w, h, _ = st[i]
    return [int(x), int(y), int(x + w), int(y + h)]

# ---- the rancher (brown cowboy hat) ----
a = save('puzzle', load('hero'))
rgb = a[..., :3].astype(int); op = a[..., 3] > 200
foil = op & (np.abs(rgb[..., 0] - rgb[..., 2]) < 20) & (rgb.sum(2) > 420) & (rgb.sum(2) < 700)
foil[:, : int(a.shape[1] * 0.6)] = False
ys, xs = np.where(foil); info['puzzle']['foil'] = [float(xs.mean()), float(ys.mean()), float(xs.max() - xs.min())]
for nm, p in zip(['r_up', 'r_paper', 'r_shrug'], split_n(load('rancher3'), 3)):
    a = save(nm, p)
    if nm == 'r_paper':
        hx, hy, R = info[nm]['hw']
        info[nm]['paper'] = biggest_white_rect(a, below_y=hy + 0.9 * R)
# ---- the officer (olive cap) ----
for nm, p in zip(['o_mega', 'o_sign', 'o_shh'], split_n(load('officer3'), 3)):
    a = save(nm, p)
    if nm == 'o_sign':
        hx, hy, R = info[nm]['hw']
        info[nm]['board'] = biggest_white_rect(a, above_y=hy - 0.5 * R)
    if nm == 'o_mega': info[nm]['bell'] = extreme(a, lambda x, y: x)
# ---- the tinfoil-hat fan ----
for nm, p in zip(['f_point', 'f_arms', 'f_shock'], split_n(load('fan3'), 3)):
    a = save(nm, p)
    if nm == 'f_point': info[nm]['tip'] = extreme(a, lambda x, y: x)
# ---- objects ----
kite, debris, saucer = split_n(load('objects'), 3)
# the kite's see-through panel kept some key green: paint it as a foil panel (shade) before the despill
r, g, b = [kite[..., i].astype(int) for i in range(3)]
gm = (kite[..., 3] > 10) & (g > r + 25) & (g > b + 25)
kite[gm, :3] = np.array([0xB4, 0xBA, 0xC1], np.uint8); kite[gm, 3] = 255
print('kite green panel px', int(gm.sum()))
save('kite', kite, guy=False)
save('debris', debris, guy=False)
save('saucer', saucer, guy=False)
# ---- plates (not keyed) ----
for nm in ['ranch', 'base', 'sky']:
    im = Image.open(f'raw/{nm}.png').convert('RGB'); im.save(f'{OUT}/{nm}.png', optimize=True)
    info[nm] = dict(w=im.size[0], h=im.size[1])
def first_row(nm, cond, x0, x1, y_from=0):
    a = np.asarray(Image.open(f'raw/{nm}.png').convert('RGB')).astype(int)
    colm = a[:, x0:x1].mean(1)
    rows = [y for y in range(y_from, a.shape[0]) if cond(colm[y])]
    return rows[0] if rows else None
# ranch: horizon = first sandy row in the middle columns (r > b + 60)
info['ranch']['horizon'] = first_row('ranch', lambda c: c[0] - c[2] > 60, 420, 600, 300)
# base: horizon = first grey concrete row below the sky in the middle (|r-b| < 20, not blue)
info['base']['horizon'] = first_row('base', lambda c: abs(c[0] - c[2]) < 18 and c[0] < 215, 380, 560, 400)
# sky: cloud line = first near-white row in the middle columns
info['sky']['cloud'] = first_row('sky', lambda c: c.min() > 225, 300, 700, 300)
json.dump(info, open('sprites.json', 'w'), indent=1)
os.makedirs('../../src/roswell-balloon', exist_ok=True)
with open('../../src/roswell-balloon/sprites.ts', 'w') as f:
    f.write('// generated by images/roswell-balloon/prep.py - sprite sizes and anchors (sprite px)\n')
    f.write('export const SP = ' + json.dumps(info) + ' as const;\n')
for k, v in info.items():
    print(k, {kk: vv for kk, vv in v.items() if kk not in ('left', 'right', 'top', 'bottom')})
