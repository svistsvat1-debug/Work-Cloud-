"""Snap sentence boundaries to the real pauses in the voice file (ffmpeg silencedetect).

Usage: python3 tools/refine_silence.py <voice> <sentences.json>   (rewrites the json in place)
Whisper word times can be ~0.5 s off; the pauses between sentences are exact. For every boundary we pick
the silence interval closest to whisper's estimate (within 1.5 s) and set end_i = silence start,
start_{i+1} = silence end. Word times inside a sentence are rescaled to the new span.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

voice, sp = sys.argv[1], Path(sys.argv[2])
s = json.loads(sp.read_text())
r = subprocess.run(['ffmpeg', '-hide_banner', '-i', voice, '-af', 'silencedetect=noise=-40dB:d=0.18', '-f', 'null', '-'], capture_output=True, text=True).stderr
st = [float(x) for x in re.findall(r'silence_start: ([0-9.]+)', r)]
en = [float(x) for x in re.findall(r'silence_end: ([0-9.]+)', r)]
dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', voice], capture_output=True, text=True).stdout)
if len(en) < len(st):
    en.append(dur)
sil = list(zip(st, en))

new = [dict(x) for x in s]
# first start = end of leading silence
if sil and sil[0][0] < 0.05:
    new[0]['start'] = sil[0][1]
snapped = 0
used = set()
for i in range(len(s) - 1):
    est = (s[i]['end'] + s[i + 1]['start']) / 2
    cands = [(abs((a + b) / 2 - est), k, a, b) for k, (a, b) in enumerate(sil) if k not in used and abs((a + b) / 2 - est) < 1.5 and a > new[i]['start'] + 0.3]
    if cands:
        _, k, a, b = min(cands)
        used.add(k)
        new[i]['end'] = a
        new[i + 1]['start'] = b
        snapped += 1
# last end = start of trailing silence
tail = [a for a, b in sil if a > new[-1]['start'] + 0.3]
if tail:
    new[-1]['end'] = tail[-1] if tail[-1] > new[-1]['start'] else new[-1]['end']
# rescale words
for o, n in zip(s, new):
    a0, b0 = o['words'][0]['start'], o['words'][-1]['end']
    a1, b1 = n['start'], n['end']
    k = (b1 - a1) / max(0.05, b0 - a0)
    for w in n['words']:
        w['start'] = round(a1 + (w['start'] - a0) * k, 3)
        w['end'] = round(a1 + (w['end'] - a0) * k, 3)
    n['start'], n['end'] = round(a1, 3), round(b1, 3)
sp.write_text(json.dumps(new, indent=1))
print(f'snapped {snapped}/{len(s) - 1} boundaries to real pauses; speech {new[0]["start"]:.2f}-{new[-1]["end"]:.2f}s')
