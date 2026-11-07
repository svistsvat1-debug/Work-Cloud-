"""contact sheet of rendered stills: python3 -I tools/sheet.py dir out.png [cols]"""
import sys, glob, os
from PIL import Image, ImageDraw
d, out = sys.argv[1], sys.argv[2]; cols = int(sys.argv[3]) if len(sys.argv) > 3 else 6
fs = sorted(glob.glob(os.path.join(d, 'f*.png')))
ims = [Image.open(f).convert('RGB') for f in fs]
w, h = 270, 480
rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * (w + 6), rows * (h + 26)), (25, 25, 25))
dr = ImageDraw.Draw(sheet)
for i, (f, im) in enumerate(zip(fs, ims)):
    im = im.resize((w, h)); x, y = (i % cols) * (w + 6), (i // cols) * (h + 26)
    sheet.paste(im, (x, y + 22)); fr = int(os.path.basename(f)[1:5]); dr.text((x + 4, y + 4), f'{fr}  t={fr / 60:.2f}s', fill=(255, 255, 0))
sheet.save(out)
