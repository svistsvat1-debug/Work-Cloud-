"""check.py VIDEO [expected_w expected_h] - verify a render: size, fps, frame count, audio length + peak,
and a pop scan (mean frame-to-frame difference on a blurred 270x480 copy; flags > 2.2x the local median)."""
import json, subprocess, sys
import numpy as np

v = sys.argv[1]
info = json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", v], capture_output=True, text=True).stdout)
vs = [s for s in info["streams"] if s["codec_type"] == "video"][0]
aus = [s for s in info["streams"] if s["codec_type"] == "audio"]
fps = eval(vs["r_frame_rate"])
nb = int(vs.get("nb_frames", 0))
print(f"video {vs['width']}x{vs['height']} {fps:.2f} fps, {nb} frames ({nb / fps:.3f} s)")
if aus:
    print(f"audio {aus[0]['codec_name']} {aus[0]['sample_rate']} Hz, {float(aus[0]['duration']):.3f} s")
    pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", v, "-ac", "1", "-f", "f32le", "-"], capture_output=True).stdout
    a = np.frombuffer(pcm, np.float32)
    print(f"audio peak {20 * np.log10(np.abs(a).max() + 1e-9):.1f} dBFS, clipped samples {(np.abs(a) >= 0.999).sum()}")
else:
    print("NO AUDIO")
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", v, "-vf", "scale=270:480,gblur=sigma=2", "-f", "rawvideo", "-pix_fmt", "gray", "-"], capture_output=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, 480, 270).astype(np.float32)
d = np.abs(np.diff(fr, axis=0)).mean((1, 2))
flags = []
for i in range(len(d)):
    lo, hi = max(0, i - 30), min(len(d), i + 30)
    med = np.median(d[lo:hi]) + 0.05
    if d[i] > 2.2 * med and d[i] > 0.6:
        flags.append((i + 1, round((i + 1) / fps, 2), round(float(d[i]), 2)))
print("pop flags (frame, s, diff):", flags)
print(f"last 30 frames still moving: {d[-30:].mean():.3f} mean diff")
