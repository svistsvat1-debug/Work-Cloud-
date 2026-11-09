"""Generate marker-doodle sprites locally (free) with SDXL + SDXL-Lightning 4-step on CPU.

usage: python gen_sprites.py SPRITES.json OUT_DIR [key ...]
SPRITES.json: {"key": "subject description", ...}
Writes OUT_DIR/raw/<key>.png (generation) and OUT_DIR/<key>.png (transparent cut-out).
"""
import json
import os
import sys
import time
import zlib

import cv2
import numpy as np
import torch
from PIL import Image

# Style goes first: CLIP only reads the first 77 tokens.
STYLE = ("hand drawn doodle sticker, thick black outline, bright marker colors, white background, "
         "whiteboard animation style: {s}")

BASE = "stabilityai/stable-diffusion-xl-base-1.0"
LIGHTNING = ("ByteDance/SDXL-Lightning", "sdxl_lightning_4step_unet.safetensors")


def load_pipe():
    from diffusers import EulerDiscreteScheduler, StableDiffusionXLPipeline, UNet2DConditionModel
    from huggingface_hub import hf_hub_download
    from safetensors.torch import load_file

    torch.set_num_threads(os.cpu_count() or 4)
    dtype = torch.bfloat16
    unet = UNet2DConditionModel.from_config(BASE, subfolder="unet").to(dtype)
    unet.load_state_dict(load_file(hf_hub_download(*LIGHTNING), device="cpu"))
    pipe = StableDiffusionXLPipeline.from_pretrained(BASE, unet=unet, torch_dtype=dtype, variant="fp16")
    pipe.scheduler = EulerDiscreteScheduler.from_config(pipe.scheduler.config, timestep_spacing="trailing")
    pipe.set_progress_bar_config(disable=True)
    return pipe


def cutout(img, paper=(250, 249, 245)):
    """Background -> transparent: floating flood fill from border pixels (follows grey or gradient
    backgrounds), keeps enclosed light areas. Boosts saturation a little towards marker colours."""
    h, w = img.shape[:2]
    work = cv2.GaussianBlur(img, (3, 3), 0)
    mask = np.zeros((h + 2, w + 2), np.uint8)
    flags = 4 | cv2.FLOODFILL_MASK_ONLY | (255 << 8)
    lo = up = (5, 5, 5)
    for x in range(0, w, 16):
        for y in (0, h - 1):
            if mask[y + 1, x + 1] == 0:
                cv2.floodFill(work, mask, (x, y), 0, lo, up, flags)
    for y in range(0, h, 16):
        for x in (0, w - 1):
            if mask[y + 1, x + 1] == 0:
                cv2.floodFill(work, mask, (x, y), 0, lo, up, flags)
    bg = mask[1:-1, 1:-1] > 0
    a16 = img.astype(np.int16)
    fg = (~bg).astype(np.uint8)
    fg = cv2.morphologyEx(fg, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    # silhouette: close small gaps in the outline, then fill every enclosed hole, so light areas
    # inside the object (that the flood fill leaked into) stay part of the sprite
    k = max(9, int(min(h, w) * 0.014))
    sil = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k)))
    inv = (1 - sil).astype(np.uint8)
    m2 = np.zeros((h + 2, w + 2), np.uint8)
    for x in range(0, w, 8):
        for y in (0, h - 1):
            if inv[y, x] == 1 and m2[y + 1, x + 1] == 0:
                cv2.floodFill(inv, m2, (x, y), 2)
    for y in range(0, h, 8):
        for x in (0, w - 1):
            if inv[y, x] == 1 and m2[y + 1, x + 1] == 0:
                cv2.floodFill(inv, m2, (x, y), 2)
    fg = ((sil > 0) | (inv == 1)).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(fg, connectivity=8)
    if n > 1:
        areas = st[1:, cv2.CC_STAT_AREA]
        keep = [i + 1 for i, ar in enumerate(areas) if ar >= max(400, 0.03 * areas.max())]
        fg = np.isin(lab, keep).astype(np.uint8)
    alpha = cv2.GaussianBlur(fg.astype(np.float32), (0, 0), 0.9)
    alpha = np.maximum(alpha, cv2.erode(fg, np.ones((3, 3), np.uint8)).astype(np.float32))
    hsv = cv2.cvtColor(img, cv2.COLOR_RGB2HSV).astype(np.float32)
    hsv[..., 1] = np.clip(hsv[..., 1] * 1.25, 0, 255)
    rgb = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2RGB)
    near_white = (a16.min(2) > 232) & (a16.max(2) - a16.min(2) < 20)
    rgb[near_white] = paper
    ys, xs = np.nonzero(alpha > 0.05)
    if len(ys) == 0:
        return None
    m = 8
    y0, y1 = max(0, ys.min() - m), min(h, ys.max() + m)
    x0, x1 = max(0, xs.min() - m), min(w, xs.max() + m)
    return np.dstack([rgb, (alpha * 255).astype(np.uint8)])[y0:y1, x0:x1]


def main():
    spec = json.load(open(sys.argv[1]))
    out = sys.argv[2]
    only = set(a for a in sys.argv[3:] if not a.startswith("--"))
    os.makedirs(os.path.join(out, "raw"), exist_ok=True)
    if "--recut" in sys.argv:
        for k in spec:
            rp = os.path.join(out, "raw", k + ".png")
            if (only and k not in only) or not os.path.exists(rp):
                continue
            cut = cutout(np.asarray(Image.open(rp).convert("RGB")))
            if cut is not None:
                Image.fromarray(cut, "RGBA").save(os.path.join(out, k + ".png"))
        print("recut done")
        return
    todo = [(k, v) for k, v in spec.items() if (not only or k in only)
            and not os.path.exists(os.path.join(out, "raw", k + ".png"))]
    print(f"{len(todo)} sprites to generate", flush=True)
    if not todo:
        return
    t = time.time()
    pipe = load_pipe()
    print(f"pipeline loaded in {time.time() - t:.0f}s", flush=True)
    for i, (k, subj) in enumerate(todo):
        t = time.time()
        seed = zlib.crc32(k.encode()) % (2 ** 31)
        g = torch.Generator("cpu").manual_seed(seed)
        prompt = STYLE.format(s=subj)
        with torch.inference_mode():
            im = pipe(prompt, num_inference_steps=4, guidance_scale=0.0, width=1024, height=1024,
                      generator=g).images[0]
        im.save(os.path.join(out, "raw", k + ".png"))
        cut = cutout(np.asarray(im.convert("RGB")))
        if cut is not None:
            Image.fromarray(cut, "RGBA").save(os.path.join(out, k + ".png"))
        print(f"[{i + 1}/{len(todo)}] {k} {time.time() - t:.0f}s", flush=True)


if __name__ == "__main__":
    main()
