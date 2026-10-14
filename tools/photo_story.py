#!/usr/bin/env python3
"""Photo-story Shorts renderer: still photos + voiceover -> 9:16 video.

Ken Burns camera with punch-ins, transitions (cut / fade / whip / dip / flash),
film grain + vignette, word-by-word pop subtitles in the centre, and a music bed
synthesized in code (royalty-free by construction) with ducking under the voice.

Usage: python3 tools/photo_story.py videos/06-father-letter/story.json
       -> final.mp4 (voice + music) and final-no-music.mp4 next to story.json
"""
import json
import math
import re
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np
import soundfile as sf
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont
from scipy import signal

FONT = "/usr/share/fonts/opentype/inter/InterDisplay-Black.otf"
BASE_PT, EMPH_PT = 108, 130
MAX_LINE_W = 960
SR = 48000


# ---------------------------------------------------------------- easing
def clamp01(x):
    return max(0.0, min(1.0, x))


def in_out(x):
    x = clamp01(x)
    return 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2


def out_cubic(x):
    return 1 - (1 - clamp01(x)) ** 3


def out_back(x, k=2.2):
    x = clamp01(x) - 1
    return 1 + (k + 1) * x ** 3 + k * x ** 2


# ---------------------------------------------------------------- word timing
def voiced_islands(voice, sr):
    """Speech intervals from the RMS envelope (10 ms hops)."""
    hop = int(sr * 0.01)
    n = len(voice) // hop
    rms = np.sqrt((voice[: n * hop].reshape(n, hop) ** 2).mean(1))
    db = 20 * np.log10(rms + 1e-9)
    on = db > db.max() - 35
    islands, i = [], 0
    while i < n:
        if on[i]:
            j = i
            while j < n and on[j]:
                j += 1
            if islands and i / 100 - islands[-1][1] < 0.06:
                islands[-1][1] = j / 100
            else:
                islands.append([i / 100, j / 100])
            i = j
        else:
            i += 1
    return islands


def syllables(word):
    w = re.sub(r"[^a-z]", "", word.lower())
    n = len(re.findall(r"[aeiouy]+", w))
    if w.endswith("e") and n > 1 and not w.endswith("le"):
        n -= 1
    return max(1, n)


def time_words(line, islands):
    """Spread the line's words over its *voiced* time, weighted by syllables."""
    a, b = line["span"]
    parts = [[max(a, s), min(b, e)] for s, e in islands if e > a and s < b] or [[a, b]]
    total = sum(e - s for s, e in parts)

    def at(frac):
        left = frac * total
        for s, e in parts:
            if left <= e - s + 1e-9:
                return s + left
            left -= e - s
        return parts[-1][1]

    words = [(c_i, w) for c_i, c in enumerate(line["chunks"]) for w in c.split()]
    weights = [syllables(w) + 0.35 for _, w in words]
    cum, acc = [], 0.0
    for wt in weights:
        cum.append(acc / sum(weights))
        acc += wt
    return [(c_i, w, at(f)) for (c_i, w), f in zip(words, cum)]


def build_chunks(story, islands):
    chunks = []
    for line in story["lines"]:
        timed = time_words(line, islands)
        for c_i in range(len(line["chunks"])):
            ws = [(w, t) for ci, w, t in timed if ci == c_i]
            chunks.append({"words": ws, "start": ws[0][1], "line_end": line["span"][1]})
    for i, c in enumerate(chunks):
        nxt = chunks[i + 1]["start"] if i + 1 < len(chunks) else 1e9
        c["end"] = min(nxt, max(c["line_end"], c["words"][-1][1] + 0.3) + 0.45)
    chunks[0]["start"] = 0.0
    chunks[0]["words"][0] = (chunks[0]["words"][0][0], 0.0)
    return chunks


# ---------------------------------------------------------------- subtitles
_sprite_cache = {}


