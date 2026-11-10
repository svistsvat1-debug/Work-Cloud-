import subprocess, numpy as np, sys
import cv2
p = sys.argv[1]
W, H = 270, 480
raw = subprocess.run(["ffmpeg","-v","error","-i",p,"-vf",f"scale={W}:{H}","-f","rawvideo","-pix_fmt","gray","-"],capture_output=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)
fr = np.stack([cv2.GaussianBlur(f, (5, 5), 0) for f in fr])
d = np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2))
n = len(d)
print("frames", len(fr))
flags = []
for i in range(n):
    lo, hi = max(0, i - 15), min(n, i + 16)
    med = np.median(d[lo:hi])
    if d[i] > 2.2 * med and d[i] > 1.5:
        flags.append((i + 1, (i + 1) / 60, d[i], med))
for f in flags:
    print(f"frame {f[0]:5d}  t={f[1]:6.2f}s  diff={f[2]:5.2f}  localmed={f[3]:5.2f}")
