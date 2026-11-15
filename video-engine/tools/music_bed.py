"""Free code-made WWII underscore bed: low string pad + soft piano, D minor, ~66 BPM. Usage: music_bed.py seconds out.wav"""
import sys, wave, numpy as np
SR = 48000
dur = float(sys.argv[1]); out = sys.argv[2]
n = int(SR * dur); t = np.arange(n) / SR
mix = np.zeros(n)
def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
def pad(m, start, length, amp):
    s0, s1 = int(start * SR), min(n, int((start + length) * SR))
    if s0 >= n: return
    tt = np.arange(s1 - s0) / SR
    f = hz(m); v = np.zeros_like(tt)
    for k, a in [(1, 1), (2, .45), (3, .25), (4, .12), (5, .06)]:
        for det in (-0.12, 0.12):  # two detuned "sections"
            v += a * np.sin(2 * np.pi * f * k * (1 + det / 100) * tt + 0.3 * np.sin(2 * np.pi * 5.2 * tt) * 0.01 * k)
    env = np.minimum(1, tt / 1.2) * np.minimum(1, (length - tt) / 1.5).clip(0)
    mix[s0:s1] += amp * v * env
def piano(m, start, amp):
    s0 = int(start * SR); L = min(n - s0, int(3 * SR))
    if L <= 0: return
    tt = np.arange(L) / SR; f = hz(m)
    v = sum(a * np.sin(2 * np.pi * f * k * tt) * np.exp(-tt * (1.5 + k)) for k, a in [(1, 1), (2, .4), (3, .15)])
    mix[s0:s0 + L] += amp * v * np.minimum(1, tt / 0.005)
bar = 60 / 66 * 4
chords = [[38, 50, 53, 57], [34, 46, 50, 53], [36, 48, 52, 55], [33, 45, 49, 52]]  # Dm Bb C A
for i in range(int(dur / bar) + 2):
    for m in chords[i % 4]: pad(m, i * bar, bar + 1.6, 0.05)
    for j, m in enumerate([62, 65, 69, 65] if i % 2 == 0 else [62, 64, 65, 64]):
        piano(m, i * bar + j * bar / 4 + 0.05, 0.05 if j else 0.07)
mix *= np.minimum(1, t / 2.0) * np.minimum(1, (dur - t) / 4.0).clip(0)  # fade in 2 s, out 4 s
mix /= np.abs(mix).max() + 1e-9; mix *= 0.5
st = np.stack([mix, np.roll(mix, int(0.012 * SR))], 1)
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((st * 32767).astype('<i2').tobytes())
