# prompts.py - picture prompts for maple-leftovers (all gpt-image-2.5-sunburst, 1K, quality LOW, 1 variation, NO references)
# STYLE / CHARACTER / KEY / BG blocks word for word from memory/STYLE.md (the channel's locked look).
# The guy plays the scientist: the locked white character + only round safety goggles pushed up on the forehead (the role
# item of #43 orca-tooth, text only). MAGENTA key for the guy (pale-blue goggle lenses) and for everything green (leaves, tree).
# Drawn in CODE: faces on the tree / leaf / bottle, the bomb carbon dots, tags, the trunk cut-away with the sugar jars,
# sugar cubes riding up the trunk, the syrup stream, the party hat + candles, stink lines, sweat drops.
import json
CHAR = "Flat 2D cartoon: a simple white character with a big round head, a small soft body, noodle arms with simple four-finger hands and short legs with rounded feet, thick smooth black (#000000) outlines of even weight, about 2 % of the head width thick, flat white fill (#FEFDFD) with a very soft pale-grey shade (#EDEBEB) on the left side of the head and body, the round head is wider than the body and about 0.38 of the full body height, small solid black vertical oval eyes about one sixth of the head width tall, simple curved black eyebrows, no nose, no hair, no clothes, a pink tongue (#FC8D90) only when the mouth is open. Clean vector-like linework, flat colours, no texture, no text, no border."
GOG = " This character is a lab scientist: exactly the same simple white character, wearing only a pair of simple round safety goggles pushed up high on the forehead (two round flat pale-blue #BAE9FA lenses with one small white glint each and thick black rims, joined by a short black bridge, and one thin black strap going around the head) - nothing else added, no hair, no clothes, no lab coat, no gloves, no bag."
OBJ = "Flat 2D cartoon in the same drawing style: bold clean thick smooth black outlines of even weight, flat colours with one simple soft shade, clean vector-like linework, simple shapes, no texture, no text, no letters, no numbers, no symbols, no logos, no border."
def KEY(c='magenta'):
    col = 'pure green (#00FF00)' if c == 'green' else 'pure magenta (#FF00FF)'
    return f"Isolated on a perfectly flat, uniform, solid {col} background that fills the whole picture edge to edge: no shadow, no ground, no floor line, no gradient, no vignette, no border, no other objects. The whole subject in frame with a clear margin on every side."
BG = "Flat 2D cartoon background in the same drawing style: big simple flat-colour shapes, thick smooth black outlines only on the main shapes, no texture, no text, no labels, no arrows, no characters, calm and simple so a character reads clearly on top of it."
ROW3 = "Three DIFFERENT poses of the same character side by side in one row, all three the same size, with wide empty gaps between them, every copy full body, no ground drawn, bold clean thick outlines. "
def tail(): return " Whole bodies in frame with a margin. " + CHAR + GOG + " " + KEY()
LEAF = "one single green sugar maple leaf (flat #5DB04F with a darker #3F8A3C shade, five pointed lobes, a short brown #8A5A3B stem)"
PLATE = ("a round white plate (#FFFFFF with a light-grey #DDDDDD rim shade) held flat at chest height with a neat stack of three "
         "golden-brown pancakes on it (#E0A458 with darker #C07F3A edges)")

