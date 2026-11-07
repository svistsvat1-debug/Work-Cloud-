# Short #3 — "This Bird Keeps Its Tongue Wrapped Around Its Skull 🤯"

Формат: cut-out cartoon Short (зелений фон → вирізаємо → Remotion), 9:16, 25–30 с.
Статус: сценарій ✅ · промпти Flow ✅ (24 картинки) · озвучка — автор у ElevenLabs · картинки — автор у Google Flow · анімація (крок 3) — Claude після отримання файлів.

---

## 1. Озвучка — ElevenLabs (Eleven v4, audio tags)

Копіювати блок повністю, теги в квадратних дужках не озвучуються, це режисура.

```
[curious] This woodpecker's tongue doesn't end in its mouth.

It's attached to two thin bones... that curl behind its skull, over the top of its head... [amazed] and in some species, all the way to the nostril.

[excited] Why? Muscles slide those bones forward, and the tongue shoots way past the beak, deep into a beetle tunnel.

[mischievously] The tip has backward barbs and sticky spit... [chuckles] so the grub gets hooked, and reeled in.

[curious] So, which bird should I X-ray next? [warmly] Subscribe for more.
```

- Слів озвучки (без тегів): **80** → ~27–30 с.
- Налаштування: модель **Eleven v4**; Stability = **Natural** (якщо теги "не грають" → Creative; якщо переграє → Robust); Speed 1.0 (якщо дубль довший за 30 с → 1.05–1.1).
- Голос: той самий, що в ролику про дятла (впізнаваність каналу). Якщо міняти — звичайний природний чоловічий голос, не "диктор", напр. "Tim Riley – Natural. Conversational" (ID `1gZSmkYVRMS8w1i4plmP`, з бібліотеки ElevenLabs — наявність не перевірена).
- Згенерувати 2–3 дублі, вибрати найприродніший, скачати найвищу якість (WAV або MP3 192k) і надіслати.
- Свідомо НЕ використано: "!" і hype-слова (AI-голос переграє), міф про "ремінь безпеки для мозку" (Van Wassenbergh et al., 2022 — голова працює як жорсткий молоток, а не амортизатор).

