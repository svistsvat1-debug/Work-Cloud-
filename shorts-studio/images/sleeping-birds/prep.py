"""Prepare sprites for the sleeping-birds short.
- repaint each bird's twig into one canonical two-tone twig (so the code-drawn branch continues it seamlessly)
- key out the painted checkerboard + crisp x4 upscale (key_upscale.py)
- x-ray versions (robin: body only, legs/twig removed; starling: twig removed)
- split the leaves, copy props; write public/sleeping-birds/*.png and src/sleeping-birds/sprites.json
Run from images/sleeping-birds:  python3 -I prep.py
"""
import json, os, sys
import numpy as np, cv2
from scipy import ndimage as ndi
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from key_upscale import key_upscale

S = 4
PUB = '../../public/sleeping-birds'
OUT = {}
INK = (22, 20, 24)
TOP, BOT = (169, 124, 91), (138, 99, 73)

def hsvmasks(bgr):
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV).astype(int)
    return hsv[..., 0] * 2, hsv[..., 1], hsv[..., 2]

def twig_geom(c0, m, F, o):
    """centerline y = c0 + m x (pixel-index coords); F fill, o outline (perpendicular, raw px)"""
    th = np.arctan(m); n = np.array([-np.sin(th), np.cos(th)])   # unit normal pointing down
    return dict(c0=c0, m=m, theta=float(np.degrees(th)), F=F, o=o, T=F + 2 * o, n=n)

def signed_d(shape, g):
    h, w = shape
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    # perpendicular signed distance from the centerline (positive = below)
    return (yy - (g['c0'] + g['m'] * xx)) * np.cos(np.radians(g['theta']))

def classify(bgr, g, ylo):
    """inside the twig band: what is twig (brown fill, outline, grain) and what is toe (protected)"""
    H, Sa, V = hsvmasks(bgr)
    d = signed_d(bgr.shape[:2], g)
    band = np.abs(d) <= g['T'] / 2 + 6
    pink = (V > 80) & (Sa > 15) & ((H < 17) | (H > 330)) & ~((H >= 17) & (H <= 36) & (Sa > 90))
    pink[:ylo] = False
    lab, n = ndi.label(pink); sz = ndi.sum(pink, lab, range(1, n + 1))
    keep = np.zeros(n + 1, bool); keep[1:] = sz > 40; pink = keep[lab]
    brown = (H >= 15) & (H <= 38) & (Sa > 75) & (V > 70)
    dark = V < 110
    near = ndi.distance_transform_edt(~pink) <= 9
    twigpx = band & (brown | (dark & ~near))
    protect = band & ~twigpx
    # drop specks: protected bits not connected to toes
    lab, n = ndi.label(protect)
    ok = np.zeros(n + 1, bool)
    hit = np.unique(lab[ndi.binary_dilation(pink, iterations=2) & protect]); ok[hit[hit > 0]] = True
    protect = ok[lab]
    return pink, protect, d

