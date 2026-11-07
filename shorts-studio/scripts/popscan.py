# frame-to-frame difference scan: python3 -I scripts/popscan.py video.mp4
import sys, subprocess, numpy as np
from scipy.ndimage import median_filter
W, H = 270, 480
p = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', sys.argv[1], '-vf', f'scale={W}:{H},gblur=sigma=1.5', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], capture_output=True)
fr = np.frombuffer(p.stdout, np.uint8).reshape(-1, H, W).astype(np.float32)
d = np.abs(np.diff(fr, axis=0)).mean((1, 2))
med = median_filter(d, size=31, mode='nearest')
flags = np.where(d > 2.2 * np.maximum(med, 0.15))[0]
print('frames', len(fr), 'mean diff', d.mean().round(3))
for i in flags:
    print(f'  frame {i + 1:4d}  t={(i + 1) / 60:6.3f}s  diff {d[i]:.2f}  local median {med[i]:.2f}')
