"""Voice-over with Kokoro (free, local) + word times.

Usage: python3 -I tools/voice.py
Writes public/birdwire/vo/take1.wav and src/birdwire/words.json.

Kokoro's ONNX export has no duration output, so word starts are measured by
synthesizing each line prefix (words[:i]) and taking its spoken length, then
snapping to the nearest loudness dip in the full line.
"""
import json
import os
import re
import sys

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL = os.path.join(ROOT, ".models", "kokoro-v1.0.onnx")
VOICES = os.path.join(ROOT, ".models", "voices-v1.0.bin")
VOICE = os.environ.get("VOICE", "am_michael")
SPEED = float(os.environ.get("SPEED", "1.0"))
SR = 24000

LINES = [
    "So why doesn't this bird on a power line get zapped?",
    "It's not special feet.",
    "Basically, current only goes through you if you touch two spots at different voltages.",
    "Both feet are on one wire, same voltage, so nothing really flows.",
    "But if a wing touches another wire, or the pole, the circuit closes.",
    "That's why big birds, like eagles, are in way more danger.",
]
# silence after each line (s); the long one after line 5 is where the zap goes
GAPS = [0.30, 0.30, 0.30, 0.35, 0.85, 0.0]
LEAD = 0.10
TAIL = 1.10  # loop settle after the last word


def rms_db(x, hop=480):  # 20 ms frames
    n = len(x) // hop
    fr = x[: n * hop].reshape(n, hop)
    return 20 * np.log10(np.sqrt((fr ** 2).mean(1)) + 1e-9)


def trim(x, thr=-45.0):
    db = rms_db(x)
    on = np.where(db > thr)[0]
    if len(on) == 0:
        return x
    a = max(0, on[0] * 480 - 240)
    b = min(len(x), (on[-1] + 1) * 480 + 480)
    return x[a:b]


def main():
    k = Kokoro(MODEL, VOICES)

    def synth(text):
        audio, sr = k.create(text, voice=VOICE, speed=SPEED, lang="en-us")
        assert sr == SR
        return trim(audio.astype(np.float32))

    out = [np.zeros(int(LEAD * SR), np.float32)]
    t = LEAD
    words = []
    for li, line in enumerate(LINES):
        full = synth(line)
        dur = len(full) / SR
        toks = line.split()
        clean = [re.sub(r"[^\w']", "", w) for w in toks]
        db = rms_db(full)
        # A = length of words[:i]  (late: the last word of a prefix is stretched)
        # B = length of words[:i+1] minus word i said alone (early: a lone word is stretched too)
        pre = [0.0] + [len(synth(" ".join(toks[:i]).rstrip(",.?!"))) / SR for i in range(1, len(toks) + 1)]
        iso = [len(synth(w)) / SR for w in clean]
        starts = [0.0]
        for i in range(1, len(toks)):
            a = pre[i]
            b = max(0.0, pre[i + 1] - iso[i])
            d = 0.5 * (a + b)
            # snap to the quietest 20 ms frame within +-0.06 s
            c = int(round(d / 0.02))
            lo, hi = max(0, c - 3), min(len(db) - 1, c + 3)
            j = lo + int(np.argmin(db[lo : hi + 1]))
            s = max(j * 0.02, starts[-1] + 0.1)
            starts.append(min(s, dur - 0.08))
        for i, w in enumerate(clean):
            end = starts[i + 1] if i + 1 < len(clean) else dur
            words.append({"w": w, "line": li, "start": round(t + starts[i], 3), "end": round(t + end, 3)})
        print(f"L{li + 1} {t:6.2f}-{t + dur:6.2f}  {line}", file=sys.stderr)
        out.append(full)
        t += dur
        g = GAPS[li]
        out.append(np.zeros(int(g * SR), np.float32))
        t += g
    out.append(np.zeros(int(TAIL * SR), np.float32))
    audio = np.concatenate(out)
    peak = np.abs(audio).max()
    audio = audio / peak * 10 ** (-1.5 / 20)
    os.makedirs(os.path.join(ROOT, "public/birdwire/vo"), exist_ok=True)
    sf.write(os.path.join(ROOT, "public/birdwire/vo/take1.wav"), audio, SR, subtype="PCM_16")
    meta = {"voice": VOICE, "speed": SPEED, "duration": round(len(audio) / SR, 3),
            "lines": LINES, "words": words}
    with open(os.path.join(ROOT, "src/birdwire/words.json"), "w") as f:
        json.dump(meta, f, indent=1)
    print(f"total {len(audio) / SR:.2f}s", file=sys.stderr)


if __name__ == "__main__":
    main()
