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


# ------------------------------------------------------------------ 'WARBOARD' avatar: a board with the war drawn on it
def _board_drawing(geo, w, h, seed=0):
    """Europe in marker + bold red attack arrow, on a transparent (w,h) RGBA float canvas over white."""
    c = np.ones((h, w, 3), np.float32) * 252.0
    v = maps.MapView(-11, 42, 35, 62, int(w * 0.04), int(h * 0.05), int(w * 0.92), int(h * 0.9))
    ol, fl = maps.land_layers(v, geo, fill=SAND, width=max(3.0, w / 170), seed=3 + seed)
    _put(c, fl)
    _put(c, ol)
    _arrow(c, [v.p(-1.5, 47.5), v.p(9, 51.3), v.p(20, 52.3), v.p(32, 54.6)], width=max(10, w / 16), seed=5 + seed,
           head=w / 7.5)
    return c


def avatar_warboard(geo, out, bg=(30, 32, 37)):
    """Whiteboard-style: a framed board on a dark background, war map + red arrow, red marker on the tray."""
    S = 1000
    c = np.ones((S, S, 3), np.float32) * np.array(bg, np.float32)
    rng = np.random.default_rng(2)
    c += (wb.smooth_noise(S, S, 40, rng) * 3)[..., None]
    bx0, by0, bx1, by1 = 105, 250, 895, 705
    board = _board_drawing(geo, bx1 - bx0, by1 - by0)
    c[by0:by1, bx0:bx1] = board
    frame = wb.rounded_rect_path(bx0 - 6, by0 - 6, bx1 + 6, by1 + 6, r=14)
    _put(c, wb.stroke_layer([frame], (178, 182, 188), 22, wobble=0.3, seed=8, tex=0.04))
    _put(c, wb.stroke_layer([frame], (60, 62, 66), 4, wobble=0.3, seed=9, tex=0.02))
    # marker tray + red marker
    tray = wb.rect_poly(bx0 + 40, by1 + 16, bx1 - 40, by1 + 44)
    ol, fl = wb.shape_layers([tray], (150, 154, 160), (60, 62, 66), 5, seed=10)
    _put(c, fl)
    _put(c, ol)
    body = wb.rect_poly(560, by1 + 2, 760, by1 + 30)
    cap = wb.rect_poly(760, by1 + 4, 812, by1 + 28)
    for poly, col, sd in [(body, RED, 11), (cap, (150, 20, 24), 12)]:
        ol, fl = wb.shape_layers([poly], col, INK, 5, seed=sd)
        _put(c, fl)
        _put(c, ol)
    im = Image.fromarray(np.clip(c, 0, 255).astype(np.uint8))
    im.save(out)
    _circle_previews(im, out)


