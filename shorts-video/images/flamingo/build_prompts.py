# Assembles full copy-paste prompts -> prompts-copy-paste.md
STYLE = ("Style: flat 2D cartoon cut-out sprite for an animation, like a simple modern YouTube cartoon: thick smooth black "
         "outlines of even weight, flat colours with one very soft slightly darker shade on one side, clean vector-like "
         "linework, no texture, no gradients, {notext}no border, no extra objects.")
BG = ("Background: one perfectly flat, uniform, solid light-blue colour (#9BCFFD) filling the whole image - no ground, "
      "no floor shadow, no horizon, no gradient. No blue anywhere on the subject.")
FLAM = ("Design: bright pink egg-shaped body with a small tuft of pointed tail feathers, a long thin pink neck, a round head "
        "that is a bit oversized so the face reads clearly, a big downward-curved beak that is cream-white with a black tip, "
        "long thin pink stick legs with a round knobby joint in the middle and a small flat webbed foot.")
SCI = ("Design: a simple white cartoon character with a big round head, a small soft body, noodle arms with simple "
       "four-finger hands and short legs with rounded feet, flat white fill with a very soft pale-grey shade on one side, "
       "small solid black oval eyes, simple curved black eyebrows, no nose, no hair. He wears a short open white lab coat "
       "with a black outline, two black buttons and a red pen in the chest pocket.")
SAMEF = "the same flamingo as in the attached reference image, same size, same colours and line weight"
SAMES = "the same researcher as in the attached reference image, same size, same colours and line weight"
P = [
 ("01_flam_dead_one", "2:3 (portrait)", "none - make this one FIRST, pick the best", FLAM,
  "A single cartoon flamingo, full body, exact side view facing to the right, the whole flamingo in frame with a wide margin on every side. The flamingo is comically knocked out but still standing perfectly upright on ONE straight vertical leg; its other leg is folded up and tucked against its belly. The standing foot is directly below the middle of the body. The neck droops forward in a limp curve and the head hangs down in front of the chest. The eye is a big black X, and a small pink tongue hangs out of the side of the beak."),
 ("02_flam_dead_two", "2:3 (portrait)", "attach 01", FLAM,
  f"A single cartoon flamingo, {SAMEF}, full body, exact side view facing to the right, whole body in frame with a wide margin. Now BOTH legs are down and straight, a little apart, so it stands on two legs. The body sags slightly, the neck droops forward in a limp curve and the head hangs down. The eye is a big black X, and a small pink tongue hangs out of the beak."),
 ("03_flam_dead_heap", "3:2 (landscape)", "attach 01", FLAM,
  f"A single cartoon flamingo, {SAMEF}, collapsed on the ground in a funny limp heap, side view: the body lies on its belly, both long legs are splayed out and bent in different directions, the neck is flopped flat along the ground toward the right side of the image. The eye is a big black X and a small pink tongue hangs out. A wide, low shape, the whole heap in frame with a wide margin."),
 ("04_flam_live_one", "2:3 (portrait)", "attach 01", FLAM,
  f"A single cartoon flamingo, {SAMEF}, full body, exact side view facing to the right, whole body in frame with a wide margin. It is alive and awake, standing on ONE straight vertical leg with the other leg folded up and tucked against its belly; the standing foot is directly below the middle of the body. The neck is upright in a neat S-curve with the head held high. A simple round black eye with a small white glint, calm friendly look, beak closed."),
 ("05_flam_sleep_one", "2:3 (portrait)", "attach ONLY 04 (this is an edit of 04)", None,
  "Edit the attached image. Change: the eye is now closed, drawn as one small downward-curved black line, with a peaceful sleeping look. Preserve everything else exactly: the pose, the one-legged stance, the body, neck, head position, beak, legs, colours, outline weight, framing and the flat light-blue background (#9BCFFD). Constraints: no extra objects, no text, no letter Z."),
 ("06_flam_live_two", "2:3 (portrait)", "attach 01", FLAM,
  f"A single cartoon flamingo, {SAMEF}, full body, exact side view facing to the right, whole body in frame with a wide margin. It is alive and standing on TWO legs with both knees slightly bent, clearly making an effort: the body is tense, the neck is upright in an S-curve, a wide round worried black eye with a white glint, one small raised eyebrow line, the beak clenched in a strained grimace."),
 ("07_sci_note", "2:3 (portrait)", "none - make this one first for the researcher, pick the best", SCI,
  "A single cartoon researcher, full body, three-quarter view facing to the right, whole body in frame with a wide margin. He holds a brown clipboard with a white sheet in the hand on the LEFT side of the image and a yellow pencil in the hand on the RIGHT side of the image, as if taking notes. Curious face: one eyebrow raised, small closed mouth."),
 ("08_sci_hold", "2:3 (portrait)", "attach 07", SCI,
  f"A single cartoon researcher, {SAMES}, full body, three-quarter view facing to the right, whole body in frame with a wide margin. Both arms are stretched forward toward the RIGHT side of the image at chest height, hands open as if carefully holding something upright in front of him. The hands are empty, there is no clipboard and no pencil. Focused face, the tip of a pink tongue sticking out of the corner of the mouth."),
 ("09_sci_wow", "2:3 (portrait)", "attach 07", SCI,
  f"A single cartoon researcher, {SAMES}, full body, three-quarter view facing to the right, leaning back slightly, whole body in frame with a wide margin. Both arms are raised with open empty hands, there is no clipboard and no pencil. Amazed face: eyebrows high, wide eyes, mouth open in a round \"o\" with a pink tongue visible."),
 ("10_gate", "3:2 (landscape)", "none", "TEXT",
  "A simple cartoon wooden zoo entrance gate, front view, symmetrical, the whole gate in frame with a wide margin: two thick brown wooden posts and a curved wooden sign board across the top. EXACT TEXT on the board: ZOO, in big bold cream-white capital letters, verbatim - no extra characters."),
 ("11_reeds", "3:2 (landscape)", "none", "OBJ",
  "A row of three separate clumps of green pond reeds with brown cattail tops, side view. Each clump stands apart from the others with clear empty space between them, all on the same baseline, the whole row in frame with a wide margin."),
]
out = ["# Flamingo Short - prompts for the pictures (copy-paste)\n",
       "File name = the heading. Save each picture as PNG under that name.\n"]
for name, aspect, ref, design, subj in P:
    if design is None:
        full = subj
    else:
        st = STYLE.format(notext="" if design == "TEXT" else "no text, ")
        d = "" if design in ("TEXT", "OBJ") else " " + design
        full = f"{subj}{d} {st} {BG}"
    out.append(f"## {name}\n\nAspect: {aspect} · Reference: {ref}\n\n```\n{full}\n```\n")
open("prompts-copy-paste.md", "w").write("\n".join(out))
print("\n".join(out))
