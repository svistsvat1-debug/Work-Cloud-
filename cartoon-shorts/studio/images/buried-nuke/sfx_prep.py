# sfx_prep.py - new ElevenLabs sfx: decode, trim, fade, peak-normalise to -1 dBFS -> public/buried-nuke/sfx/*.wav
# + copy the reused sfx-library files (all ElevenLabs sounds from earlier videos)
import subprocess, shutil, wave, numpy as np
SR = 44100
OUT = '../../public/buried-nuke/sfx'
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
x = load('sfx_raw/plane_break.mp3'); save('plane_break', x[:int(1.6 * SR)], 0.004, 0.4)   # crack ~0.1-0.2, tear to 0.6, rumble fades
x = load('sfx_raw/bomb_fall.mp3'); save('bomb_fall', x[:int(1.2 * SR)], 0.01, 0.15)      # whistle, steady to ~1.0 s
x = load('sfx_raw/scribble.mp3'); save('scribble', x[:int(0.9 * SR)], 0.004, 0.05)        # strokes 0-0.6, flourish 0.8
for f in ['mud_whoomp', 'dig', 'bubbles', 'pour', 'kaching', 'cash', 'crickets', 'snore', 'pop', 'boing', 'whoosh', 'jet', 'flap', 'stone_step', 'sprout', 'drip']:
    shutil.copy(f'{LIB}/{f}.wav', f'{OUT}/{f}.wav'); print('reused', f)
