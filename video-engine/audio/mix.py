"""Final audio mix: voice (-14 LUFS) + mood-crossfaded music bed (25-30 dB under, ducked) + SFX (12-18 dB under).
usage: python3 mix.py <voice> <timing.json> <script_scenes.md> <stems_dir> <cues.json> <sfx_dir> <out.wav> <report.json>
"""
import json, re, subprocess, sys
import numpy as np
import pyloudnorm as pyln

voice_p, timing_p, scenes_md, stems_dir, cues_p, sfx_dir, out_wav, report_p = sys.argv[1:9]
SR = 48000
meter = pyln.Meter(SR)

def load(path, ch=2):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", str(ch), "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, ch).copy()

def db(x):
    return 10 ** (x / 20)

def true_peak_db(x):
    # 4x oversampled peak via FFT resampling of the loudest regions
    import scipy.signal as ss
    mono = np.max(np.abs(x), axis=1)
    idx = np.argsort(mono)[-2000:]
    best = -120.0
    for c in range(x.shape[1]):
        for i in idx[::50]:
            a, b = max(0, i - 256), min(len(x), i + 256)
            seg = ss.resample_poly(x[a:b, c], 4, 1)
            best = max(best, 20 * np.log10(np.max(np.abs(seg)) + 1e-12))
    return best

T = json.load(open(timing_p))
scenes = T["scenes"]
moods = re.findall(r"MUSIC MOOD:\s*(\w+)", open(scenes_md).read())
assert len(moods) == len(scenes), (len(moods), len(scenes))

# ---------- voice ----------
# the voice arrives already loudness-normalised (ffmpeg loudnorm 2-pass: -14 LUFS, TP -1.5 dBTP)
v2 = load(voice_p, 2)
v_l = meter.integrated_loudness(v2)
v = v2[:, 0]
tail = int(SR * 2.0)
N = len(v) + tail
voice = np.zeros((N, 2), np.float32)
voice[: len(v)] = v2

# ---------- music bed ----------
stems = {}
for m in ["neutral", "tension", "reveal", "calm"]:
    s = load(f"{stems_dir}/{m}.wav", 2)
    if len(s) < N:
        s = np.pad(s, ((0, N - len(s)), (0, 0)))
    s = s[:N]
    stems[m] = s / (10 ** (meter.integrated_loudness(s) / 20)) * db(-23)  # equalise stems to -23 LUFS
env = {m: np.zeros(N, np.float32) for m in stems}
t = np.arange(N) / SR
XF = 1.5
for k, sc in enumerate(scenes):
    a = sc["start"] if k else 0.0
    b = scenes[k + 1]["start"] if k + 1 < len(scenes) else N / SR
    ramp_in = np.clip((t - (a - XF / 2)) / XF, 0, 1) if k else np.ones(N)
    ramp_out = np.clip(((b + XF / 2) - t) / XF, 0, 1) if k + 1 < len(scenes) else np.ones(N)
    env[moods[k]] += np.minimum(ramp_in, ramp_out).astype(np.float32)
mood_gain = {"neutral": 0.0, "tension": 1.0, "reveal": 1.5, "calm": -1.5}
bed = sum(stems[m] * (env[m] * db(mood_gain[m]))[:, None] for m in stems)
# speech activity -> ducking envelope (duck under speech, lift in pauses)
speech = np.zeros(N, bool)
for sc in scenes:
    for w in sc["words"]:
        speech[int(max(0, w["s"] - 0.12) * SR): int((w["e"] + 0.12) * SR)] = True
# fill short gaps (< 0.6 s) so the bed doesn't pump between words
act = speech.copy()
gap = 0
for i in range(0, N, 480):  # 10 ms hops
    if not speech[i]:
        gap += 1
    else:
        if 0 < gap < 60:
            act[i - gap * 480: i] = True
        gap = 0
