"""YouTube thumbnails (16:9) in the whiteboard style and a realistic variant.

usage: python thumbnail.py whiteboard ARMY_SPRITE OUT.png  [--text1 FATAL --text2 BET]
       python thumbnail.py realistic PHOTO OUT.png         [--text1 FATAL --text2 BET]
Writes OUT.png (1920x1080) and OUT_1280.jpg (YouTube size).
"""
import argparse
import math
import os
import sys

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import wb  # noqa: E402
from wb import INK, RED, YELLOW  # noqa: E402

FLAG_RED = (204, 28, 34)


def _over(rgb, a, layer):
    """Composite a wb.Layer (coords relative to this buffer) over an RGBA float buffer."""
    h, w = a.shape
    x0, y0 = layer.x, layer.y
    cx0, cy0, cx1, cy1 = max(0, x0), max(0, y0), min(w, x0 + layer.w), min(h, y0 + layer.h)
    if cx0 >= cx1 or cy0 >= cy1:
        return
    la = layer.a[cy0 - y0:cy1 - y0, cx0 - x0:cx1 - x0]
    lr = layer.rgb[cy0 - y0:cy1 - y0, cx0 - x0:cx1 - x0]
    da = a[cy0:cy1, cx0:cx1]
    out_a = la + da * (1 - la)
    rgb[cy0:cy1, cx0:cx1] = (lr * la[..., None] + rgb[cy0:cy1, cx0:cx1] * (da * (1 - la))[..., None]) / \
        np.maximum(out_a, 1e-4)[..., None]
    a[cy0:cy1, cx0:cx1] = out_a


DE_BLACK, DE_RED, DE_GOLD = (24, 24, 26), (214, 32, 38), (252, 200, 24)
FIELD_GREY = (118, 126, 104)


def _cross_polys(cx, cy, size, bar):
    """Plus-shaped cross polygon (Balkenkreuz arms)."""
    s, b = size / 2, bar / 2
    return np.array([[cx - b, cy - s], [cx + b, cy - s], [cx + b, cy - b], [cx + s, cy - b], [cx + s, cy + b],
                     [cx + b, cy + b], [cx + b, cy + s], [cx - b, cy + s], [cx - b, cy + b], [cx - s, cy + b],
                     [cx - s, cy - b], [cx - b, cy - b]], float)


