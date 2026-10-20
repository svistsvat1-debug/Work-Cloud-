#!/usr/bin/env python3
"""Voiceover + word-level timestamps with Kokoro (local, offline TTS).

Usage: python3 tools/tts_kokoro.py videos/01-ask-chatgpt

Reads  <video>/script.json
Writes <video>/voice.wav, <video>/voice.mp3, <video>/timestamps.json
(words for subtitles, phones [ipa, start, end] for avatar lip-sync)

Script markup inside segment text:
  [word ...]  highlighted keyword(s)  -> yellow in subtitles
  {word ...}  emphasis word(s)        -> yellow + shake/zoom punch
  |           forced subtitle chunk break before the next word

Word timings come from the model's own per-phoneme duration predictions
(exposed from the ONNX graph), so they match the audio sample-exactly.
"""
import json
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

import numpy as np
import onnx
import onnxruntime as ort
import soundfile as sf
from kokoro_onnx import Kokoro

MODEL_DIR = Path.home() / ".cache" / "kokoro"
MODEL_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/"
SR = 24000
FRAME = 600  # samples per predicted duration unit (24000 / 40)
PUNCT = set(".,!?;:—…\"()")
DURATION_TENSOR = "/encoder/Clip_output_0"


def ensure_models():
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    for name in ("kokoro-v1.0.onnx", "voices-v1.0.bin"):
        path = MODEL_DIR / name
        if not path.exists():
            print(f"downloading {name} ...")
            urllib.request.urlretrieve(MODEL_URL + name, path)
    dur_model = MODEL_DIR / "kokoro-v1.0-dur.onnx"
    if not dur_model.exists():
        model = onnx.load(MODEL_DIR / "kokoro-v1.0.onnx")
        model.graph.output.append(
            onnx.helper.make_tensor_value_info(DURATION_TENSOR, onnx.TensorProto.FLOAT, None)
        )
        onnx.save(model, dur_model)
    return dur_model


def parse_segment(text):
    """Split markup text into word dicts: raw, hl, emph, brk.

    Brackets may sit next to punctuation or quotes, e.g. [Instagram.]" or "[Hi]".
    """
    words, hl, emph, brk = [], False, False, False
    for tok in text.split():
        if tok == "|":
            brk = True
            continue
        opens_hl, closes_hl = "[" in tok, "]" in tok
        opens_em, closes_em = "{" in tok, "}" in tok
        hl = hl or opens_hl
        emph = emph or opens_em
        raw = re.sub(r"[\[\]{}]", "", tok)
        words.append({"raw": raw, "hl": hl, "emph": emph, "brk": brk})
        hl = hl and not closes_hl
        emph = emph and not closes_em
        brk = False
    return words


def spoken(raw, say):
    core = raw.strip("".join(PUNCT))
    return raw.replace(core, say[core]) if core in say else raw


def synth_segment(kokoro, session, words, voice, speed, say):
    tok = kokoro.tokenizer
    tts_words = [spoken(w["raw"], say) for w in words]
    ph = tok.phonemize(" ".join(tts_words), "en-us")
    counts = [len(tok.phonemize(t, "en-us").split()) for t in tts_words]
    if sum(counts) != len(ph.split()):
        # fall back to per-word phonemes so the word mapping stays exact
        print(f"  ! phoneme/word mismatch, per-word phonemes for: {' '.join(tts_words)}")
        ph = " ".join(tok.phonemize(t, "en-us") for t in tts_words)
        counts = [len(tok.phonemize(t, "en-us").split()) for t in tts_words]

    chars = [c for c in ph if c in tok.vocab]
    ids = [tok.vocab[c] for c in chars]
    style = kokoro.get_voice_style(voice)[len(ids)].reshape(1, 256).astype(np.float32)
    audio, dur = session.run(
        None,
        {
            "tokens": np.array([[0, *ids, 0]], dtype=np.int64),
            "style": style,
            "speed": np.array([speed], dtype=np.float32),
        },
    )
    dur = dur.ravel().astype(np.int64)
    cum = np.concatenate([[0], np.cumsum(dur)]) * FRAME  # sample boundaries

    # phoneme-word index for every token (-1 = space / gap)
    pw_of_tok, pw = [], 0
    for c in chars:
        if c == " ":
            pw_of_tok.append(-1)
            pw += 1
        else:
            pw_of_tok.append(pw)

    # display word -> its phoneme-word indices
    owner, k = {}, 0
    for wi, n in enumerate(counts):
        for _ in range(n):
            owner[k] = wi
            k += 1

    spans = [[None, None] for _ in words]
    for ti, (c, p) in enumerate(zip(chars, pw_of_tok)):
        if p < 0 or c in PUNCT:
            continue
        wi = owner[p]
        s, e = int(cum[ti + 1]), int(cum[ti + 2])
        spans[wi][0] = s if spans[wi][0] is None else min(spans[wi][0], s)
        spans[wi][1] = e if spans[wi][1] is None else max(spans[wi][1], e)
    # per-phoneme timing (for avatar lip-sync); spaces are gaps
    phones = [(c, int(cum[ti + 1]), int(cum[ti + 2])) for ti, c in enumerate(chars) if c != " "]
    return audio.astype(np.float32), spans, phones


