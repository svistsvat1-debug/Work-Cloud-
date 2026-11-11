#!/usr/bin/env python3
"""Automatic QA for a rendered video.

Usage: qa_video.py <video_dir>
Checks: duration, codec/format, longest static stretch (freezedetect on a blurred
downscale so the hand-drawn "boil" jitter does not count as motion), loudness of the
final mixes, caption rules. Exports 5 random spot-check frames at keyword timestamps.
Writes work/qa_report.json
"""
import json
import random
import re
import subprocess
import sys
from pathlib import Path


def run(cmd):
    return subprocess.run(cmd, capture_output=True, text=True)


def main():
    vdir = Path(sys.argv[1])
    final, work = vdir / "final", vdir / "work"
    rep = {}
    probe = json.loads(run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(final / "video.mp4")]).stdout)
    v = [s for s in probe["streams"] if s["codec_type"] == "video"][0]
    a = [s for s in probe["streams"] if s["codec_type"] == "audio"][0]
    dur = float(probe["format"]["duration"])
    rep["duration_s"] = round(dur, 2)
    rep["duration_ok_8_15min"] = 480 <= dur <= 900
    rep["video"] = f'{v["codec_name"]} {v["width"]}x{v["height"]} {v["pix_fmt"]} {v["r_frame_rate"]}'
    rep["audio"] = f'{a["codec_name"]} {a["sample_rate"]} Hz {a.get("channels")}ch'
    rep["subtitle_streams_in_mp4"] = len([s for s in probe["streams"] if s["codec_type"] == "subtitle"])

    # static frames: freezedetect on blurred 240x135 copy, threshold tuned so only real stillness counts
    fd = run(["ffmpeg", "-v", "info", "-i", str(work / "video_silent.mp4"), "-vf",
              "scale=240:135,gblur=sigma=2,freezedetect=n=0.002:d=6", "-map", "0:v", "-f", "null", "-"]).stderr
    freezes = [(float(s), float(d)) for s, d in re.findall(r"freeze_start: ([\d.]+).*?freeze_duration: ([\d.]+)", fd, re.S)]
    starts = re.findall(r"freeze_start: ([\d.]+)", fd)
    durs = re.findall(r"freeze_duration: ([\d.]+)", fd)
    rep["static_over_6s"] = [{"start": float(s), "dur": float(d)} for s, d in zip(starts, durs)]
    # an open freeze at the very end (outro tail) is reported separately
    rep["static_open_at_end"] = len(starts) > len(durs)

    # loudness of the deliverables
    for name in ("video.mp4", "video_nomusic.mp4"):
        o = run(["ffmpeg", "-v", "info", "-i", str(final / name), "-af", "ebur128=peak=true", "-f", "null", "-"]).stderr
        m = re.search(r"Integrated loudness:\s+I:\s+([-\d.]+) LUFS.*?True peak:\s+Peak:\s+([-\d.]+) dBFS", o, re.S)
        rep[f"loudness_{name}"] = {"I_LUFS": float(m.group(1)), "TP_dBFS": float(m.group(2))} if m else "n/a"

    # captions
    srt = (final / "captions.srt").read_text().strip().split("\n\n")
    bad = 0
    def ts(x):
        return int(x[:2]) * 3600 + int(x[3:5]) * 60 + int(x[6:8]) + int(x[9:]) / 1000
    for b in srt:
        l = b.split("\n")
        s, e = l[1].split(" --> ")
        d = ts(e) - ts(s)
        if len(l) - 2 > 2 or any(len(x) > 42 for x in l[2:]) or d < 0.99 or d > 6.0:
            bad += 1
    rep["captions"] = {"cues": len(srt), "rule_violations": bad}

    # spot check: 5 random scenes, frame 0.9 s after a content word
    tl = json.loads((work / "timeline.json").read_text())
    random.seed(11)
    picks = random.sample(tl["scenes"], 5)
    out = work / "spotcheck"
    out.mkdir(exist_ok=True)
    spots = []
    stop = {"the", "a", "and", "of", "to", "in", "it", "is", "was", "that", "on", "for", "by", "but", "so", "his", "he", "they", "were", "had", "at", "an", "this", "their", "them", "be", "as", "with"}
    for sc in sorted(picks, key=lambda s: s["i"]):
        cands = [w for w in sc["words"] if w["w"] not in stop and len(w["w"]) > 3]
        w = random.choice(cands)
        t = w["s"] + 0.9
        png = out / f"scene{sc['i']:02d}_{w['w']}_{t:.2f}s.png"
        run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.3f}", "-i", str(final / "video.mp4"), "-frames:v", "1", str(png)])
        spots.append({"scene": sc["i"], "word": w["w"], "t": round(t, 2), "file": png.name})
    rep["spotcheck"] = spots
    (work / "qa_report.json").write_text(json.dumps(rep, indent=1))
    print(json.dumps(rep, indent=1))


if __name__ == "__main__":
    main()
