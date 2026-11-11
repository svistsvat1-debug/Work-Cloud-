# video-engine — Marker Whiteboard WWII pipeline

Code-only visuals (Remotion + SVG), local/free timing and music, ElevenLabs only for SFX.

## Setup (fresh container)
```bash
cd video-engine
npm install
python3 tools/gen_textures.py          # paper + wobble textures -> public/ (not committed)
pip install faster-whisper mido pretty_midi pyloudnorm soundfile numpy scipy
apt-get install -y fluidsynth fluid-soundfont-gm   # FluidR3_GM = MIT licence
```

## Phase B, step by step (video dir = videos/<date>_<slug>)
| Step | Command | Output |
|---|---|---|
| Word timings (faster-whisper, CPU) | `python3 tools/transcribe_words.py work/voice.mp3 work/words.json small.en` | `work/words.json` |
| Align to script | `python3 tools/align_timeline.py <video_dir> <voice_sec> 3.5` | `work/timeline.json` (scene + word times) |
| Captions | `python3 tools/build_captions.py <video_dir> final/captions.srt` | 2 lines × 42 chars, 1–6 s |
| Music (test mode) | `python3 tools/compose_music.py work/timeline.json work/music` | 4 mood stems (MIDI → FluidSynth) |
| SFX library | `python3 tools/gen_sfx.py [id ...]` | `sfx-library/*.mp3` (skips existing) |
| Mix | `python3 tools/mix_audio.py <video_dir>` | voice −14 LUFS, SFX −15 dB, music −27 dB ducked |
| Render picture | `node render.mjs video <out.mp4>` | 1920×1080, 30 fps, H.264 CRF 18, yuv420p |
| Thumbnail | `node render.mjs thumb <out.png>` | 1280×720 |
| QA | `python3 tools/qa_video.py <video_dir>` | `work/qa_report.json` + spot-check frames |

Copy `work/timeline.json` to `src/videos/<slug>/timeline.json` before rendering.

## Library (`src/components/`)
- `draw.tsx` — Stroke (draw-on), Scribble (marker fill), Icon, Arrow, Burst, Pop/Fade/Move, palette `C`
- `text.tsx` — MText (letter-by-letter + underline sweep), Title, Label, Counter, BigText
- `figure.tsx` — Fig (stick soldier, poses), Crowd, Clock, Gauge, LevelBar, Pie, Balance, Puff (cartoon, no gore)
- `map.tsx` — WorldMap (Natural Earth 1:110m, outlines draw on, ink fills), Route, along()
- `icons.ts` — ~45 parametric icons (ration, rifle, tank, truck, Liberty ship, sub, plane, envelope, sack, film, hospital, ambulance, horse, Balkenkreuz…)
- `VideoFromTimeline.tsx` — scene sequencing, wipe/fade transitions, hand-drawn "boil" filter

Scenes use `useScene().k(word)` so every visual fires on the spoken keyword.

## Rules baked in
No swastikas or party symbols (Germany = Balkenkreuz / label only), no gore, no burned-in subtitles,
no AI images/video/stock. Max 5 new SFX per video (see `sfx-library/manifest.json`, `kind: new`).
