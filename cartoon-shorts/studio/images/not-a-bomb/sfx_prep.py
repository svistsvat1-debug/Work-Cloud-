# sfx_prep.py - new ElevenLabs sfx -> trimmed, faded, peak -1 dBFS mono WAVs in public/not-a-bomb/sfx; copy the reused library files
import subprocess, numpy as np, wave, shutil, os
OUT = '../../public/not-a-bomb/sfx'; LIB = '../../../sfx-library'
os.makedirs(OUT, exist_ok=True)
SR = 44100
def dec(p):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)
def save(name, x):
    x = x / (np.abs(x).max() + 1e-9) * 10 ** (-1 / 20)
    w = wave.open(f'{OUT}/{name}.wav', 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes()); w.close()
def fade(x, a=0.004, r=0.08):
    na, nr = int(a * SR), int(r * SR); x = x.copy()
    x[:na] *= np.linspace(0, 1, na); x[-nr:] *= np.linspace(1, 0, nr) ** 2; return x
NEW = {'chute_flutter': (0.0, 1.30), 'press_frenzy': (0.0, 1.20), 'boot_squelch': (0.0, 0.95), 'lamp_on': (0.0, 0.75), 'water_rush': (0.0, 1.45)}
for n, (a, b) in NEW.items():
    x = dec(f'sfx_raw/{n}.mp3'); x = x[int(a * SR):int(b * SR)]; save(n, fade(x))
REUSE = ['beach_bed', 'pop', 'whoosh', 'gulp', 'sub_splash', 'splash', 'horns', 'horn', 'flashbulb', 'flip', 'sad_horn', 'crickets', 'deep_bed', 'sonar',
         'bubbles', 'ticks', 'winch', 'creak', 'twinkle', 'zoomaway', 'squeak', 'dizzy', 'stamp', 'boing']
for n in REUSE:
    shutil.copy(f'{LIB}/{n}.wav', f'{OUT}/{n}.wav')
print(sorted(os.listdir(OUT)))