P = {
 'hero': ("2:3", "Full body, three-quarter view facing to the RIGHT, standing upright and looking up a little, the arm on the RIGHT side "
          "of the image raised high above the head, its fingers pinching the stem of " + LEAF + " as if it just picked it from a "
          "branch above, the other arm hangs down at the side and holds a small round wicker basket (#C99A5B with a darker #A87A3F "
          "shade) by its handle, with a few green maple leaves in the basket, a happy curious closed-mouth smile, eyebrows raised. "
          "Whole body in frame with a margin. Bold clean thick outlines. " + CHAR + GOG + " " + KEY()),
 'guyA': ("3:2", ROW3 + "LEFT copy: facing the viewer, a puzzled shrug: both open hands raised to shoulder height with the palms "
          "turned up, shoulders lifted, eyebrows tilted unevenly, a small wavy confused closed mouth, holding nothing. MIDDLE copy: "
          "three-quarter view facing to the RIGHT, grossed out: the arm on the RIGHT side of the image stretched far out to the right, "
          "pinching the stem of " + LEAF + " between two fingers at arm's length, the head and body leaning back away from it, eyes "
          "squeezed shut, the mouth open in a disgusted grimace with the pink tongue sticking out. RIGHT copy: three-quarter view "
          "facing to the LEFT, impatient: one arm raised bent in front of the chest, the other hand taps the wrist of that arm with "
          "one finger (there is no watch), a frown with tilted angry eyebrows, a flat annoyed mouth, holding nothing." + tail()),
 'guyB': ("3:2", "Two copies of the same character side by side in one row with a wide empty gap between them, both full body, the "
          "same size and the same pose, no ground drawn, bold clean thick outlines: three-quarter view facing to the RIGHT, standing, "
          "the hand on the LEFT side of the image holds " + PLATE + ", the other hand is raised up high above the plate at head "
          "height, closed in a loose fist as if gripping the neck of a bottle (the fist holds nothing). The LEFT copy has a delighted "
          "face: eyes closed in two happy upside-down U shapes and a big closed smile. The RIGHT copy is identical except shocked: "
          "eyes wide open, eyebrows high, the mouth wide open in an 'O' with the pink tongue showing." + tail()),
 'tree': ("2:3", "A big friendly cartoon sugar maple tree, the whole tree in frame: a thick short straight brown trunk (flat #8A5A3B "
          "with a darker #6E452B shade on the left side) with slightly flared roots at the bottom, two thick branches splitting from "
          "the top of the trunk into the crown, a big round puffy crown made of large rounded leafy clumps in bright leafy green "
          "(flat #5DB04F with a darker #3F8A3C shade), with small pointed maple-leaf points along the outline of the crown. The "
          "trunk is wide and plain. No face, no eyes, no fruit, no birds, no swing, no grass, no ground. " + OBJ + " " + KEY()),
 'props': ("3:2", "Three DIFFERENT cartoon objects side by side in one row with wide empty gaps between them, all about the same "
           "height. LEFT: " + LEAF + " in flat front view, with three simple darker veins from the base, the stem pointing down. "
           "MIDDLE: a glass bottle of maple syrup standing upright: a rounded glass bottle with a short neck and a small round "
           "finger-loop handle at the shoulder, full of amber syrup (#D98A2B with a darker #B5651D shade and one white highlight "
           "stripe), a small brown screw cap (#6E452B), no label. RIGHT: a cartoon mushroom cloud standing upright: a big puffy "
           "round cap made of five round puffs (cream #FFE9BF with a warm orange #F4A259 underside), a thick puffy light-grey stem "
           "(#C9C3BC with a #A8A29B shade), a wide puffy grey ring of smoke around the bottom of the stem, no fire, no ground. "
           + OBJ + " " + KEY()),
 'plate': ("2:3", "A calm sunny summer park meadow, vertical picture, straight side view at eye level. The top 56 % is a clear "
           "pale-blue sky (flat #BFE3F5) with two small flat white puffy clouds near the top. At about 56-60 % of the height: a "
           "soft line of far low rounded blue-green hills (#8FB9A8) and in front of them a far row of small rounded dark-green "
           "trees (#4E8C55). Below that, from 60 % down to the bottom edge, a wide open flat grassy meadow (flat #9BCB5E with a few "
           "big slightly darker #86B84E patches), empty in the middle. No paths, no fences, no people, no animals, no buildings, "
           "no flowers, no text. " + BG),
}
json.dump(P, open('prompts.json', 'w'), indent=1)
with open('prompts.md', 'w') as f:
    f.write('# maple-leftovers - picture prompts (all gpt-image-2.5-sunburst, 1K, quality LOW, 1 variation, no references)\n\n')
    for k, (ar, p) in P.items(): f.write(f'## {k} ({ar})\n{p}\n\n')
print({k: len(v[1]) for k, v in P.items()})
