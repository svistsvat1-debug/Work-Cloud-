"""Normalise the ElevenLabs SFX: decode to 48k wav, peak-normalise to -1 dBFS, report onset/peak."""
import subprocess, json, numpy as np, wave
names = ['whoosh', 'thud', 'pop', 'click', 'wobble', 'snore', 'splash']
info = {}
for n in names:
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f'raw/sfx/{n}.mp3', '-ac', '1', '-ar', '48000', '-f', 's16le', '-'],
                         capture_output=True, check=True).stdout
    x = np.frombuffer(raw, np.int16).astype(np.float32) / 32768
    peak = np.abs(x).max()
    x = x / peak * 10 ** (-1 / 20)
    env = np.sqrt(np.convolve(x ** 2, np.ones(480) / 480, 'same'))
    on = int(np.argmax(env > env.max() * 0.1))
    pk = int(np.argmax(env))
    info[n] = {'dur': round(len(x) / 48000, 3), 'onset': round(on / 48000, 3), 'peak': round(pk / 48000, 3)}
    with wave.open(f'../../public/flamingo/sfx/{n}.wav', 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(48000)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
json.dump(info, open('sfx_info.json', 'w'), indent=1)
print(json.dumps(info, indent=0))
