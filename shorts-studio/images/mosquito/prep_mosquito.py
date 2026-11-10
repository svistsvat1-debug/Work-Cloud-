"""raw/M1.png (GPT Image 2.5, magenta bg) -> transparent body + wings layers + face metadata."""
import json, numpy as np, cv2
from PIL import Image

src = np.asarray(Image.open('raw/M1.png').convert('RGB')).astype(np.float32)
H, W, _ = src.shape
BG = np.array([255, 0, 255], np.float32)
dist = np.sqrt(((src - BG) ** 2).sum(2))
bg = dist < 70
band = (cv2.dilate(bg.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))) > 0) & ~bg
alpha = np.ones((H, W), np.float32)
alpha[bg] = 0
# edge band: blend between ink (outline, ~black) and magenta -> alpha from distance to magenta
INK = np.array([25, 25, 25], np.float32)
FULL = float(np.sqrt(((INK - BG) ** 2).sum()))
alpha[band] = np.clip(dist[band] / FULL, 0, 1)
rgb = src.copy()
rgb[band] = INK  # anti-aliased edge pixels are outline pixels
fg = alpha > 0.02

lum = rgb.mean(2)
dark = (lum < 70) & fg
wing_fill = ((rgb[..., 2] - rgb[..., 0]) > 20) & (lum > 130) & fg
# wing veins are a slightly darker blue: close the fill
k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
wing_fill = cv2.morphologyEx(wing_fill.astype(np.uint8), cv2.MORPH_CLOSE, k) > 0
n, lab, stats, _ = cv2.connectedComponentsWithStats(wing_fill.astype(np.uint8), 8)
keep = np.zeros_like(wing_fill)
for i in range(1, n):
    if stats[i, cv2.CC_STAT_AREA] > 3000:
        keep |= lab == i
wing_fill = keep & fg
body_fill = fg & ~dark & ~wing_fill
body_fill = cv2.morphologyEx(body_fill.astype(np.uint8), cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
n2, lab2, st2, _ = cv2.connectedComponentsWithStats(body_fill, 8)
bf = np.zeros(body_fill.shape, bool)
for i in range(1, n2):
    if st2[i, cv2.CC_STAT_AREA] > 300:
        bf |= lab2 == i
body_fill = bf
near_body = cv2.dilate(body_fill.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))) > 0
wing_zone = cv2.dilate(wing_fill.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (19, 19))) > 0
wing_outline = wing_zone & fg & ~body_fill & ~near_body
wings = wing_fill | wing_outline
body = fg & ~wings

# head: grey fill (112) to the right of the thorax
head_px = (np.sqrt(((rgb - [112, 111, 109]) ** 2).sum(2)) < 14) & fg
ys, xs = np.nonzero(head_px)
sel = xs > np.percentile(xs, 5)
xs, ys = xs[sel], ys[sel]
# fit circle to the head's filled region extents
hx = (xs.min() + xs.max()) / 2
hy = (ys.min() + ys.max()) / 2
hr = ((xs.max() - xs.min()) + (ys.max() - ys.min())) / 4
# wing pivot: lowest wing pixels near the thorax
wy, wx = np.nonzero(wing_fill)
order = np.argsort(-wy)[:300]
pivot = (float(np.median(wx[order])), float(np.median(wy[order])))

ys, xs = np.nonzero(fg)
x0, y0, x1, y1 = xs.min() - 8, ys.min() - 8, xs.max() + 9, ys.max() + 9
def save(mask, name):
    rgba = np.dstack([rgb, alpha * 255 * mask]).astype(np.uint8)[y0:y1, x0:x1]
    Image.fromarray(rgba, 'RGBA').save(f'../../public/mosquito/sprites/{name}.png')
import os; os.makedirs('../../public/mosquito/sprites', exist_ok=True)
save(body, 'mosq_body'); save(wings, 'mosq_wings'); save(fg, 'mosq_full')
meta = {
    'w': int(x1 - x0), 'h': int(y1 - y0),
    'thorax': [int(495 - x0), int(445 - y0)],
    'head': [float(hx - x0), float(hy - y0), float(hr)],
    'pivot': [float(pivot[0] - x0), float(pivot[1] - y0)],
    'headColor': [int(v) for v in np.median(rgb[head_px], 0)],
}
json.dump(meta, open('../../src/mosquito/sprites.json', 'w'), indent=1)
print(meta)
# QA sheet on a coloured background
qa = Image.new('RGBA', (3 * (x1 - x0), y1 - y0), (120, 200, 120, 255))
for i, n in enumerate(['mosq_full', 'mosq_body', 'mosq_wings']):
    s = Image.open(f'../../public/mosquito/sprites/{n}.png')
    qa.alpha_composite(s, (i * (x1 - x0), 0))
qa.convert('RGB').save('qa_mosquito.png')
