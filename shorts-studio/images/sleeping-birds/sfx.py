"""Synthesize the sound effects (no sound library in the cloud session). 48 kHz mono 16-bit, peak -1 dBFS.
Impacts have their onset at t=0; whooshes peak at ~60 % of their length."""
import numpy as np, soundfile as sf
from scipy import signal
SR = 48000
OUT = '../../public/sleeping-birds/sfx'
rng = np.random.default_rng(7)

def t_(d): return np.arange(int(d * SR)) / SR
def env(n, a, d, shape=2.0):
    """attack a (s), then exponential-ish decay over d (s)"""
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4))
    return e * np.exp(-np.maximum(0, t - a) / max(d, 1e-4) * shape)
def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], 'bandpass', fs=SR, output='sos'); return signal.sosfilt(sos, x)
def lp(x, f, order=2):
    sos = signal.butter(order, f, 'lowpass', fs=SR, output='sos'); return signal.sosfilt(sos, x)
def hp(x, f, order=2):
    sos = signal.butter(order, f, 'highpass', fs=SR, output='sos'); return signal.sosfilt(sos, x)
def sweep_filter(x, f0, f1, kind='lp', blocks=60):
    """time-varying filter by overlapped blocks (cheap but smooth enough)"""
    n = len(x); out = np.zeros(n); win = np.hanning(2 * (n // blocks) + 2)
    hop = n // blocks
    for i in range(blocks + 1):
        c = min(n - 1, i * hop); f = f0 * (f1 / f0) ** (i / blocks)
        a, b = max(0, c - hop), min(n, c + hop)
        seg = x[a:b]
        y = lp(seg, f) if kind == 'lp' else bp(seg, f * 0.6, min(f * 1.6, SR / 2 - 100))
        w = np.hanning(len(seg)); out[a:b] += y * w
    return out
def chirp(d, f0, f1, curve='log'):
    t = t_(d)
    if curve == 'log': f = f0 * (f1 / f0) ** (t / d)
    else: f = f0 + (f1 - f0) * t / d
    return np.sin(2 * np.pi * np.cumsum(f) / SR)
def save(name, x):
    x = x / (np.abs(x).max() + 1e-9) * 10 ** (-1 / 20)
    fade = min(len(x), int(0.004 * SR)); x[-fade:] *= np.linspace(1, 0, fade)
    sf.write(f'{OUT}/{name}.wav', x.astype(np.float32), SR, subtype='PCM_16')
    print(name, round(len(x) / SR, 2))
noise = lambda d: rng.standard_normal(int(d * SR))

# wind gust: band noise, slow swell, a whistle-ish resonance
d = 2.6; n = noise(d); t = t_(d)
w = sweep_filter(n, 350, 1100, 'bp', 50) * 0.8 + bp(n, 150, 500) * 0.5
e = np.clip(t / 0.7, 0, 1) ** 1.5 * np.clip((d - t) / 1.0, 0, 1) ** 1.2 * (1 + 0.25 * np.sin(2 * np.pi * 1.25 * t))
save('wind', w * e)
# whoosh (short) and soft glide whoosh
for name, d, f0, f1 in [('whoosh', 0.7, 300, 3200), ('whoosh_soft', 1.1, 200, 1400)]:
    t = t_(d); x = sweep_filter(noise(d), f0, f1, 'lp', 40)
    pk = 0.6 * d; e = np.where(t < pk, (t / pk) ** 2.2, np.exp(-(t - pk) / (0.18 * d / 0.7)))
    save(name, x * e)
# leaf rustle: crackly high noise grains
d = 0.55; x = hp(noise(d), 2500); g = np.zeros_like(x)
for k in range(26):
    c = int(rng.uniform(0, d * 0.85) * SR); L = int(rng.uniform(0.004, 0.02) * SR)
    g[c:c + L] += np.hanning(L)[: len(g[c:c + L])] * rng.uniform(0.3, 1)
save('rustle', x * g * env(len(x), 0.05, 0.3, 1.5))
# bonk: woody tok
d = 0.35; t = t_(d)
x = np.sin(2 * np.pi * np.cumsum(520 * (0.72 + 0.28 * np.exp(-t / 0.03))) / SR) * env(len(t), 0.001, 0.07)
x += 0.5 * np.sin(2 * np.pi * 1310 * t) * env(len(t), 0.001, 0.03) + 0.4 * bp(noise(d), 800, 4000) * env(len(t), 0.0005, 0.008)
save('bonk', x)
# scanner sweeps
d = 0.75; t = t_(d)
x = chirp(d, 260, 1500) * (0.6 + 0.4 * np.sin(2 * np.pi * 28 * t)) * np.sin(np.pi * t / d) ** 0.7
x += 0.25 * hp(noise(d), 4000) * np.sin(np.pi * t / d)
save('scan_down', x); save('scan_up', x[::-1].copy())
# x-ray hum bed (17 s, with fades)
d = 17.0; t = t_(d)
x = sum(a * np.sin(2 * np.pi * f * t + p) for a, f, p in [(1, 110, 0), (0.5, 220, 1), (0.25, 330, 2), (0.12, 880, 0.5)])
x = x * (0.8 + 0.2 * np.sin(2 * np.pi * 0.7 * t)) + 0.15 * bp(noise(d), 1500, 5000)
x *= np.clip(t / 0.8, 0, 1) * np.clip((d - t) / 0.8, 0, 1)
save('hum', x)
# tendon draw: rising soft zip tone
d = 0.42; t = t_(d)
x = lp(signal.sawtooth(2 * np.pi * np.cumsum(260 * (3.2 ** (t / d))) / SR), 2200) * np.sin(np.pi * t / d) ** 0.8
save('fwip', x)
# ping (heel highlight)
d = 0.7; t = t_(d)
save('ping', (np.sin(2 * np.pi * 1320 * t) + 0.3 * np.sin(2 * np.pi * 2640 * t) + 0.15 * np.sin(2 * np.pi * 3960 * t)) * env(len(t), 0.003, 0.18))
# creak (crouch) and short creak (wobble)
for name, d in [('creak', 0.85), ('creak_s', 0.32)]:
    t = t_(d); f = 55 + 25 * np.sin(2 * np.pi * 1.3 * t / d)
    ph = np.cumsum(f * (1 + 0.08 * rng.standard_normal(len(t)))) / SR
    pulses = (np.sin(2 * np.pi * ph) > 0.96).astype(float)
    x = bp(pulses, 500, 1600) + 0.1 * bp(noise(d), 700, 1200)
    save(name, x * np.sin(np.pi * t / d) ** 0.6)
# click (toes / ratchet tooth)
d = 0.12; t = t_(d)
save('click', 0.8 * hp(noise(d), 3000) * env(len(t), 0.0003, 0.004) + np.sin(2 * np.pi * 2100 * t) * env(len(t), 0.0005, 0.025) + 0.5 * np.sin(2 * np.pi * 3400 * t) * env(len(t), 0.0005, 0.012))
# pop (labels) and a lower lens pop
for name, f0, f1, d in [('pop', 520, 1150, 0.18), ('pop_low', 300, 700, 0.22)]:
    t = t_(d); save(name, chirp(d, f0, f1) * env(len(t), 0.002, 0.07))
# flip (quick swish)
d = 0.26; t = t_(d); save('flip', sweep_filter(noise(d), 1500, 6000, 'bp', 20) * np.sin(np.pi * t / d) ** 2)
# shimmer (ridges)
d = 0.8; t = t_(d); x = np.zeros_like(t)
for k, f in enumerate([2093, 2637, 3136, 4186]):
    x += np.sin(2 * np.pi * f * t) * env(len(t), 0.005 + 0.06 * k, 0.25) * np.roll(np.ones_like(t), 0)
save('shimmer', x * (0.7 + 0.3 * np.sin(2 * np.pi * 9 * t)))
# zip-tie ratchet: accelerating clicks
d = 0.48; x = np.zeros(int(d * SR))
c = 0.0; gap = 0.06
cl, _ = sf.read(f'{OUT}/click.wav')
while c < d - 0.05:
    i = int(c * SR); seg = cl[: len(x) - i]; x[i:i + len(seg)] += seg * 0.8; c += gap; gap = max(0.022, gap * 0.86)
save('ratchet', x)
# boing (wake)
d = 0.55; t = t_(d)
f = 280 + 260 * (1 - np.exp(-t / 0.08)) + 30 * np.sin(2 * np.pi * 11 * t) * np.exp(-t / 0.25)
save('boing', np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.004, 0.22))
# snip: two metallic bursts
d = 0.24; t = t_(d); x = np.zeros_like(t)
for o in [0.0, 0.045]:
    i = int(o * SR); L = len(t) - i
    x[i:] += bp(noise(L / SR), 4500, 9000) * env(L, 0.0005, 0.02) + 0.6 * np.sin(2 * np.pi * 3200 * t[:L]) * env(L, 0.0005, 0.03)
save('snip', x)
# slack (tendon goes loose)
d = 0.5; t = t_(d)
f = 190 * (0.65 + 0.35 * np.exp(-t / 0.12)) * (1 + 0.06 * np.sin(2 * np.pi * 14 * t))
save('slack', np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.004, 0.2))
# end chime
d = 1.0; t = t_(d); x = np.sin(2 * np.pi * 1046.5 * t) * env(len(t), 0.004, 0.35)
i = int(0.13 * SR); x[i:] += 0.9 * np.sin(2 * np.pi * 1568 * t[: len(t) - i]) * env(len(t) - i, 0.004, 0.4)
save('chime', x)