def fade(x, n_in, n_out):
    if n_in:
        x[:n_in] *= np.linspace(0, 1, n_in)
    if n_out:
        x[-n_out:] *= np.linspace(1, 0, n_out)
    return x


def main(video_dir):
    video_dir = Path(video_dir)
    cfg = json.loads((video_dir / "script.json").read_text())
    dur_model = ensure_models()
    kokoro = Kokoro(str(MODEL_DIR / "kokoro-v1.0.onnx"), str(MODEL_DIR / "voices-v1.0.bin"))
    session = ort.InferenceSession(str(dur_model))
    voice, speed, say = cfg["voice"], cfg.get("speed", 1.0), cfg.get("say", {})

    t = cfg.get("leadIn", 0.0)
    pieces, out_words, out_segs, out_phones = [], [], [], []
    for si, seg in enumerate(cfg["segments"]):
        words = parse_segment(seg["text"])
        audio, spans, phones = synth_segment(kokoro, session, words, voice, speed, say)
        start = max(0, spans[0][0] - int(0.02 * SR))
        end = min(len(audio), spans[-1][1] + int(0.09 * SR))
        clip = fade(audio[start:end].copy(), int(0.004 * SR), int(0.015 * SR))
        offset = t - start / SR
        pieces.append((int(round(t * SR)), clip))
        for w, (s, e) in zip(words, spans):
            out_words.append({
                "text": w["raw"],
                "start": round(offset + s / SR, 3),
                "end": round(offset + e / SR, 3),
                "seg": si,
                "hl": w["hl"],
                "emph": w["emph"],
                "brk": w["brk"],
            })
        for c, ps, pe in phones:
            if start <= ps < end:
                out_phones.append([c, round(offset + ps / SR, 3), round(offset + min(pe, end) / SR, 3)])
        seg_end = t + len(clip) / SR
        out_segs.append({
            "index": si,
            "text": re.sub(r"[\[\]{}|]", "", seg["text"]).replace("  ", " ").strip(),
            "start": round(t, 3),
            "end": round(seg_end, 3),
        })
        t = seg_end + seg.get("pause", 0.12)
        print(f"  seg {si:2d} {out_segs[-1]['start']:6.2f}-{out_segs[-1]['end']:6.2f}  {out_segs[-1]['text']}")

    total = t + cfg.get("tail", 0.8)
    track = np.zeros(int(round(total * SR)) + 1, dtype=np.float32)
    for pos, clip in pieces:
        track[pos:pos + len(clip)] += clip
    peak = float(np.max(np.abs(track))) or 1.0
    track *= 0.89 / peak  # -1 dBFS peak; loudness is set in the final mix

    sf.write(video_dir / "voice.wav", track, SR, subtype="PCM_16")
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(video_dir / "voice.wav"),
         "-codec:a", "libmp3lame", "-b:a", "192k", str(video_dir / "voice.mp3")],
        check=True,
    )
    (video_dir / "timestamps.json").write_text(json.dumps({
        "engine": f"kokoro-v1.0:{voice}@{speed}",
        "sampleRate": SR,
        "duration": round(total, 3),
        "segments": out_segs,
        "words": out_words,
        "phones": out_phones,
    }, indent=1))
    print(f"done: {total:.2f}s, {len(out_words)} words")


if __name__ == "__main__":
    main(sys.argv[1])
