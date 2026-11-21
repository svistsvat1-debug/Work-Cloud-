# prompts.py - picture prompts for butt-breath (all gpt-image-2.5-sunburst, 1K, quality LOW, 1 variation, NO references)
# CHAR / OBJ / KEY / BG blocks word for word from memory/STYLE.md (the channel's locked look, as in suez-sequel).
# Drawn in CODE: the liquid bag + tube, the stopwatch digits, the measuring jug, the 27-head counter, bubbles, sweat, O2 label.
import json
CHAR = "Flat 2D cartoon: a simple white character with a big round head, a small soft body, noodle arms with simple four-finger hands and short legs with rounded feet, thick smooth black (#000000) outlines of even weight, about 2 % of the head width thick, flat white fill (#FEFDFD) with a very soft pale-grey shade (#EDEBEB) on the left side of the head and body, the round head is wider than the body and about 0.38 of the full body height, small solid black vertical oval eyes about one sixth of the head width tall, simple curved black eyebrows, no nose, no hair, no clothes, a pink tongue (#FC8D90) only when the mouth is open. Clean vector-like linework, flat colours, no texture, no text, no border."
DOC = " This character is a doctor: exactly the same simple white character, wearing only a round silver doctor's head mirror (flat light grey #C9CDD2 disc with a black outline) on a thin black headband across the forehead and a simple black stethoscope hanging around the neck, nothing else."
OBJ = "Flat 2D cartoon in the same drawing style: bold clean thick smooth black outlines of even weight, flat colours with one simple soft shade, clean vector-like linework, simple shapes, no texture, no text, no letters, no numbers, no symbols, no logos, no border, no characters."
def KEY(c='green'):
    col = 'pure green (#00FF00)' if c == 'green' else 'pure magenta (#FF00FF)'
    return f"Isolated on a perfectly flat, uniform, solid {col} background that fills the whole picture edge to edge: no shadow, no ground, no floor line, no gradient, no vignette, no border, no other objects. The whole subject in frame with a clear margin on every side."
BG = "Flat 2D cartoon background in the same drawing style: big simple flat-colour shapes, thick smooth black outlines only on the main shapes, no texture, no text, no labels, no arrows, no characters, calm and simple so a character reads clearly on top of it."
ROW3 = "Three DIFFERENT poses of the same character side by side in one row, all three the same size, with wide empty gaps between them, every copy full body, no ground drawn, bold clean thick outlines. "
def tail(extra=''): return " Whole bodies in frame with a margin. " + CHAR + extra + " " + KEY()

P = {
 'guyA': ("3:2", ROW3 + "LEFT copy: facing the viewer, eager volunteer: the arm on the RIGHT side of the image raised straight up high "
          "with the open hand, the other hand on the chest, a big confident open smile with the pink tongue showing, eyebrows raised, "
          "standing on tiptoe. MIDDLE copy: facing the viewer, holding it in with all his might: knees pressed tightly together and bent "
          "inward, both hands clenched into fists at the sides, the whole body stiff, eyes squeezed shut, cheeks puffed, lips pressed "
          "into a tight wavy line, eyebrows tilted up in the middle. RIGHT copy: facing the viewer, proud winner: both arms up in a "
          "victory V with closed fists, chest out, a huge closed happy smile, eyes closed in two happy upside-down U shapes." + tail()),
 'guyB': ("3:2", ROW3 + "LEFT copy: facing the viewer, nervous gulp: shoulders raised, both hands clasped in front of the chest, eyes "
          "wide, eyebrows tilted up in the middle, a small wobbly mouth with clenched white teeth, sweating nervously. MIDDLE copy: "
          "facing the viewer, bent forward with a tummy ache: both hands pressed on the round belly, knees bent, a pained grimace with "
          "clenched white teeth, one eye squeezed shut, eyebrows tilted up in the middle. RIGHT copy: side view running fast to the "
          "RIGHT in a hurry, leaning forward, both hands clutching the bottom from behind, legs in a big running stride, eyes wide in "
          "panic, mouth open in a small 'O'." + tail()),
 'doc': ("3:2", ROW3 + "LEFT copy: three-quarter view facing to the RIGHT, the doctor holds a simple brown clipboard (#9C6B42 board, "
          "plain white paper, no writing) against the chest with the hand on the LEFT side of the image, the other hand raised with one "
          "finger up as if explaining, calm smile. MIDDLE copy: three-quarter view facing to the RIGHT, the doctor stretches the arm on "
          "the RIGHT side of the image straight out to the right with the open hand held up flat as if presenting something, a sly "
          "closed smile, eyebrows raised. RIGHT copy: facing the viewer, the doctor claps both hands together in front of the chest, "
          "a big open happy smile with the pink tongue showing, eyes closed happily." + tail(DOC)),
 'pig': ("3:2", "Three DIFFERENT poses of the same cute cartoon pig side by side in one row, all three the same size, with wide empty "
          "gaps between them, each pig in side view facing to the RIGHT, standing on four short legs: a round chubby body in flat pink "
          "(#F6A9B8 with a darker #E58A9D shade), a round head with a flat oval snout with two dark nostrils, two small pointed ears, "
          "a short curly tail on the left, small solid black oval eyes. LEFT pig: sick and weak, head hanging low, ears drooping, eyes "
          "half closed with tired heavy lids, a small sad frown, a pale blue-grey tint on the cheeks. MIDDLE pig: suddenly refreshed, "
          "standing tall, head up, ears up, eyes wide open, a big happy open smile with a pink tongue, cheeks rosy. RIGHT pig: proud and "
          "smug, chin up, eyes half closed in a satisfied way, a confident closed smile. No ground. " + OBJ.replace(', no characters', '') + " " + KEY()),
 'props': ("3:2", "Three DIFFERENT cartoon objects side by side in one row with wide empty gaps between them, all about the same "
           "height. LEFT: a simple white porcelain toilet in side view facing to the LEFT, with the lid up, a white tank behind it with a "
           "small silver flush handle (#F4F4F4 with a #D6D6D6 shade). MIDDLE: a tall metal hospital IV drip stand: a thin grey pole "
           "(#9AA0A8) on a small five-wheel base, with a hook at the top holding a big soft clear plastic bag full of pale blue liquid "
           "(#BFE6F5 with a #9CD3EA shade) and a short tube hanging down from the bottom of the bag. RIGHT: a big round silver "
           "stopwatch (#C9CDD2 rim, plain white face with no numbers and no hands, a round button on top). " + OBJ + " " + KEY('magenta')),
 'clinic': ("2:3", "A bright clean hospital clinic room, vertical picture, straight front view at eye level. The top 62 % is a "
           "plain pale mint-green wall (flat #CFEDE3 with a slightly darker #BCE2D6 band at the bottom of the wall), with one simple "
           "square window with a light-blue sky (#BEE3F2) high on the left and a plain white round wall clock with no numbers high on "
           "the right. At about 62 % of the height the wall meets a flat light-grey floor (#E3E6EA with a few slightly darker #D3D7DC "
           "square tile lines), empty and open in the middle. A small white hospital bed edge visible only at the far right edge. No "
           "people, no animals, no text, no signs. " + BG),
}
json.dump(P, open('prompts.json', 'w'), indent=1)
with open('prompts.md', 'w') as f:
    f.write('# butt-breath - picture prompts (all gpt-image-2.5-sunburst, 1K, quality LOW, 1 variation, no references)\n\n')
    for k, (ar, p) in P.items(): f.write(f'## {k} ({ar})\n{p}\n\n')
print({k: len(v[1]) for k, v in P.items()})
