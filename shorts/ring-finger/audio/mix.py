# Synthesises the cartoon SFX and mixes them under the voice -> public/mix.wav (48 kHz, mono).
import json, numpy as np, librosa, soundfile as sf, os
SR = 48000
rng = np.random.default_rng(7)
TL = json.load(open("src/timeline.json"))
T, CUT, PAUSE, LEAD = TL["T"], TL["CUT"], TL["PAUSE"], TL["LEAD"]

def t_(d): return np.arange(int(d * SR)) / SR
def norm(x, peak_db=-1.0): return x / (np.abs(x).max() + 1e-9) * 10 ** (peak_db / 20)
def fade(x, a=0.004, r=0.02):
    n = len(x); e = np.ones(n); na, nr = int(a * SR), int(r * SR)
    if na: e[:na] = np.linspace(0, 1, na)
    if nr: e[-nr:] *= np.linspace(1, 0, nr)
    return x * e
def reson(x, fc, q=6.0):  # time-varying 2-pole resonator (fc may be an array)
    fc = np.broadcast_to(np.asarray(fc, float), x.shape); y = np.zeros_like(x); y1 = y2 = 0.0
    for i in range(len(x)):
        w = 2 * np.pi * fc[i] / SR; r = np.exp(-w / (2 * q))
        y0 = (1 - r) * x[i] + 2 * r * np.cos(w) * y1 - r * r * y2; y[i] = y0; y2, y1 = y1, y0
    return y
def chirp(f, t): return np.sin(2 * np.pi * np.cumsum(f) / SR)

def pop():
    t = t_(0.12); f = 520 + 700 * (1 - np.exp(-t / 0.02))
    return fade(chirp(f, t) * np.exp(-t / 0.035) + 0.3 * rng.standard_normal(len(t)) * np.exp(-t / 0.003))
def blink():
    t = t_(0.05); return fade(chirp(1500 + 900 * t / 0.05, t) * np.exp(-t / 0.012))
def tap():
    t = t_(0.14)
    return fade(np.sin(2 * np.pi * 150 * t) * np.exp(-t / 0.03) + 0.5 * reson(rng.standard_normal(len(t)), 900, 2) * np.exp(-t / 0.008))
def knock():
    t = t_(0.2); x = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t / d) for f, a, d in [(210, 1, .045), (520, .7, .03), (1180, .45, .016), (2300, .25, .008)])
    return fade(x + 0.6 * reson(rng.standard_normal(len(t)), 1500, 3) * np.exp(-t / 0.004))
def swish(d=0.28, f0=600, f1=3200):
    t = t_(d); env = np.sin(np.pi * t / d) ** 2
    return fade(reson(rng.standard_normal(len(t)), np.geomspace(f0, f1, len(t)), 3) * env)
def whoosh(): return swish(0.5, 300, 2400)
def zip_():
    t = t_(0.35); return fade(reson(rng.standard_normal(len(t)), np.geomspace(800, 4500, len(t)), 8) * (t / 0.35) ** 0.5 * np.exp(-((t - 0.3) / 0.12) ** 2 * 0.5))
def scan():
    t = t_(0.8); f = np.geomspace(260, 1500, len(t))
    x = chirp(f, t) * (0.6 + 0.4 * np.sin(2 * np.pi * 22 * t)) + 0.25 * reson(rng.standard_normal(len(t)), f * 2, 4)
    return fade(x * np.sin(np.pi * t / 0.8) ** 0.7, 0.01, 0.08)
def twang():
    t = t_(0.75); f = 230 * (1 + 0.28 * np.exp(-t * 4) * np.sin(2 * np.pi * 10 * t)) * (1 - 0.25 * t)
    ph = np.cumsum(f) / SR * 2 * np.pi
    return fade((np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.15 * np.sin(3 * ph)) * np.exp(-t / 0.28), 0.002, 0.06)
def strain(d):
    t = t_(d); f = 820 * (1 + 0.035 * np.sin(2 * np.pi * 6.5 * t) + 0.02 * np.sin(2 * np.pi * 17 * t))
    am = 0.55 + 0.45 * np.abs(np.sin(2 * np.pi * 3.1 * t + np.sin(2 * np.pi * 0.7 * t)))
    x = (chirp(f, t) + 0.3 * chirp(f * 2.01, t)) * am
    return fade(x, 0.15, 0.25)
