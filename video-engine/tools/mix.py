"""Final audio mix: voice (-14 LUFS, TP <= -1 dBTP) + code-made music (25-30 dB under, ducked) + SFX (12-18 dB under).
Usage: python3 mix.py timeline.json voice_in music_bed.wav sfx_cues.tsv sfx_dir erase_scene_ids out.wav report.json
"""
import json, re, subprocess, sys
import numpy as np

SR = 48000

def dec(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).copy()

def enc(path, x):
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ac", "2", "-ar", str(SR), "-i", "-", "-c:a", "pcm_s24le", path], stdin=subprocess.PIPE)
    p.communicate(np.ascontiguousarray(x, dtype=np.float32).tobytes())

def loud(path):
    out = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
    I = float(re.findall(r"I:\s+(-?[\d.]+) LUFS", out)[-1])
    tp = float(re.findall(r"Peak:\s+(-?[\d.]+) dBFS", out)[-1])
    return I, tp

def db(x):
    return 20 * np.log10(np.maximum(x, 1e-9))

def mov_rms(x, win, hop):
    """RMS over a sliding window, evaluated every `hop` samples (cumsum, O(n))."""
    c = np.concatenate([[0.0], np.cumsum(x.astype(np.float64) ** 2)])
    idx = np.arange(0, len(x) - win, hop)
    return np.sqrt((c[idx + win] - c[idx]) / win), idx