def historic_flag_rgba(w, wave=0.07, seed=0, kind="nazi"):
    """Waving marker-style flag. kind: 'nazi' (1933-45 flag), 'de' (black-red-gold), 'cross' (Balkenkreuz)."""
    h = int(w * 0.62)
    pad = int(h * 0.25)
    W_, H_ = w + 2 * pad, h + 2 * pad
    rgb = np.zeros((H_, W_, 3), np.float32)
    a = np.zeros((H_, W_), np.float32)
    x0, y0 = pad, pad
    m = np.zeros((H_, W_), np.uint8)
    cv2.rectangle(m, (x0, y0), (x0 + w, y0 + h), 1, -1)
    a[m > 0] = 1.0
    cx, cy = x0 + w / 2, y0 + h / 2
    if kind == "de":
        rgb[m > 0] = DE_RED
        for i, col in enumerate((DE_BLACK, DE_RED, DE_GOLD)):
            mb = np.zeros((H_, W_), np.uint8)
            cv2.rectangle(mb, (x0, int(y0 + i * h / 3)), (x0 + w, int(y0 + (i + 1) * h / 3)), 1, -1)
            _over(rgb, a, wb.hatch_layer(mb.astype(bool), 0, 0, col, spacing=9, seed=seed + i))
    elif kind == "cross":
        rgb[m > 0] = FIELD_GREY
        _over(rgb, a, wb.hatch_layer(m.astype(bool), 0, 0, FIELD_GREY, spacing=9, seed=seed))
        for poly, col, sd in [(_cross_polys(cx, cy, h * 0.78, h * 0.30), (250, 249, 244), 1),
                              (_cross_polys(cx, cy, h * 0.66, h * 0.16), DE_BLACK, 2)]:
            mm, mx, my = wb.poly_mask([poly])
            _over(rgb, a, wb.hatch_layer(mm, mx, my, col, spacing=7, seed=seed + sd, shade=0.04))
    else:
        rgb[m > 0] = FLAG_RED
        _over(rgb, a, wb.hatch_layer(m.astype(bool), 0, 0, FLAG_RED, spacing=9, seed=seed))
        r = h * 0.36
        m = np.zeros((H_, W_), np.uint8)
        cv2.circle(m, (int(cx), int(cy)), int(r), 1, -1)
        _over(rgb, a, wb.hatch_layer(m.astype(bool), 0, 0, (250, 249, 244), spacing=7, seed=seed + 1, shade=0.04))
        L, th = h * 0.21, h * 0.075
        arms = [[(0, 0), (0, -L), (L, -L)], [(0, 0), (L, 0), (L, L)], [(0, 0), (0, L), (-L, L)],
                [(0, 0), (-L, 0), (-L, -L)]]
        c45, s45 = math.cos(math.pi / 4), math.sin(math.pi / 4)
        paths = [np.array([[cx + px * c45 - py * s45, cy + px * s45 + py * c45] for px, py in arm]) for arm in arms]
        _over(rgb, a, wb.stroke_layer(paths, INK, th, wobble=0.4, seed=seed + 2, tex=0.05))
    rect = np.array([[x0, y0], [x0 + w, y0], [x0 + w, y0 + h], [x0, y0 + h], [x0, y0]], float)
    _over(rgb, a, wb.stroke_layer([rect], INK, max(4, w * 0.012), wobble=0.8, seed=seed + 3))
    # wave: fixed at the pole (left), growing towards the free end; soft fold shading
    yy, xx = np.mgrid[0:H_, 0:W_].astype(np.float32)
    f = np.clip((xx - x0) / w, 0, 1)
    phase = seed * 0.7
    dy = wave * h * f * np.sin(2 * np.pi * (xx - x0) / w * 1.3 + phase)
    map_y = (yy - dy).astype(np.float32)
    rgb = cv2.remap(rgb, xx, map_y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
    a = cv2.remap(a, xx, map_y, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
    shade = 1.0 - 0.13 * f * (0.5 + 0.5 * np.cos(2 * np.pi * (xx - x0) / w * 1.3 + phase))
    rgb *= shade[..., None]
    return rgb, a, (x0, y0, w, h)


def realistic_flag_rgba(w, seed=0, kind="nazi"):
    """Photo-like waving flag (fabric folds and shading) for the realistic thumbnail. kind: nazi | de | cross."""
    h = int(w * 0.62)
    pad = int(h * 0.3)
    W_, H_ = w + 2 * pad, h + 2 * pad
    ss = 2
    big = np.zeros((H_ * ss, W_ * ss, 3), np.uint8)
    am = np.zeros((H_ * ss, W_ * ss), np.uint8)
    x0, y0 = pad * ss, pad * ss
    cv2.rectangle(am, (x0, y0), (x0 + w * ss, y0 + h * ss), 255, -1)
    cx, cy = x0 + w * ss / 2, y0 + h * ss / 2
    if kind == "de":
        for i, col in enumerate([(22, 22, 24), (200, 24, 30), (240, 186, 18)]):
            cv2.rectangle(big, (x0, int(y0 + i * h * ss / 3)), (x0 + w * ss, int(y0 + (i + 1) * h * ss / 3)), col, -1)
    elif kind == "cross":
        cv2.rectangle(big, (x0, y0), (x0 + w * ss, y0 + h * ss), (104, 112, 92), -1)
        for poly, col in [(_cross_polys(cx, cy, h * ss * 0.78, h * ss * 0.30), (236, 234, 226)),
                          (_cross_polys(cx, cy, h * ss * 0.66, h * ss * 0.16), (18, 18, 20))]:
            cv2.fillPoly(big, [poly.astype(np.int32)], col, cv2.LINE_AA)
    else:
        cv2.rectangle(big, (x0, y0), (x0 + w * ss, y0 + h * ss), (176, 20, 26), -1)
        r = h * ss * 0.36
        cv2.circle(big, (int(cx), int(cy)), int(r), (236, 232, 224), -1, cv2.LINE_AA)
        L, th = h * ss * 0.21, int(h * ss * 0.075)
        c45, s45 = math.cos(math.pi / 4), math.sin(math.pi / 4)
        for arm in [[(0, 0), (0, -L), (L, -L)], [(0, 0), (L, 0), (L, L)], [(0, 0), (0, L), (-L, L)],
                    [(0, 0), (-L, 0), (-L, -L)]]:
            pts = np.array([[cx + px * c45 - py * s45, cy + px * s45 + py * c45] for px, py in arm], np.int32)
            cv2.polylines(big, [pts], False, (18, 18, 20), th, cv2.LINE_AA)
    rgb = cv2.resize(big, (W_, H_), interpolation=cv2.INTER_AREA).astype(np.float32)
    a = cv2.resize(am, (W_, H_), interpolation=cv2.INTER_AREA).astype(np.float32) / 255.0
    yy, xx = np.mgrid[0:H_, 0:W_].astype(np.float32)
    f = np.clip((xx - pad) / w, 0, 1)
    ph = 2 * np.pi * (xx - pad) / w * 1.6 + seed
    dy = 0.08 * h * f * np.sin(ph)
    map_y = (yy - dy).astype(np.float32)
    rgb = cv2.remap(rgb, xx, map_y, cv2.INTER_LINEAR)
    a = cv2.remap(a, xx, map_y, cv2.INTER_LINEAR)
    light = 0.78 + 0.32 * (0.5 + 0.5 * np.cos(ph + 0.6)) - 0.1 * f
    rgb = rgb * light[..., None]
    rng = np.random.default_rng(seed)
    rgb += rng.normal(0, 4, rgb.shape).astype(np.float32)
    rgb = cv2.GaussianBlur(rgb, (0, 0), 0.7)
    return np.clip(rgb, 0, 255), a, (pad, pad, w, h)


def flag_decal(w, ss=6, kind="nazi"):
    """Tiny flag sticker (for helmets), same kinds as historic_flag_rgba."""
    h = int(round(w * 0.62))
    W_, H_ = w * ss, h * ss
    img = np.zeros((H_, W_, 4), np.uint8)
    if kind in ("de", "cross"):
        if kind == "de":
            for i, col in enumerate((DE_BLACK, DE_RED, DE_GOLD)):
                cv2.rectangle(img, (0, int(i * H_ / 3)), (W_ - 1, int((i + 1) * H_ / 3)), col + (255,), -1)
        else:
            cv2.rectangle(img, (0, 0), (W_ - 1, H_ - 1), FIELD_GREY + (255,), -1)
            for poly, col in [(_cross_polys(W_ / 2, H_ / 2, H_ * 0.82, H_ * 0.32), (250, 249, 244)),
                              (_cross_polys(W_ / 2, H_ / 2, H_ * 0.68, H_ * 0.17), DE_BLACK)]:
                cv2.fillPoly(img, [poly.astype(np.int32)], col + (255,), cv2.LINE_AA)
        cv2.rectangle(img, (0, 0), (W_ - 1, H_ - 1), (20, 20, 22, 255), max(2, int(H_ * 0.07)))
        return Image.fromarray(cv2.resize(img, (w, h), interpolation=cv2.INTER_AREA), "RGBA")
    cv2.rectangle(img, (0, 0), (W_ - 1, H_ - 1), (204, 28, 34, 255), -1)
    cx, cy, r = W_ / 2, H_ / 2, H_ * 0.36
    cv2.circle(img, (int(cx), int(cy)), int(r), (250, 249, 244, 255), -1, cv2.LINE_AA)
    L, th = H_ * 0.21, max(1, int(H_ * 0.085))
    c45 = s45 = math.sqrt(0.5)
    for arm in [[(0, 0), (0, -L), (L, -L)], [(0, 0), (L, 0), (L, L)], [(0, 0), (0, L), (-L, L)], [(0, 0), (-L, 0), (-L, -L)]]:
        pts = np.array([[cx + px * c45 - py * s45, cy + px * s45 + py * c45] for px, py in arm], np.int32)
        cv2.polylines(img, [pts], False, (18, 18, 20, 255), th, cv2.LINE_AA)
    cv2.rectangle(img, (0, 0), (W_ - 1, H_ - 1), (20, 20, 22, 255), max(2, int(H_ * 0.07)))
    return Image.fromarray(cv2.resize(img, (w, h), interpolation=cv2.INTER_AREA), "RGBA")


# helmet positions (x, y, decal width, rotation) on the episode-1 army sprite (876x909)
ARMY_A_HELMETS = [(214, 108, 38, -6), (348, 126, 36, 4), (447, 136, 34, -10), (544, 136, 33, -4), (657, 120, 37, 2)]


def add_helmet_decals(src, out, spots=ARMY_A_HELMETS, kind="nazi"):
    im = Image.open(src).convert("RGBA")
    base = im.copy()
    for cx, cy, w, rot in spots:
        d = flag_decal(w, kind=kind).rotate(rot, resample=Image.BICUBIC, expand=True)
        base.alpha_composite(d, (int(cx - d.width / 2), int(cy - d.height / 2)))
    arr = np.asarray(base).copy()
    arr[..., 3] = np.minimum(arr[..., 3], np.asarray(im.split()[3]))
    Image.fromarray(arr, "RGBA").save(out)


def place(canvas, rgb, a, x, y):
    L = wb.Layer(rgb, a, np.zeros_like(a), x, y)
    wb.composite(canvas, L, L.a)


# ---------------------------------------------------------------- bold title styles (PIL)
def _font(name, size):
    return ImageFont.truetype(os.path.join(HERE, "fonts", name), size)


def _fit(name, text, size, max_w, stroke=0):
    while True:
        f = _font(name, size)
        bb = f.getbbox(text, stroke_width=stroke)
        if bb[2] - bb[0] <= max_w or size < 80:
            return f
        size = int(size * 0.95)


def _text_img(text, f, fill, stroke=0, stroke_fill=None, pad=30):
    bb = f.getbbox(text, stroke_width=stroke)
    im = Image.new("RGBA", (bb[2] - bb[0] + 2 * pad, bb[3] - bb[1] + 2 * pad), (0, 0, 0, 0))
    ImageDraw.Draw(im).text((pad - bb[0], pad - bb[1]), text, font=f, fill=fill, stroke_width=stroke,
                            stroke_fill=stroke_fill)
    return im


def _paste(base, layer, x, y, angle=0.0, anchor="lt"):
    r = layer.rotate(angle, resample=Image.BICUBIC, expand=True) if angle else layer
    if anchor == "mm":
        x, y = x - r.width / 2, y - r.height / 2
    base.alpha_composite(r, (int(x), int(y)))
    return r


def _shadowed(im, offset=(12, 12), color=(0, 0, 0, 255)):
    """Hard offset shadow behind an RGBA image."""
    a = im.split()[3]
    sh = Image.new("RGBA", im.size, color)
    sh.putalpha(a)
    out = Image.new("RGBA", (im.width + abs(offset[0]), im.height + abs(offset[1])), (0, 0, 0, 0))
    out.alpha_composite(sh, (max(0, offset[0]), max(0, offset[1])))
    out.alpha_composite(im, (max(0, -offset[0]), max(0, -offset[1])))
    return out


def title_box(base, t1, t2):
    """'HITLER' heavy black; 'LOST' white on a tilted red label with a hard shadow."""
    f1 = _fit("Anton-Regular.ttf", t1, 340, 880)
    _paste(base, _shadowed(_text_img(t1, f1, (20, 20, 22, 255)), (9, 9), (226, 36, 44, 255)), 60, 70)
    f2 = _fit("Anton-Regular.ttf", t2, 300, 560)
    txt = _text_img(t2, f2, (255, 255, 255, 255), pad=0)
    px, py = 46, 22
    box = Image.new("RGBA", (txt.width + 2 * px, txt.height + 2 * py), (226, 36, 44, 255))
    box.alpha_composite(txt, (px, py))
    _paste(base, _shadowed(box, (16, 16)), 470, 700, angle=4, anchor="mm")


def title_stamp(base, t1, t2):
    """Military stencil 'HITLER'; 'LOST' as an inked red rubber stamp."""
    f1 = _fit("BlackOpsOne-Regular.ttf", t1, 300, 920)
    _paste(base, _shadowed(_text_img(t1, f1, (24, 24, 26, 255)), (8, 8), (205, 30, 38, 255)), 40, 120)
    red = (205, 30, 38, 255)
    f2 = _fit("BlackOpsOne-Regular.ttf", t2, 330, 700)
    txt = _text_img(t2, f2, red, pad=0)
    px, py, o, i_ = 50, 34, 16, 6
    st = Image.new("RGBA", (txt.width + 2 * px, txt.height + 2 * py), (0, 0, 0, 0))
    d = ImageDraw.Draw(st)
    d.rectangle([0, 0, st.width - 1, st.height - 1], outline=red, width=o)
    d.rectangle([o + 10, o + 10, st.width - o - 11, st.height - o - 11], outline=red, width=i_)
    st.alpha_composite(txt, (px, py))
    rng = np.random.default_rng(3)
    noise = cv2.resize(rng.random((st.height // 6 + 1, st.width // 6 + 1)).astype(np.float32),
                       (st.width, st.height), interpolation=cv2.INTER_LINEAR)
    speck = rng.random((st.height, st.width)) > 0.06
    ink = np.clip((noise - 0.18) * 3.0, 0, 1) * speck
    a = np.asarray(st.split()[3]).astype(np.float32) * (0.78 + 0.22 * ink)
    st.putalpha(Image.fromarray(a.astype(np.uint8)))
    _paste(base, st, 480, 700, angle=8, anchor="mm")


def title_band(base, t1, t2):
    """'HITLER' white on a black band; 'LOST' red with thick outline and hard shadow."""
    f1 = _fit("Anton-Regular.ttf", t1, 300, 820)
    txt = _text_img(t1, f1, (255, 255, 255, 255), pad=0)
    band = Image.new("RGBA", (txt.width + 140, txt.height + 70), (18, 18, 20, 255))
    band.alpha_composite(txt, (70, 35))
    _paste(base, band, 30, 90, angle=2)
    f2 = _fit("Anton-Regular.ttf", t2, 380, 700, stroke=16)
    lost = _text_img(t2, f2, (230, 34, 42, 255), stroke=16, stroke_fill=(15, 15, 15, 255))
    _paste(base, _shadowed(lost, (14, 14)), 450, 720, angle=-3, anchor="mm")


def _title_simple(base, t1, t2, font, max_w=880):
    """Plain and readable: two big straight lines, black + red, no boxes, tilt or shadows."""
    f1 = _fit(font, t1, 360, max_w)
    s1 = f1.size
    f2 = _fit(font, t2, int(s1 * 1.25), max_w)
    i1 = _text_img(t1, f1, (20, 20, 22, 255), pad=0)
    i2 = _text_img(t2, f2, (222, 30, 38, 255), pad=0)
    gap = int(s1 * 0.18)
    y0 = (1080 - (i1.height + gap + i2.height)) // 2 - 20
    _paste(base, i1, 75, y0)
    _paste(base, i2, 75, y0 + i1.height + gap)


def title_simple(base, t1, t2):
    _title_simple(base, t1, t2, "Anton-Regular.ttf")


def title_simple_wide(base, t1, t2):
    _title_simple(base, t1, t2, "ArchivoBlack-Regular.ttf")


TITLE_STYLES = {"box": title_box, "stamp": title_stamp, "band": title_band,
                "simple": title_simple, "simple_wide": title_simple_wide}


def whiteboard(army_path, out, text1, text2, style="marker", flag="nazi"):
    canvas = wb.paper_background(seed=7).astype(np.float32)
    # flags carried above the column (behind the soldiers)
    # the column of soldiers (built first to know its width; drawn after the flags)
    army = wb.sprite_layer(army_path, 1490, 1075, h=720, anchor="mb", seed=5)
    ax0, ax1 = army.x, army.x + army.w
    # flags behind the soldiers, carried on poles; the rightmost flag ends inside the column
    span = ax1 - ax0
    specs = [(ax0 + 0.06 * span, 60, 0.43 * span), (ax0 + 0.38 * span, 95, 0.40 * span),
             (ax0 + 0.68 * span, 130, 0.30 * span)]
    for i, (px, top, fw) in enumerate(specs):
        px, fw = int(px), int(min(fw, ax1 - 12 - px))
        pole = wb.stroke_layer([np.array([[px, top - 10], [px + 4, 930]])], (110, 72, 40), 11, seed=40 + i)
        wb.composite(canvas, pole, pole.a)
        frgb, fa, (fx0, fy0, fw_, fh) = historic_flag_rgba(fw, wave=0.05, seed=11 + i, kind=flag)
        place(canvas, frgb, fa, px + 3 - fx0, top - fy0)
    wb.composite(canvas, army, army.a)
    if style in TITLE_STYLES:
        im = Image.fromarray(np.clip(canvas, 0, 255).astype(np.uint8)).convert("RGBA")
        TITLE_STYLES[style](im, text1, text2)
        save(np.asarray(im.convert("RGB")).astype(np.float32), out)
        return
    # two words, auto-fitted so they never run into the flags
    def fit(text, x, y, size, color, seed, max_w=930):
        while True:
            L = wb.text_layer(text, x, y, size=size, color=color, rot=-4, seed=seed)
            if L.w <= max_w or size < 120:
                return L
            size = int(size * 0.94)
    t1 = fit(text1, 60, 150, 290, INK, 1)
    wb.composite(canvas, t1, t1.a)
    t2 = fit(text2, 110, 500, 380, RED, 2, max_w=780)
    wb.composite(canvas, t2, t2.a)
    x0, y0, x1, y1 = t2.bbox()
    ul = wb.underline_layer(x0, x1, y1 + 10, color=RED, width=26, seed=3)
    wb.composite(canvas, ul, ul.a)
    b = wb.burst_layer((x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2 + 20, (y1 - y0) / 2, length=80, width=18, seed=4)
    wb.composite(canvas, b, b.a)
    save(canvas, out)


def realistic(photo_path, out, text1, text2, flag="nazi"):
    im = Image.open(photo_path).convert("RGB")
    # cover-fit to 1920x1080
    s = max(1920 / im.width, 1080 / im.height)
    im = im.resize((int(im.width * s + 0.5), int(im.height * s + 0.5)), Image.LANCZOS)
    l, t = (im.width - 1920) // 2, (im.height - 1080) // 2
    im = im.crop((l, t, l + 1920, t + 1080))
    arr = np.asarray(im).astype(np.float32)
    # darken the left side a little so the words pop
    xx = np.linspace(0, 1, 1920)[None, :, None]
    arr *= (0.55 + 0.45 * np.clip(xx / 0.6, 0, 1))
    # big foreground flag on a pole, top-right
    px, top, fw = 1200, 30, 640
    pole = np.zeros((1080, 1920), np.uint8)
    cv2.line(pole, (px, top - 20), (px + 8, 1080), 1, 16, cv2.LINE_AA)
    pm = cv2.GaussianBlur(pole.astype(np.float32), (0, 0), 1.0)
    arr = arr * (1 - pm[..., None]) + np.array([62, 44, 30], np.float32) * pm[..., None]
    frgb, fa, (fx0, fy0, _, _) = realistic_flag_rgba(fw, seed=2, kind=flag)
    L = wb.Layer(frgb, fa, np.zeros_like(fa), px + 6 - fx0, top - fy0)
    wb.composite(arr, L, L.a)
    im = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(im)
    def fit(text, size, max_w=1080):
        while True:
            f = ImageFont.truetype(os.path.join(HERE, "fonts", "Anton-Regular.ttf"), size)
            if d.textlength(text, font=f) <= max_w or size < 120:
                return f
            size = int(size * 0.94)
    f1, f2 = fit(text1, 300), fit(text2, 380)
    d.text((70, 50), text1, font=f1, fill=(255, 255, 255), stroke_width=15, stroke_fill=(0, 0, 0))
    d.text((70, 420), text2, font=f2, fill=(236, 32, 38), stroke_width=17, stroke_fill=(0, 0, 0))
    save(np.asarray(im).astype(np.float32), out)


def save(canvas, out):
    img = np.clip(canvas, 0, 255).astype(np.uint8)
    Image.fromarray(img).save(out)
    small = cv2.resize(img, (1280, 720), interpolation=cv2.INTER_AREA)
    Image.fromarray(small).save(os.path.splitext(out)[0] + "_1280.jpg", quality=92)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("kind", choices=["whiteboard", "realistic"])
    ap.add_argument("src")
    ap.add_argument("out")
    ap.add_argument("--text1", default="FATAL")
    ap.add_argument("--text2", default="BET")
    ap.add_argument("--style", default="marker", choices=["marker"] + list(TITLE_STYLES))
    ap.add_argument("--flag", default="nazi", choices=["nazi", "de", "cross"])
    a = ap.parse_args()
    if a.kind == "whiteboard":
        whiteboard(a.src, a.out, a.text1, a.text2, a.style, a.flag)
    else:
        realistic(a.src, a.out, a.text1, a.text2, a.flag)


# ---------------------------------------------------------------- channel avatar (800x800, shown as a circle)
def _key_polys(cx, cy, L):
    """Old-fashioned key: ring bow (left), shaft, two teeth (right). Returns (outer polys, hole circle)."""
    r_out, r_in = 0.19 * L, 0.085 * L
    bx = cx - L / 2 + r_out
    t = np.linspace(0, 2 * np.pi, 60, endpoint=False)
    bow = np.stack([bx + r_out * np.cos(t), cy + r_out * np.sin(t)], 1)
    hole = (bx, cy, r_in)
    sh = 0.075 * L
    shaft = wb.rect_poly(bx + r_out * 0.85, cy - sh / 2, cx + L / 2, cy + sh / 2)
    x_end = cx + L / 2
    t1 = wb.rect_poly(x_end - 0.13 * L, cy + sh / 2 - 2, x_end - 0.04 * L, cy + sh / 2 + 0.13 * L)
    t2 = wb.rect_poly(x_end - 0.27 * L, cy + sh / 2 - 2, x_end - 0.19 * L, cy + sh / 2 + 0.09 * L)
    return [bow, shaft, t1, t2], hole


def avatar(out, text="WW2", variant="a"):
    S = 800
    paper = wb.paper_background(seed=9)[:S, :S].copy()
    canvas = paper.astype(np.float32)
    polys, (hx, hy, hr) = _key_polys(400, 565 if variant == "a" else 400, 440 if variant == "a" else 620)
    m, mx, my = wb.poly_mask(polys)
    cv2.circle(m.view(np.uint8), (int(hx - mx), int(hy - my)), int(hr), 0, -1)
    fill = wb.hatch_layer(m.astype(bool), mx, my, YELLOW, spacing=9, seed=21)
    wb.composite(canvas, fill, fill.a)
    t = np.linspace(0, 2 * np.pi, 60)
    outline = [np.vstack([p, p[:1]]) for p in polys] + [np.stack([hx + hr * np.cos(t), hy + hr * np.sin(t)], 1)]
    ol = wb.stroke_layer(outline, INK, 9, wobble=0.6, seed=22)
    wb.composite(canvas, ol, ol.a)
    ring = wb.circle_layer(400, 400, 360, 360, color=RED, width=22, seed=23)
    wb.composite(canvas, ring, ring.a)
    im = Image.fromarray(np.clip(canvas, 0, 255).astype(np.uint8)).convert("RGBA")
    f = _fit("Anton-Regular.ttf", text, 330, 470 if variant == "a" else 430, stroke=0)
    if variant == "a":
        # last character in red as an accent (WW + 2)
        head, tail = text[:-1], text[-1:]
        ih = _text_img(head, f, (20, 20, 22, 255), pad=0)
        it = _text_img(tail, f, (226, 36, 44, 255), pad=0)
        gap = int(f.size * 0.03)
        row = Image.new("RGBA", (ih.width + gap + it.width, max(ih.height, it.height)), (0, 0, 0, 0))
        row.alpha_composite(ih, (0, row.height - ih.height))
        row.alpha_composite(it, (ih.width + gap, row.height - it.height))
        _paste(im, row, 400, 320, anchor="mm")
    else:
        _paste(im, _shadowed(_text_img(text, f, (255, 255, 255, 255), stroke=14, stroke_fill=(20, 20, 22, 255),
                                       pad=0), (10, 10), (226, 36, 44, 255)), 400, 300, anchor="mm")
    im = im.convert("RGB")
    im.save(out)
    # circle previews at YouTube display sizes, to check legibility
    for size in (176, 98):
        sm = im.resize((size, size), Image.LANCZOS)
        mask = Image.new("L", (size, size), 0)
        ImageDraw.Draw(mask).ellipse([0, 0, size - 1, size - 1], fill=255)
        bg = Image.new("RGB", (size, size), (15, 15, 15))
        bg.paste(sm, (0, 0), mask)
        bg.save(os.path.splitext(out)[0] + f"_circle{size}.png")
