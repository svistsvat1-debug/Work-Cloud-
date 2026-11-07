"""Frame-to-frame jump scan: python3 -I tools/popscan.py video.mp4 -> flags frames whose mean diff > 2.2x local median."""
import sys, subprocess, numpy as np, cv2
v = sys.argv[1]
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', v, '-vf', 'scale=270:480', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], capture_output=True, check=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, 480, 270).astype(np.float32)
fr = np.stack([cv2.GaussianBlur(f, (0, 0), 1.5) for f in fr])
d = np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2))
flags = []
for i in range(len(d)):
    lo, hi = max(0, i - 15), min(len(d), i + 16)
    med = np.median(d[lo:hi]) + 0.15
    if d[i] > 2.2 * med and d[i] > 1.0:
        flags.append((i + 1, round(float(d[i]), 2), round(float(med), 2)))
print('frames', len(fr), 'flags', len(flags))
for f, v_, m in flags: print(f'frame {f:5d} t={f / 60:6.2f}s diff={v_:6.2f} median={m:5.2f}')
