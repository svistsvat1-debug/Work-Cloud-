# Paper-style mystery test: Mary Celeste (frames -> ffmpeg). Usage: python3 render.py <S> [preview]
import sys, math, subprocess, numpy as np, cv2
from PIL import Image

S = sys.argv[1]
PREVIEW = len(sys.argv) > 2
W, H, FPS = 1080, 1920, 24
DUR = 12.8
NF = int(round(DUR * FPS))
STEP = 1 / 12  # paper stop-motion: objects move on twos

def load(p):
    return np.asarray(Image.open(p).convert('RGBA')).astype(np.float32) / 255

bg_ocean = load(f'{S}/src/42b2dc4f-image.jpg')
bg_cabin = load(f'{S}/src/2067a828-image.jpg')
ship = load(f'{S}/sprites/ship.png')
waves = load(f'{S}/sprites/waves.png')
sa = load(f'{S}/sprites/sailor_a.png')[:, ::-1].copy()   # mirror: face left, toward the table
sb = load(f'{S}/sprites/sailor_b.png')[:, ::-1].copy()
IW, IH = 768, 1376

# ---------- helpers ----------
def ease(u):  # easeInOutCubic
    u = min(max(u, 0), 1)
    return 4 * u ** 3 if u < .5 else 1 - (-2 * u + 2) ** 3 / 2

def seg(t, keys):
    """keys: [(t, value), ...] eased piecewise; value can be tuple."""
    if t <= keys[0][0]: return keys[0][1]
    for (t0, v0), (t1, v1) in zip(keys, keys[1:]):
        if t <= t1:
            u = ease((t - t0) / (t1 - t0))
            if isinstance(v0, tuple): return tuple(a + (b - a) * u for a, b in zip(v0, v1))
            return v0 + (v1 - v0) * u
    return keys[-1][1]

def stepped(t): return math.floor(t / STEP) * STEP

def affine(scale, rot_deg, pivot_img, pos_scene, flipx=False):
    """image -> scene: pivot_img lands on pos_scene."""
    a = math.radians(rot_deg); c, s = math.cos(a) * scale, math.sin(a) * scale
    M = np.array([[c, -s, 0], [s, c, 0], [0, 0, 1.]])
    px, py = pivot_img
    T0 = np.array([[1, 0, -px], [0, 1, -py], [0, 0, 1.]])
    T1 = np.array([[1, 0, pos_scene[0]], [0, 1, pos_scene[1]], [0, 0, 1.]])
    return T1 @ M @ T0

def cam_mat(Z, F, k=1.0, shake=(0, 0)):
    """scene -> screen with parallax factor k."""
    Zk = Z ** k
    Fx = 540 + (F[0] - 540) * k; Fy = 960 + (F[1] - 960) * k
    return np.array([[Zk, 0, 540 - Fx * Zk + shake[0] * k], [0, Zk, 960 - Fy * Zk + shake[1] * k], [0, 0, 1.]])

def warp(img, M):
    return cv2.warpAffine(img, M[:2], (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))

def over(dst, src, shadow=0.0, sh_off=(10, 14), sh_blur=15):
    a = src[..., 3:4]
    if shadow > 0:
        sa_ = cv2.GaussianBlur(src[..., 3], (0, 0), sh_blur)
        sa_ = np.roll(np.roll(sa_, sh_off[1], 0), sh_off[0], 1)[..., None]
        dst[..., :3] *= 1 - shadow * sa_
    dst[..., :3] = dst[..., :3] * (1 - a) + src[..., :3] * a

def pt(M, p):
    v = M @ np.array([p[0], p[1], 1.]); return v[0], v[1]

YY, XX = np.mgrid[0:H, 0:W].astype(np.float32)
def glow(dst, center, radius, color, strength):
    if strength <= 0: return
    d2 = ((XX - center[0]) ** 2 + (YY - center[1]) ** 2) / (radius ** 2)
    g = np.exp(-d2 * 2.2)[..., None] * strength
    dst[..., :3] = 1 - (1 - dst[..., :3]) * (1 - g * np.array(color))   # screen blend

