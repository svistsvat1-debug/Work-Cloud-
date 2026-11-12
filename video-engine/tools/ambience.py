"""Code-synthesized ambience beds (free, no downloads): wind, sea, rain, room, underwater, fire, harbor.

Usage: python3 tools/ambience.py <out_dir>   -> <out_dir>/<name>.wav (48 kHz stereo, 40 s, loopable)
Beds are quiet textures; the mixer sets their level far under the voice.
"""
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

SR = 48000
DUR = 40
out = Path(sys.argv[1])
out.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(11)
N = SR * DUR
t = np.arange(N) / SR


def bp(x, lo, hi, order=2):
    sos = butter(order, [lo, hi], btype='band', fs=SR, output='sos')
    return sosfilt(sos, x)


def lp(x, f, order=2):
    return sosfilt(butter(order, f, btype='low', fs=SR, output='sos'), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, btype='high', fs=SR, output='sos'), x)


def brown(n):
    w = rng.standard_normal(n)
    b = np.cumsum(w)
    b = hp(b, 20)
    return b / (np.abs(b).max() + 1e-9)


def pink(n):
    w = rng.standard_normal(n)
    return lp(w, 2000) * 0.6 + lp(w, 400) * 0.4


def lfo(freq, depth, phase=0.0):
    return 1 - depth + depth * (0.5 + 0.5 * np.sin(2 * np.pi * freq * t + phase))


def loop_xfade(x, fade=2.0):
    """make seamless loop: crossfade tail into head"""
    f = int(fade * SR)
    x = x.copy()
    ramp = np.linspace(0, 1, f)
    x[:f] = x[:f] * ramp + x[-f:] * (1 - ramp)
    return x[:-f]


def stereo(l, r=None):
    if r is None:
        r = np.roll(l, int(0.013 * SR))
    s = np.stack([l, r], axis=1)
    return s / (np.abs(s).max() + 1e-9) * 0.5


beds = {}
# wind: band-limited noise with slow gusts
w = bp(pink(N), 150, 1400) * lfo(0.07, 0.6) * lfo(0.19, 0.3, 1.3)
beds['wind'] = stereo(w, bp(pink(N), 150, 1400) * lfo(0.07, 0.6, 0.8) * lfo(0.21, 0.3))
# snow wind: higher, thinner, whistly
ws = bp(pink(N), 400, 3000) * lfo(0.05, 0.7) + 0.15 * np.sin(2 * np.pi * (700 + 40 * np.sin(2 * np.pi * 0.1 * t)) * t) * lfo(0.08, 0.9)
beds['wind_snow'] = stereo(ws)
# sea: low surf swells (~8 s period) + soft wash
sw = lp(brown(N), 600) * lfo(1 / 8, 0.75) + 0.3 * bp(pink(N), 800, 4000) * lfo(1 / 8, 0.9, 0.6) ** 3
beds['sea'] = stereo(sw)
# harbor: sea + distant low hum + rare creaks
hb = 0.8 * sw + 0.15 * lp(brown(N), 120)
for k in range(6):
    p = int(rng.uniform(0, N - SR))
    L = int(0.6 * SR)
    hb[p:p + L] += 0.15 * np.sin(2 * np.pi * rng.uniform(180, 320) * np.arange(L) / SR) * np.hanning(L)
beds['harbor'] = stereo(hb)
# rain: hiss + droplets
rn = hp(rng.standard_normal(N), 1500) * 0.25
drops = np.zeros(N)
idx = rng.integers(0, N, 4000)
drops[idx] = rng.uniform(0.3, 1, idx.size)
rn += bp(drops, 2000, 8000) * 2
beds['rain'] = stereo(rn)
# room tone: very low hum + air
rm = 0.6 * lp(brown(N), 200) + 0.08 * hp(rng.standard_normal(N), 3000)
beds['room'] = stereo(rm)
# underwater: deep muffled rumble + occasional bubbles
uw = lp(brown(N), 250) * lfo(0.05, 0.4)
for k in range(30):
    p = int(rng.uniform(0, N - SR))
    L = int(rng.uniform(0.03, 0.08) * SR)
    f0 = rng.uniform(300, 900)
    uw[p:p + L] += 0.25 * np.sin(2 * np.pi * (f0 + np.linspace(0, 400, L)) * np.arange(L) / SR) * np.hanning(L)
beds['underwater'] = stereo(uw)
# fire: crackles + low roar
fr = 0.5 * lp(brown(N), 300) * lfo(0.3, 0.3)
cr = np.zeros(N)
idx = rng.integers(0, N, 2500)
cr[idx] = rng.uniform(0.2, 1, idx.size) * rng.choice([-1, 1], idx.size)
fr += bp(cr, 1000, 6000) * 3
beds['fire'] = stereo(fr)
# night: very soft wind + far sea
beds['night'] = stereo(0.5 * bp(pink(N), 120, 800) * lfo(0.05, 0.5) + 0.4 * lp(brown(N), 300) * lfo(1 / 9, 0.6))

for name, x in beds.items():
    y = np.stack([loop_xfade(x[:, 0]), loop_xfade(x[:, 1])], axis=1)
    sf.write(out / f'{name}.wav', y.astype(np.float32), SR)
print('ambience beds:', ', '.join(beds))
