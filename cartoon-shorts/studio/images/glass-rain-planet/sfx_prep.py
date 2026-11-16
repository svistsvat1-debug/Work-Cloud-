# sfx_prep.py - new ElevenLabs sfx: decode, trim, fade, peak-normalise to -1 dBFS -> public/glass-rain-planet/sfx/*.wav
# + copy the reused sfx-library files (all ElevenLabs sounds from earlier videos)
import subprocess, shutil, wave, numpy as np
SR = 44100
OUT = '../../public/glass-rain-planet/sfx'
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
# glass rain bed: a seamless loop -> keep as is (loop in code) but no fades (seamless)
x = load('sfx_raw/glass_rain.mp3'); save('glass_rain', x, 0, 0)
x = load('sfx_raw/glass_ping.mp3'); save('glass_ping', x[:int(0.6 * SR)], 0.002, 0.15)
x = load('sfx_raw/umbrella_flip.mp3'); save('umbrella_flip', x, 0.002, 0.08)
x = load('sfx_raw/sniff.mp3'); save('sniff', x[:int(0.95 * SR)], 0.01, 0.12)
for f in ['whoosh', 'swoop', 'zoomaway', 'gust', 'howl', 'stink', 'twinkle', 'clink', 'pop', 'can', 'gulp', 'stamp', 'boing']:
    shutil.copy(f'{LIB}/{f}.wav', f'{OUT}/{f}.wav'); print('reused', f)
