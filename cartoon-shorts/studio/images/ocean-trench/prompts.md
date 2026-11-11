# Prompts - ocean-trench

All pictures: model gpt-image-2.5-sunburst, resolution 1K, 1 variation, text prompt only (no references, no edits).
Character pictures = pose text + STYLE_CHAR (with the hero's measured numbers, see memory/STYLE.md) + KEY.
The hero (hero_hold) was generated first with the unmeasured STYLE_CHAR; every later character prompt used the measured block.

| sprite | quality | aspect | pose / subject text |
|--------|---------|--------|---------------------|
| hero_hold | medium | 2:3 | Full body, three-quarter view facing to the right, standing straight. Cheerful and curious expression: eyebrows raised, small happy open smile. The hand on the RIGHT side of the image holds a black tied garbage bag by its knot at hip height; the other hand hangs relaxed. |
| windup | medium | 2:3 | Full body, three-quarter view facing to the right, leaning back in a big wind-up for a throw: the arm on the LEFT side of the image swings back and up, holding a black tied garbage bag by its knot high above and behind the head; the other arm stretches forward to the right for balance. Determined happy expression. |
| throw_follow | medium | 2:3 | Full body, three-quarter view facing to the right, just after throwing: leaning forward, the arm on the RIGHT side stretched forward and up, hand EMPTY and open; delighted, mouth wide open. |
| smug_cu | medium | 2:3 | Waist-up close-up (came out full body), facing the viewer: smug, one eyebrow raised, half-closed eyes, wide closed grin, thumbs-up on the RIGHT side. |
| pair_bored_sleep | medium | 3:2 | Two identical copies: looking at own fingernails; LEFT bored half lids; RIGHT identical but asleep. |
| pair_catch | medium | 3:2 | Two identical copies, arms raised above the head: LEFT alarmed, hands empty; RIGHT holding the garbage bag above the head, flat unimpressed face. |
| volcano | medium | 2:3 | Tall cone-shaped volcanic island, grey-brown rock, flat crater with orange lava, no smoke, no face, straight cut bottom. + STYLE_OBJ + KEY |
| bg_cutaway | medium | 2:3 | Vertical cutaway: sky, sea surface at 18 %, three darker water bands, sandy seafloor left, V trench at 40 % width, rocky ledge right, grey slab diving to the lower right, orange molten rock at the bottom; no labels/arrows/characters. + STYLE_BG |
| bag | low | 2:3 | Single black garbage bag, plump, small knot with two ear tips. + STYLE_OBJ + KEY |
| boat | low | 3:2 | Small wooden rowboat, exact side view, empty, bow on the right, no oars, no water. + STYLE_OBJ + KEY |

Full prompt texts are stored on the ElevenLabs flow nodes (flow ocean-trench-trash).
