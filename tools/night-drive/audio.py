#!/usr/bin/env python3
"""Ambient sound bed for the night-drive video, synthesized from code (no licensed samples).

Layers: rain on the cab, diesel drone, wet-tyre hiss, wipers locked to the picture,
oncoming trucks (approach, pass on the left, spray on the glass).

Usage: python3 audio.py <config.json> <out.wav>
"""
import json
import sys

import numpy as np
import soundfile as sf
from scipy import signal

SR = 48000
rng = np.random.default_rng(11)


def sos(kind, f, order=2):
    return signal.butter(order, f, kind, fs=SR, output="sos")


def filt(x, kind, f, order=2):
    return signal.sosfilt(sos(kind, f, order), x)


def pink(n):
    # Voss-McCartney approximation via filtered white noise
    w = rng.standard_normal(n)
    b = [0.049922035, -0.095993537, 0.050612699, -0.004408786]
    a = [1, -2.494956002, 2.017265875, -0.522189400]
    return signal.lfilter(b, a, w)


def norm(x, peak=1.0):
    m = np.max(np.abs(x)) + 1e-9
    return x / m * peak


def smooth_noise(n, rate_hz, seed):
    r = np.random.default_rng(seed)
    k = max(4, int(n / SR * rate_hz) + 4)
    pts = r.standard_normal(k)
    xs = np.linspace(0, k - 3, n)
    i = np.floor(xs).astype(int)
    f = xs - i
    f = f * f * (3 - 2 * f)
    return pts[i] * (1 - f) + pts[i + 1] * f


def rain(n):
    out = np.zeros((n, 2))
    gust = 1.0 + 0.18 * smooth_noise(n, 0.25, 3)
    for ch in range(2):
        bed = filt(pink(n), "bandpass", [350, 7000])
        bed = norm(bed) * 0.30
        hiss = norm(filt(rng.standard_normal(n), "highpass", 5000)) * 0.05
        out[:, ch] = (bed + hiss) * gust
    # individual drops hitting roof and glass
    rate = 420
    count = int(n / SR * rate)
    pos = rng.integers(0, n - 2000, count)
    tick = np.zeros((n, 2))
    env = np.exp(-np.arange(900) / (SR * 0.0025))
    for p in pos:
        a = rng.uniform(0.02, 0.12)
        pan = rng.uniform(0.15, 0.85)
        burst = rng.standard_normal(900) * env * a
        tick[p:p + 900, 0] += burst * (1 - pan)
        tick[p:p + 900, 1] += burst * pan
    for ch in range(2):
        tick[:, ch] = filt(tick[:, ch], "bandpass", [900, 9000])
    return out + tick * 0.9


def engine(n):
    t = np.arange(n) / SR
    rpm = 1450 + 25 * smooth_noise(n, 0.15, 5)
    f0 = rpm / 60 / 2  # half-order for a four-stroke
    phase = 2 * np.pi * np.cumsum(f0) / SR
    x = np.zeros(n)
    for h, amp in [(1, 0.5), (2, 0.35), (3, 0.6), (4, 0.25), (6, 0.45), (9, 0.15), (12, 0.1)]:
        x += amp * np.sin(h * phase + rng.uniform(0, 6.28))
    x *= 1 + 0.06 * smooth_noise(n, 3.0, 6)
    x = filt(x, "lowpass", 260, 4)
    rumble = norm(filt(rng.standard_normal(n), "lowpass", 90, 4)) * 0.5
    y = norm(x) * 0.8 + rumble
    return np.stack([y, y * 0.96], axis=1)


def tyres(n):
    a = norm(filt(rng.standard_normal(n), "bandpass", [800, 4500])) * 0.5
    b = norm(filt(rng.standard_normal(n), "bandpass", [70, 350])) * 0.6
    s = 1 + 0.1 * smooth_noise(n, 0.6, 8)
    y = (a + b) * s
    return np.stack([y, np.roll(y, 220)], axis=1)


