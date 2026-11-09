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
    lo = up = (7, 7, 7)
    for x in range(0, w, 16):
        for y in (0, h - 1):
            if mask[y + 1, x + 1] == 0:
                cv2.floodFill(work, mask, (x, y), 0, lo, up, flags)
    for y in range(0, h, 16):
        for x in (0, w - 1):
            if mask[y + 1, x + 1] == 0:
                cv2.floodFill(work, mask, (x, y), 0, lo, up, flags)
    bg = mask[1:-1, 1:-1] > 0
    # light, low-saturation pixels touching the background are background too (halo/sticker rim)
    a16 = img.astype(np.int16)
    light = (a16.min(2) > 200) & (a16.max(2) - a16.min(2) < 28)
    for _ in range(6):
        grow = cv2.dilate(bg.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool) & light
        if (grow & ~bg).sum() == 0:
            break
        bg |= grow
    fg = (~bg).astype(np.uint8)
    fg = cv2.morphologyEx(fg, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(fg, connectivity=8)
    if n > 1:
        areas = st[1:, cv2.CC_STAT_AREA]
        keep = [i + 1 for i, ar in enumerate(areas) if ar >= max(200, 0.02 * areas.max())]
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
    only = set(sys.argv[3:])
    os.makedirs(os.path.join(out, "raw"), exist_ok=True)
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
