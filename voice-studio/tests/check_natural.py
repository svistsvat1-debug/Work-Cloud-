"""Checks the natural-reading rules in app.py against tests/natural_cases.json.

Run from voice-studio/: python tests/check_natural.py
"""
import json
import re
import sys
from pathlib import Path

src = Path("app.py").read_text(encoding="utf-8")
block = src[src.index("# ---- natural reading"):src.index("# ---- end natural reading")]
ns = {"re": re}
exec(block, ns)
failed = 0
for lang, items in json.loads(Path("tests/natural_cases.json").read_text(encoding="utf-8")).items():
    for text, want in items:
        got = ns["natural"](text, lang)
        if got != want:
            failed += 1
            print(f"[{lang}] {text!r}\n  got  {got!r}\n  want {want!r}")
print(f"{failed} failed" if failed else "all passed")
sys.exit(1 if failed else 0)
