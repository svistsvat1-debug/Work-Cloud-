import numpy as np, cv2
from PIL import Image
im = np.asarray(Image.open("cut/moth_up.png").convert("RGBA")).astype(np.int32)
rgb, a = im[..., :3], im[..., 3]
lab = np.load("qa/moth_up_labels.npy")
ink = ((rgb.max(2) < 85) & (a > 128)).astype(np.uint8)
n, l8, st, cen = cv2.connectedComponentsWithStats(ink, connectivity=8)
head = lab == 4
hd = cv2.dilate(head.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)
for i in range(1, n):
    m = l8 == i
    inside = (hd[m]).mean()
    x, y, w, h, ar = st[i]
    if ar < 3000: print(i, "area", ar, "bbox", (x, y, w, h), "inside_head", round(inside, 2), "cen", cen[i].round(1).tolist())
ys, xs = np.where(head); print("head bbox", xs.min(), ys.min(), xs.max(), ys.max())
for c in (1, 2): ys, xs = np.where(lab == c); print("wing", c, "bbox", xs.min(), ys.min(), xs.max(), ys.max())
