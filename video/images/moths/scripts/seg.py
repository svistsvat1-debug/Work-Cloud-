# seg.py cut.png out_labels.png - label the flat regions between black outlines (to split a sprite into puppet layers)
import sys, numpy as np, cv2
from PIL import Image, ImageDraw
im = np.asarray(Image.open(sys.argv[1]).convert("RGBA")).astype(np.int32)
rgb, a = im[..., :3], im[..., 3]
ink = (rgb.max(2) < 85) & (a > 128)
fill = ((~ink) & (a > 128)).astype(np.uint8)
n, lab, st, cen = cv2.connectedComponentsWithStats(fill, connectivity=4)
np.save(sys.argv[2].replace(".png", ".npy"), lab)
rng = np.random.default_rng(3); cols = rng.integers(40, 255, (n, 3)); cols[0] = 0
vis = cols[lab].astype(np.uint8); vis[ink] = 0; vis[a <= 128] = 255
img = Image.fromarray(vis); d = ImageDraw.Draw(img)
for i in range(1, n):
    if st[i, 4] < 150: continue
    x, y = cen[i]; d.text((x - 6, y - 6), str(i), fill=(0, 0, 0)); d.text((x - 5, y - 5), str(i), fill=(255, 255, 255))
    m = lab == i; c = rgb[m].mean(0).astype(int)
    print(i, "area", st[i, 4], "bbox", st[i, :4].tolist(), "col", c.tolist())
img.save(sys.argv[2])
