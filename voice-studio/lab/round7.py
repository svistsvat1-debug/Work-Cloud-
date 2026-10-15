"""Round 7 candidates: Chatterbox with the designed voices (out/voices.json) and its own male voice, numbers written as words (hardw_*).
v1 is the setting round 5 picked (exaggeration 0.5, cfg 0.5); v2 lowers cfg to 0.3, which Chatterbox's authors suggest for a calmer pace."""
import json

t = json.load(open("texts.json"))
voices = json.load(open("out/voices.json"))
VARIANTS = {"v1": {"exaggeration": 0.5, "cfg": 0.5}, "v2": {"exaggeration": 0.5, "cfg": 0.3}}
CB = "ResembleAI/chatterbox-multilingual"


def keys(lang):
    return sorted(k for k in t if k.startswith("chunk") and k.endswith("_" + lang))[:3] + [f"hardw_{lang}"]


C = []
for key, vid in [*voices.items(), *((f"{l}_cb", None) for l in ("de", "es", "fr"))]:
    lang = key[:2]
    for vname, extra in VARIANTS.items():
        for tk in keys(lang):
            params = {"text": "{text}", "language_id": lang, "response_format": "wav", **extra}
            if vid:
                params["voice_id"] = vid
            C.append({"id": f"{lang}-cb7-{key}-{vname}@r7{tk.split('_')[0]}", "lang": lang, "model": CB, "params": params, "text_key": tk})
json.dump(C, open("candidates7.json", "w"), indent=1)
print(len(C), "candidates")
