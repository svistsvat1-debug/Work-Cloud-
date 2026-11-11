"""Code-composed WWII documentary underscore (100% free: mido + FluidSynth + FluidR3_GM, MIT licence).

Four stems share one tempo and one chord progression, so they crossfade cleanly:
  neutral - low strings pad + sparse soft piano
  tension - strings + cello pulse + soft timpani + light military snare
  reveal  - strings (higher voicing) + distant horn swells + timpani swell + piano
  calm    - strings pad + very sparse high piano
Usage: python3 music.py timeline.json script_scenes.md out_dir
Writes out_dir/stem_<mood>.wav (48 kHz stereo) and out_dir/music_bed.wav (mood-mapped, crossfaded).
"""
import json, re, subprocess, sys, os
import numpy as np
import mido

SF2 = "/usr/share/sounds/sf2/FluidR3_GM.sf2"
BPM = 66
TPB = 480
SR = 48000
BAR = 60.0 / BPM * 4

# D minor: i - VI - III - VII - i - iv - VI - V
PROG = [
    ("Dm", [38, 50, 53, 57, 62]),
    ("Bb", [34, 46, 53, 58, 62]),
    ("F", [41, 48, 53, 57, 60]),
    ("C", [36, 48, 52, 55, 60]),
    ("Dm", [38, 50, 53, 57, 62]),
    ("Gm", [43, 50, 55, 58, 62]),
    ("Bb", [34, 46, 53, 58, 62]),
    ("A", [33, 45, 52, 57, 61]),
]

def ticks(beats):
    return int(round(beats * TPB))

class Track:
    def __init__(self, ch, program, vol=100, pan=64, reverb=70):
        self.ev = []  # (abs_tick, msg)
        self.ch = ch
        if ch != 9:
            self.ev.append((0, mido.Message("program_change", program=program, channel=ch)))
        self.ev.append((0, mido.Message("control_change", control=7, value=vol, channel=ch)))
        self.ev.append((0, mido.Message("control_change", control=10, value=pan, channel=ch)))
        self.ev.append((0, mido.Message("control_change", control=91, value=reverb, channel=ch)))

    def note(self, beat, dur, n, vel):
        self.ev.append((ticks(beat), mido.Message("note_on", note=int(n), velocity=int(max(1, min(127, vel))), channel=self.ch)))
        self.ev.append((ticks(beat + dur), mido.Message("note_off", note=int(n), velocity=0, channel=self.ch)))

    def cc(self, beat, control, value):
        self.ev.append((ticks(beat), mido.Message("control_change", control=control, value=int(max(0, min(127, value))), channel=self.ch)))

    def to_track(self):
        tr = mido.MidiTrack()
        last = 0
        for t, m in sorted(self.ev, key=lambda x: (x[0], 0 if x[1].type == "note_off" else 1)):
            tr.append(m.copy(time=t - last))
            last = t
        return tr

def compose(mood, total_beats, seed=7):
    rng = np.random.default_rng(seed)
    bars = int(np.ceil(total_beats / 4))
    tracks = []
    strings = Track(0, 48, vol=96, pan=54, reverb=90)   # String Ensemble 1
    basses = Track(1, 42, vol=90, pan=74, reverb=80)    # Cello
    tracks += [strings, basses]
    piano = Track(2, 0, vol=70, pan=70, reverb=95)
    horn = Track(3, 60, vol=76, pan=40, reverb=110)     # French horn, distant
    timp = Track(4, 47, vol=88, pan=64, reverb=80)      # Timpani
    drums = Track(9, 0, vol=62, pan=64, reverb=60)      # snare = 38
    for b in range(bars):
        name, ch = PROG[b % len(PROG)]
        beat = b * 4
        root, low, a, bb, c = ch
        sv = {"neutral": 52, "tension": 58, "reveal": 64, "calm": 44}[mood]
        sv += int(rng.integers(-3, 4))
        # strings pad: whole notes, gentle swell via expression
        voicing = [low, a, bb] if mood != "reveal" else [low, bb, c, c + 7 if c + 7 < 76 else c]
        for n in voicing:
            strings.note(beat, 4.0, n, sv)
        strings.cc(beat, 11, 70)
        strings.cc(beat + 1.5, 11, 96 if mood != "calm" else 82)
        strings.cc(beat + 3.5, 11, 76)
        if mood in ("neutral", "calm"):
            basses.note(beat, 4.0, root + 12 if root < 40 else root, sv - 8)
        elif mood == "tension":
            for k in range(8):
                basses.note(beat + k * 0.5, 0.42, root + 12, sv - 4 + (6 if k % 4 == 0 else 0))
        else:
            basses.note(beat, 4.0, root + 12, sv)
        # piano
        if mood == "neutral" and b % 2 == 0:
            pat = [(0.0, c + 12), (1.5, bb + 12), (2.5, a + 12)]
            for t, n in pat:
                piano.note(beat + t, 1.4, n, 38 + int(rng.integers(0, 6)))
        if mood == "calm" and b % 2 == 1:
            piano.note(beat + 1.0, 2.5, c + 12, 30)
        if mood == "reveal":
            for t, n in [(0.0, a + 12), (1.0, bb + 12), (2.0, c + 12), (3.0, bb + 12)]:
                piano.note(beat + t, 0.9, n, 34)
            if b % 2 == 0:
                horn.note(beat + 0.5, 3.4, bb if bb > 52 else bb + 12, 52)
            if b % 4 == 3:
                for k in range(8):
                    timp.note(beat + 2 + k * 0.25, 0.25, root if root >= 36 else root + 12, 30 + k * 4)
        if mood == "tension":
            timp.note(beat, 1.5, root if root >= 36 else root + 12, 46)
            if b % 2 == 1:
                for k in range(6):
                    drums.note(beat + 2.5 + k * 0.25, 0.2, 38, 22 + k * 3)
    tracks += [piano, horn, timp, drums]
    mid = mido.MidiFile(ticks_per_beat=TPB)
    meta = mido.MidiTrack()
    meta.append(mido.MetaMessage("set_tempo", tempo=mido.bpm2tempo(BPM), time=0))
    mid.tracks.append(meta)
    for t in tracks:
        mid.tracks.append(t.to_track())
    return mid

