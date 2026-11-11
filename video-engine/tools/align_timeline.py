#!/usr/bin/env python3
"""Align script words (phase-a/scenes.json) to faster-whisper word timestamps.

Usage: align_timeline.py <video_dir> <voice_duration_sec> [tail_sec]
Reads  <video_dir>/phase-a/scenes.json, <video_dir>/work/words.json, optional <video_dir>/work/voice_kokoro.srt
Writes <video_dir>/work/timeline.json  (scene + per-word timings, seconds)

Whisper is the primary source. Script words that whisper wrote differently
(e.g. "nineteen forty-four" -> "1944") get times interpolated between their
matched neighbours. The Kokoro .srt (if present) is only used as a cross-check.
"""
import difflib
import json
import re
import sys
from pathlib import Path


def norm_tokens(text):
    out = []
    for raw in re.findall(r"[A-Za-z0-9'\-\.]+", text):
        for part in raw.split("-"):
            t = re.sub(r"[^a-z0-9]", "", part.lower())
            if t:
                out.append(t)
    return out


def display_words(text):
    """Script words as displayed (keeps punctuation), split the same way as norm_tokens."""
    res = []
    for raw in re.findall(r"\S+", text):
        core = re.sub(r"[^A-Za-z0-9'\-\.]", "", raw)
        parts = [p for p in core.split("-") if re.sub(r"[^a-z0-9]", "", p.lower())]
        for p in parts:
            res.append(re.sub(r"[^a-z0-9]", "", p.lower()))
    return res


def srt_paragraph_starts(path):
    cues = []
    txt = Path(path).read_text()
    for m in re.finditer(r"(\d\d):(\d\d):(\d\d),(\d+) --> (\d\d):(\d\d):(\d\d),(\d+)", txt):
        g = list(map(int, m.groups()))
        s = g[0] * 3600 + g[1] * 60 + g[2] + g[3] / 1000
        e = g[4] * 3600 + g[5] * 60 + g[6] + g[7] / 1000
        cues.append((s, e))
    starts = [cues[0][0]]
    for a, b in zip(cues, cues[1:]):
        if b[0] - a[1] > 0.45:
            starts.append(b[0])
    return starts


def main():
    vdir = Path(sys.argv[1])
    voice_dur = float(sys.argv[2])
    tail = float(sys.argv[3]) if len(sys.argv) > 3 else 3.0
    scenes = json.loads((vdir / "phase-a" / "scenes.json").read_text())
    wj = json.loads((vdir / "work" / "words.json").read_text())

    s_tok, s_scene = [], []
    for i, sc in enumerate(scenes):
        toks = norm_tokens(sc["vo"])
        s_tok += toks
        s_scene += [i] * len(toks)

    w_tok, w_time = [], []
    for w in wj["words"]:
        ws, we = w["s"], w["e"]
        # whisper often stretches a word back into the preceding pause: clamp long words
        if we - ws > 0.8:
            ws = we - 0.55
        for t in norm_tokens(w["w"]):
            w_tok.append(t)
            w_time.append((ws, we))

    sm = difflib.SequenceMatcher(None, s_tok, w_tok, autojunk=False)
    times = [None] * len(s_tok)
    matched = 0
    for a, b, n in sm.get_matching_blocks():
        for k in range(n):
            times[a + k] = w_time[b + k]
            matched += 1

    # interpolate gaps
    idx = [i for i, t in enumerate(times) if t is not None]
    for i in range(len(times)):
        if times[i] is None:
            prev = max([j for j in idx if j < i], default=None)
            nxt = min([j for j in idx if j > i], default=None)
            if prev is None:
                times[i] = (0.25, 0.5)
            elif nxt is None:
                times[i] = (times[prev][1], times[prev][1] + 0.3)
            else:
                t0, t1 = times[prev][1], times[nxt][0]
                span = nxt - prev
                f0 = (i - prev - 1 + 0.0) / max(1, span - 1)
                f1 = (i - prev) / max(1, span - 1) if span > 1 else 1
                times[i] = (t0 + (t1 - t0) * f0, t0 + (t1 - t0) * min(1, f1))

    out_scenes = []
    for i, sc in enumerate(scenes):
        ws = [(s_tok[k], times[k]) for k in range(len(s_tok)) if s_scene[k] == i]
        out_scenes.append({
            "i": i + 1,
            "block": sc["block"],
            "vo": sc["vo"],
            "mood": sc["mood"],
            "voStart": round(ws[0][1][0], 3),
            "voEnd": round(ws[-1][1][1], 3),
            "words": [{"w": t, "s": round(a, 3), "e": round(b, 3)} for t, (a, b) in ws],
        })
    # paragraph boundaries from the TTS .srt are exact (they come from the TTS engine itself):
    # use them for scene start/end and clamp whisper words inside them
    srt = vdir / "work" / "voice_kokoro.srt"
    report_pre = {}
    if srt.exists():
        ps = srt_paragraph_starts(srt)
        if len(ps) == len(out_scenes):
            report_pre["srt_dev_before_snap_max"] = round(max(abs(p - s["voStart"]) for p, s in zip(ps, out_scenes)), 3)
            for i, sc in enumerate(out_scenes):
                sc["voStart"] = round(ps[i], 3)
                nxt = ps[i + 1] if i + 1 < len(ps) else voice_dur
                sc["voEnd"] = round(min(sc["voEnd"], nxt - 0.3), 3)
                for w in sc["words"]:
                    w["s"] = round(min(max(w["s"], sc["voStart"]), sc["voEnd"]), 3)
                    w["e"] = round(min(max(w["e"], w["s"]), sc["voEnd"]), 3)
    # visual scene windows: start slightly before the first word, end at next scene start
    for i, sc in enumerate(out_scenes):
        sc["start"] = 0.0 if i == 0 else round(max(out_scenes[i - 1]["voEnd"], sc["voStart"] - 0.35), 3)
    total = round(voice_dur + tail, 3)
    for i, sc in enumerate(out_scenes):
        sc["end"] = out_scenes[i + 1]["start"] if i + 1 < len(out_scenes) else total

    report = {**report_pre, "matched_tokens": matched, "script_tokens": len(s_tok), "whisper_tokens": len(w_tok)}
    srt = vdir / "work" / "voice_kokoro.srt"
    if srt.exists():
        ps = srt_paragraph_starts(srt)
        if len(ps) == len(out_scenes):
            dev = [abs(p - s["voStart"]) for p, s in zip(ps, out_scenes)]
            report["srt_check_max_dev_s"] = round(max(dev), 3)
            report["srt_check_mean_dev_s"] = round(sum(dev) / len(dev), 3)
        else:
            report["srt_check"] = f"srt paragraphs {len(ps)} != scenes {len(out_scenes)}"
    tl = {"fps": 30, "voiceDuration": voice_dur, "duration": total, "report": report, "scenes": out_scenes}
    (vdir / "work" / "timeline.json").write_text(json.dumps(tl, indent=1))
    print(json.dumps(report))
    lens = [s["end"] - s["start"] for s in out_scenes]
    print("scene len min/max", round(min(lens), 2), round(max(lens), 2), "total", total)


if __name__ == "__main__":
    main()
