# sfx_prep.py - new ElevenLabs sfx: decode, trim, fade, peak-normalise to -1 dBFS -> public/moai-hats/sfx/*.wav
# + copy the reused sfx-library files (all ElevenLabs sounds from earlier videos)
import subprocess, shutil, wave, numpy as np
SR = 44100
OUT = '../../public/moai-hats/sfx'
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
x = load('sfx_raw/buzzer.mp3'); save('buzzer', x[:int(0.56 * SR)], 0.002, 0.06)          # flat buzz 0-0.48 s
x = load('sfx_raw/stone_roll.mp3'); save('stone_roll', x[:int(1.9 * SR)], 0.01, 0.4)     # rumble 0-1.2 s, slows to a stop
x = load('sfx_raw/dirt_dump.mp3'); save('dirt_dump', x[:int(0.8 * SR)], 0.003, 0.2)      # pour peak 0.26 s
x = load('sfx_raw/hat_clonk.mp3'); save('hat_clonk', x[:int(0.9 * SR)], 0.002, 0.25)     # clonk peak 0.08 s
for f in ['beach_bed', 'stamp', 'twinkle', 'pop', 'rubber_stretch', 'crane', 'stone_step', 'dustplop', 'flop', 'magic', 'whoosh',
          'rope', 'rope_creak', 'sad_horn', 'crickets', 'boing', 'gulp']:
    try:
        shutil.copy(f'{LIB}/{f}.wav', f'{OUT}/{f}.wav'); print('reused', f)
    except FileNotFoundError:
        print('MISSING', f)