def avatar_warboard_real(geo, photo, out):
    """Realistic: draw the war map onto the blank board of a real-looking whiteboard photo (multiply blend)."""
    im = np.asarray(Image.open(photo).convert("RGB")).astype(np.float32)
    g = cv2.cvtColor(im.astype(np.uint8), cv2.COLOR_RGB2GRAY)
    bright = (g > 185).astype(np.uint8)
    bright = cv2.morphologyEx(bright, cv2.MORPH_OPEN, np.ones((9, 9), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(bright, connectivity=4)
    i = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
    x, y, w, h = st[i, 0], st[i, 1], st[i, 2], st[i, 3]
    pad = int(min(w, h) * 0.06)
    x0, y0, x1, y1 = x + pad, y + pad, x + w - pad, y + h - pad
    drawing = _board_drawing(geo, x1 - x0, y1 - y0, seed=1) / 252.0
    region = im[y0:y1, x0:x1]
    mask = (lab[y0:y1, x0:x1] == i)[..., None].astype(np.float32)
    mask = cv2.GaussianBlur(mask[..., 0], (0, 0), 2)[..., None]
    im[y0:y1, x0:x1] = region * (1 - mask) + region * drawing * mask
    out_im = Image.fromarray(np.clip(im, 0, 255).astype(np.uint8))
    # square crop centred on the board, slightly larger than it
    cx, cy, side = x + w / 2, y + h / 2, int(max(w, h) * 1.22)
    left, top = int(max(0, cx - side / 2)), int(max(0, cy - side / 2))
    side = min(side, out_im.width - left, out_im.height - top)
    out_im = out_im.crop((left, top, left + side, top + side)).resize((1000, 1000), Image.LANCZOS)
    out_im.save(out)
    _circle_previews(out_im, out)


# ------------------------------------------------------------------ creative avatars v3 (paper, edge to edge, no frame)
def _rot(poly, cx, cy, ang):
    c, s = math.cos(ang), math.sin(ang)
    p = np.asarray(poly, float) - [cx, cy]
    return np.stack([p[:, 0] * c - p[:, 1] * s, p[:, 0] * s + p[:, 1] * c], 1) + [cx, cy]


def _shape(c, polys, fill, seed, width=10, spacing=10):
    """Opaque marker shape: solid base (so nothing shows through), hatch texture, ink outline."""
    m, x0, y0 = wb.poly_mask(polys)
    base = wb.Layer(np.ones(m.shape + (3,), np.float32) * np.array(fill, np.float32), m.astype(np.float32),
                    np.zeros(m.shape, np.float32), x0, y0)
    _put(c, base)
    ol, fl = wb.shape_layers(polys, fill, INK, width, seed=seed, spacing=spacing)
    _put(c, fl)
    _put(c, ol)


def _marker(c, cx, cy, length, w, ang, body, cap, seed):
    """Whiteboard marker centred at (cx, cy), rotated by ang: body, cap, white label band, conical tip."""
    L, h = length / 2, w / 2
    parts = [
        (wb.rect_poly(cx - L + 0.10 * length, cy - h, cx + L - 0.26 * length, cy + h), body),        # barrel
        (wb.rect_poly(cx + L - 0.26 * length, cy - h * 1.08, cx + L - 0.06 * length, cy + h * 1.08), cap),  # cap
        (wb.rect_poly(cx - L + 0.30 * length, cy - h * 0.98, cx - L + 0.42 * length, cy + h * 0.98), (250, 249, 244)),  # label
        (np.array([[cx - L + 0.10 * length, cy - h * 0.8], [cx - L + 0.10 * length, cy + h * 0.8],
                   [cx - L, cy + h * 0.25], [cx - L, cy - h * 0.25]]), (40, 40, 44)),                    # tip
        (wb.rect_poly(cx + L - 0.06 * length, cy - h * 0.7, cx + L, cy + h * 0.7), cap),                # cap end
    ]
    for i, (poly, col) in enumerate(parts):
        _shape(c, [_rot(poly, cx, cy, ang)], col, seed + i, width=max(6, w * 0.09))


def _helmet(c, cx, cy, w, seed=0):
    rx, ry = w * 0.42, w * 0.40
    t = np.linspace(math.pi, 2 * math.pi, 90)
    dome = np.vstack([np.stack([cx + rx * np.cos(t), cy + ry * np.sin(t)], 1), [[cx + rx, cy], [cx - rx, cy]]])
    _shape(c, [dome], OLIVE, seed, width=w * 0.025, spacing=11)
    bw = w * 0.52
    tb = np.linspace(0, 1, 50)
    top = np.stack([cx - bw + 2 * bw * tb, cy - w * 0.005 + w * 0.025 * np.sin(np.pi * tb)], 1)
    bot = np.stack([cx + bw - 2 * bw * tb, cy + w * 0.075 + w * 0.045 * np.sin(np.pi * tb)], 1)
    _shape(c, [np.vstack([top, bot])], OLIVE_DARK, seed + 1, width=w * 0.025, spacing=10)
    ht = np.linspace(math.pi * 1.2, math.pi * 1.42, 30)
    _put(c, wb.stroke_layer([np.stack([cx + rx * 0.7 * np.cos(ht), cy + ry * 0.7 * np.sin(ht)], 1)],
                            (205, 218, 170), w * 0.04, wobble=0.4, seed=seed + 2))


def avatar_crest(out):
    """Helmet over two crossed whiteboard markers (like crossed sabres on a military crest)."""
    S = 1000
    c = _paper(S, S, seed=21)
    # tips up (like raised sabres), caps at the bottom
    _marker(c, 500, 545, 820, 112, math.radians(180 - 38), RED, (160, 18, 24), seed=30)
    _marker(c, 500, 545, 820, 112, math.radians(38), (40, 40, 44), (20, 20, 22), seed=40)
    _helmet(c, 500, 500, 560, seed=50)
    im = Image.fromarray(np.clip(c, 0, 255).astype(np.uint8))
    im.save(out)
    _circle_previews(im, out)


def avatar_tank_marker(out):
    """A marker-doodle tank whose gun barrel is a red whiteboard marker."""
    S = 1000
    c = _paper(S, S, seed=22)
    # barrel = red marker pointing up-right from the turret
    dy = -45
    _marker(c, 690, 380 + dy, 470, 70, math.radians(180 - 22), RED, (160, 18, 24), seed=70)
    t = np.linspace(math.pi, 2 * math.pi, 60)
    turret = np.vstack([np.stack([440 + 165 * np.cos(t), 470 + dy + 120 * np.sin(t)], 1), [[605, 500 + dy], [275, 500 + dy]]])
    _shape(c, [turret], OLIVE, 80, width=12)
    hull = np.array([[170, 500], [830, 500], [880, 600], [120, 600]], float) + [0, dy]
    _shape(c, [hull], OLIVE_DARK, 81, width=12)
    track = wb.rounded_rect_path(130, 600 + dy, 870, 760 + dy, r=78)[:-1]
    _shape(c, [track], (70, 72, 70), 82, width=12)
    for i, x in enumerate(np.linspace(225, 775, 5)):
        m = np.zeros((S, S), np.uint8)
        cv2.circle(m, (int(x), 680 + dy), 52, 1, -1)
        _put(c, wb.hatch_layer(m.astype(bool), 0, 0, (150, 152, 146), spacing=8, seed=90 + i))
        _put(c, wb.circle_layer(x, 680 + dy, 52, color=INK, width=9, seed=100 + i))
    im = Image.fromarray(np.clip(c, 0, 255).astype(np.uint8))
    im.save(out)
    _circle_previews(im, out)
