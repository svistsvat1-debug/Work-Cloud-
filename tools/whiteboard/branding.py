"""Channel branding in the whiteboard style: round avatar (1000x1000) and banner (2560x1440).

usage: python branding.py GEOJSON SPRITES_DIR OUT_DIR [--name WARBOARD] [--tagline "..."]
Banner keeps all text inside YouTube's safe area (1546x423 in the centre); no template guides are drawn.
"""
import argparse
import math
import os
import sys

import cv2
import numpy as np
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import maps  # noqa: E402
import wb  # noqa: E402
from thumbnail import _fit, _paste, _text_img  # noqa: E402
from wb import INK, RED, SAND, YELLOW  # noqa: E402

OLIVE = (112, 128, 72)
OLIVE_DARK = (88, 102, 56)


def _paper(w, h, seed=9):
    big = wb.paper_background(seed=seed)
    return cv2.resize(big, (w, h), interpolation=cv2.INTER_CUBIC).astype(np.float32)


def _put(canvas, layer):
    if layer is not None:
        wb.composite(canvas, layer, layer.a)


def _arrow(canvas, pts, width, seed, head=None):
    _put(canvas, wb.polyline_arrow_layer(pts, color=RED, width=width, seed=seed, head=head))


def _circle_previews(im, out):
    for size in (176, 98):
        sm = im.resize((size, size), Image.LANCZOS)
        mask = Image.new("L", (size, size), 0)
        ImageDraw.Draw(mask).ellipse([0, 0, size - 1, size - 1], fill=255)
        bg = Image.new("RGB", (size, size), (15, 15, 15))
        bg.paste(sm, (0, 0), mask)
        bg.save(os.path.splitext(out)[0] + f"_circle{size}.png")


def avatar_map(geo, out):
    """Europe in marker on paper + a big red attack arrow."""
    S = 1000
    c = _paper(S, S)
    v = maps.MapView(-12, 45, 33, 63, 60, 120, 880, 760)
    ol, fl = maps.land_layers(v, geo, fill=SAND, width=7, seed=3)
    _put(c, fl)
    _put(c, ol)
    _arrow(c, [v.p(-2, 47.0), v.p(10, 51.5), v.p(22, 52.5), v.p(35, 55.2)], width=58, seed=5, head=120)
    im = Image.fromarray(np.clip(c, 0, 255).astype(np.uint8))
    im.save(out)
    _circle_previews(im, out)


def helmet_layers(cx, cy, w, seed=0):
    """Marker WWII helmet (generic M1-style dome + brim + strap)."""
    rx, ry = w * 0.42, w * 0.40
    t = np.linspace(math.pi, 2 * math.pi, 80)
    dome = np.stack([cx + rx * np.cos(t), cy + ry * np.sin(t) * 1.0], 1)
    dome = np.vstack([dome, [[cx + rx, cy + w * 0.03], [cx - rx, cy + w * 0.03]]])
    bw = w * 0.5
    tb = np.linspace(0, math.pi, 60)
    brim_top = np.stack([cx - bw + (2 * bw) * (tb / math.pi), cy + w * 0.01 + w * 0.02 * np.sin(tb)], 1)
    brim_bot = np.stack([cx + bw - (2 * bw) * (tb / math.pi), cy + w * 0.085 + w * 0.035 * np.sin(tb)], 1)
    brim = np.vstack([brim_top, brim_bot])
    layers = []
    m, x0, y0 = wb.poly_mask([dome])
    layers.append(wb.hatch_layer(m, x0, y0, OLIVE, spacing=11, seed=seed + 1, shade=0.12))
    m, x0, y0 = wb.poly_mask([brim])
    layers.append(wb.hatch_layer(m, x0, y0, OLIVE_DARK, spacing=10, seed=seed + 2, shade=0.12))
    ht = np.linspace(math.pi * 1.18, math.pi * 1.45, 30)
    hl = np.stack([cx + rx * 0.72 * np.cos(ht), cy + ry * 0.72 * np.sin(ht)], 1)
    layers.append(wb.stroke_layer([hl], (196, 210, 160), w * 0.035, wobble=0.5, seed=seed + 3))
    strap_l = np.array([[cx - rx * 0.82, cy + w * 0.07], [cx - rx * 0.45, cy + w * 0.3], [cx - w * 0.05, cy + w * 0.38]])
    strap_r = np.array([[cx + rx * 0.82, cy + w * 0.07], [cx + rx * 0.45, cy + w * 0.3], [cx + w * 0.05, cy + w * 0.38]])
    layers.append(wb.stroke_layer([strap_l, strap_r], (70, 60, 40), w * 0.022, wobble=0.6, seed=seed + 4))
    layers.append(wb.stroke_layer([np.vstack([dome, dome[:1]]), np.vstack([brim, brim[:1]])], INK, w * 0.022,
                                  wobble=0.8, seed=seed + 5))
    return layers


