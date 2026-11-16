# prompts.py - the full prompt of every picture (STYLE / KEY blocks word for word from memory/STYLE.md). All LOW 1K, 1 variation.
import json
STYLE_CHAR = ("Flat 2D cartoon: a simple white character with a big round head, a small soft body, noodle arms with simple four-finger hands "
 "and short legs with rounded feet, thick smooth black (#000000) outlines of even weight, about 2 % of the head width thick, flat white fill "
 "(#FEFDFD) with a very soft pale-grey shade (#EDEBEB) on the left side of the head and body, the round head is wider than the body and about "
 "0.38 of the full body height, small solid black vertical oval eyes about one sixth of the head width tall, simple curved black eyebrows, no "
 "nose, no hair, no clothes, a pink tongue (#FC8D90) only when the mouth is open. Clean vector-like linework, flat colours, no texture, no text, no border.")
STYLE_OBJ = ("Flat 2D cartoon in the same drawing style: thick smooth black outlines of even weight, flat colours with one simple soft shade, "
 "clean vector-like linework, no texture, no text, no border, no characters.")
KEY = ("Isolated on a perfectly flat, uniform, solid pure green (#00FF00) background that fills the whole picture edge to edge: no shadow, no "
 "ground, no floor line, no gradient, no vignette, no border, no other objects. The whole subject in frame with a clear margin on every side.")
MAG = KEY.replace("pure green (#00FF00)", "pure magenta (#FF00FF)")
STYLE_BG = ("Flat 2D cartoon background in the same drawing style: big simple flat-colour shapes, thick smooth black outlines only on the main "
 "shapes, no texture, no text, no labels, no arrows, no characters, calm and simple so a character reads clearly on top of it.")
BOOST = "Bold clean thick outlines, big simple shapes, few details."
P = {}

P['hero'] = ("2:3", "Full body, three-quarter view facing to the LEFT, standing with the feet slightly apart, curious and puzzled: one "
 "eyebrow raised higher than the other, eyes looking up to the left, mouth a small sideways squiggle, the hand on the RIGHT side of the image "
 "scratches the side of the head, the other arm hangs relaxed. No objects. Whole body in frame with a margin. " + BOOST + " " + STYLE_CHAR + " " + KEY)
P['guyA'] = ("3:2", "Two copies of the same character side by side with a wide empty gap between them, both full body on the same invisible "
 "baseline. The LEFT copy: three-quarter view facing to the LEFT, proud and confident: big closed grin, eyebrows raised, the hand on the LEFT "
 "side of the image points down and to the left at the ground, the other hand on the hip. The RIGHT copy: side view facing to the RIGHT, "
 "pulling hard on a rope: the whole body leaning far back, both arms stretched straight out in front at chest height with both hands closed "
 "into fists one behind the other (as if gripping a rope that goes off to the right), feet planted wide apart, eyes squeezed shut, eyebrows "
 "angled down, teeth gritted with effort. No rope, no objects. " + BOOST + " " + STYLE_CHAR + " " + KEY)
P['guyB'] = ("3:2", "Two copies of the same character side by side with a wide empty gap between them, both full body on the same invisible "
 "baseline. The LEFT copy: three-quarter view facing to the LEFT, scared: leaning back, both hands raised in front with open palms out, "
 "eyebrows tilted up in the middle, wide eyes, mouth open in a wobbly frown, knees bent. The RIGHT copy: three-quarter view facing to the "
 "LEFT, stunned: jaw dropped very wide open with the pink tongue, eyebrows raised high, both arms hanging loose with empty open hands. "
 "No objects. " + BOOST + " " + STYLE_CHAR + " " + KEY)
P['closeup'] = ("2:3", "Close-up portrait: only the head and chest are visible, the bottom edge of the picture cuts the body at the chest. "
 "Facing the viewer, turned slightly to the LEFT, utterly amazed: jaw dropped very wide open with the pink tongue, the solid black oval eyes "
 "wide, eyebrows raised very high. " + BOOST + " " + STYLE_CHAR + " " + KEY)
P['moai'] = ("2:3", "One carved stone moai statue from Easter Island, three-quarter view facing to the RIGHT, standing upright: a huge long "
 "head (about 60 % of the statue's height) with a heavy straight brow, two plain dark-grey shadowed eye hollows under the brow with no "
 "eyeballs, a long straight wide nose, a strong flat chin, thin pressed lips, long rectangular ears; a short narrow torso with thin arms "
 "carved flat along the sides and long thin fingers meeting over the belly; the statue ends at the hips in a wide flat base whose bottom "
 "edge is gently rounded. Soft grey-brown volcanic stone (#8E7E6E) with one darker shade (#6F6156) on the left side, calm neutral face, no "
 "cracks, no moss, no platform, no ground. Whole statue in frame with a margin. " + BOOST + " " + STYLE_OBJ + " " + KEY)
P['bg'] = ("2:3", "Vertical: a very simple Easter Island landscape seen exactly from the side, like a school diagram: a clear light-blue sky "
 "(#9ED3F0) with two small simple white clouds and no sun fills the top 62 %; along the bottom of the sky a strip of calm deep-blue ocean "
 "(#3B8FD0) on the right half, and on the left half a low wide rounded green volcano hill (#7FB866) with a flat top; the bottom 38 % is flat "
 "green grassland (#8CCB5E) seen from the side, crossed horizontally by one light sandy-brown dirt road band (#D8B98A) in the middle of the "
 "grass. The grass top edge is a perfectly straight horizontal line across the whole width at 62 % of the height. No trees, no statues, no "
 "rocks, no buildings, no people. " + STYLE_BG)
json.dump(P, open('prompts.json', 'w'), indent=1)
for k, v in P.items(): print(k, v[0], len(v[1]))
