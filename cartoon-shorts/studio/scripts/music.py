# music.py - the channel's local cartoon music bed (0 credits, no samples, no ElevenLabs Music).
# usage: python3 scripts/music.py <config.json> <out.wav>
# config: {"duration": s, "vo_at": s, "words": "path/words.json", "voice": "path/to/voice.(mp3|wav)",
#          "key": "C", "bpm": [96, 120] or a number, "align": [t1, t2, ...],   # times the beat grid should hit
#          "sections": [[t0, t1, "theme"|"uhoh"|"build"|"theme2"|"final"], ...],  # music time = video time
#          "stops": [[t, dur], ...], "pings": [t, ...], "under_db": 24}
# Instruments: marimba (sine + quiet 4x partial, fast decay), pizzicato (Karplus-Strong), round bass, shaker, woodblock,
# glockenspiel. Short room reverb, low-pass ~7 kHz, high-pass ~70 Hz, ducking under the words, RMS set under the voice.
import json, subprocess, sys
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 44100
cfg = json.load(open(sys.argv[1])); OUT = sys.argv[2]
DUR = cfg['duration']; T0 = cfg.get('start', 0.1)
N = int(round(DUR * SR))
rng = np.random.default_rng(7)

NOTE = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
KEY = NOTE[cfg.get('key', 'C')]
def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
MAJ = [0, 2, 4, 5, 7, 9, 11]
def deg(d, octv):  # scale degree (0-based, may exceed 6) -> midi
    return 12 * (octv + 1) + KEY + MAJ[d % 7] + 12 * (d // 7)

# ---------- tempo: pick the BPM that puts the align times closest to a beat ----------
bpm = cfg.get('bpm', [96, 120])
if isinstance(bpm, list):
    best = None
    for b in np.arange(bpm[0], bpm[1] + 0.01, 0.5):
        bt = 60 / b
        err = sum(min(((t - T0) / bt) % 1, 1 - ((t - T0) / bt) % 1) * bt for t in cfg.get('align', []))
        if best is None or err < best[0] - 1e-9: best = (err, b)
    bpm = float(best[1])
BT = 60 / bpm

# ---------- instruments ----------
def env(n, a=0.005, rel=0.03):
    e = np.ones(n); na = max(1, int(a * SR)); nr = max(1, int(rel * SR))
    e[:na] = np.linspace(0, 1, na); e[-nr:] *= np.linspace(1, 0, nr); return e
def marimba(f, dur, v):
    n = int(dur * SR); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t) * np.exp(-t * 7) + 0.25 * np.sin(2 * np.pi * 4 * f * t) * np.exp(-t * 22)
    return v * x * env(n, 0.004, 0.04)
def glock(f, dur, v):
    n = int(dur * SR); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t) * np.exp(-t * 3) + 0.35 * np.sin(2 * np.pi * 2.76 * f * t) * np.exp(-t * 8) + 0.15 * np.sin(2 * np.pi * 5.4 * f * t) * np.exp(-t * 14)
    return v * x * env(n, 0.003, 0.08)
def pluck(f, dur, v, bright=0.5):  # Karplus-Strong
    n = int(dur * SR); p = max(2, int(SR / f))
    buf = rng.uniform(-1, 1, p) * 0.8; out = np.zeros(n); idx = 0
    decay = 0.994 - 0.004 * (1 - bright)
    for i in range(n):
        out[i] = buf[idx]; nxt = (idx + 1) % p
        buf[idx] = decay * 0.5 * (buf[idx] + buf[nxt]); idx = nxt
    return v * out * env(n, 0.003, 0.05)
def bass(f, dur, v):
    n = int(dur * SR); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t) + 0.18 * np.sin(4 * np.pi * f * t)
    return v * x * np.exp(-t * 2.2) * env(n, 0.012, 0.06)
def shaker(dur, v):
    n = int(dur * SR); x = rng.standard_normal(n)
    sos = butter(2, 5000, 'hp', fs=SR, output='sos'); x = sosfilt(sos, x)
    t = np.arange(n) / SR
    return v * x * np.exp(-t * 60) * env(n, 0.002, 0.01)
def wood(dur, v, f=1400):
    n = int(dur * SR); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t) * np.exp(-t * 55) + 0.4 * np.sin(2 * np.pi * f * 1.5 * t) * np.exp(-t * 80)
    return v * x * env(n, 0.001, 0.01)

bed = np.zeros(N + SR * 3)
def put(x, t):
    i = int(round(t * SR))
    if i < 0 or i >= N: return
    j = min(len(bed), i + len(x)); bed[i:j] += x[:j - i]

# ---------- harmony ----------
PROG = {'theme': [0, 5, 3, 4], 'theme2': [0, 3, 4, 0], 'uhoh': [5, 2, 5, 1], 'build': [3, 4, 4, 4], 'final': [0, 3, 4, 0]}
MOTIF = [(0, 4), (0.5, 2), (1, 4), (1.5, 5), (2, 7), (3, 6),          # bar A: (beat, scale degree above the chord root)
         (4, 4), (4.5, 5), (5, 4), (5.5, 2), (6, 0), (7, 2)]          # bar B
def chord(root): return [root, root + 2, root + 4]

sections = cfg['sections']
stops = cfg.get('stops', [])
def stopped(t):
    return any(s <= t < s + d for s, d in stops)

