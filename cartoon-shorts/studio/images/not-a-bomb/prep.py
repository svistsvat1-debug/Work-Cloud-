# prep.py - split the pose / object sheets, trim, normalise colours, measure anchors
# -> public/not-a-bomb/*.png + src/not-a-bomb/sprites.ts   (run from images/not-a-bomb)
import json, os, shutil
import numpy as np, cv2
from PIL import Image
OUT = '../../public/not-a-bomb'
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

def despill_mag(a, k=40):
    r, g, b = [a[..., i].astype(int) for i in range(3)]
    a[(r > g + k) & (b > g + k), 3] = 0
    return a

def save(name, a, guy=True, pad=12, mag=False):
    a = despill_mag(a) if mag else despill(a)
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
    print(name, a.shape[1], 'x', a.shape[0], 'head r', round(d['hd'][2], 1) if guy else '')
    return a

def extreme(a, fn, mask=None):
    al = a[..., 3] > 128
    if mask is not None: al &= mask
    ys, xs = np.where(al); i = np.argmax(fn(xs, ys)); return [int(xs[i]), int(ys[i])]

# ---- the officer (white peaked cap) ----
a = save('salute', load('hero'))
for nm, p in zip(['binoc', 'sign', 'proud'], split_n(load('officer3'), 3)):
    a = save(nm, p)
    if nm == 'sign':   # the blank white board: biggest bright component above the head
        rgb = a[..., :3].astype(int); op = a[..., 3] > 200
        hx, hy, R = info[nm]['hd']
        wht = op & (rgb.sum(2) > 650)
        wht[int(hy - 0.6 * R):, :] = False
        n, lab, st, _ = cv2.connectedComponentsWithStats(wht.astype(np.uint8), connectivity=4)
        i = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA])); x, y, w, h, _ = st[i]
        info[nm]['board'] = [int(x), int(y), int(x + w), int(y + h)]
    if nm == 'proud':
        info[nm]['palm'] = extreme(a, lambda x, y: -x)
# ---- the fisherman (yellow sou'wester) ----
for nm, p in zip(['f_up', 'f_shock', 'f_down'], split_n(load('fisher3'), 3)):
    a = save(nm, p)
    if nm == 'f_up': info[nm]['tip'] = extreme(a, lambda x, y: x - y)
    if nm == 'f_down': info[nm]['tip'] = extreme(a, lambda x, y: -x + 0.3 * y)
# ---- the reporter (brown fedora) ----
for nm, p in zip(['p_cam', 'p_mic', 'p_note'], split_n(load('press3'), 3)):
    a = save(nm, p)
    if nm == 'p_cam':   # flash dish: light grey pixels in the top-left quarter
        rgb = a[..., :3].astype(int); op = a[..., 3] > 200
        grey = op & (np.abs(rgb[..., 0] - rgb[..., 2]) < 18) & (rgb.sum(2) > 360) & (rgb.sum(2) < 640)
        grey[int(a.shape[0] * 0.45):, :] = False; grey[:, int(a.shape[1] * 0.45):] = False
        ys, xs = np.where(grey); info[nm]['flash'] = [float(xs.mean()), float(ys.mean())] if len(xs) else [0.1 * a.shape[1], 0.15 * a.shape[0]]
    if nm == 'p_mic': info[nm]['mic'] = extreme(a, lambda x, y: -x - 0.2 * y)
# ---- objects (magenta key) ----
bomb, boat = split_n(load('objects'), 2)
a = save('bomb', bomb, guy=False, mag=True)
rgb = a[..., :3].astype(int); op = a[..., 3] > 200
ys, xs = np.where(op)
info['bomb']['nose'] = extreme(a, lambda x, y: -x)
info['bomb']['tail'] = extreme(a, lambda x, y: x)
info['bomb']['lugTop'] = extreme(a, lambda x, y: -y)
# body rows: columns between 15 % and 55 % of the length -> top / bottom of the body
L = xs.max() - xs.min()
cols = [int(xs.min() + f * L) for f in (0.2, 0.35, 0.5)]
tb = []
for c in cols:
    yy = np.where(op[:, c])[0]; tb.append([int(c), int(yy.min()), int(yy.max())])