def main():
    tl, voice_in, bed_in, cues_tsv, sfx_dir, erase_ids, out, rep = sys.argv[1:9]
    T = json.load(open(tl))
    erase = {int(v) for v in erase_ids.split(",")}
    total = T["total"]
    n = int(total * SR)

    if len(sys.argv) > 9 and sys.argv[9] == "report":
        return report_only(out, rep, T)
    # 1) voice -> -14 LUFS integrated, true peak <= -1.5 dBTP (two-pass loudnorm, linear)
    m = subprocess.run(["ffmpeg", "-hide_banner", "-i", voice_in, "-af", "loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
    js = json.loads(m[m.rindex("{"): m.rindex("}") + 1])
    af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:measured_LRA={js['input_lra']}:"
          f"measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true,aresample={SR}")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", voice_in, "-af", af, "-ac", "2", "-ar", str(SR), "-c:a", "pcm_s24le", out + ".voice.wav"], check=True)
    vI0, vtp0 = loud(out + ".voice.wav")
    voice = dec(out + ".voice.wav") * 10 ** ((-14.0 - vI0) / 20)  # exact -14 LUFS (stereo measurement)
    enc(out + ".voice.wav", voice)
    voice = voice[:n] if len(voice) >= n else np.vstack([voice, np.zeros((n - len(voice), 2), np.float32)])

    # 2) voice activity at 100 Hz (for ducking and for keeping SFX off the words)
    hop = SR // 100
    mono = voice.mean(axis=1)
    frames = mono[: len(mono) // hop * hop].reshape(-1, hop)
    rms = db(np.sqrt((frames ** 2).mean(axis=1)))
    act = (rms > -42).astype(np.float32)
    hold = 25  # 250 ms
    act = np.maximum.reduce([np.roll(act, k) for k in range(0, hold)])
    va = np.zeros_like(act)
    a_up, a_dn = 1 - np.exp(-1 / 5), 1 - np.exp(-1 / 40)  # 50 ms attack, 400 ms release
    for i in range(1, len(act)):
        c = a_up if act[i] > va[i - 1] else a_dn
        va[i] = va[i - 1] + c * (act[i] - va[i - 1])
    ta = np.arange(n) / SR
    tv = np.arange(len(va)) / 100
    va_s = np.interp(ta, tv, va).astype(np.float32)

    # 3) music bed: set so music sits ~28 dB under the voice while speaking, +4 dB lift in pauses
    bed = dec(bed_in)
    bed = bed[:n] if len(bed) >= n else np.vstack([bed, np.zeros((n - len(bed), 2), np.float32)])
    enc(out + ".bed.wav", bed)
    bed_I, _ = loud(out + ".bed.wav")
    target = -14 - 28.0
    g = 10 ** ((target - bed_I) / 20)
    lift = 10 ** ((1 - va_s) * 3.0 / 20)
    music = bed * g * lift[:, None]

    # 4) SFX: each normalised so its loudest 400 ms sits ~16 dB under the voice, minus per-cue gain, minus 4 dB under words
    def word_time(sid, key, nth):
        sc = next(s for s in T["scenes"] if s["id"] == sid)
        norm = lambda s: re.sub(r"[^a-z0-9]", "", s.lower())
        parts = [norm(k) for k in key.split()]
        hits = 0
        for i in range(len(sc["words"]) - len(parts) + 1):
            if [norm(w["w"]) for w in sc["words"][i : i + len(parts)]] == parts:
                hits += 1
                if hits == nth:
                    return sc["words"][i]["t"]
        raise KeyError(f"{sid} {key} {nth}")
    cache = {}
    def sample(name):
        if name not in cache:
            x = dec(f"{sfx_dir}/{name}.mp3")
            w = int(0.4 * SR)
            mono = x.mean(axis=1)
            if len(mono) > w:
                c = np.convolve(mono ** 2, np.ones(w) / w, mode="valid")
                peak_rms = np.sqrt(c.max())
            else:
                peak_rms = np.sqrt((mono ** 2).mean())
            gain = 10 ** ((-32.0 - db(peak_rms)) / 20)
            x = x * gain
            fo = min(len(x), int(0.08 * SR))
            x[-fo:] *= np.linspace(1, 0, fo)[:, None]
            cache[name] = x
        return cache[name]
    sfx = np.zeros((n, 2), np.float32)
    events = []
    for line in open(cues_tsv):
        if not line.strip() or line.startswith("#"):
            continue
        p = line.rstrip("\n").split("\t")
        sid, key, nth, name, gdb = int(p[0]), p[1], int(p[2]), p[3], float(p[4])
        t = max(0.0, word_time(sid, key, nth) - 0.08)
        events.append((t, name, gdb))
    for i, s in enumerate(T["scenes"][1:], start=1):
        name = "board_erase" if s["id"] in erase else "whoosh_soft"
        events.append((max(0.0, s["start"] - 0.05), name, -8.0 if name == "whoosh_soft" else -6.0))
    for t, name, gdb in events:
        x = sample(name) * 10 ** (gdb / 20)
        a = int(t * SR)
        b = min(n, a + len(x))
        under = 1 - 0.37 * va_s[a:b]  # ~ -4 dB while a word is spoken
        sfx[a:b] += x[: b - a] * under[:, None]

    # 5) sum + safety limiter, fades handled in the bed
    mix = voice + music + sfx
    enc(out + ".premix.wav", mix)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", out + ".premix.wav", "-af", "alimiter=limit=0.84:attack=2:release=50:level=false", "-c:a", "pcm_s24le", out], check=True)

    # report: loudness of each layer, and how far music/SFX sit under the voice
    enc(out + ".music.wav", music)
    enc(out + ".sfx.wav", sfx)
    vI, vtp = loud(out + ".voice.wav")
    mI, _ = loud(out + ".music.wav")
    fI, ftp = loud(out)
    # loudest music moment (3 s window) vs the voice in the same window
    win = 3 * SR
    m_rms, idx = mov_rms(music.mean(axis=1), win, SR // 10)
    k = int(np.argmax(m_rms))
    a = idx[k]
    t_loud = a / SR
    v_seg = np.sqrt((voice[a:a + win].mean(axis=1) ** 2).mean())
    diff = db(v_seg) - db(m_rms[k])
    # SFX peaks vs speech (400 ms windows)
    s_rms, _ = mov_rms(sfx.mean(axis=1), int(0.4 * SR), SR // 20)
    v_rms, _ = mov_rms(voice.mean(axis=1), int(0.4 * SR), SR // 20)
    s_rms, v_rms = db(s_rms), db(v_rms)
    speech_level = np.percentile(v_rms[v_rms > -40], 75)
    r = {
        "voice_I_LUFS": vI, "voice_truepeak_dBTP": vtp,
        "music_I_LUFS": mI, "music_under_voice_dB": round(vI - mI, 1),
        "loudest_music_moment_s": round(t_loud, 1), "voice_minus_music_at_loudest_dB": round(float(diff), 1),
        "sfx_events": len(events), "sfx_max_400ms_dB": round(float(s_rms.max()), 1),
        "speech_400ms_p75_dB": round(float(speech_level), 1),
        "sfx_peak_under_speech_dB": round(float(speech_level - s_rms.max()), 1),
        "final_I_LUFS": fI, "final_truepeak_dBTP": ftp,
    }
    json.dump(r, open(rep, "w"), indent=1)
    print(json.dumps(r, indent=1))

def report_only(out, rep, T):
    vI0, vtp0 = loud(out + ".voice.wav")
    voice = dec(out + ".voice.wav") * 10 ** ((-14.0 - vI0) / 20)  # exact -14 LUFS (stereo measurement)
    enc(out + ".voice.wav", voice); music = dec(out + ".music.wav"); sfx = dec(out + ".sfx.wav")
    n = min(len(voice), len(music), len(sfx)); voice, music, sfx = voice[:n], music[:n], sfx[:n]
    vI, vtp = loud(out + ".voice.wav"); mI, _ = loud(out + ".music.wav"); fI, ftp = loud(out)
    win = 3 * SR
    m_rms, idx = mov_rms(music.mean(axis=1), win, SR // 10)
    k = int(np.argmax(m_rms)); a = idx[k]
    diff = db(np.sqrt((voice[a:a + win].mean(axis=1) ** 2).mean())) - db(m_rms[k])
    s_rms, _ = mov_rms(sfx.mean(axis=1), int(0.4 * SR), SR // 20)
    v_rms, _ = mov_rms(voice.mean(axis=1), int(0.4 * SR), SR // 20)
    s_rms, v_rms = db(s_rms), db(v_rms)
    sp = np.percentile(v_rms[v_rms > -40], 75)
    r = {"voice_I_LUFS": vI, "voice_truepeak_dBTP": vtp, "music_I_LUFS": mI, "music_under_voice_dB": round(vI - mI, 1),
         "loudest_music_moment_s": round(a / SR, 1), "voice_minus_music_at_loudest_dB": round(float(diff), 1),
         "sfx_max_400ms_dB": round(float(s_rms.max()), 1), "speech_400ms_p75_dB": round(float(sp), 1),
         "sfx_peak_under_speech_dB": round(float(sp - s_rms.max()), 1), "final_I_LUFS": fI, "final_truepeak_dBTP": ftp}
    json.dump(r, open(rep, "w"), indent=1)
    print(json.dumps(r, indent=1))

if __name__ == "__main__":
    main()
