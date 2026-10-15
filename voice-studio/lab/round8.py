"""Round 8 candidates, aiming at a professional narrator: Chatterbox with the narrator voices (design_voices.py narrator),
a calmer setting v3 for the round 7 voices too, and Kokoro's English voices slowed to a voice-over pace (speed 0.9).
v2: exaggeration 0.5, cfg 0.3 (best in round 7); v3: exaggeration 0.35, cfg 0.3, temperature 0.7 (calmer, fewer slips)."""
import json

t = json.load(open("texts.json"))
voices = json.load(open("out/voices.json"))
VARIANTS = {"v2": {"exaggeration": 0.5, "cfg": 0.3}, "v3": {"exaggeration": 0.35, "cfg": 0.3, "temperature": 0.7}}
CB = "ResembleAI/chatterbox-multilingual"
OLD = ["de_m", "de_f", "de_cb", "es_cb", "fr_m", "fr_f", "fr_cb"]  # round 7 voices worth a second look
C = []


def add(key, vid, lang, vname):
    for tk in (f"chunk0_{lang}", f"chunk1_{lang}", f"hardw_{lang}"):
        params = {"text": "{text}", "language_id": lang, "response_format": "wav", **VARIANTS[vname]}
        if vid:
            params["voice_id"] = vid
        C.append({"id": f"{lang}-cb8-{key}-{vname}@r8{tk.split('_')[0]}", "lang": lang, "model": CB, "params": params, "text_key": tk})


for key, vid in voices.items():
    if "_n" in key:
        for vname in VARIANTS:
            add(key, vid, key[:2], vname)
for key in OLD:
    add(key, voices.get(key), key[:2], "v3")
for v in ("am_michael", "am_onyx", "af_heart", "bf_emma"):
    C.append({"id": f"en-kokoro-{v}-s090@r8long", "lang": "en", "model": "hexgrad/Kokoro-82M",
              "params": {"text": "{text}", "preset_voice": [v], "speed": 0.9, "output_format": "wav"}, "text_key": "long_en"})
json.dump(C, open("candidates8.json", "w"), indent=1)
print(len(C), "candidates")
