# sfx_prep.py - new ElevenLabs sfx: decode, trim, fade, peak-normalise to -1 dBFS -> public/sunken-lunch/sfx/*.wav
# + copy the reused sfx-library files (all ElevenLabs sounds from earlier videos)
import subprocess, shutil, wave, numpy as np
SR = 44100
OUT = '../../public/sunken-lunch/sfx'
LIB = '../../../sfx-library'
def load(p):
    return np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True).stdout, np.float32).copy()
def save(name, x, fade_in=0.004, fade_out=0.03, dest=OUT):
    n0, n1 = int(fade_in * SR), int(fade_out * SR)
    if n0: x[:n0] *= np.linspace(0, 1, n0)
    if n1: x[-n1:] *= np.linspace(1, 0, n1)
    x = x / (np.abs(x).max() + 1e-9) * 10 ** (-1 / 20)
    with wave.open(f'{dest}/{name}.wav', 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
    print(name, '%.2f s' % (len(x) / SR))
x = load('sfx_raw/cable_snap.mp3'); save('cable_snap', x[:int(1.0 * SR)], 0.004, 0.25)     # twang 0-0.4, CRACK peak 0.43 s
x = load('sfx_raw/sub_splash.mp3'); save('sub_splash', x[:int(1.4 * SR)], 0.002, 0.4)     # whoomp at 0.03 s, spray to ~1.1 s
x = load('sfx_raw/fridge_open.mp3'); save('fridge_open', x[:int(0.9 * SR)], 0.004, 0.3)   # seal pop 0.11 s + rattle + hum
x = load('sfx_raw/germ_feast.mp3'); save('germ_feast', x[:int(1.45 * SR)], 0.004, 0.15)   # frantic chomps 0-1.4 s
x = load('sfx_raw/fish_flop.mp3'); save('fish_flop', x[:int(0.6 * SR)], 0.001, 0.2)       # wet slap 0.01 s
REUSE = ['splash', 'bubbles', 'whoosh', 'flip', 'ticks', 'winch', 'pour', 'twinkle', 'chatter', 'freeze', 'pop', 'squeak', 'munch',
         'hull_creak', 'squash_down', 'snore', 'rope_creak', 'deep_bed', 'beach_bed', 'mud_whoomp', 'dart', 'gulp', 'scribble', 'hum',
         'chain', 'zoomaway', 'boing', 'stamp']
for f in REUSE:
    try:
        shutil.copy(f'{LIB}/{f}.wav', f'{OUT}/{f}.wav'); print('reused', f)
    except FileNotFoundError:
        print('MISSING', f)
