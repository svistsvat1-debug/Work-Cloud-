# STYLE - the channel's locked look

Locked from the hero of video #1 (ocean-trench, 2026-11-11). Measured on the keyed hero picture
(studio/public/ocean-trench/hero_hold.png). Use these blocks word for word in every prompt (text only, never a picture).

Measured numbers: fill #FEFDFD, soft shade #EDEBEB (left side), outline #000000, tongue #FC8D90;
outline ~2 % of the head width (8 px on a 445 px head); head width / full body height = 0.38;
eyes = solid black vertical ovals, ~0.17 of the head width tall, ~0.09 wide; no nose, no hair, no clothes.
The prep normalises every character picture to exactly these colours (alpha 255 pixels within distance 40).

## OWNER RULE - SCRIPTS ARE STORIES (2026-11-14, read before writing ANY script)
The owner asked: from now on the voiceover is NOT told as a list of facts but as a short STORY of at most 25 s (owner raised the cap from 20 s to 25 s on 2026-11-14 for the story format;
  target 21-24 s). The full rule is R10 + STEP 1C "Story" in cartoon-shorts/PROMPT.md (the current prompt).
- Open in a moment of time with someone who has a problem ("In 1930, a phone company needed this building gone."):
  who + when + what they want, and the stakes, in the first line (it still names what frame 0 shows).
- Then the plan / obvious solution -> "But" the obstacle -> "So" the clever turn (a person decides / tries something)
  -> the payoff as the story's ending, not as a stated fact. Past tense for real history, present tense for a what-if
  ("so you throw it in..."), never mixed; narrated like telling a friend what happened.
- Characters act and decide on screen (the channel guy plays the hero of the story: the architect, the engineer...).
- Still real facts only, now 48-60 words / <= 360 characters (speech <= 24 s), no invented quotes presented as real quotes
  (a narrated paraphrase like "the architect said: move it" is fine when the source says he proposed it).
- In the idea card, write the voiceover in this story shape from the start.

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

Video #8 (turkey-eggs, 2026-11-13):
- GOOD: the locked STYLE_CHAR block (text only) again matched all 4 character pictures on the first try (hero, yum, shrug,
  shock close-up - which finally came out as a real head-and-chest close-up); animals (turkey, turkey pair, hen pair on a
  BLUE key, poult pair) and props (nest + grain sheet, roast on magenta) too: 11 pictures, 0 redos, 1084.2 credits.
- GOOD: a 20 s Short works with 52 words (16.96 s voice): one beat per line, 7 shots, still room for a gag per beat.
- GOOD: ordinary objects with code faces carry the story (eggs notice the hungry guy, look up at the price tag, sweat).
  A FAIL gag beats a success gag: the turkey strains and only one feather drifts into the nest; big "6" vs red "2" labels
  make "a third as many" readable in one glance. A tear-off day card + a final "SUN" with no egg shows "almost every day".
- GOOD: payoff = push in to k 2.1 on the hatched chick + thought bubble (roast dinner) + swap to the scared pair half on
  "Thanksgiving", then glide back to the frame-0 framing so the last frame loops.
