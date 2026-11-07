# Short #3 — "This Bird Keeps Its Tongue Wrapped Around Its Skull 🤯"

Формат: cut-out cartoon Short (зелений фон → вирізаємо → Remotion), 9:16, 25–30 с.
Статус: сценарій ✅ · промпти Flow ✅ · озвучка — робить автор у ElevenLabs · картинки — автор у Google Flow · анімація (крок 3) — Claude після отримання файлів.

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

## 2. Картинки — Google Flow (зелений фон для вирізання)

Як генерувати:
1. Модель: **Nano Banana** (або новіша версія Nano Banana, якщо є у Flow). Формат указаний біля кожної картинки.
2. Спочатку **01**. Згенерувати 2–4 варіанти, вибрати найчистіший (рівні чорні контури, рівний зелений фон).
3. Для **02–05, 08, 09** додати **01** як референс (ingredient / "+" біля поля промпту). Для **06** — теж 01. Для **07** — референс **06**.
4. Скачати у найбільшій роздільності (PNG, upscale 2K/4K, якщо Flow пропонує), назвати як у таблиці, надіслати всі 9.

Перевірка кожної картинки перед відправкою:
- фон — один рівний яскраво-зелений колір, без тіней, градієнтів, підлоги;
- на персонажі немає зеленого кольору і зеленої "обводки";
- чорний контур замкнений навколо всього об'єкта;
- нічого не обрізано рамкою (крім стовбура 08 і шиї 06/07 — так задумано);
- дизайн дятла однаковий з 01 (кольори, плями, дзьоб, око).

| # | Файл | Формат | Референс | Навіщо в ролику |
|---|---|---|---|---|
| 01 | `01_bird_hero.png` | 9:16 | — | головна поза на стовбурі, кадр 0 і фінал |
| 02 | `02_bird_peck.png` | 9:16 | 01 | очі заплющені під час ударів |
| 03 | `03_bird_surprised.png` | 9:16 | 01 | реакція на рентген / фінальне питання |
| 04 | `04_bird_happy.png` | 9:16 | 01 | задоволений після личинки |
| 05 | `05_bird_xray.png` | 9:16 | 01 | рентген у "вікні сканера" |
| 06 | `06_head.png` | 9:16 | 01 | крупний план голови |
| 07 | `07_head_xray.png` | 9:16 | 06 | крупний рентген: кістки й язик малюю кодом поверх |
| 08 | `08_trunk.png` | 9:16 | 01 (лише стиль) | стовбур |
| 09 | `09_grub.png` | 1:1 | 01 (лише стиль) | личинка (очі домалюю кодом) |

### 01 — `01_bird_hero.png` (9:16)
```
A cute cartoon woodpecker, full body, side view in profile facing LEFT, clinging upright to an invisible vertical tree trunk on the left: the body is upright, both feet grip at the left side of the body, the stiff pointed tail points down and presses to the left like a prop, the head and beak point straight left, ready to peck. Design: big round head, short straight pointed grey beak, one big round cartoon eye (white with a large black pupil and a small white glint), white face and cheeks with one black stripe from the beak to the neck, a bright red patch on the back of the head, glossy black back and wings with neat white spots and a big white shoulder patch, white chest and belly, a bright red patch under the tail, short grey legs with sharp toes. Calm, focused expression, beak closed. Draw only the bird: no tree, no branch, no ground. The whole bird fits in the frame with a clear margin. Flat 2D cartoon style for a kids' science video: simple clean vector shapes, thick smooth black outlines of even weight, flat colours with only one soft shade, no texture, no gradients, no text, no watermark. Background: a single perfectly flat solid chroma-key green (#00FF00) from edge to edge, no sky, no ground, no shadows, no vignette. No green colour anywhere on the subject and no green glow on its edges.
```

### 02 — `02_bird_peck.png` (9:16, референс 01)
```
Use the attached image as an exact reference: the same woodpecker, the same pose, size, position and framing, the same colours and line weight. Change only the eye: it is squeezed tightly shut, drawn as one short thick black chevron, as if the bird is pecking very hard. Everything else stays identical. Flat 2D cartoon style for a kids' science video: simple clean vector shapes, thick smooth black outlines of even weight, flat colours with only one soft shade, no texture, no gradients, no text, no watermark. Background: a single perfectly flat solid chroma-key green (#00FF00) from edge to edge, no sky, no ground, no shadows, no vignette. No green colour anywhere on the subject and no green glow on its edges.
```

