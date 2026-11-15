# popscan.py VIDEO - mean frame-to-frame difference (blurred, 270x480); flag frames > 2.2x local median
import sys, numpy as np, cv2
cap = cv2.VideoCapture(sys.argv[1]); prev = None; d = []
fps = cap.get(cv2.CAP_PROP_FPS)
while True:
    ok, f = cap.read()
    if not ok: break
    g = cv2.GaussianBlur(cv2.resize(cv2.cvtColor(f, cv2.COLOR_BGR2GRAY), (270, 480)), (5, 5), 0).astype(np.float32)
    if prev is not None: d.append(np.abs(g - prev).mean())
    prev = g
d = np.array(d)
for i in range(len(d)):
    lo, hi = max(0, i - 15), min(len(d), i + 16)
    med = np.median(d[lo:hi])
    if d[i] > 2.2 * max(med, 0.3) and d[i] > 1.0:
        print(f'frame {i+1} t={(i+1)/fps:.2f}s diff={d[i]:.2f} median={med:.2f}')
print('frames', len(d) + 1, 'fps', fps)
