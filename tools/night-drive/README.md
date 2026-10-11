# Night drive — procedural video renderer

Cinematic POV of a truck driving at night through rural Ohio in heavy rain, built entirely in code:
three.js scene (road, forest, towns, oncoming trucks) + volumetric fog + wet windshield with wipers + 35mm film look,
rendered frame by frame in headless Chromium and piped into FFmpeg.

## Run

```bash
npm install                       # three.js
Xvfb :99 -screen 0 1920x1080x24 & # Mesa llvmpipe via Xvfb is ~6x faster than SwiftShader
export DISPLAY=:99 LIBGL_ALWAYS_SOFTWARE=1

# stills for checking the look
node render.mjs --config ../../videos/night-drive-ohio/config.json --stills 300,3500 --outdir /tmp/stills
# full video, resumable (segments are kept in <dir>/parts)
node render_all.mjs --config ../../videos/night-drive-ohio/config.json --dir ../../videos/night-drive-ohio/render --workers 3
# ambience track (rain, diesel, wipers, passing trucks) matched to the config timeline
python3 audio.py ../../videos/night-drive-ohio/config.json ambience.wav
# final mux, optionally with a voice-over and burned-in subtitles
python3 finalize.py --video picture.mp4 --ambience ambience.wav [--voice voice.mp3 --srt subs.srt] --out final.mp4
```

## Config (`videos/night-drive-ohio/config.json`)

`duration` (s), `fps`, `speed` (m/s), `trucks` (times when an oncoming truck passes), `towns` (times the camera
is in the town centre), `exposure`, `fogSigma`, `mist`, `headlight`, `wiperPeriod`/`wiperStroke`, `renderScale`.
Every frame is a pure function of time + seed, so any frame range can be rendered independently.

## Layout

- `src/road.js` — road centreline (curvature + hills), flattened around towns
- `src/world.js` — lazy road chunks, terrain, forest (LOD), poles/signs, towns, trucks
- `src/materials.js`, `src/glsl.js` — shaders and the shared light model (low-beam pattern, wet GGX, retroreflection)
- `src/post.js` — volumetric fog, wet glass + wipers, bloom/halation, film grade and grain
- `src/rain.js` — falling rain streaks lit by the scene lights
- `render.mjs`, `render_all.mjs` — headless rendering; `profile.mjs` — per-pass timings
