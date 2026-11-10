# Tiger Short - picture prompts

Short: "Why is a tiger bright orange in a green jungle?" (WhyZap). Cut-out style: every picture on a plain flat
light-blue background (#9BCFFD), which is removed in code (`images/key.py`).

Already made (ElevenLabs, GPT Image 2.5, 2K): `guy_point`, `tiger_hide`, `jungle_bg`.
Originals of the two characters are in `images/tiger/src/` - attach them as references.

Save every result as PNG with the file name given, at the highest resolution the tool offers.

| # | File name | Aspect | Reference to attach |
|---|---|---|---|
| 1 | `guy_eyes.png` | 4:5 | `guy_point.png` |
| 2 | `tiger_sheepish.png` | 3:2 | `tiger_hide.png` |
| 3 | `tiger_smug.png` | 3:2 | `tiger_hide.png` |
| 4 | `tiger_paint.png` | 1:1 | `tiger_hide.png` |
| 5 | `deer_chew.png` | 1:1 | `tiger_hide.png` (style only) |
| 6 | `deer_confused.png` | 1:1 | the finished `deer_chew.png` |
| 7 | `bush_small.png` | 1:1 | `tiger_hide.png` (style only) |
| 8 | `bushes_mid.png` | 21:9 (or 16:9) | `tiger_hide.png` (style only) |
| 9 | `fg_leaves.png` | 1:1 | `tiger_hide.png` (style only) |

## 1. guy_eyes.png

```
The same white character as in the reference image, in exactly the same drawing style. Waist-up close-up, facing the viewer, centred. He points at his own eyes with the hand on the RIGHT side of the image: index and middle finger spread in a V shape just below his eyes; the other arm hangs down. Expression: friendly, knowing little smile, eyes wide open. Head and upper body in frame with a margin. Flat 2D cartoon: big round head, small soft body, noodle arms with simple four-finger hands, thick smooth black outlines of even weight, flat white fill with a very soft pale-grey shade on one side, small solid black oval eyes, simple curved black eyebrows, no nose, no hair, no clothes. Clean vector-like linework, no texture, no text, no border. Isolated on a plain flat solid light-blue background (#9BCFFD), nothing else.
```

## 2. tiger_sheepish.png

```
The same picture as the reference image: identical tiger, identical crouching pose, body, legs, tail, stripes, size and position in the frame, identical flat light-blue background. Only the face changes: an embarrassed, sheepish expression - eyebrows tilted up in the middle, wide round eyes looking at the viewer, a wide awkward nervous grin showing teeth. Everything else stays exactly the same.
```

## 3. tiger_smug.png

```
The same picture as the reference image: identical tiger, identical crouching pose, body, legs, tail, stripes, size and position in the frame, identical flat light-blue background. Only the face changes: a smug, relaxed expression - eyes half closed with heavy eyelids, relaxed eyebrows, a wide satisfied closed-mouth smile. Everything else stays exactly the same.
```

## 4. tiger_paint.png

```
The same cartoon tiger as in the reference image, in exactly the same drawing style and colours, now sitting upright on its hind legs, three-quarter view facing to the right. The paw on the RIGHT side of the image holds up a wide paintbrush dripping bright leaf-green paint. One big uneven patch of bright leaf-green paint is brushed across its chest and belly. Expression: proud, hopeful grin, eyes looking at the viewer. Whole body including the tail in frame with a margin. Flat 2D cartoon: thick smooth black outlines of even weight, flat colours with one simple soft shade, clean vector-like linework, no texture, no text, no border. Isolated on a plain flat solid light-blue background (#9BCFFD), nothing else: no ground, no floor shadow, no paint bucket, no scenery.
```

## 5. deer_chew.png

```
A cute simple cartoon deer (a doe, no antlers) in exactly the same drawing style as the tiger in the reference image. Full body, standing on four legs, side view facing to the LEFT, head held up, a few green leaves sticking out of its mouth as it chews. Light brown fur, cream belly, a few white spots on its back, big ears, a small tail. Expression: calm and clueless, relaxed half-closed eyes. Whole body in frame with a margin. Flat 2D cartoon: big round head, simple rounded shapes, thick smooth black outlines of even weight, flat colours with one simple soft shade, small solid black oval eyes, clean vector-like linework, no texture, no text, no border. Only the deer, no tiger. Isolated on a plain flat solid light-blue background (#9BCFFD), nothing else: no ground, no grass, no floor shadow, no scenery.
```

## 6. deer_confused.png  (make it after deer_chew, attach deer_chew as the reference)

```
The same picture as the reference image: identical deer, identical standing pose, body, legs, tail, spots, size and position in the frame, identical flat light-blue background. Only the head changes: no leaves in the mouth, a confused expression - eyes wide open, one eyebrow raised high, small closed mouth pushed to one side. Everything else stays exactly the same.
```

## 7. bush_small.png

```
One small round cartoon jungle bush, in exactly the same drawing style as the reference image: a few big rounded leaf clumps in bright leaf green with one slightly darker green shade, a tiny bit of brown stem at the bottom. Thick smooth black outlines of even weight, flat colours, clean vector-like linework, no texture, no text, no border, no characters, no animals. Centred with a margin. Isolated on a plain flat solid light-blue background (#9BCFFD), nothing else: no ground, no floor shadow.
```

## 8. bushes_mid.png

```
A long horizontal row of rounded cartoon jungle bushes, ferns and big-leaf plants of different heights standing side by side, filling the full width of the image from the left edge to the right edge, with a straight flat bottom edge. Mid and dark greens, a little darker and less saturated than a bright leaf green. In exactly the same drawing style as the reference image: thick smooth black outlines of even weight, flat colours with one simple shade, clean vector-like linework, no texture, no text, no border, no characters, no animals. Isolated on a plain flat solid light-blue background (#9BCFFD) above the plants, nothing else: no ground, no sky details.
```

## 9. fg_leaves.png

```
A cluster of three big tropical jungle leaves (one monstera leaf and two long palm-like leaves) growing from the top left corner of the image and hanging down towards the centre. Dark rich green with a simple slightly lighter vein line. In exactly the same drawing style as the reference image: thick smooth black outlines of even weight, flat colours, clean vector-like linework, no texture, no text, no border, no characters, no animals. Isolated on a plain flat solid light-blue background (#9BCFFD), nothing else.
```

## Spare: jungle_bg.png (3:4, no reference) - only if the ElevenLabs one cannot be downloaded

```
Vertical background painting for a flat 2D cartoon: a dense green jungle wall seen straight on. Tall simple tree trunks, hanging vines, and many layers of big rounded leaves and bushes in soft muted greens and teal-greens that get lighter and hazier further back, with a few soft light rays from the top. The lower third is just darker, simpler foliage. No characters, no animals, no path, no sky, no flowers. Flat colours, simple rounded shapes, thin soft dark-green outlines, no black outlines, no texture, no text, no border. The jungle fills the whole image edge to edge.
```

## Prompts used for the two finished characters

`guy_point` (2:3): Full body, three-quarter view facing to the right. Expression puzzled: one eyebrow raised, small
flat mouth. The arm on the RIGHT side of the image is stretched out straight, pointing with one finger to the right;
the other arm hangs relaxed at his side. Whole body in frame with a margin. + white-character style block + background.

`tiger_hide` (3:2): A cute simple cartoon tiger, full body, crouching low on all four legs in a sneaky hunting pose,
three-quarter view facing to the right, head low, tail curled up behind on the left side of the image. Bright
saturated orange fur with a few simple black stripes, white muzzle and white belly, round ears. Expression: sneaky and
confident, focused eyes looking to the right, small smug closed-mouth grin. + flat cartoon style block + background.
