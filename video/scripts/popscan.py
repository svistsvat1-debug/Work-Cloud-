# popscan.py preview.mp4 - mean frame-to-frame difference (blurred, 270x480); flag frames above 2.2x the local median
import subprocess, sys, numpy as np, cv2
raw = subprocess.run(["ffmpeg", "-v", "quiet", "-i", sys.argv[1], "-vf", "scale=270:480", "-f", "rawvideo", "-pix_fmt", "gray", "-"], capture_output=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, 480, 270).astype(np.float32)
fr = np.stack([cv2.GaussianBlur(f, (0, 0), 2) for f in fr])
d = np.abs(np.diff(fr, axis=0)).mean((1, 2))
print(f"frames {len(fr)}  mean diff {d.mean():.3f}  max {d.max():.2f}")
flags = []
for i in range(len(d)):
    lo, hi = max(0, i - 15), min(len(d), i + 16)
    med = np.median(d[lo:hi]) + 0.05
    if d[i] > 2.2 * med and d[i] > 0.6: flags.append((i + 1, d[i], med))
for f, v, m in flags: print(f"flag frame {f:5d}  t={f/60:6.2f}s  diff {v:6.2f}  local median {m:5.2f}")
# frozen-frame check at the very end
print("last 30 frames mean diff", d[-30:].mean().round(3))
