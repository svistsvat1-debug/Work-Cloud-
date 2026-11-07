"""Synthesised cartoon SFX (no sample library available) + mix with the voice.
Times are composition seconds (voice placed at VO = 0.1 s). Output: public/woodpecker-tongue/audio/mix.wav"""
import numpy as np, subprocess, wave

SR = 48000
DUR = 1660 / 60
VO = 0.1
rng = np.random.default_rng(7)

def t_(d): return np.arange(int(d * SR)) / SR
def env_ad(n, a, d):  # attack / exp decay (seconds)
    t = np.arange(n) / SR
    return np.minimum(t / max(a, 1e-4), 1) * np.exp(-np.maximum(t - a, 0) / d)
def sweep(f0, f1, d, curve=1.0):
    t = t_(d); u = (t / d) ** curve
    f = f0 * (f1 / f0) ** u
    return np.sin(2 * np.pi * np.cumsum(f) / SR)
def biquad_bp(x, fc, q):
    w0 = 2 * np.pi * fc / SR; al = np.sin(w0) / (2 * q)
    b = np.array([al, 0, -al]); a = np.array([1 + al, -2 * np.cos(w0), 1 - al])
    b /= a[0]; a /= a[0]
    y = np.zeros_like(x); x1 = x2 = y1 = y2 = 0.0
    for i in range(len(x)):
        yi = b[0] * x[i] + b[1] * x1 + b[2] * x2 - a[1] * y1 - a[2] * y2
        x2, x1, y2, y1 = x1, x[i], y1, yi; y[i] = yi
    return y
def bp_sweep(x, f0, f1, q, chunk=480):
    out = np.zeros_like(x); n = len(x); st = [0.0] * 4
    for c in range(0, n, chunk):
        u = c / max(n - 1, 1); fc = f0 * (f1 / f0) ** u
        w0 = 2 * np.pi * fc / SR; al = np.sin(w0) / (2 * q)
        b0, b2 = al / (1 + al), -al / (1 + al); a1 = -2 * np.cos(w0) / (1 + al); a2 = (1 - al) / (1 + al)
        x1, x2, y1, y2 = st
        seg = x[c:c + chunk]; y = np.zeros_like(seg)
        for i, xi in enumerate(seg):
            yi = b0 * xi + b2 * x2 - a1 * y1 - a2 * y2
            x2, x1, y2, y1 = x1, xi, y1, yi; y[i] = yi
        st = [x1, x2, y1, y2]; out[c:c + chunk] = y
    return out
def norm(x, peak_db=-1.0):
    return x / (np.abs(x).max() + 1e-9) * 10 ** (peak_db / 20)

# ---------------------------------------------------------------- sounds
def tok(seed=0):
    r = np.random.default_rng(seed); d = 0.12; t = t_(d); det = 1 + r.uniform(-0.04, 0.04)
    s = (np.sin(2 * np.pi * 1150 * det * t) * np.exp(-t / 0.018) + 0.6 * np.sin(2 * np.pi * 1890 * det * t) * np.exp(-t / 0.012)
         + 0.35 * np.sin(2 * np.pi * 2900 * det * t) * np.exp(-t / 0.008) + 0.8 * np.sin(2 * np.pi * 260 * det * t) * np.exp(-t / 0.03))
    n = biquad_bp(r.standard_normal(len(t)), 2500, 1.2) * np.exp(-t / 0.004)
    return norm(s + 1.5 * n)
def whoosh(d=0.5, f0=400, f1=2400, peak=0.55, q=1.4):
    x = bp_sweep(rng.standard_normal(int(d * SR)), f0, f1, q); t = t_(d) / d
    e = np.where(t < peak, (t / peak) ** 2, ((1 - t) / (1 - peak)) ** 1.5)
    return norm(x * e)
def beep(f=1320, d=0.07):
    t = t_(d); s = np.sin(2 * np.pi * f * t) + 0.15 * np.sin(6 * np.pi * f * t)
    return norm(s * np.minimum(1, np.minimum(t / 0.004, (d - t) / 0.01)))
def shimmer(d):
    t = t_(d); s = np.zeros_like(t)
    for k in range(7):
        f = rng.uniform(2200, 5200); ph = rng.uniform(0, 6.28); am = 0.5 + 0.5 * np.sin(2 * np.pi * rng.uniform(3, 9) * t + ph)
        s += np.sin(2 * np.pi * f * t + ph) * am
    s += 0.6 * bp_sweep(rng.standard_normal(len(t)), 3000, 5000, 2.0)
    e = np.minimum(1, np.minimum(t / 0.08, (d - t) / 0.12))
    return norm(s * e)
