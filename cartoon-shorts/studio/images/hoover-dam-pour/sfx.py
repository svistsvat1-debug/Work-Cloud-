# sfx.py - new ElevenLabs sounds -> trimmed / looped, peak-normalised to -1 dBFS (public/hoover-dam-pour/sfx/*.wav)
import numpy as np, wave
OUT = 'public/hoover-dam-pour/sfx'
def rd(p):
    w = wave.open(p); sr = w.getframerate(); a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768; return a, sr
def wr(p, a, sr):
    a = a / (np.abs(a).max() + 1e-9) * 10 ** (-1 / 20)
    w = wave.open(p, 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((a * 32767).astype(np.int16).tobytes()); w.close()
# mixer: the steady part (0.0-0.85 s) looped with 0.15 s crossfades into a 3 s bed, 0.25 s fade-out
a, sr = rd('images/hoover-dam-pour/sfx_raw/mixer.wav')
seg = a[: int(0.85 * sr)]; xf = int(0.15 * sr)
out = seg.copy()
while len(out) < 3.0 * sr:
    r = np.linspace(0, 1, xf)
    out = np.concatenate([out[:-xf], out[-xf:] * (1 - r) + seg[:xf] * r, seg[xf:]])
out = out[: int(3.0 * sr)]; out[-int(0.25 * sr):] *= np.linspace(1, 0, int(0.25 * sr))
wr(f'{OUT}/mixer.wav', out, sr)
a, sr = rd('images/hoover-dam-pour/sfx_raw/can.wav')
a[-int(0.1 * sr):] *= np.linspace(1, 0, int(0.1 * sr))
wr(f'{OUT}/can.wav', a, sr)
print('ok')
