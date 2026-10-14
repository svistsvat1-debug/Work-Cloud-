#!/usr/bin/env bash
# What the voice lab does on this run (see .github/workflows/voice-lab.yml)
set -euo pipefail
# Audio from the run named in reuse_run.txt is downloaded to out/ first, so it is not paid for twice
python fetch_docs.py inworld-best-practices inworld-generating-audio inworld-models inworld-multilingual || true
pip install -q requests
python asr_probe.py || true
python synth.py candidates3.json
pip install -q --index-url https://download.pytorch.org/whl/cpu torch torchaudio
pip install -q faster-whisper jiwer num2words praat-parselmouth soundfile numpy scipy speechbrain transformers
# Round 3: short requests (with and without lower temperature, twice each), numbers and abbreviations raw vs prepared
EVAL_RE='@r3' python evaluate.py out/synth.json
