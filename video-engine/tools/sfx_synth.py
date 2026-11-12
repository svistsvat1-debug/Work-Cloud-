"""Code-synthesized SFX (free, no credits): small diesel engine, distant prop-bomber fly-by, soft marching column.

Usage: python3 tools/sfx_synth.py <sfx_dir>
"""
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

SR = 48000
out = Path(sys.argv[1])
rng = np.random.default_rng(5)


def lp(x, f):
    return sosfilt(butter(2, f, btype='low', fs=SR, output='sos'), x)


def bp(x, lo, hi):
    return sosfilt(butter(2, [lo, hi], btype='band', fs=SR, output='sos'), x)


def fade(x, a=0.4, b=0.8):
    n = len(x)
    e = np.ones(n)
    e[: int(a * SR)] = np.linspace(0, 1, int(a * SR))
    e[-int(b * SR):] = np.linspace(1, 0, int(b * SR))
    return x * e


def st(x, d=0.011):
    y = np.stack([x, np.roll(x, int(d * SR))], 1)
    return (y / (np.abs(y).max() + 1e-9) * 0.7).astype(np.float32)


# 1) small diesel engine chugging (~6 Hz firing), distant
D = 5.0
t = np.arange(int(D * SR)) / SR
f = 6.2
pulses = np.maximum(0, np.sin(2 * np.pi * f * t)) ** 6
noise = rng.standard_normal(t.size)
eng = lp(noise * pulses, 380) * 3 + 0.4 * lp(rng.standard_normal(t.size), 120) + 0.3 * np.sin(2 * np.pi * 2 * f * t) * pulses
eng = lp(eng, 900)
sf.write(out / 'ship_engine_small.wav', st(fade(eng, 0.6, 1.2)), SR)

# 2) distant four-engine prop bomber passing: harmonic drone + doppler + loudness swell
D = 7.0
t = np.arange(int(D * SR)) / SR
pos = (t - D / 2) / (D / 2)  # -1..1
dop = 1 + 0.06 * (-np.tanh(pos * 2.5))
ph = np.cumsum(2 * np.pi * 68 * dop / SR)
drone = sum(np.sin(k * ph + k) / k for k in range(1, 9)) + 0.6 * sum(np.sin(k * ph * 1.03) / k for k in range(1, 6))
drone = drone + 0.5 * lp(rng.standard_normal(t.size), 500)
env = np.exp(-(pos ** 2) * 2.2)
pl = lp(drone * env, 1400)
sf.write(out / 'plane_flyby.wav', st(fade(pl, 0.5, 1.0), 0.02), SR)

# 3) soft marching column on gravel: many feet, ~1.9 steps/s left-right
D = 6.0
n = int(D * SR)
m = np.zeros(n)
for k in range(int(D * 1.9 * 2)):
    base = k / (1.9 * 2)
    for j in range(14):  # 14 soldiers slightly out of sync
        s = int((base + rng.normal(0, 0.02)) * SR)
        L = int(0.09 * SR)
        if 0 <= s < n - L:
            grit = bp(rng.standard_normal(L), 600, 5000) * np.exp(-np.linspace(0, 6, L))
            thud = lp(rng.standard_normal(L), 160) * np.exp(-np.linspace(0, 9, L)) * 3
            m[s:s + L] += (grit + thud) * rng.uniform(0.4, 1)
sf.write(out / 'marching_column.wav', st(fade(lp(m, 4000), 0.8, 1.2)), SR)
print('synth sfx: ship_engine_small, plane_flyby, marching_column')