def boop(): t = t_(0.16); return norm(sweep(950, 430, 0.16, 0.7) * np.exp(-t / 0.07))
def boing():
    d = 0.42; t = t_(d); f = 300 * (1.5 ** (t / d)) * (1 + 0.08 * np.sin(2 * np.pi * 17 * t) * np.exp(-t / 0.15))
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.14))
def plip(): t = t_(0.09); return norm(sweep(900, 2300, 0.09, 0.5) * np.exp(-t / 0.035))
def pop():
    t = t_(0.08); s = sweep(320, 1000, 0.08, 0.4) * np.exp(-t / 0.03)
    return norm(s + 0.3 * rng.standard_normal(len(t)) * np.exp(-t / 0.003))
def squeak():
    d = 0.2; t = t_(d); f = 540 * (0.7 ** (t / d)) * (1 + 0.05 * np.sin(2 * np.pi * 32 * t)); ph = np.cumsum(f) / SR
    return norm((np.sin(2 * np.pi * ph) + 0.4 * np.sin(4 * np.pi * ph)) * np.minimum(1, np.minimum(t / 0.01, (d - t) / 0.05)))
def slide(f0, f1, d):
    t = t_(d); u = t / d; f = f0 * (f1 / f0) ** (u ** 0.8) * (1 + 0.012 * np.sin(2 * np.pi * 6 * t)); ph = np.cumsum(f) / SR
    s = np.sin(2 * np.pi * ph) + 0.08 * bp_sweep(rng.standard_normal(len(t)), f0, f1, 3)
    return norm(s * np.minimum(1, np.minimum(t / 0.02, (d - t) / 0.06)))
def ratchet(d=0.6, rate=38):
    out = np.zeros(int(d * SR)); click = biquad_bp(rng.standard_normal(200), 3200, 2) * np.exp(-np.arange(200) / 40)
    for i in range(int(d * rate)):
        p = int(i / rate * SR); out[p:p + 200] += click[:len(out[p:p + 200])] * (0.7 + 0.3 * rng.random())
    t = t_(d); return norm(out * np.minimum(1, (d - t) / 0.1))
def splat():
    d = 0.3; t = t_(d); n = bp_sweep(rng.standard_normal(len(t)), 1200, 300, 1.0) * np.exp(-t / 0.07)
    return norm(n + 0.7 * sweep(220, 70, d) * np.exp(-t / 0.09))
def gulp():
    a = sweep(300, 120, 0.12, 0.6) * np.exp(-t_(0.12) / 0.06); b = sweep(240, 95, 0.16, 0.6) * np.exp(-t_(0.16) / 0.07)
    s = np.concatenate([a, np.zeros(int(0.03 * SR)), b]); return norm(s * (1 + 0.5 * np.sin(np.arange(len(s)) * 2 * np.pi * 2 * 240 / SR)))
def ding():
    d = 1.4; t = t_(d); f = 1320
    s = np.sin(2 * np.pi * f * t) * np.exp(-t / 0.7) + 0.5 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / 0.35) + 0.25 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t / 0.18)
    return norm(s * np.minimum(1, t / 0.003))
def click():
    t = t_(0.03); return norm(np.sin(2 * np.pi * 3000 * t) * np.exp(-t / 0.006) + 0.5 * rng.standard_normal(len(t)) * np.exp(-t / 0.002))
def munch():
    out = []
    for k in range(3):
        n = biquad_bp(rng.standard_normal(int(0.045 * SR)), rng.uniform(900, 2400), 1.5) * env_ad(int(0.045 * SR), 0.002, 0.012)
        out += [n, np.zeros(int(0.03 * SR))]
    return norm(np.concatenate(out))
def eep():
    d = 0.14; t = t_(d); f = 1700 * (1.4 ** (t / d)) * (1 + 0.04 * np.sin(2 * np.pi * 28 * t))
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, np.minimum(t / 0.01, (d - t) / 0.04)))
def hum(d):
    t = t_(d); s = (np.sin(2 * np.pi * 60 * t) + 0.5 * np.sin(2 * np.pi * 120 * t) + 0.25 * np.sin(2 * np.pi * 180 * t)) * (0.85 + 0.15 * np.sin(2 * np.pi * 0.5 * t))
    s += 0.25 * bp_sweep(rng.standard_normal(len(t)), 900, 900, 4)
    return norm(s * np.minimum(1, np.minimum(t / 0.3, (d - t) / 0.3)))
