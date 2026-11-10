"""All cut-out sprites for the mosquito Short.
raw/*.png (flat magenta background) -> public/mosquito/sprites/*.png + src/mosquito/sprites.json
"""
import json, os
import numpy as np, cv2
from PIL import Image

OUT = '../../public/mosquito/sprites/'
os.makedirs(OUT, exist_ok=True)
os.makedirs('qa', exist_ok=True)
INK = np.array([22, 22, 24], np.float32)
EL = lambda k: cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))


def key(path):
    src = np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
    border = np.concatenate([src[0], src[-1], src[:, 0], src[:, -1]])
    bgc = np.median(border, 0)
    dist = np.sqrt(((src - bgc) ** 2).sum(2))
    bg = dist < 90
    # keep only background connected to the border or big magenta holes (no magenta inside the art)
    band = (cv2.dilate(bg.astype(np.uint8), EL(7)) > 0) & ~bg
    alpha = np.ones(bg.shape, np.float32)
    alpha[bg] = 0
    full = float(np.sqrt(((INK - bgc) ** 2).sum()))
    alpha[band] = np.clip((dist[band] - 40) / (full - 40), 0, 1)
    rgb = src.copy()
    rgb[band] = INK
    return rgb, alpha


def bbox(mask, pad=6):
    ys, xs = np.nonzero(mask)
    return [int(xs.min()) - pad, int(ys.min()) - pad, int(xs.max()) + pad + 1, int(ys.max()) + pad + 1]


def save(rgb, alpha, mask, box, name):
    x0, y0, x1, y1 = box
    a = (alpha * mask * 255).astype(np.uint8)
    rgba = np.dstack([rgb.clip(0, 255).astype(np.uint8), a])
    pad = np.zeros((rgba.shape[0] + 40, rgba.shape[1] + 40, 4), np.uint8)
    pad[20:-20, 20:-20] = rgba
    crop = pad[y0 + 20:y1 + 20, x0 + 20:x1 + 20]
    Image.fromarray(crop, 'RGBA').save(OUT + name + '.png', optimize=True)
    return crop


meta = {}

# ------------------------------------------------------------------ mosquito poses
def head_circle(rgb, fg):
    lum = rgb.mean(2)
    sat = rgb.max(2) - rgb.min(2)
    grey = (sat < 18) & (lum > 95) & (lum < 145) & fg
    grey = cv2.morphologyEx(grey.astype(np.uint8), cv2.MORPH_OPEN, EL(5))
    n, lab, st, cen = cv2.connectedComponentsWithStats(grey, 8)
    best = max(range(1, n), key=lambda i: st[i, cv2.CC_STAT_AREA] * (1 if cen[i][0] > grey.shape[1] * 0.45 else 0.2))
    m = (lab == best).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, EL(41))  # fill the eyes / mouth holes
    cnts, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    (cx, cy), r = cv2.minEnclosingCircle(max(cnts, key=cv2.contourArea))
    area = float(m.sum())
    r = float(np.sqrt(area / np.pi))  # robust radius from filled area
    return float(cx), float(cy), r


