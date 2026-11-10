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


def historic_flag_rgba(w, wave=0.07, seed=0):
    """1933-45 German flag in marker style (red field, white disc, black hooked cross), waving."""
    h = int(w * 0.62)
    pad = int(h * 0.25)
    W_, H_ = w + 2 * pad, h + 2 * pad
    rgb = np.zeros((H_, W_, 3), np.float32)
    a = np.zeros((H_, W_), np.float32)
    x0, y0 = pad, pad
    m = np.zeros((H_, W_), np.uint8)
    cv2.rectangle(m, (x0, y0), (x0 + w, y0 + h), 1, -1)
    rgb[m > 0] = FLAG_RED
    a[m > 0] = 1.0
    _over(rgb, a, wb.hatch_layer(m.astype(bool), 0, 0, FLAG_RED, spacing=9, seed=seed))
    cx, cy, r = x0 + w / 2, y0 + h / 2, h * 0.36
    m = np.zeros((H_, W_), np.uint8)
    cv2.circle(m, (int(cx), int(cy)), int(r), 1, -1)
    _over(rgb, a, wb.hatch_layer(m.astype(bool), 0, 0, (250, 249, 244), spacing=7, seed=seed + 1, shade=0.04))
    L, th = h * 0.21, h * 0.075
    arms = [[(0, 0), (0, -L), (L, -L)], [(0, 0), (L, 0), (L, L)], [(0, 0), (0, L), (-L, L)], [(0, 0), (-L, 0), (-L, -L)]]
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


def realistic_flag_rgba(w, seed=0):
    """Photo-like waving 1933-45 German flag (fabric folds and shading), for the realistic thumbnail."""
    h = int(w * 0.62)
    pad = int(h * 0.3)
    W_, H_ = w + 2 * pad, h + 2 * pad
    ss = 2
    big = np.zeros((H_ * ss, W_ * ss, 3), np.uint8)
    am = np.zeros((H_ * ss, W_ * ss), np.uint8)
    x0, y0 = pad * ss, pad * ss
    cv2.rectangle(big, (x0, y0), (x0 + w * ss, y0 + h * ss), (176, 20, 26), -1)
    cv2.rectangle(am, (x0, y0), (x0 + w * ss, y0 + h * ss), 255, -1)
    cx, cy, r = x0 + w * ss / 2, y0 + h * ss / 2, h * ss * 0.36
    cv2.circle(big, (int(cx), int(cy)), int(r), (236, 232, 224), -1, cv2.LINE_AA)
    L, th = h * ss * 0.21, int(h * ss * 0.075)
    c45, s45 = math.cos(math.pi / 4), math.sin(math.pi / 4)
    for arm in [[(0, 0), (0, -L), (L, -L)], [(0, 0), (L, 0), (L, L)], [(0, 0), (0, L), (-L, L)], [(0, 0), (-L, 0), (-L, -L)]]:
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


def place(canvas, rgb, a, x, y):
    L = wb.Layer(rgb, a, np.zeros_like(a), x, y)
    wb.composite(canvas, L, L.a)


def whiteboard(army_path, out, text1, text2):
    canvas = wb.paper_background(seed=7).astype(np.float32)
    # flags carried above the column (behind the soldiers)
    for i, (px, top, fw) in enumerate([(1030, 60, 290), (1325, 95, 280), (1610, 130, 270)]):
        pole = wb.stroke_layer([np.array([[px, top - 10], [px + 6, top + 640]])], (110, 72, 40), 12, seed=40 + i)
        wb.composite(canvas, pole, pole.a)
        frgb, fa, (fx0, fy0, fw_, fh) = historic_flag_rgba(fw, seed=11 + i)
        place(canvas, frgb, fa, px + 4 - fx0, top - fy0)
    # the column of soldiers
    army = wb.sprite_layer(army_path, 1380, 1075, h=640, anchor="mb", seed=5)
    wb.composite(canvas, army, army.a)
    # two words
    t1 = wb.text_layer(text1, 60, 150, size=290, color=INK, rot=-4, seed=1)
    wb.composite(canvas, t1, t1.a)
    t2 = wb.text_layer(text2, 120, 500, size=360, color=RED, rot=-4, seed=2)
    wb.composite(canvas, t2, t2.a)
    x0, y0, x1, y1 = t2.bbox()
    ul = wb.underline_layer(x0, x1, y1 + 10, color=RED, width=26, seed=3)
    wb.composite(canvas, ul, ul.a)
    b = wb.burst_layer((x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2 + 20, (y1 - y0) / 2, length=80, width=18, seed=4)
    wb.composite(canvas, b, b.a)
    save(canvas, out)


def realistic(photo_path, out, text1, text2):
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
    frgb, fa, (fx0, fy0, _, _) = realistic_flag_rgba(fw, seed=2)
    L = wb.Layer(frgb, fa, np.zeros_like(fa), px + 6 - fx0, top - fy0)
    wb.composite(arr, L, L.a)
    im = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(im)
    f1 = ImageFont.truetype(os.path.join(HERE, "fonts", "Anton-Regular.ttf"), 260)
    f2 = ImageFont.truetype(os.path.join(HERE, "fonts", "Anton-Regular.ttf"), 330)
    d.text((70, 60), text1, font=f1, fill=(255, 255, 255), stroke_width=14, stroke_fill=(0, 0, 0))
    d.text((70, 380), text2, font=f2, fill=(255, 214, 0), stroke_width=16, stroke_fill=(0, 0, 0))
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
    a = ap.parse_args()
    (whiteboard if a.kind == "whiteboard" else realistic)(a.src, a.out, a.text1, a.text2)