DUCK, LIFT = -3.0, 0.5  # dB relative to bed level
target = np.where(act, DUCK, LIFT).astype(np.float32)
# smooth: attack 0.2 s, release 0.8 s (one-pole on 10 ms grid)
g = np.empty(N // 480 + 1, np.float32)
cur = LIFT
for j in range(len(g)):
    tg = target[min(N - 1, j * 480)]
    a = 0.05 if tg < cur else 0.0125
    cur += (tg - cur) * a
    g[j] = cur
duck = np.interp(np.arange(N), np.arange(len(g)) * 480, g).astype(np.float32)
bed = bed * db(duck)[:, None]
fade = np.ones(N, np.float32)
fade[: 2 * SR] = np.linspace(0, 1, 2 * SR)
fade[-4 * SR:] = np.linspace(1, 0, 4 * SR)
bed *= fade[:, None]
# level the whole bed so the music sits ~28 dB under the voice overall
bed_l = meter.integrated_loudness(bed)
MUSIC_TARGET = -42.0
bed *= db(MUSIC_TARGET - bed_l)

# ---------- SFX ----------
LEVEL = {"rubber_stamp": -29, "reveal_ding": -30, "impact": -30, "ship_horn": -30, "crowd_murmur": -31, "artillery_distant": -31, "pop": -31,
         "counter_roll": -32, "tension_riser": -32, "typewriter": -32, "paper_unfold": -32, "board_erase": -32, "whoosh_soft": -32,
         "clock_tick": -33, "marker_squeak_long": -32, "marker_squeak_short": -32, "marker_tap": -32, "morse": -32, "radio_static": -33}
PRIORITY = {"rubber_stamp", "reveal_ding", "ship_horn", "impact", "crowd_murmur", "artillery_distant", "tension_riser", "counter_roll"}
cues = json.load(open(cues_p))["cues"]
words = [(w["s"], w["e"]) for sc in scenes for w in sc["words"]]
def snap(tc):
    for s, e in words:
        if s < tc < e - 0.02:
            # move into the nearest gap: just before this word, or just after it, within 0.35 s
            if tc - s <= 0.35:
                return max(0.0, s - 0.03), True
            if e - tc <= 0.35:
                return e + 0.02, True
            return tc, False
    return tc, True
kept, last_t = [], -9
for c in sorted(cues, key=lambda c: c["t"]):
    tc, in_gap = snap(c["t"])
    if tc - last_t < 0.55 and c["name"] not in PRIORITY:
        continue
    kept.append({**c, "t": round(tc, 3), "in_gap": in_gap})
    last_t = tc
cache = {}
sfx = np.zeros((N, 2), np.float32)
sfx_levels = []
for c in kept:
    nm = c["name"]
    if nm not in cache:
        s = load(f"{sfx_dir}/{nm}.wav", 2)
        # loudness of the sample measured on its loudest 400 ms block
        blk = int(0.4 * SR)
        ms = max(meter.integrated_loudness(np.pad(s[i:i + blk], ((0, max(0, blk - len(s[i:i + blk]))), (0, 0))) + 1e-9) for i in range(0, max(1, len(s) - blk + 1), blk // 4))
        cache[nm] = (s, ms)
    s, ms = cache[nm]
    gain_db = LEVEL.get(nm, -32) + c.get("gain", 0) - ms - (3 if not c["in_gap"] else 0)
    i0 = max(0, int(c["t"] * SR))
    seg = s[: max(0, min(len(s), N - i0))] * db(gain_db)
    sfx[i0: i0 + len(seg)] += seg
    sfx_levels.append(LEVEL.get(nm, -32) + c.get("gain", 0))

mix = voice + bed + sfx

def limit(x, thr_db=-1.7, look_ms=5, rel_ms=80):
    # lookahead peak limiter on a 1 ms grid (only touches the rare peaks where SFX/music sit on a voice peak)
    B = 48
    nb = len(x) // B + 1
    pk = np.zeros(nb, np.float32)
    a = np.max(np.abs(x), axis=1)
    pk[: len(a) // B] = a[: len(a) // B * B].reshape(-1, B).max(axis=1)
    thr = db(thr_db)
    need = np.minimum(1.0, thr / np.maximum(pk, 1e-9))
    from scipy.ndimage import minimum_filter1d
    need = minimum_filter1d(need, size=2 * look_ms + 1)
    g = np.empty(nb, np.float32); cur = 1.0; r = 1.0 / rel_ms
    for j in range(nb):
        cur = need[j] if need[j] < cur else min(need[j], cur + r * (1 - cur) + 1e-4)
        g[j] = cur
    gs = np.interp(np.arange(len(x)), np.arange(nb) * B, g).astype(np.float32)
    return x * gs[:, None], float(20 * np.log10(g.min()))

tp0 = true_peak_db(mix)
max_gr = 0.0
if tp0 > -1.2:
    mix, max_gr = limit(mix)
tp = true_peak_db(mix)
trim = min(0.0, -1.1 - tp)
mix *= db(trim)
final_l = meter.integrated_loudness(mix)
# loudest music moment vs voice (3 s short-term windows)
win = 3 * SR
worst = 99.0
for i in range(0, len(v) - win, SR):
    vl = meter.integrated_loudness(voice[i:i + win]) if np.any(voice[i:i + win]) else -70
    ml = meter.integrated_loudness(bed[i:i + win] + 1e-9)
    if vl > -40:
        worst = min(worst, vl - ml)
out = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
import wave
with wave.open(out_wav, "wb") as wf:
    wf.setnchannels(2); wf.setsampwidth(2); wf.setframerate(SR); wf.writeframes(out.tobytes())
rep = {
    "voice_input_lufs": round(v_l, 2), "voice_lufs": round(meter.integrated_loudness(voice[: len(v)] * db(trim)), 2),
    "music_bed_lufs": round(meter.integrated_loudness(bed * db(trim)), 2), "music_under_voice_db": round(-14 - MUSIC_TARGET, 1),
    "loudest_music_moment_gap_db": round(worst, 1), "sfx_cues_in": len(cues), "sfx_cues_kept": len(kept),
    "sfx_target_lufs_range": [min(sfx_levels), max(sfx_levels)], "mix_lufs": round(final_l, 2), "true_peak_dbtp_raw_sum": round(tp0, 2), "limiter_max_gain_reduction_db": round(max_gr, 2), "true_peak_dbtp_final": round(tp + trim, 2), "trim_db": round(trim, 2),
    "duration_s": round(N / SR, 3), "moods": {m: moods.count(m) for m in set(moods)},
}
json.dump({"report": rep, "cues": kept}, open(report_p, "w"), indent=1)
print(json.dumps(rep, indent=1))
