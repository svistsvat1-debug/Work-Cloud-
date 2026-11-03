"""python sheet.py DIR OUT.png [cols] -> grid of all PNGs in DIR with their frame/time labels"""
import sys, glob, os
from PIL import Image, ImageDraw
d, out = sys.argv[1], sys.argv[2]; cols = int(sys.argv[3]) if len(sys.argv) > 3 else 7
fs = sorted(glob.glob(f"{d}/f*.png")); ims = [Image.open(f).convert('RGB') for f in fs]
w, h = 270, 480
sheet = Image.new('RGB', (cols * w, ((len(ims) + cols - 1) // cols) * (h + 22)), 'white')
dr = ImageDraw.Draw(sheet)
for i, (f, im) in enumerate(zip(fs, ims)):
    x, y = (i % cols) * w, (i // cols) * (h + 22)
    sheet.paste(im.resize((w, h)), (x, y + 22))
    fr = int(os.path.basename(f)[1:5]); dr.text((x + 6, y + 4), f"f{fr}  {fr/60:.2f}s", fill='black')
sheet.save(out); print(out, sheet.size)
