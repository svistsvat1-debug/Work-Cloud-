"""Lists DeepInfra's text-to-speech models with prices and input schemas (runs in GitHub Actions).

Writes out/models.json (everything) and prints a short overview: which voices and languages each model takes.
"""
import json
import os
import urllib.request

BASE = "https://api.deepinfra.com"
KEY = os.environ.get("DEEPINFRA_API_KEY", "").strip()
os.makedirs("out", exist_ok=True)


def get(path):
    req = urllib.request.Request(BASE + path, headers={"Authorization": f"Bearer {KEY}"} if KEY else {})
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return json.loads(r.read())
    except Exception as e:  # keep going: one broken page must not hide the rest
        return {"error": str(e)}


def enum_of(schema, prop):
    p = (schema or {}).get("properties", {}).get(prop) or {}
    t = p.get("items", p)
    if "enum" in t:
        return t["enum"]
    for ref in [t.get("$ref")] + [a.get("$ref") for a in t.get("anyOf", []) + t.get("allOf", [])]:
        if ref:
            d = (schema.get("definitions") or schema.get("$defs") or {}).get(ref.split("/")[-1], {})
            if "enum" in d:
                return d["enum"]
    return None


listing = get("/models/list")
models = listing if isinstance(listing, list) else []
print("models in list:", len(models), "" if models else listing)
tts = [m for m in models if "speech" in json.dumps({k: m.get(k) for k in ("type", "reported_type", "tags")}).lower()
       and "speech-recognition" not in str(m.get("type", "")) and "automatic" not in str(m.get("type", ""))]
names = sorted({m["model_name"] for m in tts})
# Models that may be missing from the list but are worth checking by name
for extra in ["hexgrad/Kokoro-82M", "Qwen/Qwen3-TTS", "Qwen/Qwen3-TTS-VoiceDesign", "Qwen/Qwen3-TTS-Base",
              "ResembleAI/chatterbox-multilingual", "ResembleAI/chatterbox", "bosonai/HiggsAudioV2.5",
              "Zyphra/Zonos-v0.1-hybrid", "Zyphra/Zonos-v0.1-transformer", "canopylabs/orpheus-3b-0.1-ft",
              "sesame/csm-1b", "nari-labs/Dia-1.6B", "kyutai/tts-1.6b-en_fr"]:
    if extra not in names:
        names.append(extra)

full = {}
for name in names:
    info = get(f"/models/{name}")
    full[name] = info
    if "error" in info:
        print(f"\n### {name}: {info['error']}")
        continue
    schema = info.get("in_schema") or {}
    props = schema.get("properties", {})
    print(f"\n### {name}")
    print("type:", info.get("type"), "| pricing:", json.dumps(info.get("pricing")), "| license:", info.get("license") or (info.get("meta") or {}).get("license"))
    desc = (info.get("description") or "").replace("\n", " ")
    print("about:", desc[:600])
    for key, p in props.items():
        values = enum_of(schema, key)
        line = f"  - {key}: {p.get('type', '')} default={json.dumps(p.get('default'))}"
        if values:
            line += f" enum[{len(values)}]={json.dumps(values)[:1500]}"
        if p.get("description"):
            line += " | " + p["description"].replace("\n", " ")[:300]
        print(line)

# The account's custom voices (used by cloning models)
full["_voices"] = get("/v1/voices")
print("\n### /v1/voices:", json.dumps(full["_voices"])[:800])
with open("out/models.json", "w") as f:
    json.dump(full, f, indent=1)
