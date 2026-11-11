# STYLE GUIDE — WWII channel @warboard111

**This is the house style for every future video and thumbnail.** It overrides the generic "Marker Whiteboard"
spec in the production prompt (B3) wherever they differ. Safety and accuracy rules from the prompt still apply.

Source: the channel's video "The Day Hitler Lost WW2" (2026-11-10) — thumbnail + storyboard frames.
Reference images: `docs/video/style-reference/` (`channel_storyboard_1..6.jpg` = frames of that video in order,
`thumbnail_standard_example.png` = approved thumbnail format).

Decisions (2026-11-11): illustrations are **code-drawn in sketch style** (no AI images); thumbnails use the
**channel format** below.

---

## 1. Palette (sampled from the channel, JPEG → approximate)
| Role | Hex | Use |
|---|---|---|
| Paper | `#F2F0EA` | whole background, never a solid colour panel |
| Ink | `#1A1A1A` | outlines, main text |
| Red | `#C93A3D` (thumbnail text `#D7261E`) | key word in every caption, dates, attack arrows, "CLUE" stamps |
| Blue | `#4F76A8` | dates/places/second-level labels, counter-attack arrows |
| Green | `#4F8A55` | "ANSWER", "MAIN QUEST COMPLETE", correct ✓ |
| Gold | `#E8B23A` | numbered quest circles, highlights |
| Parchment | `#E6D6B2` | land on maps (sea stays paper-white) |
| Muted wash | olive `#6B7B3A`, khaki `#C2B280`, steel `#6E7B85`, brick `#A8553A` | colour inside sketches, desaturated |

## 2. Typography
- Captions: hand-lettered marker font (Permanent Marker for headers, Caveat Brush for labels), **small**, centred above/below the object.
- One sentence can mix colours: black text, **red** key word ("When did Hitler **LOSE** the war?"), **blue** for dates/places.
- Dates as big red marker text: "22 JUNE 1941".
- Thumbnails only: **Anton** (condensed bold sans), bundled locally via `@fontsource/anton`.

## 3. Layout & composition
- Lots of empty paper. One idea per frame, usually **centred**; 1–3 objects max.
- Header caption top-left or top-centre (small), object in the middle, small caption under it.
- Objects are **small-to-medium** (≈ 15–35 % of frame height), not full-screen cartoons.

## 4. Illustration style (code-drawn)
- Pen-and-ink **sketch**: thin-to-medium variable outlines, **cross-hatching** in shadows, light **colour wash** (desaturated), small saturated accents (red flag, red seal).
- Subjects drawn semi-realistically: trains, tanks, trucks, soldiers (busts or full body), buildings (Kremlin, castles), dice, documents, flags of nations (no Nazi flags).
- People: realistic proportions (see `src/components/realistic.tsx`), never stick figures.
- No flat cartoon icons, no thick marker scribble fills (that was video #1 = old style).

## 5. Game structure on screen (the video is a game)
- **Main quest** card at the start: "When did X…?" with "MAIN QUEST: find the …".
- **"N QUESTIONS"** path: wavy line with numbered gold circles, a small icon above each, label under each.
- **"QUESTION k/N"** card: rounded rectangle, question text with red key word, **progress dots** at the bottom.
- **"CLUE #k"** red stamp + "OUR 3 CLUES" row that fills in.
- **"ANSWER"** green header above each partial answer.
- Final: green **"MAIN QUEST COMPLETE"** stamp next to the big red answer (date/number).

## 6. Maps
- Parchment land, white sea, thin ink country borders, small-caps labels (GERMANY, FRANCE…).
- Red attack arrows that grow along their path; blue counter-arrows; red date tag top-left ("10 MAY 1940").
- Territory changes = colour wash spreading like ink.

## 7. Recurring props
- Tear-off calendar page (red header, big number, month, year).
- Red/green check marks and red crosses for "yes/no" lists.
- Stamps (rotated −8°, double outline, slightly faded): CLUE, POSTPONED, MAIN QUEST COMPLETE.

## 8. Animation
- Sketch draws on (outline 0.6–1.2 s), then the colour wash fades in, hatching appears last.
- Captions write on letter by letter; key word turns red as it appears.
- Cards pop in with a small overshoot; stamps "slam" (scale 1.3 → 1.0, tiny shake).
- Cuts between frames: quick fade / paper slide. Something new every 3–6 s; no still frame > 6 s.

## 9. Thumbnails (channel standard)
- **Left ~55 %: huge Anton text, 2–3 lines, black + one red line**, max 4 words (e.g. "THE / HIDDEN / ARMY").
- **Right: one sketch illustration** (character with clear emotion and/or the key object), paper background.
- Max 3 objects; must not repeat the title; shows one surprising detail; readable at phone size.
- Approved example: `style-reference/thumbnail_standard_example.png` (`ThumbChannel.tsx`).
- ⚠ Never Nazi flags/armbands/swastikas (the "Hitler Lost" thumbnail broke this — replace it). Germany = Balkenkreuz, map, "GERMANY" label, black-red-gold.

## 10. Engine status
| Feature | Status |
|---|---|
| Realistic busts, trucks, mug, bold text (`realistic.tsx`) | ✅ done |
| Thumbnail template (`ThumbChannel.tsx`, Anton) | ✅ done |
| Sketch renderer (hatching + wash) for all icons | ⏳ to build before video #2 |
| QuestPath / QuestionCard / ClueStamp / AnswerHeader / MainQuestComplete | ⏳ to build |
| RichText (inline red/blue/green) | ⏳ to build |
| Calendar page with big red date | ⏳ to build |
| Parchment map theme + date tag | ⏳ to build |