vign = np.clip(1 - 0.42 * (((XX - 540) / 760) ** 2 + ((YY - 960) / 1250) ** 2), 0, 1)[..., None]
rng = np.random.default_rng(7)
grain = [cv2.GaussianBlur(rng.standard_normal((H, W)).astype(np.float32), (0, 0), 1.2)[..., None] for _ in range(2)]
def noise1(t, seed):  # smooth-ish deterministic noise in [0,1]
    return 0.5 + 0.25 * math.sin(t * 7.3 + seed) + 0.15 * math.sin(t * 13.1 + seed * 2) + 0.1 * math.sin(t * 23.7 + seed * 3)

rain = rng.random((80, 3))  # x, phase, speed

# ---------- scene A: ocean + ship ----------
SC_BG = 1080 / IW * 1.04
def scene_A(t, Z, F, dark=0.0):
    f = np.zeros((H, W, 4), np.float32); f[..., 3] = 1
    ts = stepped(t)
    over(f, warp(bg_ocean, cam_mat(Z, F, 0.85) @ affine(SC_BG, 0, (IW / 2, IH / 2), (540, 960))))
    # moon glow
    Mbg = cam_mat(Z, F, 0.85) @ affine(SC_BG, 0, (IW / 2, IH / 2), (540, 960))
    glow(f, pt(Mbg, (557, 236)), 260 * Z, (0.95, 0.9, 0.75), 0.18 + 0.03 * math.sin(t * 2))
    # ship: bob on twos
    rot = 2.6 * math.sin(ts * 2 * math.pi / 2.8)
    dy = 10 * math.sin(ts * 2 * math.pi / 2.8 + 1.1)
    Ms = cam_mat(Z, F, 1.0) @ affine(0.9, rot, (376, 1092), (560, 1300 + dy))
    over(f, warp(ship, Ms), shadow=0.28)
    glow(f, pt(Ms, (668, 938)), 70 * Z, (1.0, 0.8, 0.35), 0.55 + 0.15 * noise1(ts, 1))
    # front waves
    wx = 22 * math.sin(ts * 2 * math.pi / 3.4); wy = 9 * math.sin(ts * 2 * math.pi / 2.2)
    Mw = cam_mat(Z, F, 1.25) @ affine(1.72, 0, (384, 499), (540 + wx, 1318 + wy))
    over(f, warp(waves, Mw), shadow=0.35, sh_off=(0, -10))
    # rain (paper strips), stepped
    for x, ph, sp in rain:
        y = ((ph + ts * (0.9 + sp * 0.5)) % 1) * 2100 - 100
        xx = x * 1300 - 100 + y * 0.27
        cv2.line(f, (int(xx), int(y)), (int(xx + 9), int(y + 34)), (0.91, 0.87, 0.79, 1), 2, cv2.LINE_AA)
    if dark: f[..., :3] *= 1 - dark
    return f

# ---------- scene B: cabin + sailor ----------
LAMP = (290, 500)
def sailor_pose(t):
    """returns sprite, scale, pivot(feet), pos, rot, scaleX extra"""
    ts = stepped(t)
    if t < 11.68:
        x = seg(ts, [(3.55, 1450.0), (4.75, 800.0)])
        moving = 3.55 <= ts < 4.75
        bob = -abs(math.sin(ts * math.pi * 2.4)) * 22 if moving else 3 * math.sin(ts * 2 * math.pi * 0.55)
        rot = 3 * math.sin(ts * math.pi * 2.4) if moving else 0
        sx = 1.0
        if 11.56 <= t < 11.68: sx = 0.84  # squash before swap
        return sa, 0.80, (768 - 386, 1274), (x, 1890 + bob), rot, sx
    u = t - 11.68
    sx = 1 + 0.06 * math.exp(-u * 9) * math.cos(u * 30)
    trem = 2.5 * math.sin(t * 61) + 1.5 * math.sin(t * 37)
    return sb, 0.80, (768 - 375, 1321), (800 + trem, 1890), -1.5, sx

