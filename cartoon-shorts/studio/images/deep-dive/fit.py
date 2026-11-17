# fit.py - voice was 26.88 s of speech (> 24.6 s budget): (1) shorten pauses > 0.35 s to 0.25 s, the dramatic pause
# before "not one photo" to 0.40 s (silence found by loudness, never inside a word); (2) speed up with atempo 1.05 (<= 6 %).
# writes public/deep-dive/vo/take1_fit.wav + words.json (shifted and divided by the tempo)
import json, subprocess, numpy as np, wave, os
SR = 44100; TEMPO = 1.05
VO = '../../public/deep-dive/vo'
x = np.frombuffer(subprocess.run(['/usr/bin/ffmpeg', '-v', 'error', '-i', f'{VO}/take1.mp3', '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout, np.float32)
h = 882; r = np.array([np.sqrt((x[i:i + h] ** 2).mean() + 1e-12) for i in range(0, len(x) - h, h)]); db = 20 * np.log10(r)
s = db < -42; sil = []; i = 0
while i < len(s):
    if s[i]:
        j = i
        while j < len(s) and s[j]: j += 1
        if (j - i) * 0.02 > 0.35 and j < len(s) - 5: sil.append((i * 0.02, j * 0.02))
        i = j
    else: i += 1
cuts = []
for a, b in sil:
    keep = 0.40 if a > 24.5 else 0.25
    rem = (b - a) - keep; m = (a + b) / 2; cuts.append((m - rem / 2, m + rem / 2))
print('pauses', [(round(a, 2), round(b, 2)) for a, b in sil])
print('cuts', [(round(a, 2), round(b, 2)) for a, b in cuts], 'saved', round(sum(b - a for a, b in cuts), 2))
segs = []; prev = 0
for a, b in cuts: segs.append(x[int(prev * SR):int(a * SR)]); prev = b
segs.append(x[int(prev * SR):])
y = segs[0]; f = int(0.01 * SR)
for sgm in segs[1:]:
    ramp = np.linspace(0, 1, f, dtype=np.float32)
    y = np.concatenate([y[:-f], y[-f:] * (1 - ramp) + sgm[:f] * ramp, sgm[f:]])
e = len(y)
while e > 0 and abs(y[e - 1]) < 10 ** (-50 / 20): e -= 1
y = y[:min(len(y), e + int(0.05 * SR))]
tmp = '/tmp/claude-0/dd_cut.wav'
os.makedirs('/tmp/claude-0', exist_ok=True)
with wave.open(tmp, 'wb') as wf:
    wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(SR); wf.writeframes((np.clip(y, -1, 1) * 32767).astype(np.int16).tobytes())
subprocess.run(['/usr/bin/ffmpeg', '-v', 'error', '-y', '-i', tmp, '-filter:a', f'atempo={TEMPO}', '-ar', str(SR), '-ac', '1', '-c:a', 'pcm_s16le', f'{VO}/take1_fit.wav'], check=True)
def shift(t): return (t - sum(min(max(t - a, 0), b - a) for a, b in cuts)) / TEMPO
W = json.load(open('words_raw.json'))['words']
out = [dict(w=w['text'], s=round(shift(w['start']), 3), e=round(shift(w['end']), 3)) for w in W if w['type'] == 'word']
json.dump(out, open('words.json', 'w'), indent=0)
z = np.frombuffer(subprocess.run(['/usr/bin/ffmpeg', '-v', 'error', '-i', f'{VO}/take1_fit.wav', '-f', 'f32le', '-'], capture_output=True).stdout, np.float32)
print('cut len', round(len(y) / SR, 3), 'fit len', round(len(z) / SR, 3), 'peak dB', round(20 * np.log10(np.abs(z).max()), 2))
for w in out: print(w['w'], w['s'], end=' | ')
