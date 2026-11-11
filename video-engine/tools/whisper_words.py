"""Local word timestamps (faster-whisper small.en, CPU). Run next to voice16k.wav (ffmpeg -i voice.mp3 -ac 1 -ar 16000 voice16k.wav)."""
import json
import numpy as np, scipy.io.wavfile as wf
from faster_whisper import WhisperModel
m=WhisperModel("small.en",device="cpu",compute_type="int8",cpu_threads=4)
sr,a=wf.read("voice16k.wav")
a=a.astype(np.float32)/32768.0
segs,info=m.transcribe(a,word_timestamps=True,beam_size=5,language="en",vad_filter=False)
words=[]
for s in segs:
    for w in s.words: words.append({"w":w.word.strip(),"s":round(w.start,3),"e":round(w.end,3)})
json.dump(words,open("words.json","w"))
print(len(words), words[-1])
