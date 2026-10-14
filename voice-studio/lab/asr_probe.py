"""Lists DeepInfra's speech-recognition models with prices and tries one on our audio (for checking voiced chunks)."""
import json
import os
import time
import urllib.request

import requests

BASE = "https://api.deepinfra.com"
KEY = os.environ["DEEPINFRA_API_KEY"].strip()
models = json.loads(urllib.request.urlopen(urllib.request.Request(BASE + "/models/list", headers={"Authorization": f"Bearer {KEY}"}), timeout=60).read())
for m in models:
    if "speech-recognition" in str(m.get("type", "")) or "whisper" in m.get("model_name", "").lower():
        print("ASR:", m["model_name"], "|", m.get("type"), "|", json.dumps(m.get("pricing")))
tests = [("out/audio/fr-inworld-max-Lucian__long.wav", "fr"), ("out/audio/de-inworld-max-Josef.wav", "de")]
for model in ["openai/whisper-large-v3-turbo", "openai/whisper-large-v3"]:
    for path, lang in tests:
        if not os.path.exists(path):
            print("missing", path)
            continue
        t = time.time()
        r = requests.post(f"{BASE}/v1/openai/audio/transcriptions", headers={"Authorization": f"Bearer {KEY}"},
                          files={"file": (os.path.basename(path), open(path, "rb"), "audio/wav")},
                          data={"model": model, "language": lang, "response_format": "json"}, timeout=120)
        print(f"\n{model} {path} -> HTTP {r.status_code} in {time.time() - t:.2f}s: {r.text[:1500]}")