def scene_B(t, Z, F, shake, light, lamp_amt):
    f = np.zeros((H, W, 4), np.float32); f[..., 3] = 1
    Mbg = cam_mat(Z, F, 1.0, shake) @ affine(SC_BG, 0, (IW / 2, IH / 2), (540, 960))
    over(f, warp(bg_cabin, Mbg))
    lamp_pt = pt(Mbg, LAMP)
    glow(f, lamp_pt, 380 * Z, (1.0, 0.78, 0.32), lamp_amt)
    # dust motes in the lamp light
    ts = stepped(t)
    for i in range(36):
        r0 = rng_d[i]
        x = lamp_pt[0] + (r0[0] - 0.5) * 700 + 30 * math.sin(ts * 0.7 + i)
        y = lamp_pt[1] + (r0[1] - 0.3) * 700 - ((ts * 18 * (0.5 + r0[2])) % 400)
        cv2.circle(f, (int(x), int(y)), 2 + int(r0[2] * 2), (0.95, 0.88, 0.7, 1), -1, cv2.LINE_AA)
    spr, sc, piv, pos, rot, sx = sailor_pose(t)
    Ms = cam_mat(Z, F, 1.12, shake) @ affine(sc, rot, piv, pos) @ np.array([[sx, 0, piv[0] * (1 - sx)], [0, 1, 0], [0, 0, 1.]])
    over(f, warp(spr, Ms), shadow=0.32, sh_off=(-14, 10))
    lp = (768 - 588, 650) if spr is sa else (768 - 590, 842)
    glow(f, pt(Ms, lp), 150 * Z, (1.0, 0.8, 0.35), lamp_amt * 0.9)
    f[..., :3] *= light
    return f
rng_d = np.random.default_rng(3).random((36, 3))

def frame(i):
    t = i / FPS
    if t < 3.42:
        Z = seg(t, [(0, 1.0), (3.0, 1.08), (3.42, 3.4)])
        F = seg(t, [(0, (540.0, 1060.0)), (3.0, (560.0, 1100.0)), (3.42, (870.0, 1240.0))])
        f = scene_A(t, Z, F)
        if t > 3.2: glow(f, (540, 960), 900, (1, 0.8, 0.35), (t - 3.2) / 0.22 * 0.8)
    elif t < 12.25:
        Z = seg(t, [(3.42, 1.0), (5.2, 1.03), (6.4, 1.22), (7.0, 1.22), (8.4, 1.1), (9.2, 1.1), (11.5, 1.24), (11.75, 1.3)])
        F = seg(t, [(3.42, (540.0, 960.0)), (5.2, (520.0, 980.0)), (6.4, (330.0, 1150.0)), (7.0, (330.0, 1150.0)), (8.4, (640.0, 1020.0)), (9.2, (640.0, 1020.0)), (11.5, (720.0, 1050.0))])
        hw, hh = 540 / Z, 960 / Z
        F = (min(max(F[0], -21 + hw), 1101 - hw), min(max(F[1], -46 + hh), 1966 - hh))
        amp = 26 * math.exp(-(t - 11.68) * 5) if t >= 11.68 else 0
        shake = (amp * (math.sin(t * 83.6) + 0.5 * math.sin(t * 44.6)), amp * (math.cos(t * 71.3) + 0.5 * math.sin(t * 39.0)))
        light = seg(t, [(9.2, 1.0), (11.5, 0.84)]) if t < 11.68 else (0.5 if not (11.86 <= t < 11.96) else 0.72)
        base = 0.42 + 0.08 * noise1(stepped(t), 2)
        if 9.3 <= t < 11.68: base *= 0.75 + 0.25 * (noise1(stepped(t) * 3, 5) > 0.42)
        lamp = base if t < 11.68 else (0.3 if 11.86 <= t < 11.96 else 0.0)
        if t < 3.6: lamp += (3.6 - t) / 0.18 * 0.5   # match-cut from the window glow
        f = scene_B(t, Z, F, shake, light, lamp)
    else:
        f = scene_A(0, 1.0, (540.0, 1060.0), dark=seg(t, [(12.25, 0.55), (12.8, 0.0)]))
    f[..., :3] *= vign
    f[..., :3] *= 1 + grain[int(t * 12) % 2] * 0.035
    return (np.clip(f[..., :3], 0, 1) * 255).astype(np.uint8)

if PREVIEW:
    for tt in [0.5, 2.5, 3.3, 3.7, 4.3, 6.2, 8.0, 10.5, 11.6, 11.8, 12.1, 12.5]:
        Image.fromarray(frame(int(tt * FPS))).resize((360, 640)).save(f'{S}/pv_{tt:05.2f}.png')
    sys.exit()

p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                      '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-pix_fmt', 'yuv420p', f'{S}/video_noaudio.mp4'], stdin=subprocess.PIPE)
for i in range(NF):
    p.stdin.write(frame(i).tobytes())
    if i % 48 == 0: print('frame', i, '/', NF, flush=True)
p.stdin.close(); p.wait()
