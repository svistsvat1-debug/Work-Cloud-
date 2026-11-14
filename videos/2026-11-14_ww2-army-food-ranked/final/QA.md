# QA — Every WW2 Army's Food Ranked (2026-11-14)

- [x] Length 8:03.2 (voice 7:59.7 + 3.5 s end card) — inside 6:00–10:00, just past 8:00
- [x] No burned-in subtitles, no watermark (captions only in captions.srt: 145 cues, ≤ 2 × 42 chars, 1.15–4.96 s)
- [x] No swastikas / Nazi symbols, no gore (Germany = steel helmet + labels; casualties = numbers, bar chart, empty helmets)
- [x] Hook ≤ 20 s, no greetings (question lands at 0:17)
- [x] #1 (USA) revealed only in the final block (6:06+)
- [x] No "and then" lists in the script
- [x] Thumbnail ≠ title, 3 objects, text "MADE TO TASTE BAD", code-drawn, bottom-right corner free
- [x] 0 AI-generated images; ElevenLabs not used at all (0 new SFX — library: pop, stamp, splash, flip)
- [x] No finished frame held > 6 s: frame-diff check (step 15 frames = boil period) — longest static stretch 5.1 s (at 1:53)
- [x] Style: white board, wobbly boiling 7 px lines, flat MS-Paint fills, stick figures with faces, pop-in text, hard cuts, slow push-in
- [x] Visuals hit their VO keywords: spot-checked "Starvation" 1:17, "sixty" 1:38, "million" 1:50, "goulash" 4:34, "fourteen" 5:18
- [x] New SFX ≤ 5 (0)
- [x] Music on: code-made, mood map neutral/tension/reveal/calm; owner asked for it louder → ≈ 20.5 dB under the voice after ducking (spec was 25–30)
- [x] ffprobe: 1920x1080, 30 fps, h264 High, yuv420p, AAC-LC 48 kHz stereo 320k, moov before mdat (faststart), 483.23 s
- [x] video.mp4 111.5 MB (≤ 400 MB), 1.63 Mbit/s video; PSNR avg 50.56 dB, SSIM All 0.99902 vs lossless PNG master
- [x] Mix: -14.1 LUFS integrated, true peak -2.9 dBFS; voice -14.0 LUFS
- [ ] [VERIFY] V3, V4, V6, V9, V14, V24 not confirmed with primary sources (soft wording in the script; see phase-a/verify.md)

Notes: timings from Kokoro's SRT + silence detection (faster-whisper models blocked by the network). Lossless master = PNG sequence
(ProRes 4444 would be ~20 GB). Two labels pop ~0.2–0.4 s late ("TASTE" 0:26, "OLD MAN" 2:26) — fixed in the timing file after render.
