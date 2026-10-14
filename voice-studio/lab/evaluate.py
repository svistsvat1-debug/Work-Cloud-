"""Scores the audio from synth.py: is it right, does it sound native, does it sound good, is it a male voice.

- WER: Whisper large-v3-turbo transcribes the audio in the expected language; numbers on both sides become words.
- lang: the language Whisper hears on its own, with its confidence (an accent makes it less sure).
- MOS: UTMOS22 naturalness estimate, 1..5 (trained on English, a rough guide for other languages).
- F0: median pitch; a typical male voice is about 85-155 Hz.
- wpm: words per minute of speech (pauses at both ends left out); calm narration is about 130-170.
Writes out/report.json and out/report.md (also shown on the GitHub run page).
"""
import json
import os
import re
import subprocess
import sys
import unicodedata

import numpy as np
import parselmouth
import soundfile as sf
import torch
from faster_whisper import WhisperModel
from jiwer import wer
from num2words import num2words

synth = json.load(open(sys.argv[1] if len(sys.argv) > 1 else "out/synth.json"))
os.makedirs("out/wav16", exist_ok=True)
asr = WhisperModel("large-v3-turbo", device="cpu", compute_type="int8")
utmos = torch.hub.load("tarepan/SpeechMOS:v1.2.0", "utmos22_strong", trust_repo=True)
N2W = {"en": "en", "de": "de", "es": "es", "fr": "fr"}


def norm(text, lang):
    text = unicodedata.normalize("NFC", text.lower()).replace("’", "'")
    text = re.sub(r"(\d+)[:.](\d\d)", r"\1 \2", text)
    text = re.sub(r"\d+", lambda m: " " + num2words(int(m.group()), lang=N2W[lang]) + " ", text)
    text = re.sub(r"[^\w']+", " ", text).replace("'", " ")
    text = text.replace("-", " ")
    return re.sub(r"\s+", " ", text).strip()


def speech_span(x, sr):
    frame = int(sr * 0.02)
    e = np.array([np.sqrt(np.mean(x[i:i + frame] ** 2) + 1e-12) for i in range(0, len(x) - frame, frame)])
    on = np.where(e > max(e.max() * 0.03, 1e-4))[0]
    if not len(on):
        return 0.0, 0.0, 0.0
    return on[0] * 0.02, (len(e) - on[-1] - 1) * 0.02, (on[-1] - on[0] + 1) * 0.02


rows = []
for r in synth:
    if not r.get("ok"):
        rows.append({**r})
        continue
    wav = f"out/wav16/{r['id']}.wav"
    src = r["file"]
    fmt = ["-f", "s16le", "-ar", "24000", "-ac", "1"] if src.endswith(".pcm") else []
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", *fmt, "-i", src, "-ac", "1", "-ar", "16000", wav], check=True)
    x, sr = sf.read(wav, dtype="float32")
    lead, tail, speech = speech_span(x, sr)
    lang = r["lang"]
    _, info = asr.transcribe(x, language=None, beam_size=1)
    segs, _ = asr.transcribe(x, language=lang, beam_size=5, vad_filter=False)
    hyp = " ".join(s.text.strip() for s in segs)
    ref_n, hyp_n = norm(r["text"], lang), norm(hyp, lang)
    pitch = parselmouth.Sound(x.astype(np.float64), sr).to_pitch(pitch_floor=60, pitch_ceiling=400)
    f0 = pitch.selected_array["frequency"]
    f0 = f0[f0 > 0]
    with torch.no_grad():
        mos = float(utmos(torch.from_numpy(x).unsqueeze(0), sr).item())
    words = len(ref_n.split())
    rows.append({**r, "duration": round(len(x) / sr, 2), "lead": round(lead, 2), "tail": round(tail, 2),
                 "wer": round(wer(ref_n, hyp_n), 3), "heard_lang": info.language, "lang_prob": round(info.language_probability, 3),
                 "mos": round(mos, 2), "f0": round(float(np.median(f0)), 1) if len(f0) else None,
                 "f0_spread": round(float(np.percentile(f0, 90) - np.percentile(f0, 10)), 1) if len(f0) else None,
                 "wpm": round(words / max(speech, 0.1) * 60), "peak": round(float(np.abs(x).max()), 3),
                 "rtf": round(r["seconds"] / max(len(x) / sr, 0.1), 2), "hyp": hyp})
    print(f"{r['id']:<34} wer={rows[-1]['wer']:<6} lang={info.language}:{info.language_probability:.2f} mos={mos:.2f} "
          f"f0={rows[-1]['f0']} wpm={rows[-1]['wpm']} dur={rows[-1]['duration']}", flush=True)

json.dump(rows, open("out/report.json", "w"), indent=1, ensure_ascii=False)
lines = []
for lang in ["en", "de", "es", "fr"]:
    sub = [r for r in rows if r["lang"] == lang]
    if not sub:
        continue
    lines += [f"\n## {lang}\n", "| id | WER | heard | MOS | F0 Hz | F0 range | wpm | sec gen/audio | lead/tail s |", "|---|---|---|---|---|---|---|---|---|"]
    ok = sorted([r for r in sub if "wer" in r], key=lambda r: (r["wer"] > 0.1, -r["mos"]))
    for r in ok:
        lines.append(f"| {r['id']} | {r['wer']} | {r['heard_lang']} {r['lang_prob']} | {r['mos']} | {r['f0']} | {r['f0_spread']} | {r['wpm']} | "
                     f"{r['seconds']}/{r['duration']} | {r['lead']}/{r['tail']} |")
    for r in sub:
        if "wer" not in r:
            lines.append(f"| {r['id']} | failed: {r.get('error', '')[:160]} |||||||| ")
    for r in ok:
        if r["wer"] > 0.05:
            lines.append(f"\n- **{r['id']}** heard: {r['hyp'][:600]}")
md = "\n".join(lines)
open("out/report.md", "w").write(md)
print(md)
if os.environ.get("GITHUB_STEP_SUMMARY"):
    open(os.environ["GITHUB_STEP_SUMMARY"], "a").write(md + "\n")
