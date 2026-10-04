#!/usr/bin/env python3
"""Final audio mix + exports.

Usage: python3 tools/finalize.py videos/01-ask-chatgpt studio/out/01-ask-chatgpt.mp4

Input render = video + (voice + SFX) from Remotion.
Writes <video>/final.mp4          voice + SFX + music (ducked under the voice)
       <video>/final-no-music.mp4 voice + SFX only (add a trending sound in-app)
Both: H.264 High, yuv420p (TV range), 30 fps, AAC 192k 48 kHz, -14 LUFS, faststart.
The Remotion render is a high-quality intermediate; video is encoded once here.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

TARGET = "I=-14:TP=-2:LRA=11"
MUSIC_BELOW_VOICE_DB = 10  # music bed level vs voice (before ducking)


def run(args):
    return subprocess.run(args, check=True, capture_output=True, text=True)


def mean_db(path):
    out = run(["ffmpeg", "-hide_banner", "-i", str(path), "-af", "volumedetect", "-f", "null", "-"]).stderr
    return float(re.search(r"mean_volume: (-?[\d.]+) dB", out).group(1))


def loudnorm_pass1(inputs, graph):
    out = run(["ffmpeg", "-hide_banner", *inputs, "-filter_complex", f"{graph};[mix]loudnorm={TARGET}:print_format=json[out]",
               "-map", "[out]", "-f", "null", "-"]).stderr
    return json.loads(out[out.rindex("{"):out.rindex("}") + 1])


def encode_video(render):
    """Full-range (yuvj) intermediate -> standard TV-range yuv420p H.264 for TikTok."""
    out = render.with_suffix(".video.mp4")
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(render), "-an",
         "-vf", "scale=in_range=full:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p",
         "-c:v", "libx264", "-preset", "slow", "-crf", "19", "-profile:v", "high", "-level", "4.2",
         "-r", "30", "-color_range", "tv", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
         str(out)])
    return out


def export(inputs, graph, video, dest):
    m = loudnorm_pass1(inputs, graph)
    ln = (f"loudnorm={TARGET}:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
          f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    v_idx = len(inputs) // 2
    run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", *inputs, "-i", str(video),
         "-filter_complex", f"{graph};[mix]{ln},aresample=48000[out]",
         "-map", f"{v_idx}:v", "-map", "[out]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-ar", "48000",
         "-movflags", "+faststart", "-shortest", str(dest)])
    print(f"  {dest.name}: in {m['input_i']} LUFS -> -14 LUFS")


def main(video_dir, render):
    video_dir, render = Path(video_dir), Path(render)
    voice, music = video_dir / "voice.wav", video_dir / "music.wav"
    fmt = "aformat=sample_rates=48000:channel_layouts=stereo"
    video = encode_video(render)

    export(["-i", str(render)], f"[0:a]{fmt}[mix]", video, video_dir / "final-no-music.mp4")

    gain = (mean_db(voice) - MUSIC_BELOW_VOICE_DB) - mean_db(music)
    graph = (
        f"[1:a]{fmt},volume={gain:.2f}dB[m];"
        f"[2:a]{fmt}[key];"
        "[m][key]sidechaincompress=threshold=0.015:ratio=5:attack=15:release=320[md];"
        f"[0:a]{fmt}[vs];"
        "[vs][md]amix=inputs=2:normalize=0[mix]"
    )
    export(["-i", str(render), "-i", str(music), "-i", str(voice)], graph, video, video_dir / "final.mp4")
    print(f"  music gain {gain:.1f} dB + sidechain ducking under voice")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
