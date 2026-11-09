"""Render a storyboard to MP4 (1080p30) and mux the voice-over.

usage: python render.py EPISODE_MODULE --srt voice.srt --audio voice.mp3 --geo countries.geojson
                        --sprites DIR --out out.mp4 [--workers 4] [--from SEC --to SEC] [--stills DIR]
"""
import argparse
import importlib
import math
import multiprocessing as mp
import os
import subprocess
import sys
import time

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(HERE, "episodes"))

import wb  # noqa: E402

SCENES = None
PAPER = None
XFADE = 0.3


def audio_duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                         capture_output=True, text=True).stdout
    return float(out.strip())


def render_chunk(args):
    idx_from, idx_to, f0, f1, seg_path = args
    fps = wb.FPS
    enc = subprocess.Popen(
        ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{wb.W}x{wb.H}", "-r", str(fps),
         "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p",
         "-tune", "animation", seg_path], stdin=subprocess.PIPE)
    prev_final = None
    if idx_from > 0:
        prev_final = wb.SceneRenderer(SCENES[idx_from - 1], PAPER).final()
    si = idx_from
    R = wb.SceneRenderer(SCENES[si], PAPER)
    t_start = time.time()
    for f in range(f0, f1):
        t = f / fps
        while si < idx_to - 1 and t >= SCENES[si].t1:
            prev_final = R.final()
            si += 1
            R = wb.SceneRenderer(SCENES[si], PAPER)
        fr = R.frame(t)
        dt = t - SCENES[si].t0
        if prev_final is not None and dt < XFADE:
            k = dt / XFADE
            k = k * k * (3 - 2 * k)
            fr = prev_final * (1 - k) + fr * k
        enc.stdin.write(np.clip(fr, 0, 255).astype(np.uint8).tobytes())
    enc.stdin.close()
    enc.wait()
    return seg_path, f1 - f0, time.time() - t_start


def main():
    global SCENES, PAPER
    ap = argparse.ArgumentParser()
    ap.add_argument("episode")
    ap.add_argument("--srt", required=True)
    ap.add_argument("--audio", required=True)
    ap.add_argument("--geo", required=True)
    ap.add_argument("--sprites", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--workers", type=int, default=4)
    ap.add_argument("--stills", default=None, help="only write a PNG at the middle/end of each scene")
    ap.add_argument("--start", type=float, default=None)
    ap.add_argument("--end", type=float, default=None)
    a = ap.parse_args()

    os.environ["WB_SPRITES"] = a.sprites
    import kit
    kit.SPRITES = a.sprites
    ep = importlib.import_module(a.episode)
    dur = audio_duration(a.audio)
    t = time.time()
    SCENES = ep.build(a.srt, a.geo, dur)
    PAPER = wb.paper_background()
    print(f"{len(SCENES)} scenes built in {time.time() - t:.0f}s; audio {dur:.1f}s", flush=True)

    if a.stills:
        import cv2
        os.makedirs(a.stills, exist_ok=True)
        for i, sc in enumerate(SCENES):
            if a.start is not None and sc.t1 < a.start:
                continue
            if a.end is not None and sc.t0 > a.end:
                continue
            R = wb.SceneRenderer(sc, PAPER)
            for tag, tt in (("mid", (sc.t0 + sc.t1) / 2), ("end", sc.t1 - 0.05)):
                fr = R.frame(tt) if tag == "mid" else R.final()
                cv2.imwrite(os.path.join(a.stills, f"s{i:02d}_{tag}.jpg"),
                            cv2.cvtColor(np.clip(fr, 0, 255).astype(np.uint8), cv2.COLOR_RGB2BGR),
                            [cv2.IMWRITE_JPEG_QUALITY, 85])
        print("stills written", flush=True)
        return

    fps = wb.FPS
    total = int(math.ceil(dur * fps))
    f_lo = int((a.start or 0) * fps)
    f_hi = int(a.end * fps) if a.end else total
    # balance chunks by frame count, cut at scene boundaries
    bounds = [int(round(sc.t0 * fps)) for sc in SCENES] + [total]
    want = (f_hi - f_lo) / a.workers
    jobs, cur_start_scene, acc_start = [], None, None
    tmpdir = os.path.splitext(a.out)[0] + "_segs"
    os.makedirs(tmpdir, exist_ok=True)
    for i, sc in enumerate(SCENES):
        s0, s1 = max(bounds[i], f_lo), min(bounds[i + 1], f_hi)
        if s1 <= s0:
            continue
        if cur_start_scene is None:
            cur_start_scene, acc_start = i, s0
        if s1 - acc_start >= want or i == len(SCENES) - 1 or bounds[i + 1] >= f_hi:
            jobs.append((cur_start_scene, i + 1, acc_start, s1, os.path.join(tmpdir, f"seg{len(jobs):02d}.mp4")))
            cur_start_scene = None
    print(f"{len(jobs)} chunks, {f_hi - f_lo} frames", flush=True)
    ctx = mp.get_context("fork")
    t = time.time()
    with ctx.Pool(a.workers) as pool:
        for seg, n, sec in pool.imap_unordered(render_chunk, jobs):
            print(f"  {os.path.basename(seg)}: {n} frames in {sec:.0f}s", flush=True)
    print(f"rendered in {time.time() - t:.0f}s", flush=True)
    lst = os.path.join(tmpdir, "list.txt")
    with open(lst, "w") as fh:
        for j in jobs:
            fh.write(f"file '{os.path.abspath(j[4])}'\n")
    video = os.path.join(tmpdir, "video.mp4")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", video],
                   check=True)
    ss = ["-ss", str(f_lo / fps)] if f_lo else []
    tt = ["-t", str((f_hi - f_lo) / fps)]
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", video, *ss, *tt, "-i", a.audio, "-map", "0:v", "-map", "1:a",
                    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", a.out],
                   check=True)
    print("done", a.out, flush=True)


if __name__ == "__main__":
    main()
