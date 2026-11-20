# grid_sheet.py DIR OUT [cols] - contact sheet of the stills with their time printed
import sys, os, glob
from PIL import Image, ImageDraw
d, out = sys.argv[1], sys.argv[2]; cols = int(sys.argv[3]) if len(sys.argv) > 3 else 7
fs = sorted(glob.glob(os.path.join(d, '*.png')))
ims = [Image.open(f).convert('RGB') for f in fs]
w, h = 270, 480
rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * w, rows * h), 'white')
for i, (f, im) in enumerate(zip(fs, ims)):
    im = im.resize((w, h)); dr = ImageDraw.Draw(im)
    fr = int(os.path.basename(f).split('_')[-1].split('.')[0])
    dr.rectangle([0, 0, 70, 22], fill='black'); dr.text((4, 4), f'{fr/60:.2f}s', fill='white')
    sheet.paste(im, ((i % cols) * w, (i // cols) * h))
sheet.save(out, quality=85)
print(out, sheet.size)
