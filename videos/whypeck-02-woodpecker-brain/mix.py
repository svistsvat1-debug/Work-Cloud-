#!/usr/bin/env python3
"""Sound for WhyPeck #2: synthesized SFX (royalty-free by construction) + light pizzicato bed + the
ElevenLabs voice, all placed on the beat table, then loudness-normalised.

Usage: python3 videos/whypeck-02-woodpecker-brain/mix.py
Reads  studio/src/videos/wp02/beats.json, vo/eleven_mark_take1.wav, studio/public/sfx/*.wav
Writes studio/public/gen/wp02/mix.wav (used by the Remotion composition), sfx_only.wav, cues.json
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
OUT = ROOT / "studio" / "public" / "gen" / "wp02"
B = json.loads((ROOT / "studio" / "src" / "videos" / "wp02" / "beats.json").read_text())
T = B["T"]
DUR = B["duration"]
rng = np.random.default_rng(42)


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


def sine_sweep(f0, f1, dur, curve=1.0):
    t = tt(dur)
    f = f0 * (f1 / f0) ** ((t / dur) ** curve)
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def lib(name):
    x, sr = sf.read(LIB / f"{name}.wav")
    return x if x.ndim == 1 else x.mean(1)


# ------------------------------------------------------------------ synthesized effects
def tok(pitch=1.0):
    """woodpecker peck: hard wooden knock"""
    n = int(0.12 * SR)
    t = tt(0.12)
    click = rng.standard_normal(n) * env(n, 0.0003, 0.004)
    body = sum(a * np.sin(2 * np.pi * f * pitch * t) * np.exp(-t / d) for f, a, d in [(820, 1, 0.022), (1450, 0.6, 0.014), (2600, 0.35, 0.008)])
    return norm(hp(bp(click, 900, 6000) * 0.8 + body, 200))


def clunk():
    """helmet landing: plastic thump + rattle"""
    t = tt(0.5)
    n = len(t)
    thump = np.sin(2 * np.pi * (90 + 120 * np.exp(-t / 0.03)) * t) * np.exp(-t / 0.12)
    knock = bp(rng.standard_normal(n), 500, 2500) * np.exp(-t / 0.05)
    ring = sum(np.sin(2 * np.pi * f * t) * np.exp(-t / 0.09) * a for f, a in [(640, 0.4), (1110, 0.25)])
    return norm(thump + 0.7 * knock + ring)


def bonk():
    """football hitting a helmet: rubbery bonk"""
    t = tt(0.32)
    f = 330 * np.exp(-t / 0.08) + 150
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.09)
    slap = bp(rng.standard_normal(len(t)), 800, 4000) * np.exp(-t / 0.012)
    return norm(tone + 0.5 * slap)


def chime(notes=(1568, 2093, 2637), gap=0.06, dur=0.7):
    """sparkle: bell arpeggio"""
    out = np.zeros(int((dur + gap * len(notes)) * SR))
    for i, f in enumerate(notes):
        t = tt(dur)
        tone = (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * f * 2.76 * t)) * np.exp(-t / 0.18)
        s = int(i * gap * SR)
        out[s:s + len(tone)] += tone
    return norm(out)


def twinkle():
    """dizzy stars: little rising/falling glints"""
    notes = (2349, 2794, 2349, 3136, 2637)
    return chime(notes, gap=0.07, dur=0.45)


def scan(up=True):
    """x-ray scanner: soft filtered sweep with shimmer"""
    d = 0.42
    s = sine_sweep(500, 1500, d) if up else sine_sweep(1500, 500, d)
    trem = 0.75 + 0.25 * np.sin(2 * np.pi * 28 * tt(d))
    e = np.sin(np.pi * np.linspace(0, 1, len(s))) ** 0.6
    shimmer = bp(rng.standard_normal(len(s)), 3000, 7000) * 0.15
    return norm((s * 0.8 + shimmer) * trem * e)


def paper():
    """calendar page flip"""
    t = tt(0.25)
    n = len(t)
    x = bp(rng.standard_normal(n), 1500, 7000) * (np.sin(np.pi * np.minimum(1, t / 0.2)) ** 2)
    flick = bp(rng.standard_normal(n), 2000, 5000) * np.exp(-np.maximum(0, t - 0.17) / 0.01) * (t > 0.17)
    return norm(x + 1.4 * flick)


def flaps(count=5, rate=0.07):
    out = np.zeros(int((count * rate + 0.2) * SR))
    for i in range(count):
        n = int(0.09 * SR)
        f = bp(rng.standard_normal(n), 300, 2200) * env(n, 0.01, 0.03)
        s = int(i * rate * SR)
        out[s:s + n] += f * (0.7 + 0.3 * rng.random())
    return norm(out)


def thud():
    t = tt(0.25)
    return norm(np.sin(2 * np.pi * (70 + 60 * np.exp(-t / 0.02)) * t) * np.exp(-t / 0.07) + 0.3 * bp(rng.standard_normal(len(t)), 200, 1200) * np.exp(-t / 0.03))


def crack():
    t = tt(0.4)
    n = len(t)
    out = np.zeros(n)
    for i in range(14):
        s = int((0.012 * i + 0.004 * rng.random()) * SR)
        m = int(0.02 * SR)
        if s + m < n:
            out[s:s + m] += bp(rng.standard_normal(m), 1500, 8000) * env(m, 0.0005, 0.004) * (1 - i / 16)
    low = np.sin(2 * np.pi * 120 * t) * np.exp(-t / 0.06) * 0.6
    return norm(out + low)


def boing():
    t = tt(0.55)
    f = 260 + 120 * np.sin(2 * np.pi * 9 * t) * np.exp(-t / 0.25) + 160 * np.exp(-t / 0.05)
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.22))


def blip(f0=700, f1=1100, d=0.12):
    s = sine_sweep(f0, f1, d)
    return norm(s * env(len(s), 0.003, d / 3))


def drip():
    t = tt(0.18)
    return norm(np.sin(2 * np.pi * np.cumsum(900 + 1300 * (t / 0.18)) / SR) * env(len(t), 0.002, 0.04))


def gulp():
    t = tt(0.35)
    f = 420 * np.exp(-t / 0.12) + 110
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * np.minimum(1, t / 0.3)) ** 0.5 * np.exp(-t / 0.25))


def whistle_fall(d):
    s = sine_sweep(1500, 520, d, 1.2)
    vib = 1 + 0.004 * np.sin(2 * np.pi * 7 * tt(d))
    return norm(s * vib * np.minimum(1, tt(d) / 0.04))


def bubble_pop(f):
    t = tt(0.14)
    s = np.sin(2 * np.pi * np.cumsum(f * (1 + 1.6 * (t / 0.14))) / SR) * env(len(t), 0.002, 0.035)
    return norm(s)


# ------------------------------------------------------------------ music bed (pizzicato, C major)
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
    bpm = 112
    beat = 60 / bpm
    mid = lambda m: 440 * 2 ** ((m - 69) / 12)  # noqa: E731
    chords = [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]]
    bass = [36, 33, 29, 31]
    out = np.zeros(int(length * SR) + SR)
    cache = {}

    def note(m, dur, b):
        k = (m, round(dur, 3), b)
        if k not in cache:
            cache[k] = pluck(mid(m), dur, b)
        return cache[k]

    nbeats = int(length / beat) + 1
    pattern = [0, 2, 1, 2, 0, 2, 1, 2]
    for i in range(nbeats):
        bar = (i // 4) % 4
        s = int(i * beat * SR)
        if i % 2 == 0:
            x = note(bass[bar] + 12, beat * 1.6, 0.2) * 0.9
            out[s:s + len(x)] += x[: len(out) - s]
        for h in range(2):  # eighth notes
            m = chords[bar][pattern[(2 * i + h) % 8]] + 12
            x = note(m, beat * 0.9, 0.55) * (0.5 if h else 0.62)
            ss = s + int(h * beat / 2 * SR)
            if ss < len(out):
                out[ss:ss + len(x)] += x[: len(out) - ss]
    out = out[: int(length * SR)]
    # gentle stereo-free room
    ir = rng.standard_normal(int(0.25 * SR)) * np.exp(-np.arange(int(0.25 * SR)) / (0.05 * SR))
    wet = signal.fftconvolve(out, lp(ir, 5000))[: len(out)]
    out = out + 0.08 * norm(wet) * np.max(np.abs(out))
    return norm(out)


# ------------------------------------------------------------------ cue list
def db(x):
    return 10 ** (x / 20)


cues = []  # (time, sound, dB, name)


def cue(t, x, level, name):
    cues.append((float(t), x, level, name))


toks = [tok(1.0), tok(1.07), tok(0.94)]
for p in B["pecks"]:
    if 0 <= p["t"] < DUR:
        cue(p["t"] - 0.002, toks[p["j"]], -15, "tok")

cue(T["turnFront"] - 0.08, lib("whoosh-short"), -26, "swap")
cue(T["knocked"], twinkle(), -21, "stars")
for i in range(3):
    cue(T["out"] + 0.11 + i * 0.04, lib("pop"), -27, "stars-out")
cue(T["so1"], scan(True), -19, "scan")
cue(T["fine"], chime(), -19, "sparkle")
cue(T["doubt"] + 0.1, drip(), -25, "drip")
cue(T["cutMuseum"] - 0.32, lib("whoosh"), -24, "cut")
cue(T["y2018"], paper(), -17, "paper")
cue(T["checked"] - 0.05, lib("whoosh-short"), -22, "magnifier")
cue(T["checked"] + 0.36, lib("tick"), -22, "mag-stop")
cue(T["wpBrains"], lib("pop"), -19, "eyes")
for i, d in enumerate([0, 0.09, 0.18, 0.27]):
    cue(T["museums"] + d, lib("pop"), -23 - i, "eyes2")
cue(T["lensZoom"] - 0.05, lib("riser"), -24, "zoom")
for i in range(6):
    cue(T["clumps"] + i * 0.085, bubble_pop(380 + 70 * i), -17, "clump")
cue(T["protein"] + 0.12, drip(), -24, "drip")
cue(T["tau"], gulp(), -17, "gulp")
cue(T["cutFootball"] - 0.3, lib("whoosh"), -25, "cut")
cue(T["football"], whistle_fall(T["players"] - T["football"]), -22, "fall")
cue(T["players"], clunk(), -13, "clunk")
cue(T["buildup"] + 0.05, drip(), -24, "drip")
cue(T["damage1"], twinkle(), -20, "dizzy")
for h in ("hit1", "hit2", "hit3"):
    cue(T[h] - 0.28, lib("whoosh-short"), -29, "ball")
    cue(T[h], bonk(), -14, "bonk")
cue(T["cutBird"], flaps(6, 0.06), -20, "flaps")
cue(T["blackbirds"], thud(), -19, "land")
cue(T["dontPeck"], lib("whoosh-short"), -30, "nope")
cue(T["dontPeck"] + 0.3, lib("whoosh-short"), -31, "nope")
cue(T["showed"], scan(True), -18, "scan2")
cue(T["none"] + 0.05, chime((2093, 2637, 3136, 4186)), -16, "clean")
cue(T["pushBrain"] + 0.06, flaps(7, 0.065), -22, "takeoff")
cue(T["pushBrain"] - 0.1, lib("whoosh"), -27, "push")
cue(T["damage2"], crack(), -13, "crack")
cue(T["protection"], boing(), -15, "helmet-pop")
cue(T["protection"] + 0.1, chime((1760, 2349, 2794)), -21, "sparkle")
cue(T["pullBack"] - 0.05, lib("whoosh"), -27, "pull")
cue(T["pullBack"] + 0.06, scan(False), -20, "scan-off")
cue(T["nobody"] - 0.05, lib("whoosh-short"), -29, "shrug")
for i in range(3):
    cue(T["nobody"] + 0.16 + i * 0.15, blip(620 + 120 * i, 1000 + 160 * i), -22, "q")
cue(T["yet"] + 0.12, lib("pop"), -27, "q-out")
cue(T["turnBack"], lib("whoosh-short"), -27, "swap")

# ------------------------------------------------------------------ render
N = int(DUR * SR)
sfx = np.zeros(N)
for t, x, level, _ in cues:
    s = int(t * SR)
    if s < 0:
        x = x[-s:]
        s = 0
    e = min(N, s + len(x))
    sfx[s:e] += x[: e - s] * db(level)

voice, vsr = sf.read(HERE / "vo" / "eleven_mark_take1.wav")
assert vsr == SR
voice = voice if voice.ndim == 1 else voice.mean(1)
voice = norm(voice, db(-3))
vtrack = np.zeros(N)
vs = int(B["voiceOffset"] * SR)
vtrack[vs:vs + len(voice)] = voice[: N - vs]

bed = music(DUR) * db(-27)
# duck the bed under the voice (smoothed envelope)
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

# two-pass loudnorm to -14 LUFS, -1.5 dBTP
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
