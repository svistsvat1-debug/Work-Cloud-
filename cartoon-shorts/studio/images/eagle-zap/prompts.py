# prompts.py - every picture prompt for eagle-zap (text only, no references) -> prompts.json + prompts.md
import json

LOW = "Bold clean thick outlines, big simple shapes, few details."
STYLE_CHAR = (
    "Flat 2D cartoon: a simple white character with a big round head, a small soft body, noodle arms with simple four-finger "
    "hands and short legs with rounded feet, thick smooth black (#000000) outlines of even weight, about 2 % of the head width "
    "thick, flat white fill (#FEFDFD) with a very soft pale-grey shade (#EDEBEB) on the left side of the head and body, the "
    "round head is wider than the body and about 0.38 of the full body height, small solid black vertical oval eyes about one "
    "sixth of the head width tall, simple curved black eyebrows, no nose, no hair, no clothes, a pink tongue (#FC8D90) only "
    "when the mouth is open. Clean vector-like linework, flat colours, no texture, no text, no border."
)
STYLE_OBJ = (
    "Flat 2D cartoon in the same drawing style: thick smooth black outlines of even weight, flat colours with one simple soft "
    "shade, clean vector-like linework, no texture, no text, no border, no characters."
)
KEY = (
    "Isolated on a perfectly flat, uniform, solid pure green (#00FF00) background that fills the whole picture edge to edge: "
    "no shadow, no ground, no floor line, no gradient, no vignette, no border, no other objects. The whole subject in frame "
    "with a clear margin on every side."
)
STYLE_BG = (
    "Flat 2D cartoon background in the same drawing style: big simple flat-colour shapes, thick smooth black outlines only on "
    "the main shapes, no texture, no text, no labels, no arrows, no characters, calm and simple so a character reads clearly "
    "on top of it."
)
EAGLE = (
    "a simple cartoon bald eagle with a dark brown body and wings (#5B3A1E) with a lighter brown shade (#7A5230), a white head "
    "and a white tail, a big hooked yellow beak (#F5B800), yellow feet with small black talons, small round black eyes with a "
    "white glint and a stern brow"
)

P = {}
P['hero'] = ('2:3',
    "Full body, three-quarter view facing to the RIGHT, standing with the feet slightly apart, the head tilted back looking up "
    "at the sky above to the right, curious expression: eyebrows raised, eyes looking up, a small round open mouth. Both arms "
    "relaxed at the sides. No objects. Whole body in frame with a margin. " + LOW + " " + STYLE_CHAR + " " + KEY)
P['guy2'] = ('3:2',
    "Two copies of the same character side by side with a wide empty gap between them, both full body on the same invisible "
    "baseline. The LEFT copy: three-quarter view facing to the RIGHT, looking up, happy and curious: eyebrows raised, a big "
    "closed smile, the hand on the RIGHT side of the image raised high above the head pointing straight up with one finger, "
    "the other hand on the hip. The RIGHT copy: facing the viewer, looking up, scared: eyebrows tilted up in the middle, eyes "
    "wide open, mouth wide open with the pink tongue, both hands pressed against the cheeks. No objects. " + LOW + " "
    + STYLE_CHAR + " " + KEY)
P['close'] = ('3:2',
    "Two copies of the same character side by side with a wide empty gap between them, each one a close-up: only the head and "
    "chest are visible, the bottom edge of the picture cuts the body at the chest. Both face the viewer and look up and to the "
    "LEFT. The LEFT copy: shocked: eyebrows tilted up in the middle, eyes wide open, mouth wide open in a big O with the pink "
    "tongue. The RIGHT copy: wincing: eyes squeezed shut in two > < shapes, a wide clenched grimace showing white teeth, both "
    "hands raised beside the face with spread fingers. No objects. " + LOW + " " + STYLE_CHAR + " " + KEY)
P['eagle_spread'] = ('3:2',
    "Two identical copies of " + EAGLE + ", side by side with a wide empty gap between them, both seen exactly from the front, "
    "standing upright on the same invisible baseline, both wings spread fully open straight out to the left and right and "
    "slightly raised, long wingtip feathers spread like fingers. The LEFT copy: alert and proud, beak closed. The RIGHT copy: "
    "the same pose and size, but zapped by electricity like in an old cartoon: every feather puffed up and frizzy, the brown "
    "feathers singed dark grey-black with soot, the white head feathers sticking up in a spiky frizz, dazed half-closed eyes, "
    "the beak hanging open with a small pink tongue out, a few loose feathers. No wire, no pole, no sparks. " + LOW + " "
    + STYLE_OBJ + " " + KEY)
P['eagle_fly'] = ('3:2',
    "Two copies of " + EAGLE + ", side by side with a wide empty gap between them. The LEFT copy: side view, flying to the "
    "RIGHT, gliding with both wings spread wide, the near wing raised up and the far wing behind it, the tail fanned, the "
    "yellow feet tucked under the body. The RIGHT copy: seen exactly from the front, standing upright with both wings folded "
    "at its sides, proud, beak closed. No wire, no pole, no branch. " + LOW + " " + STYLE_OBJ + " " + KEY)
P['sparrows'] = ('3:2',
    "Three small cute cartoon house sparrows in one row with wide empty gaps between them, each one perched as if sitting on a "
    "thin wire, with the tiny feet curled under the round body and nothing under them: round little bodies, a warm brown back "
    "and wings (#8B5A2B) with a few darker stripes, a light beige belly (#E8DCC8), a grey cap, a small dark cone beak, small "
    "round black eyes with a white glint. On the LEFT a sparrow in side view facing RIGHT, happy; in the MIDDLE a sparrow facing "
    "the viewer, relaxed with half-closed eyes; on the RIGHT a sparrow in side view facing LEFT, curious. No wire, no branch. "
    + LOW + " " + STYLE_OBJ + " " + KEY)
P['bg'] = ('2:3',
    "Vertical: a very simple sunny countryside seen from the side: a clear light-blue sky (#9ED3F0) with two small simple white "
    "clouds and no sun fills the top 75 %; along the bottom of the sky a low row of soft rounded green hills far away "
    "(#7FB86A); the bottom 25 % is a flat bright green grass field (#8CCB5E) with a few small darker grass tufts. The grass top "
    "edge is a nearly straight horizontal line at 75 % of the height. No poles, no wires, no buildings, no trees, no people, no "
    "animals. " + STYLE_BG)

if __name__ == '__main__':
    json.dump({k: {'aspect_ratio': v[0], 'prompt': v[1]} for k, v in P.items()}, open('prompts.json', 'w'), indent=1)
    with open('prompts.md', 'w') as f:
        f.write('# Prompts - eagle-zap (all gpt-image-2.5-sunburst, resolution 1K, quality low, 1 generation, no references)\n\n')
        for k, (ar, p) in P.items():
            f.write(f'## {k} ({ar})\n\n{p}\n\n')
    print(len(P), 'prompts')
