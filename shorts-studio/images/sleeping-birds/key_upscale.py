"""Remove a baked-in fake checkerboard (painted by the image model) and upscale flat cartoon art crisply.
usage: python3 -I key_upscale.py raw/in.jpg work/out.png [scale]
- background = neutral light pixels connected to the border + enclosed neutral regions that show the checker pattern
- the outer edge band is forced to ink (all sprites have a black outline) with an un-blended alpha
- upscale: fill colours via Lanczos (after JPEG clean-up), black lines + alpha via smooth membership + sharpening
"""
import sys
import numpy as np, cv2
from scipy import ndimage as ndi

def key_upscale(bgr, S=4, keep_mask=None, drop_mask=None):
    """bgr uint8 -> (rgba uint8 upscaled xS, object mask at input res). keep_mask/drop_mask force object/background."""
    im = bgr[:, :, ::-1].astype(np.float32)
    h, w = im.shape[:2]
    L = im.mean(2)
    sat = im.max(2) - im.min(2)

    cand = (sat <= 9) & (L > 118)
    lab, n = ndi.label(cand)
    border = np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))
    bg = np.isin(lab, border[border > 0])
    # enclosed neutral regions: background only if they show the checkerboard (many axis-aligned edges)
    gx = cv2.Sobel(L, cv2.CV_32F, 1, 0, ksize=3); gy = cv2.Sobel(L, cv2.CV_32F, 0, 1, ksize=3)
    mag = np.hypot(gx, gy); ang = np.degrees(np.arctan2(np.abs(gy), np.abs(gx)))
    axis = (ang < 12) | (ang > 78)
    for i in range(1, n + 1):
        if i in border: continue
        m = lab == i
        if m.sum() < 60: continue
        core = ndi.binary_erosion(m, iterations=2)
        if core.sum() < 30: continue
        e = core & (mag > 25)
        dens = e.sum() / core.sum(); af = (e & axis).sum() / max(e.sum(), 1)
        if dens > 0.02 and af > 0.7:
            bg |= m
    bg = ndi.binary_opening(bg, iterations=1) | (bg & ~ndi.binary_dilation(~bg, iterations=3))
    obj = ~bg
    if keep_mask is not None: obj |= keep_mask; bg &= ~keep_mask
    if drop_mask is not None: obj &= ~drop_mask; bg |= drop_mask
    obj = ndi.binary_fill_holes(obj) & ~(bg & ~ndi.binary_fill_holes(obj)) if False else obj
    # keep the big components only (drop specks)
    lab2, n2 = ndi.label(obj)
    sizes = ndi.sum(obj, lab2, range(1, n2 + 1))
    keep = np.zeros(n2 + 1, bool); keep[1:] = sizes > 0.002 * h * w
    obj = keep[lab2]

    # soft alpha on the edge band: un-blend ink against the local checker colour
    dist_out = ndi.distance_transform_edt(obj)            # inside distance to bg
    band = obj & (dist_out <= 2.5)
    bgL = L.copy(); bgL[~bg] = 0
    cnt = ndi.uniform_filter(bg.astype(np.float32), 9); loc = ndi.uniform_filter(bgL, 9) / np.maximum(cnt, 1e-3)
    inkL = 35.0
    a_band = np.clip((loc - L) / np.maximum(loc - inkL, 1.0), 0, 1)
    alpha = obj.astype(np.float32)
    alpha[band] = np.maximum(a_band[band], (dist_out[band] > 1.6).astype(np.float32))

    # ink membership (black lines), relative to the fill colour next to the line (works on dark fills too)
    V = im.max(2)
    core = (V < 48) & (sat < 45)
    near = ndi.binary_dilation(core, iterations=2)
    fill = cv2.bilateralFilter(bgr, 7, 40, 5)
    fill = cv2.inpaint(fill, near.astype(np.uint8) * 255, 3, cv2.INPAINT_TELEA)
    Vf = fill.max(2).astype(np.float32)
    ink = np.where(near, np.clip((Vf - V) / np.maximum(Vf - 18.0, 20.0), 0, 1), 0).astype(np.float32)
    ink[core] = 1.0
    ink[band] = 1.0
    H, W = h * S, w * S
    def up(a, interp=cv2.INTER_CUBIC):
        return cv2.resize(a, (W, H), interpolation=interp)
    def sharpen(a, lo, hi):
        t = np.clip((a - lo) / (hi - lo), 0, 1)
        return t * t * (3 - 2 * t)
    ink_s = cv2.GaussianBlur(ink.astype(np.float32), (0, 0), 0.6)
    ink_hi = sharpen(up(ink_s), 0.38, 0.62)
    alpha_s = cv2.GaussianBlur(alpha, (0, 0), 0.6)
    alpha_hi = sharpen(up(alpha_s), 0.30, 0.62)
    fill_hi = up(fill, cv2.INTER_LANCZOS4).astype(np.float32)
    ink_rgb = np.array([22, 20, 24], np.float32)[::-1]        # BGR
    out = fill_hi * (1 - ink_hi[..., None]) + ink_rgb * ink_hi[..., None]
    rgba = np.dstack([np.clip(out, 0, 255).astype(np.uint8), (alpha_hi * 255).astype(np.uint8)])
    return rgba, obj


if __name__ == '__main__':
    src, dst = sys.argv[1], sys.argv[2]
    S = int(sys.argv[3]) if len(sys.argv) > 3 else 4
    rgba, obj = key_upscale(cv2.imread(src, cv2.IMREAD_COLOR), S)
    cv2.imwrite(dst, rgba)
    print(dst, rgba.shape, 'object px', int(obj.sum()))