def tick():
    t = t_(0.03); return fade(reson(rng.standard_normal(len(t)), 3200, 10) * np.exp(-t / 0.004), 0.0005, 0.005)
def deflate():
    t = t_(0.7); f = np.geomspace(760, 230, len(t)) * (1 + 0.02 * np.sin(2 * np.pi * 7 * t))
    return fade(chirp(f, t) * np.exp(-t / 0.5), 0.01, 0.1)
def buzz():
    out = []
    for f in (190, 140):
        t = t_(0.16); x = np.sign(np.sin(2 * np.pi * f * t)) * 0.6 + np.sin(2 * np.pi * f * t)
        out.append(fade(reson(x, 900, 1.2), 0.005, 0.03)); out.append(np.zeros(int(0.03 * SR)))
    return np.concatenate(out)

S = {k: norm(v) for k, v in dict(pop=pop(), blink=blink(), tap=tap(), knock=knock(), swish=swish(), swup=swish(0.24, 700, 3600),
     whoosh=whoosh(), zip=zip_(), scan=scan(), twang=twang(), strain=strain(2.3), strain2=strain(1.7), tick=tick(),
     deflate=deflate(), buzz=buzz()).items()}
os.makedirs("audio/sfx", exist_ok=True)
for k, v in S.items(): sf.write(f"audio/sfx/{k}.wav", v, SR)

CUES = [  # (time s, sound, dB)
 (T["table"] - 0.05, "tap", -20),
 (T["fold"] + 0.03, "swish", -28), (T["under"] + 0.05, "knock", -17),
 (T["thumb"] - 0.05, "swup", -27), (T["easy1"], "pop", -17), (T["easy1"] + 0.63, "tap", -24),
 (T["index"] - 0.04, "swup", -27), (T["easy2"], "pop", -17), (T["easy2"] + 0.47, "tap", -24),
 (T["pinky"] - 0.04, "swup", -27), (T["easy3"], "pop", -17), (T["easy3"] + 0.49, "tap", -24),
 (T["ring"], "blink", -22), (T["ringEnd"] - 0.35, "strain", -31),
 (T["pause0"], "tick", -24), (T["pause0"] + 0.5, "tick", -24), (T["pause0"] + 1.0, "tick", -24), (T["pause0"] + 1.5, "tick", -24),
 (T["stuck"], "pop", -22), (T["stuck"] + 0.15, "deflate", -29),
 (T["cutTop"], "whoosh", -24), (T["cutTop"] + 0.08, "scan", -25),
 (T["share"], "pop", -20), (T["share"] + 0.12, "zip", -27),
 (T["tied"], "pop", -21), (T["tied"] + 0.14, "pop", -21),
 (T["holds"] - 0.1, "strain2", -32), (T["leash"], "twang", -18),
 (T["backup"], "pop", -20), (T["backup"] + 0.14, "pop", -20), (T["backup"] + 0.4, "swish", -29),
 (T["doesnt"], "buzz", -23),
 (T["cutFront"], "whoosh", -24),
 (T["yes"], "pop", -18), (T["no"], "pop", -18),
 (T["end"] - 0.62, "swish", -28),
]

# voice: insert the try-it pause, lead-in
v, _ = librosa.load("audio/voice_raw.mp3", sr=SR, mono=True)
c = int(CUT * SR)
voice = np.concatenate([np.zeros(int(LEAD * SR)), v[:c], np.zeros(int(PAUSE * SR)), v[c:]])
N = int(T["end"] * SR) + SR // 10
mix = np.zeros(N); mix[:min(N, len(voice))] += voice[:N]
sfx = np.zeros(N)
for at, k, db in CUES:
    s = S[k] * 10 ** (db / 20); i = int(at * SR); j = min(N, i + len(s)); sfx[i:j] += s[: j - i]
mix += sfx
pk = np.abs(mix).max(); print("voice peak dBFS %.1f, mix peak dBFS %.1f" % (20 * np.log10(np.abs(voice).max()), 20 * np.log10(pk)))
if pk > 10 ** (-1 / 20): mix *= 10 ** (-1 / 20) / pk
mix[-int(0.05 * SR):] *= np.linspace(1, 0, int(0.05 * SR))
sf.write("public/mix.wav", mix.astype(np.float32), SR, subtype="PCM_16")
sf.write("audio/voice_edit.wav", voice.astype(np.float32), SR, subtype="PCM_16")
print("mix length %.2f s" % (len(mix) / SR))
