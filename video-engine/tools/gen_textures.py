#!/usr/bin/env python3
"""Generate the board textures into video-engine/public/ (not committed, ~25 MB):
paper.png (warm-white board, faint fibres) and wobble_0..5.png (smooth noise used by the
feDisplacementMap "hand-drawn boil" filter). Run once after cloning: python3 tools/gen_textures.py
"""
import struct
import zlib
from pathlib import Path

import numpy as np

W, H = 1920, 1080
PUB = Path(__file__).resolve().parent.parent / "public"


def png(path, img, level=6):
    raw = b"".join(b"\x00" + img[y].tobytes() for y in range(img.shape[0]))

    def chunk(t, d):
        c = struct.pack(">I", len(d)) + t + d
        return c + struct.pack(">I", zlib.crc32(t + d) & 0xFFFFFFFF)

    hdr = struct.pack(">IIBBBBB", img.shape[1], img.shape[0], 8, 2, 0, 0, 0)
    path.write_bytes(b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", hdr) + chunk(b"IDAT", zlib.compress(raw, level)) + chunk(b"IEND", b""))


def smooth_noise(rng, cell):
    gh, gw = H // cell + 3, W // cell + 3
    g = rng.random((gh, gw))
    ys, xs = np.arange(H) / cell, np.arange(W) / cell
    y0, x0 = ys.astype(int), xs.astype(int)
    fy, fx = ys - y0, xs - x0
    fy, fx = fy * fy * (3 - 2 * fy), fx * fx * (3 - 2 * fx)
    a, b = g[y0][:, x0], g[y0][:, x0 + 1]
    c, d = g[y0 + 1][:, x0], g[y0 + 1][:, x0 + 1]
    top, bot = a + (b - a) * fx[None, :], c + (d - c) * fx[None, :]
    return top + (bot - top) * fy[:, None]


def paper():
    rng = np.random.default_rng(7)
    base = np.array([0xFA, 0xF8, 0xF3], dtype=np.float32)
    n = np.kron(rng.normal(0, 1, (H // 4, W // 4)).astype(np.float32), np.ones((4, 4), dtype=np.float32))
    k = np.ones(9) / 9
    n = np.apply_along_axis(lambda r: np.convolve(r, k, "same"), 1, n)
    n = np.apply_along_axis(lambda r: np.convolve(r, k, "same"), 0, n)
    v = n * 2.2 + rng.normal(0, 1, (H, W)).astype(np.float32) * 1.3
    img = np.clip(base[None, None, :] + v[:, :, None] * np.array([1, 1, 0.9]), 0, 255).astype(np.uint8)
    png(PUB / "paper.png", img, 9)


def wobble():
    for k in range(6):
        rng = np.random.default_rng(100 + k)
        r = 0.65 * smooth_noise(rng, 45) + 0.35 * smooth_noise(rng, 18)
        g = 0.65 * smooth_noise(rng, 45) + 0.35 * smooth_noise(rng, 18)
        img = np.zeros((H, W, 3), np.uint8)
        img[..., 0], img[..., 1], img[..., 2] = (r * 255).astype(np.uint8), (g * 255).astype(np.uint8), 128
        png(PUB / f"wobble_{k}.png", img)


if __name__ == "__main__":
    PUB.mkdir(exist_ok=True)
    paper()
    wobble()
    print("textures ->", PUB)
