# prep.py - split the pose / prop sheets, trim, normalise colours, measure anchors
# -> public/sunken-lunch/*.png + src/sunken-lunch/sprites.ts   (run from images/sunken-lunch)
import json, os
import numpy as np, cv2
from PIL import Image
OUT = '../../public/sunken-lunch'
os.makedirs(OUT, exist_ok=True)
exec(open('prep_lib.py').read())   # load, despill, trim, normalise, feet, head_disc, box, split_n, drop_specks, fix_outline, find_eyes

info = {}
def despill_strong(a, k=18):
    r, g, b = [a[..., i].astype(int) for i in range(3)]
    a[(g > r + k) & (g > b + k), 3] = 0
    return a
def despill_magenta(a, k=60):
    r, g, b = [a[..., i].astype(int) for i in range(3)]
    a[(r > g + k) & (b > g + k), 3] = 0
    return a

def save(name, a, guy=True, pad=12, spill='g'):
    a = despill(a) if spill == 'g' else despill_magenta(a) if spill == 'm' else despill_strong(a) if spill == 'G' else a
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
    return a

def extreme(a, fn, mask=None):
    al = a[..., 3] > 128
    if mask is not None: al &= mask
    ys, xs = np.where(al); i = np.argmax(fn(xs, ys)); return [int(xs[i]), int(ys[i])]

# ---- the guy ----
a = save('hero', load('hero'))
H, W = a.shape[:2]
info['hero']['palm'] = extreme(a, lambda x, y: x - 100000 * ((y > 0.55 * H) | (y < 0.3 * H)))       # open palm: rightmost, chest height
for nm, p in zip(['leap', 'help', 'wow'], split_n(load('sheetA'), 3)):
    a = save(nm, p)
for nm, p in zip(['ask', 'smug', 'haul'], split_n(load('sheetB'), 3)):
    a = save(nm, p)
    H, W = a.shape[:2]
    if nm == 'ask': info[nm]['fist'] = extreme(a, lambda x, y: x - 100000 * (y > 0.42 * H))           # raised fist: rightmost point in the upper part
    if nm == 'smug': info[nm]['fist'] = extreme(a, lambda x, y: x - 100000 * ((y > 0.6 * H) | (y < 0.25 * H)))  # stretched arm tip
    if nm == 'haul': info[nm]['fist'] = extreme(a, lambda x, y: x - 100000 * (y > 0.6 * H))           # fists: rightmost, upper part
for nm in ['hero', 'leap', 'help', 'wow', 'ask', 'smug', 'haul']:
    h = np.asarray(Image.open(f'{OUT}/{nm}.png')).copy()
    info[nm]['eyes'] = find_eyes(h, head_disc(h))

