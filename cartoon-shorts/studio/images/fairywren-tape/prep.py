# prep.py - split the pose sheets, trim, normalise the guy's colours, measure anchors
# -> public/fairywren-tape/*.png + src/fairywren-tape/sprites.ts   (run from images/fairywren-tape)
import json, os
import numpy as np, cv2
from PIL import Image
OUT = '../../public/fairywren-tape'
os.makedirs(OUT, exist_ok=True)
exec(open('prep_lib.py').read())   # load, despill, trim, normalise, feet, head_disc, box, split_n, drop_specks, fix_outline

info = {}
PRE_GUY, PRE_BIRD, PRE_PLATE = 1.5, 1.25, 1.5

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
    im = Image.fromarray(a, 'RGBA')
    pre = PRE_GUY if guy else PRE_BIRD     # pre-scaled once (Lanczos) to the largest on-screen size; anchors stay in native px
    im.resize((round(a.shape[1] * pre), round(a.shape[0] * pre)), Image.LANCZOS).save(f'{OUT}/{name}.png', optimize=True)
    d = dict(w=a.shape[1], h=a.shape[0], feet=feet(a), **box(a))
    if guy: d['hw'] = white_head(a); d['hd'] = head_disc(a)
    else: d['body'] = head_disc(a)      # birds: the largest inscribed disc = the round body
    info[name] = d
    print(name, a.shape[1], a.shape[0], 'disc', [round(v) for v in (d.get('hd') or d.get('body'))])
    return a

def extreme(a, fn, mask=None):
    al = a[..., 3] > 128
    if mask is not None: al &= mask
    ys, xs = np.where(al); i = np.argmax(fn(xs, ys)); return [int(xs[i]), int(ys[i])]

def color_mask(a, test):
    rgb = a[..., :3].astype(int); op = a[..., 3] > 200
    return op & test(rgb[..., 0], rgb[..., 1], rgb[..., 2])

def blob_centre(m):
    n, lab, st, cen = cv2.connectedComponentsWithStats(m.astype(np.uint8), connectivity=8)
    if n <= 1: return None
    i = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
    x, y, w, h, _ = st[i]
    return [float(cen[i][0]), float(cen[i][1]), int(x), int(y), int(x + w), int(y + h)]

def eyes_white(a, region=None):
    """big white eye discs of the birds: white blobs (r,g,b > 225) -> list of [cx, cy, r]"""
    m = color_mask(a, lambda r, g, b: (r > 225) & (g > 225) & (b > 225))
    if region is not None: m &= region
    n, lab, st, cen = cv2.connectedComponentsWithStats(m.astype(np.uint8), connectivity=8)
    out = []
    for i in range(1, n):
        x, y, w, h, area = st[i]
        if area < 120: continue
        out.append([float(cen[i][0]), float(cen[i][1]), float(np.sqrt(area / np.pi))])
    out.sort(key=lambda e: -e[2])
    return out[:2]

# ---- the scientist (khaki bush hat) ----
a = save('hero', load('hero'))
for nm, p in zip(['shock', 'shrug', 'tie'], split_n(load('guyA'), 3)):
    a = save(nm, p)
    if nm == 'shrug': info[nm]['rhand'] = extreme(a, lambda x, y: x)                     # the open palm on the right
    if nm == 'tie':   # the pinched hands in front of the chest: the white blob right of the body centre, at shoulder height
        h, w = a.shape[:2]; hd = info[nm]['hd']
        reg = np.zeros((h, w), bool); reg[int(hd[1] + 0.8 * hd[2]):int(hd[1] + 2.4 * hd[2]), int(w * 0.45):] = True
        info[nm]['hands'] = extreme(a, lambda x, y: x - 0.2 * y, reg)
for nm, p in zip(['cheer', 'cup', 'binoc'], split_n(load('guyB'), 3)):
    a = save(nm, p)
    if nm == 'cheer': info[nm]['pinch'] = extreme(a, lambda x, y: -y)                      # the raised pinch = topmost point
    if nm == 'cup': info[nm]['bowl'] = [205, 372]                                         # read off qa/cup_zoom.png
    if nm == 'binoc':
        m = color_mask(a, lambda r, g, b: (r < 90) & (g < 90) & (b < 90))
        info[nm]['lens'] = extreme(a, lambda x, y: x, m)                                 # front of the binoculars (rightmost dark)

# ---- the birds ----
for nm, p in zip(['flyUp', 'flyDown'], split_n(load('maleFly'), 2)):
    a = save(nm, p, guy=False)
    info[nm]['beak'] = extreme(a, lambda x, y: -x)                                       # beak tip = leftmost point
    info[nm]['eyes'] = eyes_white(a)
for nm, p in zip(['proud', 'mshock', 'caught'], split_n(load('maleSheet'), 3)):
    a = save(nm, p, guy=False)
    if nm == 'proud': info[nm]['beak'] = extreme(a, lambda x, y: -x - 0.9 * y, np.arange(a.shape[1])[None, :] < a.shape[1] * 0.55)
    if nm == 'mshock': info[nm]['beak'] = extreme(a, lambda x, y: -x)
    if nm == 'caught':
        info[nm]['beak'] = None
    info[nm]['eyes'] = eyes_white(a)
for nm, p in zip(['fstuck', 'fhope', 'fmeh'], split_n(load('female'), 3)):
    a = save(nm, p, guy=False)
    if nm == 'fmeh': info[nm]['beak'] = extreme(a, lambda x, y: x - 0.5 * y)
    info[nm]['eyes'] = eyes_white(a)

# ---- the background plate (not keyed): mirror-pad sideways so the camera can move off the drawn area ----
pl = np.asarray(Image.open('raw/plate.png').convert('RGB'))
H, W = pl.shape[:2]
PADX = 512
pp = cv2.copyMakeBorder(pl, 0, 0, PADX, PADX, cv2.BORDER_REFLECT_101)
Image.fromarray(pp).resize((round(pp.shape[1] * PRE_PLATE), round(pp.shape[0] * PRE_PLATE)), Image.LANCZOS).save(f'{OUT}/plate.png', optimize=True)
g = pl.astype(int)
# horizon = first row (from the top, in the middle columns) where the lake blue starts, and where the grass starts
mid = g[:, int(W * 0.3):int(W * 0.7)].mean(1)
lake = [y for y in range(H) if mid[y][2] > 180 and mid[y][0] < 140]
grass = [y for y in range(H) if mid[y][1] > 180 and mid[y][2] < 140 and mid[y][0] > 150]
info['plate'] = dict(w=int(pp.shape[1]), h=H, padx=PADX, sky=[int(c) for c in g[8, 40:200].mean(0)], grass=[int(c) for c in g[H - 8, 300:700].mean(0)], lakeTop=int(lake[0]) if lake else None, lakeBot=int(lake[-1]) if lake else None,
                     grassTop=int(grass[0]) if grass else None)
info['plate']['rows'] = [[int(y), [int(c) for c in mid[y]]] for y in range(0, H, 48)]

json.dump(info, open('sprites.json', 'w'))
os.makedirs('../../src/fairywren-tape', exist_ok=True)
with open('../../src/fairywren-tape/sprites.ts', 'w') as f:
    f.write('// generated by images/fairywren-tape/prep.py\nexport const SPR = ' + json.dumps(info) + ' as const;\n')
print(json.dumps({k: {kk: vv for kk, vv in v.items() if kk not in ('rows',)} for k, v in info.items()}, indent=0)[:4000])
