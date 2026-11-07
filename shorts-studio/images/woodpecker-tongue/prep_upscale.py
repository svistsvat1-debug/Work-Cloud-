"""Upscale keyed sprites x3 for 4K (Lanczos + tightened alpha edge + light unsharp) and split the
wood chips. Output -> public/woodpecker-tongue/. (07_bird_xray is not used: the X-ray is built in
code from the hero silhouette so it lines up exactly - see prep_xray.py.)"""
import numpy as np, cv2
from PIL import Image, ImageFilter

SRC = 'images/woodpecker-tongue/keyed/'
DST = 'public/woodpecker-tongue/'
S = 3
jobs = {  # out name: (keyed file, mirror)
    'bird': ('01_bird_hero', False),
    'head': ('08_head', False),
    'grub': ('11_grub', False),
    'grub_curled': ('12_grub_curled', False),
    'grub_stretched': ('13_grub_stretched', False),
    'trunk': ('16_trunk', False),
    'owl': ('22_owl', False),
    'penguin': ('24_penguin', False),
}

def up(im: Image.Image, s=S) -> Image.Image:
    w, h = im.size
    rgb = im.convert('RGB').resize((w * s, h * s), Image.LANCZOS).filter(ImageFilter.UnsharpMask(2, 60, 2))
    a = np.asarray(im.getchannel('A').resize((w * s, h * s), Image.LANCZOS)).astype(np.float32) / 255
    a = np.clip((a - 0.25) / 0.5, 0, 1)
    a = a * a * (3 - 2 * a)
    out = rgb.convert('RGBA'); out.putalpha(Image.fromarray((a * 255).astype(np.uint8)))
    return out

for name, (src, mirror) in jobs.items():
    im = Image.open(SRC + src + '.png')
    if mirror:
        im = im.transpose(Image.FLIP_LEFT_RIGHT)
    o = up(im); o.save(DST + name + '.png', optimize=True)
    print(name, o.size)

# wood chips: 6 separate sprites
im = Image.open(SRC + '18_woodchips.png'); a = np.asarray(im)[..., 3] > 128
n, lab, st, cen = cv2.connectedComponentsWithStats(a.astype(np.uint8))
k = 0
for i in np.argsort(-st[1:, cv2.CC_STAT_AREA])[:6] + 1:
    x, y, w, h = st[i, :4]
    c = im.crop((x - 6, y - 6, x + w + 6, y + h + 6))
    m = (lab[max(y - 6, 0):y + h + 6, max(x - 6, 0):x + w + 6] == i)
    arr = np.asarray(c).copy(); arr[..., 3] = np.where(np.pad(m, ((0, arr.shape[0] - m.shape[0]), (0, arr.shape[1] - m.shape[1]))), arr[..., 3], 0)
    up(Image.fromarray(arr), 2).save(DST + f'chip{k}.png'); k += 1
print('chips', k)
