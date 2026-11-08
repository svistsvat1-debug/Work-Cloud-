# python3 scripts/sheet.py <dir> <out.png> [cols]  -> contact sheet with frame/time labels
import sys, os, cv2, numpy as np
d, out = sys.argv[1], sys.argv[2]; cols = int(sys.argv[3]) if len(sys.argv) > 3 else 6
fs = sorted(f for f in os.listdir(d) if f.endswith('.png'))
ims = []
for f in fs:
    im = cv2.imread(os.path.join(d, f)); im = cv2.resize(im, (270, 480), interpolation=cv2.INTER_AREA)
    fr = int(f[1:6]); cv2.rectangle(im, (0, 0), (270, 26), (0, 0, 0), -1)
    cv2.putText(im, f'{fr/60:.2f}s', (6, 19), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2); ims.append(im)
while len(ims) % cols: ims.append(np.zeros_like(ims[0]))
cv2.imwrite(out, np.vstack([np.hstack(ims[i:i + cols]) for i in range(0, len(ims), cols)]))
