# sfx_prep.py - new ElevenLabs sfx: decode, trim, fade, peak-normalise to -1 dBFS -> public/deep-dive/sfx/*.wav
# + copy the reused sfx-library files (all ElevenLabs sounds from earlier videos)
import subprocess, shutil, wave, numpy as np
SR = 44100
OUT = '../../public/deep-dive/sfx'
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
save('bang_crack', load('sfx_raw/bang_crack.mp3'), 0.002, 0.15)    # bang peak 0.08 s, crackle + ring decays to ~1.2 s
save('creak', load('sfx_raw/creak.mp3'), 0.05, 0.2)                 # groan swells 0.25-0.75 s
save('mud_whoomp', load('sfx_raw/mud_whoomp.mp3'), 0.002, 0.3)     # thump ~0.2 s, cloud whoosh to ~0.7 s
x = load('sfx_raw/camera.mp3'); save('camera', x[:int(1.0 * SR)], 0.002, 0.1)   # click ~0.05 s, whirr 0.35-0.75 s
save('sonar', load('sfx_raw/sonar.mp3'), 0.002, 0.2)                # ping at 0.0 s + echo tail
for f in ['bubbles', 'squeeze', 'gulp', 'ticks', 'crickets', 'pop', 'whoosh', 'boing', 'crack']:
    shutil.copy(f'{LIB}/{f}.wav', f'{OUT}/{f}.wav'); print('reused', f)
