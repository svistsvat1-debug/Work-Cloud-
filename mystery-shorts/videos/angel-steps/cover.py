# Cover: frame 0 (premise) + cover text on a torn paper strip. Usage: python3 cover.py <work dir> <out png>
import sys, os, subprocess, numpy as np
from PIL import Image
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../engine'))
from lib import paper_strip, warp, over, affine
S, OUT = sys.argv[1], sys.argv[2]
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f'{S}/video_noaudio.mp4', '-vframes', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
f = np.frombuffer(raw, np.uint8).reshape(1920, 1080, 3).astype(np.float32) / 255
f = np.dstack([f, np.ones((1920, 1080), np.float32)])
s = paper_strip('14 NEW STEPS.', '/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf', 104, pad=(46, 26), seed=5)
h, w = s.shape[:2]
over(f, warp(s, affine(1.0, -3.0, (w / 2, h / 2), (470, 300))), shadow=0.45, sh_off=(10, 14), sh_blur=12)
Image.fromarray((np.clip(f[..., :3], 0, 1) * 255).astype(np.uint8)).save(OUT)
