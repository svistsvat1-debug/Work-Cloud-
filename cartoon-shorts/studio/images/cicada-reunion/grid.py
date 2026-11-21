from PIL import Image, ImageDraw
import glob, sys
d0 = sys.argv[1] if len(sys.argv) > 1 else 'qa/stills'
fs = sorted(glob.glob(f'{d0}/*.png'))
ims = [Image.open(f).convert('RGB').resize((270, 480)) for f in fs]
cols = 6; rows = (len(ims) + cols - 1) // cols
sh = Image.new('RGB', (cols * 272, rows * 500), 'white'); d = ImageDraw.Draw(sh)
for i, (im, f) in enumerate(zip(ims, fs)):
    x, y = (i % cols) * 272, (i // cols) * 500; sh.paste(im, (x, y)); d.text((x + 4, y + 482), f.split('_')[-1][:-4] + ' f', fill='black')
sh.save(sys.argv[2] if len(sys.argv) > 2 else 'qa/contact.jpg', quality=85)
