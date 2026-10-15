"""Round 10: why do long Chatterbox texts score lower on the live site than single takes in the lab?
The long story is cut like the page cuts it (sentences up to 220 characters) and voiced per chunk as WAV and as MP3
(the site asks for MP3), and with a fixed seed. join10.py then joins the chunks the way the page does (silence trimmed,
0.42 s between sentences), with and without the page's loudness leveling, so each step can be scored on its own.
Writes candidates10.json."""
import json
import re

t = json.load(open("texts.json"))
LIVELY = {"exaggeration": 0.5, "cfg": 0.3}
CALM = {"exaggeration": 0.35, "cfg": 0.3, "temperature": 0.7}
VOICES = {  # as on the site (cloud/src/worker.js)
    "camille": ("fr", "j5rtpur21lwjzmgeqimr", CALM), "anna": ("de", "ufzc7yn3vq0tbpyyoygc", LIVELY),
    "lucia": ("es", "8qs07p4ftjdfzn00sxsc", LIVELY), "max": ("de", "", CALM),
}
VARIANTS = {"wav": ("wav", {}), "mp3": ("mp3", {}), "seed": ("wav", {"seed": 7})}


def chunks(text, limit=220):
    out, cur = [], ""
    for s in re.split(r"(?<=[.!?…»“”])\s+", text.strip()):
        if cur and len(cur) + 1 + len(s) > limit:
            out.append(cur)
            cur = s
        else:
            cur = (cur + " " + s).strip()
    return out + [cur] if cur else out


C = []
for name, (lang, vid, opts) in VOICES.items():
    parts = chunks(t[f"long_{lang}"])
    for vname, (fmt, extra) in VARIANTS.items():
        if vname == "seed" and name not in ("camille", "max"):
            continue
        for i, part in enumerate(parts):
            params = {"text": "{text}", "language_id": lang, "response_format": fmt, **opts, **extra}
            if vid:
                params["voice_id"] = vid
            C.append({"id": f"{lang}-cb10-{name}-{vname}@r10c{i}", "lang": lang, "model": "ResembleAI/chatterbox-multilingual",
                      "params": params, "text": part})
    print(name, [len(p) for p in parts])
json.dump(C, open("candidates10.json", "w"), indent=1, ensure_ascii=False)
print(len(C), "candidates")
