# grid.py DIR OUT [cols] - contact sheet of the stills in DIR (sorted), labelled with the time
import sys, glob, os
from PIL import Image, ImageDraw
d, out = sys.argv[1], sys.argv[2]; cols = int(sys.argv[3]) if len(sys.argv) > 3 else 7
fs = sorted(glob.glob(os.path.join(d, '*.png')))
ims = [Image.open(f).convert('RGB') for f in fs]
w, h = ims[0].size; rows = (len(ims) + cols - 1) // cols
S = Image.new('RGB', (cols * w, rows * (h + 22)), 'white'); dr = ImageDraw.Draw(S)
for i, (f, im) in enumerate(zip(fs, ims)):
    x, y = (i % cols) * w, (i // cols) * (h + 22)
    S.paste(im, (x, y + 22)); fr = int(f.split('_')[-1][:5]); dr.text((x + 4, y + 4), f'{fr / 60:.2f}s', fill='black')
S.save(out)
