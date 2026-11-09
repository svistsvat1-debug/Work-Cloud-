#!/usr/bin/env bash
# Loudness-normalise the rendered mix (two-pass loudnorm, -15 LUFS, -1.5 dBTP) and remux without re-encoding video.
# usage: scripts/finalize.sh out/the-egg-4K-raw.mp4 out/the-egg-4K.mp4
set -euo pipefail
in="$1"; out="$2"
m=$(ffmpeg -hide_banner -i "$in" -af loudnorm=I=-15:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/^{/,/^}/p')
get() { echo "$m" | python3 -c "import json,sys; print(json.load(sys.stdin)['$1'])"; }
ffmpeg -v error -y -i "$in" -c:v copy \
  -af "loudnorm=I=-15:TP=-1.5:LRA=11:measured_I=$(get input_i):measured_TP=$(get input_tp):measured_LRA=$(get input_lra):measured_thresh=$(get input_thresh):offset=$(get target_offset):linear=true,aresample=48000" \
  -c:a aac -b:a 320k -movflags +faststart "$out"
ffmpeg -hide_banner -i "$out" -af loudnorm=print_format=summary -f null - 2>&1 | grep -E "Input Integrated|Input True Peak"
