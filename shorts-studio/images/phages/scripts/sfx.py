"""sfx.py - synthesised cartoon sound effects (no sound library / Higgsfield on this machine).
Every file: 48 kHz mono 16-bit, peak-normalised to -1 dBFS, onset at ~0 s unless noted. Replace any of them with
library sounds of the same name later; levels and timing live in src/phages/sound.ts."""
import os
import wave

import numpy as np

SR = 48000
OUT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "public", "phages", "sfx"))
rng = np.random.default_rng(7)


def t_(d):
    return np.arange(int(d * SR)) / SR


def env(n, a, r, shape=2.0):
    """attack a s, then decay to the end with curvature shape"""
    e = np.ones(n)
    na = max(1, int(a * SR))
    e[:na] = np.linspace(0, 1, na)
    nr = n - na
    if nr > 0:
        e[na:] = (1 - np.linspace(0, 1, nr)) ** shape
    return e


def lp(x, cut):
    """one-pole low-pass, cut may be an array (Hz per sample)"""
    cut = np.broadcast_to(np.asarray(cut, float), x.shape)
    a = np.exp(-2 * np.pi * cut / SR)
    y = np.zeros_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc = (1 - a[i]) * x[i] + a[i] * acc
        y[i] = acc
    return y


def hp(x, cut):
    return x - lp(x, cut)


def bp(x, lo, hi):
    return hp(lp(x, hi), lo)


def sweep(f0, f1, d, curve=1.0):
    u = np.linspace(0, 1, int(d * SR)) ** curve
    f = f0 + (f1 - f0) * u
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def save(name, x):
    x = np.asarray(x, float)
    fade = min(len(x), int(0.004 * SR))
    x[-fade:] *= np.linspace(1, 0, fade)
    x = x / (np.abs(x).max() + 1e-9) * 10 ** (-1 / 20)
    with wave.open(os.path.join(OUT, f"{name}.wav"), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())


def whoosh(d, f_lo, f_hi, peak=0.55):
    n = int(d * SR)
    u = np.linspace(0, 1, n)
    e = np.where(u < peak, (u / peak) ** 2, ((1 - u) / (1 - peak)) ** 1.6)
    cut = f_lo + (f_hi - f_lo) * np.sin(np.pi * np.clip(u / (2 * peak), 0, 1)) ** 2
    x = bp(rng.standard_normal(n), cut * 0.35, cut)
    return x * e


