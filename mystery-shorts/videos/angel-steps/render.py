# angel-steps: paper cut-out Short. Usage: python3 render.py <work dir> [preview | "frames t1,t2"]
import sys, os, math, subprocess, numpy as np, cv2
from PIL import Image
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../engine'))
from lib import *

S = sys.argv[1]
MODE = sys.argv[2] if len(sys.argv) > 2 else 'render'
DUR = 21.6
NF = int(round(DUR * FPS))
IW, IH = 768, 1376
SB = 1080 / IW
FONT = '/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf'

bg_angel = load(f'{S}/src/01_bg_angel_night.jpg')
bg_cut = load(f'{S}/src/02_bg_ground_cutaway.jpg')
bg_space = load(f'{S}/src/03_bg_earth_space.jpg')
wk_lay = load(f'{S}/sprites/04_char_worker_lay.png')
wk_up = load(f'{S}/sprites/05_char_worker_lookup.png')
step = load(f'{S}/sprites/06_prop_stone_step.png')
STEP_DARK = step.copy(); STEP_DARK[..., :3] *= 0.86
sat = load(f'{S}/sprites/07_prop_satellite.png')
strips = {k: paper_strip(v, FONT, 50, seed=i) for i, (k, v) in enumerate(
    {'place': 'MEXICO CITY', 'count': '14 NEW STEPS', 'rate': 'HALF AN INCH A MONTH'}.items())}

def strip(f, key, t, t0, t1, pos):
    if not (t0 <= t < t1): return
    ts = stepped(t); u = min(1, (ts - t0) / 0.17); v = max(0, (ts - (t1 - 0.17)) / 0.17)
    s = strips[key]; h, w = s.shape[:2]
    M = affine(1.15 - 0.15 * u, -2.0, (w / 2, h / 2), (pos[0] + w / 2 - 700 * v, pos[1] + h / 2))
    over(f, warp(s, M), shadow=0.35, sh_off=(6, 9), sh_blur=8)

def blank():
    f = np.zeros((H, W, 4), np.float32); f[..., 3] = 1; return f

# ---------- scene ANGEL ----------
STAIR_BOTTOM = (545, 1650)            # scene coords of the foot of the drawn stairs
LAMPS = [(190, 790), (270, 785), (585, 790), (700, 795), (500, 785), (445, 785)]
def scene_angel(t, Z, F, n_steps=0.0, worker='lay', wk_sx=1.0, dim=1.0, shake=(0, 0), drop_last=None):
    ts = stepped(t); F = clamp_focus(Z, F)
    f = blank()
    Mbg = cam_mat(Z, F, 1.0, shake) @ affine(SB, 0, (0, 0), (0, 0))
    over(f, warp(bg_angel, Mbg))
    glow(f, pt(Mbg, (380, 190)), 170 * Z, (1.0, 0.85, 0.45), (0.45 + 0.08 * noise1(ts, 1)) * (0.6 + 0.4 * dim))   # the golden angel
    for i, p in enumerate(LAMPS):
        glow(f, pt(Mbg, p), 60 * Z, (1.0, 0.8, 0.35), (0.25 + 0.1 * noise1(ts, i + 3)) * dim)
    Mc = cam_mat(Z, F, 1.0, shake)
    k_full = int(n_steps)
    for k in range(1, k_full + 1):                      # new steps grow toward the viewer
        y = STAIR_BOTTOM[1] + k * 24
        if drop_last is not None and k == k_full: y -= drop_last
        sc = 0.53 + k * 0.012
        M = Mc @ affine(sc, 0, (383, 852), (STAIR_BOTTOM[0], y), 1.0, 0.30)
        sp = step if k % 2 else STEP_DARK
        over(f, warp(sp, M), shadow=0.45, sh_off=(0, 10), sh_blur=5)
    if worker:
        if worker == 'lay':
            spr, sc, piv, pos = wk_lay, 0.38, (385, 1151), (215, 1735)
            br = 1.5 * math.sin(ts * 3.1)
        else:
            spr, sc, piv, pos = wk_up, 0.36, (388, 1284), (230, 1745)
            br = 1.0 * math.sin(ts * 2.4)
        M = cam_mat(Z, F, 1.08, shake) @ affine(sc, 0, piv, (pos[0], pos[1] + br), wk_sx, 1.0)
        over(f, warp(spr, M), shadow=0.33, sh_off=(-12, 8))
    if dim != 1.0: f[..., :3] *= 0.55 + 0.45 * dim
    return f

