import json, sys
from faster_whisper import WhisperModel
m = WhisperModel("small.en", device="cpu", compute_type="int8")
import subprocess, numpy as np
raw = subprocess.run(["ffmpeg","-v","error","-i",sys.argv[1],"-f","f32le","-ac","1","-ar","16000","-"],capture_output=True).stdout
audio = np.frombuffer(raw, np.float32)
segs, info = m.transcribe(audio, word_timestamps=True, language="en", beam_size=5)
out = []
for s in segs:
    for w in s.words:
        out.append({"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3)})
json.dump(out, open(sys.argv[2], "w"), indent=1)
for o in out: print(f'{o["s"]:6.2f} {o["e"]:6.2f} {o["w"]}')
