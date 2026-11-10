"""prep.py - raw keyed PNGs (images/tiger/raw/*.png) -> trimmed sprites in public/tiger/ + src/tiger/sprites.ts

For every sprite: trim to the alpha box, find the anchor (feet / head / centre), work out the scale that gives it
its size in world units (1 world unit = 1 comp px on the character plane), and write the numbers to sprites.ts.
Pose groups (edits of one drawing) are registered to the first picture so swaps do not jump.
Green "deer vision" tigers are recoloured copies of the orange ones, so they line up exactly.
"""
import json
import os
import sys
import numpy as np
import cv2
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
RAW = os.path.join(HERE, "raw")
PUB = os.path.join(ROOT, "public", "tiger")
OUT_TS = os.path.join(ROOT, "src", "tiger", "sprites.ts")
PAD = 12
MAX_SIDE = 2048

# size: ("head", r) head radius in world units | ("h", px) | ("w", px)
# pts: extra named points as fractions of the trimmed box (set after looking at the pictures)
SPRITES = {
    "guy_point": dict(anchor="feet", size=("head", 112)),
    "guy_eyes": dict(anchor="head", size=("head", 112)),
    "tiger_hide": dict(anchor="feet", size=("w", 560), group="tiger"),
    "tiger_sheepish": dict(anchor="feet", size=("w", 560), group="tiger"),
    "tiger_smug": dict(anchor="feet", size=("w", 560), group="tiger"),
    "tiger_paint": dict(anchor="feet", size=("h", 470)),
    "deer_chew": dict(anchor="feet", size=("h", 560), pts={"eye": (0.2, 0.2), "top": (0.25, 0.0)}),
    "deer_confused": dict(anchor="feet", size=("h", 560), pts={"eye": (0.2, 0.2), "top": (0.25, 0.0)}),
    "bush_small": dict(anchor="feet", size=("w", 250)),
    "bushes_mid": dict(anchor="feet", size=("w", 2700)),
    "fg_leaves": dict(anchor="center", size=("w", 620)),
    "jungle_bg": dict(anchor="center", size=("w", 4700), opaque=True, max_side=4096),
}
GREEN_COPIES = ["tiger_hide", "tiger_smug"]
OVERRIDES = os.path.join(HERE, "points.json")  # optional {"sprite": {"pts": {...}}}


def load(name):
    p = os.path.join(RAW, name + ".png")
    return np.asarray(Image.open(p).convert("RGBA")).copy() if os.path.exists(p) else None


def bbox(alpha):
    ys, xs = np.where(alpha > 16)
    return xs.min(), ys.min(), xs.max() + 1, ys.max() + 1


def head_disc(alpha):
    a8 = (alpha > 128).astype(np.uint8)
    h, w = a8.shape
    ff = np.pad(a8, 1)
    cv2.floodFill(ff, None, (0, 0), 2)
    solid = np.where(ff[1:-1, 1:-1] == 2, 0, 1).astype(np.uint8)
    dt = cv2.distanceTransform(solid, cv2.DIST_L2, 5)
    hy, hx = np.unravel_index(dt.argmax(), dt.shape)
    return float(hx), float(hy), float(dt[hy, hx])


def feet(alpha):
    h, w = alpha.shape
    rows = max(2, int(h * 0.035))
    ys, xs = np.where(alpha[h - rows:] > 128)
    return float((xs.min() + xs.max()) / 2), float(h - 1)


def shift_to(base_a, a):
    """integer (dx, dy) that moves `a` onto `base_a` (phase correlation of the alpha masks)."""
    f0 = cv2.GaussianBlur(base_a.astype(np.float32), (0, 0), 3)
    f1 = cv2.GaussianBlur(a.astype(np.float32), (0, 0), 3)
    (dx, dy), resp = cv2.phaseCorrelate(f1, f0)
    return int(round(dx)), int(round(dy)), resp


def green_recolour(rgba, target_rgb):
    """orange fur -> the leaf green, keeping the shading; black stripes and white parts stay."""
    rgb = rgba[..., :3]
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV).astype(np.float32)
    hh, ss, vv = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    m = (hh >= 3) & (hh <= 24) & (ss > 90) & (vv > 90)  # OpenCV hue 0..179: orange ~ 8..20
    if m.sum() == 0:
        return rgba
    t = cv2.cvtColor(np.uint8([[target_rgb]]), cv2.COLOR_RGB2HSV)[0, 0].astype(np.float32)
    v_med = np.median(vv[m])
    s_med = np.median(ss[m])
    hsv[..., 0][m] = t[0]
    hsv[..., 1][m] = np.clip(ss[m] * (t[1] / s_med), 0, 255)
    hsv[..., 2][m] = np.clip(vv[m] * (t[2] / v_med), 0, 255)
    out = rgba.copy()
    out[..., :3] = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2RGB)
    return out


