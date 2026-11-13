"""Fill YouTube's all-device banner zone (1546x423 centred in 2560x1440) edge to edge with two groups:
a text group on the left and a character on the right, both scaled to the zone height.
usage: python3 banner_fill_safe.py raw.png out.png erase(x0,y0,x1,y1) text(x0,y0,x1,y1) char(x0,y0,x1,y1) [margin]
The character may extend below the zone (only its shoulders; head stays inside)."""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
src, out = sys.argv[1:3]
E = list(map(int, sys.argv[3].split(","))); Tb = list(map(int, sys.argv[4].split(","))); Cb = list(map(int, sys.argv[5].split(",")))
M = int(sys.argv[6]) if len(sys.argv) > 6 else 10
W, H = 2560, 1440; ZW, ZH = 1546, 423; zx0, zy0 = (W - ZW) // 2, (H - ZH) // 2
img = Image.open(src).convert("RGB").resize((W, H), Image.LANCZOS)
board = tuple(int(c) for c in np.median(np.asarray(img).reshape(-1, 3), axis=0))
er = Image.new("L", (W, H), 0); ImageDraw.Draw(er).rectangle(E, fill=255); er = er.filter(ImageFilter.MaxFilter(31)).filter(ImageFilter.GaussianBlur(8))
base = Image.composite(Image.new("RGB", (W, H), board), img, er)
P = 14  # padding of board colour around each crop, used for a soft edge
def grab(b, keep=None):
    """crop with board-colour padding; keep(x, y) -> bool limits which source pixels belong to this group"""
    src_ = img
    if keep is not None:
        a_ = np.asarray(img).copy(); ys, xs = np.mgrid[0:H, 0:W]
        a_[~keep(xs, ys)] = board; src_ = Image.fromarray(a_)
    return src_.crop((b[0] - P, b[1] - P, b[2] + P, b[3] + P))
SPLIT = [int(v) for v in (sys.argv[7].split(",") if len(sys.argv) > 7 else "1610,800,1592,1616".split(","))]
# text keeps x <= SPLIT[0] above y=SPLIT[1] and x <= SPLIT[2] below it; character keeps x >= SPLIT[3]
keep_text = lambda x, y: np.where(y < SPLIT[1], x <= SPLIT[0], x <= SPLIT[2])
keep_char = lambda x, y: x >= SPLIT[3]
def mask(w, h, f, bottom_fade=0):
    m = Image.new("L", (w, h), 0); ImageDraw.Draw(m).rectangle([f, f, w - f, h - f - bottom_fade], fill=255)
    return m.filter(ImageFilter.GaussianBlur(f / 2 + bottom_fade / 3))
s = (ZH - 2 * M) / (Tb[3] - Tb[1])           # text fills the zone height
T = grab(Tb, keep_text); T = T.resize((int(T.width * s), int(T.height * s)), Image.LANCZOS)
C = grab(Cb, keep_char); C = C.resize((int(C.width * s), int(C.height * s)), Image.LANCZOS)
p = int(P * s)
tx = zx0 + M - p; ty = zy0 + M - p                          # text: left edge and top on the zone margin
cx = zx0 + ZW - M - (C.width - p); cy = zy0 + M - p        # character: right edge and top on the zone margin
base.paste(T, (tx, ty), mask(T.width, T.height, p))
base.paste(C, (cx, cy), mask(C.width, C.height, p, bottom_fade=int(40 * s)))
base.save(out)
print("scale", round(s, 3), "text", T.size, "at", (tx + p, ty + p), "char", C.size, "at", (cx + p, cy + p), "char bottom", cy + C.height - p, "zone", (zx0, zy0, zx0 + ZW, zy0 + ZH), "gap", cx + p - (tx + T.width - p))
