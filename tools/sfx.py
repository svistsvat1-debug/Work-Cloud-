#!/usr/bin/env python3
"""Synthesize the shared SFX library (royalty-free by construction: pure code).

Usage: python3 tools/sfx.py  -> studio/public/sfx/*.wav
"""
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy import signal

SR = 48000
OUT = Path(__file__).resolve().parent.parent / "studio" / "public" / "sfx"
rng = np.random.default_rng(7)


def t(sec):
    return np.arange(int(sec * SR)) / SR


def env_exp(n, decay):
    return np.exp(-np.arange(n) / (decay * SR))


def bp(x, lo, hi, order=2):
    return signal.sosfilt(signal.butter(order, [lo, hi], "bandpass", fs=SR, output="sos"), x)


def lp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, "lowpass", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, "highpass", fs=SR, output="sos"), x)


def sweep_filter(noise, f0, f1, q=1.2, curve=1.0):
    """Band-pass noise whose centre frequency sweeps f0 -> f1 (block-wise)."""
    out, block = np.zeros_like(noise), 256
    for i in range(0, len(noise), block):
        p = (i / len(noise)) ** curve
        fc = f0 * (f1 / f0) ** p
        lo, hi = fc / (1 + 1 / q), min(fc * (1 + 1 / q), SR / 2 - 100)
        sos = signal.butter(2, [lo, hi], "bandpass", fs=SR, output="sos")
        out[i:i + block] = signal.sosfilt(sos, noise[i:i + block])
    return out


def space(x, mix=0.12, length=0.35):
    ir = rng.standard_normal(int(length * SR)) * env_exp(int(length * SR), length / 5)
    wet = signal.fftconvolve(x, lp(ir, 6000))
    dry = np.concatenate([x, np.zeros(len(wet) - len(x))])
    wet /= np.max(np.abs(wet)) + 1e-9
    return dry + mix * wet * np.max(np.abs(x))


def norm(x, peak=0.9):
    x = x - np.mean(x)
    return x * peak / (np.max(np.abs(x)) + 1e-9)


def whoosh(dur, f0=250, f1=4000):
    n = len(t(dur))
    x = sweep_filter(rng.standard_normal(n), f0, f1, q=1.4)
    a = np.minimum(np.linspace(0, 1, n) / 0.65, 1) ** 2 * np.minimum((1 - np.linspace(0, 1, n)) / 0.35, 1)
    return norm(space(x * a, 0.18))


def pop():
    tt = t(0.12)
    f = 300 + 700 * np.exp(-tt / 0.012)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(len(tt), 0.03)
    x[:96] += rng.standard_normal(96) * 0.3 * np.linspace(1, 0, 96)
    return norm(space(x, 0.08))


def click():
    tt = t(0.05)
    x = np.sin(2 * np.pi * 2200 * tt) * env_exp(len(tt), 0.006)
    x += hp(rng.standard_normal(len(tt)), 3000) * env_exp(len(tt), 0.003) * 0.6
    return norm(x, 0.8)


def tick():
    n = int(0.03 * SR)
    x = bp(rng.standard_normal(n), 2500, 7000) * env_exp(n, 0.004)
    x += np.sin(2 * np.pi * 900 * t(0.03)) * env_exp(n, 0.005) * 0.4
    return norm(x, 0.6)


def riser(dur=1.2):
    tt = t(dur)
    p = tt / dur
    f = 180 * (1400 / 180) ** (p ** 1.6)
    saw = signal.sawtooth(2 * np.pi * np.cumsum(f) / SR) + signal.sawtooth(2 * np.pi * np.cumsum(f * 1.01) / SR)
    noise = sweep_filter(rng.standard_normal(len(tt)), 400, 9000, q=0.9, curve=1.5)
    x = (lp(saw, 5000) * 0.35 + noise) * p ** 2.2
    x[-int(0.01 * SR):] *= np.linspace(1, 0, int(0.01 * SR))
    return norm(x)