def repaint_hi(rgba, g, protect_lo, bg_lo, d_lo):
    """paint the canonical twig at x4 with analytic anti-aliasing; toes (protect) stay on top"""
    h, w = rgba.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    u = (xx + 0.5) / S; v = (yy + 0.5) / S                   # continuous raw coords
    c0 = g['c0'] + 0.5 - 0.5 * g['m']
    d = (v - (c0 + g['m'] * u)) * np.cos(np.radians(g['theta']))
    px = 1.0 / S
    def cov(edge, x):                                       # 1 inside (x < edge), AA over one hi-res px
        return np.clip((edge - x) / px + 0.5, 0, 1)
    ad = np.abs(d)
    tw = cov(g['T'] / 2, ad)                                 # whole twig incl. outline
    fill = cov(g['F'] / 2, ad)
    split = -g['F'] / 2 + 0.58 * g['F']
    top = cov(split, d)
    col = (np.array(TOP[::-1], np.float32) * top[..., None] + np.array(BOT[::-1], np.float32) * (1 - top[..., None]))
    col = col * fill[..., None] + np.array(INK[::-1], np.float32) * (1 - fill[..., None])
    prot = cv2.resize(cv2.GaussianBlur(protect_lo.astype(np.float32), (0, 0), 0.7), (w, h), interpolation=cv2.INTER_LINEAR)
    prot = np.clip((prot - 0.35) / 0.3, 0, 1)
    # old outline leftovers just outside the canonical twig, where beyond is background -> remove
    hh, ww = bg_lo.shape
    n = g['n']
    ys, xs = np.mgrid[0:hh, 0:ww]
    sgn = np.sign(d_lo); k = (g['T'] / 2 + 7) * sgn - d_lo
    bx = np.clip(np.round(xs + k * n[0]).astype(int), 0, ww - 1); by = np.clip(np.round(ys + k * n[1]).astype(int), 0, hh - 1)
    outer = (np.abs(d_lo) > g['T'] / 2 - 1) & (np.abs(d_lo) < g['T'] / 2 + 6) & bg_lo[by, bx] & ~protect_lo
    outer_hi = cv2.resize(outer.astype(np.uint8), (w, h), interpolation=cv2.INTER_NEAREST).astype(bool) & (tw < 1)
    out = rgba.astype(np.float32)
    a = out[..., 3] / 255
    a[outer_hi] = 0
    # composite: painted twig over existing, then the protected toes over that
    pa = tw * (1 - prot)
    rgb = out[..., :3] * (1 - pa[..., None]) + col * pa[..., None]
    a2 = pa + a * (1 - pa)
    out[..., :3] = np.where(a2[..., None] > 0, (rgb * 1.0), 0)
    out[..., 3] = a2 * 255
    return np.clip(out, 0, 255).astype(np.uint8), pa

def trim_rows(alpha, margin=48):
    ys = np.where(alpha.max(1) > 8)[0]
    return max(0, ys.min() - margin), min(alpha.shape[0], ys.max() + margin + 1)

def xray_style(rgba):
    a = rgba[..., 3].astype(np.float32) / 255
    rgb = rgba[..., :3][..., ::-1].astype(np.float32)          # BGR -> RGB
    dist = np.sqrt(((rgb - np.array(INK, np.float32)) ** 2).sum(2))
    m = np.clip(1 - dist / 70, 0, 1) * a
    L = rgb.mean(2) / 255
    fa = a * (0.07 + 0.11 * L)
    glow = cv2.GaussianBlur(m, (0, 0), 10) * 0.5
    layers = [((100, 170, 230), fa), ((120, 210, 255), glow), ((205, 242, 255), m * 0.95)]
    acc_c = np.zeros(rgb.shape, np.float32); acc_a = np.zeros(a.shape, np.float32)
    for c, al in layers:                     # premultiplied "over"
        acc_c = np.array(c, np.float32) * al[..., None] + acc_c * (1 - al[..., None])
        acc_a = al + acc_a * (1 - al)
    col = acc_c / np.maximum(acc_a[..., None], 1e-4)
    return np.dstack([np.clip(col[..., ::-1], 0, 255).astype(np.uint8), (np.clip(acc_a, 0, 1) * 255).astype(np.uint8)])

def fill_through(mask_body, band, d, g, extra=5):
    """band pixels whose normal neighbours above and below the twig are body -> body (tail behind twig)"""
    h, w = mask_body.shape
    yy, xx = np.mgrid[0:h, 0:w]
    n = g['n']; off = g['T'] / 2 + extra
    res = np.zeros_like(mask_body)
    ys, xs = np.where(band)
    dd = d[ys, xs]
    def samp(sign):
        k = (sign * off - dd)
        px = np.clip(np.round(xs + k * n[0]).astype(int), 0, w - 1)
        py = np.clip(np.round(ys + k * n[1]).astype(int), 0, h - 1)
        return mask_body[py, px]
    ok = samp(-1) & samp(1)
    res[ys[ok], xs[ok]] = True
    return res

