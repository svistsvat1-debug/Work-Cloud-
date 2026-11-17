# prep.py - split the pose / shark sheets, trim, normalise colours, measure anchors and the bay plate
# -> public/shark-storm/*.png + src/shark-storm/sprites.ts   (run from images/shark-storm)
import json, os
import numpy as np, cv2
from PIL import Image
exec(open('prep_lib.py').read())   # helpers shared with sun-vanish (load, despill, trim, normalise, feet, head_disc, box, split_n, drop_specks, fix_outline, find_eyes)

info = {}
def white_head(a):
    """largest inscribed disc of the hole-filled WHITE face region (the ear cups and hands are excluded) -> [x, y, r]"""
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
    a = drop_specks(despill(a))
    if guy:
        a = normalise(a)
        a, nfix = fix_outline(a)
        if nfix: print('   outline fixed', name, nfix, 'px')
    a, off = trim(a, pad)
    Image.fromarray(a, 'RGBA').save(f'{OUT}/{name}.png', optimize=True)
    d = dict(w=a.shape[1], h=a.shape[0], feet=feet(a), **box(a))
    if guy:
        d['head'] = head_disc(a)
        d['hw'] = white_head(a)
        eyes = find_eyes(a, d['head'])
        if eyes: d['eyes'] = eyes
    info[name] = d
    return a

save('hero', load('hero'))
for sheet, names in [('guy3a', ['shock', 'shrug', 'cling']), ('guy3b', ['point', 'joy', 'sit'])]:
    for nm, p in zip(names, split_n(load(sheet), 3)):
        save(nm, p)
# the cling pose holds a post: measure the post (brown pixels) so it can stand on the dock
c = np.asarray(Image.open(f'{OUT}/cling.png')).astype(int)
brown = (c[..., 3] > 200) & (c[..., 0] > 110) & (c[..., 0] < 200) & (c[..., 1] > 60) & (c[..., 1] < 140) & (c[..., 2] < 90)
ys, xs = np.where(brown)
info['cling']['post'] = dict(left=int(xs.min()), right=int(xs.max()), top=int(ys.min()), bottom=int(ys.max()), cx=float(xs.mean()))
# head of the cling pose: the inscribed disc may land on the post -> largest disc among white pixels only
w = ((c[..., :3].sum(2) > 600) & (c[..., 3] > 200)).astype(np.uint8)
w = cv2.morphologyEx(w, cv2.MORPH_CLOSE, np.ones((25, 25), np.uint8))
dt = cv2.distanceTransform(w, cv2.DIST_L2, 5); hy, hx = np.unravel_index(dt.argmax(), dt.shape)
info['cling']['head_white'] = [float(hx), float(hy), float(dt[hy, hx])]
# sharks (not the guy: no palette normalising)
for nm, p in zip(['b_calm', 'b_scared', 'b_zoom'], split_n(load('baby3'), 3)):
    save(nm, p, guy=False)
for nm in ['b_calm', 'b_scared', 'b_zoom']:
    q = np.asarray(Image.open(f'{OUT}/{nm}.png')).astype(int)
    org = (q[..., 3] > 200) & (q[..., 0] > 200) & (q[..., 1] > 90) & (q[..., 1] < 180) & (q[..., 2] < 90)
    ys, xs = np.where(org); info[nm]['tag'] = [float(xs.mean()), float(ys.min())]
    print(nm, 'tag', info[nm]['tag'], org.sum())
L, R = split_n(load('big2'), 2)
save('big_lazy', L, guy=False); save('big_hungry', R, guy=False)
# align big_hungry to big_lazy on the body behind the head (the right 60 %): translation by ECC
A = np.asarray(Image.open(f'{OUT}/big_lazy.png')); B = np.asarray(Image.open(f'{OUT}/big_hungry.png'))
H = max(A.shape[0], B.shape[0]) + 40; W = max(A.shape[1], B.shape[1]) + 40
def canvas(X):
    o = np.zeros((H, W), np.float32); o[20:20 + X.shape[0], 20:20 + X.shape[1]] = (X[..., 3] > 128) * (255 - X[..., :3].mean(2) * 0.5); return o
ga, gb = canvas(A), canvas(B)
mask = np.zeros((H, W), np.uint8); mask[:, int(W * 0.4):] = 255
warp = np.eye(2, 3, dtype=np.float32)
try:
    cc, warp = cv2.findTransformECC(ga, gb, warp, cv2.MOTION_TRANSLATION, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 300, 1e-6), mask, 5)
    print('big shark ECC', cc, warp[:, 2])
except cv2.error as e:
    print('ECC failed', e)
# warp maps A coords -> B coords: B pixel = A pixel + t  => draw B shifted by -t to sit on A
info['big_hungry']['align'] = [float(-warp[0, 2]), float(-warp[1, 2])]

# ---- the bay plate: surface, dock, sand profile, water colours ----
b = np.asarray(Image.open('raw/bay.png').convert('RGB')).astype(int)
Hh, Ww = b.shape[:2]
Image.fromarray(b.astype(np.uint8)).save(f'{OUT}/bay.png', optimize=True)
dark = b.sum(2) < 90
surf = int(np.median([np.argmax(dark[400:700, x]) + 400 for x in range(500, 1000, 25)]))
dock_top = int(np.median([np.argmax(dark[380:520, x]) + 380 for x in range(20, 400, 20)]))
# dock right end: last column (left half) where the plank colour is present at the plank band
plank = (b[..., 0] > 120) & (b[..., 0] < 190) & (b[..., 1] > 70) & (b[..., 1] < 130) & (b[..., 2] < 80)
cols = np.where(plank[dock_top + 6:dock_top + 30].any(0))[0]
dock_right = int(cols[cols < Ww * 0.6].max())
sandc = (b[..., 0] > 230) & (b[..., 1] > 200) & (b[..., 2] < 190) & (b[..., 2] > 100)
prof = []
for x in range(0, Ww, 16):
    ys = np.where(sandc[surf + 20:, x])[0]
    if len(ys):
        y = ys[0] + surf + 20
        # step up over the black outline
        while y > surf and dark[y - 1, x]: y -= 1
        prof.append([x, int(y)])
    else:
        prof.append([x, Hh])
info['bay'] = dict(w=Ww, h=Hh, surface=surf, dock_top=dock_top, dock_right=dock_right, sand=prof,
                   sky=[int(v) for v in b[60, Ww // 2]], water_l=[int(v) for v in b[surf + 60, 40]],
                   water_r=[int(v) for v in b[surf + 60, Ww - 10]], deep=[int(v) for v in b[Hh - 40, Ww - 4]],
                   sand_col=[int(v) for v in b[Hh - 30, 60]])
print('bay surface', surf, 'dock top', dock_top, 'dock right', dock_right, 'sand', prof[::8])
os.makedirs('../../src/shark-storm', exist_ok=True)
open('../../src/shark-storm/sprites.ts', 'w').write('// generated by images/shark-storm/prep.py\nexport const SPR = ' + json.dumps(info) + ' as const;\n')
for k, v in info.items():
    if k == 'bay': continue
    print(k, v.get('w'), v.get('h'), 'head', [round(t) for t in v['head']] if 'head' in v else '-', 'feet', [round(t) for t in v.get('feet')], 'eyes', [[round(t) for t in e] for e in v.get('eyes', [])])
