#!/usr/bin/env python3
"""Build the browser version of Voice Studio into web/dist/.

The page (index.html) and engine (engine/*.mjs) are sources in this folder. This script adds
everything heavy they load, so dist/ can be published as a Claude artifact or a static site:

  engine/   onnxruntime-web, espeak-ng phonemizer (en/de/es only), pinyin-pro, vocabularies
  voices/   voice style vectors as float16
  models/   Kokoro v1.0 (EN/ES), Kokoro v1.1-zh (ZH), Piper Thorsten (DE), in 14 MiB parts

Binary files get a .wasm name because Claude artifacts only serve web file types.

Needs: pip install numpy onnx onnxruntime kokoro-onnx ; run: python web/build.py
"""
import hashlib
import json
import re
import shutil
import tarfile
import urllib.request
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
DIST = HERE / "dist"
CACHE = HERE / ".build-cache"
KOKORO = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/"
SHERPA = "https://github.com/k2-fsa/sherpa-onnx/releases/download/tts-models/"
NPM = {
    "ort": "https://registry.npmjs.org/onnxruntime-web/-/onnxruntime-web-1.22.0.tgz",
    "piper": "https://registry.npmjs.org/@diffusionstudio/piper-wasm/-/piper-wasm-1.0.0.tgz",
    "pinyin": "https://registry.npmjs.org/pinyin-pro/-/pinyin-pro-3.29.4.tgz",
}
EN_VOICES = ["am_michael", "am_fenrir", "am_puck", "am_onyx", "am_adam", "am_echo", "am_liam", "am_eric",
             "bm_george", "bm_fable", "bm_lewis", "bm_daniel", "em_alex"]
ZH_VOICES = ["zm_098", "zm_029", "zm_033", "zm_011", "zm_025", "zm_009", "zm_097", "zm_012", "zm_010", "zm_050"]
PART = 14 * 1024 * 1024
# Quantizing these makes ONNX Runtime Web return NaN (STFT and output convs of the vocoder)
ZH_KEEP_FLOAT = ["/decoder/generator/Conv", "/decoder/generator/Conv_1", "/decoder/generator/conv_post/Conv"]


def fetch(url, name):
    path = CACHE / name
    if not path.exists():
        print("downloading", name)
        CACHE.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(url, path)
    return path


def npm_file(pkg, member):
    with tarfile.open(fetch(NPM[pkg], pkg + ".tgz")) as tar:
        return tar.extractfile("package/" + member).read()


def split(key, data, manifest):
    parts = []
    for i in range(0, len(data), PART):
        name = f"models/{key}.{i // PART}.wasm"
        (DIST / name).write_bytes(data[i:i + PART])
        parts.append(name)
    manifest[key] = {"size": len(data), "parts": parts, "sha256": hashlib.sha256(data).hexdigest()[:16]}


def quantize(src, dst, exclude=()):
    from onnxruntime.quantization import QuantType, quantize_dynamic

    if not dst.exists():
        print("quantizing", src.name)
        quantize_dynamic(str(src), str(dst), weight_type=QuantType.QUInt8, nodes_to_exclude=list(exclude))
    return dst.read_bytes()


def espeak_module():
    """piper-phonemize as an ES module, with espeak-ng data cut down to English, German, Spanish."""
    js = npm_file("piper", "build/piper_phonemize.js").decode()
    data = npm_file("piper", "build/piper_phonemize.data")
    m = re.search(r'loadPackage\((\{"files":\[.*?\],"remote_package_size":\d+\})\)', js)
    meta = json.loads(m.group(1))
    keep = re.compile(r"^/espeak-ng-data/(phontab|phonindex|phondata|intonations|phondata-manifest|(en|de|es)_dict|"
                      r"lang/gmw/(en|en-US|de)|lang/roa/es(-419)?)$")
    files, blob = [], bytearray()
    for f in meta["files"]:
        if keep.match(f["filename"]):
            chunk = data[f["start"]:f["end"]]
            files.append(dict(f, start=len(blob), end=len(blob) + len(chunk)))
            blob += chunk
    js = js[:m.start(1)] + json.dumps({"files": files, "remote_package_size": len(blob)}, separators=(",", ":")) + js[m.end(1):]
    tail = ("if (typeof exports === 'object' && typeof module === 'object')\n  module.exports = createPiperPhonemize;\n"
            "else if (typeof define === 'function' && define['amd'])\n  define([], () => createPiperPhonemize);")
    assert tail in js
    return js.replace(tail, "export default createPiperPhonemize;"), bytes(blob)


