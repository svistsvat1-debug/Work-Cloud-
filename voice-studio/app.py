#!/usr/bin/env python3
"""Voice Studio: English text -> natural male voiceover, fully local.

Engine: Kokoro-82M through kokoro-onnx. The model weights are Apache-2.0,
so the generated audio can be used commercially (YouTube monetization included).
Everything runs on this computer: no account, no API key, no limits.

Run:  python app.py        (or double-click start.bat / start.command)
Then the browser opens http://127.0.0.1:8765
"""
import json
import re
import sys
import threading
import time
import unicodedata
import urllib.request
import uuid
import webbrowser
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from io import BytesIO
from pathlib import Path
from urllib.parse import parse_qs, urlparse

import numpy as np
import soundfile as sf

try:
    import lameenc
except ImportError:  # MP3 export is optional, WAV always works
    lameenc = None

ROOT = Path(__file__).resolve().parent
MODEL_DIR = ROOT / "models"
SHARED_MODEL_DIR = Path.home() / ".cache" / "kokoro"  # same files tools/tts_kokoro.py uses
OUT_DIR = ROOT / "output"
PRON_FILE = ROOT / "pronunciations.json"
MODEL_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/"
MODEL_FILES = {"kokoro-v1.0.onnx": 300_000_000, "voices-v1.0.bin": 25_000_000}  # name -> min bytes
SR = 24000
PORTS = range(8765, 8776)
LEAD_IN, TAIL = 0.25, 0.5  # seconds of silence around the whole voiceover

# Male English voices of Kokoro v1.0. "top" = best rated by the model authors,
# "pitch" = measured median pitch of a test phrase (low < 105 Hz < mid < 130 Hz < higher).
VOICES = [
    {"id": "am_michael", "name": "Michael", "accent": "US", "pitch": "середній", "top": True},
    {"id": "am_fenrir", "name": "Fenrir", "accent": "US", "pitch": "вищий", "top": True},
    {"id": "am_puck", "name": "Puck", "accent": "US", "pitch": "середній", "top": True},
    {"id": "am_onyx", "name": "Onyx", "accent": "US", "pitch": "низький", "top": False},
    {"id": "am_adam", "name": "Adam", "accent": "US", "pitch": "середній", "top": False},
    {"id": "am_echo", "name": "Echo", "accent": "US", "pitch": "середній", "top": False},
    {"id": "am_liam", "name": "Liam", "accent": "US", "pitch": "вищий", "top": False},
    {"id": "am_eric", "name": "Eric", "accent": "US", "pitch": "вищий", "top": False},
    {"id": "bm_george", "name": "George", "accent": "UK", "pitch": "вищий", "top": True},
    {"id": "bm_fable", "name": "Fable", "accent": "UK", "pitch": "середній", "top": True},
    {"id": "bm_lewis", "name": "Lewis", "accent": "UK", "pitch": "низький", "top": False},
    {"id": "bm_daniel", "name": "Daniel", "accent": "UK", "pitch": "середній", "top": False},
]
VOICE_IDS = {v["id"] for v in VOICES}
PREVIEW_TEXT = "Hey there. This is how I sound. Paste your script, and I'll read it for you."
DEFAULT_PRONUNCIATIONS = {"SaaS": "sass"}

kokoro = None
synth_lock = threading.Lock()
jobs = {}
preview_cache = {}


# ---------------------------------------------------------------- models

