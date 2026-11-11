"""QA probe of the final master: codec/profile/level/pix_fmt/size/fps, audio, faststart (moov before mdat), duration."""
import json, struct, subprocess, sys
p = sys.argv[1]
info = json.loads(subprocess.run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", p], capture_output=True, text=True).stdout)
v = next(s for s in info["streams"] if s["codec_type"] == "video")
a = next(s for s in info["streams"] if s["codec_type"] == "audio")
order = []
with open(p, "rb") as f:
    while True:
        h = f.read(8)
        if len(h) < 8: break
        size, typ = struct.unpack(">I4s", h)
        if size == 1: size = struct.unpack(">Q", f.read(8))[0]; f.seek(size - 16, 1)
        else: f.seek(size - 8, 1)
        order.append(typ.decode())
        if size == 0: break
r = {
    "video": f"{v['codec_name']} {v.get('profile')} level {v.get('level')} {v['pix_fmt']} {v['width']}x{v['height']} {v['r_frame_rate']} tag {v.get('codec_tag_string')}",
    "audio": f"{a['codec_name']} {a.get('profile')} {a['sample_rate']} Hz {a['channels']} ch {int(a.get('bit_rate', 0)) // 1000} kbps",
    "duration_s": round(float(info["format"]["duration"]), 2),
    "size_MB": round(int(info["format"]["size"]) / 1e6, 1),
    "top_level_atoms": order,
    "faststart": order.index("moov") < order.index("mdat"),
}
print(json.dumps(r, indent=1))
