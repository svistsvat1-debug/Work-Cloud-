"""Compose the background score from the scene mood map and render it with FluidSynth.

Usage: python3 tools/music.py <timeline.cues.json> <out.wav> [--sf2 /usr/share/sounds/sf2/FluidR3_GM.sf2]

100% code-generated: MIDI written with mido, rendered with FluidSynth + FluidR3_GM (MIT license).
Style: slow (66 BPM) D-minor documentary underscore. Low strings + soft piano always; distant horns for
"reveal"; soft timpani/snare pulse only in "tension"; brighter F-major colour for "calm".
No lead melody (the voice must always win). Moods crossfade over ~2 s at scene boundaries
because sustained chords overlap the boundary.
"""
import json
import subprocess
import sys
from pathlib import Path

import mido

args = sys.argv[1:]
cues = json.loads(Path(args[0]).read_text())
out = Path(args[1])
sf2 = args[args.index('--sf2') + 1] if '--sf2' in args else '/usr/share/sounds/sf2/FluidR3_GM.sf2'

BPM = 66
SPB = 60 / BPM  # seconds per beat
TPB = 480
mid = mido.MidiFile(ticks_per_beat=TPB)
end_s = max(s['end'] for s in cues['scenes']) + 4

# channels/programs (GM)
CH = {
    'strings': (0, 48),  # String Ensemble 1
    'low': (1, 42),  # Cello
    'bass': (2, 43),  # Contrabass
    'piano': (3, 0),  # Acoustic Grand
    'horn': (4, 60),  # French Horn
    'timp': (5, 47),  # Timpani
    'pad': (6, 49),  # String Ensemble 2 (slow)
}
DRUM = 9

events = []  # (time_s, msg)


def note(ch, n, t0, dur, vel):
    events.append((t0, mido.Message('note_on', channel=ch, note=n, velocity=max(1, min(127, int(vel))))))
    events.append((t0 + dur, mido.Message('note_off', channel=ch, note=n, velocity=0)))


# chord progressions (root-position voicings, MIDI numbers)
MINOR = [
    ('Dm', [50, 57, 62, 65], 38),
    ('Bb', [46, 53, 58, 62], 34),
    ('Gm', [43, 50, 55, 58], 31),
    ('A', [45, 52, 57, 61], 33),
]
TENSE = [
    ('Dm', [50, 57, 62, 65], 38),
    ('Eb', [51, 58, 63, 67], 39),
    ('Dm', [50, 57, 62, 65], 38),
    ('C#dim', [49, 55, 61, 64], 37),
]
CALM = [
    ('F', [53, 60, 65, 69], 41),
    ('C', [48, 55, 64, 67], 36),
    ('Dm', [50, 57, 62, 65], 38),
    ('Bb', [46, 53, 58, 62], 34),
]
REVEAL = [
    ('Dm', [50, 57, 62, 65], 38),
    ('Bb', [46, 53, 58, 62], 34),
    ('F', [53, 60, 65, 69], 41),
    ('A', [45, 52, 57, 61], 33),
]
PROG = {'neutral': MINOR, 'tension': TENSE, 'reveal': REVEAL, 'calm': CALM}

BAR = 4 * SPB
CHORD_LEN = 2 * BAR  # 2 bars per chord (~7.3 s)

# walk the timeline chord by chord; mood = mood of the scene at that time
def mood_at(t):
    for s in cues['scenes']:
        if s['start'] <= t < s['end']:
            return s['mood']
    return cues['scenes'][-1]['mood']


t = 0.0
ci = 0
while t < end_s:
    mood = mood_at(t + 0.1)
    prog = PROG.get(mood, MINOR)
    name, voicing, bassn = prog[ci % 4]
    L = CHORD_LEN + 1.2  # overlap = soft crossfade into the next chord
    base = {'neutral': 46, 'tension': 50, 'reveal': 54, 'calm': 40}[mood]
    # sustained string bed
    for n in voicing:
        note(CH['strings'][0], n, t, L, base)
    note(CH['pad'][0], voicing[1] + 12, t, L, base * 0.6)
    # low cello + contrabass
    note(CH['low'][0], bassn + 12, t, L, base + 6)
    note(CH['bass'][0], bassn, t, L, base + 2)
    # soft piano: sparse broken chord, quarter notes only on beats 1 and 3 of each bar
    if mood in ('neutral', 'calm', 'reveal'):
        pat = [0, 2, 1, 3] if mood != 'calm' else [0, 1, 2, 3, 2, 1]
        step = 2 * SPB if mood != 'calm' else SPB * 1.33
        k = 0
        tt = t
        while tt < t + CHORD_LEN - 0.1:
            n = voicing[pat[k % len(pat)]] + 12
            note(CH['piano'][0], n, tt, step * 1.8, 34 if mood != 'calm' else 30)
            tt += step
            k += 1
    # tension: low timpani heartbeat + very soft snare roll swell on the last bar
    if mood == 'tension':
        for b in range(int(CHORD_LEN / SPB)):
            if b % 2 == 0:
                note(CH['timp'][0], 38, t + b * SPB, SPB, 40 if b % 4 == 0 else 28)
        roll_start = t + CHORD_LEN - BAR
        r = 0.0
        while r < BAR - 0.05:
            note(DRUM, 38, roll_start + r, 0.05, 6 + 18 * (r / BAR))
            r += SPB / 6
    # reveal: distant horn swell (long tones, root + fifth)
    if mood == 'reveal':
        note(CH['horn'][0], voicing[0] + 12, t + 0.4, CHORD_LEN, 44)
        note(CH['horn'][0], voicing[1] + 12, t + 0.4, CHORD_LEN, 38)
    t += CHORD_LEN
    ci += 1

# build one track, tempo + programs + reverb/chorus CC
track = mido.MidiTrack()
mid.tracks.append(track)
track.append(mido.MetaMessage('set_tempo', tempo=mido.bpm2tempo(BPM), time=0))
for _, (ch, prog) in CH.items():
    track.append(mido.Message('program_change', channel=ch, program=prog, time=0))
    track.append(mido.Message('control_change', channel=ch, control=91, value=90, time=0))  # reverb
    track.append(mido.Message('control_change', channel=ch, control=7, value=100, time=0))
track.append(mido.Message('control_change', channel=CH['piano'][0], control=7, value=70, time=0))
track.append(mido.Message('control_change', channel=CH['horn'][0], control=7, value=72, time=0))
track.append(mido.Message('control_change', channel=DRUM, control=7, value=60, time=0))

events.sort(key=lambda e: (e[0], 0 if e[1].type == 'note_off' else 1))
last_tick = 0
for ts, msg in events:
    tick = int(round(ts / SPB * TPB))
    msg.time = max(0, tick - last_tick)
    last_tick = tick
    track.append(msg)

midp = out.with_suffix('.mid')
mid.save(midp)
raw = out.with_name(out.stem + '_raw.wav')
subprocess.run(['fluidsynth', '-ni', '-g', '0.7', '-r', '48000', '-F', str(raw), sf2, str(midp)], check=True, capture_output=True)
# fade in 2 s / out 4 s, trim to length, gentle low-pass for a warm, distant feel
subprocess.run(
    ['ffmpeg', '-loglevel', 'error', '-y', '-i', str(raw), '-af', f'atrim=0:{end_s:.2f},lowpass=f=6500,afade=t=in:d=2,afade=t=out:st={end_s - 4:.2f}:d=4', '-ar', '48000', '-ac', '2', str(out)],
    check=True,
)
raw.unlink()
print('music', out, f'{end_s:.1f}s')
