# sfx_prep.py - new ElevenLabs sfx: decode, trim, fade, peak-normalise to -1 dBFS -> public/shark-storm/sfx/*.wav
# + copy the reused sfx-library files (all ElevenLabs sounds from earlier videos)
import subprocess, shutil, wave, numpy as np
SR = 44100
OUT = '../../public/shark-storm/sfx'
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
x = load('sfx_raw/ping.mp3'); save('ping', x[:int(0.9 * SR)], 0.002, 0.25)          # blip at 0.0-0.05, echo tail
x = load('sfx_raw/storm.mp3'); save('storm', x, 0.02, 0.3)                            # rises to 0.4 s, roars to 1.5 s, fades
x = load('sfx_raw/needle.mp3'); save('needle', x[:int(0.8 * SR)], 0.004, 0.12)       # creak 0-0.45, clunk ~0.55
x = load('sfx_raw/dart.mp3'); save('dart', x[:int(0.6 * SR)], 0.002, 0.15)           # swish peak 0.06
x = load('sfx_raw/lick.mp3'); save('lick', x[:int(0.62 * SR)], 0.004, 0.06)          # slurp builds to ~0.45
for f in ['crickets', 'thunder', 'rain', 'wave_crash', 'gust', 'bubbles', 'gulp', 'pop', 'boing', 'flip', 'ticks', 'twinkle', 'zoomaway', 'beach_bed']:
    shutil.copy(f'{LIB}/{f}.wav', f'{OUT}/{f}.wav'); print('reused', f)