### 03 — `03_bird_surprised.png` (9:16, референс 01)
```
Use the attached image as an exact reference: the same woodpecker, the same pose, size, position and framing, the same colours and line weight. Change only the expression: the eye is wide open with a small black pupil turned toward the viewer, the beak is slightly open in surprise, and three small feathers on top of the head stick straight up. Everything else stays identical. Flat 2D cartoon style for a kids' science video: simple clean vector shapes, thick smooth black outlines of even weight, flat colours with only one soft shade, no texture, no gradients, no text, no watermark. Background: a single perfectly flat solid chroma-key green (#00FF00) from edge to edge, no sky, no ground, no shadows, no vignette. No green colour anywhere on the subject and no green glow on its edges.
```

### 04 — `04_bird_happy.png` (9:16, референс 01)
```
Use the attached image as an exact reference: the same woodpecker, the same pose, size, position and framing, the same colours and line weight. Change only the expression: the eye is closed in a happy upside-down U-shaped arc, the beak is closed with a small content smile line at its base, a soft pink blush on the cheek, and the chest is slightly puffed out with pride. Everything else stays identical. Flat 2D cartoon style for a kids' science video: simple clean vector shapes, thick smooth black outlines of even weight, flat colours with only one soft shade, no texture, no gradients, no text, no watermark. Background: a single perfectly flat solid chroma-key green (#00FF00) from edge to edge, no sky, no ground, no shadows, no vignette. No green colour anywhere on the subject and no green glow on its edges.
```

### 05 — `05_bird_xray.png` (9:16, референс 01)
```
Use the attached image as an exact reference: the same woodpecker silhouette in the same pose, size, position and framing. Turn it into a cartoon X-ray view: the whole body is filled with a flat dark navy blue (#14284B) and keeps its thick black outer outline; inside it is a simple cartoon skeleton in flat white with soft light-blue edges: a smooth rounded skull with a large round eye socket, the upper and lower beak bones, the neck bones, the spine, the wing bones, the leg bones and the toes. Feather patterns are not visible. Keep the big white cartoon eye with the black pupil inside the eye socket. Leave a clear band of plain navy between the skull and the outline of the head at the back and on top; the skull is a clean shape with nothing attached around it, and no tongue is shown. Flat 2D cartoon style for a kids' science video: simple clean vector shapes, thick smooth black outlines of even weight, flat colours with only one soft shade, no texture, no gradients, no text, no watermark. Background: a single perfectly flat solid chroma-key green (#00FF00) from edge to edge, no sky, no ground, no shadows, no vignette. No green colour anywhere on the subject and no green glow on its edges.
```

### 06 — `06_head.png` (9:16, референс 01)
```
Use the attached image as the character reference: the same woodpecker design, colours and line weight. Close-up of its head and neck only: side view in profile facing LEFT, beak closed and pointing straight left, calm open eye. The head is large and fills the upper half of the image, with a clear margin above it and to the left of the beak tip; the neck continues straight down and is cut off by the bottom edge of the image. Flat 2D cartoon style for a kids' science video: simple clean vector shapes, thick smooth black outlines of even weight, flat colours with only one soft shade, no texture, no gradients, no text, no watermark. Background: a single perfectly flat solid chroma-key green (#00FF00) from edge to edge, no sky, no ground, no shadows, no vignette. No green colour anywhere on the subject and no green glow on its edges.
```

### 07 — `07_head_xray.png` (9:16, референс 06)
```
Use the attached image as an exact reference: the same head and neck in the same pose, size, position and framing. Turn it into a cartoon X-ray view: the head and neck are filled with a flat dark navy blue (#14284B) and keep their thick black outer outline; inside are simple cartoon bones in flat white with soft light-blue edges: a smooth rounded skull with a large round eye socket, the upper and lower beak bones with the jaw joint, and the neck bones going down. Keep the big white cartoon eye with the black pupil inside the eye socket. The skull is clearly smaller than the head: leave a wide band of plain navy between the skull and the head outline at the back and on top of the head, and under the lower jaw. The skull is a clean shape with nothing attached around it, and no tongue is shown. Flat 2D cartoon style for a kids' science video: simple clean vector shapes, thick smooth black outlines of even weight, flat colours with only one soft shade, no texture, no gradients, no text, no watermark. Background: a single perfectly flat solid chroma-key green (#00FF00) from edge to edge, no sky, no ground, no shadows, no vignette. No green colour anywhere on the subject and no green glow on its edges.
```

