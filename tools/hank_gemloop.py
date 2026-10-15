# Seamless loop from a Gemini clip with an exact frame crossfade + darkening band under the subtitles
# python3 -I hank_gemloop.py gem.mp4 out.mp4 [A B X BAND_Y]
#   A, B, X in frames (24 fps): loop = frames A+X..B-1, then tail B..B+X-1 fades into head A..A+X-1.
#   Pick A+X and B where the clip's natural frame step is small. BAND_Y = subtitle centre y (1080p).
import sys, subprocess, tempfile, os, numpy as np
src, out = sys.argv[1], sys.argv[2]
A, B, X = (int(v) for v in sys.argv[3:6]) if len(sys.argv) > 5 else (14, 180, 36)
BY = int(sys.argv[6]) if len(sys.argv) > 6 else 540
W, H = 1920, 1080
raw = os.path.join(tempfile.mkdtemp(), 'f.rgb')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-vf', 'scale=1920:1080:flags=lanczos,fps=24,format=rgb24',
                '-f', 'rawvideo', raw], check=True)
F = np.memmap(raw, np.uint8, mode='r').reshape(-1, H, W, 3)
assert B + X <= len(F), f'clip has {len(F)} frames, need {B + X}'
y = np.arange(H, dtype=np.float32)[:, None]
keep = np.repeat(1 - 0.40 * np.exp(-((y - BY) / 190.0) ** 2), W, axis=1)[..., None]
L = B - A
p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', '24',
                      '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '14', '-pix_fmt', 'yuv420p', out],
                     stdin=subprocess.PIPE)
for j in range(L):
    if j < L - X:
        fr = F[A + X + j].astype(np.float32)
    else:
        k = j - (L - X); w = (k + 1) / (X + 1)
        fr = F[B + k].astype(np.float32) * (1 - w) + F[A + k].astype(np.float32) * w
    p.stdin.write(np.clip(fr * keep + 0.5, 0, 255).astype(np.uint8).tobytes())
p.stdin.close(); p.wait()
os.remove(raw)
print(f'loop {L} frames = {L / 24:.2f} s')
