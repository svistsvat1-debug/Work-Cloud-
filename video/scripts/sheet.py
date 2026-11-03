"""Contact sheet: grid of stills with their time stamps. usage: python3 sheet.py <dir> <out.png> [cols]"""
import sys, glob, os
from PIL import Image, ImageDraw
d, out = sys.argv[1], sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 6
files = sorted(glob.glob(os.path.join(d, 'f*.png')))
ims = [Image.open(f).convert('RGB') for f in files]
w, h = ims[0].size
tw = 270; th = int(h * tw / w)
rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * tw, rows * (th + 26)), 'white')
dr = ImageDraw.Draw(sheet)
for i, (f, im) in enumerate(zip(files, ims)):
    x, y = (i % cols) * tw, (i // cols) * (th + 26)
    sheet.paste(im.resize((tw, th)), (x, y + 26))
    fr = int(os.path.basename(f)[1:6])
    dr.text((x + 6, y + 6), f"{fr/60:.2f}s  f{fr}", fill='black')
sheet.save(out)
print(out, sheet.size)
