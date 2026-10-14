#!/usr/bin/env bash
# What the voice lab does on this run (see .github/workflows/voice-lab.yml)
set -euo pipefail
# Audio from the run named in reuse_run.txt is downloaded to out/ first, so it is not paid for twice
[ -f out/synth.json ] || python synth.py candidates.json
pip install -q --index-url https://download.pytorch.org/whl/cpu torch torchaudio
pip install -q faster-whisper jiwer num2words praat-parselmouth soundfile numpy scipy
python evaluate.py out/synth.json
