# Synthesised sound effects (free, no downloads). Every file peak-normalised to -1 dBFS, 48 kHz mono.
import sys, numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt

OUT = sys.argv[1]
SR = 48000
rng = np.random.default_rng(7)

def norm(x):
    x = x - np.mean(x)
    return (x / (np.abs(x).max() + 1e-9) * 10 ** (-1 / 20)).astype(np.float32)

def env(n, a, d, sustain=0.0, curve=4.0):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4))
    e = e * np.exp(-np.maximum(0, t - a) * curve / max(d, 1e-4)) * (1 - sustain) + sustain * (t > a)
    return e

def band(x, lo, hi, order=2):
    sos = butter(order, [lo, hi], btype='band', fs=SR, output='sos')
    return sosfilt(sos, x)

def lp(x, f, order=2):
    return sosfilt(butter(order, f, btype='low', fs=SR, output='sos'), x)

def hp(x, f, order=2):
    return sosfilt(butter(order, f, btype='high', fs=SR, output='sos'), x)

def save(name, x):
    sf.write(f"{OUT}/{name}.wav", norm(x), SR, subtype='PCM_16')

def tone_sweep(f0, f1, dur, shape='exp'):
    n = int(dur * SR); t = np.arange(n) / SR
    f = f0 * (f1 / f0) ** (t / dur) if shape == 'exp' else f0 + (f1 - f0) * t / dur
    return np.sin(2 * np.pi * np.cumsum(f) / SR)

# motor hum bed: 200 rpm motor -> electric whir + 4-blade fan flutter (13.3 Hz)
dur = 27.0; n = int(dur * SR); t = np.arange(n) / SR
whir = sum(a * np.sin(2 * np.pi * f * t + p) for a, f, p in [(1, 120, 0), (0.55, 240, 1), (0.3, 360, 2), (0.18, 600, 0.5)])
flutter = 1 + 0.18 * np.sin(2 * np.pi * 13.33 * t)
noise = band(rng.standard_normal(n), 300, 2500) * 0.35
hum = (whir * 0.5 + noise) * flutter
hum *= np.minimum(1, t / 0.05)
save('motor_hum', hum)

# motor rev: pitch rises and falls + rattle
d = 1.7; n = int(d * SR); t = np.arange(n) / SR
prof = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 0.8
f = 120 + 90 * prof
ph = 2 * np.pi * np.cumsum(f) / SR
rev = (np.sin(ph) + 0.6 * np.sin(2 * ph) + 0.35 * np.sin(3 * ph)) * 0.6 + band(rng.standard_normal(n), 400, 3000) * 0.5
rattle = (np.sin(2 * np.pi * 31 * t) > 0.6) * band(rng.standard_normal(n), 1500, 5000) * 0.5
save('rev', (rev + rattle) * prof)

# low rumble
d = 1.8; n = int(d * SR); t = np.arange(n) / SR
rum = lp(rng.standard_normal(n), 90, 4) * np.sin(np.pi * t / d) ** 1.2
save('rumble', rum)

# pop (bloop)
d = 0.2; n = int(d * SR)
save('pop', tone_sweep(950, 320, d) * env(n, 0.004, 0.09))
save('pop_small', tone_sweep(1500, 600, 0.12) * env(int(0.12 * SR), 0.003, 0.05))

# concrete thud
d = 0.5; n = int(d * SR); t = np.arange(n) / SR
thud = np.sin(2 * np.pi * (70 + 60 * np.exp(-t * 30)) * t) * np.exp(-t * 9) + lp(rng.standard_normal(n), 700) * np.exp(-t * 35) * 0.8
save('thud', thud)

# whooshes: band-passed noise sweeping up then down, envelope peaking mid
def whoosh(d, lo, hi, peak=0.5):
    n = int(d * SR); t = np.arange(n) / SR
    x = rng.standard_normal(n); out = np.zeros(n); seg = 1024
    for i in range(0, n, seg):
        u = i / n; fc = lo * (hi / lo) ** (np.sin(np.pi * u))
        out[i:i + seg] = band(x[max(0, i - 2048):i + seg], fc * 0.7, min(fc * 1.4, SR / 2 - 100))[-len(out[i:i + seg]):]
    e = np.where(t < d * peak, (t / (d * peak)) ** 2, np.exp(-(t - d * peak) / (d * (1 - peak)) * 4))
    return out * e
save('whoosh', whoosh(0.8, 250, 1800))
save('whoosh_long', whoosh(1.2, 200, 1500, 0.55))
save('swish', whoosh(0.35, 800, 4000, 0.4))

# ticks for the twelve "÷50" tags: woodblock-ish click, rising pitch
for i in range(12):
    d = 0.16; n = int(d * SR); t = np.arange(n) / SR
    f = 700 * 2 ** (i / 12 * 1.0)
    x = np.sin(2 * np.pi * f * t) * np.exp(-t * 45) + np.sin(2 * np.pi * f * 2.7 * t) * np.exp(-t * 70) * 0.5
    x += hp(rng.standard_normal(n), 3000) * np.exp(-t * 300) * 0.4
    save(f'tick{i:02d}', x)

# chime (number complete)
d = 1.6; n = int(d * SR); t = np.arange(n) / SR
ch = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t * k) for a, f, k in [(1, 1046.5, 2.2), (0.6, 1568, 2.8), (0.45, 2093, 3.5), (0.25, 3136, 5)])
ch *= np.minimum(1, t / 0.003)
save('chime', ch)

# stopwatch ticking that speeds up (time flies)
d = 3.6; n = int(d * SR); x = np.zeros(n)
tt = 0.0; k = 0
while tt < d - 0.05:
    i = int(tt * SR); m = int(0.03 * SR)
    seg = (hp(rng.standard_normal(m), 2500) * np.exp(-np.arange(m) / SR * 220))
    x[i:i + m] += seg[: len(x[i:i + m])] * (1 if k % 2 == 0 else 0.7)
    tt += max(0.06, 0.25 * (1 - tt / d) ** 1.4); k += 1
save('stopwatch', x)

# twinkle (stars): random high pings
d = 1.8; n = int(d * SR); t = np.arange(n) / SR; x = np.zeros(n)
for j in range(16):
    at = rng.uniform(0, 1.3); f = rng.choice([1760, 2093, 2349, 2637, 3136, 3520])
    i = int(at * SR); m = n - i; tt2 = np.arange(m) / SR
    x[i:] += np.sin(2 * np.pi * f * tt2) * np.exp(-tt2 * 6) * rng.uniform(0.3, 1)
save('twinkle', x)

# shimmer (galaxy): soft rising pad
d = 1.6; n = int(d * SR); t = np.arange(n) / SR
sh = sum(np.sin(2 * np.pi * f * t * (1 + 0.02 * t)) for f in [523, 659, 784, 1046]) * np.sin(np.pi * t / d) ** 2
save('shimmer', sh)

# poof
d = 0.45; n = int(d * SR); t = np.arange(n) / SR
save('poof', lp(rng.standard_normal(n), 1200) * np.exp(-t * 10) * np.minimum(1, t / 0.01))
