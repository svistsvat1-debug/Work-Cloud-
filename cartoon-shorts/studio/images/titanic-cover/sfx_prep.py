# sfx_prep.py - new ElevenLabs sfx: decode, trim, fade, peak-normalise to -1 dBFS -> public/titanic-cover/sfx/*.wav
# + copy the reused sfx-library files (all ElevenLabs sounds from earlier videos)
import subprocess, shutil, wave, numpy as np
SR = 44100
OUT = '../../public/titanic-cover/sfx'
LIB = '../../../sfx-library'
def load(p):
    return np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout, np.float32).copy()
def save(name, x, fade_in=0.004, fade_out=0.03):
    n0, n1 = int(fade_in * SR), int(fade_out * SR)
    if n0: x[:n0] *= np.linspace(0, 1, n0)
    if n1: x[-n1:] *= np.linspace(1, 0, n1)
    x = x / (np.abs(x).max() + 1e-9) * 10 ** (-1 / 20)
    with wave.open(f'{OUT}/{name}.wav', 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
    print(name, '%.2f s' % (len(x) / SR))
x = load('sfx_raw/deep_bed.mp3'); save('deep_bed', x, 0.02, 0.02)                         # seamless loop bed
x = load('sfx_raw/alert.mp3'); save('alert', x[:int(0.62 * SR)], 0.002, 0.08)             # three beeps 0-0.5 s
x = load('sfx_raw/book_slam.mp3'); save('book_slam', x[int(0.04 * SR):], 0.002, 0.1)       # thump at ~0.02 s
x = load('sfx_raw/debris_land.mp3'); save('debris_land', x[:int(1.0 * SR)], 0.003, 0.25)
for f in ['stamp', 'whistle', 'flashbulb', 'camera', 'winch', 'splash', 'bubbles', 'hull_creak', 'flip', 'gulp', 'sonar', 'ping',
          'snore', 'button', 'chirps', 'twinkle', 'magic', 'whoosh', 'pop', 'boing', 'mud_whoomp', 'ticks']:
    try:
        shutil.copy(f'{LIB}/{f}.wav', f'{OUT}/{f}.wav'); print('reused', f)
    except FileNotFoundError:
        print('MISSING', f)
