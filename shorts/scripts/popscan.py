# Pop scan: mean frame-to-frame difference of a blurred 270x480 copy; flag frames above 2.2x the local median.
import sys, cv2, numpy as np
cap = cv2.VideoCapture(sys.argv[1]); fps = cap.get(cv2.CAP_PROP_FPS)
prev = None; diffs = []
while True:
    ok, fr = cap.read()
    if not ok: break
    g = cv2.GaussianBlur(cv2.resize(cv2.cvtColor(fr, cv2.COLOR_BGR2GRAY), (270, 480), interpolation=cv2.INTER_AREA), (5, 5), 0).astype(np.float32)
    diffs.append(0.0 if prev is None else float(np.mean(np.abs(g - prev))))
    prev = g
d = np.array(diffs); flags = []
for i in range(1, len(d)):
    lo, hi = max(1, i - 20), min(len(d), i + 21)
    med = np.median(d[lo:hi]) + 0.05
    if d[i] > 2.2 * med and d[i] > 0.6: flags.append((i, d[i], med))
print(f"frames {len(d)}  fps {fps:.2f}  mean diff {d[1:].mean():.3f}  max {d.max():.2f} at f{int(d.argmax())}")
# last frame vs first frame (loop)
cap = cv2.VideoCapture(sys.argv[1]); ok, first = cap.read()
cap.set(cv2.CAP_PROP_POS_FRAMES, len(d) - 1); ok2, last = cap.read()
if ok and ok2:
    a = cv2.resize(cv2.cvtColor(first, cv2.COLOR_BGR2GRAY), (270, 480)).astype(np.float32)
    b = cv2.resize(cv2.cvtColor(last, cv2.COLOR_BGR2GRAY), (270, 480)).astype(np.float32)
    print(f"loop: last-vs-first mean diff {np.mean(np.abs(a - b)):.3f}")
for i, v, m in flags: print(f"FLAG f{i:4d} t={i / fps:6.2f}s diff {v:.2f} (local median {m:.2f})")
print('flags:', len(flags))
