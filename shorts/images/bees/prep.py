"""prep.py - cut/ (keyed RGBA, raw 768x1376) -> fixes -> anchors -> trimmed 2x sprites in public/bees/s/
and src/bees/sprites.ts.   Run from shorts/images/bees:  python3 -I prep.py"""
import json, os, colorsys
import numpy as np, cv2
from PIL import Image, ImageDraw

OUT = "../../public/bees/s"
TS = "../../src/bees/sprites.ts"
os.makedirs(OUT, exist_ok=True)
PAD, UP = 12, 2


def load(n):
    return np.asarray(Image.open(f"cut/{n}.png").convert("RGBA")).astype(np.float32)


def hsv(a):
    rgb = a[..., :3] / 255.0
    mx, mn = rgb.max(2), rgb.min(2)
    d = mx - mn + 1e-6
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    s = np.where(mx > 0, (mx - mn) / (mx + 1e-6), 0)
    return h, s, mx


def head_disc(a):
    a8 = (a[..., 3] > 128).astype(np.uint8)
    h, w = a8.shape
    ff = a8.copy()
    cv2.floodFill(ff, np.zeros((h + 2, w + 2), np.uint8), (0, 0), 2)
    solid = np.where(ff == 2, 0, 1).astype(np.uint8)
    dt = cv2.distanceTransform(solid, cv2.DIST_L2, 5)
    hy, hx = np.unravel_index(dt.argmax(), dt.shape)
    return float(hx), float(hy), float(dt[hy, hx])


def feet(a):
    al = a[..., 3] > 128
    ys = np.where(al.any(1))[0]
    y1 = ys.max()
    band = al[int(y1 - (ys.max() - ys.min()) * 0.035):y1 + 1]
    xs = np.where(band.any(0))[0]
    return float(xs.mean()), float(y1)


# ---------------------------------------------------------------- fixes
def fix_face_erase(a):
    """02: erase the drawn face (eyes, brows, nose, mouth) so faces can be drawn in code."""
    hx, hy, r = head_disc(a)
    yy, xx = np.mgrid[:a.shape[0], :a.shape[1]]
    inside = (xx - hx) ** 2 + (yy - hy) ** 2 < (r * 0.86) ** 2
    lum = a[..., :3].mean(2)
    m = (inside & (lum < 215)).astype(np.uint8)
    m = cv2.dilate(m, np.ones((5, 5), np.uint8))
    bgr = cv2.cvtColor(a[..., :3].astype(np.uint8), cv2.COLOR_RGB2BGR)
    inp = cv2.inpaint(bgr, m, 6, cv2.INPAINT_TELEA)
    a = a.copy()
    a[..., :3] = cv2.cvtColor(inp, cv2.COLOR_BGR2RGB)
    return a


def fix_jeans(a):
    """05: blue jeans -> white trousers (keep shading as a pale grey-blue like the head shade)."""
    h, s, v = hsv(a)
    m = (h > 185) & (h < 235) & (s > 0.25) & (v > 0.28) & (a[..., 3] > 0)
    a = a.copy()
    t = np.clip((v - 0.28) / (0.71 - 0.28), 0, 1)[..., None]
    white = np.array([252, 252, 252], np.float32)
    shade = np.array([170, 182, 198], np.float32)
    a[..., :3] = np.where(m[..., None], shade + (white - shade) * t, a[..., :3])
    return a


def fix_bee_palette(a, browns=True):
    """07 / 22: golden yellow -> bright yellow of the other bees, brown stripes -> near black."""
    h, s, v = hsv(a)
    a = a.copy()
    al = a[..., 3] > 0
    gold = al & (h > 22) & (h < 52) & (s > 0.65) & (v > 0.62)
    yel = np.array([252, 206, 52], np.float32)
    a[..., :3] = np.where(gold[..., None], yel * np.clip(v / 0.894, 0.72, 1.05)[..., None], a[..., :3])
    if browns:
        br = al & (h > 5) & (h < 45) & (s > 0.45) & (v < 0.42) & (v > 0.12)
        a[..., :3] = np.where(br[..., None], np.array([40, 34, 22], np.float32) * (v / 0.33)[..., None], a[..., :3])
    return a


def fix_stinger(a):
    """22: keep only the lower part (stinger + venom sac + torn bits) under a zig-zag tear line with an ink stroke."""
    a = fix_bee_palette(a, browns=False)
    h, w = a.shape[:2]
    xs = np.arange(w)
    period, amp, y0 = 26.0, 13.0, 222.0
    tri = np.abs(((xs / period) % 1.0) * 2 - 1)            # 0..1 triangle
    zig = y0 + (tri - 0.5) * 2 * amp
    yy = np.arange(h)[:, None]
    keep = yy > zig[None, :]
    a = a.copy()
    a[..., 3] = np.where(keep, a[..., 3], 0)
    # ink stroke along the tear where the piece is opaque
    ink = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(ink)
    d.line([(float(x), float(zig[x]) + 1.5) for x in range(w)], fill=255, width=5)
    ink = np.asarray(ink) > 0
    body = cv2.dilate((a[..., 3] > 128).astype(np.uint8), np.ones((3, 3), np.uint8)) > 0
    st = ink & body
    a[st, :3] = 0
    a[st, 3] = 255
    return a


