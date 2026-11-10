import json, sys, subprocess, numpy as np
from faster_whisper import WhisperModel
f = sys.argv[1]
m = WhisperModel("small.en", device="cpu", compute_type="int8")
# loudness-based pauses
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", f, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True).stdout
x = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
hop = 320
n = len(x) // hop
segs, _ = m.transcribe(x, word_timestamps=True, beam_size=5)
words = [{"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3)} for s in segs for w in s.words]
rms = np.sqrt((x[: n * hop].reshape(n, hop) ** 2).mean(1) + 1e-12)
db = 20 * np.log10(rms)
sil = db < -42
pauses = []
i = 0
while i < n:
    if sil[i]:
        j = i
        while j < n and sil[j]: j += 1
        if (j - i) * 0.02 >= 0.18: pauses.append([round(i * 0.02, 2), round(j * 0.02, 2)])
        i = j
    else: i += 1
json.dump({"words": words, "pauses": pauses, "dur": round(len(x) / 16000, 3)}, open(sys.argv[2], "w"), indent=1)
print(" ".join(f"{w['w']}[{w['s']}]" for w in words)); print("pauses", pauses); print("dur", len(x) / 16000)
