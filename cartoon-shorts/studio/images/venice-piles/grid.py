# grid.py IN OUT [step] [x0 y0 x1 y1] - crop + grid lines with coordinates (for reading anchors by eye)
import sys
from PIL import Image, ImageDraw
src, out = sys.argv[1], sys.argv[2]; step = int(sys.argv[3]) if len(sys.argv) > 3 else 50
im = Image.open(src).convert('RGBA')
if len(sys.argv) > 7:
    x0, y0, x1, y1 = map(int, sys.argv[4:8]); im = im.crop((x0, y0, x1, y1))
else: x0 = y0 = 0
bg = Image.new('RGBA', im.size, (255, 0, 255, 255)); bg.alpha_composite(im); im = bg.convert('RGB')
sc = max(1, 900 // max(im.size)) if max(im.size) < 900 else 1
im = im.resize((im.width * sc, im.height * sc), Image.NEAREST)
d = ImageDraw.Draw(im)
for x in range(((x0 // step) + 1) * step, x0 + im.width // sc, step):
    X = (x - x0) * sc; d.line([(X, 0), (X, im.height)], fill=(0, 200, 255) if x % (step * 2) else (255, 255, 0), width=1); d.text((X + 2, 2), str(x), fill='yellow')
for y in range(((y0 // step) + 1) * step, y0 + im.height // sc, step):
    Y = (y - y0) * sc; d.line([(0, Y), (im.width, Y)], fill=(0, 200, 255) if y % (step * 2) else (255, 255, 0), width=1); d.text((2, Y + 2), str(y), fill='yellow')
im.save(out)
