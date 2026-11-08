"""placeholders.py - rough stand-in pictures (same names/framing as the Google Flow list) drawn on the flat
light-blue background, so the whole pipeline (key -> prep -> Remotion) can be tested before the real pictures exist."""
import math
import os
from PIL import Image, ImageDraw

OUT = os.path.join(os.path.dirname(__file__), "..", "placeholder")
BG = (155, 207, 253)
INK = (17, 17, 17)
LW = 12


def canvas(w, h):
    im = Image.new("RGB", (w, h), BG)
    return im, ImageDraw.Draw(im)


def ell(d, cx, cy, rx, ry, fill, lw=LW):
    d.ellipse([cx - rx - lw, cy - ry - lw, cx + rx + lw, cy + ry + lw], fill=INK)
    d.ellipse([cx - rx, cy - ry, cx + rx, cy + ry], fill=fill)


def limb(d, pts, width=34, fill=(255, 255, 255)):
    d.line(pts, fill=INK, width=width + 2 * LW, joint="curve")
    for p in (pts[0], pts[-1]):
        d.ellipse([p[0] - width / 2 - LW, p[1] - width / 2 - LW, p[0] + width / 2 + LW, p[1] + width / 2 + LW], fill=INK)
    d.line(pts, fill=fill, width=width, joint="curve")
    for p in (pts[0], pts[-1]):
        d.ellipse([p[0] - width / 2, p[1] - width / 2, p[0] + width / 2, p[1] + width / 2], fill=fill)


def guy(name, pose):
    W, H = 1200, 1600
    im, d = canvas(W, H)
    cx, head_y, r = 600, 470, 230
    body_y = 960
    face_dx = -50 if pose in ("present", "drop", "oldtimey") else 0
    # legs
    limb(d, [(cx - 70, body_y + 120), (cx - 85, 1330)], 44)
    limb(d, [(cx + 70, body_y + 120), (cx + 85, 1330)], 44)
    ell(d, cx - 105, 1345, 60, 30, (255, 255, 255))
    ell(d, cx + 105, 1345, 60, 30, (255, 255, 255))
    # arms behind body
    if pose == "present":
        limb(d, [(cx + 120, body_y - 70), (cx + 170, body_y + 140)], 30)
    if pose == "drop":
        limb(d, [(cx + 120, body_y - 70), (cx + 170, body_y + 140)], 30)
    if pose == "oldtimey":
        limb(d, [(cx + 120, body_y - 70), (cx + 210, body_y + 30), (cx + 140, body_y + 110)], 30)
    ell(d, cx, body_y, 175, 210, (255, 255, 255))
    if pose == "present":
        limb(d, [(cx - 120, body_y - 70), (cx - 380, body_y - 80)], 30)
        ell(d, cx - 420, body_y - 92, 62, 20, (255, 255, 255))           # flat palm up
    if pose == "drop":
        limb(d, [(cx - 120, body_y - 70), (cx - 380, body_y - 80)], 30)
        ell(d, cx - 410, body_y - 60, 40, 50, (255, 255, 255))           # hand palm down
        for k in range(3):
            limb(d, [(cx - 440 + k * 28, body_y - 30), (cx - 445 + k * 30, body_y + 20)], 10)
    if pose == "shrug":
        for s in (-1, 1):
            limb(d, [(cx + s * 140, body_y - 70), (cx + s * 330, body_y + 20), (cx + s * 400, body_y - 190)], 30)
            ell(d, cx + s * 420, body_y - 222, 62, 20, (255, 255, 255))
    if pose == "scared":
        for s in (-1, 1):
            limb(d, [(cx + s * 140, body_y - 70), (cx + s * 330, body_y - 40), (cx + s * 300, head_y + 190)], 30)
            ell(d, cx + s * 300, head_y + 150, 45, 55, (255, 255, 255))
    if pose == "oldtimey":
        limb(d, [(cx - 120, body_y - 70), (cx - 300, body_y - 120), (cx - 330, body_y - 300)], 30)
        d.rounded_rectangle([cx - 390 - LW, body_y - 520 - LW, cx - 270 + LW, body_y - 300 + LW], 30, fill=INK)
        d.rounded_rectangle([cx - 390, body_y - 520, cx - 270, body_y - 300], 24, fill=(150, 84, 40))
        d.rectangle([cx - 355, body_y - 575, cx - 305, body_y - 520], fill=(200, 160, 110), outline=INK, width=LW)
        ell(d, cx - 330, body_y - 300, 45, 40, (255, 255, 255))
    # head
    ell(d, cx, head_y, r, r, (255, 255, 255))
    ex = cx + face_dx
    if pose == "drop":
        for s in (-1, 1):
            d.arc([ex + s * 75 - 30, head_y - 20, ex + s * 75 + 30, head_y + 20], 200, 340, fill=INK, width=10)
        ell(d, ex - 10, head_y + 95, 18, 18, (255, 150, 160), 8)
    else:
        big = pose == "scared"
        for s in (-1, 1):
            d.ellipse([ex + s * 75 - (20 if big else 15), head_y - (32 if big else 26), ex + s * 75 + (20 if big else 15),
                       head_y + (32 if big else 26)], fill=INK)
        if pose == "scared":
            ell(d, ex, head_y + 120, 45, 60, (255, 120, 140), 10)
        elif pose == "shrug":
            d.line([(ex - 45, head_y + 105), (ex - 15, head_y + 95), (ex + 15, head_y + 110), (ex + 45, head_y + 100)],
                   fill=INK, width=10)
        else:
            d.arc([ex - 50, head_y + 50, ex + 50, head_y + 120], 20, 160, fill=INK, width=10)
    if pose == "oldtimey":
        for s in (-1, 1):
            d.chord([ex + (0 if s < 0 else 0) - 10 + s * 5 - 80 * (s < 0), head_y + 60, ex + 10 + 80 * (s > 0), head_y + 115],
                    0, 360, fill=INK)
        ell(d, ex, head_y - 170, 55, 55, (200, 205, 215), 10)
    im.save(os.path.join(OUT, f"{name}.png"))


