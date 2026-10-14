"""Makes synthetic native voices for Chatterbox: Qwen3-TTS-VoiceDesign speaks a reference clip from a text description
(no real person behind it), the clip is checked for pitch, and uploaded to the account's DeepInfra voices.
Writes out/refs/<key>.wav and out/voices.json {key: voice_id}. Run once; the site then uses the voice ids.
"""
import json
import os
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
PEOPLE = {
    "m": "man in his thirties with a warm, calm, natural baritone voice",
    "f": "woman in her thirties with a warm, friendly, natural voice",
}
NATIVE = {"de": "a native speaker of standard High German from Germany", "es": "a native speaker of Castilian Spanish from Madrid",
          "fr": "a native speaker of standard French from Paris"}
os.makedirs("out/refs", exist_ok=True)
voices = {}
for lang in ("de", "es", "fr"):
    for sex, person in PEOPLE.items():
        key = f"{lang}_{sex}"
        desc = (f"A {person}, {NATIVE[lang]}. Clear articulation, relaxed and engaging, like a popular YouTube narrator "
                f"talking to a friend. Studio-quality recording, no background noise.")
        best = None
        for attempt in range(3):
            r = requests.post(f"{BASE}/v1/audio/speech", headers=H, timeout=180, json={
                "model": "Qwen/Qwen3-TTS-VoiceDesign", "input": REF[lang], "voice": desc, "language": LANG[lang], "response_format": "wav"})
            if r.status_code != 200 or r.content[:4] != b"RIFF":  # fall back to the native route (JSON with base64)
                r = requests.post(f"{BASE}/v1/inference/Qwen/Qwen3-TTS-VoiceDesign", headers=H, timeout=180, json={
                    "input": REF[lang], "voice": desc, "language": LANG[lang], "response_format": "wav"})
                import base64
                audio = r.json().get("audio", "")
                data = base64.b64decode(audio.split(",", 1)[-1]) if audio else b""
            else:
                data = r.content
            path = f"out/refs/{key}-{attempt}.wav"
            open(path, "wb").write(data)
            x, sr = sf.read(path, dtype="float32", always_2d=True)
            x = x.mean(axis=1)
            f0 = parselmouth.Sound(x.astype(np.float64), sr).to_pitch(pitch_floor=60, pitch_ceiling=400).selected_array["frequency"]
            f0 = float(np.median(f0[f0 > 0])) if (f0 > 0).any() else 0
            ok = (f0 < 160) if sex == "m" else (f0 > 175)
            print(f"{key} take {attempt}: {len(x) / sr:.1f}s, F0 {f0:.0f} Hz, {'ok' if ok else 'wrong pitch'}", flush=True)
            if ok and (best is None or abs(len(x) / sr - 12) < abs(best[1] - 12)):
                best = (path, len(x) / sr)
            if ok:
                break
        if not best:
            print(f"{key}: no take with the right pitch", flush=True)
            continue
        os.replace(best[0], f"out/refs/{key}.wav")
        # Upload as an account voice; the file part is called "audio" in DeepInfra's examples ("file" tried as well)
        for field in ("audio", "file"):
            with open(f"out/refs/{key}.wav", "rb") as fh:
                r = requests.post(f"{BASE}/v1/voices/add", headers=H, timeout=120,
                                  files={field: (f"{key}.wav", fh, "audio/wav")},
                                  data={"name": f"voice-studio-{key}", "description": desc[:200]})
            print(f"{key} upload ({field}): HTTP {r.status_code} {r.text[:300]}", flush=True)
            if r.ok and r.json().get("voice_id"):
                voices[key] = r.json()["voice_id"]
                break
        time.sleep(1)
json.dump(voices, open("out/voices.json", "w"), indent=1)
print("VOICES:", json.dumps(voices))
