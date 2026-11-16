# messina-saints: music in code + ambience + library/new SFX + voice -> mix.wav
# Usage: python3 audio.py <work dir> <cartoon sfx lib> <mystery sfx lib>
import sys, json, subprocess, numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile

S, LIB, MLIB = sys.argv[1], sys.argv[2], sys.argv[3]
SR, DUR = 48000, 23.0
N = int(SR * DUR); t = np.arange(N) / SR
rng = np.random.default_rng(11)

def read(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.float32).copy()
def lp(x, f, o=4): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, a, b): return sosfilt(butter(2, [a, b], 'band', fs=SR, output='sos'), x)
def db(x): return 10 ** (x / 20)
def env(keys):
    ks = np.array(keys, float); return np.interp(t, ks[:, 0], ks[:, 1])
def place(buf, x, at, gain_db, fade_out=0.0, length=None):
    if length: x = x[:int(length * SR)].copy()
    i = int(at * SR); x = x[:max(0, N - i)].copy()
    if fade_out: n = min(int(fade_out * SR), len(x)); x[-n:] *= np.linspace(1, 0, n)
    buf[i:i + len(x)] += x * db(gain_db) / (np.max(np.abs(x)) + 1e-9)

voice = read(f'{S}/src/voice.wav'); voice = np.pad(voice, (0, max(0, N - len(voice))))[:N]
words = json.load(open(f'{S}/words.json'))

# ---------------- music: D minor dark ambient ----------------
mus = np.zeros(N)
drone = np.sin(2 * np.pi * 73.42 * t) + 0.6 * np.sin(2 * np.pi * 110.0 * t + 0.3) + 0.35 * np.sin(2 * np.pi * 73.9 * t)
drone *= 1 + 0.25 * np.sin(2 * np.pi * 0.2 * t)
mus += lp(drone, 420) * env([(0, 0.25), (0.5, 0.5), (4.9, 0.5), (8.6, 0.6), (11.25, 0.65), (11.3, 0), (11.75, 0), (11.8, 0.5),
                             (16.0, 0.45), (18.4, 0.45), (21.7, 0.6), (21.75, 0.25), (23.0, 0)])
# pulse under the break-in and the theft
pulse = np.sin(2 * np.pi * 55 * t) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 1.6 * t)))
mus += lp(pulse, 200) * env([(4.95, 0), (5.5, 0.35), (11.25, 0.5), (11.3, 0), (13.1, 0), (13.4, 0.25), (16.0, 0)])
# tension cluster before the open question
tension = (np.sin(2 * np.pi * 77.78 * t) + np.sin(2 * np.pi * 73.42 * t) + 0.5 * np.sin(2 * np.pi * 155.6 * t)) * (0.6 + 0.4 * np.sin(2 * np.pi * 6 * t))
mus += lp(tension, 650) * env([(18.4, 0), (21.6, 0.6), (21.72, 0)])
def bell(f, dur=1.6, decay=2.6):
    n = int(dur * SR); tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * tt) + 0.35 * np.sin(2 * np.pi * f * 2.76 * tt) * np.exp(-tt * 6) + 0.15 * np.sin(2 * np.pi * f * 4 * tt)
    return x * np.exp(-tt * decay) * np.minimum(1, tt / 0.004)
# music-box line: D minor + C# (harmonic minor) for unease
notes = [(0.2, 587.3), (1.25, 698.5), (2.3, 880.0), (3.4, 659.3), (5.1, 587.3), (6.2, 554.4), (7.3, 587.3),
         (16.4, 698.5), (17.4, 659.3), (18.6, 587.3), (19.6, 554.4), (20.6, 523.3)]
for at, f in notes:
    b = bell(f) * 0.3; i = int(at * SR); mus[i:i + len(b)] += b[:N - i]
b = bell(293.7, 2.0, 2.0) * 0.28; i = int(22.25 * SR); mus[i:i + len(b)] += b[:N - i]     # soft bell on the loop-back
def thump(at, g):
    n = int(0.25 * SR); tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * (55 - 25 * tt / 0.25) * tt) * np.exp(-tt * 18); i = int(at * SR); mus[i:i + n] += x * g