for p in ['M1', 'M2', 'M3', 'M4', 'M5']:
    rgb, alpha = key(f'raw/{p}.png')
    fg = alpha > 0.02
    lum = rgb.mean(2)
    dark = (lum < 70) & fg
    wing_fill = ((rgb[..., 2] - rgb[..., 0]) > 20) & (lum > 130) & fg
    wing_fill = cv2.morphologyEx(wing_fill.astype(np.uint8), cv2.MORPH_CLOSE, EL(9)) > 0
    n, lab, st, _ = cv2.connectedComponentsWithStats(wing_fill.astype(np.uint8), 8)
    keep = np.zeros_like(wing_fill)
    for i in range(1, n):
        if st[i, cv2.CC_STAT_AREA] > 3000:
            keep |= lab == i
    wing_fill = keep & fg
    body_fill = (fg & ~dark & ~wing_fill).astype(np.uint8)
    body_fill = cv2.morphologyEx(body_fill, cv2.MORPH_OPEN, EL(5))
    n2, lab2, st2, _ = cv2.connectedComponentsWithStats(body_fill, 8)
    bf = np.zeros(fg.shape, bool)
    for i in range(1, n2):
        if st2[i, cv2.CC_STAT_AREA] > 300:
            bf |= lab2 == i
    near_body = cv2.dilate(bf.astype(np.uint8), EL(9)) > 0
    wing_zone = cv2.dilate(wing_fill.astype(np.uint8), EL(29)) > 0
    wings = wing_fill | (wing_zone & fg & ~bf & ~near_body)
    body = fg & ~wings
    # drop thin leftovers (wing outline fragments) that are not attached to the main body
    nb, lb, sb, _ = cv2.connectedComponentsWithStats((body & (alpha > 0.3)).astype(np.uint8), 8)
    main = 1 + int(np.argmax(sb[1:, cv2.CC_STAT_AREA]))
    stray = (lb > 0) & (lb != main)
    for i in range(1, nb):
        if i != main and sb[i, cv2.CC_STAT_AREA] > 2500:
            stray &= lb != i  # keep big separate parts
    body &= ~stray
    wings |= stray & wing_zone
    box = bbox(fg)
    save(rgb, alpha, body, box, f'{p}_body')
    save(rgb, alpha, wings, box, f'{p}_wings')
    save(rgb, alpha, fg, box, f'{p}_full')
    hx, hy, hr = head_circle(rgb, fg)
    wy, wx = np.nonzero(wing_fill)
    order = np.argsort(-wy)[:300]
    pivot = [float(np.median(wx[order])) - box[0], float(np.median(wy[order])) - box[1]]
    meta[p] = {'w': box[2] - box[0], 'h': box[3] - box[1], 'head': [hx - box[0], hy - box[1], hr], 'pivot': pivot}
    print(p, meta[p])

# ------------------------------------------------------------------ raindrops
for p in ['D1', 'D2', 'D3', 'D4']:
    rgb, alpha = key(f'raw/{p}.png')
    fg = alpha > 0.02
    box = bbox(fg, 4)
    save(rgb, alpha, fg, box, p)
    ys, xs = np.nonzero(alpha > 0.5)
    width = float(xs.max() - xs.min())
    meta[p] = {'w': box[2] - box[0], 'h': box[3] - box[1], 'cx': float((xs.max() + xs.min()) / 2) - box[0],
               'bottom': float(ys.max()) - box[1], 'width': width}
    print(p, meta[p])

# ------------------------------------------------------------------ guy
for p in ['G1', 'G2', 'G3']:
    rgb, alpha = key(f'raw/{p}.png')
    fg = alpha > 0.02
    box = bbox(fg, 4)
    save(rgb, alpha, fg, box, p)
    ys, xs = np.nonzero(alpha > 0.5)
    bottom = ys.max()
    feet = xs[ys > bottom - 0.035 * (ys.max() - ys.min())]
    meta[p] = {'w': box[2] - box[0], 'h': box[3] - box[1], 'feet': [float(feet.mean()) - box[0], float(bottom) - box[1]],
               'height': float(ys.max() - ys.min())}
    print(p, meta[p])

# ------------------------------------------------------------------ bus
rgb, alpha = key('raw/B1.png')
fg = alpha > 0.02
box = bbox(fg, 4)
save(rgb, alpha, fg, box, 'B1')
ys, xs = np.nonzero(alpha > 0.5)
meta['B1'] = {'w': box[2] - box[0], 'h': box[3] - box[1], 'bottom': [float((xs.max() + xs.min()) / 2) - box[0], float(ys.max()) - box[1]],
              'width': float(xs.max() - xs.min())}
print('B1', meta['B1'])

# ------------------------------------------------------------------ balance scale parts
rgb, alpha = key('raw/S1.png')
fg = (alpha > 0.3).astype(np.uint8)
n, lab, st, cen = cv2.connectedComponentsWithStats(fg, 8)
parts = [i for i in range(1, n) if st[i, cv2.CC_STAT_AREA] > 3000]
yellow = (rgb[..., 0] > 200) & (rgb[..., 1] > 150) & (rgb[..., 2] < 90) & (alpha > 0.5)
def yellow_centres(mask):
    m = (yellow & mask).astype(np.uint8)
    k, l2, s2, c2 = cv2.connectedComponentsWithStats(m, 8)
    return [tuple(map(float, c2[i])) for i in range(1, k) if s2[i, cv2.CC_STAT_AREA] > 80]
