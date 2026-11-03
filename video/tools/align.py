"""Refine word times: synthesize each sentence prefix (same voice, deterministic), its trimmed length ~ the
end time of its last word in the full sentence. Blend with the phoneme-split estimate in words.json."""
import json, sys
import numpy as np
from kokoro_onnx import Kokoro
sys.path.insert(0, "tools")
model_dir, path = sys.argv[1], sys.argv[2]
SR = 24000
k = Kokoro(f"{model_dir}/kokoro-v1.0.onnx", f"{model_dir}/voices-v1.0.bin")
d = json.load(open(path))
def tlen(x, thr_db=-45):
    win = int(0.01 * SR)
    rms = np.sqrt(np.convolve(x ** 2, np.ones(win) / win, mode="same") + 1e-12)
    on = np.where(20 * np.log10(rms) > thr_db)[0]
    return (min(on[-1] + int(0.04 * SR), len(x)) - max(on[0] - int(0.02 * SR), 0)) / SR
wi = 0
for L in d["lines"]:
    ws = L["spoken"].replace(",", "").split()
    full = L["end"] - L["start"]
    ends = []
    for n in range(1, len(ws) + 1):
        x, _ = k.create(" ".join(ws[:n]) + ("" if n < len(ws) else ""), voice=d["voice"], speed=1.0, lang="en-us")
        ends.append(tlen(x.astype(np.float32)))
    ends = np.array(ends) * full / ends[-1]          # scale so the last prefix = the full line
    ends[:-1] -= 0.05                                 # phrase-final lengthening in a prefix
    ends = np.maximum.accumulate(ends)
    starts = np.concatenate([[0], ends[:-1]])
    for j, w in enumerate(ws):
        W = d["words"][wi]; assert W["w"] == w
        W["start"] = round(L["start"] + 0.5 * (W["start"] - L["start"]) + 0.5 * starts[j], 3)
        W["end"] = round(L["start"] + 0.5 * (W["end"] - L["start"]) + 0.5 * ends[j], 3)
        wi += 1
json.dump(d, open(path, "w"), indent=1)
print(" ".join(f"{w['w']}@{w['start']}" for w in d["words"]))
