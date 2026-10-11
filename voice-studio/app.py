#!/usr/bin/env python3
"""Voice Studio: text -> natural male voiceover in English, German and Spanish.

Runs fully on this computer; a phone on the same Wi-Fi can use it too (QR code in the app).
Every model allows commercial use, so the audio can go into monetized videos:

  English, Spanish "Alex"   Kokoro-82M v1.0      Apache-2.0 weights
  German "Thorsten"         Piper voice          Thorsten-Voice dataset, CC0
  Spanish "Dave", "Ald"     Piper voices         davefx (CC0) / ald (Unlicense) datasets

Run:  python app.py        (or double-click start.bat / start.command)
Then the browser opens http://127.0.0.1:8765
"""
import ipaddress
import json
import re
import secrets
import socket
import sys
import tarfile
import tempfile
import threading
import time
import unicodedata
import urllib.request
import uuid
import webbrowser
from datetime import datetime
from http.cookies import SimpleCookie
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
try:
    import segno
except ImportError:  # only the QR code for phones needs it
    segno = None

ROOT = Path(__file__).resolve().parent
MODEL_DIR = ROOT / "models"
SHARED_MODEL_DIR = Path.home() / ".cache" / "kokoro"  # same files tools/tts_kokoro.py uses
OUT_DIR = ROOT / "output"
PRON_FILE = ROOT / "pronunciations.json"
SETTINGS_FILE = ROOT / "settings.json"
KOKORO_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/"
PIPER_URL = "https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/vits-piper-{}.tar.bz2"
PORTS = range(8765, 8776)
LEAD_IN, TAIL = 0.25, 0.5  # seconds of silence around the whole voiceover

LANGS = [
    {"id": "en", "name": "English", "label": "Англійська", "text": "англійський"},
    {"id": "de", "name": "Deutsch", "label": "Німецька", "text": "німецький"},
    {"id": "es", "name": "Español", "label": "Іспанська", "text": "іспанський"},
]
PREVIEW_TEXT = {
    "en": "Hey there. This is how I sound. Paste your script, and I'll read it for you.",
    "de": "Hallo! So klinge ich. Füge deinen Text ein, und ich lese ihn dir vor.",
    "es": "¡Hola! Así suena mi voz. Pega tu texto y yo lo leeré por ti.",
}


def _voice(id, lang, engine, name, accent, pitch, top=False, espeak=None):
    return {"id": id, "lang": lang, "engine": engine, "name": name, "accent": accent,
            "pitch": pitch, "top": top, "espeak": espeak}


# "top" = best rated by the Kokoro authors. "pitch" = measured median pitch of a test phrase.
VOICES = [
    _voice("am_michael", "en", "kokoro", "Michael", "US", "середній", True, "en-us"),
    _voice("am_fenrir", "en", "kokoro", "Fenrir", "US", "вищий", True, "en-us"),
    _voice("am_puck", "en", "kokoro", "Puck", "US", "середній", True, "en-us"),
    _voice("am_onyx", "en", "kokoro", "Onyx", "US", "низький", False, "en-us"),
    _voice("am_adam", "en", "kokoro", "Adam", "US", "середній", False, "en-us"),
    _voice("am_echo", "en", "kokoro", "Echo", "US", "середній", False, "en-us"),
    _voice("am_liam", "en", "kokoro", "Liam", "US", "вищий", False, "en-us"),
    _voice("am_eric", "en", "kokoro", "Eric", "US", "вищий", False, "en-us"),
    _voice("bm_george", "en", "kokoro", "George", "UK", "вищий", True, "en-gb"),
    _voice("bm_fable", "en", "kokoro", "Fable", "UK", "середній", True, "en-gb"),
    _voice("bm_lewis", "en", "kokoro", "Lewis", "UK", "низький", False, "en-gb"),
    _voice("bm_daniel", "en", "kokoro", "Daniel", "UK", "середній", False, "en-gb"),
    _voice("de_DE-thorsten-high", "de", "piper:de_DE-thorsten-high", "Thorsten", "Німеччина", "середній"),
    _voice("em_alex", "es", "kokoro", "Alex", "Іспанія", "вищий", False, "es"),
    _voice("es_ES-davefx-medium", "es", "piper:es_ES-davefx-medium", "Dave", "Іспанія", "середній"),
    _voice("es_MX-ald-medium", "es", "piper:es_MX-ald-medium", "Ald", "Мексика", "вищий"),
]
VOICE_BY_ID = {v["id"]: v for v in VOICES}
PIPER_SIZES_MB = {"de_DE-thorsten-high": 116, "es_ES-davefx-medium": 68, "es_MX-ald-medium": 68}
DEFAULT_PRONUNCIATIONS = {"SaaS": "sass"}

