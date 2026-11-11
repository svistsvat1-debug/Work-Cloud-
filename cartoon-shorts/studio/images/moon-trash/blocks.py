# Locked blocks from memory/STYLE.md (word for word) - every prompt = subject text + block(s)
STYLE_CHAR = ("Flat 2D cartoon: a simple white character with a big round head, a small soft body, noodle arms with simple four-finger hands and short legs with rounded feet, "
"thick smooth black (#000000) outlines of even weight, about 2 % of the head width thick, flat white fill (#FEFDFD) with a very soft pale-grey shade (#EDEBEB) on the left side of the head and body, "
"the round head is wider than the body and about 0.38 of the full body height, small solid black vertical oval eyes about one sixth of the head width tall, simple curved black eyebrows, "
"no nose, no hair, no clothes, a pink tongue (#FC8D90) only when the mouth is open. Clean vector-like linework, flat colours, no texture, no text, no border.")
STYLE_OBJ = ("Flat 2D cartoon in the same drawing style: thick smooth black outlines of even weight, flat colours with one simple soft shade, clean vector-like linework, no texture, no text, no border, no characters.")
KEY = ("Isolated on a perfectly flat, uniform, solid pure green (#00FF00) background that fills the whole picture edge to edge: no shadow, no ground, no floor line, no gradient, no vignette, no border, no other objects. The whole subject in frame with a clear margin on every side.")
KEY_M = KEY.replace("pure green (#00FF00)", "pure magenta (#FF00FF)")
STYLE_BG = ("Flat 2D cartoon background in the same drawing style: big simple flat-colour shapes, thick smooth black outlines only on the main shapes, no texture, no text, no labels, no arrows, no characters, calm and simple so a character reads clearly on top of it.")

P = {}
P['hero_hold'] = ("Full body, three-quarter view facing to the right, standing straight, head tilted up, looking up and to the right at something high in the sky. "
"Curious, cheerful expression: eyebrows raised, small happy open smile. The hand on the RIGHT side of the image holds a black tied garbage bag by its knot at hip height; "
"the other hand hangs relaxed. Whole body in frame with a margin. ") + STYLE_CHAR + " " + KEY
P['windup'] = ("Full body, three-quarter view facing to the right, leaning back in a big wind-up to throw something high up into the sky: the arm on the LEFT side of the image swings back and up, "
"holding a black tied garbage bag by its knot high above and behind the head; the other arm stretches forward and up to the right for balance. Looking up and to the right, determined happy grin. "
"Whole body in frame with a margin. ") + STYLE_CHAR + " " + KEY
P['throw_follow'] = ("Full body, three-quarter view facing to the right, just after throwing something high up into the sky: leaning forward and up on tiptoes, the arm on the RIGHT side of the image stretched up high "
"toward the upper right, the hand EMPTY and open; the other arm swings back. Looking up and to the right, delighted, mouth wide open. Whole body in frame with a margin. ") + STYLE_CHAR + " " + KEY
P['shocked_cu'] = ("Close-up: only the head and chest are visible, the bottom edge of the picture cuts the body at the chest. Facing the viewer, centred, the top of the head fully in frame with a margin above it. "
"Shocked: eyebrows raised very high, wide eyes, mouth wide open in a big round gasp, both hands pressed against the cheeks. ") + STYLE_CHAR + " " + KEY
P['shocked_full'] = ("Full body, three-quarter view facing to the right, standing, stunned: eyebrows raised very high, wide eyes, mouth wide open in a big gasp, both hands pressed against the cheeks, knees slightly bent. "
"Hands EMPTY. Whole body in frame with a margin. ") + STYLE_CHAR + " " + KEY
P['astronaut_toss'] = ("Full body, three-quarter view facing to the LEFT, standing, as a cartoon astronaut who just tossed something backward over his shoulder: the arm on the RIGHT side of the image raised up behind "
"the shoulder, the hand open and EMPTY; the other arm relaxed. Happy, careless smile with closed curved eyes. He wears only a clear round glass bubble helmet over the whole head (the face clearly visible "
"inside, one white curved highlight on the glass, a thin grey ring collar at the neck) and a small white boxy backpack; otherwise the same plain white body. Whole body in frame with a margin. ") \
    + STYLE_CHAR.replace("no clothes", "no other clothes") + " " + KEY
P['lunar_module'] = ("A cartoon Apollo-style lunar lander, exact side view, standing on its footpads: the lower descent stage is a wide octagonal box wrapped in shiny gold foil with four thin angled legs ending in "
"round footpads; on top sits the upper ascent stage, a smaller silver-grey angular cabin with a small square hatch door, a small triangular window and a short antenna. The two stages are clearly "
"separate stacked parts with a straight horizontal seam between them. ") + STYLE_OBJ + " " + KEY_M
P['moon'] = ("A full Moon as a big flat round disc seen straight on, filling most of the width: pale cream-grey fill (#E8E2CF), a few round craters in a slightly darker grey (#CFC7B0) with their own thin outline, "
"one simple soft shade crescent on the lower left, a thick smooth black outline around the disc. No face, no eyes, no mouth, no stars, no glow, no rays. ") + STYLE_OBJ + " " + KEY
P['bg_night'] = ("Vertical night scene: a deep navy-blue night sky (#1B2A5A) fills the top 70 % with a few small simple pale-yellow four-point stars; the upper right area of the sky is empty (no moon, no clouds). "
"A big gentle rounded green grassy hilltop fills the bottom 30 %, with a wide flat top in the lower middle where a character will stand, a darker green far hill line behind it, "
"and a few tiny far-away houses with small yellow lit windows on the left horizon. ") + STYLE_BG
P['bg_lunar'] = ("Vertical scene on the surface of the Moon: a black starry sky in the top 60 % with small simple white stars and a small blue-and-green planet Earth in the upper left; "
"the bottom 40 % is flat pale grey dusty lunar ground with a few shallow round craters with simple outlines and a few small rocks, flat open ground in the lower middle where a lander will stand; "
"the horizon line is gently curved. ") + STYLE_BG
P['trash_bag'] = ("A single plump black garbage bag, tied at the top with a small knot with two ear tips, soft rounded shape, one simple grey highlight. ") + STYLE_OBJ + " " + KEY
Q = {'windup': ('medium', '2:3'), 'throw_follow': ('medium', '2:3'), 'shocked_cu': ('medium', '2:3'), 'shocked_full': ('medium', '2:3'), 'astronaut_toss': ('medium', '2:3'),
     'lunar_module': ('medium', '3:2'), 'moon': ('medium', '2:3'), 'bg_night': ('medium', '2:3'), 'bg_lunar': ('medium', '2:3'), 'trash_bag': ('low', '2:3')}
