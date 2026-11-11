# STYLE - the channel's locked look

Locked from the hero of video #1 (ocean-trench, 2026-11-11). Measured on the keyed hero picture
(studio/public/ocean-trench/hero_hold.png). Use these blocks word for word in every prompt (text only, never a picture).

Measured numbers: fill #FEFDFD, soft shade #EDEBEB (left side), outline #000000, tongue #FC8D90;
outline ~2 % of the head width (8 px on a 445 px head); head width / full body height = 0.38;
eyes = solid black vertical ovals, ~0.17 of the head width tall, ~0.09 wide; no nose, no hair, no clothes.
The prep normalises every character picture to exactly these colours (alpha 255 pixels within distance 40).

## STYLE_CHAR
Flat 2D cartoon: a simple white character with a big round head, a small soft body, noodle arms with simple four-finger
hands and short legs with rounded feet, thick smooth black (#000000) outlines of even weight, about 2 % of the head width
thick, flat white fill (#FEFDFD) with a very soft pale-grey shade (#EDEBEB) on the left side of the head and body, the
round head is wider than the body and about 0.38 of the full body height, small solid black vertical oval eyes about one
sixth of the head width tall, simple curved black eyebrows, no nose, no hair, no clothes, a pink tongue (#FC8D90) only
when the mouth is open. Clean vector-like linework, flat colours, no texture, no text, no border.

## STYLE_OBJ
Flat 2D cartoon in the same drawing style: thick smooth black outlines of even weight, flat colours with one simple soft
shade, clean vector-like linework, no texture, no text, no border, no characters.

## KEY
Isolated on a perfectly flat, uniform, solid pure green (#00FF00) background that fills the whole picture edge to edge:
no shadow, no ground, no floor line, no gradient, no vignette, no border, no other objects. The whole subject in frame
with a clear margin on every side.   (magenta #FF00FF if the subject has green in it)

## STYLE_BG
Flat 2D cartoon background in the same drawing style: big simple flat-colour shapes, thick smooth black outlines only on
the main shapes, no texture, no text, no labels, no arrows, no characters, calm and simple so a character reads clearly
on top of it.   (+ the layout of the set in % of width / height)

## Effects palette (code)
Lava #FF6A2B, deep edge #E2501E, hot core #FFA445 / #FFC867 (no outline). Smoke #6F6A68 / shade #5E5957 with one merged
black outline. Sea top band #178CE2. Text: Inter Black, white, thick black stroke (paint-order stroke).

## Lessons
Video #1 (ocean-trench, 2026-11-11):
- GOOD: the hero came out clean on the first try; with the measured STYLE_CHAR block every later picture (9) matched it,
  zero redos. Keying script + colour normalising gave clean cut-outs on magenta / dark-blue sheets.
- GOOD: cutaway set (sea + trench + slab + magma) as ONE background plate, with the volcano as its own sprite. Put every
  sprite that must sit on the plate's geometry (boat on the sea line, bag on the slab) in the SAME plane; parallax would
  detach the boat from the sea line. Measure the plate's lines in prep (slab boundary every 40 px) and drive paths from them.
- GLITCH: "waist-up close-up" came out full body. Next time: "only the head and chest are visible, the bottom edge of the
  picture cuts the body at the chest".
- GLITCH: pair sheets (3:2) draw the character small (~600 px tall per half); fine for medium shots at <=1x, not for close-ups.
- GLITCH: a damped spring() started on a frame with no swap or cut = a visible 1-frame jump (pop scan caught it at the
  smug close-up and the counter). Use sin pulses for bounces that are not hidden by a swap.
- FIX in the improvement pass: frame 0 was too wide (character ~12 % of frame height) -> now ~16 %; the "fingernails"
  hold was static -> a code-drawn snail crawls past and overtakes the plate; Zzz letters were too small in the wide shot.
- Sound Effects v2 was billed ~3.3 credits per second (the estimate said ~11): plan more for pictures next time.
  The "builds up" rumble came out flat: shape it with dB keys instead.
- The Remotion mix peaked at only -8.6 dBFS (voice at 0 dB + sfx at the listed levels): the final file got +4.6 dB on the
  mixed audio (re-muxed, video copied) to reach -4 dBFS. Next time check the mix peak on the 0.5x preview.

Video #2 (moon-trash, 2026-11-11):
- GOOD: the locked STYLE_CHAR block (text only) again matched every pose on the first try: 11 pictures, 0 redos.
- BUG FIXED: the old prep normalised colours in palette order, and fill #FEFDFD is within 40 of shade #EDEBEB, so every
  white pixel became shade grey (ocean-trench sprites are greyish). moon-trash/prep.py assigns the NEAREST palette colour:
  reuse that version.
- GLITCH: a clear bubble helmet on a green key comes out as green-tinted glass (the key shows through). Fixed in prep by
  recolouring greenish pixels to pale blue glass at alpha 150. Next time: magenta key for anything with glass.
- GOOD: split each background plate along its horizon into a front layer (depth 1) + a far sky layer (hidden band filled,
  sky padded 500 px upward) -> real parallax on tilts for 0 credits. A set piece drawn as stacked parts ("two stages with a
  straight seam") can be split at the seam in prep and animated separately (lander ascent stage lifts off).
- GOOD: objects with code faces carry the comedy: sleeping Moon with z's, one suspicious peeking eye, "> <" + green tint +
  tongue on the punchline, head-shake "no" at the end; lander cabin straining with "> <" eyes and a sweat drop.
- FIX in the improvement pass: a 2 s hover of the bag was dead -> the sleeping Moon peeks at it with one eye; price-tag
  text overflowed the tag -> font 41 on a 286-wide tag; frame 0 hero was small -> opening camera k 1.12 (hero ~36 % of
  the frame height) and the last key equals it for the loop; astronaut hop read as flying -> low hop that shrinks behind
  the cabin; the Apollo pile bounces on "dump".
- MIX: Remotion's mix peaked at -8.65 dBFS again; MIX_DB = +4.6 applied in code to the voice and every cue (no re-mux).
- TIMING: 68 words / 368 characters came out 23.5 s with Mark on eleven_v4 (video 1: 69 words in 20.6 s); plan ~24 s.
- Sound Effects v2 again billed ~3.3 credits/s (7 sounds = 26 credits); whole video 1251 credits.
