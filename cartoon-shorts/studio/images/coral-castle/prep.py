# prep.py - split the pose / object sheets, trim, normalise colours, measure anchors, the wall gap, the crane hook and the yard
# -> public/coral-castle/*.png + src/coral-castle/sprites.ts   (run from images/coral-castle)
import json, os
import numpy as np, cv2
from PIL import Image
OUT = '../../public/coral-castle'
os.makedirs(OUT, exist_ok=True)
exec(open('prep_lib.py').read())   # load, despill, trim, normalise, feet, head_disc, box, split_n, drop_specks, fix_outline

def despill_mag(a):
    r, g, b = [a[..., i].astype(int) for i in range(3)]
    a[(r > g + 60) & (b > g + 60), 3] = 0
    return a

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

def save(name, a, guy=True, key='green', pad=12):
    a = despill(a) if key == 'green' else despill_mag(a)
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

def extreme(a, fn):
    ys, xs = np.where(a[..., 3] > 128); i = np.argmax(fn(xs, ys)); return [int(xs[i]), int(ys[i])]

a = save('hero', load('hero'))
for nm, p in zip(['pull', 'finger', 'shh'], split_n(load('ed3'), 3)):
    a = save(nm, p)
    if nm == 'pull': info[nm]['fist'] = extreme(a, lambda x, y: -y)          # top of the raised fists
    if nm == 'finger': info[nm]['tip'] = extreme(a, lambda x, y: x)          # finger tip (rightmost)
for nm, p in zip(['push', 'haul', 'puzzled'], split_n(load('crew3'), 3)):
    a = save(nm, p)
    if nm == 'push': info[nm]['palm'] = extreme(a, lambda x, y: x)
    if nm == 'haul': info[nm]['fist'] = extreme(a, lambda x, y: -x - 10000 * (y > 0.6 * a.shape[0]))
for nm, p in zip(['block', 'gate', 'obelisk'], split_n(load('stones'), 3)):
    save(nm, p, guy=False)

# ---- the wall: base, top of the low wall, tower right edge, the doorway gap ----
a = save('wall', load('wall'), guy=False)
al = a[..., 3] > 128
H, W = al.shape
rows = al.sum(1)
base = int(np.where(rows > 0.3 * W)[0].max())
low_top = int(np.where(rows > 0.6 * W)[0].min())          # the low wall's top (where most columns start)
yc = (low_top + base) // 2
col = al[yc]
xs = np.where(~col)[0]; xs = xs[(xs > 0.3 * W) & (xs < 0.95 * W)]
runs = []
for x in xs:
    if not runs or x > runs[-1][1] + 1: runs.append([x, x])
    else: runs[-1][1] = x
gap = max(runs, key=lambda r: r[1] - r[0])
# tower right edge: columns whose top is far above the low wall top
tops = np.array([np.argmax(al[:, x]) if al[:, x].any() else H for x in range(W)])
tower = np.where(tops < low_top - 0.3 * (base - low_top))[0]
# the lintel over the gap: first opaque row above the gap centre
gx = (gap[0] + gap[1]) // 2
lint = np.where(al[:yc, gx])[0]
info['wall'].update(base=base, lowTop=low_top, gap=[int(gap[0]), int(gap[1])], towerRight=int(tower.max()), towerTop=int(tops[tower].min()),
                    gapTop=int(lint.max()) if len(lint) else low_top)
print('wall', info['wall'])

# ---- the crane: hook (red), boom tip, wheels bottom, cab window (light blue) ----
a = save('crane', load('crane'), guy=False, key='mag')
rgb = a[..., :3].astype(int); op = a[..., 3] > 200
red = op & (rgb[..., 0] > 170) & (rgb[..., 1] < 90) & (rgb[..., 2] < 90)
ys, xs = np.where(red); info['crane']['hook'] = [float(xs.mean()), int(ys.min()), int(ys.max())]
win = op & (rgb[..., 2] > 200) & (rgb[..., 0] < 170)
ys, xs = np.where(win); info['crane']['win'] = [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())]
print('crane', info['crane'])

# ---- the yard plate: horizon line + colours ----
b = np.asarray(Image.open('raw/yard.png').convert('RGB')).astype(int)
Hh, Ww = b.shape[:2]
Image.fromarray(b.astype(np.uint8)).save(f'{OUT}/yard.png', optimize=True)
dark = b.sum(2) < 150
hor = [int(np.argmax(dark[700:900, x]) + 700) for x in range(380, 700, 20) if dark[700:900, x].any()]
horizon = int(np.median(hor))
cols = {k: '#%02x%02x%02x' % tuple(int(v) for v in b[y, x]) for k, (x, y) in
        dict(sky=(512, 60), skyLow=(512, 700), grassTop=(512, horizon + 20), grass=(512, 1200), grassLow=(512, 1500)).items()}
info['yard'] = dict(w=Ww, h=Hh, horizon=horizon, cols=cols)
print('yard', info['yard'])

os.makedirs('../../src/coral-castle', exist_ok=True)
open('../../src/coral-castle/sprites.ts', 'w').write('// generated by images/coral-castle/prep.py\nexport const SPR = ' + json.dumps(info) + ' as const;\n')
for k, v in info.items():
    print(k, v.get('w'), v.get('h'), 'hd', [round(t) for t in v['hd']] if 'hd' in v else '-', 'feet', [round(t) for t in v.get('feet', [0, 0])],
          {kk: vv for kk, vv in v.items() if kk in ('fist', 'tip', 'palm')})

# ---- crane: cut the cable + hook out (the code draws a cable that can lower / lift the hook) ----
c = np.asarray(Image.open(f'{OUT}/crane.png')).copy()
hook = c[296:506, 0:130].copy()
hook[:4, :, 3] = 0                                           # drop the last bit of cable above the hook block
cc = c.copy(); cc[97:, :76, 3] = 0; cc[285:515, :120, 3] = 0
Image.fromarray(cc, 'RGBA').save(f'{OUT}/crane.png', optimize=True)
hk, hoff = trim(hook, 6)
Image.fromarray(hk, 'RGBA').save(f'{OUT}/hook.png', optimize=True)
ys, xs = np.where(hk[..., 3] > 128)
info['hook'] = dict(w=hk.shape[1], h=hk.shape[0], top=[float(xs[ys < ys.min() + 6].mean()), int(ys.min())], bottom=int(ys.max()))
info['crane']['tip'] = [56, 96]
print('hook', info['hook'])
open('../../src/coral-castle/sprites.ts', 'w').write('// generated by images/coral-castle/prep.py\nexport const SPR = ' + json.dumps(info) + ' as const;\n')

# hero eyes (for the code wink on the old photo) + gate face box
h = np.asarray(Image.open(f'{OUT}/hero.png')).copy()
info['hero']['eyes'] = find_eyes(h, head_disc(h))
print('hero eyes', info['hero']['eyes'])
open('../../src/coral-castle/sprites.ts', 'w').write('// generated by images/coral-castle/prep.py\nexport const SPR = ' + json.dumps(info) + ' as const;\n')