def split_sac(a):
    """22 (fixed): venom sac (pale yellow blob right of the shaft) -> its own sprite."""
    h, s, v = hsv(a)
    al = a[..., 3] > 0
    fill = al & (h > 36) & (h < 62) & (s > 0.08) & (s < 0.62) & (v > 0.72)
    yy, xx = np.mgrid[:a.shape[0], :a.shape[1]]
    fill &= (xx > 398) & (yy > 200) & (yy < 600)
    n, lab, st, _ = cv2.connectedComponentsWithStats(fill.astype(np.uint8), 8)
    big = 1 + np.argmax(st[1:, cv2.CC_STAT_AREA])
    m = (lab == big).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    m = cv2.dilate(m, np.ones((21, 21), np.uint8)).astype(bool) & al & (xx > 405) & (yy > 196)
    sac = a.copy(); sac[..., 3] = np.where(m, a[..., 3], 0)
    body = a.copy(); body[..., 3] = np.where(m, 0, a[..., 3])
    return body, sac


def split_row(a, gap=6):
    al = a[..., 3] > 40
    cols = al.any(0)
    parts, x = [], 0
    w = len(cols)
    while x < w:
        if cols[x]:
            x0 = x
            while x < w and (cols[x:x + gap].any()):
                x += 1
            parts.append((x0, x))
        else:
            x += 1
    outs = []
    for x0, x1 in parts:
        p = a.copy(); p[..., 3] = 0; p[:, x0:x1, 3] = a[:, x0:x1, 3]
        outs.append(p)
    return outs


# ---------------------------------------------------------------- save
SPR = {}


def save(name, a, anchors, box=None):
    al = a[..., 3] > 8
    ys, xs = np.where(al)
    x0, y0 = max(xs.min() - PAD, 0), max(ys.min() - PAD, 0)
    x1, y1 = min(xs.max() + PAD + 1, a.shape[1]), min(ys.max() + PAD + 1, a.shape[0])
    if box is not None:
        x0, y0, x1, y1 = box
    c = a[y0:y1, x0:x1].copy()
    # premultiplied Lanczos upscale (no dark/blue fringes), then a light unsharp on colour
    al = c[..., 3:4] / 255.0
    pm = np.concatenate([c[..., :3] * al, c[..., 3:4]], 2)
    W, H = c.shape[1] * UP, c.shape[0] * UP
    up = cv2.resize(pm, (W, H), interpolation=cv2.INTER_LANCZOS4)
    up = np.clip(up, 0, 255)
    a2 = up[..., 3:4] / 255.0
    rgb = np.where(a2 > 0.003, up[..., :3] / np.maximum(a2, 0.003), 0)
    blur = cv2.GaussianBlur(rgb, (0, 0), 1.2)
    rgb = np.clip(rgb + 0.35 * (rgb - blur), 0, 255)
    out = np.dstack([rgb, up[..., 3]]).astype(np.uint8)
    Image.fromarray(out, "RGBA").save(f"{OUT}/{name}.png", optimize=True)
    conv = {}
    for k, v in anchors.items():
        if len(v) == 3:
            conv[k] = [round((v[0] - x0) * UP, 1), round((v[1] - y0) * UP, 1), round(v[2] * UP, 1)]
        else:
            conv[k] = [round((v[0] - x0) * UP, 1), round((v[1] - y0) * UP, 1)]
    SPR[name] = {"w": W, "h": H, **conv}
    return out


def extreme(a, dx, dy):
    ys, xs = np.where(a[..., 3] > 128)
    i = np.argmax(xs * dx + ys * dy)
    return float(xs[i]), float(ys[i])


def centroid(mask):
    ys, xs = np.where(mask)
    return float(xs.mean()), float(ys.mean())


# guy: hand out (face erased, faces drawn in code)
g = load("02_guy_hand_out")
hx, hy, hr = head_disc(g)
g2 = fix_face_erase(g)
tip = extreme(g2, -1, 0)
col = int(tip[0] + 70)
ys = np.where(g2[:, col, 3] > 128)[0]
save("guy_hand", g2, {"feet": feet(g2), "head": (hx, hy, hr), "handTip": tip, "handTop": (float(col), float(ys.min()))})

g = fix_jeans(load("05_guy_scared"))
save("guy_scared", g, {"feet": feet(g), "head": head_disc(g)})

