# lost-brothers: paper cut-out Short. Usage: python3 render.py <work dir> [preview | "frames t1,t2"]
import sys, os, math, subprocess, numpy as np, cv2
from PIL import Image
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../engine'))
from lib import *

S = sys.argv[1]
MODE = sys.argv[2] if len(sys.argv) > 2 else 'render'
DUR = 22.8
NF = int(round(DUR * FPS))
SB = 1920 / 1672                       # owner backgrounds are 941x1672
SW, SH = 941 * SB, 1920
FONT = '/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf'

bg_sea = load(f'{S}/src/01_bg_sea_night.png')
bg_port = load(f'{S}/src/02_bg_lisbon_harbor.png')
bg_hall = load(f'{S}/src/03_bg_throne_room.png')
ship = load(f'{S}/sprites/04_prop_caravel.png')
miguel = load(f'{S}/sprites/05_char_miguel_spyglass.png')
vasco = load(f'{S}/sprites/06_char_vasco_plead.png')
king = load(f'{S}/sprites/07_char_king_refuse.png')
waves = load(f'{S}/sprites/08_fg_waves.png')
strips = {k: paper_strip(v, FONT, 50, seed=i) for i, (k, v) in enumerate(
    {'gaspar': 'GASPAR CORTE-REAL, 1501', 'meet': 'MEET: AUGUST 20, 1502'}.items())}

def strip(f, key, t, t0, t1, pos):
    if not (t0 <= t < t1): return
    ts = stepped(t); u = min(1, (ts - t0) / 0.17); v = max(0, (ts - (t1 - 0.17)) / 0.17)
    s = strips[key]; h, w = s.shape[:2]
    M = affine(1.15 - 0.15 * u, -2.0, (w / 2, h / 2), (pos[0] + w / 2 - 700 * v, pos[1] + h / 2))
    over(f, warp(s, M), shadow=0.35, sh_off=(6, 9), sh_blur=8)

def blank():
    f = np.zeros((H, W, 4), np.float32); f[..., 3] = 1; return f

def bg(f, img, Z, F, k=0.9, shake=(0, 0)):
    M = cam_mat(Z, F, k, shake) @ affine(SB, 0, (0, 0), (0, 0)); over(f, warp(img, M)); return M

SHIP_PIV = (780, 930)                  # waterline of the caravel sprite
def draw_ship(f, Mc, x, y, sc, ts, seed, alpha=1.0, flip=False):
    rot = 2.2 * math.sin(ts * 2 * math.pi / 2.6 + seed); dy = 6 * math.sin(ts * 2 * math.pi / 2.6 + seed + 1)
    M = Mc @ affine(sc, rot, SHIP_PIV, (x, y + dy), -1.0 if flip else 1.0, 1.0)
    over(f, warp(ship, M), shadow=0.25, sh_off=(8, 10), sh_blur=8, opacity=alpha)
    glow(f, pt(M, (240, 600)), 60 * sc / 0.22, (1.0, 0.8, 0.35), 0.35 * alpha)   # stern lantern

def front_waves(f, Z, F, ts, y=1995):
    wx = 24 * math.sin(ts * 2 * math.pi / 3.4); wy = 8 * math.sin(ts * 2 * math.pi / 2.2)
    M = cam_mat(Z, F, 1.25) @ affine(0.82, 0, (768, 732), (540 + wx, y + wy))
    over(f, warp(waves, M), shadow=0.35, sh_off=(0, -10))

def fog(f, amt, y0=820, y1=1150):
    if amt <= 0: return
    band = np.zeros((H, 1), np.float32); band[y0:y1] = 1
    band = cv2.GaussianBlur(band, (1, 0), sigmaX=0.1, sigmaY=90)[..., None] if False else cv2.GaussianBlur(band, (1, 181), 0)[:, :, None]
    f[..., :3] = f[..., :3] * (1 - amt * band) + np.array([0.62, 0.64, 0.62]) * amt * band

