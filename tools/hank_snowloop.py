# Seamless sleet/snow loop over a still: python3 -I snowloop.py bg.jpg out.mp4 [preview_dir]
import sys, subprocess, numpy as np
from PIL import Image, ImageDraw, ImageFilter
src, out = sys.argv[1], sys.argv[2]
prev = sys.argv[3] if len(sys.argv) > 3 else None
import os
W, H = 1920, 1080
FPS = int(os.environ.get('LOOP_FPS', 30)); F = FPS * 10   # 10 s loop
DENS = float(os.environ.get('LOOP_DENSITY', 1.0))
rng = np.random.default_rng(6)

# background: scale to 1080 high, crop centre to 1920
im = Image.open(src).convert('RGB')
sc = H / im.height
sw = round(im.width * sc)
im = im.resize((sw, H), Image.LANCZOS)
ox = (sw - W) // 2
im = im.crop((ox, 0, ox + W, H))
bg = np.asarray(im).astype(np.float32) / 255

# windshield mask (source-image coords -> output coords), feathered
m = Image.new('L', (W, H), 0)
d = ImageDraw.Draw(m)
def P(x, y): return (x * sc - ox, y * sc)
d.rounded_rectangle([P(62, 42), P(1342, 646)], radius=int(42 * sc), fill=255)
mask = np.asarray(m.filter(ImageFilter.GaussianBlur(10))).astype(np.float32) / 255

# darker band behind the centred subtitles
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
band = 1 - 0.40 * np.exp(-((yy - 540) / 200) ** 2) * np.exp(-((xx - 960) / 1000) ** 2)

def disc(r):
    s = int(np.ceil(r * 3)); g = np.arange(-s, s + 1, dtype=np.float32)
    X, Y = np.meshgrid(g, g); return np.exp(-(X**2 + Y**2) / (2 * (r / 1.6) ** 2))
def streak(length, ang):
    n = int(length + 6); img = Image.new('L', (n * 2, n * 2), 0); dd = ImageDraw.Draw(img)
    dx, dy = np.sin(ang) * length / 2, np.cos(ang) * length / 2
    dd.line([(n - dx, n - dy), (n + dx, n + dy)], fill=255, width=2)
    a = np.asarray(img.filter(ImageFilter.GaussianBlur(0.8))).astype(np.float32) / 255
    ys, xs = np.nonzero(a > 0.01); return a[ys.min():ys.max() + 1, xs.min():xs.max() + 1]

# layers: (count, size range, k = falls per loop, opacity range, slant, sway amp)
layers = [
    dict(n=int(650 * float(os.environ.get('LOOP_FAR', 1.0))), r=(0.9, 1.5), k=1, op=(0.30, 0.55), slant=0.10, sway=6),
    dict(n=320, r=(1.8, 2.8), k=2, op=(0.50, 0.80), slant=0.14, sway=10),
    dict(n=60,  r=(4.0, 6.5), k=3, op=(0.22, 0.40), slant=0.18, sway=16),
]
parts = []
for L in layers:
    for _ in range(int(L['n'] * DENS)):
        r = rng.uniform(*L['r']); spr = disc(r)
        parts.append(dict(spr=spr, x0=rng.uniform(-80, W + 80), y0=rng.uniform(0, 1), k=L['k'],
                          op=rng.uniform(*L['op']), slant=L['slant'], amp=rng.uniform(0.3, 1) * L['sway'],
                          j=int(rng.integers(1, 4)), ph=rng.uniform(0, 2 * np.pi)))
ang = np.deg2rad(13)
for _ in range(int(130 * DENS)):   # freezing-rain streaks
    parts.append(dict(spr=streak(rng.uniform(16, 30), ang), x0=rng.uniform(-200, W + 80), y0=rng.uniform(0, 1),
                      k=int(rng.choice([7, 8, 9])), op=rng.uniform(0.16, 0.30), slant=np.tan(ang), amp=0, j=1, ph=0))
col = np.array([0.88, 0.91, 0.95], np.float32)
span = H + 120

def frame(f):
    A = np.zeros((H, W), np.float32); t = f / F
    for p in parts:
        y = ((p['y0'] + p['k'] * t) % 1.0) * span - 60
        x = p['x0'] + p['slant'] * y + p['amp'] * np.sin(2 * np.pi * p['j'] * t + p['ph'])
        s = p['spr']; h, w = s.shape; y0 = int(y) - h // 2; x0 = int(x) - w // 2
        ya, yb, xa, xb = max(y0, 0), min(y0 + h, H), max(x0, 0), min(x0 + w, W)
        if ya < yb and xa < xb:
            A[ya:yb, xa:xb] += s[ya - y0:yb - y0, xa - x0:xb - x0] * p['op']
    A = np.clip(A, 0, 1) * mask
    o = bg * (1 - A[..., None]) + col * A[..., None]
    return np.clip(o * band[..., None] * 255, 0, 255).astype(np.uint8)

if prev:
    for f in (0, 150):
        Image.fromarray(frame(f)).save(f'{prev}/loop_f{f}.png')
    print('previews done'); sys.exit()
enc = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}',
                        '-r', str(FPS), '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '16',
                        '-pix_fmt', 'yuv420p', out], stdin=subprocess.PIPE)
for f in range(F):
    enc.stdin.write(frame(f).tobytes())
enc.stdin.close(); enc.wait(); print('loop written', out)
