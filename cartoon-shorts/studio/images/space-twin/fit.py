# fit.py - shorten long pauses (found by loudness) to 0.25 s; write take1_fit.wav + words.json (shifted)
import json, subprocess, numpy as np, wave
SR = 44100
x = np.frombuffer(subprocess.run(['/usr/bin/ffmpeg', '-v', 'error', '-i', '../../public/space-twin/vo/take1.mp3', '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout, np.float32)
h = 882; r = np.array([np.sqrt((x[i:i + h] ** 2).mean() + 1e-12) for i in range(0, len(x) - h, h)]); db = 20 * np.log10(r)
s = db < -42; sil = []; i = 0
while i < len(s):
    if s[i]:
        j = i
        while j < len(s) and s[j]: j += 1
        if (j - i) * 0.02 > 0.35 and j < len(s) - 5: sil.append((i * 0.02, j * 0.02))
        i = j
    else: i += 1
cuts = []  # (start, end) of removed silence, centred in each pause
for a, b in sil:
    rem = (b - a) - 0.25; m = (a + b) / 2; cuts.append((m - rem / 2, m + rem / 2))
print('cuts', [(round(a, 2), round(b, 2)) for a, b in cuts], 'saved', round(sum(b - a for a, b in cuts), 2))
segs = []; prev = 0
for a, b in cuts: segs.append(x[int(prev * SR):int(a * SR)]); prev = b
segs.append(x[int(prev * SR):])
y = segs[0]; f = int(0.01 * SR)
for sgm in segs[1:]:
    ramp = np.linspace(0, 1, f, dtype=np.float32)
    y = np.concatenate([y[:-f], y[-f:] * (1 - ramp) + sgm[:f] * ramp, sgm[f:]])
# trim trailing silence after the last word
e = len(y)
while e > 0 and abs(y[e - 1]) < 10 ** (-50 / 20): e -= 1
y = y[:min(len(y), e + int(0.05 * SR))]
def shift(t): return t - sum(min(max(t - a, 0), b - a) for a, b in cuts)
W = json.load(open('words_raw.json'))['words']
out = [dict(w=w['text'], s=round(shift(w['start']), 3), e=round(shift(w['end']), 3)) for w in W if w['type'] == 'word']
json.dump(out, open('words.json', 'w'), indent=0)
pk = np.abs(y).max(); print('len', round(len(y) / SR, 3), 'peak dB', round(20 * np.log10(pk), 2))
with wave.open('../../public/space-twin/vo/take1_fit.wav', 'wb') as wf:
    wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(SR); wf.writeframes((np.clip(y, -1, 1) * 32767).astype(np.int16).tobytes())
for w in out: print(w['w'], w['s'], end=' | ')
