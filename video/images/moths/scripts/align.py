# align.py in.mp3 out.json - pocketsphinx forced alignment of the known script (whisper models are blocked here)
import json, re, subprocess, sys
from pocketsphinx import Decoder
TEXT = """Moths aren't attracted to light.
The old explanation: they steer by the Moon, and lamps send them spiraling.
Wrong.
In twenty twenty four, scientists filmed them with high-speed cameras. They tilt their backs toward the brightest light.
Normally, that's the sky, so they know which way is up.
A nearby lamp throws that off. They circle it, climb until they stall, or flip over and crash.
They're not attracted. They're trapped.
What should I debunk next?"""
raw = subprocess.run(["ffmpeg", "-v", "quiet", "-i", sys.argv[1], "-ac", "1", "-ar", "16000", "-f", "s16le", "-"],
                     capture_output=True).stdout
words = re.sub(r"[^a-z' ]", " ", TEXT.lower().replace("-", " ")).split()
d = Decoder(samprate=16000, loglevel="ERROR")
if len(sys.argv) > 3:                      # free recognition to check what was actually said
    d.start_utt(); d.process_raw(raw, full_utt=True); d.end_utt(); print(d.hyp().hypstr); sys.exit()
missing = [w for w in words if d.lookup_word(w) is None]
print("not in dict:", missing)
d.set_align_text(" ".join(words))
d.start_utt(); d.process_raw(raw, full_utt=True); d.end_utt()
out = [{"w": s.word, "start": round(s.start_frame / 100, 2), "end": round((s.end_frame + 1) / 100, 2)}
       for s in d.seg() if s.word not in ("<s>", "</s>", "<sil>", "(NULL)")]
json.dump(out, open(sys.argv[2], "w"), indent=1)
for w in out: print(f'{w["start"]:6.2f} {w["end"]:6.2f}  {w["w"]}')
