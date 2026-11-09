"""Whiteboard marker-animation engine (Golpo-like style).

Every visual element is a Layer: RGB + alpha + a "reveal map" T in [0, 1].
At animation progress u, a pixel is visible when u >= T, so each element
"draws itself": outlines first, then marker-hatch colouring, text letter by letter.
"""
import math
import os

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

W, H, FPS = 1920, 1080, 30

PAPER = (247, 245, 239)
INK = (28, 28, 32)
RED = (226, 36, 44)
BLUE = (30, 104, 214)
YELLOW = (250, 188, 22)
GREEN = (52, 158, 72)
ORANGE = (246, 126, 28)
GREY = (128, 128, 134)
BROWN = (142, 92, 52)
SAND = (238, 222, 182)
LIGHTBLUE = (150, 196, 240)
WHITE = (252, 252, 250)

HERE = os.path.dirname(os.path.abspath(__file__))
FONT_FILES = {
    "marker": os.path.join(HERE, "fonts", "PermanentMarker-Regular.ttf"),
    "hand": os.path.join(HERE, "fonts", "Kalam-Bold.ttf"),
}
_font_cache = {}


def font(name, size):
    key = (name, size)
    if key not in _font_cache:
        _font_cache[key] = ImageFont.truetype(FONT_FILES[name], size)
    return _font_cache[key]


# ----------------------------------------------------------------------------
# Layer / element
# ----------------------------------------------------------------------------
class Layer:
    """RGB float32 (h,w,3) + alpha float32 (h,w) + reveal map T float32 (h,w)."""

    def __init__(self, rgb, a, T, x, y):
        self.rgb = np.ascontiguousarray(rgb, dtype=np.float32)
        self.a = np.ascontiguousarray(a, dtype=np.float32)
        T = np.where(a > 0.003, T, 0.0).astype(np.float32)
        tmax = float(T.max()) if T.size else 1.0
        self.T = T / tmax if tmax > 0 else T
        self.x, self.y = int(x), int(y)

    @property
    def w(self):
        return self.a.shape[1]

    @property
    def h(self):
        return self.a.shape[0]

    def bbox(self):
        return self.x, self.y, self.x + self.w, self.y + self.h

    def shifted(self, dx, dy):
        return Layer(self.rgb, self.a, self.T, self.x + dx, self.y + dy)


class Element:
    def __init__(self, layer, t0, dur, soft=0.05):
        self.layer, self.t0, self.dur, self.soft = layer, float(t0), max(0.05, float(dur)), soft

    @property
    def t1(self):
        return self.t0 + self.dur

    def alpha_at(self, t):
        u = (t - self.t0) / self.dur
        if u <= 0:
            return None
        L = self.layer
        if u >= 1:
            return L.a
        Tn = L.T * (1.0 - self.soft)
        return L.a * np.clip((u - Tn) / self.soft, 0.0, 1.0)


def composite(dst, layer, alpha):
    """Alpha-blend layer (with given alpha map) into float32 canvas dst (H,W,3)."""
    x0, y0, x1, y1 = layer.bbox()
    cx0, cy0, cx1, cy1 = max(0, x0), max(0, y0), min(dst.shape[1], x1), min(dst.shape[0], y1)
    if cx0 >= cx1 or cy0 >= cy1:
        return
    a = alpha[cy0 - y0:cy1 - y0, cx0 - x0:cx1 - x0, None]
    rgb = layer.rgb[cy0 - y0:cy1 - y0, cx0 - x0:cx1 - x0]
    region = dst[cy0:cy1, cx0:cx1]
    region *= (1.0 - a)
    region += rgb * a


# ----------------------------------------------------------------------------
# noise helpers
# ----------------------------------------------------------------------------
def smooth_noise(h, w, scale, rng):
    sh, sw = max(2, int(h / scale) + 2), max(2, int(w / scale) + 2)
    small = rng.standard_normal((sh, sw)).astype(np.float32)
    return cv2.resize(small, (w, h), interpolation=cv2.INTER_CUBIC)


