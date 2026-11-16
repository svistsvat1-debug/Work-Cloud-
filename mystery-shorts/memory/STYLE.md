# Channel look - LOCKED (paper cut-out mystery style), approved 2026-11-16 on the Mary Celeste test

## STYLE blocks (copied word for word into every image prompt)

PAPER_STYLE = "Paper cut-out collage illustration. Made of layered cut paper with visible paper grain, slightly rough
hand-cut and torn edges, small soft shadows between the paper layers giving gentle depth. Muted palette: dark teal
#1E3D44, deep ink blue #172A3A, rust #A4502F, mustard #C9A04A, cream #E9DFC9. Simple shapes, minimal details, no text,
no watermark."

MOOD = "Eerie, quiet, mysterious mood, like a page from an old detective case file."

KEY = "Isolated on a perfectly flat solid pure green (#00FF00) background, no shadow on the background, no floor, no
text. Whole subject in frame with a clear margin on every side."

Backgrounds: vertical 9:16, empty of characters, PAPER_STYLE + MOOD, one warm mustard light source when it fits.
Cut-outs (characters, props, foreground layers): PAPER_STYLE + KEY. Characters: simple paper shapes for the face
(dot eyes, small eyebrows), full body, three-quarter view.

## Measured numbers from the test
- Owner's images arrived 768x1376 (9:16-ish JPEG). Shown at ~1.46x on 1080x1920: acceptable, but ask for the largest
  size the owner's tool gives (1080x1920 or 2K).
- Green key: greenness = G - max(R, B); alpha 1 below 0.18, 0 above 0.32; despill edges; drop components < 200 px.
  Clean on ship rigging, sail holes and wave crests (engine/key.py).
- Render: 1080x1920, 24 fps; objects move on twos (12 fps steps = paper stop-motion), camera moves smoothly.
- Music bed: RMS 15 dB under the voice RMS (owner asked for louder music than the first -21 dB), ducked -5 dB under words.
- Voice: owner records it in Google AI Studio (voice name: [MISSING], ask once and log it). Test pace: 27 words in
  ~12 s with pauses = ~2.3 words/s.

## Lessons
1. A second pose generated without a reference became a different person (hat rust instead of navy, brown beard
   instead of grey, different face). Every character needs a CHARACTER block repeated word for word, and the owner
   should generate pose 2+ with pose 1 as a reference picture in their tool.
2. Camera zoom must be clamped to the background edges (a 1.22 zoom on the table showed a black strip before the clamp).
3. A match cut through light works well: zoom into the lit ship window -> its glow becomes the cabin lamp.
4. Front-layer foam waves on their own layer with parallax 1.25 sell depth; keep their crest line below the ship hull.
5. Pose swap with a squash (scaleX 0.84 for ~0.1 s) + boom + light going out reads clearly as the scare beat.
6. A beat with no picture for it ("the cargo is still there") had to fall back to a camera move: plan one picture per
   sentence that names a new thing.
7. Ending on the opening shot (darkened, fading back) makes the loop seamless.

## Owner overrides
- 2026-11-16: owner limit for a Short is 25 s (overrides R6 30-45 s). Target: narration ~50-55 words, estimate <= 23 s at 2.3 words/s, video <= 25.0 s; 6-9 pictures.
- Channel name: [MISSING] (new channel, no name yet).

## Voice pace
- 2026-11-16 messina-saints: Google AI Studio voice (name [MISSING]), 51 words in 22.16 s file (speech 0.00-21.68 s) = 2.30 words/s incl. pauses; natural pauses 0.5-0.8 s between sentences. Keep 2.3 w/s for estimates. Delivered as 24 kHz mono WAV.

## Lessons (messina-saints)
8. A 25 s Short holds ~51 words at 2.3 w/s: 6 short sentences, cut on the sentence pauses, 6 scenes; video = voice + ~0.9 s tail.
9. Owner pictures of one object in two states (altarpiece full / empty) came out with different frame shapes; hide the swap in a flashlight flash (screen-blend 0.85 for 0.1 s) + small shake + squash on the character.
10. A foreground railing cut-out at 1.65x covered half the frame; foreground strips must stay in the bottom ~20 % (scale ~1.05 there).
11. Owner backgrounds have torn paper borders at the image edges: start interior scenes at zoom >= 1.08 so the border never shows.
12. faster-whisper mishears proper names ("Antonello da Messina" -> "Antonio Damacena"): compare the transcript by sound, not by spelling, before flagging a recording error.
- 2026-11-16 angel-steps: same voice, 49 words in a 20.68 s file (speech to 20.4 s) = 2.37 words/s.

## Lessons (angel-steps)
13. A growing stack of one prop (14 steps) reads as stairs only with alternating tint (x0.86 every other step), squash 0.30 and 24 px spacing; at 20 px / 0.36 it merged into one white wedge.
14. "Sinking" on a single cutaway picture: shift the whole image down a few px per step on twos and paste the unmoved column strip back on top - the houses drop, the column stays.
15. A full-frame numpy shift per frame plus many glows made this render ~5x slower than messina-saints; wait for it with a longer background timeout (the 10-minute waiter expired).
16. Cover text strip must sit below a top subject (the angel): check the cover crop before saving.
