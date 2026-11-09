# Cut the repeated lines + hallucinated tail out of take 1 and tighten long pauses.
# Chunks (orig timeline, s) come from the RMS scan (-42 dB, 20 ms hop). Gaps are cut in the middle so natural
# decays/onsets stay; 15 ms equal-power crossfade at every join.
import subprocess, numpy as np, json, sys, os
OUT = sys.argv[2]
SR = 44100
raw = subprocess.run(["ffmpeg","-v","error","-i",sys.argv[1],"-f","f32le","-ac","1","-ar",str(SR),"-"],capture_output=True,check=True).stdout
a = np.frombuffer(raw, np.float32).copy()
# (start, end, gap_after_s) ; gap = total silence kept between this chunk and the next
keep = [
 (0.00, 2.06, 0.34, "You died ten seconds ago."),
 (3.00, 3.22, 0.28, "Hi."),
 (3.74, 4.26, 0.40, "I'm God."),
 # 4.92-5.90 first "Heaven / Hell." (falling, duplicate) -> cut
 (6.68, 6.98, 0.26, "Heaven?"),
 (7.44, 7.72, 0.36, "Hell?"),
 (8.28, 8.44, 0.28, "Nope."),
 (8.98, 9.62, 0.36, "You're going back."),
 (10.16, 13.26, 0.42, "Over 100 billion people have ever lived."),
 # 13.86-15.92 first "Every single one of them? / was you." (question-like, duplicate) -> cut
 (16.56, 17.88, 0.34, "Every single one of them..."),
 (18.38, 18.80, 0.42, "was you."),
 (19.44, 20.28, 0.38, "Every killer."),
 (20.92, 21.92, 0.44, "And every victim."),
 (22.58, 22.90, 0.34, "Why?"),
 (23.54, 24.78, 0.40, "Because you haven't been born yet."),
 (25.44, 26.60, 0.30, "When you've been everyone..."),
 (27.14, 27.68, 0.40, "you'll hatch."),
 (28.28, 28.90, 0.42, "As a god."),
 (29.56, 31.18, 0.34, "Everything you've ever seen..."),
 (31.68, 33.24, 0.36, "is just the inside of your egg."),
 (33.84, 34.90, 0.00, "Subscribe to see more."),
 # 35.34-43.34 hallucinated "So bright, my life is a precious gift." + 3x "Subscribe to see more!" -> cut
]
PAD = 0.07   # keep a little of the silence on both sides of each chunk (soft onsets / tails)
XF = int(0.015 * SR)
out = np.zeros(0, np.float32); segs = []
t = 0.0
for i, (s, e, gap, txt) in enumerate(keep):
    s0 = max(0.0, s - PAD); e0 = e + PAD
    # distribute the requested gap: half from this chunk's tail, half from the next chunk's head
    tail = max(PAD, gap / 2) if i < len(keep) - 1 else 0.25
    head = PAD if i == 0 else max(PAD, keep[i-1][2] / 2)
    s0 = max(0.0, s - head); e0 = min(len(a)/SR, e + tail)
    piece = a[int(s0*SR):int(e0*SR)].copy()
    if len(out) and XF:
        fade = np.sqrt(np.linspace(0, 1, XF, dtype=np.float32))
        piece[:XF] *= fade
        out[-XF:] *= fade[::-1]
        out[-XF:] += piece[:XF]
        piece = piece[XF:]
    start_new = len(out)/SR + (s - s0) - (XF/SR if i else 0)
    segs.append({"text": txt, "orig": [s, e], "new": [round(start_new, 3), round(start_new + (e - s), 3)]})
    out = np.concatenate([out, piece])
# short fade-out at the very end
fo = int(0.06*SR); out[-fo:] *= np.linspace(1, 0, fo, dtype=np.float32)
open(os.path.join(OUT, "vo_edit.f32"), "wb").write(out.astype(np.float32).tobytes())
subprocess.run(["ffmpeg","-v","error","-y","-f","f32le","-ar",str(SR),"-ac","1","-i",os.path.join(OUT, "vo_edit.f32"),os.path.join(OUT, "vo_edit.wav")],check=True)
subprocess.run(["ffmpeg","-v","error","-y","-i",os.path.join(OUT, "vo_edit.wav"),"-codec:a","libmp3lame","-b:a","192k",os.path.join(OUT, "vo_edit.mp3")],check=True)
json.dump(segs, open(os.path.join(OUT, "segments_edit.json"),"w"), indent=1)
print("new duration:", round(len(out)/SR, 2), "s")
for sg in segs: print(sg["new"], sg["text"])
