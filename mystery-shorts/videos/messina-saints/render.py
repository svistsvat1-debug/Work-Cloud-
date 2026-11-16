# messina-saints: paper cut-out Short (frames -> ffmpeg). Usage: python3 render.py <work dir> [preview | frames t1,t2,...]
import sys, os, math, subprocess, numpy as np, cv2
from PIL import Image
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../engine'))
from lib import *

S = sys.argv[1]
MODE = sys.argv[2] if len(sys.argv) > 2 else 'render'
DUR = 23.0
NF = int(round(DUR * FPS))
IW, IH = 768, 1376
SB = 1080 / IW                     # background scale -> scene 1080 x 1935
FONT = '/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf'

bg_wall = load(f'{S}/src/01_bg_wall_night.jpg')
bg_mus = load(f'{S}/src/02_bg_museum_outside.jpg')
bg_gal = load(f'{S}/src/03_bg_gallery.jpg')
th_walk = load(f'{S}/sprites/05_char_thief_walk.png')
th_run = load(f'{S}/sprites/06_char_thief_carry.png')
altar = load(f'{S}/sprites/09_prop_altarpiece.png')
altar_e = load(f'{S}/sprites/10_prop_altarpiece_empty.png')
saints = load(f'{S}/sprites/11_prop_two_saints.png')
rail = load(f'{S}/sprites/12_fg_railing.png')

strips = {k: paper_strip(v, FONT, 50, seed=i) for i, (k, v) in enumerate(
    {'place': 'MESSINA, SICILY', 'earlier': 'MINUTES EARLIER', 'name': 'ANTONELLO DA MESSINA, 1473'}.items())}

def strip(f, key, t, t0, t1, pos):
    """torn paper strip that slaps in (on twos) and slides out"""
    if not (t0 <= t < t1): return
    ts = stepped(t)
    u = min(1, (ts - t0) / 0.17); v = max(0, (ts - (t1 - 0.17)) / 0.17)
    sc = 1.15 - 0.15 * u
    s = strips[key]; h, w = s.shape[:2]
    M = affine(sc, -2.0, (w / 2, h / 2), (pos[0] + w / 2 - 600 * v, pos[1] + h / 2))
    over(f, warp(s, M), shadow=0.35, sh_off=(6, 9), sh_blur=8)

def bg_layer(f, img, Z, F, k=0.9, shake=(0, 0)):
    M = cam_mat(Z, F, k, shake) @ affine(SB, 0, (0, 0), (0, 0))
    over(f, warp(img, M)); return M

rng_d = np.random.default_rng(3).random((40, 3))
def dust(f, c, spread, ts, n=30, col=(0.95, 0.88, 0.7)):
    for i in range(n):
        r0 = rng_d[i]
        x = c[0] + (r0[0] - 0.5) * spread + 25 * math.sin(ts * 0.7 + i)
        y = c[1] + (r0[1] - 0.4) * spread - ((ts * 16 * (0.5 + r0[2])) % (spread * 0.6))
        cv2.circle(f, (int(x), int(y)), 2 + int(r0[2] * 2), col + (1,), -1, cv2.LINE_AA)

def blank():
    f = np.zeros((H, W, 4), np.float32); f[..., 3] = 1; return f