def word_sprite(text, emph):
    key = (text, emph)
    if key in _sprite_cache:
        return _sprite_cache[key]
    font = ImageFont.truetype(FONT, EMPH_PT if emph else BASE_PT)
    asc, desc = font.getmetrics()
    w = int(font.getlength(text))
    pad, stroke = 36, 10 if emph else 9
    size = (w + 2 * pad, asc + desc + 2 * pad)
    shadow = Image.new("L", size, 0)
    ImageDraw.Draw(shadow).text((pad, pad + asc + 8), text, font=font, fill=255,
                                stroke_width=stroke + 4, stroke_fill=255, anchor="ls")
    shadow = shadow.filter(ImageFilter.GaussianBlur(12)).point(lambda v: int(v * 0.6))
    img = Image.new("RGBA", size, (0, 0, 0, 0))
    img.putalpha(shadow)
    ImageDraw.Draw(img).text((pad, pad + asc), text, font=font, fill=(255, 255, 255, 255),
                             stroke_width=stroke, stroke_fill=(0, 0, 0, 255), anchor="ls")
    sprite = {"img": img, "w": w, "asc": asc, "desc": desc, "pad": pad}
    _sprite_cache[key] = sprite
    return sprite


def layout_chunk(chunk, center_y):
    items = []
    for text, t in chunk["words"]:
        emph = text.startswith("*")
        items.append({"sp": word_sprite(text.lstrip("*").upper(), emph), "t": t})
    space = int(BASE_PT * 0.27)
    lines, cur, cur_w = [], [], 0
    for it in items:
        add = it["sp"]["w"] + (space if cur else 0)
        if cur and cur_w + add > MAX_LINE_W:
            lines.append(cur)
            cur, cur_w = [], 0
            add = it["sp"]["w"]
        cur.append(it)
        cur_w += add
    lines.append(cur)
    line_h = [max(i["sp"]["asc"] for i in ln) * 1.16 for ln in lines]
    y = center_y - sum(line_h) / 2
    for ln, lh in zip(lines, line_h):
        base = y + lh * 0.86
        width = sum(i["sp"]["w"] for i in ln) + space * (len(ln) - 1)
        x = 540 - width / 2
        for it in ln:
            sp = it["sp"]
            it["cx"] = x + sp["w"] / 2
            it["cy"] = base - sp["asc"] / 2 + sp["desc"] / 4
            it["box"] = (int(x - sp["pad"]), int(base - sp["asc"] - sp["pad"]))
            x += sp["w"] + space
        y += lh
    return items


def draw_subs(frame, chunks, layouts, t):
    for c, items in zip(chunks, layouts):
        if not (c["start"] <= t < c["end"]):
            continue
        fade = clamp01((c["end"] - t) / 0.08) if c["end"] - c["words"][-1][1] > 0.6 else 1.0
        for it in items:
            p = (t - (it["t"] - 0.04)) / 0.24
            if p < 0:
                continue
            sp = it["sp"]["img"]
            alpha = clamp01(p * 3.5) * fade
            if p < 1:
                s = 0.45 + 0.55 * out_back(p)
                w, h = max(1, int(sp.width * s)), max(1, int(sp.height * s))
                img = sp.resize((w, h), Image.BILINEAR)
                pos = (int(it["cx"] - w / 2), int(it["cy"] - h / 2 + (1 - out_cubic(p)) * 22))
            else:
                img, pos = sp, it["box"]
            if alpha < 1:
                img = img.copy()
                img.putalpha(img.getchannel("A").point(lambda v, a=alpha: int(v * a)))
            frame.alpha_composite(img, dest=(max(pos[0], -img.width + 1), pos[1]))
        return


# ---------------------------------------------------------------- camera
_img_cache = {}


