# sfx.py out_dir - synthesize the cartoon sound effects (no sound library / Higgsfield in this session), 48 kHz mono wav,
# each peak-normalised to -1 dBFS. Levels are set in src/moths/sfx-cues.json.
import sys, wave, numpy as np
SR = 48000; rng = np.random.default_rng(7); out = sys.argv[1]
def t_(d): return np.arange(int(SR * d)) / SR
def env(n, a=0.005, r=0.05):
    e = np.ones(n); na, nr = int(SR * a), int(SR * r)
    if na: e[:na] = np.linspace(0, 1, na)
    if nr: e[-nr:] *= np.linspace(1, 0, nr)
    return e
def bp(x, fc, q=1.2):
    """time-varying band-pass (RBJ biquad); fc = array or float"""
    fc = np.broadcast_to(np.asarray(fc, float), x.shape); y = np.zeros_like(x); x1 = x2 = y1 = y2 = 0.0
    for i in range(len(x)):
        w = 2 * np.pi * fc[i] / SR; al = np.sin(w) / (2 * q); c = np.cos(w); a0 = 1 + al
        b0, b2, a1, a2 = al / a0, -al / a0, -2 * c / a0, (1 - al) / a0
        yi = b0 * x[i] + b2 * x2 - a1 * y1 - a2 * y2; x2, x1, y2, y1 = x1, x[i], y1, yi; y[i] = yi
    return y
def lp(x, a):  # one-pole low-pass
    y = np.zeros_like(x); acc = 0.0
    for i in range(len(x)): acc += a * (x[i] - acc); y[i] = acc
    return y
def sweep(f, d):  # sine with a frequency curve f(t)
    t = t_(d); ph = 2 * np.pi * np.cumsum(f(t)) / SR; return np.sin(ph)