def main():
    os.makedirs(OUT, exist_ok=True)
    save("whoosh_s", whoosh(0.32, 600, 3200, 0.5))
    save("whoosh_l", whoosh(0.75, 400, 2600, 0.55))
    save("swish", whoosh(0.22, 1200, 6000, 0.4))
    # hop: quick rising blip
    d = 0.11
    save("hop", sweep(380, 900, d, 0.7) * env(int(d * SR), 0.004, 1, 1.5))
    # plop / small landing
    d = 0.14
    save("plop", (sweep(520, 180, d, 0.5) + 0.3 * lp(rng.standard_normal(int(d * SR)), 900)) * env(int(d * SR), 0.002, 1, 2.5))
    # boing: spring with vibrato and pitch drop
    d = 0.55
    tt = t_(d)
    f = 260 * (1 - 0.35 * tt / d) * (1 + 0.18 * np.sin(2 * np.pi * 15 * tt) * np.exp(-3 * tt))
    save("boing", np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(tt), 0.003, 1, 1.4) + 0.15 * np.sin(2 * np.pi * np.cumsum(2 * f) / SR) * env(len(tt), 0.003, 1, 3))
    # pop: sharp down-sweep + click
    d = 0.12
    n = int(d * SR)
    click = np.zeros(n)
    click[:int(0.004 * SR)] = rng.standard_normal(int(0.004 * SR))
    save("pop", sweep(1100, 160, d, 0.35) * env(n, 0.001, 1, 3) + 0.6 * hp(click, 1500))
    # poof: soft noise burst
    d = 0.45
    n = int(d * SR)
    save("poof", lp(rng.standard_normal(n), np.linspace(2500, 500, n)) * env(n, 0.01, 1, 2.2))
    # squish (inject / squeeze)
    d = 0.22
    tt = t_(d)
    f = 140 + 90 * np.sin(2 * np.pi * 9 * tt)
    save("squish", (np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.7 + 0.5 * lp(rng.standard_normal(len(tt)), 700)) * env(len(tt), 0.01, 1, 1.8))
    # swell: rising whine while something inflates
    d = 0.5
    save("swell", sweep(260, 950, d, 1.6) * env(int(d * SR), 0.15, 1, 0.4) * 0.8)
    # sparkle: little arpeggio (eyes pop open)
    out = np.zeros(int(0.45 * SR))
    for k, fq in enumerate([1568, 2093, 2637, 3136]):
        s = int(k * 0.05 * SR)
        tt = t_(0.25)
        out[s:s + len(tt)] += np.sin(2 * np.pi * fq * tt) * np.exp(-14 * tt)
    save("sparkle", out)
    # click + ding (the right match)
    n = int(0.06 * SR)
    c = np.zeros(n)
    for s in (0, int(0.035 * SR)):
        c[s:s + 120] += rng.standard_normal(120) * np.linspace(1, 0, 120)
    save("click", hp(c, 2000))
    tt = t_(0.9)
    save("ding", (np.sin(2 * np.pi * 1318.5 * tt) + 0.4 * np.sin(2 * np.pi * 2637 * tt) + 0.15 * np.sin(2 * np.pi * 3955 * tt)) * np.exp(-4.2 * tt))
    # thud
    d = 0.3
    tt = t_(d)
    save("thud", (np.sin(2 * np.pi * np.cumsum(110 * np.exp(-tt * 6) + 45) / SR) + 0.25 * lp(rng.standard_normal(len(tt)), 400)) * env(len(tt), 0.002, 1, 3))
    # strike: bowling clatter (several knocks)
    out = np.zeros(int(0.6 * SR))
    for k in range(9):
        s = int(rng.uniform(0, 0.32) * SR)
        dd = rng.uniform(0.05, 0.12)
        nn = int(dd * SR)
        fq = rng.uniform(500, 1400)
        knock = (np.sin(2 * np.pi * fq * t_(dd)) * 0.6 + bp(rng.standard_normal(nn), 800, 4000)) * env(nn, 0.001, 1, 3)
        out[s:s + nn] += knock * rng.uniform(0.5, 1)
    tt = t_(0.25)
    out[:len(tt)] += 1.4 * np.sin(2 * np.pi * np.cumsum(90 * np.exp(-tt * 9) + 50) / SR) * np.exp(-12 * tt)
    save("strike", out)
    # roll: low rumble bed (2 s)
    d = 2.0
    n = int(d * SR)
    tt = t_(d)
    r = lp(rng.standard_normal(n), 180) * (1 + 0.5 * np.sin(2 * np.pi * 7 * tt))
    save("roll", r * env(n, 0.08, 1, 0.7))
    # whistle: innocent two-note "fwee-fwoo"
    d = 0.95
    tt = t_(d)
    f = np.where(tt < 0.42, 1250 + 300 * np.clip(tt / 0.12, 0, 1), 1200 - 250 * np.clip((tt - 0.42) / 0.4, 0, 1))
    f = f * (1 + 0.012 * np.sin(2 * np.pi * 6 * tt))
    e = env(len(tt), 0.04, 1, 0.6) * np.where(np.abs(tt - 0.44) < 0.03, 0.25, 1.0)
    save("whistle", (np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.05 * hp(rng.standard_normal(len(tt)), 3000)) * e)
    # plink: sweat drop
    d = 0.18
    save("plink", sweep(1900, 1250, d, 0.5) * env(int(d * SR), 0.002, 1, 2.5))
    # flash: camera flash pop + whine
    d = 0.5
    n = int(d * SR)
    tt = t_(d)
    save("flash", hp(rng.standard_normal(n), 2500) * np.exp(-30 * tt) + 0.25 * np.sin(2 * np.pi * np.cumsum(3000 + 2000 * tt) / SR) * np.exp(-6 * tt))
    # projector: film projector clatter bed (3.4 s), 24 clicks per second + hum
    d = 3.4
    n = int(d * SR)
    tt = t_(d)
    x = 0.15 * np.sin(2 * np.pi * 50 * tt) + 0.1 * lp(rng.standard_normal(n), 300)
    for k in range(int(d * 24)):
        s = int(k / 24 * SR)
        x[s:s + 200] += hp(rng.standard_normal(200), 1500) * np.linspace(1, 0, 200) * (0.6 if k % 2 else 0.9)
    save("projector", x * env(n, 0.15, 1, 0.15))
    # pop-in (small things appear)
    d = 0.09
    save("popin", sweep(600, 1500, d, 0.6) * env(int(d * SR), 0.002, 1, 2))
    # slide: squishy slide in
    d = 0.6
    n = int(d * SR)
    save("slide", bp(rng.standard_normal(n), 200, 900) * env(n, 0.1, 1, 1.2) * (1 + 0.6 * np.sin(2 * np.pi * 11 * t_(d))))
    print("sfx ->", OUT, sorted(os.listdir(OUT)))


if __name__ == "__main__":
    main()
