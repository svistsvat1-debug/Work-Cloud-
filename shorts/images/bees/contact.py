import sys, glob
from PIL import Image, ImageDraw
files = sorted(glob.glob(sys.argv[1] + "/f*.png")); out = sys.argv[2]; cols = int(sys.argv[3]) if len(sys.argv) > 3 else 5
W = 270; H = 480
rows = (len(files) + cols - 1) // cols
sh = Image.new("RGB", (cols * (W + 6), rows * (H + 22)), (25, 25, 25)); d = ImageDraw.Draw(sh)
for i, f in enumerate(files):
    im = Image.open(f).convert("RGB").resize((W, H), Image.LANCZOS)
    x, y = (i % cols) * (W + 6), (i // cols) * (H + 22)
    sh.paste(im, (x, y + 20)); fr = int(f[-8:-4]); d.text((x + 3, y + 3), f"{fr/60:.2f}s  f{fr}", fill=(255, 255, 0))
sh.save(out); print(sh.size)
