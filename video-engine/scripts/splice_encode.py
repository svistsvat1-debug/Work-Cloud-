"""Final encode with re-rendered patches spliced in (still ONE final encode, frame-exact).
usage: python3 splice_encode.py <parts_dir> <patches_dir> <mix.wav> <out.mp4> [gop] [crf]
gop/crf default to the spec (15 / 18); gop 60 (keyframe every 2 s) keeps the same CRF quality at ~half the size
(needed when the phone delivery limit is 400 MiB).
parts:   <parts_dir>/part_<startframe>.mp4   (the full render, in chunks)
patches: <patches_dir>/<name>_<startframe>.mp4 (short re-renders of fixed frame ranges)
Encode settings are identical to final_encode.sh."""
import glob, os, re, subprocess, sys

parts_dir, patches_dir, mix, out = sys.argv[1:5]
GOP = sys.argv[5] if len(sys.argv) > 5 else "15"
CRF = sys.argv[6] if len(sys.argv) > 6 else "18"

def nframes(p):
    r = subprocess.run(["ffprobe", "-v", "error", "-count_packets", "-select_streams", "v:0", "-show_entries", "stream=nb_read_packets", "-of", "csv=p=0", p], capture_output=True, text=True, check=True)
    return int(r.stdout.strip().strip(","))

def clips(pattern):
    res = []
    for p in glob.glob(pattern):
        m = re.search(r"_(\d+)\.mp4$", p)
        if m:
            res.append((int(m.group(1)), p, nframes(p)))
    return sorted(res)

parts = clips(os.path.join(parts_dir, "part_*.mp4"))
patches = clips(os.path.join(patches_dir, "*_*.mp4"))
total = parts[-1][0] + parts[-1][2]
for (a, _, n), (b, _, _) in zip(parts, parts[1:]):
    assert a + n == b, f"gap/overlap between parts at {a + n} vs {b}"

def source_at(f):
    for s, p, n in patches:
        if s <= f < s + n:
            return p, s, s + n
    for s, p, n in parts:
        if s <= f < s + n:
            # a part segment runs until the part ends or the next patch starts
            end = min([s + n] + [ps for ps, _, _ in patches if f < ps < s + n])
            return p, s, end
    raise ValueError(f)

segs, f = [], 0
while f < total:
    p, s, end = source_at(f)
    segs.append((p, f - s, end - s))  # file, local start, local end (exclusive)
    f = end

args, chains = [], []
for i, (p, a, b) in enumerate(segs):
    args += ["-i", p]
    chains.append(f"[{i}:v:0]trim=start_frame={a}:end_frame={b},setpts=PTS-STARTPTS[s{i}]")
k = len(segs)
fc = ";".join(chains) + ";" + "".join(f"[s{i}]" for i in range(k)) + f"concat=n={k}:v=1:a=0," \
     "scale=in_range=full:out_range=tv:in_color_matrix=bt601:out_color_matrix=bt709,format=yuv420p[v]"
for p, a, b in segs:
    print(f"{os.path.basename(p)} frames {a}-{b - 1}")
cmd = ["ffmpeg", "-hide_banner", "-y", *args, "-i", mix, "-filter_complex", fc, "-map", "[v]", "-map", f"{k}:a:0",
       "-c:v", "libx264", "-profile:v", "high", "-level", "4.2", "-pix_fmt", "yuv420p", "-r", "30", "-crf", CRF, "-preset", "slow", "-g", GOP, "-bf", "2",
       "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
       "-c:a", "aac", "-b:a", "320k", "-ar", "48000", "-ac", "2", "-movflags", "+faststart", "-tag:v", "avc1", out]
sys.exit(subprocess.run(cmd).returncode)
