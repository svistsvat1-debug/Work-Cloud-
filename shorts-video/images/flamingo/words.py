import json, sys, subprocess, numpy as np
src = sys.argv[1]
# --- word timestamps
words = []
try:
    from faster_whisper import WhisperModel
    m = WhisperModel("small.en", device="cpu", compute_type="int8")
    a16 = np.frombuffer(subprocess.run(["ffmpeg","-v","error","-i",src,"-ac","1","-ar","16000","-f","f32le","-"],capture_output=True).stdout, np.float32)
    segs, info = m.transcribe(a16, word_timestamps=True, beam_size=5)
    for s in segs:
        for w in s.words:
            words.append({"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3)})
except Exception as e:
    print("WHISPER FAILED:", repr(e)[:300])
# --- loudness pauses
pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-ac", "1", "-ar", "48000", "-f", "f32le", "-"], capture_output=True).stdout
a = np.frombuffer(pcm, np.float32); sr = 48000; hop = int(0.02 * sr)
n = len(a) // hop
rms = np.sqrt((a[: n * hop].reshape(n, hop) ** 2).mean(1) + 1e-12); db = 20 * np.log10(rms)
sil = db < -42; pauses = []; i = 0
while i < n:
    if sil[i]:
        j = i
        while j < n and sil[j]: j += 1
        if (j - i) * 0.02 >= 0.18: pauses.append([round(i * 0.02, 2), round(j * 0.02, 2)])
        i = j
    else: i += 1
out = {"duration": round(len(a) / sr, 3), "peak_db": round(float(20 * np.log10(np.abs(a).max())), 2), "words": words, "pauses": pauses}
json.dump(out, open(sys.argv[2], "w"), indent=1)
print("dur", out["duration"], "peak", out["peak_db"])
print(" ".join(f'{w["w"]}[{w["s"]:.2f}]' for w in words))
print("pauses", pauses)
