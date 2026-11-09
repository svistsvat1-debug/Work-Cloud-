#!/usr/bin/env python3
"""
process_art.py: turns the generated pictures in assets/incoming/ into the
transparent game sprites in assets/sprites/.

    python3 tools/process_art.py masks --model birefnet.onnx   # step 1 (only for pictures with a real background)
    python3 tools/process_art.py build                           # step 2

Step 1 cuts the subject out of pictures that have a real background (forest,
dungeon...). It uses the open-source BiRefNet model (MIT license; ONNX version:
onnx-community/BiRefNet-ONNX on Hugging Face) and runs locally. The masks are
saved in assets/incoming/masks/, so step 2 works without the model.
Pictures on a flat green (#00FF00) or magenta (#FF00FF) background need no
model: step 2 removes that color itself.

Step 2 crops each subject, scales it into the sprite canvas (182x182 for
characters and items), adds a thin dark outline, and writes a PNG. The numbers
in SPRITES (box, bottom...) place each picture where the drawn-with-code sprite
was, so collisions, shadows and health bars still line up.

Needs Python 3 with Pillow and numpy (step 1 also needs onnxruntime).
Run it from the game folder (games/horde-survival).
"""
import argparse
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

INCOMING = Path('assets/incoming')
MASKS = INCOMING / 'masks'
OUT = Path('assets/sprites')
SIZE = 182  # GameConfig.spriteSourceSize
OUTLINE = (21, 18, 28)  # same dark outline color as the code-drawn sprites

# One entry per output file.
#   cut     'mask' (BiRefNet mask from step 1), 'green' or 'magenta' (flat background)
#   box     the largest width and height the subject may take in the canvas
#   bottom  y of the subject's lowest pixel (the ground line), or
#   middle  y of the subject's center (for things that float: bats, gems, coins)
#   flip    mirror it (everyone in the game faces right)
#   fade    fade the bottom part out (the brute's legs are cut off in the picture)
#   glow    soft light behind the subject: (r, g, b, strength)
#   hue     recolor: (degrees to rotate, saturation factor, brightness factor)
SPRITES = [
    dict(out='player.png', src='player.jpg', cut='mask', box=(132, 156), bottom=174),
    dict(out='slime.png', src='enemy-slime.jpg', cut='mask', box=(160, 140), bottom=172),
    dict(out='bat.png', src='enemy-bat.jpg', cut='mask', box=(180, 112), middle=78),
    dict(out='crawler.png', src='enemy-crawler.jpg', cut='mask', box=(174, 112), bottom=170, flip=True),
    dict(out='brute.png', src='enemy-brute.jpg', cut='mask', box=(176, 156), bottom=180, fade=0.22),
    dict(out='elite.png', src='enemy-elite.jpg', cut='mask', box=(180, 152), bottom=176,
         glow=(150, 90, 255, 0.4)),  # the violet aura also keeps the dark knight visible
    dict(out='elite-pixel.png', src='enemy-elite-pixel.jpg', cut='green', box=(180, 152), bottom=176),
    dict(out='boss.png', src='enemy-boss.jpg', cut='mask', box=(180, 180), bottom=181,
         glow=(200, 80, 255, 0.35)),
    dict(out='gem-blue.png', src='gem.jpg', cut='mask', box=(116, 168), middle=91, outline=False,
         glow=(120, 210, 255, 0.55)),
    dict(out='gem-green.png', src='gem.jpg', cut='mask', box=(116, 168), middle=91, outline=False,
         hue=(-62, 1.0, 1.0), glow=(120, 255, 160, 0.55)),
    dict(out='gem-red.png', src='gem.jpg', cut='mask', box=(116, 168), middle=91, outline=False,
         hue=(154, 1.15, 1.05), glow=(255, 120, 140, 0.55)),
    dict(out='coin.png', src='coin.jpg', cut='mask', box=(150, 150), middle=91),
    dict(out='chest.png', src='chest-closed.jpg', cut='mask', box=(152, 124), bottom=166),
    dict(out='chest-open.png', src='chest-open.jpg', cut='mask', box=(152, 136), bottom=166),
    dict(out='peal-blade.png', src='blade.jpg', cut='mask', box=(90, 176), middle=91, outline=False,
         glow=(255, 214, 140, 0.7)),
    dict(out='choir-blade.png', src='blade.jpg', cut='mask', box=(90, 176), middle=91, outline=False,
         golden=True, glow=(255, 240, 190, 0.9)),
    dict(out='icon-blade.png', src='icon-blade.jpg', cut='mask', icon=True),
]

