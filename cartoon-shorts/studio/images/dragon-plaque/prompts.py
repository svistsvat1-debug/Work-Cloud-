import json
CHAR = "Flat 2D cartoon: a simple white character with a big round head, a small soft body, noodle arms with simple four-finger hands and short legs with rounded feet, thick smooth black (#000000) outlines of even weight, about 2 % of the head width thick, flat white fill (#FEFDFD) with a very soft pale-grey shade (#EDEBEB) on the left side of the head and body, the round head is wider than the body and about 0.38 of the full body height, small solid black vertical oval eyes about one sixth of the head width tall, simple curved black eyebrows, no nose, no hair, no clothes, a pink tongue (#FC8D90) only when the mouth is open. Clean vector-like linework, flat colours, no texture, no text, no border."
OBJ = "Flat 2D cartoon in the same drawing style: bold clean thick smooth black outlines of even weight, flat colours with one simple soft shade, clean vector-like linework, simple shapes, no texture, no text, no letters, no numbers, no symbols, no logos, no border, no characters."
def KEY(c='green'):
    col = 'pure green (#00FF00)' if c == 'green' else 'pure magenta (#FF00FF)'
    return f"Isolated on a perfectly flat, uniform, solid {col} background that fills the whole picture edge to edge: no shadow, no ground, no floor line, no gradient, no vignette, no border, no other objects. The whole subject in frame with a clear margin on every side."
