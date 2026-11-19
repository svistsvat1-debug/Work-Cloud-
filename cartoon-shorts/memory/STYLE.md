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
- NOT A BIOGRAPHY OR CHRONICLE (owner, 2026-11-14): never "In 1788, X discovered...", "he was born", "after years of
  work he invented". Drop the viewer into a scene happening right now, like the first line of a tale: someone (you, the
  animal / object itself, a crew, a town) has a problem ("A tiny bird sits on four eggs. But one of them isn't hers.").
  Inventors / scientists appear only as a character inside the scene at the moment of the problem; at most one name or
  year, never as the first words.
- Then the plan / obvious solution -> "But" the obstacle -> "So" the clever turn (someone decides / tries something)
  -> the payoff as the story's ending, not as a stated fact. Present tense works best (also for history), one tense
  for the main line of events; narrated like telling a friend what is happening.
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


Video #15 (owl-pantograph, 2026-11-14) - all pictures LOW 1K; STORY rule, first <= 25 s story:
- GOOD: LOW held up a sixth time: 8 pictures (hero with binoculars, guy pair ears/thumbs-up, scissors pose, side-view bullet
  train front car, T-shaped roof arm smooth/jagged pair sheet, owl perched/flying pair sheet, row of 3 houses, plate), 0 redos,
  714.92 credits in all (voice 319.97, pictures 375.62, 4 sfx 19.33). A "smooth vs sawtooth-notched" pair sheet kept the
  notches readable even at LOW (small sharp triangles along one edge).
- GOOD: a long journey without a long world: the camera follows the train exactly (train fixed on screen) while sleepers,
  grass tufts and the plate scroll; only the visible stretch of rails / tufts is generated (cam.x +- 560/k). Faraway
  locations (houses down the line, the engineer, the owl, the workbench) are just far x offsets with hard cuts in pauses.
- GOOD: houses sprite with faces in its windows (window boxes from blue-glass components in prep) - but they hid behind the
  train: put background houses on a code-drawn grass berm (175 world px) so faces show above the train roof.
- GOOD: abstract physics in a magnifier: a clipped circle with a comb-edged feather; dashed white air lines flow in, tiny
  curls appear behind the teeth on "chop". A silent hunt = the owl steals the mouse's cheese, the mouse looks at empty paws
  "?" (no violence, reads instantly).
- GLITCH: a cheese wedge right in front of a left-facing mouse read as a yellow beak; keep props a body-width away.
  A PuffCluster made only of a ring of circles left an uncovered ink sliver in its centre: always add a central puff.
- FIX in the improvement pass: frame 0 / last frame pushed in (k 0.75 -> 1.0, the nose and the roof arm both in frame),
  the houses lifted onto a berm, the poof moved fully into frame; cover camera rebuilt (it pointed at old coordinates).
- TIMING: 60 words / 326 characters with '300' took 22.16 s with Mark (~2.7 words/s): the 25 s story fits 58-60 words.
- MIX: raw voice peak -6.4 dBFS, MIX_DB 2 gave -7.3 dBFS -> +3.3 dB re-mux (video copied) to -4.0. Next time MIX_DB 5.
- RENDER: Remotion's own Chrome download is blocked (remotion.media): set CHROME to
  /opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell. 4 CPUs: CONC 4
  (CONC 6 is refused). Full 22.6 s render ~3.5 min.

Video #16 (cow-eyes, 2026-11-14) - all pictures LOW 1K; STORY rule, 21.9 s:
- GOOD: LOW held up a seventh time: 7 pictures (hero painting, smug guy blowing on his brush, cow side view, cow from
  behind looking over her shoulder, lion sneak/walk pair sheet, lion face sly/shock pair sheet, savanna plate), 0 redos,
  652.64 credits (voice 303.97, pictures 328.67, 5 sfx 20.00). Animals in the same flat style came out consistent with
  STYLE_OBJ + "cute chubby cartoon ..." text; asking for "the rump plain white with no patch" left clean room for
  code-drawn eyes.
