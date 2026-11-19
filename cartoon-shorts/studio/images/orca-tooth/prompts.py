# prompts.py - picture prompts for orca-tooth (all gpt-image-2.5-sunburst, 1K, quality LOW, 1 variation, NO references)
# STYLE / CHARACTER / KEY / BG blocks word for word from memory/STYLE.md (the channel's locked look).
# The guy plays the lab scientist: the locked white character + only round safety goggles pushed up on the forehead (role item).
# The tooth slice with its growth rings, the glowing fallout, the counter, faces, glasses on the old orca are drawn in CODE.
import json, sys
CHAR = "Flat 2D cartoon: a simple white character with a big round head, a small soft body, noodle arms with simple four-finger hands and short legs with rounded feet, thick smooth black (#000000) outlines of even weight, about 2 % of the head width thick, flat white fill (#FEFDFD) with a very soft pale-grey shade (#EDEBEB) on the left side of the head and body, the round head is wider than the body and about 0.38 of the full body height, small solid black vertical oval eyes about one sixth of the head width tall, simple curved black eyebrows, no nose, no hair, no clothes, a pink tongue (#FC8D90) only when the mouth is open. Clean vector-like linework, flat colours, no texture, no text, no border."
GOG = json.load(open('gog.json'))['gog'] if len(sys.argv) > 1 else " This character is a lab scientist: exactly the same simple white character, wearing only a pair of simple round safety goggles pushed up high on the forehead (two round flat pale-blue #BFE3F5 lenses with thick black rims, joined by a short black bridge, and one thin black strap going around the head) - nothing else added, no hair, no clothes, no lab coat, no gloves, no bag."
MAG = "a big round magnifying glass: a thick black rim around a flat opaque pale-blue lens (#C4ECFA) with one small white glint, and a short straight brown wooden handle (#8C5021)"
OBJ = "Flat 2D cartoon in the same drawing style: bold clean thick smooth black outlines of even weight, flat colours with one simple soft shade, clean vector-like linework, simple shapes, no texture, no text, no letters, no numbers, no symbols, no logos, no border."
def KEY(c='green'):
    col = 'pure green (#00FF00)' if c == 'green' else 'pure magenta (#FF00FF)'
    return f"Isolated on a perfectly flat, uniform, solid {col} background that fills the whole picture edge to edge: no shadow, no ground, no floor line, no gradient, no vignette, no border, no other objects. The whole subject in frame with a clear margin on every side."
BG = "Flat 2D cartoon background in the same drawing style: big simple flat-colour shapes, thick smooth black outlines only on the main shapes, no texture, no text, no labels, no arrows, no characters, calm and simple so a character reads clearly on top of it."
ROW3 = "Three DIFFERENT poses of the same character side by side in one row, all three the same size, with wide empty gaps between them, every copy full body, no ground drawn, bold clean thick outlines. "
def tail(key='magenta'): return " Whole bodies in frame with a margin. " + CHAR + GOG + " " + KEY(key)
ORCA = ("glossy black (#1E2026 with a slightly lighter #343842 shade), a bright white oval eye patch just behind and above the eye, a white "
        "chin and belly (#FFFFFF), a pale grey saddle patch (#A9AEB6) just behind the dorsal fin, black paddle-shaped flippers and black "
        "tail flukes, a small round friendly black cartoon eye with a tiny white glint placed in front of the white eye patch, a gentle "
        "closed smile line")