thump(11.34, 1.1); thump(11.6, 0.8)                     # heartbeat in the gap before "but"
hit = np.zeros(int(1.6 * SR)); tt = np.arange(len(hit)) / SR
hit = (np.sin(2 * np.pi * 36.7 * tt) + 0.5 * np.sin(2 * np.pi * 73.4 * tt)) * np.exp(-tt * 3.0)
i = int(21.72 * SR); mus[i:i + len(hit)] += hit[:N - i] * 0.9  # deep hit at the end of "behind?"
ir = rng.standard_normal(int(0.9 * SR)) * np.exp(-np.arange(int(0.9 * SR)) / SR * 5)
mus = 0.82 * mus + 0.18 * fftconvolve(mus, ir)[:N] / 40
mus = hp(lp(mus, 6500), 40)
duck = np.ones(N)
for w in words: duck[int(w['s'] * SR):int(max(w['e'], w['s'] + 0.1) * SR)] = db(-5)
k = int(0.12 * SR); duck = np.convolve(duck, np.ones(k) / k, 'same'); mus *= duck
fade = np.ones(N); fade[-int(0.4 * SR):] = np.linspace(1, 0, int(0.4 * SR)); mus *= fade

# ---------------- ambience + SFX ----------------
fx = np.zeros(N)
brown = np.cumsum(rng.standard_normal(N)); brown = hp(brown, 30); brown /= np.max(np.abs(brown))
sea = lp(brown, 700) * (0.55 + 0.45 * np.sin(2 * np.pi * t / 3.1) ** 2)
wall_on = env([(0, 1), (4.93, 1), (4.95, 0), (11.58, 0), (11.6, 1), (16.08, 1), (16.1, 0), (18.38, 0), (18.4, 1), (23, 1)])
fx += sea * wall_on * db(-24)
crowd = bp(rng.standard_normal(N), 250, 1400) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.7 * t) ** 2)       # distant festival murmur
fx += crowd / np.max(np.abs(crowd)) * env([(4.95, 0), (5.1, 1), (8.6, 1), (8.65, 0)]) * db(-34)
room = lp(rng.standard_normal(N), 180)
fx += room / np.max(np.abs(room)) * env([(8.65, 0), (8.7, 1), (11.58, 1), (11.6, 0), (16.1, 0), (16.15, 1), (18.38, 1), (18.4, 0)]) * db(-36)
L = lambda n: read(f'{LIB}/{n}.wav'); M = lambda n: read(f'{MLIB}/{n}.wav')
bl = lp(L('bell'), 1500); place(fx, bl, 5.0, -28)                       # far procession bell
place(fx, L('tiptoe'), 5.8, -27); place(fx, L('tiptoe'), 6.6, -29)
place(fx, L('lever'), 6.82, -24)                                         # railing bent / door forced
place(fx, L('creak'), 7.1, -25, fade_out=0.08, length=0.45)
place(fx, L('tiptoe'), 8.8, -28)
place(fx, L('whoosh'), 10.6, -28)                                        # the flash
place(fx, M('panel_lift'), 10.68, -17)
place(fx, M('run_steps'), 10.95, -26)
place(fx, M('run_steps'), 12.0, -23); place(fx, M('run_steps'), 13.45, -25, fade_out=0.3)
place(fx, M('panel_drop'), 13.27, -14)                                   # the two saints hit the wall
place(fx, L('curse'), 14.9, -24); place(fx, L('flame_out'), 15.04, -23)  # vanish
place(fx, L('boom_low'), 21.72, -13)
place(fx, bl, 22.3, -31)

# ---------------- mix ----------------
v = voice / (np.max(np.abs(voice)) + 1e-9) * db(-4)
vr = np.sqrt(np.mean(v[np.abs(v) > 0.01] ** 2)); mr = np.sqrt(np.mean(mus ** 2)) + 1e-9
mus *= vr / mr * db(-15)
fx[-int(0.4 * SR):] *= np.linspace(1, 0, int(0.4 * SR))
mix = v + mus + fx
peak = np.max(np.abs(mix)); mix *= db(-4) / peak
print('peak dBFS', round(20 * np.log10(np.max(np.abs(mix))), 1), '| music under voice dB', round(20 * np.log10(np.sqrt(np.mean(mus ** 2)) / vr), 1))
wavfile.write(f'{S}/mix.wav', SR, (mix * 32767).astype(np.int16))
