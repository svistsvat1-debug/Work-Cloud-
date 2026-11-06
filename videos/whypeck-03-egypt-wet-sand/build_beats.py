#!/usr/bin/env python3
"""Word times (owner's ElevenLabs take, faster-whisper small.en + RMS pauses) -> beat table.

Usage: python3 videos/whypeck-03-egypt-wet-sand/build_beats.py
Reads  vo/words_raw.json   (made by faster-whisper, word_timestamps=True)
Writes studio/src/videos/eg03/beats.json (imported by the Remotion code and by mix.py)

Every visual beat is pinned to a spoken word: a new voice take = re-run Whisper -> this script -> re-render.
"""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE.parent.parent / "studio" / "src" / "videos" / "eg03" / "beats.json"
VO = 0.1      # voice starts at 0.1 s in the video
DUR = 25.5    # voice ends at ~25.16 s; ~0.35 s to settle back into frame 0 (loop)

W = json.loads((HERE / "vo" / "words_raw.json").read_text())
# Whisper splits "4,000-year-old" into 4 tokens and writes "100" -> 68 tokens for the 66-word script
EXPECT = ("A nearly 4 ,000 -year -old Egyptian tomb painting shows over 100 men dragging a giant statue. "
          "One man isn't pulling. He's pouring water. Maybe a ritual. But physicists tested it. "
          "Water cut the pole roughly in half. Not because wet sand is slippery. Too much water makes it worse. "
          "Just enough water glues the grains together so the sand doesn't pile up in front of the sledge.").split()
assert len(W) == len(EXPECT), (len(W), len(EXPECT))
for w, x in zip(W, EXPECT):
    assert w["w"].strip(".,").lower() == x.strip(".,").lower(), (w["w"], x)


def s(i):
    return round(W[i]["s"] + VO, 3)


def e(i):
    return round(W[i]["e"] + VO, 3)


T = {
    # ---- shot A: the tomb painting
    "nearly": s(1),
    "egyptian": s(6),
    "painting": s(8),          # painted figures blink awake
    "shows": s(9),             # camera glides left along the rows
    "hundred": s(11),
    "men": s(12),
    "dragging": s(13),         # heave, camera back to the statue
    "giant": s(15),            # statue opens its eyes
    "statue": s(16),           # smug look
    "pushMan": e(16) + 0.08,   # pause: push in on the water man
    "one": s(17),
    "isnt": s(19),             # neighbour turns and glares
    "pulling": s(20),
    "hes": s(21),
    "pouring": s(22),          # jar tilts, water flows
    "water1": s(23),
    "maybe": s(24),            # ritual pose
    "ritual": s(26),           # sparkles
    "cutLab": 11.3,            # inside the 11.04-11.58 pause
    # ---- shot B: the lab
    "but": s(27),
    "physicists": s(28),       # scientist pops in
    "tested": s(29),           # dry pull: strain, needle to the red
    "water2": s(31),           # the Egyptian's arm reaches in and pours
    "cut": s(32),              # needle drops
    "pull": s(34),
    "half": s(37),             # needle on the half mark, easy pull
    "not": s(38),              # finger wag
    "because": s(39),          # thought bubble
    "slippery": s(43),         # sled skates in the bubble
    "xStamp": e(43) + 0.06,
    "too": s(44),              # jar dumped: flood
    "much": s(45),
    "water3": s(46),
    "makes": s(47),
    "worse": s(49),            # needle back up, strain
    "cutBack": 19.78,          # inside the 19.54-20.02 pause
    # ---- shot C: back in the painting, the answer
    "just": s(50),             # careful thin pour
    "enough": s(51),
    "water4": s(52),
    "glues": s(53),            # magnifier lens pops in
    "the1": s(54),
    "grains": s(55),
    "together": s(56),         # water bridges complete
    "so": s(57),               # lens out
    "sand": s(59),
    "doesnt": s(60),           # ghost pile rises
    "pile": s(61),
    "up": s(62),
    "in": s(63),               # pull back to frame 0
    "front": s(64),
    "sledge": s(67),
    "voiceEnd": e(67),
}

T = {k: round(v, 3) for k, v in T.items()}
beats = {"voiceOffset": VO, "duration": DUR, "T": T,
         "words": [{"w": w["w"], "s": s(i), "e": e(i)} for i, w in enumerate(W)]}
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(beats, indent=1))
print(f"wrote {OUT} - {len(T)} beats, duration {DUR}s, voice ends {T['voiceEnd']}s")