# ---------------- scene WALL (frame 0 / cover, the drop, the ending) ----------------
SAINT_SC, SAINT_PIV, SAINT_POS = 0.83, (385, 1000), (661, 1150)
def scene_wall(t, Z, F, saints_mode='on', light=1.0, thief=None, shake=(0, 0)):
    """saints_mode: 'on' | 'off' | ('drop', u) with u in 0..1 (fall progress)"""
    f = blank(); ts = stepped(t)
    F = clamp_focus(Z, F)
    Mbg = bg_layer(f, bg_wall, Z, F, 0.9, shake)
    glow(f, pt(Mbg, (588, 200)), 230 * Z, (0.95, 0.92, 0.78), 0.20 + 0.04 * math.sin(t * 1.7))      # moon
    lamp = 0.42 + 0.10 * noise1(ts, 1)
    glow(f, pt(Mbg, (112, 505)), 330 * Z, (1.0, 0.8, 0.35), lamp)                                    # street lamp
    dust(f, pt(Mbg, (112, 560)), 380 * Z, ts, 18)
    Mc = cam_mat(Z, F, 1.0, shake)
    if saints_mode != 'off':
        if saints_mode == 'on':
            y, sy, rot = SAINT_POS[1], 1.0, 0.4 * math.sin(ts * 1.3)
        else:
            u = saints_mode[1]
            y = SAINT_POS[1] - 520 * (1 - u) ** 2 if u < 1 else SAINT_POS[1]
            sy = 1.0 if u < 1 else 1 - 0.14 * math.exp(-(u - 1) * 6) * math.cos((u - 1) * 14)
            rot = -6 * (1 - u) if u < 1 else 0
        M = Mc @ affine(SAINT_SC, rot, SAINT_PIV, (SAINT_POS[0], y), 1.0, sy)
        over(f, warp(saints, M), shadow=0.38, sh_off=(12, 6), sh_blur=12)
        # warm rim light from the lamp on the gold panels
        glow(f, pt(M, (385, 690)), 260 * Z, (1.0, 0.85, 0.45), 0.10 * light)
    if thief is not None:
        spr, x, y, rot, sx, sc = thief
        piv = (380, 1100) if spr is th_run else (400, 1176)
        M = cam_mat(Z, F, 1.1, shake) @ affine(sc, rot, piv, (x, y), sx, 1.0)
        over(f, warp(spr, M), shadow=0.32, sh_off=(-12, 10))
    if light != 1.0: f[..., :3] *= light
    return f

# ---------------- scene MUSEUM OUTSIDE ----------------
LIGHTS = [(40, 548), (150, 545), (250, 505), (330, 485), (430, 405), (520, 440), (600, 438), (690, 370), (745, 360)]
def thief_walk_xy(ts, t0, x0, x1, dur):
    u = min(max((ts - t0) / dur, 0), 1)
    x = x0 + (x1 - x0) * u
    moving = 0 < u < 1
    bob = -abs(math.sin(ts * math.pi * 2.6)) * 14 if moving else 2 * math.sin(ts * 3.2)
    rot = 2.5 * math.sin(ts * math.pi * 2.6) if moving else 0
    return x, bob, rot

def scene_museum(t):
    ts = stepped(t)
    Z = seg(t, [(4.95, 1.0), (6.7, 1.06), (8.3, 1.42)])
    F = seg(t, [(4.95, (520.0, 1000.0)), (6.7, (560.0, 1050.0)), (8.3, (735.0, 1110.0))])
    F = clamp_focus(Z, F)
    f = blank()
    Mbg = bg_layer(f, bg_mus, Z, F, 0.9)
    for i, p in enumerate(LIGHTS):                       # procession lights twinkle (on twos)
        glow(f, pt(Mbg, p), 70 * Z, (1.0, 0.82, 0.4), 0.16 + 0.16 * noise1(ts * 2, i))
    # the forced door: a dark gap opens on "break"
    if t >= 7.05:
        u = min(1, (ts - 7.05) / 0.35)
        x0, y0 = pt(Mbg, (500, 752)); x1, y1 = pt(Mbg, (500 + 50 * u, 872))
        cv2.rectangle(f, (int(x0), int(y0)), (int(x1), int(y1)), (0.06, 0.09, 0.13, 1), -1)
        glow(f, ((x0 + x1) / 2, (y0 + y1) / 2), 90 * Z, (1.0, 0.8, 0.35), 0.25 * u)
    Mc = cam_mat(Z, F, 1.1)
    for (t0, sc, yy, dk) in [(6.0, 0.30, 1300, 0.72), (5.75, 0.36, 1335, 1.0)]:    # two masked figures
        x, bob, rot = thief_walk_xy(ts, t0, -160, 640 if sc > 0.33 else 560, 2.1)
        sp = th_walk.copy(); sp[..., :3] *= dk
        M = Mc @ affine(sc, rot, (400, 1176), (x, yy + bob))
        over(f, warp(sp, M), shadow=0.3, sh_off=(-10, 8))
    Mr = cam_mat(Z, F, 1.25) @ affine(1.05, 0, (383, 919), (300, 1985))
    over(f, warp(rail, Mr), shadow=0.4, sh_off=(0, -12))
    strip(f, 'earlier', t, 5.25, 7.0, (70, 230))
    return f

