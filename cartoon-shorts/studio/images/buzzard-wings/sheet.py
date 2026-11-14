# sheet.py OUT.png IN1.png IN2.png ... -> each cut-out on magenta and dark blue
import sys
from PIL import Image
out, ins = sys.argv[1], sys.argv[2:]
tiles = []
for p in ins:
    im = Image.open(p).convert("RGBA"); im.thumbnail((360, 360))
    row = Image.new("RGB", (760, 380), (255, 255, 255))
    for i, c in enumerate([(255, 0, 255), (20, 30, 90)]):
        t = Image.new("RGB", (370, 370), c); t.paste(im, ((370 - im.width) // 2, (370 - im.height) // 2), im)
        row.paste(t, (5 + i * 380, 5))
    tiles.append(row)
cols = 2; rows = (len(tiles) + 1) // 2
S = Image.new("RGB", (760 * cols, 380 * rows), (255, 255, 255))
for i, t in enumerate(tiles): S.paste(t, ((i % cols) * 760, (i // cols) * 380))
S.save(out)
