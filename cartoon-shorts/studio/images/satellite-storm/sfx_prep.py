# sfx_prep.py - new ElevenLabs sfx: decode, trim, fade, peak-normalise to -1 dBFS -> public/satellite-storm/sfx/*.wav
# + copy the reused sfx-library files (all ElevenLabs sounds from earlier videos)
import subprocess, shutil, wave, numpy as np
SR = 44100
OUT = '../../public/satellite-storm/sfx'
LIB = '../../../sfx-library'
def load(p):
    return np.frombuffer(subprocess.run(['/usr/bin/ffmpeg', '-v', 'error', '-i', p, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout, np.float32).copy()
def save(name, x, fade_in=0.004, fade_out=0.03):
    n0, n1 = int(fade_in * SR), int(fade_out * SR)
    if n0: x[:n0] *= np.linspace(0, 1, n0)
    if n1: x[-n1:] *= np.linspace(1, 0, n1)
    x = x / (np.abs(x).max() + 1e-9) * 10 ** (-1 / 20)
    with wave.open(f'{OUT}/{name}.wav', 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
    print(name, '%.2f s' % (len(x) / SR))
x = load('sfx_raw/sneeze.mp3'); save('sneeze', x[:int(1.36 * SR)], 0.004, 0.12)      # inhale 0.05-0.45, 'choo' 0.65-1.3
x = load('sfx_raw/puffup.mp3'); save('puffup', x[:int(1.32 * SR)], 0.01, 0.1)        # creaks, bloop ~1.2 s
x = load('sfx_raw/button.mp3'); save('button', x[int(0.03 * SR):int(0.45 * SR)], 0.002, 0.08)  # click 0.08, beep to 0.35
x = load('sfx_raw/streak.mp3'); save('streak', x[:int(1.3 * SR)], 0.01, 0.3)         # whoosh peak 0.37 s
x = load('sfx_raw/chirps.mp3'); save('chirps', x[:int(0.72 * SR)], 0.003, 0.08)      # chirps 0.0-0.6
for f in ['pop', 'whoosh', 'swoop', 'gust', 'flip', 'sad_horn', 'twinkle', 'stamp', 'sizzle', 'zoomaway', 'gulp']:
    shutil.copy(f'{LIB}/{f}.wav', f'{OUT}/{f}.wav'); print('reused', f)
