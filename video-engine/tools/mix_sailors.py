"""Audio mix: voice -14 LUFS (TP <= -1.5), SFX ~16 dB under the voice, music under the voice with sidechain ducking.
usage: python3 mix_sailors.py <voice.mp3> <music.wav> <timing.json> <script_scenes.md> <sfx_dir> <outdir> [music_gap_db]
music_gap_db = how far the music bed sits under the voice before ducking (default 18; owner asked for the music a bit louder).
"""
import json, re, subprocess, sys, wave
import numpy as np

voice, music, tj, md, sfxdir, out = sys.argv[1:7]
GAP = float(sys.argv[7]) if len(sys.argv) > 7 else 18.0
SR = 48000
T = json.load(open(tj))
END = T['end']

def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode: print(r.stderr[-3000:]); raise SystemExit(1)
    return r.stderr

def lufs(path):
    e = run(['ffmpeg', '-hide_banner', '-i', path, '-af', 'ebur128=peak=true', '-f', 'null', '-'])
    i = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', e)[-1]); tp = float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS', e)[-1])
    return i, tp

# 1) voice: 48 kHz stereo, two-pass loudnorm to -14 LUFS / -1.5 dBTP, padded to the video length
e = run(['ffmpeg', '-hide_banner', '-i', voice, '-af', 'aresample=48000,loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'])
js = json.loads(e[e.rfind('{'):e.rfind('}') + 1])
ln = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={js['input_i']}:measured_TP={js['input_tp']}:"
      f"measured_LRA={js['input_lra']}:measured_thresh={js['input_thresh']}:offset={js['target_offset']}:linear=true")
run(['ffmpeg', '-y', '-hide_banner', '-i', voice, '-af', f'aresample=48000,{ln},aresample=48000,apad=whole_dur={END}', '-ac', '2', '-ar', '48000',
     '-c:a', 'pcm_s24le', f'{out}/voice_norm.wav'])
vi, vtp = lufs(f'{out}/voice_norm.wav')
if abs(vi + 14) > 0.2 and vtp + (-14 - vi) <= -1.2:  # loudnorm fell short: fix with a plain gain
    run(['ffmpeg', '-y', '-hide_banner', '-i', f'{out}/voice_norm.wav', '-af', f'volume={-14 - vi:.2f}dB', '-c:a', 'pcm_s24le', f'{out}/voice_norm2.wav'])
    run(['mv', f'{out}/voice_norm2.wav', f'{out}/voice_norm.wav'])
    vi, vtp = lufs(f'{out}/voice_norm.wav')
print('voice', vi, 'LUFS', vtp, 'dBTP')

# 2) SFX track from the SFX tags in script_scenes.md (beat start), each at ~16 dB under the voice
NAME = {}  # SFX tag = file name in the library
cues = []
scene = -1; beat = -1
for line in open(md):
    if line.startswith('[SCENE'): scene += 1; beat = -1
    if re.match(r'B\d+ VO:', line): beat += 1
    m = re.match(r'\s+SFX: (\w+)', line)
    if m: cues.append((scene, beat, NAME.get(m.group(1), m.group(1))))
sents = T['sentences']
n = int(END * SR)
sfx = np.zeros((n, 2))
def load(p):
    with wave.open(p) as w:
        sr, ch, sw = w.getframerate(), w.getnchannels(), w.getsampwidth()
        x = np.frombuffer(w.readframes(w.getnframes()), dtype={2: '<i2', 4: '<i4'}[sw]).astype(float) / (2 ** (8 * sw - 1))
    x = x.reshape(-1, ch).mean(1)
    if sr != SR: x = np.interp(np.arange(int(len(x) * SR / sr)) / SR, np.arange(len(x)) / sr, x)
    return x
target_rms = 10 ** ((vi - 16 - 0.7) / 20)
for sc, bt, name in cues:
    s_idx = T['scenes'][sc]['beats'][bt]
    t0 = max(T['scenes'][sc]['start'], sents[s_idx]['start'] - 0.02)
    x = load(f'{sfxdir}/{name}.wav')
    act = x[np.abs(x) > 0.02 * np.abs(x).max()]
    x = x * target_rms / (np.sqrt((act ** 2).mean()) + 1e-9)
    a = int(t0 * SR); b = min(n, a + len(x))
    sfx[a:b] += x[:b - a, None]
with wave.open(f'{out}/sfx.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(sfx, -1, 1) * 32767).astype('<i2').tobytes())
print('sfx cues', len(cues))

# 3) music: set its bed GAP dB under the voice, then duck it under speech (sidechain), small lift in pauses comes from release
mi, _ = lufs(music)
gain = (vi - GAP) - mi
fc = (f"[1:a]volume={gain:.2f}dB[m];[0:a]asplit=2[v][vk];"
      f"[m][vk]sidechaincompress=threshold=0.03:ratio=2:attack=80:release=900:makeup=1[md];"
      f"[v][md][2:a]amix=inputs=3:normalize=0:duration=first,alimiter=limit=0.84:level=false[out]")
run(['ffmpeg', '-y', '-hide_banner', '-i', f'{out}/voice_norm.wav', '-i', music, '-i', f'{out}/sfx.wav', '-filter_complex', fc,
     '-map', '[out]', '-ar', '48000', '-c:a', 'pcm_s24le', f'{out}/mix.wav'])
# stems for the level report
run(['ffmpeg', '-y', '-hide_banner', '-i', f'{out}/voice_norm.wav', '-i', music, '-filter_complex',
     f"[1:a]volume={gain:.2f}dB[m];[m][0:a]sidechaincompress=threshold=0.03:ratio=2:attack=80:release=900:makeup=1[out]",
     '-map', '[out]', '-c:a', 'pcm_s24le', f'{out}/music_ducked.wav'])
fi, ftp = lufs(f'{out}/mix.wav'); mdi, _ = lufs(f'{out}/music_ducked.wav'); si, _ = lufs(f'{out}/sfx.wav')
print(json.dumps({'voice_lufs': vi, 'voice_tp': vtp, 'music_bed_gap_db': GAP, 'music_ducked_lufs': mdi, 'music_under_voice_db': round(vi - mdi, 1),
                  'sfx_lufs': si, 'mix_lufs': fi, 'mix_tp': ftp}, indent=1))
