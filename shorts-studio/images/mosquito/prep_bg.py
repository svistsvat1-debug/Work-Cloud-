"""Background plates (ChatGPT): BG1 sky + BG5 street = full plates (JPEG); BG2 hills, BG3 bushes, BG4 ground = keyed strips (PNG).
-> public/mosquito/bg/ + src/mosquito/bg.json"""
import json, os
import numpy as np, cv2
from PIL import Image

OUT = '../../public/mosquito/bg/'
os.makedirs(OUT, exist_ok=True)
EL = lambda k: cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))
INK = np.array([22, 22, 24], np.float32)


def key(path):
    src = np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
    bgc = np.array([252, 3, 250], np.float32)
    dist = np.sqrt(((src - bgc) ** 2).sum(2))
    bg = dist < 90
    band = (cv2.dilate(bg.astype(np.uint8), EL(7)) > 0) & ~bg
    alpha = np.ones(bg.shape, np.float32)
    alpha[bg] = 0
    full = float(np.sqrt(((INK - bgc) ** 2).sum()))
    alpha[band] = np.clip((dist[band] - 40) / (full - 40), 0, 1)
    rgb = src.copy()
    rgb[band] = INK
    return rgb, alpha


meta = {}
for n in ['BG1', 'BG5']:
    im = Image.open(f'raw/{n}.png').convert('RGB')
    im.save(OUT + n + '.jpg', quality=92)
    meta[n] = {'w': im.size[0], 'h': im.size[1]}
for n in ['BG2', 'BG3', 'BG4']:
    rgb, alpha = key(f'raw/{n}.png')
    rgba = np.dstack([rgb.clip(0, 255).astype(np.uint8), (alpha * 255).astype(np.uint8)])
    Image.fromarray(rgba, 'RGBA').save(OUT + n + '.png', optimize=True)
    h, w = alpha.shape
    bottom = np.median(rgb[-6:-2].reshape(-1, 3), 0)
    meta[n] = {'w': w, 'h': h, 'bottomColor': '#%02x%02x%02x' % tuple(int(v) for v in bottom)}
meta['BG2'].update({'treeTop': 585, 'hillLine': 717})
meta['BG3'].update({'grassLine': 943})
meta['BG4'].update({'grassEdge': 612, 'puddle': [839.5, 716.0, 385.5, 48.0]})
meta['BG5'].update({'vp': [470, 1018]})
json.dump(meta, open('../../src/mosquito/bg.json', 'w'), indent=1)
print(json.dumps(meta, indent=1))
