# words.py VOICE OUT_JSON  -> word times (faster-whisper) + pauses by loudness (RMS 20 ms, < -42 dB for >= 0.18 s)
import json, subprocess, sys
import numpy as np
from faster_whisper import WhisperModel

voice, out = sys.argv[1], sys.argv[2]
pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", voice, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"],
                     capture_output=True, check=True).stdout
x = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768   # decoded with ffmpeg (PyAV build here is incompatible)
model = WhisperModel("medium.en", device="cpu", compute_type="int8")
segs, _ = model.transcribe(x, word_timestamps=True, language="en", beam_size=5)
words = [{"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3)} for s in segs for w in s.words]
hop = 320  # 20 ms
rms = np.array([np.sqrt(np.mean(x[i:i + hop] ** 2) + 1e-12) for i in range(0, len(x) - hop, hop)])
db = 20 * np.log10(rms + 1e-9)
sil = db < -42
pauses, i = [], 0
while i < len(sil):
    if sil[i]:
        j = i
        while j < len(sil) and sil[j]:
            j += 1
        if (j - i) * 0.02 >= 0.18:
            pauses.append([round(i * 0.02, 2), round(j * 0.02, 2)])
        i = j
    else:
        i += 1
json.dump({"duration": round(len(x) / 16000, 3), "words": words, "pauses": pauses}, open(out, "w"), indent=1)
for w in words:
    print(f'{w["s"]:6.2f} {w["e"]:6.2f}  {w["w"]}')
print("pauses:", pauses)
