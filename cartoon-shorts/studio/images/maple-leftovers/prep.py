# prep.py - split the sheets, trim, normalise the guy's colours, measure anchors
# -> public/maple-leftovers/*.png + plate.jpg + src/maple-leftovers/sprites.ts   (run from images/maple-leftovers)
# NOTE: magenta key everywhere; NO green despill (the leaves and the tree are green).
import json, os
import numpy as np, cv2
from PIL import Image, ImageDraw
OUT = '../../public/maple-leftovers'
os.makedirs(OUT, exist_ok=True)
exec(open('prep_lib.py').read())   # load, trim, normalise, feet, head_disc, box, split_n, drop_specks, fix_outline
info = {}

def despill_mag(a):
    r, g, b = [a[..., i].astype(int) for i in range(3)]
    a[(r > g + 90) & (b > g + 90), 3] = 0
    return a

def save(name, a, guy=True, pad=12):
    a = despill_mag(a)
    a = drop_specks(a)
    if guy:
        a = normalise(a)
        a, nfix = fix_outline(a)
        if nfix: print('   outline fixed', name, nfix, 'px')
    a, off = trim(a, pad)
    Image.fromarray(a, 'RGBA').save(f'{OUT}/{name}.png', optimize=True)
    d = dict(w=a.shape[1], h=a.shape[0], feet=feet(a), **box(a))
    if guy: d['hd'] = head_disc(a)
    info[name] = d
    print(name, a.shape[1], a.shape[0], 'hd' if guy else '', [round(v) for v in d['hd']] if guy else '')
    Image.fromarray(a, 'RGBA').save(f'qa/spr_{name}.png')
    return a

def extreme(a, fn, mask=None):
    al = a[..., 3] > 128
    if mask is not None: al &= mask
    ys, xs = np.where(al); i = np.argmax(fn(xs, ys)); return [int(xs[i]), int(ys[i])]

def colour_box(a, col, tol=60):
    """bounding box + centroid of pixels near a colour (e.g. the green leaf, the plate, the pancakes)"""
    rgb = a[..., :3].astype(int); m = (np.abs(rgb - np.array(col)).sum(2) < tol) & (a[..., 3] > 200)
    ys, xs = np.where(m)
    if len(xs) == 0: return None
    return dict(x0=int(xs.min()), x1=int(xs.max()), y0=int(ys.min()), y1=int(ys.max()), cx=float(xs.mean()), cy=float(ys.mean()), n=int(m.sum()))

def grid(name):
    a = Image.open(f'qa/spr_{name}.png'); w, h = a.size
    bg = Image.new('RGBA', (w, h), (215, 215, 215, 255)); bg.alpha_composite(a); d = ImageDraw.Draw(bg)
    for x in range(0, w, 50): d.line([(x, 0), (x, h)], fill=(255, 0, 0, 255) if x % 100 == 0 else (255, 170, 170, 255), width=1)
    for y in range(0, h, 50): d.line([(0, y), (w, y)], fill=(0, 0, 255, 255) if y % 100 == 0 else (170, 170, 255, 255), width=1)
    for x in range(0, w, 100): d.text((x + 2, 2), str(x), fill='red')
    for y in range(0, h, 100): d.text((2, y + 2), str(y), fill='blue')
    bg.convert('RGB').save(f'qa/measure_{name}.jpg', quality=85)

LEAFG = (93, 176, 79)
# ---- the guy (scientist with goggles) ----
a = save('hero', load('hero'))
info['hero']['leaf'] = colour_box(a, LEAFG, 90)
for n, s in zip(['shrug', 'gross', 'tap'], split_n(load('guyA'), 3)): a = save(n, s); 
info['gross']['leaf'] = colour_box(np.asarray(Image.open(f'{OUT}/gross.png')), LEAFG, 90)
for n, s in zip(['happy', 'shock'], split_n(load('guyB'), 2)):
    a = save(n, s)
    info[n]['fist'] = extreme(a, lambda x, y: -y + 0.3 * x)          # top of the raised fist
    info[n]['cakes'] = colour_box(a, (224, 164, 88), 70)
# ---- objects ----
t = save('tree', load('tree'), guy=False, pad=16)
for n, s in zip(['leaf', 'bottle', 'cloud'], split_n(load('props'), 3)): save(n, s, guy=False)
for n in info: grid(n)

# tree: trunk columns (brown pixels) every 20 px of height, crown bottom
tr = np.asarray(Image.open(f'{OUT}/tree.png')).astype(int)
brown = (np.abs(tr[..., :3] - np.array([138, 90, 59])).sum(2) < 90) | (np.abs(tr[..., :3] - np.array([110, 69, 43])).sum(2) < 70)
rows = []
for y in range(0, tr.shape[0], 20):
    xs = np.where(brown[y] & (tr[y, :, 3] > 200))[0]
    if len(xs) > 20: rows.append([y, int(xs.min()), int(xs.max())])
info['tree']['trunk'] = rows
gr = (np.abs(tr[..., :3] - np.array(LEAFG)).sum(2) < 90) | (np.abs(tr[..., :3] - np.array([63, 138, 60])).sum(2) < 70)
ys, xs = np.where(gr & (tr[..., 3] > 200))
info['tree']['crown'] = dict(x0=int(xs.min()), x1=int(xs.max()), y0=int(ys.min()), y1=int(ys.max()))
print('tree crown', info['tree']['crown'], 'trunk rows', rows[:3], '...', rows[-3:])

# ---- background plate: sky padded above, mirror-padded sideways ----
pl = np.asarray(Image.open('raw/plate.png').convert('RGB')).copy()
H, W = pl.shape[:2]
sky = pl[40:60].mean(axis=(0, 1)).astype(np.uint8)
top = np.tile(sky, (500, W, 1))
ext = np.concatenate([top, pl], 0)
ext = cv2.copyMakeBorder(ext, 0, 0, 512, 512, cv2.BORDER_REFLECT_101)
Image.fromarray(ext).save(f'{OUT}/plate.jpg', quality=92)
# horizon: first row from the top (below 40 %) where the meadow green dominates
mead = (np.abs(pl.astype(int) - np.array([155, 203, 94])).sum(2) < 60).mean(1)
hz = int(np.argmax(mead > 0.5))
info['plate'] = dict(w=int(ext.shape[1]), h=int(ext.shape[0]), padX=512, padTop=500, srcW=W, srcH=H, meadow=hz, sky='#%02X%02X%02X' % tuple(sky))
print('plate', ext.shape, 'meadow from row', hz, 'sky', info['plate']['sky'])

json.dump(info, open('sprites.json', 'w'), indent=1)
os.makedirs('../../src/maple-leftovers', exist_ok=True)
with open('../../src/maple-leftovers/sprites.ts', 'w') as f:
    f.write('// generated by images/maple-leftovers/prep.py - native sizes and anchors (px of the trimmed sprite)\n')
    f.write('export const SPR = ' + json.dumps(info) + ' as const;\n')
