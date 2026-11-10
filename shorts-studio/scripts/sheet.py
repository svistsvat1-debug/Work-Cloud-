import sys, glob
from PIL import Image, ImageDraw
ts = sys.argv[2:]
out = sys.argv[1]
ims = []
for t in ts:
    im = Image.open(f'out/qa/s_{float(t):.2f}.png')
    w, h = im.size
    im = im.resize((w // 2, h // 2))
    ImageDraw.Draw(im).text((8, 8), t, fill='red')
    ims.append(im)
cols = min(5, len(ims)); rows = (len(ims) + cols - 1) // cols
w, h = ims[0].size
sheet = Image.new('RGB', (cols * w, rows * h), 'white')
for i, im in enumerate(ims):
    sheet.paste(im, ((i % cols) * w, (i // cols) * h))
sheet.save(out)