def save(name, x):
    x = x / (np.abs(x).max() + 1e-9) * 10 ** (-1 / 20)
    with wave.open(f"{out}/{name}.wav", "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype(np.int16).tobytes())
    print(name, f"{len(x)/SR:.2f}s")

# night crickets bed (30 s): three crickets chirping in trills + very soft air
d = 30.0; n = int(SR * d); bed = lp(rng.standard_normal(n), 0.02) * 0.04
for f0, rate, amp, off in [(4400, 0.62, 1.0, 0.1), (4750, 0.81, 0.7, 0.33), (4150, 1.07, 0.5, 0.71)]:
    t0 = off
    while t0 < d - 0.3:
        for k in range(3):
            s = int(SR * (t0 + k * 0.032)); m = int(SR * 0.02); tt = np.arange(m) / SR
            bed[s:s + m] += amp * np.sin(2 * np.pi * f0 * tt) * np.sin(np.pi * tt / 0.02) ** 2 * 0.35
        t0 += rate * (0.85 + 0.3 * rng.random())
save("crickets", bed * env(n, 0.3, 0.3))

# whoosh: noise through a band-pass that sweeps up then down, swelling envelope
def whoosh(d=0.9, f0=250, f1=1900, f2=450, peak=0.45):
    t = t_(d); u = t / d
    fc = np.where(u < peak, f0 + (f1 - f0) * (u / peak) ** 1.5, f1 + (f2 - f1) * ((u - peak) / (1 - peak)))
    e = np.where(u < peak, (u / peak) ** 2, ((1 - u) / (1 - peak)) ** 1.6)
    return bp(rng.standard_normal(len(t)), fc, 0.9) * e
save("whoosh", whoosh())
save("whoosh_soft", whoosh(1.2, 180, 900, 300, 0.5))
# spiral: whoosh that keeps falling in pitch while it swirls
t = t_(1.5); fc = 1800 * np.exp(-1.3 * t) + 250 + 300 * np.sin(2 * np.pi * 5 * t) ** 2
save("spiral", bp(rng.standard_normal(len(t)), fc, 1.4) * np.sin(np.pi * t / 1.5) ** 0.8)

# soft moth flutter: band-passed noise, amplitude modulated at wing-beat rate
for name, rate, d in [("flutter", 26, 0.9), ("flutter_slow", 7, 1.6)]:
    t = t_(d); x = bp(rng.standard_normal(len(t)), 600, 0.8) * (0.5 + 0.5 * np.sin(2 * np.pi * rate * t)) ** 2
    save(name, x * np.sin(np.pi * t / d))

# stamp / slam: low thump + short noise crack
t = t_(0.6)
thump = np.sin(2 * np.pi * np.cumsum(45 + 70 * np.exp(-18 * t)) / SR) * np.exp(-9 * t)
crack = bp(rng.standard_normal(len(t)), 2500, 0.7) * np.exp(-60 * t)
save("stamp", thump + 0.5 * crack + 0.25 * np.sin(2 * np.pi * 180 * t) * np.exp(-25 * t))
# landing thud on grass
t = t_(0.7)
thud = np.sin(2 * np.pi * np.cumsum(38 + 55 * np.exp(-14 * t)) / SR) * np.exp(-8 * t)
dirt = lp(rng.standard_normal(len(t)), 0.08) * np.exp(-14 * t)
save("thud", thud + 0.6 * dirt)

# camera record beep and whir
t = t_(0.22); save("rec_beep", np.sin(2 * np.pi * 2350 * t) * env(len(t), 0.004, 0.03) * (t < 0.13))
t = t_(1.6); whir = (np.sin(2 * np.pi * 820 * t) * 0.5 + np.sin(2 * np.pi * 1640 * t) * 0.25) * (0.7 + 0.3 * np.sin(2 * np.pi * 9 * t))
save("whir", (whir + 0.3 * bp(rng.standard_normal(len(t)), 3000, 1.0)) * env(len(t), 0.15, 0.4))

# cartoon pop, boing, plip
t = t_(0.18); save("pop", sweep(lambda t: 320 + 900 * np.minimum(t / 0.04, 1), 0.18) * np.exp(-28 * t))
t = t_(0.8); save("boing", sweep(lambda t: 240 + 110 * t + 90 * np.exp(-4 * t) * np.sin(2 * np.pi * 11 * t), 0.8) * np.exp(-4.2 * t) * env(len(t), 0.004, 0.08))
t = t_(0.22); save("plip", sweep(lambda t: 900 + 1500 * np.exp(-30 * t), 0.22) * np.exp(-16 * t))

# light switch: click + electric buzz settling; steady lamp hum
t = t_(0.7); click = np.zeros(len(t)); click[:240] = rng.standard_normal(240) * np.exp(-np.arange(240) / 30); click[480:700] = 0.6 * rng.standard_normal(220) * np.exp(-np.arange(220) / 30)
buzz = np.sign(np.sin(2 * np.pi * 120 * t)) * 0.12 * np.clip((t - 0.02) / 0.05, 0, 1) * np.exp(-3 * t)
save("switch", click + lp(buzz, 0.2))
t = t_(12.0); hum = 0.6 * np.sin(2 * np.pi * 120 * t) + 0.3 * np.sin(2 * np.pi * 240 * t) + 0.12 * np.sin(2 * np.pi * 360 * t)
save("hum", hum * (0.85 + 0.15 * np.sin(2 * np.pi * 0.4 * t)) * env(len(t), 0.25, 0.4))

# slide whistles (climb up / fall down) and a soft chime
t = t_(0.8); save("rise", sweep(lambda t: 480 * (3.2 ** (t / 0.8)) * (1 + 0.02 * np.sin(2 * np.pi * 6 * t)), 0.8) * env(len(t), 0.03, 0.12))
t = t_(1.1); save("fall", sweep(lambda t: 1500 * (0.23 ** (t / 1.1)) * (1 + 0.02 * np.sin(2 * np.pi * 7 * t)), 1.1) * env(len(t), 0.02, 0.15))
t = t_(1.8); save("chime", (np.sin(2 * np.pi * 1320 * t) + 0.6 * np.sin(2 * np.pi * 1980 * t) + 0.3 * np.sin(2 * np.pi * 2640 * t)) * np.exp(-2.6 * t) * env(len(t), 0.003, 0.1))

# dizzy tweets: little up-chirps
d = 2.2; x = np.zeros(int(SR * d))
for k in range(7):
    s = int(SR * (0.05 + k * 0.29 + 0.03 * rng.random())); dd = 0.07; tt = np.arange(int(SR * dd)) / SR
    f = 2600 + 1600 * tt / dd + 300 * rng.random()
    x[s:s + len(tt)] += np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / dd)
save("tweet", x)
