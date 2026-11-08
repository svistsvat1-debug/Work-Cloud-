# Short: "You Can't Lift This Finger (Check Yours) 🖐️"

**Ідея (1 речення):** глядач повторює трюк на своїй руці: середній палець підігнутий, і безіменний не піднімається, бо в нього немає власного м'яза-розгинача, а його сухожилля прив'язане до сусідніх.

**Формат:** вертикальний cut-out cartoon у стилі "Can we throw trash in a volcano?". Головний персонаж — сама рука, а на безіменному пальці в коді з'являються очі. Довжина ~28–30 с.

**Пайплайн (Higgsfield не підключений):**
1. Озвучку робиш ти в ElevenLabs v4 за текстом нижче.
2. Картинки робиш ти в Google Flow за промптами нижче.
3. Я ріжу фон, анімую в Remotion, додаю SFX і рендерю 4K.

---

## 1. Озвучка для ElevenLabs v4 (з тегами)

Теги в квадратних дужках не озвучуються. v4 розуміє теги звичайними словами.
Точну 2-секундну паузу після "ring finger" я виставлю в монтажі, тому `[long pause]` може вийти будь-якої довжини.

```
[curious] Put your hand on a table. [short pause] Do exactly this.
[calm, clear] Palm down. [short pause] Fold your middle finger under.
[relaxed] Lift your thumb. [short pause] [playful] Easy. [short pause] Index. [short pause] Easy. [short pause] Pinky. [short pause] Easy.
[mischievous, slowly] Now... your ring finger. [long pause]
[chuckles] Stuck? [playful] Most people are.
[conversational, explaining] Your middle and ring fingers share one muscle, and their tendons are tied together.
So the folded middle finger holds the ring finger down... like a leash.
[matter-of-fact] Index and pinky have backup muscles. [short pause] The ring finger doesn't.
[curious, playful] Could you lift it? Comment yes or no.
```

**Чиста версія (без тегів):**
> Put your hand on a table. Do exactly this. Palm down. Fold your middle finger under. Lift your thumb. Easy. Index. Easy. Pinky. Easy. Now... your ring finger. Stuck? Most people are. Your middle and ring fingers share one muscle, and their tendons are tied together. So the folded middle finger holds the ring finger down, like a leash. Index and pinky have backup muscles. The ring finger doesn't. Could you lift it? Comment yes or no.

**Кількість слів:** 76. Очікувана довжина ~26–29 с мови плюс 2 с паузи. Точну цифру побачу після озвучки.

**Налаштування:**
- Голос: звичайний, природний чоловічий голос (conversational, не диктор і не низький). Підійде, наприклад, "Tim Riley – Natural. Conversational", якщо він є в бібліотеці.
- Модель: Eleven v4.
- Якщо є повзунок Stability, став Natural. Creative дає більше емоцій, але голос частіше переграє.
- Зроби 3–4 дублі й вибери той, де "Easy" звучить легко, а не награно. Якщо `[chuckles]` виходить штучним, прибери тег.
- Формат: MP3 найвищої якості або WAV, одним файлом.

---

## 2. Промпти для Google Flow (картинки)

**Загальні правила:**
- Модель: Nano Banana Pro, якщо є (краще виконує складні інструкції), інакше стандартна Nano Banana.
- Flow не робить прозорий фон, тому всі картинки на суцільному зеленому. Фон я виріжу сам.
- На кожен промпт генеруй 2–4 варіанти й бери найкращий. Скачуй у максимальній роздільності.
- Порядок важливий. Картинки 2–5 робляться як **edit**: відповідну картинку додаєш у Flow як reference / ingredient. Робиш їх завжди від **hand_folded**, а не ланцюжком одна від одної, щоб рука не "пливла".

**Перевірка кожної картинки:**
- рівно 5 пальців;
- великий палець з правильного боку;
- фон — один рівний зелений колір без тіні;
- змінено тільки той палець, який треба.

| # | Файл | Формат | Як робити |
|---|---|---|---|
| 1 | `hand_flat.png` | 3:4 | нова генерація (hero, задає стиль) |
| 2 | `hand_folded.png` | 3:4 | edit картинки 1 |
| 3 | `hand_thumb.png` | 3:4 | edit картинки 2 |
| 4 | `hand_index.png` | 3:4 | edit картинки 2 |
| 5 | `hand_pinky.png` | 3:4 | edit картинки 2 |
| 6 | `hand_top.png` | 9:16 | нова генерація, картинка 2 як reference стилю |