# The decorations sheet: 4 columns x 2 rows of props on magenta. Each prop goes
# where the code-drawn prop was (its box in a 128 canvas, scaled up to 182).
DECORATIONS = {
    'src': 'decorations.jpg',
    'grid': (4, 2),
    'props': [  # reading order: top row left to right, then the bottom row
        ('deco-rock.png', (15, 41, 114, 110)),
        ('deco-stones.png', (25, 67, 101, 110)),
        ('deco-bones.png', (24, 48, 103, 113)),
        ('deco-grass.png', (35, 43, 91, 111)),
        ('deco-candles.png', (28, 37, 99, 113)),
        ('deco-pillar.png', (13, 19, 110, 118)),
        ('deco-bell.png', (16, 41, 111, 123)),
        ('deco-grave.png', (30, 17, 97, 116)),
    ],
}

GROUND = {'src': 'ground-tile.jpg', 'crop': 768, 'tile': 384, 'brightness': 1.08}


# ------------------------------------------------------------------ cutting

def cut_out(spec):
    """The source picture as RGBA with the background made transparent."""
    image = Image.open(INCOMING / spec['src']).convert('RGB')
    if spec['cut'] == 'mask':
        mask = np.asarray(Image.open(MASKS / (Path(spec['src']).stem + '.png')).convert('L'), np.float32)
        # Drop the faint halo the model leaves around the subject; keep soft edges.
        alpha = np.clip((mask - 20) / (235 - 20), 0, 1)
        rgba = np.dstack([np.asarray(image, np.float32), alpha * 255])
        return Image.fromarray(rgba.astype(np.uint8), 'RGBA')
    return chroma_key(image, spec['cut'])


def chroma_key(image, key):
    """Removes a flat green or magenta background and its colored fringe."""
    rgb = np.asarray(image, np.float32)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    if key == 'green':
        strength = g - np.maximum(r, b)  # how much greener than anything else
        rgb[..., 1] = np.minimum(g, np.maximum(r, b))  # remove green spill
    else:
        strength = np.minimum(r, b) - g  # how much more magenta than green
        spill = np.clip(strength, 0, None)
        rgb[..., 0] -= spill
        rgb[..., 2] -= spill
    alpha = 1 - np.clip((strength - 30) / (150 - 30), 0, 1)
    rgba = np.dstack([rgb, alpha * 255]).clip(0, 255)
    return Image.fromarray(rgba.astype(np.uint8), 'RGBA')


def crop_to_subject(rgba):
    bbox = rgba.getchannel('A').point(lambda a: 255 if a > 25 else 0).getbbox()
    return rgba.crop(bbox)


def centroid_x(rgba):
    """Horizontal center of the visible mass (a cape or a sword shouldn't shift the body)."""
    alpha = np.asarray(rgba.getchannel('A'), np.float32)
    columns = alpha.sum(axis=0)
    return float((columns * np.arange(len(columns))).sum() / columns.sum())


# ------------------------------------------------------------------ placing

def place(subject, box, canvas_size, bottom=None, middle=None, center_x=None):
    """Scales the subject to fit `box` and puts it in an empty square canvas."""
    width, height = subject.size
    scale = min(box[0] / width, box[1] / height)
    small = subject.resize((max(1, round(width * scale)), max(1, round(height * scale))), Image.LANCZOS)
    center = canvas_size / 2 if center_x is None else center_x
    x = round(center - centroid_x(subject) * scale)
    x = min(max(x, 0), canvas_size - small.width)  # keep it inside the canvas
    y = round(bottom - small.height) if bottom is not None else round(middle - small.height / 2)
    y = min(max(y, 0), canvas_size - small.height)
    canvas = Image.new('RGBA', (canvas_size, canvas_size), (0, 0, 0, 0))
    canvas.alpha_composite(small, (x, y))
    return canvas


def add_outline(sprite, width=2, strength=0.9):
    grown = sprite.getchannel('A').filter(ImageFilter.MaxFilter(width * 2 + 1))
    outline = Image.new('RGBA', sprite.size, OUTLINE + (0,))
    outline.putalpha(grown.point(lambda a: round(a * strength)))
    outline.alpha_composite(sprite)
    return outline


