"""Synthesise every sound effect (no libraries, no downloads). usage: python sfx.py OUT_DIR DURATION_S"""
import sys
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt

out, DUR = sys.argv[1], float(sys.argv[2])
SR = 48000
rng = np.random.default_rng(7)
tt = lambda d: np.arange(int(d * SR)) / SR

def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], btype='band', fs=SR, output='sos'), x)
def lp(x, f, order=2):
    return sosfilt(butter(order, f, btype='low', fs=SR, output='sos'), x)
def hp(x, f, order=2):
    return sosfilt(butter(order, f, btype='high', fs=SR, output='sos'), x)
def sweep(f0, f1, d, curve='exp'):
    t = tt(d)
    f = f0 * (f1 / f0) ** (t / d) if curve == 'exp' else f0 + (f1 - f0) * t / d
    return np.sin(2 * np.pi * np.cumsum(f) / SR)
def env(d, a, r, shape=1.0):
    t = tt(d); e = np.minimum(t / max(a, 1e-4), 1) * np.exp(-np.maximum(t - a, 0) / max(r, 1e-4))
    return e ** shape
def fade(x, fi=0.005, fo=0.02):
    n1, n2 = int(fi * SR), int(fo * SR); x = x.copy()
    x[:n1] *= np.linspace(0, 1, n1); x[-n2:] *= np.linspace(1, 0, n2); return x
def save(name, x):
    x = fade(np.asarray(x, float)); x = x / (np.max(np.abs(x)) + 1e-9) * 10 ** (-1 / 20)
    sf.write(f"{out}/{name}.wav", x.astype(np.float32), SR, subtype='PCM_16')
noise = lambda d: rng.standard_normal(int(d * SR))

# night bed: two crickets + a soft breeze
d = DUR; x = 0.15 * lp(noise(d), 400) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.11 * tt(d)))
for f0, per, off in [(4600, 0.9, 0.1), (5200, 1.25, 0.5)]:
    t0 = off
    while t0 < d - 0.3:
        for p in range(4):
            s = int((t0 + p * 0.032) * SR); n = int(0.022 * SR)
            if s + n < len(x):
                x[s:s + n] += 0.35 * np.sin(2 * np.pi * f0 * np.arange(n) / SR) * np.hanning(n)
        t0 += per * (0.85 + 0.3 * rng.random())
save('night_bed', x)

# hummingbird wing hum (harmonics of a ~48 Hz wingbeat)
d = DUR; t = tt(d); f0 = 48 * (1 + 0.02 * np.sin(2 * np.pi * 0.5 * t))
ph = 2 * np.pi * np.cumsum(f0) / SR
x = sum(np.sin(n * ph) / n ** 0.8 for n in range(1, 24))
x = bp(x, 110, 1400) * (0.8 + 0.2 * np.sin(2 * np.pi * 3.1 * t)) + 0.05 * bp(noise(d), 200, 900)
save('wing_hum', x)

d = 1.4; save('wind', bp(noise(d), 350, 1300) * np.sin(np.pi * tt(d) / d) ** 1.5 * (1 + 0.3 * sweep(3, 3, d)))
d = 0.5; t = tt(d)
w = np.zeros(int(d * SR)); nz = noise(d)
for i, (lo, hi) in enumerate([(300, 800), (700, 1600), (1400, 3000)]):
    w += bp(nz, lo, hi) * np.exp(-((t - (0.18 + 0.06 * i)) / 0.09) ** 2)
save('whoosh', w)
d = 0.16; save('pop', sweep(900, 260, d) * env(d, 0.004, 0.035) + 0.3 * hp(noise(d), 2000) * env(d, 0.001, 0.004))
d = 0.3; save('fwip', bp(noise(d), 900, 3200) * env(d, 0.12, 0.05) + 0.5 * sweep(500, 1400, d) * env(d, 0.1, 0.06))
d = 4.3; t = tt(d)
save('drain', (sweep(900, 170, d) + 0.3 * sweep(1800, 340, d)) * (0.6 + 0.4 * np.sin(2 * np.pi * 7 * t) ** 2) * np.minimum(t / 0.05, 1) * (1 - 0.6 * t / d))
d = 0.25; save('drip', sweep(500, 1500, d) * env(d, 0.003, 0.05))
d = 0.4; save('bonk', (sweep(260, 150, d) + 0.4 * sweep(520, 300, d)) * env(d, 0.002, 0.09))
d = 0.1; save('pip', np.sin(2 * np.pi * 1500 * tt(d)) * env(d, 0.002, 0.02))
d = 0.14; c = np.zeros(int(d * SR))
for s in (0.0, 0.045):
    i = int(s * SR); n = int(0.004 * SR); c[i:i + n] += hp(noise(0.004), 1500)
