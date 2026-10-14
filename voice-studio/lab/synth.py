"""Synthesizes every candidate in candidates.json on DeepInfra and saves the audio to out/audio/.

A candidate: {"id", "lang", "model", "params"}; the text comes from texts.json (key = lang, or "text" in the
candidate). "{text}" and "{lang_name}" inside params are filled in. Writes out/synth.json with timing and errors.
"""
import base64
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request

BASE = "https://api.deepinfra.com"
KEY = os.environ["DEEPINFRA_API_KEY"].strip()
LANG_NAME = {"en": "English", "de": "German", "es": "Spanish", "fr": "French"}
texts = json.load(open("texts.json"))
cands = json.load(open(sys.argv[1] if len(sys.argv) > 1 else "candidates.json"))
os.makedirs("out/audio", exist_ok=True)


def fill(v, text, lang):
    if isinstance(v, str):
        return v.replace("{text}", text).replace("{lang_name}", LANG_NAME.get(lang, lang))
    if isinstance(v, list):
        return [fill(x, text, lang) for x in v]
    if isinstance(v, dict):
        return {k: fill(x, text, lang) for k, x in v.items()}
    return v


def audio_from(body, ctype):
    """Audio bytes from a raw audio response or a JSON one with base64 audio somewhere inside."""
    if not ctype.startswith("application/json"):
        return body, ctype
    data = json.loads(body)
    stack = [data]
    while stack:
        cur = stack.pop()
        if isinstance(cur, dict):
            stack.extend(cur.values())
        elif isinstance(cur, list):
            stack.extend(cur)
        elif isinstance(cur, str) and len(cur) > 1000:
            m = re.match(r"data:([\w/+.-]+);base64,(.*)", cur, re.S)
            return base64.b64decode(m.group(2) if m else cur), (m.group(1) if m else "audio/unknown")
    raise ValueError("no audio in JSON: " + json.dumps(data)[:400])


def ext_of(raw, ctype):
    if raw[:4] == b"RIFF":
        return "wav"
    if raw[:3] == b"ID3" or raw[:2] in (b"\xff\xfb", b"\xff\xf3", b"\xff\xf2"):
        return "mp3"
    if raw[:4] == b"fLaC":
        return "flac"
    if raw[:4] == b"OggS":
        return "ogg"
    return "pcm"


# Earlier results (reused from a previous run) are kept; a candidate with the same id replaces its old result
results = json.load(open("out/synth.json")) if os.path.exists("out/synth.json") else []
done = {r["id"] for r in results if r.get("ok")}
for c in cands:
    if c["id"] in done:
        continue
    lang = c["lang"]
    text = c.get("text") or texts[c.get("text_key", lang)]
    params = fill(c["params"], text, lang)
    url = f"{BASE}/v1/inference/{c['model']}" if c.get("route", "native") == "native" else f"{BASE}/v1/audio/speech"
    if c.get("route") == "openai":
        params = {"model": c["model"], **params}
    req = urllib.request.Request(url, data=json.dumps(params).encode(), method="POST",
                                 headers={"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"})
    t = time.time()
    rec = {"id": c["id"], "lang": lang, "model": c["model"], "chars": len(text), "text": text,
           "params": {k: v for k, v in params.items() if k not in ("text", "input")}}
    try:
        with urllib.request.urlopen(req, timeout=300) as r:
            body, ctype = r.read(), r.headers.get("content-type", "")
        raw, _ = audio_from(body, ctype)
        ext = ext_of(raw, ctype)
        path = f"out/audio/{c['id'].replace('@', '__')}.{ext}"
        open(path, "wb").write(raw)
        rec.update(ok=True, file=path, bytes=len(raw), seconds=round(time.time() - t, 2))
    except urllib.error.HTTPError as e:
        rec.update(ok=False, error=f"HTTP {e.code}: {e.read()[:400].decode('utf-8', 'replace')}", seconds=round(time.time() - t, 2))
    except Exception as e:
        rec.update(ok=False, error=f"{type(e).__name__}: {str(e)[:400]}", seconds=round(time.time() - t, 2))
    rec["new"] = True
    print(("OK  " if rec["ok"] else "ERR ") + f"{c['id']:<34} {rec['seconds']:>6}s " + (rec.get("file", "") if rec["ok"] else rec["error"]), flush=True)
    results = [r for r in results if r["id"] != c["id"]] + [rec]

json.dump(results, open("out/synth.json", "w"), indent=1, ensure_ascii=False)
