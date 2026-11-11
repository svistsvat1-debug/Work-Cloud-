"""Build captions.srt from timing.json (max 2 lines x 42 chars, 1-6 s per cue).
usage: python tools/captions.py src/data/timing.json out.srt"""
import json, re, sys
T = json.load(open(sys.argv[1]))
def ntoks(disp):
    t = re.sub(r"[^a-z0-9' -]", ' ', disp.lower().replace('’', "'")).replace('-', ' ')
    return len([x for x in t.split() if x.strip("'")])
words = []
for sc in T['scenes']:
    toks = sc['words']; k = 0
    for disp in sc['text'].split():
        n = ntoks(disp)
        if n == 0: continue
        words.append({'w': disp, 's': toks[k]['s'], 'e': toks[k+n-1]['e']}); k += n
    assert k == len(toks)
# sentences
sents = []; cur = []
for w in words:
    cur.append(w)
    if re.search(r'[.?!]["”]?$', w['w']): sents.append(cur); cur = []
if cur: sents.append(cur)
def text(ws): return ' '.join(w['w'] for w in ws)
def wrappable(t):
    if len(t) <= 42: return True
    ws = t.split()
    return any(len(' '.join(ws[:i])) <= 42 and len(' '.join(ws[i:])) <= 42 for i in range(1, len(ws)))
def fits(ws): return wrappable(text(ws)) and ws[-1]['e'] - ws[0]['s'] <= 5.8
# split long sentences at commas / balanced points
chunks = []
for s in sents:
    if fits(s): chunks.append(s); continue
    rest = s
    while rest and not fits(rest):
        best = None
        for i in range(1, len(rest)):
            if not fits(rest[:i]): break
            score = (2 if rest[i-1]['w'].endswith((',', ':', ';')) else 0) + i/100
            if best is None or score >= best[0]: best = (score, i)
        i = best[1] if best else 1
        chunks.append(rest[:i]); rest = rest[i:]
    if rest: chunks.append(rest)
# merge cues shorter than ~1.2 s with the next one when it still fits
merged = []
i = 0
while i < len(chunks):
    c = chunks[i]
    while c[-1]['e'] - c[0]['s'] < 1.2 and i+1 < len(chunks) and fits(c + chunks[i+1]):
        i += 1; c = c + chunks[i]
    if merged and c[-1]['e'] - c[0]['s'] < 1.0 and fits(merged[-1] + c):
        merged[-1] = merged[-1] + c
    else: merged.append(c)
    i += 1
def wrap(t):
    if len(t) <= 42: return t
    ws = t.split(); best = None
    for i in range(1, len(ws)):
        a, b = ' '.join(ws[:i]), ' '.join(ws[i:])
        if len(a) <= 42 and len(b) <= 42:
            sc = abs(len(a)-len(b))
            if best is None or sc < best[0]: best = (sc, a, b)
    assert best, t
    return best[1] + '\n' + best[2]
def ts(x):
    ms = int(round(x*1000)); return f'{ms//3600000:02d}:{ms//60000%60:02d}:{ms//1000%60:02d},{ms%1000:03d}'
out = []; cues = []
for k, c in enumerate(merged):
    s = c[0]['s']; e = c[-1]['e'] + 0.15
    nxt = merged[k+1][0]['s'] if k+1 < len(merged) else T['duration']
    if e - s < 1.0: e = s + 1.0
    e = min(e, nxt - 0.02)
    if e - s < 1.0 and cues: s = max(cues[-1][1] + 0.02, e - 1.0)
    cues.append((s, e, wrap(text(c))))
for k, (s, e, t) in enumerate(cues, 1): out.append(f'{k}\n{ts(s)} --> {ts(e)}\n{t}\n')
open(sys.argv[2], 'w').write('\n'.join(out))
d = [e-s for s, e, _ in cues]
print('cues', len(cues), 'min', round(min(d), 2), 'max', round(max(d), 2), 'maxline', max(len(l) for _, _, t in cues for l in t.split('\n')))
print([ (round(s,2), t) for s,e,t in cues if e-s<1.0])
