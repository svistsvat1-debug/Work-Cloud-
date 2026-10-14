#!/usr/bin/env bash
# What the voice lab does on this run (see .github/workflows/voice-lab.yml)
set -euo pipefail
python fetch_docs.py || true
python synth.py candidates.json
pip install -q --index-url https://download.pytorch.org/whl/cpu torch torchaudio
pip install -q faster-whisper jiwer num2words praat-parselmouth soundfile numpy
python evaluate.py out/synth.json