beat_i = 0
while True:
    tb = T0 + beat_i * BT
    if tb >= DUR - 0.45: break
    sec = next((s for s in sections if s[0] <= tb < s[1]), None)
    if sec is None or stopped(tb): beat_i += 1; continue
    kind = sec[2]; rel = int(round((tb - sec[0]) / BT))
    bar = rel // 4; b = rel % 4
    root = PROG[kind][bar % 4]
    if kind in ('theme', 'theme2', 'final'):
        if b in (0, 2): put(bass(hz(deg(root, 2)), BT * 1.8, 0.55), tb)
        for k, d in enumerate(chord(root)):
            if b in (1, 3): put(pluck(hz(deg(d, 3)), BT * 0.9, 0.16 - 0.03 * k), tb + 0.01 * k)
        put(shaker(0.12, 0.05), tb + BT / 2); put(shaker(0.1, 0.03), tb)
        for (mb, md) in MOTIF:
            pos = (rel % 8)
            if pos <= mb < pos + 1:
                v = 0.30 if kind != 'theme2' else 0.24
                var = 1 if (bar // 2) % 2 and md == 7 else 0
                put(marimba(hz(deg(root + md - var, 4)), BT * 1.2, v), tb + (mb - pos) * BT)
    elif kind == 'uhoh':
        put(pluck(hz(deg(root, 2)), BT * 1.5, 0.32, 0.2), tb)
        if b in (1, 3): put(wood(0.15, 0.10, 1500 if b == 1 else 1250), tb)
        if b == 0: put(marimba(hz(deg(root + 2, 4)), BT * 2, 0.14), tb + BT * 0.5)
    elif kind == 'build':
        if b == 0: put(bass(hz(deg(root, 2)), BT * 3.5, 0.45), tb)
        for k in range(4):  # rising arpeggio, 16ths
            d = root + [0, 2, 4, 7][k] + 7 * (rel % 2)
            put(marimba(hz(deg(d, 4)), BT * 0.6, 0.18 + 0.03 * k), tb + k * BT / 4)
        put(shaker(0.1, 0.05), tb + BT / 2)
    beat_i += 1

# final chord + glockenspiel pings on the punchline
for t in cfg.get('pings', []):
    for k, d in enumerate([7, 9, 11, 14]):
        put(glock(hz(deg(d, 5)), 1.6, 0.16), t + 0.07 * k)
if cfg.get('end_chord'):
    t = cfg['end_chord']
    put(bass(hz(deg(0, 2)), 1.4, 0.5), t)
    for k, d in enumerate([0, 2, 4, 7]): put(marimba(hz(deg(d, 4)), 1.4, 0.2), t + 0.02 * k)

bed = bed[:N]
# ---------- room reverb + filters ----------
ir_n = int(0.6 * SR); ir = rng.standard_normal(ir_n) * np.exp(-np.arange(ir_n) / SR * 7.5); ir /= np.sqrt((ir ** 2).sum())
wet = fftconvolve(bed, ir)[:N]
mix = 0.82 * bed + 0.18 * wet * (np.abs(bed).max() / max(np.abs(wet).max(), 1e-9))
mix = sosfilt(butter(4, 7000, 'lp', fs=SR, output='sos'), mix)
mix = sosfilt(butter(2, 70, 'hp', fs=SR, output='sos'), mix)
mix -= mix.mean()

# ---------- ducking under the words (duck_db, default -6 dB, 80 ms attack, 250 ms release) ----------
words = json.load(open(cfg['words']))['words']
gate = np.zeros(N)
for w in words:
    if w.get('type', 'word') != 'word': continue
    a = int((w['start'] + cfg['vo_at']) * SR); b = int((w['end'] + cfg['vo_at']) * SR); gate[max(a, 0):min(b, N)] = 1
g = np.zeros(N); cur = 0.0
att = 1 - np.exp(-1 / (0.08 * SR)); rel = 1 - np.exp(-1 / (0.25 * SR))
for i in range(N):
    cur += (gate[i] - cur) * (att if gate[i] > cur else rel); g[i] = cur
mix *= 10 ** (-cfg.get('duck_db', 6) * g / 20)
# end fade (last 0.5 s) + 5 ms start fade
nf = int(0.5 * SR); mix[-nf:] *= np.linspace(1, 0, nf) ** 1.5; mix[:220] *= np.linspace(0, 1, 220)

# ---------- level: bed RMS `under_db` below the voice RMS ----------
raw = subprocess.run(['ffmpeg', '-v', 'quiet', '-i', cfg['voice'], '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True).stdout
vo = np.frombuffer(raw, np.float32).astype(float)
def rms_active(x):
    fr = x[: len(x) // 1024 * 1024].reshape(-1, 1024); r = np.sqrt((fr ** 2).mean(1)); r = r[r > 10 ** (-42 / 20)]
    return np.sqrt((r ** 2).mean())
vr = rms_active(vo)
for _ in range(4):  # the active-frame threshold moves with the level, so iterate
    mix *= (vr * 10 ** (-cfg.get('under_db', 24) / 20)) / rms_active(mix)
pk = np.abs(mix).max()
if pk > 10 ** (-1 / 20): mix *= 10 ** (-1 / 20) / pk
jumps = np.abs(np.diff(mix)).max()
import wave
with wave.open(OUT, 'wb') as wf:
    wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(SR)
    wf.writeframes((np.clip(mix, -1, 1) * 32767).astype(np.int16).tobytes())
spec = np.abs(np.fft.rfft(mix)); fr = np.fft.rfftfreq(len(mix), 1 / SR)
print(json.dumps(dict(bpm=bpm, beat=BT, peak_db=round(20 * np.log10(np.abs(mix).max() + 1e-12), 2),
                      bed_vs_voice_db=round(20 * np.log10(rms_active(mix) / vr), 2), max_jump=round(float(jumps), 4),
                      dc=round(float(mix.mean()), 6), above7k=round(float(spec[fr > 7000].sum() / spec.sum()), 4), seconds=len(mix) / SR)))
