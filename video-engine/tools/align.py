"""Align faster-whisper word timestamps to the locked script.
usage: python tools/align.py words.json script_voice.txt script_scenes.md audio_duration out_timing.json"""
import json, re, sys, difflib
words = json.load(open(sys.argv[1]))
paras = [p.strip() for p in open(sys.argv[2]).read().split('\n\n') if p.strip()]
md = open(sys.argv[3]).read()
blocks = []; cur = None
for line in md.splitlines():
    if line.startswith('## '): cur = line[3:].strip()
    if line.startswith('[SCENE '): blocks.append(cur)
moods = re.findall(r'^MUSIC MOOD: (\w+)', md, re.M)
dur = float(sys.argv[4])
assert len(paras) == len(blocks) == len(moods), (len(paras), len(blocks), len(moods))
NUM = {'1943':'nineteen forty-three','1941':'nineteen forty-one','1942':'nineteen forty-two','1944':'nineteen forty-four','1940':'nineteen forty','2013':'twenty thirteen'}
def norm(t):
    t = t.lower().replace('’', "'")
    t = re.sub(r"[^a-z0-9' -]", ' ', t)
    out = []
    for tok in t.replace('-', ' ').split():
        tok = tok.strip("'")
        if tok: out.append(tok)
    return out
# script tokens with (scene index, display word)
S = []
for si, p in enumerate(paras):
    for disp in p.split():
        for tok in norm(disp): S.append((si, disp, tok))
# whisper tokens (expand digits roughly)
W = []
for w in words:
    toks = norm(NUM.get(re.sub(r'[^0-9]', '', w['w']), w['w'])) if re.sub(r'[^0-9]', '', w['w']) in NUM else norm(w['w'])
    if not toks: continue
    n = len(toks)
    for i, tok in enumerate(toks):
        s = w['s'] + (w['e']-w['s'])*i/n; e = w['s'] + (w['e']-w['s'])*(i+1)/n
        W.append((tok, s, e))
sm = difflib.SequenceMatcher(a=[t for _, _, t in S], b=[t for t, _, _ in W], autojunk=False)
times = [None]*len(S)
for a, b, n in sm.get_matching_blocks():
    for k in range(n): times[a+k] = (W[b+k][1], W[b+k][2])
matched = sum(t is not None for t in times)
# interpolate gaps
for i in range(len(S)):
    if times[i] is None:
        j = i
        while j < len(S) and times[j] is None: j += 1
        prev = times[i-1][1] if i > 0 else 0.0
        nxt = times[j][0] if j < len(S) else dur
        gap = j - i
        for k in range(gap):
            times[i+k] = (prev + (nxt-prev)*k/gap, prev + (nxt-prev)*(k+1)/gap)
# build scene list; collapse sub-tokens back into display words
scenes = []
for si, p in enumerate(paras):
    idx = [i for i, (s, _, _) in enumerate(S) if s == si]
    wl = []; last_disp = None
    for i in idx:
        _, disp, tok = S[i]
        wl.append({'w': tok, 's': round(times[i][0], 3), 'e': round(times[i][1], 3)})
    scenes.append({'i': si+1, 'block': blocks[si], 'mood': moods[si], 'text': p, 'vo_s': wl[0]['s'], 'vo_e': wl[-1]['e'], 'words': wl})
# scene windows: start = midpoint of the gap before VO (first scene starts at 0), end = next start
for k, sc in enumerate(scenes):
    sc['start'] = 0.0 if k == 0 else round((scenes[k-1]['vo_e'] + sc['vo_s'])/2, 3)
for k, sc in enumerate(scenes):
    sc['end'] = round(scenes[k+1]['start'], 3) if k+1 < len(scenes) else dur
json.dump({'duration': dur, 'fps': 30, 'scenes': scenes}, open(sys.argv[5], 'w'), indent=0)
print(f'script tokens {len(S)}, whisper tokens {len(W)}, matched {matched} ({matched/len(S):.1%})')
for sc in scenes[:3] + scenes[-2:]: print(sc['i'], sc['start'], sc['end'], sc['text'][:50])
