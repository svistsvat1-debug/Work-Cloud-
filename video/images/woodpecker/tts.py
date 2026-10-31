# Free local TTS: Kokoro-82M (Apache-2.0) via kokoro-onnx. Each line is synthesised separately and joined with
# known pauses, so every beat time is exact. Writes take1.wav + words.json (line start/end) + T table.
import json, sys, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro
VOICE = sys.argv[1] if len(sys.argv) > 1 else "am_michael"
OUT = sys.argv[2] if len(sys.argv) > 2 else "/home/user/Work-Cloud-/video/public/woodpecker/vo"
k = Kokoro("/tmp/kokoro/kokoro-v1.0.onnx", "/tmp/kokoro/voices-v1.0.bin")
LINES = [  # (id, text, pause after in s)
 ("l1", "A woodpecker slams its face into a tree, over and over.", 0.40),
 ("l2", "So why doesn't it get a concussion?", 0.45),
 ("l3", "People used to think its skull was a built-in shock absorber.", 0.40),
 ("l4", "But slow-motion videos showed almost no cushioning.", 0.55),
 ("l5a", "Its head basically works like a stiff hammer,", 0.15),
 ("l5b", "since padding would waste the force it needs to drill.", 0.50),
 ("l6", "What protects it is size.", 0.35),
 ("l7", "A brain that small can take hits that would concuss a human.", 0.0),
]
def trim(a, sr, th=-45):
    db = 20*np.log10(np.abs(a)+1e-9); idx = np.where(db > th)[0]
    return a[max(idx[0]-int(.01*sr),0): idx[-1]+int(.03*sr)]
sr = 24000; parts = []; t = 0.0; info = []
for lid, text, pause in LINES:
    a, sr = k.create(text, voice=VOICE, speed=1.0, lang="en-us")
    a = trim(a.astype(np.float32), sr)
    info.append({"id": lid, "text": text, "start": round(t, 3), "end": round(t + len(a)/sr, 3)})
    parts += [a, np.zeros(int(pause*sr), np.float32)]; t += len(a)/sr + pause
y = np.concatenate(parts); y = y / np.abs(y).max() * 10**(-1/20)
sf.write(f"{OUT}/take1.wav", y, sr)
json.dump(info, open(f"{OUT}/words.json", "w"), indent=1)
for i in info: print(i)
print("total", round(len(y)/sr, 2))
