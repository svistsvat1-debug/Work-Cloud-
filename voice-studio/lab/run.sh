#!/usr/bin/env bash
# What the voice lab does on this run (see .github/workflows/voice-lab.yml)
set -euo pipefail
# Round 9: the page's time stretch on Chatterbox takes (narrator pace) and on Kokoro, compared with Kokoro's own speed
node stretch_eval.mjs
pip install -q requests praat-parselmouth soundfile numpy
pip install -q --index-url https://download.pytorch.org/whl/cpu torch torchaudio
pip install -q faster-whisper jiwer num2words scipy speechbrain transformers
EVAL_RE='@r9' python evaluate.py out/synth.json
