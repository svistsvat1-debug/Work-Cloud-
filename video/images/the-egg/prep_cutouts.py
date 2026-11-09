"""Cut-out prep for "The Egg" Short.

Flow / Nano Banana gives 768x1376 JPEGs on a flat light-blue background. For every picture:
  1. key the background: flat colour connected to the border + enclosed holes of the same colour
     (halo ring, gate bars, mug handle, gaps between arms and body)
  2. un-blend the black outline against the background (alpha from the bg->ink mix)
  3. split sheets (10, 15, 16) into single sprites by connected components
  4. upscale 3x (premultiplied Lanczos + light unsharp, alpha edge tightened) -> crisp at 4K
  5. trim to alpha box + margin, save PNG, record offsets / sizes / head circle in sprites.json
  6. QA sheet of every cut-out on a coloured background

usage: python3 prep_cutouts.py <src_dir> <out_sprite_dir> <qa_dir>
"""
import json, os, sys
import numpy as np
import cv2

SRC, OUT, QA = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(OUT, exist_ok=True); os.makedirs(QA, exist_ok=True)
UP = 3            # upscale factor
MARGIN = 12       # px (source scale) around the trimmed alpha box
INK = np.array([18.0, 18.0, 18.0])

# file -> how to cut it: None = one sprite, or a list of names in reading order for a sheet
PLAN = {
    "01_hero_float": None, "02_hero_startled": None, "03_hero_look_side": None, "04_hero_nervous": None,
    "05_hero_shocked": None, "06_hero_shrug": None, "07_hero_pacifier": None, "08_hero_curled": None,
    "09_hero_god": None,
    "10_villain_victim": ["villain", "victim"],
    "11_god_neutral": None,
    "14_god_hands": None,
    "15_props": ["mug", "heaven", "hell", "earth"],
    "16_crowd": ["crowd_caveman", "crowd_pharaoh", "crowd_roman", "crowd_knight", "crowd_viking",
                 "crowd_pirate", "crowd_tophat", "crowd_cowboy", "crowd_chef", "crowd_builder"],
}
RENAME = {"01_hero_float": "hero_float", "02_hero_startled": "hero_startled", "03_hero_look_side": "hero_side",
          "04_hero_nervous": "hero_nervous", "05_hero_shocked": "hero_shocked", "06_hero_shrug": "hero_shrug",
          "07_hero_pacifier": "hero_pacifier", "08_hero_curled": "hero_curled", "09_hero_god": "hero_god",
          "11_god_neutral": "god", "14_god_hands": "god_hands"}


def key(rgb, loose=False):
    h, w, _ = rgb.shape
    border = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]])
    bgc = np.median(border, 0)
    # robust: median of border pixels that are close to the first median (ignores where the art touches)
    d0 = np.sqrt(((border - bgc) ** 2).sum(1))
    bgc = np.median(border[d0 < 30], 0)
    dist = np.sqrt(((rgb - bgc) ** 2).sum(2))
    near = (dist < 42).astype(np.uint8)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(near, connectivity=4)
    touch = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
    bg = np.isin(lab, list(touch))
    # enclosed holes of (almost) exactly the background colour
    for i in range(1, n):
        if i in touch:
            continue
        m = lab == i
        med, area = np.median(dist[m]), stats[i, cv2.CC_STAT_AREA]
        # holes of the background colour (JPEG shifts it a little); on the crowd sheet also tiny bluish
        # armpit gaps (no blue fills there - unlike the Earth, whose light-blue ocean highlight must stay)
        if area >= 12 and (med < 22 or (loose and med < 38 and area < 200)):
            bg |= m
    alpha = np.where(bg, 0.0, 1.0)
    col = rgb.copy()
    # un-blend the band next to the background: pixels that lie on the bg->ink colour line
    band = cv2.dilate(bg.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool) & ~bg
    v = INK - bgc
    t = ((rgb - bgc) @ v) / (v @ v)
    perp = np.sqrt(np.maximum(((rgb - bgc) ** 2).sum(2) - (t ** 2) * (v @ v), 0))
    blend = band & (perp < 40) & (t < 0.98)
    alpha[blend] = np.clip(t[blend] * 1.04, 0, 1)
    col[blend] = INK
    # remaining band pixels that are a bg + light-colour mix (no outline there): soft alpha by distance
    return col, alpha, bgc


def upscale(col, alpha):
    pm = col * alpha[..., None]
    h, w = alpha.shape
    size = (w * UP, h * UP)
    pm2 = cv2.resize(pm.astype(np.float32), size, interpolation=cv2.INTER_LANCZOS4)
    a2 = cv2.resize(alpha.astype(np.float32), size, interpolation=cv2.INTER_LANCZOS4)
    a2 = np.clip(a2, 0, 1)
    c2 = np.where(a2[..., None] > 1e-3, pm2 / np.maximum(a2[..., None], 1e-3), 0)
    c2 = np.clip(c2, 0, 255)
    # light unsharp on colour, then tighten the alpha ramp (smoothstep) so outlines stay crisp
    blur = cv2.GaussianBlur(c2, (0, 0), 1.3)
    c2 = np.clip(c2 + 0.65 * (c2 - blur), 0, 255)
    x = np.clip((a2 - 0.12) / 0.76, 0, 1)
    a2 = x * x * (3 - 2 * x)
    return c2, a2


