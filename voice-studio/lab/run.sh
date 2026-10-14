#!/usr/bin/env bash
# What the voice lab does on this run (see .github/workflows/voice-lab.yml)
set -euo pipefail
# Round 5: cheaper voices for German, Spanish and French (Chatterbox ~$1 per million characters, Qwen3 $20)
# on the short requests the site sends, twice each, plus the prepared "hard" text
python synth.py candidates5.json
pip install -q --index-url https://download.pytorch.org/whl/cpu torch torchaudio
pip install -q faster-whisper jiwer num2words praat-parselmouth soundfile numpy scipy speechbrain transformers
EVAL_RE='@r5' python evaluate.py out/synth.json