def tail_bridge(body, band, d, g, protect=None):
    """bridge the tail across the removed twig band with straight edges (convex hull of the nearby tail pieces)"""
    thr = fill_through(body, band, d, g)
    if not thr.any(): return thr
    xs = np.where(thr.any(0))[0]
    x0, x1 = xs.min() - 40, xs.max() + 40
    win = (np.abs(d) > g['T'] / 2 + 2) & (np.abs(d) < g['T'] / 2 + 30) & body
    win[:, :max(0, x0)] = False; win[:, x1:] = False
    if protect is not None: win &= ~ndi.binary_dilation(protect, iterations=3)
    res = np.zeros_like(body)
    lab, n = ndi.label(ndi.binary_dilation(thr, iterations=40) & band)
    for i in range(1, n + 1):
        reg = lab == i
        cols = np.where(reg.any(0))[0]
        pts = np.column_stack(np.where(win & (np.isin(np.arange(win.shape[1]), cols)[None, :]))[::-1]).astype(np.int32)
        if len(pts) < 10: continue
        hull = cv2.convexHull(pts)
        m = np.zeros(body.shape, np.uint8); cv2.fillPoly(m, [hull], 1)
        res |= m.astype(bool) & band
    return res | thr

def bird(name, rawfile, g, ylo, xray_keep_legs):
    bgr = cv2.imread(rawfile)
    pink, protect, d = classify(bgr, g, ylo)
    rgba, obj = key_upscale(bgr, S)
    rgba, twig_cov = repaint_hi(rgba, g, protect, ~obj, d)
    y0, y1 = trim_rows(rgba[..., 3])
    cv2.imwrite(f'{PUB}/{name}.png', rgba[y0:y1])
    # x-ray source: remove twig (and legs for the robin), bridge the tail across the twig
    bandx = np.abs(d) <= g['T'] / 2 + 2.5
    if xray_keep_legs:
        # x-ray straight from the clean sprite: drop the painted twig, bridge the tail with flat body colour + outline
        cut = bandx & ~protect
        body = obj & ~cut
        thr = tail_bridge(body, cut, d, g, protect)
        hh, ww = rgba.shape[:2]
        thr_hi = cv2.resize(cv2.GaussianBlur(thr.astype(np.float32), (0, 0), 0.8), (ww, hh), interpolation=cv2.INTER_LINEAR) > 0.5
        x = rgba.astype(np.float32)
        a = x[..., 3] / 255 * (1 - twig_cov)
        ring = ndi.binary_dilation(thr_hi, iterations=40) & ~thr_hi & (x[..., 3] > 240)
        ring &= np.sqrt(((x[..., :3] - np.array(INK[::-1], np.float32)) ** 2).sum(2)) > 90
        x[thr_hi, :3] = np.median(x[ring, :3], 0)
        # kill twig-edge leftovers (outside the toes)
        yy, xx = np.mgrid[0:hh, 0:ww].astype(np.float32)
        dd = ((yy + 0.5) / S - (g['c0'] + 0.5 - 0.5 * g['m'] + g['m'] * (xx + 0.5) / S)) * np.cos(np.radians(g['theta']))
        prot_hi = cv2.resize(protect.astype(np.uint8), (ww, hh), interpolation=cv2.INTER_NEAREST).astype(bool)
        a[(np.abs(dd) < g['T'] / 2 + 1.5) & ~prot_hi & ~thr_hi] = 0
        a = np.maximum(a, thr_hi.astype(np.float32))
        mask = a > 0.5
        edge = mask & ~ndi.binary_erosion(mask, iterations=24) & ndi.binary_dilation(thr_hi, iterations=30)
        x[edge, :3] = np.array(INK[::-1], np.float32)
        x[..., 3] = a * 255
        xr = xray_style(np.clip(x, 0, 255).astype(np.uint8)[y0:y1])
        cv2.imwrite(f'{PUB}/{name}_xray.png', xr)
        # toes only (drawn above the x-ray branch)
        tm = cv2.dilate(prot_hi.astype(np.uint8), np.ones((9, 9), np.uint8)).astype(np.float32)
        tm = cv2.GaussianBlur(tm, (0, 0), 2)[y0:y1]
        xt = xr.copy(); xt[..., 3] = (xt[..., 3] * tm).astype(np.uint8)
        cv2.imwrite(f'{PUB}/{name}_xray_toes.png', xt)
        OUT[name] = dict(w=int(rgba.shape[1]), h=int(y1 - y0), y0=int(y0), S=S,
                         twig=dict(c0=g['c0'] + 0.5 - 0.5 * g['m'], m=g['m'], theta=g['theta'], F=g['F'], o=g['o'], T=g['T']))
        print(name, rgba.shape, 'y0', y0)
        return
    else:
        legs = ndi.distance_transform_edt(~pink) <= 6
        legs[:ylo] = False
        cut = bandx | legs
        body = obj & ~cut
        thr = tail_bridge(body, bandx & ~legs, d, g)
    body2 = body | thr
    base = bgr.copy()
    base[~obj] = np.median(bgr[body & (signed_d(bgr.shape[:2], g) < -g['T'])], 0).astype(np.uint8)   # no light checker in the fill
    src = cv2.inpaint(base, (thr | (cut & ~body2)).astype(np.uint8) * 255, 5, cv2.INPAINT_TELEA)
    xr, _ = key_upscale(src, S, keep_mask=body2, drop_mask=~body2)
    xr = xray_style(xr[y0:y1])
    cv2.imwrite(f'{PUB}/{name}_xray.png', xr)
    OUT[name] = dict(w=int(rgba.shape[1]), h=int(y1 - y0), y0=int(y0), S=S,
                     twig=dict(c0=g['c0'] + 0.5 - 0.5 * g['m'], m=g['m'], theta=g['theta'], F=g['F'], o=g['o'], T=g['T']))
    print(name, rgba.shape, 'y0', y0)

