#!/usr/bin/env bash
# YouTube 16:9: looped background + voice + word-highlighted subtitles.
# usage: render.sh <background.mp4> <voice.mp3> <script.txt> <out_dir>
# needs: ffmpeg, pip install sherpa-onnx numpy,
#        models from https://github.com/k2-fsa/sherpa-onnx/releases/tag/asr-models:
#        sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8 (unpacked) + silero_vad.onnx in $MODELS
set -euo pipefail
BG=$1 VOICE=$2 SCRIPT=$3 OUT=$4
MODELS=${MODELS:-$HOME/models}
HERE=$(cd "$(dirname "$0")" && pwd)
mkdir -p "$OUT"

# 1. word timestamps from the voice (ASR), then align the exact script text to them
ffmpeg -v error -y -i "$VOICE" -ar 16000 -ac 1 "$OUT/audio16k.wav"
python3 "$HERE/asr_words.py" "$MODELS/sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8" \
  "$OUT/audio16k.wav" "$MODELS/silero_vad.onnx" "$OUT/asr.json"
python3 "$HERE/make_subs.py" "$OUT/asr.json" "$SCRIPT" "$OUT/subs.ass"

# 2. seamless background loop: crossfade the last 1.5 s of the clip into its start
LEN=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$BG")
CUT=$(python3 -c "print(round($LEN-1.5,3))")
ffmpeg -v error -y -i "$BG" -filter_complex "
[0:v]scale=1920:1080:flags=lanczos,setsar=1,fps=24,split=3[a][b][c];
[a]trim=$CUT:$LEN,setpts=PTS-STARTPTS[tail];
[b]trim=0:1.5,setpts=PTS-STARTPTS[head];
[c]trim=1.5:$CUT,setpts=PTS-STARTPTS[mid];
[tail][head]xfade=transition=fade:duration=1.5:offset=0[blend];
[blend][mid]concat=n=2:v=1:a=0,format=yuv420p[v]" -map "[v]" -c:v libx264 -crf 16 -preset slow "$OUT/loop.mp4"

# 3. final render for the full voice length
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$VOICE")
ffmpeg -v error -stats -y -stream_loop -1 -i "$OUT/loop.mp4" -i "$VOICE" -filter_complex \
  "[0:v]vignette=PI/5,subtitles=$OUT/subs.ass:fontsdir=/usr/share/fonts/opentype/inter,format=yuv420p[v]" \
  -map "[v]" -map 1:a -t "$(python3 -c "print($DUR+0.5)")" -c:v libx264 -preset fast -crf 19 -r 24 -g 48 \
  -c:a aac -b:a 192k -ar 48000 -movflags +faststart "$OUT/final.mp4"
