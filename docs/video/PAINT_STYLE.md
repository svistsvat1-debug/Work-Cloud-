# "Paint Explainer"-inspired style — TEST (2026-11-14, status: APPROVED by the owner 2026-11-14 — channel style; visuals and thumbnail by code only)

Goal: test replacing the whiteboard "Marker Explainer" style with a style inspired by @ThePaintExplainer
(take the style only, never their characters, images or compositions).
YouTube was blocked from the server (proxy 403), so the style below is built from public descriptions of the channel
(MS-Paint-like hand-drawn explainers, stick figures, "every X explained" list format) — calibrate with 3–4 screenshots of their frames.

## Look (all made by code, 0 credits)
- Board: pure white #FFFFFF. No texture.
- Lines: black, 7 px at 1080p, mouse-drawn wobble (jitter ~2 px), round caps. Lines "boil" (redrawn) every 5 frames.
- Fills: flat "paint bucket" colours from the real MS Paint palette (red #ED1C24, blue #00A2E8, green #22B14C, yellow #FFF200,
  orange #FF7F27, grey #7F7F7F, light grey #C3C3C3, brown #B97A57, light blue #99D9EA, tan #EFE4B0). No gradients, no shading.
- Characters: stick figures with a round white head, big expressive faces (panic / grin / worry), sweat drops, props (cap, glasses, beard).
- Text: Paint "text tool" feel — Patrick Hand for labels/headers, Bangers for the big item title; words pop in whole.
- Motion: outline draws on fast (0.15–0.3 s), then the fill pops in at once (bucket click); objects pop with a small overshoot.
  Very slow push-in per scene (1.0 -> 1.035), HARD CUTS between scenes.
- Format: list item header top-left ("#1 PROJECT HABAKKUK") on every scene of the item.
- Engine: video-engine/src/paint/ (wobble.ts, Paint.tsx = PShape/PLine/PText/Pop, Stick.tsx), scene: video-engine/src/Habakkuk.tsx.

## Cost if the visuals were ElevenLabs images instead of code (estimate, not run)
Measured prices from our own ElevenLabs ledgers (cartoon-shorts/studio/images/*/credits.md):
- gpt-image-2.5-sunburst 1K LOW = 46.95 credits / image; 1K MEDIUM = 80.6 credits / image.
- Sound effects ≈ 3.33 credits per second (1 s = 3.33, 1.5 s = 5.0, 2 s ≈ 6.7).
Assumption: one new picture every 4–6 s (Paint-Explainer pacing) [VERIFY on their videos].

| Video | Pictures | LOW pictures | +10 % redos |
|---|---|---|---|
| 8 min, 1 / 6 s | 80 | 3,756 | ~4,130 |
| 9 min, 1 / 5 s (base) | 108 | 5,071 | ~5,580 |
| 10 min, 1 / 4 s | 150 | 7,043 | ~7,750 |

Plus: thumbnail 1 x MEDIUM = ~81; SFX: base library once 15 x ~1.5 s ≈ 75, then <= 5 new per video ≈ 25; music = 0 (code).
Total per 8–10 min video ≈ 4,200–7,900 credits (base case ≈ 5,700). Money = credits x (plan price / plan credits) [VERIFY plan].

## First full video in this style — "Every WW2 Army's Food Ranked" (2026-11-14)
Code: `video-engine/src/FoodVideo.tsx` + `src/food/` (core.tsx = timing helpers + Board; scenesA/B/C.tsx = 76 scenes).
Reusable kit: `video-engine/src/paint/Kit.tsx` — G/Sh/Tx (scale-aware 7 px lines), PopAt, Circle, Under, Arrow, Label, Check, XMark, Hit,
Soldier (hats: us/jp/it/ru/de/uk/officer/sailor/afrika; faces: panic/grin/worry/serious/sad/disgust/smirk/shock/suspicious; face changes on cue via `faceAt`),
food (Plate, Bowl, Sack, Fish, Plum, Packet, Can, Biscuit, Loaf, Crusts, Glass, Bottle, Crate, Mug, ChocBar, Potato, Cone, Turkey, Box, Cig, Jar),
props (MoneyBag, Factory, Helmet, Calendar, Clock, Paper, Padlock, Bars, Kettle, Tooth, Donkey, OldMan, Horse),
vehicles (Truck, CargoShip, Sub, Barge, Tug, FieldKitchen), scenery (Palm, Snow, Sea, Ground, Island, Blob), BarChart, TitleCard, along().

Pipeline (all free, local):
1. `tools/build_timing.py` — Kokoro SRT + ffmpeg silencedetect → sentence/word timings (`src/food-timing.json`). Sentence ends = start of the pause before the next sentence; scene cuts in the middle of that pause. (faster-whisper models were blocked by the network; Kokoro's own SRT is exact for its own audio.)
2. Scenes use `b(i)` (beat start), `w(i,'word')` (word start) → names/numbers pop on their word.
3. `tools/frames.mjs` — contact-sheet stills (1 per scene) before the full render: catches clipped text in 1 minute.
4. `tools/render_frames.mjs` — lossless master as a PNG sequence (ProRes 4444 for 8 min ≈ 20 GB; PNG ≈ 10x smaller, same pixels).
5. `tools/music_food.py` — mood-mapped underscore (neutral/tension/reveal/calm from MUSIC MOOD tags), 2 s crossfades. Use O(n) smoothing, never np.convolve with a 2 s kernel (hours).
6. `tools/mix_food.py` — voice −14 LUFS, SFX ≈16 dB under the voice, music bed + sidechain ducking. Owner asked for the music a bit louder: final ≈ 20 dB under the voice (spec was 25–30).
7. `tools/make_srt.py` — captions ≤ 2×42 chars, 1–6 s.

Lessons: Bangers has no lowercase ("800 g" shows as "800 G"); keep labels ≥ 46 px at 1080p; one big stick figure per scene reads best; title cards need a small character in the corner so they don't feel empty.
