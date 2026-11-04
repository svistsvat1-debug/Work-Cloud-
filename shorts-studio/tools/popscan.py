"""Pop scan: mean frame-to-frame difference of a small preview; flag frames > 2.2x the local median.
Usage: python3 -I tools/popscan.py out/preview-small.mp4
"""
import json
import os
import subprocess
import sys

import cv2
import numpy as np

src = sys.argv[1]
cap = cv2.VideoCapture(src)
prev = None
diffs = []
while True:
    ok, fr = cap.read()
    if not ok:
        break
    g = cv2.GaussianBlur(cv2.resize(fr, (270, 480)), (5, 5), 0).astype(np.float32)
    if prev is not None:
        diffs.append(float(np.abs(g - prev).mean()))
    prev = g
d = np.array(diffs)
flags = []
for i in range(len(d)):
    lo, hi = max(0, i - 15), min(len(d), i + 16)
    med = np.median(d[lo:hi])
    if d[i] > 2.2 * max(med, 0.25) and d[i] > 1.0:
        flags.append((i + 1, round((i + 1) / 60, 3), round(d[i], 2), round(float(med), 2)))
print("frames", len(d) + 1, "mean diff", round(d.mean(), 3))
print("last 10 diffs", [round(x, 2) for x in d[-10:]])
for f in flags:
    print("flag frame %d t=%.3fs diff=%.2f median=%.2f" % f)
