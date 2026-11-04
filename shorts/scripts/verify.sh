#!/usr/bin/env bash
# verify.sh file.mp4 : size, fps, frame count, audio present + length, picture still moving at the end
f="$1"
ffprobe -v error -select_streams v:0 -count_packets -show_entries stream=width,height,r_frame_rate,nb_read_packets,duration,codec_name,pix_fmt -of default=nw=1 "$f"
ffprobe -v error -select_streams a:0 -show_entries stream=codec_name,sample_rate,channels,duration -of default=nw=1 "$f"
ffprobe -v error -show_entries format=duration,size -of default=nw=1 "$f"
# last 0.5 s still moving? (mean abs diff between frames 0.5 s apart near the end)
ffmpeg -v error -sseof -0.6 -i "$f" -vf "select='eq(n,0)+eq(n,30)',scale=270:480,format=gray" -vsync 0 -f rawvideo - | python3 -c "
import sys, numpy as np
b = np.frombuffer(sys.stdin.buffer.read(), np.uint8)
n = 270*480
if len(b) >= 2*n: print('end-motion diff:', round(float(np.mean(np.abs(b[:n].astype(int)-b[n:2*n].astype(int)))),3))
else: print('could not read end frames')"
ffmpeg -v error -i "$f" -af volumedetect -f null - 2>&1 | grep -E 'max_volume|mean_volume'
