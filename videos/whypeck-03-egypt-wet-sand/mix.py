#!/usr/bin/env python3
"""Sound for WhyPeck "Water on the sand": synthesized SFX (royalty-free by construction) + a light
pizzicato bed in an "Egyptian" mode (Phrygian dominant) + the owner's ElevenLabs voice, all placed on
the beat table, then loudness-normalised to -14 LUFS.

Usage: python3 videos/whypeck-03-egypt-wet-sand/mix.py
Reads  studio/src/videos/eg03/beats.json, vo/eleven_take1.wav, studio/public/sfx/*.wav
Writes studio/public/gen/eg03/mix.wav (used by the Remotion composition), sfx_only.wav, cues.json
"""
import json
import subprocess
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy import signal

SR = 48000
HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
LIB = ROOT / "studio" / "public" / "sfx"
OUT = ROOT / "studio" / "public" / "gen" / "eg03"
B = json.loads((ROOT / "studio" / "src" / "videos" / "eg03" / "beats.json").read_text())
T = B["T"]
DUR = B["duration"]
rng = np.random.default_rng(7)
PULL_PERIOD = 1.08
END_FREEZE = 24.98


# ------------------------------------------------------------------ dsp helpers
def tt(sec):
    return np.arange(int(sec * SR)) / SR


def env(n, a=0.002, d=0.1):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)


def bp(x, lo, hi, o=2):
    return signal.sosfilt(signal.butter(o, [lo, hi], "bandpass", fs=SR, output="sos"), x)


def lp(x, f, o=2):
    return signal.sosfilt(signal.butter(o, f, "lowpass", fs=SR, output="sos"), x)


def hp(x, f, o=2):
    return signal.sosfilt(signal.butter(o, f, "highpass", fs=SR, output="sos"), x)


def norm(x, peak=0.9):
    return x * peak / (np.max(np.abs(x)) + 1e-9)


def sweep(f0, f1, dur, curve=1.0):
    t = tt(dur)
    f = f0 * (f1 / f0) ** ((t / dur) ** curve)
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def lib(name):
    x, sr = sf.read(LIB / f"{name}.wav")
    x = x if x.ndim == 1 else x.mean(1)
    if sr != SR:
        x = signal.resample_poly(x, SR, sr)
    return x


# ------------------------------------------------------------------ synthesized effects
def chime(notes=(1568, 2093, 2637), gap=0.06, dur=0.7):
    out = np.zeros(int((dur + gap * len(notes)) * SR))
    for i, f in enumerate(notes):
        t = tt(dur)
        tone = (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 2.76 * t)) * np.exp(-t / 0.18)
        s = int(i * gap * SR)
        out[s:s + len(tone)] += tone
    return norm(out)


def shimmer(dur=0.9, up=True):
    """magic sweep: glassy partials gliding + sparkle noise"""
    t = tt(dur)
    f0, f1 = (900, 2600) if up else (2600, 900)
    s = sum(a * sweep(f0 * m, f1 * m, dur) for m, a in [(1, 1), (1.5, 0.5), (2, 0.35)])
    sp = bp(rng.standard_normal(len(t)), 4000, 9000) * 0.25
    e = np.sin(np.pi * np.linspace(0, 1, len(t))) ** 1.2
    return norm((s + sp) * e)


def thump(f=70, d=0.07):
    t = tt(0.25)
    return norm(np.sin(2 * np.pi * (f + 60 * np.exp(-t / 0.02)) * t) * np.exp(-t / d) + 0.25 * bp(rng.standard_normal(len(t)), 200, 1200) * np.exp(-t / 0.02))


def creak(dur=0.45, f=180):
    """wood / rope creak: pulse train through a resonant band"""
    t = tt(dur)
    rate = 38 + 20 * np.sin(2 * np.pi * 2.2 * t)
    ph = np.cumsum(rate) / SR
    pulses = (np.diff(np.floor(ph), prepend=0) > 0).astype(float)
    x = signal.lfilter([1], [1, -0.97], pulses)
    x = bp(x, f, f * 4) + 0.3 * bp(rng.standard_normal(len(t)), 600, 2400) * 0.2
    e = np.sin(np.pi * np.linspace(0, 1, len(t))) ** 0.7
    return norm(x * e)


def grind(dur=0.6):
    """stone eyes opening: low gritty scrape"""
    t = tt(dur)
    x = bp(rng.standard_normal(len(t)), 120, 900) * (0.6 + 0.4 * np.sin(2 * np.pi * 23 * t))
    e = np.minimum(1, t / 0.05) * np.exp(-np.maximum(0, t - dur * 0.6) / 0.08)
    return norm(x * e)


