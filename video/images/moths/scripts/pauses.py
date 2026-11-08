# pauses.py in.mp3 - RMS every 20 ms, silence = below -42 dB for >= 0.18 s
import subprocess, sys, numpy as np
raw = subprocess.run(["ffmpeg", "-v", "quiet", "-i", sys.argv[1], "-ac", "1", "-ar", "16000", "-f", "s16le", "-"],
                     capture_output=True).stdout
x = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
hop = 320; n = len(x) // hop
rms = np.sqrt((x[:n * hop].reshape(n, hop) ** 2).mean(1) + 1e-12)
db = 20 * np.log10(rms)
sil = db < -42
print(f"duration {len(x)/16000:.2f}s  peak {20*np.log10(np.abs(x).max()):.1f} dBFS")
runs, i = [], 0
while i < n:
    if sil[i]:
        j = i
        while j < n and sil[j]: j += 1
        if (j - i) * 0.02 >= 0.18: runs.append((i * 0.02, j * 0.02))
        i = j
    else: i += 1
speech_start = next(k for k in range(n) if not sil[k]) * 0.02
speech_end = (n - next(k for k in range(n) if not sil[n - 1 - k])) * 0.02
print(f"speech {speech_start:.2f} - {speech_end:.2f}")
for a, b in runs: print(f"pause {a:6.2f} - {b:6.2f}  ({b-a:.2f}s)")