def phage():
    im, d = canvas(1200, 1200)
    cx = 600
    for s in (-1, 1):
        for k, (a, b) in enumerate([(160, 330), (230, 380), (290, 420)]):
            pts = [(cx + s * 40, 830), (cx + s * a, 900 + k * 10), (cx + s * b, 1100)]
            d.line(pts, fill=INK, width=30)
            d.line(pts, fill=(140, 140, 150), width=10)
    d.rectangle([cx - 60 - LW, 790 - LW, cx + 60 + LW, 850 + LW], fill=INK)
    d.rectangle([cx - 60, 790, cx + 60, 850], fill=(150, 150, 160))
    d.rectangle([cx - 45 - LW, 520, cx + 45 + LW, 800], fill=INK)
    d.rectangle([cx - 45, 520, cx + 45, 790], fill=(185, 185, 195))
    for y in range(560, 790, 40):
        d.line([(cx - 45, y), (cx + 45, y)], fill=INK, width=6)
    hexo = [(cx + 300 * math.cos(math.radians(a)), 330 + 300 * math.sin(math.radians(a))) for a in range(-90, 270, 60)]
    hexi = [(cx + 284 * math.cos(math.radians(a)), 330 + 284 * math.sin(math.radians(a))) for a in range(-90, 270, 60)]
    d.polygon(hexo, fill=INK)
    d.polygon(hexi, fill=(182, 150, 230))
    d.polygon([(cx, 170), (cx + 150, 255), (cx + 150, 410), (cx, 495), (cx - 150, 410), (cx - 150, 255)], fill=(205, 180, 245))
    im.save(os.path.join(OUT, "phage.png"))