def wipers(n, period, stroke, offset=0.0):
    out = np.zeros((n, 2))
    t = np.arange(n) / SR + offset
    ph = np.mod(t, period)
    swish_env = np.where(ph < 2 * stroke, np.sin(np.pi * np.mod(ph, stroke) / stroke) ** 1.5, 0.0)
    rub = filt(rng.standard_normal(n), "bandpass", [1200, 3800])
    squeak = np.sin(2 * np.pi * np.cumsum(1900 + 300 * np.sin(2 * np.pi * ph / stroke)) / SR)
    sw = norm(rub) * 0.55 + squeak * 0.04
    sw *= swish_env
    # a soft thunk when the blade reverses at the top and parks at the bottom
    thunk = np.zeros(n)
    L = int(0.12 * SR)
    tt = np.arange(L) / SR
    th = (np.sin(2 * np.pi * 68 * tt) * np.exp(-tt / 0.035) + 0.3 * rng.standard_normal(L) * np.exp(-tt / 0.006))
    k = 0
    while True:
        for off, amp in [(stroke, 0.6), (2 * stroke, 0.9)]:
            p = int((k * period + off - offset) * SR)
            if 0 <= p and p + L < n:
                thunk[p:p + L] += th * amp
        k += 1
        if k * period > n / SR:
            break
    thunk = filt(thunk, "lowpass", 900)
    y = sw * 0.5 + norm(thunk) * 0.55
    out[:, 0] = y * 0.85  # driver's wiper is on the left
    out[:, 1] = y * 0.55
    return out


def trucks(n, times, speed=20.0, tspeed=22.0):
    out = np.zeros((n, 2))
    t = np.arange(n) / SR
    for tm in times:
        dt = t - tm
        d = np.sqrt((dt * (speed + tspeed)) ** 2 + 3.2 ** 2)
        amp = 1.0 / (1 + (d / 9.0) ** 2)
        # doppler on the truck's engine/tyre roar
        vrel = -(speed + tspeed) * np.tanh(dt * (speed + tspeed) / 6.0)
        f_scale = 343 / (343 + vrel)
        f0 = 72 * f_scale
        ph = 2 * np.pi * np.cumsum(f0) / SR
        roar = sum(a * np.sin(h * ph) for h, a in [(1, 0.6), (2, 0.4), (3, 0.5), (5, 0.2)])
        roar = filt(roar, "lowpass", 400)
        whoosh = filt(rng.standard_normal(n), "bandpass", [250, 3500])
        x = (norm(roar) * 0.5 + norm(whoosh) * 0.9) * amp
        out[:, 0] += x * 0.95
        out[:, 1] += x * 0.45
        # spray slapping the windshield
        sp_t = tm + 0.3
        p = int(sp_t * SR)
        L = int(1.6 * SR)
        if 0 <= p < n - L:
            e = np.exp(-np.arange(L) / (SR * 0.35)) * (1 - np.exp(-np.arange(L) / (SR * 0.01)))
            spray = filt(rng.standard_normal(L), "bandpass", [600, 9000]) * e
            out[p:p + L, 0] += norm(spray) * 0.55
            out[p:p + L, 1] += norm(spray) * 0.35
    return out


def main():
    cfg = json.load(open(sys.argv[1]))
    out_path = sys.argv[2]
    n = int(cfg["duration"] * SR)
    mix = (
        rain(n) * 0.55
        + engine(n) * 0.30
        + tyres(n) * 0.16
        + wipers(n, cfg.get("wiperPeriod", 2.8), cfg.get("wiperStroke", 0.85), cfg.get("wiperOffset", 0.0)) * 0.20
        + trucks(n, cfg.get("trucks", []), cfg.get("speed", 20)) * 0.75
    )
    # cab interior: tame the top end a little, gentle fades
    for ch in range(2):
        mix[:, ch] = filt(mix[:, ch], "lowpass", 11000)
    fade = int(1.5 * SR)
    mix[:fade] *= np.linspace(0, 1, fade)[:, None]
    mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
    mix = mix / (np.max(np.abs(mix)) + 1e-9) * 0.7
    sf.write(out_path, mix.astype(np.float32), SR, subtype="PCM_24")
    print("wrote", out_path, f"{n / SR:.1f}s")


if __name__ == "__main__":
    main()
