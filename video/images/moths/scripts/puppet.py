# puppet.py - split the hero moth into BODY (head, front wing, abdomen, legs, antennae; face erased) and WINGS
# (the two raised back wings) on the same canvas; erase the face so it can be drawn in code. Prints measurements.
import json, numpy as np, cv2
from PIL import Image
src = np.asarray(Image.open("cut/moth_up.png").convert("RGBA")).copy()
rgb, a = src[..., :3].astype(np.int32), src[..., 3].astype(np.int32)
lab = np.load("qa/moth_up_labels.npy")
ink = (rgb.max(2) < 85) & (a > 8)
inkL = ink.astype(np.uint8)
n8, l8, st8, cen8 = cv2.connectedComponentsWithStats(((rgb.max(2) < 85) & (a > 128)).astype(np.uint8), connectivity=8)
# --- face features (found with face_probe.py): brows, eyes, mouth
face = np.zeros(lab.shape, bool)
for x, y, w, h in [(433, 365, 37, 14), (531, 362, 30, 11), (444, 392, 26, 40), (533, 387, 26, 40), (485, 441, 41, 12)]:
    sub = l8[y:y + h, x:x + w]; ids = set(np.unique(sub)) - {0}
    for i in ids:
        if st8[i, 4] > 100: face |= l8 == i
lum = rgb.mean(2)
big = np.isin(l8, [i for i in range(1, n8) if st8[i, 4] > 2000])
big = cv2.dilate(big.astype(np.uint8), np.ones((9, 9), np.uint8)).astype(bool)
for x, y, w, h in [(433, 365, 37, 14), (531, 362, 30, 11), (444, 392, 26, 40), (533, 387, 26, 40), (485, 441, 41, 12)]:
    box = np.zeros_like(face); box[y - 9:y + h + 9, x - 9:x + w + 9] = True
    face |= box & (lum < 228) & ~big
face = cv2.dilate(face.astype(np.uint8), np.ones((7, 7), np.uint8)).astype(bool)
# --- assign every ink pixel to the front-most region it touches (head > front wing > abdomen > wing2 > wing1)
prio = [4, 64, 65, 2, 1]
dist = {c: cv2.distanceTransform((lab != c).astype(np.uint8), cv2.DIST_L2, 5) for c in prio}
owner = np.zeros(lab.shape, np.int32)
W = 11
for c in reversed(prio):            # later (front) overrides
    owner[(ink) & (dist[c] <= W)] = c
for c in prio: owner[lab == c] = c
left = (a > 8) & (owner == 0)       # leftovers (legs, antenna tips, far ink) -> body
owner[left] = 4
wings = (owner == 1) | (owner == 2)
body = (a > 8) & ~wings
W_img = src.copy(); W_img[~wings] = 0
B_img = src.copy(); B_img[~body] = 0
# erase the face: inpaint with the surrounding head colour
bgr = cv2.cvtColor(B_img[..., :3], cv2.COLOR_RGB2BGR)
fill = cv2.inpaint(bgr, face.astype(np.uint8) * 255, 9, cv2.INPAINT_TELEA)
B_blank = B_img.copy(); B_blank[..., :3] = cv2.cvtColor(fill, cv2.COLOR_BGR2RGB); B_blank[face, 3] = 255
# leftover grey halo between the right brow and the head outline -> flat head colour
core = np.isin(l8, [i for i in range(1, n8) if st8[i, 4] > 2000])
core = cv2.dilate(core.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(bool)
hc = B_blank[425, 500, :3].astype(np.int32)
blum = B_blank[..., :3].astype(np.int32).mean(2)
for x, y, w, h in [(433, 365, 37, 14), (531, 362, 30, 11), (444, 392, 26, 40), (533, 387, 26, 40), (485, 441, 41, 12)]:
    box = np.zeros_like(face); box[y - 12:y + h + 12, x - 12:x + w + 14] = True
    m = box & (blum < hc.mean() - 6) & ~core & (lab != 0) | box & (blum < hc.mean() - 6) & ~core & face
    B_blank[m, :3] = hc
for name, im in [("moth_body", B_img), ("moth_body_blank", B_blank), ("moth_wings", W_img)]:
    Image.fromarray(im).save(f"cut/{name}.png")
# pivot of the raised wings = where they go behind the head (bottom-right of the wing mask)
ys, xs = np.where(wings & (lab > 0))
k = np.argmax(xs + 1.4 * ys); pivot = (int(xs[k]), int(ys[k]))
hy, hx = np.where(lab == 4)
meas = {"size": [src.shape[1], src.shape[0]], "wingPivot": pivot,
        "eyeL": [456.5, 411.3], "eyeR": [545.3, 406.7], "eyeW": 26, "eyeH": 40,
        "browL": [450.5, 369.8], "browR": [545.5, 366.0], "mouth": [505.3, 447.1],
        "headColor": B_blank[425, 500, :3].tolist()}
json.dump(meas, open("cut/moth_meas.json", "w"), indent=1); print(meas)
