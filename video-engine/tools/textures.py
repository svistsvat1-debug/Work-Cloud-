"""Marker-colouring textures (seamless 512x512 tiles), generated once by code.
Each colour gets a 'base' tile (dense parallel marker strokes with darker overlaps, light streaks and tiny paper gaps)
and a 'dark' tile used for the automatic shade band along the bottom-right edge of every filled shape.
Usage: python3 textures.py out_dir
"""
import colorsys, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

S = 512
PALETTE = {
    "olive": "#6B7B3A", "khaki": "#C2B280", "steel": "#6E7B85", "brown": "#8B5A2B", "mud": "#7A5C3E",
    "red": "#E8322B", "orange": "#F58A1F", "yellow": "#FFC93C", "blue": "#1E88E5", "green": "#3BA55C",
    "grey": "#A7AEB2", "white": "#F4F1EA", "paper": "#F1E7CF", "skinLight": "#F3D2B3", "skinMid": "#C98E62",
    "skinDark": "#7B4B2A", "land": "#D9CC9A", "sea": "#3A8FD8", "ink": "#2A2A2A", "darkolive": "#4E5A2A",
    "hay": "#E3C35A", "horse": "#8A6A4A", "wood": "#A0703C", "film": "#3C4650", "skyblue": "#BFE3F5",
    "brick": "#C46A4A", "potato": "#C9A26B", "tankdark": "#4A4A3A", "moon": "#E9E4C8", "bottle": "#F6E6A6",
    "darkbrown": "#5B4636", "hole": "#3E2C1E", "fieldgrey": "#7C8471", "darkkhaki": "#9C8B5E",
}

def hex2rgb(h):
    h = h.lstrip("#")
    return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], np.float32) / 255

def shade(rgb, light=0.0, sat=0.0):
    h, l, s = colorsys.rgb_to_hls(*rgb)
    return np.array(colorsys.hls_to_rgb(h, min(1, max(0, l + light)), min(1, max(0, s + sat))), np.float32)

def tile(rgb, seed, dark=False):
    rng = np.random.default_rng(seed)
    base = shade(rgb, -0.12 if dark else 0.0, 0.04 if dark else 0.0)
    # start from a light wash of the colour, then paint semi-transparent marker strokes over it;
    # where strokes overlap the colour deepens toward the marker colour (like real marker ink)
    wash = shade(base, 0.14)
    img = np.ones((S, S, 3), np.float32) * wash
    for layer, (n, a_, dl) in enumerate([(170, 0.55, 0.02), (120, 0.45, -0.03), (45, 0.35, -0.08)]):
        acc = Image.new("L", (S * 3, S * 3), 0)
        d = ImageDraw.Draw(acc)
        ang = np.deg2rad(-35 + rng.normal(0, 3))
        for _ in range(n):
            cx, cy = rng.uniform(0, S), rng.uniform(0, S)
            L = rng.uniform(140, 420)
            a = ang + rng.normal(0, 0.06)
            w = int(rng.uniform(12, 22))
            dx, dy = np.cos(a) * L / 2, np.sin(a) * L / 2
            val = int(rng.uniform(170, 255))
            for ox in (-S, 0, S):
                for oy in (-S, 0, S):
                    d.line([(cx - dx + S + ox, cy - dy + S + oy), (cx + dx + S + ox, cy + dy + S + oy)], fill=val, width=w)
        m = np.array(acc.crop((S, S, 2 * S, 2 * S)).filter(ImageFilter.GaussianBlur(1.0)), np.float32) / 255
        col = shade(base, dl)
        k = (m * a_)[..., None]
        img = img * (1 - k) + col * k
    img = np.clip(img, 0, 1)
    # light streaks (paper showing through between strokes)
    streak = Image.new("L", (S * 3, S * 3), 0)
    d = ImageDraw.Draw(streak)
    for _ in range(18):
        cx, cy = rng.uniform(0, S), rng.uniform(0, S)
        L = rng.uniform(60, 200)
        a = np.deg2rad(-35) + rng.normal(0, 0.06)
        dx, dy = np.cos(a) * L / 2, np.sin(a) * L / 2
        for ox in (-S, 0, S):
            for oy in (-S, 0, S):
                d.line([(cx - dx + S + ox, cy - dy + S + oy), (cx + dx + S + ox, cy + dy + S + oy)], fill=255, width=int(rng.uniform(2, 4)))
    st = np.array(streak.crop((S, S, 2 * S, 2 * S)).filter(ImageFilter.GaussianBlur(0.8)), np.float32) / 255
    img = img * (1 - st[..., None] * 0.45) + st[..., None] * 0.45 * np.array([0.98, 0.97, 0.94])
    # fine grain
    img += rng.normal(0, 0.012, img.shape).astype(np.float32)
    return Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8))

def main():
    out = sys.argv[1]
    os.makedirs(out, exist_ok=True)
    for i, (name, hx) in enumerate(PALETTE.items()):
        rgb = hex2rgb(hx)
        tile(rgb, 100 + i).save(f"{out}/{name}.jpg", quality=90)
        tile(rgb, 500 + i, dark=True).save(f"{out}/{name}_d.jpg", quality=90)
    print(len(PALETTE), "colours")

if __name__ == "__main__":
    main()