def add_glow(sprite, color):
    """A soft round light behind the subject, like the code-drawn pickups have."""
    r, g, b, strength = color
    alpha = np.asarray(sprite.getchannel('A'))
    ys, xs = np.nonzero(alpha > 25)
    cx, cy = xs.mean(), ys.mean()
    radius = max(xs.max() - xs.min(), ys.max() - ys.min()) * 0.62
    yy, xx = np.mgrid[0:sprite.height, 0:sprite.width]
    falloff = np.clip(1 - np.hypot(xx - cx, yy - cy) / radius, 0, 1) ** 1.6
    glow = np.zeros((sprite.height, sprite.width, 4), np.float32)
    glow[..., :3] = (r, g, b)
    glow[..., 3] = falloff * strength * 255
    result = Image.fromarray(glow.astype(np.uint8), 'RGBA')
    result.alpha_composite(sprite)
    return result


def fade_bottom(sprite, fraction):
    """Fades the lowest part of the subject, as if it stood in mist."""
    alpha = np.asarray(sprite.getchannel('A'), np.float32)
    rows = np.nonzero(alpha.max(axis=1) > 25)[0]
    top, bottom = rows.min(), rows.max()
    start = bottom - (bottom - top) * fraction
    ramp = np.clip((bottom - np.arange(sprite.height)) / max(1, bottom - start), 0, 1)
    ramp = ramp * ramp * (3 - 2 * ramp)  # smoothstep
    faded = sprite.copy()
    faded.putalpha(Image.fromarray((alpha * ramp[:, None]).astype(np.uint8)))
    return faded


# ------------------------------------------------------------------ color

def to_hsv(rgba):
    return [np.asarray(c, np.float32) for c in rgba.convert('RGB').convert('HSV').split()]


def from_hsv(h, s, v, alpha):
    channels = [Image.fromarray(np.clip(c, 0, 255).astype(np.uint8)) for c in (h, s, v)]
    rgb = Image.merge('HSV', channels).convert('RGB')
    rgb.putalpha(alpha)
    return rgb


def recolor(rgba, degrees, saturation, brightness):
    h, s, v = to_hsv(rgba)
    return from_hsv((h + degrees * 256 / 360) % 256, s * saturation, v * brightness, rgba.getchannel('A'))


def make_golden(rgba):
    """The evolved blade: teal parts turn gold, everything a bit brighter."""
    h, s, v = to_hsv(rgba)
    degrees = h * 360 / 256
    teal = (degrees > 140) & (degrees < 220) & (s > 40)
    h = np.where(teal, 45 * 256 / 360, h)
    s = np.where(teal, s * 0.8, s * 0.9)
    v = np.where(teal, v * 1.35 + 30, v * 1.2 + 12)
    return from_hsv(h, s, v, rgba.getchannel('A'))


# ------------------------------------------------------------------ outputs

def build_sprite(spec):
    subject = crop_to_subject(cut_out(spec))
    if spec.get('flip'):
        subject = subject.transpose(Image.FLIP_LEFT_RIGHT)
    if 'hue' in spec:
        subject = recolor(subject, *spec['hue'])
    if spec.get('golden'):
        subject = make_golden(subject)
    if spec.get('icon'):
        return build_icon(subject)
    sprite = place(subject, spec['box'], SIZE, bottom=spec.get('bottom'), middle=spec.get('middle'))
    if spec.get('outline', True):
        sprite = add_outline(sprite)
    if 'fade' in spec:
        sprite = fade_bottom(sprite, spec['fade'])
    if 'glow' in spec:
        sprite = add_glow(sprite, spec['glow'])
    return sprite


def build_icon(symbol):
    """Rounded dark tile with a bronze border, like the code-drawn icons, with the picture inside."""
    scale = 4  # draw big, then shrink: smooth corners
    big = SIZE * scale
    yy, xx = np.mgrid[0:big, 0:big] + 0.5
    def rounded_box(inset, radius):
        qx = np.maximum(np.abs(xx - big / 2) - (big / 2 - inset - radius), 0)
        qy = np.maximum(np.abs(yy - big / 2) - (big / 2 - inset - radius), 0)
        return np.hypot(qx, qy) <= radius
    tile = np.zeros((big, big, 4), np.float32)
    border = rounded_box(8 * scale, 30 * scale)
    inner = rounded_box(15 * scale, 24 * scale)
    shade = (yy / big)[..., None]
    tile[border] = (184, 134, 75, 255)  # bronze
    tile[..., :3] = np.where(inner[..., None], (36, 50, 60) * (1 - shade) + (18, 24, 31) * shade, tile[..., :3])
    icon = Image.fromarray(tile.astype(np.uint8), 'RGBA').resize((SIZE, SIZE), Image.LANCZOS)
    inside = place(symbol, (134, 134), SIZE, middle=SIZE / 2)
    icon.alpha_composite(add_outline(inside, width=1, strength=0.6))
    return icon


