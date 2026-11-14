"""captions.srt from the beat timings: max 2 lines x 42 chars, 1–6 s per cue, cues never cross a sentence.
usage: python3 make_srt.py <timing.json> <out.srt>"""
import json, sys
T = json.load(open(sys.argv[1]))
def ts(t):
    ms = int(round(t * 1000)); h, ms = divmod(ms, 3600000); m, ms = divmod(ms, 60000); s, ms = divmod(ms, 1000)
    return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'
def lines(words):
    best = None
    for k in range(1, len(words)):
        a, b = ' '.join(words[:k]), ' '.join(words[k:])
        if len(a) <= 42 and len(b) <= 42:
            sc = abs(len(a) - len(b))
            if best is None or sc < best[0]: best = (sc, a + '\n' + b)
    return best[1] if best else None
cues = []
for s in T['sentences']:
    toks = s['text'].split()
    times = s['words']
    # align tokens with timed words (same order; punctuation-only tokens are rare)
    i = 0
    while i < len(toks):
        j = i + 1; chunk = None
        while j <= len(toks):
            txt = ' '.join(toks[i:j])
            t0 = times[min(i, len(times) - 1)][1]; t1 = times[min(j - 1, len(times) - 1)][2]
            fits = len(txt) <= 42 or lines(toks[i:j]) is not None
            if not fits or t1 - t0 > 6.0: break
            chunk = (j, txt); j += 1
        if chunk is None: chunk = (i + 1, toks[i])
        j, txt = chunk
        t0 = times[min(i, len(times) - 1)][1]; t1 = times[min(j - 1, len(times) - 1)][2]
        body = txt if len(txt) <= 42 else lines(toks[i:j])
        cues.append([t0, t1, body])
        i = j
# merge a too-short cue into the next one when they are back to back and still fit
k = 0
while k + 1 < len(cues):
    a, b = cues[k], cues[k + 1]
    words = (a[2].replace('\n', ' ') + ' ' + b[2].replace('\n', ' ')).split()
    joined = ' '.join(words)
    if a[1] - a[0] < 1.0 and b[0] - a[1] < 0.4 and b[1] - a[0] <= 6.0 and (len(joined) <= 42 or lines(words)):
        cues[k] = [a[0], b[1], joined if len(joined) <= 42 else lines(words)]; del cues[k + 1]
    else:
        k += 1
# min 1 s where the gap allows; no overlaps
for k, c in enumerate(cues):
    nxt = cues[k + 1][0] if k + 1 < len(cues) else c[1] + 2
    if c[1] - c[0] < 1.0: c[1] = min(c[0] + 1.0, nxt - 0.02)
    c[1] = min(c[1] + 0.15, nxt - 0.02) if c[1] - c[0] < 6.0 else c[1]
with open(sys.argv[2], 'w') as f:
    for k, (a, b, t) in enumerate(cues, 1):
        f.write(f'{k}\n{ts(a)} --> {ts(b)}\n{t}\n\n')
print('cues', len(cues), 'max chars/line', max(len(l) for c in cues for l in c[2].split('\n')), 'dur range', round(min(c[1]-c[0] for c in cues),2), round(max(c[1]-c[0] for c in cues),2))
