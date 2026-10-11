#!/usr/bin/env python3
"""Final assembly: picture + ambience (+ voice-over) + burned-in subtitles.

Subtitles are re-flowed for comfortable reading (max 2 lines, ~42 chars per line,
minimum on-screen time) and styled with Montserrat SemiBold, a bit larger than usual,
with a soft outline + shadow so they stay readable over headlights and the dark dash.

Usage:
  python3 finalize.py --video pic.mp4 --ambience amb.wav [--voice voice.wav] [--srt subs.srt]
                      [--font-size 62] --out final.mp4
"""
import argparse
import re
import subprocess
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
FONTS = HERE / "fonts"

MAX_LINE = 42
MIN_DUR = 1.2      # seconds a cue stays on screen at least
GAP = 0.08         # gap kept between cues
CPS = 17           # comfortable reading speed, characters per second


def parse_time(s):
    h, m, rest = s.strip().replace(".", ",").split(":")
    sec, ms = rest.split(",")
    return int(h) * 3600 + int(m) * 60 + int(sec) + int(ms) / 1000


def parse_srt(text):
    cues = []
    for block in re.split(r"\n\s*\n", text.strip().replace("\r", "")):
        lines = [l for l in block.split("\n") if l.strip()]
        if len(lines) < 2:
            continue
        i = 1 if "-->" in lines[1] else 0
        a, b = lines[i].split("-->")
        body = " ".join(l.strip() for l in lines[i + 1:])
        body = re.sub(r"<[^>]+>", "", body)
        cues.append([parse_time(a), parse_time(b), body])
    return cues


def wrap(text, max_line=MAX_LINE):
    """Split into at most two balanced lines, breaking after punctuation when possible."""
    words = text.split()
    if len(text) <= max_line:
        return [text]
    best, best_score = None, 1e9
    for i in range(1, len(words)):
        l1, l2 = " ".join(words[:i]), " ".join(words[i:])
        score = abs(len(l1) - len(l2)) + max(0, len(l1) - max_line) * 10 + max(0, len(l2) - max_line) * 10
        if re.search(r"[,.;:!?—–-]$", words[i - 1]):
            score -= 6
        if l1.split()[-1].lower() in {"і", "й", "та", "в", "у", "з", "на", "до", "the", "a", "an", "and", "of", "to", "in"}:
            score += 8  # don't leave a short function word dangling at the line end
        if score < best_score:
            best, best_score = [l1, l2], score
    return best


def split_long(cues, max_line=MAX_LINE):
    """Cues that won't fit in two lines are split at sentence/clause boundaries, time shared by length."""
    out = []
    for a, b, text in cues:
        if len(text) <= max_line * 2:
            out.append([a, b, text])
            continue
        parts = re.split(r"(?<=[.!?…;:,])\s+", text)
        chunks, cur = [], ""
        for p in parts:
            if cur and len(cur) + 1 + len(p) > max_line * 2:
                chunks.append(cur)
                cur = p
            else:
                cur = (cur + " " + p).strip()
        if cur:
            chunks.append(cur)
        final = []
        for c in chunks:  # still too long: split by words
            while len(c) > max_line * 2:
                cut = c.rfind(" ", 0, max_line * 2)
                final.append(c[:cut])
                c = c[cut + 1:]
            final.append(c)
        total = sum(len(c) for c in final)
        t = a
        for c in final:
            d = (b - a) * len(c) / total
            out.append([t, t + d, c])
            t += d
    return out


def fix_timing(cues):
    for i, c in enumerate(cues):
        want = max(MIN_DUR, len(c[2]) / CPS)
        nxt = cues[i + 1][0] - GAP if i + 1 < len(cues) else c[1] + 3
        if c[1] - c[0] < want:
            c[1] = min(c[0] + want, max(nxt, c[1]))
        if i + 1 < len(cues) and c[1] > cues[i + 1][0] - GAP:
            c[1] = max(c[0] + 0.3, cues[i + 1][0] - GAP)
    return cues


def ass_time(t):
    t = max(0, t)
    h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
    return f"{h}:{m:02d}:{s:05.2f}"


def to_ass(cues, size):
    head = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Main,Montserrat SemiBold,{size},&H00F0F4F6,&H00F0F4F6,&H50000000,&H8C000000,0,0,0,0,100,100,0.6,0,1,2.6,2.2,2,160,160,78,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    ev = []
    for a, b, text in cues:
        lines = wrap(text)
        body = r"\N".join(l.replace("{", "(").replace("}", ")") for l in lines)
        ev.append(f"Dialogue: 0,{ass_time(a)},{ass_time(b)},Main,,0,0,0,,{{\\fad(140,140)\\blur0.6}}{body}")
    return head + "\n".join(ev) + "\n"


def run(cmd):
    print(" ".join(str(c) for c in cmd))
    subprocess.run([str(c) for c in cmd], check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--video", required=True)
    ap.add_argument("--ambience", required=True)
    ap.add_argument("--voice")
    ap.add_argument("--srt")
    ap.add_argument("--font-size", type=int, default=62)
    ap.add_argument("--out", required=True)
    ap.add_argument("--ass-out", help="also save the styled .ass next to the video")
    a = ap.parse_args()

    tmp = Path(tempfile.mkdtemp())
    vf = []
    if a.srt:
        cues = fix_timing(split_long(parse_srt(Path(a.srt).read_text(encoding="utf-8-sig"))))
        ass = tmp / "subs.ass"
        ass.write_text(to_ass(cues, a.font_size), encoding="utf-8")
        if a.ass_out:
            Path(a.ass_out).write_text(ass.read_text(encoding="utf-8"), encoding="utf-8")
        vf = ["-vf", f"subtitles={ass}:fontsdir={FONTS}"]

    if a.voice:
        # duck the ambience under the voice, then normalise for YouTube (-14 LUFS)
        fc = ("[1:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=0.55[amb];"
              "[2:a]aformat=sample_rates=48000:channel_layouts=stereo,asplit=2[v1][v2];"
              "[amb][v1]sidechaincompress=threshold=0.03:ratio=5:attack=40:release=700:makeup=1[ambd];"
              "[ambd][v2]amix=inputs=2:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[aout]")
        inputs = ["-i", a.video, "-i", a.ambience, "-i", a.voice]
    else:
        fc = "[1:a]loudnorm=I=-18:TP=-1.5:LRA=11[aout]"
        inputs = ["-i", a.video, "-i", a.ambience]
    run(["ffmpeg", "-y", "-loglevel", "error", *inputs, "-filter_complex", fc, "-map", "0:v", "-map", "[aout]",
         *vf, *(["-c:v", "libx264", "-preset", "slow", "-crf", "17", "-tune", "grain", "-pix_fmt", "yuv420p"] if vf else ["-c:v", "copy"]),
         "-c:a", "aac", "-b:a", "256k", "-ar", "48000", "-shortest", "-movflags", "+faststart", a.out])


if __name__ == "__main__":
    main()
