# python3 scripts/popscan.py video.mp4  -> flags frames whose change is > 2.2x the local median (should only be cuts / swaps)
import sys, subprocess, numpy as np
W, H = 270, 480
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', sys.argv[1], '-vf', f'scale={W}:{H},gblur=sigma=1.5', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], capture_output=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)
d = np.abs(np.diff(fr, axis=0)).mean((1, 2))
flags = []
for i in range(len(d)):
    lo, hi = max(0, i - 15), min(len(d), i + 16)
    med = np.median(d[lo:hi])
    if d[i] > 2.2 * max(med, 0.4) and d[i] > 1.5: flags.append((i + 1, round((i + 1) / 60, 3), round(float(d[i]), 2), round(float(med), 2)))
print('frames', len(fr), 'flags', len(flags))
for f in flags: print(*f)