def pour(dur, bright=1.0):
    """liquid pour: band noise with fast bubbly modulation"""
    t = tt(dur)
    n = rng.standard_normal(len(t))
    body = bp(n, 300 * bright, 2600 * bright)
    bub = np.zeros(len(t))
    k = 0.0
    while k < dur - 0.05:
        s = int(k * SR)
        m = int(0.05 * SR)
        f = 500 + 900 * rng.random()
        bt = tt(0.05)
        bub[s:s + m] += np.sin(2 * np.pi * np.cumsum(f * (1 + 2 * bt / 0.05)) / SR) * env(m, 0.002, 0.015) * 0.6
        k += 0.02 + 0.04 * rng.random()
    e = np.minimum(1, t / 0.06) * np.minimum(1, (dur - t) / 0.12)
    return norm((0.5 * body + bub) * e)


def splash_big():
    t = tt(1.1)
    n = rng.standard_normal(len(t))
    hit = bp(n, 200, 5000) * np.exp(-t / 0.16)
    low = np.sin(2 * np.pi * (60 + 80 * np.exp(-t / 0.04)) * t) * np.exp(-t / 0.15)
    out = hit + 0.8 * low
    for i in range(14):
        s = int((0.08 + 0.06 * i + 0.03 * rng.random()) * SR)
        m = int(0.08 * SR)
        f = 400 + 700 * rng.random()
        if s + m < len(out):
            out[s:s + m] += np.sin(2 * np.pi * np.cumsum(f * (1 + 1.5 * tt(0.08) / 0.08)) / SR) * env(m, 0.002, 0.02) * 0.5
    return norm(out)


def drip(f0=900):
    t = tt(0.16)
    return norm(np.sin(2 * np.pi * np.cumsum(f0 + 1500 * (t / 0.16)) / SR) * env(len(t), 0.002, 0.035))


def slide_whistle(f0, f1, dur):
    s = sweep(f0, f1, dur, 1.0)
    vib = 1 + 0.01 * np.sin(2 * np.pi * 6 * tt(dur))
    e = np.minimum(1, tt(dur) / 0.03) * np.minimum(1, (dur - tt(dur)) / 0.06)
    return norm((s + 0.25 * sweep(f0 * 2, f1 * 2, dur)) * vib * e)


def boing(f=260):
    t = tt(0.5)
    fr = f + 120 * np.sin(2 * np.pi * 9 * t) * np.exp(-t / 0.22) + 160 * np.exp(-t / 0.05)
    return norm(np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t / 0.2))


def blip(f0=700, f1=1100, d=0.12):
    s = sweep(f0, f1, d)
    return norm(s * env(len(s), 0.003, d / 3))


def buzzer():
    t = tt(0.42)
    x = signal.sawtooth(2 * np.pi * 110 * t) + signal.sawtooth(2 * np.pi * 116 * t)
    x = lp(x, 1800)
    e = np.minimum(1, t / 0.01) * np.minimum(1, (0.42 - t) / 0.05)
    return norm(x * e)


def stamp():
    t = tt(0.3)
    return norm(np.sin(2 * np.pi * (90 + 90 * np.exp(-t / 0.02)) * t) * np.exp(-t / 0.08) + 0.6 * bp(rng.standard_normal(len(t)), 300, 3000) * np.exp(-t / 0.02))


def scrape(dur=0.5):
    t = tt(dur)
    x = bp(rng.standard_normal(len(t)), 800, 5000) * (0.7 + 0.3 * np.sin(2 * np.pi * 31 * t))
    e = np.sin(np.pi * np.linspace(0, 1, len(t))) ** 0.8
    return norm(x * e)


def crackle(length):
    """torch fire crackle bed"""
    n = int(length * SR)
    out = lp(rng.standard_normal(n), 900) * 0.25
    for _ in range(int(length * 14)):
        s = rng.integers(0, n - 2000)
        m = int((0.002 + 0.006 * rng.random()) * SR)
        out[s:s + m] += bp(rng.standard_normal(m), 1500, 7000) * env(m, 0.0004, 0.003) * (0.4 + rng.random())
    return norm(out)


# ------------------------------------------------------------------ music bed: pizzicato, E Phrygian dominant
def pluck(freq, dur, bright=0.5):
    n = int(dur * SR)
    period = max(2, int(SR / freq))
    buf = rng.uniform(-1, 1, period)
    buf = lp(buf, 1500 + 6000 * bright, 1)
    out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % period]
        buf[i % period] = 0.497 * (buf[i % period] + buf[(i + 1) % period])
    return out * env(n, 0.002, 0.35)


