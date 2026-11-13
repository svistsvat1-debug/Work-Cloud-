"""Move the banner's main content block into YouTube's safe area exactly.
usage: python3 banner_fit_content.py raw.png out.png x0 y0 x1 y1   (content box in 2560x1440 coords)
The box is erased from the art, scaled to fit 1546x423 minus a 28 px margin, and pasted centred with a feathered edge."""
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
src, out = sys.argv[1:3]; x0, y0, x1, y1 = map(int, sys.argv[3:7])
W, H = 2560, 1440; SW, SH, M = 1546, 423, 28
img = Image.open(src).convert("RGB").resize((W, H), Image.LANCZOS)
board = tuple(int(c) for c in np.median(np.asarray(img).reshape(-1, 3), axis=0))
block = img.crop((x0, y0, x1, y1))
s = min((SW - 2 * M) / block.width, (SH - 2 * M) / block.height)
bw, bh = int(block.width * s), int(block.height * s)
block = block.resize((bw, bh), Image.LANCZOS)
base = img.copy()
# erase the original block with a soft edge
er = Image.new("L", (W, H), 0); ImageDraw.Draw(er).rectangle([x0, y0, x1, y1], fill=255); er = er.filter(ImageFilter.MaxFilter(31)).filter(ImageFilter.GaussianBlur(8))
base = Image.composite(Image.new("RGB", (W, H), board), base, er)
f = max(6, int(min(bw, bh) * 0.05))
m = Image.new("L", (bw, bh), 0); ImageDraw.Draw(m).rectangle([f, f, bw - f, bh - f], fill=255); m = m.filter(ImageFilter.GaussianBlur(f / 2))
base.paste(block, ((W - bw) // 2, (H - bh) // 2), m)
base.save(out)
print("scale", round(s, 3), "block", bw, bh, "placed at", (W - bw) // 2, (H - bh) // 2, "board", board)
