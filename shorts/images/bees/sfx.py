"""sfx.py - synthesised cartoon sound effects -> public/bees/sfx/*.wav (48 kHz, mono, peak -1 dBFS).
No sound library and no Higgsfield in this environment, so every effect is built from noise / sines here."""
import os, wave
import numpy as np

SR = 48000
OUT = "../../public/bees/sfx"
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(7)


def t_(d):
    return np.arange(int(d * SR)) / SR


def env(n, a, r, curve=3.0):
    """attack (s) then exponential-ish release to the end."""
    e = np.ones(n)
    na = max(1, int(a * SR))
    e[:na] = np.linspace(0, 1, na) ** 1.5
    rest = n - na
    if rest > 0:
        e[na:] = (1 - np.linspace(0, 1, rest)) ** curve
    return e


def lp(x, fc):
    """one-pole low-pass; fc may be an array (per sample)."""
    fc = np.broadcast_to(np.asarray(fc, float), x.shape)
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.zeros_like(x)
    acc = 0.0
    for i in range(len(x)):
        acc = (1 - a[i]) * x[i] + a[i] * acc
        y[i] = acc
    return y


def hp(x, fc):
    return x - lp(x, fc)


def bp(x, lo, hi):
    return lp(hp(x, lo), hi)


def sweep(f0, f1, d, shape=1.0):
    n = int(d * SR)
    f = f0 + (f1 - f0) * np.linspace(0, 1, n) ** shape
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def save(name, x):
    x = np.asarray(x, float)
    x = x - np.mean(x[: min(len(x), 64)]) * 0  # keep
    pk = np.abs(x).max() + 1e-9
    x = x / pk * 10 ** (-1 / 20)
    fade = min(len(x), int(0.004 * SR))
    x[-fade:] *= np.linspace(1, 0, fade)
    with wave.open(f"{OUT}/{name}.wav", "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())


# whoosh: band-passed noise, filter opens then closes, peak in the middle
def whoosh(d=0.55, lo=300, hi=3500, peak=0.45):
    n = int(d * SR)
    x = rng.standard_normal(n)
    u = np.linspace(0, 1, n)
    shape = np.exp(-((u - peak) ** 2) / (2 * 0.16 ** 2))
    fc = lo + (hi - lo) * shape
    y = lp(hp(x, 150), fc) * shape
    return y


save("whoosh", whoosh(0.55))
save("whoosh_short", whoosh(0.28, 500, 5000, 0.5))
save("whoosh_big", whoosh(0.8, 200, 2600, 0.55))

# swish (fast, bright)
save("swish", whoosh(0.22, 1200, 7000, 0.4))

# pok: short pitched pop
n = t_(0.09)
save("pok", sweep(900, 260, 0.09, 0.6) * env(len(n), 0.002, 0.085, 2.5) + 0.25 * rng.standard_normal(len(n)) * env(len(n), 0.001, 0.02, 4))

# pop (cartoon cork pop, rounder)
save("pop", sweep(420, 1300, 0.07, 0.5) * env(int(0.07 * SR), 0.003, 0.06, 2))

# thud: low body + click
d = 0.28; n = int(d * SR)
body = sweep(130, 52, d, 0.5) * env(n, 0.003, d, 3.5)
click = hp(rng.standard_normal(n), 900) * env(n, 0.0005, 0.03, 6) * 0.6
save("thud", body + click)

# bonk: hollow knock with a little pitch drop
d = 0.22; n = int(d * SR)
save("bonk", (np.sin(2 * np.pi * np.cumsum(np.linspace(520, 380, n)) / SR) + 0.5 * np.sin(2 * np.pi * np.cumsum(np.linspace(1040, 760, n)) / SR)) * env(n, 0.001, d, 4))

# ding / sparkle: bell partials
def bell(f, d=0.9, partials=((1, 1), (2.4, 0.5), (3.9, 0.25), (5.4, 0.12))):
    tt = t_(d)
    y = sum(a * np.sin(2 * np.pi * f * m * tt) * np.exp(-tt * (3 + 2.5 * m)) for m, a in partials)
    return y * env(len(tt), 0.002, d, 1.2)


sp = np.zeros(int(0.8 * SR))
for k, f in enumerate([2093, 2637, 3136]):
    b = bell(f, 0.6) * (0.8 ** k)
    o = int(k * 0.05 * SR)
    sp[o:o + len(b)] += b[: len(sp) - o]
save("sparkle", sp)
save("ding", bell(1568, 1.0))
save("ting", bell(3520, 0.35, ((1, 1), (2.8, 0.3))))

# dun-dun (comic doom): two low brassy notes
def brass(f, d):
    tt = t_(d)
    saw = sum(np.sin(2 * np.pi * f * k * tt) / k for k in range(1, 14))
    return lp(saw, 1400) * env(len(tt), 0.01, d, 1.4)


dd = np.concatenate([brass(146.8, 0.22), np.zeros(int(0.06 * SR)), brass(110.0, 0.55)])
save("dundun", dd)

# rip / tear: crackly gated noise, band-passed, falling
d = 0.42; n = int(d * SR)
x = rng.standard_normal(n)
gate = (rng.random(n // 120 + 1) > 0.35).repeat(120)[:n].astype(float)
gate = lp(gate, 900)
fc = np.linspace(5200, 1600, n)
save("rip", lp(hp(x, 700), fc) * gate * env(n, 0.004, d, 1.6))

# boing: spring, vibrato pitch, decaying
d = 0.6; tt = t_(d)
f = 320 + 70 * np.sin(2 * np.pi * 11 * tt) * np.exp(-tt * 3) + 60 * np.exp(-tt * 8)
save("boing", np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(tt), 0.003, d, 1.8))

# squeak (straining): rising sine with wobble
d = 0.25; tt = t_(d)
f = np.linspace(620, 980, len(tt)) + 30 * np.sin(2 * np.pi * 23 * tt)
save("squeak", np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(tt), 0.02, d, 1.2) * 0.8)

# blup (pump): liquid down-chirp with a resonant body
d = 0.16; tt = t_(d)
f = 520 * np.exp(-tt * 14) + 140
save("blup", (np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * np.sin(4 * np.pi * np.cumsum(f) / SR)) * env(len(tt), 0.004, d, 2.2))

# tick: tiny metallic click
d = 0.03; n = int(d * SR)
save("tick", (np.sin(2 * np.pi * 3200 * t_(d)) + hp(rng.standard_normal(n), 2500)) * env(n, 0.0005, d, 6))

# click: UI button click (two transients)
d = 0.06; n = int(d * SR)
c = np.zeros(n)
for o, a in ((0, 1.0), (int(0.018 * SR), 0.6)):
    m = min(n - o, int(0.012 * SR))
    c[o:o + m] += a * (np.sin(2 * np.pi * 2100 * t_(m / SR)) + 0.6 * hp(rng.standard_normal(m), 3000)) * env(m, 0.0003, m / SR, 5)
save("click", c)

# whiff / sniff: airy filtered noise swell
d = 0.6; n = int(d * SR)
u = np.linspace(0, 1, n)
save("whiff", bp(rng.standard_normal(n), 900, 3800) * np.sin(np.pi * u) ** 2)

# alarm: two-tone cartoon alarm bell, 4 hits
al = np.zeros(int(0.75 * SR))
for k in range(4):
    b = bell(1318 if k % 2 == 0 else 1046, 0.3, ((1, 1), (2.0, 0.35), (3.0, 0.2)))
    o = int(k * 0.15 * SR)
    al[o:o + len(b)] += b[: len(al) - o]
save("alarm", al)

# eyes pop open: quick upward bloop
save("eyes", sweep(300, 900, 0.12, 0.7) * env(int(0.12 * SR), 0.004, 0.12, 1.5))

# plip (sweat drop)
save("plip", sweep(1400, 2600, 0.06, 0.5) * env(int(0.06 * SR), 0.002, 0.06, 2.5))

# buzz (one bee): saw ~ 235 Hz (honey bee wing-beat), slight vibrato, low-passed
def buzz(d, f0=235, depth=6, seed=0, am=0.25):
    r = np.random.default_rng(seed)
    tt = t_(d)
    f = f0 + depth * np.sin(2 * np.pi * (4 + r.random() * 3) * tt + r.random() * 6)
    ph = 2 * np.pi * np.cumsum(f) / SR
    saw = sum(np.sin(k * ph) / k for k in range(1, 18))
    a = 1 - am + am * np.sin(2 * np.pi * (7 + r.random() * 5) * tt + r.random() * 6)
    return lp(saw, 2600) * a


save("buzz", buzz(1.0) * env(int(1.0 * SR), 0.08, 1.0, 0.8))

# swarm: many detuned buzzes, slow swell (the cue in code shapes the level over time)
d = 3.2; n = int(d * SR)
sw = np.zeros(n)
for k in range(10):
    sw += buzz(d, 205 + 7 * k + rng.random() * 5, 9, seed=k, am=0.4) * (0.7 + 0.3 * rng.random())
sw = sw * env(n, 0.5, d, 0.6)
save("swarm", sw)

# footsteps: 8 soft cartoon steps
d = 1.1; fs = np.zeros(int(d * SR))
for k in range(8):
    o = int(k * 0.13 * SR)
    m = int(0.07 * SR)
    st = sweep(180, 90, 0.07, 0.5) * env(m, 0.002, 0.07, 3) + 0.3 * lp(rng.standard_normal(m), 1200) * env(m, 0.001, 0.03, 4)
    fs[o:o + m] += st[: len(fs) - o]
save("steps", fs)

# hit (VS slam): thud + noise crash
d = 0.7; n = int(d * SR)
crash = hp(rng.standard_normal(n), 2500) * env(n, 0.001, d, 3) * 0.5
body = sweep(110, 45, d, 0.4) * env(n, 0.002, 0.35, 3) * 1.0
save("hit", np.concatenate([body[:n]]) + crash)
print("ok", sorted(os.listdir(OUT)))
