#!/usr/bin/env bash
# Join the 4K segments (no re-encode) and add the mix as AAC -> final-4K.mp4
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SEG="$ROOT/studio/out/seg-eg03"
OUT="$ROOT/videos/whypeck-03-egypt-wet-sand/final-4K.mp4"
ls "$SEG"/[0-9][0-9].mp4 | sed "s/^/file '/; s/$/'/" > "$SEG/list.txt"
ffmpeg -v error -y -f concat -safe 0 -i "$SEG/list.txt" -i "$ROOT/studio/public/gen/eg03/mix.wav" \
  -map 0:v -map 1:a -c:v copy -c:a aac -b:a 320k -ar 48000 -shortest -movflags +faststart "$OUT"
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,nb_frames,duration -of compact "$OUT"