comp = {}
for i in parts:
    x, y, w, h = st[i, :4]
    if w > 3 * h:
        comp['beam'] = i
    elif x < alpha.shape[1] * 0.55:
        comp['stand'] = i
    else:
        comp.setdefault('pans', []).append(i)
# beam
m = lab == comp['beam']
box = bbox(m, 4)
save(rgb, alpha, m | (cv2.dilate(m.astype(np.uint8), EL(5)) > 0), box, 'S_beam')
yc = sorted(yellow_centres(m))
meta['S_beam'] = {'w': box[2] - box[0], 'h': box[3] - box[1], 'left': [yc[0][0] - box[0], yc[0][1] - box[1]],
                  'pivot': [yc[1][0] - box[0], yc[1][1] - box[1]], 'right': [yc[-1][0] - box[0], yc[-1][1] - box[1]]}
# stand
m = lab == comp['stand']
box = bbox(m, 4)
save(rgb, alpha, m | (cv2.dilate(m.astype(np.uint8), EL(5)) > 0), box, 'S_stand')
ys, xs = np.nonzero(m)
meta['S_stand'] = {'w': box[2] - box[0], 'h': box[3] - box[1], 'top': [float(xs[ys < ys.min() + 10].mean()) - box[0], float(ys.min()) - box[1]],
                   'bottom': [float(xs[ys > ys.max() - 10].mean()) - box[0], float(ys.max()) - box[1]]}
# pan (top one) split into back (ring, strings, rim) and front (bowl below the rim line)
i = min(comp['pans'], key=lambda j: cen[j][1])
m = lab == i
box = bbox(m, 4)
mm = m | (cv2.dilate(m.astype(np.uint8), EL(5)) > 0)
ys, xs = np.nonzero(m)
widths = [(y, (xs[ys == y].max() - xs[ys == y].min())) for y in range(ys.min(), ys.max() + 1) if (ys == y).any()]
rim_y = max(widths, key=lambda t: t[1])[0]
ring = yellow_centres(m)[0]
H_, W_ = m.shape
yy = np.arange(H_)[:, None] * np.ones((1, W_))
save(rgb, alpha, mm & (yy < rim_y + 4), box, 'S_pan_back')
save(rgb, alpha, mm & (yy >= rim_y - 2), box, 'S_pan_front')
meta['S_pan'] = {'w': box[2] - box[0], 'h': box[3] - box[1], 'ring': [ring[0] - box[0], ring[1] - box[1]], 'rimY': float(rim_y - box[1]),
                 'bowlBottom': float(ys.max() - box[1])}
print({k: meta[k] for k in ['S_beam', 'S_stand', 'S_pan']})

json.dump(meta, open('../../src/mosquito/sprites.json', 'w'), indent=1)

# QA sheet: every sprite on a coloured background
names = ['M1_full', 'M2_full', 'M3_full', 'M4_full', 'M5_full', 'M1_body', 'M1_wings', 'M5_body', 'M5_wings',
         'D1', 'D2', 'D3', 'D4', 'G1', 'G2', 'G3', 'B1', 'S_beam', 'S_stand', 'S_pan_back', 'S_pan_front']
cell = 300
sheet = Image.new('RGB', (cell * 7, cell * 3), (120, 200, 120))
for k, nme in enumerate(names):
    im = Image.open(OUT + nme + '.png')
    im.thumbnail((cell - 10, cell - 10))
    bgc = Image.new('RGBA', im.size, (120, 200, 120, 255) if k % 2 == 0 else (90, 150, 210, 255))
    bgc.alpha_composite(im)
    sheet.paste(bgc.convert('RGB'), ((k % 7) * cell + 5, (k // 7) * cell + 5))
sheet.save('qa/sprites_sheet.png')
