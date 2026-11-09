"""Sound effects for "The Egg".

1. ElevenLabs takes (sfx_src/*.mp3): trim silence, peak-normalise to -1 dBFS.
2. The rest is synthesised here (ElevenLabs free generations were busy): whoosh, pop, poof, ding, low hit,
   squeak, shimmer, crack, burst, heartbeat, and a quiet underscore pad that follows the story beats.
Output: 48 kHz mono 16-bit WAV in public/the-egg/sfx/.  usage: python3 make_sfx.py <sfx_src> <out_dir>
"""
import os, subprocess, sys
import numpy as np

SR = 48000
SRC, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(7)


def save(name, x, peak_db=-1.0):
    x = np.asarray(x, np.float64)
    x = x - np.mean(x)
    pk = np.abs(x).max()
    if pk > 0:
        x = x / pk * 10 ** (peak_db / 20)
    fo = min(len(x), int(0.01 * SR))
    x[-fo:] *= np.linspace(1, 0, fo)
    pcm = (np.clip(x, -1, 1) * 32767).astype(np.int16)
    path = os.path.join(OUT, name + ".wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "s16le", "-ar", str(SR), "-ac", "1", "-i", "-", path],
                   input=pcm.tobytes(), check=True)
    env = np.abs(x)
    print(f"{name:10s} {len(x)/SR:5.2f}s  peak at {np.argmax(env)/SR:5.3f}s")


def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def trim(x, thr_db=-50, pre=0.005, post=0.08):
    env = np.abs(x)
    thr = env.max() * 10 ** (thr_db / 20)
    idx = np.where(env > thr)[0]
    a = max(idx[0] - int(pre * SR), 0); b = min(idx[-1] + int(post * SR), len(x))
    return x[a:b]


def t_(dur):
    return np.arange(int(dur * SR)) / SR


def stft_shape(noise, gain_fn, n=1024, hop=256):
    """multiply the spectrum of `noise` frame by frame by gain_fn(t, freqs)"""
    win = np.hanning(n)
    out = np.zeros(len(noise) + n)
    freqs = np.fft.rfftfreq(n, 1 / SR)
    for s in range(0, len(noise) - n, hop):
        fr = np.fft.rfft(noise[s:s + n] * win)
        fr *= gain_fn((s + n / 2) / SR, freqs)
        out[s:s + n] += np.fft.irfft(fr) * win
    return out[:len(noise)] / 1.5


def reverb(x, dur=1.2, mix=0.25, damp=3.0):
    ir_t = t_(dur)
    ir = rng.standard_normal(len(ir_t)) * np.exp(-damp * ir_t / dur * 3)
    ir = stft_shape(ir, lambda t, f: np.exp(-f / (6000 - 4000 * t / dur)))
    ir /= np.sqrt((ir ** 2).sum()) + 1e-9
    wet = np.convolve(np.concatenate([x, np.zeros(len(ir))]), ir)[:len(x) + len(ir)]
    dry = np.concatenate([x, np.zeros(len(ir))])
    wet *= np.abs(dry).max() / (np.abs(wet).max() + 1e-9)
    return dry * (1 - mix) + wet * mix


# ---------- 1. ElevenLabs takes ----------
for name, src in [("splash", "splash_a.mp3"), ("choir", "choir.mp3"), ("gulp", "gulp.mp3"),
                  ("crowd", "crowd.mp3"), ("ticks", "ticks.mp3")]:
    x = trim(load(os.path.join(SRC, src)))
    save(name, x)

# ---------- 2. synthesised ----------
# whoosh: band of noise sweeping up then down, bell envelope (peak at 45 %)
d = 0.9; t = t_(d); u = t / d
env = np.where(u < 0.45, np.sin(np.pi / 2 * u / 0.45) ** 2, np.cos(np.pi / 2 * (u - 0.45) / 0.55) ** 2)
fc = lambda tt: 350 + 2200 * np.sin(np.pi * min(tt / d, 1)) ** 1.5
w = stft_shape(rng.standard_normal(len(t)), lambda tt, f: np.exp(-((np.log(f + 1) - np.log(fc(tt))) ** 2) / 0.35))
save("whoosh", w * env)

