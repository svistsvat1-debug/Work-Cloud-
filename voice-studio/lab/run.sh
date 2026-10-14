#!/usr/bin/env bash
# What the voice lab does on this run (see .github/workflows/voice-lab.yml)
set -euo pipefail
# Round 6: synthetic native voices (male and female) for Chatterbox, and Kokoro's female voices
pip install -q requests praat-parselmouth soundfile numpy
python design_voices.py
python round6.py
python synth.py candidates6.json
pip install -q --index-url https://download.pytorch.org/whl/cpu torch torchaudio
pip install -q faster-whisper jiwer num2words scipy speechbrain transformers
EVAL_RE='@r6' python evaluate.py out/synth.json
