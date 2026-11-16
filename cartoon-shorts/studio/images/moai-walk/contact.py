# contact.py DIR OUT [cols] - grid of stills with their frame/time labels
import sys, glob, os
from PIL import Image, ImageDraw
d, out = sys.argv[1], sys.argv[2]; cols = int(sys.argv[3]) if len(sys.argv) > 3 else 7
fs = sorted(glob.glob(d + '/*.png'))
ims = [Image.open(f).convert('RGB') for f in fs]
w, h = 270, 480
S = Image.new('RGB', (cols * w, ((len(ims) + cols - 1) // cols) * (h + 22)), 'white')
dr = ImageDraw.Draw(S)
for i, (f, im) in enumerate(zip(fs, ims)):
    im = im.resize((w, h)); x, y = (i % cols) * w, (i // cols) * (h + 22)
    S.paste(im, (x, y + 22)); fr = int(os.path.basename(f).split('_')[-1][:5]); dr.text((x + 4, y + 4), f'{fr} = {fr/60:.2f}s', fill='black')
S.save(out)
