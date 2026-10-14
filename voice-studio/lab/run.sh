#!/usr/bin/env bash
# What the voice lab does on this run (see .github/workflows/voice-lab.yml)
set -euo pipefail
# Audio from the run named in reuse_run.txt is downloaded to out/ first, so it is not paid for twice
python synth.py candidates2.json
pip install -q --index-url https://download.pytorch.org/whl/cpu torch torchaudio
pip install -q faster-whisper jiwer num2words praat-parselmouth soundfile numpy scipy speechbrain transformers
# Round 2: the finalists on a long and a short text, plus their first-round audio for the consistency check
EVAL_RE='@|inworld-(max|mini|tts2)-(Josef|Rafael|Diego|Lucian|Alain|Dennis|Brandon|Theodore)$|qwen3-(Aiden|Ryan)$|chatterbox-ml$|audio8$|kokoro-am_michael$' \
  python evaluate.py out/synth.json