def shot_image(root, shot, W, H):
    key = (shot["image"], shot.get("grade", ""))
    max_zoom = max(k[1] for k in shot["cam"]) * (1 + sum(p[1] for p in shot.get("punch", []))) * 1.18
    if key in _img_cache and _img_cache[key]["zoom"] >= max_zoom:
        return _img_cache[key]
    src = Image.open(root / shot["image"]).convert("RGB")
    src = ImageEnhance.Contrast(src).enhance(1.08)
    if shot.get("grade") == "dark":
        src = ImageEnhance.Color(src).enhance(0.65)
        src = ImageEnhance.Brightness(src).enhance(0.78)
        src = ImageEnhance.Contrast(src).enhance(1.12)
    cover = max(W / src.width, H / src.height)
    F = min(cover * max_zoom, 4.0)
    big = src.resize((int(src.width * F), int(src.height * F)), Image.LANCZOS)
    big = big.filter(ImageFilter.UnsharpMask(radius=2.2, percent=70, threshold=2))
    entry = {"big": big, "F": F, "cover": cover, "iw": src.width, "ih": src.height, "zoom": max_zoom}
    _img_cache[key] = entry
    return entry


def cam_at(shot, t):
    ks = shot["cam"]
    if t <= ks[0][0]:
        z, cx, cy = ks[0][1:]
    elif t >= ks[-1][0]:
        z, cx, cy = ks[-1][1:]
    else:
        for a, b in zip(ks, ks[1:]):
            if a[0] <= t <= b[0]:
                e = in_out((t - a[0]) / (b[0] - a[0]))
                z, cx, cy = (a[i] + (b[i] - a[i]) * e for i in (1, 2, 3))
                break
    for tp, amt in shot.get("punch", []):
        z *= 1 + amt * out_cubic((t - tp) / 0.14) if t >= tp else 1
    if shot.get("in") == "whip":
        z *= 1 + 0.16 * (1 - out_cubic((t - shot["start"]) / 0.32))
    return z, cx, cy


def render_shot(root, shot, t, W, H):
    im = shot_image(root, shot, W, H)
    z, cx, cy = cam_at(shot, t)
    s = im["cover"] * z
    hw, hh = W / (2 * s), H / (2 * s)
    cx = min(max(cx * im["iw"], hw), im["iw"] - hw)
    cy = min(max(cy * im["ih"], hh), im["ih"] - hh)
    # slow handheld drift so stills never feel frozen
    cx += math.sin(t * 0.9 + 1.3) * 2.2 / s
    cy += math.sin(t * 0.7) * 2.6 / s
    F = im["F"]
    k = F / s
    data = (k, 0, (cx - hw) * F, 0, k, (cy - hh) * F)
    return np.asarray(im["big"].transform((W, H), Image.AFFINE, data, resample=Image.BICUBIC), np.float32)


def render_frame(root, shots, t, W, H, fx):
    idx = max(i for i, s in enumerate(shots) if s["start"] <= t or i == 0)
    shot = shots[idx]
    img = render_shot(root, shot, t, W, H)
    dt = t - shot["start"]
    kind = shot.get("in", "cut")
    if idx > 0:
        prev = shots[idx - 1]
        if kind in ("fade", "whip") and dt < 0.2:
            a = in_out(dt / 0.2)
            img = img * a + render_shot(root, prev, t, W, H) * (1 - a)
        elif kind == "dip":
            img = img * in_out(dt / 0.28)
        elif kind == "flash" and dt < 0.4:
            a = (1 - out_cubic(dt / 0.4)) * 0.9
            img = img * (1 - a) + 255 * a
    if idx + 1 < len(shots) and shots[idx + 1].get("in") == "dip":
        img = img * in_out((shots[idx + 1]["start"] - t) / 0.14)
    img = img * fx["vignette"][..., None] + fx["grain"][int(t * 30) % len(fx["grain"])][..., None]
    return np.clip(img, 0, 255).astype(np.uint8)


# ---------------------------------------------------------------- music
NOTES = {"A": [55.0, 110.0, 130.81, 164.81], "F": [43.65, 87.31, 110.0, 130.81],
         "C": [65.41, 130.81, 164.81, 196.0], "G": [49.0, 98.0, 123.47, 146.83],
         "E": [41.2, 82.41, 103.83, 123.47]}