synth_lock = threading.Lock()  # one voiceover at a time keeps the CPU for it
espeak_lock = threading.RLock()  # espeak-ng is not thread-safe
jobs = {}
preview_cache = {}
settings = {}


# ---------------------------------------------------------------- engines

def fetch(url, dest, progress):
    """Download to dest through a .part file, so an interrupted download never looks complete."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    part = dest.with_name(dest.name + ".part")
    with urllib.request.urlopen(url, timeout=60) as r, open(part, "wb") as f:
        total, done = int(r.headers.get("Content-Length") or 0), 0
        while chunk := r.read(1 << 20):
            f.write(chunk)
            done += len(chunk)
            if total:
                progress(done / total)
    part.replace(dest)


_backends = {}


def espeak_phonemes(text, language):
    """IPA with stress marks from espeak-ng. Language flags for foreign words are dropped."""
    from phonemizer.backend import EspeakBackend

    with espeak_lock:
        if language not in _backends:
            if not _backends:
                import espeakng_loader
                from phonemizer.backend.espeak.wrapper import EspeakWrapper

                EspeakWrapper.set_library(espeakng_loader.get_library_path())
                EspeakWrapper.set_data_path(espeakng_loader.get_data_path())
            _backends[language] = EspeakBackend(language, preserve_punctuation=True, with_stress=True,
                                                language_switch="remove-flags")
        return _backends[language].phonemize([text], strip=True)[0]


def trim_silence(audio, sr, threshold_db=-45):
    """Cut leading and trailing silence so the pauses between sentences are exactly as set."""
    frame = sr // 100
    if len(audio) < frame * 3:
        return audio
    rms = np.sqrt(np.mean(audio[: len(audio) // frame * frame].reshape(-1, frame) ** 2, axis=1))
    loud = np.nonzero(rms > rms.max() * 10 ** (threshold_db / 20))[0]
    if not len(loud):
        return audio
    pad = 2  # frames
    return audio[max(0, loud[0] - pad) * frame: (loud[-1] + 1 + pad) * frame]


class Engine:
    mixable = False
    size_mb = 0
    sr = 24000
    verbose = False  # print download progress to the console (first start)

    def __init__(self, key):
        self.key = key
        self.state = "missing"
        self.pct = 0.0
        self.error = ""
        self._lock = threading.Lock()

    @property
    def ready(self):
        return self.state == "ready"

    def unavailable(self):
        return ""

    def installed(self):
        raise NotImplementedError

    def status(self):
        if self.unavailable():
            return {"state": "unavailable", "pct": 0, "error": self.unavailable(), "size_mb": self.size_mb}
        state = self.state
        if state == "missing" and self.installed():
            state = "installed"
        return {"state": state, "pct": round(self.pct * 100), "error": self.error, "size_mb": self.size_mb}

    def progress(self, p):
        self.pct = p
        if self.verbose:
            print(f"\r  {self.key}: {round(p * 100)}%", end="", flush=True)

    def ensure(self):
        """Download (first use only) and load the model. Safe to call from several threads."""
        with self._lock:
            if self.state == "ready":
                return
            if self.unavailable():
                raise RuntimeError(self.unavailable())
            try:
                if not self.installed():
                    self.state, self.pct = "downloading", 0.0
                    if self.verbose:
                        print(f"Перший запуск: завантажую модель голосу (~{self.size_mb} MB, один раз)...")
                    self.download()
                    if self.verbose:
                        print()
                self.state = "loading"
                self.load()
                self.state, self.error = "ready", ""
            except Exception as e:
                self.state, self.error = "error", f"Не вдалося підготувати модель: {e}"
                raise


class KokoroEngine(Engine):
    mixable = True

    def __init__(self, key, release, files, size_mb, folders):
        super().__init__(key)
        self.release, self.files, self.size_mb, self.folders = release, files, size_mb, folders
        self.kokoro = None

    def folder(self):
        for f in self.folders:
            if all((f / n).is_file() for n in self.files):
                return f
        return None

    def installed(self):
        return self.folder() is not None

    def download(self):
        onnx, voices = self.files
        for name, lo, hi in ((onnx, 0.0, 0.85), (voices, 0.85, 1.0)):
            if not (MODEL_DIR / name).is_file():
                fetch(KOKORO_URL + self.release + name, MODEL_DIR / name,
                      lambda p, lo=lo, hi=hi: self.progress(lo + p * (hi - lo)))

    def load(self):
        from kokoro_onnx import Kokoro

        folder = self.folder()
        self.kokoro = Kokoro(str(folder / self.files[0]), str(folder / self.files[1]))

    def style(self, spec):
        style = self.kokoro.get_voice_style(spec["voice"])
        if spec.get("mix_voice"):
            weight = min(1.0, max(0.0, float(spec.get("mix", 0.5))))
            style = weight * style + (1 - weight) * self.kokoro.get_voice_style(spec["mix_voice"])
        return np.asarray(style, dtype=np.float32)

    def known(self, phonemes):
        vocab = self.kokoro.tokenizer.vocab
        return "".join(p for p in phonemes if p in vocab).strip()

    def phonemes(self, text, voice):
        return self.known(espeak_phonemes(text, voice["espeak"]))

    def synth(self, text, spec, speed):
        phonemes = self.phonemes(text, VOICE_BY_ID[spec["voice"]])
        audio, _ = self.kokoro.create(phonemes, voice=self.style(spec), speed=speed, is_phonemes=True)
        return np.asarray(audio, dtype=np.float32)


class PiperEngine(Engine):
    def __init__(self, key, model):
        super().__init__(key)
        self.model = model
        self.size_mb = PIPER_SIZES_MB.get(model, 70)
        self.dir = MODEL_DIR / "piper" / model
        self.onnx = self.dir / f"{model}.onnx"
        self.config = self.dir / f"{model}.onnx.json"

    def installed(self):
        return self.onnx.is_file() and self.config.is_file()

    def download(self):
        wanted = {self.onnx.name, self.config.name, "MODEL_CARD"}
        with tempfile.TemporaryDirectory() as tmp:
            archive = Path(tmp) / "voice.tar.bz2"
            fetch(PIPER_URL.format(self.model), archive, lambda p: self.progress(p * 0.95))
            self.dir.mkdir(parents=True, exist_ok=True)
            with tarfile.open(archive, "r:bz2") as tar:
                for member in tar:
                    name = Path(member.name).name
                    if member.isfile() and name in wanted:
                        part = self.dir / (name + ".part")
                        part.write_bytes(tar.extractfile(member).read())
                        part.replace(self.dir / name)
        if not self.installed():
            raise RuntimeError("в архіві немає файлів моделі")

    def load(self):
        import onnxruntime as ort

        self.cfg = json.loads(self.config.read_text(encoding="utf-8"))
        self.sr = self.cfg["audio"]["sample_rate"]
        self.ids = self.cfg["phoneme_id_map"]
        self.session = ort.InferenceSession(str(self.onnx), providers=["CPUExecutionProvider"])

    def synth(self, text, spec, speed):
        # Same phoneme ids Piper was trained on: ^ _ p1 _ p2 _ ... $
        phonemes = unicodedata.normalize("NFD", espeak_phonemes(text, self.cfg["espeak"]["voice"]))
        m = self.ids
        ids = m["^"] + m["_"] + [i for ch in phonemes if ch in m for i in m[ch] + m["_"]] + m["$"]
        if len(ids) <= 3:
            raise ValueError("нічого озвучувати")
        inf = self.cfg["inference"]
        audio = self.session.run(None, {
            "input": np.array([ids], dtype=np.int64),
            "input_lengths": np.array([len(ids)], dtype=np.int64),
            "scales": np.array([inf["noise_scale"], inf["length_scale"] / speed, inf["noise_w"]], dtype=np.float32),
        })[0]
        return trim_silence(np.asarray(audio, dtype=np.float32).squeeze(), self.sr)


ENGINES = {
    "kokoro": KokoroEngine("kokoro", "model-files-v1.0/", ("kokoro-v1.0.onnx", "voices-v1.0.bin"), 350,
                           (MODEL_DIR, SHARED_MODEL_DIR)),
}
for _v in VOICES:
    if _v["engine"].startswith("piper:"):
        ENGINES.setdefault(_v["engine"], PiperEngine(_v["engine"], _v["engine"].split(":", 1)[1]))


def resolve(spec):
    """Validate a {voice, mix_voice, mix} request; return (voice, engine)."""
    voice = VOICE_BY_ID.get(spec.get("voice"))
    if not voice:
        raise ValueError(f"Невідомий голос: {spec.get('voice')}")
    mix = spec.get("mix_voice")
    if mix:
        other = VOICE_BY_ID.get(mix)
        if not other or other["engine"] != voice["engine"] or not ENGINES[voice["engine"]].mixable:
            raise ValueError("Ці два голоси не можна змішати")
    return voice, ENGINES[voice["engine"]]


# ---------------------------------------------------------------- text

ABBREVIATIONS = {
    "en": {"mr", "mrs", "ms", "dr", "st", "jr", "sr", "prof", "inc", "ltd", "co", "corp", "no", "vol",
           "fig", "mt", "dept", "approx", "u.s", "u.k", "a.m", "p.m", "e.g", "i.e", "vs"},
    "de": {"dr", "prof", "nr", "z.b", "bzw", "ca", "d.h", "u.a", "inkl", "ggf", "evtl", "st", "hr", "fr"},
    "es": {"sr", "sra", "srta", "dr", "dra", "ud", "uds", "p.ej", "ee.uu", "av", "núm", "prof"},
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
RULES = {
    "en": [
        (re.compile(r"\bvs\.?(?=\s)", re.I), "versus"),
        (re.compile(r"\be\.g\.,?", re.I), "for example,"),
        (re.compile(r"\bi\.e\.,?", re.I), "that is,"),
        (re.compile(r"\bapprox\.", re.I), "approximately"),
        (re.compile(r"\b24/7\b"), "twenty-four seven"),
        (re.compile(r"#(\d+)"), r"number \1"),
        (re.compile(r"\b(\d+)x\b"), r"\1 times"),
        (re.compile(r"\s&\s"), " and "),
        (re.compile(r"\bw/(?=\s)"), "with"),
    ],
    "de": [
        (re.compile(r"\bz\.\s?B\."), "zum Beispiel"),
        (re.compile(r"\bd\.\s?h\."), "das heißt"),
        (re.compile(r"\bu\.\s?a\."), "unter anderem"),
        (re.compile(r"\bbzw\."), "beziehungsweise"),
        (re.compile(r"\busw\."), "und so weiter."),
        (re.compile(r"\bca\."), "circa"),
        (re.compile(r"\bNr\."), "Nummer"),
        (re.compile(r"\bggf\."), "gegebenenfalls"),
        (re.compile(r"\binkl\."), "inklusive"),
        (re.compile(r"\bevtl\."), "eventuell"),
        (re.compile(r"\$\s?(\d[\d.,]*)"), r"\1 Dollar"),
        (re.compile(r"£\s?(\d[\d.,]*)"), r"\1 Pfund"),
        (re.compile(r"€\s?(\d[\d.,]*)"), r"\1 Euro"),
        (re.compile(r"(\d)\s?€"), r"\1 Euro"),
        (re.compile(r"#(\d+)"), r"Nummer \1"),
        (re.compile(r"\s&\s"), " und "),
    ],
    "es": [
        (re.compile(r"(?<=\d)\.(?=\d{3}(?!\d))"), ""),  # 1.500 -> 1500 (Spanish thousands separator)
        (re.compile(r"\bp\.\s?ej\.", re.I), "por ejemplo"),
        (re.compile(r"\bEE\.\s?UU\."), "Estados Unidos"),
        (re.compile(r"\bSrta\."), "señorita"),
        (re.compile(r"\bSra\."), "señora"),
        (re.compile(r"\bSr\."), "señor"),
        (re.compile(r"\bUds\."), "ustedes"),
        (re.compile(r"\bUd\."), "usted"),
        (re.compile(r"\$\s?(\d[\d.,]*)"), r"\1 dólares"),
        (re.compile(r"£\s?(\d[\d.,]*)"), r"\1 libras"),
        (re.compile(r"€\s?(\d[\d.,]*)"), r"\1 euros"),
        (re.compile(r"(\d)\s?€"), r"\1 euros"),
        (re.compile(r"#(\d+)"), r"número \1"),
        (re.compile(r"\s&\s"), " y "),
    ],
}
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


def normalize(text, lang):
    """Rewrite what espeak reads badly: money, years, common abbreviations."""
    if lang == "en":
        text = MONEY_RE.sub(_money, text)
        text = YEAR_RE.sub(_year, text)
    for pattern, repl in RULES.get(lang, []):
        text = pattern.sub(repl, text)
    return text


def split_sentences(par, lang):
    abbreviations = ABBREVIATIONS.get(lang, set())
    out, start = [], 0
    for m in re.finditer(r"[.!?…]+[\"”’»)\]]*(?=\s|$)", par):
        words = par[start:m.start()].split()
        last = words[-1].lower() if words else ""
        following = par[m.end():].lstrip()[:1]
        if m.group().rstrip("\"”’»)]") == "." and (
            last in abbreviations or (len(last) == 1 and last.isalpha()) or following.islower()
        ):
            continue  # "Dr. Smith", "z. B. heute", initials, "etc. and more"
        out.append(par[start:m.end()].strip())
        start = m.end()
    out.append(par[start:].strip())
    return [s for s in out if s]


def build_script(text, lang, pronunciations):
    """Text -> paragraphs of (shown, spoken) sentence pairs.

    "shown" is the sentence as written (for subtitles), "spoken" is what the
    voice reads after the pronunciation dictionary and normalization.
    """
    end_punct = END_PUNCT
    paragraphs = []
    for block in re.split(r"\n\s*\n", clean_markdown(text)):
        lines = [ln for ln in block.split("\n") if ln.strip()]
        # A line that stops mid-sentence and continues in lowercase is a wrapped line
        merged = []
        for ln in lines:
            if merged and not end_punct.search(merged[-1]) and ln[:1].islower():
                merged[-1] += " " + ln
            else:
                merged.append(ln)
        # Very short sentences sound clipped on their own, so they ride with the next one
        grouped = []
        for ln in merged:
            for s in split_sentences(ln, lang):
                if grouped and len(grouped[-1].split()) < 3:
                    grouped[-1] += " " + s
                else:
                    grouped.append(s)
        pairs = []
        for shown in grouped:
            spoken = normalize(apply_pronunciations(shown, pronunciations), lang)
            if not re.search(r"[^\W_]", spoken):
                continue  # stray "..." has nothing to say
            if not end_punct.search(spoken):
                spoken += "."  # otherwise it ends on a rising tone
            pairs.append((shown, spoken))
        if pairs:
            paragraphs.append(pairs)
    return paragraphs


def foreign_words(text, lang, limit=3):
    """Words in a script the voice can't read: espeak would spell them letter by letter."""
    found = []
    for word in re.findall(r"\w+", text):
        for ch in word:
            name = unicodedata.name(ch, "")
            if ch.isalpha() and "LATIN" not in name:
                if word not in found:
                    found.append(word)
                break
        if len(found) == limit:
            break
    return found


