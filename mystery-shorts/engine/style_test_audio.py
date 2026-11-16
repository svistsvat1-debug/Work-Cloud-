# Music (synthesized) + library SFX + voice mix -> mix.wav. Usage: python3 audio.py <S> <sfx-library-dir>
import sys, json, subprocess, numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile

S, LIB = sys.argv[1], sys.argv[2]
SR, DUR = 48000, 12.8
N = int(SR * DUR)
t = np.arange(N) / SR
rng = np.random.default_rng(11)

def read(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.float32).copy()

def lp(x, f, o=4): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def db(x): return 10 ** (x / 20)
def env(keys):  # piecewise-linear envelope [(time, gain)]
    ks = np.array(keys); return np.interp(t, ks[:, 0], ks[:, 1])
def place(buf, x, at, gain_db, fade_out=0.0):
    i = int(at * SR); x = x[:max(0, N - i)].copy()
    if fade_out: n = int(fade_out * SR); x[-n:] *= np.linspace(1, 0, min(n, len(x)))
    buf[i:i + len(x)] += x * db(gain_db) / (np.max(np.abs(x)) + 1e-9)

voice = read(f'{S}/vo48.wav') if False else read(next(iter(__import__('glob').glob(f'{S}/src/*.wav'))))
voice = np.pad(voice, (0, max(0, N - len(voice))))[:N]
words = json.load(open(f'{S}/words.json'))

# ---------- music ----------
mus = np.zeros(N)
# drone: D2 + A2 with slow beating, swells; stops on "But", returns as tense cluster
drone = (np.sin(2 * np.pi * 73.42 * t) + 0.6 * np.sin(2 * np.pi * 110.0 * t + 0.3) + 0.35 * np.sin(2 * np.pi * 73.9 * t))
drone *= 1 + 0.25 * np.sin(2 * np.pi * 0.18 * t)
mus += lp(drone, 400) * env([(0, 0), (0.6, 0.5), (3.4, 0.55), (3.5, 0.35), (8.6, 0.45), (9.15, 0.0), (9.6, 0.0), (11.6, 0.5), (11.66, 0.0), (12.8, 0)])
tension = (np.sin(2 * np.pi * 77.78 * t) + np.sin(2 * np.pi * 73.42 * t) + 0.5 * np.sin(2 * np.pi * 155.6 * t)) * (0.6 + 0.4 * np.sin(2 * np.pi * 7 * t))
mus += lp(tension, 600) * env([(9.6, 0), (11.5, 0.55), (11.66, 0)])
# music-box / celesta notes (D minor, harmonic minor C# for unease)
def bell(f, dur=1.6):
    n = int(dur * SR); tt = np.arange(n) / SR
    x = (np.sin(2 * np.pi * f * tt) + 0.35 * np.sin(2 * np.pi * f * 2.76 * tt) * np.exp(-tt * 6) + 0.15 * np.sin(2 * np.pi * f * 4 * tt))
    x *= np.exp(-tt * 2.6) * np.minimum(1, tt / 0.004)
    return x
notes = [(0.25, 587.3), (1.3, 698.5), (2.35, 880.0), (3.5, 659.3), (4.9, 587.3), (6.75, 698.5), (7.85, 659.3), (8.35, 554.4)]
for at, f in notes:
    b = bell(f) * 0.32; i = int(at * SR); mus[i:i + len(b)] += b[:N - i]
# glockenspiel-ish sting on the loop-back
b = bell(293.7, 2.0) * 0.25; i = int(12.3 * SR); mus[i:i + len(b)] += b[:N - i]
# heartbeat in the "but" gap
def thump(at, g):
    n = int(0.25 * SR); tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * (55 - 25 * tt / 0.25) * tt) * np.exp(-tt * 18); i = int(at * SR); mus[i:i + n] += x * g
thump(8.72, 1.0); thump(8.98, 0.75)
# reverb
ir = rng.standard_normal(int(0.9 * SR)) * np.exp(-np.arange(int(0.9 * SR)) / SR * 5)
mus = 0.8 * mus + 0.2 * fftconvolve(mus, ir)[:N] / 40
mus = hp(lp(mus, 6500), 45)
# ducking under words
duck = np.ones(N)
for w in words:
    duck[int(w['s'] * SR):int(w['e'] * SR)] = db(-5)
k = int(0.12 * SR); duck = np.convolve(duck, np.ones(k) / k, 'same')
mus *= duck
fade = np.ones(N); fade[-int(0.4 * SR):] = np.linspace(1, 0, int(0.4 * SR)); mus *= fade

# ---------- ambience + SFX ----------
fx = np.zeros(N)
brown = np.cumsum(rng.standard_normal(N)); brown = hp(brown, 30); brown /= np.max(np.abs(brown))
sea = lp(brown, 900) * (0.55 + 0.45 * np.sin(2 * np.pi * t / 2.8) ** 2)
sea_out = sea * env([(0, 0.0), (0.3, 1), (3.42, 1), (3.43, 0), (12.25, 0), (12.26, 0.8), (12.8, 0.6)])
sea_in = lp(sea, 250) * env([(3.42, 0), (3.5, 0.5), (12.24, 0.5), (12.25, 0)])
fx += sea_out * db(-20) + sea_in * db(-24)
rain = read(f'{LIB}/rain.wav'); rain_l = np.tile(rain, 3)
place(fx, rain_l[:int(3.42 * SR)], 0.0, -30, fade_out=0.05)
place(fx, rain_l[:int(0.55 * SR)], 12.25, -32, fade_out=0.3)
cues = [('rope_creak', 0.7, -25), ('wave_crash', 1.5, -29), ('rope_creak', 2.3, -27), ('glide', 3.12, -25),
        ('rope_creak', 5.6, -31), ('curse', 10.95, -24), ('flame_out', 11.6, -20), ('boom_low', 11.66, -12), ('thunder', 12.25, -23)]
for name, at, g in cues:
    place(fx, read(f'{LIB}/{name}.wav'), at, g)
cr = read(f'{LIB}/creak.wav')[:int(0.45 * SR)]; place(fx, cr, 4.05, -24, fade_out=0.08)

# ---------- mix ----------
v = voice / (np.max(np.abs(voice)) + 1e-9) * db(-4)
vr = np.sqrt(np.mean(v[np.abs(v) > 0.01] ** 2)); mr = np.sqrt(np.mean(mus ** 2)) + 1e-9
mus *= vr / mr * db(-15)   # music bed ~15 dB under the voice (owner asked for louder music)
mix = v + mus + fx
peak = np.max(np.abs(mix)); mix *= db(-1.5) / peak if peak > db(-1.5) else 1
print('peak dBFS', 20 * np.log10(np.max(np.abs(mix))), 'music-under-voice dB', 20 * np.log10(np.sqrt(np.mean(mus ** 2)) / vr))
wavfile.write(f'{S}/mix.wav', SR, (mix * 32767).astype(np.int16))
