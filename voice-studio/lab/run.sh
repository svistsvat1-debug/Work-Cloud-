#!/usr/bin/env bash
# What the voice lab does on this run (see .github/workflows/voice-lab.yml)
set -euo pipefail
# Long-script check of the live site: ~3000 words per language, every request's characters vs seconds of audio
pip install -q playwright requests
python -m playwright install --with-deps chromium > /dev/null
python live_long.py
