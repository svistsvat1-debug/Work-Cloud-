# sfx_prep.py - new ElevenLabs sfx: decode, trim, fade, peak-normalise to -1 dBFS -> public/sun-vanish/sfx/*.wav
# + copy the reused sfx-library files (all ElevenLabs sounds from earlier videos)
import subprocess, shutil, wave, numpy as np
SR = 44100
OUT = '../../public/sun-vanish/sfx'
LIB = '../../../sfx-library'
def load(p):
    return np.frombuffer(subprocess.run(['/usr/bin/ffmpeg', '-v', 'error', '-i', p, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout, np.float32).copy()
def save(name, x, fade_in=0.004, fade_out=0.03, norm=True):
    n0, n1 = int(fade_in * SR), int(fade_out * SR)
    if n0: x[:n0] *= np.linspace(0, 1, n0)
    if n1: x[-n1:] *= np.linspace(1, 0, n1)
    if norm: x = x / (np.abs(x).max() + 1e-9) * 10 ** (-1 / 20)
    with wave.open(f'{OUT}/{name}.wav', 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
    print(name, '%.2f s' % (len(x) / SR))
x = load('sfx_raw/sun_poof.mp3'); save('sun_poof', x[:int(0.75 * SR)], 0.002, 0.2)
x = load('sfx_raw/lights_out.mp3'); save('lights_out', x[int(0.08 * SR):], 0.002, 0.12)       # click now at ~0.03 s
x = load('sfx_raw/sling.mp3'); save('sling', x, 0.002, 0.1)                                     # swings 0.05-0.35, zoom 0.85-1.25
x = load('sfx_raw/chatter.mp3'); save('chatter', x[:int(0.9 * SR)], 0.004, 0.08)
x = load('sfx_raw/flop.mp3'); save('flop', x[:int(0.45 * SR)], 0.002, 0.08)
# beach bed: seamless 2.6 s loop -> build 6 s by chaining the loop (seamless), even it out a bit
x = load('sfx_raw/beach.mp3'); bed = np.concatenate([x, x, x])[: int(6.0 * SR)]
save('beach_bed', bed, 0.05, 0.6)
for f in ['crickets', 'ticks', 'whoosh', 'zoomaway', 'freeze', 'twinkle', 'pop', 'gulp', 'swoop', 'boing']:
    shutil.copy(f'{LIB}/{f}.wav', f'{OUT}/{f}.wav'); print('reused', f)
