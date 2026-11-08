# words.py in.mp3 out.json - faster-whisper word timestamps
import json, sys
from faster_whisper import WhisperModel
m = WhisperModel("small.en", device="cpu", compute_type="int8")
segs, info = m.transcribe(sys.argv[1], word_timestamps=True, beam_size=5)
words = []
for s in segs:
    for w in s.words:
        words.append({"w": w.word.strip(), "start": round(w.start, 3), "end": round(w.end, 3)})
json.dump(words, open(sys.argv[2], "w"), indent=1)
for w in words:
    print(f'{w["start"]:6.2f} {w["end"]:6.2f}  {w["w"]}')
