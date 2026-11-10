"""Prep: key the flat light-blue background, align poses, trim, measure.

Run from images/flamingo:  python3 -I prep.py
Outputs: ../../public/flamingo/sprites/*.png (+ backgrounds), ../../src/flamingo/sprites.json, qa/sheet.png
No upscaling: sprites keep the generated 1K resolution.
"""
import json
import shutil
import numpy as np
import cv2
from PIL import Image

RAW = 'raw/'
OUT = '../../public/flamingo/sprites/'


def key(path, holes=False):
    im = np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
    h, w, _ = im.shape
    border = np.concatenate([im[0], im[-1], im[:, 0], im[:, -1]])
    bgc = np.median(border, 0)
    dist = np.sqrt(((im - bgc) ** 2).sum(2))
    near = (dist < 45).astype(np.uint8)
    n, lab = cv2.connectedComponents(near, connectivity=4)
    edge_labels = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]).tolist())) - {0}
    bg = np.isin(lab, list(edge_labels))
    if holes:  # enclosed pockets of background (e.g. inside the sleeping flamingo's neck loop)
        for l in range(1, n):
            if l in edge_labels:
                continue
            m = lab == l
            if m.sum() > 300 and dist[m].mean() < 22:
                bg |= m
    bg = bg.astype(np.uint8)
    band = cv2.dilate(bg, np.ones((5, 5), np.uint8)) - bg
    ink = np.array([20, 20, 20], np.float32)
    dink = np.sqrt(((ink - bgc) ** 2).sum())
    alpha = np.ones((h, w), np.float32)
    alpha[bg == 1] = 0
    alpha = np.where(band == 1, np.clip(dist / dink, 0, 1), alpha)
    a3 = np.clip(alpha, 1e-3, 1)[..., None]
    fg = np.clip((im - (1 - a3) * bgc) / a3, 0, 255)
    rgb = np.where((band == 1)[..., None], fg, im)
    return np.dstack([rgb, alpha * 255]).astype(np.uint8), bgc


def bbox(rgba):
    ys, xs = np.where(rgba[..., 3] > 128)
    return xs.min(), ys.min(), xs.max(), ys.max()


def foot(rgba, frac=0.035):
    x0, y0, x1, y1 = bbox(rgba)
    a = rgba[..., 3] > 128
    rows = a[int(y1 - frac * (y1 - y0)):y1 + 1]
    xs = np.where(rows.any(0))[0]
    return float(xs.mean()), float(y1)


def shift(rgba, dx, dy, s=1.0, cx=0.0, cy=0.0):
    """Scale about (cx,cy) by s then translate by (dx,dy)."""
    M = np.float32([[s, 0, cx - s * cx + dx], [0, s, cy - s * cy + dy]])
    return cv2.warpAffine(rgba, M, (rgba.shape[1], rgba.shape[0]), flags=cv2.INTER_LINEAR,
                          borderMode=cv2.BORDER_CONSTANT, borderValue=0)


def phase(ref, mov, region):
    x0, y0, x1, y1 = region
    A = (ref[y0:y1, x0:x1, 3] > 128).astype(np.float32)
    B = (mov[y0:y1, x0:x1, 3] > 128).astype(np.float32)
    (dx, dy), _ = cv2.phaseCorrelate(B, A)
    return float(dx), float(dy)


def trim_box(arrs, pad=12):
    bs = [bbox(a) for a in arrs]
    h, w = arrs[0].shape[:2]
    return (max(min(b[0] for b in bs) - pad, 0), max(min(b[1] for b in bs) - pad, 0),
            min(max(b[2] for b in bs) + pad + 1, w), min(max(b[3] for b in bs) + pad + 1, h))


def save(name, rgba, box, meta):
    x0, y0, x1, y1 = box
    Image.fromarray(rgba[y0:y1, x0:x1], 'RGBA').save(OUT + name + '.png', optimize=True)
    meta[name] = {'w': int(x1 - x0), 'h': int(y1 - y0), 'ox': int(x0), 'oy': int(y0)}