- GOOD: eyes drawn in code ON a sprite (svg overlay in the sprite's own pixel coordinates inside the Spr div) follow its
  squash / breathing for free. Closed = arcs, open = Eye; a blink with the Eye lid looked like grey discs -> blink as arcs.
- GLITCH: side-view animals side by side are very wide for 9:16: the first wide shot had the whole cast in a thin strip
  with half the frame empty sky. Fix: depth layout - the predator in the FOREGROUND (lower, bigger: ground y +260 world,
  scale 0.85) and the cow behind it (scale 0.6); a second row of grass tufts in front of the foreground.
- GOOD: close-up 'hiding in grass' = big code grass blades along the bottom edge + the face sprite sliding down 330 px on
  the key word (duck) - cheap and reads instantly. A cut to the reaction close-up in the middle of a phrase ("stare right
  back at it") worked better than waiting for a pause.
- SFX: the batch estimate priced 5 sfx at ~66, the charge was 20 (about 3.3 credits per second now).
- TIMING: 60 words / 304 characters took 20.96 s with Mark (~2.9 words/s).
- NETWORK: the session again started on the Default environment; switched to 'Work-Cloud-' before downloading.
- RENDER: CHROME = playwright headless shell (see #15); full 21.9 s render > 10 min here, run it in the background.

Video #17 (shipworm-tunnel, 2026-11-14) - all pictures LOW 1K; STORY rule; TRIAL voice Liam (owner's one-off request):
- GOOD: LOW held up a seventh time: 8 pictures (hero with a shovel, guy pair panic/plank-in-hands, guy pair point/cheer, shipworm,
  cut-open plank with a winding lined tunnel, cast-iron shield 'like an open bookcase with three floors', train front car on
  magenta, cut-away river plate), 0 redos, 675.6 credits for voice + pictures; all 14 sfx reused from the library (0 credits).
- GOOD: "drilling reveal" for 0 credits: in prep, fill the tunnel region of the plank (rows between the white lining pixels per
  column) with the median wood colour + a few grain lines -> plankFilled.png. In code show the real plank clipped LEFT of the worm
  head and the filled copy clipped RIGHT of it (CSS clip-path inset): the tunnel appears exactly behind the head.
- GOOD: a worm that follows a winding path = the head cropped from the picture (shell + a bit of body) rotated by the path angle
  + the body as an SVG stroke along the path (black stroke wider underneath, pink stroke, dashed darker rings, light highlight).
- GOOD: a set piece 'shaped like an open bookcase' keys its open floors through (enclosed key gaps): tiny hero clones stand in the
  floors as diggers. A brick tube = two brick rows drawn in code, revealed behind the moving machine.
- GOOD: a cut-away plate (river + banks + deep mud) gives frame 0 the whole premise; extend it sideways with flat bands sampled
  from its edge column. GLITCH: a flat sky colour next to the plate showed a visible vertical seam; use a vertical gradient
  sampled from the plate's edge column (top / middle / bottom).
- GLITCH: a camera branch switch (follow-shot -> pull-out) with ease 'out' started at full speed (pop scan flag at 17.17 s): use
  'io' when the move does not start on a cut. Signs / set pieces near the right edge got cut in the wide shot: check every
  wide key's left/right world edges (cam.x +- 540/k).
- TIMING: Liam (VCgLBmBjldJmfphyB8sZ, eleven_v4) read 58 words / 301 chars in 18.56 s (~3.1 words/s) - faster than Mark
  (~2.7). With Liam, a 21-24 s video needs ~65-70 words. Raw voice peak -0.5 dBFS; MIX_DB -3 gave a -6.5 dBFS mix -> -0.5.
- COVER: the first cover (wide shot, k 1.25) made the shield tiny; a closer camera (k 1.85) on the guy + shield fills it.
Video #18 (buzzard-wings, 2026-11-14) - all pictures LOW 1K; STORY rule; Liam voice; FIRST code music bed:
- LIAM PACE: 70 words / 372 chars (no digits) took 23.36 s (~3.0 words/s; #17: 3.1). A 70-word story fills 24.0 s with a 0.5 s tail:
  plan 65-68 words to keep a little room under the 25 s cap.
- GOOD: LOW held up again: 7 pictures (hero looking up, hanging pair worried/straining, crash + rope-pull sheet, buzzard flat/twisted
  pair on green, bat-wing glider + jet props sheet, biplane glider, dunes plate), 0 redos, 723.96 credits (voice 371.96, Scribe 0,
  pictures 328.67, 4 new sfx 23.33). A "two DIFFERENT poses in one 3:2 sheet" (crash + pull) split cleanly like a pair sheet.
- GOOD: an abstract force as a recurring character: a code wind cloud with a face (PuffCluster + Eye + cheeks) inhales (stretch,
  "> <" eyes, puffed cheeks) and blows (round mouth + white streaks with ink underlay) in every shot = "a gust" reads at once and
  ties the 4 shots together; it is also the loop link (frame 0 and the last frame both show it).
- GOOD: a front-view wing that "twists" for 0 credits: slice the sprite into left tip / middle / right tip (3 overflow-hidden divs)
  and rotate each tip about its inner edge; compute cable end points through the same transforms (rot helper) so code cables stay
  attached. Curved white arrows (TwistArrow) at the tips explain the twist.
- GOOD: a hanging character = pose sprite anchored at the measured fist point (topmost blobs), hung from the glider's bar point but
  drawn OUTSIDE the rotating glider so it stays vertical (gravity) while the glider rolls.
- GLITCH: code flaps on the jet (grey thin rects) were invisible in the first pass -> yellow, thicker panels + curved arrows.
  Notes ("calm whistle") at r 12 were too small for a 1.2x wide shot -> r 20. Brothers' head tops peeked in at the bottom edge after
  a push-in on the bird: check the frame edges of every push-in key (cam.y + 960/k).
- POP SCAN: slow bobbing sprites (< 0.5 px/frame on the 0.5x preview) snap by 1 px every few frames and get flagged at diff ~1.2;
  they are not visible pops. Only diff > 2 next to a swap or cut needs a look.
- MUSIC (scripts/music.py, first use): F major, 111 BPM picked automatically to land the "but"s and the punchline near beats;
  theme / uh-oh / build / theme back / final chord + glockenspiel ping; ducked -6 dB under words; bed RMS -23.5 dB under the voice
  (peak -27 dBFS). The bed is rendered in VIDEO time (its own 0.1 s lead-in), so it plays from frame 0. Next: try more melody
  variation in the build sections.
- MIX: Liam raw peak ~-0.5 dBFS; MIX_DB -1.5 gave a -4.7 dBFS preview mix -> MIX_DB -0.8.
- OWNER FEEDBACK (#18): "video great, music a bit louder" -> the default music level is now -18 dB under the voice RMS with -4 dB ducking under words (music.py keys under_db / duck_db). Remix without re-rendering the picture: node scripts/audio.mjs <Comp> out/mix.wav + ffmpeg -c:v copy (~30 s).

Video #19 (antarctic-trash, 2026-11-15) - all pictures LOW 1K; STORY rule; Liam voice; code music:
- LIAM PACE: 69 words / 330 chars (no digits) took 20.80 s = ~3.3 words/s (faster than #18's 3.0). Short plain words read
  fast: plan 70-74 words for a 23-24 s video, or keep 69 and accept ~21.5 s.
- GOOD: LOW held up again: 8 pictures (hero with bag, pull/dig sheet, shock/wave sheet, sled+bag props, cargo ship,
  research base, penguin judge/wave pair, sky plate), 0 redos. Magenta key for objects with white/blue (base, ship,
  penguin) was clean; small enclosed key gaps (radio-mast lattice) need a second pass in prep (kill_key_gaps: any pixel
  within 70 of the key colour -> transparent).
- GOOD: ONE side-view cutaway world (snow surface y = 0, ice shelf face, water, sea floor) drawn in code carries the whole
  story; the background plate is only the sky + mountains (cropped at its horizon line), tiled with mirrored copies on a
  depth-1.4 layer with a flat far-snow band below its horizon = parallax on every pull-out for 0 credits.
- GOOD: an object that comes alive (eyes on the ice face) + a big white outlined arrow on it explained "the ice is sliding"
  at a wide k 0.62 shot; without the arrow the slide did not read (improvement pass). A judging penguin (one pair sheet:
  judge / wave) gave a reaction in every shot.
- FIX in the improvement pass: framing was too wide at first (k 1.05 hook -> 1.3; wide shots k 0.52 -> 0.62); a
  supporting character hid behind the hero at the end of a move (check end positions vs. other sprites); the cover first
  showed 6 things (bases, penguin, "?!") -> a `cover` prop on Scene hides extras (rule of three).
- Rendering here: Remotion could not download its headless shell (no network to remotion.media); use
  CHROME=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell and CONC<=4.

Video #20 (sun-trash, 2026-11-15) - all pictures LOW 1K; STORY rule; Liam voice; code music:
- LIAM PACE: 70 words / 365 chars (two numbers written as words: "sixty-seven thousand", "fifty-five") took 23.20 s = ~3.0 words/s
  (#19 3.3, #18 3.0). Numbers as words slow Liam down: 70 words with numbers fill 23.8 s with the 0.5 s tail - the 25 s cap is close.
- GOOD: LOW held up again: 7 pictures (hero with bag, aim/shock sheet, pull/wave sheet, palm/thumb sheet, trash rocket on green,
  can+bag props, space plate), 0 redos, 726 credits (voice 369, Scribe 0, pictures 329, 6 new sfx 28). Three "two DIFFERENT poses"
  sheets = 6 poses for 3 pictures; all split cleanly.
- GOOD: a "little planet" world for space topics: Earth, Mars and the Sun drawn in CODE (flat discs + outlined continents/craters +
  one shade ring clipped to the disc) - they scale to any zoom (k 0.23 wide orbit .. k 1.85 hook) with no picture budget. Sprites
  stand on the round Earth: y = -sqrt(R^2 - x^2), tilt = asin(x / R).
- GOOD: the Sun's face slides toward where it looks (face centre = look * 0.55-0.8 R) and its features scale with a face-scale `fs`:
  0.6 in close shots (else the eyes are wider than the frame), 1.0 in the wide orbit. A crosshair RING around its face = "aim at
  the Sun" reads instantly and is the cover image.
- GOOD: real orbital physics cheaply: Kepler ellipse (solve E - e sinE = M with 6 Newton steps), focus at the Sun, aphelion turned
  to the launch direction, blended from the pad over 0.75 s; dashed trails = polyline of past positions.
- GOOD: abstract numbers as objects: a speed gauge with a yellow "FALL IN" zone the needle must reach; 1 can (Mars) vs a scrolling
  tower of cans with a running counter x1..x55 (Pow 1.4 count) - no fact needed beyond the script's numbers.
- GLITCH: Root.tsx import alias collision (ST_DURATION already used by shipworm-tunnel): the new composition silently got 19.4 s.
  Use a unique alias per Short (SUN_DURATION) and print durationInFrames after the first stills run.
- FIX in the improvement pass: rocket too small in the k 0.23 orbit shot (scale 1.7 -> 2.3); the gauge needle hardly moved on
  "lose" (easeInOut -> prog^0.85, it starts dropping on the word); a ring of 6 puffs around the spinning rocket read as a flower
  (-> a few small puffs trailing from the tail).
- MUSIC: C major, 117 BPM, stops on "But" and at the brake cut, ping on "system"; bed at -18 dB under the voice (owner level).
- MIX: MIX_DB -1 gave a -5.0 dBFS preview mix -> -0.2.

Video #21 (plastic-worms, 2026-11-15) - all pictures LOW 1K; STORY rule; Liam voice; code music:
- LIAM PACE: 70 words / 362 chars (no digits) took 22.85 s = ~3.06 words/s (#20 3.0, #19 3.3). 70 words = 23.45 s video: right under 25 s.
- GOOD: LOW held up again: 7 pictures (hero 'just tipped it out', shock/bored-sitting sheet, facepalm/point sheet, mealworm pair
  (happy / full asleep), foam-trash mountain, tub+flask on magenta, backyard plate), 0 redos, ~703 credits (sfx billed 12 for 3.6 s).
- GOOD: one simple world (guy, tub, mountain on the bran) + one screen-space close-up (x-ray magnifier over a 1.45x worm sprite with
  code bacteria) carried the whole story; code 'Bug' (green blob with Eye faces) works for anything microscopic.
- GLITCH: worm legs left dark-green key fringe between them (kill_key_gaps not enough): prep despill() = for objects with no green,
  pixels with G > R+15 and G > B+15 -> transparent. Two side-by-side copies of the bg plate showed a seam -> mirror the second copy.
- FIX in the improvement pass: white beard on a white guy read as a blob -> grey beard (#D3D8DE); white foam pill on white foam
  disappeared -> dark disc + yellow ring behind it; depth-of-field blur switched on abruptly at k 1.5 during pushes -> blur ramps
  with k (1.3..1.7); frame 0 pile too small -> starts at 72 % height; framing too wide (empty lawn) -> k 1.15.
- MUSIC: F major, 113.5 BPM, stop on "But" and at the x-ray cut, ping on "bacteria"; bed 18 dB under the voice. MIX_DB -0.5 -> -4.1 dBFS peak.
- NETWORK: again switched the session to the 'Work-Cloud-' environment before downloading from elevenlabsusercontent.com.

Video #22 (print-money, 2026-11-15) - all pictures LOW 1K; STORY rule; Liam voice; code music; owner asked to skip the approval stop:
- LIAM PACE: 68 words / 377 chars (numbers as words: "nineteen twenty-three", "two hundred billion") took 23.46 s = ~2.9 words/s.
  Numbers as words slow Liam down again (#20 3.0): with two spoken numbers plan <= 68 words for a 24 s video.
- GOOD: LOW held up again: 7 pictures (sad hero with empty wallet, cheer/push sheet, shock/warm-sitting sheet, printing press,
  bakery front on magenta, wheelbarrow+stove+loaf sheet, town-square plate), 0 redos; hero ran in the same batch as the rest
  (the locked look made a separate hero run unnecessary). Total 726.3 credits (voice 377, Scribe 0, pictures 329, 4 sfx 20.7).
- GOOD: a pun as the gag: the baker (cheer pose clipped behind the counter + code chef hat) literally RAISES the price board on
  "raises the price"; the board is an HTML div whose number flips 1 -> 2 -> 5, then rolls up log-scale to 200,000,000,000.
- GOOD: 'history moment' for 0 credits: CSS sepia() on the whole scene from "That's Germany" + a code wooden sign GERMANY 1923;
  a dusk overlay + a screen-blend radial glow around the stove door for the cosy ending.
- GOOD: one sheet with three different props (wheelbarrow / stove / loaf) split cleanly with split(k=3). A side-view pushing
  pose's fists matched the flipped wheelbarrow's handle height with no extra measuring (hands at ~0.4 of the body height).
- FIX in the improvement pass: frame 0 had the guy overlapping the printer's crank wheel (printer 760 -> 640 wide, guy moved
  left); the price board was cut by the frame edge in the push shot (board moved left, camera follows guy+480); stove scene was
  tiny at k 0.98 (-> k 1.22-1.31); printer steam puffs too small; the red X hid the firewood log (scaled to 0.72).
- MUSIC: G major, 114.5 BPM, stops on "But" and before the stove cut, ping on "firewood"; bed 18 dB under the voice. MIX_DB -0.5 -> -4.2 dBFS.
- RENDER: CONC=6 is refused on this machine (memory limit); CONC=4 works (0.5x preview ~1m45s).
Video #23 (sahara-solar, 2026-11-15) - all pictures LOW 1K; STORY rule; Liam voice; code music:
- LIAM PACE: 69 words / 347 chars (no digits) took 20.96 s = ~3.3 words/s (#21 3.06, #19 3.3). Short plain words -> fast: 69 words gave only a 21.56 s video; 72-74 words would fill 23-24 s.
- GOOD: LOW held up again: 7 pictures (hero thumbs-up, hot/shock sheet, rain-joy/point sheet, solar panel, lush/dry tree pair on magenta, camel bored/shocked pair, desert plate), 0 redos, ~708 credits (voice 355, Scribe 0, pictures 329, 5 sfx billed 24 of a 79 estimate).
- GOOD: ONE prop sprite cloned in perspective rows (scale from y: 0.38 + 0.62 * (y + 300) / 560, sorted by y with the guy/camel, popping out by distance from the hero) = "cover the whole desert" for 0 extra credits. Keep clear zones around the hero / camel only for rows that would overlap them (front rows below the feet can stay).
- GOOD: explaining albedo without words: two code sun rays - one bounces off the sand (white ring on impact, reflected arrow up), the other is swallowed by the dark panel, which opens eyes and gulps. Then heat squiggles + an orange drop-shadow glow on the panels + a light orange full-frame tint.
- GOOD: a second location as a pure CODE set (Amazon: hills, ground, river, trees = the tree pair sprite) behind a hard cut on "But" - cheap and reads instantly with a big AMAZON label.
- FIX in the improvement pass: the green-spreading ellipse was centred on the horizon line of the plate layer and grew with easeIn (nothing visible until late) -> centred at the hero's feet (plate-layer y ~ +400 below the horizon at the wide camera), easeOut growth; tufts pop when the edge reaches them. Reflected ray crossed the hero -> hero moved left, steeper rays. Rain over the payoff cluttered the face -> rain stops at 19.75 s. Cover camera k 1.05 -> 1.4.
- NOTE: Remotion's bundled ffmpeg cannot decode mp3; scripts/music.py must use the system /usr/bin/ffmpeg (do not put the compositor dir first in PATH). scipy had to be pip-installed again.
- MUSIC: C major, 117.5 BPM, stops on both "But"s, ping on "green", final chord on "up"; bed 18 dB under the voice.
Video #24 (iceberg-tow, 2026-11-16) - all pictures LOW 1K; STORY rule; Liam voice; code music; owner asked to skip the approval stop:
- LIAM PACE: 70 words / 355 chars ("two kilometers", "twenty" as words) took 22.16 s = ~3.16 words/s (#23 3.3, #21 3.06). 70 words = a 22.76 s video.
- GOOD: LOW held up again: 7 pictures (hero pulling a rope, shock/tired sheet, glass/strain sheet, tugboat, whole iceberg on magenta, desert city skyline on magenta, ocean plate), 0 redos, 700.6 credits (voice 347, Scribe 0, pictures 329, 5 new sfx billed 25 of an 82.5 estimate). Asking for the WHOLE iceberg 'including the part that would be under water' gave a perfect cutaway sprite.
- GOOD: a side-view sea cutaway with the water as a code overlay drawn ABOVE the underwater sprites: alpha 0.93 hides the bulk (only a ghost outline), tweening to 0.42 on 'hides under the water' reveals it - the 'but' turn for 0 credits. Sprite anchored at its waterline point so melting = uniform scale about the waterline.
- GOOD: a horizon city on the far plate layer (depth 1.25) must sit ABOVE the near props: put the plate horizon well above the near sea line (HORIZON -500 vs surface 0), else the city hides behind the tug.
- GOOD: one prop sprite cloned in back-to-front rows with shrinking scale = 'twenty ships' (+ a pop per ship and an x-counter).
- GLITCH: prep head_disc failed on a sprite whose rope touches both image edges (flood fill from the corner could not reach below the rope) -> pad the alpha by 2 px before floodFill (iceberg-tow/prep.py). numpy: a[yb:, 3] = 0 on an RGBA array indexes COLUMN 3 - use a[yb:, :, 3].
- GLITCH: clear glass on a green key keys out to a green tint -> glassfix() recolours greenish pixels to pale blue at alpha 150. The city sprite came with a drawn sea strip -> cut below the lowest sand row.
- FIX in the improvement pass: shore set framing too wide (half the frame was empty sand, guy cut at the edge) -> k 0.4 -> 0.47 and shifted right; the ending was a wide static shot -> push-in on the guy holding the empty glass after the berg disappears; the twenty tugs were tiny -> scale 1.75 -> 2.3 in 4 depth rows; 'HIDDEN' label cut by the frame edge -> moved onto the bulk; the Sun clipped at the top after raising the horizon -> lowered.
- MUSIC: F major, 119.5 BPM, stops on "But" and on the keel thud, ping on "ships", final chord on "water"; bed 18 dB under the voice. MIX_DB -0.5 -> -4.4 dBFS preview peak.
Video #25 (moai-walk, 2026-11-14) - all pictures LOW 1K again:
- GOOD: LOW held up a third time: 6 pictures (hero, guy pair A proud/rope-pull, guy pair B scared/stunned, 'close-up', moai,
  plate), 0 redos, 548.35 credits in all (voice 260, pictures 281.7, 2 sfx 6.7). A stone statue on a green key keyed clean;
  its empty eye hollows are perfect sockets for code eyes (Eye r 33/27 in native px, pop open on 'stone giants').
- GOOD: a tall statue that has to rock = rotate about the base corner on the tilt side (CSS rotate at the pivot point,
  inner div offset so the base centre sits at (+-half width, 0)); a waddle = alternate the pivot corner each step while the
  base centre eases forward; a rounded base = rotate about the centre of curvature (R 300) that rolls R*theta along.
  Rope ends are computed by rotating native points with the same transform, so ropes stay tied while it rocks.
- GOOD: 'the obvious answer' as a THOUGHT BUBBLE (HTML div, border-radius 50 %, overflow hidden, so a mini sprite can be
  clipped) that pops into a poof on 'But' reads at once and keeps the main layout. A wheel that bonks and falls flat
  (scaleY 0.18 about its bottom) + a red X, and a tiny code chicken for 'no big animals', made the hook line visual.
- GLITCH: the head-disc measure on the WHITE mask gave a too-small head for a big grin (proud: 128 vs 146): measure the
  inscribed disc on the hole-filled ALPHA silhouette instead (prep.py now does).
- GLITCH: the 'close-up' prompt again came out as a big-head full body; used as a medium reaction shot (feet on the road,
  head scaled to the full-body head height, k 2.9-3.15).
- GLITCH: long dashed angle lines (vertical + tilted) over a statue read as a ladder; a fat yellow curved arrow over the
  head reads 'leans forward' better. Step dust drawn too big reads as rocks/bread: keep puffs r ~15 and low.
- FIX in the improvement pass: an OLD ROAD sign (drawn behind the moai, pointing away) on 'old roads'; the rope shot pushed
  in (k 1.24 -> 1.4) and centred on the two pullers; the bubble poof tightened. From the first contact sheet: frame 0
  pushed in (k 1.7 -> 1.95); the wheel/X and the chicken kept inside the frame edges; the base close-up framed so the guy
  is whole (k 2.15).
- MIX: MIX_DB 4.0 gave -4.6 dBFS on the preview: no re-mux. TIMING: 48 words / 260 characters, no digits, took 16.86 s
  with Mark (~2.85 words/s). Sound Effects v2 billed 3.3 credits/s again (estimate 22, actual 6.67).
- RENDER: full 17.3 s render ~4 min (CONC 4, swangle).
Video #26 (tsunami-girl, 2026-11-16) - all pictures LOW 1K; STORY rule; Liam voice; code music; FIRST video from a SOURCE segment:
- GOOD: LOW held up again: 8 pictures (girl hero, girl pair shout/run, dad pair deck-chair/run, guard, tourist pair
  stare/panic, hotel, wave, beach plate), 0 redos, all keyed clean at dist < 60. The locked character took text-only
  'role' add-ons well: little girl = same character smaller + ONE red bow; dad = + straw hat + sunglasses; guard = + blue
  cap + whistle. Three tourists in ONE picture (and their panic version as the other half of a 3:2 sheet) = one crowd for 47.
- GOOD: one wide world (sea band behind, hotel off to the left) with the plate at PS 1.4 plus flat sky / sea / sand rects
  of the plate's own colours extending it sideways: a long pan to the hotel and a 0.5 wide shot cost no extra picture.
- GOOD: a thought bubble (PuffCluster) with a code TV whose screen clips a GRAYSCALE copy of an existing sprite (CSS
  filter grayscale + contrast) = 'an old film from class' for 0 credits. Doors: runners squeeze to scaleX 0 in 0.14 s at
  the door with a dust puff, then pop up on the roof.
- GLITCH: shore foam drawn as a row of circles read as a string of pearls/balls: a single wavy white stroke with a black
  under-stroke reads as foam. The flood rect appearing in one frame was a 36x pop: let water RISE from below the frame.
  A depth-of-field blur switched off in one frame pops too: always ease blur in/out.
- GLITCH: first contact sheet had the characters too small (k 1.25, 40 % empty sand): push in (k 1.4) and lift the
  camera so the feet sit at ~60 % of the frame height; big labels placed at the character x get cut by the right edge -
  place them toward the frame centre.
- LIAM PACE: 69 words / ~370 chars, no digits took 23.66 s = ~2.92 words/s (slower than #21-#24: many full stops and
  short sentences). 69 words with 10 sentences = a 24.5 s video; for 22-23 s keep ~62-64 words.
- MUSIC: G major, 111 BPM, stops on "But" and on "hits", ping + final chord on "dies"; bed 18 dB under the voice.
- SOURCE pass: YouTube blocked yt-dlp, youtube-transcript-api and storyboards from the cloud; vidIQ transcript (5 credits)
  was the only way to read the source; the visual pass was not available.
Video #27 (space-twin, 2026-11-16) - all pictures LOW 1K; STORY rule; Liam voice; code music; second video from a SOURCE segment:
- LIAM PACE: 70 words / 384 chars ("two" as words, 7 sentences, a colon) took 24.74 s of speech = ~2.83 words/s - the slowest so far
  (#26 2.92, #24 3.16). Many full stops + a colon = long pauses (0.4-0.56 s each). The take had to be FITTED: 6 pauses > 0.35 s
  cut to 0.25 s by loudness (-1.38 s, images/space-twin/fit.py, no tempo change) -> 23.39 s voice, 23.95 s video. For a
  story with 7+ sentences plan <= 64 words, or expect to fit the pauses.
- GOOD: LOW held up again: 7 pictures (hero side view, brother side/shock sheet, float/proud sheet, weak/press sheet, rocket on
  magenta, room plate, space plate), 0 redos, all keyed clean at dist < 60. 'Wearing only small round glasses' made the twin
  brother readable with no other change. 728.96 credits in all (voice 382, Scribe 0, pictures 328.7, 5 sfx 18.3).
- GOOD: StretchSpr (src/space-twin/Short.tsx) = a cut-out whose body STRETCHES: three clipped copies of one sprite (above the
  cut moves by d, a 24-40 px band is scaled to fill the gap, below stays) along y (standing) or x (floating). Cut just below
  the head (head centre + 0.98 r) so the face never distorts. Overlap the clipped boxes by 2 px or a hairline seam shows.
- GOOD: an abstract force as a living character: a purple GRAVITY block arrow with angry eyes, first as a dashed 'ghost'
  crossed out with a red X ("nothing presses down"), then real, dropping onto his head (thump + shake) and squinting while it
  squeezes him down. Height facts read through a wall: a dashed line at the twins' height + a red line and up-arrow '+2 IN'.
- GOOD loop: a full-screen '2 DAYS LATER' calendar card (HTML) hides the hard cut back to the frame-0 layout; the ruler drops
  flat onto both heads again on "twins" and a green check pops on "again" = last frame ~ frame 0.
- FIX in the improvement pass: icons (bone, bicep) were hidden behind the rocket at the frame edge -> moved above the head;
  '+2 IN' label cut by the right edge -> centred above the red line; the landing shot was half empty wall -> the cut camera
  centres the rocket, then glides to the twins; GRAVITY label covered the arrow's eyes -> moved to the shaft bottom.
- MUSIC: C major, 96 BPM, stops on "But" and on the arrow's thump, ping + home chord on "again"; bed 18 dB under the voice.
  MIX_DB -0.5 -> -3.5 dBFS final peak.
- SOURCE pass: again only vidIQ could read the transcript (5 vidIQ credits); yt-dlp / youtube-transcript-api blocked (403).
Video #28 (glass-rain-planet, 2026-11-16) - all pictures LOW 1K; STORY rule; Liam voice; code music; third video from a SOURCE segment;
owner asked for MORE drawings (smoother animation) and allowed up to 30 s for this one:
- GOOD: THREE-POSE 3:2 SHEETS work at LOW: "Three DIFFERENT poses of the same character side by side in one row, all three the
  same size, with wide empty gaps" gave 5 clean sheets (15 poses) + a 2-pose sheet + the hero = 18 character drawings from 7
  pictures (~47 credits per 3 poses), all keyed at dist < 60 and on-model with the text-only hero (swim goggles #5ACBF6/#1C7FBC +
  red #F1301D ring as a 'role' add-on). Each third is ~500 px wide: fine for full-body poses at a world head radius of 75-95.
  More drawings = every action beat gets its own in-between (crouch -> leap -> cannonball -> dive -> pinch -> starfish -> ...),
  swapped with squash on motion: the pop scan only flagged intended swaps/cuts.
- GLITCH -> FIX: LOW sometimes drops a stretch of outline (the 'hang' arm). prep.py fix_outline() paints a black band (2 px in,
  4 px out) wherever white/grey fill (rgb sum > 400, runs >= 12 px) touches the silhouette edge. Motion marks the model draws next
  to a pose are separate blobs: split_n() keeps the N biggest blobs of a sheet and drops the rest. "Waist-up close-up" came out
  full body AGAIN (3rd time): plan close-ups as full-body poses clipped by code (here: a porthole circle).
- GOOD (code gags, 0 credits): a cloud wipe (rising puff wall) hides the space -> sky cut; a thought bubble with a code icon +
  a red X stamped on the word makes an abstract "there's no X" line readable; turning the character green = a div with the
  sprite as CSS mask (WebkitMaskImage) + mix-blend-mode multiply (no new picture); a code umbrella that flips inside out.
- LIAM PACE: 67 words / 328 chars, 7 sentences, numbers in words ("five thousand") = 21.4 s of speech = ~3.13 words/s (#27 2.83,
  #26 2.92). No fitting needed; 67 words fit a 23.2 s video with a 1.7 s ending gag.
- MUSIC: G major, 118 BPM; stops on "But", "Sideways" and the window slam; pings on "eggs", home chord when the planet sleeps;
  bed 21.7 dB under the voice. MIX_DB -0.5 -> -4.1 dBFS final peak. MEASURE THE MIX PEAK ON THE STEREO DECODE (volumedetect or
  f32le stereo): an `ffmpeg -ac 1` mono read was ~3 dB too hot and cost one extra audio pass.
- SOURCE pass: this time yt-dlp auto-subs (free) and the YouTube storyboards (sb0 mhtml) worked; the video file itself still 403.
  Split the storyboard mhtml by its Content-length headers (python's email parser corrupts the JPEGs). Structure model read from
  a real transcript for the first time (Zack D. Films, 21M): the 'follow one tiny thing' journey shape mapped onto 'So you...'.
Video #29 (satellite-storm, 2026-11-16) - all pictures LOW 1K; STORY rule; Liam voice; code music; fourth video from a SOURCE segment;
owner allowed up to 30 s and asked for AUDIBLE background music:
- LIAM PACE: 82 words / 436 chars, 9 sentences, numbers as words ("forty-nine", "thirty-eight") = 27.46 s of speech = ~2.99 words/s
  (#28 3.13, #27 2.83). No fitting; 82 words = a 28.2 s video with a 0.6 s loop tail. For a 30 s cap plan <= 84 words.
- MUSIC LEVEL (owner, 2026-11-16: "the background music must be heard"): bed RMS 12 dB under the voice RMS, ducking only -3 dB
  (was 18-22 dB / -4..-6 dB). Use this as the default from now on unless the owner says it is too loud. Mix peak still -3.9 dBFS.
- GOOD: LOW held up again: 6 pictures (hero + 3 three-pose sheets + props sheet on magenta + space plate), 10 poses, 0 redos, all keyed
  at dist < 60. A 'role' add-on (black headset with a #424141 ear cup, measured on the hero) carried over to every sheet. A beach chair
  drawn INSIDE the pose pictures (all three chair poses on one sheet) stays identical between the poses.
- GLITCH -> FIX: the inscribed-disc head measure lands on the CHAIR in seated poses; prep.py ray_head() (rays on the upper arc -160..-20
  deg + least-squares circle, the heads2.py method) fits the head.
- GOOD: the AIR as a character: a translucent shell path whose radius gets two sine ripples (9 and 14 per turn) = rising dough, an opaque
  rim stroke + ink line on top, a face (Eye + cheeks) riding on the shell. LESSON: translucent orange over a navy sky reads BROWN - flip
  the hue in the first third of the heat ramp and raise the opacity to ~0.85 so 'hot air' reads orange.
- GOOD: an analogy line ("like a hand out of a car window") as a round inset bubble drawn in code (scrolling road, car body in FRONT of
  the pose sprite, roof arch BEHIND it, wind lines only behind the guy) = one seated pose from a sheet, 0 extra pictures.
- GOOD: satellites with code faces on the sprite (svg overlay in sprite px); edge-on = scaleY 0.28 (0.16 was unreadable); burning =
  CSS sepia/saturate/hue filter + lava-palette flame tail + a fading falling-star streak; survivors drift out so the end = frame 0.
- GLITCH -> FIX: poof puffs with a fixed ink width show as black dots while tiny -> scale the ink with the puff size. Too many wind lines
  hid the satellites -> thin them out after the turn and end the wind on the "it doesn't work" beat.
- RENDER: this machine has 4 cores: CONC must be <= 4 (6 crashes). Full 28.2 s render 1 min 24 s, 0.5x preview 43 s.
- SOURCE pass: yt-dlp auto-subs (web_embedded client) + storyboards from the -J metadata worked again (free); the video file was not
  offered. BRIGHT SIDE re-uploads compilations: 0:00-8:37 of HlirFKAVyY8 = 0:00-8:31 of xtqWGeG4NJA - check new links against SOURCE_LOG.
Video #30 (sun-vanish, 2026-11-17) - all pictures LOW 1K; STORY rule; Liam voice; code music; fifth video from a SOURCE segment:
- GOOD: role add-on 'sunglasses' measured on the hero (two round solid black lenses, each ~0.27 of the head width, thin
  bridge + one arm) and written into every prompt -> 9 on-model poses from 4 pictures, 0 redos. LYING poses come out best as a
  3-pose COLUMN sheet in a 2:3 picture ("stacked one above the other in one column ... head on the LEFT") - each pose
  ~700 px wide; split_n(axis='y') sorts them top to bottom.
- GOOD (0 credits): CODE 'TAN' COPIES of every pose in prep.py (white/grey fill -> #E9B07A / #D69660, outlines, glasses,
  tongue, teeth and eye glints kept; small white islands inside the head disc are skipped) drawn on top of the same pose with
  opacity = tan level, so he tans gradually without a cross-fade between different drawings. Pale 'raccoon' rings: eyes found
  as solid dark blobs inside the head disc (area 0.02-0.12 R^2, h >= 0.7 w, not above 0.35 R over the centre) and the fill
  inside an ellipse around each kept white. Reads instantly as "the last tan".
- GOOD: an abstract physics idea made visible: gravity as a ROPE + light as moving dashes; after the Sun vanishes the gap and
  the rope's slack travel outward at the SAME speed and reach Earth together; a HUD stopwatch (0:00 -> 8:20) stays on screen
  across the beach / space intercut and hits 8:20 exactly on "out". A snap burst + pop/boing marks the release.
- GOOD: beach plate at 1.35x with the camera at k 1.28-1.4 (plate <= 1.9x, sprites <= 0.75x) keeps the lying guy big; put the
  ground (towel) at ~62 % of the frame height, not lower (first try at 1722 left him tiny in the bottom third).
- NIGHT LOOK: a CSS brightness filter alone turned the sand muddy brown; brightness(0.62) + a '#34449A' multiply overlay on the
  background layer and a milder brightness(0.74) on the characters reads as a blue cartoon night.
- GLITCH -> FIX: a code thought-bubble demo must be BIG (hand ~80 px, stone r 30, cords 13 px) or it is unreadable at phone size.
- LIAM PACE: 69 words / 353 chars, 5 sentences, numbers as words = 21.42 s of speech = ~3.22 words/s (#28 3.13, #27 2.83).
  69 words fit a 23.0 s video with a 1.2 s ending.
- MUSIC: C major, 111.5 BPM; stops on "But" (crickets) and "out" (light-switch click); ping on "history"; bed 21.4 dB under the voice.
- SOURCE pass: yt-dlp metadata + auto-subs work with --extractor-args "youtube:player_client=web_embedded" (or mweb for
  subtitles) + --ignore-no-formats-error; the default client hits 'sign in to confirm you're not a bot'. Storyboards sb0 again
  (formats list of the web_embedded JSON); the video file itself is not offered. 0 vidIQ credits.
Video #31 (deep-dive, 2026-11-17) - all pictures LOW 1K; STORY rule; Liam voice; code music; MODE B source segment picked as the next episode of the channel's #1 winner (trench 27K); owner asked to skip the approval stop:
- LIAM PACE: 70 words / 393 chars, 8 sentences, numbers as words, a '...' pause = 26.88 s of raw speech = ~2.6 words/s - the SLOWEST take so far
  (#30 3.22, #28 3.13, #27 2.83). Fitted: 8 pauses > 0.35 s cut to 0.25 s (the '...' pause kept at 0.40 s) + atempo 1.05 -> 23.62 s
  (images/deep-dive/fit.py, tempo applied after the cuts, word times shifted and divided). For 8 short sentences plan <= 62 words.
- GOOD: LOW held up again: 7 pictures (3 three-pose sheets, craft, creatures sheet on magenta, 2 plates), 9 poses, 0 redos, all keyed at
  dist < 60. A role add-on 'small round black-rimmed glasses' (space-twin words) gave the second crew member on-model in one sheet.
- GOOD: a vehicle picture with 'one big round window ... a perfectly round EMPTY hole ... the flat green background shows through the
  hole' keys into a real hole: anything drawn BEHIND the sprite in a circle-clipped div (cabin + tiny crew poses) shows through the window.
  Measure the hole as the biggest enclosed transparent component that is about square (railing gaps are enclosed too).
- GOOD (0 credits): a code porthole close-up (steel plate + ring + bolts + rivets, glass glare arcs) with full-body poses clipped by the
  glass reads as 'inside the ball'; a code crack (polylines revealed by dash length, black + white glint) and a code milky fog (puff ring
  closing in + an alpha circle, group opacity follows the fog) carry the turn and the payoff. An instant photo slides in = the punchline.
- GOOD: an object character for an idea: a red AIR balloon with eyes crushed by pressure arrows ('> <' eyes, wobbly crumpled outline),
  then the same arrows bounce off the smug gasoline float = 'unlike air, it barely squeezes' in one beat.
- GLITCH -> FIX: the first fog version covered the window completely, so the guy raising the camera and the flash were invisible:
  let the fog thin to ~55 % after the 'milky' word, put the flash ABOVE the fog. The bottom plate ended above the frame bottom when the
  camera zoomed out: always extend the floor colour below a plate.
- IMPROVEMENT PASS: frame 0 pushed in (k 1.05 -> 1.2, the float just fits the width) so the crew in the window read; the sea cucumber
  hops with a '!' on the landing thump; the camera flash got a yellow burst over the fog.
- MUSIC: F major, 114 BPM; stops on "But", on the bang and in the pause before "not one photo"; ping + home chord on "photo";
  bed 13 dB under the voice, ducking 3 dB (owner: the music must be heard). MIX_DB -3 -> -4.2 dBFS final peak (voice take peaked 0 dBFS
  after atempo; measure on the stereo decode).
- SOURCE pass: yt-dlp -J (web_embedded + --ignore-no-formats-error) gives the caption URLs; downloading the en-orig json3 with urllib
  worked (yt-dlp --write-auto-subs with mweb hit 403). Storyboards sb0 fragments download directly from the -J formats list.
  Our own channel's views: `yt-dlp --flat-playlist --print "%(id)s|%(title)s|%(view_count)s" https://www.youtube.com/@whyzap1/shorts` (free).
Video #32 (shark-storm, 2026-11-17) - all pictures LOW 1K; STORY rule; Liam voice; code music; sixth video from a SOURCE segment (MODE B):
- LIAM PACE: 68 words / 379 chars, 7 sentences incl. a question and a 5-word fragment, no digits = 23.98 s of speech = ~2.84 words/s
  (as slow as #27; #30 3.22). Short sentences + a question = long pauses (0.4-0.56 s). 68 words fit a 24.7 s video with a 0.6 s
  loop tail, no fitting. For 7+ short sentences plan <= 64 words if the ending needs more than ~0.6 s.
- GOOD: LOW held up again: 6 pictures (hero + 2 three-pose guy sheets + a 3-pose BABY SHARK sheet + a big-shark PAIR + bay plate),
  0 redos, all keyed at dist < 60; 679.00 credits. Role add-on 'big over-ear headphones (#3F3E3E cups ~1/3 head width)' measured on
  the hero carried over to all 6 sheet poses. A pose that HOLDS A PROP (hugging a wooden post, body blown out like a flag) is one
  drawing: anchor it by the prop (post bottom on the dock) - prep measures the prop's brown pixels.
- GOOD: animal sheets work like character sheets: "three DIFFERENT poses of the same small baby shark ... calm / scared / zooming"
  gave matching sprites (motion marks dropped by split_n); an object-colour tag (orange) is found in prep and drives code FX
  (ping arcs on each tag). 14 clones of 3 sprites (scale 0.26-0.34, mixed facing, bob + wiggle) = a school for 0 credits.
- GOOD: ONE side-cutaway world (sky / dock / water / sloping sand) at PS 1.6 + code rects that extend its edges; day -> night ->
  storm -> flashback night -> day are all code looks on the same plate. NIGHT: plate brightness 0.8 + '#34449A' multiply at 0.62,
  sprites brightness 0.9 (0.64 / 0.85 / 0.76 made the sand charcoal and the guy grey). STORM: '#6E7F86' multiply 0.8 + puff cloud
  with Eye faces + code rain / waves / lightning + a white flash. A flashback = white-flash cut + an 'EARLIER' tag.
- GLITCH -> FIX: shared Eye's browTilt is a MULTIPLIER (~0.9), not degrees (22 drew long black lines); angry lids = lidTilt -24 with
  side +-1. White-face measure (largest disc of the hole-filled white region) equalises head sizes better than the silhouette disc
  when the ear cups / hands widen the head. Close-ups that push the plate past 2x: blur the plate layer (3 px) for that shot.
- FIX in the improvement pass: the exodus school clumped ON the big shark's body -> waypoints under its nose + a wider start stagger
  (a stream); the 'hiding' line had no action -> the 4 babies nearest the deep back away scared when the shark appears; tags moved to
  the bottom of the frame (they covered the guy's head); cover text moved beside the guy, big shark + sign hidden (rule of three).
- MUSIC: F major, 111.5 BPM; stops on "But" and at the WEEKS LATER cut; glock pings on "beeping", home chord at 24.18; bed 15 dB under
  the voice (between the owner's 'audible' 12 dB and the prompt's 22-26 dB), ducked 4 dB. Mix peak -3.8 dBFS (MIX_DB -0.5).
- SOURCE pass: yt-dlp web_embedded metadata + auto-subs + storyboards worked again (free); the model's captions hit 429 / IP block.
Video #33 (megalodon-trench, 2026-11-17) - all pictures LOW 1K; STORY rule; Liam voice; code music; MODE B source segment (approved card):
- GOOD: an ANIMAL as the doer works with the same recipe as the guy: a megalodon hero (3:2, 0 redos), then its measured look written into
  the text block (back #456075, fin shade #30485A, belly #E9E7EA + #BBBBC1 shade, ~4.4x as long as tall, six gill slits, nostril dot)
  -> two 2:3 COLUMN sheets ("three DIFFERENT poses ... stacked one above the other in one column, each seen exactly from the side facing
  to the RIGHT") gave 6 on-model long side views (~920 px long each). Swap anchor for side-view fish = (snout - 0.18 L, head top at that
  column + 0.11 L), scale by the length L: an onion-skin sheet (qa/onion.png) showed the poses line up within a few %.
- GLITCH -> FIX: mirroring a pose about its head anchor threw the body off-screen; flip it about the BODY CENTRE
  (translateX(-0.32 * world length) before / after scale(-1, 1)) - turning left / right on "Not one" then stays in place.
- GOOD (0 credits): a cutaway plate + a FOREGROUND layer cut from the same plate (rock + outlines below the ledge, made in prep) drawn over
  the diving shark = it slips BEHIND the trench walls into the dark. A long descent = a hard cut into a code canyon (two jagged wall
  polygons from sums of sines in the plate's rock colour + black edge + crack polylines) that blends into the bottom plate's wall edges,
  a screen-space DEPTH HUD driven by the shark's world y, drifting marine-snow specks, and a vignette that darkens with depth.
- GOOD: the guy as the witness in a code yellow sub (screen space, it "follows"): full-body poses clipped by the round window (head r ~47 px),
  a lamp beam (linear-gradient polygon) aimed at the shark keeps it readable in the dark. The binoculars pose on "who'd ever look?" is the gag.
- GOOD: X-ray = the sprite as a CSS mask filled with blue at 0.86 + a code spine and a big yellow liver that pops on "giant"; a code
  pool-float valve on "float". Abstract biology became one readable beat.
- GLITCH -> FIX (improvement pass): the silt splash as small outlined circles read as a row of balls -> few BIG overlapping puffs that billow
  up; yellow squiggle "rumble" lines read as a plant -> a shaking "GRRR..." text; labels hidden under the screen-space sub -> moved; the
  bottom plate ended at x 1080 and the camera saw a dark gap beside the floor -> silt + rock fills on both sides, rock only down to the floor.
- LIAM PACE: 67 words / 374 chars, 7 sentences incl. a question and a 2-word fragment = 24.86 s of raw speech = ~2.70 words/s (#32 2.84,
  #31 2.6). Fitted by shortening 5 pauses > 0.35 s to 0.25 s (0.30 s after "Not one."), -1.06 s, no tempo change -> 24.6 s video.
  With 7+ short sentences plan <= 62 words, or expect to fit the pauses.
- MUSIC: G major, 119.5 BPM; stops on "But", on "Not one" (crickets) and on the landing; glock ping + home chord on "long"; bed 15 dB under
  the voice, ducked 4 dB; mix peak -3.8 dBFS (MIX_DB -0.5).
- SOURCE pass: reused the SOURCE_LOG segment map (free); captions (web_embedded json3) + storyboards sb0 for the 5-point originality check
  and the wow frame. Sound Effects v2 again billed ~3.3 credits/s (estimate 11/s): 4 new sfx cost 12.
Video #34 (buried-nuke, 2026-11-17) - all pictures LOW 1K; STORY rule; Liam voice; code music; first video from a COMPETITOR-proven topic (owner: "my topic that took off + similar competitor topics"):
- LIAM PACE: 65 words / 334 chars, 5 sentences incl. a question and a 2-word fragment, numbers as words = 21.28 s of speech = ~3.05 words/s
  (#32 2.84, #30 3.22). 65 words gave a 22.4 s video with a 1.0 s loop tail: there is room for ~70 words with 5 sentences.
- GOOD: LOW held up again: 6 pictures, 0 redos, all keyed at dist < 60. Role add-ons per SHEET work: a straw-hat sheet (farm owner)
  and a hard-hat sheet (worker) are the same channel character in two roles; the hero = the straw-hat role. A plant pose with a GREEN
  seedling needs a MAGENTA key (and despill magenta, not green, in prep).
- GOOD: an object sheet (bomb / shovel / signpost, magenta key) worded neutrally ('a big fat rounded metal capsule ... like a chubby
  torpedo with four tail fins') passed the content filter; faces are code Eyes inside the rotated sprite (Spr children = SVG in sprite px).
- GLITCH -> FIX: the plane came out as an airliner with a row of cabin windows: prep paints the window strip (rows 474-512 of the
  keyed 1536 px sheet) with the body colour -> reads as a bomber. Prompt next time: 'no windows except the cockpit'.
- GLITCH -> FIX (pipeline): prep_lib.py hard-coded OUT = shark-storm and overwrote another video's sprites when exec'd after the
  new OUT was set; now it keeps an OUT defined before the exec. Always set OUT before exec(open('prep_lib.py').read()).
- GOOD (0 credits): a code plane split = two clipPath halves along a jagged polyline + an ink edge, halves drift/rotate apart with
  merged-outline smoke puffs; a parachute that rips into two rags; a HUD speed gauge counting to the spoken number; a hole that deepens
  (clods + growing dirt pile) and floods (water rect + seep drops); a beach thought bubble as the 'like...' analogy; a depth arrow with a
  'not to scale' break mark; a red dashed 5 FT line + sign for the punchline.
- IMPROVEMENT PASS: frame 0 pushed in (k 1.0 -> 1.1) and the plane started nearer the centre so the premise reads; the broken halves
  slowed down (they had left the frame by 2 s, leaving a dead hold); a '!' on the farmer at the break; the $1,000 bill moved off his face;
  the NORTH CAROLINA card moved from the frame edge to the sky centre and hidden before the bomb drops; the beach bubble moved off the
  worker's head; sky colour extended above / beside the plate (a navy strip showed at the top).
- MUSIC: G major, 116 BPM; stops on the impact (0.25 s) and on "But" (0.45 s); ping on "feet", home chord 21.5; bed 15 dB under the voice.
Video #35 (coral-castle, 2026-11-17) - all pictures LOW 1K; STORY rule; Liam voice; code music; MODE B source segment (approved card):
- LIAM PACE: 66 words / 337 chars (67 spoken, 'nine-ton'), 8 sentences incl. a one-word 'Alone.', no digits = 23.4 s of speech = ~2.87 words/s
  (#34 3.05, #33 2.70, #32 2.84). 67 spoken words fit a 24.4 s video with a 0.9 s tail, no fitting. Plan ~2.85 w/s for 7-8 short sentences.
- GOOD: LOW held up again: 7 pictures, 0 redos, all keyed at dist < 60 (691 credits). A role add-on measured on the hero ('small dark brown
  felt hat #704428 / band #3A2214') carried over to the 3-pose sheet. A WALL set piece with 'one empty rectangular doorway gap ... the green
  background shows through the gap' keyed into a real hole: prep measures the gap columns + the lintel row, and the gate sprite is scaled
  non-uniformly (sx/sy) to fill it exactly. A crane picture with the cable + hook: prep cuts the hook into its own sprite and erases the
  cable, so code draws a cable that lowers / lifts the hook (and the gate on a sling).
- GOOD (0 credits): a camera FLASH (white, 0.07 s up) hides a cut into an OLD PHOTO: the whole world in CSS sepia, the container rotated
  -2.5 deg and scaled 0.93, an evenodd SVG 'table' mask with a white border + tape, a radial vignette + scratches inside. Exit = the frame
  overlay scales up past the camera (1 -> 2.7, easeIn) while sepia -> colour: 'flying through the photo', no fade (the first version faded
  the mask and read like a cross-fade).
- GOOD: physics as one picture: a LONG red arrow beside the hand chain + a LITTLE green arrow beside the rock; the hand chain's dash offset
  runs fast on each pull while the load chain creeps. Telephone poles = brown poles + a crossarm with two green glass insulators popping on
  'telephone'. A 3D spin of a flat slab: front face width |cos|, a side rect of the thickness |sin| (box projection), motion arcs (ellipse
  polylines) + dizzy stars after it stops.
- GOOD: '6 men' as a count: the workers pop one by one with yellow numbers over their heads (back row pushers in a conga, front row haulers
  mirrored, a rope to the gate). Their pop order must match the reading order: here it read '3 2 1' left to right (the first pusher stands
  at the gate) - next time number from the left or put #1 on the left.
- GLITCH -> FIX: the first framing put the feet at ~64 % of the frame and left the bottom third as empty grass: aim the camera so the feet
  sit at ~78-80 % (cam.y = feetY - 0.3 * 1920 / k). A night moon drawn UNDER the multiply overlay turned grey: draw sky objects above it.
  A tripod leg crossed in front of the guy: keep the character outside the props he operates. Labels near the frame edge were cut: keep
  text centres >= 300 px from the edges at the shot's camera.
- MUSIC: F major, 110 BPM; stops on both 'But's (camera flash, 1986); ping on 'crane', home chord 23.6; bed 15 dB under the voice, ducked
  4 dB; final mix peak -4.0 dBFS (MIX_DB -1.3). The 6 new Sound Effects v2 cues billed 25 credits for 7.7 s (~3.3/s); Scribe billed 0.
- SOURCE pass: the newest 90 uploads of the source channel are space clickbait; older topics (Egypt, pyramids) are found with the channel's
  own search (`yt-dlp --flat-playlist "<channel>/search?query=..."`, free); compilation videos may not contain their title topic (the
  granite-cutting answer was only in the description) - read the transcript before building the segment map.
Video #36 (titanic-cover, 2026-11-18) - all pictures LOW 1K; STORY rule; Liam voice; code music; MODE B source segment (approved card):
- LIAM PACE: 63 words / 343 chars, 8 sentences incl. a 3-word fragment ('Twelve days left.') and two colons, no digits = 23.04 s of speech
  = ~2.73 words/s (#35 2.87, #34 3.05, #33 2.70). Colons and short fragments slow Liam down: 63 words filled a 23.8 s video
  (0.6 s tail), no fitting. With 8 sentences plan <= 64 words.
- GOOD: LOW held up again: 9 pictures, 0 redos, all keyed at dist < 60 (a 9th picture fit the plan: 343 + 9 x 47 + sfx + reserve
  <= 870). Two role caps in one video (navy watch cap = the hunter, white peaked cap = the officer) read as two people. The cap
  measured on the hero ('#213C69 / #142744') carried over to both hunter sheets. Prompting 'a plain dark-red book, no title'
  gave clean covers for a code title.
- GOOD (0 credits): a code prop held over a sprite's hands (manila folder + TOP SECRET stamp), a code title + tiny ship on the
  sprite's plain book cover, and a green TRUE stamp at the end that mirrors the red TOP SECRET stamp at the start. A robot
  camera sled with two big lenses = eyes for free (code glints, yellow lids, brows on the lens discs). A lamp cone = a blurred
  black triangle in an SVG mask cut out of a dark overlay inside the World layer: give it an ANGLE and aim it at the subject's
  centre (the first version lit only the floor). A top-down chart (search lines 1 MILE apart, a dotted trail, a sweep ping)
  explained the search trick in 2.4 s.
- GLITCH -> FIX: the held folder covered the hunter's face for 4 s (and on the cover) -> hold props beside the face; the stamp
  text overflowed its frame ('TOP SECRE') -> font 0.118 x the folder width; a zoom-out to k ~0.19 showed the edges of the
  background rects -> make background rects huge (+-9000); at k 0.19 small debris vanished -> scale bits 1.4x + code debris.
- IMPROVEMENT PASS: the wreck reveal was too dark -> lamp aimed at the middle piece, overlay -18 % when the lamp is on, the
  radiation sign pulses; the mile-long trail shot reframed (floor at ~65 %, bigger debris, 150 px '1 MILE+'); the dozing /
  jumping hunter in the control room 1.32x bigger. Flashes: full-frame white only on every other flash (never 3 in 1 s).
- MIX: measure peaks per channel (ffmpeg -ac 2 -f f32le); a mono downmix (-ac 1) reads ~3 dB hot. MIX_DB -0.3 with a raw Liam
  peak of -0.6 dBFS gave -4.1 dBFS per channel.
- MUSIC: C major, 102 BPM; stop on "But" (the cut to the ship), uh-oh under the dive and the 12 days, build under the replay,
  ping on "true", home chord 23.3; bed 15 dB under the voice, ducked 4 dB. 4 new Sound Effects v2 cues billed 19.33 credits.
- SOURCE pass: the channel search ('<channel>/search?query=titanic') found the video; nuclear topics are almost absent on the
  source channel, so the nuclear part came from verified sources (NatGeo, WHOI, History.com, CNN). Captions free (web_embedded
  json3), storyboards sb0. 0 vidIQ credits.
Video #37 (moai-hats, 2026-11-18) - all pictures LOW 1K; STORY rule; Liam voice; code music; MODE B source segment; the owner asked to skip the approval stop:
- LIAM PACE: 65 words / 326 chars, 7 sentences, no digits ('twelve-ton' as a word) = 19.18 s of speech = ~3.39 words/s - the FASTEST take so far
  (#36 2.73, #35 2.87, #34 3.05). Short plain words, few colons / fragments -> Liam runs fast: 65 words gave only a 20.0 s video. With a text like
  this plan 72-76 words for 22-24 s; with colons and 2-3-word fragments keep the old ~2.8 words/s estimate.
- GOOD: LOW held up again: 6 pictures, 0 redos, all keyed at dist < 60 (the hero kept a tiny enclosed green speck between the feet - the prep
  despill removed it). Two 3-pose sheets (3:2) at RH 92 came out at 0.67-0.88 of native = crisp. ONE object sheet with BOTH views of the same object
  (the hat upright, side view + lying, seen end-on as a circle) let the hat 'tip over toward the camera': squash the side view in Y to 0.08 about
  its bottom, swap, stretch the end-on disc up from 0.08 with a spring - reads as a flip, no 3D needed. Same trick backwards for the flop onto the head.
- GOOD (0 credits): a dashed 'ghost' outline of the goal object (white dashes over a faint black under-stroke + 28 % white fill) on the giant's
  head explains 'want to crown' at a glance; re-used on a second giant as a callback that deflates on the sad line. Code eyes inside the moai's
  eye hollows (shared Eye, brow NaN) bring the statue to life; lookAt(world point) keeps its pupils on the moving hat.
- GOOD: parbuckling in code: rope = stake -> along the ramp top -> down the slope -> SVG arc around the downhill side of the disc from the contact
  angle to the tangent toward the pullers' hands (tangent angle = atan2 +- acos(R/d), take the higher one) -> through the three pullers' hands; a
  dashed overlay on the pulled part runs at 2x the hat's rolled distance (the 2:1 shown, not told).
- GLITCH -> FIX: easeInOutCubic on a long climb = 3x peak speed in the middle (pop-scan flag; the 1/2 badge also rode the moving rope midpoint)
  -> a 'haul' easing with a linear middle (short ease in/out, continuous speed) + the badge at a fixed world point. A camera key in the middle of a
  follow move stops the camera for a frame (zero speed at the key) -> drop the key. The pullers' lean snapped back when 'pulling' went false ->
  multiply the lean by an envelope.
- LAYOUT: a 55 deg ramp up to the head of a full-size moai is ~2,600 world px wide and only fits a 9:16 frame at k ~0.4 (tiny figures, lots of sky)
  -> open that shot with a fast pull-back from the head (ease 'out') while the ramp rises, then follow the hat up and in (k 0.41 -> 0.6). A pusher
  needs flat ground behind the object: give the ramp a long flat top (1,000 px) and cut to it for the shove.
- MUSIC: G major, 100.5 BPM; stops on 'But' and on 'though' (under the sad trombone); ping on 'head'; home chord 19.0; bed 15 dB under the voice,
  ducked 4 dB; final mix peak -4.1 dBFS per channel (MIX_DB -1.1). 4 new Sound Effects v2 cues billed 15.33 credits for 4.6 s (3.33/s).
- SOURCE pass: the channel search ('<channel>/search?query=ancient|pyramid|egypt|roman|...') found two Easter Island compilations that share most of
  their narration (oTUy9NtDAjY, 0I8nvgHtDLM); the hats are only mentioned there - the answer came from the 2018 study. Captions free (web_embedded
  json3), storyboards sb0. 0 vidIQ credits. Remotion: --concurrency max 4 on this machine (CONC=4).
Video #38 (sunken-lunch, 2026-11-18) - NO NEW PICTURES (fallback like #10); STORY rule; Liam voice; code music; MODE B source segment (card from the first session, produced in a second session):
- BLOCKED AGAIN: the ElevenLabs connector failed to connect (HTTP 400, CLIENT_HTTP_NOT_IMPLEMENTED, retried with backoff) and the REST
  image endpoint POST /v1/flows/image answered 402 "This endpoint requires a Pro plan or above" (validation runs first: an invalid body
  gets 422, a valid one gets 402; nothing is charged). The public API has gpt-image-2.5-sunburst with quality low / 1K / 2:3 (schema in
  /openapi.json), so images/sunken-lunch/el_image.py will work as is once the account has a Pro plan.
- REST works for the rest (proxy injects the key): TTS /v1/text-to-speech/{voice}/with-timestamps (eleven_v4, Liam): 350 chars cost 154
  (header Character-Cost; /v1/history shows character_count_change_from/to) - less than half the Flows price; the response alignment gives
  exact per-character times of the text sent (matched Scribe within ~0.1 s). Scribe /v1/speech-to-text (scribe_v1): 7. Sound Effects
  /v1/sound-generation bills ~11 credits/s (1.2 s = 13), NOT the ~3.3/s seen through Flows. /v1/user/subscription times out or 500s here.
- LIAM PACE: 63 words / 350 chars, 10 sentences incl. 4 short fragments ('The sandwich doesn't.', 'Almost fresh.', 'Cold, right?') =
  22.64 s of speech = 2.78 words/s (#37 3.39, #36 2.73). Fragments + a question keep Liam slow: ~2.8 words/s is the right estimate for them.
- GOOD (0 credits for pictures): the library holds ~230 finished guy poses; pick poses with r/h 0.20-0.26 and equalise the head radius
  (r_world / hd[2]). A second role without a new picture: the round-glasses guy (deep-dive b_*, space-twin, nuclear-warning nerd) = the
  scientist. Contact sheets of public/*/ (tools: a 12-column grid with head-disc measures) make the casting fast.
- GOOD: code objects carry a whole story: an Alvin-like sub (egg hull + orange tower + portholes + duct prop + skids), a sandwich with a
  face (bread/lettuce/bologna layers, bites as an SVG mask, wet/mould tints clipped to the layer paths - a tint rect leaked as a blue box),
  germs (wobbly blob + cilia + Eye + chomping toothy mouth), a code beard (shape anchored under the mouth, per-pose offsets in head radii)
  = '10 months later' in one look. Occupants in a hatch: clipPath at the hatch line inside the sub's transform + the rim's front half on top.
- GLITCH -> FIX: SVG <image> elements do not hold the frame like Remotion's <Img>: right after a cut the lab plate and the fridge were
  missing in 2 frames (pop-scan flagged an alternating 33/1.7/35 diff). Fix: an SImg wrapper (delayRender in useState, continueRender on
  onLoad/onError, key={href} so a pose swap waits again). Use it for every SVG image from now on.
- GLITCH -> FIX: foam splashes made of outlined circles read as piles of balls; a cartoon water CROWN (a sheet path with 5 spikes,
  light-blue inner arc, teardrop drops) on BOTH sides of the hull reads as a splash. A big ship sprite cannot share a frame with
  readable characters (the guy at head r 60 needs the ship at ~2.5x its native pixels): draw the deck/stern/crane in code instead.
- IMPROVEMENT PASS: the depth reveal (2-3 s) was empty bands -> a bold outlined dashed arrow that ends INSIDE the wide frame + fish crossing
  the deep; the crew leaps were tiny -> tighter frame (k 1.0) and shorter arcs so all three land in frame; the 10-months shot pushed in
  (k 0.98 -> 1.3) so the sleepy sandwich and the fish in the hatch read.
- MUSIC: C major, 103.5 BPM; stops on 'snap', 'But' and before 'So'; glock pings on 'fresh' and 'purpose', home chord 22.82; bed 15 dB
  under the voice, ducked 4 dB; final mix peak -3.99 dBFS per channel (MIX_DB -1.5).
Process lesson 2026-11-19 (duplicate #38): before creating the ElevenLabs flow in phase 2, ALWAYS `git fetch origin main` again and re-read VIDEOS_LOG / SOURCE_LOG on origin/main - another session (started by the owner in parallel) may already have produced the same card. Skipping this check made #38 twice (229 + 697.63 credits). The second version (branch claude/whyzap-sunken-lunch) is useful as a reference for new-picture tricks: a SubRig with a hatch occupant clipped at the rim, a front water layer, a foreground screen-space guy in a close-up, a magnifier callout, a three-state props sheet (fresh / soggy / rotten). In the Default cloud environment the ElevenLabs connector came up only after a session restart, and generated files need the host elevenlabsusercontent.com (now allowed in Default).
