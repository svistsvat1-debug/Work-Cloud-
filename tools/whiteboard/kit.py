"""Reusable whiteboard building blocks (titles, labels, cards, flags, calendar, quest map...)."""
import math
import os

import cv2
import numpy as np

import wb
from wb import BLUE, GREEN, GREY, INK, ORANGE, PAPER, RED, WHITE, YELLOW

SPRITES = os.environ.get("WB_SPRITES", "sprites")
_seed = [100]


def nseed():
    _seed[0] += 1
    return _seed[0]


def _tdur(text, size):
    n = len(text)
    return min(2.4, 0.35 + n * (0.035 if size < 70 else 0.05))


# --- text -------------------------------------------------------------------------------------
def title(sc, text, t, x=90, y=55, size=88, color=INK, ul=RED, anchor="lt", max_w=None, dur=None, rot=-1.5):
    L = wb.text_layer(text, x, y, size=size, color=color, anchor=anchor, max_w=max_w, seed=nseed(), rot=rot)
    d = dur or _tdur(text, size)
    sc.add(L, t, d)
    if ul and L is not None:
        x0, y0, x1, y1 = L.bbox()
        sc.add(wb.underline_layer(x0 + 10, x1 - 14, y1 + 2, color=ul, width=max(7, size * 0.1), seed=nseed()),
               t + d * 0.92, 0.45)
    return L


def label(sc, text, t, x, y, size=50, color=RED, anchor="mm", max_w=None, dur=None, fname="marker", rot=-1.0,
          align="center"):
    L = wb.text_layer(text, x, y, size=size, color=color, anchor=anchor, max_w=max_w, seed=nseed(), rot=rot,
                      fname=fname, align=align)
    sc.add(L, t, dur or _tdur(text, size))
    return L


def big(sc, text, t, x, y, size=150, bursts=True, dur=None, ul=None, color=RED):
    L = wb.text_layer(text, x, y, size=size, color=color, anchor="mm", seed=nseed(), rot=-2.0)
    d = dur or min(1.4, 0.4 + 0.07 * len(text))
    sc.add(L, t, d)
    if L is not None:
        x0, y0, x1, y1 = L.bbox()
        if bursts:
            sc.add(wb.burst_layer((x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) / 2 + 12, (y1 - y0) / 2,
                                  length=size * 0.28, width=max(7, size * 0.07), seed=nseed()), t + d, 0.45)
        if ul:
            sc.add(wb.underline_layer(x0 + 10, x1 - 10, y1 + 4, color=ul, width=size * 0.08, seed=nseed()),
                   t + d, 0.4)
    return L


def quote(sc, text, t, x, y, size=58, max_w=1100, dur=None, color=INK):
    L = wb.text_layer(text, x, y, size=size, color=color, anchor="mm", max_w=max_w, fname="hand", seed=nseed(),
                      rot=-1.0, align="center")
    d = dur or min(5.0, 0.6 + len(text) * 0.045)
    sc.add(L, t, d)
    if L is not None:
        x0, y0, x1, y1 = L.bbox()
        q = wb.text_layer("“", x0 - 20, y0 - 20, size=int(size * 2.6), color=RED, anchor="rm", seed=nseed(),
                          fname="hand")
        sc.add(q, t - 0.3, 0.3)
    return L


# --- sprites ----------------------------------------------------------------------------------
def sprite(sc, key, t, cx, cy, h=None, w=None, dur=None, flip=False, anchor="mm"):
    path = os.path.join(SPRITES, key + ".png")
    if not os.path.exists(path):
        print("missing sprite", key)
        return None
    if w is not None and h is None:
        h = w * 0.75
    elif h is not None and w is None:
        w = h * 1.45
    L = wb.sprite_layer(path, cx, cy, h=h, w=w, flip=flip, seed=nseed(), anchor=anchor)
    size = max(L.w, L.h)
    sc.add(L, t, dur or (1.3 + size / 520.0), soft=0.04)
    return L


def note_bg(sc, t, x0, y0, x1, y1, dur=0.35):
    """Opaque paper note with marker outline (to put sprites on top of maps)."""
    poly = wb.rounded_rect_path(x0, y0, x1, y1, r=24)
    m, mx, my = wb.poly_mask([poly])
    rgb = np.ones(m.shape + (3,), np.float32) * np.array(PAPER, np.float32)
    a = m.astype(np.float32)
    yy, xx = np.mgrid[0:m.shape[0], 0:m.shape[1]].astype(np.float32)
    sc.add(wb.Layer(rgb, a, xx / max(1, m.shape[1]), mx, my), t, dur)
    sc.add(wb.stroke_layer([poly], INK, 5, wobble=0.8, seed=nseed()), t + dur * 0.5, 0.6)


