# Shorts video project (Remotion)

Vertical cartoon Shorts: 1080x1920 composition, 60 fps, rendered at 2x = 2160x3840 (4K).
The method follows the `cutout-cartoon-shorts` skill; pictures come from Google Flow (Nano Banana) on a flat
light-blue background and are keyed here.

## "The Egg" (`TheEgg` composition)

Plan, beat sheet and prompts: `../docs/shorts/the-egg-video-plan.md`. Script: `../docs/shorts/the-egg-script.md`.

| Folder | What |
|---|---|
| `images/the-egg/src/` | the 16 pictures from Flow, as delivered (12/13 are off-model and not used) |
| `images/the-egg/vo/` | raw ElevenLabs take, the cut list (`edit_vo.py`), word times |
| `images/the-egg/sfx_src/` | ElevenLabs sound effects (splash, choir, gulp, crowd, ticks) |
| `images/the-egg/*.py` | asset pipeline (below) |
| `public/the-egg/` | what the video uses: voice, font, generated sprites / crowd strips / sfx |
| `src/egg/` | the animation (`TheEgg.tsx`), camera + sprite helpers (`lib.tsx`), code-drawn effects (`fx.tsx`) |

### Build from scratch

```bash
cd video
npm install
python3 -m pip install numpy opencv-python-headless pillow faster-whisper
python3 images/the-egg/prep_cutouts.py images/the-egg/src public/the-egg/sprites images/the-egg/qa   # key, split, upscale
python3 images/the-egg/build_data.py .                                                              # anchors, crowd strips, src/egg/*.ts
python3 images/the-egg/make_sfx.py images/the-egg/sfx_src public/the-egg/sfx                         # sound effects
npx remotion studio src/index.ts                                                                     # preview
node scripts/render.mjs out/the-egg-4K-raw.mp4 2 16                                                  # 4K render
scripts/finalize.sh out/the-egg-4K-raw.mp4 out/the-egg-4K.mp4                                        # -15 LUFS mix
```

`remotion.config.ts` points at a pre-installed headless Chromium because the cloud container cannot download one.
On a normal computer delete that line and render with `--gl=angle` for GPU speed.

Checks: `node scripts/stills.mjs <dir> 0.5 <t1> <t2> ...` + `python3 scripts/contact_sheet.py <dir> sheet.png`
(contact sheet), `python3 scripts/pop_scan.py out/preview.mp4 <cut times>` (frame-jump scan).