g = load("06_guy_run")
save("guy_run", g, {"feet": extreme(g, 0, 1), "head": head_disc(g)})

# bees
b = fix_bee_palette(load("07_bee_hero"))
save("bee_hero", b, {"c": centroid(b[..., 3] > 128), "tip": extreme(b, -1, 0)})
b = load("08_bee_sting")
save("bee_sting", b, {"c": centroid(b[..., 3] > 128), "tip": (543.0, 900.0)})
b = load("09_bee_uhoh")
save("bee_uhoh", b, {"c": centroid(b[..., 3] > 128), "tip": extreme(b, -1, 0)})
b = load("10_bee_torn_pull")
ys, xs = np.where(b[..., 3] > 128)
yb = ys.max()
save("bee_torn", b, {"c": centroid(b[..., 3] > 128), "end": (float(xs[ys > yb - 40].mean()), float(yb - 18))})
b = load("12_bee_angry")
save("bee_angry", b, {"c": centroid(b[..., 3] > 128)})
b = load("13_bee_smug")
save("bee_smug", b, {"c": centroid(b[..., 3] > 128)})

# wasp
wsp = load("14_wasp_hero")
save("wasp", wsp, {"c": centroid(wsp[..., 3] > 128), "tip": extreme(wsp, 0, 1), "head": extreme(wsp, -1, 0)})

# set + props
hv = load("18_hive")
h_, s_, v_ = hsv(hv)
ent = (hv[..., 3] > 0) & (v_ < 0.3) & (s_ > 0.3)
yy, xx = np.mgrid[:hv.shape[0], :hv.shape[1]]
ent &= (yy > 700) & (yy < 840) & (xx > 250) & (xx < 380)
dome = (hv[..., 3] > 128) & (yy < 760)
save("hive", hv, {"entrance": centroid(ent), "dome": centroid(dome), "feet": feet(hv)})

fl = load("19_flower")
h_, s_, v_ = hsv(fl)
yel = (fl[..., 3] > 0) & (h_ > 40) & (h_ < 60) & (s_ > 0.5) & (v_ > 0.8)
cx, cy = centroid(yel)
save("flower", fl, {"head": (cx, cy, float(np.sqrt(yel.sum() / np.pi))), "feet": feet(fl)})

for i, p in enumerate(split_row(load("20_meadow_row"))):
    save(f"plant{i + 1}", p, {"feet": feet(p)})

sk = load("21_skin_section")
save("skin", sk, {"topFront": (78.0, 480.0), "topFrontR": (560.0, 480.0), "bottom": (318.0, 995.0)})

st = fix_stinger(load("22_stinger"))
body, sac = split_sac(st)
ys, xs = np.where(body[..., 3] > 128)
tipy = ys.max()
tipx = float(xs[ys > tipy - 6].mean())
# barbs (measured from the row profile of the shaft): tips of the backward hooks, left and right side
barb_pts = [(338.0, 545.0), (428.0, 665.0), (342.0, 685.0), (427.0, 775.0), (346.0, 802.0), (430.0, 1065.0)]
sacc = centroid(sac[..., 3] > 128)
anch = {"tip": (tipx, float(tipy)), "top": (360.0, 232.0), "sac": sacc, "sacAttach": (402.0, sacc[1])}
for i, p in enumerate(barb_pts[:6]):
    anch[f"barb{i}"] = p
# both halves share one canvas -> trim them with the same box so they stay aligned
both = st.copy()
box_al = both[..., 3] > 8
ys, xs = np.where(box_al)
X0, Y0 = xs.min() - PAD, ys.min() - PAD
BOX = (max(X0, 0), max(Y0, 0), min(xs.max() + PAD + 1, st.shape[1]), min(ys.max() + PAD + 1, st.shape[0]))
save("stinger", body, anch, BOX)
save("sac", sac, {"c": sacc, "attach": (402.0, sacc[1])}, BOX)

sw = load("23_stopwatch")
h_, s_, v_ = hsv(sw)
face = (sw[..., 3] > 0) & (s_ < 0.06) & (v_ > 0.95)
yy, xx = np.mgrid[:sw.shape[0], :sw.shape[1]]
face &= yy > 480
fc = centroid(face)
save("stopwatch", sw, {"face": (fc[0], fc[1], float(np.sqrt(face.sum() / np.pi)))})

bn = load("24_banana")
save("banana", bn, {"c": centroid(bn[..., 3] > 128)})

with open(TS, "w") as f:
    f.write("// generated by images/bees/prep.py - sizes and anchor points in sprite pixels\n")
    f.write("export const S = " + json.dumps(SPR, indent=1) + " as const;\n")
    f.write("export type SpriteName = keyof typeof S;\n")
print(json.dumps({k: {kk: vv for kk, vv in v.items()} for k, v in SPR.items()}, indent=0)[:4000])
