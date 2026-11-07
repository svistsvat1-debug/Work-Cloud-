"""Word times for a known transcript: pocketsphinx forced alignment (offline, bundled en-us model).
usage: python3 -I tools/align.py voice_16k.wav "transcript words" out.json
"""
import json, sys, wave
from pocketsphinx import Decoder

wav, text, out = sys.argv[1], sys.argv[2], sys.argv[3]
with wave.open(wav) as w:
    assert w.getframerate() == 16000 and w.getnchannels() == 1
    data = w.readframes(w.getnframes())
d = Decoder(samprate=16000, bestpath=False, loglevel='ERROR')
words = text.lower().split()
for wd in words:
    if d.lookup_word(wd) is None:
        sys.exit(f'not in dictionary: {wd}')
d.set_align_text(' '.join(words))
d.start_utt(); d.process_raw(data, full_utt=True); d.end_utt()
d.set_alignment()
d.start_utt(); d.process_raw(data, full_utt=True); d.end_utt()
res = []
for seg in d.get_alignment():
    if seg.name in ('<sil>', '<s>', '</s>', '[NOISE]'):
        continue
    res.append({'w': seg.name, 'start': round(seg.start / 100, 2), 'end': round((seg.start + seg.duration) / 100, 2)})
json.dump(res, open(out, 'w'), indent=0)
for r in res:
    print(f"{r['start']:6.2f} {r['end']:6.2f} {r['w']}")
