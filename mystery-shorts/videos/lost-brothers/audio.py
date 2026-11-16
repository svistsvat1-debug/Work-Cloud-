# lost-brothers: music in code + sea ambience + library SFX + voice -> mix.wav. Usage: python3 audio.py <work> <cartoon sfx lib>
import sys, json, subprocess, numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile
S, LIB = sys.argv[1], sys.argv[2]
SR, DUR = 48000, 22.8
N = int(SR * DUR); t = np.arange(N) / SR
rng = np.random.default_rng(9)
def read(p):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.float32).copy()
def lp(x, f, o=4): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def db(x): return 10 ** (x / 20)
def env(keys): ks = np.array(keys, float); return np.interp(t, ks[:, 0], ks[:, 1])
def place(buf, x, at, g, fade_out=0.0, length=None):
    if length: x = x[:int(length * SR)].copy()
    i = int(at * SR); x = x[:max(0, N - i)].copy()
    if fade_out: n = min(int(fade_out * SR), len(x)); x[-n:] *= np.linspace(1, 0, n)
    buf[i:i + len(x)] += x * db(g) / (np.max(np.abs(x)) + 1e-9)
voice = read(f'{S}/src/voice.wav'); voice = np.pad(voice, (0, max(0, N - len(voice))))[:N]
words = json.load(open(f'{S}/words.json'))

# ---- music: D minor ----
mus = np.zeros(N)
drone = np.sin(2 * np.pi * 73.42 * t) + 0.6 * np.sin(2 * np.pi * 110.0 * t + 0.3) + 0.35 * np.sin(2 * np.pi * 73.9 * t)
drone *= 1 + 0.25 * np.sin(2 * np.pi * 0.2 * t)
mus += lp(drone, 420) * env([(0, 0.3), (0.5, 0.5), (16.7, 0.55), (16.75, 0), (18.3, 0), (18.6, 0.45), (21.45, 0.6), (21.5, 0.2), (22.8, 0)])
tension = (np.sin(2 * np.pi * 77.78 * t) + np.sin(2 * np.pi * 73.42 * t) + 0.5 * np.sin(2 * np.pi * 155.6 * t)) * (0.6 + 0.4 * np.sin(2 * np.pi * 6 * t))
mus += lp(tension, 650) * env([(18.6, 0), (21.45, 0.6), (21.5, 0)])
def bell(f, dur=1.6, dec=2.6):
    n = int(dur * SR); tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * tt) + 0.35 * np.sin(2 * np.pi * f * 2.76 * tt) * np.exp(-tt * 6) + 0.15 * np.sin(2 * np.pi * f * 4 * tt)
    return x * np.exp(-tt * dec) * np.minimum(1, tt / 0.004)
for at, f in [(0.2, 587.3), (1.3, 698.5), (2.4, 880.0), (3.6, 659.3), (5.0, 587.3), (6.3, 554.4),
              (7.6, 698.5), (8.7, 784.0), (10.5, 659.3), (11.6, 587.3), (12.8, 554.4), (14.6, 587.3), (15.7, 698.5)]:
    b = bell(f) * 0.3; i = int(at * SR); mus[i:i + len(b)] += b[:N - i]
b = bell(293.7, 2.0, 2.0) * 0.28; i = int(22.1 * SR); mus[i:i + len(b)] += b[:N - i]
def thump(at, g):
    n = int(0.25 * SR); tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * (55 - 25 * tt / 0.25) * tt) * np.exp(-tt * 18); i = int(at * SR); mus[i:i + n] += x * g
thump(16.15, 1.0); thump(16.45, 0.8)                  # heartbeat before "Miguel's never does"
hit = np.zeros(int(1.4 * SR)); tt = np.arange(len(hit)) / SR
hit = (np.sin(2 * np.pi * 36.7 * tt) + 0.5 * np.sin(2 * np.pi * 73.4 * tt)) * np.exp(-tt * 3)
i = int(21.55 * SR); mus[i:i + len(hit)] += hit[:N - i] * 0.9
ir = rng.standard_normal(int(0.9 * SR)) * np.exp(-np.arange(int(0.9 * SR)) / SR * 5)
mus = hp(lp(0.82 * mus + 0.18 * fftconvolve(mus, ir)[:N] / 40, 6500), 40)
duck = np.ones(N)
for w in words: duck[int(w['s'] * SR):int(max(w['e'], w['s'] + 0.1) * SR)] = db(-5)
k = int(0.12 * SR); mus *= np.convolve(duck, np.ones(k) / k, 'same')
mus[-int(0.4 * SR):] *= np.linspace(1, 0, int(0.4 * SR))

# ---- ambience + SFX ----
fx = np.zeros(N)
brown = np.cumsum(rng.standard_normal(N)); brown = hp(brown, 30); brown /= np.max(np.abs(brown))
sea = lp(brown, 800) * (0.55 + 0.45 * np.sin(2 * np.pi * t / 3.0) ** 2)
sea_on = env([(0, 1), (7.43, 1), (7.45, 0), (10.33, 0), (10.35, 1), (18.23, 1), (18.25, 0), (22.03, 0), (22.05, 1), (22.8, 1)])
port_on = env([(7.43, 0), (7.45, 1), (10.33, 1), (10.35, 0)])
fx += sea * sea_on * db(-23) + lp(sea, 400) * port_on * db(-27)
room = lp(rng.standard_normal(N), 180); room /= np.max(np.abs(room))
fx += room * env([(18.23, 0), (18.25, 1), (22.03, 1), (22.05, 0)]) * db(-36)
L = lambda n: read(f'{LIB}/{n}.wav')
place(fx, L('rope_creak'), 0.8, -27); place(fx, L('wave_crash'), 2.7, -28)
place(fx, L('curse'), 5.6, -26)                                        # the third ship fades into the fog
place(fx, lp(L('bell'), 1500), 7.5, -27)                               # harbor bell
place(fx, L('rope_creak'), 8.4, -28); place(fx, L('gust'), 11.2, -29)  # the ships split up
place(fx, L('wave_crash'), 14.6, -29)
place(fx, L('glide'), 17.0, -29)
place(fx, L('creak'), 18.3, -26, fade_out=0.08, length=0.45)           # hall door
place(fx, L('tiptoe'), 18.45, -27)
place(fx, L('flame_out'), 21.45, -22); place(fx, L('boom_low'), 21.55, -12)
fx[-int(0.4 * SR):] *= np.linspace(1, 0, int(0.4 * SR))

v = voice / (np.max(np.abs(voice)) + 1e-9) * db(-4)
vr = np.sqrt(np.mean(v[np.abs(v) > 0.01] ** 2)); mus *= vr / (np.sqrt(np.mean(mus ** 2)) + 1e-9) * db(-15)
mix = v + mus + fx; mix *= db(-4) / np.max(np.abs(mix))
print('peak dBFS', round(20 * np.log10(np.max(np.abs(mix))), 1), '| music under voice', round(20 * np.log10(np.sqrt(np.mean(mus ** 2)) / vr), 1))
wavfile.write(f'{S}/mix.wav', SR, (mix * 32767).astype(np.int16))