# ---------------- scene GALLERY ----------------
ALT_POS = (541, 735)
def scene_gallery(t, empty, Z, F, thief=None, flash=0.0, shake=(0, 0), beam=1.0):
    ts = stepped(t)
    F = clamp_focus(Z, F)
    f = blank()
    Mbg = bg_layer(f, bg_gal, Z, F, 0.95, shake)
    Mc = cam_mat(Z, F, 1.0, shake)
    if empty: M = Mc @ affine(0.77, 0, (384, 649), ALT_POS)
    else: M = Mc @ affine(0.77, 0, (385, 662), ALT_POS)
    over(f, warp(altar_e if empty else altar, M), shadow=0.45, sh_off=(10, 14), sh_blur=14)
    # flashlight pool sweeping over the altarpiece
    bx = 541 + 150 * math.sin(ts * 1.6); by = 760 + 60 * math.sin(ts * 1.1 + 1)
    glow(f, pt(Mc, (bx, by)), 230 * Z, (1.0, 0.85, 0.45), 0.30 * beam + 0.05 * noise1(ts, 4))
    dust(f, pt(Mc, (380, 1100)), 520 * Z, ts, 26)
    if thief is not None:
        spr, x, y, rot, sx, sc = thief
        piv = (380, 1100) if spr is th_run else (400, 1176)
        Mt = cam_mat(Z, F, 1.12, shake) @ affine(sc, rot, piv, (x, y), sx, 1.0)
        over(f, warp(spr, Mt), shadow=0.35, sh_off=(-14, 10))
        fl = (700, 640) if spr is th_walk else (650, 560)
        glow(f, pt(Mt, fl), 120 * Z, (1.0, 0.85, 0.4), 0.55 * beam)
    if flash > 0: f[..., :3] = 1 - (1 - f[..., :3]) * (1 - flash * np.array([1.0, 0.9, 0.6]))
    if not empty: strip(f, 'name', t, 9.25, 11.25, (60, 220))
    return f

# ---------------- timeline ----------------
T_SWAP = 10.72       # "paintings": the altarpiece is empty
T_DROP = 13.14       # "drop"
T_VANISH = 15.04     # "vanish"
T_HIT = 21.72        # end of "behind?"

