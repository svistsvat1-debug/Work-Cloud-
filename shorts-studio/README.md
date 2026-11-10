# shorts-studio

Remotion 4 project for vertical cut-out cartoon Shorts (1080×1920, 60 fps).

| Composition | Short |
|---|---|
| `MosquitoRain` | "Why Doesn't Rain Kill Mosquitoes?" (22.6 s) |

- `src/mosquito/` — scenes (`MosquitoRain.tsx`), timing table from word times (`timing.ts`), SFX cue list (`cues.ts`), sprite components (`art/Sprites.tsx` + `sprites.json`), backgrounds and effects drawn as SVG in code (`art/`).
- `public/mosquito/` — voice-over (ElevenLabs v4, Mark – Natural Conversations) and processed SFX (ElevenLabs SFX v2).
- `sfx_raw/` — SFX exactly as downloaded from ElevenLabs.
- `images/mosquito/raw/` — the source pictures (M1 from ElevenLabs GPT Image 2.5, the rest from ChatGPT, flat magenta background).
- `images/mosquito/prep_bg.py` — background plates BG1–BG5 -> `public/mosquito/bg/` + `src/mosquito/bg.json`; layered in `art/Backgrounds.tsx`.
- `images/mosquito/` — sprite cut-out/alignment (`prep_sprites.py` -> `public/mosquito/sprites/`, `src/mosquito/sprites.json`), word times (`words.json`), SFX slicing (`sfx_prep.py`, `sfx_cfg.json`), pop scan, thumbnail script.

```bash
npm install
npx remotion studio                         # preview at http://localhost:3000
node scripts/stills.mjs 0 3.1 11.9          # QA stills -> out/qa/
node scripts/render.mjs out/mosquito-raw-1080p.mp4 1 17
```

`remotion.config.ts` and the scripts use the container's pre-installed headless Chromium when it exists (or `REMOTION_BROWSER`); elsewhere Remotion downloads its own.
