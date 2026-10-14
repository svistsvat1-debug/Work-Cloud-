#!/usr/bin/env bash
# What the voice lab does on this run (see .github/workflows/voice-lab.yml)
set -euo pipefail
# Live check of the deployed site: English voiceover, fixing one fragment, short subtitles (Kokoro only, under a cent)
pip install -q playwright requests
python -m playwright install --with-deps chromium > /dev/null
LIVE_LANGS="en" LIVE_FRAGMENT=1 python live_test.py