info['bomb']['body'] = tb
a = save('boat', boat, guy=False, mag=True)
rgb = a[..., :3].astype(int); op = a[..., 3] > 200
blue = op & (rgb[..., 2] > 150) & (rgb[..., 0] < 110)
ys, xs = np.where(blue)
info['boat']['stripe'] = [int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())]
# gunwale top: for columns across the hull, the first opaque row below the mast area
gw = []
for f in np.linspace(0.08, 0.92, 13):
    c = int(xs.min() + f * (xs.max() - xs.min()))
    col = np.where(op[:, c])[0]
    # skip the mast (thin) - take the first row where the row run is wide
    top = None
    for y in col:
        if op[y, max(c - 6, 0):c + 7].all() and (rgb[y, c].sum() < 200 or True):
            # mast is ~10 px wide; require 30 px wide opaque run
            if op[y, max(c - 15, 0):c + 16].all(): top = int(y); break
    gw.append([c, top])
info['boat']['gunwale'] = gw
yk = np.where(op)[0]; info['boat']['keel'] = int(yk.max())

# ---- plates (not keyed) ----
for nm in ['sea', 'deep', 'deck']:
    im = Image.open(f'raw/{nm}.png').convert('RGB'); im.save(f'{OUT}/{nm}.png', optimize=True)
    a = np.asarray(im).astype(int); info[nm] = dict(w=a.shape[1], h=a.shape[0])
# sea: horizon = first row (scanning down the right half) where blue sea starts (b > r + 100 and g < 170)
a = np.asarray(Image.open('raw/sea.png').convert('RGB')).astype(int)
colm = a[:, 600:1000].mean(1)
sea_rows = np.where((colm[:, 2] - colm[:, 0] > 120) & (colm[:, 1] < 175))[0]
info['sea']['horizon'] = int(sea_rows.min())
# deep: slope top surface y for x every 16 px (first non-water row: water is dark blue b > r + 40)
a = np.asarray(Image.open('raw/deep.png').convert('RGB')).astype(int)
prof = []
for x in range(0, a.shape[1], 16):
    col = a[:, x]
    rock = np.where((col[:, 2] - col[:, 0] < 25) & (col.sum(1) > 60))[0]
    rock = rock[rock > 200]
    prof.append([x, int(rock.min()) if len(rock) else a.shape[0]])
info['deep']['slope'] = prof
# deck: horizon (sky -> sea), rail top, deck edge (first grey row below the rail)
a = np.asarray(Image.open('raw/deck.png').convert('RGB')).astype(int)
colm = a[:, 120:200].mean(1)
seaR = np.where((colm[:, 2] - colm[:, 0] > 120) & (colm[:, 1] < 175))[0]
info['deck']['horizon'] = int(seaR.min())
grey = np.where((np.abs(colm[:, 0] - colm[:, 2]) < 22) & (colm[:, 0] > 90) & (colm[:, 0] < 170))[0]
grey = grey[grey > info['deck']['horizon'] + 40]
info['deck']['deckTop'] = int(grey.min())
json.dump(info, open('sprites.json', 'w'), indent=1)
os.makedirs('../../src/not-a-bomb', exist_ok=True)
with open('../../src/not-a-bomb/sprites.ts', 'w') as f:
    f.write('// generated by images/not-a-bomb/prep.py - sprite sizes and anchors (sprite px)\n')
    f.write('export const SP = ' + json.dumps(info) + ' as const;\n')
print(json.dumps({k: {kk: vv for kk, vv in v.items() if kk in ('w', 'h', 'hd', 'board', 'palm', 'tip', 'flash', 'mic', 'nose', 'tail', 'lugTop', 'body', 'stripe', 'keel', 'horizon', 'deckTop', 'gunwale')} for k, v in info.items()}, indent=0)[:4000])
# ---- railing foreground layer (cut out of the deck plate: the sea / sky pixels between the bars become transparent) ----
# (done in a second pass: rows 664-870 of raw/deck.png, blue pixels -> alpha 0, eroded 1 px) -> public/not-a-bomb/rail.png
# info['rail'] = {w, h, y0: 664}; measured lines: sea horizon 778, deck horizon 582, deck edge 860, rail top 680 (native px)
