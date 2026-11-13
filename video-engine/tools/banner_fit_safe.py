"""Fit a generated 16:9 banner into YouTube's all-device safe area (1546x423 centred in 2560x1440).
The whole art is scaled down by S around the centre and laid over the original (with its central
content erased) using a feathered edge, so the outer doodles still fill TV/desktop views.
usage: python3 banner_fit_safe.py raw.png out.png S erase_x0 erase_y0 erase_x1 erase_y1   (erase box in 2560x1440 coords)"""
import sys
import numpy as np
from PIL import Image, ImageFilter, ImageDraw
src, out, S = sys.argv[1], sys.argv[2], float(sys.argv[3]); ex0, ey0, ex1, ey1 = map(int, sys.argv[4:8])
W, H = 2560, 1440
base = Image.open(src).convert("RGB").resize((W, H), Image.LANCZOS)
arr = np.asarray(base).astype(np.float32)
board = np.median(arr.reshape(-1, 3), axis=0)  # board colour
under = base.copy(); d = ImageDraw.Draw(under)
d.rectangle([ex0, ey0, ex1, ey1], fill=tuple(int(c) for c in board))
sw, sh = int(W * S), int(H * S)
small = base.resize((sw, sh), Image.LANCZOS)
m = Image.new("L", (sw, sh), 0); f = int(min(sw, sh) * 0.08)
ImageDraw.Draw(m).rectangle([f, f, sw - f, sh - f], fill=255); m = m.filter(ImageFilter.GaussianBlur(f / 2.5))
under.paste(small, ((W - sw) // 2, (H - sh) // 2), m)
under.save(out)
print("board", board.round(), "scaled", sw, sh)
