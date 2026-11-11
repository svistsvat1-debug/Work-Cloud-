"""Generate the warm paper texture (public/paper.png). Pure numpy noise, no external assets."""
import numpy as np
from PIL import Image, ImageFilter
rng = np.random.default_rng(7)
W, H = 1920, 1080
base = np.array([0xFA, 0xF8, 0xF3], float)
n1 = rng.normal(0, 1, (H, W))
img = Image.fromarray(((n1 - n1.min())/(np.ptp(n1))*255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))
fine = np.asarray(img, float)/255 - 0.5
coarse = np.asarray(Image.fromarray(((rng.random((H//40, W//40)))*255).astype(np.uint8)).resize((W, H), Image.BICUBIC), float)/255 - 0.5
tex = base[None, None, :] + (fine*7 + coarse*5)[..., None]*np.array([1.0, 0.98, 0.94])
Image.fromarray(np.clip(tex, 0, 255).astype(np.uint8)).save('public/paper.png', optimize=True)
