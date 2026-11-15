#!/bin/bash
# One encode from the lossless PNG master + mixed audio -> phone-ready H.264 (Encode A, CRF 18), with size cap fallback (Encode B, 2-pass).
# usage: encode_final.sh <master_png_dir> <mix.wav> <out.mp4>
set -e
M=$1; A=$2; O=$3
VF="scale=out_color_matrix=bt709:out_range=tv,format=yuv420p"
COMMON="-c:v libx264 -profile:v high -level 4.2 -pix_fmt yuv420p -r 30 -preset slow -tune animation -g 15 -bf 2 -colorspace bt709 -color_primaries bt709 -color_trc bt709 -c:a aac -b:a 320k -ar 48000 -ac 2 -movflags +faststart -tag:v avc1"
ffmpeg -y -hide_banner -loglevel error -framerate 30 -i "$M/element-%05d.png" -i "$A" -vf "$VF" $COMMON -crf 18 -shortest "$O"
SIZE=$(stat -c %s "$O")
if [ "$SIZE" -gt $((400*1024*1024)) ]; then
  DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$O")
  KB=$(python3 -c "print(int(390*8*1024/$DUR - 320))")
  echo "Encode A too big ($SIZE), Encode B at ${KB}k"
  ffmpeg -y -hide_banner -loglevel error -framerate 30 -i "$M/element-%05d.png" -vf "$VF" $COMMON -b:v ${KB}k -pass 1 -an -f mp4 /dev/null
  ffmpeg -y -hide_banner -loglevel error -framerate 30 -i "$M/element-%05d.png" -i "$A" -vf "$VF" $COMMON -b:v ${KB}k -pass 2 -shortest "$O"
fi
ls -la "$O"