# pop: bubble pop - fast upward blip + click
d = 0.16; t = t_(d)
f = 380 + 1500 * (1 - np.exp(-t / 0.018))
ph = 2 * np.pi * np.cumsum(f) / SR
p = np.sin(ph) * np.exp(-t / 0.035) * (1 - np.exp(-t / 0.0015))
click = rng.standard_normal(len(t)) * np.exp(-t / 0.002) * 0.3
save("pop", p + click)

# poof: soft noise puff with falling low-pass
d = 0.55; t = t_(d)
pf = stft_shape(rng.standard_normal(len(t)), lambda tt, f: 1 / (1 + (f / (1800 * np.exp(-tt * 3) + 250)) ** 4))
save("poof", pf * (1 - np.exp(-t / 0.012)) * np.exp(-t / 0.16))

# ding: bell partials + air
d = 1.8; t = t_(d)
f0 = 1318.5
bell = sum(a * np.sin(2 * np.pi * f0 * r * t + rng.uniform(0, 6)) * np.exp(-t / dec)
           for r, a, dec in [(1, 1, 0.9), (2.0, 0.45, 0.5), (2.76, 0.35, 0.35), (3.9, 0.22, 0.22), (5.4, 0.15, 0.12)])
bell *= 1 - np.exp(-t / 0.002)
save("ding", reverb(bell, 1.0, 0.3)[:int(2.2 * SR)])

# low hit: sub drop + low noise impact + soft saturation
d = 1.7; t = t_(d)
f = 46 + 50 * np.exp(-t / 0.12)
sub = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.55) * (1 - np.exp(-t / 0.004))
imp = stft_shape(rng.standard_normal(len(t)), lambda tt, f: 1 / (1 + (f / 260) ** 4)) * np.exp(-t / 0.09)
save("lowhit", np.tanh(1.8 * (sub + 0.8 * imp)))

# squeak: rubber toy "squee-eak"
d = 0.38; t = t_(d)
f = 1500 + 700 * np.sin(np.pi * np.clip(t / 0.3, 0, 1)) + 60 * np.sin(2 * np.pi * 38 * t)
ph = 2 * np.pi * np.cumsum(f) / SR
sq = np.sin(ph) + 0.45 * np.sin(2 * ph) + 0.25 * np.sin(3 * ph)
envq = np.clip(t / 0.02, 0, 1) * np.clip((d - t) / 0.06, 0, 1)
save("squeak", np.tanh(1.5 * sq) * envq)

# shimmer: rising cloud of sine pings + airy swell
d = 2.1; t = t_(d)
sh = np.zeros(len(t))
for k in range(70):
    st = rng.uniform(0, 1.8) ** 0.8
    fr = 1400 + 3200 * (st / 1.8) + rng.uniform(-200, 200)
    n0 = int(st * SR); tt = t[: len(t) - n0]
    sh[n0:] += np.sin(2 * np.pi * fr * tt) * np.exp(-tt / 0.12) * rng.uniform(0.3, 1) * (0.4 + st / 1.8)
air = stft_shape(rng.standard_normal(len(t)), lambda tt, f: np.exp(-((f - (2500 + 3000 * tt / d)) / 1500) ** 2))
sh = sh / np.abs(sh).max() + 0.35 * air / np.abs(air).max() * (t / d) ** 1.5
sh *= np.clip((d - t) / 0.25, 0, 1)
save("shimmer", reverb(sh, 0.8, 0.3)[:int(2.4 * SR)])

# crack: eggshell cracks - sharp high transients + small woody "tok"
d = 0.7; t = t_(d)
cr = np.zeros(len(t))
for st, a in [(0.0, 1.0), (0.07, 0.6), (0.16, 0.85), (0.33, 0.45)]:
    n0 = int(st * SR); tt = t[: len(t) - n0]
    burst = stft_shape(rng.standard_normal(len(tt)), lambda x, f: (f / 9000) ** 0.6 / (1 + (f / 9000) ** 2))
    cr[n0:] += a * (burst * np.exp(-tt / 0.006) + 0.5 * np.sin(2 * np.pi * 620 * tt) * np.exp(-tt / 0.012))
