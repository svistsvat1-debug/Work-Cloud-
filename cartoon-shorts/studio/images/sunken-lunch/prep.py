# prep.py - sunken-lunch is made from FINISHED ElevenLabs cut-outs of earlier videos (all GPT Image LOW pictures, keyed + normalised
# there; nothing is fed into any generation). Copies them into public/sunken-lunch under new names, measures anchors
# -> src/sunken-lunch/sprites.ts   (run from images/sunken-lunch)
import json, os, shutil
import numpy as np, cv2
from PIL import Image
OUT = '../../public/sunken-lunch'
os.makedirs(OUT, exist_ok=True)
exec(open('prep_lib.py').read())   # load, despill, trim, normalise, feet, head_disc, box, split_n, drop_specks, fix_outline, find_eyes
P = '../../public/'

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

# source sprite -> name in this Short (the role it plays)
GUYS = {
    'p_thumb': 'venice-piles/thumb.png',      # pilot in the hatch, thumbs up (frame 0)
    'p_scared': 'eagle-zap/scared.png',       # cables snap
    'p_leap': 'nuclear-warning/run.png',      # jumps out
    'p_shock': 'print-money/shock.png',       # in the water / 'almost fresh' jaw drop
    'p_point': 'deep-dive/point.png',         # 'Cold, right?'
    'p_cheer': 'deep-dive/cheer.png',         # the ending
    'c_panic': 'shipworm-tunnel/panic.png',   # third crew member
    's_scared': 'deep-dive/b_scared.png',     # the scientist (round glasses) jumps out
    's_shock': 'space-twin/shock.png',        # scientist in the water / at the fridge
    's_nerd': 'nuclear-warning/nerd.png',     # scientist with the clipboard
    's_smug': 'deep-dive/b_smug.png',         # scientist, arms crossed (ending)
}
info = {}
for nm, src in GUYS.items():
    a = np.asarray(Image.open(P + src).convert('RGBA')).copy()
    a, off = trim(a, 12)
    Image.fromarray(a, 'RGBA').save(f'{OUT}/{nm}.png', optimize=True)
    d = dict(w=a.shape[1], h=a.shape[0], feet=feet(a), **box(a), src=src)
    d['hw'] = white_head(a); d['hd'] = head_disc(a)
    d['eyes'] = find_eyes(a, d['hd'])
    info[nm] = d

def extreme(a, fn, mask=None):
    al = a[..., 3] > 128
    if mask is not None: al &= mask
    ys, xs = np.where(al); i = np.argmax(fn(xs, ys)); return [int(xs[i]), int(ys[i])]

# hands / grips
a = np.asarray(Image.open(f'{OUT}/p_point.png')); info['p_point']['tip'] = extreme(a, lambda x, y: -y - 10000 * (x < 0.5 * a.shape[1]))
a = np.asarray(Image.open(f'{OUT}/s_nerd.png')); info['s_nerd']['tip'] = extreme(a, lambda x, y: x)
a = np.asarray(Image.open(f'{OUT}/p_thumb.png')); info['p_thumb']['tip'] = extreme(a, lambda x, y: x - 0.3 * y)
# (the ship sprite of titanic-cover was measured in a first draft and dropped: at a readable character size it would be
#  shown far above its native pixels, so the sub's crane and the ending's stern are drawn in code)

# ---- plates ----
shutil.copy(P + 'deep-dive/surface.png', f'{OUT}/bg_surface.png')
shutil.copy(P + 'megalodon-trench/plate_bot.jpg', f'{OUT}/bg_bottom.jpg')
shutil.copy(P + 'doomsday-2026/bg_lab.png', f'{OUT}/bg_lab.png')
shutil.copy(P + 'hoover-dam-pour/fridge.png', f'{OUT}/fridge.png')
f = np.asarray(Image.open(f'{OUT}/fridge.png').convert('RGBA')).astype(int)
al = f[..., 3] > 128
ys, xs = np.where(al)
info['fridge'] = dict(w=f.shape[1], h=f.shape[0], **box(f.astype(np.uint8)))
# door body rows (exclude the feet): widest opaque rows
widths = al.sum(1); body = np.where(widths > 0.8 * widths.max())[0]
info['fridge']['body'] = [int(body.min()), int(body.max())]
grey = al & (np.abs(f[..., 0] - f[..., 2]) < 20) & (f[..., :3].sum(2) < 600) & (f[..., :3].sum(2) > 250)
gy, gx = np.where(grey[:, int(0.6 * f.shape[1]):]);
info['fridge']['handle'] = [int(gx.min() + 0.6 * f.shape[1]), int(gy.min()), int(gx.max() + 0.6 * f.shape[1]), int(gy.max())] if len(gx) else None
for k, fn in [('surface', 'bg_surface.png'), ('bottom', 'bg_bottom.jpg'), ('lab', 'bg_lab.png')]:
    b = np.asarray(Image.open(f'{OUT}/{fn}').convert('RGB'))
    info['bg_' + k] = dict(w=b.shape[1], h=b.shape[0])
# bottom plate floor profile (top of the sand every 32 px) + colours
b = np.asarray(Image.open(f'{OUT}/bg_bottom.jpg').convert('RGB')).astype(int)
sand = (np.abs(b - np.array([175, 169, 153])).sum(2) < 60)
fl = []
for x in range(0, b.shape[1], 32):
    c = np.where(sand[:, x])[0]
    fl.append([x, int(c.min()) if len(c) else None])
info['bg_bottom']['floor'] = fl
info['bg_bottom']['cols'] = dict(water='#%02x%02x%02x' % tuple(b[20, 512]), sand='#%02x%02x%02x' % tuple(b[1500, 512]),
                                 wall='#%02x%02x%02x' % tuple(b[600, 30]))
l = np.asarray(Image.open(f'{OUT}/bg_lab.png').convert('RGB')).astype(int)
info['bg_lab']['cols'] = dict(wall='#%02x%02x%02x' % tuple(l[100, 900]), floor='#%02x%02x%02x' % tuple(l[1450, 512]))
info['bg_surface']['cols'] = dict(sky='#8cd1f5', top='#56c2ec', bands=['#4cb0de', '#2590d1', '#1b6fb8', '#155498', '#113e73', '#0e2e59'])
info['bg_surface']['surfaceY'] = 298
os.makedirs('../../src/sunken-lunch', exist_ok=True)
open('../../src/sunken-lunch/sprites.ts', 'w').write('// generated by images/sunken-lunch/prep.py\nexport const SPR = ' + json.dumps(info) + ' as const;\n')
for k, v in info.items():
    if 'hd' in v:
        print(k, v['w'], v['h'], 'hd', [round(t) for t in v['hd']], 'hw', [round(t) for t in v['hw']], 'feet', [round(t) for t in v['feet']], 'eyes', len(v['eyes']),
              {kk: vv for kk, vv in v.items() if kk in ('tip', 'ropeR', 'ropeL')})
print('fridge', info['fridge']); print('bottom', info['bg_bottom']['cols'], info['bg_bottom']['floor'][::4]); print('lab', info['bg_lab'])
