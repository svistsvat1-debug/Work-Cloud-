# video-engine — marker-whiteboard WWII videos (Remotion + SVG)

Pipeline for one video (Phase B):
1. `tools/align.py` — faster-whisper word timestamps -> script scenes -> `src/data/timeline.json`
2. `tools/captions.py` — captions.srt (≤2 lines, ≤42 chars, 1–6 s)
3. `src/scenes/*.tsx` — scenes; every element is triggered on a spoken word via `cue('word')`
4. `node scripts/render.mjs out.mp4` — picture only (muted, high-quality intermediate)
5. `tools/music.py` — code-composed underscore (mido + FluidSynth + FluidR3_GM, MIT) with mood map
6. `tools/mix.py` — voice -14 LUFS, music ~27 dB under with ducking, SFX ~16 dB under (`tools/sfx_cues.tsv`)
7. ffmpeg master in ONE encode (H.264 High 4.2, yuv420p, CRF 18, AAC 320k 48 kHz, faststart)
8. `tools/static_check.py` — automatic "no static frame > 6 s" check

Library: `src/components/` (primitives, people, props, maps, hud), `sfx-library/` (see index.md).
Fonts: Permanent Marker (Apache 2.0), Caveat Brush (OFL) in `public/fonts/`.
