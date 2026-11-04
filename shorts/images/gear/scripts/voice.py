# Kokoro TTS (offline) -> take1.wav + words.json (word times by MFCC-DTW against per-word renders, snapped to pauses)
import sys, json, re, numpy as np, soundfile as sf, librosa
from kokoro_onnx import Kokoro
MODEL_DIR, OUT = sys.argv[1], sys.argv[2]
VOICE, SPEED = 'am_michael', 1.0
LINES = [
  "A motor is spinning, but the last gear it drives is stuck in solid concrete.",
  "So why doesn't anything break?",
  "Between them are twelve pairs of gears, and each pair slows the spin fifty times.",
  "Those slowdowns multiply.",
  "The last gear would need over two trillion years to turn once.",
  "That's more than a hundred times the age of the universe.",
  "To the concrete, it's basically standing still.",
]
GAPS = [0.32, 0.42, 0.36, 0.40, 0.38, 0.40]   # silence after each line (s)
k = Kokoro(f"{MODEL_DIR}/kokoro-v1.0.onnx", f"{MODEL_DIR}/voices-v1.0.bin")
SR = 24000
def tts(t):
    a, sr = k.create(t, voice=VOICE, speed=SPEED, lang='en-us'); assert sr == SR
    return a.astype(np.float32)
def feats(a):
    m = librosa.feature.mfcc(y=a, sr=SR, n_mfcc=20, hop_length=120, n_fft=1024)   # 5 ms hop
    return (m - m.mean(1, keepdims=True)) / (m.std(1, keepdims=True) + 1e-6)
out, words, t0 = [], [], 0.0
for li, line in enumerate(LINES):
    a = tts(line)
    toks = line.split()
    clean = [re.sub(r"[^A-Za-z']", '', w) for w in toks]
    parts = [tts(w) for w in clean]                     # each word alone
    cat = np.concatenate(parts)
    bounds = np.cumsum([0] + [len(p) for p in parts])   # sample bounds in cat
    F1, F2 = feats(a), feats(cat)
    D, wp = librosa.sequence.dtw(X=F2, Y=F1, metric='euclidean')
    wp = wp[::-1]                                         # (cat_frame, line_frame) ascending
    def map_cat(sample):
        f = sample / 120
        idx = np.searchsorted(wp[:, 0], f)
        idx = min(idx, len(wp) - 1)
        return wp[idx, 1] * 120 / SR
    dur = len(a) / SR
    for i, w in enumerate(toks):
        s = map_cat(bounds[i]); e = map_cat(bounds[i + 1]) if i + 1 < len(toks) else dur
        words.append({'line': li, 'word': w, 'start': round(t0 + s, 3), 'end': round(t0 + e, 3)})
    out.append(a); t0 += dur
    if li < len(GAPS):
        g = np.zeros(int(GAPS[li] * SR), np.float32); out.append(g); t0 += GAPS[li]
vo = np.concatenate(out)
vo = vo / np.abs(vo).max() * 10 ** (-1.5 / 20)
sf.write(f"{OUT}/take1.wav", vo, SR, subtype='PCM_16')
# loudness pauses: RMS every 20 ms, silence < -42 dB for >= 0.18 s
hop = int(0.02 * SR); rms = np.array([np.sqrt(np.mean(vo[i:i+hop]**2) + 1e-12) for i in range(0, len(vo), hop)])
db = 20 * np.log10(rms); sil = db < -42; pauses = []; i = 0
while i < len(sil):
    if sil[i]:
        j = i
        while j < len(sil) and sil[j]: j += 1
        if (j - i) * 0.02 >= 0.18: pauses.append([round(i * 0.02, 2), round(j * 0.02, 2)])
        i = j
    else: i += 1
json.dump({'voice': VOICE, 'speed': SPEED, 'duration': round(len(vo) / SR, 3), 'lines': LINES, 'words': words, 'pauses': pauses},
          open(f"{OUT}/words.json", 'w'), indent=1)
print('duration', round(len(vo) / SR, 2))
for w in words: print(f"{w['start']:6.2f}-{w['end']:6.2f}  {w['word']}")
print('pauses', pauses)
