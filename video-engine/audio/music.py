"""Compose the background underscore as 4 harmonically-locked mood stems (MIDI -> FluidSynth).
usage: python3 music.py <out_dir> <duration_sec>
All stems share tempo + chord progression, so the mixer can crossfade between moods at any scene cut."""
import sys, os, subprocess, random
import pretty_midi as pm

OUT, DUR = sys.argv[1], float(sys.argv[2])
SF2 = "/usr/share/sounds/sf2/FluidR3_GM.sf2"  # MIT license (Frank Wen)
BPM = 68
BEAT = 60 / BPM
BAR = 4 * BEAT
NBARS = int(DUR / BAR) + 3
random.seed(1945)

# D minor progression, 8 bars: Dm Bb F C | Dm Gm Bb A
PROG = [
    [38, 45, 50, 53, 57],  # Dm
    [34, 41, 46, 50, 53],  # Bb
    [41, 48, 53, 57, 60],  # F
    [36, 43, 48, 52, 55],  # C
    [38, 45, 50, 53, 57],  # Dm
    [31, 38, 43, 46, 50],  # Gm
    [34, 41, 46, 50, 53],  # Bb
    [33, 40, 45, 49, 52],  # A
]

def inst(prog, name, drum=False):
    return pm.Instrument(program=prog, is_drum=drum, name=name)

def note(i, p, s, e, v):
    i.notes.append(pm.Note(velocity=max(1, min(127, int(v))), pitch=p, start=s, end=e))

def stem(kind):
    m = pm.PrettyMIDI(initial_tempo=BPM)
    strings = inst(48, "strings")
    for b in range(NBARS):
        ch = PROG[b % 8]
        t0 = b * BAR
        if kind == "neutral":
            for p in ch[1:4]:
                note(strings, p, t0, t0 + BAR + 0.15, 42)
        elif kind == "tension":
            for p in ch[:3]:
                note(strings, p, t0, t0 + BAR + 0.15, 40)
        elif kind == "reveal":
            for p in ch[1:]:
                note(strings, p + 12 if p < 45 else p, t0, t0 + BAR + 0.15, 48)
        else:  # calm
            for p in ch[2:4]:
                note(strings, p, t0, t0 + BAR + 0.2, 32)
    m.instruments.append(strings)
    if kind in ("neutral", "calm", "reveal"):
        piano = inst(0, "piano")
        for b in range(NBARS):
            ch = PROG[b % 8]
            t0 = b * BAR
            if kind == "neutral":  # soft broken chord, quarter notes
                seq = [ch[2] + 12, ch[3] + 12, ch[4] + 12, ch[3] + 12]
                for k, p in enumerate(seq):
                    note(piano, p, t0 + k * BEAT, t0 + (k + 1.6) * BEAT, 34 + random.randint(-3, 3))
            elif kind == "calm":  # two sparse notes per bar
                note(piano, ch[3] + 12, t0, t0 + 2.2 * BEAT, 30)
                note(piano, ch[4] + 12, t0 + 2 * BEAT, t0 + 4.2 * BEAT, 27)
            else:  # reveal: block chord on 1, octave on 3
                for p in ch[2:5]:
                    note(piano, p + 12, t0, t0 + 2 * BEAT, 36)
                note(piano, ch[1] + 24, t0 + 2 * BEAT, t0 + 3.8 * BEAT, 32)
        m.instruments.append(piano)
    if kind == "tension":
        cello = inst(42, "cello")
        bass = inst(43, "contrabass")
        timp = inst(47, "timpani")
        drums = inst(0, "snare", drum=True)
        for b in range(NBARS):
            ch = PROG[b % 8]
            t0 = b * BAR
            for k in range(8):  # eighth-note pulse root/fifth
                p = ch[0] + 12 if k % 2 == 0 else ch[1] + 12
                note(cello, p, t0 + k * BEAT / 2, t0 + (k + 0.9) * BEAT / 2, 40 + (8 if k == 0 else 0))
            note(bass, ch[0], t0, t0 + BAR, 46)
            if b % 2 == 0:
                note(timp, ch[0] + 12 if ch[0] < 40 else ch[0], t0, t0 + 1.5, 52)
            if b % 4 == 3:  # soft snare roll building into the next phrase
                for k in range(12):
                    note(drums, 38, t0 + 2 * BEAT + k * BEAT / 6, t0 + 2 * BEAT + k * BEAT / 6 + 0.08, 18 + k * 2)
        m.instruments += [cello, bass, timp, drums]
    if kind == "reveal":
        horn = inst(60, "horn")
        for b in range(0, NBARS, 2):
            ch = PROG[b % 8]
            t0 = b * BAR
            note(horn, ch[2] + 12, t0 + BEAT, t0 + BAR + 2 * BEAT, 44)  # distant swell
            note(horn, ch[3] + 12, t0 + BAR + 2 * BEAT, t0 + 2 * BAR, 40)
        m.instruments.append(horn)
    return m

os.makedirs(OUT, exist_ok=True)
for kind in ["neutral", "tension", "reveal", "calm"]:
    mid = os.path.join(OUT, f"{kind}.mid")
    wav = os.path.join(OUT, f"{kind}.wav")
    stem(kind).write(mid)
    subprocess.run(["fluidsynth", "-ni", "-q", "-g", "0.5", "-r", "48000", "-F", wav, SF2, mid], check=True)
    print("rendered", wav)
