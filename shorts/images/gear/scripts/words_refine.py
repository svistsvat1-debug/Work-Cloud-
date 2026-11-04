# Refine word times: split speech at loudness pauses, spread words inside each run by their solo-render length.
import sys, json, re, numpy as np
from kokoro_onnx import Kokoro
MODEL_DIR = sys.argv[1]
d = json.load(open('public/gear/vo/words.json'))
k = Kokoro(f"{MODEL_DIR}/kokoro-v1.0.onnx", f"{MODEL_DIR}/voices-v1.0.bin")
segs_words = []  # split lines at commas / sentence ends
for li, line in enumerate(d['lines']):
    cur = []
    for w in line.split():
        cur.append(w)
        if w.endswith(',') or w.endswith('.') or w.endswith('?'):
            segs_words.append(cur); cur = []
    if cur: segs_words.append(cur)
# speech runs = complement of pauses
P = d['pauses']; dur = d['duration']; runs = []; t = 0.0
for a, b in P:
    if a - t > 0.05: runs.append([t, a])
    t = b
if dur - t > 0.05: runs.append([t, dur])
print(len(segs_words), 'segments,', len(runs), 'runs')
assert len(segs_words) == len(runs), (segs_words, runs)
out = []
for ws, (a, b) in zip(segs_words, runs):
    L = []
    for w in ws:
        x, sr = k.create(re.sub(r"[^A-Za-z']", '', w), voice=d['voice'], speed=d['speed'], lang='en-us')
        L.append(len(x) / sr)
    L = np.array(L); L = L / L.sum() * (b - a); c = a + np.concatenate([[0], np.cumsum(L)])
    for i, w in enumerate(ws): out.append({'word': w, 'start': round(float(c[i]), 3), 'end': round(float(c[i + 1]), 3)})
old = d['words']
for o, w in zip(old, out): print(f"{w['word']:12s} dtw {o['start']:6.2f}  prop {w['start']:6.2f}-{w['end']:6.2f}")
d['words_dtw'] = old; d['words'] = out
json.dump(d, open('public/gear/vo/words.json', 'w'), indent=1)
