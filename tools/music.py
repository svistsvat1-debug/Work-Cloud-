#!/usr/bin/env python3
"""Synthesize a background track arranged to the video's voiceover timeline.

Usage: python3 tools/music.py videos/01-ask-chatgpt  -> <video>/music.wav

Royalty-free by construction (pure code). Arrangement follows script.json "music":
  bpm            tempo
  breakFromSeg   segment index where the groove drops into a filtered breakdown
  dropSeg        segment index where the full groove returns (lands on a downbeat)
The beat grid is phase-locked so a bar starts exactly on the drop.
"""
import json
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy import signal

SR = 48000
rng = np.random.default_rng(11)

# A minor: Am - F - C - G (one chord per bar)
CHORDS = [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]]
BASS = [45, 41, 48, 43]


def hz(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def env_exp(n, decay):
    return np.exp(-np.arange(n) / (decay * SR))


def lp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, "lowpass", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, "highpass", fs=SR, output="sos"), x)


def kick():
    n = int(0.42 * SR)
    tt = np.arange(n) / SR
    f = 45 + 95 * np.exp(-tt / 0.035)
    x = np.tanh(2.2 * np.sin(2 * np.pi * np.cumsum(f) / SR)) * env_exp(n, 0.16)
    x[:120] += rng.standard_normal(120) * 0.25
    return x


def clap():
    n = int(0.25 * SR)
    noise = signal.sosfilt(signal.butter(2, [900, 3200], "bandpass", fs=SR, output="sos"), rng.standard_normal(n))
    e = np.zeros(n)
    for d in (0.0, 0.011, 0.022):
        s = int(d * SR)
        e[s:] = np.maximum(e[s:], env_exp(n - s, 0.012 if d < 0.02 else 0.07))
    return noise * e


def hat(open_=False):
    n = int((0.22 if open_ else 0.05) * SR)
    return hp(rng.standard_normal(n), 7500) * env_exp(n, 0.07 if open_ else 0.012)


def saw(freq, n, detune=(0.0,)):
    tt = np.arange(n) / SR
    return sum(signal.sawtooth(2 * np.pi * freq * (1 + d) * tt + rng.uniform(0, 6.28)) for d in detune) / len(detune)


def place(track, x, pos, gain=1.0):
    if pos >= len(track):
        return
    end = min(len(track), pos + len(x))
    track[pos:end] += x[: end - pos] * gain


def block_filter(x, cutoff_fn, block=1024):
    """Time-varying low-pass: cutoff_fn(time_sec) -> Hz."""
    out, zi = np.zeros_like(x), None
    for i in range(0, len(x), block):
        sos = signal.butter(2, min(cutoff_fn(i / SR), SR / 2 - 200), "lowpass", fs=SR, output="sos")
        if zi is None:
            zi = signal.sosfilt_zi(sos) * 0
        out[i:i + block], zi = signal.sosfilt(sos, x[i:i + block], zi=zi)
    return out


def main(video_dir):
    video_dir = Path(video_dir)
    cfg = json.loads((video_dir / "script.json").read_text())["music"]
    ts = json.loads((video_dir / "timestamps.json").read_text())
    segs = ts["segments"]
    total = ts["duration"]
    beat = 60.0 / cfg["bpm"]
    bar = 4 * beat
    t_drop = segs[cfg["dropSeg"]]["start"]
    t_break = segs[cfg["breakFromSeg"]]["start"]
    # phase-lock grid: a bar starts on the drop
    first = t_drop - np.ceil(t_drop / bar) * bar
    n = int((total + 0.5) * SR)

    drums, bass, pads, plucks = (np.zeros(n) for _ in range(4))
    pump = np.ones(n)
    k, cl, ch, oh = kick(), clap(), hat(), hat(True)

    b = 0
    while True:
        t_bar = first + b * bar
        if t_bar > total:
            break
        chord, root = CHORDS[b % 4], BASS[b % 4]
        for s16 in range(16):
            tt = t_bar + s16 * beat / 4
            if tt < 0 or tt > total:
                continue
            pos = int(tt * SR)
            in_break = t_break <= tt < t_drop
            after_drop = tt >= t_drop
            if not in_break:
                if s16 % 4 == 0:
                    place(drums, k, pos, 0.9)
                    pump[pos:pos + int(0.18 * SR)] = np.minimum(
                        pump[pos:pos + int(0.18 * SR)], 0.35 + 0.65 * np.linspace(0, 1, min(int(0.18 * SR), n - pos)) ** 0.7)
                if s16 in (4, 12):
                    place(drums, cl, pos, 0.5)
                if s16 % 2 == 0:
                    place(drums, ch, pos, 0.18 if s16 % 4 else 0.1)
                if after_drop and s16 % 4 == 2:
                    place(drums, oh, pos, 0.16)
                # bass: offbeat 8ths
                if s16 % 4 == 2 or (after_drop and s16 in (7, 15)):
                    ln = int(beat / 2 * SR * 0.9)
                    note = np.tanh(1.5 * np.sin(2 * np.pi * hz(root) * np.arange(ln) / SR)) * np.minimum(1, (ln - np.arange(ln)) / 600)
                    place(bass, lp(note + 0.3 * saw(hz(root), ln), 600), pos, 0.55)
            else:
                if s16 % 2 == 1:
                    place(drums, ch, pos, 0.07)
            # plucks: arp after drop, sparse before
            if (after_drop and s16 % 2 == 0) or (not in_break and not after_drop and s16 in (0, 6, 10)):
                ln = int(0.22 * SR)
                m = chord[(s16 // 2) % 3] + 12
                p = lp(saw(hz(m), ln, (0, 0.006)), 2600) * env_exp(ln, 0.06)
                place(plucks, p, pos, 0.16)
        # pad: whole bar chord
        ln = int(bar * SR)
        pos = int(max(t_bar, 0) * SR)
        skip = int(max(0, -t_bar) * SR)
        pad = sum(saw(hz(m), ln, (-0.004, 0, 0.005)) for m in chord) / 3
        pad *= np.minimum(1, np.arange(ln) / (0.08 * SR)) * np.minimum(1, (ln - np.arange(ln)) / (0.08 * SR))
        place(pads, lp(pad, 1400)[skip:], pos, 0.22)
        b += 1

    # breakdown: muffle pads, open the filter into the drop
    def cutoff(sec):
        if sec < t_break or sec >= t_drop:
            return 4000
        prog = max(0.0, (sec - (t_drop - 2.0)) / 2.0)
        return 350 + 3650 * prog ** 2

    pads = block_filter(pads, cutoff)
    plucks = block_filter(plucks, cutoff)
    mix = drums + (bass + pads * 0.9 + plucks) * pump
    mix = np.tanh(1.2 * mix) / np.tanh(1.2)
    fade = int(0.6 * SR)
    mix[-fade:] *= np.linspace(1, 0, fade)
    mix[:int(0.005 * SR)] *= np.linspace(0, 1, int(0.005 * SR))
    mix = hp(mix, 30)
    mix *= 0.85 / (np.max(np.abs(mix)) + 1e-9)
    stereo = np.stack([mix, np.roll(mix, int(0.0004 * SR))], axis=1)  # tiny width
    sf.write(video_dir / "music.wav", stereo.astype(np.float32), SR, subtype="PCM_16")
    print(f"music: {cfg['bpm']} bpm, drop @ {t_drop:.2f}s, break @ {t_break:.2f}s, {total:.2f}s")


if __name__ == "__main__":
    main(sys.argv[1])
