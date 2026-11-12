"""Rebuild non-text assets after a fresh clone: paper texture + bundled fonts (run from video-engine/ after npm install)."""
import shutil, os
import numpy as np
from PIL import Image, ImageFilter, ImageDraw

os.makedirs("public/fonts", exist_ok=True)
shutil.copy("node_modules/@fontsource/permanent-marker/files/permanent-marker-latin-400-normal.woff2", "public/fonts/PermanentMarker.woff2")
shutil.copy("node_modules/@fontsource/caveat-brush/files/caveat-brush-latin-400-normal.woff2", "public/fonts/CaveatBrush.woff2")

rng = np.random.default_rng(7)
H, W = 1080, 1920
base = np.array([0xFA, 0xF8, 0xF3], dtype=np.float32)
n = rng.normal(0, 1, (H // 4, W // 4)).astype(np.float32)
n = np.array(Image.fromarray(((n * 20) + 128).clip(0, 255).astype(np.uint8)).resize((W, H), Image.BICUBIC).filter(ImageFilter.GaussianBlur(6)), dtype=np.float32) - 128
fine = rng.normal(0, 1.6, (H, W)).astype(np.float32)
img = base[None, None, :] + (n * 0.12 + fine)[..., None] * np.array([1, 1, 1.1], dtype=np.float32)
ghost = Image.new("L", (W, H), 0)
d = ImageDraw.Draw(ghost)
for i in range(7):
    x, y = rng.integers(100, W - 300), rng.integers(100, H - 200)
    d.arc([x, y, x + rng.integers(150, 400), y + rng.integers(80, 250)], start=rng.integers(0, 180), end=rng.integers(200, 360), fill=255, width=10)
ghost = np.array(ghost.filter(ImageFilter.GaussianBlur(9)), dtype=np.float32) / 255
img = img - ghost[..., None] * 5
Image.fromarray(img.clip(0, 255).astype(np.uint8)).save("public/paper.png", optimize=True)
print("assets ok")
