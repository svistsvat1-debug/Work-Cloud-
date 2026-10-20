# python3 -I hank_pingloop.py gem.mp4 out.mp4 A B BAND_Y
#   A..B = calm frames (24 fps) with no wipers or other big motion; plays A..B..A, seam = natural step.
# ping-pong loop from a calm frame range (no wipers) + centre darkening band, like hank_gemloop
import sys, subprocess, tempfile, os, numpy as np
src, out, A, B, BY = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), int(sys.argv[5])
W, H = 1920, 1080
raw = os.path.join(tempfile.mkdtemp(), 'f.rgb')
subprocess.run(['ffmpeg','-v','error','-y','-i',src,'-vf','scale=1920:1080:flags=lanczos,fps=24,format=rgb24','-f','rawvideo',raw],check=True)
F = np.memmap(raw, np.uint8, mode='r').reshape(-1, H, W, 3)
y = np.arange(H, dtype=np.float32)[:, None]
keep = np.repeat(1 - 0.40*np.exp(-((y-BY)/190.0)**2), W, axis=1)[..., None]
seq = list(range(A, B+1)) + list(range(B-1, A, -1))
p = subprocess.Popen(['ffmpeg','-v','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r','24','-i','-',
  '-c:v','libx264','-preset','slow','-crf','14','-pix_fmt','yuv420p',out], stdin=subprocess.PIPE)
for k in seq: p.stdin.write(np.clip(F[k].astype(np.float32)*keep+0.5,0,255).astype(np.uint8).tobytes())
p.stdin.close(); p.wait(); os.remove(raw); print('loop', len(seq), 'frames')
