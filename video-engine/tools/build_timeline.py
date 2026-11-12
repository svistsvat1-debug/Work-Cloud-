"""Build the Remotion timeline from script_scenes.md + sentence timings.

Usage:
  python3 tools/build_timeline.py <script_scenes.md> <out_timeline.json> [--timings sentences.json] [--fps 30]

Without --timings, sentence times are estimated (155 wpm + 0.35 s pause) for previews.
With --timings (output of tools/align.py: [{"i":0,"start":s,"end":s,"text":...}, ...]) the real voice
timings are used. A new shot starts in the middle of the pause before its sentence.
Scenes marked "-> FADE THROUGH BLACK" fade out/in over ~0.7 s total.
Also writes <out>.cues.json: scene starts + music moods + per-shot SFX notes (for the mixer).
"""
import json
import re
import sys
from pathlib import Path

args = sys.argv[1:]
scenes_md, out = Path(args[0]), Path(args[1])
timings = None
fps = 30
if '--timings' in args:
    timings = json.loads(Path(args[args.index('--timings') + 1]).read_text())
if '--fps' in args:
    fps = int(args[args.index('--fps') + 1])

scenes = []
cur = None
for line in scenes_md.read_text(encoding='utf8').splitlines():
    m = re.match(r'^\[(.+?)\|(.+?)\|.*?PALETTE:(.+?)\|\s*MUSIC MOOD:\s*(\w+)\]', line)
    if m:
        cur = {'label': m.group(1).strip(), 'title': m.group(2).strip(), 'mood': m.group(4).strip(), 'shots': [], 'fade': False}
        scenes.append(cur)
        continue
    m = re.match(r'^S(\d+) VO: "(.*)"$', line)
    if m and cur is not None:
        cur['shots'].append({'text': m.group(2), 'sfx': None})
        continue
    m = re.match(r'^\s+SFX: (.*)$', line)
    if m and cur is not None and cur['shots']:
        cur['shots'][-1]['sfx'] = m.group(1).strip()
        continue
    if line.startswith('-> FADE THROUGH BLACK') and cur is not None:
        cur['fade'] = True

sentences = [s for sc in scenes for s in sc['shots']]
n = len(sentences)

if timings is None:
    t = 0.6
    timings = []
    for i, s in enumerate(sentences):
        d = len(s['text'].split()) / 155 * 60
        timings.append({'i': i, 'start': t, 'end': t + d, 'text': s['text']})
        t += d + 0.35
        # extra breath at quest boundaries
    total_audio = t + 1.0
else:
    assert len(timings) == n, f'timings {len(timings)} != sentences {n}'
    total_audio = timings[-1]['end'] + 1.0

# shot boundaries: middle of the gap before each sentence
bounds = [0.0]
for i in range(1, n):
    gap_mid = (timings[i - 1]['end'] + timings[i]['start']) / 2
    bounds.append(gap_mid)
end_time = total_audio + 1.5  # tail on the last shot
bounds.append(end_time)

shots = []
cues = {'scenes': [], 'shots': []}
k = 0
for si, sc in enumerate(scenes, start=1):
    first = k
    for j, s in enumerate(sc['shots'], start=1):
        a = round(bounds[k] * fps)
        b = round(bounds[k + 1] * fps)
        shots.append({'id': f'{si:02d}_{j}', 'from': a, 'dur': max(1, b - a)})
        cues['shots'].append({'id': f'{si:02d}_{j}', 'start': bounds[k], 'end': bounds[k + 1], 'voStart': timings[k]['start'], 'voEnd': timings[k]['end'], 'sfx': s['sfx'], 'text': s['text']})
        k += 1
    cues['scenes'].append({'scene': si, 'label': sc['label'], 'title': sc['title'], 'mood': sc['mood'], 'start': bounds[first], 'end': bounds[k], 'fade': sc['fade']})
    if sc['fade']:
        shots[-1]['fadeOut'] = round(0.35 * fps)
        if si < len(scenes):
            pass

# fade-in on the first shot after a faded scene
idx = 0
for si, sc in enumerate(scenes):
    idx += len(sc['shots'])
    if sc['fade'] and idx < len(shots):
        shots[idx]['fadeIn'] = round(0.35 * fps)
# soft fade in at the very start and out at the very end
shots[0]['fadeIn'] = round(0.5 * fps)
shots[-1]['fadeOut'] = round(1.5 * fps)

total = shots[-1]['from'] + shots[-1]['dur']
out.write_text(json.dumps({'fps': fps, 'total': total, 'shots': shots}, indent=1))
Path(str(out).replace('.json', '.cues.json')).write_text(json.dumps(cues, indent=1))
print(f'{len(shots)} shots, {total} frames = {total / fps / 60:.2f} min')
