# sheet.py cut_dir out.png - every cut-out on a coloured background (magenta / dark night / checker) for QA
import sys, glob, os
from PIL import Image, ImageDraw
files = sorted(glob.glob(f"{sys.argv[1]}/*.png"))
cell = 360; bgs = [(255, 0, 200), (20, 28, 60), (60, 200, 90)]
sheet = Image.new("RGB", (cell * len(bgs), cell * len(files)), "white")
d = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    im = Image.open(f); im.thumbnail((cell - 20, cell - 30))
    for j, c in enumerate(bgs):
        tile = Image.new("RGB", (cell, cell), c); tile.paste(im, ((cell - im.width) // 2, 24 + (cell - 30 - im.height) // 2), im)
        sheet.paste(tile, (j * cell, i * cell))
    d.text((6, i * cell + 4), os.path.basename(f), fill="white")
sheet.save(sys.argv[2])
