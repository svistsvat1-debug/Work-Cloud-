# Moths & Lights — промпти для Google Flow

Higgsfield не підключений, тому картинки генеруються в Google Flow. Flow не робить прозорий фон, тому
використовується запасний варіант зі скіла: суцільний світло-блакитний фон #9BCFFD, який потім вирізається в коді (`key.py`).

## Порядок

1. **moth_up** — першим. 2–4 варіанти, обрати один → це еталон стилю (HERO).
2. **moth_down, moth_worried_up, moth_crashed** — moth_up як reference (ingredient). **moth_worried_down** — moth_worried_up як reference.
3. **scientist, lamp_on, moon, grass_row, trees_strip** — moth_up як reference (тільки для стилю).
4. **lamp_off** — lamp_on як reference.
5. Завантажити PNG у найбільшому розмірі, який дає Flow, назвати файли точно як нижче.

Перевірка перед відправкою: фон рівний, без градієнта/тіні/віньєтки; об'єкт не торкається країв; немає тексту; обводка чорна й однакова.

## STYLE (вже вставлено в кожен промпт)

```
Flat 2D cartoon, simple kids' cut-out animation style: thick smooth black outlines of even weight, flat colours with one very soft shade on one side, clean vector-like linework, no texture, no gradients, no text, no border, no watermark. Isolated on a perfectly flat, uniform, solid light-blue background (#9BCFFD) that fills the whole image: no sky, no ground, no floor shadow, no glow, no vignette. Whole subject in frame with a wide empty margin on every side.
```

## 1. moth_up.png — 1:1 — HERO

```
A cute cartoon moth flying, side view facing to the right (its head on the right side of the image). A big round fluffy cream-coloured head, a small oval tan body, two feathery brown antennae, four rounded wings in warm tan and light brown with one simple dark-brown spot on each front wing, six short thin black legs tucked under the body. Small solid black oval eyes, simple curved black eyebrows, a small calm smile. Both wings raised high above the body (upstroke). Flat 2D cartoon, simple kids' cut-out animation style: thick smooth black outlines of even weight, flat colours with one very soft shade on one side, clean vector-like linework, no texture, no gradients, no text, no border, no watermark. Isolated on a perfectly flat, uniform, solid light-blue background (#9BCFFD) that fills the whole image: no sky, no ground, no floor shadow, no glow, no vignette. Whole subject in frame with a wide empty margin on every side.
```

## 2. moth_down.png — 1:1 — reference: moth_up

```
Edit the reference image: the same moth in exactly the same place and the same size, but both wings pushed down below the body (downstroke). Everything else identical: the same head, body, face, colours, black outlines and the same flat solid light-blue background (#9BCFFD). No text.
```

## 3. moth_worried_up.png — 1:1 — reference: moth_up

```
Edit the reference image: the same moth in the same pose with the wings raised, in exactly the same place and the same size, but now worried: eyebrows tilted up in the middle, wide eyes, a small open wobbly mouth with a pink tongue. Everything else identical: the same body, wings, colours, black outlines and the same flat solid light-blue background (#9BCFFD). No text.
```

## 4. moth_worried_down.png — 1:1 — reference: moth_worried_up

```
Edit the reference image: the same worried moth in exactly the same place and the same size, but both wings pushed down below the body (downstroke). Everything else identical: the same worried face, body, colours, black outlines and the same flat solid light-blue background (#9BCFFD). No text.
```

## 5. moth_crashed.png — 1:1 — reference: moth_up

```
The same cartoon moth as in the reference image, now lying on its back after a crash, seen from the side: belly up, six thin legs sticking up in the air, wings spread flat to both sides, antennae bent. Dazed face: eyes squeezed shut drawn as two black chevrons > <, a small wavy mouth. No ground drawn. Same drawing style as the reference image. Flat 2D cartoon, simple kids' cut-out animation style: thick smooth black outlines of even weight, flat colours with one very soft shade on one side, clean vector-like linework, no texture, no gradients, no text, no border, no watermark. Isolated on a perfectly flat, uniform, solid light-blue background (#9BCFFD) that fills the whole image: no sky, no ground, no floor shadow, no glow, no vignette. Whole subject in frame with a wide empty margin on every side.
```

## 6. scientist.png — 1:1 — reference: moth_up (стиль)

```
A simple white cartoon character with a big round head, a small soft body, noodle arms with simple four-finger hands and short legs with rounded feet, flat white fill with a very soft pale-grey shade on one side, small solid black oval eyes, simple curved black eyebrows, no nose, no hair. He wears an open white lab coat and round safety goggles pushed up on his forehead. Full body, three-quarter view facing to the right. He stands behind a big boxy black video camera on a tall three-legged tripod, bends slightly forward with one eye pressed to the camera's viewfinder, both hands on the camera; focused expression: eyebrows slightly lowered, mouth a small flat line. The camera lens points to the right side of the image. Same drawing style as the reference image. Flat 2D cartoon, simple kids' cut-out animation style: thick smooth black outlines of even weight, flat colours with one very soft shade on one side, clean vector-like linework, no texture, no gradients, no text, no border, no watermark. Isolated on a perfectly flat, uniform, solid light-blue background (#9BCFFD) that fills the whole image: no sky, no ground, no floor shadow, no glow, no vignette. Whole subject in frame with a wide empty margin on every side.
```

