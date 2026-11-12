"""Pre-render film grain frames and a paper texture once (no live SVG noise filters).
Usage: python3 tools/textures.py  -> public/grain/g0..g7.png (960x540, upscaled in CSS), public/paper.png
"""
import numpy as np
from PIL import Image, ImageFilter
from pathlib import Path

out = Path(__file__).resolve().parent.parent / 'public'
(out / 'grain').mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(7)
W, H = 960, 540
for i in range(8):
    n = rng.normal(0.5, 0.18, (H, W))
    img = Image.fromarray((np.clip(n, 0, 1) * 255).astype('uint8'), 'L').filter(ImageFilter.GaussianBlur(0.45))
    img.save(out / 'grain' / f'g{i}.png', optimize=True)

# paper: low-frequency blotches + fibres, mid-grey so it can be used with soft-light / multiply
W2, H2 = 1920, 1080
def lowfreq(scale, seed):
    r = np.random.default_rng(seed).random((H2 // scale + 2, W2 // scale + 2))
    im = Image.fromarray((r * 255).astype('uint8'), 'L').resize((W2, H2), Image.BICUBIC)
    return np.asarray(im, dtype=np.float32) / 255
p = 0.5 * lowfreq(120, 1) + 0.3 * lowfreq(40, 2) + 0.2 * lowfreq(12, 3)
fib = np.random.default_rng(4).random((H2, W2 // 6))
fib = np.asarray(Image.fromarray((fib * 255).astype('uint8'), 'L').resize((W2, H2), Image.BILINEAR), dtype=np.float32) / 255
p = 0.8 * p + 0.2 * fib
p = (p - p.min()) / (p.max() - p.min())
p = 0.5 + (p - 0.5) * 0.5
Image.fromarray((p * 255).astype('uint8'), 'L').save(out / 'paper.png', optimize=True)
print('textures ok')
