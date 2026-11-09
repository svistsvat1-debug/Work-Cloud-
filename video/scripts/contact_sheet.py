"""Tile stills (t*.png) into one labelled contact sheet: python3 contact_sheet.py <dir> <out.png> [cols]"""
import glob, os, sys
import cv2, numpy as np
d, out = sys.argv[1], sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 5
files = sorted(glob.glob(os.path.join(d, "t*.png")))
ims = [cv2.imread(f) for f in files]
h, w = 480, 270
tiles = []
for f, im in zip(files, ims):
    im = cv2.resize(im, (w, h), interpolation=cv2.INTER_AREA)
    cv2.rectangle(im, (0, 0), (110, 26), (0, 0, 0), -1)
    cv2.putText(im, os.path.basename(f)[1:-4].lstrip("0") or "0", (5, 19), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
    tiles.append(im)
rows = (len(tiles) + cols - 1) // cols
sheet = np.full((rows * (h + 6), cols * (w + 6), 3), 40, np.uint8)
for i, im in enumerate(tiles):
    r, c = divmod(i, cols)
    sheet[r * (h + 6):r * (h + 6) + h, c * (w + 6):c * (w + 6) + w] = im
cv2.imwrite(out, sheet)
print(out, sheet.shape)
