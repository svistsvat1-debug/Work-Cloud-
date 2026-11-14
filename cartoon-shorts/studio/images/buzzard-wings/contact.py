# contact.py DIR OUT [cols] - grid of rendered stills with their times
import sys, glob
from PIL import Image, ImageDraw
d, out = sys.argv[1], sys.argv[2]; cols = int(sys.argv[3]) if len(sys.argv) > 3 else 5
fs = sorted(glob.glob(f'{d}/*.png'))
w, h = 360, 640; rows = (len(fs) + cols - 1) // cols
S = Image.new('RGB', (cols * w, rows * (h + 24)), 'white'); dr = ImageDraw.Draw(S)
for i, f in enumerate(fs):
    x = (i % cols) * w; y = (i // cols) * (h + 24)
    S.paste(Image.open(f).convert('RGB').resize((w, h)), (x, y + 24)); dr.text((x + 4, y + 4), f"{int(f[-9:-4]) / 60:.2f}s", fill='black')
S.save(out)