### Факти та джерела
| Твердження в озвучці | Джерело |
|---|---|
| Основа язика (під'язиковий апарат, hyoid) огинає потилицю і йде через маківку; у деяких видів — до правої ніздрі | Cornell Lab, "Woodpeckers at work": https://dl.allaboutbirds.org/woodpeckers-at-work |
| М'язи вздовж hyoid висувають язик далеко за дзьоб | Hilton Pond Center: https://hiltonpond.org/ThisWeek030308.html |
| Кінчик: липка слина + у деяких видів зворотні зубці, що чіпляють личинку в ході | Cornell (вище); BirdNote: https://birdnote.org/node/14663 |
| "Ремінь безпеки" — міф | ScienceDaily (Current Biology, 2022): https://sciencedaily.com/releases/2022/07/220714145037.htm |
| Уточнення: hyoid не "заякорений" у ніздрі, він може заходити в носову порожнину в деяких видів | TalkOrigins FAQ: https://talkorigins.org/faqs/woodpecker/woodpecker.html |

---

## 2. Картинки — Google Flow (24 шт.)

Як генерувати:
1. Модель: **Nano Banana** (або новіша версія, якщо є у Flow). Формат і референс указані біля кожної картинки.
2. Генерувати **по порядку**: деякі картинки є правками попередніх (колонка "Референс"). Референс додається як ingredient / "+" біля поля промпту. №14 має два референси.
3. Для кожної 2–4 варіанти → вибрати найчистіший. Скачати PNG у найбільшій роздільності (upscale 2K/4K, якщо є), назвати як у таблиці.
4. Фон: №1–19 і 22–24 — зелений, №21 — пурпуровий (листя зелене), №20 — повноцінний фон без хромакею.

Перевірка кожної картинки:
- фон — один рівний колір (зелений / пурпуровий), без тіней, градієнтів, підлоги;
- на об'єкті немає кольору фону і "обводки" цього кольору;
- чорний контур замкнений навколо всього об'єкта;
- нічого не обрізано рамкою (крім 08–10, 14 — шия; 15 — язик справа; 16–17 — стовбур; 21 — гілка з кута: так задумано);
- у правках (референс = попередня картинка) лапи, хвіст, розмір і положення не зрушили.

Якщо вже згенеровано щось зі старого списку з 9 картинок — не переробляти, перейменувати: старі 01→01, 02→03, 03→04, 04→06, 05→07, 06→08, 08→16, 09→11. Стару 07 (рентген голови з оком) краще замінити новою 09 (без ока): око на рентгені малюю кодом, щоб воно рухалось.

| # | Файл | Формат | Референс | Пріоритет | Де в ролику |
|---|---|---|---|---|---|
| 01 | `01_bird_hero.png` | 9:16 | — | ⭐ | базова поза на стовбурі, кадр 0 / луп |
| 02 | `02_bird_windup.png` | 9:16 | 01 | ⭐ | замах перед ударом (барабанний дріб) |
| 03 | `03_bird_peck.png` | 9:16 | 01 | ⭐ | удар, очі заплющені |
| 04 | `04_bird_surprised.png` | 9:16 | 01 | ⭐ | помітив сканер |
| 05 | `05_bird_asking.png` | 9:16 | 01 | ➕ | "Which bird should I X-ray next?" |
| 06 | `06_bird_happy.png` | 9:16 | 01 | ➕ | задоволений після личинки |
| 07 | `07_bird_xray.png` | 9:16 | 01 | ⭐ | рентген у вікні сканера |
| 08 | `08_head.png` | 9:16 | 01 | ⭐ | крупний план голови |
| 09 | `09_head_xray.png` | 9:16 | 08 | ⭐ | рентген голови: кістки hyoid і язик — кодом |
| 10 | `10_head_xray_open.png` | 9:16 | 09 | ⭐ | дзьоб прочинений, язик вистрілює |
| 11 | `11_grub.png` | 1:1 | 01 (стиль) | ⭐ | личинка жує деревину |
| 12 | `12_grub_curled.png` | 1:1 | 11 | ➕ | личинка злякалась |
| 13 | `13_grub_stretched.png` | 1:1 | 11 | ➕ | личинку витягують за хвіст |
| 14 | `14_head_chewing.png` | 9:16 | 08 + 11 | ➕ | дятел із личинкою в дзьобі |
| 15 | `15_tongue_tip.png` | 16:9 | 01 (стиль) | ⭐ | крупно: зубці + липка слина |
| 16 | `16_trunk.png` | 9:16 | 01 (стиль) | ⭐ | стовбур |
| 17 | `17_trunk_cutaway.png` | 9:16 | 16 | ⭐ | стовбур у розрізі (хід личинки — кодом) |
| 18 | `18_woodchips.png` | 1:1 | 16 | ➕ | тріски з-під дзьоба |
| 19 | `19_xray_scanner.png` | 1:1 | 01 (стиль) | ➕ | рамка рентген-сканера |
| 20 | `20_bg_forest.png` | 9:16 | 01 (стиль) | ⭐ | фон лісу (без хромакею) |
| 21 | `21_fg_leaves.png` | 9:16 | 01 (стиль) | ➕ | листя на передньому плані (глибина) |
| 22 | `22_owl.png` | 1:1 | 01 (стиль) | ➕ | картка "наступний птах?" |
| 23 | `23_flamingo.png` | 1:1 | 01 (стиль) | ➕ | картка "наступний птах?" |
| 24 | `24_penguin.png` | 1:1 | 01 (стиль) | ➕ | картка "наступний птах?" |

Малюю кодом (генерувати не треба): язик і під'язикові кістки, м'язи, хід у деревині, отвір від дзьоба, очі на рентгені й у личинки, крапля поту, небо в режимі рентгену, підписи, кнопка SUBSCRIBE.

### A. Дятел — повний зріст

#### 01 — `01_bird_hero.png` (9:16)
```
A cute cartoon woodpecker, full body, side view in profile facing LEFT, clinging upright to an invisible vertical tree trunk on the left: the body is upright, both feet grip at the left side of the body, the stiff pointed tail points down and presses to the left like a prop, the head and beak point straight left, ready to peck. Design: big round head, short straight pointed grey beak, one big round cartoon eye (white with a large black pupil and a small white glint), white face and cheeks with one black stripe from the beak to the neck, a bright red patch on the back of the head, glossy black back and wings with neat white spots and a big white shoulder patch, white chest and belly, a bright red patch under the tail, short grey legs with sharp toes. Calm, focused expression, beak closed. Draw only the bird: no tree, no branch, no ground. The whole bird fits in the frame with a clear margin. Flat 2D cartoon style for a kids' science video: simple clean vector shapes, thick smooth black outlines of even weight, flat colours with only one soft shade, no texture, no gradients, no text, no watermark. Background: a single perfectly flat solid chroma-key green (#00FF00) from edge to edge, no sky, no ground, no shadows, no vignette. No green colour anywhere on the subject and no green glow on its edges.
```

#### 02 — `02_bird_windup.png` (9:16, референс 01)
```
Use the attached image as an exact reference: the same woodpecker, the same size, position and framing, the same colours and line weight; the feet and the tail stay in exactly the same place. Change only the pose: the upper body and the head lean back to the right, away from the invisible trunk, the beak still pointing left, like winding up before a hard peck. The eye is open and focused, slightly narrowed with determination, beak closed. Flat 2D cartoon style for a kids' science video: simple clean vector shapes, thick smooth black outlines of even weight, flat colours with only one soft shade, no texture, no gradients, no text, no watermark. Background: a single perfectly flat solid chroma-key green (#00FF00) from edge to edge, no sky, no ground, no shadows, no vignette. No green colour anywhere on the subject and no green glow on its edges.
```

#### 03 — `03_bird_peck.png` (9:16, референс 01)
```
Use the attached image as an exact reference: the same woodpecker, the same size, position and framing, the same colours and line weight; the feet and the tail stay in exactly the same place. Change only the pose and the eye: the upper body and the head snap forward to the left as if hitting the invisible trunk hard with the beak tip; the eye is squeezed tightly shut, drawn as one short thick black chevron. Flat 2D cartoon style for a kids' science video: simple clean vector shapes, thick smooth black outlines of even weight, flat colours with only one soft shade, no texture, no gradients, no text, no watermark. Background: a single perfectly flat solid chroma-key green (#00FF00) from edge to edge, no sky, no ground, no shadows, no vignette. No green colour anywhere on the subject and no green glow on its edges.
```

#### 04 — `04_bird_surprised.png` (9:16, референс 01)
```
Use the attached image as an exact reference: the same woodpecker, the same size, position and framing, the same colours and line weight; the feet and the tail stay in exactly the same place. Change only the expression: the eye is wide open with a small black pupil turned toward the viewer, the beak is slightly open in surprise, and three small feathers on top of the head stick straight up. Everything else stays identical. Flat 2D cartoon style for a kids' science video: simple clean vector shapes, thick smooth black outlines of even weight, flat colours with only one soft shade, no texture, no gradients, no text, no watermark. Background: a single perfectly flat solid chroma-key green (#00FF00) from edge to edge, no sky, no ground, no shadows, no vignette. No green colour anywhere on the subject and no green glow on its edges.
```

#### 05 — `05_bird_asking.png` (9:16, референс 01)
```
Use the attached image as an exact reference: the same woodpecker, the same size, position and framing, the same colours and line weight; the feet and the tail stay in exactly the same place. Change only the upper body and the expression: the head turns a little toward the viewer, the wing on the right side of the image lifts and its tip points toward the viewer, as if asking "what do you think?"; the eye is open and curious with one raised eyebrow line above it, the beak slightly open. Flat 2D cartoon style for a kids' science video: simple clean vector shapes, thick smooth black outlines of even weight, flat colours with only one soft shade, no texture, no gradients, no text, no watermark. Background: a single perfectly flat solid chroma-key green (#00FF00) from edge to edge, no sky, no ground, no shadows, no vignette. No green colour anywhere on the subject and no green glow on its edges.
```

#### 06 — `06_bird_happy.png` (9:16, референс 01)
```
Use the attached image as an exact reference: the same woodpecker, the same size, position and framing, the same colours and line weight; the feet and the tail stay in exactly the same place. Change only the expression: the eye is closed in a happy upside-down U-shaped arc, the beak is closed with a small content smile line at its base, a soft pink blush on the cheek, and the chest is slightly puffed out with pride. Flat 2D cartoon style for a kids' science video: simple clean vector shapes, thick smooth black outlines of even weight, flat colours with only one soft shade, no texture, no gradients, no text, no watermark. Background: a single perfectly flat solid chroma-key green (#00FF00) from edge to edge, no sky, no ground, no shadows, no vignette. No green colour anywhere on the subject and no green glow on its edges.
```

#### 07 — `07_bird_xray.png` (9:16, референс 01)
```
Use the attached image as an exact reference: the same woodpecker silhouette in the same pose, size, position and framing. Turn it into a cartoon X-ray view: the whole body is filled with a flat dark navy blue (#14284B) and keeps its thick black outer outline; inside it is a simple cartoon skeleton in flat white with soft light-blue edges: a smooth rounded skull with a large round eye socket, the upper and lower beak bones, the neck bones, the spine, the wing bones, the leg bones and the toes. Feather patterns are not visible. The eye socket is an empty dark hollow ring with no eyeball. Leave a clear band of plain navy between the skull and the outline of the head at the back and on top; the skull is a clean shape with nothing attached around it, and no tongue is shown. Flat 2D cartoon style for a kids' science video: simple clean vector shapes, thick smooth black outlines of even weight, flat colours with only one soft shade, no texture, no gradients, no text, no watermark. Background: a single perfectly flat solid chroma-key green (#00FF00) from edge to edge, no sky, no ground, no shadows, no vignette. No green colour anywhere on the subject and no green glow on its edges.
```

### B. Голова — крупний план

#### 08 — `08_head.png` (9:16, референс 01)
```
Use the attached image as the character reference: the same woodpecker design, colours and line weight. Close-up of its head and neck only: side view in profile facing LEFT, beak closed and pointing straight left, calm open eye. The head is large and fills the upper half of the image, with a clear margin above it and to the left of the beak tip; the neck continues straight down and is cut off by the bottom edge of the image. Flat 2D cartoon style for a kids' science video: simple clean vector shapes, thick smooth black outlines of even weight, flat colours with only one soft shade, no texture, no gradients, no text, no watermark. Background: a single perfectly flat solid chroma-key green (#00FF00) from edge to edge, no sky, no ground, no shadows, no vignette. No green colour anywhere on the subject and no green glow on its edges.
```

#### 09 — `09_head_xray.png` (9:16, референс 08)
```
Use the attached image as an exact reference: the same head and neck in the same pose, size, position and framing. Turn it into a cartoon X-ray view: the head and neck are filled with a flat dark navy blue (#14284B) and keep their thick black outer outline; inside are simple cartoon bones in flat white with soft light-blue edges: a smooth rounded skull with a large round eye socket, the upper and lower beak bones with the jaw joint, and the neck bones going down. The eye socket is an empty dark hollow ring with no eyeball. The skull is clearly smaller than the head: leave a wide band of plain navy between the skull and the head outline at the back and on top of the head, and under the lower jaw. The skull is a clean shape with nothing attached around it, and no tongue is shown. Flat 2D cartoon style for a kids' science video: simple clean vector shapes, thick smooth black outlines of even weight, flat colours with only one soft shade, no texture, no gradients, no text, no watermark. Background: a single perfectly flat solid chroma-key green (#00FF00) from edge to edge, no sky, no ground, no shadows, no vignette. No green colour anywhere on the subject and no green glow on its edges.
```

#### 10 — `10_head_xray_open.png` (9:16, референс 09)
```
Use the attached image as an exact reference: the same X-ray head and neck in the same size, position and framing, the same colours and line weight. Change only the beak: the upper and lower beak bones open slightly, hinged at the jaw joint, leaving a narrow wedge-shaped gap between them that is widest at the tip. The eye socket stays an empty dark hollow ring with no eyeball; nothing else changes, and no tongue is shown. Flat 2D cartoon style for a kids' science video: simple clean vector shapes, thick smooth black outlines of even weight, flat colours with only one soft shade, no texture, no gradients, no text, no watermark. Background: a single perfectly flat solid chroma-key green (#00FF00) from edge to edge, no sky, no ground, no shadows, no vignette. No green colour anywhere on the subject and no green glow on its edges.
```

### C. Личинка

#### 11 — `11_grub.png` (1:1, референс 01 лише для стилю)
```
Use the attached image for the drawing style only, do not draw the bird. A cute cartoon wood-boring beetle larva (a grub): a chubby, slightly curved segmented body in pale cream (#F4E4C4) with soft beige segment lines, a small rounded light-brown head on the LEFT end with tiny dark-brown jaws, and six tiny stubby legs just behind the head. Side view, lying horizontally, head on the left, centred with a clear margin. No eyes, no face. Flat 2D cartoon style for a kids' science video: simple clean vector shapes, thick smooth black outlines of even weight, flat colours with only one soft shade, no texture, no gradients, no text, no watermark. Background: a single perfectly flat solid chroma-key green (#00FF00) from edge to edge, no sky, no ground, no shadows, no vignette. No green colour anywhere on the subject and no green glow on its edges.
```

#### 12 — `12_grub_curled.png` (1:1, референс 11)
```
Use the attached image as an exact reference for the grub's design, colours, size and line weight. Change only the pose: the grub curls up tightly into a round C shape, its head tucked in toward its tail and its tiny legs pulled in, as if it is scared. No eyes, no face. Flat 2D cartoon style for a kids' science video: simple clean vector shapes, thick smooth black outlines of even weight, flat colours with only one soft shade, no texture, no gradients, no text, no watermark. Background: a single perfectly flat solid chroma-key green (#00FF00) from edge to edge, no sky, no ground, no shadows, no vignette. No green colour anywhere on the subject and no green glow on its edges.
```

#### 13 — `13_grub_stretched.png` (1:1, референс 11)
```
Use the attached image as an exact reference for the grub's design, colours and line weight. Change only the pose: the grub is stretched out long and straight, its body longer and thinner as if it is being pulled backward by the end of its tail on the right side of the image; the head is on the left and the tiny legs flail in the air. No eyes, no face. Flat 2D cartoon style for a kids' science video: simple clean vector shapes, thick smooth black outlines of even weight, flat colours with only one soft shade, no texture, no gradients, no text, no watermark. Background: a single perfectly flat solid chroma-key green (#00FF00) from edge to edge, no sky, no ground, no shadows, no vignette. No green colour anywhere on the subject and no green glow on its edges.
```

#### 14 — `14_head_chewing.png` (9:16, референси 08 + 11)
```
Use the first attached image (the woodpecker head) as an exact reference: the same head and neck, size, position, framing, colours and line weight. Use the second attached image (the grub) only for the grub's colours and style. Change: the beak is closed and holds the grub, only the back half of the grub sticks out of the beak tip and hangs down a little; the eye is closed in a happy upside-down U-shaped arc and the cheek is slightly puffed out with a soft pink blush. Flat 2D cartoon style for a kids' science video: simple clean vector shapes, thick smooth black outlines of even weight, flat colours with only one soft shade, no texture, no gradients, no text, no watermark. Background: a single perfectly flat solid chroma-key green (#00FF00) from edge to edge, no sky, no ground, no shadows, no vignette. No green colour anywhere on the subject and no green glow on its edges.
```

### D. Язик

#### 15 — `15_tongue_tip.png` (16:9, референс 01 лише для стилю)
```
Use the attached image for the drawing style only, do not draw the bird. A cartoon close-up of the tip of a woodpecker's long tongue, lying horizontally: the pink tongue (#FF8FB1) comes in from the right edge of the image (cut off by the frame) and ends on the left in a hard, pointed pale-tan tip. Along both edges of the tip are six tiny sharp barbs that point backward, toward the right, like little arrowheads. The tip is coated with sticky saliva drawn as glossy opaque pale blue-white (#E8F4FF) blobs with two hanging drops and small white shine highlights. No beak, no bird, no wood. Flat 2D cartoon style for a kids' science video: simple clean vector shapes, thick smooth black outlines of even weight, flat colours with only one soft shade, no texture, no gradients, no text, no watermark. Background: a single perfectly flat solid chroma-key green (#00FF00) from edge to edge, no sky, no ground, no shadows, no vignette. No green colour anywhere on the subject and no green glow on its edges.
```

### E. Сцена

#### 16 — `16_trunk.png` (9:16, референс 01 лише для стилю)
```
Use the attached image for the drawing style only, do not draw the bird. A tall straight vertical section of a tree trunk seen from the side, centred, about one third of the image wide, running from the top edge to the bottom edge of the image (cut off by the frame at both ends). Warm brown bark (#8A5A3B) with darker brown vertical grooves, a few simple bark cracks and one small knot. No branches, no leaves, no moss, no holes, no animals. Flat 2D cartoon style for a kids' science video: simple clean vector shapes, thick smooth black outlines of even weight, flat colours with only one soft shade, no texture, no gradients, no text, no watermark. Background: a single perfectly flat solid chroma-key green (#00FF00) from edge to edge, no sky, no ground, no shadows, no vignette. No green colour anywhere on the subject and no green glow on its edges.
```

#### 17 — `17_trunk_cutaway.png` (9:16, референс 16)
```
Use the attached image as an exact reference: the same trunk, the same width, position and framing, the same line weight. Change: show it as a cutaway, as if the trunk were sliced in half from top to bottom: between the left and right edges we now see the light inner wood (#E9C58F) with soft, slightly darker vertical growth lines; the brown bark remains only as a narrow strip along the left edge and along the right edge. No tunnel, no holes, no insects. Flat 2D cartoon style for a kids' science video: simple clean vector shapes, thick smooth black outlines of even weight, flat colours with only one soft shade, no texture, no gradients, no text, no watermark. Background: a single perfectly flat solid chroma-key green (#00FF00) from edge to edge, no sky, no ground, no shadows, no vignette. No green colour anywhere on the subject and no green glow on its edges.
```

#### 18 — `18_woodchips.png` (1:1, референс 16)
```
Use the attached image for colours and drawing style only. Six small cartoon wood chips and splinters arranged in two rows of three with clear space between them, each a different small angular shape: light inner wood (#E9C58F), some of them with a thin strip of brown bark (#8A5A3B) on one edge. Flat 2D cartoon style for a kids' science video: simple clean vector shapes, thick smooth black outlines of even weight, flat colours with only one soft shade, no texture, no gradients, no text, no watermark. Background: a single perfectly flat solid chroma-key green (#00FF00) from edge to edge, no sky, no ground, no shadows, no vignette. No green colour anywhere on the subject and no green glow on its edges.
```

#### 19 — `19_xray_scanner.png` (1:1, референс 01 лише для стилю)
```
Use the attached image for the drawing style only, do not draw the bird. A cartoon X-ray scanner panel seen straight from the front: a thick rounded rectangular frame in light grey (#D9DEE6) with a darker grey inner edge, a yellow-and-black warning stripe along the top, a small red light and a small round dial on the bottom edge, and a short handle on the left and on the right side. The inside of the frame is completely empty: the same flat green background shows through the middle. Flat 2D cartoon style for a kids' science video: simple clean vector shapes, thick smooth black outlines of even weight, flat colours with only one soft shade, no texture, no gradients, no text, no watermark. Background: a single perfectly flat solid chroma-key green (#00FF00) from edge to edge, no sky, no ground, no shadows, no vignette. No green colour anywhere on the subject and no green glow on its edges.
```

#### 20 — `20_bg_forest.png` (9:16, референс 01 лише для стилю, БЕЗ зеленого фону)
```
Use the attached image for the drawing style only, do not draw the bird. A full-frame vertical background illustration for a cartoon: a calm sunny forest seen from a distance. Pale blue sky (#BFE6FF) at the top with one or two simple soft clouds, rows of soft rounded tree crowns in muted greens, a few distant pale-brown trunks, a soft light-green ground at the very bottom. Very simple big flat shapes, thin soft outlines in a darker shade of each colour (not black), low contrast and slightly pale so a character in front of it stands out; the centre of the image is calm and empty, with no single tree in the middle. The picture fills the whole image edge to edge. No animals, no people, no text, no watermark.
```

#### 21 — `21_fg_leaves.png` (9:16, референс 01 лише для стилю, ПУРПУРОВИЙ фон)
```
Use the attached image for the drawing style only, do not draw the bird. A leafy tree branch entering from the top-left corner of the image: a brown twig with a cluster of nine simple rounded leaves in two shades of green. It fills only the top-left corner; the rest of the image is empty background. Flat 2D cartoon style: simple clean vector shapes, thick smooth black outlines of even weight, flat colours with only one soft shade, no texture, no gradients, no text, no watermark. Background: a single perfectly flat solid magenta (#FF00FF) from edge to edge, no shadows, no vignette. No magenta, pink or purple anywhere on the leaves or the twig.
```

### F. Фінальні картки "Which bird should I X-ray next?"

#### 22 — `22_owl.png` (1:1, референс 01 лише для стилю)
```
Use the attached image for the drawing style only, do not draw the woodpecker. A cute cartoon owl, head and shoulders, facing the viewer, centred with a clear margin: a round body in warm brown (#9A6B43) with a cream face disc, big round yellow-orange eyes with black pupils, a small grey hooked beak and two small ear tufts. Flat 2D cartoon style for a kids' science video: simple clean vector shapes, thick smooth black outlines of even weight, flat colours with only one soft shade, no texture, no gradients, no text, no watermark. Background: a single perfectly flat solid chroma-key green (#00FF00) from edge to edge, no sky, no ground, no shadows, no vignette. No green colour anywhere on the subject and no green glow on its edges.
```

#### 23 — `23_flamingo.png` (1:1, референс 01 лише для стилю)
```
Use the attached image for the drawing style only, do not draw the woodpecker. A cute cartoon flamingo, head and long curved neck, side view facing left, centred with a clear margin: pink feathers (#FF9EB8), a bent beak that is white near the face with a black tip, one big round cartoon eye. Flat 2D cartoon style for a kids' science video: simple clean vector shapes, thick smooth black outlines of even weight, flat colours with only one soft shade, no texture, no gradients, no text, no watermark. Background: a single perfectly flat solid chroma-key green (#00FF00) from edge to edge, no sky, no ground, no shadows, no vignette. No green colour anywhere on the subject and no green glow on its edges.
```

#### 24 — `24_penguin.png` (1:1, референс 01 лише для стилю)
```
Use the attached image for the drawing style only, do not draw the woodpecker. A cute cartoon penguin, full body, standing and facing the viewer, centred with a clear margin: black back and head, white belly and face, a small orange beak and orange feet, big round cartoon eyes. Flat 2D cartoon style for a kids' science video: simple clean vector shapes, thick smooth black outlines of even weight, flat colours with only one soft shade, no texture, no gradients, no text, no watermark. Background: a single perfectly flat solid chroma-key green (#00FF00) from edge to edge, no sky, no ground, no shadows, no vignette. No green colour anywhere on the subject and no green glow on its edges.
```

---

## 3. Beat sheet (план анімації; точний таймінг — після озвучки)

| # | Слова | Що на екрані | Картинки | Звук |
|---|---|---|---|---|
| 1 | "This woodpecker's tongue doesn't end in its mouth." | Кадр 0: ліс, листя на передньому плані, дятел барабанить (замах ↔ удар), летять тріски. Збоку виїжджає рентген-сканер → дятел завмирає, здивований. Сканер наїжджає на голову → у рамці скелет; рожевий язик світиться, від горла за потилицю біжить світла лінія. Текст: ITS TONGUE DOESN'T END IN ITS MOUTH | 20, 21, 16, 01, 02, 03, 18, 19, 04, 07 | "тук-тук", гул сканера |
| 2 | "It's attached to two thin bones… curl behind its skull, over the top of its head… all the way to the nostril." | Камера пірнає в рентген голови. Кістки hyoid малюються точно під слова: за потилицю → через маківку → до ніздрі. Підпис HYOID BONES. Гег: око (кодом) стежить за кінчиком по колу, на "nostril" вибалушується + крапля поту | 09 | тихий whoosh, "boop" на ніздрі |
| 3 | "Why? Muscles slide those bones forward… tongue shoots way past the beak, deep into a beetle tunnel." | "Why?" — око дивиться в камеру. Камера відʼїжджає: стовбур зліва просвічується → розріз із ходом донизу. М'язи на кістках стискаються, петля ковзає вперед навколо черепа, дзьоб прочиняється, язик вистрілює в отвір і повзе ходом. Гег: личинка внизу жує деревину, помічає язик, скручується від страху | 09, 10, 17, 11, 12 | stretch-whoosh |
| 4 | "The tip has backward barbs and sticky spit… so the grub gets hooked, and reeled in." | Вставка крупно: кінчик язика, зубці, крапля слини капає. Кінчик чіпляє личинку → її витягує за хвіст (розтягнута, очі "> <"), язик різко втягується. Сканер назад у норму: дятел із личинкою в дзьобі, щасливий | 15, 13, 10, 14 | "чвак", "з-з-зіп" котушки, ковток |
| 5 | "So, which bird should I X-ray next? Subscribe for more." | Загальний план: задоволений дятел → питальна поза; вгорі вискакують картки сова / фламінго / пінгвін зі знаками "?"; текст WHICH BIRD SHOULD I X-RAY NEXT?; на стовбурі кнопка SUBSCRIBE, дятел дзьобає її (тук) → кнопка сіріє. Останній кадр = кадр 0 → луп | 06, 05, 22, 23, 24, 02, 03, 01 | pop, тук, клік |

Технічно: Remotion-проєкт `shorts-studio/` (1080×1920, 60 fps → рендер 2160×3840), картинки → `shorts-studio/images/woodpecker-tongue/raw/`, вирізані спрайти → `shorts-studio/public/woodpecker-tongue/`. Вирізання: `python3 -I shorts-studio/tools/key.py in.png out.png` (зелений і пурпуровий фон).

---

## 4. Продакшн (крок 3) — що зроблено

**Результат:** `shorts-studio/out/woodpecker-tongue-4K.mp4` (2160×3840, 60 fps, 27,67 с, озвучка + SFX). Файл не в git (великий), надсилається окремо.

**Озвучка:** ElevenLabs Eleven v4, голос "Mark – Natural Conversations" (дубль автора). Таймінг слів — forced alignment (pocketsphinx, офлайн) + перевірка пауз за гучністю; голос стоїть з 0,1 с.

**Використані картинки:** 01 (дятел), 08 (голова), 11/12/13 (личинка: спокійна / скручена / витягнута), 16 (стовбур), 18 (тріски), 22 (сова), 24 (пінгвін).
**Не використані і чому:**
- здивований, щасливий, "питальна поза", удар зі стовбуром — повернуті в інший бік, з власними гілками/стовбурами, інший дизайн → вирази зроблено кодом поверх 01 (заплющені очі, здивування + чубчик, щасливі дуги + рум'янець, цікавий погляд з бровою);
- 07 рентген — дзьоб довший і поза інша, не збігається з 01 → рентген побудований кодом із силуету 01 + 08 (кістки, череп, хребет, крило), тому вікно сканера і крупний план збігаються ідеально.

**Кодом:** ліс, листя, отвір від дзьоба, рамка сканера, рентген-сітка, хід личинки і камера, під'язикові кістки (дві), м'язи, язик з твердим кінчиком, 6 зворотних зубців, слина і крапля, очі личинки, крапля поту, "?"-бульбашка, підписи HYOID BONES / MUSCLES / BARBS / STICKY SPIT, фінальне питання, картки, кнопка SUBSCRIBE → SUBSCRIBED з дзвіночком.

**Звук:** 69 синтезованих ефектів (Higgsfield / бібліотека звуків недоступні): тук-тук, whoosh сканера, біпи, "магічний" шелест кісток, boop/boing, слайд-свисток на постріл язика і втягування, тріскачка котушки, чвак, ковток, дзенькіт дзвіночка; тихий гул рентгену і "повітря" лісу. Пік зведення −4 dBFS.

**Як перерендерити:**
```
cd shorts-studio
npm install
npx remotion studio src/index.ts            # перегляд / правки
npx remotion render src/index.ts WoodpeckerTongue out/woodpecker-tongue-4K.mp4 \
  --scale=2 --image-format=png --crf=16 --pixel-format=yuv420p \
  --browser-executable=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
```
Підготовка асетів (якщо міняються картинки/звук): `tools/key.py` → `images/woodpecker-tongue/prep_upscale.py` → `prep_xray.py` → `sfx_mix.py`.

**Для наступних роликів:** качати з Flow максимальну роздільність (ці файли були 768×1376 — для 4K збільшені ×3 програмно); пози-правки робити від 01 з тим самим напрямком погляду і без стовбура/гілок у кадрі.
