# fit_voice.py - shorten silent pauses > 0.35 s to 0.25 s (silence found by loudness, never inside a word); remap word times
import json, numpy as np, scipy.io.wavfile as w
W = json.load(open('words_raw.json'))
sr, x = w.read('vo.wav'); x = x.astype(np.float32) / 32768
hop = int(0.02 * sr); n = len(x) // hop
db = 20 * np.log10(np.array([np.sqrt((x[i*hop:(i+1)*hop] ** 2).mean() + 1e-12) for i in range(n)]))
sp = db > -42; idx = np.where(sp)[0]; s0, s1 = idx[0], idx[-1]
cuts = []  # (start_s, end_s) of silence to remove
s = None
for i in range(s0, s1 + 1):
    if not sp[i] and s is None: s = i
    if sp[i] and s is not None:
        L = (i - s) * 0.02
        if L > 0.35:
            mid = (s + i) / 2 * 0.02; rem = L - 0.25
            cuts.append((mid - rem / 2, mid + rem / 2))
        s = None
# trim leading silence before speech and trailing after
start = max(s0 * 0.02 - 0.02, 0); end = (s1 + 1) * 0.02 + 0.05
segs = []; t = start
for a, b in cuts: segs.append((t, a)); t = b
segs.append((t, end))
fade = int(0.004 * sr)
out = []
for a, b in segs:
    seg = x[int(a * sr):int(b * sr)].copy(); seg[:fade] *= np.linspace(0, 1, fade); seg[-fade:] *= np.linspace(1, 0, fade); out.append(seg)
y = np.concatenate(out)
def remap(t):
    r = t - start
    for a, b in cuts:
        if t >= b: r -= (b - a)
        elif t > a: r -= (t - a)
    return round(max(r, 0), 3)
words = [dict(w=d['text'], s=remap(d['start']), e=remap(d['end'])) for d in W]
w.write('../../public/suez-sequel/vo/take1_fit.wav', sr, (np.clip(y, -1, 1) * 32767).astype(np.int16))
json.dump(words, open('words.json', 'w'), indent=0)
print('cuts', [(round(a, 2), round(b - a, 2)) for a, b in cuts]); print('fit length', len(y) / sr, 'last word end', words[-1]['e'])
