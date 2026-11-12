#!/usr/bin/env bash
# Resumable render: renders the composition in chunks (skips chunks already done), then concatenates
# losslessly. usage: tools/render_chunks.sh <compId> <total_frames> <chunk_frames> <out.mp4>
set -euo pipefail
COMP="$1"; TOTAL="$2"; STEP="$3"; OUT="$4"
D=build/chunks; mkdir -p $D; : > $D/list.txt
for ((a=0; a<TOTAL; a+=STEP)); do
  b=$((a+STEP-1)); [ $b -ge $TOTAL ] && b=$((TOTAL-1))
  f=$D/c_$(printf %06d $a).mp4
  if [ ! -f "$f.done" ]; then
    CONC=4 node tools/render.mjs "$COMP" "$f" $a $b
    touch "$f.done"
  fi
  echo "file '$(basename $f)'" >> $D/list.txt
done
ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i $D/list.txt -c copy "$OUT"
echo "CONCAT DONE $OUT"
