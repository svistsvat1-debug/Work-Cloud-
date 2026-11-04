"""Procedural sound effects (free, no library needed).

Usage: python3 -I tools/sfx.py   -> public/birdwire/sfx/*.wav (48 kHz mono, peak -1 dBFS)
"""
import os

import numpy as np
import soundfile as sf
from scipy import signal

SR = 48000
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public/birdwire/sfx")
rng = np.random.default_rng(7)


def t_(d):
    return np.arange(int(d * SR)) / SR


def env(n, a, r, shape=2.0):
    """attack a s, then decay to 0 by the end with power curve"""
    x = np.ones(n)
    na = max(1, int(a * SR))
    x[:na] = np.linspace(0, 1, na)
    nr = n - na
    if nr > 0:
        x[na:] = (1 - np.linspace(0, 1, nr)) ** shape
    return x * (r if r else 1)


def sweep(f0, f1, d, kind="exp"):
    t = t_(d)
    if kind == "exp":
        f = f0 * (f1 / f0) ** (t / d)
    else:
        f = f0 + (f1 - f0) * t / d
    return np.sin(2 * np.pi * np.cumsum(f) / SR), f


def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], btype="band", fs=SR, output="sos")
    return signal.sosfilt(sos, x)


def lp(x, f, order=2):
    sos = signal.butter(order, f, btype="low", fs=SR, output="sos")
    return signal.sosfilt(sos, x)


def hp(x, f, order=2):
    sos = signal.butter(order, f, btype="high", fs=SR, output="sos")
    return signal.sosfilt(sos, x)


def save(name, x):
    x = np.asarray(x, np.float64)
    x = x - x.mean()
    fade = min(len(x) // 4, int(0.004 * SR))
    x[:fade] *= np.linspace(0, 1, fade)
    x[-fade:] *= np.linspace(1, 0, fade)
    x = x / (np.abs(x).max() + 1e-12) * 10 ** (-1 / 20)
    sf.write(os.path.join(OUT, name + ".wav"), x.astype(np.float32), SR, subtype="PCM_16")


def hum(d):
    t = t_(d)
    base = sum(a * np.sin(2 * np.pi * f * t + p) for f, a, p in [(60, 1, 0), (120, 0.6, 1), (180, 0.35, 2), (240, 0.2, 0.5), (300, 0.1, 1.3)])
    buzz = np.tanh(2.5 * base) * (1 + 0.15 * np.sin(2 * np.pi * 0.33 * t))
    return buzz + 0.05 * hp(rng.standard_normal(len(t)), 3000)


def chirp():
    out = np.zeros(int(0.32 * SR))
    for k, (f0, f1) in enumerate([(2600, 4300), (3000, 4700)]):
        s, _ = sweep(f0, f1, 0.075)
        s *= np.sin(np.linspace(0, np.pi, len(s))) ** 1.5
        i = int(k * 0.12 * SR)
        out[i : i + len(s)] += s
    return out


def zip_(d=0.42):
    n = int(d * SR)
    t = t_(d)
    f = 300 * (2200 / 300) ** (t / d)
    saw = signal.sawtooth(2 * np.pi * np.cumsum(f) / SR)
    noise = bp(rng.standard_normal(n), 1500, 7000)
    crackle = np.zeros(n)
    idx = rng.integers(0, n, 40)
    crackle[idx] = rng.uniform(-1, 1, 40)
    crackle = bp(crackle, 2000, 9000) * 6
    e = np.sin(np.linspace(0, np.pi, n)) ** 1.2
    return (0.35 * lp(saw, 5000) + 0.5 * noise + crackle) * e


def pop():
    s, _ = sweep(1100, 260, 0.1)
    e = env(len(s), 0.002, 1, 2.5)
    click = np.zeros(len(s))
    click[:60] = np.hanning(60)
    return s * e + 0.3 * click


def poof():
    n = int(0.45 * SR)
    x = rng.standard_normal(n)
    x = bp(x, 250, 2200)
    return x * env(n, 0.012, 1, 2.2)


def squeak():
    d = 0.14
    t = t_(d)
    f = 1700 + 500 * np.sin(2 * np.pi * 14 * t)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR)
    return s * np.sin(np.linspace(0, np.pi, len(t)))