def scene_sea(t, Z, F, ships, fog_amt=0.25, shake=(0, 0)):
    """ships: list of (x, y, scale, seed, alpha)"""
    ts = stepped(t); F = clamp_focus(Z, F, SW, SH); f = blank()
    Mbg = bg(f, bg_sea, Z, F, 0.9, shake)
    glow(f, pt(Mbg, (720, 235)), 260 * Z, (0.95, 0.92, 0.78), 0.18 + 0.03 * math.sin(t * 1.5))
    Mc = cam_mat(Z, F, 1.0, shake)
    for (x, y, sc, seed, a) in ships: draw_ship(f, Mc, x, y, sc, ts, seed, a)
    fog(f, fog_amt)
    front_waves(f, Z, F, ts)
    return f

def two_ships(t):   # the premise shot: two ships sail home, a gap where the third should be
    return [(250 + 8 * t, 1075, 0.22, 0.0, 1.0), (840 + 8 * t, 1060, 0.20, 1.7, 1.0)]

def frame(i):
    t = i / FPS; ts = stepped(t)
    if t < 2.6:                                                     # S1 two ships sail home
        f = scene_sea(t, seg(t, [(0, 1.0), (2.6, 1.05)]), seg(t, [(0, (540.0, 960.0)), (2.6, (545.0, 1000.0))]), two_ships(t))
    elif t < 7.45:                                                  # S2 the third... never arrives
        a3 = seg(t, [(2.8, 1.0), (5.7, 1.0), (6.6, 0.0)])            # swallowed by the fog
        sh = two_ships(t) + [(545 + 6 * (t - 2.6), 1030 - 18 * (t - 2.8 if t > 2.8 else 0) * 0, 0.14, 3.1, a3)]
        Z = seg(t, [(2.6, 1.15), (6.1, 1.45), (7.45, 1.5)]); F = seg(t, [(2.6, (545.0, 1000.0)), (6.1, (560.0, 1020.0))])
        f = scene_sea(t, Z, F, sh, fog_amt=seg(t, [(2.6, 0.25), (6.2, 0.55)]))
        strip(f, 'gaspar', t, 3.5, 6.9, (60, 230))
    elif t < 10.35:                                                 # S3 Miguel sails out to find him
        Z = seg(t, [(7.45, 1.0), (10.35, 1.08)]); F = clamp_focus(Z, seg(t, [(7.45, (540.0, 960.0)), (10.35, (600.0, 1050.0))]), SW, SH)
        f = blank(); Mbg = bg(f, bg_port, Z, F, 0.9)
        glow(f, pt(Mbg, (760, 815)), 300 * Z, (1.0, 0.75, 0.3), 0.30)
        Mc = cam_mat(Z, F, 1.0)
        draw_ship(f, Mc, seg(ts, [(7.6, 640.0), (10.35, 1020.0)]), 1215, 0.30, ts, 0.5)
        br = 1.5 * math.sin(ts * 2.6)
        M = cam_mat(Z, F, 1.12) @ affine(0.44, 0, (464, 1493), (300, 1690 + br))
        over(f, warp(miguel, M), shadow=0.33, sh_off=(-12, 8))
        glow(f, pt(M, (840, 190)), 50, (1.0, 0.9, 0.6), 0.25 + 0.2 * noise1(ts, 3))   # glint on the spyglass
    elif t < 14.45:                                                 # S4 three ships split up, agree to meet
        u = seg(ts, [(11.2, 0.0), (12.6, 1.0)])
        sh = [(540 - 330 * u, 1080 - 20 * u, 0.24 - 0.06 * u, 0.0, 1.0),
              (560 + 330 * u, 1075 - 25 * u, 0.24 - 0.07 * u, 1.3, 1.0),
              (550, 1090 - 50 * u, 0.26 - 0.10 * u, 2.6, 1.0)]
        f = scene_sea(t, seg(t, [(10.35, 1.12), (14.45, 1.02)]), (545.0, 1000.0), sh)
        strip(f, 'meet', t, 12.85, 14.35, (60, 230))
    elif t < 18.25:                                                 # S5 two come back... Miguel's never does
        u = seg(ts, [(14.45, 0.0), (15.7, 1.0)])
        sh = [(-120 + 400 * u, 1070, 0.22, 0.0, 1.0), (1200 - 420 * u, 1065, 0.21, 1.7, 1.0)]
        Z = seg(t, [(14.45, 1.02), (16.8, 1.08), (18.25, 1.38)]); F = seg(t, [(14.45, (545.0, 1000.0)), (16.8, (545.0, 1000.0)), (18.25, (545.0, 1010.0))])
        f = scene_sea(t, Z, F, sh, fog_amt=seg(t, [(16.8, 0.3), (18.2, 0.6)]))
        f[..., :3] *= seg(t, [(16.8, 1.0), (18.25, 0.8)])
    else:                                                           # S6-7 throne hall: the last brother... the king says no
        Z = seg(t, [(18.25, 1.0), (21.0, 1.08), (21.5, 1.18)]); F = clamp_focus(Z, seg(t, [(18.25, (540.0, 1100.0)), (21.5, (560.0, 1150.0))]), SW, SH)
        amp = 12 * math.exp(-(t - 21.5) * 6) if t >= 21.5 else 0
        shk = (amp * math.sin(t * 83), amp * math.cos(t * 71))
        f = blank(); Mbg = bg(f, bg_hall, Z, F, 0.9, shk)
        cand = 0.3 + 0.12 * noise1(ts, 2)
        if t >= 21.5: cand *= max(0.0, 1 - (t - 21.5) / 0.2)       # candles gutter on "no"
        for p in [(215, 770), (725, 770)]: glow(f, pt(Mbg, p), 140 * Z, (1.0, 0.8, 0.35), cand)
        Mc = cam_mat(Z, F, 1.12, shk)
        x, bob, rot = seg(ts, [(18.4, -200.0), (19.6, 290.0)]), 0.0, 0.0
        if 18.4 <= ts < 19.6: bob = -abs(math.sin(ts * math.pi * 2.6)) * 14; rot = 2.5 * math.sin(ts * math.pi * 2.6)
        M = Mc @ affine(0.50, rot, (500, 1469), (x, 1800 + bob + 2 * math.sin(ts * 3)))
        over(f, warp(vasco, M), shadow=0.33, sh_off=(-12, 8))
        if t >= 20.75:                                              # the king steps in
            kx = seg(ts, [(20.75, 1250.0), (21.25, 820.0)])
            sx = 0.86 if 21.42 <= t < 21.52 else (1 + 0.06 * math.exp(-(t - 21.52) * 9) * math.cos((t - 21.52) * 30) if t >= 21.52 else 1.0)
            M = Mc @ affine(0.47, 0, (500, 1507), (kx, 1790), sx, 1.0)
            over(f, warp(king, M), shadow=0.33, sh_off=(12, 8))
        f[..., :3] *= seg(t, [(18.25, 1.0), (21.5, 1.0), (21.7, 0.55)])
        if t >= 22.05:                                              # loop: back to the two ships, light rising
            f = scene_sea(0, 1.0, (540.0, 960.0), two_ships(0)); f[..., :3] *= seg(t, [(22.05, 0.45), (22.75, 1.0)])
    return finish(f, t)

if MODE == 'preview' or MODE.startswith('frames'):
    times = [float(x) for x in MODE.split(' ', 1)[1].split(',')] if MODE.startswith('frames ') else \
        [0.0, 1.5, 3.2, 5.0, 6.8, 8.0, 9.8, 11.0, 12.8, 14.0, 15.2, 16.5, 17.9, 18.8, 20.2, 21.1, 21.6, 22.3, 22.75]
    for tt in times:
        Image.fromarray(frame(min(NF - 1, int(round(tt * FPS))))).resize((360, 640)).save(f'{S}/pv_{tt:05.2f}.png')
    sys.exit()

p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                      '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-pix_fmt', 'yuv420p', f'{S}/video_noaudio.mp4'], stdin=subprocess.PIPE)
for i in range(NF):
    p.stdin.write(frame(i).tobytes())
p.stdin.close(); p.wait()
