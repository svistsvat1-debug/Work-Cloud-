#!/usr/bin/env python3
"""Compose a WWII-documentary underscore from scratch (MIDI) and render it with FluidSynth.

Usage: compose_music.py <timeline.json> <out_dir> [--sf2 /usr/share/sounds/sf2/FluidR3_GM.sf2]

- 4 mood stems (neutral / tension / reveal / calm), same harmony, D minor, 66 BPM.
- Stems are rendered full-length; mix_audio.py crossfades them by the MUSIC MOOD
  of each scene (from timeline.json).
- No lead melody: pads, low strings, sparse low piano, horn swells, soft timpani/snare
  only in tension/reveal. Nothing competes with the voice.
Soundfont: FluidR3_GM (MIT licence, Frank Wen) - commercial use allowed.
"""
import json
import subprocess
import sys
from pathlib import Path

import pretty_midi as pm

BPM = 66
BEAT = 60 / BPM
BAR = 4 * BEAT

# D minor progression, 2 bars per chord (i - VI - iv - V(sus) / i - VI - III - V)
PROG = [
    ("Dm", [38, 50, 53, 57], 2),
    ("Bb", [34, 46, 50, 53], 2),
    ("Gm", [31, 43, 46, 50], 2),
    ("A", [33, 45, 49, 52], 2),
    ("Dm", [38, 50, 53, 57], 2),
    ("Bb", [34, 46, 50, 53], 2),
    ("F", [29, 41, 45, 48], 2),
    ("Asus", [33, 45, 50, 52], 2),
]
# reveal uses a brighter lift
PROG_REVEAL = [
    ("Bb", [34, 46, 50, 53], 2),
    ("F", [29, 41, 45, 48], 2),
    ("C", [36, 48, 52, 55], 2),
    ("Dm", [38, 50, 53, 57], 2),
]


def chords(total, prog):
    t = 0.0
    while t < total:
        for name, notes, bars in prog:
            d = bars * BAR
            yield t, d, name, notes
            t += d
            if t >= total:
                return


def inst(prog_no, name, is_drum=False):
    return pm.Instrument(program=prog_no, is_drum=is_drum, name=name)


def add(i, pitch, s, e, v):
    i.notes.append(pm.Note(velocity=int(max(1, min(127, v))), pitch=int(pitch), start=s, end=e))


def stem(mood, total):
    m = pm.PrettyMIDI(initial_tempo=BPM)
    strings = inst(48, "strings")      # String Ensemble 1
    slow = inst(49, "slow strings")    # String Ensemble 2
    cello = inst(42, "cello")
    piano = inst(0, "piano")
    horn = inst(60, "french horn")
    trem = inst(44, "tremolo strings")
    timp = inst(47, "timpani")
    drums = inst(0, "drums", is_drum=True)
    prog = PROG_REVEAL if mood == "reveal" else PROG
    bar_i = 0
    for t, d, name, notes in chords(total, prog):
        root = notes[0]
        if mood == "neutral":
            for n in notes[1:]:
                add(slow, n, t, t + d, 46)
            add(cello, root + 12, t, t + d, 52)
            # sparse low piano: two soft notes per chord
            add(piano, notes[1], t + BEAT * 0.0, t + BEAT * 3, 34)
            add(piano, notes[2], t + BAR + BEAT * 2, t + BAR + BEAT * 5, 30)
        elif mood == "tension":
            for n in notes[1:3]:
                add(trem, n, t, t + d, 44)
            add(strings, root + 12, t, t + d, 48)
            # cello ostinato (eighths) on the root, low and soft
            k = 0
            x = t
            while x < t + d - 1e-6:
                add(cello, root + 12 + (7 if k % 4 == 3 else 0), x, x + BEAT / 2 * 0.9, 50 if k % 2 == 0 else 38)
                x += BEAT / 2
                k += 1
            # timpani on the downbeat of each chord, soft
            add(timp, root + 12 if root + 12 >= 40 else root + 24, t, t + BEAT * 2, 62)
            # light military snare: soft roll swell in the last beat of every 2nd chord
            if bar_i % 2 == 1:
                x = t + d - BEAT
                v = 18
                while x < t + d - 0.02:
                    add(drums, 38, x, x + 0.05, v)
                    x += BEAT / 8
                    v += 3
        elif mood == "reveal":
            for n in notes[1:]:
                add(strings, n, t, t + d, 56)
            add(cello, root + 12, t, t + d, 58)
            # distant horn swell on chord tones (no melody: long held 5th)
            add(horn, notes[2], t + BEAT, t + d, 48)
            add(horn, notes[1], t + BEAT, t + d, 44)
            add(timp, root + 12 if root + 12 >= 40 else root + 24, t, t + BEAT * 2, 70)
            # timpani roll into the next chord
            x = t + d - BEAT
            v = 30
            while x < t + d - 0.02:
                add(timp, root + 12 if root + 12 >= 40 else root + 24, x, x + 0.08, v)
                x += BEAT / 6
                v += 4
        elif mood == "calm":
            for n in notes[1:]:
                add(slow, n, t, t + d, 38)
            # gentle piano, broken chord in the low-middle register, very sparse
            for j, n in enumerate(notes[1:]):
                add(piano, n, t + j * BEAT * 1.5, t + j * BEAT * 1.5 + BEAT * 3, 32 - j * 2)
        bar_i += 1
    for i in (strings, slow, cello, piano, horn, trem, timp, drums):
        if i.notes:
            m.instruments.append(i)
    return m


def main():
    tl = json.loads(Path(sys.argv[1]).read_text())
    out = Path(sys.argv[2])
    out.mkdir(parents=True, exist_ok=True)
    sf2 = sys.argv[sys.argv.index("--sf2") + 1] if "--sf2" in sys.argv else "/usr/share/sounds/sf2/FluidR3_GM.sf2"
    total = tl["duration"] + 2
    for mood in ("neutral", "tension", "reveal", "calm"):
        mid = out / f"music_{mood}.mid"
        stem(mood, total).write(str(mid))
        wav = out / f"music_{mood}.wav"
        subprocess.run(["fluidsynth", "-ni", "-g", "0.6", "-r", "48000", "-F", str(wav), sf2, str(mid)], check=True,
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print("rendered", wav)


if __name__ == "__main__":
    main()