# --- marks ------------------------------------------------------------------------------------
def xmark(sc, cx, cy, r, t, dur=0.45, width=None):
    sc.add(wb.cross_layer(cx, cy, r, width=width or max(9, r * 0.14), seed=nseed()), t, dur)


def check(sc, cx, cy, r, t, dur=0.4):
    sc.add(wb.check_layer(cx, cy, r, width=max(9, r * 0.18), seed=nseed()), t, dur)


def ring(sc, cx, cy, rx, ry, t, color=RED, width=8, dur=0.6):
    sc.add(wb.circle_layer(cx, cy, rx, ry, color=color, width=width, seed=nseed()), t, dur)


def arrow(sc, p0, p1, t, color=RED, width=8, bend=0.15, dur=0.5, head=None):
    sc.add(wb.arrow_layer(p0, p1, color=color, width=width, bend=bend, seed=nseed(), head=head), t, dur)


def path_arrow(sc, pts, t, color=RED, width=16, dur=1.0, head=None):
    sc.add(wb.polyline_arrow_layer(pts, color=color, width=width, seed=nseed(), head=head), t, dur)


def dashed_arrow(sc, p0, p1, t, color=BLUE, width=7, bend=0.2, dur=0.7):
    body = wb.bezier(p0, p1, bend, n=80)
    paths = wb.dashed_path(body)
    d = body[-1] - body[-4]
    d /= np.linalg.norm(d) + 1e-9
    ang = math.atan2(d[1], d[0])
    tip = body[-1]
    hd = width * 3.2
    paths += [np.array([tip + hd * np.array([math.cos(ang + 2.5), math.sin(ang + 2.5)]), tip]),
              np.array([tip, tip + hd * np.array([math.cos(ang - 2.5), math.sin(ang - 2.5)])])]
    sc.add(wb.stroke_layer(paths, color, width, wobble=0.6, seed=nseed()), t, dur)


def zigzag_tear(sc, x0, y0, x1, y1, t, color=RED, width=9, dur=0.5):
    n = 9
    pts = []
    for i in range(n + 1):
        f = i / n
        x = x0 + (x1 - x0) * f + (14 if i % 2 else -14)
        y = y0 + (y1 - y0) * f
        pts.append([x, y])
    sc.add(wb.stroke_layer([np.array(pts)], color, width, wobble=0.5, seed=nseed()), t, dur)


# --- filled shapes ----------------------------------------------------------------------------
def shape(sc, polys, t, fill, outline=INK, width=6, dur=0.9, spacing=10, angle=-38):
    ol, fl = wb.shape_layers(polys, fill, outline, width, seed=nseed(), spacing=spacing, angle=angle)
    if ol is not None:
        sc.add(ol, t, dur * 0.5)
    if fl is not None:
        sc.add(fl, t + dur * 0.35, dur * 0.65)


