# prep.py - split the pose sheets, trim, normalise the guy's colours, measure anchors and the two trench plates
# -> public/megalodon-trench/*.png + src/megalodon-trench/sprites.ts   (run from images/megalodon-trench)
import json, os
import numpy as np, cv2
from PIL import Image
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

def save(name, a, guy=False, pad=12):
    a = drop_specks(despill(a), 200)
    if guy:
        a = normalise(a)
        a, nfix = fix_outline(a)
        if nfix: print('   outline fixed', name, nfix, 'px')
    a, off = trim(a, pad)
    Image.fromarray(a, 'RGBA').save(f'{OUT}/{name}.png', optimize=True)
    d = dict(w=a.shape[1], h=a.shape[0], feet=feet(a), **box(a))
    if guy:
        d['head'] = head_disc(a); d['hw'] = white_head(a)
    info[name] = d
    return a

def fish_measure(name, a, facing):
    """snout tip, length, back line + body centre near the head, the eye (biggest white round blob in the front third)"""
    al = a[..., 3] > 128
    ys, xs = np.where(al)
    L = float(xs.max() - xs.min())
    sx = int(xs.max()) if facing == 'R' else int(xs.min())
    sgn = -1 if facing == 'R' else 1
    xm = int(sx + sgn * 0.4 * L)            # mid-body column
    col = np.where(al[:, xm])[0]
    back, belly = int(col.min()), int(col.max())
    # eye: white blobs in the front 22 % with a dark pupil inside
    wh = (a[..., :3].astype(int).sum(2) > 640) & al
    n, lab, st, cen = cv2.connectedComponentsWithStats(wh.astype(np.uint8), connectivity=4)
    eye = None
    for i in range(1, n):
        x, y, w, h, area = st[i]
        cx, cy = cen[i]
        if abs(cx - sx) > 0.22 * L or area < 0.0004 * L * L or area > 0.02 * L * L: continue
        if not (0.6 < w / max(h, 1) < 1.6): continue
        if cy > back + 0.75 * (belly - back) + 40: continue
        if eye is None or area > eye[2]: eye = [float(cx), float(cy), float(area)]
    d = info[name]
    d.update(L=L, snout=[sx, float(np.median(np.where(al[:, sx])[0]))], back=back, belly=belly, xm=xm,
             eye=eye[:2] if eye else None, eyeR=float(np.sqrt(eye[2] / np.pi)) if eye else None)
    print(f'{name:10s} L {L:.0f} snout {sx} back {back} belly {belly} eye {[round(v) for v in eye[:2]] if eye else None}')

# ---- the megalodon ----
save('meg', load('meg_hero')); fish_measure('meg', np.asarray(Image.open(f'{OUT}/meg.png')), 'R')
for sheet, names in [('megA', ['shh', 'puzzled', 'nervous']), ('megB', ['chomp', 'starve', 'deadpan'])]:
    for nm, p in zip(names, split_n(load(sheet), 3, axis='y')):
        save(nm, p); fish_measure(nm, np.asarray(Image.open(f'{OUT}/{nm}.png')), 'R')
# swap anchor of every megalodon pose: (snout - 0.18 L, head top at that column + 0.11 L) -> same snout / head line on swaps
for nm in ['meg', 'shh', 'puzzled', 'nervous', 'chomp', 'starve', 'deadpan']:
    a = np.asarray(Image.open(f'{OUT}/{nm}.png')); al = a[..., 3] > 128; L = info[nm]['L']; sx = info[nm]['snout'][0]
    x = int(sx - 0.18 * L); top = int(np.where(al[:, x])[0].min())
    info[nm]['anc'] = [float(sx - 0.18 * L), float(top + 0.11 * L)]
# ---- the guy ----
for nm, p in zip(['binoc', 'shrug', 'laugh'], split_n(load('guy3'), 3)):
    save(nm, p, guy=True)
# ---- ordinary sharks (face LEFT) ----
for nm, p in zip(['hammer', 'blue', 'tiger'], split_n(load('others3'), 3)):
    save(nm, p); fish_measure(nm, np.asarray(Image.open(f'{OUT}/{nm}.png')), 'L')
# ---- critters ----
for nm, p in zip(['amph_wave', 'amph_wow', 'cucumber'], split_n(load('critters'), 3)):
    save(nm, p)

# ---- plates ----
def plate(name):
    b = np.asarray(Image.open(f'raw/{name}.png').convert('RGB')).astype(int)
    Image.fromarray(b.astype(np.uint8)).save(f'{OUT}/{name}.jpg', quality=93)
    return b
