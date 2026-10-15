#!/usr/bin/env bash
# What the voice lab does on this run (see .github/workflows/voice-lab.yml)
set -euo pipefail
# Round 8: professional narrator voices for Chatterbox, a calmer setting, English at a voice-over pace
pip install -q requests praat-parselmouth soundfile numpy
python design_voices.py narrator
python round8.py
python synth.py candidates8.json
pip install -q --index-url https://download.pytorch.org/whl/cpu torch torchaudio
pip install -q faster-whisper jiwer num2words scipy speechbrain transformers
EVAL_RE='@r8' python evaluate.py out/synth.json
