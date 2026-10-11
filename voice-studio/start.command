#!/bin/bash
# Voice Studio launcher for macOS (double-click) and Linux (bash start.command)
cd "$(dirname "$0")" || exit 1

if [ ! -x .venv/bin/python ]; then
  PY=""
  for c in python3.12 python3.11 python3.13 python3.10 python3; do
    if command -v "$c" >/dev/null 2>&1 &&
       "$c" -c 'import sys; sys.exit(0 if (3,10) <= sys.version_info[:2] <= (3,13) else 1)'; then
      PY="$c"; break
    fi
  done
  if [ -z "$PY" ]; then
    echo "Python 3.10 - 3.13 was not found. Install Python 3.12 from https://www.python.org/downloads/ and run this again."
    read -r -p "Press Enter to close..."; exit 1
  fi
  echo "Creating a private Python environment, first run only..."
  "$PY" -m venv .venv || { read -r -p "Press Enter to close..."; exit 1; }
fi

echo "Checking components, the first run downloads them and takes a few minutes..."
.venv/bin/python -m pip install --disable-pip-version-check -q -r requirements.txt ||
  { echo "Install failed. Check your internet connection and try again."; read -r -p "Press Enter to close..."; exit 1; }

exec .venv/bin/python app.py "$@"
