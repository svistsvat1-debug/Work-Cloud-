from faster_whisper import WhisperModel
import json, wave, numpy as np
wf = wave.open("raw/take1_16k.wav")
a = np.frombuffer(wf.readframes(wf.getnframes()), np.int16).astype(np.float32) / 32768
m = WhisperModel("base.en", device="cpu", compute_type="int8")
segs, _ = m.transcribe(a, word_timestamps=True)
w = [dict(w=x.word.strip(), s=round(x.start, 2), e=round(x.end, 2)) for s in segs for x in s.words]
json.dump(w, open("words.json", "w"))
for x in w: print(x)
# pauses by loudness
hop = 320; r = np.array([np.sqrt(np.mean(a[i:i+hop]**2)+1e-12) for i in range(0, len(a)-hop, hop)])
db = 20*np.log10(r); sil = db < -42; out=[]; i=0
while i < len(sil):
    if sil[i]:
        j=i
        while j < len(sil) and sil[j]: j+=1
        if (j-i)*0.02 >= 0.18: out.append((round(i*0.02,2), round(j*0.02,2)))
        i=j
    else: i+=1
print("pauses", out)