rng = np.random.default_rng(6)


def lp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, "lowpass", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, "highpass", fs=SR, output="sos"), x)


def noise_sweep(n, f0, f1):
    x, out, block = rng.standard_normal(n), np.zeros(n), 256
    for i in range(0, n, block):
        fc = f0 * (f1 / f0) ** (i / n)
        sos = signal.butter(2, [fc / 1.6, min(fc * 1.6, SR / 2 - 100)], "bandpass", fs=SR, output="sos")
        out[i:i + block] = signal.sosfilt(sos, x[i:i + block])
    return out / (np.abs(out).max() + 1e-9)


def add(buf, at, x):
    i = int(at * SR)
    if i < 0:
        x, i = x[-i:], 0
    j = min(len(buf), i + len(x))
    buf[i:j] += x[: j - i]


def music(cfg, dur, voice_env):
    n = int(dur * SR)
    tt = np.arange(n) / SR
    pad, bell, hits = np.zeros(n), np.zeros(n), np.zeros(n)
    chords = cfg["chords"] + [[dur + 1, None]]
    drop = np.ones(n)
    for a, b in cfg["drops"]:
        g = np.clip(np.minimum((tt - a) / 0.05, (b - tt) / 0.8), 0, 1)
        drop *= 1 - 0.75 * g
    beat = 60 / 72 / 2
    for (t0, name), (t1, _) in zip(chords, chords[1:]):
        t1 = min(t1, dur)
        m = (tt >= t0 - 0.6) & (tt < t1 + 0.6)
        env = np.clip(np.minimum((tt[m] - t0 + 0.6) / 1.2, (t1 + 0.6 - tt[m]) / 1.2), 0, 1)
        for k, f in enumerate(NOTES[name]):
            for det in (-0.004, 0.0, 0.005):
                ph = 2 * np.pi * f * (1 + det) * tt[m]
                saw = sum(np.sin(h * ph) / h for h in range(1, 7))
                pad[m] += saw * env * (0.9 if k == 0 else 0.45)
        # sparse music-box arpeggio on the upper chord tones
        tones = [f * 4 for f in NOTES[name][1:]]
        pattern = [0, 1, 2, 1, 0, 2, 1, 2]
        for i, st in enumerate(np.arange(t0, t1 - 0.05, beat * 2)):
            f = tones[pattern[i % len(pattern)]]
            ln = int(1.6 * SR)
            x = np.arange(ln) / SR
            tone = (np.sin(2 * np.pi * f * x) + 0.3 * np.sin(4 * np.pi * f * x) + 0.08 * np.sin(6 * np.pi * f * x))
            tone *= np.exp(-x / 0.45) * np.minimum(1, x / 0.004)
            add(bell, st, tone * (0.8 if i % 2 else 1.0))
    pad = lp(pad, 650) / (np.abs(pad).max() + 1e-9)
    pad *= 0.85 + 0.15 * np.sin(2 * np.pi * 0.17 * tt)
    bell = lp(bell, 4500) / (np.abs(bell).max() + 1e-9)
    bed = (pad * 0.55 + bell * 0.30) * drop

    for at in cfg["booms"]:
        ln = int(2.2 * SR)
        x = np.arange(ln) / SR
        f = 38 + 60 * np.exp(-x / 0.12)
        boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x / 0.7)
        boom += lp(rng.standard_normal(ln), 900) * np.exp(-x / 0.05) * 0.5
        add(hits, at, boom * 0.95)
    for at in cfg["whooshes"]:
        ln = int(0.55 * SR)
        x = np.linspace(0, 1, ln)
        w = noise_sweep(ln, 350, 4200) * np.sin(np.pi * x) ** 2
        add(hits, at - 0.4, w * 0.32)
    r0, r1 = cfg["riser"]
    ln = int((r1 - r0) * SR)
    x = np.linspace(0, 1, ln)
    riser = noise_sweep(ln, 400, 7000) * 0.6 + np.sin(2 * np.pi * np.cumsum(220 + 600 * x ** 2) / SR) * 0.25
    add(hits, r0, riser * x ** 2.2 * 0.38)

    duck = 1 - 0.55 * voice_env
    out = bed * 0.16 * duck + hits * 0.42 * (1 - 0.4 * voice_env)
    return np.stack([out, out], 1)


