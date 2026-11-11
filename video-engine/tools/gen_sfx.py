#!/usr/bin/env python3
"""Generate SFX from sfx-library/manifest.json via ElevenLabs sound-generation. Skips files that exist.
Auth is injected by the session proxy; the header value here is a dummy."""
import json, os, sys, urllib.request
root = os.path.join(os.path.dirname(__file__), "..", "sfx-library")
man = json.load(open(os.path.join(root, "manifest.json")))
only = set(sys.argv[1:])
for it in man["items"]:
    if only and it["id"] not in only:
        continue
    out = os.path.join(root, it["id"] + ".mp3")
    if os.path.exists(out):
        print("skip", it["id"]); continue
    body = json.dumps({"text": it["prompt"], "duration_seconds": max(0.5, it["dur"]), "prompt_influence": 0.5}).encode()
    req = urllib.request.Request("https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128", data=body,
                                 headers={"xi-api-key": "dummy", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as r:
        open(out, "wb").write(r.read())
    print("ok", it["id"], os.path.getsize(out))
