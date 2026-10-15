"""Makes synthetic native voices for Chatterbox: Qwen3-TTS-VoiceDesign speaks a reference clip from a text description
(no real person behind it), the clip is checked for pitch, and uploaded to the account's DeepInfra voices.
Writes out/refs/<key>.wav and out/voices.json {key: voice_id}. The site then uses the voice ids.
A clip from an earlier run (out/refs/<key>.wav) and a voice already uploaded under the same name are reused.
Usage: python design_voices.py [set ...]   sets: base (rounds 6-7), narrator (round 8); default: all
"""
import base64
import json
import os
import sys
import time

import numpy as np
import parselmouth
import requests
import soundfile as sf

BASE = "https://api.deepinfra.com"
KEY = os.environ["DEEPINFRA_API_KEY"].strip()
H = {"Authorization": f"Bearer {KEY}"}
LANG = {"de": "German", "es": "Spanish", "fr": "French"}
# Reference lines are natural, varied narration, so the clone learns rhythm and intonation, not only the timbre
REF = {
    "de": "Weißt du, was ich in den letzten Jahren gelernt habe? Kleine Gewohnheiten verändern alles. Nicht über Nacht, aber Schritt für Schritt. Und genau darüber reden wir heute.",
    "es": "¿Sabes lo que he aprendido en los últimos años? Los pequeños hábitos lo cambian todo. No de la noche a la mañana, sino poco a poco. Y de eso vamos a hablar hoy.",
    "fr": "Tu sais ce que j'ai appris ces dernières années ? Les petites habitudes changent tout. Pas du jour au lendemain, mais petit à petit. Et c'est exactement de ça qu'on va parler aujourd'hui.",
}
# Narrator references: a calm documentary opening, a question, a pause, so the clone keeps a measured voice-over pace
REF_NARRATOR = {
    "de": "Vor zweihundert Jahren war diese Stadt nur ein kleines Dorf am Fluss. Heute leben hier fast eine Million Menschen. Wie konnte das passieren? Die Antwort ist überraschend einfach, und sie beginnt mit einer einzigen Entscheidung.",
    "es": "Hace doscientos años, esta ciudad era solo un pequeño pueblo junto al río. Hoy viven aquí casi un millón de personas. ¿Cómo pudo pasar algo así? La respuesta es sorprendentemente sencilla, y empieza con una sola decisión.",
    "fr": "Il y a deux cents ans, cette ville n'était qu'un petit village au bord du fleuve. Aujourd'hui, près d'un million de personnes y vivent. Comment est-ce possible ? La réponse est étonnamment simple, et elle commence par une seule décision.",
}
NATIVE = {"de": "a native speaker of standard High German from Germany", "es": "a native speaker of Castilian Spanish from Madrid",
          "fr": "a native speaker of standard French from Paris", "es-latam": "a native speaker of neutral Latin American Spanish from Mexico City"}
STUDIO = "Studio-quality recording, close microphone, no background noise, no music."
SETS = {
    "base": {
        f"{lang}_{sex}": (lang, sex, REF[lang], f"A {person}, {NATIVE[lang]}. Clear articulation, relaxed and engaging, like a popular "
                                                f"YouTube narrator talking to a friend. Studio-quality recording, no background noise.")
        for lang in ("de", "es", "fr")
        for sex, person in {"m": "man in his thirties with a warm, calm, natural baritone voice",
                            "f": "woman in her thirties with a warm, friendly, natural voice"}.items()
    },
    "narrator": {},
}
NARRATORS = {  # n1: documentary voice-over, n2: audiobook / YouTube storyteller
    "m": {"n1": "A professional male voice-over artist in his forties with a deep, warm, resonant baritone",
          "n2": "A professional male audiobook narrator in his thirties with a warm, rich, natural voice"},
    "f": {"n1": "A professional female voice-over artist in her thirties with a warm, clear, confident mid-range voice",
          "n2": "A professional female audiobook narrator in her thirties with a warm, soft, natural voice"},
}
STYLE = {"n1": "Calm, confident and measured, like a documentary narrator, with natural pauses between sentences.",
         "n2": "Engaging storytelling with natural intonation and a steady, unhurried pace."}
