import json, re, glob
from PIL import Image, ImageDraw
src = open("../../src/bees/sprites.ts").read()
S = json.loads(src[src.index("{"):src.rindex("}") + 1])
names = list(S.keys())
W, H, cols = 300, 420, 6
rows = (len(names) + cols - 1) // cols
sheet = Image.new("RGB", (W * cols, (H + 16) * rows), (60, 140, 90))
d = ImageDraw.Draw(sheet)
for i, n in enumerate(names):
    im = Image.open(f"../../public/bees/s/{n}.png").convert("RGBA")
    k = min(W / im.width, H / im.height)
    t = im.resize((max(1, int(im.width * k)), max(1, int(im.height * k))), Image.LANCZOS)
    x, y = (i % cols) * W, (i // cols) * (H + 16)
    ox, oy = x + (W - t.width) // 2, y + 16 + (H - t.height) // 2
    sheet.paste(t, (ox, oy), t)
    d.text((x + 4, y + 2), n, fill=(255, 255, 255))
    for key, v in S[n].items():
        if key in ("w", "h"): continue
        px, py = ox + v[0] * k, oy + v[1] * k
        if len(v) == 3:
            r = v[2] * k; d.ellipse([px - r, py - r, px + r, py + r], outline=(255, 0, 0), width=2)
        d.ellipse([px - 4, py - 4, px + 4, py + 4], fill=(255, 0, 0))
        d.text((px + 5, py - 5), key, fill=(255, 255, 0))
sheet.save("qa/sheet_anchors.png")
print(sheet.size)
