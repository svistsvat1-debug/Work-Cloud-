# contact sheet of PNG stills: python3 -I scripts/contact.py dir out.png cols
import sys, os
from PIL import Image, ImageDraw
d, out, cols = sys.argv[1], sys.argv[2], int(sys.argv[3]) if len(sys.argv) > 3 else 6
fs = sorted(x for x in os.listdir(d) if x.endswith('.png'))
ims = [Image.open(os.path.join(d, x)).convert('RGB') for x in fs]
w, h = 270, 480
rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * w, rows * (h + 24)), (30, 30, 30))
dr = ImageDraw.Draw(sheet)
for i, (im, name) in enumerate(zip(ims, fs)):
    im = im.resize((w, h))
    x, y = (i % cols) * w, (i // cols) * (h + 24)
    sheet.paste(im, (x, y + 24))
    dr.text((x + 6, y + 6), f"{name[1:5]}  t={int(name[1:5]) / 60:.2f}s", fill=(255, 255, 255))
sheet.save(out)