os.makedirs(PUB, exist_ok=True)
# robin: centre line from the fitted fill edges (pixel-index coords); canonical twig F=33, o=7 (robin raw px)
bird('robin', 'raw/bird_sleep.jpg', twig_geom(992.364, -0.1239, 33.0, 7.0), 820, xray_keep_legs=False)
# starling is drawn 1.05x the robin's raw scale -> same world thickness: F=33/1.05, o=7/1.05
bird('starling', 'raw/starling_sleep.jpg', twig_geom(906.604, -0.0151, 33.0 / 1.05, 7.0 / 1.05), 800, xray_keep_legs=True)

# props
for n in ['scissors', 'zip_tie']:
    rgba, _ = key_upscale(cv2.imread(f'raw/{n}.jpg'), S)
    ys, xs = np.where(rgba[..., 3] > 8)
    x0, x1, y0, y1 = max(0, xs.min() - 24), xs.max() + 25, max(0, ys.min() - 24), ys.max() + 25
    crop = cv2.resize(rgba[y0:y1, x0:x1], None, fx=0.5, fy=0.5, interpolation=cv2.INTER_AREA)   # props are shown small
    cv2.imwrite(f'{PUB}/{n}.png', crop)
    OUT[n] = dict(w=int(crop.shape[1]), h=int(crop.shape[0]), x0=int(x0) / 2, y0=int(y0) / 2, S=S / 2)
rgba, _ = key_upscale(cv2.imread('raw/leaves.jpg'), S)
lab, n = ndi.label(rgba[..., 3] > 20)
comps = sorted([np.where(lab == i) for i in range(1, n + 1) if (lab == i).sum() > 20000], key=lambda c: c[1].mean())
leaves = []
for i, (ys, xs) in enumerate(comps):
    x0, x1, y0, y1 = xs.min() - 16, xs.max() + 17, ys.min() - 16, ys.max() + 17
    crop = rgba[y0:y1, x0:x1].copy()
    m = ndi.binary_dilation(lab[y0:y1, x0:x1] == lab[ys[0], xs[0]], iterations=10)
    crop[..., 3] = (crop[..., 3] * m).astype(np.uint8)
    cv2.imwrite(f'{PUB}/leaf_{i}.png', crop)
    leaves.append(dict(w=int(x1 - x0), h=int(y1 - y0), stem=[float(np.median(xs[ys > ys.max() - 30]) - x0), float(ys.max() - y0)]))
OUT['leaves'] = leaves
json.dump(OUT, open('../../src/sleeping-birds/sprites.json', 'w'), indent=1)
print(json.dumps(OUT)[:600])
