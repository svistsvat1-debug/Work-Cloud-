#!/usr/bin/env python3
"""Local, free word timestamps with faster-whisper (CPU). Usage: transcribe_words.py <audio> <out.json> [model]"""
import json, subprocess, sys
import numpy as np
from faster_whisper import WhisperModel
audio, out = sys.argv[1], sys.argv[2]
model_name = sys.argv[3] if len(sys.argv) > 3 else "small.en"
model = WhisperModel(model_name, device="cpu", compute_type="int8", cpu_threads=4)
# decode with ffmpeg (avoids PyAV version issues)
pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", audio, "-f", "f32le", "-ac", "1", "-ar", "16000", "-"], capture_output=True, check=True).stdout
arr = np.frombuffer(pcm, dtype=np.float32)
segments, info = model.transcribe(arr, word_timestamps=True, beam_size=5, language="en", vad_filter=False)
words = []
for seg in segments:
    for w in seg.words:
        words.append({"w": w.word.strip(), "s": round(w.start, 3), "e": round(w.end, 3)})
json.dump({"duration": info.duration, "model": model_name, "words": words}, open(out, "w"), indent=0)
print("words", len(words), "duration", info.duration)