### 1 · hand_flat.png (3:4, нова генерація)
```
A single cartoon right hand lying flat, palm down, on an invisible flat surface. Seen from the front and above at about a 45-degree angle: the fingertips point toward the viewer, and the wrist and forearm go back and up and are cut off by the top edge of the image. All five fingers are straight, relaxed and flat, every fingertip touches the surface, with small even gaps between the fingers. Exactly five fingers. The thumb is on the RIGHT side of the image, the little finger on the LEFT side of the image. The hand is centred and fills about 70% of the image width.

Style: flat 2D cartoon, simple kids' explainer look. Thick smooth black outlines of even weight, flat white fill with one very soft pale-grey shade on one side, simple rounded fingers, no fingernails, no wrinkles, no veins, no skin texture, no gradients, clean vector-like linework. No text, no border, no watermark. Background: one flat solid pure green colour (#00FF00) from edge to edge. No table, no floor, no shadow, no gradient. Whole hand in frame with a clear margin; only the forearm is cut off by the top edge.
```

### 2 · hand_folded.png (3:4, edit, reference = hand_flat)
```
Edit the attached image. Change ONLY the middle finger: fold it down and under the palm, so it bends at its middle knuckle and that bent knuckle presses on the surface, tucked between the index finger and the ring finger. The thumb, index finger, ring finger and little finger stay exactly as they are: straight, flat, fingertips on the surface. Keep everything else identical: the same camera angle, the same size and position of the hand and forearm, the same line thickness, the same white and grey colours, the same flat pure green (#00FF00) background with no shadow. Exactly five fingers.
```

### 3 · hand_thumb.png (3:4, edit, reference = hand_folded)
```
Edit the attached image. Change ONLY the thumb (on the RIGHT side of the image): lift it up off the surface, so it is raised high in the air, pointing up and slightly outward. The middle finger stays folded under the palm; the index finger, ring finger and little finger stay flat with their fingertips on the surface. Keep everything else identical: the same camera angle, the same size and position of the hand and forearm, the same lines and colours, the same flat pure green (#00FF00) background with no shadow. Exactly five fingers.
```

### 4 · hand_index.png (3:4, edit, reference = hand_folded)
```
Edit the attached image. Change ONLY the index finger (the one next to the thumb): lift it up off the surface, so it bends up at its base knuckle and points up, with the fingertip clearly in the air. The middle finger stays folded under the palm; the thumb, ring finger and little finger stay on the surface. Keep everything else identical: the same camera angle, the same size and position of the hand and forearm, the same lines and colours, the same flat pure green (#00FF00) background with no shadow. Exactly five fingers.
```

### 5 · hand_pinky.png (3:4, edit, reference = hand_folded)
```
Edit the attached image. Change ONLY the little finger (on the LEFT side of the image): lift it up off the surface, so it bends up at its base knuckle and points up, with the fingertip clearly in the air. The middle finger stays folded under the palm; the thumb, index finger and ring finger stay on the surface. Keep everything else identical: the same camera angle, the same size and position of the hand and forearm, the same lines and colours, the same flat pure green (#00FF00) background with no shadow. Exactly five fingers.
```

### 6 · hand_top.png (9:16, нова генерація, reference = hand_folded)
```
The same cartoon hand as in the attached image, in exactly the same drawing style, now seen from directly above (top-down view): we look straight down at the back of the hand. The hand lies palm down; the fingers point to the top of the image; the wrist and a long forearm go straight down and are cut off by the bottom edge of the image (the forearm takes up the lower 40% of the image). The middle finger is folded under the palm, so from above it is only a short stub that ends in a rounded bent knuckle. The thumb, index finger, ring finger and little finger are straight and flat, slightly spread, with clear gaps between them. Exactly five fingers. The thumb is on the LEFT side of the image, the little finger on the RIGHT side of the image. The back of the hand and the forearm are plain and clean (no veins, no tendons, no knuckle lines): one big simple white area. The hand is centred and fills about 60% of the image width.

Style: flat 2D cartoon, thick smooth black outlines of even weight, flat white fill with one very soft pale-grey shade on one side, no fingernails, no texture, no gradients, no text, no border, no watermark. Background: one flat solid pure green colour (#00FF00) from edge to edge, no shadow.
```

**Якщо Flow не може зробити підігнутий палець** (картинка 2), спробуй варіант із "the middle finger is curled under the palm like a hidden knuckle" або надішли мені найближчий варіант. Дрібні неточності я виправлю при вирізанні.

Стіл, тіні, очі на пальці, сухожилля в "рентгені", галочки й текст я малюю в коді, тому для них картинки не потрібні.

