#!/usr/bin/env bash
# One final encode (phone/YouTube-ready). usage: final_encode.sh <parts_dir> <mix.wav> <out.mp4>
set -euo pipefail
P="$1"; A="$2"; OUT="$3"
ls "$P"/part_*.mp4 | sort -t_ -k2 -n | sed "s#^#file '#; s#\$#'#" > "$P/concat.txt"
ffmpeg -hide_banner -y -f concat -safe 0 -i "$P/concat.txt" -i "$A" -map 0:v:0 -map 1:a:0 \
  -vf "scale=in_range=full:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p" \
  -c:v libx264 -profile:v high -level 4.2 -pix_fmt yuv420p -r 30 -crf 18 -preset slow -g 15 -bf 2 \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv \
  -c:a aac -b:a 320k -ar 48000 -ac 2 -movflags +faststart -tag:v avc1 "$OUT"