def main():
    meta = {}
    awake, _ = key(RAW + 'flamingo_awake.png')
    dead1, _ = key(RAW + 'flamingo_dead_1leg.png')
    sleep, _ = key(RAW + 'flamingo_sleep_1leg.png', holes=True)
    dead2, _ = key(RAW + 'flamingo_dead_2leg.png', holes=True)
    sci, _ = key(RAW + 'scientist.png')
    sci1, _ = key(RAW + 'scientist_oneleg.png', holes=True)

    # edited poses: align legs + lower body on dead1 so swaps are invisible
    region = (150, 560, 900, 1460)
    for name, arr in (('awake', awake), ('sleep', sleep)):
        dx, dy = phase(dead1, arr, region)
        print(name, 'shift', round(dx, 1), round(dy, 1))
        if abs(dx) > 0.5 or abs(dy) > 0.5:
            arr[:] = shift(arr, dx, dy)

    # dead2 was generated separately: match its height and put its feet on dead1's foot point
    b1, b2 = bbox(dead1), bbox(dead2)
    s = (b1[3] - b1[1]) / (b2[3] - b2[1])
    f1, f2 = foot(dead1), foot(dead2)
    dead2 = shift(dead2, f1[0] - f2[0], f1[1] - f2[1], s, f2[0], f2[1])
    print('dead2 scale', round(s, 3))

    # scientist one-leg pose: same head size feel -> match total height, stand on the same feet line
    c0, c1 = bbox(sci), bbox(sci1)
    s2 = (c0[3] - c0[1]) / (c1[3] - c1[1]) * 1.02
    fs0, fs1 = foot(sci), foot(sci1)
    sci1 = shift(sci1, fs0[0] - fs1[0], fs0[1] - fs1[1], s2, fs1[0], fs1[1])
    print('sci1 scale', round(s2, 3))

    fbox = trim_box([awake, dead1, sleep, dead2])
    for n, a in (('fl_awake', awake), ('fl_dead1', dead1), ('fl_sleep', sleep), ('fl_dead2', dead2)):
        save(n, a, fbox, meta)
    sbox = trim_box([sci, sci1])
    for n, a in (('sci', sci), ('sci_oneleg', sci1)):
        save(n, a, sbox, meta)

    # measurements, in the trimmed sprite's own pixel space
    fx, fy = foot(dead1)
    ox, oy = fbox[0], fbox[1]
    b = bbox(dead1)
    meta['_fl'] = {
        'foot': [fx - ox, fy - oy],
        'top': float(b[1] - oy),
        'joint': [487 - ox, 1070 - oy],
        'com': [478 - ox, 700 - oy],
        'head': [640 - ox, 150 - oy],
        'headTop': [632 - ox, 86 - oy],
        'sleepHead': [0, 0],
        'beakTip': [0, 0],
    }
    # sleeping head: topmost pink region on the left half of the sprite's top part
    a = sleep[..., 3] > 128
    ys, xs = np.where(a[:700, :])
    meta['_fl']['sleepTop'] = [float(xs[ys.argmin()] - ox), float(ys.min() - oy)]
    sx, sy = foot(sci)
    cb = bbox(sci)
    meta['_sci'] = {'feet': [sx - sbox[0], sy - sbox[1]], 'top': float(cb[1] - sbox[1]),
                    'left': float(cb[0] - sbox[0]), 'right': float(cb[2] - sbox[0])}
    json.dump(meta, open('../../src/flamingo/sprites.json', 'w'), indent=1, default=float)

    for bg in ('bg_lab', 'bg_lagoon'):
        shutil.copy(RAW + bg + '.png', '../../public/flamingo/bg/' + bg + '.png')

    names = ['fl_awake', 'fl_dead1', 'fl_dead2', 'fl_sleep', 'sci', 'sci_oneleg']
    tiles = []
    for n in names:
        im = Image.open(OUT + n + '.png')
        im.thumbnail((380, 600))
        t = Image.new('RGBA', (400, 620), (255, 196, 64, 255))
        t.alpha_composite(im, ((400 - im.width) // 2, (620 - im.height) // 2))
        tiles.append(t)
    sheet = Image.new('RGBA', (400 * len(tiles), 620))
    for i, t in enumerate(tiles):
        sheet.paste(t, (400 * i, 0))
    sheet.convert('RGB').save('qa/sheet.png')
    # overlay check: dead1 vs dead2 and awake vs sleep (onion skin)
    def onion(a, b):
        A = Image.fromarray(a).convert('RGBA')
        B = Image.fromarray(b).convert('RGBA')
        B.putalpha(Image.fromarray((b[..., 3] * 0.5).astype(np.uint8)))
        base = Image.new('RGBA', A.size, (255, 255, 255, 255))
        base.alpha_composite(A)
        base.alpha_composite(B)
        return base.resize((A.width // 2, A.height // 2))
    o = Image.new('RGBA', (1024, 768))
    o.paste(onion(dead1, dead2), (0, 0))
    o.paste(onion(dead1, sleep), (512, 0))
    o.convert('RGB').save('qa/onion.png')
    print(json.dumps(meta['_fl'], default=float), json.dumps(meta['_sci'], default=float))


if __name__ == '__main__':
    main()
