# heads2.py - refine head circles: rays from a seed centre to the silhouette edge, robust least-squares circle fit
import json, numpy as np
from PIL import Image, ImageDraw
OUT = '../../public/nuclear-warning'
seeds = json.load(open('heads.json'))
seeds['skull'] = [307, 708, 188]; seeds['scroll'] = [443, 413, 425]
# angle ranges (deg, 0 = right, -90 = up) where the rays see the bare head edge
rng = {'up': (-60, 60), 'down': (-170, -10), 'scroll': (-170, -10), 'run': (-100, 20), 'skull': (-200, 20), 'robber': (-150, -40), 'nerd': (-170, -60)}
res = {}; tiles = []
for n, (x, y, r) in seeds.items():
    a = np.asarray(Image.open(f'{OUT}/{n}.png').convert('RGBA')); h, w = a.shape[:2]
    al = a[..., 3] > 128
    for it in range(4):
        pts = []
        for ang in np.radians(np.arange(rng[n][0], rng[n][1], 2)):
            dx, dy = np.cos(ang), np.sin(ang)
            for d in np.arange(0.6 * r, 1.6 * r, 1.0):
                px, py = int(round(x + dx * d)), int(round(y + dy * d))
                if px < 0 or py < 0 or px >= w or py >= h or not al[py, px]:
                    pts.append((x + dx * d, y + dy * d)); break
        P = np.array(pts); dist = np.hypot(P[:, 0] - x, P[:, 1] - y); med = np.median(dist)
        P = P[np.abs(dist - med) < 0.08 * med]
        A = np.c_[2 * P[:, 0], 2 * P[:, 1], np.ones(len(P))]; b = (P ** 2).sum(1)
        cx, cy, c = np.linalg.lstsq(A, b, rcond=None)[0]; x, y, r = cx, cy, np.sqrt(c + cx * cx + cy * cy)
    res[n] = [round(float(x)), round(float(y)), round(float(r))]
    al3 = a[..., 3:4] / 255.0
    im = Image.fromarray((a[..., :3] * al3 + 255 * (1 - al3)).astype(np.uint8)); d = ImageDraw.Draw(im)
    d.ellipse([x - r, y - r, x + r, y + r], outline=(255, 0, 0), width=5); d.ellipse([x - 6, y - 6, x + 6, y + 6], fill=(255, 0, 0))
    im.thumbnail((300, 420)); tiles.append(im)
S = Image.new('RGB', (300 * len(tiles), 420), 'white')
for i, t in enumerate(tiles): S.paste(t, (i * 300, 0))
S.save('qa/heads.png'); json.dump(res, open('heads.json', 'w')); print(res)
