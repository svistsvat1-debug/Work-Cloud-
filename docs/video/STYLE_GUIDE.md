# Channel style guide — @warboard111 (WWII)

Based on the channel's video "The Day Hitler Lost WW2" (2026-11-10), reviewed via thumbnail + storyboard frames.
Applies to all future videos unless a decision below says otherwise.

## What the channel looks like
| Element | Channel style |
|---|---|
| Board | Warm off-white paper, lots of empty space, one idea per frame, centred composition |
| Illustrations | Small, detailed, colour-washed pen-and-ink sketches (trains, soldiers, tanks, Kremlin, dice, flags, calendar pages). Look like generated images, not flat icons |
| Text | Handwritten marker captions: black with **red** keywords ("When did Hitler **LOSE** the war?"), **blue** for dates/places, **green** for "ANSWER" |
| Game UI | "5 QUESTIONS" path with numbered gold circles + icons; "QUESTION 3/5" card with progress dots; "CLUE #3" stamp; "OUR 3 CLUES" row; green "MAIN QUEST COMPLETE" stamp |
| Dates | Tear-off calendar page (red header) + big red date "22 JUNE 1941" |
| Maps | Parchment/beige land, white sea, thin ink borders, red attack arrows, blue counter-arrows, red date tag top-left, small caps country labels |
| Thumbnail | Huge bold condensed sans text on the left (black + red, 2 words), one detailed illustration on the right, paper background |

## Differences from video #1 (engine v1)
- Video #1 used flat cartoon icons and stick figures → move to **detailed sketch illustrations with hatching + colour wash**.
- Video #1 had quest titles only → add the **game UI** (question cards, progress dots, clue stamps, "MAIN QUEST COMPLETE").
- Maps were plain outlines → **parchment fill + coloured arrows + date tag**.
- Text was single-colour → **multi-colour keyword highlighting**.

## Hard rules that still apply
- No swastikas or Nazi party symbols anywhere (video **and** thumbnail). Germany = Balkenkreuz, "GERMANY" label, map or black-red-gold.
  ⚠ The thumbnail of "The Day Hitler Lost WW2" shows swastika flags and armbands — replace it (ad-suitability / reach risk, and it breaks our own rule).
- No gore. Facts verified. Captions only as .srt.

## Decisions (2026-11-11)
1. **Illustrations: code-drawn, sketch style.** No AI images (rule stays). Engine moves from flat cartoon icons to pen-and-ink sketches: variable line weight, cross-hatching for shadows, muted colour wash, small accent colours.
2. **Thumbnails: channel format is the standard.** Huge bold condensed text on the left (black + red, max 4 words), one detailed sketch illustration on the right, paper background. Still: max 3 objects, must not repeat the title, no Nazi symbols.

## Engine to-do before video #2
- Sketch renderer: hatching fills + colour wash for icons and figures (replace scribble fills).
- Game UI components: QuestPath (N questions), QuestionCard (k/N + dots), ClueStamp, AnswerHeader, MainQuestComplete stamp.
- RichText: inline red/blue/green keyword colouring.
- Calendar page component with big red date.
- Map theme "parchment" (beige land, white sea, red/blue arrows, red date tag).
- Thumbnail template: condensed font (Anton / Bebas Neue, Google Fonts, bundled locally) + illustration slot.
