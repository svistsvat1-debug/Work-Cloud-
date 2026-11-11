"""Mix voice + SFX + music into one 48 kHz stereo master.
usage: python tools/mix.py voice.mp3 out/cues.json out/music_raw.wav sfx-library out/
Targets: voice -14 LUFS / TP <= -1.5 dBTP, SFX ~12-18 dB under voice, music ~25-30 dB under voice with ducking."""
import json, subprocess, sys, re, os
import numpy as np, scipy.io.wavfile as wf
from scipy.ndimage import maximum_filter1d, uniform_filter1d

voice_src, cues_p, music_p, lib, out = sys.argv[1:6]
SR = 48000
def run(cmd): return subprocess.run(cmd, capture_output=True, text=True)
def loud(path):
    r = run(['ffmpeg', '-nostats', '-i', path, '-af', 'ebur128=peak=true', '-f', 'null', '-'])
    I = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', r.stderr)[-1]); tp = float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS', r.stderr)[-1])
    return I, tp
def read(path):
    sr, a = wf.read(path); a = a.astype(np.float32) / (32768.0 if a.dtype == np.int16 else 1.0)
    if a.ndim == 1: a = np.stack([a, a], 1)
    assert sr == SR, (path, sr)
    return a
def write(path, a): wf.write(path, SR, (np.clip(a, -1, 1) * 32767).astype(np.int16))

# 1) voice: two-pass loudnorm to -14 LUFS, TP -1.5
r = run(['ffmpeg', '-nostats', '-i', voice_src, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'])
js = json.loads(r.stderr[r.stderr.rindex('{'):r.stderr.rindex('}') + 1])
flt = f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:measured_LRA={js['input_lra']}:measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true"
vpath = os.path.join(out, 'voice_norm.wav')
run(['ffmpeg', '-y', '-v', 'error', '-i', voice_src, '-af', flt + ',aresample=48000', '-ac', '2', '-c:a', 'pcm_s16le', vpath])
voice = read(vpath); N = len(voice)
vI, vTP = loud(vpath)
g = -14.0 - vI
if vTP + g > -1.5: g = -1.5 - vTP
voice *= 10 ** (g / 20); write(vpath, voice)
print('voice', loud(vpath), 'extra gain %.2f dB' % g)

# voice activity envelope (for ducking): 20 ms RMS, attack fast, release ~0.5 s
mono = voice.mean(1)
rms = np.sqrt(uniform_filter1d(mono ** 2, size=int(0.02 * SR)) + 1e-12)
active = (20 * np.log10(rms) > -42).astype(np.float32)
hold = maximum_filter1d(active, size=int(0.35 * SR))           # bridge short gaps between words
def smooth(x, a_s, r_s):
    y = np.empty_like(x); v = 0.0
    a = np.exp(-1 / (a_s * SR)); rl = np.exp(-1 / (r_s * SR))
    # vectorised in blocks of 10 ms for speed
    blk = int(0.01 * SR); xs = x[::blk]; ys = np.empty_like(xs)
    a = np.exp(-1 / (a_s * 100)); rl = np.exp(-1 / (r_s * 100))
    for i, xv in enumerate(xs):
        c = a if xv > v else rl; v = c * v + (1 - c) * xv; ys[i] = v
    return np.repeat(ys, blk)[:len(x)]
duck_env = smooth(hold, 0.08, 0.6)

# 2) SFX bus
cues = json.load(open(cues_p))['cues']
OFFS = {'marker_squeak_short': -3, 'marker_squeak_long': -4, 'marker_tap': 0, 'pop': -1, 'board_erase': -3, 'soft_whoosh': -3,
        'artillery_distant': 1, 'impact': 0, 'tension_riser': -1, 'typewriter': -3, 'paper_unfold': -3, 'tick_tock': -3,
        'reveal_ding': -3, 'counter_roll': -5, 'telegraph_morse': -3, 'radio_static': -6}
TARGET_RMS = -30.0   # dBFS on the active part of each effect
sfx = np.zeros((N, 2), np.float32); cache = {}
for c in cues:
    name = c['name']
    if name not in cache:
        a = read(os.path.join(lib, name + '.wav'))
        env = np.abs(a).max(1); thr = env.max() * 0.03
        idx = np.nonzero(env > thr)[0]; a = a[idx[0]: idx[-1] + int(0.05 * SR)]
        fade = min(len(a), int(0.04 * SR)); a[-fade:] *= np.linspace(1, 0, fade)[:, None]
        r = 20 * np.log10(np.sqrt(np.mean(a ** 2)) + 1e-9)
        cache[name] = a * 10 ** ((TARGET_RMS - r + OFFS.get(name, 0)) / 20)
    a = cache[name] * 10 ** (c.get('gain', 0) / 20)
    if name == 'marker_squeak_long': a = a[:int(1.2 * SR)]
    s = int(c['t'] * SR); e = min(N, s + len(a))
    if s < N: sfx[s:e] += a[:e - s]
# keep SFX a little lower while the voice is speaking so they never mask a word
sfx *= (1 - 0.3 * duck_env)[:, None]
write(os.path.join(out, 'sfx_bus.wav'), sfx)

# 3) music: level, ducking, fades
music = read(music_p)[:N]
if len(music) < N: music = np.pad(music, ((0, N - len(music)), (0, 0)))
mI, _ = loud(music_p)
MUSIC_BASE = -37.0
music *= 10 ** ((MUSIC_BASE - mI) / 20)
duck_db = -6.0 * duck_env                       # -6 dB under speech, back up in pauses
music *= (10 ** (duck_db / 20))[:, None]
fi = int(2 * SR); fo = int(4 * SR)
music[:fi] *= np.linspace(0, 1, fi)[:, None]; music[-fo:] *= np.linspace(1, 0, fo)[:, None]
write(os.path.join(out, 'music_bus.wav'), music)

mix = voice + sfx + music
pk = np.abs(mix).max()
if pk > 0.8: mix *= 0.8 / pk
write(os.path.join(out, 'mix.wav'), mix)
print('sfx bus', loud(os.path.join(out, 'sfx_bus.wav')))
print('music bus', loud(os.path.join(out, 'music_bus.wav')))
print('mix', loud(os.path.join(out, 'mix.wav')))
# music level measured only while the voice is active
act = duck_env > 0.9
def lufs_like(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12)
print('while speaking: voice RMS %.1f dB, music RMS %.1f dB, sfx RMS(active) %.1f dB' % (lufs_like(voice[act]), lufs_like(music[act]), lufs_like(sfx[np.abs(sfx).max(1) > 1e-3])))