# ---------- scene CUTAWAY: the street sinks, the column stays ----------
COL = (290, 485)    # column + piles strip in image x
def scene_cut(t, Z, F):
    ts = stepped(t); F = clamp_focus(Z, F)
    d = int(seg(ts, [(9.5, 0.0), (11.8, 72.0)]))      # image px the city has dropped
    img = bg_cut.copy()
    if d > 0:
        sh = np.empty_like(img); sh[d:] = img[:-d]; sh[:d] = img[:1]
        sh[:, COL[0]:COL[1]] = img[:, COL[0]:COL[1]]    # the column does not move
        img = sh
    f = blank()
    Mbg = cam_mat(Z, F, 1.0) @ affine(SB, 0, (0, 0), (0, 0))
    over(f, warp(img, Mbg))
    for p in [(85, 240 + d), (668, 240 + d)]:
        glow(f, pt(Mbg, p), 70 * Z, (1.0, 0.8, 0.35), 0.35 + 0.1 * noise1(ts, p[0]))
    # crumbs falling where the street tears away from the column
    rng_c = np.random.default_rng(int(ts * 12))
    if 9.6 <= t < 12.0:
        for _ in range(10):
            x = COL[0] + (rng_c.random() < 0.5) * (COL[1] - COL[0]) + rng_c.normal(0, 6)
            y = 330 + d + rng_c.random() * 60
            sx, sy = pt(Mbg, (x, y)); cv2.circle(f, (int(sx), int(sy)), 3, (0.79, 0.63, 0.29, 1), -1, cv2.LINE_AA)
    return f

# ---------- scene SPACE ----------
CITY = (370, 1080)
def scene_space(t, Z, F):
    ts = stepped(t); F = clamp_focus(Z, F)
    f = blank()
    Mbg = cam_mat(Z, F, 0.9) @ affine(SB, 0, (0, 0), (0, 0))
    over(f, warp(bg_space, Mbg))
    cpt = pt(Mbg, CITY)
    glow(f, cpt, 140 * Z, (1.0, 0.82, 0.4), 0.35 + 0.08 * noise1(ts, 2))
    sx = seg(ts, [(11.9, 1300.0), (13.0, 760.0), (16.3, 640.0)]); sy = 560 + 12 * math.sin(ts * 1.8)
    Ms = cam_mat(Z, F, 1.1) @ affine(0.62, -8 + 2 * math.sin(ts * 1.2), (385, 694), (sx, sy))
    dish = pt(Ms, (200, 600))
    # radar pulses travelling from the dish to the city (screen-blend rings, on twos)
    if t >= 13.0:
        for k in range(4):
            u = ((ts - 13.0) * 0.9 + k * 0.25) % 1.0
            cx = dish[0] + (cpt[0] - dish[0]) * u; cy = dish[1] + (cpt[1] - dish[1]) * u
            cv2.ellipse(f, (int(cx), int(cy)), (int(30 + 140 * u), int(10 + 45 * u)), 0, 0, 360, (0.91, 0.87, 0.79, 1), 3, cv2.LINE_AA)
    # the sinking area shows up as a deep blue stain on "drop"
    if t >= 14.46:
        a = min(1, (ts - 14.46) / 0.5) * (0.75 + 0.25 * math.sin(ts * 5))
        ov = f.copy(); cv2.ellipse(ov, (int(cpt[0]), int(cpt[1])), (int(120 * Z), int(55 * Z)), 0, 0, 360, (0.09, 0.16, 0.36, 1), -1, cv2.LINE_AA)
        ov = cv2.GaussianBlur(ov, (0, 0), 8); f[..., :3] = f[..., :3] * (1 - 0.7 * a) + ov[..., :3] * 0.7 * a
    over(f, warp(sat, Ms), shadow=0.25, sh_off=(14, 18))
    strip(f, 'rate', t, 14.7, 16.2, (70, 230))
    return f

