"""Final audio mix: voice -14 LUFS, SFX ~15 dB under voice, music 25-30 dB under voice with sidechain ducking.
usage: python3 mix.py <workdir> <sfx_events.json> <sfx_dir> <total_seconds>
writes <workdir>/mix.wav (48 kHz stereo) and prints loudness report."""
import json, subprocess, sys, re
import numpy as np
W, EV, SFXD, TOTAL = sys.argv[1], sys.argv[2], sys.argv[3], float(sys.argv[4])
SR = 48000
N = int(round(TOTAL * SR))

def read(path, extra=None):
    cmd = ["ffmpeg", "-v", "error", "-i", path] + (extra or []) + ["-ac", "2", "-ar", str(SR), "-f", "f32le", "-"]
    a = np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, dtype=np.float32).reshape(-1, 2)
    return a.copy()
def write(path, a):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "2", "-i", "-", "-c:a", "pcm_s24le", path], input=a.astype(np.float32).tobytes(), check=True)
def lufs(path):
    r = subprocess.run(["ffmpeg", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    I = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", r)[-1]); tp = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", r)[-1])
    return I, tp
def fit(a):
    out = np.zeros((N, 2), np.float32); n = min(N, len(a)); out[:n] = a[:n]; return out

# 1) voice -> -14 LUFS (two-pass loudnorm, linear), true peak -1.5
v_in = f"{W}/voice.mp3"
r = subprocess.run(["ffmpeg", "-i", v_in, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
j = json.loads(r[r.rindex("{"): r.rindex("}") + 1])
gain = -14.0 - float(j["input_i"])
for it in range(6):  # gain + transparent peak limiter, re-measure, correct
    ln = f"volume={gain:.2f}dB,alimiter=limit=0.82:attack=2:release=80:level=false"
    voice = fit(read(v_in, ["-af", ln]))
    write(f"{W}/voice_norm.wav", voice)
    vI, vTP = lufs(f"{W}/voice_norm.wav")
    if abs(vI + 14.0) < 0.15: break
    gain += -14.0 - vI

# speech envelope (for SFX safety + reporting)
mono = np.abs(voice.mean(1))
win = int(0.05 * SR); env = np.sqrt(np.convolve(mono ** 2, np.ones(win) / win, mode="same"))
voice_rms_db = 20 * np.log10(np.sqrt(np.mean(voice[env > 10 ** (-40 / 20)] ** 2)) + 1e-9)

# 2) SFX: each event scaled so its RMS sits ~15 dB under the voice RMS (+ per-event gain)
sfx = np.zeros((N, 2), np.float32)
events = json.load(open(EV))
for e in events:
    a = read(f"{SFXD}/{e['name']}.wav")
    act = a[np.abs(a).max(1) > 1e-3]
    rms = np.sqrt(np.mean(act ** 2)) if len(act) else 1e-3
    target = 10 ** ((voice_rms_db - 13 + e.get("gain", 0)) / 20)
    a = a * (target / rms)
    fo = min(len(a), int(0.08 * SR)); a[-fo:] *= np.linspace(1, 0, fo)[:, None]
    s = int(e["t"] * SR); n = min(len(a), N - s)
    if n > 0: sfx[s:s + n] += a[:n]
write(f"{W}/sfx_track.wav", sfx)

# 3) music: base level, fades, sidechain ducking keyed by the voice
music = fit(read(f"{W}/music_raw.wav"))
fi, fo = int(2 * SR), int(4 * SR)
music[:fi] *= np.linspace(0, 1, fi)[:, None]; music[N - fo:] *= np.linspace(1, 0, fo)[:, None]
write(f"{W}/music_fit.wav", music)
mI, _ = lufs(f"{W}/music_fit.wav")
base_gain_db = (vI - 21.5) - mI   # music bed ~19.5 dB under the voice before ducking (ducked to 25-30 dB under while speaking)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"{W}/music_fit.wav", "-i", f"{W}/voice_norm.wav", "-filter_complex",
                f"[0:a]volume={base_gain_db:.2f}dB[m];[m][1:a]sidechaincompress=threshold=0.04:ratio=1.7:attack=60:release=900:makeup=1[d]",
                "-map", "[d]", "-c:a", "pcm_s24le", f"{W}/music_duck.wav"], check=True)
music_d = fit(read(f"{W}/music_duck.wav"))

# 4) sum + safety limiter
mix = voice + sfx + music_d
write(f"{W}/mix_pre.wav", mix)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"{W}/mix_pre.wav", "-af", "alimiter=limit=0.89:attack=5:release=50:level=false", "-c:a", "pcm_s24le", f"{W}/mix.wav"], check=True)
I, TP = lufs(f"{W}/mix.wav")
if abs(I + 14.0) > 0.1:  # final trim so the programme sits at -14 LUFS
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"{W}/mix.wav", "-af", f"volume={-14.0 - I:.2f}dB", "-c:a", "pcm_s24le", f"{W}/mix_t.wav"], check=True)
    subprocess.run(["mv", f"{W}/mix_t.wav", f"{W}/mix.wav"], check=True)
    I, TP = lufs(f"{W}/mix.wav")

# report: music level under speech vs voice
spk = env > 10 ** (-35 / 20)
def rdb(x, m): return 20 * np.log10(np.sqrt(np.mean(x[m] ** 2)) + 1e-12)
print(json.dumps({
    "voice_LUFS": vI, "voice_TP": vTP, "mix_LUFS": I, "mix_TP": TP,
    "music_under_voice_during_speech_dB": float(round(rdb(voice, spk) - rdb(music_d, spk), 1)),
    "music_in_pauses_vs_voice_dB": float(round(rdb(voice, spk) - rdb(music_d, ~spk), 1)), "sfx_rms_under_voice_dB": float(round(rdb(voice, spk) - rdb(sfx, np.abs(sfx).max(1) > 1e-4), 1)),
    "sfx_events": len(events),
}, indent=1))