def voice_envelope(voice, n):
    env = np.abs(voice)
    env = lp(env, 6, order=1)
    env = np.interp(np.arange(n), np.linspace(0, n, len(env)), env)
    env /= env.max() + 1e-9
    return np.clip(env * 3, 0, 1)


def render_audio(story, root, dur, tmp):
    v, sr = sf.read(root / story["voice"])
    if v.ndim > 1:
        v = v.mean(1)
    v48 = signal.resample_poly(v, SR, sr)
    n = int(dur * SR)
    v48 = np.pad(v48, (0, max(0, n - len(v48))))[:n]
    v48 = v48 / (np.abs(v48).max() + 1e-9) * 0.89
    voice_only = np.stack([v48, v48], 1)
    mix = voice_only + music(story["music"], dur, voice_envelope(v48, n))
    sf.write(tmp / "voice.wav", voice_only, SR)
    sf.write(tmp / "mix.wav", mix / max(1.0, np.abs(mix).max() / 0.95), SR)
    return v, sr


# ---------------------------------------------------------------- main
def main(cfg_path):
    cfg_path = Path(cfg_path).resolve()
    root = cfg_path.parent
    story = json.loads(cfg_path.read_text())
    W, H = story["size"]
    fps = story["fps"]
    voice, vsr = sf.read(root / story["voice"])
    if voice.ndim > 1:
        voice = voice.mean(1)
    dur = len(voice) / vsr
    chunks = build_chunks(story, voiced_islands(voice, vsr))
    layouts = [layout_chunk(c, story["subtitle_y"]) for c in chunks]
    for c in chunks:
        print(f"{c['start']:6.2f}-{c['end']:6.2f}  " + " ".join(f"{w}@{t:.2f}" for w, t in c["words"]))

    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    r = np.sqrt(((xx - W / 2) / (W / 2)) ** 2 * 0.8 + ((yy - H / 2) / (H / 2)) ** 2)
    fx = {"vignette": 1 - 0.38 * np.clip(r - 0.35, 0, None) ** 1.6,
          "grain": [np.asarray(Image.fromarray(rng.normal(128, 9, (H // 2, W // 2)).clip(0, 255).astype(np.uint8))
                             .resize((W, H), Image.BILINEAR), np.float32) - 128 for _ in range(6)]}

    tmp = Path(tempfile.mkdtemp())
    render_audio(story, root, dur, tmp)
    frames = math.ceil(dur * fps)
    enc = subprocess.Popen(
        ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
         "-r", str(fps), "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", "21",
         "-maxrate", "9M", "-bufsize", "18M",
         "-pix_fmt", "yuv420p", str(tmp / "video.mp4")], stdin=subprocess.PIPE)
    for f in range(frames):
        t = f / fps
        frame = Image.fromarray(render_frame(root, story["shots"], t, W, H, fx)).convert("RGBA")
        draw_subs(frame, chunks, layouts, t)
        enc.stdin.write(frame.convert("RGB").tobytes())
        if f % 60 == 0:
            print(f"frame {f}/{frames}", flush=True)
    enc.stdin.close()
    enc.wait()

    for name, wav in (("final.mp4", "mix.wav"), ("final-no-music.mp4", "voice.wav")):
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", str(tmp / "video.mp4"), "-i", str(tmp / wav),
             "-af", "loudnorm=I=-14:TP=-1.0:LRA=11", "-ar", "48000", "-c:v", "copy", "-c:a", "aac",
             "-b:a", "192k", "-shortest", "-movflags", "+faststart", str(root / name)], check=True)
        print("wrote", root / name)


if __name__ == "__main__":
    main(sys.argv[1])
