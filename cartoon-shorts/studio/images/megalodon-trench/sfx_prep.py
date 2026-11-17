# sfx_prep.py - new ElevenLabs sfx: decode, trim, fade, peak-normalise to -1 dBFS -> public/megalodon-trench/sfx/*.wav
# + copy the reused sfx-library files (all ElevenLabs sounds from earlier videos)
import subprocess, shutil, wave, numpy as np
SR = 44100
OUT = '../../public/megalodon-trench/sfx'
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
x = load('sfx_raw/growl.mp3'); save('growl', x[:int(1.3 * SR)], 0.004, 0.25)      # loud 0.05-0.7 s, fades
x = load('sfx_raw/chomp.mp3'); save('chomp', x[:int(0.45 * SR)], 0.001, 0.12)     # snap at 0.011 s
x = load('sfx_raw/squeak.mp3'); save('squeak', x[:int(0.42 * SR)], 0.002, 0.08)   # squeak 0.05-0.3 s
x = load('sfx_raw/xray.mp3'); save('xray', x, 0.03, 0.04)                         # hum, beep at ~0.93 s
for f in ['whoosh', 'bubbles', 'crickets', 'zoomaway', 'mud_whoomp', 'gulp', 'sonar', 'boing', 'pop', 'hull_creak']:
    shutil.copy(f'{LIB}/{f}.wav', f'{OUT}/{f}.wav'); print('reused', f)
