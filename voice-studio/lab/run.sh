#!/usr/bin/env bash
# What the voice lab does on this run (see .github/workflows/voice-lab.yml)
set -euo pipefail
# Round 7: the designed voices uploaded (multipart field "files"), Chatterbox with them and with numbers as words
pip install -q requests praat-parselmouth soundfile numpy
python design_voices.py
python round7.py
python synth.py candidates7.json
pip install -q --index-url https://download.pytorch.org/whl/cpu torch torchaudio
pip install -q faster-whisper jiwer num2words scipy speechbrain transformers
EVAL_RE='@r7' python evaluate.py out/synth.json
