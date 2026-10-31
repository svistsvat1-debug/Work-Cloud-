# mean frame-to-frame difference (blurred, 270x480); flag frames > 2.2x local median
import subprocess, sys, numpy as np
from PIL import Image, ImageFilter
f = sys.argv[1]; W, H = 270, 480
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", f, "-vf", f"scale={W}:{H}", "-f", "rawvideo", "-pix_fmt", "gray", "-"], capture_output=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W)
fr = np.stack([np.asarray(Image.fromarray(x).filter(ImageFilter.GaussianBlur(2)), np.float32) for x in fr])
d = np.abs(np.diff(fr, axis=0)).mean((1, 2))
flags = []
for i in range(len(d)):
    med = np.median(d[max(0, i-15): i+16]) + 0.15
    if d[i] > 2.2 * med and d[i] > 0.8: flags.append((i+1, round(float(d[i]), 2), round(float(med), 2)))
print("frames", len(fr), "flags", len(flags))
for fl in flags: print(f"frame {fl[0]} t={fl[0]/60:.2f}s diff={fl[1]} med={fl[2]}")
# frozen-end check
print("last-10 diffs", np.round(d[-10:], 2))