def air(d):
    t = t_(d); s = bp_sweep(rng.standard_normal(len(t)), 500, 500, 0.4)
    return norm(s * np.minimum(1, np.minimum(t / 0.4, (d - t) / 0.4)))

# ---------------------------------------------------------------- cue list: (time, sound, dB)
cues = []
def add(t, s, db): cues.append((t, s, db))
for i, t in enumerate([0.12, 0.26, 0.40, 0.54, 0.68, 0.82]): add(t, tok(i), -15 if i % 2 == 0 else -17)
for i, t in enumerate([27.367, 27.507, 27.647]): add(t, tok(10 + i), -16)
add(0.0, air(DUR), -42)
add(0.92, whoosh(0.45, 600, 2800, 0.6), -24); add(1.33, beep(1320), -30); add(1.43, beep(1760), -30)
add(1.30, hum(1.5), -42); add(1.85, shimmer(0.65), -34)
add(2.72, whoosh(0.6, 300, 1800, 0.55, 1.0), -22)
add(3.00, hum(20.5), -41)
for a, b in [(3.95, 5.1), (5.4, 6.75), (6.9, 8.0), (9.85, 10.55)]: add(a, shimmer(b - a), -33)
add(3.93, plip(), -30); add(10.55, boop(), -22); add(10.62, boing(), -26); add(10.78, plip(), -28)
add(11.66, pop(), -24); add(11.92, whoosh(0.7, 1800, 400, 0.4, 1.0), -30)
add(12.52, squeak(), -27); add(12.98, squeak(), -27); add(13.86, squeak(), -26)
add(14.92, slide(600, 1750, 0.34), -22); add(14.92, whoosh(0.4, 500, 3000, 0.3), -26)
add(16.42, slide(900, 1300, 1.2), -34)
for t in [15.4, 15.85, 16.3, 16.75]: add(t, munch(), -31)
add(17.22, eep(), -26); add(17.36, plip(), -29); add(17.64, boing(), -28)
for i, t in enumerate([18.92, 19.04, 19.16, 19.28, 19.40, 19.52]): add(t, click(), -27)
add(20.0, splat(), -27); add(20.1, pop(), -30); add(20.24, pop(), -31); add(20.78, plip(), -26)
add(21.96, splat(), -18); add(22.03, eep(), -25)
add(22.38, ratchet(0.62), -24); add(22.38, slide(1500, 500, 0.6), -26)
add(23.06, gulp(), -17)
add(23.30, whoosh(0.4, 2400, 500, 0.3), -26); add(23.32, beep(880, 0.09), -31); add(23.43, beep(660, 0.09), -31)
add(23.55, munch(), -28); add(23.78, munch(), -29)
for t in [23.97, 24.36, 24.83]: add(t, pop(), -23)
add(25.62, pop(), -22); add(25.80, whoosh(0.25, 800, 1600, 0.6), -32)
add(26.04, tok(20), -15); add(26.05, click(), -20); add(26.32, ding(), -21)
add(26.97, whoosh(0.35, 2000, 600, 0.3), -30)

n = int(DUR * SR)
bus = np.zeros(n)
for t, s, db in cues:
    p = int(t * SR); seg = s[:max(0, n - p)] * 10 ** (db / 20); bus[p:p + len(seg)] += seg

raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', 'images/woodpecker-tongue/vo/take1.mp3', '-f', 's16le', '-ac', '1', '-ar', str(SR), '-'],
                     capture_output=True, check=True).stdout
vo = np.frombuffer(raw, np.int16).astype(np.float64) / 32768
voice = np.zeros(n); p = int(VO * SR); voice[p:p + len(vo)] = vo[:n - p]
mix = voice + bus
peak = np.abs(mix).max()
print('voice peak dBFS %.1f  sfx peak dBFS %.1f  mix peak dBFS %.1f' % (20 * np.log10(np.abs(voice).max()), 20 * np.log10(np.abs(bus).max()), 20 * np.log10(peak)))
if peak > 10 ** (-1 / 20): mix *= 10 ** (-1 / 20) / peak
for name, sig in [('mix', mix), ('sfx', bus)]:
    st = (np.clip(np.stack([sig, sig], 1), -1, 1) * 32767).astype(np.int16)
    with wave.open(f'public/woodpecker-tongue/audio/{name}.wav', 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes())
print('written', n / SR, 's,', len(cues), 'cues')
