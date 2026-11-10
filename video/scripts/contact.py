import sys, glob
from PIL import Image, ImageDraw
files = sorted(glob.glob('out/stills/*.png'))
cols = int(sys.argv[1]) if len(sys.argv) > 1 else 8
ims = [Image.open(f).convert('RGB') for f in files]
w, h = ims[0].size
tw, th = 216, 384
rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * tw, rows * (th + 22)), 'white')
d = ImageDraw.Draw(sheet)
for i, (f, im) in enumerate(zip(files, ims)):
    x, y = (i % cols) * tw, (i // cols) * (th + 22)
    sheet.paste(im.resize((tw, th)), (x, y + 22))
    fr = int(f.split('/f')[-1][:4])
    d.text((x + 4, y + 4), f'{fr/60:.2f}s', fill='black')
sheet.save(sys.argv[2] if len(sys.argv) > 2 else 'out/contact.png')