ANGEL_F = (544.0, 300.0)
def frame(i):
    t = i / FPS; ts = stepped(t)
    if t < 4.3:                                          # S1 workers keep adding steps (frame 0 = cover)
        Z = seg(t, [(0, 1.0), (1.3, 1.04), (2.3, 1.04), (3.6, 1.30), (4.3, 1.34)])
        F = seg(t, [(0, (540.0, 967.0)), (1.3, (520.0, 1100.0)), (2.3, (520.0, 1100.0)), (3.6, ANGEL_F)])
        n = 1 if t >= 1.38 else 0
        dl = max(0, 60 * (1 - (t - 1.38) / 0.15)) if 1.38 <= t < 1.53 else None
        sq = 0.86 if 1.30 <= t < 1.40 else 1.0
        sh = (0, 6 * math.exp(-(t - 1.53) * 12) * math.sin(t * 90)) if t >= 1.53 else (0, 0)
        f = scene_angel(t, Z, F, n, 'lay', sq, 1.0, sh, dl)
        strip(f, 'place', t, 0.6, 3.9, (70, 230))
    elif t < 8.5:                                        # S2 fourteen steps... but the column never grows
        n = seg(ts, [(4.7, 1.0), (5.9, 14.0)])
        if t < 6.38:
            Z = seg(t, [(4.3, 1.45), (6.38, 1.5)]); F = seg(t, [(4.3, (500.0, 1640.0)), (6.38, (500.0, 1650.0))])
            f = scene_angel(t, Z, F, n, 'lay')
            strip(f, 'count', t, 4.8, 6.3, (70, 230))
        else:
            Z = seg(t, [(6.38, 1.5), (6.6, 1.5), (7.6, 1.3), (8.5, 1.34)])
            F = seg(t, [(6.38, (500.0, 1650.0)), (6.6, (500.0, 1650.0)), (7.6, ANGEL_F)])
            sq = 0.84 if t < 6.48 else 1 + 0.06 * math.exp(-(t - 6.48) * 9) * math.cos((t - 6.48) * 30)
            f = scene_angel(t, Z, F, 14, 'up', sq, seg(t, [(7.6, 1.0), (8.5, 0.8)]))
    elif t < 11.95:                                      # S3 why? the city around it is sinking
        if t < 9.35:                                     # "Why?" hold on the angel, light drops
            f = scene_angel(t, seg(t, [(8.5, 1.34), (9.35, 1.42)]), ANGEL_F, 14, None, 1.0, 0.75)
        else:
            Z = seg(t, [(9.35, 1.0), (11.95, 1.08)]); F = seg(t, [(9.35, (540.0, 700.0)), (11.95, (540.0, 640.0))])
            f = scene_cut(t, Z, F)
    elif t < 16.3:                                       # S4 from space, a radar sees...
        Z = seg(t, [(11.95, 1.0), (14.4, 1.06), (16.3, 1.22)]); F = seg(t, [(11.95, (540.0, 1000.0)), (14.4, (540.0, 1150.0)), (16.3, (520.0, 1350.0))])
        f = scene_space(t, Z, F)
    elif t < 20.35:                                      # S5 every year, the angel rises... without moving at all
        Z = seg(t, [(16.3, 1.45), (17.6, 1.42), (18.7, 1.32), (20.35, 1.48)])
        F = seg(t, [(16.3, (520.0, 1700.0)), (17.6, (520.0, 1700.0)), (18.7, ANGEL_F), (20.35, ANGEL_F)])
        f = scene_angel(t, Z, F, 14, 'up', 1.0, seg(t, [(18.7, 1.0), (20.35, 0.7)]))
    else:                                                # hit -> hard cut to the frame-0 shot (loop)
        amp = 12 * math.exp(-(t - 20.35) * 6)
        Z = seg(t, [(20.35, 1.06), (21.6, 1.0)])
        f = scene_angel(t, Z, (540.0, 967.0), 0, 'lay', 1.0, seg(t, [(20.35, 0.6), (21.4, 1.0)]),
                        (amp * math.sin(t * 83), amp * math.cos(t * 71)))
    return finish(f, t)

if MODE == 'preview' or MODE.startswith('frames'):
    times = [float(x) for x in MODE.split(' ', 1)[1].split(',')] if MODE.startswith('frames ') else \
        [0.0, 1.45, 3.0, 4.2, 5.0, 6.0, 6.5, 7.8, 8.9, 10.0, 11.7, 12.5, 13.6, 15.2, 16.8, 18.0, 19.5, 20.5, 21.55]
    for tt in times:
        Image.fromarray(frame(min(NF - 1, int(round(tt * FPS))))).resize((360, 640)).save(f'{S}/pv_{tt:05.2f}.png')
    sys.exit()

p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                      '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-pix_fmt', 'yuv420p', f'{S}/video_noaudio.mp4'], stdin=subprocess.PIPE)
for i in range(NF):
    p.stdin.write(frame(i).tobytes())
p.stdin.close(); p.wait()