c += 0.4 * np.sin(2 * np.pi * 2200 * tt(d)) * env(d, 0.001, 0.015)
save('click', c)
d = 0.14; save('tap', bp(noise(d), 700, 2200) * env(d, 0.001, 0.012) + 0.6 * np.sin(2 * np.pi * 480 * tt(d)) * env(d, 0.001, 0.03))
d = 0.5; save('poof', lp(noise(d), 1400) * env(d, 0.01, 0.12) + 0.3 * sweep(300, 160, d) * env(d, 0.005, 0.08))
d = 1.5; x = 0.25 * hp(noise(d), 4000) * env(d, 0.05, 0.4)
for i in range(16):
    s = rng.random() * 0.9; f = 2200 + rng.random() * 4200; n = int((d - s) * SR)
    x[int(s * SR):int(s * SR) + n] += 0.35 * np.sin(2 * np.pi * f * np.arange(n) / SR) * np.exp(-np.arange(n) / SR / 0.18)
save('freeze', x)
d = 0.36; x = np.zeros(int(d * SR))
for s, a in ((0, 1.0), (0.13, 0.65)):
    n = int(0.2 * SR); seg = sweep(95, 48, 0.2) * env(0.2, 0.004, 0.05) * a
    x[int(s * SR):int(s * SR) + n] += seg[: len(x) - int(s * SR)]
save('thump', lp(x, 300))
d = 0.95; x = np.zeros(int(d * SR)); s = 0.0; gap = 0.03
while s < d - 0.01:
    i = int(s * SR); n = int(0.003 * SR); x[i:i + n] += bp(noise(0.003), 1500, 4500); s += gap; gap *= 1.09
save('ratchet', x)
d = 1.35; t = tt(d); f = 1400 * (300 / 1400) ** (t / d) * (1 + 0.03 * np.sin(2 * np.pi * 6 * t))
save('slide', np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(t / 0.04, 1) * (1 - 0.5 * t / d))
d = 0.55; x = np.zeros(int(d * SR))
for s in (0, 0.03, 0.07, 0.12):
    i = int(s * SR); n = int(0.006 * SR); x[i:i + n] += hp(noise(0.006), 2500) * (1 - s * 4)
x += 0.3 * sum(np.sin(2 * np.pi * f * tt(d)) for f in (3100, 4700)) * env(d, 0.001, 0.12)
save('crack', x)
d = 1.0; x = np.zeros(int(d * SR))
for k in range(int(d * 17)):
    i = int(k / 17 * SR); n = int(0.006 * SR); x[i:i + n] += bp(noise(0.006), 1800, 5000)
save('chatter', x * np.sin(np.pi * tt(d) / d))
d = 0.42; save('fall', sweep(1800, 650, d) * np.minimum(tt(d) / 0.03, 1) * (1 - 0.4 * tt(d) / d))
d = 0.8; save('thud', sweep(80, 38, d) * env(d, 0.003, 0.16) + 0.6 * lp(noise(d), 220) * env(d, 0.002, 0.07) + 0.15 * bp(noise(d), 600, 1400) * env(d, 0.001, 0.03))
d = 0.65; x = lp(noise(d), 600) * env(d, 0.02, 0.08) * 0.8
i = int(0.0 * SR); n = int(0.005 * SR); x[i:i + n] += hp(noise(0.005), 2000)
x += 0.5 * hp(noise(d), 2500) * np.exp(-((tt(d) - 0.3) / 0.12) ** 2)
save('door', x)
d = 1.4; save('mist', hp(noise(d), 3000) * np.sin(np.pi * tt(d) / d) ** 1.2)
d = 1.7; t = tt(d)
save('ding', sum(a * np.sin(2 * np.pi * 1046 * r * t) * np.exp(-t / tau) for r, a, tau in [(1, 1, 0.9), (2.76, 0.5, 0.4), (5.4, 0.3, 0.2), (8.93, 0.15, 0.1)]))
d = 1.0; x = np.zeros(int(d * SR))
for k, f in enumerate([1568, 2093, 2637, 3136, 4186]):
    s = int(k * 0.08 * SR); n = len(x) - s
    x[s:] += 0.6 * np.sin(2 * np.pi * f * np.arange(n) / SR) * np.exp(-np.arange(n) / SR / 0.15)
save('sparkle', x)
print('ok')