def render(mid, path_wav):
    mpath = path_wav.replace(".wav", ".mid")
    mid.save(mpath)
    subprocess.run(["fluidsynth", "-ni", "-g", "0.6", "-r", str(SR), "-o", "synth.reverb.room-size=0.75", "-o", "synth.reverb.level=0.6",
                    "-F", path_wav, SF2, mpath], check=True, capture_output=True)

def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).copy()

def save(path, x):
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ac", "2", "-ar", str(SR), "-i", "-", "-c:a", "pcm_s24le", path], stdin=subprocess.PIPE)
    p.communicate(x.astype(np.float32).tobytes())

def main():
    T = json.load(open(sys.argv[1]))
    md = open(sys.argv[2]).read()
    out = sys.argv[3]
    os.makedirs(out, exist_ok=True)
    moods = {int(m.group(1)): m.group(2).strip() for m in re.finditer(r"\[SCENE (\d+)[^\]]*\][\s\S]*?MUSIC MOOD: (\w+)", md)}
    total = T["total"] + 2
    beats = total / (60.0 / BPM)
    stems = {}
    for mood in ("neutral", "tension", "reveal", "calm"):
        p = os.path.join(out, f"stem_{mood}.wav")
        if not (os.environ.get("REUSE") and os.path.exists(p)):
            render(compose(mood, beats), p)
        stems[mood] = load(p)
    n = int(total * SR)
    for k in stems:
        s = stems[k]
        stems[k] = s[:n] if len(s) >= n else np.vstack([s, np.zeros((n - len(s), 2), np.float32)])
    # loudness-match the stems so a mood change never jumps in level (reveal/tension -1 dB, calm -2 dB vs neutral)
    rms = {k: float(np.sqrt((stems[k].astype(np.float64) ** 2).mean())) for k in stems}
    offs = {"neutral": 0.0, "tension": -1.0, "reveal": -1.0, "calm": -2.0}
    for k in stems:
        stems[k] *= (rms["neutral"] / rms[k]) * 10 ** (offs[k] / 20)
    # per-stem gain curves following the mood map, 2 s crossfades at scene boundaries (computed at 100 Hz)
    CR = 100
    nc = int(total * CR) + 1
    gains = {k: np.zeros(nc, np.float32) for k in stems}
    for s in T["scenes"]:
        a, b = int(s["start"] * CR), int(s["end"] * CR)
        gains[moods.get(s["id"], "neutral")][a:b] = 1.0
    gains[moods.get(T["scenes"][-1]["id"], "calm")][int(T["scenes"][-1]["end"] * CR):] = 1.0
    k = 2 * CR
    win = np.hanning(k) / np.hanning(k).sum()
    tc = np.arange(nc) / CR
    ta = np.arange(n) / SR
    bed = np.zeros((n, 2), np.float32)
    for m in stems:
        g = np.convolve(gains[m], win, mode="same").astype(np.float32)
        bed += stems[m] * np.interp(ta, tc, g).astype(np.float32)[:, None]
    # fade in 2 s, fade out 4 s
    fi = int(2 * SR); fo = int(4 * SR)
    bed[:fi] *= np.linspace(0, 1, fi)[:, None]
    end = int(T["total"] * SR)
    bed[end - fo:end] *= np.linspace(1, 0, fo)[:, None]
    bed[end:] = 0
    save(os.path.join(out, "music_bed.wav"), bed)
    print("moods:", {m: sum(1 for v in moods.values() if v == m) for m in set(moods.values())})

if __name__ == "__main__":
    main()
