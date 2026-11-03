"""Kokoro (local, free) voice-over with exact word times.
Usage: python3 make_vo.py <kokoro_dir> <out_dir>
The ONNX model is patched (see patch_kokoro.py) so it also outputs per-phoneme durations."""
import sys, json, numpy as np, soundfile as sf
from kokoro_onnx import Kokoro

KDIR, OUT = sys.argv[1], sys.argv[2]
VOICE, SPEED = "am_michael", 1.0
LINES = [
    "The Leaning Tower of Pisa should have fallen before it was even finished.",
    "Only three floors up, the soft clay under it was close to giving way.",
    "Then the work stopped for almost a hundred years, probably because of wars.",
    "And that's basically what saved it.",
    "The tower's weight slowly squeezed water out of the clay, so the clay got stronger.",
    "Engineers say without that break, it would've toppled.",
]
# pause AFTER each line (s): room for the war clash after line 3, a beat before the payoff
PAUSES = [0.30, 0.34, 0.55, 0.34, 0.36, 0.0]
LEAD = 0.10

k = Kokoro(f"{KDIR}/kokoro-v1.0-timed.onnx", f"{KDIR}/voices-v1.0.bin")
sr = 24000
parts, words, lines, t = [np.zeros(int(LEAD * sr), np.float32)], [], [], LEAD
for li, (text, pause) in enumerate(zip(LINES, PAUSES)):
    a, sr, tim = k.create_timed(text, voice=VOICE, speed=SPEED, trim=True)
    a = a.astype(np.float32)
    # group phoneme timings into words (split on spaces, drop punctuation-only groups)
    groups, cur = [], []
    for p in tim:
        if p.phoneme == " ":
            if cur: groups.append(cur); cur = []
        else:
            cur.append(p)
    if cur: groups.append(cur)
    groups = [g for g in groups if any(ch.isalpha() or ch in "ɪʊəɛæɑɔʌθðŋʃʒˈˌːɜɐɾ" for p in g for ch in p.phoneme)]
    toks = text.replace(",", "").replace(".", "").split()
    # espeak can merge words ("should have" -> one group): align groups to 1..3 consecutive words by DP
    wl = [max(1, len(k.tokenizer.phonemize(w, "en-us").replace(" ", ""))) for w in toks]
    gl = [sum(len(p.phoneme) for p in g) for g in groups]
    INF = 1e9; G, W = len(groups), len(toks)
    D = [[INF] * (W + 1) for _ in range(G + 1)]; B = [[0] * (W + 1) for _ in range(G + 1)]; D[0][0] = 0
    for gi in range(1, G + 1):
        for wi in range(1, W + 1):
            for n in (1, 2, 3):
                if wi - n >= 0 and D[gi - 1][wi - n] < INF:
                    c = D[gi - 1][wi - n] + abs(gl[gi - 1] - sum(wl[wi - n:wi])) + (n - 1) * 1.5
                    if c < D[gi][wi]: D[gi][wi] = c; B[gi][wi] = n
    if D[G][W] >= INF: print("ALIGN FAIL", li); sys.exit(1)
    spans, wi = [], W
    for gi in range(G, 0, -1):
        n = B[gi][wi]; spans.append((gi - 1, wi - n, wi)); wi -= n
    for gi, w0, w1 in reversed(spans):
        g = groups[gi]; s, e = g[0].start, g[-1].end; tot = sum(wl[w0:w1]); acc = 0
        for j in range(w0, w1):
            ws = s + (e - s) * acc / tot; acc += wl[j]; we = s + (e - s) * acc / tot
            words.append({"w": toks[j], "line": li, "start": round(t + ws, 3), "end": round(t + we, 3),
                          "merged": w1 - w0 > 1, "ph": "".join(p.phoneme for p in g)})
    lines.append({"line": li, "text": text, "start": round(t, 3), "end": round(t + len(a) / sr, 3)})
    parts.append(a); t += len(a) / sr
    parts.append(np.zeros(int(pause * sr), np.float32)); t += pause
audio = np.concatenate(parts)
peak = np.abs(audio).max(); audio = audio / peak * 10 ** (-1.5 / 20)   # peak -1.5 dBFS
sf.write(f"{OUT}/take1.wav", audio, sr)
json.dump({"voice": VOICE, "speed": SPEED, "lines": lines, "words": words, "duration": round(len(audio) / sr, 3)},
          open(f"{OUT}/words.json", "w"), indent=1)
for l in lines: print(f"{l['start']:6.2f}-{l['end']:6.2f}  {l['text']}")
print("total", round(len(audio) / sr, 2), "s,", len(words), "words")
for w in words: print(f"  {w['start']:6.2f} {w['end']:6.2f} {w['w']}")
