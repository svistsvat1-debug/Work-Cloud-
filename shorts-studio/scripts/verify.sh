#!/bin/bash
# verify a rendered short: size, fps, frame count, audio, last frames still moving
f="$1"
ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,nb_frames,pix_fmt,codec_name -show_entries format=duration,size -of default=nw=1 "$f"
ffprobe -v error -select_streams a:0 -show_entries stream=codec_name,sample_rate,channels,duration -of default=nw=1 "$f"
ffmpeg -hide_banner -i "$f" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|LRA|Peak):" | tail -3
# motion in the last 0.5 s (mean abs diff between frames)
ffmpeg -loglevel error -sseof -0.6 -i "$f" -vf "scale=270:480,format=gray" -f rawvideo - | python3 -c "
import sys, numpy as np
b = np.frombuffer(sys.stdin.buffer.read(), np.uint8).reshape(-1, 480, 270).astype(float)
d = np.abs(np.diff(b, axis=0)).mean((1, 2)); print('last frames motion (mean diff):', d.round(3)[-8:])"
