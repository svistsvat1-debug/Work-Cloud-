# Shared helpers for mystery-shorts (paper cut-out style). Built from the approved Mary Celeste test.
import math, numpy as np, cv2
from PIL import Image

def key_green(src_path, out_path, lo=0.18, hi=0.32, min_area=200):
    """Green-screen key: greenness = G - max(R,B); alpha 1 below lo, 0 above hi; despill; drop specks."""
    im = np.asarray(Image.open(src_path).convert('RGB')).astype(np.float32) / 255
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    gr = g - np.maximum(r, b)
    a = np.clip(1 - (gr - lo) / (hi - lo), 0, 1)
    a = cv2.GaussianBlur(a, (3, 3), 0)
    hard = (a > 0.5).astype(np.uint8)
    n_, lab, st, _ = cv2.connectedComponentsWithStats(hard, connectivity=8)
    keep = np.zeros_like(hard)
    for i in range(1, n_):
        if st[i, 4] > min_area: keep[lab == i] = 1
    keep = cv2.dilate(keep, np.ones((5, 5), np.uint8))
    a = a * keep
    edge = cv2.dilate((a < 0.98).astype(np.uint8), np.ones((7, 7), np.uint8)).astype(bool)
    mx = np.maximum(r, b)
    g2 = np.where(edge & (g > mx), mx + (g - mx) * 0.15, g)
    g2 = np.where((~edge) & (gr > 0.10), mx + 0.10, g2)
    out = np.dstack([r, g2, b, a])
    Image.fromarray((out * 255).astype(np.uint8), 'RGBA').save(out_path)
    ys, xs = np.where(a > 0.5)
    return (int(xs.min()), int(xs.max()), int(ys.min()), int(ys.max()))

def qa_sheet(paths, out):
    tiles = []
    for p in paths:
        sp = Image.open(p)
        for col in [(255, 0, 255), (20, 30, 60)]:
            bg = Image.new('RGBA', sp.size, col + (255,)); bg.alpha_composite(sp)
            tiles.append(bg.convert('RGB').resize((192, 344)))
    sheet = Image.new('RGB', (192 * len(tiles), 344)); [sheet.paste(t, (i * 192, 0)) for i, t in enumerate(tiles)]
    sheet.save(out)

W, H, FPS = 1080, 1920, 24
STEP = 1 / 12

def load(p): return np.asarray(Image.open(p).convert('RGBA')).astype(np.float32) / 255

def ease(u):
    u = min(max(u, 0), 1)
    return 4 * u ** 3 if u < .5 else 1 - (-2 * u + 2) ** 3 / 2

def seg(t, keys):
    if t <= keys[0][0]: return keys[0][1]
    for (t0, v0), (t1, v1) in zip(keys, keys[1:]):
        if t <= t1:
            u = ease((t - t0) / (t1 - t0)) if t1 > t0 else 1
            if isinstance(v0, tuple): return tuple(a + (b - a) * u for a, b in zip(v0, v1))
            return v0 + (v1 - v0) * u
    return keys[-1][1]

def stepped(t): return math.floor(t / STEP) * STEP

def affine(scale, rot_deg, pivot_img, pos_scene, sx=1.0, sy=1.0):
    a = math.radians(rot_deg); c, s = math.cos(a), math.sin(a)
    M = np.array([[c * scale * sx, -s * scale * sy, 0], [s * scale * sx, c * scale * sy, 0], [0, 0, 1.]])
    px, py = pivot_img
    return np.array([[1, 0, pos_scene[0]], [0, 1, pos_scene[1]], [0, 0, 1.]]) @ M @ np.array([[1, 0, -px], [0, 1, -py], [0, 0, 1.]])

def cam_mat(Z, F, k=1.0, shake=(0, 0)):
    Zk = Z ** k
    Fx = 540 + (F[0] - 540) * k; Fy = 960 + (F[1] - 960) * k
    return np.array([[Zk, 0, 540 - Fx * Zk + shake[0] * k], [0, Zk, 960 - Fy * Zk + shake[1] * k], [0, 0, 1.]])

def clamp_focus(Z, F, sw=1080, sh=1935):
    hw, hh = 540 / Z, 960 / Z
    return (min(max(F[0], hw), sw - hw), min(max(F[1], hh), sh - hh))

def warp(img, M):
    return cv2.warpAffine(img, M[:2], (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))

def over(dst, src, shadow=0.0, sh_off=(10, 14), sh_blur=15, opacity=1.0):
    a = src[..., 3:4] * opacity
    if shadow > 0:
        s_ = cv2.GaussianBlur(src[..., 3], (0, 0), sh_blur) * opacity
        s_ = np.roll(np.roll(s_, sh_off[1], 0), sh_off[0], 1)[..., None]
        dst[..., :3] *= 1 - shadow * s_
    dst[..., :3] = dst[..., :3] * (1 - a) + src[..., :3] * a

def pt(M, p):
    v = M @ np.array([p[0], p[1], 1.]); return v[0], v[1]

YY, XX = np.mgrid[0:H, 0:W].astype(np.float32)
def glow(dst, center, radius, color, strength):
    if strength <= 0: return
    d2 = ((XX - center[0]) ** 2 + (YY - center[1]) ** 2) / (radius ** 2)
    g = np.exp(-d2 * 2.2)[..., None] * strength
    dst[..., :3] = 1 - (1 - dst[..., :3]) * (1 - g * np.array(color))

VIGN = np.clip(1 - 0.42 * (((XX - 540) / 760) ** 2 + ((YY - 960) / 1250) ** 2), 0, 1)[..., None]
_rng = np.random.default_rng(7)
GRAIN = [cv2.GaussianBlur(_rng.standard_normal((H, W)).astype(np.float32), (0, 0), 1.2)[..., None] for _ in range(2)]

def finish(f, t):
    f[..., :3] *= VIGN
    f[..., :3] *= 1 + GRAIN[int(t * 12) % 2] * 0.035
    return (np.clip(f[..., :3], 0, 1) * 255).astype(np.uint8)

def noise1(t, seed):
    return 0.5 + 0.25 * math.sin(t * 7.3 + seed) + 0.15 * math.sin(t * 13.1 + seed * 2) + 0.1 * math.sin(t * 23.7 + seed * 3)

def paper_strip(text, font_path, size=54, pad=(34, 18), seed=1):
    """Torn cream paper strip with dark ink text, RGBA float image."""
    from PIL import ImageDraw, ImageFont, ImageFilter
    fnt = ImageFont.truetype(font_path, size)
    tw, th = fnt.getbbox(text)[2:]
    w, h = tw + pad[0] * 2, th + pad[1] * 2 + 8
    rng = np.random.default_rng(seed)
    im = Image.new('RGBA', (w + 20, h + 20), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    top = [(10 + x, 10 + rng.integers(0, 6)) for x in range(0, w + 1, 8)]
    bot = [(10 + x, 10 + h - rng.integers(0, 6)) for x in range(w, -1, -8)]
    d.polygon(top + bot, fill=(233, 223, 201, 255))
    im = im.filter(ImageFilter.GaussianBlur(0.6)); d = ImageDraw.Draw(im)
    d.text((10 + pad[0], 10 + pad[1]), text, font=fnt, fill=(23, 42, 58, 255))
    return np.asarray(im).astype(np.float32) / 255