def music(length):
    bpm = 116
    beat = 60 / bpm
    mid = lambda m: 440 * 2 ** ((m - 69) / 12)  # noqa: E731
    # E F G# A B C D  (E Phrygian dominant)
    scale = [64, 65, 68, 69, 71, 72, 74, 76]
    riff = [0, 2, 1, 2, 3, 2, 1, 0, 4, 3, 2, 1, 2, 1, 0, -1]
    bass = [40, 40, 41, 40]
    out = np.zeros(int(length * SR) + SR)
    cache = {}

    def note(m, dur, b):
        k = (m, round(dur, 3), b)
        if k not in cache:
            cache[k] = pluck(mid(m), dur, b)
        return cache[k]

    nbeats = int(length / beat) + 1
    for i in range(nbeats):
        bar = (i // 4) % 4
        s = int(i * beat * SR)
        if i % 2 == 0:
            x = note(bass[bar], beat * 1.6, 0.2) * 0.9
            out[s:s + len(x)] += x[: len(out) - s]
        for h in range(2):
            idx = riff[(2 * i + h) % len(riff)]
            m = 52 if idx < 0 else scale[idx]
            x = note(m, beat * 0.9, 0.55) * (0.5 if h else 0.62)
            ss = s + int(h * beat / 2 * SR)
            if ss < len(out):
                out[ss:ss + len(x)] += x[: len(out) - ss]
    out = out[: int(length * SR)]
    ir = rng.standard_normal(int(0.25 * SR)) * np.exp(-np.arange(int(0.25 * SR)) / (0.05 * SR))
    wet = signal.fftconvolve(out, lp(ir, 5000))[: len(out)]
    out = out + 0.08 * norm(wet) * np.max(np.abs(out))
    return norm(out)


# ------------------------------------------------------------------ cue list
def db(x):
    return 10 ** (x / 20)


cues = []


def cue(t, x, level, name):
    cues.append((float(t), x, level, name))


# pulling: a soft footstep thump + rope creak on every heave while the painting is alive (shots A and C)
step = [thump(70, 0.06), thump(78, 0.06)]
k = 0
while True:
    tk = T["painting"] + 0.35 + k * PULL_PERIOD
    if tk > END_FREEZE - 0.2:
        break
    if not (T["cutLab"] - 0.1 < tk < T["cutBack"] + 0.2):
        cue(tk, step[k % 2], -27, "heave")
        if k % 2 == 0:
            cue(tk + 0.05, creak(0.4, 160), -31, "rope")
    k += 1

# --- shot A
cue(T["painting"] - 0.05, shimmer(0.9, True), -19, "wake")
for i in range(4):
    cue(T["painting"] + 0.1 + i * 0.09, lib("pop"), -27 - i, "blink")
cue(T["shows"] - 0.05, lib("whoosh"), -28, "glide")
cue(T["dragging"], creak(0.6, 120), -19, "sledge-creak")
cue(T["dragging"] + 0.02, thump(55, 0.12), -17, "sledge-thump")
cue(T["giant"] - 0.08, grind(0.5), -17, "stone-eyes")
cue(T["giant"] + 0.12, lib("pop"), -21, "eyes-pop")
cue(T["statue"] + 0.02, chime((1760, 2217)), -24, "smug")
cue(T["pushMan"], lib("whoosh"), -26, "push")
cue(T["isnt"] + 0.1, lib("whoosh-short"), -24, "head-turn")
cue(T["isnt"] + 0.24, blip(500, 380, 0.14), -24, "glare")
cue(T["pouring"] + 0.1, pour(T["maybe"] - T["pouring"] - 0.1, 1.0), -17, "pour")
cue(T["maybe"] - 0.04, lib("whoosh-short"), -27, "pose")
cue(T["ritual"], chime((1318, 1661, 1976, 2637), 0.07, 0.9), -17, "ritual")
cue(T["cutLab"] - 0.2, lib("whoosh"), -22, "cut-lab")
# --- shot B
cue(T["but"] - 0.04, lib("pop"), -18, "sci-pop")
cue(T["tested"], creak(0.9, 220), -21, "strain-rope")
cue(T["tested"] + 0.02, boing(220), -21, "gauge-spring")
cue(T["tested"] + 0.1, scrape(1.2), -30, "sled-scrape")
cue(T["water2"] - 0.42, boing(330), -21, "visitor-pop")
cue(T["water2"] + 0.12, pour(0.6, 1.1), -18, "pour2")
cue(T["cut"], slide_whistle(1400, 620, 1.2), -21, "needle-down")
cue(T["half"] - 0.05, chime((2093, 2637, 3136)), -18, "half-ding")
for i in range(3):
    cue(T["not"] + i * 0.167, lib("whoosh-short"), -29, "wag")
cue(T["because"] - 0.04, blip(600, 1200, 0.14), -20, "bubble")
cue(T["because"] + 0.2, scrape(0.8), -31, "skate")
cue(T["slippery"], chime((2637, 3136)), -24, "ice-glint")
cue(T["xStamp"], stamp(), -15, "x-stamp")
cue(T["xStamp"] + 0.02, buzzer(), -24, "x-buzz")
cue(T["xStamp"] + 0.32, lib("pop"), -22, "bubble-pop")
cue(T["too"] - 0.12, lib("whoosh-short"), -24, "dump-swing")
cue(T["too"] + 0.08, splash_big(), -15, "flood")
cue(T["too"] + 0.12, pour(0.9, 0.7), -18, "flood-pour")
cue(T["worse"] - 0.05, slide_whistle(520, 1500, 0.45), -20, "needle-up")
cue(T["worse"] + 0.3, boing(180), -22, "needle-hit")
cue(T["cutBack"] - 0.2, lib("whoosh"), -22, "cut-back")
# --- shot C
for i, d in enumerate([0.3, 0.52, 0.74, 0.96]):
    cue(T["just"] + d, drip(800 + 90 * i), -21, "drip")
cue(T["glues"] - 0.04, lib("pop"), -18, "lens-pop")
cue(T["glues"], shimmer(0.6, True), -24, "lens-shimmer")
for i in range(8):
    cue(T["the1"] + i * 0.08, blip(520 + 70 * i, 820 + 90 * i, 0.09), -25, "bridge")
cue(T["together"] + 0.05, chime((1568, 1976, 2349, 3136), 0.05, 0.8), -16, "together")
cue(T["so"] - 0.06, lib("whoosh-short"), -24, "lens-out")
cue(T["doesnt"], scrape(0.45), -24, "ghost-rise")
cue(T["up"] - 0.02, stamp(), -19, "x2")
cue(T["in"] - 0.1, lib("whoosh"), -24, "pull-back")
cue(T["in"] + 0.02, lib("pop"), -24, "ghost-pop")
cue(END_FREEZE - 0.02, shimmer(0.5, False), -27, "freeze")

# ------------------------------------------------------------------ render
N = int(DUR * SR)
sfx = np.zeros(N)
for t0, x, level, _ in cues:
    s = int(t0 * SR)
    if s < 0:
        x = x[-s:]
        s = 0
    e = min(N, s + len(x))
    sfx[s:e] += x[: e - s] * db(level)

# torch crackle under the painting shots only
cr = crackle(DUR) * db(-36)
tline = np.arange(N) / SR
mask = ((tline < T["cutLab"]) | (tline >= T["cutBack"])).astype(float)
mask = np.convolve(mask, np.ones(int(0.03 * SR)) / int(0.03 * SR), mode="same")
sfx += cr * mask

voice, vsr = sf.read(HERE / "vo" / "eleven_take1.wav")
voice = voice if voice.ndim == 1 else voice.mean(1)
if vsr != SR:
    voice = signal.resample_poly(voice, SR, vsr)
voice = norm(voice, db(-3))
vtrack = np.zeros(N)
vs = int(B["voiceOffset"] * SR)
vtrack[vs:vs + len(voice)] = voice[: N - vs]

bed = music(DUR) * db(-27)
venv = np.sqrt(signal.sosfilt(signal.butter(2, 4, "lowpass", fs=SR, output="sos"), vtrack ** 2).clip(0))
venv = venv / (venv.max() + 1e-9)
bed *= 1 - 0.45 * np.clip(venv * 3, 0, 1)
fade = int(0.04 * SR)
bed[:fade] *= np.linspace(0, 1, fade)
bed[-fade:] *= np.linspace(1, 0, fade)

mix = vtrack + sfx + bed
OUT.mkdir(parents=True, exist_ok=True)
raw = OUT / "mix_raw.wav"
sf.write(raw, mix, SR, subtype="FLOAT")
sf.write(OUT / "sfx_only.wav", sfx + bed, SR, subtype="PCM_16")

TARGET = "I=-14:TP=-1.5:LRA=11"
p1 = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(raw), "-af", f"loudnorm={TARGET}:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
m = json.loads(p1[p1.rindex("{"): p1.rindex("}") + 1])
ln = (f"loudnorm={TARGET}:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}:"
      f"measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(raw), "-af", f"{ln},aresample={SR}", "-ac", "2", "-c:a", "pcm_s16le", str(OUT / "mix.wav")], check=True)
raw.unlink()
fin, _ = sf.read(OUT / "mix.wav")
print(f"mix: {len(cues)} cues, in {m['input_i']} LUFS -> -14 LUFS, peak {20 * np.log10(np.max(np.abs(fin)) + 1e-9):.1f} dBFS, {len(fin) / SR:.2f}s")
(HERE / "cues.json").write_text(json.dumps([{"t": round(t, 3), "name": n, "db": lv} for t, _, lv, n in cues], indent=0))
