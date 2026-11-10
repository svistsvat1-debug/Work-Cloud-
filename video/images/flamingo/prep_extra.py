"""Second batch: scientist pointer/amazed poses, flamingo flock, X-ray card, zoo background.

Run from images/flamingo:  python3 -I prep_extra.py   (after prep.py)
"""
import json
import shutil
import numpy as np
from PIL import Image
from prep import key, bbox, foot, shift, trim_box, save, RAW, OUT

meta = json.load(open('../../src/flamingo/sprites.json'))

# scientist poses: same height as 'sci', feet on the same point; padded canvas so nothing gets cut
P = 220
pad = lambda a: np.pad(a, ((P, P), (P, P), (0, 0)))
sci, _ = key(RAW + 'scientist.png')
sci = pad(sci)
c0 = bbox(sci)
fs0 = foot(sci)
for name, src in (('sci_pointer', 'scientist_pointer.png'), ('sci_amazed', 'scientist_amazed.png')):
    arr, _ = key(RAW + src, holes=True)
    arr = pad(arr)
    c1 = bbox(arr)
    s = (c0[3] - c0[1]) / (c1[3] - c1[1])
    f1 = foot(arr)
    arr = shift(arr, fs0[0] - f1[0], fs0[1] - f1[1], s, f1[0], f1[1])
    box = trim_box([arr])
    save(name, arr, box, meta)
    meta[name]['feet'] = [float(fs0[0] - box[0]), float(fs0[1] - box[1])]
    print(name, 'scale', round(s, 3), 'box', box)

# flock: own frame, feet line measured
flock, _ = key(RAW + 'flock.png', holes=True)
fb = trim_box([flock])
save('flock', flock, fb, meta)
fbb = bbox(flock)
meta['_flock'] = {'feet_y': float(fbb[3] - fb[1]), 'top': float(fbb[1] - fb[1])}

# X-ray card: crop around the leg, no keying (it is an opaque card)
xr = Image.open(RAW + 'xray_leg.png').convert('RGB')
crop = (150, 0, 870, 1536)
xr.crop(crop).save(OUT + 'xray_card.png', optimize=True)
meta['xray_card'] = {'w': crop[2] - crop[0], 'h': crop[3] - crop[1], 'ox': crop[0], 'oy': crop[1]}

shutil.copy(RAW + 'bg_zoo.png', '../../public/flamingo/bg/bg_zoo.png')
json.dump(meta, open('../../src/flamingo/sprites.json', 'w'), indent=1, default=float)

# QA sheet on a coloured background
tiles = []
for n in ('sci', 'sci_pointer', 'sci_amazed', 'flock', 'xray_card'):
    im = Image.open(OUT + n + '.png').convert('RGBA')
    im.thumbnail((380, 600))
    t = Image.new('RGBA', (400, 620), (255, 196, 64, 255))
    t.alpha_composite(im, ((400 - im.width) // 2, (620 - im.height) // 2))
    tiles.append(t)
sheet = Image.new('RGBA', (400 * len(tiles), 620))
for i, t in enumerate(tiles):
    sheet.paste(t, (400 * i, 0))
sheet.convert('RGB').save('qa/sheet2.png')
print(json.dumps({k: meta[k] for k in ('sci_pointer', 'sci_amazed', 'flock', '_flock', 'xray_card')}, default=float)); print(meta['_sci'])
