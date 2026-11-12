"""QA for a finished video: ffprobe spec, faststart, loudness, static-frame scan, keyword spot-check frames.
usage: python3 qa.py <video.mp4> <timing.json> <cues.json> <out_dir>"""
import json, random, re, struct, subprocess, sys
import numpy as np

video, timing_p, cues_p, out_dir = sys.argv[1:5]
res = {}
pr = json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", video], capture_output=True, text=True).stdout)
v = next(s for s in pr["streams"] if s["codec_type"] == "video")
a = next(s for s in pr["streams"] if s["codec_type"] == "audio")
res["video"] = {k: v.get(k) for k in ["codec_name", "profile", "level", "width", "height", "pix_fmt", "r_frame_rate", "avg_frame_rate", "color_space", "color_range", "codec_tag_string", "bit_rate"]}
res["audio"] = {k: a.get(k) for k in ["codec_name", "profile", "sample_rate", "channels", "bit_rate"]}
res["duration_s"] = float(pr["format"]["duration"])
res["size_mb"] = round(int(pr["format"]["size"]) / 1e6, 1)

# faststart: moov atom before mdat
with open(video, "rb") as f:
    order, pos = [], 0
    while len(order) < 8:
        f.seek(pos)
        hdr = f.read(8)
        if len(hdr) < 8:
            break
        size, typ = struct.unpack(">I4s", hdr)
        if size == 1:
            size = struct.unpack(">Q", f.read(8))[0]
        order.append(typ.decode("latin1"))
        if size == 0:
            break
        pos += size
res["top_level_atoms"] = order
res["faststart"] = "moov" in order and "mdat" in order and order.index("moov") < order.index("mdat")

# loudness of the final file
lo = subprocess.run(["ffmpeg", "-hide_banner", "-i", video, "-map", "0:a", "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
summ = lo[lo.rfind("Summary:"):]
res["integrated_lufs"] = float(re.search(r"I:\s+(-?[\d.]+) LUFS", summ).group(1))
res["true_peak_dbfs"] = float(re.search(r"Peak:\s+(-?[\d.]+) dBFS", summ).group(1))

# static-frame scan: 4 fps grayscale thumbnails, longest run without visible change
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", video, "-vf", "fps=4,scale=192:108,format=gray", "-f", "rawvideo", "-"], capture_output=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, 108, 192).astype(np.int16)
diff = np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2))
changed = diff > 0.35  # a new stroke/label changes ~0.35+ of mean level; camera drift alone stays below
run = best = 0
best_end = 0
for i, c in enumerate(changed):
    run = 0 if c else run + 1
    if run > best:
        best, best_end = run, i
res["longest_static_s"] = round(best / 4, 2)
res["longest_static_at_s"] = round((best_end - best) / 4, 1)
T = json.load(open(timing_p))
ev = json.load(open(cues_p))["events"]
evs = sorted(set([0.0] + [e for e in ev if e >= 0] + [T["scenes"][-1]["end"]]))
gaps = sorted(((b - a), a) for a, b in zip(evs, evs[1:]))
res["longest_gap_between_visual_events_s"] = round(gaps[-1][0], 2)

# spot check: 5 random scenes, frame 0.6 s after a mid-scene word
random.seed(85)
picks = sorted(random.sample(range(2, len(T["scenes"])), 5))
spots = []
for n in picks:
    sc = T["scenes"][n - 1]
    w = sc["words"][len(sc["words"]) // 2]
    t = w["e"] + 0.6
    outp = f"{out_dir}/spot_scene{n:02d}_{t:.1f}s.png"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-ss", f"{t:.2f}", "-i", video, "-frames:v", "1", "-vf", "scale=960:540", outp], check=True)
    spots.append({"scene": n, "word": w["w"], "t": round(t, 2), "frame": outp, "vo": sc["text"][:90]})
res["spot_checks"] = spots
json.dump(res, open(f"{out_dir}/qa.json", "w"), indent=1)
print(json.dumps(res, indent=1))
