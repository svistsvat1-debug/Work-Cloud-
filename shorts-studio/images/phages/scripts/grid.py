# grid.py OUT.png img1 img2 ... -> labelled contact sheet
import sys, os
from PIL import Image, ImageDraw
out, files = sys.argv[1], sys.argv[2:]
ims = [Image.open(f).convert('RGB') for f in files]
w, h = 270, 480
cols = 8
rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * w, rows * (h + 24)), (30, 30, 30))
d = ImageDraw.Draw(sheet)
for i, (f, im) in enumerate(zip(files, ims)):
    r, c = divmod(i, cols)
    sheet.paste(im.resize((w, h)), (c * w, r * (h + 24) + 24))
    d.text((c * w + 6, r * (h + 24) + 5), os.path.basename(f)[:-4] + ' s', fill=(255, 255, 255))
sheet.save(out)
