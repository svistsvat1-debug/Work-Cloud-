"""prep.py - raw pictures -> trimmed transparent sprites in public/phages/ + measurements in src/phages/sprites.ts
+ a QA sheet (images/phages/qa/sheet.png) on a coloured background with every measured point marked.

Source for each name: images/phages/raw/*<name>*.(png|jpg|jpeg|webp) if it exists (the real Google Flow picture),
otherwise images/phages/placeholder/<name>.png. Manual fixes for points: images/phages/points.json
({"guy_present": {"palm": [x, y]}} in TRIMMED sprite pixels)."""
import glob
import json
import os

import cv2
import numpy as np

from key import has_transparency, key

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
IMG = os.path.join(ROOT, "images", "phages")
PUB = os.path.join(ROOT, "public", "phages")
TS = os.path.join(ROOT, "src", "phages", "sprites.ts")
PAD = 12
MAX_SIDE = 1400   # sprites never need more than this (largest on-screen size at 4K is ~1300 px)

NAMES = ["guy_present", "guy_drop", "guy_shrug", "guy_oldtimey", "guy_scared",
         "phage", "bact_rod", "bact_round", "bact_comma", "pill", "lab_bg"]


def find_source(name):
    for ext in ("png", "jpg", "jpeg", "webp", "PNG", "JPG"):
        hits = sorted(glob.glob(os.path.join(IMG, "raw", f"*{name}*.{ext}")))
        if hits:
            return hits[-1], "raw"
    return os.path.join(IMG, "placeholder", f"{name}.png"), "placeholder"


def load_rgba(path):
    src = cv2.imread(path, cv2.IMREAD_UNCHANGED)
    if src.ndim == 2:
        src = cv2.cvtColor(src, cv2.COLOR_GRAY2BGRA)
    if src.shape[2] == 3:
        src = cv2.cvtColor(src, cv2.COLOR_BGR2BGRA)
    return cv2.cvtColor(src, cv2.COLOR_BGRA2RGBA)


def trim(rgba):
    a = rgba[..., 3] > 16
    ys, xs = np.where(a)
    y0, y1, x0, x1 = max(ys.min() - PAD, 0), min(ys.max() + PAD + 1, a.shape[0]), max(xs.min() - PAD, 0), min(xs.max() + PAD + 1, a.shape[1])
    out = rgba[y0:y1, x0:x1]
    s = min(1.0, MAX_SIDE / max(out.shape[:2]))
    if s < 1:
        out = cv2.resize(out, (round(out.shape[1] * s), round(out.shape[0] * s)), interpolation=cv2.INTER_AREA)
    return out, (x0, y0), s


def solid_mask(alpha):
    a8 = (alpha > 128).astype(np.uint8)
    h, w = a8.shape
    ff = a8.copy()
    cv2.floodFill(ff, np.zeros((h + 2, w + 2), np.uint8), (0, 0), 2)
    return np.where(ff == 2, 0, 1).astype(np.uint8)


def disc(solid, y_lo=0.0, y_hi=1.0, central=False):
    """largest inscribed disc; central=True: among near-maximal discs take the one closest to the centroid
    (long shapes like a rod or a capsule have a whole ridge of equal discs)."""
    m = solid.copy()
    h = m.shape[0]
    m[: int(h * y_lo)] = 0
    m[int(h * y_hi):] = 0
    dt = cv2.distanceTransform(m, cv2.DIST_L2, 5)
    if central:
        ys, xs = np.where(dt >= 0.92 * dt.max())
        cy, cx = np.argwhere(m > 0).mean(0)
        i = np.argmin((xs - cx) ** 2 + (ys - cy) ** 2)
        hy, hx = ys[i], xs[i]
    else:
        hy, hx = np.unravel_index(dt.argmax(), dt.shape)
    return [int(hx), int(hy), round(float(dt[hy, hx]), 1)]


def body_colour(rgba, d):
    """median fill colour inside the face disc (outline / dark spots / highlights excluded) -> '#rrggbb'"""
    h, w = rgba.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w]
    inside = ((xx - d[0]) ** 2 + (yy - d[1]) ** 2) < (0.8 * d[2]) ** 2
    px = rgba[inside & (rgba[..., 3] > 200)][:, :3].astype(int)
    lum = px.sum(1)
    px = px[(lum >= np.percentile(lum, 30)) & (lum <= np.percentile(lum, 85))]
    c = np.median(px, 0).astype(int) if len(px) else np.array([200, 200, 200])
    return "#%02x%02x%02x" % tuple(c)


def feet(alpha):
    a = alpha > 128
    ys = np.where(a.any(1))[0]
    yb = ys.max()
    band = a[int(yb - 0.035 * a.shape[0]): yb + 1]
    xs = np.where(band.any(0))[0]
    return [int((xs.min() + xs.max()) / 2), int(yb)]


def top_point(a, xlo, xhi, ylo, yhi):
    sub = a[ylo:yhi, xlo:xhi]
    ys, xs = np.where(sub)
    if len(ys) == 0:
        return None
    y = ys.min()
    row = xs[ys <= y + 4]
    return [int(xlo + np.median(row)), int(ylo + y)]


def top_profile(a, step=10):
    prof = []
    for x in range(0, a.shape[1], step):
        col = np.where(a[:, x])[0]
        prof.append(int(col.min()) if len(col) else -1)
    return prof


