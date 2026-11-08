"""popscan.py video.mp4 - mean blurred frame-to-frame difference at 270x480; flag frames > 2.2x local median."""
import subprocess, sys, numpy as np, cv2
FF = "node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg"
W, H = 270, 480
raw = subprocess.run([FF, "-v", "error", "-i", sys.argv[1], "-vf", f"scale={W}:{H}", "-f", "rawvideo", "-pix_fmt", "gray", "-"], capture_output=True, check=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)
fr = np.stack([cv2.GaussianBlur(f, (0, 0), 2) for f in fr])
d = np.abs(np.diff(fr, axis=0)).mean((1, 2))
n = len(d); fps = 60
flags = []
for i in range(n):
    lo, hi = max(0, i - 15), min(n, i + 16)
    med = np.median(d[lo:hi]) + 0.15
    if d[i] > 2.2 * med and d[i] > 1.0:
        flags.append((i + 1, d[i], med))
print(f"frames {len(fr)}  mean diff {d.mean():.2f}  max {d.max():.2f}")
for f, v, m in flags:
    print(f"  f{f:5d}  t={f/fps:6.2f}s  diff={v:6.2f}  local median={m:5.2f}")
still = [i + 1 for i in range(n - 30, n) if d[i] < 0.02]
print("frozen frames in the last 0.5 s:", len(still))