# ---------------------------------------------------------------- audio + subtitles

def to_int16(audio):
    return (np.clip(audio, -1.0, 1.0) * 32767).astype(np.int16)


def normalize_peak(audio, peak_db=-1.0):
    peak = float(np.max(np.abs(audio))) if audio.size else 0.0
    return audio * (10 ** (peak_db / 20) / peak) if peak > 0 else audio


def wav_bytes(audio, sr):
    buf = BytesIO()
    sf.write(buf, to_int16(audio), sr, format="WAV", subtype="PCM_16")
    return buf.getvalue()


def mp3_bytes(audio, sr):
    enc = lameenc.Encoder()
    enc.set_bit_rate(128)
    enc.set_in_sample_rate(sr)
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


def split_even(units, n, joiner, soft):
    """Split units (words or characters) into n parts of similar length, preferring soft breaks."""
    ends, pos = [], 0
    for u in units:
        pos += len(u) + len(joiner)
        ends.append(pos)
    parts, first = [], 0
    for k in range(1, n):
        if first >= len(units) - 1:
            break
        target = pos * k / n
        cut = min(range(first, len(units) - 1),
                  key=lambda i: abs(ends[i] - target) - (12 if units[i][-1] in soft else 0))
        parts.append(joiner.join(units[first:cut + 1]))
        first = cut + 1
    parts.append(joiner.join(units[first:]))
    return [p for p in parts if p]


