"""Makes synthetic native voices for Chatterbox: Qwen3-TTS-VoiceDesign speaks a reference clip from a text description
(no real person behind it), the clip is checked for pitch, and uploaded to the account's DeepInfra voices.
Writes out/refs/<key>.wav and out/voices.json {key: voice_id}. Run once; the site then uses the voice ids.
A clip from an earlier run (out/refs/<key>.wav) and a voice already uploaded under the same name are reused.
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
r = requests.get(f"{BASE}/v1/voices", headers=H, timeout=60)
print("existing voices:", r.status_code, r.text[:500], flush=True)
existing = {}
if r.ok:
    body = r.json()
    for v in body if isinstance(body, list) else body.get("voices", []):
        if isinstance(v, dict) and str(v.get("name", "")).startswith("voice-studio-"):
            existing[v["name"]] = v.get("voice_id") or v.get("id")
for lang in ("de", "es", "fr"):
    for sex, person in PEOPLE.items():
        key = f"{lang}_{sex}"
        desc = (f"A {person}, {NATIVE[lang]}. Clear articulation, relaxed and engaging, like a popular YouTube narrator "
                f"talking to a friend. Studio-quality recording, no background noise.")
        if existing.get(f"voice-studio-{key}"):
            voices[key] = existing[f"voice-studio-{key}"]
            print(f"{key}: already uploaded", flush=True)
            continue
        best = (f"out/refs/{key}.wav", 0) if os.path.exists(f"out/refs/{key}.wav") else None
        for attempt in range(0 if best else 3):
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
        if best[0] != f"out/refs/{key}.wav":
            os.replace(best[0], f"out/refs/{key}.wav")
        # Upload as an account voice: the API wants the clip in a multipart field called "files"
        with open(f"out/refs/{key}.wav", "rb") as fh:
            r = requests.post(f"{BASE}/v1/voices/add", headers=H, timeout=120,
                              files=[("files", (f"{key}.wav", fh, "audio/wav"))],
                              data={"name": f"voice-studio-{key}", "description": desc[:200]})
        print(f"{key} upload: HTTP {r.status_code} {r.text[:300]}", flush=True)
        if r.ok and (r.json().get("voice_id") or r.json().get("id")):
            voices[key] = r.json().get("voice_id") or r.json().get("id")
        time.sleep(1)
json.dump(voices, open("out/voices.json", "w"), indent=1)
print("VOICES:", json.dumps(voices))
