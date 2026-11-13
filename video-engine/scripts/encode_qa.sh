#!/usr/bin/env bash
# One encode straight from the lossless PNG master + mixed audio, then ffprobe + PSNR/SSIM vs master.
# usage: scripts/encode_qa.sh <videoDir>
set -euo pipefail
V="$1"; F="$V/work/frames"; OUT="$V/final/video.mp4"
CM="scale=out_color_matrix=bt709:out_range=tv,format=yuv420p"
ffmpeg -v error -stats -y -framerate 30 -i "$F/element-%05d.png" -i "$V/work/mix.wav" \
  -vf "$CM" -c:v libx264 -profile:v high -level 4.2 -pix_fmt yuv420p -r 30 -crf 18 -preset slow -tune animation -g 15 -bf 2 \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
  -c:a aac -b:a 320k -ar 48000 -ac 2 -af apad -shortest -movflags +faststart -tag:v avc1 "$OUT"
SIZE=$(stat -c %s "$OUT"); echo "size_bytes=$SIZE ($(echo "scale=1; $SIZE/1048576" | bc) MB)"
if [ "$SIZE" -gt $((400*1024*1024)) ]; then echo "OVER 400 MB -> use 2-pass Encode B"; exit 2; fi
ffprobe -v error -show_entries stream=codec_name,profile,width,height,r_frame_rate,pix_fmt,sample_rate,channels,bit_rate:format=duration,bit_rate -of default=nw=1 "$OUT"
# faststart: moov must come before mdat
python3 - "$OUT" <<'PY'
import sys,struct
f=open(sys.argv[1],'rb'); order=[]
while True:
    h=f.read(8)
    if len(h)<8: break
    sz,typ=struct.unpack('>I4s',h); order.append(typ.decode())
    if sz==1: sz=struct.unpack('>Q',f.read(8))[0]; f.seek(sz-16,1)
    else: f.seek(sz-8,1)
print("atoms:", order, "faststart:", order.index('moov')<order.index('mdat'))
PY
ffmpeg -hide_banner -nostats -i "$OUT" -framerate 30 -i "$F/element-%05d.png" -lavfi \
  "[0:v]split[a1][a2];[1:v]$CM,split[r1][r2];[a1][r1]psnr=stats_file=/dev/null;[a2][r2]ssim=stats_file=/dev/null" -f null - 2>&1 | grep -E "PSNR|SSIM" || true
ffmpeg -nostats -i "$OUT" -map 0:a -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I:|Peak:)" | tail -2