---

## 3. Що я зроблю з цим (план кадрів, таймінг уточню під озвучку)

| ~Час | Слова | Кадр | Гег / ефект |
|---|---|---|---|
| 0–2 с | Put your hand on a table… | `hand_flat` по центру на дерев'яному столі, текст "PUT YOUR HAND ON A TABLE. DO EXACTLY THIS." | повільний наїзд камери |
| 2–4 с | Fold your middle finger under | swap → `hand_folded` (squash) | стук кісточки по столу, підпис "MIDDLE FINGER UNDER" |
| 4–9 с | Thumb / Index / Pinky. Easy. | swap → `hand_thumb` / `hand_index` / `hand_pinky` і назад | на кожен палець вискакує зелена галочка "✓" з pop-звуком |
| 9–12.5 с | Now… your ring finger. + пауза 2 с | наїзд на безіменний | у пальця відкриваються очі; він напружується "> <", тремтить, з'являються краплина поту й таймер "TRY IT" на 2 с |
| 12.5–14 с | Stuck? Most people are. | той самий кадр | палець "здувається", очі напівзакриті, краплина з'їжджає |
| 14–18 с | share one muscle… tied together | різкий cut → `hand_top`, scan-лінія → рентген | у передпліччі світиться спільний м'яз, від нього 4 сухожилля до пальців; перемички між сухожиллями блимають |
| 18–22 с | holds the ring finger down… like a leash | рентген, наїзд | перемичка натягується як повідок, безіменний із очима смикається вперед і його тягне назад, звук "boing" |
| 22–25.5 с | Index and pinky have backup muscles… | рентген | два окремі м'язи для вказівного й мізинця світяться "+", у безіменного порожнє пунктирне місце "✗" |
| 25.5–29 с | Could you lift it? Comment yes or no. | cut → фронтальний вид, `hand_folded` | безіменний дивиться в камеру й "знизує плечима", кнопки YES / NO; в останньому кадрі середній палець розгинається → `hand_flat` (луп на кадр 0) |

---

## 4. Що надіслати мені назад

1. Озвучку (найкращий дубль), MP3 або WAV.
2. Шість PNG з назвами з таблиці вище.
3. (Опційно) SFX з ElevenLabs Sound Effects. Якщо не надішлеш, зроблю прості звуки сам у коді.
   - soft cartoon pop, short, clean, no music (галочки);
   - single knuckle knock on a wooden table (згинання пальця);
   - cartoon straining squeak, rubber stretching, short (безіменний тужиться);
   - soft sci-fi scanner sweep with rising electronic hum, 1 second (рентген);
   - rubber band stretch and twang (повідок);
   - short soft whoosh (переходи).

---

## 5. Джерела (перевірка фактів)

- StatPearls / NCBI Bookshelf — extensor digitorum розгинає пальці 2–5; окремо вказівний розгинає extensor indicis, окремо мізинець — extensor digiti minimi: https://ncbi.nlm.nih.gov/books/NBK534805
- Juncturae tendinum — перемички між сухожиллями розгинача, обмежують незалежне розгинання: https://en.wikipedia.org/wiki/Juncturae_tendinum
- Folia Morphologica (2013), анатомічне дослідження juncturae tendinum: https://journals.viamedica.pl/folia_morphologica/article/view/FM.2013.0040
- Häger-Ross & Schieber, J Neurosci 2000 — великий, вказівний і мізинець рухаються незалежніше за середній і безіменний: https://pmc.ncbi.nlm.nih.gov/articles/PMC6773164
- Анатомія різниться між людьми, і частина людей трохи піднімає безіменний, тому в тексті "Most people are".

---

## 6. Результат (2026-11-08)

**Відео:** `shorts/ring-finger/out/ring-finger-4K-final.mp4` (2160x3840, 60 fps, 35,3 с, звук −15,6 LUFS / пік −1,4 dBFS). Великий файл у git не комітиться, тому надсилається окремо. Проєкт Remotion лежить у `shorts/ring-finger/`.

**Що змінилось відносно плану:**
- **Картинки з Flow не використані.** 4 з 6 вийшли фото замість мультяшного стилю (одна ще й із середнім пальцем), тому руку зроблено 3D-моделлю в коді, у тому ж стилі: біла заливка, товстий чорний контур, сіра тінь. Плюс такого рішення: пальці згинаються плавно, вид зверху для рентгену — та сама рука, все векторне й чітке в 4K.
- **Озвучка:** ElevenLabs v4, голос "Mark – Natural Conversations", дубль 32,8 с. Тег `[long pause]` майже не дав паузи, тому після "ring finger" в монтажі вставлено тишу на 2 с: таймер "TRY IT".
- **SFX:** синтезовані в коді (pop, стук кісточки, whoosh, скан-рентген, "boing" повідка, тікання таймера), гучність −17…−32 dB під голосом, пік міксу −3,9 dBFS.

