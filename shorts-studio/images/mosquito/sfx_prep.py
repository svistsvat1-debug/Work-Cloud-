"""Slice / normalise / loop the ElevenLabs SFX -> public/mosquito/sfx/*.wav (48 kHz mono, peak -1 dBFS)."""
import subprocess, numpy as np, wave, sys, json
SR = 48000
RAW = '../../sfx_raw/'
OUT = '../../public/mosquito/sfx/'

def load(p):
    raw = subprocess.run(["ffmpeg","-v","error","-i",p,"-f","f32le","-ac","1","-ar",str(SR),"-"],capture_output=True).stdout
    return np.frombuffer(raw, np.float32).copy()

def save(name, a, peak_db=-1.0):
    a = a - np.mean(a)
    pk = np.abs(a).max() + 1e-9
    a = a / pk * (10 ** (peak_db / 20))
    pcm = (np.clip(a, -1, 1) * 32767).astype(np.int16)
    with wave.open(OUT + name + '.wav', 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    print(f'{name}: {len(a)/SR:.2f}s')

def fade(a, fin=0.005, fout=0.03):
    a = a.copy(); i = int(fin*SR); o = int(fout*SR)
    if i: a[:i] *= np.linspace(0, 1, i)
    if o: a[-o:] *= np.linspace(1, 0, o)
    return a

def sl(a, t0, t1):
    return a[int(t0*SR):int(t1*SR)]

def loop(seg, total, xf=0.25):
    x = int(xf*SR); out = seg.copy()
    ramp = np.linspace(0, 1, x)
    while len(out) < total*SR:
        out = np.concatenate([out[:-x], out[-x:]*(1-ramp) + seg[:x]*ramp, seg[x:]])
    return out[:int(total*SR)]

cfg = json.load(open('sfx_cfg.json'))
for name, c in cfg.items():
    try:
        a = load(RAW + c['src'])
    except Exception as e:
        print('skip', name, e); continue
    if len(a) == 0:
        print('skip', name); continue
    s = sl(a, c.get('t0', 0), c.get('t1', len(a)/SR))
    if c.get('loop'):
        s = loop(fade(s, 0.0, 0.0), c['loop'])
        s = fade(s, 0.3, 0.3)
    else:
        s = fade(s, c.get('fin', 0.004), c.get('fout', 0.05))
    save(name, s)
