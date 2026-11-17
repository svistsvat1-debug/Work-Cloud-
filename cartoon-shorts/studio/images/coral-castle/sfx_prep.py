# sfx_prep.py - new ElevenLabs sfx: decode, trim, fade, peak-normalise to -1 dBFS -> public/coral-castle/sfx/*.wav
# + copy the reused sfx-library files (all ElevenLabs sounds from earlier videos)
import subprocess, shutil, wave, numpy as np
SR = 44100
OUT = '../../public/coral-castle/sfx'
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
x = load('sfx_raw/flashbulb.mp3'); save('flashbulb', x[int(0.12 * SR):int(0.62 * SR)], 0.003, 0.15)   # flash pop ~0.2 (now ~0.08)
x = load('sfx_raw/chain.mp3'); save('chain', x[:int(1.30 * SR)], 0.01, 0.12)                          # even rattle
x = load('sfx_raw/magic.mp3'); save('magic', x[:int(0.95 * SR)], 0.004, 0.3)
x = load('sfx_raw/gate_turn.mp3'); save('gate_turn', x[:int(1.45 * SR)], 0.01, 0.4)
x = load('sfx_raw/rust_jam.mp3'); save('rust_jam', x[:int(0.95 * SR)], 0.003, 0.15)
x = load('sfx_raw/crane.mp3'); save('crane', x[:int(1.45 * SR)], 0.02, 0.4)
for f in ['crickets', 'winch', 'grind', 'rock_crack', 'whoosh', 'pop', 'gulp', 'boing', 'stone_step', 'flip', 'zip', 'lever']:
    try:
        shutil.copy(f'{LIB}/{f}.wav', f'{OUT}/{f}.wav'); print('reused', f)
    except FileNotFoundError:
        print('MISSING', f)
