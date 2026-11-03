"""Kokoro (free, local, ONNX) voice-over + line/word timings.
usage: python tts.py MODEL_DIR OUT_DIR [voice]"""
import json, sys
import numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

model_dir, out_dir = sys.argv[1], sys.argv[2]
voice = sys.argv[3] if len(sys.argv) > 3 else "am_michael"
SR = 24000
# (text shown in captions / script, text sent to TTS, pause AFTER the line in s)
LINES = [
    ("How does a hummingbird survive a cold night without food?", None, 0.38),
    ("It burns energy so fast that staying warm until morning could use up its fat.", None, 0.30),
    ("So it does the opposite.", None, 0.22),
    ("It goes still and lets its body go cold.", None, 0.34),
    ("Its heartbeat drops from about 1,200 a minute to as low as 40.",
     "Its heartbeat drops from about twelve hundred a minute to as low as forty.", 0.32),
    ("One black metaltail cooled to 3.3 degrees Celsius.",
     "One black metal tail cooled to three point three degrees Celsius.", 0.24),
    ("That's fridge cold.", None, 0.24),
    ("No bird has been measured colder.", None, 0.0),
]
k = Kokoro(f"{model_dir}/kokoro-v1.0.onnx", f"{model_dir}/voices-v1.0.bin")

def trim(x, thr_db=-45):
    win = int(0.01 * SR)
    rms = np.sqrt(np.convolve(x ** 2, np.ones(win) / win, mode="same") + 1e-12)
    on = np.where(20 * np.log10(rms) > thr_db)[0]
    a, b = max(on[0] - int(0.02 * SR), 0), min(on[-1] + int(0.04 * SR), len(x))
    return x[a:b]

def nphon(word):
    p = k.tokenizer.phonemize(word, "en-us")
    return max(len([c for c in p if c not in " ˈˌː"]), 1)

audio, lines, words, t = [], [], [], 0.0
for shown, spoken, gap in LINES:
    spoken = spoken or shown
    x, sr = k.create(spoken, voice=voice, speed=1.0, lang="en-us")
    assert sr == SR
    x = trim(x.astype(np.float32))
    dur = len(x) / SR
    lines.append({"text": shown, "spoken": spoken, "start": round(t, 3), "end": round(t + dur, 3)})
    # word times: speech span split by phoneme count, then snapped to in-line pauses
    ws = spoken.replace(",", "").split()
    w8 = np.array([nphon(w) for w in ws], float) + 0.6  # +0.6 ~ per-word boundary cost
    edges = np.concatenate([[0], np.cumsum(w8) / w8.sum()]) * dur
    win = int(0.02 * SR)
    rms = 20 * np.log10(np.sqrt(np.convolve(x ** 2, np.ones(win) / win, mode="same") + 1e-12))
    quiet = rms < -40
    for i in range(1, len(edges) - 1):  # snap boundaries to a quiet spot within +-0.12 s
        c = int(edges[i] * SR); r = int(0.12 * SR)
        seg = np.arange(max(c - r, 0), min(c + r, len(x)))
        q = seg[quiet[seg]]
        if len(q):
            edges[i] = q[np.argmin(np.abs(q - c))] / SR
    for w, a, b in zip(ws, edges[:-1], edges[1:]):
        words.append({"w": w, "start": round(t + a, 3), "end": round(t + b, 3)})
    audio.append(x)
    t += dur
    if gap:
        audio.append(np.zeros(int(gap * SR), np.float32)); t += gap

y = np.concatenate(audio)
y = y / np.max(np.abs(y)) * 10 ** (-1.5 / 20)  # peak -1.5 dBFS
sf.write(f"{out_dir}/take1.wav", y, SR, subtype="PCM_16")
json.dump({"voice": voice, "sr": SR, "duration": round(len(y) / SR, 3), "lines": lines, "words": words},
          open(f"{out_dir}/words.json", "w"), indent=1)
print("duration", round(len(y) / SR, 2))
for l in lines: print(f'{l["start"]:6.2f}-{l["end"]:6.2f}  {l["text"]}')
