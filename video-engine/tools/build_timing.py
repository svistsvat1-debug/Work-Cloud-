"""Build beat/scene timings from Kokoro's SRT + real pauses in the voice file (free, local).
usage: python3 build_timing.py <voice.mp3> <kokoro.srt> <script_scenes.md> <out.json>
- sentence text comes from script_scenes.md (B# VO lines); scenes = groups between '[SCENE' headers
- SRT cue text is concatenated, every character gets a time (linear inside a cue)
- sentence starts/ends are snapped to the nearest silence edge (ffmpeg silencedetect) within 0.45 s
"""
import json, re, subprocess, sys
voice, srt, scenes_md, out = sys.argv[1:5]

def ts(t):
    h, m, s = t.replace(',', '.').split(':'); return int(h) * 3600 + int(m) * 60 + float(s)

cues = []
for blk in open(srt).read().strip().split('\n\n'):
    ln = blk.strip().split('\n')
    a, b = ln[1].split(' --> ')
    cues.append((ts(a), ts(b), ' '.join(ln[2:]).strip()))

norm = lambda s: re.sub(r'[^a-z0-9]', '', s.lower())
chars, times = [], []
for a, b, txt in cues:
    n = norm(txt)
    for i, c in enumerate(n):
        chars.append(c); times.append(a + (b - a) * (i + 0.5) / max(1, len(n)))
stream = ''.join(chars)

# silence edges
log = subprocess.run(['ffmpeg', '-hide_banner', '-i', voice, '-af', 'silencedetect=n=-40dB:d=0.12', '-f', 'null', '-'],
                     capture_output=True, text=True).stderr
s_start = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', log)]
s_end = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', log)]
dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', voice],
                           capture_output=True, text=True).stdout)

def snap(t, edges, tol=0.45):
    c = [e for e in edges if abs(e - t) <= tol]
    return min(c, key=lambda e: abs(e - t)) if c else t

scenes, sents = [], []
for line in open(scenes_md):
    if line.startswith('[SCENE'):
        scenes.append({'name': line.split('|')[0].strip('[ ').strip(), 'beats': []})
    m = re.match(r'B\d+ VO: "(.*)"', line)
    if m:
        scenes[-1]['beats'].append(len(sents)); sents.append({'text': m.group(1)})

pos = 0
for s in sents:
    n = norm(s['text'])
    k = stream.find(n, pos)
    assert k >= 0, ('not found', s['text'], stream[pos:pos + 80])
    a, b = times[k], times[k + len(n) - 1]
    s['start'] = round(snap(a - 0.05, s_end), 3)
    s['end'] = round(snap(b + 0.05, s_start), 3)
    # words with interpolated times (by characters)
    words, j = [], k
    for w in s['text'].split():
        wn = norm(w)
        if not wn: continue
        jj = stream.find(wn, j)
        frac0 = (jj - k) / max(1, len(n)); frac1 = (jj + len(wn) - k) / max(1, len(n))
        words.append([w.strip('.,?!:;"'), round(s['start'] + (s['end'] - s['start']) * frac0, 3), round(s['start'] + (s['end'] - s['start']) * frac1, 3)])
        j = jj + len(wn)
    s['words'] = words
    pos = k + len(n)

# sentence end = start of the pause that leads into the next sentence (SRT cue ends include the pause)
pairs = list(zip(s_start, s_end))
for i, s in enumerate(sents):
    nxt = sents[i + 1]['start'] if i + 1 < len(sents) else dur
    cand = [a for a, b in pairs if abs(b - nxt) < 0.06 and a > s['start'] + 0.2]
    if not cand and i + 1 == len(sents):
        cand = [a for a, b in pairs if a > s['start'] + 0.2]
    if cand:
        new_end = round(cand[-1], 3)
        k = (new_end - s['start']) / max(0.01, s['end'] - s['start'])
        s['words'] = [[w, round(s['start'] + (t0 - s['start']) * k, 3), round(s['start'] + (t1 - s['start']) * k, 3)] for w, t0, t1 in s['words']]
        s['end'] = new_end

# never let a sentence end after the next one starts (short sentences with no detectable pause)
for i, s in enumerate(sents[:-1]):
    nxt = sents[i + 1]['start']
    if s['end'] > nxt - 0.03:
        new_end = round(nxt - 0.05, 3)
        k = (new_end - s['start']) / max(0.01, s['end'] - s['start'])
        s['words'] = [[w, round(s['start'] + (t0 - s['start']) * k, 3), round(s['start'] + (t1 - s['start']) * k, 3)] for w, t0, t1 in s['words']]
        s['end'] = new_end

fps = 30
for i, sc in enumerate(scenes):
    first = sents[sc['beats'][0]]
    prev_end = sents[sc['beats'][0] - 1]['end'] if sc['beats'][0] > 0 else 0.0
    sc['start'] = 0.0 if i == 0 else round((prev_end + first['start']) / 2, 3)  # cut in the middle of the pause
for i, sc in enumerate(scenes):
    sc['end'] = scenes[i + 1]['start'] if i + 1 < len(scenes) else None
TAIL = 3.5  # end card after the last word (music fade-out, gets the video past 8:00)
end = round(dur + TAIL, 3)
scenes[-1]['end'] = end
json.dump({'fps': fps, 'voiceDuration': dur, 'end': end, 'endFrame': int(round(end * fps)), 'sentences': sents, 'scenes': scenes},
          open(out, 'w'), indent=1)
print('sentences', len(sents), 'scenes', len(scenes), 'voice', dur, 'video', end)