for lang in ("de", "es", "fr"):
    for sex, kinds in NARRATORS.items():
        for kind, person in kinds.items():
            native = NATIVE["es-latam"] if lang == "es" and kind == "n2" else NATIVE[lang]  # Spanish: Spain and Latin America
            SETS["narrator"][f"{lang}_{sex}_{kind}"] = (lang, sex, REF_NARRATOR[lang], f"{person}, {native}. {STYLE[kind]} Clear diction. {STUDIO}")


def pitch(path):
    x, sr = sf.read(path, dtype="float32", always_2d=True)
    x = x.mean(axis=1)
    f0 = parselmouth.Sound(x.astype(np.float64), sr).to_pitch(pitch_floor=60, pitch_ceiling=400).selected_array["frequency"]
    return (float(np.median(f0[f0 > 0])) if (f0 > 0).any() else 0), len(x) / sr


def speak(text, desc, lang):
    r = requests.post(f"{BASE}/v1/audio/speech", headers=H, timeout=180, json={
        "model": "Qwen/Qwen3-TTS-VoiceDesign", "input": text, "voice": desc, "language": LANG[lang], "response_format": "wav"})
    if r.status_code == 200 and r.content[:4] == b"RIFF":
        return r.content
    r = requests.post(f"{BASE}/v1/inference/Qwen/Qwen3-TTS-VoiceDesign", headers=H, timeout=180, json={  # native route, base64
        "input": text, "voice": desc, "language": LANG[lang], "response_format": "wav"})
    audio = r.json().get("audio", "") if r.ok else ""
    return base64.b64decode(audio.split(",", 1)[-1]) if audio else b""


os.makedirs("out/refs", exist_ok=True)
voices = json.load(open("out/voices.json")) if os.path.exists("out/voices.json") else {}
r = requests.get(f"{BASE}/v1/voices", headers=H, timeout=60)
existing = {}
if r.ok:
    body = r.json()
    for v in body if isinstance(body, list) else body.get("voices", []):
        if isinstance(v, dict) and str(v.get("name", "")).startswith("voice-studio-"):
            existing[v["name"]] = v.get("voice_id") or v.get("id")
print("existing voices:", sorted(existing), flush=True)
for set_name in sys.argv[1:] or list(SETS):
    for key, (lang, sex, text, desc) in SETS[set_name].items():
        if existing.get(f"voice-studio-{key}"):
            voices[key] = existing[f"voice-studio-{key}"]
            print(f"{key}: already uploaded", flush=True)
            continue
        best = (f"out/refs/{key}.wav", 0) if os.path.exists(f"out/refs/{key}.wav") else None
        for attempt in range(0 if best else 3):
            path = f"out/refs/{key}-{attempt}.wav"
            data = speak(text, desc, lang)
            if not data:
                print(f"{key} take {attempt}: no audio", flush=True)
                continue
            open(path, "wb").write(data)
            f0, sec = pitch(path)
            ok = (f0 < 160) if sex == "m" else (f0 > 175)
            print(f"{key} take {attempt}: {sec:.1f}s, F0 {f0:.0f} Hz, {'ok' if ok else 'wrong pitch'}", flush=True)
            if ok:
                best = (path, sec)
                break
        if not best:
            print(f"{key}: no take with the right pitch", flush=True)
            continue
        if best[0] != f"out/refs/{key}.wav":
            os.replace(best[0], f"out/refs/{key}.wav")
        # Upload as an account voice: the API wants the clip in a multipart field called "files"
        with open(f"out/refs/{key}.wav", "rb") as fh:
            r = requests.post(f"{BASE}/v1/voices/add", headers=H, timeout=120,
                              files=[("files", (f"{key}.wav", fh, "audio/wav"))],
                              data={"name": f"voice-studio-{key}", "description": desc[:200]})
        print(f"{key} upload: HTTP {r.status_code} {r.text[:200]}", flush=True)
        if r.ok and (r.json().get("voice_id") or r.json().get("id")):
            voices[key] = r.json().get("voice_id") or r.json().get("id")
        time.sleep(1)
json.dump(voices, open("out/voices.json", "w"), indent=1)
print("VOICES:", json.dumps(voices))