# dragon-plaque - all gpt-image-2.5-sunburst, 1K, quality LOW, 1 variation, NO references. Locked blocks from memory/STYLE.md.
# Role item: lab scientist = only a pair of round safety goggles pushed up on the forehead (text only).
# Drawn in CODE: the well shaft cut-away, cobwebs, year counter, name plate, crown, question marks, drill dust, DNA helix,
# zoom bubble, gunk flakes, test tube, faces in the skull's eye sockets, sweat drops, confetti, poof cloud.
BG = "Flat 2D cartoon background in the same drawing style: big simple flat-colour shapes, thick smooth black outlines only on the main shapes, no texture, no text, no labels, no arrows, no characters, calm and simple so a character reads clearly on top of it."
ROW3 = "Three DIFFERENT poses of the same character side by side in one row, all three the same size, with wide empty gaps between them, every copy full body, no ground drawn, bold clean thick outlines. "
CAP = " This character is a lab scientist: exactly the same simple white character, wearing only a pair of small round clear safety goggles with a thin light-blue (#7FC8E8) rim and a thin black strap, pushed up on the top of the forehead (not over the eyes)."
def tail(): return " Whole bodies in frame with a margin. " + CHAR + CAP + " " + KEY()
P = {
 'guyA': ("3:2", ROW3 + "LEFT copy: three-quarter view facing to the RIGHT, proud presenter: the arm on the RIGHT side of the image "
          "stretched out to the right and slightly up with an open palm facing up as if presenting something, the other hand on "
          "the hip, a big proud open smile with the pink tongue showing, eyebrows raised. MIDDLE copy: three-quarter view facing to "
          "the RIGHT, working hard: both hands hold a simple grey cartoon power drill (#8C9399 body, black handle, a short thin "
          "silver drill bit) pointing straight to the right at chest height, leaning forward, eyes narrowed in focus, teeth "
          "gritted, eyebrows tilted down. RIGHT copy: facing the viewer, shocked: both open hands pressed against the cheeks, eyes "
          "wide, eyebrows high, the mouth wide open in a tall 'O' with the pink tongue showing, holding nothing." + tail()),
 'guyB': ("3:2", ROW3 + "LEFT copy: three-quarter view facing to the RIGHT, leaning forward carefully, squinting with one eye "
          "closed and the tongue sticking out of the corner of the mouth in concentration: the hand on the RIGHT side of the image "
          "holds a thin silver dentist's scraping pick pointing forward to the right, the other hand rests on the knee. MIDDLE "
          "copy: facing the viewer, amazed and proud: the hand on the RIGHT side of the image holds up high one small clear glass "
          "test tube with a little brown-yellow gunk (#B08A3E) at the bottom, the mouth open in a big excited smile with the pink "
          "tongue showing, eyes wide, eyebrows high. RIGHT copy: facing the viewer, cheering: both arms thrown straight up high "
          "above the head with open hands, a huge open happy smile with the pink tongue showing, eyes closed in two happy "
          "upside-down U shapes, holding nothing." + tail()),
 'skull': ("3:2", "One big ancient fossil human skull without the lower jaw, three-quarter side view facing to the RIGHT: a long low "
          "rounded braincase, a very heavy thick brow ridge over two huge square-ish empty eye sockets (flat dark brown #3B2A1E "
          "inside), a wide flat nose opening, a broad upper jaw with only ONE single big molar tooth left on it (cream #F2E6C8), "
          "all the other tooth spots empty. The bone is flat warm tan fossil colour (#CFAE7E with a darker #A9875A shade on the "
          "lower left and a few simple small crack lines). No lower jaw, no text, no stand. " + OBJ + " " + KEY('magenta')),
 'props': ("3:2", "Three DIFFERENT cartoon objects side by side in one row with wide empty gaps between them, all about the same "
          "height. LEFT: one single big cartoon molar tooth, standing upright, a white-cream crown (#F2E6C8) with two short roots "
          "at the bottom, and a thick lumpy crust of brown-yellow tartar plaque (#B08A3E with a darker #8A6A2C shade) covering the "
          "lower half of the crown like dried mud. MIDDLE: one small old wooden bucket (#9C6B42 with darker #7A5130 planks and "
          "two dark grey metal bands) hanging from a short piece of rope with a loop on top, empty. RIGHT: one single small "
          "cartoon finger bone (a short slightly curved pale tan bone #E6D3AE with rounded knobby ends), lying on a small flat "
          "round red velvet cushion (#C0392B). " + OBJ + " " + KEY('magenta')),
 'denisovan': ("2:3", "Full body, facing the viewer, a friendly prehistoric human cousin in the same flat cartoon style as a "
          "simple white cartoon character with a big round head and a small soft body, but with: warm light-brown skin "
          "(#C68E62 with a darker #A9744E shade on the left side), a very heavy thick brow ridge, a wide flat nose, a big broad "
          "square jaw, small solid black oval eyes, a wide warm smile showing the teeth, messy shaggy dark-brown hair (#4A3020) and "
          "a short dark-brown beard, wearing a simple one-shoulder fur wrap (#9C7A52 with a few darker #7A5C3A spots) as a tunic, "
          "bare feet. The arm on the RIGHT side of the image is raised high waving hello with an open four-finger hand, the "
          "other arm relaxed. Thick smooth black outlines of even weight, flat colours, clean vector-like linework, no texture, "
          "no text, no border. Whole body in frame with a margin. " + KEY()),
 'lab': ("2:3", "A bright simple science lab, vertical picture, straight front view at eye level. The top 62 % is a plain pale "
          "mint-grey wall (flat #DDEBE6) with two simple wooden shelves (#B98A5C) on the upper left and upper right holding a few "
          "simple glass jars and bottles in flat pale colours, and one round white wall clock high in the middle. At about 62 % "
          "of the height: the top edge of a long wide white lab counter (flat #F2F2F0 top, #D5D8D6 front panel with a few simple "
          "cupboard doors) that runs from edge to edge down to about 85 %; below it a plain light-grey tiled floor (#BFC6C4). The "
          "counter top is empty in the middle. No people, no skulls, no bones, no text, no labels. " + BG),
 'ground': ("2:3", "A simple cut-away cross-section of the ground under a quiet grassy riverside field, vertical picture, "
          "straight side view. The top 22 % is a calm dusk sky (flat #F2C48D near the horizon to #9FB7D9 at the top in two flat "
          "steps) with one tiny far simple bridge on the far left horizon. At 22 % of the height: a thin wavy strip of green "
          "grass (#7DB24A) along the surface. From 22 % down to the bottom edge: layered underground earth in flat horizontal "
          "bands of brown (#8B6141, then #75513A, then #5E412F at the bottom) with a few scattered small flat grey pebbles and "
          "a few thin pale roots near the top, empty in the middle. No well, no people, no bones, no text. " + BG),
}
json.dump(P, open('prompts.json', 'w'), indent=1)
with open('prompts.md', 'w') as f:
    f.write('# dragon-plaque - picture prompts (all gpt-image-2.5-sunburst, 1K, quality LOW, 1 variation, no references)\n\n')
    for k, (ar, p) in P.items(): f.write(f'## {k} ({ar})\n{p}\n\n')
print({k: len(v[1]) for k, v in P.items()})
