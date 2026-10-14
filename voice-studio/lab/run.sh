#!/usr/bin/env bash
# What the voice lab does on this run (see .github/workflows/voice-lab.yml)
set -euo pipefail
# Live check of the deployed site in all four languages, then the same scoring as the lab rounds
pip install -q playwright requests
python -m playwright install --with-deps chromium > /dev/null
python live_test.py
pip install -q --index-url https://download.pytorch.org/whl/cpu torch torchaudio
pip install -q faster-whisper jiwer num2words praat-parselmouth soundfile numpy scipy speechbrain transformers
python evaluate.py out/live.json
