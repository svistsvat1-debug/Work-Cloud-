# WWII whiteboard video engine (Remotion)

Code-only marker-whiteboard animation for the faceless WWII channel. No AI images, no stock, no symbols of regimes.

## Pipeline (Phase B)
```bash
npm install                      # Remotion 4 + fonts (Permanent Marker, Caveat Brush — OFL)
pip install faster-whisper scipy mido numpy pillow && apt-get install -y fluidsynth fluid-soundfont-gm
python tools/sfx_prep.py         # WAVs from sfx-library/raw
python tools/prep_maps.py countries50.geojson src/data/maps.json   # Natural Earth (public domain), once
python tools/paper.py            # paper texture, once
# 1. word timings from the owner's voice (local whisper, CPU)
python tools/whisper_words.py    # -> words.json  (small.en, word_timestamps=True)
python tools/align.py words.json script_voice.txt script_scenes.md <duration> src/data/timing.json
python tools/captions.py src/data/timing.json captions.srt
# 2. storyboard = src/boards.js (every element keyed to a VO word) -> SFX cue sheet + pacing QA
node tools/export_cues.mjs src/data/timing.json src/data/maps.json out/cues.json
node tools/stills.mjs out/stills 12 40 ...      # QA stills
# 3. music (MIDI -> FluidSynth, FluidR3_GM MIT) and mix
python music/compose.py src/data/timing.json out/music.mid
fluidsynth -ni -q -g 0.6 -F out/music_raw.wav -r 48000 /usr/share/sounds/sf2/FluidR3_GM.sf2 out/music.mid
python tools/mix.py voice.mp3 out/cues.json out/music_raw.wav sfx-library out/
# 4. picture + one final encode
npx remotion render src/index.ts Main out/picture.mp4 --codec=h264 --crf=6 --muted
ffmpeg -i out/picture.mp4 -i out/mix.wav -map 0:v -map 1:a -c:v libx264 -profile:v high -level 4.2 -pix_fmt yuv420p -r 30 -crf 18 -preset slow -g 15 -bf 2 -c:a aac -b:a 320k -ar 48000 -ac 2 -movflags +faststart -tag:v avc1 video.mp4
node tools/thumb.mjs thumbnail.png
```

## Library
- `src/lib/draw.tsx` — draw-on ink, scribble fill, hand-lettered text with red underline, bursts, arrows, crosses, checks.
- `src/lib/icons.ts` — parametric icons (spade, boot, kitchen, gun, truck, tin, cup, capsule, triangle letter, house, map pieces…).
- `src/lib/people.tsx` — soldier / woman / mother / officer / German / volunteer, poses (stand, walk, sit, hold, lie), faces. No insignia.
- `src/lib/special.tsx` — maps, clock, pie, dugout, calendar, thermometer, tints, frost, smoke, trench, mover, thought bubble.
- Performance: no full-frame SVG filters (3x slower); the hand-drawn wobble is a static jitter on the path points.