def avatar_helmet(out):
    S = 1000
    c = _paper(S, S, seed=4)
    _arrow(c, [(150, 800), (420, 860), (700, 800), (880, 640)], width=50, seed=7, head=100)
    for L in helmet_layers(500, 520, 640, seed=11):
        _put(c, L)
    im = Image.fromarray(np.clip(c, 0, 255).astype(np.uint8))
    im.save(out)
    _circle_previews(im, out)


def banner(geo, sprites, out, name, tagline):
    W, H = 2560, 1440
    c = _paper(W, H, seed=12)
    # faint marker map of Europe behind everything (visible on TV, hinted on desktop)
    v = maps.MapView(-14, 48, 32, 66, 0, 0, W, H)
    ol, fl = maps.land_layers(v, geo, fill=SAND, width=5, seed=3)
    for L in (fl, ol):
        L.a *= 0.35
        _put(c, L)
    for i, pts in enumerate([[(14, 56.5), (22, 59.5), (31, 60.3)], [(12, 41.6), (20, 41.0), (28, 40.4)]]):
        lay = wb.polyline_arrow_layer([v.p(*p) for p in pts], color=RED, width=26, seed=30 + i, head=60)
        lay.a *= 0.45
        _put(c, lay)
    # side doodles in the 'desktop max' strip (outside the safe area)
    for key, cx, w, flip in [("tank", 270, 420, False), ("spitfire", 2300, 420, False)]:
        p = os.path.join(sprites, key + ".png")
        if os.path.exists(p):
            _put(c, wb.sprite_layer(p, cx, 720, h=w * 0.62, w=w, flip=flip, seed=3))
    im = Image.fromarray(np.clip(c, 0, 255).astype(np.uint8)).convert("RGBA")
    # name + tagline inside the safe area: x 507..2053, y 508..931
    head, tail = name[:3], name[3:]
    f = _fit("Anton-Regular.ttf", name, 270, 1250)
    ih = _text_img(head, f, (226, 36, 44, 255), pad=0)
    it = _text_img(tail, f, (20, 20, 22, 255), pad=0)
    row = Image.new("RGBA", (ih.width + it.width + 10, max(ih.height, it.height)), (0, 0, 0, 0))
    row.alpha_composite(ih, (0, row.height - ih.height))
    row.alpha_composite(it, (ih.width + 10, row.height - it.height))
    _paste(im, row, 1280, 645, anchor="mm")
    ft = _fit("Anton-Regular.ttf", tagline, 78, 1250)
    _paste(im, _text_img(tagline, ft, (30, 30, 34, 255), pad=0), 1280, 872, anchor="mm")
    arr = np.asarray(im.convert("RGB")).astype(np.float32)
    x0 = 1280 - row.width // 2
    _put(arr, wb.underline_layer(x0 + 10, x0 + row.width - 10, 645 + row.height // 2 + 18, color=RED, width=20,
                                 seed=41))
    Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).save(out)
    # preview of what a phone shows (the centre 1546x423)
    Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8)).crop((507, 508, 2053, 931)).save(
        os.path.splitext(out)[0] + "_mobile_crop.png")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("geo")
    ap.add_argument("sprites")
    ap.add_argument("out_dir")
    ap.add_argument("--name", default="WARBOARD")
    ap.add_argument("--tagline", default="WORLD WAR 2 — ONE QUESTION AT A TIME")
    a = ap.parse_args()
    os.makedirs(a.out_dir, exist_ok=True)
    geo = maps.load_geo(a.geo)
    avatar_map(geo, os.path.join(a.out_dir, "avatar_map.png"))
    avatar_helmet(os.path.join(a.out_dir, "avatar_helmet.png"))
    banner(geo, a.sprites, os.path.join(a.out_dir, "banner.png"), a.name, a.tagline)
