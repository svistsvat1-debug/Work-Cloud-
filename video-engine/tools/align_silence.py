"""Sentence/word timings from the owner's voice file WITHOUT an ASR model (free, local, offline).
usage: python3 align_silence.py <voice.wav> <script_voice.txt> <spec module dir> <out.json> <scenes.md>
- ffmpeg silencedetect gives the pauses; dynamic programming picks which pause ends each sentence
  (sentence durations ~ proportional to letters, longer pauses preferred at sentence/paragraph ends)
- words inside a sentence: letters spread over the speech-only time (internal pauses skipped)
"""
import json, re, subprocess, sys
voice, script, specdir, out, scenes_md = sys.argv[1:6]
sys.path.insert(0, specdir)
from sailors_spec import SCENES, SFX

txt = open(script).read()
sents, para_end = [], []
for p in [p for p in txt.split('\n\n') if p.strip()]:
    ss = re.split(r'(?<=[.?!])\s+', p.strip())
    for i, s in enumerate(ss):
        sents.append({'text': s}); para_end.append(i == len(ss) - 1)
N = len(sents)
L = lambda s: len(re.sub(r'[^A-Za-z0-9]', '', s))
weight = [L(s['text']) + 7 * len(re.findall(r'[,;:]', s['text'])) for s in sents]

log = subprocess.run(['ffmpeg', '-hide_banner', '-i', voice, '-af', 'silencedetect=n=-40dB:d=0.1', '-f', 'null', '-'], capture_output=True, text=True).stderr
ss_ = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', log)]
se_ = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', log)]
dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', voice], capture_output=True, text=True).stdout)
sil = list(zip(ss_, se_ + [dur] * (len(ss_) - len(se_))))
t0 = sil[0][1] if sil and sil[0][0] < 0.05 else 0.0
t1 = sil[-1][0] if sil and sil[-1][1] >= dur - 0.05 else dur
inner = [(a, b) for a, b in sil if a > t0 + 0.05 and b < t1 - 0.05]
M = len(inner)
rate = (t1 - t0) / sum(weight)

def cost(j, a, b):  # sentence j spoken from a to b
    e = weight[j] * rate; t = b - a
    if t <= 0.15: return 1e9
    return ((t - e) / (0.22 * e + 0.25)) ** 2

def bonus(j, k):  # pause k closes sentence j
    d = inner[k][1] - inner[k][0]
    return -2.0 * min(d, 0.9) - (1.2 * min(d, 1.2) if para_end[j] else 0)

INF = 1e18
dp = [[INF] * M for _ in range(N - 1)]; bk = [[-1] * M for _ in range(N - 1)]
for k in range(M):
    dp[0][k] = cost(0, t0, inner[k][0]) + bonus(0, k)
for j in range(1, N - 1):
    for k in range(j, M):
        best, arg = INF, -1
        for q in range(max(0, k - 12), k):
            v = dp[j - 1][q]
            if v >= INF: continue
            v += cost(j, inner[q][1], inner[k][0])
            if v < best: best, arg = v, q
        if arg >= 0: dp[j][k] = best + bonus(j, k); bk[j][k] = arg
best, kk = INF, -1
for k in range(M):
    v = dp[N - 2][k] + cost(N - 1, inner[k][1], t1)
    if v < best: best, kk = v, k
bounds = [0] * (N - 1); bounds[-1] = kk
for j in range(N - 2, 0, -1): bounds[j - 1] = bk[j][bounds[j]]

for j, s in enumerate(sents):
    a = t0 if j == 0 else inner[bounds[j - 1]][1]
    b = t1 if j == N - 1 else inner[bounds[j]][0]
    s['start'], s['end'] = round(a, 3), round(b, 3)
    gaps = [(x, y) for x, y in inner if x > a and y < b]
    speech = (b - a) - sum(y - x for x, y in gaps)
    def at(frac):  # speech-time fraction -> real time
        t = a; left = frac * speech
        for x, y in gaps:
            if t + left <= x: break
            left -= (x - t); t = y
        return t + left
    ws = [w for w in s['text'].split() if L(w)]
    tot = sum(L(w) + 1 for w in ws); c = 0; words = []
    for w in ws:
        words.append([w.strip('.,?!:;"'), round(at(c / tot), 3), round(at((c + L(w)) / tot), 3)]); c += L(w) + 1
    s['words'] = words

scenes = []
for name_i, (idx, mood, hdr, vis) in enumerate(SCENES):
    scenes.append({'name': f'SCENE {name_i + 1:02d}', 'beats': idx, 'mood': mood, 'hdr': hdr, 'visual': vis})
for i, sc in enumerate(scenes):
    first = sents[sc['beats'][0]]
    prev_end = sents[sc['beats'][0] - 1]['end'] if sc['beats'][0] > 0 else 0.0
    sc['start'] = 0.0 if i == 0 else round((prev_end + first['start']) / 2, 3)
for i, sc in enumerate(scenes):
    sc['end'] = scenes[i + 1]['start'] if i + 1 < len(scenes) else None
TAIL = 3.5
end = round(dur + TAIL, 3); scenes[-1]['end'] = end
json.dump({'fps': 30, 'voiceDuration': dur, 'end': end, 'endFrame': int(round(end * 30)), 'sentences': sents, 'scenes': scenes}, open(out, 'w'), indent=1)

fmt = lambda t: f'{int(t // 60)}:{t % 60:04.1f}'
with open(scenes_md, 'w') as f:
    f.write('# Script scenes — What Did WW2 Sailors Actually Do All Day?\n\nTimings = aligned to the owner\'s voice file (pauses + DP, no ASR). Quest map in the header line.\n\n')
    for sc in scenes:
        f.write(f"[{sc['name']} | ~{fmt(sc['start'])}–{fmt(sc['end'])} | MUSIC MOOD: {sc['mood']}]" + (f"  header: {sc['hdr']}" if sc['hdr'] else '') + '\n')
        for bi, j in enumerate(sc['beats']):
            f.write(f"B{bi + 1} VO: \"{sents[j]['text']}\"\n")
            sx = SFX.get(int(sc['name'].split()[1]))
            if sx and sx[0] == bi: f.write(f"   SFX: {sx[1]}\n")
        f.write(f"   VISUAL: {sc['visual']}\n   -> HARD CUT\n\n")
# report: sentence speeds (outliers hint at a misalignment)
sp = [(L(s['text']) / max(0.01, s['end'] - s['start']), i) for i, s in enumerate(sents)]
print('sentences', N, 'pauses', M, 'voice', dur, 'video', end, 'rate', round(1 / rate, 1), 'letters/s')
print('slowest', sorted(sp)[:5]); print('fastest', sorted(sp)[-5:])
