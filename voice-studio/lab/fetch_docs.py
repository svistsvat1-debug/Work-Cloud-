"""Fetches licence/terms pages and voice docs the sandbox cannot reach, and prints the relevant passages."""
import html
import json
import re
import urllib.request

PAGES = {
    "inworld-llms": "https://docs.inworld.ai/llms.txt",
    "inworld-terms": "https://inworld.ai/terms",
    "deepinfra-terms": "https://deepinfra.com/terms",
    "deepinfra-inworld-page": "https://deepinfra.com/inworld-ai/inworld-tts-1.5-max",
    "deepinfra-voices-docs": "https://deepinfra.com/docs/advanced/voices",
    "hf-qwen3tts": "https://huggingface.co/api/models/Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice",
    "hf-chatterbox-ml": "https://huggingface.co/api/models/ResembleAI/chatterbox",
}
KEYS = {
    "inworld-llms": r"voice|tts|language|terms|license",
    "inworld-terms": r"output|commercial|own|licen[cs]e|generated|voice",
    "deepinfra-terms": r"output|commercial|own|generated",
    "deepinfra-inworld-page": r"Josef|Alain|Diego|Miguel|Rafael|Mathieu|German|French|Spanish|male|voices",
    "deepinfra-voices-docs": r"voices/add|multipart|voice_id|file|name",
}


def text_of(raw):
    raw = re.sub(r"(?is)<(script|style)[^>]*>.*?</\1>", " ", raw)
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", raw)))


for name, url in PAGES.items():
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 voice-lab"})
        raw = urllib.request.urlopen(req, timeout=60).read().decode("utf-8", "replace")
    except Exception as e:
        print(f"\n===== {name}: {e}")
        continue
    print(f"\n===== {name} ({len(raw)} chars)")
    if name.startswith("hf-"):
        d = json.loads(raw)
        print("license:", [t for t in d.get("tags", []) if t.startswith("license")], "| cardData license:", (d.get("cardData") or {}).get("license"))
        continue
    if name == "inworld-llms":
        for line in raw.splitlines():
            if re.search(KEYS[name], line, re.I):
                print("  ", line[:300])
        continue
    t = text_of(raw)
    seen = 0
    for m in re.finditer(KEYS[name], t, re.I):
        if seen >= 25:
            break
        print("  …", t[max(0, m.start() - 220):m.end() + 260])
        seen += 1