### 08 — `08_trunk.png` (9:16, референс 01 лише для стилю)
```
Use the attached image for the drawing style only, do not draw the bird. A tall straight vertical section of a tree trunk seen from the side, centred, about one third of the image wide, running from the top edge to the bottom edge of the image (cut off by the frame at both ends). Warm brown bark (#8A5A3B) with darker brown vertical grooves, a few simple bark cracks and one small knot. No branches, no leaves, no moss, no holes, no animals. Flat 2D cartoon style for a kids' science video: simple clean vector shapes, thick smooth black outlines of even weight, flat colours with only one soft shade, no texture, no gradients, no text, no watermark. Background: a single perfectly flat solid chroma-key green (#00FF00) from edge to edge, no sky, no ground, no shadows, no vignette. No green colour anywhere on the subject and no green glow on its edges.
```

### 09 — `09_grub.png` (1:1, референс 01 лише для стилю)
```
Use the attached image for the drawing style only, do not draw the bird. A cute cartoon wood-boring beetle larva (a grub): a chubby, slightly curved segmented body in pale cream (#F4E4C4) with soft beige segment lines, a small rounded light-brown head on the LEFT end with tiny dark-brown jaws, and six tiny stubby legs just behind the head. Side view, lying horizontally, head on the left, centred with a clear margin. No eyes, no face. Flat 2D cartoon style for a kids' science video: simple clean vector shapes, thick smooth black outlines of even weight, flat colours with only one soft shade, no texture, no gradients, no text, no watermark. Background: a single perfectly flat solid chroma-key green (#00FF00) from edge to edge, no sky, no ground, no shadows, no vignette. No green colour anywhere on the subject and no green glow on its edges.
```

---

## 3. Beat sheet (план анімації; точний таймінг — після озвучки)

| # | Слова | Що на екрані | Картинки | Звук |
|---|---|---|---|---|
| 1 | "This woodpecker's tongue doesn't end in its mouth." | Кадр 0: дятел барабанить по стовбуру, на кожному ударі очі заплющуються, летять тріски. На "tongue" "вікно сканера" наїжджає на голову → видно скелет; рожевий язик світиться, від горла за потилицю біжить світла лінія. Текст: ITS TONGUE DOESN'T END IN ITS MOUTH | 01, 02, 05, 08 | "тук-тук", гул сканера |
| 2 | "It's attached to two thin bones… curl behind its skull, over the top of its head… all the way to the nostril." | Камера пірнає в рентген голови. Кістки (hyoid) малюються точно під слова: за потилицю → через маківку → до ніздрі. Підпис HYOID BONES. Гег: око стежить за кінчиком по колу, на "nostril" вибалушується + крапля поту | 07 | тихий whoosh, "boop" на ніздрі |
| 3 | "Why? Muscles slide those bones forward… tongue shoots way past the beak, deep into a beetle tunnel." | "Why?" — дятел дивиться в камеру. Камера відʼїжджає: стовбур зліва стає рентгеном-розрізом із ходом донизу. М'язи на кістках стискаються, вся петля ковзає вперед навколо черепа, язик вистрілює в отвір і повзе ходом. Гег: личинка внизу жує деревину, помічає язик, очі вибалушуються | 07, 08, 09 | stretch-whoosh |
| 4 | "The tip has backward barbs and sticky spit… so the grub gets hooked, and reeled in." | Крупно кінчик: зубці вискакують по одному, липка крапля з відблиском. Кінчик торкається личинки → прилипла; "reeled in" — язик різко втягується, личинка летить угору ходом (очі "> <"), ковток. Сканер повертає нормальний вигляд: дятел задоволений | 07, 06, 09, 04 | "чвак", "з-з-зіп" котушки, ковток |
| 5 | "So, which bird should I X-ray next? Subscribe for more." | Загальний план: дятел дивиться на глядача; текст WHICH BIRD SHOULD I X-RAY NEXT?; на стовбурі вискакує кнопка SUBSCRIBE, дятел дзьобає її (тук) → кнопка сіріє. Останній кадр = кадр 0 → луп | 03, 01, 02, 08 | pop, тук, клік |

Малюю кодом (генерувати не треба): язик + під'язикові кістки, м'язи, зубці, слина, тріски, розріз стовбура з ходом, очі личинки, крапля поту, сканер, небо, підписи, кнопка SUBSCRIBE.

Технічно: Remotion-проєкт `shorts-studio/` (1080×1920, 60 fps → рендер 2160×3840), картинки → `shorts-studio/images/woodpecker-tongue/raw/`, вирізані спрайти → `shorts-studio/public/woodpecker-tongue/`.