def impact():
    tt = t(1.1)
    f = 40 + 70 * np.exp(-tt / 0.04)
    sub = np.tanh(1.8 * np.sin(2 * np.pi * np.cumsum(f) / SR)) * env_exp(len(tt), 0.28)
    thump = lp(rng.standard_normal(len(tt)), 900) * env_exp(len(tt), 0.05)
    crack = hp(rng.standard_normal(len(tt)), 2500) * env_exp(len(tt), 0.012) * 0.5
    return norm(space(sub + thump * 0.8 + crack, 0.2, 0.6))


def glitch(dur=0.32):
    n = len(t(dur))
    x, i = np.zeros(n), 0
    while i < n:
        seg = int(rng.uniform(0.008, 0.035) * SR)
        kind = rng.integers(0, 3)
        tt = np.arange(seg) / SR
        if kind == 0:
            s = signal.square(2 * np.pi * rng.uniform(80, 1600) * tt)
        elif kind == 1:
            s = rng.standard_normal(seg)
        else:
            s = np.sin(2 * np.pi * rng.uniform(2000, 6000) * tt)
        s = np.round(s * 4) / 4  # bitcrush
        reps = rng.integers(1, 3)
        s = np.tile(s, reps)[: n - i]
        x[i:i + len(s)] = s * rng.uniform(0.4, 1.0)
        i += len(s)
    x = hp(x, 120) * np.minimum(1, (1 - np.linspace(0, 1, n)) / 0.15)
    return norm(x, 0.8)


def check():
    out = np.zeros(int(0.32 * SR))
    for k, (f, d) in enumerate([(1318.5, 0.0), (1975.5, 0.075)]):
        tt = t(0.22)
        tone = (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(4 * np.pi * f * tt)) * env_exp(len(tt), 0.06)
        s = int(d * SR)
        out[s:s + len(tt)] += tone[: len(out) - s]
    return norm(space(out, 0.15))


def error():
    tt = t(0.28)
    x = signal.square(2 * np.pi * 180 * tt) * 0.5 + signal.square(2 * np.pi * 190 * tt) * 0.5
    x = lp(x, 2200) * np.minimum(1, (1 - tt / 0.28) / 0.2)
    gate = (np.floor(tt / 0.07) % 2 == 0).astype(float)
    return norm(x * gate, 0.7)


def buzz():
    """Phone vibration: two short low rumbles."""
    out = np.zeros(int(0.5 * SR))
    for start in (0.0, 0.22):
        tt = t(0.16)
        x = signal.square(2 * np.pi * 165 * tt) * 0.6 + np.sin(2 * np.pi * 82 * tt)
        x = lp(x, 900) * np.sin(np.pi * tt / 0.16) ** 0.6
        s = int(start * SR)
        out[s:s + len(x)] += x
    return norm(out, 0.8)


def notify():
    """Soft glassy two-note chime (original, not a system sound)."""
    out = np.zeros(int(0.6 * SR))
    for f, d in ((1567.98, 0.0), (2093.0, 0.09)):
        tt = t(0.45)
        tone = (np.sin(2 * np.pi * f * tt) + 0.25 * np.sin(2 * np.pi * 2.01 * f * tt)) * env_exp(len(tt), 0.11)
        tone[:96] *= np.linspace(0, 1, 96)
        s = int(d * SR)
        out[s:s + len(tt)] += tone[: len(out) - s]
    return norm(space(out, 0.2), 0.7)


def beep():
    """Monitor flatline beep."""
    tt = t(0.9)
    x = np.sin(2 * np.pi * 988 * tt) + 0.2 * np.sin(2 * np.pi * 1976 * tt)
    x *= np.minimum(1, tt / 0.01) * np.minimum(1, (0.9 - tt) / 0.08)
    return norm(x, 0.6)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    lib = {
        "whoosh": whoosh(0.42),
        "whoosh-short": whoosh(0.26, 400, 6000),
        "whip": whoosh(0.2, 600, 9000),
        "pop": pop(),
        "click": click(),
        "tick": tick(),
        "riser": riser(1.2),
        "impact": impact(),
        "glitch": glitch(),
        "check": check(),
        "error": error(),
        "buzz": buzz(),
        "notify": notify(),
        "beep": beep(),
    }
    for name, x in lib.items():
        sf.write(OUT / f"{name}.wav", x.astype(np.float32), SR, subtype="PCM_16")
        print(f"{name:13s} {len(x) / SR:.2f}s")


if __name__ == "__main__":
    main()