def flag(sc, kind, t, cx, cy, w=240, dur=1.4, pole=True):
    h = w * 0.62
    x0, y0 = cx - w / 2, cy - h / 2
    x1, y1 = x0 + w, y0 + h
    rect = wb.rect_poly(x0, y0, x1, y1)
    layers = []

    def band(poly, col):
        m, mx, my = wb.poly_mask([poly])
        layers.append(wb.hatch_layer(m, mx, my, col, spacing=8, seed=nseed()))

    def mask_draw(draw_fn, col):
        m = np.zeros((int(h) + 4, int(w) + 4), np.uint8)
        draw_fn(m)
        m[int(h) + 1:, :] = 0
        m[:, int(w) + 1:] = 0
        layers.append(wb.hatch_layer(m.astype(bool), int(x0), int(y0), col, spacing=8, seed=nseed()))

    if kind == "FR":
        band(wb.rect_poly(x0, y0, x0 + w / 3, y1), BLUE)
        band(wb.rect_poly(x0 + w / 3, y0, x0 + 2 * w / 3, y1), WHITE)
        band(wb.rect_poly(x0 + 2 * w / 3, y0, x1, y1), RED)
    elif kind == "UK":
        band(rect, (22, 50, 140))
        W_, H_ = int(w), int(h)
        mask_draw(lambda m: (cv2.line(m, (0, 0), (W_, H_), 1, int(h * 0.2)), cv2.line(m, (0, H_), (W_, 0), 1, int(h * 0.2))), WHITE)
        mask_draw(lambda m: (cv2.line(m, (0, 0), (W_, H_), 1, int(h * 0.07)), cv2.line(m, (0, H_), (W_, 0), 1, int(h * 0.07))), RED)
        mask_draw(lambda m: (cv2.rectangle(m, (int(W_ / 2 - h * 0.17), 0), (int(W_ / 2 + h * 0.17), H_), 1, -1),
                             cv2.rectangle(m, (0, int(H_ / 2 - h * 0.17)), (W_, int(H_ / 2 + h * 0.17)), 1, -1)), WHITE)
        mask_draw(lambda m: (cv2.rectangle(m, (int(W_ / 2 - h * 0.1), 0), (int(W_ / 2 + h * 0.1), H_), 1, -1),
                             cv2.rectangle(m, (0, int(H_ / 2 - h * 0.1)), (W_, int(H_ / 2 + h * 0.1)), 1, -1)), RED)
    elif kind == "US":
        band(rect, WHITE)
        sh = h / 13
        for i in range(0, 13, 2):
            band(wb.rect_poly(x0, y0 + i * sh, x1, y0 + (i + 1) * sh), RED)
        band(wb.rect_poly(x0, y0, x0 + w * 0.42, y0 + 7 * sh), (25, 60, 150))
        dots = []
        for r in range(4):
            for c in range(5):
                dots.append((x0 + w * 0.42 * (c + 0.6) / 5.2, y0 + 7 * sh * (r + 0.6) / 4.2))
        def dd(m):
            for (dx, dy) in dots:
                cv2.circle(m, (int(dx - x0), int(dy - y0)), max(2, int(w * 0.012)), 1, -1)
        mask_draw(dd, WHITE)
    elif kind == "SU":
        band(rect, (205, 30, 35))
        sx, sy, sr = x0 + w * 0.17, y0 + h * 0.25, h * 0.11
        star = []
        for i in range(10):
            ang = -math.pi / 2 + i * math.pi / 5
            rr = sr if i % 2 == 0 else sr * 0.45
            star.append([sx + rr * math.cos(ang), sy + rr * math.sin(ang)])
        band(np.array(star), YELLOW)
    order = []
    if pole:
        order.append(wb.stroke_layer([np.array([[x0 - 4, y0 - 16], [x0 - 4, y1 + h * 0.9]])], (120, 80, 45), 9,
                                     wobble=0.6, seed=nseed()))
    order.append(wb.stroke_layer([np.vstack([rect, rect[:1]])], INK, 5, wobble=0.8, seed=nseed()))
    t_ = t
    for i, L in enumerate(order):
        sc.add(L, t_, 0.35)
        t_ += 0.25
    step = (dur - 0.5) / max(1, len(layers))
    for L in layers:
        sc.add(L, t_, max(0.25, step * 1.4))
        t_ += step


def calendar(sc, t, cx, cy, month, day, year, w=320, cross_year_t=None, new_year=None, dur=1.4):
    h = w * 1.05
    x0, y0, x1, y1 = cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2
    hh = h * 0.27
    shape(sc, [wb.rect_poly(x0, y0, x1, y1)], t, WHITE, dur=0.6)
    shape(sc, [wb.rect_poly(x0, y0, x1, y0 + hh)], t + 0.3, RED, dur=0.6)
    for rx in (x0 + w * 0.28, x1 - w * 0.28):
        sc.add(wb.stroke_layer([np.array([[rx, y0 - 22], [rx, y0 + 18]])], INK, 9, seed=nseed()), t + 0.5, 0.2)
    label(sc, month, t + 0.7, cx, y0 + hh / 2, size=int(hh * 0.55), color=WHITE)
    label(sc, day, t + 1.0, cx, y0 + hh + (h - hh) * 0.42, size=int(h * 0.38), color=INK)
    yl = label(sc, year, t + 1.3, cx, y1 - h * 0.13, size=int(h * 0.13), color=BLUE)
    if cross_year_t is not None and yl is not None:
        bx0, by0, bx1, by1 = yl.bbox()
        sc.add(wb.stroke_layer([np.array([[bx0 - 6, (by0 + by1) / 2 + 4], [bx1 + 6, (by0 + by1) / 2 - 4]])], RED, 9,
                               seed=nseed()), cross_year_t, 0.35)
        label(sc, new_year, cross_year_t + 0.4, x1 + w * 0.42, y1 - h * 0.13, size=int(h * 0.17), color=RED)


