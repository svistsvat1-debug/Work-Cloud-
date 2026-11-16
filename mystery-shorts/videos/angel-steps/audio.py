# angel-steps: music in code + ambience + SFX + voice -> mix.wav. Usage: python3 audio.py <work> <cartoon sfx lib> <mystery sfx lib>
import sys, json, subprocess, numpy as np
from scipy.signal import butter, sosfilt, fftconvolve, resample
from scipy.io import wavfile
S, LIB, MLIB = sys.argv[1], sys.argv[2], sys.argv[3]
SR, DUR = 48000, 21.6
N = int(SR * DUR); t = np.arange(N) / SR
rng = np.random.default_rng(5)
def read(p):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.float32).copy()
def lp(x, f, o=4): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def db(x): return 10 ** (x / 20)
def env(keys): ks = np.array(keys, float); return np.interp(t, ks[:, 0], ks[:, 1])
def place(buf, x, at, g, fade_out=0.0, rate=1.0):
    if rate != 1.0: x = resample(x, int(len(x) / rate))
    i = int(at * SR); x = x[:max(0, N - i)].copy()
    if fade_out: n = min(int(fade_out * SR), len(x)); x[-n:] *= np.linspace(1, 0, n)
    buf[i:i + len(x)] += x * db(g) / (np.max(np.abs(x)) + 1e-9)
voice = read(f'{S}/src/voice.wav'); voice = np.pad(voice, (0, max(0, N - len(voice))))[:N]
words = json.load(open(f'{S}/words.json'))

# ---- music: E minor ----
mus = np.zeros(N)
drone = np.sin(2 * np.pi * 82.41 * t) + 0.6 * np.sin(2 * np.pi * 123.47 * t + 0.4) + 0.35 * np.sin(2 * np.pi * 82.9 * t)
drone *= 1 + 0.25 * np.sin(2 * np.pi * 0.22 * t)
mus += lp(drone, 420) * env([(0, 0.3), (0.5, 0.5), (6.3, 0.55), (6.36, 0), (8.6, 0), (9.3, 0.5), (16.2, 0.5), (19.5, 0.6), (20.3, 0.6), (20.35, 0.25), (21.6, 0)])
tension = (np.sin(2 * np.pi * 87.31 * t) + np.sin(2 * np.pi * 82.41 * t) + 0.5 * np.sin(2 * np.pi * 174.6 * t)) * (0.6 + 0.4 * np.sin(2 * np.pi * 6 * t))
mus += lp(tension, 650) * env([(16.3, 0), (20.25, 0.6), (20.35, 0)])
def bell(f, dur=1.6, dec=2.6):
    n = int(dur * SR); tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * tt) + 0.35 * np.sin(2 * np.pi * f * 2.76 * tt) * np.exp(-tt * 6) + 0.15 * np.sin(2 * np.pi * f * 4 * tt)
    return x * np.exp(-tt * dec) * np.minimum(1, tt / 0.004)
for at, f in [(0.2, 659.3), (1.2, 784.0), (2.2, 987.8), (3.3, 740.0), (4.7, 659.3), (5.6, 622.3),
              (9.4, 659.3), (10.5, 622.3), (12.2, 784.0), (13.3, 740.0), (16.5, 659.3), (17.5, 622.3), (18.6, 587.3)]:
    b = bell(f) * 0.3; i = int(at * SR); mus[i:i + len(b)] += b[:N - i]
b = bell(329.6, 2.0, 2.0) * 0.28; i = int(20.9 * SR); mus[i:i + len(b)] += b[:N - i]
def thump(at, g):
    n = int(0.25 * SR); tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * (55 - 25 * tt / 0.25) * tt) * np.exp(-tt * 18); i = int(at * SR); mus[i:i + n] += x * g
thump(7.8, 1.0); thump(8.08, 0.8)                     # heartbeat between "grows" and "Why?"
hit = np.zeros(int(1.4 * SR)); tt = np.arange(len(hit)) / SR
hit = (np.sin(2 * np.pi * 41.2 * tt) + 0.5 * np.sin(2 * np.pi * 82.4 * tt)) * np.exp(-tt * 3)
i = int(20.35 * SR); mus[i:i + len(hit)] += hit[:N - i] * 0.9
ir = rng.standard_normal(int(0.9 * SR)) * np.exp(-np.arange(int(0.9 * SR)) / SR * 5)
mus = hp(lp(0.82 * mus + 0.18 * fftconvolve(mus, ir)[:N] / 40, 6500), 40)
duck = np.ones(N)
for w in words: duck[int(w['s'] * SR):int(max(w['e'], w['s'] + 0.1) * SR)] = db(-5)
k = int(0.12 * SR); mus *= np.convolve(duck, np.ones(k) / k, 'same')
mus[-int(0.4 * SR):] *= np.linspace(1, 0, int(0.4 * SR))

# ---- ambience + SFX ----
fx = np.zeros(N)
city = lp(np.cumsum(rng.standard_normal(N)), 500); city = hp(city, 40); city /= np.max(np.abs(city))
fx += city * env([(0, 1), (8.5, 1), (9.35, 1), (9.36, 0), (16.25, 0), (16.3, 1), (21.6, 1)]) * db(-28)
air = hp(lp(rng.standard_normal(N), 900), 200); air /= np.max(np.abs(air))
fx += air * env([(11.95, 0), (12.1, 1), (16.25, 1), (16.3, 0)]) * db(-36)
L = lambda n: read(f'{LIB}/{n}.wav'); M = lambda n: read(f'{MLIB}/{n}.wav')
st = M('stone_set')
place(fx, st, 1.35, -14)                                         # the first step goes in
for j in range(13):                                              # 13 more steps, on twos
    place(fx, st, 4.7 + j * (1.2 / 13), -22 - j * 0.4, rate=1.0 + 0.04 * (j % 3))
place(fx, L('grind'), 9.5, -22); place(fx, L('glacier_groan'), 10.4, -27)
place(fx, L('glide'), 11.95, -27)
def ping(at, g):
    n = int(0.6 * SR); tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * 1320 * tt) * np.exp(-tt * 9) + 0.3 * np.sin(2 * np.pi * 1980 * tt) * np.exp(-tt * 14)
    place(fx, x, at, g)
for a in (13.05, 13.85, 14.65, 15.45): ping(a, -30)
place(fx, L('boom_low'), 20.35, -12)
fx[-int(0.4 * SR):] *= np.linspace(1, 0, int(0.4 * SR))

v = voice / (np.max(np.abs(voice)) + 1e-9) * db(-4)
vr = np.sqrt(np.mean(v[np.abs(v) > 0.01] ** 2)); mus *= vr / (np.sqrt(np.mean(mus ** 2)) + 1e-9) * db(-15)
mix = v + mus + fx; mix *= db(-4) / np.max(np.abs(mix))
print('peak dBFS', round(20 * np.log10(np.max(np.abs(mix))), 1), '| music under voice', round(20 * np.log10(np.sqrt(np.mean(mus ** 2)) / vr), 1))
wavfile.write(f'{S}/mix.wav', SR, (mix * 32767).astype(np.int16))
