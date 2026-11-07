"""X-ray silhouettes in world space.
xray_body.png = union of the hero bird and the head close-up (both placed in world), navy fill,
soft lighter rim inside, black outline -> one shape for the wide window and the close-ups.
xray_trunk.png = trunk silhouette in X-ray colours with faint bark grooves."""
import json
import numpy as np, cv2
from PIL import Image

P = 'public/woodpecker-tongue/'
HERO = dict(x=493.0, y=382.0, s=0.32)
HEAD = dict(x=545.23, y=385.81, s=0.19132)
PPW = 4.5                                   # pixels per world unit
X0, Y0, X1, Y1 = 480.0, 370.0, 1020.0, 1560.0
W, H = int((X1 - X0) * PPW), int((Y1 - Y0) * PPW)

def place(name, T):
    a = np.asarray(Image.open(P + name + '.png'))[..., 3].astype(np.float32) / 255
    sc = T['s'] * PPW
    M = np.float32([[sc, 0, (T['x'] - X0) * PPW], [0, sc, (T['y'] - Y0) * PPW]])
    return cv2.warpAffine(a, M, (W, H), flags=cv2.INTER_LINEAR)

hero = place('bird', HERO)
head = place('head', HEAD)
# the head close-up's neck is cut flat at the bottom: fade it out before it reaches the cut
hy = np.arange(H)[:, None] / PPW + Y0
cut = HEAD['y'] + 2268 * HEAD['s']
head *= np.clip((cut - 40 - hy) / 30, 0, 1)
alpha = np.maximum(hero, head)
m = (alpha > 0.5).astype(np.uint8)
m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
dist = cv2.distanceTransform(m, cv2.DIST_L2, 5) / PPW            # world units from the edge
out_w = 2.6                                                        # outline width (world)
navy = np.array([21, 41, 77], np.float32)
rim = np.array([52, 92, 150], np.float32)
t = np.clip((dist - out_w) / 9.0, 0, 1)                            # 0 at outline -> 1 inside
rgb = rim[None, None] * (1 - t[..., None]) + navy[None, None] * t[..., None]
rgb[dist < out_w] = (8, 10, 18)
a = cv2.GaussianBlur(m.astype(np.float32), (0, 0), 0.8)
img = np.dstack([rgb, a * 255]).astype(np.uint8)
Image.fromarray(img).save(P + 'xray_body.png', optimize=True)

# trunk
im = np.asarray(Image.open(P + 'trunk.png')).astype(np.float32)
ta = im[..., 3] / 255
lum = im[..., :3].mean(2)
hp = cv2.GaussianBlur(lum, (0, 0), 6) - lum                         # grooves / lines -> positive
hp = np.clip(hp / 40, 0, 1)
tm = (ta > 0.5).astype(np.uint8)
td = cv2.distanceTransform(tm, cv2.DIST_L2, 5)
base = np.array([28, 50, 88], np.float32); line = np.array([110, 170, 230], np.float32)
rgb = base[None, None] * (1 - hp[..., None] * 0.55) + line[None, None] * (hp[..., None] * 0.55)
rimt = np.clip(1 - td / 40, 0, 1)[..., None]
rgb = rgb * (1 - rimt * 0.5) + np.array([70, 120, 190], np.float32) * rimt * 0.5
rgb[td < 9] = (8, 10, 18)
Image.fromarray(np.dstack([rgb, ta * 255]).astype(np.uint8)).save(P + 'xray_trunk.png', optimize=True)
json.dump(dict(x=X0, y=Y0, ppw=PPW, w=W, h=H), open('images/woodpecker-tongue/xray_body.json', 'w'))
print('xray_body', W, H)
