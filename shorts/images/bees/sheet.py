import sys, glob, numpy as np
from PIL import Image, ImageDraw
files = sorted(glob.glob(sys.argv[1])); out = sys.argv[2]; col = tuple(int(sys.argv[3][i:i+2], 16) for i in (0, 2, 4)) if len(sys.argv) > 3 else (60, 140, 90)
W, H, cols = 256, 459, 6
rows = (len(files) + cols - 1) // cols
sheet = Image.new("RGB", (W * cols, (H + 18) * rows), col)
d = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    im = Image.open(f).convert("RGBA"); im.thumbnail((W, H), Image.LANCZOS)
    x, y = (i % cols) * W, (i // cols) * (H + 18)
    sheet.paste(im, (x + (W - im.width) // 2, y + 18 + (H - im.height) // 2), im)
    d.text((x + 4, y + 3), f.split("/")[-1][:-4], fill=(255, 255, 255))
sheet.save(out)