- GLITCH: things on the same ground line overlapped after re-spacing the set (the hen's egg pile slid behind the nest).
  After any layout change, re-render the shots of every set piece, not just frame 0.
- GLITCH: eggs drawn in code behind a nest sprite were mostly hidden by its rim; raise them ~25 world px above the
  nest's anchor so ~2/3 of the egg shows.
- FIX in the improvement pass: frame 0 too wide (characters ~23 % of the frame height) -> k 1.1 with the guy and the turkey
  moved closer; the hen shot was cluttered by half a turkey at the edge -> tighter k 1.6 on the hen; the strain beat had no
  payoff -> a feather drifts into the nest instead of an egg; fork clink on "dinners".
- MIX: MIX_DB 4.0 gave -3.8 dBFS on the preview: no re-mux needed.
- TIMING: 52 words / 275 characters, no digits, took 16.96 s with Mark (~3.07 words/s).
- OUTAGE: the ElevenLabs connector returned 503 / timed out for ~35 min mid-run. Adding a node is free but a timed-out add
  may still have been created: read the flow (creative_get_flow) before re-adding or running anything.

Video #9 (tsunami-wall, 2026-11-13) - first video made with ALL pictures LOW 1K (R8):
- GOOD: LOW held up. The locked STYLE_CHAR block (text only) gave a clean hero on the first try, and a guy pair (panic run /
  laughing + pointing) and a mayor pair (hard hat + sash: pointing up / smug arms crossed) matched it; the wave (3:2, magenta
  key), a 3-house sheet and the plate also passed the sheet check: 6 pictures, 0 redos, 541.36 credits in all (voice 248,
  pictures 281.7, 2 sfx 11.7). Adding "Bold clean thick outlines, big simple shapes, few details." to every prompt kept the
  LOW lines clean; at <= 1.3x native nothing looked rough. A 3:2 pair sheet gives two full poses for the price of one.
- GOOD: a side-view 'school diagram' coast (sea | concrete wall | town on one ground line) makes heights readable at once:
  walls drawn in code grow out of the ground with a ruler that counts metres ("0 m" -> "10 m"), a ghost copy of the wave
  sprite (CSS grayscale + brightness + 50 % opacity) with a "1896" label and a dashed line to the wall top shows "as high
  as". The plate is mirrored left and right (scaleX(-1) copies) so the camera can pan past its edges with no seam.
- GOOD: comedy without new pictures: a small wave with a code face swells to full size on the key word (uniform scale about
  its right base corner); it literally jumps the wall; houses get code eyes (wide when the wave comes, "> <" while floating
  away, open and blinking at the payoff); the mayor rides his own rising wall up; a code fish lands on his hard hat.
- GLITCH: a foreground layer (depth 0.7) with its own grass hill made the characters look like they stood inside the soil
  of the cut-away (two ground lines that never line up while the camera moves). In a side-view diagram keep every
  character on the diagram's own ground line, in the same plane, and make them a bit bigger than 'real' instead.
- GLITCH: a side view in a 9:16 frame is a wide strip: wide shots leave big empty sky + soil. Centre the camera on the
  content band (cam.y ~ ground - 0.45 x content height), put the 2011 card in the sky, and keep wide holds short.
- GLITCH: the wave's face was first drawn in the middle of its body = off-screen whenever the wave filled the left of the
  frame; put faces on the part of an object nearest the action (the curl side). Measure on a gridded crop (qa/wave_grid.png).
- FIX in the improvement pass: frame 0 bigger (k 1.3, small wave at 0.5 scale) so the wave's face and the guy read like a
  thumbnail; the flood hold got houses with "> <" eyes; the payoff got the fish on the hat; the pull-back after
  "tsunamis" eased out (fast start) so the swollen wave's face is not cut off for a second.
- LOOP: two sets (Taro / Fudai) cannot loop exactly; the last frame (smug mayor + houses) only loops by idea.
- MIX: MIX_DB 4.0 gave -3.4 dBFS on the preview (grind at -19 was the peak): grind -> -21, final -3.47 dBFS.
- TIMING: 47 words / 248 characters with one year in digits ("2011") took 16.88 s with Mark (~2.8 words/s).
- Sound Effects v2 billed 3.3 credits/s again (estimate 38.5, actual 11.7).

Video #10 (eagle-zap, 2026-11-13) - made WITHOUT new pictures:
- BLOCKED: the ElevenLabs MCP tools (creative_*) never loaded in this session although the connector showed "connected".
  The REST API through the session proxy works for voice (/v1/text-to-speech/{voice}/with-timestamps: 245 chars = 108
  credits, cheaper than Flows), Scribe (/v1/speech-to-text: 5) and Sound Effects (/v1/sound-generation: 4.5 s = 50), but
  /v1/flows/image answers "This endpoint requires a Pro plan or above" on this Creator account. Credits can be read as the
  delta of /v1/user/subscription character_count (it updates a few seconds late); /v1/history shows per-request cost.
- FALLBACK that worked: reuse finished ElevenLabs cut-outs from earlier videos (never fed into a generation) - pick poses
  with the same head/height ratio (r/h ~0.21: doomsday 'happy' + nuke-gas-fire 'shock'); close-ups (lava 'shock_cu', moon
  'shocked_cu') in screen space with the head radius equalised; turkey-eggs farm plate. New characters drawn in code.
- GOOD: code-drawn animals in the house style (thick black outline, flat fill + one lighter shade, scalloped feathers) sit
  well next to the AI cut-outs. A code eagle can do what pictures cannot: wings open/close/droop continuously (wing group
  rotated about the shoulder, folded = rotated 96 deg and scaled 0.48), flap in flight, x-ray skeleton flicker, sooty +
  frizzy (spike triangles behind the outline) + spiral eyes after the zap.
- GOOD: two parallel wires seen from the front read best like RAILS: vanishing point ABOVE the scene (horizon high, field
  below), far poles = the same drawing scaled about the VP, their crossarms stacked like rungs. A VP below the pole made the
  wires look like guy-wires, and an off-centre VP made one wire almost vertical.
- GOOD: electricity as little yellow bolt critters with two dot eyes running along a wire; one stops, looks up, a "?" pops,
  it runs on = "no reason to go through the bird" in one glance. Bolt = jagged polyline re-randomised 20x/s (black under,
  yellow, white core).
- FIX in the improvement pass: the wire close-up had 60 % empty sky below -> the guy's 'happy' pose in screen space at the
  bottom pointing up at the sparrow; the build-up to the zap was wide -> push-in to k 1.18 then pull back on the flash;
  eagle circle -> dive started from a different point (pop at 2.85 s) and tilt jumped at the path joint -> continuous path
  + eased tilt; sparrows flipped instantly -> facing averaged over 0.12 s (squash through 0.22).
- GLITCH: a waist-up close-up cut at the chest must reach below the frame edge (bottom = head_y + (h - head_cy) * s);
  smoke puffs must not rise over the face that carries the payoff (check the LAST frame).
- MIX: MIX_DB 4.0 gave -3.7 dBFS; no re-mux. TIMING: 48 words / 245 characters took 15.0 s with Mark (3.2 words/s).
Video #11 (kingfisher-train, 2026-11-13) - all pictures LOW 1K again:
- GOOD: LOW held up a second time: 7 pictures (hero, guy pair, two trains, kingfisher pair on magenta, hill with two tunnel
  portals on magenta, plate), 0 redos, 593.65 credits in all (voice 250, pictures 328.7, 3 sfx 15). Vehicles and animals
  in 'side view, facing RIGHT, flat outlines' came out clean; a 'front car whose LEFT end is cut off straight' train
  sprite lets code build more cars (crop the body, close the end with the mirrored left end).
- GOOD: a set piece with holes (tunnel portals) hides things naturally: draw the train BEHIND the hill sprite and it
  disappears into one portal and comes out of the other with no clipping code. Size the hill so the opening is a bit
  taller than the train.
- GOOD: abstract physics as a character again: a puff-cluster 'air pillow' with '> <' eyes squeezed between the nose and
  the portal (its width = the gap) reads 'shoving air' at once; the hill with a code face puffs its cheeks, sweats and
  BOOMs; a calm smiling hill + 'shhh' sells 'quietly'. A big white poof cloud hides a sprite swap (old nose -> beak).
- GOOD: a cut-away pond (water body behind, semi-transparent light-blue overlay in front of the bird and the fish) makes
  'dives with barely a splash' readable: tiny ripples + two droplets + a small 'plip' label.
- GLITCH: thick white shock-ring arcs around a portal read as a white stalk / banana. Radial blast lines (short thick
  strokes moving out and thinning) read as an explosion.
- GLITCH: side-view subjects in a 9:16 frame: the first framing left 40 % empty soil and 45 % sky. Put the ground line at
  ~75-78 % of the frame height (cam.y = G - (0.77*1920 - 960)/k) and fill the sky with something on topic (a Japanese
  flag that hops on 'Japan'); keep the right-hand pose's arm (thumbs up) inside the frame at the end.
- FIX in the improvement pass: cameras pushed in (frame 0 k 2.35, follow 1.8, shot D 2.3), guy HEAD 43 -> 48, bird 0.11
  -> 0.135; the old train now brakes hard so the air pillow is visible for ~1 s; flag added to frame 0 + last frame; blast
  lines instead of rings; the cover hides the flag (rule of three).
- TIMING: 47 words / 250 characters, no digits, took 15.6 s with Mark (~3.0 words/s); Scribe's sentence-end words were
  0.2-0.4 s late vs the loudness envelope (trust RMS pauses).
- MIX: MIX_DB 4.0 gave -3.4 dBFS (boom at -7 in a pause): no re-mux. Sound Effects v2 billed 3.3 credits/s again.
- RENDER: full 16.3 s render ~1.6 min (CONC 4, swangle).

Video #12 (hoover-dam-pour, 2026-11-14) - all pictures LOW 1K again:
- GOOD: LOW held up a third time: 7 pictures (hero, 2 guy pair sheets, mixer truck, fridge, canyon walls, desert plate), 0 redos,
  578.98 credits in all (voice 241, pictures 328.7, 2 sfx 9.3). The locked STYLE_CHAR block (text only) matched every pose.
- GOOD: a keyed set piece with a hole IN FRONT of code-drawn content: 'two cliffs joined by a canyon floor, one empty U-shaped gap,
  the green background shows through the gap' keyed cleanly; the code dam / concrete fill / blocks / pipes / falling chunk sit
  behind it and are clipped by the cliffs for free. Extend such a plate sideways by repeating a column just inside its outer
  outline (horizontal strata continue); below it use a flat rock colour + code strata lines (a repeated row carried vertical
  seams). Pre-scale the plate x1.6 with Lanczos when the camera pushes in past 1.3x.
- GOOD: mirror the guy (scaleX -1 about the feet) when the story needs him facing left: frame 0 became symmetric (truck pours
  from the left rim, the guy points from the right rim). Put the payoff prop ON the main object (the fridge dropped onto the
  dam's crest, pipes out of its foot): the final shot centred itself; the first layout (fridge on the far rim) left the dam on
  one side and the payoff prop tiny.
- GOOD: abstract time in one glance: a dark YEARS counter in the sky running 0 -> 125 + the guy growing a beard; a rewind =
  white poof over the object + the counter spinning back + the beard retracting. Heat = colour lerp grey -> orange + a cooking
  thermometer stuck in the top that pops its cap in the pause.
- GLITCH: many small steam clusters (3 jets x 5 puffs) looked like popcorn in a wide shot. Fewer, bigger merged columns
  (3 circles per puff, one PuffCluster per jet, slower rise) read as steam. Text that counts needs singular/plural ('1 YEAR').
- MIX: this take peaked at -2.7 dBFS raw, so MIX_DB 4 would clip; MIX_DB 1.5 gave -4.2 dBFS. Check the raw voice peak first.
- TIMING: 47 words / 241 characters with '125' took 16.24 s with Mark (~2.9 words/s).
- NETWORK: the Default cloud environment allowed no hosts, so elevenlabsusercontent.com downloads failed (403). A personal
  environment 'Work-Cloud-' (host elevenlabsusercontent.com + setup script npm ci / pip pillow numpy opencv) now exists; use it.
- RENDER: full 17 s render ~6.5 min here (CONC 4, swangle).

Video #13 (building-move, 2026-11-14) - all pictures LOW 1K; first script under the owner's STORY rule:
- GOOD: LOW held up a fourth time: 8 pictures (hero, 2 guy pair sheets, operator close-up, building front/side pair, crane,
  props sheet, plate), 0 redos, 648.67 credits in all (voice 267.97, pictures 375.62, 1 sfx 5). A "front view + narrow side
  view of the same building, same height, side by side" 3:2 pair came out consistent: the 90-degree turn = squash the front's
  scaleX to side.w / front.w (easeIn) and swap to the side on the narrowest frame + a small spring. Reads as a real turn.
- GOOD: a crane picture with "a cable hanging down to an empty hook": erase everything left of the boom tip below it in prep
  (x < tip.x + 11, y > tip.y + 40, keep the biggest component) and draw the cable in code, so the ball can swing as a real
  pendulum (angle -> rope + rotated ball sprite, contact angle from asin of the gap to the wall).
- GOOD: free crowds again: the close-up operator sprite, tiny and clipped by each window (nested <svg> with overflow hidden,
  windows = pale-yellow components grouped in prep) fills a building with ~40 workers in one go; they pop in a cascade.
- GOOD: a "what-if" beat (one swing WOULD cut the calls) reads with: the ball stops at the wall, wire stubs dangle from the roof
  with sparks, the phone in a bubble stops ringing + "?" + crickets; a white poof on "So" rewinds it.
- GLITCH: Eye browTilt is in r * 0.25 units per unit, not degrees: -12 drew brows as long vertical sticks. Use -0.8 .. -1.3.
- GLITCH: the head fit (least-squares circle) failed on the pointing hero (the arm row was the widest); the inscribed disc of
  the hole-filled silhouette worked for all 5 poses this time. Check head numbers against the row widths before scaling.
- GLITCH: a broken wire whose ends fall to the far (off-screen) anchors simply vanished; keep the broken piece on screen
  (a stub hanging from the building with a spark).
- FIX in the improvement pass: a 0.55 s pan flagged by the pop scan -> 0.75 s; ground line lower (every wide key 35 units higher);
  push-in to the window starts earlier with a whoosh and the label leaves before it; MIX_DB 2 -> 4 (-6.4 -> -4.5 dBFS).
- TIMING: 48 words / 268 characters with "1930" took 18.72 s with Mark (~2.6 words/s, slower than the last videos: the story
  shape has more pauses - "The plan: ...", "said: ..."). With the story rule plan 44-46 words for <= 19 s.
- NETWORK: the session started on the Default environment again (no hosts); switched to the personal 'Work-Cloud-' environment
  (elevenlabsusercontent.com) with switch_environment before any download.
- RENDER: full 19.3 s render ~4 min here (CONC 4, swangle).

Video #14 (venice-piles, 2026-11-14) - all pictures LOW 1K; STORY rule:
- GOOD: LOW held up a fifth time: 7 pictures (hero, guy pair sheet, dig pose, tower on a magenta key, 5 poles in one 3:2 picture,
  a 3-object props sheet, square plate), 0 redos, 606.97 credits in all (voice 264.97, pictures 328.67, 3 sfx 13.33).
- GOOD: frame 0 = a side view with a school-diagram cut-away under the ground line (slab, wooden platform, poles in mud bands):
  the premise of the payoff (what is under the tower) is visible from the first frame, and the camera simply sinks into it.
- GOOD: a collapse = the sprite slides down inside an overflow-hidden box whose bottom edge is the ground line (easeIn, 0.42 s)
  + a merged dust PuffCluster arc + the rubble sprite growing from scaleY 0 + one prop (the bell) bouncing out. The rebuild for
  the loop = the same box in reverse behind a big white poof.
- GOOD: "five identical objects in a row" (poles) split into separate sprites gives five characters for one picture; sleeping =
  closed-eye arcs + a small 'o' mouth that breathes. The Eye component with lid 1 (grey lid fill) still read as OPEN eyes at small
  size: draw closed eyes as arcs.
- GOOD: an abstract fact as characters: "AIR" bubbles that drop down the dig hole, squash on the mud and bounce out; the last one
  squishes harder and pops on "air". A mushroom with a face lunges at a pole, then chokes ("> <", tongue), turns blue (CSS
  hue-rotate; keep the colour change <= 0.1 s or it passes through purple) and flops over.
- GLITCH: Zzz letters and cobwebs sized for a close-up were invisible in the 1.5x cut-away shot: size effects for the widest
  camera they appear in (Zzz 58 world px, web strokes 4.5).
- TIMING: 48 words / 266 characters with '1902' took 16.96 s with Mark (~2.8 words/s). MIX: raw voice peak -5.2 dBFS -> MIX_DB 1.
- NETWORK: the session again started on the Default environment; switched to 'Work-Cloud-' before downloading.