def ensure_models():
    """Return the folder with both model files, downloading them on first run."""
    for folder in (MODEL_DIR, SHARED_MODEL_DIR):
        if all((folder / n).exists() and (folder / n).stat().st_size >= s for n, s in MODEL_FILES.items()):
            return folder
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    print("Перший запуск: завантажую модель голосу (~350 MB, один раз)...")
    for name, min_size in MODEL_FILES.items():
        path = MODEL_DIR / name
        if path.exists() and path.stat().st_size >= min_size:
            continue
        part = path.with_suffix(path.suffix + ".part")

        def report(blocks, block_size, total, name=name):
            if total > 0:
                pct = min(100, blocks * block_size * 100 // total)
                print(f"\r  {name}: {pct}%", end="", flush=True)

        urllib.request.urlretrieve(MODEL_URL + name, part, report)
        print()
        part.replace(path)
    return MODEL_DIR


def load_engine():
    global kokoro
    from kokoro_onnx import Kokoro

    folder = ensure_models()
    print("Завантажую голосовий рушій...")
    kokoro = Kokoro(str(folder / "kokoro-v1.0.onnx"), str(folder / "voices-v1.0.bin"))


def voice_style(spec):
    """Resolve {voice, mix_voice, mix} into a style array and an espeak language."""
    voice = spec.get("voice", "am_michael")
    if voice not in VOICE_IDS:
        raise ValueError(f"Невідомий голос: {voice}")
    style = kokoro.get_voice_style(voice)
    mix_voice = spec.get("mix_voice")
    if mix_voice:
        if mix_voice not in VOICE_IDS:
            raise ValueError(f"Невідомий голос: {mix_voice}")
        weight = min(1.0, max(0.0, float(spec.get("mix", 0.5))))
        style = weight * style + (1 - weight) * kokoro.get_voice_style(mix_voice)
    lang = "en-gb" if voice.startswith("b") else "en-us"
    return np.asarray(style, dtype=np.float32), lang


# ---------------------------------------------------------------- text

ABBREVIATIONS = {
    "mr", "mrs", "ms", "dr", "st", "jr", "sr", "prof", "inc", "ltd", "co", "corp",
    "no", "vol", "fig", "mt", "dept", "approx", "u.s", "u.k", "a.m", "p.m", "e.g", "i.e", "vs",
}
SCALES = {
    "k": "thousand", "thousand": "thousand", "m": "million", "mn": "million", "million": "million",
    "b": "billion", "bn": "billion", "billion": "billion", "t": "trillion", "trillion": "trillion",
}
CURRENCIES = {"$": ("dollar", "dollars", "cent", "cents"),
              "€": ("euro", "euros", "cent", "cents"),
              "£": ("pound", "pounds", "penny", "pence")}
MONEY_RE = re.compile(
    r"([$€£])\s?(\d[\d,]*)(?:\.(\d+))?(?:\s?(thousand|million|billion|trillion)\b|([kmbt]n?)\b)?",
    re.IGNORECASE,
)
YEAR_RE = re.compile(
    r"\b(in|since|by|from|until|till|of|year|before|after|during|around|early|late|mid)"
    r"\s+(1[1-9]\d\d|20\d\d)\b(?!\s*%|[.,]\d)",
    re.IGNORECASE,
)
REPLACEMENTS = [
    (re.compile(r"\bvs\.?(?=\s)", re.I), "versus"),
    (re.compile(r"\be\.g\.,?", re.I), "for example,"),
    (re.compile(r"\bi\.e\.,?", re.I), "that is,"),
    (re.compile(r"\bapprox\.", re.I), "approximately"),
    (re.compile(r"\b24/7\b"), "twenty-four seven"),
    (re.compile(r"#(\d+)"), r"number \1"),
    (re.compile(r"\b(\d+)x\b"), r"\1 times"),
    (re.compile(r"\s&\s"), " and "),
    (re.compile(r"\bw/(?=\s)"), "with"),
]
END_PUNCT = re.compile(r"[.!?…][\"”’»)\]]*$")


def clean_markdown(text):
    """Drop the formatting people paste from ChatGPT or docs: headings, bullets, bold."""
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    lines = []
    for line in text.split("\n"):
        if re.fullmatch(r"\s*[-—_=*~]{3,}\s*", line):
            line = ""  # horizontal rule
        line = re.sub(r"^\s{0,3}(#{1,6}\s+|[-*•]\s+|>\s*)", "", line)
        line = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", line)
        line = re.sub(r"\*\*|__|[*`]", "", line)
        lines.append(" ".join(line.split()))
    return "\n".join(lines)


def apply_pronunciations(text, pronunciations):
    for word, say in pronunciations.items():
        if word.strip():
            text = re.sub(rf"(?<!\w){re.escape(word.strip())}(?!\w)", say, text)
    return text


def _money(m):
    sym, whole, frac, word_scale, letter_scale = m.groups()
    scale = word_scale or letter_scale
    one, many, cent, cents = CURRENCIES[sym]
    whole = whole.replace(",", "")
    if scale:
        num = whole + (f".{frac}" if frac else "")
        return f"{num} {SCALES[scale.lower()]} {many}"
    if frac and len(frac) == 2 and int(frac) > 0:
        c = int(frac)
        cent_words = f"{c} {cent if c == 1 else cents}"
        if int(whole) == 0:
            return cent_words
        return f"{whole} {one if whole == '1' else many} and {cent_words}"
    num = whole + (f".{frac}" if frac and int(frac) > 0 else "")
    return f"{num} {one if num == '1' else many}"


def _year(m):
    y = int(m.group(2))
    hi, lo = divmod(y, 100)
    if 2000 <= y <= 2009:
        words = str(y)  # "two thousand five"
    elif lo == 0:
        words = f"{hi} hundred"
    elif lo < 10:
        words = f"{hi} oh {lo}"
    else:
        words = f"{hi} {lo}"  # 2026 -> "twenty twenty-six"
    return f"{m.group(1)} {words}"


def normalize(text):
    """Rewrite things espeak reads badly: money, years, common abbreviations."""
    text = MONEY_RE.sub(_money, text)
    text = YEAR_RE.sub(_year, text)
    for pattern, repl in REPLACEMENTS:
        text = pattern.sub(repl, text)
    return text


def split_sentences(par):
    out, start = [], 0
    for m in re.finditer(r"[.!?…]+[\"”’»)\]]*(?=\s|$)", par):
        words = par[start:m.start()].split()
        last = words[-1].lower() if words else ""
        if m.group().rstrip("\"”’»)]") == "." and (
            last in ABBREVIATIONS or (len(last) == 1 and last.isalpha())
        ):
            continue  # "Dr. Smith", "U.S. market", initials
        out.append(par[start:m.end()].strip())
        start = m.end()
    out.append(par[start:].strip())
    return [s for s in out if s]


def foreign_words(text, limit=3):
    """Words with non-Latin letters: espeak would spell them out letter by letter."""
    found = []
    for word in re.findall(r"\w+", text):
        if any(ch.isalpha() and "LATIN" not in unicodedata.name(ch, "") for ch in word):
            if word not in found:
                found.append(word)
            if len(found) == limit:
                break
    return found


def build_script(text, pronunciations):
    """Text -> paragraphs of (shown, spoken) sentence pairs.

    "shown" is the sentence as written (for subtitles), "spoken" is what the
    voice reads after the pronunciation dictionary and normalization.
    """
    paragraphs = []
    for block in re.split(r"\n\s*\n", clean_markdown(text)):
        lines = [ln for ln in block.split("\n") if ln.strip()]
        # A line that stops mid-sentence and continues in lowercase is a wrapped line
        merged = []
        for ln in lines:
            if merged and not END_PUNCT.search(merged[-1]) and ln[:1].islower():
                merged[-1] += " " + ln
            else:
                merged.append(ln)
        # Very short sentences sound clipped on their own, so they ride with the next one
        grouped = []
        for ln in merged:
            for s in split_sentences(ln):
                if grouped and len(grouped[-1].split()) < 3:
                    grouped[-1] += " " + s
                else:
                    grouped.append(s)
        pairs = []
        for shown in grouped:
            spoken = normalize(apply_pronunciations(shown, pronunciations))
            if not re.search(r"[A-Za-z0-9]", spoken):
                continue  # stray "..." has nothing to say
            if not END_PUNCT.search(spoken):
                spoken += "."  # a heading without a full stop otherwise ends on a rising tone
            pairs.append((shown, spoken))
        if pairs:
            paragraphs.append(pairs)
    return paragraphs


# ---------------------------------------------------------------- audio

def to_int16(audio):
    return (np.clip(audio, -1.0, 1.0) * 32767).astype(np.int16)


def normalize_peak(audio, peak_db=-1.0):
    peak = float(np.max(np.abs(audio))) if audio.size else 0.0
    return audio * (10 ** (peak_db / 20) / peak) if peak > 0 else audio


def wav_bytes(audio):
    buf = BytesIO()
    sf.write(buf, to_int16(audio), SR, format="WAV", subtype="PCM_16")
    return buf.getvalue()


def mp3_bytes(audio):
    enc = lameenc.Encoder()
    enc.set_bit_rate(128)
    enc.set_in_sample_rate(SR)
    enc.set_channels(1)
    enc.set_quality(2)
    return bytes(enc.encode(to_int16(audio).tobytes()) + enc.flush())


def srt_time(t):
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3_600_000)
    m, ms = divmod(ms, 60_000)
    s, ms = divmod(ms, 1000)
    return f"{h:02}:{m:02}:{s:02},{ms:03}"


