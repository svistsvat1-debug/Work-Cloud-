# video-engine — WARBOARD whiteboard ("Marker Explainer") engine

Remotion (React + SVG), rendered with the pre-installed Chromium headless shell. All visuals are code.

## Layout
- `src/engine/shapes.ts` — shape helpers (P polygon, S smooth curve, R rounded rect, E ellipse, Arch) that carry bounding boxes; Part/Drawable types; palette `C`.
- `src/engine/core.tsx` — **Reveal** (outline draw-on → zigzag scribble-mask fill per region → details), **WriteOn** (letter-by-letter, red underline per word), **Label** (red arrow + handwriting), **Rays**, **NumberCard**.
- `src/engine/Timeline.tsx` — scene language (`title / obj / row / label / num / text / rays / uline`), cut placement in the pause between sentences, clamps every element to finish before its cut, hold check.
- `src/illustrations/lib.ts` — parametric drawables (people, sleepers, Tube cross-section, train, platform, clock, bunk, urn, crowd, shelters, maps pins, wreath, calendar...). Reuse; add only when needed.
- `src/videos/<slug>/scenes.ts` + `beats.json` — one entry per scene, one array per sentence.
- `audio/music.py` — code-composed underscore (pretty_midi) → FluidSynth + FluidR3_GM (MIT licence).
- `audio/mix.py` — voice to −14 LUFS (gain + limiter), SFX ~16 dB under the voice, music 25–30 dB under with sidechain ducking, final −14 LUFS.
- `sfx-library/` — reusable SFX (see index.md).

## Pipeline for a video
1. Phase A script → `phase-a/build_script.py` (source of truth for beats).
2. Voice → `faster-whisper small.en` word timestamps → `align.py` → `beats.json` → `make_srt.py` → `captions.srt`.
3. Write `src/videos/<slug>/scenes.ts`, run `npx esbuild src/check.ts --bundle --platform=node --outfile=out/check.js && node out/check.js` (beat counts, holds > 7 s, late elements, SFX event times).
4. Stills: `node scripts/stills.mjs <sec> ...`; full lossless master: `node scripts/render.mjs <framesDir>` (PNG sequence).
5. `python3 audio/music.py`, `fluidsynth ...`, `python3 audio/mix.py ...`, then one x264 encode from the PNG master (see docs/video/VIDEO_PROMPT_WHITEBOARD.md B6).

Render speed on 4 vCPU: ~3–4.5 frames/s (≈ 1 h for an 8-minute video).
