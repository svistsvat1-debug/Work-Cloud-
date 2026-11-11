# Prompts - lava-fire-hose

All pictures: model gpt-image-2.5-sunburst, resolution 1K, 1 variation, text prompt only (no references, no edits, no uploads).
Character pictures = pose text + the locked STYLE_CHAR block from memory/STYLE.md (word for word) + KEY.
Object pictures = subject + STYLE_OBJ + KEY. Backgrounds = scene + STYLE_BG. Full prompt texts are on the ElevenLabs flow nodes
(flow "lava-fire-hose").

| sprite | quality | aspect | pose / subject text |
|--------|---------|--------|---------------------|
| hero_aim | medium | 2:3 | Full body, three-quarter view facing right, feet apart, confident. Cocky cheerful: eyebrows raised, small confident closed smile. Both hands hold a short brass fire-hose nozzle (brass cone, black rubber grip ring) at waist height, tip pointing right; NO hose attached. |
| worried_aim | medium | 2:3 | Same nozzle; leaning back away from something on the right, knees bent, left foot stepping back. Worried: brows tilted up in the middle, wide eyes, small wobbly open mouth. |
| deadpan_nozzle | medium | 2:3 | Facing the viewer, nozzle held up in front of the chest pointing straight up; looks down at it, deadpan: flat half-closed lids, flat mouth line. |
| shock_cu | medium | 2:3 | Close-up: only head and top of chest, bottom edge cuts the body at the chest. Facing the viewer, centred. Shocked: brows very high, eyes wide, mouth a big tall oval with a pink tongue. |
| cheer | medium | 2:3 | Three-quarter right, jumping for joy: both arms high, open hands, mouth open in a happy shout, feet off the ground. |
| yawn | medium | 2:3 | Three-quarter right, slumped, arms hanging; huge yawn: eyes squeezed shut as curved lines, mouth a tall oval with pink tongue. |
| proud | medium | 2:3 | Three-quarter right, arms crossed, proud and smug: half-closed eyes, one eyebrow raised, wide closed smile. |
| bg_field | medium | 2:3 | Vertical: light-blue sky, two small clouds; far right a wide dark-grey volcano with a wisp of smoke; horizon at 50 %; open field of old dark lava rock, a few green bushes, one palm tree far left; empty flat ground lower middle; no buildings / lava / fire / water. + STYLE_BG |
| bg_harbor | medium | 2:3 | Vertical: small fishing harbour town on a northern island: pale grey-blue cloudy sky; green cliff far left; small houses with red / blue / green roofs on the left shore; dark reddish-brown volcanic cone far right; horizon 45 %; calm deep-blue harbour water in the lower 40 %, flat waterline; short grey stone pier from the left; empty dark rocky shore right; no boats / lava / people. + STYLE_BG |
| ship | medium | 3:2 | Small chunky pump ship, exact side view, bow right: round red hull with dark-grey bottom stripe, white cabin with round windows at the back, short black funnel, big grey water cannon on the front deck pointing up-right, two grey hoses on deck; straight keel; no water / spray / text. + STYLE_OBJ + KEY |
| house | low | 2:3 | Small one-storey wooden house, three-quarter view: pale yellow walls, red pointed roof, brown door, one square window, flat base. + STYLE_OBJ + KEY |
| boats | low | 3:2 | Two small fishing boats side by side with a wide gap, exact side view, bows right: LEFT blue hull, RIGHT orange hull, each a small white wheelhouse with a square window and a short mast; no water. + STYLE_OBJ + KEY (magenta #FF00FF) |

Every cut-out passed the sheet check (qa/sheet_all.png) on the first try: no redo was needed.
Code-drawn (no picture): the lava character (shape, crust, hot streaks, face, rock reveal), the hose, all water streams,
steam, drops, spray, the storm wave, clouds, sea squiggles, the signs, the calendar, the sweat drop.