def dominant_green(rgba):
    rgb = rgba[..., :3][rgba[..., 3] > 200]
    hsv = cv2.cvtColor(rgb[None], cv2.COLOR_RGB2HSV)[0]
    m = (hsv[:, 0] > 35) & (hsv[:, 0] < 85) & (hsv[:, 1] > 60) & (hsv[:, 2] > 60)
    if m.sum() < 50:
        return (86, 168, 58)
    # the most common green = the flat fill
    q = (rgb[m] // 8).astype(np.int32)
    keys = q[:, 0] * 1024 + q[:, 1] * 32 + q[:, 2]
    vals, counts = np.unique(keys, return_counts=True)
    sel = keys == vals[counts.argmax()]
    return tuple(int(v) for v in rgb[m][sel].mean(0))


def main():
    os.makedirs(PUB, exist_ok=True)
    over = json.load(open(OVERRIDES)) if os.path.exists(OVERRIDES) else {}
    imgs = {n: load(n) for n in SPRITES}
    missing = [n for n, v in imgs.items() if v is None]
    if missing:
        print("missing raw pictures:", missing)
    # register pose groups to their first member
    groups = {}
    for n, c in SPRITES.items():
        if c.get("group") and imgs[n] is not None:
            groups.setdefault(c["group"], []).append(n)
    group_box = {}
    for g, names in groups.items():
        base = imgs[names[0]]
        for n in names[1:]:
            im = imgs[n]
            if im.shape != base.shape:
                im = np.asarray(Image.fromarray(im).resize((base.shape[1], base.shape[0]), Image.LANCZOS)).copy()
            dx, dy, resp = shift_to(base[..., 3], im[..., 3])
            if abs(dx) + abs(dy) > 0:
                M = np.float32([[1, 0, dx], [0, 1, dy]])
                im = cv2.warpAffine(im, M, (im.shape[1], im.shape[0]), flags=cv2.INTER_LINEAR, borderValue=(0, 0, 0, 0))
            print(f"group {g}: {n} shift=({dx},{dy}) resp={resp:.2f}")
            imgs[n] = im
        boxes = np.array([bbox(imgs[n][..., 3]) for n in names])
        group_box[g] = (boxes[:, 0].min(), boxes[:, 1].min(), boxes[:, 2].max(), boxes[:, 3].max())

    leaf = dominant_green(imgs["bush_small"]) if imgs.get("bush_small") is not None else (86, 168, 58)
    print("leaf green", leaf)
    meta = {}
    group_ref = {}

    def emit(name, im, cfg):
        H, W = im.shape[:2]
        if cfg.get("opaque"):
            x0, y0, x1, y1 = 0, 0, W, H
        else:
            x0, y0, x1, y1 = group_box[cfg["group"]] if cfg.get("group") else bbox(im[..., 3])
            x0, y0, x1, y1 = max(0, x0 - PAD), max(0, y0 - PAD), min(W, x1 + PAD), min(H, y1 + PAD)
        crop = im[y0:y1, x0:x1]
        h, w = crop.shape[:2]
        a = crop[..., 3]
        g = cfg.get("group")
        if g and g in group_ref:
            ax, ay, head, scale = group_ref[g]
        else:
            head = None
            if cfg["size"][0] == "head" or cfg["anchor"] == "head":
                head = head_disc(a)
            if cfg["anchor"] == "feet":
                ax, ay = feet(a)
            elif cfg["anchor"] == "head":
                ax, ay = head[0], head[1]
            else:
                ax, ay = w / 2, h / 2
            kind, val = cfg["size"]
            if kind == "head":
                scale = val / head[2]
            elif kind == "h":
                bx = bbox(a) if not cfg.get("opaque") else (0, 0, w, h)
                scale = val / (bx[3] - bx[1])
            else:
                bx = bbox(a) if not cfg.get("opaque") else (0, 0, w, h)
                scale = val / (bx[2] - bx[0])
            if g:
                group_ref[g] = (ax, ay, head, scale)
        # limit the stored size
        ms = cfg.get("max_side", MAX_SIDE)
        f = min(1.0, ms / max(w, h))
        if f < 1:
            crop = np.asarray(Image.fromarray(crop).resize((round(w * f), round(h * f)), Image.LANCZOS))
        out = os.path.join(PUB, name + (".jpg" if cfg.get("opaque") else ".png"))
        if cfg.get("opaque"):
            Image.fromarray(crop[..., :3]).save(out, quality=93)
        else:
            Image.fromarray(crop).save(out, optimize=True)
        m = dict(file=f"tiger/{os.path.basename(out)}", w=round(w * scale, 2), h=round(h * scale, 2),
                 ax=round(ax * scale, 2), ay=round(ay * scale, 2))
        if head:
            m["head"] = dict(x=round(head[0] * scale, 2), y=round(head[1] * scale, 2), r=round(head[2] * scale, 2))
        pts = dict(cfg.get("pts", {}))
        pts.update(over.get(name, {}).get("pts", {}))
        if pts:
            m["pts"] = {k: dict(x=round(v[0] * w * scale, 2), y=round(v[1] * h * scale, 2)) for k, v in pts.items()}
        meta[name] = m

    for name, cfg in SPRITES.items():
        im = imgs[name]
        if im is None:
            continue
        emit(name, im, cfg)
        if name in GREEN_COPIES:
            emit(name + "_green", green_recolour(im, leaf), cfg)

    os.makedirs(os.path.dirname(OUT_TS), exist_ok=True)
    with open(OUT_TS, "w") as f:
        f.write("// generated by images/tiger/prep.py - do not edit by hand\n")
        f.write("export type Spr = {file: string; w: number; h: number; ax: number; ay: number;\n")
        f.write("  head?: {x: number; y: number; r: number}; pts?: Record<string, {x: number; y: number}>};\n")
        f.write(f"export const LEAF_GREEN = 'rgb({leaf[0]}, {leaf[1]}, {leaf[2]})';\n")
        f.write("export const SPR = " + json.dumps(meta, indent=1) + " satisfies Record<string, Spr>;\n")
        f.write("export type SprName = keyof typeof SPR;\n")
    print("wrote", OUT_TS, "sprites:", len(meta))


if __name__ == "__main__":
    main()
