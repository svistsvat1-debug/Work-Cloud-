"""QA for the final master: ffprobe spec, faststart (moov before mdat), loudness, duration vs voice.
usage: python tools/qa.py video.mp4 voice_duration"""
import json, subprocess, sys, struct, re
v, vdur = sys.argv[1], float(sys.argv[2])
p = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', v], capture_output=True, text=True).stdout)
vs = [s for s in p['streams'] if s['codec_type'] == 'video'][0]
a = [s for s in p['streams'] if s['codec_type'] == 'audio'][0]
def atoms(path):
    out = []
    with open(path, 'rb') as f:
        while True:
            h = f.read(8)
            if len(h) < 8: break
            size, typ = struct.unpack('>I4s', h)
            if size == 1: size = struct.unpack('>Q', f.read(8))[0]; f.seek(size - 16, 1)
            else: f.seek(size - 8, 1)
            out.append(typ.decode('latin1'))
            if size == 0: break
    return out
at = atoms(v)
r = subprocess.run(['ffmpeg', '-nostats', '-i', v, '-map', '0:a', '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
I = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', r)[-1]); tp = float(re.findall(r'Peak:\s+(-?[\d.]+) dBFS', r)[-1])
fps = eval(vs['r_frame_rate'])
dur = float(p['format']['duration'])
checks = [
    ('1920x1080', vs['width'] == 1920 and vs['height'] == 1080, f"{vs['width']}x{vs['height']}"),
    ('30 fps', abs(fps - 30) < 0.01, vs['r_frame_rate']),
    ('h264 High', vs['codec_name'] == 'h264' and vs.get('profile') == 'High', f"{vs['codec_name']} {vs.get('profile')} L{vs.get('level')}"),
    ('yuv420p', vs['pix_fmt'] == 'yuv420p', vs['pix_fmt']),
    ('avc1 tag', vs.get('codec_tag_string') == 'avc1', vs.get('codec_tag_string')),
    ('aac 48k stereo', a['codec_name'] == 'aac' and a['sample_rate'] == '48000' and a['channels'] == 2, f"{a['codec_name']} {a['sample_rate']} ch{a['channels']} {int(a.get('bit_rate', 0))//1000}k"),
    ('faststart (moov before mdat)', at.index('moov') < at.index('mdat'), ' '.join(at)),
    ('duration ~ voice', abs(dur - vdur) < 0.2, f'{dur:.2f}s vs voice {vdur:.2f}s'),
    ('8:00-15:00', 480 <= dur <= 900, f'{int(dur//60)}:{int(dur%60):02d}'),
    ('loudness ~ -14 LUFS', abs(I + 14) <= 1.0, f'{I} LUFS'),
    ('true peak <= -1 dBTP', tp <= -1.0, f'{tp} dBTP'),
]
for name, ok, val in checks: print(('[x]' if ok else '[ ]'), name, '-', val)
print('size', round(int(p['format']['size']) / 1e6, 1), 'MB')
