#!/usr/bin/env python3
"""Word times (ElevenLabs take, Whisper + RMS pauses) -> beat table for the animation.

Usage: python3 videos/whypeck-02-woodpecker-brain/build_beats.py
Reads  vo/words_raw.json
Writes studio/src/videos/wp02/beats.json  (imported by the Remotion code and by mix.py)

Every visual beat is pinned to a spoken word, so re-timing for a new voice take is:
re-run Whisper -> re-run this script -> re-render.
"""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
OUT = HERE.parent.parent / "studio" / "src" / "videos" / "wp02" / "beats.json"
VO = 0.1            # voice starts at 0.1 s
DUR = 26.5          # composition length (s); last frame loops to frame 0
PERIOD = 0.6        # peck burst cycle
HITS = [0.10, 0.20, 0.30]
PHASE0 = 0.70       # frame 0 sits on an impact: pecking began 0.70 s before frame 0

raw = json.loads((HERE / "vo" / "words_raw.json").read_text())
W = raw["words"]
EXPECT = ("A woodpecker bangs its head on trees all day and never gets knocked out. So its brain is fine, right? "
          "In 2018, scientists checked woodpecker brains kept in museums. They found clumps of a protein called tau. "
          "In football players, that kind of buildup is linked to brain damage from years of hits. "
          "Blackbirds, which don't peck, showed none. So is it damage or protection? Nobody's sure yet.").split()
assert len(W) == len(EXPECT), (len(W), len(EXPECT))


def s(i):  # word start, video time
    return round(W[i]["start"] + VO, 3)


def e(i):  # word end, video time
    return round(W[i]["end"] + VO, 3)


T = {
    # shot 1 - forest, pecking
    "pushSlow": s(7) - 0.1,       # "all day"
    "never": s(10),               # stop pecking
    "turnFront": s(10) + 0.16,    # head swap profile -> front
    "knocked": s(12),             # stars try to appear
    "out": s(13),                 # head shake, stars pop away
    "so1": s(14),                 # x-ray scan + push to head
    "brain1": s(16),
    "fine": s(18),                # sparkle
    "right": s(19),               # nod
    "doubt": e(19) + 0.12,        # brain's eyes slide sideways
    # shot 2 - museum
    "cutMuseum": s(20),
    "y2018": s(21),               # calendar flips
    "checked": s(23),             # magnifier slides in
    "wpBrains": s(24),            # jar brain opens eyes
    "museums": s(28),             # other jar brains open eyes
    "lensZoom": e(28) + 0.25,     # dolly into the lens (pause)
    "found": s(30),
    "clumps": s(31),              # clumps pop on
    "protein": s(34),
    "tau": s(36),                 # gulp
    # shot 3 - football
    "cutFootball": s(37),
    "football": s(38),            # helmet starts to fall
    "players": s(39),             # helmet lands
    "buildup": s(43),             # worried + sweat
    "damage1": s(48),             # dizzy
    "hit1": s(50), "hit2": s(51), "hit3": s(52),   # "years" "of" "hits"
    # shot 4 - blackbird
    "cutBird": e(52) + 0.32,      # cut in the pause, bird flies in
    "blackbirds": s(53),          # bird lands
    "dontPeck": s(55),            # head shake "no"
    "showed": s(57),              # x-ray scan on both
    "none": s(58),                # sparkles on the clean brain
    "pushBrain": e(58) + 0.12,    # push to woodpecker brain, bird leaves
    # shot 5 - damage or protection
    "damage2": s(62),
    "protection": s(64),
    # shot 6 - shrug and loop
    "pullBack": e(64) + 0.22,
    "nobody": s(65),
    "sure": s(66),
    "yet": s(67),
    "turnBack": e(67) + 0.06,
    "peck2": round(DUR - PHASE0, 3),
    "end": DUR,
}
T = {k: round(v, 3) for k, v in T.items()}


def impacts(start, stop):
    out, c = [], 0
    while True:
        base = start + c * PERIOD
        if base > stop:
            break
        for j, h in enumerate(HITS):
            t = base + h
            if t <= stop:
                out.append({"t": round(t, 3), "c": c, "j": j, "start": round(start, 3)})
        c += 1
    return out


pecks = impacts(-PHASE0, T["never"] - 0.06) + impacts(T["peck2"], DUR + 0.001)

beats = {
    "voiceOffset": VO,
    "duration": DUR,
    "voiceDur": raw["duration"],
    "period": PERIOD,
    "hits": HITS,
    "phase0": PHASE0,
    "T": T,
    "pecks": pecks,
    "pecking": [[-PHASE0, T["never"]], [T["peck2"], DUR + 1]],
    "words": [{"text": EXPECT[i], "start": s(i), "end": e(i)} for i in range(len(W))],
}
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(beats, indent=1))
print(f"wrote {OUT}  ({len(T)} beats, {len(pecks)} pecks)")
for k, v in T.items():
    print(f"  {k:12s} {v:6.2f}")