def frame(i):
    t = i / FPS; ts = stepped(t)
    if t < 4.95:                                                   # S1 premise (= cover)
        Z = seg(t, [(0, 1.0), (4.95, 1.10)]); F = seg(t, [(0, (540.0, 967.0)), (4.95, (640.0, 1000.0))])
        f = scene_wall(t, Z, F)
        strip(f, 'place', t, 1.3, 4.7, (70, 230))
    elif t < 8.65:                                                 # S2 masked thieves break in
        f = scene_museum(t)
    elif t < 11.6:                                                 # S3 they take the paintings
        empty = t >= T_SWAP
        Z = seg(t, [(8.65, 1.1), (10.6, 1.2), (11.6, 1.24)]); F = seg(t, [(8.65, (540.0, 1000.0)), (10.6, (541.0, 860.0))])
        x, bob, rot = thief_walk_xy(ts, 8.75, -150, 260, 1.4)
        if not empty:
            sx = 0.86 if T_SWAP - 0.09 <= t else 1.0
            th = (th_walk, x, 1560 + bob, rot, sx, 0.50)
        else:
            u = t - T_SWAP
            sxe = 1 + 0.07 * math.exp(-u * 9) * math.cos(u * 30)
            xr, bobr, rotr = thief_walk_xy(ts, T_SWAP + 0.15, 260, 1250, 0.7)
            th = (th_run, xr, 1560 + bobr * 1.6, rotr, sxe, 0.53)
        flash = max(0, 1 - abs(t - T_SWAP) / 0.10) * 0.85
        amp = 10 * math.exp(-(t - T_SWAP) * 7) if t >= T_SWAP else 0
        sh = (amp * math.sin(t * 83), amp * math.cos(t * 71))
        f = scene_gallery(t, empty, Z, F, th, flash, sh)
    elif t < 16.1:                                                 # S4 but outside... drop... vanish
        Z = seg(t, [(11.6, 1.04), (13.1, 1.08), (13.5, 1.13), (16.1, 1.06)])
        F = seg(t, [(11.6, (520.0, 1150.0)), (13.5, (620.0, 1120.0)), (16.1, (640.0, 1080.0))])
        x = seg(ts, [(11.95, -200.0), (13.15, 560.0), (14.95, 1000.0)])
        run = 11.95 <= ts < 14.95
        bob = -abs(math.sin(ts * math.pi * 3.2)) * 22 if run else 0
        rot = 3 * math.sin(ts * math.pi * 3.2)
        sx = 1.0
        if t >= T_VANISH: sx = max(0.0, 1 - (ts - T_VANISH) / 0.17)     # paper flip -> gone
        thief = (th_run, x, 1590 + bob, rot, sx, 0.47) if t < T_VANISH + 0.2 else None
        if t < T_DROP: mode = 'off'
        else: mode = ('drop', (t - T_DROP) / 0.25)
        amp = 9 * math.exp(-(t - T_DROP - 0.25) * 8) if t >= T_DROP + 0.25 else 0
        f = scene_wall(t, Z, F, mode, light=0.86, thief=thief, shake=(amp * math.sin(t * 90), amp * math.cos(t * 77)))
    elif t < 18.4:                                                 # S5 the rest can't be sold
        Z = seg(t, [(16.1, 1.12), (18.4, 1.26)]); F = seg(t, [(16.1, (540.0, 900.0)), (18.4, (541.0, 760.0))])
        f = scene_gallery(t, True, Z, F, None, 0, (0, 0), beam=0.7)
        f[..., :3] *= 0.9
    else:                                                          # S6 why... loop back to frame 0
        Z = seg(t, [(18.4, 1.06), (21.3, 1.30), (21.72, 1.34), (22.85, 1.0)])
        F = seg(t, [(18.4, (620.0, 1060.0)), (21.3, (661.0, 900.0)), (21.72, (661.0, 890.0)), (22.85, (540.0, 967.0))])
        amp = 14 * math.exp(-(t - T_HIT) * 6) if t >= T_HIT else 0
        light = seg(t, [(18.4, 1.0), (21.3, 0.86), (21.72, 0.78), (22.85, 1.0)])
        f = scene_wall(t, Z, F, 'on', light, None, (amp * math.sin(t * 83), amp * math.cos(t * 71)))
    return finish(f, t)

if MODE == 'preview' or MODE.startswith('frames'):
    times = [float(x) for x in MODE.split(' ', 1)[1].split(',')] if MODE.startswith('frames ') else \
        [0.0, 0.4, 2.5, 5.3, 6.5, 7.6, 8.2, 9.3, 10.4, 10.8, 11.3, 12.5, 13.3, 13.6, 14.6, 15.2, 17.0, 19.5, 21.4, 21.9, 22.95]
    for tt in times:
        Image.fromarray(frame(min(NF - 1, int(round(tt * FPS))))).resize((360, 640)).save(f'{S}/pv_{tt:05.2f}.png')
    sys.exit()

p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
                      '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-pix_fmt', 'yuv420p', f'{S}/video_noaudio.mp4'], stdin=subprocess.PIPE)
for i in range(NF):
    p.stdin.write(frame(i).tobytes())
    if i % 96 == 0: print('frame', i, '/', NF, flush=True)
p.stdin.close(); p.wait()
