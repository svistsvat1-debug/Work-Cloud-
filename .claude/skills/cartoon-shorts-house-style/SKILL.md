---
name: cartoon-shorts-house-style
description: House style for this channel's vertical cartoon YouTube Shorts (reference video "The Egg"). Use whenever the user asks for a new Short, a video script, an ElevenLabs voiceover prompt, Flow / Nano Banana picture prompts, the animation, or sends the "STEP 1 / STEP 2 / STEP 3" prompts - every new video must follow docs/shorts/STYLE.md unless the user explicitly asks for something else.
---

# Cartoon Shorts - house style

The user approved "The Egg" as the standard for all future videos. Read `docs/shorts/STYLE.md` before doing anything
(and `docs/DECISIONS.md`); copy what is there, do not re-invent the look.

## Order of work

1. **Script (STEP 1).** 20-30 s, 50-70 words, English. Hook in the first sentence, chain of open loops, payoff on the last
   word, then `Subscribe to see more.` Verify every fact with a source. Deliver: one-sentence idea, clean voiceover,
   word count, sources, and the ElevenLabs prompt (eleven_v4, voice "Mark - Natural Conversations", light audio tags).
   Save as `docs/shorts/<slug>-script.md`.
2. **Voice check.** When the user sends the take: transcribe chunk by chunk (v4 repeats lines and adds text at the end),
   cut in silences, tighten pauses (`video/images/the-egg/vo/edit_vo.py` is the template), send the cleaned file back.
3. **Beat sheet + pictures (STEP 2/3).** One visual beat and one gag per line, payoff on the last word, last frame loops
   to the first. Give ALL Flow prompts in one message, one block each, with file name, aspect ratio and reference
   (`docs/shorts/style/hero_reference.jpg` for the hero). Flat #9BCFFD background, the exact STYLE blocks from STYLE.md.
   Save as `docs/shorts/<slug>-video-plan.md`.
4. **Build in `video/`** (see `video/README.md`): `images/<slug>/src` -> `prep_cutouts.py` -> `build_data.py` ->
   `make_sfx.py` (ElevenLabs takes first) -> copy `src/egg/` to `src/<slug>/` as the template -> stills + contact sheet
   -> 0.5x preview + `pop_scan.py` -> 4K render -> `finalize.sh` (-15 LUFS). Position sprites with `transform`, keep
   fonts local, never re-bundle into a folder a running render uses.
5. **Deliver.** Send 1080p (preview) and 4K, then the publishing pack in the format of
   `docs/shorts/the-egg-publish-pack.md` (vidIQ-scored titles, description with credits/sources, tags, pinned comment,
   2 covers, SRT, platform settings). Commit and push sources and docs; big renders stay in `video/out/` (not in git).
