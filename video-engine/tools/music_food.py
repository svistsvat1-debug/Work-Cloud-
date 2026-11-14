"""Code-made WWII documentary underscore with a mood map (100 % free, numpy additive synth).
usage: python3 music_food.py <timing.json> <script_scenes.md> <out.wav>
Moods (from MUSIC MOOD tags): neutral = D minor strings + soft piano, 72 BPM;
tension = low strings, timpani pulse, light snare brush; reveal = brighter strings + horn swell (D major lift);
calm = sparse strings + piano. 2 s crossfades at scene boundaries, fade in 2 s / out 4 s.
"""
import json, re, sys, wave
import numpy as np

SR = 48000
tj, md, out = sys.argv[1:4]
T = json.load(open(tj))
moods = re.findall(r'MUSIC MOOD: (\w+)', open(md).read())
assert len(moods) == len(T['scenes']), (len(moods), len(T['scenes']))
dur = T['end']
n = int(SR * dur)
t_all = np.arange(n) / SR
BPM = 72
beat = 60 / BPM
bar = beat * 4
rng = np.random.default_rng(7)

def hz(m): return 440.0 * 2 ** ((m - 69) / 12)

def strings(buf, m, s0, L, amp, bright=1.0):
    a, b = int(s0 * SR), min(n, int((s0 + L) * SR))
    if a >= n or b <= a: return
    tt = np.arange(b - a) / SR
    f = hz(m)
    v = np.zeros_like(tt)
    vib = 0.004 * np.sin(2 * np.pi * 5.0 * tt)
    for k, ak in [(1, 1), (2, .5 * bright), (3, .3 * bright), (4, .15 * bright)]:
        for det in (-0.0015, 0.0017):
            v += ak * np.sin(2 * np.pi * f * k * (1 + det + vib) * tt + rng.uniform(0, 6.28))
    env = np.minimum(1, tt / 1.4) * np.clip((L - tt) / 1.8, 0, 1)
    buf[a:b] += amp * v * env / 2

def piano(buf, m, s0, amp):
    a = int(s0 * SR); L = min(n - a, int(3.5 * SR))
    if L <= 0 or a < 0: return
    tt = np.arange(L) / SR; f = hz(m)
    v = sum(ak * np.sin(2 * np.pi * f * k * tt) * np.exp(-tt * (1.2 + 1.3 * k)) for k, ak in [(1, 1), (2, .45), (3, .2), (4, .08)])
    buf[a:a + L] += amp * v * np.minimum(1, tt / 0.004)

def horn(buf, m, s0, L, amp):
    a, b = int(s0 * SR), min(n, int((s0 + L) * SR))
    if a >= n: return
    tt = np.arange(b - a) / SR; f = hz(m)
    v = sum(ak * np.sin(2 * np.pi * f * k * tt) for k, ak in [(1, 1), (2, .7), (3, .45), (4, .25), (5, .12)])
    env = np.sin(np.pi * np.clip(tt / L, 0, 1)) ** 1.5
    buf[a:b] += amp * v * env

def timp(buf, s0, amp, m=38):
    a = int(s0 * SR); L = min(n - a, int(1.6 * SR))
    if L <= 0: return
    tt = np.arange(L) / SR; f = hz(m)
    v = np.sin(2 * np.pi * f * tt * (1 + 0.04 * np.exp(-tt * 20))) * np.exp(-tt * 3.2)
    v += 0.3 * rng.standard_normal(L) * np.exp(-tt * 30)
    buf[a:a + L] += amp * v

def brush(buf, s0, amp):
    a = int(s0 * SR); L = min(n - a, int(0.25 * SR))
    if L <= 0: return
    tt = np.arange(L) / SR
    noise = rng.standard_normal(L)
    noise = np.convolve(noise, np.ones(6) / 6, mode='same')  # soft, dark brush
    buf[a:a + L] += amp * noise * np.exp(-tt * 18)

# chord progressions (MIDI) per mood
PROG = {
    'neutral': [[38, 50, 57, 62, 65], [34, 46, 53, 58, 62], [36, 48, 55, 60, 64], [33, 45, 52, 57, 61]],   # Dm Bb C A
    'tension': [[38, 50, 57, 62, 65], [39, 51, 58, 63, 66], [38, 50, 57, 62, 65], [37, 49, 56, 61, 64]],   # Dm Eb Dm C#dim-ish
    'reveal':  [[38, 50, 57, 62, 66], [43, 55, 59, 62, 67], [45, 57, 61, 64, 69], [38, 50, 57, 62, 66]],   # D G A D (lift)
    'calm':    [[38, 50, 57, 62, 65], [34, 46, 53, 58, 62], [41, 53, 57, 60, 65], [38, 50, 57, 62, 65]],   # Dm Bb F Dm
}
MEL = {'neutral': [62, 65, 69, 65], 'tension': [62, 63, 62, 61], 'reveal': [66, 69, 74, 69], 'calm': [62, 65, 62, 57]}

# bars where each mood is audible (scene span ± 2.5 s for the crossfade)
need = {m: set() for m in set(moods)}
for sc, mood in zip(T['scenes'], moods):
    for i in range(int(max(0, sc['start'] - 2.5 - bar) // bar), int((sc['end'] + 2.5) // bar) + 1):
        need[mood].add(i)
layers = {}
for mood in set(moods):
    buf = np.zeros(n)
    for i in sorted(need[mood]):
        s = i * bar
        ch = PROG[mood][i % 4]
        for m in ch:
            strings(buf, m, s, bar + 2.0, 0.06 if mood != 'calm' else 0.045, bright=1.3 if mood == 'reveal' else 1.0)
        if mood in ('neutral', 'calm', 'reveal'):
            for j, m in enumerate(MEL[mood]):
                if mood == 'calm' and j % 2: continue
                piano(buf, m, s + j * beat + 0.03, 0.05 if j else 0.065)
        if mood == 'tension':
            timp(buf, s, 0.22); timp(buf, s + 2 * beat, 0.12)
            for j in range(4): brush(buf, s + j * beat + beat / 2, 0.035)
        if mood == 'reveal' and i % 2 == 0:
            horn(buf, ch[2] + 12, s + 0.2, bar * 1.6, 0.03)
    layers[mood] = buf

# crossfaded mood envelopes (2 s) at scene boundaries
env = {m: np.zeros(n) for m in layers}
for sc, mood in zip(T['scenes'], moods):
    a, b = int(sc['start'] * SR), int(sc['end'] * SR)
    env[mood][a:b] = 1.0
k = int(2.0 * SR)
def smooth(x):  # 2 s moving average (cumsum, O(n)) = linear crossfade
    c = np.cumsum(np.concatenate([np.zeros(1), x]))
    pad = k // 2
    lo = np.clip(np.arange(n) - pad, 0, n); hi = np.clip(np.arange(n) + pad, 0, n)
    return (c[hi] - c[lo]) / k
mix = np.zeros(n)
for m in layers:
    mix += layers[m] * smooth(env[m])
mix *= np.minimum(1, t_all / 2.0) * np.clip((dur - t_all) / 4.0, 0, 1)
mix /= np.abs(mix).max() + 1e-9
mix *= 0.6
# simple stereo width: slight delay on the right
st = np.stack([mix, np.roll(mix, int(0.011 * SR))], 1)
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((st * 32767).astype('<i2').tobytes())
print('music', out, round(dur, 2), 's; moods', {m: moods.count(m) for m in set(moods)})
