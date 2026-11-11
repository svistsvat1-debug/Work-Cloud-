#!/usr/bin/env python3
"""Mix voice + SFX + music for a video.

Usage: mix_audio.py <video_dir>
Reads  work/voice.mp3, work/timeline.json, sfx_cues.json, work/music/music_<mood>.wav,
       video-engine/sfx-library/*.mp3
Writes work/voice_norm.wav, work/music.wav (ducked bed alone), work/mix_music.wav,
       work/mix_nomusic.wav, work/audio_report.json

Levels (spec): voice -14 LUFS integrated; SFX 12-18 dB under the voice (default -15 dB);
music 25-30 dB under the voice while speaking (-27 dB), +5 dB lift in pauses,
fade-in 2 s, fade-out 4 s, crossfades between moods at scene boundaries.
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np
import pyloudnorm as pyln
import soundfile as sf

SR = 48000
ENGINE = Path(__file__).resolve().parent.parent


def load(path, sr=SR):
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-f", "f32le", "-ac", "1", "-ar", str(sr), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(pcm, dtype=np.float32).astype(np.float64)


def db(x):
    return 20 * np.log10(max(x, 1e-12))


def rms_frames(x, win):
    n = len(x) // win
    f = x[: n * win].reshape(n, win)
    return np.sqrt((f ** 2).mean(axis=1) + 1e-12)


def smooth_env(active, att_frames, rel_frames):
    out = np.zeros(len(active))
    v = 0.0
    for i, a in enumerate(active):
        tgt = 1.0 if a else 0.0
        k = 1.0 / att_frames if tgt > v else 1.0 / rel_frames
        v += (tgt - v) * k
        out[i] = v
    return out


def kword(scene, word, n=1):
    w = word.lower()
    c = 0
    for x in scene["words"]:
        if x["w"] == w:
            c += 1
            if c == n:
                return x["s"]
    raise KeyError(f"scene {scene['i']}: '{word}' #{n} not found")


def main():
    vdir = Path(sys.argv[1])
    work = vdir / "work"
    tl = json.loads((work / "timeline.json").read_text())
    total = tl["duration"]
    N = int(total * SR)
    meter = pyln.Meter(SR)

    # ---- voice -> -14 LUFS
    v = load(work / "voice.mp3")
    lufs_in = meter.integrated_loudness(v)
    v = v * 10 ** ((-14.0 - lufs_in) / 20)
    # true-peak safety: look-ahead limiter on the voice, re-trim to -14 LUFS, repeat until peaks <= -1 dBFS
    tmp_in, tmp_out = work / "_v_in.f32", work / "_v_out.f32"
    for _ in range(4):
        if np.abs(v).max() <= 10 ** (-1.0 / 20):
            break
        v.astype(np.float32).tofile(tmp_in)
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", str(tmp_in),
                        "-af", "alimiter=limit=0.80:attack=4:release=80:level=false", "-f", "f32le", str(tmp_out)], check=True)
        v = np.fromfile(tmp_out, dtype=np.float32).astype(np.float64)
        v = v * 10 ** ((-14.0 - meter.integrated_loudness(v)) / 20)
    for f in (tmp_in, tmp_out):
        f.unlink(missing_ok=True)
    voice = np.zeros(N)
    voice[: min(N, len(v))] = v[:N]
    win = int(0.02 * SR)
    vr = rms_frames(voice, win)
    thr = vr.max() * 10 ** (-38 / 20)
    active = vr > thr
    voice_rms_db = db(np.sqrt((vr[active] ** 2).mean()))
    duck = smooth_env(active, att_frames=3, rel_frames=25)  # ~60 ms attack, ~500 ms release (20 ms frames)
    duck_s = np.repeat(duck, win)
    duck_s = np.pad(duck_s, (0, N - len(duck_s)), mode="edge")

    # ---- SFX
    cues = json.loads((vdir / "sfx_cues.json").read_text())["cues"]
    scenes = {s["i"]: s for s in tl["scenes"]}
    lib = ENGINE / "sfx-library"
    cache = {}
    sfx = np.zeros(N)
    used = set()
    for c in cues:
        sc = scenes[c["scene"]]
        if "word" in c:
            t0 = kword(sc, c["word"], c.get("n", 1))
        else:
            t0 = sc["start"] + c["t"]
        t0 += c.get("offset", 0.0)
        # transients land just before the word so they never cover it
        if "word" in c and c["sfx"] in ("pop", "marker_tap", "reveal_ding", "camera_shutter", "impact"):
            t0 -= 0.12
        if c["sfx"] not in cache:
            x = load(lib / f"{c['sfx']}.mp3")
            fr = rms_frames(x, win)
            act = fr > fr.max() * 10 ** (-30 / 20)
            lvl = db(np.sqrt((fr[act] ** 2).mean())) if act.any() else db(fr.max())
            # fade edges
            f = min(len(x) // 10, int(0.01 * SR))
            x[:f] *= np.linspace(0, 1, f)
            x[-f * 4:] *= np.linspace(1, 0, f * 4)
            cache[c["sfx"]] = (x, lvl)
        x, lvl = cache[c["sfx"]]
        g = 10 ** ((voice_rms_db - 15 + c.get("gain", 0) - lvl) / 20)
        i0 = max(0, int(t0 * SR))
        i1 = min(N, i0 + len(x))
        sfx[i0:i1] += x[: i1 - i0] * g
        used.add(c["sfx"])

    # ---- music: crossfade mood stems per scene
    stems = {}
    for mood in ("neutral", "tension", "reveal", "calm"):
        m = load(work / "music" / f"music_{mood}.wav")
        mm = np.zeros(N)
        mm[: min(N, len(m))] = m[:N]
        stems[mood] = mm
    # mood weights at 10 ms resolution, raised-cosine 2 s crossfades, then upsampled
    hop = int(0.01 * SR)
    nf = N // hop + 1
    w = {m: np.zeros(nf) for m in stems}
    for s in tl["scenes"]:
        a, b = int(s["start"] * 100), int(s["end"] * 100)
        w[s["mood"]][a:b] = 1.0
    ker = np.hanning(200)
    ker /= ker.sum()
    bed = np.zeros(N)
    for m in stems:
        wm = np.convolve(w[m], ker, mode="same")
        ws = np.interp(np.arange(N) / hop, np.arange(nf), wm)
        bed += stems[m] * ws
    br = rms_frames(bed, win)
    bed_db = db(np.sqrt((br[br > br.max() * 1e-3] ** 2).mean()))
    # gain curve: -27 dB under voice while speaking, -22 dB in pauses
    g_speech = voice_rms_db - 27 - bed_db
    g_pause = voice_rms_db - 22 - bed_db
    gain_db = g_pause + (g_speech - g_pause) * duck_s
    music = bed * 10 ** (gain_db / 20)
    fi, fo = int(2 * SR), int(4 * SR)
    music[:fi] *= np.linspace(0, 1, fi)
    music[-fo:] *= np.linspace(1, 0, fo)

    def finish(x):
        peak = np.abs(x).max()
        lim = 10 ** (-1.0 / 20)
        if peak > lim:  # soft limiter on the rare peak only
            x = np.where(np.abs(x) > lim * 0.9, np.sign(x) * (lim * 0.9 + (lim * 0.1) * np.tanh((np.abs(x) - lim * 0.9) / (lim * 0.1))), x)
        return x

    st = lambda x: np.stack([x, x], axis=1).astype(np.float32)
    # deliverables are stereo (dual mono): BS.1770 sums both channels (+3 dB vs mono),
    # so trim everything so the STEREO voice measures -14 LUFS
    st_gain = 10 ** ((-14.0 - meter.integrated_loudness(st(voice).astype(np.float64))) / 20)
    voice, sfx, music = voice * st_gain, sfx * st_gain, music * st_gain
    mix_nm = finish(voice + sfx)
    mix_m = finish(voice + sfx + music)
    sf.write(work / "voice_norm.wav", st(voice), SR, subtype="PCM_24")
    sf.write(work / "music.wav", st(music), SR, subtype="PCM_24")
    sf.write(work / "mix_nomusic.wav", st(mix_nm), SR, subtype="PCM_24")
    sf.write(work / "mix_music.wav", st(mix_m), SR, subtype="PCM_24")

    # report: measured level differences while speaking
    act_s = np.repeat(active, win)
    act_s = np.pad(act_s, (0, N - len(act_s)))
    def lvl(x, mask):
        return db(np.sqrt((x[mask.astype(bool)] ** 2).mean()))
    pause = (~act_s.astype(bool)) & (np.arange(N) > 2 * SR) & (np.arange(N) < N - 4 * SR)
    sfx_mask = np.abs(sfx) > 1e-4
    rep = {
        "voice_lufs_in": round(lufs_in, 2),
        "voice_lufs_out_stereo": round(meter.integrated_loudness(st(voice).astype(np.float64)), 2),
        "mix_music_lufs_stereo": round(meter.integrated_loudness(st(mix_m).astype(np.float64)), 2),
        "mix_nomusic_lufs_stereo": round(meter.integrated_loudness(st(mix_nm).astype(np.float64)), 2),
        "music_under_voice_while_speaking_db": round(lvl(voice, act_s) - lvl(music, act_s), 1),
        "music_under_voice_in_pauses_db": round(lvl(voice, act_s) - lvl(music, pause), 1),
        "sfx_under_voice_db": round(lvl(voice, act_s) - lvl(sfx, sfx_mask), 1),
        "peak_dbfs_mix_music": round(db(np.abs(mix_m).max()), 2),
        "sfx_used": sorted(used),
        "sfx_new_used": sorted(u for u in used if u in ("shipyard_rivet", "ship_horn", "truck_convoy", "tank_sputter_stall", "camera_shutter")),
        "cues": len(cues),
    }
    (work / "audio_report.json").write_text(json.dumps(rep, indent=1))
    print(json.dumps(rep, indent=1))


if __name__ == "__main__":
    main()
