"""frame0.png -> thumbnail.png: question in big white letters with a thick black outline."""
import sys
from PIL import Image, ImageDraw, ImageFont
src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB')
W, H = im.size
d = ImageDraw.Draw(im)
font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 82)
lines = ["WHY DOESN'T RAIN", "KILL MOSQUITOES?"]
y = int(H * 0.83)
for i, ln in enumerate(lines):
    fill = '#FFFFFF' if i < 1 else '#FFE24A'
    bb = d.textbbox((0, 0), ln, font=font, stroke_width=12)
    x = (W - (bb[2] - bb[0])) // 2
    d.text((x, y), ln, font=font, fill=fill, stroke_width=12, stroke_fill='#1d1a22')
    y += 108
im.save(out)
print(out, im.size)
