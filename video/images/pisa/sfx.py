"""Synthesized sound effects (free, no sample libraries): every sound is built from noise + sines.
usage: python3 sfx.py <out_dir>   -> 48 kHz mono WAVs, each peak-normalised to -1 dBFS.
Each file starts exactly at its onset (impacts) so the cue time in Remotion = the hit time."""
import sys, os
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt

SR = 48000
OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(7)


def t_(d):
    return np.arange(int(d * SR)) / SR


def noise(d):
    return rng.standard_normal(int(d * SR))


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], btype='band', fs=SR, output='sos'), x)


def lp(x, f, order=2):
    return sosfilt(butter(order, f, btype='low', fs=SR, output='sos'), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, btype='high', fs=SR, output='sos'), x)


def sweep(f0, f1, d, curve=1.0):
    tt = t_(d)
    u = (tt / d) ** curve
    f = f0 * (f1 / f0) ** u
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def env_ad(d, a, dec):
    tt = t_(d)
    e = np.minimum(1, tt / max(a, 1e-4)) * np.exp(-np.maximum(0, tt - a) / dec)
    return e


def fade(x, fi=0.003, fo=0.02):
    n = len(x)
    a = np.ones(n)
    ni, no = int(fi * SR), int(fo * SR)
    if ni: a[:ni] = np.linspace(0, 1, ni)
    if no: a[-no:] *= np.linspace(1, 0, no)
    return x * a


def save(name, x):
    x = fade(np.asarray(x, dtype=np.float64))
    x = x / (np.abs(x).max() + 1e-9) * 10 ** (-1 / 20)
    sf.write(os.path.join(OUT, f'{name}.wav'), x.astype(np.float32), SR)


def whoosh(d, f0, f1, peak=0.6, q=0.35):
    """band-passed noise whose centre sweeps f0 -> f1; loudest at `peak` of its length"""
    n = int(d * SR)
    x = noise(d)
    out = np.zeros(n)
    blk = 512
    for i in range(0, n, blk):
        u = i / n
        fc = f0 * (f1 / f0) ** u
        seg = x[max(0, i - 2048): i + blk]
        y = bp(seg, fc * (1 - q), min(fc * (1 + q), SR / 2 - 100))
        out[i: i + blk] = y[-len(out[i: i + blk]):]
    tt = t_(d)
    e = np.where(tt < peak * d, (tt / (peak * d)) ** 2, np.exp(-(tt - peak * d) / (0.28 * d)))
    return out * e


# --- whooshes -------------------------------------------------------------------------------------
save('whoosh_up', whoosh(0.42, 500, 2600, peak=0.35))
save('whoosh_down', whoosh(0.55, 2400, 380, peak=0.8))
save('swish', whoosh(0.28, 900, 3200, peak=0.45, q=0.5))
save('whoosh_big', whoosh(0.9, 300, 1400, peak=0.55, q=0.45))
tl = whoosh(2.1, 260, 2200, peak=0.5, q=0.4) * (0.75 + 0.25 * np.sin(2 * np.pi * 9 * t_(2.1)))
save('timelapse', tl)

# --- impacts ---------------------------------------------------------------------------------------
d = 0.7
body = sweep(95, 42, d, 0.5) * env_ad(d, 0.004, 0.16)
grit = lp(noise(d), 900) * env_ad(d, 0.001, 0.05) * 0.8
click = hp(noise(d), 2500) * env_ad(d, 0.0005, 0.008) * 0.25
save('thud', body + grit + click)
d = 0.9
save('thud_heavy', sweep(70, 34, d, 0.5) * env_ad(d, 0.004, 0.25) + lp(noise(d), 600) * env_ad(d, 0.001, 0.09) * 0.9)
d = 0.4
save('thud_small', sweep(140, 70, d, 0.6) * env_ad(d, 0.003, 0.08) + lp(noise(d), 1500) * env_ad(d, 0.001, 0.03) * 0.6)
# plastic hard-hat "tok"
d = 0.18
tok = (np.sin(2 * np.pi * 620 * t_(d)) + 0.6 * np.sin(2 * np.pi * 1390 * t_(d))) * env_ad(d, 0.001, 0.035) + hp(noise(d), 3000) * env_ad(d, 0.0005, 0.006) * 0.4
save('tok', tok)
# stone crack (giving way)
d = 0.9
crack = hp(noise(d), 1200) * env_ad(d, 0.0008, 0.03) + bp(noise(d), 200, 900) * env_ad(d, 0.002, 0.12) * 0.8 + sweep(80, 40, d) * env_ad(d, 0.005, 0.2) * 0.9
save('crack', crack)