def head_circle(alpha):
    """largest inscribed disc of the hole-filled silhouette (big-head cartoon: that's the head)"""
    a8 = (alpha > 0.5).astype(np.uint8)
    h, w = a8.shape
    ff = a8.copy()
    pad = np.zeros((h + 2, w + 2), np.uint8)
    cv2.floodFill(ff, pad, (0, 0), 2)
    solid = np.where(ff == 2, 0, 1).astype(np.uint8)
    dt = cv2.distanceTransform(solid, cv2.DIST_L2, 5)
    y, x = np.unravel_index(dt.argmax(), dt.shape)
    return float(x), float(y), float(dt[y, x])


def save_sprite(name, col, alpha, offset, meta, src_name):
    ys, xs = np.where(alpha > 0.02)
    y0, y1 = max(ys.min() - MARGIN, 0), min(ys.max() + MARGIN + 1, alpha.shape[0])
    x0, x1 = max(xs.min() - MARGIN, 0), min(xs.max() + MARGIN + 1, alpha.shape[1])
    c, a = col[y0:y1, x0:x1], alpha[y0:y1, x0:x1]
    hx, hy, hr = head_circle(a)
    c2, a2 = upscale(c, a)
    rgba = np.dstack([c2[..., ::-1], a2 * 255]).round().clip(0, 255).astype(np.uint8)  # BGR for cv2 + alpha
    cv2.imwrite(os.path.join(OUT, name + ".png"), rgba)
    meta[name] = {
        "src": src_name, "w": int(rgba.shape[1]), "h": int(rgba.shape[0]), "up": UP,
        "src_box": [int(x0 + offset[0]), int(y0 + offset[1]), int(x1 + offset[0]), int(y1 + offset[1])],
        "head": [round(hx * UP, 1), round(hy * UP, 1), round(hr * UP, 1)],
    }
    return rgba


meta = {}
for src, parts in PLAN.items():
    bgr = cv2.imread(os.path.join(SRC, src + ".jpg"), cv2.IMREAD_COLOR)
    rgb = bgr[..., ::-1].astype(np.float64)
    col, alpha, bgc = key(rgb, loose=(src == "16_crowd"))
    if parts is None:
        save_sprite(RENAME[src], col, alpha, (0, 0), meta, src)
        continue
    a8 = (alpha > 0.5).astype(np.uint8)
    n, lab, stats, cent = cv2.connectedComponentsWithStats(a8, connectivity=8)
    comps = [i for i in range(1, n) if stats[i, cv2.CC_STAT_AREA] > 1500]
    small = [i for i in range(1, n) if 0 < stats[i, cv2.CC_STAT_AREA] <= 1500]
    # attach small bits to the nearest big component
    owner = {i: i for i in comps}
    for s in small:
        cy, cx = cent[s][1], cent[s][0]
        best = min(comps, key=lambda i: (cent[i][0] - cx) ** 2 + (cent[i][1] - cy) ** 2)
        owner[s] = best
    # reading order: rows (by centre y, grouped), then x
    comps.sort(key=lambda i: cent[i][1])
    rows, row = [], []
    for i in comps:
        if row and abs(cent[i][1] - np.mean([cent[j][1] for j in row])) > 120:
            rows.append(row); row = []
        row.append(i)
    rows.append(row)
    order = [i for r in rows for i in sorted(r, key=lambda j: cent[j][0])]
    if len(order) != len(parts):
        print(f"!! {src}: found {len(order)} parts, expected {len(parts)}", [stats[i, cv2.CC_STAT_AREA] for i in order])
    for name, i in zip(parts, order):
        members = [k for k, o in owner.items() if o == i]
        m = np.isin(lab, members)
        m = cv2.dilate(m.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)  # keep soft edge pixels
        save_sprite(name, col, np.where(m, alpha, 0.0), (0, 0), meta, src)

json.dump(meta, open(os.path.join(OUT, "sprites.json"), "w"), indent=1)

# QA sheet: every sprite on a saturated colour (shows halos / holes / fringes), head circle in red
names = list(meta.keys())
cell = 360
cols = 7
rows_n = (len(names) + cols - 1) // cols
sheet = np.zeros((rows_n * (cell + 30), cols * cell, 3), np.uint8)
sheet[:] = (60, 170, 60)  # green (BGR)
for k, name in enumerate(names):
    im = cv2.imread(os.path.join(OUT, name + ".png"), cv2.IMREAD_UNCHANGED)
    s = min((cell - 20) / im.shape[1], (cell - 20) / im.shape[0])
    im = cv2.resize(im, (max(1, int(im.shape[1] * s)), max(1, int(im.shape[0] * s))), interpolation=cv2.INTER_AREA)
    r, c = divmod(k, cols)
    y0 = r * (cell + 30) + 10; x0 = c * cell + 10
    a = im[..., 3:4] / 255.0
    roi = sheet[y0:y0 + im.shape[0], x0:x0 + im.shape[1]]
    roi[:] = (im[..., :3] * a + roi * (1 - a)).astype(np.uint8)
    hx, hy, hr = meta[name]["head"]
    cv2.circle(sheet, (int(x0 + hx * s), int(y0 + hy * s)), int(hr * s), (0, 0, 255), 2)
    cv2.putText(sheet, name, (c * cell + 8, r * (cell + 30) + cell + 18), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
cv2.imwrite(os.path.join(QA, "sheet.png"), sheet)
print("sprites:", len(names))
for nme in names:
    print(f'{nme:16s} {meta[nme]["w"]}x{meta[nme]["h"]} head r={meta[nme]["head"][2]}')
