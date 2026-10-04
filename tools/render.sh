#!/usr/bin/env bash
# Full pipeline for one video: TTS -> music -> Remotion render -> mix/exports.
# Usage: tools/render.sh 01-ask-chatgpt v01-ask-chatgpt [--skip-tts]
set -euo pipefail
cd "$(dirname "$0")/.."
ID="$1"; COMP="$2"; SKIP_TTS="${3:-}"
DIR="videos/$ID"

[ "$SKIP_TTS" = "--skip-tts" ] || python3 tools/tts_kokoro.py "$DIR"
[ -f studio/public/sfx/whoosh.wav ] || python3 tools/sfx.py
python3 tools/music.py "$DIR"

mkdir -p "studio/public/gen/$ID" studio/out
cp "$DIR/voice.wav" "studio/public/gen/$ID/voice.wav"
(cd studio && npx remotion render src/index.ts "$COMP" "out/$ID.mp4" --log=error)

python3 tools/finalize.py "$DIR" "studio/out/$ID.mp4"
ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,sample_rate -show_entries format=duration -of compact "$DIR/final.mp4"
