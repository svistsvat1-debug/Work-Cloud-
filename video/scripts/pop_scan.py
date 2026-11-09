"""Pop scan: mean frame-to-frame difference on a blurred 270x480 copy; flag frames above 2.2x the local median.
usage: python3 pop_scan.py <video.mp4> [cuts_in_seconds,comma,separated]"""
import subprocess, sys
import numpy as np, cv2
path = sys.argv[1]
cuts = [float(x) for x in sys.argv[2].split(",")] if len(sys.argv) > 2 else []
w, h = 270, 480
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-vf", f"scale={w}:{h}", "-f", "rawvideo", "-pix_fmt", "gray", "-"],
                     capture_output=True, check=True).stdout
fps = 60.0
fr = np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(np.float32)
fr = np.stack([cv2.GaussianBlur(f, (0, 0), 1.5) for f in fr])
d = np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2))
flags = []
for i in range(len(d)):
    lo, hi = max(0, i - 15), min(len(d), i + 16)
    med = np.median(d[lo:hi]) + 0.15
    if d[i] > 2.2 * med and d[i] > 1.0:
        flags.append((i + 1, (i + 1) / fps, d[i], med))
print(f"frames {len(fr)}, flagged {len(flags)}")
for f, t, v, m in flags:
    near = min(cuts, key=lambda c: abs(c - t)) if cuts else None
    tag = f"cut {near:.3f}" if near is not None and abs(near - t) < 0.04 else ""
    print(f"  frame {f:5d}  t={t:6.3f}s  diff {v:6.2f}  local median {m:5.2f}  {tag}")
