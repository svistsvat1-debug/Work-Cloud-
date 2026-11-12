"""Final audio mix: voice (-14 LUFS target), SFX 12-18 dB under, ambience beds further under,
music 25-30 dB under the voice with sidechain-style ducking driven by the aligned speech times.

Usage: python3 tools/mix.py <voice> <sentences.json> <timeline.cues.json> <audio_plan.json> <music.wav> <amb_dir> <sfx_dir> <total_seconds> <out.wav>

audio_plan.json: {"ambience": {"<scene>": "<bed name>"}, "sfx": {"<shot id>": "<file stem>"}, "sfx_gain_db": {"<file stem>": dB}}
Levels are relative to the voice's own loudness, so they hold whatever the recording level is.
Final loudness: two-pass ffmpeg loudnorm to -14 LUFS integrated, true peak <= -1.5 dBTP.
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
import pyloudnorm as pyln
import soundfile as sf

voice_p, sents_p, cues_p, plan_p, music_p, amb_dir, sfx_dir, total_s, out_p = sys.argv[1:10]
SR = 48000
total = float(total_s)
N = int(total * SR)
tmp = Path(out_p).with_suffix('')
tmp.parent.mkdir(parents=True, exist_ok=True)

# settings (dB relative to voice integrated loudness)
MUSIC_UNDER = 27.0  # music this many dB under the voice while speaking
MUSIC_LIFT = 4.0  # lift in pauses
SFX_UNDER = 15.0
AMB_UNDER = 24.0
meter = pyln.Meter(SR)


def load(p):
    wav = tmp.with_name(Path(p).stem + '_48k.wav')
    subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', str(p), '-ar', str(SR), '-ac', '2', str(wav)], check=True)
    x, _ = sf.read(wav, dtype='float32')
    wav.unlink()
    return x


def loud(x):
    try:
        return meter.integrated_loudness(x)
    except Exception:
        return -70.0


def gain_to(x, target_lufs, ref=None):
    l = loud(x) if ref is None else ref
    if l < -69:
        return x
    return x * (10 ** ((target_lufs - l) / 20))


def place(bus, x, start):
    a = int(start * SR)
    if a >= len(bus):
        return
    b = min(len(bus), a + len(x))
    bus[a:b] += x[: b - a]


# ---- voice ----
voice = load(voice_p)
voice = gain_to(voice, -16.0)  # working level; final loudnorm brings mix to -14
V = -16.0
bus_v = np.zeros((N, 2), np.float32)
place(bus_v, voice, 0.0)

sents = json.loads(Path(sents_p).read_text())
cues = json.loads(Path(cues_p).read_text())
plan = json.loads(Path(plan_p).read_text())

# speech activity envelope (from aligned sentence times, 120 ms padding)
act = np.zeros(N, np.float32)
for s in sents:
    a = max(0, int((s['start'] - 0.12) * SR))
    b = min(N, int((s['end'] + 0.12) * SR))
    act[a:b] = 1
# smooth: attack ~0.25 s, release ~0.6 s (one-pole)
def smooth_env(x, att, rel):
    y = np.zeros_like(x)
    a1 = np.exp(-1 / (att * SR))
    a2 = np.exp(-1 / (rel * SR))
    v = 0.0
    # vectorised enough: process in 10 ms blocks
    blk = 480
    for i in range(0, len(x), blk):
        tgt = x[i:i + blk].max()
        c = a1 if tgt > v else a2
        v = tgt + (v - tgt) * (c ** blk)
        y[i:i + blk] = v
    return y
env = smooth_env(act, 0.25, 0.6)

# ---- music ----
music = load(music_p)
music = gain_to(music, V - MUSIC_UNDER)
m = np.zeros((N, 2), np.float32)
place(m, music, 0.0)
duck_db = -MUSIC_LIFT * 0 + MUSIC_LIFT * (1 - env)  # +4 dB in pauses, 0 dB while speaking
m *= (10 ** (duck_db / 20))[:, None]

# ---- ambience beds per scene, 1.5 s crossfades ----
amb = np.zeros((N, 2), np.float32)
for sc in cues['scenes']:
    name = plan.get('ambience', {}).get(str(sc['scene']))
    if not name:
        continue
    bed, _ = sf.read(Path(amb_dir) / f'{name}.wav', dtype='float32')
    bed = gain_to(bed, V - AMB_UNDER)
    a, b = int(max(0, sc['start'] - 0.75) * SR), int(min(total, sc['end'] + 0.75) * SR)
    L = b - a
    reps = int(np.ceil(L / len(bed)))
    seg = np.tile(bed, (reps, 1))[:L]
    f = int(1.5 * SR)
    ramp = np.ones(L, np.float32)
    ramp[:f] = np.linspace(0, 1, min(f, L))[: min(f, L)]
    ramp[-f:] = np.minimum(ramp[-f:], np.linspace(1, 0, f))
    amb[a:b] += seg * ramp[:, None]
# beds also duck a little under speech
amb *= (10 ** ((-3 * env) / 20))[:, None]

# ---- SFX (one accent per listed shot, at shot start = inside the pause) ----
sfx = np.zeros((N, 2), np.float32)
placed = []
for shot in cues['shots']:
    stem = plan.get('sfx', {}).get(shot['id'])
    if not stem:
        continue
    p = Path(sfx_dir) / f'{stem}.wav'
    if not p.exists():
        p = Path(sfx_dir) / f'{stem}.mp3'
    if not p.exists():
        print('missing sfx', stem)
        continue
    x = load(p)
    # normalise by short-term peak loudness so short hits and long beds sit alike
    win = min(len(x), int(0.4 * SR))
    best = -70
    for i in range(0, max(1, len(x) - win), int(0.1 * SR)):
        best = max(best, loud(x[i:i + win]) if win >= int(0.4 * SR) else -70)
    ref = best if best > -69 else loud(x)
    x = gain_to(x, V - SFX_UNDER + plan.get('sfx_gain_db', {}).get(stem, 0.0), ref=ref)
    start = max(0.0, shot['start'] + 0.15)
    # keep the accent off the words: fade it to -10 dB once the sentence starts
    place(sfx, x, start)
    placed.append((shot['id'], stem, round(start, 2)))
sfx *= (10 ** ((-8 * env) / 20))[:, None]

mix = bus_v + m + amb + sfx
pre = tmp.with_name(tmp.name + '_pre.wav')
sf.write(pre, mix, SR, subtype='FLOAT')

# ---- final loudness: two-pass loudnorm ----
r = subprocess.run(['ffmpeg', '-hide_banner', '-i', str(pre), '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True)
js = json.loads(r.stderr[r.stderr.rindex('{'):r.stderr.rindex('}') + 1])
af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:measured_LRA={js['input_lra']}"
      f":measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true:print_format=summary")
subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', str(pre), '-af', af, '-ar', str(SR), '-ac', '2', '-c:a', 'pcm_s24le', out_p], check=True)
pre.unlink()

# report
fin, _ = sf.read(out_p, dtype='float32')
speech = env > 0.9
def seg_loud(x, mask):
    idx = np.where(mask)[0]
    return loud(x[idx]) if idx.size > SR else -70
print('final integrated LUFS:', round(loud(fin), 1))
print('music vs voice while speaking (dB):', round(seg_loud(m, speech) - seg_loud(bus_v, speech), 1))
print('sfx placed:', len(placed), placed[:8])