def bact(name, kind):
    im, d = canvas(1200, 1200)
    if kind == "rod":
        col, dark = (150, 214, 70), (110, 170, 50)
        d.line([(990, 600), (1060, 560), (1110, 640), (1160, 590)], fill=INK, width=26)
        d.line([(990, 600), (1060, 560), (1110, 640), (1160, 590)], fill=col, width=8)
        d.rounded_rectangle([140 - LW, 420 - LW, 1000 + LW, 780 + LW], 190, fill=INK)
        d.rounded_rectangle([140, 420, 1000, 780], 180, fill=col)
        for x, y in [(330, 690), (760, 700), (880, 520)]:
            d.ellipse([x - 22, y - 22, x + 22, y + 22], fill=dark)
    elif kind == "round":
        col, dark = (255, 160, 60), (225, 120, 40)
        ell(d, 600, 600, 330, 330, col)
        for x, y in [(430, 800), (790, 760), (820, 420)]:
            d.ellipse([x - 24, y - 24, x + 24, y + 24], fill=dark)
    elif kind == "comma":
        col, dark = (240, 110, 170), (205, 80, 140)
        d.line([(220, 640), (130, 600), (90, 680), (40, 630)], fill=INK, width=26)
        d.line([(220, 640), (130, 600), (90, 680), (40, 630)], fill=col, width=8)
        d.pieslice([200 - LW, 330 - LW, 1000 + LW, 1130 + LW], 180, 360, fill=INK)
        d.pieslice([200, 330, 1000, 1130], 180, 360, fill=col)
        d.rectangle([200 - LW, 730, 1000 + LW, 820 + LW], fill=INK)
        d.rectangle([200, 730, 1000, 820], fill=col)
        for x, y in [(380, 780), (820, 640)]:
            d.ellipse([x - 22, y - 22, x + 22, y + 22], fill=dark)
    im.save(os.path.join(OUT, f"{name}.png"))


def pill():
    im, d = canvas(1200, 1200)
    d.rounded_rectangle([150 - LW, 440 - LW, 1050 + LW, 760 + LW], 170, fill=INK)
    d.rounded_rectangle([150, 440, 1050, 760], 160, fill=(255, 255, 255))
    d.rounded_rectangle([150, 440, 640, 760], 160, fill=(235, 60, 60))
    d.rectangle([480, 440, 600, 760], fill=(235, 60, 60))
    d.line([(600, 440), (600, 760)], fill=INK, width=10)
    d.rounded_rectangle([260, 480, 940, 515], 18, fill=(255, 210, 210))
    im.save(os.path.join(OUT, "pill.png"))


def lab():
    im, d = canvas(1920, 1080)
    d.rectangle([20 - LW, 560 - LW, 1900 + LW, 1000 + LW], fill=INK)
    d.rectangle([20, 560, 1900, 1000], fill=(240, 240, 238))
    d.rectangle([20, 560, 1900, 620], fill=(200, 205, 210))
    d.line([(20, 620), (1900, 620)], fill=INK, width=LW)
    for x in range(400, 1900, 480):
        d.line([(x, 620), (x, 1000)], fill=INK, width=8)
    # microscope
    d.rectangle([180, 300, 240, 560], fill=(80, 90, 110), outline=INK, width=LW)
    d.rectangle([120, 520, 330, 560], fill=(80, 90, 110), outline=INK, width=LW)
    # flasks
    for x, c in [(700, (170, 120, 230)), (980, (255, 160, 60))]:
        d.polygon([(x - 30, 330), (x + 30, 330), (x + 30, 400), (x + 110, 560), (x - 110, 560), (x - 30, 400)], fill=INK)
        d.polygon([(x - 18, 342), (x + 18, 342), (x + 18, 405), (x + 92, 548), (x - 92, 548), (x - 18, 405)], fill=(230, 230, 236))
        d.polygon([(x - 60, 470), (x + 60, 470), (x + 92, 548), (x - 92, 548)], fill=c)
    for k, c in enumerate([(150, 214, 70), (240, 110, 170), (150, 214, 70)]):
        x = 1300 + k * 70
        d.rounded_rectangle([x - 22, 380, x + 22, 560], 22, fill=(230, 230, 236), outline=INK, width=LW)
        d.rounded_rectangle([x - 12, 470, x + 12, 552], 12, fill=c)
    for k in range(3):
        y = 540 - k * 30
        d.rounded_rectangle([1560, y - 16, 1760, y + 12], 10, fill=(225, 235, 230), outline=INK, width=LW)
    im.save(os.path.join(OUT, "lab_bg.png"))


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for n, p in [("guy_present", "present"), ("guy_drop", "drop"), ("guy_shrug", "shrug"),
                 ("guy_oldtimey", "oldtimey"), ("guy_scared", "scared")]:
        guy(n, p)
    phage()
    bact("bact_rod", "rod"); bact("bact_round", "round"); bact("bact_comma", "comma")
    pill(); lab()
    print("placeholders ->", os.path.abspath(OUT))
