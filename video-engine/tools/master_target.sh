#!/usr/bin/env bash
# Final master in ONE (two-pass) encode to a target size, same phone-ready format as master.sh.
# usage: tools/master_target.sh <picture.mp4> <mix.wav> <out.mp4> <video_kbps>
set -euo pipefail
PIC="$1"; MIX="$2"; OUT="$3"; VB="$4"
LOG="$(dirname "$OUT")/x264_2pass"
COMMON=(-c:v libx264 -profile:v high -level 4.2 -pix_fmt yuv420p -r 30 -b:v ${VB}k -maxrate $((VB*3/2))k -bufsize $((VB*2))k -preset slow -g 15 -bf 2 -passlogfile "$LOG")
ffmpeg -hide_banner -loglevel warning -y -i "$PIC" -map 0:v:0 "${COMMON[@]}" -pass 1 -an -f mp4 /dev/null
ffmpeg -hide_banner -loglevel warning -y -i "$PIC" -i "$MIX" -map 0:v:0 -map 1:a:0 "${COMMON[@]}" -pass 2 \
  -c:a aac -b:a 320k -ar 48000 -ac 2 -movflags +faststart -tag:v avc1 -shortest "$OUT"
rm -f "$LOG"*
ls -la "$OUT"