def srt_cues(sentence, start, end, lang):
    """Split a sentence into evenly sized subtitle cues, timed by their share of characters."""
    parts = [wrap_two_lines(p) for p in split_even(sentence.split(), max(1, -(-len(sentence) // 84)), " ", ",;:—")]
    total = sum(len(p) for p in parts) or 1
    cues, t = [], start
    for p in parts:
        dt = (end - start) * len(p) / total
        cues.append((t, t + dt, p))
        t += dt
    return cues


def slug(text, words=5):
    ascii_text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    parts = re.findall(r"[A-Za-z0-9]+", ascii_text)[:words]
    return "-".join(parts).lower() or "voice"


# ---------------------------------------------------------------- jobs

def run_job(job, text, spec, speed, sentence_pause, paragraph_pause, pronunciations):
    try:
        voice, engine = resolve(spec)
        if not engine.ready:
            job["status"] = "preparing"
            engine.ensure()
        job["status"] = "running"
        lang = voice["lang"]
        paragraphs = build_script(text, lang, pronunciations)
        items = []
        for pi, paragraph in enumerate(paragraphs):
            for si, (shown, spoken) in enumerate(paragraph):
                last_in_par = si == len(paragraph) - 1
                gap = 0.0 if last_in_par and pi == len(paragraphs) - 1 else (
                    paragraph_pause if last_in_par else sentence_pause)
                items.append((shown, spoken, gap))
        if not items:
            raise ValueError("Немає тексту для озвучки")
        job["total"] = len(items)

        sr = engine.sr
        silence = lambda sec: np.zeros(int(sec * sr), dtype=np.float32)
        parts, cues, offset = [silence(LEAD_IN)], [], LEAD_IN
        with synth_lock:
            for shown, spoken, gap in items:
                if job["cancel"]:
                    job["status"] = "cancelled"
                    return
                try:
                    audio = engine.synth(spoken, spec, speed)
                except ValueError:
                    job["skipped"] += 1  # a fragment the voice has no sounds for
                    job["done"] += 1
                    continue
                dur = len(audio) / sr
                cues += srt_cues(shown, offset, offset + dur, lang)
                parts += [audio, silence(gap)]
                offset += dur + gap
                job["done"] += 1
        if not cues:
            raise ValueError("Не вдалося озвучити жодного речення")
        parts.append(silence(TAIL))
        audio = normalize_peak(np.concatenate(parts))

        OUT_DIR.mkdir(exist_ok=True)
        base = f"{datetime.now():%Y-%m-%d_%H%M%S}_{lang}_{slug(text)}"
        (OUT_DIR / f"{base}.wav").write_bytes(wav_bytes(audio, sr))
        files = {"wav": f"{base}.wav"}
        if lameenc:
            (OUT_DIR / f"{base}.mp3").write_bytes(mp3_bytes(audio, sr))
            files["mp3"] = f"{base}.mp3"
        srt = "\n".join(
            f"{i}\n{srt_time(a)} --> {srt_time(b)}\n{line}\n" for i, (a, b, line) in enumerate(cues, 1)
        )
        (OUT_DIR / f"{base}.srt").write_text(srt, encoding="utf-8")
        files["srt"] = f"{base}.srt"
        meta = {"text": text, "lang": lang, "voice": spec.get("voice"), "mix_voice": spec.get("mix_voice"),
                "mix": spec.get("mix"), "speed": speed}
        (OUT_DIR / f"{base}.json").write_text(json.dumps(meta, ensure_ascii=False, indent=1), encoding="utf-8")
        job.update(status="done", files=files, duration=round(len(audio) / sr, 1),
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
        meta_file = OUT_DIR / f"{base}.json"
        try:
            meta = json.loads(meta_file.read_text(encoding="utf-8")) if meta_file.exists() else {}
        except ValueError:
            meta = {}
        files = {ext: f"{base}.{ext}" for ext in ("wav", "mp3", "srt") if (OUT_DIR / f"{base}.{ext}").exists()}
        items.append({"base": base, "duration": duration, "text": meta.get("text", "")[:140],
                      "lang": meta.get("lang", ""), "voice": meta.get("voice", ""), "files": files})
    return items


def load_pronunciations():
    if not PRON_FILE.exists():
        PRON_FILE.write_text(json.dumps(DEFAULT_PRONUNCIATIONS, indent=2, ensure_ascii=False), encoding="utf-8")
    try:
        return json.loads(PRON_FILE.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return dict(DEFAULT_PRONUNCIATIONS)


def load_settings():
    try:
        data = json.loads(SETTINGS_FILE.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        data = {}
    if not data.get("access_key"):
        data["access_key"] = secrets.token_urlsafe(12)  # phone access is only for whoever has the QR code
        SETTINGS_FILE.write_text(json.dumps(data, indent=2), encoding="utf-8")
    return data


# ---------------------------------------------------------------- phone access

def lan_ip():
    """This computer's address in the local Wi-Fi network (no packet is actually sent)."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("10.255.255.255", 1))
        ip = s.getsockname()[0]
    except OSError:
        return None
    finally:
        s.close()
    return None if ip.startswith("127.") else ip


def phone_url(port):
    ip = lan_ip()
    return f"http://{ip}:{port}/?key={settings['access_key']}" if ip else None


def is_ip(host):
    try:
        ipaddress.ip_address(host)
        return True
    except ValueError:
        return False


# ---------------------------------------------------------------- web

CONTENT_TYPES = {".wav": "audio/wav", ".mp3": "audio/mpeg", ".srt": "application/x-subrip; charset=utf-8"}
FORBIDDEN_PAGE = """<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Voice Studio</title><body style="font:17px system-ui;padding:24px;max-width:480px;margin:auto">
<h2>Потрібен QR-код</h2><p>Відкрийте Voice Studio на комп'ютері, натисніть «З телефону»
і відскануйте QR-код камерою телефону.</p></body>"""


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

    def is_local(self):
        return ipaddress.ip_address(self.client_address[0]).is_loopback

    def given_key(self):
        key = parse_qs(urlparse(self.path).query).get("key", [""])[0]
        if not key:
            cookie = SimpleCookie(self.headers.get("Cookie") or "")
            key = cookie["vs_key"].value if "vs_key" in cookie else ""
        return key

    def allowed(self):
        # A page on some website can't reach us through a DNS name pointed at this computer
        host = (self.headers.get("Host") or "").rsplit(":", 1)[0].strip("[]").lower()
        if host != "localhost" and not is_ip(host):
            self.send(403, {"error": "bad host"})
            return False
        if self.is_local() or secrets.compare_digest(self.given_key(), settings["access_key"]):
            return True
        self.send(403, FORBIDDEN_PAGE, "text/html; charset=utf-8")
        return False

    def read_json(self):
        length = int(self.headers.get("Content-Length") or 0)
        return json.loads(self.rfile.read(length) or b"{}")

    def do_GET(self):
        if not self.allowed():
            return
        url = urlparse(self.path)
        path = url.path
        if path in ("/", "/index.html"):
            headers = {}
            if not self.is_local() and "key=" in url.query:
                headers["Set-Cookie"] = (f"vs_key={settings['access_key']}; Path=/; Max-Age=31536000; "
                                         "SameSite=Strict; HttpOnly")
            return self.send(200, (ROOT / "index.html").read_bytes(), "text/html; charset=utf-8", headers)
        if path == "/api/config":
            return self.send(200, {
                "langs": LANGS, "voices": VOICES, "mp3": lameenc is not None,
                "engines": {k: e.status() for k, e in ENGINES.items()},
                "pronunciations": load_pronunciations(), "output_dir": str(OUT_DIR),
                "is_local": self.is_local(), "phone": segno is not None and self.server.phone,
            })
        if path == "/api/engines":
            return self.send(200, {k: e.status() for k, e in ENGINES.items()})
        if path == "/api/history":
            return self.send(200, history())
        if path == "/api/phone":
            if not self.is_local():
                return self.send(403, {"error": "local only"})
            link = phone_url(self.server.server_port) if self.server.phone else None
            if not link or not segno:
                return self.send(200, {"url": None})
            svg = segno.make(link, error="m").svg_inline(scale=6, border=2)
            return self.send(200, {"url": link, "svg": svg})
        if path.startswith("/api/job/"):
            job = jobs.get(path.rsplit("/", 1)[-1])
            if not job:
                return self.send(404, {"error": "job not found"})
            data = {k: v for k, v in job.items() if k != "cancel"}
            if job["status"] == "preparing":
                data["engine"] = ENGINES[VOICE_BY_ID[job["voice"]]["engine"]].status()
            return self.send(200, data)
        if path.startswith("/files/"):
            name = path[len("/files/"):]
            file = (OUT_DIR / name).resolve()
            if not re.fullmatch(r"[\w.\-]+", name) or file.parent != OUT_DIR.resolve() or not file.is_file():
                return self.send(404, {"error": "file not found"})
            headers = {}
            if "dl" in parse_qs(url.query):
                headers["Content-Disposition"] = f'attachment; filename="{name}"'
            return self.send(200, file.read_bytes(), CONTENT_TYPES.get(file.suffix, "application/octet-stream"),
                             headers)
        self.send(404, {"error": "not found"})

    def do_POST(self):
        if not self.allowed():
            return
        if self.headers.get("X-Voice-Studio") != "1":  # blocks form posts from other websites
            return self.send(403, {"error": "missing header"})
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
                voice, engine = resolve(data)
                if engine.unavailable():
                    return self.send(400, {"error": engine.unavailable()})
                pronunciations = load_pronunciations()
                foreign = foreign_words(apply_pronunciations(text, pronunciations), voice["lang"])
                if foreign:
                    lang_text = next(l["text"] for l in LANGS if l["id"] == voice["lang"])
                    return self.send(400, {"error": f"Цей голос читає {lang_text} текст. "
                                                    f"Замініть або видаліть: {', '.join(foreign)}"})
                speed = min(1.5, max(0.6, float(data.get("speed", 1.0))))
                sentence_pause = min(2.0, max(0.0, float(data.get("sentence_pause", 0.35))))
                paragraph_pause = min(3.0, max(0.0, float(data.get("paragraph_pause", 0.8))))
                job_id = uuid.uuid4().hex[:12]
                jobs[job_id] = {"id": job_id, "status": "queued", "done": 0, "total": 0, "skipped": 0,
                                "voice": voice["id"], "cancel": False, "started": time.time()}
                threading.Thread(
                    target=run_job, daemon=True,
                    args=(jobs[job_id], text, data, speed, sentence_pause, paragraph_pause, pronunciations),
                ).start()
                return self.send(200, {"job": job_id})
            if path.startswith("/api/cancel/"):
                job = jobs.get(path.rsplit("/", 1)[-1])
                if job:
                    job["cancel"] = True
                return self.send(200, {"ok": True})
            if path == "/api/prepare":
                _, engine = resolve(data)
                if not engine.ready and engine.state not in ("downloading", "loading") and not engine.unavailable():
                    threading.Thread(target=engine.ensure, daemon=True).start()
                return self.send(200, engine.status())
            if path == "/api/preview":
                voice, engine = resolve(data)
                if not engine.ready:
                    return self.send(409, {"error": "Модель для цього голосу ще готується"})
                speed = min(1.5, max(0.6, float(data.get("speed", 1.0))))
                key = (voice["id"], data.get("mix_voice"), round(float(data.get("mix", 0.5)), 2), round(speed, 2))
                if key not in preview_cache:
                    audio = engine.synth(normalize(PREVIEW_TEXT[voice["lang"]], voice["lang"]), data, speed)
                    preview_cache[key] = wav_bytes(normalize_peak(audio), engine.sr)
                return self.send(200, preview_cache[key], "audio/wav")
            if path == "/api/pronunciations":
                pron = {str(k).strip(): str(v).strip() for k, v in dict(data).items()
                        if str(k).strip() and str(v).strip()}
                PRON_FILE.write_text(json.dumps(pron, indent=2, ensure_ascii=False), encoding="utf-8")
                return self.send(200, pron)
        except (ValueError, TypeError, RuntimeError) as e:
            return self.send(400, {"error": str(e)})
        self.send(404, {"error": "not found"})


def main():
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8")
        except (AttributeError, ValueError):
            pass
    settings.update(load_settings())
    english = ENGINES["kokoro"]
    english.verbose = True
    print("Завантажую голосовий рушій...")
    english.ensure()
    english.verbose = False

    phone = "--local-only" not in sys.argv
    server = None
    for port in PORTS:
        try:
            server = ThreadingHTTPServer(("0.0.0.0" if phone else "127.0.0.1", port), Handler)
            break
        except OSError:
            continue
    if not server:
        sys.exit(f"Порти {PORTS.start}-{PORTS.stop - 1} зайняті. Закрийте інший Voice Studio і спробуйте ще раз.")
    server.phone = phone
    url = f"http://127.0.0.1:{server.server_port}"
    print(f"\nVoice Studio працює: {url}")
    if phone and phone_url(server.server_port):
        print("З телефону (та сама Wi-Fi мережа): кнопка «З телефону» в програмі покаже QR-код.")
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