**Біти (с):**

| Час | Подія |
|---|---|
| 0 | рука на столі + "PUT YOUR HAND ON A TABLE" |
| 5,1–6,1 | середній палець згинається під долоню, стук кісточки |
| 7,0–12,4 | великий / вказівний / мізинець піднімаються; чек-лист THUMB ✓ INDEX ✓ PINKY ✓ |
| 14,25 | у безіменного відкриваються очі, RING ? |
| 15,3–17,3 | пауза: палець тужиться "> <", піт, таймер TRY IT |
| 17,8 | "STUCK?" → RING ✗, палець "здувається" |
| 20,0 | cut → вид зверху, скан → рентген |
| 21,6 | спільний м'яз + 4 сухожилля |
| 23,5 | перемички між сухожиллями |
| 24,6–28,3 | "повідок": сухожилля середнього тягне, безіменний смикається й відскакує |
| 29,8 | зелені "запасні" м'язи вказівного й мізинця (+) |
| 31,6 | у безіменного немає (✗) |
| 32,3 | cut → фронт, "COULD YOU LIFT IT?" |
| 33,9 / 34,2 | кнопки YES / NO |
| 34,7–35,3 | середній палець розгинається → кадр як на старті (луп) |

---

## 7. Публікація (YouTube Shorts)

**Назва:**
```
You Can't Lift This Finger (Check Yours) 🖐️
```
Альтернатива для A/B (точніша, збігається з "most people" у відео): `Most People Can't Lift This Finger (Check Yours) 🖐️`

**Опис:**
```
Put your hand on a table, fold your middle finger under, and try to lift your ring finger. For most people, it barely moves.

Why? One muscle (extensor digitorum) lifts your fingers, and the ring finger's tendon is tied to its neighbors by small bands called juncturae tendinum. With the middle finger folded, those bands hold the ring finger down like a leash. Your index finger and pinky have their own extra muscles (extensor indicis and extensor digiti minimi). The ring finger doesn't.

Anatomy varies, so some people can lift it a little.

Could you lift it? Comment YES or NO 👇

Sources:
StatPearls (NCBI Bookshelf): https://ncbi.nlm.nih.gov/books/NBK534805
Häger-Ross & Schieber, Journal of Neuroscience (2000): https://pmc.ncbi.nlm.nih.gov/articles/PMC6773164

#shorts #fingertrick #anatomy #humanbody #science
```

**Теги:**
```
ring finger trick, can't lift ring finger, why can't i lift my ring finger, finger trick, try this, check yours, hand anatomy, tendons, juncturae tendinum, extensor digitorum, human body facts, science shorts, body facts
```

**Налаштування:**

| Пункт | Значення |
|---|---|
| Аудиторія | "No, it's not made for kids" (загальна аудиторія). Якщо поставити "made for kids", YouTube вимкне коментарі, і заклик "Comment YES or NO" не спрацює. Остаточне рішення про аудиторію — за власником каналу. |
| Altered or synthetic content | No: відео явно анімоване, голос не імітує реальну людину |
| Категорія | Education (або Science & Technology) |
| Мова відео / субтитрів | English |
| Субтитри | `shorts/ring-finger/ring-finger.en.srt` (точний текст озвучки) |
| Коментарі | On; "Hold potentially inappropriate comments for review" |
| Обкладинка | `shorts/ring-finger/thumbnail.jpg` (1080x1920): "TRY THIS / MOST PEOPLE CAN'T", безіменний з очима + стрілка. Якщо завантажити свою обкладинку не дає — кадр ~16,0 с |
| Плейлист | серія "Check Yours" / "Try This" (якщо є) — [MISSING] |
| Related video | твій хіт "(Check Yours)" — [MISSING] посилання |
| Час публікації | [MISSING]: YouTube Studio → Analytics → Audience → "When your viewers are on YouTube" |
| Ліцензія | Standard YouTube License, embedding allowed, publish to subscriptions feed |

**Закріплений коментар:**
```
Be honest 👀 Could you lift your ring finger? YES or NO 👇
```
Наступний коментар для дискусії (опційно): `Now try it with your other hand. Same result?`
