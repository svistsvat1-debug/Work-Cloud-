# shorts-studio

Cut-out cartoon Shorts: AI pictures (transparent or on a flat #9BCFFD background) + Remotion 4 code for motion,
camera, physics, faces, effects and sound. One folder per Short:

- `images/<short>/` - source side: `raw/` (pictures as generated), `placeholder/` (stand-ins), `scripts/`, `words.json`,
  `points.json` (manual point fixes), `qa/` (sheets, stills - not in git)
- `public/<short>/` - only what the render needs: trimmed sprites, `vo/`, `sfx/`
- `src/<short>/` - composition, beat table (`timing.ts`), sound cues, generated `sprites.ts`

## Phages Short - commands

```bash
npm install
pip install opencv-python-headless faster-whisper pillow numpy
python3 images/phages/scripts/words.py public/phages/vo/take1.mp3 images/phages/words.json   # word times
python3 images/phages/scripts/placeholders.py   # stand-in pictures (only until the real ones exist)
python3 images/phages/scripts/prep.py           # key -> trim -> measure -> public/phages + src/phages/sprites.ts + qa/sheet.png
python3 images/phages/scripts/sfx.py            # synthesised sound effects
node images/phages/scripts/stills.mjs 0 3.5 9.5 17.8 28.65   # beat stills (qa/stills), then grid.py for a contact sheet
npx remotion render src/index.ts Phages out/phages-preview.mp4 --scale=0.5          # preview
npx remotion render src/index.ts Phages out/phages-4K.mp4 --scale=2 --crf=16        # final 2160x3840
python3 images/phages/scripts/check.py out/phages-4K.mp4                            # size / fps / frames / audio / pop scan
```

Real pictures: drop them in `images/phages/raw/` with the key in the file name (`01_guy_present.png`, `phage.jpg`...),
re-run `prep.py`, check `qa/sheet.png`, re-render. The browser is the preinstalled headless shell (`remotion.config.ts`).
Picture prompts: `../docs/shorts/phage-therapy-step2-flow-prompts.md`. Beat sheet: `../docs/shorts/phage-therapy-step2-beat-sheet.md`.
