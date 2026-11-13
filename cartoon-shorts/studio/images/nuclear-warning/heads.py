# heads.py - find the head circle of every character sprite (Hough on the outline) + draw a check sheet
import json, numpy as np, cv2
from PIL import Image, ImageDraw
OUT = '../../public/nuclear-warning'
names = ['up', 'down', 'scroll', 'run', 'skull', 'robber', 'nerd']
res = {}
tiles = []
for n in names:
    a = np.asarray(Image.open(f'{OUT}/{n}.png').convert('RGBA'))
    h, w = a.shape[:2]
    comp = np.full((h, w, 3), 255, np.uint8)
    al = a[..., 3:4] / 255.0
    comp = (a[..., :3] * al + 255 * (1 - al)).astype(np.uint8)
    g = cv2.cvtColor(comp, cv2.COLOR_RGB2GRAY)
    g = cv2.GaussianBlur(g, (5, 5), 1.5)
    rmin, rmax = int(0.12 * min(w, h)), int(0.42 * max(w, h) if n == 'scroll' else 0.3 * max(w, h))
    cs = cv2.HoughCircles(g, cv2.HOUGH_GRADIENT, dp=1.5, minDist=50, param1=120, param2=40, minRadius=rmin, maxRadius=rmax)
    best = None
    if cs is not None:
        # prefer big circles high up whose inside is mostly white
        for x, y, r in cs[0][:15]:
            yy, xx = np.mgrid[0:h, 0:w]
            m = (xx - x) ** 2 + (yy - y) ** 2 < (0.8 * r) ** 2
            white = (comp.sum(2) > 690) & (a[..., 3] > 200)
            score = white[m].mean() * r
            if best is None or score > best[3]: best = (float(x), float(y), float(r), float(score))
    res[n] = [round(best[0]), round(best[1]), round(best[2])]
    im = Image.fromarray(comp); d = ImageDraw.Draw(im)
    x, y, r = best[:3]; d.ellipse([x - r, y - r, x + r, y + r], outline=(255, 0, 0), width=5)
    im.thumbnail((300, 420)); tiles.append(im)
S = Image.new('RGB', (300 * len(tiles), 420), 'white')
for i, t in enumerate(tiles): S.paste(t, (i * 300, 0))
S.save('qa/heads.png'); json.dump(res, open('heads.json', 'w')); print(res)
