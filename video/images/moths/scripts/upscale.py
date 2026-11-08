# upscale.py in.png out.png factor - crisp upscale for flat cartoon cut-outs: smooth colours, re-sharpened ink + silhouette
import sys, numpy as np, cv2
from PIL import Image
src, dst, f = sys.argv[1], sys.argv[2], float(sys.argv[3])
im = np.asarray(Image.open(src).convert("RGBA")).astype(np.float32) / 255
rgb, a = im[..., :3], im[..., 3]
rgb = cv2.bilateralFilter(np.ascontiguousarray(rgb), 7, 0.08, 3)   # kill JPEG speckle, keep edges
h, w = a.shape; W, H = int(round(w * f)), int(round(h * f))
def up(x): return cv2.resize(x, (W, H), interpolation=cv2.INTER_CUBIC)
def sharp(p, sig, lo=0.38, hi=0.62):
    p = cv2.GaussianBlur(p, (0, 0), sig); t = np.clip((p - lo) / (hi - lo), 0, 1); return t * t * (3 - 2 * t)
pre = rgb * a[..., None]
a_up = np.clip(up(a), 0, 1)
col = np.clip(up(pre) / np.maximum(a_up, 1e-3)[..., None], 0, 1)
inkp = np.clip((0.15 - rgb.max(2)) / 0.06, 0, 1) * a   # only true black ink (dark-grey metal stays grey)        # how "black outline" a pixel is
ink_up = sharp(np.clip(up(inkp), 0, 1), 0.45 * f)
a_new = sharp(a_up, 0.45 * f, 0.35, 0.65)
ink_col = np.array([0.07, 0.07, 0.08], np.float32)
col = col * (1 - ink_up[..., None]) + ink_col * ink_up[..., None]
out = np.dstack([col, a_new])
Image.fromarray((np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8)).save(dst)
