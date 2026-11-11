#!/usr/bin/env bash
# One-encode phone-ready master: H.264 High 4.2, yuv420p, 1080p30, CRF 18, AAC-LC 320k 48 kHz stereo, faststart.
# Usage: tools/master.sh picture.mp4 mix.wav out/video.mp4
set -euo pipefail
PIC="$1"; MIX="$2"; OUT="$3"
ffmpeg -hide_banner -y -i "$PIC" -i "$MIX" -map 0:v:0 -map 1:a:0 \
  -c:v libx264 -profile:v high -level 4.2 -pix_fmt yuv420p -r 30 -crf 18 -preset slow -g 15 -bf 2 \
  -c:a aac -b:a 320k -ar 48000 -ac 2 -movflags +faststart -tag:v avc1 "$OUT"
