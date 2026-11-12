"""QA checks on the final master. Usage: python3 tools/qa.py <video.mp4> [expected_seconds]"""
import json, subprocess, sys, struct
import numpy as np
p = sys.argv[1]
exp = float(sys.argv[2]) if len(sys.argv) > 2 else None
pr = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', p], capture_output=True, text=True).stdout)
v = [s for s in pr['streams'] if s['codec_type'] == 'video'][0]
a = [s for s in pr['streams'] if s['codec_type'] == 'audio'][0]
dur = float(pr['format']['duration'])
ok = lambda c: '✅' if c else '❌'
res = []
res.append((f"resolution {v['width']}x{v['height']}", v['width'] == 1920 and v['height'] == 1080))
res.append((f"fps {v['r_frame_rate']}", v['r_frame_rate'] == '30/1'))
res.append((f"video {v['codec_name']} {v.get('profile')} {v['pix_fmt']} tag {v.get('codec_tag_string')}", v['codec_name'] == 'h264' and v.get('profile') == 'High' and v['pix_fmt'] == 'yuv420p'))
res.append((f"audio {a['codec_name']} {a['sample_rate']} Hz {a['channels']} ch", a['codec_name'] == 'aac' and a['sample_rate'] == '48000' and a['channels'] == 2))
res.append((f"duration {dur/60:.2f} min ({dur:.1f}s)", 480 <= dur <= 900))
if exp:
    res.append((f"duration matches expected {exp:.1f}s (diff {dur-exp:+.2f}s)", abs(dur - exp) < 1.0))
# faststart: moov before mdat
with open(p, 'rb') as f:
    order = []
    while len(order) < 6:
        h = f.read(8)
        if len(h) < 8: break
        size, typ = struct.unpack('>I4s', h)
        order.append(typ.decode('latin1'))
        if size == 1:
            size = struct.unpack('>Q', f.read(8))[0]; f.seek(size - 16, 1)
        else:
            f.seek(size - 8, 1)
res.append((f"atoms {order} (moov before mdat = faststart)", 'moov' in order and 'mdat' in order and order.index('moov') < order.index('mdat')))
# loudness
r = subprocess.run(['ffmpeg', '-hide_banner', '-i', p, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
I = float(r.split('I:')[-1].split('LUFS')[0]); TP = float(r.split('Peak:')[-1].split('dBFS')[0])
res.append((f"loudness {I} LUFS, true peak {TP} dBTP", -15 <= I <= -13 and TP <= -1.0))
# frozen-frame check: every second must differ from 0.5 s later (grain removed by downscale + blur)
raw = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', p, '-vf', 'fps=2,scale=64:36,gblur=sigma=1', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], capture_output=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, 36, 64).astype(float)
diffs = [np.abs(fr[i] - fr[i + 1]).mean() for i in range(len(fr) - 1)]
still = [i / 2 for i, d in enumerate(diffs) if d < 0.05]
res.append((f"no frozen frames: min motion {min(diffs):.3f}, still spots {still[:10]}", len(still) == 0))
for name, c in res:
    print(ok(c), name)
import os
print(f"file size: {os.path.getsize(p)/1e6:.1f} MB")
