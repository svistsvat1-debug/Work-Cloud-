"""YouTube channel art: export to spec + device previews.
usage: python3 channel_art_check.py <banner_src> <avatar_src> <outdir>
Banner: 2560x1440, safe area for all devices = centred 1546x423 (mobile), tablet 1855x423, desktop 2560x423, TV = full.
Avatar: 800x800, shown as a circle down to 98x98 (and ~32 px in comments)."""
import sys, os
from PIL import Image, ImageDraw
b_src, a_src, out = sys.argv[1:4]; os.makedirs(out, exist_ok=True)
W, H = 2560, 1440
b = Image.open(b_src).convert("RGB").resize((W, H), Image.LANCZOS)
b.save(f"{out}/banner_2560x1440.jpg", quality=92, optimize=True)
b.save(f"{out}/banner_2560x1440.png", optimize=True)
zones = {"mobile 1546x423 (SAFE)": (1546, 423, "red"), "tablet 1855x423": (1855, 423, "orange"), "desktop 2560x423": (2560, 423, "blue")}
ov = b.copy(); d = ImageDraw.Draw(ov)
for name, (w, h, c) in zones.items():
    x0, y0 = (W - w) // 2, (H - h) // 2
    d.rectangle([x0, y0, x0 + w - 1, y0 + h - 1], outline=c, width=8); d.text((x0 + 12, y0 + 10), name, fill=c)
ov.resize((1280, 720)).save(f"{out}/check_banner_zones.jpg", quality=88)
# device previews (what each device really shows)
crops = {"tv_full": (W, H), "desktop": (2560, 423), "tablet": (1855, 423), "mobile": (1546, 423)}
prev = Image.new("RGB", (1280, 1700), "#222")
y = 0
for k, (w, h) in crops.items():
    x0, y0 = (W - w) // 2, (H - h) // 2
    c = b.crop((x0, y0, x0 + w, y0 + h)); s = 1280 / w if k != "tv_full" else 0.5
    c = c.resize((int(w * s), int(h * s)), Image.LANCZOS)
    prev.paste(c, ((1280 - c.width) // 2, y)); y += c.height + 10
prev.crop((0, 0, 1280, y)).save(f"{out}/check_banner_devices.jpg", quality=88)
# avatar
a = Image.open(a_src).convert("RGB"); s = min(a.size)
a = a.crop(((a.width - s) // 2, (a.height - s) // 2, (a.width + s) // 2, (a.height + s) // 2)).resize((800, 800), Image.LANCZOS)
a.save(f"{out}/avatar_800x800.png", optimize=True); a.save(f"{out}/avatar_800x800.jpg", quality=95)
sheet = Image.new("RGB", (1000, 420), "#0f0f0f"); x = 20
for size in (400, 176, 98, 48, 32):
    t = a.resize((size, size), Image.LANCZOS); m = Image.new("L", (size, size), 0); ImageDraw.Draw(m).ellipse([0, 0, size - 1, size - 1], fill=255)
    sheet.paste(t, (x, 10), m); x += size + 30
sheet.save(f"{out}/check_avatar_circles.png")
print("ok", os.path.getsize(f"{out}/banner_2560x1440.jpg") // 1024, "KB jpg;", os.path.getsize(f"{out}/banner_2560x1440.png") // 1024, "KB png")
