"""Compose a quiet WWII-documentary underscore that follows the MUSIC MOOD map of the scenes.
100% code: MIDI (mido) -> FluidSynth + FluidR3_GM (MIT licence).
usage: python music/compose.py src/data/timing.json out/music.mid"""
import json, sys, random
import mido

T = json.load(open(sys.argv[1]))
BPM = 68
SPB = 60 / BPM                    # seconds per beat
TPB = 480
def tick(sec): return int(round(sec / SPB * TPB))

# D minor family. Each chord = (bass, [voicing]) as MIDI notes
CH = {
    'Dm': (38, [50, 53, 57, 62]), 'Bb': (34, [50, 53, 58, 62]), 'Gm': (31, [50, 55, 58, 62]), 'A': (33, [49, 52, 57, 61]),
    'F': (29, [48, 53, 57, 60]), 'C': (36, [48, 52, 55, 60]), 'Am': (33, [48, 52, 57, 60]), 'Gm/D': (38, [50, 55, 58, 62]),
}
PROG = {
    'neutral': ['Dm', 'Bb', 'F', 'C', 'Dm', 'Gm', 'Bb', 'A'],
    'tension': ['Dm', 'Gm/D', 'Dm', 'A', 'Bb', 'Gm', 'A', 'A'],
    'reveal':  ['Dm', 'Bb', 'Gm', 'A', 'Dm', 'F', 'Gm', 'A'],
    'calm':    ['F', 'C', 'Dm', 'Bb', 'F', 'C', 'Gm', 'Dm'],
}
BAR = 4 * SPB
CHORD_LEN = 2 * BAR

events = []   # (time_sec, channel, msg_type, note/ctrl, value)
def note(t, ch, n, v, dur):
    events.append((t, ch, 'note_on', n, max(1, min(127, int(v)))))
    events.append((t + dur, ch, 'note_off', n, 0))

# channels: 0 strings, 1 low strings (contrabass), 2 piano, 3 horn, 4 timpani, 9 drums
PROGRAMS = {0: 48, 1: 49, 2: 0, 3: 60, 4: 47}
random.seed(11)
dur = T['duration']
# mood timeline from scenes
seg = [(s['start'], s['end'], s['mood']) for s in T['scenes']]
def mood_at(t):
    for a, b, m in seg:
        if a <= t < b: return m
    return seg[-1][2]

t = 0.0; ci = 0
while t < dur + 4:
    m = mood_at(t)
    name = PROG[m][ci % 8]
    bass, voc = CH[name]
    L = CHORD_LEN
    lvl = {'neutral': 1.0, 'tension': 1.1, 'reveal': 1.2, 'calm': 0.85}[m]
    # sustained string pad (soft attack handled by the patch)
    for n in voc[:3]: note(t, 0, n, 46 * lvl, L - 0.05)
    note(t, 1, bass, 50 * lvl, L - 0.05)
    if m == 'reveal': note(t, 0, voc[3], 40 * lvl, L - 0.05)
    # piano: slow low-mid arpeggio, never a melody line
    if m in ('neutral', 'calm', 'reveal'):
        pat = [voc[0] - 12, voc[1], voc[2], voc[1]] if m != 'calm' else [voc[0], voc[2], voc[3], voc[2]]
        step = SPB * (2 if m == 'calm' else 1)
        k = 0; tt = t
        while tt < t + L - 0.01:
            note(tt, 2, pat[k % 4], (30 if m != 'reveal' else 36) + random.randint(-3, 3), step * 1.6)
            tt += step; k += 1
    if m == 'tension':
        # low pulsing strings in eighths, very soft
        tt = t
        while tt < t + L - 0.01:
            note(tt, 1, bass + 12, 34 + random.randint(-3, 3), SPB / 2 * 0.9)
            tt += SPB / 2
        note(t, 4, bass + 12 if bass + 12 < 50 else bass, 40, BAR)          # timpani on the chord change
        note(t + BAR, 4, bass + 12 if bass + 12 < 50 else bass, 30, BAR)
        # light snare figure on the second bar
        for i in range(4): note(t + BAR + 2 * SPB + i * SPB / 4, 9, 38, 18 + i * 3, 0.1)
    if m == 'reveal' and ci % 2 == 0:
        note(t + 0.3, 3, voc[1] + 12, 42, L - 0.6)  # distant horn swell
        note(t, 4, 38, 38, BAR)
    t += L; ci += 1

mid = mido.MidiFile(ticks_per_beat=TPB)
track = mido.MidiTrack(); mid.tracks.append(track)
track.append(mido.MetaMessage('set_tempo', tempo=mido.bpm2tempo(BPM)))
for ch, prg in PROGRAMS.items():
    track.append(mido.Message('program_change', channel=ch, program=prg, time=0))
    track.append(mido.Message('control_change', channel=ch, control=91, value=70, time=0))   # reverb send
    track.append(mido.Message('control_change', channel=ch, control=7, value={0: 92, 1: 85, 2: 78, 3: 60, 4: 70}[ch], time=0))
track.append(mido.Message('control_change', channel=9, control=7, value=55, time=0))
events.sort(key=lambda e: (e[0], 0 if e[2] == 'note_off' else 1))
last = 0
for (ts, ch, typ, n, v) in events:
    tk = tick(ts); d = max(0, tk - last); last = tk
    track.append(mido.Message(typ, channel=ch, note=n, velocity=v, time=d))
mid.save(sys.argv[2])
print('notes', len(events) // 2, 'length', round(t, 1), 's')
