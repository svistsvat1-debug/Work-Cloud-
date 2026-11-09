import json, sys, subprocess
import numpy as np
from faster_whisper import WhisperModel
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", sys.argv[1], "-f", "f32le", "-ac", "1", "-ar", "16000", "-"],
                     capture_output=True, check=True).stdout
audio = np.frombuffer(raw, np.float32)
m = WhisperModel("small.en", device="cpu", compute_type="int8")
segs, info = m.transcribe(audio, word_timestamps=True, beam_size=5, vad_filter=False)
words = []
for s in segs:
    print(f"[{s.start:6.2f}-{s.end:6.2f}] {s.text}")
    for w in s.words:
        words.append({"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3), "p": round(w.probability, 3)})
json.dump(words, open(sys.argv[2], "w"), indent=1)
print("words:", len(words))
for w in words: print(f'{w["s"]:6.2f} {w["e"]:6.2f} {w["p"]:.2f} {w["w"]}')
