# contact sheet: python3 scripts/sheet.py <dir> <out.png> [cols]
import sys, glob, os
from PIL import Image, ImageDraw
d, out = sys.argv[1], sys.argv[2]; cols = int(sys.argv[3]) if len(sys.argv) > 3 else 4
fs = sorted(glob.glob(os.path.join(d, 'f*.png')))
ims = [Image.open(f).convert('RGB') for f in fs]
w, h = ims[0].size; tw = 270; th = int(h * tw / w)
rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * tw, rows * (th + 22)), 'white')
dr = ImageDraw.Draw(sheet)
for i, (f, im) in enumerate(zip(fs, ims)):
    x, y = (i % cols) * tw, (i // cols) * (th + 22)
    sheet.paste(im.resize((tw, th)), (x, y + 22))
    fr = int(os.path.basename(f)[1:5]); dr.text((x + 4, y + 4), f"{fr/60:.2f}s  f{fr}", fill='black')
sheet.save(out); print(out, sheet.size)