P = {
 'hero': ("2:3", "Full body, three-quarter view facing to the RIGHT, standing upright and leaning forward a little, the hand on the RIGHT "
          "side of the image holds " + MAG + " up in front of the body at chest height with the lens facing to the right, the other arm "
          "relaxed at the side, a curious focused closed-mouth smile, eyebrows slightly raised. Whole body in frame with a margin. Bold "
          "clean thick outlines. " + CHAR + GOG + " " + KEY('magenta')),
 'guyA': ("3:2", ROW3 + "LEFT copy: three-quarter view facing to the RIGHT, puzzled: the hand on the LEFT side of the image scratches the "
          "side of the head, the other hand hangs relaxed and holds " + MAG + " pointing down, eyebrows tilted unevenly, a small wavy "
          "confused closed mouth. MIDDLE copy: three-quarter view facing to the RIGHT, peering closely: bent forward at the waist with "
          "both hands resting on the knees, the head pushed forward, squinting hard at something to the right with one eye shut and one "
          "eye open, a tight concentrated mouth, holding nothing. RIGHT copy: facing the viewer, shocked: both open hands pressed to the "
          "cheeks, eyes wide, eyebrows high, the mouth wide open in a big 'O' with the pink tongue showing, holding nothing." + tail()),
 'tooth': ("2:3", "A single big cartoon killer whale tooth standing upright: a thick smooth cone, wide and flat at the bottom and getting "
           "narrower toward a rounded tip at the top, gently curved to the RIGHT like a little hook, ivory-cream colour (#F3EAD3) with a "
           "soft darker shade (#DCCDAA) on the left side and one small white highlight stripe on the right side, a flat wide base at the "
           "bottom. No gums, no jaw, no root, no face, no other teeth, nothing else. " + OBJ + " " + KEY()),
 'orcas': ("3:2", "Two DIFFERENT cute cartoon killer whales side by side in one row with a wide empty gap between them, both in side view "
           "swimming to the RIGHT, the whole of each whale visible. LEFT: a small baby killer whale calf: a short chubby rounded body, a "
           "big round head, a small rounded dorsal fin, about two thirds of the length of the other whale. RIGHT: a big old male killer "
           "whale: a long heavy body, a VERY tall straight pointed triangular dorsal fin, three short white scratch-scar lines on its side "
           "and one small notch in the back edge of the dorsal fin. Both whales: " + ORCA + ". Bold clean thick smooth black outlines of "
           "even weight around every shape, big simple shapes, few details, flat colours with one simple soft shade, clean vector-like "
           "linework, no texture, no text, no water, no splash, no bubbles, no border. " + KEY()),
 'bombs': ("3:2", "Two DIFFERENT cartoon objects side by side in one row with a wide empty gap between them, both the same height. LEFT: "
           "an old-fashioned cartoon atomic bomb lying horizontally: a fat round egg-shaped steel body (#8E959C with a darker #6C737A "
           "shade and one white highlight), a rounded nose pointing to the LEFT, a boxy ring of four flat tail fins at the RIGHT end, a "
           "row of small rivet dots around the middle, no symbols. RIGHT: a cartoon mushroom cloud standing upright: a big puffy round "
           "cap made of five round puffs (cream #FFE9BF with a warm orange #F4A259 underside), a thick puffy light-grey stem (#C9C3BC "
           "with a #A8A29B shade), a wide puffy grey ring of smoke around the bottom of the stem, no fire, no ground, no water. " + OBJ +
           " " + KEY('magenta')),
 'props': ("3:2", "Two DIFFERENT cartoon objects side by side in one row with a wide empty gap between them, about the same height. LEFT: "
           "a simple cartoon Geiger counter: a rounded rectangular yellow box (#F2C230 with a darker #C99A1E shade) with a black carrying "
           "handle on top, a round white dial with a black needle on the front, and a short black cylindrical wand probe lying beside the "
           "box, connected to it by a curly black cable. RIGHT: a cartoon tree stump: a short wide stump with brown bark (#8A5A35 with "
           "darker #6B4428 vertical lines), a flat light wooden top (#E8C99A) seen slightly from above showing six thin dark concentric "
           "growth rings (#B48452) around a small centre dot, three small roots at the bottom, no leaves, no axe. " + OBJ + " " + KEY()),
 'shore': ("2:3", "A calm Scottish island shore, vertical picture, seen straight from the side at eye level. The top 38 % is a pale "
           "grey-blue sky (flat #CFE0EA) with two small flat white clouds. At 38 % of the height lies a straight flat horizon. From 38 % "
           "to 62 % of the height: a calm grey-blue sea (flat #5E8DB3 with two lighter #7FA8CA flat bands near the shore), and a low "
           "distant green island hill (#7E9F72) on the far LEFT of the horizon. Below 62 %: a pale sandy beach (#E9DDBB with a few "
           "darker #D6C79F patches), a strip of grey rounded rocks (#8C9399) along the water line only at the far LEFT and far RIGHT "
           "edges, and small tufts of green grass (#8DB25A) only in the two bottom corners. The middle of the sea and the middle of the "
           "beach are open and empty. No people, no animals, no boats, no text. " + BG),
 'under': ("2:3", "Underwater in the open sea, vertical picture, seen from the side. The very top 6 % is the wavy bright underside of the "
           "water surface (#9FDDF5). Below it the water is three wide flat horizontal bands that get darker downward: #4FB3E0, then "
           "#2E86C1, then #1F6299 (flat colours, no gradient). Four soft pale straight light rays (#BFE8F8) slant down from the top. The "
           "bottom 12 % is a sandy seabed (#D9C38F with a darker #B9A372 shade) with a few rounded grey rocks and three small wavy "
           "seaweed plants (#4E9A5B) only at the left and right edges. The middle is open and empty water. No animals, no fish, no "
           "bubbles, no boats, no text. " + BG),
}
json.dump(P, open('prompts.json', 'w'), indent=1)
with open('prompts.md', 'w') as f:
    f.write('# orca-tooth - picture prompts (all gpt-image-2.5-sunburst, 1K, quality LOW, 1 variation, no references)\n\n')
    for k, (ar, p) in P.items(): f.write(f'## {k} ({ar})\n{p}\n\n')
for k, (ar, p) in P.items(): print(k, ar, len(p))
