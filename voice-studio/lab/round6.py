"""Round 6 candidates: Chatterbox with the designed voices (out/voices.json) and Kokoro's female voices."""
import json

t = json.load(open("texts.json"))
voices = json.load(open("out/voices.json"))
VARIANTS = {"v0": {}, "v1": {"exaggeration": 0.5, "cfg": 0.5}}
C = []
for key, vid in voices.items():
    lang = key[:2]
    for vname, extra in VARIANTS.items():
        for tk in sorted(k for k in t if k.startswith("chunk") and k.endswith("_" + lang))[:3] + [f"hardn_{lang}"]:
            C.append({"id": f"{lang}-cbclone-{key}-{vname}@r6{tk.split('_')[0]}", "lang": lang, "model": "ResembleAI/chatterbox-multilingual",
                      "params": {"text": "{text}", "language_id": lang, "voice_id": vid, "response_format": "wav", **extra}, "text_key": tk})
KOKORO_F = {"en": ["af_heart", "af_bella", "bf_emma"], "es": ["ef_dora"], "fr": ["ff_siwis"]}
for lang, names in KOKORO_F.items():
    keys = ["en", "long_en"] if lang == "en" else sorted(k for k in t if k.startswith("chunk") and k.endswith("_" + lang))[:3] + [f"hardn_{lang}"]
    for v in names:
        for tk in keys:
            C.append({"id": f"{lang}-kokoro-{v}@r6{tk.split('_')[0]}", "lang": lang, "model": "hexgrad/Kokoro-82M",
                      "params": {"text": "{text}", "preset_voice": [v], "output_format": "wav"}, "text_key": tk})
json.dump(C, open("candidates6.json", "w"), indent=1)
print(len(C), "candidates")
