#!/usr/bin/env bash
# What the voice lab does on this run (see .github/workflows/voice-lab.yml)
set -euo pipefail
# Round 10: long Chatterbox texts chunk by chunk (WAV, MP3, fixed seed), joined as the page joins them, with and without leveling
pip install -q requests praat-parselmouth soundfile numpy scipy
python round10.py
python synth.py candidates10.json
python join10.py
pip install -q --index-url https://download.pytorch.org/whl/cpu torch torchaudio
pip install -q faster-whisper jiwer num2words speechbrain transformers
EVAL_RE='@r10' python evaluate.py out/synth.json