t = plate('plate_top'); Ht, Wt = t.shape[:2]
dark = t.sum(2) < 110
ink = t.sum(2) < 50
# ledge line: first outline row in the outer 20 % columns
ledge_l = int(np.median([np.argmax(dark[400:, x]) + 400 for x in range(10, 200, 10)]))
ledge_r = int(np.median([np.argmax(dark[400:, x]) + 400 for x in range(Wt - 200, Wt - 10, 10)]))
# trench gap per row (below the ledge): the wall outline pixels nearest the centre on each side
rock = np.array([46, 58, 87])
isrock = (np.abs(t - t[Ht - 30, 40]).sum(2) < 40)
prof = []
for y in range(max(ledge_l, ledge_r) + 20, Ht, 24):
    row = isrock[y] | ink[y]
    xl = int(np.where(row[:Wt // 2])[0].max()) if row[:Wt // 2].any() else 0
    xr = int(np.where(row[Wt // 2:])[0].min() + Wt // 2) if row[Wt // 2:].any() else Wt
    prof.append([y, xl, xr])
waterc = [[y, [int(v) for v in t[y, Wt // 2]]] for y in range(0, Ht, 64)]
info['plate_top'] = dict(w=Wt, h=Ht, ledge=[ledge_l, ledge_r], gap=prof, water=waterc, rock=[int(v) for v in t[Ht - 30, 40]],
                         trench=[int(v) for v in t[Ht - 10, Wt // 2]])
# foreground rock layer (rock + outlines below the ledge) so the diving shark can pass BEHIND the trench walls
fg = np.zeros((Ht, Wt, 4), np.uint8)
m = np.zeros((Ht, Wt), bool)
for (y, xl, xr) in prof: pass
yy = np.arange(Ht)[:, None]; xx = np.arange(Wt)[None, :]
gx_l = np.interp(np.arange(Ht), [p[0] for p in prof], [p[1] for p in prof]); gx_r = np.interp(np.arange(Ht), [p[0] for p in prof], [p[2] for p in prof])
top = min(ledge_l, ledge_r) - 6
wc = np.array([t[y, Wt // 2] for y in range(Ht)])
notwater = np.abs(t - wc[:, None, :]).sum(2) > 60
m = ((xx <= gx_l[:, None] + 3) | (xx >= gx_r[:, None] - 3)) & (yy >= top) & (notwater | (yy > max(ledge_l, ledge_r) + 10))
# keep the rocks / coral sitting on the ledges: anything not water-coloured above the ledge in the outer columns
m |= notwater & (yy >= top - 80) & ((xx < Wt * 0.32) | (xx > Wt * 0.68))
fg[m, :3] = t[m].astype(np.uint8); fg[m, 3] = 255
Image.fromarray(fg, 'RGBA').save(f'{OUT}/plate_top_fg.png', optimize=True)

bt = plate('plate_bot'); Hb, Wb = bt.shape[:2]
darkb = bt.sum(2) < 110
floor = int(np.median([np.argmax(darkb[900:, x]) + 900 for x in range(int(Wb * 0.3), int(Wb * 0.7), 16)]))
rockb = bt[400, 30]
wl = [], 
walls = []
for y in range(0, floor - 10, 24):
    row = darkb[y] | (np.abs(bt[y] - rockb).sum(1) < 40)
    xl = int(np.where(row[:Wb // 2])[0].max()) if row[:Wb // 2].any() else 0
    xr = int(np.where(row[Wb // 2:])[0].min() + Wb // 2) if row[Wb // 2:].any() else Wb
    walls.append([y, xl, xr])
info['plate_bot'] = dict(w=Wb, h=Hb, floor=floor, walls=walls, water=[int(v) for v in bt[600, Wb // 2]], rock=[int(v) for v in rockb],
                         silt=[int(v) for v in bt[Hb - 40, Wb // 2]])
print('top ledge', ledge_l, ledge_r, 'gap', prof[::6], 'rock', info['plate_top']['rock'], 'trench', info['plate_top']['trench'])
print('bot floor', floor, 'walls', walls[::8], 'water', info['plate_bot']['water'], 'silt', info['plate_bot']['silt'])
os.makedirs('../../src/megalodon-trench', exist_ok=True)
open('../../src/megalodon-trench/sprites.ts', 'w').write('// generated by images/megalodon-trench/prep.py\nexport const SPR = ' + json.dumps(info) + ' as const;\n')
for k, v in info.items():
    if k.startswith('plate'): continue
    print(k, v['w'], v['h'], 'head', [round(x) for x in v['head']] if 'head' in v else '', 'hw', [round(x) for x in v['hw']] if 'hw' in v else '', 'feet', [round(x) for x in v['feet']])