## 7. lamp_on.png — 9:16 — reference: moth_up (стиль)

```
An old-fashioned black iron street lamp: a tall thin post with a simple round base and a classic four-sided lantern head with a small pointed roof on top. The lantern's glass panels are lit: flat bright warm yellow (#FFE27A) with a pale yellow-white centre. Front view, straight and symmetrical. No face, no light rays, no glow around it. Same drawing style as the reference image. Flat 2D cartoon, simple kids' cut-out animation style: thick smooth black outlines of even weight, flat colours with one very soft shade on one side, clean vector-like linework, no texture, no gradients, no text, no border, no watermark. Isolated on a perfectly flat, uniform, solid light-blue background (#9BCFFD) that fills the whole image: no sky, no ground, no floor shadow, no glow, no vignette. Whole subject in frame with a wide empty margin on every side.
```

## 8. lamp_off.png — 9:16 — reference: lamp_on

```
Edit the reference image: the same street lamp switched off: the lantern's glass panels are flat dark grey (#6B6F7A) instead of yellow. Everything else identical: the same shape, size, position, black outlines and the same flat solid light-blue background (#9BCFFD). No glow, no text.
```

## 9. moon.png — 1:1 — reference: moth_up (стиль)

```
A flat cartoon full Moon: a perfect circle in pale cream-yellow (#FFF1C1) with a soft, slightly darker cream shade on one side and five simple round craters in slightly darker cream. No face. Front view, centred. Same drawing style as the reference image. Flat 2D cartoon, simple kids' cut-out animation style: thick smooth black outlines of even weight, flat colours with one very soft shade on one side, clean vector-like linework, no texture, no gradients, no text, no border, no watermark. Isolated on a perfectly flat, uniform, solid light-blue background (#9BCFFD) that fills the whole image: no sky, no ground, no floor shadow, no glow, no vignette. Whole subject in frame with a wide empty margin on every side.
```

## 10. grass_row.png — 16:9 — reference: moth_up (стиль)

```
A row of five separate small grass tufts and round bushes of different sizes in dark night green (#2E6B3F) with a darker green shade, simple spiky blades, all standing on one invisible horizontal line, front view, with clear empty gaps between them. Same drawing style as the reference image. Flat 2D cartoon, simple kids' cut-out animation style: thick smooth black outlines of even weight, flat colours with one very soft shade on one side, clean vector-like linework, no texture, no gradients, no text, no border, no watermark. Isolated on a perfectly flat, uniform, solid light-blue background (#9BCFFD) that fills the whole image: no sky, no ground, no floor shadow, no glow, no vignette. Whole subject in frame with a wide empty margin on every side.
```

## 11. trees_strip.png — 16:9 — reference: moth_up (стиль)

```
A wide horizontal row of simple round cartoon trees and bushes in dark blue-green night colours (#1F4A45 with a darker shade #163834), flat shapes overlapping into one connected strip, front view, the bottom edge of the strip is one straight horizontal line. Same drawing style as the reference image. Flat 2D cartoon, simple kids' cut-out animation style: thick smooth black outlines of even weight, flat colours with one very soft shade on one side, clean vector-like linework, no texture, no gradients, no text, no border, no watermark. Isolated on a perfectly flat, uniform, solid light-blue background (#9BCFFD) that fills the whole image: no sky, no ground, no floor shadow, no glow, no vignette. Whole subject in frame with a wide empty margin on every side.
```

---

## Звуки (за бажанням) — ElevenLabs Sound Effects

| Файл | Промпт | Тривалість |
|---|---|---|
| crickets.mp3 | Night ambience, crickets chirping in a quiet field, no music, no voice | 10 s |
| flutter.mp3 | Soft fluttering moth wings, quick light flaps, close up | 1 s |
| whoosh.mp3 | Short soft cartoon whoosh, air swish | 1 s |
| stamp.mp3 | Cartoon rubber stamp slam, punchy thud | 1 s |
| rec_beep.mp3 | Video camera record beep, single short electronic beep | 1 s |
| pop.mp3 | Cartoon pop with a springy boing, something popping up out of the ground | 1 s |
| switch.mp3 | Old light switch click, then a soft electric buzz as a lamp turns on | 1.5 s |
| hum.mp3 | Steady low electric hum of a street lamp | 5 s |
| rise.mp3 | Short cartoon rising slide whistle | 1 s |
| thud.mp3 | Small cartoon body falling onto grass, soft thud with a little bounce | 1 s |
| tweet.mp3 | Cartoon dizzy birds tweeting after a bonk | 2 s |
