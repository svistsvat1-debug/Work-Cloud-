#!/usr/bin/env python3
"""Build script_voice.txt + script_scenes.md from a phase-a/scenes.json file.

Usage: python3 scenes_to_script.py <phase-a dir> [--wpm 155]

scenes.json: list of {block, vo, visual, sfx, mood, verify?: [str]}
Timings are ESTIMATES from word count (Kokoro am_puck ~150-160 wpm).
Real timings come in Phase B from faster-whisper on the recorded voice.
"""
import json
import re
import sys
from pathlib import Path


def words(text: str) -> int:
    return len(re.findall(r"[A-Za-z0-9'\-]+", text))


def fmt(sec: float) -> str:
    sec = int(round(sec))
    return f"{sec // 60}:{sec % 60:02d}"


def main() -> None:
    d = Path(sys.argv[1])
    wpm = float(sys.argv[sys.argv.index("--wpm") + 1]) if "--wpm" in sys.argv else 155.0
    scenes = json.loads((d / "scenes.json").read_text())

    total_words = 0
    t = 0.0
    md = ["# script_scenes.md", "",
          f"Timings are estimates at {wpm:.0f} wpm. Phase B replaces them with real timings from the voice file.", ""]
    voice = []
    warnings = []
    last_block = None
    for i, s in enumerate(scenes, 1):
        vo = s["vo"].strip()
        n = words(vo)
        dur = n / wpm * 60
        start, end = t, t + dur
        t = end
        total_words += n
        if s["block"] != last_block:
            md += [f"## {s['block']}", ""]
            last_block = s["block"]
        vo_md = vo
        for v in s.get("verify", []):
            vo_md += f" [VERIFY: {v}]"
        md += [f"[SCENE {i:02d} | ~{fmt(start)}–{fmt(end)}]",
               f'VO: "{vo_md}"',
               f"VISUAL: {s['visual']}",
               f"SFX: {s['sfx']}",
               f"MUSIC MOOD: {s['mood']}", ""]
        voice.append(vo)
        # checks
        if re.search(r"\band then\b", vo, re.I):
            warnings.append(f"scene {i}: contains 'and then'")
        for sent in re.split(r"(?<=[.?!])\s+", vo):
            if words(sent) > 20:
                warnings.append(f"scene {i}: sentence > 20 words: {sent[:60]}...")
        if re.search(r"[()\[\]0-9%$]", vo):
            warnings.append(f"scene {i}: digits/brackets/symbols in VO (TTS risk)")
        if dur > 25:
            warnings.append(f"scene {i}: {dur:.0f}s long (> 25s)")

    md.insert(3, f"Total: {len(scenes)} scenes, {total_words} words, est. {fmt(t)} at {wpm:.0f} wpm.\n")
    (d / "script_scenes.md").write_text("\n".join(md) + "\n")
    (d / "script_voice.txt").write_text("\n\n".join(voice) + "\n")
    print(f"scenes={len(scenes)} words={total_words} est={fmt(t)} @ {wpm:.0f}wpm "
          f"(150wpm: {fmt(total_words / 150 * 60)}, 160wpm: {fmt(total_words / 160 * 60)})")
    for w in warnings:
        print("WARN", w)


if __name__ == "__main__":
    main()