# --- stone grind / creak ---------------------------------------------------------------------------
d = 0.8
jit = np.abs(lp(noise(d), 30)) * 3 + 0.3
creak = bp(noise(d), 140, 520) * jit * env_ad(d, 0.08, 0.35) + 0.4 * sweep(180, 120, d) * np.sign(np.sin(2 * np.pi * 37 * t_(d))) * env_ad(d, 0.06, 0.3) * 0.25
save('creak', lp(creak, 2500))
d = 1.8
rum = lp(np.cumsum(noise(d)) / 400, 120, 3)
rum = rum * np.minimum(1, t_(d) / 0.35) * np.minimum(1, (d - t_(d)) / 0.5)
save('rumble', rum)

# --- squish (soft clay) -----------------------------------------------------------------------------
d = 0.5
wob = 1 + 0.25 * np.sin(2 * np.pi * 11 * t_(d))
sq = sweep(210, 85, d, 0.8) * wob * env_ad(d, 0.03, 0.14) + lp(noise(d), 700) * env_ad(d, 0.02, 0.1) * 0.5
save('squish', sq)

# --- water / bubbles -----------------------------------------------------------------------------
for k, (f0, f1) in enumerate([(520, 1500), (650, 1800), (430, 1250)]):
    d = 0.16
    save(f'plip{k}', sweep(f0, f1, d, 0.6) * env_ad(d, 0.002, 0.04))
d = 0.12
save('pop', sweep(900, 260, d, 0.5) * env_ad(d, 0.001, 0.03) + hp(noise(d), 2000) * env_ad(d, 0.0005, 0.004) * 0.3)
d = 0.1
save('pop_small', sweep(1400, 500, d, 0.5) * env_ad(d, 0.001, 0.02))
d = 0.22
save('gulp', sweep(330, 110, d, 0.7) * env_ad(d, 0.01, 0.07))

# --- clock tick, steps ---------------------------------------------------------------------------
d = 0.04
save('tick', bp(noise(d), 2500, 4500) * env_ad(d, 0.0005, 0.005) + np.sin(2 * np.pi * 3100 * t_(d)) * env_ad(d, 0.0005, 0.006) * 0.5)
d = 0.12
save('step', lp(noise(d), 500) * env_ad(d, 0.002, 0.02) + sweep(120, 70, d) * env_ad(d, 0.002, 0.03) * 0.6)

# --- metal: sword clash ------------------------------------------------------------------------------
d = 0.7
partials = [1.0, 2.76, 5.40, 8.93, 13.3]
clash = sum(np.sin(2 * np.pi * 1180 * p * t_(d) + i) * env_ad(d, 0.0005, 0.22 / (1 + i * 0.6)) / (1 + i * 0.5) for i, p in enumerate(partials))
clash += hp(noise(d), 3000) * env_ad(d, 0.0005, 0.02) * 0.8
save('clash', clash)

# --- poof (dust cloud) ---------------------------------------------------------------------------
d = 0.45
save('poof', lp(noise(d), 1400) * env_ad(d, 0.01, 0.1) + sweep(160, 80, d) * env_ad(d, 0.005, 0.08) * 0.4)

# --- sparkle chime, boing ------------------------------------------------------------------------
d = 1.1
ch = np.zeros(int(d * SR))
for i, f in enumerate([2093, 2637, 3136, 4186]):
    st = int(i * 0.06 * SR)
    tt = t_(d - i * 0.06)
    ch[st: st + len(tt)] += np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.25) * (1 - 0.15 * i)
save('sparkle', ch)
d = 0.6
tt = t_(d)
f = 230 + 140 * (1 - np.exp(-tt / 0.08)) + 60 * np.sin(2 * np.pi * 14 * tt) * np.exp(-tt / 0.15)
boing = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_ad(d, 0.004, 0.18)
save('boing', boing)

print('ok', sorted(os.listdir(OUT)))
