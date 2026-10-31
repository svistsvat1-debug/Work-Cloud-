# word times without whisper: split each line's duration by syllable weight, then snap word edges to the
# nearest loudness dip (RMS every 10 ms) within +-0.12 s.
import json, re, numpy as np, soundfile as sf
d = "public/woodpecker/vo/"; y, sr = sf.read(d + "take1.wav"); info = json.load(open(d + "words.json"))
hop = int(.01*sr); rms = np.array([np.sqrt((y[i:i+hop]**2).mean()) for i in range(0, len(y)-hop, hop)])
db = 20*np.log10(rms+1e-9)
def syl(w): return max(1, len(re.findall(r"[aeiouy]+", w.lower().rstrip("e"))))
out = []
for L in info:
    ws = L["text"].replace("-", " ").split(); wt = np.array([syl(w)+0.4 for w in ws]); s, e = L["start"], L["end"]
    edges = s + np.concatenate([[0], np.cumsum(wt)]) / wt.sum() * (e - s)
    for i in range(1, len(edges)-1):
        a, b = int((edges[i]-.12)*100), int((edges[i]+.12)*100); edges[i] = (a + np.argmin(db[a:b])) / 100
    for i, w in enumerate(ws): out.append({"line": L["id"], "w": re.sub(r"[^\w']", "", w), "s": round(edges[i], 2), "e": round(edges[i+1], 2)})
json.dump(out, open(d + "words_est.json", "w"), indent=0)
print(" ".join(f'{o["w"]}@{o["s"]}' for o in out))