save("crack", cr)

# burst: shell bursting - noise blast + pops + shimmer tail
d = 1.5; t = t_(d)
bl = stft_shape(rng.standard_normal(len(t)), lambda tt, f: 1 / (1 + (f / (5000 * np.exp(-tt * 2) + 400)) ** 2))
bl *= (1 - np.exp(-t / 0.003)) * np.exp(-t / 0.18)
tail = np.zeros(len(t))
for k in range(30):
    st = rng.uniform(0.02, 1.0); fr = rng.uniform(2200, 5200)
    n0 = int(st * SR); tt = t[: len(t) - n0]
    tail[n0:] += np.sin(2 * np.pi * fr * tt) * np.exp(-tt / 0.09) * (1 - st)
bu = bl / np.abs(bl).max() + 0.4 * tail / np.abs(tail).max()
save("burst", reverb(bu, 0.9, 0.25)[:int(1.8 * SR)])

# heartbeat: lub-dub
d = 1.3; t = t_(d)
hb = np.zeros(len(t))
for st, a, f0 in [(0.0, 1.0, 58), (0.28, 0.7, 52)]:
    n0 = int(st * SR); tt = t[: len(t) - n0]
    thump = np.sin(2 * np.pi * (f0 + 30 * np.exp(-tt / 0.03)) * tt) * np.exp(-tt / 0.11) * (1 - np.exp(-tt / 0.004))
    hb[n0:] += a * thump
save("heartbeat", np.tanh(1.3 * hb))

# underscore pad: soft chords that follow the story (comp seconds), very quiet in the mix
DUR = 26.6
t = t_(DUR)
A3, CS4, E4, GS4, B4, CS5, E5 = 220.0, 277.18, 329.63, 415.30, 493.88, 554.37, 659.26
D3, F3, A3_, C4, D4, F4 = 146.83, 174.61, 220.0, 261.63, 293.66, 349.23
F3_, C4_, E4_, G4, A4 = 174.61, 261.63, 329.63, 392.0, 440.0
E3, B3, GS3, FS4 = 164.81, 246.94, 207.65, 369.99
sections = [  # (start, end, notes, level)
    (0.0, 6.5, [A3, E4, CS5, B4], 0.8),
    (6.5, 12.4, [F3_, C4_, E4_, A4], 0.9),
    (12.4, 15.0, [D3, F3, A3_, D4], 0.75),
    (15.0, 20.7, [A3, E4, CS5, B4, E5], 0.9),
    (20.7, 24.4, [E3, B3, GS4, B4, FS4], 1.0),
    (24.4, DUR, [A3, CS4, E4, A4, CS5], 0.8),
]
pad = np.zeros(len(t))
for s0, s1, notes, lvl in sections:
    a = int(max(s0 - 0.25, 0) * SR); b = int(min(s1 + 0.25, DUR) * SR)
    tt = t[a:b] - t[a]
    seg = np.zeros(b - a)
    for nf in notes:
        for det in (-0.12, 0.12):  # cents-ish detune pair = chorus
            fr = nf * (1 + det / 100)
            seg += np.sin(2 * np.pi * fr * tt + rng.uniform(0, 6)) + 0.25 * np.sin(4 * np.pi * fr * tt)
    x = np.clip(np.minimum(tt / 0.5, (tt[-1] - tt) / 0.5), 0, 1)
    seg *= lvl * x * (0.85 + 0.15 * np.sin(2 * np.pi * 0.25 * tt))
    pad[a:b] += seg
# swell into "as a god" and into "egg", dip under the dark section
sw = 1 + 0.6 * np.exp(-((t - 20.0) / 0.9) ** 2) + 0.8 * np.exp(-((t - 24.1) / 1.0) ** 2)
pad *= sw
pad = stft_shape(pad, lambda tt, f: 1 / (1 + (f / 1600) ** 2))
pad = reverb(pad, 2.0, 0.35)[:len(t)]
fi = int(0.4 * SR); pad[:fi] *= np.linspace(0, 1, fi)
save("pad", pad, peak_db=-3.0)
