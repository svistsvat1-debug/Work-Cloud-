# sheet.py out.png cols files... -> labelled contact sheet
import sys
from PIL import Image, ImageDraw
out, cols, files = sys.argv[1], int(sys.argv[2]), sys.argv[3:]
ims = [Image.open(f).convert("RGB") for f in files]
w, h = ims[0].size; tw, th = w // 2, h // 2
rows = (len(ims) + cols - 1) // cols
sheet = Image.new("RGB", (cols * tw, rows * (th + 26)), "white"); d = ImageDraw.Draw(sheet)
for i, (im, f) in enumerate(zip(ims, files)):
    x, y = (i % cols) * tw, (i // cols) * (th + 26)
    sheet.paste(im.resize((tw, th)), (x, y + 26)); d.text((x + 6, y + 6), f.split("t_")[-1].replace(".png", "s"), fill="black")
sheet.save(out)
