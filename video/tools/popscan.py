"""python popscan.py preview.mp4 -> flags frames whose change is > 2.2x the local median (intended swaps must explain each)"""
import sys, subprocess, numpy as np, cv2
p = sys.argv[1]; W, H = 270, 480
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-f', 'rawvideo', '-pix_fmt', 'gray', '-s', f'{W}x{H}', '-'], capture_output=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W).astype(np.float32)
fr = np.stack([cv2.GaussianBlur(f, (5, 5), 0) for f in fr])
d = np.abs(np.diff(fr, axis=0)).mean(axis=(1, 2))
flags = []
for i in range(len(d)):
    med = np.median(d[max(0, i - 15):i + 16]) + 0.15
    if d[i] > 2.2 * med and d[i] > 0.6: flags.append((i + 1, round(float(d[i]), 2), round(float(med), 2)))
print('frames', len(fr), 'mean diff', round(float(d.mean()), 3), 'last-vs-first', round(float(np.abs(fr[-1] - fr[0]).mean()), 3))
print('still frames at end (diff<0.02):', int((d[-30:] < 0.02).sum()), 'of last 30')
for f, v, m in flags: print(f'f{f} t={f/60:.2f}s diff={v} med={m}')