def stop_sign(sc, t, cx, cy, r=90):
    pts = [[cx + r * math.cos(math.pi / 8 + i * math.pi / 4), cy + r * math.sin(math.pi / 8 + i * math.pi / 4)]
           for i in range(8)]
    shape(sc, [np.array(pts)], t, RED, dur=0.8)
    label(sc, "STOP", t + 0.7, cx, cy, size=int(r * 0.62), color=WHITE, rot=0)
    sc.add(wb.stroke_layer([np.array([[cx, cy + r], [cx, cy + r * 2.4]])], GREY, 10, seed=nseed()), t, 0.3)


def lightning(sc, t, cx, cy, h=300):
    s = h / 300.0
    pts = np.array([[30, -150], [-60, 10], [-5, 10], [-40, 150], [70, -30], [12, -30], [50, -150]], float) * s
    pts += [cx, cy]
    shape(sc, [pts], t, YELLOW, dur=0.9, spacing=7)


def snowflake(sc, t, cx, cy, r=60, color=BLUE):
    paths = []
    for i in range(3):
        ang = i * math.pi / 3
        d = np.array([math.cos(ang), math.sin(ang)])
        paths.append(np.array([[cx, cy] - d * r, [cx, cy] + d * r]))
        for sgn in (-1, 1):
            tip = np.array([cx, cy]) + sgn * d * r * 0.62
            for k in (-1, 1):
                a2 = ang + k * 0.6 + (0 if sgn > 0 else math.pi)
                paths.append(np.array([tip, tip + np.array([math.cos(a2), math.sin(a2)]) * r * 0.32]))
    sc.add(wb.stroke_layer(paths, color, max(5, r * 0.09), seed=nseed()), t, 0.6)


def target(sc, t, cx, cy, r=160):
    for i, rr in enumerate([r, r * 0.66, r * 0.33]):
        sc.add(wb.circle_layer(cx, cy, rr, color=RED, width=9, seed=nseed()), t + i * 0.25, 0.4)


def radar_waves(sc, t, cx, cy, n=3, r0=110, dr=80, color=BLUE, a0=-45, a1=45):
    for i in range(n):
        r = r0 + i * dr
        a = np.radians(np.linspace(a0, a1, 40))
        pts = np.stack([cx + r * np.cos(a), cy + r * np.sin(a)], 1)
        sc.add(wb.stroke_layer([pts], color, 8, seed=nseed()), t + i * 0.3, 0.35)


def bubble(sc, t, x0, y0, x1, y1, text, tail=None, size=60, color=INK, thought=False, fname="hand"):
    poly = wb.rounded_rect_path(x0, y0, x1, y1, r=40)
    sc.add(wb.stroke_layer([poly], INK, 6, seed=nseed()), t, 0.6)
    if tail is not None:
        tx, ty = tail
        bx, by = (x0 + x1) / 2, y1
        if thought:
            for k, rr in enumerate([18, 12, 8]):
                f = 0.3 + 0.3 * k
                sc.add(wb.circle_layer(bx + (tx - bx) * f, by + (ty - by) * f, rr, color=INK, width=5,
                                       seed=nseed()), t + 0.5 + 0.1 * k, 0.2)
        else:
            sc.add(wb.stroke_layer([np.array([[bx - 30, by - 2], [tx, ty], [bx + 30, by - 2]])], INK, 6,
                                   seed=nseed()), t + 0.5, 0.3)
    label(sc, text, t + 0.6, (x0 + x1) / 2, (y0 + y1) / 2, size=size, color=color, max_w=(x1 - x0) - 60,
          fname=fname)


def stamp(sc, t, text, cx, cy, size=90, color=RED, rot=-7):
    L = wb.text_layer(text, cx, cy, size=size, color=color, anchor="mm", seed=nseed(), rot=rot)
    if L is None:
        return
    x0, y0, x1, y1 = L.bbox()
    pad = size * 0.3
    box = wb.rounded_rect_path(x0 - pad, y0 - pad * 0.6, x1 + pad, y1 + pad * 0.6, r=18)
    c = np.array([cx, cy])
    M = cv2.getRotationMatrix2D((cx, cy), rot, 1.0)
    box = (np.hstack([box, np.ones((len(box), 1))]) @ M.T)
    sc.add(wb.stroke_layer([box], color, 9, seed=nseed()), t, 0.5)
    sc.add(L, t + 0.3, 0.7)


