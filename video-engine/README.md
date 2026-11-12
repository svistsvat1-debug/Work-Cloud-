# video-engine — Marker Whiteboard (WWII channel)

Code-only visuals: Remotion (React + SVG) rendered with the pre-installed Chromium headless shell.
No AI images, no stock footage, no photos.

## Layout
- `components/` — reusable, parametric library: hand-drawn geometry (`rough.ts`), draw-on/scribble fill (`draw.tsx`),
  write-on text (`text.tsx`), icons (`icons.ts`: helmet, medal, baby, tent, truck, ship, doc, calendar...), stick-figure
  soldier `GI.tsx` (moods, variants: hero/father/kid/officer/wife/child), `Ship.tsx` (cargo/liner/carrier/warship),
  `GeoMap.tsx` (real country outlines from world-atlas, draw-on, ink fills, routes, arrows), `fx.tsx` (burst, arrow,
  counter, calendar, stamp, card, crowd, tents, clock, quote...), `Board.tsx` (board timeline, wipe/slide transitions, camera drift).
- `components/types.ts` — element descriptors; every visual cue is anchored to a voice-over word (`k.w(scene, 'word')`).
- `src/videos/<video>/` — `timing.json` (from the voice file), `boards.ts` (the visuals), `Thumbnail.tsx`.
- `audio/music.py` — code-composed underscore (4 mood stems, FluidSynth + FluidR3_GM, MIT).
- `audio/mix.py` — voice + mood crossfades + ducking + SFX placement (snapped into word gaps).
- `sfx-library/` — reusable SFX (index.md lists prompts). WAVs are not in git (repo rule: no binaries).
- `tools/cues.ts` — validates all word anchors, exports SFX cues and the visual event timeline (static-frame QA).

## Pipeline (per video)
1. faster-whisper word timestamps + Kokoro SRT chunk bounds -> `timing.json` + `captions.srt`.
2. Write `boards.ts`; `npx tsc --noEmit`; render stills (`node scripts/stills.mjs`) and check them.
3. `node scripts/render.mjs Points85 part.mp4 <from> <to>` (near-lossless chunks, muted), concat with `-c copy`.
4. `python3 audio/music.py`, ffmpeg loudnorm on the voice, `python3 audio/mix.py`, loudnorm on the mix.
5. One final ffmpeg encode: H.264 High 4.2, yuv420p, CRF 18, AAC 320k 48 kHz, +faststart.

Env: `CHROME=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell`.
Fonts: Permanent Marker, Caveat Brush (SIL OFL, copied from @fontsource into `public/fonts`).
After a fresh clone: `npm install && python3 scripts/setup_assets.py` (paper texture + fonts are not in git).
SFX WAVs are not in git either: regenerate from the prompts in `sfx-library/index.md` (ElevenLabs) if the folder is empty.