def whoosh(d=0.7):
    n = int(d * SR)
    x = rng.standard_normal(n)
    out = np.zeros(n)
    hop = 512
    centers = 350 + 1500 * np.sin(np.linspace(0, np.pi, n // hop + 1)) ** 2
    zi = None
    for k in range(0, n, hop):
        c = centers[k // hop]
        sos = signal.butter(2, [c * 0.6, c * 1.6], btype="band", fs=SR, output="sos")
        if zi is None:
            zi = np.zeros((sos.shape[0], 2))
        y, zi = signal.sosfilt(sos, x[k : k + hop], zi=zi)
        out[k : k + hop] = y
    return out * np.sin(np.linspace(0, np.pi, n)) ** 1.6


def ding():
    t = t_(0.3)
    s = np.sin(2 * np.pi * 1320 * t) + 0.5 * np.sin(2 * np.pi * 1980 * t) + 0.25 * np.sin(2 * np.pi * 2640 * t)
    return s * env(len(t), 0.003, 1, 3)


def whistle():
    parts = []
    for f, d in [(1750, 0.16), (2350, 0.26)]:
        t = t_(d)
        ff = f * (1 + 0.012 * np.sin(2 * np.pi * 6 * t))
        s = np.sin(2 * np.pi * np.cumsum(ff) / SR) + 0.05 * rng.standard_normal(len(t))
        parts.append(s * np.sin(np.linspace(0, np.pi, len(t))) ** 0.6)
        parts.append(np.zeros(int(0.03 * SR)))
    return np.concatenate(parts)


def flaps(k=4, gap=0.12):
    n = int((k * gap + 0.15) * SR)
    out = np.zeros(n)
    for i in range(k):
        m = int(0.08 * SR)
        b = lp(rng.standard_normal(m), 900) * env(m, 0.01, 1, 2)
        j = int(i * gap * SR)
        out[j : j + m] += b * (0.8 + 0.2 * rng.random())
    return out


def twang():
    """Karplus-Strong pluck, low and wobbly (a wire bouncing)."""
    d = 1.1
    n = int(d * SR)
    f = 82
    p = int(SR / f)
    buf = rng.uniform(-1, 1, p)
    out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]
        buf[i % p] = 0.996 * 0.5 * (buf[i % p] + buf[(i + 1) % p])
    t = t_(d)
    wob = np.sin(2 * np.pi * (120 + 30 * np.exp(-3 * t) * np.sin(2 * np.pi * 7 * t)) * t)
    return lp(out, 2500) + 0.25 * wob * np.exp(-4 * t)


def tick():
    n = int(0.06 * SR)
    x = np.zeros(n)
    x[0:30] = rng.uniform(-1, 1, 30)
    x[400:420] = rng.uniform(-1, 1, 20) * 0.6
    return hp(x, 1500) * env(n, 0.0005, 1, 3)


def zap():
    d = 0.95
    n = int(d * SR)
    t = t_(d)
    sq = signal.square(2 * np.pi * 110 * t) * (0.6 + 0.4 * np.sin(2 * np.pi * 31 * t))
    sq2 = signal.square(2 * np.pi * 165 * t + 0.3) * 0.5
    noise = bp(rng.standard_normal(n), 800, 9000)
    crackle = np.zeros(n)
    idx = rng.integers(0, n, 160)
    crackle[idx] = rng.uniform(-1, 1, 160)
    crackle = hp(crackle, 1200) * 8
    body = np.tanh(1.8 * (lp(sq + sq2, 4000) + 0.6 * noise + crackle))
    e = np.ones(n)
    e[: int(0.004 * SR)] = np.linspace(0, 1, int(0.004 * SR))
    tail = int(0.35 * SR)
    e[-tail:] = np.linspace(1, 0, tail) ** 2
    crack = np.zeros(n)
    m = int(0.05 * SR)
    crack[:m] = rng.uniform(-1, 1, m) * np.exp(-np.linspace(0, 8, m))
    boom_t = t_(0.5)
    boom = np.sin(2 * np.pi * (70 * np.exp(-2 * boom_t)) * boom_t) * np.exp(-6 * boom_t)
    out = body * e + 1.4 * crack
    out[: len(boom)] += 0.9 * boom
    return out


def sizzle(d=2.6):
    n = int(d * SR)
    x = hp(rng.standard_normal(n), 3500) * 0.4
    crackle = np.zeros(n)
    idx = rng.integers(0, n, 90)
    crackle[idx] = rng.uniform(-1, 1, 90)
    x += bp(crackle, 1500, 8000) * 5
    return x * env(n, 0.05, 1, 1.5)


def cough():
    n = int(0.42 * SR)
    out = np.zeros(n)
    for j, a in [(0, 1.0), (int(0.17 * SR), 0.7)]:
        m = int(0.12 * SR)
        b = bp(rng.standard_normal(m), 300, 1600) * env(m, 0.006, 1, 2.5) * a
        out[j : j + m] += b
    return out


def main():
    os.makedirs(OUT, exist_ok=True)
    save("hum", hum(24.5))
    save("chirp", chirp())
    save("zip", zip_())
    save("pop", pop())
    save("poof", poof())
    save("squeak", squeak())
    save("whoosh", whoosh())
    save("ding", ding())
    save("whistle", whistle())
    save("flaps", flaps(4))
    save("flaps6", flaps(6, 0.11))
    save("twang", twang())
    save("tick", tick())
    save("zap", zap())
    save("sizzle", sizzle())
    save("cough", cough())
    print(sorted(os.listdir(OUT)))


if __name__ == "__main__":
    main()