def build_decorations():
    spec = DECORATIONS
    sheet = chroma_key(Image.open(INCOMING / spec['src']).convert('RGB'), 'magenta')
    columns, rows = spec['grid']
    cell_w, cell_h = sheet.width / columns, sheet.height / rows
    factor = SIZE / 128  # the code-drawn props live in a 128 canvas
    for index, (name, (left, top, right, bottom)) in enumerate(spec['props']):
        col, row = index % columns, index // columns
        cell = sheet.crop((round(col * cell_w), round(row * cell_h), round((col + 1) * cell_w), round((row + 1) * cell_h)))
        prop = crop_to_subject(cell)
        box = ((right - left) * factor * 1.08, (bottom - top) * factor * 1.08)
        sprite = place(prop, box, SIZE, bottom=bottom * factor, center_x=(left + right) / 2 * factor)
        save(add_outline(sprite, width=1, strength=0.7), name)


def smoothstep(edge0, edge1, x):
    t = np.clip((x - edge0) / (edge1 - edge0), 0, 1)
    return t * t * (3 - 2 * t)


def make_seamless(tile):
    """Cross-fades a square texture with a half-shifted copy so its edges wrap around."""
    n = tile.shape[0]
    distance = np.abs(np.arange(n) - (n - 1) / 2) / ((n - 1) / 2)  # 0 in the middle, 1 at the edges
    weight = smoothstep(0.55, 0.95, distance)
    shifted = np.roll(tile, n // 2, axis=1)
    tile = tile * (1 - weight[None, :, None]) + shifted * weight[None, :, None]
    shifted = np.roll(tile, n // 2, axis=0)
    return tile * (1 - weight[:, None, None]) + shifted * weight[:, None, None]


def build_ground():
    """Four ground tiles that all share the same edges, so any two fit side by side."""
    spec = GROUND
    image = np.asarray(Image.open(INCOMING / spec['src']).convert('RGB'), np.float32) * spec['brightness']
    n = spec['crop']
    first = image[:n, :n]
    last = image[:n, -n:]
    edges = make_seamless(first)
    distance = np.maximum(*np.meshgrid(*(2 * [np.abs(np.arange(n) - (n - 1) / 2) / ((n - 1) / 2)])))
    border = smoothstep(0.62, 0.92, distance)[..., None]  # 1 near the edges, 0 inside
    insides = [edges, last, first[:, ::-1], last[::-1, :]]
    for index, inside in enumerate(insides, start=1):
        tile = edges * border + inside * (1 - border)
        picture = Image.fromarray(np.clip(tile, 0, 255).astype(np.uint8), 'RGB')
        save(picture.resize((spec['tile'], spec['tile']), Image.LANCZOS), f'ground-{index}.jpg', quality=90)


def save(image, name, **options):
    OUT.mkdir(parents=True, exist_ok=True)
    image.save(OUT / name, optimize=True, **options)
    print('wrote', OUT / name)


def build():
    for spec in SPRITES:
        save(build_sprite(spec), spec['out'])
    build_decorations()
    build_ground()


def run_masks(model_path):
    """Step 1: background masks for every 'mask' picture, with BiRefNet on the CPU."""
    import onnxruntime as ort
    options = ort.SessionOptions()
    options.enable_cpu_mem_arena = False  # keeps memory flat across pictures
    session = ort.InferenceSession(model_path, options, providers=['CPUExecutionProvider'])
    mean = np.array([0.485, 0.456, 0.406], np.float32)
    std = np.array([0.229, 0.224, 0.225], np.float32)
    MASKS.mkdir(parents=True, exist_ok=True)
    for src in sorted({spec['src'] for spec in SPRITES if spec['cut'] == 'mask'}):
        image = Image.open(INCOMING / src).convert('RGB')
        pixels = np.asarray(image.resize((1024, 1024), Image.BILINEAR), np.float32) / 255
        logits = session.run(None, {session.get_inputs()[0].name: ((pixels - mean) / std).transpose(2, 0, 1)[None]})[-1]
        probability = 1 / (1 + np.exp(-np.clip(logits[0, 0], -50, 50)))
        mask = Image.fromarray((probability * 255).astype(np.uint8)).resize(image.size, Image.BILINEAR)
        mask.save(MASKS / (Path(src).stem + '.png'), optimize=True)
        print('mask', src)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('step', choices=['masks', 'build'])
    parser.add_argument('--model', help='path to the BiRefNet ONNX file (step "masks")')
    args = parser.parse_args()
    if args.step == 'masks':
        if not args.model:
            parser.error('step "masks" needs --model')
        run_masks(args.model)
    else:
        build()
