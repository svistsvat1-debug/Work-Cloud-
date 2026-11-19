# sfx_prep.py - new ElevenLabs sfx: decode, trim, fade, peak-normalise to -1 dBFS -> public/sunken-lunch/sfx/*.wav
# + copy the reused sfx-library files (all ElevenLabs sounds from earlier videos)
import subprocess, shutil, wave, numpy as np
SR = 44100
OUT = '../../public/sunken-lunch/sfx'
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
x = load('sfx_raw/cable_snap.mp3'); save('cable_snap', x[:int(0.6 * SR)], 0.001, 0.2)       # twang + crack at 0.00, gone by ~0.4 s
x = load('sfx_raw/fridge_open.mp3'); save('fridge_open', x[:int(0.95 * SR)], 0.002, 0.3)    # seal pop at 0.00, hum fades
x = load('sfx_raw/germ_frenzy.mp3'); save('germ_frenzy', x[:int(1.45 * SR)], 0.004, 0.15)   # busy chomps 0-1.4 s
x = load('sfx_raw/slowmo.mp3'); save('slowmo', x[:int(1.2 * SR)], 0.01, 0.35)               # steady wobble, bends down from ~0.9 s
x = load('sfx_raw/sub_surface.mp3'); save('sub_surface', x[:int(1.15 * SR)], 0.002, 0.35)   # splash peak 0.06 s, pour-off to ~0.7 s
for f in ['splash', 'bubbles', 'deep_bed', 'gulp', 'flip', 'ticks', 'twinkle', 'freeze', 'chatter', 'stink', 'squash_down', 'snore',
          'whoosh', 'pop', 'rope_creak', 'drip', 'winch', 'clank', 'magic', 'beach_bed', 'flop']:
    try:
        shutil.copy(f'{LIB}/{f}.wav', f'{OUT}/{f}.wav'); print('reused', f)
    except FileNotFoundError:
        print('MISSING', f)