# --- quest UI ---------------------------------------------------------------------------------
def quest_card(sc, t, n, question, total=5):
    x0, y0, x1, y1 = 230, 170, 1690, 900
    sc.add(wb.stroke_layer([wb.rounded_rect_path(x0, y0, x1, y1, r=46)], INK, 8, seed=nseed()), t, 0.8)
    big(sc, f"QUESTION {n}/{total}", t + 0.5, 960, 300, size=96, color=RED)
    label(sc, question, t + 1.3, 960, 590, size=86, color=INK, max_w=1250, dur=min(2.2, 0.5 + 0.04 * len(question)))
    # progress dots
    for i in range(total):
        cx = 960 + (i - (total - 1) / 2) * 80
        if i < n - 1:
            m = np.zeros((40, 40), np.uint8)
            cv2.circle(m, (20, 20), 16, 1, -1)
            sc.add(wb.hatch_layer(m.astype(bool), int(cx - 20), 800, GREEN, spacing=5, seed=nseed()), t + 0.6, 0.3)
        sc.add(wb.circle_layer(cx, 820, 18, color=INK if i != n - 1 else RED, width=5, seed=nseed()),
               t + 0.4 + 0.08 * i, 0.25)


def answer_card(sc, t, text, y=430, size=80):
    big(sc, "ANSWER", t, 960, 170, size=96, color=GREEN)
    L = label(sc, text, t + 0.8, 960, y, size=size, color=INK, max_w=1400, dur=min(2.6, 0.5 + 0.04 * len(text)))
    return L


def key_slots(sc, t, y, xs, filled_now=(), fill_at=None, size=130):
    """Three clue slots; filled_now: indices filled from the start; fill_at: {idx: time}."""
    fill_at = fill_at or {}
    for i, x in enumerate(xs):
        p = wb.rounded_rect_path(x - size / 2, y - size / 2, x + size / 2, y + size / 2, r=22)
        sc.add(wb.stroke_layer(wb.dashed_path(p, 18, 12), GREY, 5, seed=nseed()), t + 0.1 * i, 0.4)
        when = t + 0.2 if i in filled_now else fill_at.get(i)
        if when is not None:
            sprite(sc, "key", when, x, y, h=size * 0.85, dur=0.6)
        else:
            label(sc, "?", t + 0.3, x, y, size=int(size * 0.55), color=GREY)


def level_map(sc, t, nodes, labels, icons, appear, done=(), check_at=None):
    """Game-like level map: dashed path through numbered nodes."""
    pts = np.array(nodes, float)
    dense = []
    P = np.vstack([pts[0], pts, pts[-1]])
    for i in range(1, len(P) - 2):
        for tt in np.linspace(0, 1, 20, endpoint=False):
            t2, t3 = tt * tt, tt ** 3
            dense.append(0.5 * ((2 * P[i]) + (-P[i - 1] + P[i + 1]) * tt
                                + (2 * P[i - 1] - 5 * P[i] + 4 * P[i + 1] - P[i + 2]) * t2
                                + (-P[i - 1] + 3 * P[i] - 3 * P[i + 1] + P[i + 2]) * t3))
    dense.append(pts[-1])
    sc.add(wb.stroke_layer(wb.dashed_path(np.array(dense), 24, 16), GREY, 6, seed=nseed()), t, 1.6)
    for i, (x, y) in enumerate(nodes):
        ta = appear[i]
        m = np.zeros((130, 130), np.uint8)
        cv2.circle(m, (65, 65), 60, 1, -1)
        col = GREEN if i in done else YELLOW
        sc.add(wb.hatch_layer(m.astype(bool), int(x - 65), int(y - 65), col, spacing=7, seed=nseed()), ta + 0.3, 0.5)
        sc.add(wb.circle_layer(x, y, 62, color=INK, width=7, seed=nseed()), ta, 0.45)
        label(sc, str(i + 1), ta + 0.5, x, y, size=70, color=INK, rot=0)
        if labels[i]:
            label(sc, labels[i], ta + 0.6, x, y + 112, size=40, color=INK, fname="hand", max_w=300)
        if icons[i]:
            sprite(sc, icons[i], ta + 0.2, x, y - 165, h=150, dur=1.0)
        if check_at and i in check_at:
            check(sc, x + 50, y - 50, 40, check_at[i])
