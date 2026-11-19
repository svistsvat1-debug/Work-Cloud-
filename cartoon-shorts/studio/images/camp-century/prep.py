# prep.py - split the pose / object sheets, trim, normalise colours, measure anchors
# -> public/camp-century/*.png + src/camp-century/sprites.ts   (run from images/camp-century)
import json, os, shutil
import numpy as np, cv2
from PIL import Image
OUT = '../../public/camp-century'
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

def despill_magenta(a, k=40):   # pinkish-purple key leftovers -> transparent (tongue / red nose are not caught: b ~ g there)
    r, g, b = [a[..., i].astype(int) for i in range(3)]
    a[(r > g + k) & (b > g + k), 3] = 0
    return a

def save(name, a, guy=True, pad=12, magenta=True):
    a = despill_magenta(a) if magenta else despill(a)
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
    print(name, a.shape[1], a.shape[0], 'head', [round(v) for v in d.get('hw', [0, 0, 0])])
    return a

def extreme(a, fn, mask=None):
    al = a[..., 3] > 128
    if mask is not None: al &= mask
    ys, xs = np.where(al); i = np.argmax(fn(xs, ys)); return [int(xs[i]), int(ys[i])]

def color_box(a, test):
    rgb = a[..., :3].astype(int); op = a[..., 3] > 200
    m = op & test(rgb[..., 0], rgb[..., 1], rgb[..., 2])
    n, lab, st, cen = cv2.connectedComponentsWithStats(m.astype(np.uint8), connectivity=8)
    if n <= 1: return None
    i = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
    x, y, w, h, _ = st[i]
    return [int(x), int(y), int(x + w), int(y + h)]

# ---- the soldier (olive helmet) ----
a = save('hero', load('hero'))
for nm, p in zip(['dig', 'tada', 'innocent'], split_n(load('soldierA'), 3)):
    a = save(nm, p)
    if nm == 'dig': info[nm]['blade'] = extreme(a, lambda x, y: x + 0.6 * y)        # the snow heap / blade, lower right
    if nm == 'tada': info[nm]['palm'] = extreme(a, lambda x, y: x)                  # the open palm (rightmost)
    if nm == 'innocent':
        lens = color_box(a, lambda r, g, b: (b > 200) & (r < 215) & (g > 200))       # pale-blue glass of the magnifier
        info[nm]['lens'] = lens
for nm, p in zip(['shh', 'scared', 'push'], split_n(load('soldierB'), 3)):
    a = save(nm, p)
    if nm == 'push': info[nm]['palm'] = extreme(a, lambda x, y: x)
for nm, p in zip(['scrape', 'shrug', 'walk'], split_n(load('soldierC'), 3)):
    a = save(nm, p)
    if nm == 'scrape': info[nm]['blade'] = extreme(a, lambda x, y: x)              # the scraper blade (rightmost)
    if nm == 'walk': info[nm]['case'] = color_box(a, lambda r, g, b: (r > 100) & (r < 170) & (g > 60) & (g < 115) & (b < 80))

# ---- objects ----
re_, ro = split_n(load('objects'), 2)
a = save('reactor', re_, guy=False)
info['reactor']['port'] = color_box(a, lambda r, g, b: (r > 220) & (g > 190) & (b < 140))   # the yellow porthole
a = save('rocket', ro, guy=False)
info['rocket']['nose'] = color_box(a, lambda r, g, b: (r > 180) & (g < 110) & (b < 110))
a = save('plane', load('plane'), guy=False, magenta=False)
info['plane']['cockpit'] = color_box(a, lambda r, g, b: (r < 90) & (g < 110) & (b < 140) & (b > r + 10))   # dark blue windshield
info['plane']['pod'] = color_box(a, lambda r, g, b: (abs(r - g) < 14) & (abs(g - b) < 18) & (r > 120) & (r < 200))
info['plane']['nose'] = extreme(a, lambda x, y: x)

# ---- the background plate (not keyed) ----
pl = np.asarray(Image.open('raw/plate.png').convert('RGB')).astype(int)
H, W = pl.shape[:2]
Image.fromarray(pl.astype(np.uint8)).save(f'{OUT}/plate.png', optimize=True)
dark = pl.sum(2) < 200
snow = []   # per 16 px column: [x, top of the snow band (upper outline), top of the ice (lower outline)]
white = pl.sum(2) > 735
for x in list(range(0, W, 16)) + [W - 1]:
    col = dark[:, x]; top = bot = None
    for y in range(420, 600):
        if col[y] and white[y + 6, x] and top is None: top = y      # dark line with snow under it
        if top is not None and y > top + 12 and col[y]: bot = y; break
    snow.append([x, top, bot])
info['plate'] = dict(w=W, h=H, snow=snow)
# band boundaries (lighter wavy lines) - mean colour per row in the middle column band
col = pl[:, 200:800].mean(1)
info['plate']['rows'] = [[int(y), [int(c) for c in col[y]]] for y in range(0, H, 32)]

json.dump(info, open('sprites.json', 'w'))
os.makedirs('../../src/camp-century', exist_ok=True)
with open('../../src/camp-century/sprites.ts', 'w') as f:
    f.write('// generated by images/camp-century/prep.py\nexport const SPR = ' + json.dumps(info) + ' as const;\n')
print(json.dumps({k: {kk: vv for kk, vv in v.items() if kk not in ('snow', 'rows')} for k, v in info.items()}, indent=0)[:3000])
print('snow line', snow[:5], '...', snow[-3:])