def main():
    import onnxruntime as ort

    if DIST.exists():
        shutil.rmtree(DIST)
    for d in ("engine", "voices", "models"):
        (DIST / d).mkdir(parents=True)
    shutil.copy(HERE / "index.html", DIST / "index.html")
    for f in (HERE / "engine").glob("*.mjs"):
        shutil.copy(f, DIST / "engine" / f.name)

    # Libraries
    for name in ("ort.wasm.min.mjs", "ort-wasm-simd-threaded.mjs", "ort-wasm-simd-threaded.wasm"):
        (DIST / "engine" / name).write_bytes(npm_file("ort", "dist/" + name))
    module, data = espeak_module()
    (DIST / "engine/piper_phonemize.mjs").write_text(module)
    (DIST / "engine/espeak-data.wasm").write_bytes(data)
    (DIST / "engine/piper_phonemize.wasm").write_bytes(npm_file("piper", "build/piper_phonemize.wasm"))
    (DIST / "engine/pinyin-pro.js").write_bytes(npm_file("pinyin", "dist/index.js"))

    # Models
    en_onnx = fetch(KOKORO + "model-files-v1.0/kokoro-v1.0.int8.onnx", "kokoro-v1.0.int8.onnx")
    en_voices = np.load(fetch(KOKORO + "model-files-v1.0/voices-v1.0.bin", "voices-v1.0.bin"))
    zh_onnx = fetch(KOKORO + "model-files-v1.1/kokoro-v1.1-zh.onnx", "kokoro-v1.1-zh.onnx")
    zh_voices = np.load(fetch(KOKORO + "model-files-v1.1/voices-v1.1-zh.bin", "voices-v1.1-zh.bin"))
    with tarfile.open(fetch(SHERPA + "vits-piper-de_DE-thorsten-medium.tar.bz2", "thorsten.tar.bz2")) as tar:
        base = "vits-piper-de_DE-thorsten-medium/de_DE-thorsten-medium"
        (CACHE / "de.onnx").write_bytes(tar.extractfile(base + ".onnx").read())
        de_cfg = json.loads(tar.extractfile(base + ".onnx.json").read())

    manifest = {}
    split("en", en_onnx.read_bytes(), manifest)
    split("zh", quantize(zh_onnx, CACHE / "zh.uint8.onnx", ZH_KEEP_FLOAT), manifest)
    split("de", quantize(CACHE / "de.onnx", CACHE / "de.uint8.onnx"), manifest)
    (DIST / "models/manifest.json").write_text(json.dumps(manifest, indent=1))
    (DIST / "models/de.json").write_text(json.dumps({k: de_cfg[k] for k in ("audio", "espeak", "inference", "phoneme_id_map")},
                                                    ensure_ascii=False, separators=(",", ":")))

    for name in EN_VOICES:
        en_voices[name].reshape(510, 256).astype(np.float16).tofile(DIST / f"voices/{name}.wasm")
    for name in ZH_VOICES:
        zh_voices[name].reshape(510, 256).astype(np.float16).tofile(DIST / f"voices/{name}.wasm")

    zh_meta = ort.InferenceSession(str(zh_onnx)).get_modelmeta().custom_metadata_map
    zh_vocab = json.loads(zh_meta["kokoro_config"])["vocab"]
    import kokoro_onnx  # its config.json holds the v1.0 vocabulary

    v10 = json.loads((Path(kokoro_onnx.__file__).parent / "config.json").read_text())["vocab"]
    (DIST / "engine/vocab.json").write_text(json.dumps({"v10": v10, "zh": zh_vocab}, ensure_ascii=False, separators=(",", ":")))

    total = sum(f.stat().st_size for f in DIST.rglob("*") if f.is_file())
    print(f"done: {DIST} ({total / 1e6:.0f} MB, {sum(1 for f in DIST.rglob('*') if f.is_file())} files)")


if __name__ == "__main__":
    main()
