"""Round 10, step 2: joins each voice's chunks the way the page does and adds the joined files to out/synth.json.
Per chunk it also prints loudness: speech RMS, peak, the gain the page's leveling would apply, and how much of the
signal would hit its soft limiter."""
import json
import re
from collections import defaultdict

import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

SR = 24000
synth = json.load(open("out/synth.json"))


def load(path):
    x, sr = sf.read(path, dtype="float32", always_2d=True)
    x = x.mean(axis=1)
    return resample_poly(x, SR, sr).astype("float32") if sr != SR else x


def trim(x, db=-45):  # page: trimSilence
    f = SR // 100
    n = len(x) // f
    rms = np.sqrt((x[: n * f].reshape(n, f) ** 2).mean(axis=1))
    on = np.nonzero(rms > rms.max() * 10 ** (db / 20))[0]
    return x[max(0, on[0] - 2) * f: min(n, on[-1] + 3) * f] if len(on) else x


def level(x):  # page: level()
    f = SR // 50
    n = len(x) // f
    e = (x[: n * f].reshape(n, f) ** 2).mean(axis=1)
    speech = e[e > e.max() / 100]
    gain = min(4, max(0.25, 10 ** (-18 / 20) / np.sqrt(speech.mean() if len(speech) else 1e-9)))
    y, knee = x * gain, 0.85
    a = np.abs(y)
    out = np.where(a <= knee, y, np.sign(y) * (knee + (1 - knee) * np.tanh((a - knee) / (1 - knee))))
    return out.astype("float32"), gain, float((a > knee).mean())


groups = defaultdict(list)
for r in synth:
    m = re.match(r"^(.*)@r10c(\d+)$", r["id"])
    if m and r.get("ok"):
        groups[m[1]].append((int(m[2]), r))
added = []
for g, items in sorted(groups.items()):
    items.sort(key=lambda p: p[0])
    parts, lv = [], []
    for i, r in items:
        x = trim(load(r["file"]))
        y, gain, hot = level(x)
        f = SR // 50
        e = (x[: len(x) // f * f].reshape(-1, f) ** 2).mean(axis=1)
        print(f"{r['id']:34} {len(x) / SR:5.1f}s speech {10 * np.log10(e[e > e.max() / 100].mean()):6.1f} dBFS peak {20 * np.log10(np.abs(x).max()):6.1f} dBFS"
              f" gain x{gain:.2f} limited {hot * 100:.2f}%", flush=True)
        parts.append(x)
        lv.append(y)
    gap = np.zeros(int(0.42 * SR), dtype="float32")
    for kind, seq in (("joined", parts), ("leveled", lv)):
        audio = np.concatenate([np.concatenate([p, gap]) for p in seq])
        path = f"out/audio/{g}-{kind}__r10long.wav"
        sf.write(path, audio, SR, subtype="PCM_16")
        first = items[0][1]
        added.append({**first, "id": f"{g}-{kind}@r10long", "file": path, "text": " ".join(r["text"] for _, r in items),
                      "chars": sum(r["chars"] for _, r in items), "new": True})
json.dump([r for r in synth if "@r10long" not in r["id"]] + added, open("out/synth.json", "w"), indent=1, ensure_ascii=False)
print(len(added), "joined files")
