"""captions.srt from aligned sentences (script text, voice timings). Max 2 lines x 42 chars, 1-6 s per cue.

Usage: python3 tools/captions.py <sentences.json> <captions.srt>
"""
import json
import sys
from pathlib import Path

sents = json.loads(Path(sys.argv[1]).read_text())
out = Path(sys.argv[2])
MAXL, MAXC, MIN_D, MAX_D = 42, 84, 1.0, 6.0


def ts(t):
    t = max(0, t)
    h = int(t // 3600)
    m = int(t % 3600 // 60)
    s = int(t % 60)
    ms = int(round((t - int(t)) * 1000))
    if ms == 1000:
        s, ms = s + 1, 0
    return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'


def wrap(words):
    text = ' '.join(words)
    if len(text) <= MAXL:
        return text
    # best split into two balanced lines
    best = None
    for k in range(1, len(words)):
        a, b = ' '.join(words[:k]), ' '.join(words[k:])
        if len(a) <= MAXL and len(b) <= MAXL:
            score = abs(len(a) - len(b))
            if best is None or score < best[0]:
                best = (score, a + '\n' + b)
    return best[1] if best else None


cues = []
for s in sents:
    ws = s['words']
    i = 0
    while i < len(ws):
        j = i + 1
        # grow while it still fits 2 lines and <= 6 s
        while j < len(ws):
            cand = [w['w'] for w in ws[i:j + 1]]
            if wrap(cand) is None or ws[j]['end'] - ws[i]['start'] > MAX_D:
                break
            j += 1
        chunk = ws[i:j]
        # avoid a 1-word orphan at the end of a sentence
        if j == len(ws) - 1 and len(chunk) > 2 and wrap([w['w'] for w in ws[i:]]) is None:
            chunk = ws[i:j - 1]
            j -= 1
        cues.append({'start': chunk[0]['start'], 'end': chunk[-1]['end'], 'text': wrap([w['w'] for w in chunk])})
        i = j

# timing rules: min 1 s, no overlaps, small lead-out
for k, c in enumerate(cues):
    nxt = cues[k + 1]['start'] if k + 1 < len(cues) else c['end'] + 2
    end = max(c['end'] + 0.15, c['start'] + MIN_D)
    c['end'] = min(end, nxt - 0.04, c['start'] + MAX_D)
    if c['end'] - c['start'] < MIN_D:
        c['end'] = min(c['start'] + MIN_D, nxt - 0.01)

with out.open('w', encoding='utf8') as f:
    for k, c in enumerate(cues, start=1):
        f.write(f"{k}\n{ts(c['start'])} --> {ts(c['end'])}\n{c['text']}\n\n")
lines = [l for c in cues for l in c['text'].split('\n')]
print(f'{len(cues)} cues, longest line {max(len(l) for l in lines)} chars, durations {min(c["end"]-c["start"] for c in cues):.2f}-{max(c["end"]-c["start"] for c in cues):.2f}s')