def wrap_two_lines(text, width=42):
    if len(text) <= width or " " not in text:
        return text
    mid = len(text) // 2
    cut = min((i for i, ch in enumerate(text) if ch == " "), key=lambda i: abs(i - mid))
    return text[:cut] + "\n" + text[cut + 1:]


def srt_cues(sentence, start, end, max_chars=84):
    """Split a sentence into evenly sized subtitle cues, timed by their share of characters."""
    words = sentence.split()
    n = max(1, -(-len(sentence) // max_chars))
    ends, pos = [], 0
    for w in words:
        pos += len(w) + 1
        ends.append(pos)
    parts, first = [], 0
    for k in range(1, n):
        if first >= len(words) - 1:
            break
        target = pos * k / n
        # Break nearest the even split, preferring a spot right after a comma
        cut = min(range(first, len(words) - 1),
                  key=lambda i: abs(ends[i] - target) - (12 if words[i][-1] in ",;:—" else 0))
        parts.append(" ".join(words[first:cut + 1]))
        first = cut + 1
    parts.append(" ".join(words[first:]))
    total = sum(len(p) for p in parts) or 1
    cues, t = [], start
    for p in parts:
        dt = (end - start) * len(p) / total
        cues.append((t, t + dt, wrap_two_lines(p)))
        t += dt
    return cues


def slug(text, words=5):
    ascii_text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    parts = re.findall(r"[A-Za-z0-9]+", ascii_text)[:words]
    return "-".join(parts).lower() or "voice"


# ---------------------------------------------------------------- jobs

def run_job(job, text, spec, speed, sentence_pause, paragraph_pause, pronunciations):
    try:
        style, lang = voice_style(spec)
        paragraphs = build_script(text, pronunciations)
        total = sum(len(p) for p in paragraphs)
        if not total:
            raise ValueError("Немає тексту для озвучки")
        job["total"] = total
        silence = lambda sec: np.zeros(int(sec * SR), dtype=np.float32)
        parts, cues, offset = [silence(LEAD_IN)], [], LEAD_IN
        with synth_lock:
            for pi, paragraph in enumerate(paragraphs):
                for si, (shown, spoken) in enumerate(paragraph):
                    if job["cancel"]:
                        job["status"] = "cancelled"
                        return
                    audio, _ = kokoro.create(spoken, voice=style, speed=speed, lang=lang)
                    audio = np.asarray(audio, dtype=np.float32)
                    dur = len(audio) / SR
                    cues += srt_cues(shown, offset, offset + dur)
                    parts.append(audio)
                    offset += dur
                    last_in_par = si == len(paragraph) - 1
                    if not (last_in_par and pi == len(paragraphs) - 1):
                        gap = paragraph_pause if last_in_par else sentence_pause
                        parts.append(silence(gap))
                        offset += gap
                    job["done"] += 1
        parts.append(silence(TAIL))
        audio = normalize_peak(np.concatenate(parts))

        OUT_DIR.mkdir(exist_ok=True)
        base = f"{datetime.now():%Y-%m-%d_%H%M%S}_{slug(text)}"
        (OUT_DIR / f"{base}.wav").write_bytes(wav_bytes(audio))
        files = {"wav": f"{base}.wav"}
        if lameenc:
            (OUT_DIR / f"{base}.mp3").write_bytes(mp3_bytes(audio))
            files["mp3"] = f"{base}.mp3"
        srt = "\n".join(
            f"{i}\n{srt_time(a)} --> {srt_time(b)}\n{line}\n" for i, (a, b, line) in enumerate(cues, 1)
        )
        (OUT_DIR / f"{base}.srt").write_text(srt, encoding="utf-8")
        files["srt"] = f"{base}.srt"
        (OUT_DIR / f"{base}.txt").write_text(text, encoding="utf-8")
        job.update(status="done", files=files, duration=round(len(audio) / SR, 1),
                   seconds=round(time.time() - job["started"], 1))
    except Exception as e:  # shown to the user in the page
        job.update(status="error", error=str(e))


def history(limit=20):
    if not OUT_DIR.exists():
        return []
    items = []
    for wav in sorted(OUT_DIR.glob("*.wav"), key=lambda p: p.stat().st_mtime, reverse=True)[:limit]:
        base = wav.stem
        try:
            duration = round(sf.info(str(wav)).duration, 1)
        except RuntimeError:
            continue
        txt = OUT_DIR / f"{base}.txt"
        preview = txt.read_text(encoding="utf-8")[:120] if txt.exists() else ""
        files = {ext: f"{base}.{ext}" for ext in ("wav", "mp3", "srt") if (OUT_DIR / f"{base}.{ext}").exists()}
        items.append({"base": base, "duration": duration, "text": preview, "files": files})
    return items


def load_pronunciations():
    if not PRON_FILE.exists():
        PRON_FILE.write_text(json.dumps(DEFAULT_PRONUNCIATIONS, indent=2, ensure_ascii=False), encoding="utf-8")
    try:
        return json.loads(PRON_FILE.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return dict(DEFAULT_PRONUNCIATIONS)


# ---------------------------------------------------------------- web

CONTENT_TYPES = {".wav": "audio/wav", ".mp3": "audio/mpeg", ".srt": "application/x-subrip; charset=utf-8",
                 ".txt": "text/plain; charset=utf-8"}


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass  # keep the console readable

    def send(self, code, body, ctype="application/json; charset=utf-8", headers=None):
        if isinstance(body, (dict, list)):
            body = json.dumps(body, ensure_ascii=False).encode()
        elif isinstance(body, str):
            body = body.encode()
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        for k, v in (headers or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body)

    def read_json(self):
        length = int(self.headers.get("Content-Length") or 0)
        return json.loads(self.rfile.read(length) or b"{}")

    def do_GET(self):
        url = urlparse(self.path)
        path = url.path
        if path in ("/", "/index.html"):
            return self.send(200, (ROOT / "index.html").read_bytes(), "text/html; charset=utf-8")
        if path == "/api/config":
            return self.send(200, {"voices": VOICES, "mp3": lameenc is not None,
                                   "pronunciations": load_pronunciations(), "output_dir": str(OUT_DIR)})
        if path == "/api/history":
            return self.send(200, history())
        if path.startswith("/api/job/"):
            job = jobs.get(path.rsplit("/", 1)[-1])
            if not job:
                return self.send(404, {"error": "job not found"})
            return self.send(200, {k: v for k, v in job.items() if k != "cancel"})
        if path.startswith("/files/"):
            name = path[len("/files/"):]
            file = (OUT_DIR / name).resolve()
            if not re.fullmatch(r"[\w.\-]+", name) or file.parent != OUT_DIR.resolve() or not file.is_file():
                return self.send(404, {"error": "file not found"})
            headers = {}
            if "dl" in parse_qs(url.query):
                headers["Content-Disposition"] = f'attachment; filename="{name}"'
            return self.send(200, file.read_bytes(), CONTENT_TYPES.get(file.suffix, "application/octet-stream"), headers)
        self.send(404, {"error": "not found"})

    def do_POST(self):
        path = urlparse(self.path).path
        try:
            data = self.read_json()
        except ValueError:
            return self.send(400, {"error": "bad json"})
        try:
            if path == "/api/generate":
                text = str(data.get("text", "")).strip()
                if not text:
                    return self.send(400, {"error": "Вставте текст"})
                foreign = foreign_words(apply_pronunciations(text, load_pronunciations()))
                if foreign:
                    return self.send(400, {"error": "Програма читає лише англійський текст. Замініть або видаліть: "
                                                    + ", ".join(foreign)})
                speed = min(1.5, max(0.6, float(data.get("speed", 1.0))))
                sentence_pause = min(2.0, max(0.0, float(data.get("sentence_pause", 0.35))))
                paragraph_pause = min(3.0, max(0.0, float(data.get("paragraph_pause", 0.8))))
                voice_style(data)  # validate before queuing
                job_id = uuid.uuid4().hex[:12]
                jobs[job_id] = {"id": job_id, "status": "running", "done": 0, "total": 0,
                                "cancel": False, "started": time.time()}
                threading.Thread(
                    target=run_job, daemon=True,
                    args=(jobs[job_id], text, data, speed, sentence_pause, paragraph_pause, load_pronunciations()),
                ).start()
                return self.send(200, {"job": job_id})
            if path.startswith("/api/cancel/"):
                job = jobs.get(path.rsplit("/", 1)[-1])
                if job:
                    job["cancel"] = True
                return self.send(200, {"ok": True})
            if path == "/api/preview":
                speed = min(1.5, max(0.6, float(data.get("speed", 1.0))))
                key = (data.get("voice"), data.get("mix_voice"), round(float(data.get("mix", 0.5)), 2), round(speed, 2))
                if key not in preview_cache:
                    style, lang = voice_style(data)
                    audio, _ = kokoro.create(PREVIEW_TEXT, voice=style, speed=speed, lang=lang)
                    preview_cache[key] = wav_bytes(normalize_peak(np.asarray(audio, dtype=np.float32)))
                return self.send(200, preview_cache[key], "audio/wav")
            if path == "/api/pronunciations":
                pron = {str(k).strip(): str(v).strip() for k, v in dict(data).items() if str(k).strip() and str(v).strip()}
                PRON_FILE.write_text(json.dumps(pron, indent=2, ensure_ascii=False), encoding="utf-8")
                return self.send(200, pron)
        except (ValueError, TypeError) as e:
            return self.send(400, {"error": str(e)})
        self.send(404, {"error": "not found"})


def main():
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8")
        except (AttributeError, ValueError):
            pass
    load_engine()
    server = None
    for port in PORTS:
        try:
            server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
            break
        except OSError:
            continue
    if not server:
        sys.exit(f"Порти {PORTS.start}-{PORTS.stop - 1} зайняті. Закрийте інший Voice Studio і спробуйте ще раз.")
    url = f"http://127.0.0.1:{server.server_port}"
    print(f"\nVoice Studio працює: {url}")
    print("Готові файли зберігаються в:", OUT_DIR)
    print("Щоб зупинити програму, закрийте це вікно або натисніть Ctrl+C.\n")
    if "--no-browser" not in sys.argv:
        threading.Timer(0.5, webbrowser.open, args=(url,)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("Зупинено.")


if __name__ == "__main__":
    main()