# ---- the sub ----
a = save('sub', load('sub'), guy=False, spill='G')
rgb = a[..., :3].astype(int); al = a[..., 3] > 200
# porthole glass: dark-blue blob
blue = al & (np.abs(rgb - np.array([31, 78, 121])).sum(2) < 90) & (rgb[..., 2] > rgb[..., 0] + 30)
n, lab, st, cen = cv2.connectedComponentsWithStats(blue.astype(np.uint8), connectivity=8)
i = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
cnts, _ = cv2.findContours((lab == i).astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
(cx, cy), r = cv2.minEnclosingCircle(max(cnts, key=cv2.contourArea))
info['sub']['port'] = [float(cx), float(cy), float(r)]
# orange tower: box + top
orange = al & (rgb[..., 0] > 180) & (rgb[..., 1] > 80) & (rgb[..., 1] < 170) & (rgb[..., 2] < 90)
ys, xs = np.where(orange)
info['sub']['tower'] = dict(left=int(xs.min()), right=int(xs.max()), top=int(ys.min()), bottom=int(ys.max()))
# hull: widest rows below the tower
ys, xs = np.where(al)
rows = [(y, int(np.where(al[y])[0].min()), int(np.where(al[y])[0].max())) for y in range(int(ys.min()), int(ys.max()) + 1, 4) if al[y].any()]
info['sub']['hull'] = dict(top=int(info['sub']['tower']['bottom']), bottom=int(ys.max()), left=int(xs.min()), right=int(xs.max()))
# hatch opening: dark pixels just above the tower top (the rim interior)
tw = info['sub']['tower']
dark = al & (rgb.sum(2) < 200)
band = dark[max(tw['top'] - 60, 0):tw['top'] + 30, tw['left']:tw['right']]
yy, xx = np.where(band)
info['sub']['hatch'] = [float(xx.mean() + tw['left']), float(yy.mean() + max(tw['top'] - 60, 0))] if len(xx) else [float((tw['left'] + tw['right']) / 2), float(tw['top'])]
info['sub']['topY'] = int(ys.min())

# ---- props: 3 sandwiches + lunchbox (magenta key, lettuce is green: no green despill) ----
for nm, p in zip(['sw_fresh', 'sw_soggy', 'sw_rotten', 'lunchbox'], split_n(despill_magenta(load('props')), 4)):
    a = save(nm, p, guy=False, spill='m')
a = np.asarray(Image.open(f'{OUT}/lunchbox.png'))
al = a[..., 3] > 128; ys, xs = np.where(al)
info['lunchbox']['handleTop'] = [float(xs[ys == ys.min()].mean()), int(ys.min())]

# ---- plates ----
for nm in ['sea', 'deep']:
    b = np.asarray(Image.open(f'raw/{nm}.png').convert('RGB')).astype(int)
    Image.fromarray(b.astype(np.uint8)).save(f'{OUT}/{nm}.png', optimize=True)
    info[nm] = dict(w=b.shape[1], h=b.shape[0])
b = np.asarray(Image.open('raw/sea.png').convert('RGB')).astype(int); Hh, Ww = b.shape[:2]
# water line: in the right third, first row from the top that is sea-blue (r < 90, b > 150)
seaish = (b[..., 0] < 90) & (b[..., 2] > 150) & (b[..., 1] < 160)
wl = [int(np.argmax(seaish[:, x])) for x in range(int(0.75 * Ww), Ww - 10, 10) if seaish[:, x].any()]
info['sea']['water'] = int(np.median(wl))
# crane pulley: the black disc at the crane tip = darkest blob in the upper-right of the crane region
dk = (b.sum(2) < 120)
reg = dk[int(0.10 * Hh):int(0.35 * Hh), int(0.45 * Ww):int(0.85 * Ww)]
n, lab, st, cen = cv2.connectedComponentsWithStats(reg.astype(np.uint8), connectivity=8)
best = max(range(1, n), key=lambda i: st[i, cv2.CC_STAT_AREA] if st[i, cv2.CC_STAT_WIDTH] < 120 else 0)
info['sea']['pulley'] = [float(cen[best][0] + int(0.45 * Ww)), float(cen[best][1] + int(0.10 * Hh)), float(max(st[best, 2], st[best, 3]) / 2)]
# deck: the yellow crane base bottom / top of the railing; take the topmost white-hull row under the crane base on the left
yel = (b[..., 0] > 200) & (b[..., 1] > 160) & (b[..., 2] < 110)
ys, xs = np.where(yel[:, :int(0.4 * Ww)])
info['sea']['craneBase'] = [float(xs.mean()), int(ys.max())]
# ship right edge at the deck level (rightmost non-sky pixel in the rows just under the crane base)
sky = np.array([int(v) for v in b[10, int(0.9 * Ww)]])
row = int(ys.max()) + 20
nonsky = np.abs(b[row] - sky).sum(1) > 60
info['sea']['shipRight'] = int(np.where(nonsky[:int(0.6 * Ww)])[0].max())
info['sea']['deckY'] = int(ys.max())
info['sea']['cols'] = {k: '#%02x%02x%02x' % tuple(int(v) for v in b[y, x]) for k, (x, y) in dict(sky=(Ww - 6, 6), sea=(Ww - 6, Hh - 6), seaTop=(Ww - 6, info['sea']['water'] + 12)).items()}
d = np.asarray(Image.open('raw/deep.png').convert('RGB')).astype(int); Hd, Wd = d.shape[:2]
mud = (d[..., 0] > 60) & (np.abs(d[..., 0] - d[..., 2]) < 40) & (d[..., 1] > 55)
fl = [int(np.argmax(mud[int(0.6 * Hd):, x]) + int(0.6 * Hd)) for x in range(10, Wd - 10, 16) if mud[int(0.6 * Hd):, x].any()]
info['deep']['floor'] = int(np.median(fl))
info['deep']['cols'] = {k: '#%02x%02x%02x' % tuple(int(v) for v in d[y, x]) for k, (x, y) in dict(top=(Wd // 2, 6), mid=(Wd // 2, Hd // 2), low=(Wd // 2, int(0.75 * Hd)), mud=(Wd // 2, Hd - 6)).items()}

os.makedirs('../../src/sunken-lunch', exist_ok=True)
open('../../src/sunken-lunch/sprites.ts', 'w').write('// generated by images/sunken-lunch/prep.py\nexport const SPR = ' + json.dumps(info) + ' as const;\n')
for k, v in info.items():
    print(k, {kk: (vv if not isinstance(vv, float) else round(vv, 1)) for kk, vv in v.items() if kk not in ('left', 'right', 'top', 'bottom')})
