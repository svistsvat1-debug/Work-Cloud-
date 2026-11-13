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

Video #3 (lava-fire-hose, 2026-11-11):
- GOOD: the locked STYLE_CHAR block again gave 7 matching character pictures with zero redos (hero first, then a batch of 11).
  Objects (ship, house, boats) and both plates also passed on the first try. 12 pictures + voice + 8 sfx = 1321 credits.
- GOOD: a code-drawn "living lava" character (flat orange blob, no outline, crust spots, hot streaks, Eye faces, a mouth)
  can act through a whole video, and turning it to rock = a rock-coloured copy of the same path revealed by a growing clip
  rect with a glowing seam. Small wooden signs (HAWAII 1986 / ICELAND 1973) and a flipping calendar carry facts cheaply.
- GLITCH: texture details animated with `(t * speed) % range` jump back at the wrap (pop scan flagged it). Always give
  looping details a life envelope (size = sin(pi * phase)) so they shrink away instead of teleporting.
- GLITCH: anything drawn as a long thin vertical shape (a lava river straight down a volcano, a narrow lava band) reads as
  a pole / horn. Keep rivers short, tapered and following a slope; make floods wide and low.
- GLITCH: the palette normaliser assigned pixels to the LAST palette colour within distance 40, so the white fill
  (#FEFDFD) was turned into the shade colour (#EDEBEB): characters looked grey. Fixed: nearest palette colour wins
  (video #1 sprites were made with the old code).
- GLITCH: a storm darkening div placed under the code-drawn water laps left the laps bright: put full-scene colour
  overlays above every layer of the world.
- FIX in the improvement pass: frame 0 pushed in (k 1.12 -> 1.27) so the guy and the lava face are both big; looping
  lava textures got life envelopes; the lava face in the close-up moved fully into frame.
- The Remotion mix peaked at -7.3 dBFS (preview): raised the final audio by +3.3 dB in a re-mux (video copied).
- Water wide shots: a 2:3 harbour plate leaves the lower third as empty sea. Fill it with nearer (lower, bigger) floating
  objects and a few light wave squiggles.

Video #4 (doomsday-2026, 2026-11-12):
- GOOD: the locked STYLE_CHAR block (text only) again matched every character picture on the first try: hero + 6 poses
  (incl. a LOW 3:2 pair sheet of two kid versions) + earth, computer and 2 plates = 11 pictures, 0 redos, 1247.5 credits.
- GOOD: free crowds = code clones of the pose sprites (mirrored, depth-scaled rows on the floor, sorted by feet y). A
  "multiplying" beat = pop times by doubling generations (1, 2, 4, 8, 16...) + pop sounds with rising pitch
  (shared Cue now takes `rate`). Clones leave in a cascade of white outlined puffs.
- GOOD: a machine with a face: its tape reels became eyes (pupil, lids, brows in code); switching between "spinning reels"
  and "eyes" is hidden by a blink. A small "1960" tag on it anchors the year visually.
- GOOD: the wall and floor are extended in code (flat colours + plank lines) so the camera can tilt above the plate (the chalk
  curve shooting up to infinity) or below it. Chalk = light stroke over a dark ink underlay, so it reads on the board AND on
  the wall.
- GOOD loop: in the last 0.55 s the computer prints the next DOOMSDAY page and the video hard-cuts to the frame-0 state.
- GLITCH: "Close-up" prompt again came out (almost) full body; usable because the frame edge crops it. Keep the lesson.
- GLITCH: the inscribed-disc head measure fails when a held object covers the body (the calendar page): take the head width
  above the hands instead (x 0.92). Automatic small-feature detection (the paper slot) picked a panel edge: read small
  features off a marked-up sheet (qa/measure.png).
- FIX in the improvement pass: the cure card was cut by the frame edge and covered the computer's eyes -> smaller and higher;
  "In 1960" had no visual -> "1960" tag on the computer; the couple overlapped into one blob -> more spacing. From the
  first contact sheet: the DOOMSDAY stamp hid the "13" -> moved lower; close-up neighbours were hidden behind the guy ->
  moved in front, pressing on his cheeks; people on the Earth were too tiny -> 38 % bigger; the infinity shot recentred.
- TIMING: 69 words / 404 characters with three numbers ("1960", "13th", "2026") took 28.3 s with Mark (numbers are read as
  words). With years in the script, plan 60-65 words.
- MIX: MIX_DB +4.0 in code gave a -3.7 dBFS peak on the preview: no re-mux needed.
- GLITCH caught on the final file: the loop frame replayed story time 0, so its idle motion (tremble, breathing) froze too ->
  the last 0.5 s were static. Drive idle motion by real time and story beats by story time. Also check that text fits its
  box at full size (the DOOMSDAY stamp text was wider than its frame).
- RENDER here: 4 cores (CONC=4 max), CHROME=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/
  chrome-headless-shell, gl swangle (no GPU); full 29 s render ~7-10 min.


Video #5 (nuke-gas-fire, 2026-11-12):
- GOOD: the locked STYLE_CHAR block (text only) again matched every character picture on the first try: hero + 5 poses,
  plus bomb, rig, props sheet and 2 plates = 11 pictures, 0 redos, 1251.1 credits (pictures 852.8, voice 375, sfx 23.3).
- GOOD: a code-drawn flame character: 5 stacked flat layers (deep edge #E2501E, #FF6A2B, #FFA445, #FFC867, #FFF1BF), no
  outline, outline points from a width profile sqrt(u)*(1-u)^1.25 with travelling sine ripples + sway; two side tongues;
  Eye faces placed at ~50 % height so held props (the marshmallow) do not cover them. It can be squashed into a pipe by a
  cork, burst back with easeOutBack, and die by shrinking with a "> <" face into a smoke puff + smoke ring.
- GOOD: a school-diagram cut-away: the desert plate above a front-edge line G, a separate "underground layers" plate
  below it (bands measured in prep), pipes / gas bubbles / cracks / a slant hole / a depth gauge in code. The camera can
  pull back from the surface into it in one move. Keep every surface shot's view bottom above G (check at every key).
- GOOD: a 3:2 "set piece" picture (wreck) split in prep at the emptiest columns into derrick / well / beams gives free
  layout control; a 3-object LOW props sheet split the same way (cork + two wellheads).
- GOOD: an everyday analogy in the script ("like stepping on a hose") gets its own short cut-away gag: it reads at once.
- GLITCH: the camera left the 1536-wide plates (a blue strip on the side). Clamp camera x to 540/k .. 1536 - 540/k.
- GLITCH: a text label switched its content at the START of its flip squash (pop scan flagged it): switch on the
  squashed frame (the middle of the flip).
- GLITCH: an underground set piece that straddles G (the slant-hole entry, and the ROUND line cap of the hole) showed in
  the last frame but not in frame 0 (a loop mismatch): clip everything underground to y >= G and hide anything that is
  not in frame 0 before the final glide back to the frame-0 camera.
- GLITCH: an idle tremble was switched on with a step (a 0/1 condition): ramp every idle motion in with prog(). (The
  pop-scan flag at that moment was the landing of the jump itself, which is intended.)
- FIX in the improvement pass: the cork beat (5.3-7.5 s) was a wide frame with empty sky and a static cork -> close
  framing (k 1.5) + gas puffs hissing out around the cork with rising pressure; the blast cavity with squeeze marks on
  both sides read as a striped ball -> marks only on the pipe side, a hot core inside the cavity; the payoff ("fire out
  in twenty-three seconds") was small -> camera pushes in (k 1.38) on the dying flame, a bigger stopwatch, then glides
  back to the frame-0 framing for the loop.
- MIX: MIX_DB +4 gave a -2.8 dBFS peak on the preview (this voice take is louder); +3 dB used for the final.
- TIMING: 69 words / 375 characters with one spelled-out number took 24.2 s with Mark.

Video #6 (desert-ice, 2026-11-12):
- GOOD: the locked STYLE_CHAR block (text only) again matched every character picture on the first try: hero + 5 poses
  (incl. a 'head and chest only' close-up that finally came out as a real close-up) + dome, pool, props sheet, plate =
  10 pictures, 0 redos, 1166.5 credits (pictures 772.2, voice 370, sfx 24.3).
- GOOD: four 'sets' on ONE plate swapped on hard cuts (day desert / night close-up / pool / dome): every object is shown
  only in its set, so one 2:3 plate carried a 25 s story. Night = a multiply overlay: strong (0.55) on the plate +
  environment, weak (0.3) on the characters, stars / the sky's face / heat squiggles drawn ABOVE both overlays (so they
  glow). Full-strength night on the characters turned them muddy purple.
- GOOD: abstract physics as a character: the night sky gets eyes + a puckered 'o' mouth and slurps orange heat squiggles
  (wavy line, black underlay) out of the water, accelerating (easeIn) into the mouth. A tear-off calendar card
  (WINTER / SPRING / SUMMER, flipped by scaleY through 0, word switched on the flat frame) carries the seasons cheaply.
- GOOD: an 'x-ray' cut-away panel (wall band | ice inside | wall band) + a yellow double arrow + a '2 m' tag reads the
  'walls two meters thick' fact in one glance; keep it clear of the object's face (moved the face up).
- GLITCH: the inscribed-disc head measure failed again when both arms cross the head (carry pose): read the head off a
  gridded crop (qa/carry_head.png). Bluish 'ice' detection must use a strong threshold (b - r > 40) or anti-aliased
  outline pixels make the box span the whole sprite. A pour pose's water stream reaches the bottom rows: measure feet
  only left of the stream.
- GLITCH: a calendar at the top-left covered the sky's left eye, and at the top-right it later covered the wink: give
  screen-space UI its own corner per set and pop it out before the payoff gag.
- FIX in the improvement pass: the night pool shot was dark with an empty grey lower third -> lighter night (0.66 -> 0.55)
  and the camera tilted up (more sky with the face, less ground); the runner entered half out of frame on the 'But' cut
  -> starts in frame and leaves little puddles on the sand; the last frame cut the dome through one eye -> final camera
  moved left so only the dome's edge shows.
- MIX: MIX_DB +3.5 gave a -4.3 dBFS peak on the preview: no re-mux needed.
- TIMING: 70 words / 370 characters, no numbers in digits, took 24.6 s with Mark.

Video #7 (nuclear-warning, 2026-11-13):
- OWNER'S PREFERENCE: split pictures by importance, about 5 MEDIUM + 6 LOW (asked on approval). MEDIUM went to the hero
  pair sheet, the close-up, the payoff pose, the payoff object pair (cat) and the background; LOW to secondary poses
  (skull sign, robber, researcher), set pieces (tomb) and the props sheet. The locked STYLE_CHAR block matched on LOW too:
  the LOW character poses were clean enough at <= 0.5x native, 0 redos. Spend 1066 credits.
- BLOCKED: an image prompt with "nuclear waste" + "radiation trefoil" was refused by the content filter ("may violate our
  Terms of Service"). Avoid those words in picture prompts (say "yellow metal drum with a black three-blade fan symbol") or
  draw such objects in code: the code barrel (rounded rect, rings, lid, trefoil, oozing goo with life-envelope drips, Eye
  faces) matched the style and was easier to animate.
- GOOD: a hero PAIR sheet (mallet up / mallet down from one drawing, one shared scale, feet on one baseline) gives a hammer
  strike with clean squash swaps; the 'down' mallet head is placed to hit the sign post.
- GOOD: the school-diagram ground cut-away (grass edge at G, three wavy soil bands, rocks, a shaft) lets one camera move
  follow an object underground; radiation = lime arcs radiating from the lid (thickness life envelope). Arcs that MOVE UP
  read as eyebrows - keep them centred on the source.
- GOOD: a LOW pair sheet on magenta with a glow edge leaves a pink halo after keying: cut everything outside the closed black
  outline (fill the outline from outside, keep thin dark strokes like whiskers) and add the glow in code (CSS drop-shadow).
- GOOD: head measuring = rays from a seed centre to the silhouette edge inside a chosen angle range + least-squares circle
  fit (heads2.py); robust to glasses, masks, raised arms and held signs (the inscribed-disc and Hough methods both failed).
- GOOD: on-screen text drawn on a generated prop (Beowulf lines on the scroll) with FreeSerif Bold Italic (public/fonts,
  GNU FreeFont licence), revealed line by line; flipping it upside down is a free gag.
- FIX in the improvement pass: the legend tablet's pictograms were too small in the wide shot -> push in on tablet + cat
  (k 1.25); the thought bubble vanished in one frame (pop scan) -> shrink it out; frame 0 pushed in to k 1.06 with the
  guy, the sign and the barrel all inside the frame with margins.
- MIX: MIX_DB 3.5 gave -4.6 dBFS on the preview -> 4.0 for the final.
- TIMING: 68 words / 396 characters, no digits, took 24.2 s with Mark.
- RENDER: rendering a still (bundling) while a full render runs slows the render a lot; use a separate BUNDLE_DIR for
  the cover so the running render's bundle is not overwritten.
