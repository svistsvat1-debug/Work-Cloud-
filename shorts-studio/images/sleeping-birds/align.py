# forced alignment of the voice-over with pocketsphinx; writes work/words.json
import json, wave
from pocketsphinx import Decoder
text = ("it's fast asleep so why doesn't it fall the classic answer its leg tendons run behind the joint "
        "into the toes and crouching pulls them shut and that backward knee it's actually the ankle "
        "many songbirds have tiny ridges that lock those tendons like a zip tie standing up unlocks them "
        "but starlings with those tendons cut still slept on their perch so balance does a lot of the work")
w = wave.open('work/vo16.wav', 'rb'); data = w.readframes(w.getnframes())
d = Decoder(samprate=16000, bestpath=False)
extra = {'unlocks': 'AH N L AA K S', 'songbirds': 'S AO NG B ER D Z', 'starlings': 'S T AA R L IH NG Z',
         'crouching': 'K R AW CH IH NG', 'tendons': 'T EH N D AH N Z', 'backward': 'B AE K W ER D'}
for wd, ph in extra.items():
    if d.lookup_word(wd) is None:
        d.add_word(wd, ph, True)
d.set_align_text(text)
d.start_utt(); d.process_raw(data, full_utt=True); d.end_utt()
out = []
print('hyp:', d.hyp().hypstr if d.hyp() else None)
for seg in d.seg():
    if seg.word in ('<sil>', '(NULL)', '<s>', '</s>'): continue
    out.append({'w': seg.word, 's': round(seg.start_frame / 100, 3), 'e': round((seg.end_frame + 1) / 100, 3)})
json.dump(out, open('work/words.json', 'w'), indent=0)
for o in out: print(f"{o['s']:6.2f} {o['e']:6.2f} {o['w']}")
