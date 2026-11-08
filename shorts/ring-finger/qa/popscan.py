# flags frames whose change from the previous frame is > 2.2x the local median (should only be cuts / intended pops)
import cv2, numpy as np, json, sys
T = json.load(open("src/timeline.json"))["T"]
cap = cv2.VideoCapture(sys.argv[1]); prev = None; d = []
while True:
    ok, f = cap.read()
    if not ok: break
    g = cv2.GaussianBlur(cv2.resize(cv2.cvtColor(f, cv2.COLOR_BGR2GRAY), (270, 480)).astype(np.float32), (5, 5), 0)
    d.append(0 if prev is None else float(np.abs(g - prev).mean())); prev = g
d = np.array(d); fps = 60
for i in range(1, len(d)):
    lo, hi = max(1, i - 30), min(len(d), i + 30)
    med = np.median(d[lo:hi]) + 0.15
    if d[i] > 2.2 * med and d[i] > 0.8:
        t = i / fps; near = min(T, key=lambda k: abs(T[k] - t))
        print(f"frame {i:5d} t={t:6.2f}s diff={d[i]:6.2f} med={med:5.2f}  near {near}={T[near]}")
print("frames", len(d), "max diff", d.max().round(2))
