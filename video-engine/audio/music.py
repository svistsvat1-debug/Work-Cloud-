"""WWII documentary underscore, composed in code (pretty_midi) and rendered with FluidSynth + FluidR3_GM (MIT).
usage: python3 music.py beats.json out.mid
Mood per bar comes from the MUSIC MOOD of the scene playing at that bar."""
import json, sys, random
import pretty_midi as pm
random.seed(7)
beats = json.load(open(sys.argv[1]))
scenes = beats["scenes"]; B = beats["beats"]
TOTAL = B[-1]["end"] + 1.5
BPM = 66.0; BEAT = 60 / BPM; BAR = 4 * BEAT
def mood_at(t):
    m = "neutral"
    for b in B:
        if b["start"] <= t: m = scenes[b["scene"]]["mood"]
    return m
# chords as MIDI roots + quality (minor key: D)
PROG = {
    "neutral": [("D", "m"), ("Bb", "M"), ("F", "M"), ("C", "M")],
    "tension": [("D", "m"), ("Bb", "M"), ("G", "m"), ("A", "M")],
    "reveal":  [("F", "M"), ("C", "M"), ("D", "m"), ("Bb", "M")],
    "calm":    [("D", "m"), ("Bb", "M"), ("F", "M"), ("A", "sus")],
}
NOTE = {"C": 48, "D": 50, "F": 53, "G": 55, "A": 57, "Bb": 46}
def chord(root, q):
    r = NOTE[root]
    third = 3 if q == "m" else (5 if q == "sus" else 4)
    return [r, r + third, r + 7]
mid = pm.PrettyMIDI(initial_tempo=BPM)
strings = pm.Instrument(program=48, name="strings")    # String Ensemble 1
cello = pm.Instrument(program=42, name="cello")        # Cello
piano = pm.Instrument(program=0, name="piano")         # Acoustic Grand
horn = pm.Instrument(program=60, name="horn")          # French Horn
timp = pm.Instrument(program=47, name="timpani")       # Timpani
drums = pm.Instrument(program=0, is_drum=True, name="snare")
nbar = int(TOTAL // BAR) + 1
idx = {k: 0 for k in PROG}
prev = None
for i in range(nbar):
    t = i * BAR
    if t > TOTAL: break
    mood = mood_at(t + 0.5)
    if mood != prev: idx[mood] = 0
    root, q = PROG[mood][idx[mood] % 4]; idx[mood] += 1; prev = mood
    c = chord(root, q)
    end = min(t + BAR, TOTAL)
    # low string pad (whole bar), soft
    vel = {"neutral": 46, "tension": 54, "reveal": 58, "calm": 40}[mood]
    for n in c: strings.notes.append(pm.Note(vel, n, t, end - 0.02))
    if mood != "tension": cello.notes.append(pm.Note(vel + 4, c[0] - 12, t, end - 0.02))
    # piano: sparse broken chord, two notes per bar (no melody)
    if mood in ("neutral", "calm", "reveal"):
        pat = [c[0] + 12, c[2] + 12] if i % 2 == 0 else [c[1] + 12, c[0] + 24]
        for k, n in enumerate(pat):
            st = t + k * 2 * BEAT
            piano.notes.append(pm.Note(30 if mood != "reveal" else 36, n, st, st + 1.8 * BEAT))
    if mood == "tension":
        # pulsing low cello eighths on the root, quiet; timpani on beat 1 every other bar; brushed snare roll every 4th bar
        for k in range(8):
            st = t + k * BEAT / 2
            cello.notes.append(pm.Note(34 if k % 2 else 42, c[0] - 12, st, st + BEAT / 2 * 0.9))
        if i % 2 == 0: timp.notes.append(pm.Note(52, c[0] - 12, t, t + BEAT * 1.5))
        if i % 4 == 3:
            for k in range(12):
                st = t + 2 * BEAT + k * BEAT / 6
                drums.notes.append(pm.Note(18 + k * 2, 38, st, st + 0.05))
    if mood == "reveal" and i % 2 == 0:
        horn.notes.append(pm.Note(44, c[1] + 12, t + BEAT, t + BAR + BEAT))
for ins in (strings, cello, piano, horn, timp, drums):
    mid.instruments.append(ins)
# gentle volume (CC7) per channel and reverb (CC91)
for ins, v in ((strings, 92), (cello, 80), (piano, 70), (horn, 64), (timp, 72), (drums, 46)):
    ins.control_changes += [pm.ControlChange(7, v, 0), pm.ControlChange(91, 70, 0)]
mid.write(sys.argv[2])
print("bars", nbar, "total", round(TOTAL, 1))
