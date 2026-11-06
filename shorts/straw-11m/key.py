import cv2, numpy as np, sys, glob, os, json
def key(path, up=2):
    im = cv2.imread(path).astype(np.float32)  # BGR
    im = cv2.resize(im, None, fx=up, fy=up, interpolation=cv2.INTER_LANCZOS4)
    b, g, r = im[..., 0], im[..., 1], im[..., 2]
    gr = g - np.maximum(r, b)
    a = 1 - np.clip((gr - 35) / (140 - 35), 0, 1)
    # despill: clamp green to max(r,b) where there is spill
    g2 = np.where(gr > 0, np.maximum(r, b), g)
    # unblend edges: colour where partially transparent -> darken toward ink
    out = np.dstack([b, g2, r]).clip(0, 255)
    rgba = np.dstack([out, a * 255]).astype(np.uint8)
    # kill tiny specks: keep components with area > 200
    m = (a > 0.5).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
    keep = np.zeros(n, bool); keep[1:] = st[1:, cv2.CC_STAT_AREA] > 400
    mask = keep[lab]
    mask = cv2.dilate(mask.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0
    rgba[..., 3] = np.where(mask, rgba[..., 3], 0)
    return rgba
meta = {}
for p in sorted(glob.glob('raw/*.jpg')):
    n = os.path.basename(p)[:-4]
    rgba = key(p)
    ys, xs = np.where(rgba[..., 3] > 10)
    pad = 12
    y0, y1, x0, x1 = max(ys.min() - pad, 0), ys.max() + pad, max(xs.min() - pad, 0), xs.max() + pad
    cut = rgba[y0:y1, x0:x1]
    cv2.imwrite(f'cut/{n}.png', cut)
    meta[n] = dict(off=[int(x0), int(y0)], w=int(cut.shape[1]), h=int(cut.shape[0]))
    print(n, meta[n])
json.dump(meta, open('cut/meta.json', 'w'), indent=1)