def _noise1d(n, period_pts, amp, rng):
    k = max(3, int(n / max(1.0, period_pts)) + 3)
    pts = rng.uniform(-1, 1, k)
    xs = np.linspace(0, k - 1, n)
    return np.interp(xs, np.arange(k), pts) * amp


def paper_background(seed=1):
    rng = np.random.default_rng(seed)
    base = np.ones((H, W, 3), np.float32) * np.array(PAPER, np.float32)
    n = smooth_noise(H, W, 220, rng) * 1.6 + smooth_noise(H, W, 9, rng) * 0.8
    base += n[..., None]
    # very soft vignette
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    d = ((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2
    base -= (d * 5.0)[..., None]
    return np.clip(base, 0, 255)


def _tex(rgb_color, h, w, rng, amount=7.0):
    n = smooth_noise(h, w, 5, rng) * amount
    col = np.array(rgb_color, np.float32)[None, None, :]
    return np.clip(col + n[..., None], 0, 255)


# ----------------------------------------------------------------------------
# strokes (lines, arrows, circles, underlines)
# ----------------------------------------------------------------------------
def resample(path, step):
    p = np.asarray(path, np.float64)
    if len(p) < 2:
        return p, np.zeros(len(p)), 0.0
    seg = np.diff(p, axis=0)
    L = np.hypot(seg[:, 0], seg[:, 1])
    cum = np.concatenate([[0.0], np.cumsum(L)])
    total = float(cum[-1])
    if total < 1e-6:
        return p[:1], np.zeros(1), 0.0
    n = max(2, int(total / step) + 1)
    s = np.linspace(0, total, n)
    return np.stack([np.interp(s, cum, p[:, 0]), np.interp(s, cum, p[:, 1])], 1), s, total


def stroke_layer(paths, color, width, wobble=1.2, seed=0, ss=2, tex=0.12, order=None):
    """Marker strokes along polylines. T follows the drawing direction (path by path)."""
    rng = np.random.default_rng(seed)
    dense, svals, acc = [], [], 0.0
    for p in paths:
        q, s, L = resample(p, max(0.8, width * 0.28))
        if L <= 0:
            continue
        if wobble > 0 and len(q) > 3:
            d = np.gradient(q, axis=0)
            nrm = np.stack([-d[:, 1], d[:, 0]], 1)
            nrm /= np.linalg.norm(nrm, axis=1, keepdims=True) + 1e-9
            step = s[1] - s[0]
            q = q + nrm * _noise1d(len(q), 60.0 / step, wobble, rng)[:, None]
        dense.append(q)
        svals.append(s + acc)
        acc += L
    if not dense:
        return None
    allp = np.concatenate(dense)
    alls = np.concatenate(svals) / max(acc, 1e-6)
    r = width / 2.0
    x0 = int(math.floor(allp[:, 0].min() - r - 4))
    y0 = int(math.floor(allp[:, 1].min() - r - 4))
    x1 = int(math.ceil(allp[:, 0].max() + r + 4))
    y1 = int(math.ceil(allp[:, 1].max() + r + 4))
    w, h = x1 - x0, y1 - y0
    A = np.zeros((h * ss, w * ss), np.uint8)
    T = np.full((h * ss, w * ss), 2.0, np.float32)
    rad = r * (0.88 + 0.12 * np.sin(np.linspace(0, 2 * np.pi * 4, len(allp)) + rng.uniform(0, 6)))
    pts = (allp - [x0, y0]) * ss
    for i in range(len(pts) - 1, -1, -1):
        c = (int(round(pts[i, 0])), int(round(pts[i, 1])))
        rr = max(1, int(round(rad[i] * ss)))
        cv2.circle(T, c, rr, float(alls[i]), -1)
        cv2.circle(A, c, rr, 255, -1, cv2.LINE_AA)
    a = cv2.resize(A, (w, h), interpolation=cv2.INTER_AREA).astype(np.float32) / 255.0
    Tm = T.reshape(h, ss, w, ss).min(axis=(1, 3))
    Tm[Tm > 1.5] = 1.0
    nz = smooth_noise(h, w, 4, rng)
    a = a * np.clip(1.0 - tex * (0.5 + 0.5 * nz), 0.6, 1.0)
    rgb = _tex(color, h, w, rng, 6.0)
    return Layer(rgb, a, Tm, x0, y0)


def bezier(p0, p1, bend=0.2, n=60):
    p0, p1 = np.array(p0, float), np.array(p1, float)
    mid = (p0 + p1) / 2
    d = p1 - p0
    nrm = np.array([-d[1], d[0]])
    c = mid + nrm * bend
    t = np.linspace(0, 1, n)[:, None]
    return (1 - t) ** 2 * p0 + 2 * (1 - t) * t * c + t ** 2 * p1


def arrow_paths(p0, p1, bend=0.15, head=None, width=8):
    body = bezier(p0, p1, bend)
    head = head or max(18, width * 3.2)
    d = body[-1] - body[-4]
    d /= np.linalg.norm(d) + 1e-9
    ang = math.atan2(d[1], d[0])
    tip = body[-1]
    h1 = tip + head * np.array([math.cos(ang + 2.55), math.sin(ang + 2.55)])
    h2 = tip + head * np.array([math.cos(ang - 2.55), math.sin(ang - 2.55)])
    return [body, np.array([h1, tip]), np.array([tip, h2])]


def arrow_layer(p0, p1, color=RED, width=8, bend=0.15, seed=0, head=None):
    return stroke_layer(arrow_paths(p0, p1, bend, head, width), color, width, wobble=1.0, seed=seed)


def polyline_arrow_layer(points, color=RED, width=14, seed=0, head=None, smooth=True):
    pts = np.array(points, float)
    if smooth and len(pts) > 2:
        # Catmull-Rom smoothing
        out = []
        P = np.vstack([pts[0], pts, pts[-1]])
        for i in range(1, len(P) - 2):
            for t in np.linspace(0, 1, 16, endpoint=False):
                t2, t3 = t * t, t * t * t
                out.append(0.5 * ((2 * P[i]) + (-P[i - 1] + P[i + 1]) * t
                                  + (2 * P[i - 1] - 5 * P[i] + 4 * P[i + 1] - P[i + 2]) * t2
                                  + (-P[i - 1] + 3 * P[i] - 3 * P[i + 1] + P[i + 2]) * t3))
        out.append(pts[-1])
        pts = np.array(out)
    head = head or max(22, width * 2.6)
    d = pts[-1] - pts[-5 if len(pts) > 5 else 0]
    d /= np.linalg.norm(d) + 1e-9
    ang = math.atan2(d[1], d[0])
    tip = pts[-1]
    h1 = tip + head * np.array([math.cos(ang + 2.5), math.sin(ang + 2.5)])
    h2 = tip + head * np.array([math.cos(ang - 2.5), math.sin(ang - 2.5)])
    return stroke_layer([pts, np.array([h1, tip]), np.array([tip, h2])], color, width, wobble=1.5, seed=seed)


def ellipse_path(cx, cy, rx, ry, turns=1.12, start=-2.2, n=140, seed=0):
    rng = np.random.default_rng(seed)
    t = np.linspace(start, start + 2 * np.pi * turns, n)
    jr = 1 + _noise1d(n, 25, 0.05, rng)
    return np.stack([cx + rx * jr * np.cos(t), cy + ry * jr * np.sin(t)], 1)


def circle_layer(cx, cy, rx, ry=None, color=RED, width=7, seed=0):
    return stroke_layer([ellipse_path(cx, cy, rx, ry or rx, seed=seed)], color, width, wobble=0.8, seed=seed)


def underline_layer(x0, x1, y, color=RED, width=10, seed=0, double=False):
    rng = np.random.default_rng(seed)
    p = np.array([[x0 - 8, y + rng.uniform(-2, 2)], [(x0 + x1) / 2, y + 4], [x1 + 10, y - 3]])
    paths = [bezier(p[0], p[2], 0.015)]
    if double:
        paths.append(bezier([x0 + 20, y + width * 1.6], [x1 - 10, y + width * 1.3], -0.01))
    return stroke_layer(paths, color, width, wobble=1.0, seed=seed)


def cross_layer(cx, cy, r, color=RED, width=12, seed=0):
    return stroke_layer([np.array([[cx - r, cy - r], [cx + r, cy + r]]),
                         np.array([[cx + r, cy - r * 0.95], [cx - r * 0.95, cy + r]])],
                        color, width, wobble=1.5, seed=seed)


def check_layer(cx, cy, r, color=GREEN, width=12, seed=0):
    return stroke_layer([np.array([[cx - r, cy], [cx - r * 0.3, cy + r * 0.7], [cx + r, cy - r * 0.8]])],
                        color, width, wobble=1.0, seed=seed)


def burst_layer(cx, cy, rx, ry, color=YELLOW, n_side=3, length=34, width=9, seed=0, sides=("l", "r")):
    """Short emphasis dashes on the left/right (and optionally top) of a box."""
    paths = []
    for side in sides:
        for k in range(n_side):
            if side in ("l", "r"):
                ang = (-0.55 + 0.55 * k) if n_side > 1 else 0.0
                sgn = -1 if side == "l" else 1
                bx = cx + sgn * rx
                by = cy + math.sin(ang) * ry * 1.1
                dx, dy = sgn * math.cos(ang), math.sin(ang)
                p0 = np.array([bx + dx * 10, by + dy * 10])
                paths.append(np.array([p0, p0 + np.array([dx, dy]) * length]))
            else:  # top
                ang = -math.pi / 2 + (-0.6 + 0.6 * k)
                bx = cx + math.cos(ang) * rx * 0.6
                by = cy - ry
                dx, dy = math.cos(ang), math.sin(ang)
                p0 = np.array([bx + dx * 8, by + dy * 8])
                paths.append(np.array([p0, p0 + np.array([dx, dy]) * length]))
    return stroke_layer(paths, color, width, wobble=0.6, seed=seed)


def dashed_path(points, dash=26, gap=18):
    p, s, L = resample(points, 2.0)
    out, cur = [], []
    for i in range(len(p)):
        phase = s[i] % (dash + gap)
        if phase < dash:
            cur.append(p[i])
        elif cur:
            if len(cur) > 1:
                out.append(np.array(cur))
            cur = []
    if len(cur) > 1:
        out.append(np.array(cur))
    return out


# ----------------------------------------------------------------------------
# hatch fills
# ----------------------------------------------------------------------------
def hatch_layer(mask, x0, y0, color, spacing=11, angle=-38.0, seed=0, edge_jitter=2.0, shade=0.10):
    """Marker scribble fill of a boolean mask placed at (x0, y0)."""
    rng = np.random.default_rng(seed)
    h, w = mask.shape
    m = mask.astype(np.uint8)
    if edge_jitter > 0 and min(h, w) > 8:
        m = cv2.erode(m, np.ones((2, 2), np.uint8))
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    ang = math.radians(angle)
    dx, dy = math.cos(ang), math.sin(ang)
    nx, ny = -dy, dx
    v = xx * nx + yy * ny
    uu = xx * dx + yy * dy
    nz = smooth_noise(h, w, 6, rng)
    k = np.floor((v - v.min()) / (spacing * 2.2))
    nk = float(k.max() + 1)
    un = (uu - uu.min()) / (np.ptp(uu) + 1e-6)
    frac = np.where((k % 2) == 0, un, 1.0 - un)
    T = (k + frac * 0.9) / nk + nz * 0.004
    stripe = 0.5 + 0.5 * np.cos(2 * np.pi * (v / spacing) + nz * 0.6)
    a = m.astype(np.float32) * (0.86 + 0.14 * stripe)
    a = cv2.GaussianBlur(a, (0, 0), 0.7)
    col = np.array(color, np.float32)
    rgb = col[None, None, :] * (1.0 - shade * (1 - stripe))[..., None] + nz[..., None] * 4.0
    return Layer(np.clip(rgb, 0, 255), a, T, x0, y0)


def poly_mask(polys, pad=0):
    """polys: list of (N,2) arrays in canvas coords -> (mask, x0, y0)."""
    allp = np.concatenate([np.asarray(p) for p in polys])
    x0, y0 = int(allp[:, 0].min()) - pad, int(allp[:, 1].min()) - pad
    x1, y1 = int(allp[:, 0].max()) + pad + 2, int(allp[:, 1].max()) + pad + 2
    m = np.zeros((y1 - y0, x1 - x0), np.uint8)
    cv2.fillPoly(m, [np.round(np.asarray(p) - [x0, y0]).astype(np.int32) for p in polys], 1)
    return m.astype(bool), x0, y0


def shape_layers(polys, fill, outline=INK, width=6, seed=0, spacing=11, angle=-38):
    """Return (outline_layer, fill_layer) for closed polygons."""
    closed = [np.vstack([p, p[:1]]) for p in polys]
    ol = stroke_layer(closed, outline, width, wobble=1.0, seed=seed) if outline else None
    fl = None
    if fill is not None:
        m, x0, y0 = poly_mask(polys)
        fl = hatch_layer(m, x0, y0, fill, spacing=spacing, angle=angle, seed=seed + 7)
    return ol, fl


def rect_poly(x0, y0, x1, y1):
    return np.array([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], float)


def rounded_rect_path(x0, y0, x1, y1, r=28, n=10):
    pts = []
    for (cx, cy, a0) in [(x1 - r, y0 + r, -90), (x1 - r, y1 - r, 0), (x0 + r, y1 - r, 90), (x0 + r, y0 + r, 180)]:
        for t in np.linspace(a0, a0 + 90, n):
            pts.append([cx + r * math.cos(math.radians(t)), cy + r * math.sin(math.radians(t))])
    pts.append(pts[0])
    return np.array(pts)


# ----------------------------------------------------------------------------
# text
# ----------------------------------------------------------------------------
COLOR_TAGS = {"*": RED, "_": BLUE, "~": GREEN, "^": ORANGE}


def _parse_runs(line, base):
    runs, cur, col, i = [], "", base, 0
    while i < len(line):
        ch = line[i]
        if ch in COLOR_TAGS:
            if cur:
                runs.append((cur, col))
            cur = ""
            col = COLOR_TAGS[ch] if col == base else base
        else:
            cur += ch
        i += 1
    if cur:
        runs.append((cur, col))
    return runs


def _plain(line):
    return "".join(ch for ch in line if ch not in COLOR_TAGS)


def wrap_text(text, f, max_w):
    out = []
    for para in text.split("\n"):
        words, cur = para.split(" "), ""
        for wd in words:
            cand = (cur + " " + wd).strip()
            if f.getlength(_plain(cand)) <= max_w or not cur:
                cur = cand
            else:
                out.append(cur)
                cur = wd
        out.append(cur)
    return out


def text_layer(text, x, y, size=80, color=INK, fname="marker", anchor="lt", max_w=None,
               line_gap=1.08, rot=-1.5, seed=0, align="left"):
    """Handwritten text. Colour runs: *red* _blue_ ~green~ ^orange^. Returns Layer."""
    rng = np.random.default_rng(seed)
    f = font(fname, size)
    lines = wrap_text(text, f, max_w) if max_w else text.split("\n")
    asc, desc = f.getmetrics()
    lh = int((asc + desc) * line_gap)
    widths = [f.getlength(_plain(ln)) for ln in lines]
    tw = int(max(widths) if widths else 1) + 40
    th = lh * len(lines) + 40
    img = Image.new("RGB", (tw, th), (0, 0, 0))
    al = Image.new("L", (tw, th), 0)
    di, da = ImageDraw.Draw(img), ImageDraw.Draw(al)
    T = np.full((th, tw), 1.0, np.float32)
    n = len(lines)
    for li, ln in enumerate(lines):
        lw = widths[li]
        ox = 20 + (0 if align == "left" else (tw - 40 - lw) / (2 if align == "center" else 1))
        oy = 20 + li * lh
        cx = ox
        for run, col in _parse_runs(ln, color):
            di.text((cx, oy), run, font=f, fill=tuple(int(c) for c in col))
            da.text((cx, oy), run, font=f, fill=255)
            cx += f.getlength(run)
        xs = np.arange(tw, dtype=np.float32)
        frac = np.clip((xs - ox) / max(lw, 1), 0, 1)
        T[oy:oy + lh, :] = (li + frac[None, :]) / n
    rgb = np.asarray(img, np.float32)
    a = np.asarray(al, np.float32) / 255.0
    nz = smooth_noise(th, tw, 3, rng)
    rgb = np.clip(rgb + nz[..., None] * 5, 0, 255)
    a = a * np.clip(1 - 0.08 * (0.5 + 0.5 * nz), 0.7, 1)
    if rot:
        M = cv2.getRotationMatrix2D((tw / 2, th / 2), rot, 1.0)
        rgb = cv2.warpAffine(rgb, M, (tw, th), flags=cv2.INTER_LINEAR)
        a = cv2.warpAffine(a, M, (tw, th), flags=cv2.INTER_LINEAR)
        T = cv2.warpAffine(T, M, (tw, th), flags=cv2.INTER_NEAREST, borderValue=1.0)
    ys, xs_ = np.nonzero(a > 0.02)
    if len(ys) == 0:
        return None
    cy0, cy1, cx0, cx1 = ys.min(), ys.max() + 1, xs_.min(), xs_.max() + 1
    rgb, a, T = rgb[cy0:cy1, cx0:cx1], a[cy0:cy1, cx0:cx1], T[cy0:cy1, cx0:cx1]
    h, w = a.shape
    if anchor == "lt":
        px, py = x, y
    elif anchor == "mm":
        px, py = x - w / 2, y - h / 2
    elif anchor == "mt":
        px, py = x - w / 2, y
    elif anchor == "rt":
        px, py = x - w, y
    elif anchor == "lm":
        px, py = x, y - h / 2
    elif anchor == "rm":
        px, py = x - w, y - h / 2
    else:
        px, py = x, y
    return Layer(rgb, a, T, px, py)


# ----------------------------------------------------------------------------
# sprites (generated illustrations with transparent background)
# ----------------------------------------------------------------------------
_sprite_cache = {}


def load_sprite(path):
    if path not in _sprite_cache:
        im = Image.open(path).convert("RGBA")
        _sprite_cache[path] = np.asarray(im, np.float32)
    return _sprite_cache[path]


def sprite_layer(path, cx, cy, h=None, w=None, flip=False, seed=0, anchor="mm"):
    """Draw-on sprite: dark outlines first (radial sweep per stroke group), then colour scribble."""
    rgba = load_sprite(path)
    sh, sw = rgba.shape[:2]
    if h is None and w is None:
        h = sh
    if h is not None and w is not None:
        s = min(h / sh, w / sw)
    elif h is not None:
        s = h / sh
    else:
        s = w / sw
    nw, nh = max(2, int(sw * s)), max(2, int(sh * s))
    im = cv2.resize(rgba, (nw, nh), interpolation=cv2.INTER_AREA)
    if flip:
        im = im[:, ::-1]
    rgb, a = im[..., :3], im[..., 3] / 255.0
    lum = rgb @ np.array([0.299, 0.587, 0.114], np.float32)
    ink = (lum < 85) & (a > 0.4)
    rng = np.random.default_rng(seed)
    T = np.ones((nh, nw), np.float32)
    # --- outline timing: connected stroke groups, each swept by angle around its centroid
    n_lab, lab, stats, cents = cv2.connectedComponentsWithStats(ink.astype(np.uint8), connectivity=8)
    comps = [i for i in range(1, n_lab) if stats[i, cv2.CC_STAT_AREA] > 3]
    comps.sort(key=lambda i: -stats[i, cv2.CC_STAT_AREA])
    big = comps[:1]
    rest = sorted(comps[1:], key=lambda i: (cents[i][0] + cents[i][1] * 0.5))
    order = big + rest
    weights = np.array([math.sqrt(stats[i, cv2.CC_STAT_AREA]) for i in order], np.float64)
    tot = weights.sum() if len(weights) else 1.0
    start = 0.0
    yy, xx = np.mgrid[0:nh, 0:nw].astype(np.float32)
    T_ink = np.ones((nh, nw), np.float32)
    for i, wgt in zip(order, weights):
        span = wgt / tot
        m = lab == i
        cxx, cyy = cents[i]
        ang = (np.arctan2(yy[m] - cyy, xx[m] - cxx) + np.pi / 2) % (2 * np.pi) / (2 * np.pi)
        T_ink[m] = start + span * ang
        start += span
    # --- colour timing: zig-zag hatch sweep from top to bottom
    band = max(14.0, nh / 11.0)
    k = np.floor(yy / band)
    nk = float(k.max() + 1)
    xn = xx / max(nw - 1, 1)
    frac = np.where(k % 2 == 0, xn, 1 - xn)
    nz = smooth_noise(nh, nw, 7, rng)
    T_col = (k + frac) / nk + nz * 0.02
    T = np.where(ink, 0.50 * T_ink, 0.38 + 0.62 * np.clip(T_col, 0, 1))
    if anchor == "mm":
        px, py = cx - nw / 2, cy - nh / 2
    elif anchor == "mb":
        px, py = cx - nw / 2, cy - nh
    else:
        px, py = cx, cy
    return Layer(rgb, a, T, px, py)


# ----------------------------------------------------------------------------
# scene + renderer
# ----------------------------------------------------------------------------
class Scene:
    def __init__(self, t0, t1, zoom=(1.0, 1.035), focus=(W / 2, H / 2)):
        self.t0, self.t1 = t0, t1
        self.elements = []
        self.zoom = zoom
        self.focus = focus

    def add(self, layer, t, dur=1.2, soft=0.05):
        if layer is not None:
            self.elements.append(Element(layer, t, dur, soft))
        return layer


class SceneRenderer:
    def __init__(self, scene, paper):
        self.s = scene
        self.paper = paper
        self.base = paper.copy()
        self.pending = sorted(scene.elements, key=lambda e: e.t0)
        self.baked = set()

    def frame(self, t):
        s = self.s
        # bake finished elements in z-order (only if all earlier-listed are baked/finished)
        for e in self.pending:
            if id(e) in self.baked:
                continue
            if e.t1 <= t:
                composite(self.base, e.layer, e.layer.a)
                self.baked.add(id(e))
        out = self.base.copy()
        for e in self.pending:
            if id(e) in self.baked:
                continue
            al = e.alpha_at(t)
            if al is not None:
                composite(out, e.layer, al)
        # camera push-in
        p = (t - s.t0) / max(1e-6, s.t1 - s.t0)
        p = 0.5 - 0.5 * math.cos(math.pi * min(max(p, 0), 1))
        z = s.zoom[0] + (s.zoom[1] - s.zoom[0]) * p
        if abs(z - 1.0) > 1e-4:
            fx, fy = s.focus
            M = np.array([[z, 0, (1 - z) * fx], [0, z, (1 - z) * fy]], np.float32)
            out = cv2.warpAffine(out, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
        return out

    def final(self):
        out = self.paper.copy()
        for e in sorted(self.s.elements, key=lambda e: e.t0):
            composite(out, e.layer, e.layer.a)
        z = self.s.zoom[1]
        fx, fy = self.s.focus
        M = np.array([[z, 0, (1 - z) * fx], [0, z, (1 - z) * fy]], np.float32)
        return cv2.warpAffine(out, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
