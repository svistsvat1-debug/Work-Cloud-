"""Word timings from the user's voice file (local faster-whisper, CPU, free) aligned to the script sentences.

Usage: python3 tools/align.py <voice.wav|mp3> <script_scenes.md> <out_sentences.json> [--model small.en]

Output: [{"i": 0, "start": 0.42, "end": 5.1, "text": "...", "words": [{"w": "In", "start": .., "end": ..}, ...]}, ...]
The SCRIPT text is the source of truth for words; whisper only provides the times.
Script words are matched to recognized words with difflib; unmatched words get interpolated times.
"""
import json
import re
import sys
from difflib import SequenceMatcher
from pathlib import Path

args = sys.argv[1:]
voice, scenes_md, out = Path(args[0]), Path(args[1]), Path(args[2])
model_name = args[args.index('--model') + 1] if '--model' in args else 'small.en'

sentences = []
for line in scenes_md.read_text(encoding='utf8').splitlines():
    m = re.match(r'^S\d+ VO: "(.*)"$', line)
    if m:
        sentences.append(m.group(1))

NUM = {'0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four', '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine'}


def norm(w: str) -> str:
    w = w.lower().replace('’', "'")
    w = re.sub(r"[^a-z0-9']", '', w)
    return w


# ---- recognize ----
cache = out.with_suffix('.words.json')
if cache.exists():
    rec = json.loads(cache.read_text())
else:
    from faster_whisper import WhisperModel

    import subprocess
    import numpy as np

    # decode with ffmpeg (avoids PyAV version issues): 16 kHz mono float32
    pcm = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', str(voice), '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    audio = np.frombuffer(pcm, np.float32)
    model = WhisperModel(model_name, device='cpu', compute_type='int8')
    segs, info = model.transcribe(audio, word_timestamps=True, language='en', beam_size=5, vad_filter=False,
                                  initial_prompt=' '.join(sentences[:3]))
    rec = []
    for s in segs:
        for w in s.words or []:
            rec.append({'w': w.word.strip(), 'start': w.start, 'end': w.end})
    cache.write_text(json.dumps(rec))
    print('recognized words:', len(rec), 'duration', info.duration)

# ---- align script words to recognized words ----
script_words = []  # (sentence index, word)
for i, s in enumerate(sentences):
    for w in s.split():
        script_words.append((i, w))
A = [norm(w) for _, w in script_words]
# whisper may split numbers ("1950") etc.; we keep tokens as they are
B = [norm(r['w']) for r in rec]
sm = SequenceMatcher(a=A, b=B, autojunk=False)
times = [None] * len(A)
for blk in sm.get_matching_blocks():
    for k in range(blk.size):
        r = rec[blk.b + k]
        times[blk.a + k] = (r['start'], r['end'])
# fuzzy pass on replaced spans of equal length (e.g. "fifty-four" vs "54")
for tag, a0, a1, b0, b1 in sm.get_opcodes():
    if tag == 'replace':
        for k in range(a1 - a0):
            if times[a0 + k] is None:
                bb = b0 + int(k * (b1 - b0) / max(1, a1 - a0))
                if bb < b1:
                    times[a0 + k] = (rec[bb]['start'], rec[bb]['end'])
matched = sum(t is not None for t in times)
# interpolate gaps
known = [k for k, t in enumerate(times) if t is not None]
if not known:
    sys.exit('alignment failed: no words matched')
for k in range(len(times)):
    if times[k] is None:
        prev = max([j for j in known if j < k], default=None)
        nxt = min([j for j in known if j > k], default=None)
        if prev is None:
            times[k] = (times[nxt][0] - 0.3 * (nxt - k), times[nxt][0] - 0.3 * (nxt - k) + 0.25)
        elif nxt is None:
            times[k] = (times[prev][1] + 0.3 * (k - prev - 1), times[prev][1] + 0.3 * (k - prev))
        else:
            a, b = times[prev][1], times[nxt][0]
            f0 = (k - prev) / (nxt - prev)
            f1 = (k - prev + 1) / (nxt - prev)
            times[k] = (a + (b - a) * f0 * 0.98, a + (b - a) * f1 * 0.98)

res = []
for i, s in enumerate(sentences):
    idx = [k for k, (si, _) in enumerate(script_words) if si == i]
    words = [{'w': script_words[k][1], 'start': round(times[k][0], 3), 'end': round(times[k][1], 3)} for k in idx]
    res.append({'i': i, 'start': words[0]['start'], 'end': words[-1]['end'], 'text': s, 'words': words})
# keep monotonic
for i in range(1, len(res)):
    if res[i]['start'] < res[i - 1]['end']:
        res[i]['start'] = res[i - 1]['end'] + 0.01
out.write_text(json.dumps(res, indent=1))
print(f'aligned {len(sentences)} sentences; matched {matched}/{len(A)} words ({100 * matched / len(A):.1f}%); voice ends {res[-1]["end"]:.1f}s')
