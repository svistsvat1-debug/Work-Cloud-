# qa sheet: every cut-out on a coloured background. usage: sheet.py out.png file1.png file2.png ...
import sys
from PIL import Image
files = sys.argv[2:]; tw, th = 360, 640
sheet = Image.new('RGB', (tw * len(files), th), (60, 140, 200))
for i, f in enumerate(files):
    im = Image.open(f).convert('RGBA'); im.thumbnail((tw, th))
    bgc = [(60, 140, 200), (230, 90, 160), (40, 40, 60)][i % 3]
    tile = Image.new('RGBA', (tw, th), bgc + (255,)); tile.alpha_composite(im, ((tw - im.width) // 2, (th - im.height) // 2))
    sheet.paste(tile.convert('RGB'), (i * tw, 0))
sheet.save(sys.argv[1])
