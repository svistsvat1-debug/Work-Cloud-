"""Automatic 'no static frame > 6 s' check: sample the picture at 4 fps, count a frame as an event when
more than 0.15% of pixels changed noticeably (ignores idle blink/bob), report the longest gap between events."""
import subprocess, sys, json
import numpy as np
path = sys.argv[1]
w, h, fps = 320, 180, 4
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-vf", f"fps={fps},scale={w}:{h},format=gray", "-f", "rawvideo", "-"], capture_output=True, check=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(np.int16)
d = np.abs(np.diff(fr, axis=0)) > 24
frac = d.mean(axis=(1, 2))
ev = np.where(frac > 0.0015)[0]
times = (ev + 1) / fps
gaps = np.diff(np.concatenate([[0], times, [len(fr) / fps]]))
k = int(np.argmax(gaps))
starts = np.concatenate([[0], times])
long = [(round(float(starts[i]), 1), round(float(g), 1)) for i, g in enumerate(gaps) if g > 6]
print(json.dumps({"frames": len(fr), "events": int(len(ev)), "longest_gap_s": round(float(gaps.max()), 2), "longest_gap_starts_s": round(float(starts[k]), 1), "gaps_over_6s": long}))
