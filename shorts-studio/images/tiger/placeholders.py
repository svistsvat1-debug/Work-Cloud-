"""placeholders.py - rough stand-in pictures in raw/ so the animation can be built and timed before the real
pictures exist. Never overwrites a real picture (only writes files that are missing or marked as placeholders)."""
import os
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, "raw")
os.makedirs(RAW, exist_ok=True)
MARK = os.path.join(RAW, ".placeholders")
made = set(open(MARK).read().split()) if os.path.exists(MARK) else set()
INK = (20, 20, 20, 255)


def canvas(w, h):
    im = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    return im, ImageDraw.Draw(im)


def save(name, im):
    p = os.path.join(RAW, name + ".png")
    if os.path.exists(p) and name not in made:
        print("keep real", name)
        return
    im.save(p)
    made.add(name)


def guy(name, waist=False):
    im, d = canvas(800, 1000 if waist else 1200)
    if not waist:
        d.rounded_rectangle((330, 520, 470, 980), 60, fill=(250, 250, 250, 255), outline=INK, width=14)
        d.line((470, 620, 700, 560), fill=INK, width=40)
        d.ellipse((300, 960, 400, 1010), fill=(250, 250, 250, 255), outline=INK, width=12)
        d.ellipse((400, 960, 500, 1010), fill=(250, 250, 250, 255), outline=INK, width=12)
    else:
        d.rounded_rectangle((300, 560, 500, 990), 60, fill=(250, 250, 250, 255), outline=INK, width=14)
    d.ellipse((200, 140, 600, 540), fill=(250, 250, 250, 255), outline=INK, width=16)
    d.ellipse((400, 300, 430, 350), fill=INK)
    d.ellipse((490, 300, 520, 350), fill=INK)
    d.text((230, 60), name, fill=INK)
    save(name, im)


def tiger(name, col=(255, 140, 30, 255), sit=False):
    if sit:
        im, d = canvas(900, 900)
        d.ellipse((250, 300, 700, 860), fill=col, outline=INK, width=16)
        d.ellipse((300, 60, 660, 420), fill=col, outline=INK, width=16)
        d.rectangle((560, 520, 640, 640), fill=(80, 170, 60, 255), outline=INK, width=10)
    else:
        im, d = canvas(1500, 1000)
        d.ellipse((250, 450, 1150, 860), fill=col, outline=INK, width=16)
        d.ellipse((950, 330, 1330, 710), fill=col, outline=INK, width=16)
        d.arc((120, 250, 420, 650), 90, 270, fill=INK, width=40)
        d.ellipse((1150, 470, 1180, 520), fill=INK)
        d.ellipse((1230, 470, 1260, 520), fill=INK)
    d.text((300, 30), name, fill=INK)
    save(name, im)


def deer(name):
    im, d = canvas(1500, 1000)
    col = (196, 140, 88, 255)
    d.ellipse((500, 380, 1250, 720), fill=col, outline=INK, width=16)
    for x in (600, 720, 1020, 1140):
        d.rectangle((x, 660, x + 50, 950), fill=col, outline=INK, width=12)
    d.rectangle((480, 220, 600, 520), fill=col, outline=INK, width=14)
    d.ellipse((300, 120, 620, 380), fill=col, outline=INK, width=16)
    d.ellipse((400, 210, 430, 260), fill=INK)
    d.text((700, 60), name, fill=INK)
    save(name, im)


guy("guy_point")
guy("guy_eyes", waist=True)
tiger("tiger_hide")
tiger("tiger_sheepish")
tiger("tiger_smug")
tiger("tiger_paint", sit=True)
deer("deer_chew")
deer("deer_confused")

im, d = canvas(800, 800)
d.ellipse((150, 300, 650, 720), fill=(86, 168, 58, 255), outline=INK, width=16)
save("bush_small", im)

im, d = canvas(1800, 1200)
for i in range(6):
    d.ellipse((40 + i * 290, 500 - (i % 2) * 90, 420 + i * 290, 1150), fill=(60, 140, 60, 255), outline=INK, width=14)
save("bushes_mid", im)

im, d = canvas(1000, 1000)
d.polygon([(60, 60), (900, 200), (500, 520)], fill=(40, 120, 50, 255), outline=INK)
d.polygon([(60, 60), (300, 900), (520, 480)], fill=(50, 135, 55, 255), outline=INK)
save("fg_leaves", im)

im = Image.new("RGBA", (1600, 2000), (58, 120, 70, 255))
d = ImageDraw.Draw(im)
for i in range(7):
    d.rectangle((80 + i * 230, 0, 160 + i * 230, 2000), fill=(70, 60, 45, 255))
    d.ellipse((i * 230 - 60, 200 + (i % 3) * 180, i * 230 + 300, 620 + (i % 3) * 180), fill=(46, 104, 60, 255))
save("jungle_bg", im)

open(MARK, "w").write("\n".join(sorted(made)))
print("placeholders:", sorted(made))