def measure(name, rgba):
    alpha = rgba[..., 3]
    a = alpha > 128
    h, w = a.shape
    sol = solid_mask(alpha)
    m = {"w": int(w), "h": int(h)}
    if name.startswith("guy_"):
        head = disc(sol, 0.0, 0.62)
        m["head"] = head
        m["feet"] = feet(alpha)
        hx, hy, r = head
        arm_lo, arm_hi = int(hy + 0.55 * r), int(m["feet"][1] - 0.30 * h)
        if name in ("guy_present", "guy_drop"):
            ys, xs = np.where(a[arm_lo:arm_hi])
            xmin = xs.min()
            band = int(0.07 * w)
            if name == "guy_present":
                m["palm"] = top_point(a, xmin, xmin + band, arm_lo, arm_hi)
            else:
                sel = xs <= xmin + 6
                m["hand"] = [int(xmin), int(arm_lo + np.median(ys[sel]))]
        if name == "guy_shrug":
            lo = int(hy - 0.4 * r)
            m["palmL"] = top_point(a, 0, max(int(hx - 1.15 * r), 1), lo, arm_hi)
            m["palmR"] = top_point(a, min(int(hx + 1.15 * r), w - 1), w, lo, arm_hi)
    elif name == "phage":
        m["face"] = disc(sol, 0.0, 0.5)
        m["feet"] = feet(alpha)
        m["body"] = body_colour(rgba, m["face"])
    elif name.startswith("bact_"):
        m["face"] = disc(sol, central=True)
        m["body"] = body_colour(rgba, m["face"])
        m["top"] = top_profile(a)
        ys = np.where(a.any(1))[0]
        m["bottom"] = int(ys.max())
    elif name == "pill":
        m["face"] = disc(sol, central=True)
        m["body"] = body_colour(rgba, m["face"])
    return m


def sheet(sprites, metas):
    cell = 420
    cols = 4
    rows = (len(sprites) + cols - 1) // cols
    out = np.zeros((rows * cell, cols * cell, 3), np.uint8)
    out[:] = (60, 170, 120)
    for i, (name, rgba) in enumerate(sprites):
        r, c = divmod(i, cols)
        s = min((cell - 40) / rgba.shape[1], (cell - 60) / rgba.shape[0])
        im = cv2.resize(rgba, (max(1, int(rgba.shape[1] * s)), max(1, int(rgba.shape[0] * s))), interpolation=cv2.INTER_AREA)
        ox, oy = c * cell + (cell - im.shape[1]) // 2, r * cell + 40 + (cell - 60 - im.shape[0]) // 2
        al = im[..., 3:4] / 255.0
        roi = out[oy:oy + im.shape[0], ox:ox + im.shape[1]]
        roi[:] = (roi * (1 - al) + im[..., :3] * al).astype(np.uint8)
        m = metas[name]
        for k in ("head", "face"):
            if k in m:
                cv2.circle(out, (int(ox + m[k][0] * s), int(oy + m[k][1] * s)), int(m[k][2] * s), (255, 0, 255), 2)
        for k in ("feet", "palm", "hand", "palmL", "palmR"):
            if k in m and m[k]:
                cv2.circle(out, (int(ox + m[k][0] * s), int(oy + m[k][1] * s)), 7, (255, 40, 40), -1)
        cv2.putText(out, f"{name} [{m['src_kind'][0]}]", (c * cell + 10, r * cell + 28), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
    os.makedirs(os.path.join(IMG, "qa"), exist_ok=True)
    cv2.imwrite(os.path.join(IMG, "qa", "sheet.png"), cv2.cvtColor(out, cv2.COLOR_RGB2BGR))


def main():
    os.makedirs(PUB, exist_ok=True)
    overrides = {}
    pj = os.path.join(IMG, "points.json")
    if os.path.exists(pj):
        overrides = json.load(open(pj))
    metas, sprites = {}, []
    for name in NAMES:
        path, kind = find_source(name)
        rgba = load_rgba(path)
        if not has_transparency(rgba):
            rgba = key(rgba)
        rgba, off, s = trim(rgba)
        cv2.imwrite(os.path.join(PUB, f"{name}.png"), cv2.cvtColor(rgba, cv2.COLOR_RGBA2BGRA))
        m = measure(name, rgba)
        m.update(overrides.get(name, {}))
        m["src_kind"] = kind
        metas[name] = m
        sprites.append((name, rgba))
        print(f"{name:13s} {kind:11s} {m['w']}x{m['h']}  " + " ".join(f"{k}={v}" for k, v in m.items() if k in ("head", "feet", "palm", "hand", "palmL", "palmR", "face")))
    sheet(sprites, metas)
    os.makedirs(os.path.dirname(TS), exist_ok=True)
    with open(TS, "w") as f:
        f.write("// GENERATED by images/phages/scripts/prep.py - do not edit by hand (fix points in images/phages/points.json)\n")
        f.write("export type SpriteMeta = {src: string; w: number; h: number; head?: number[]; feet?: number[]; palm?: number[];\n")
        f.write("  hand?: number[]; palmL?: number[]; palmR?: number[]; face?: number[]; top?: number[]; bottom?: number; body?: string;\n  src_kind: string};\n")
        f.write("export const S: Record<string, SpriteMeta> = {\n")
        for name, m in metas.items():
            f.write(f"  {name}: {json.dumps({'src': f'phages/{name}.png', **m})},\n")
        f.write("};\n")
    print("->", TS)


if __name__ == "__main__":
    main()
