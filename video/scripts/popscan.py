"""Pop scan: mean frame-to-frame difference (blurred, 270x480); flag frames > 2.2x the local median."""
import sys, cv2, numpy as np
cap = cv2.VideoCapture(sys.argv[1]); prev = None; d = []
while True:
    ok, f = cap.read()
    if not ok: break
    g = cv2.GaussianBlur(cv2.resize(f, (270, 480), interpolation=cv2.INTER_AREA), (5, 5), 0).astype(np.float32)
    if prev is not None: d.append(float(np.abs(g - prev).mean()))
    prev = g
d = np.array(d); flags = []
for i in range(len(d)):
    med = np.median(d[max(0, i - 15): i + 16])
    if d[i] > 2.2 * max(med, 0.25) and d[i] > 0.6: flags.append((i + 1, d[i], med))
print('frames', len(d) + 1, 'mean diff', d.mean().round(3), 'flags', len(flags))
for fr, v, m in flags: print(f'  f{fr:5d} {fr/60:6.2f}s diff {v:6.2f} (local median {m:5.2f})')
# frozen check at the end
print('last 10 diffs', np.round(d[-10:], 3))
