#!/bin/bash
# verify.sh file.mp4 - size, fps, frame count, audio duration, freeze at the end
F="$1"; FP=node_modules/@remotion/compositor-linux-x64-gnu/ffprobe; FF=node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg
$FP -v error -show_entries stream=codec_type,codec_name,width,height,r_frame_rate,nb_frames,duration,pix_fmt,sample_rate,channels -of compact "$F"
$FP -v error -show_entries format=duration,size,bit_rate -of compact "$F"
echo "-- audio loudness (max / mean volume):"; $FF -v info -i "$F" -vn -af volumedetect -f null - 2>&1 | grep -E "max_volume|mean_volume"
echo "-- freezes >= 0.5 s:"; $FF -v info -i "$F" -vf "scale=270:480,freezedetect=n=0.001:d=0.5" -an -f null - 2>&1 | grep -E "freeze_(start|end|duration)" || echo "none"
