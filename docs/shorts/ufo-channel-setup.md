# Канал про НЛО: пакет для запуску

> Припущення: канал англомовний, YouTube Shorts (+ TikTok/Reels), той самий пайплайн, що й в `untold-stories-format.md`: Gemini (фото) → Veo / Kling (анімація) → CapCut.
> Якщо канал має бути українською, назву, опис і хештеги треба переписати.

## 1. Концепція

**Ведучий:** Walt (Волт), вигаданий персонаж. 67 років, колишній далекобійник, який 30 років їздив нічними трасами пустелі Невада / Нью-Мексико.
Він сидить на кухні вночі й розповідає:
- що бачив сам на нічних рейсах;
- історії, які йому "надсилають" глядачі (так тем можна брати скільки завгодно).

**Чому саме такий персонаж:** звичайна людина, не "експерт по прибульцях", тому їй вірять. Спокійний голос і ніч на кухні створюють атмосферу "розповідь біля вогню". А образ, який повторюється в кожному відео, робить канал впізнаваним (на відміну від безликих AI-каналів).

## 2. Назва

| Варіант | Логіка |
|---|---|
| **What Walt Saw** (рекомендую) | Особисто й інтригує, зрозуміло, що це історія конкретної людини |
| Night Shift Sightings | Нічні рейси й спостереження, звучить як рубрика |
| Route 50 Stories | Конкретне місце (траса в Неваді, яку називають "найсамотнішою дорогою в Америці") |
| The Desert Witness | Драматичніше, але менш тепло |

Handle: `@WhatWaltSaw`, а якщо зайнятий, то `@WhatWaltSawUFO`. Чи вільні назва й handle на YouTube / TikTok — [MISSING], треба перевірити вручну.

## 3. Опис каналу

```
I drove night routes through the Nevada desert for 30 years.
Some things I saw out there, I never told anyone.
Now I tell them here — mine, and the ones you send me.

New UFO story every week. Pull up a chair.

Stories on this channel are fictional, inspired by real UFO and UAP reports.
```

> Останній рядок обов'язковий. Персонаж і відео згенеровані AI, тож подавати вигадку як справжні свідчення ризиковано: YouTube вимагає позначати реалістичний синтетичний контент (галочка "Altered or synthetic content" під час завантаження), а за "inauthentic content" можуть відмовити в монетизації. Чесне формулювання "fictional stories" знімає цей ризик і не заважає атмосфері.

## 4. Хештеги

**Під кожне відео (3–5 штук):**
```
#ufo #uap #storytime #shorts #unexplained
```

**Пул для ротації (додавати 1–2 за темою відео):**
```
#ufosighting #aliens #paranormal #scarystories #creepystories #nevada #area51 #nightdrive #truckerstories #mystery
```

**Теги в налаштуваннях відео (YouTube tags):**
```
ufo story, ufo sighting, uap, alien encounter, ufo stories at night, trucker ufo story, nevada ufo, area 51 story, scary story, what walt saw
```

## 5. Персонаж: промпти

### 5.1 CHARACTER-блок (вставляти дослівно в кожен промпт з Волтом)

```
a fictional 67-year-old American man named Walt, weathered sun-tanned face with deep wrinkles, short grey stubble beard, tired but kind pale blue eyes, short receding grey hair, faded olive-green canvas work jacket over a red and black plaid flannel shirt
```

### 5.2 Головний кадр: talking head (генерувати першим)

```
Photorealistic portrait of a fictional 67-year-old American man named Walt, weathered sun-tanned face with deep wrinkles, short grey stubble beard, tired but kind pale blue eyes, short receding grey hair, faded olive-green canvas work jacket over a red and black plaid flannel shirt. He sits at an old wooden kitchen table late at night, leaning slightly forward, looking straight into the camera as if quietly telling a story. Hands folded on the table next to a chipped white coffee mug. A single warm lamp lights him from the side, dark window behind him. Medium close-up, chest up, eye level. Vertical 9:16, natural skin texture, shot on 35mm, soft film grain, muted colors, realistic, not a real person, no text, no watermark.
```

**Як тримати одне обличчя в усіх відео:**
1. Згенеруй 4–6 варіантів, обери один і збережи як `walt_reference.png`.
2. Далі всі кадри з Волтом роби так: завантажуєш reference у Gemini + пишеш:
   `Use the exact same man from the reference image, same face, same clothes.` + опис сцени.
3. Одяг і кухню не міняй. Це "студія" каналу.

### 5.3 Додаткові кадри Волта (для перебивок у сценарії)

| Сцена | Промпт (+ reference image) |
|---|---|
| Спогад, молодий Волт за кермом | `Same man from the reference image but 30 years younger, dark hair, driving a semi-truck at night on an empty desert highway, dashboard glow on his face, looking up through the windshield in disbelief, vertical 9:16, photorealistic, 1980s film photo look, grain` |
| Дивиться в нічне небо | `Same man from the reference image standing on a dark porch at night, holding a coffee mug, looking up at the starry desert sky, seen from behind over his shoulder, vertical 9:16, photorealistic, cinematic, film grain` |
| Читає лист від глядача | `Same man from the reference image at the same kitchen table at night, reading glasses on, holding a handwritten letter, warm lamp light, vertical 9:16, photorealistic, film grain` |

### 5.4 Анімація (Veo / Kling, image-to-video з головного кадру)

```
The man calmly talks to the camera like telling a late-night story, subtle natural head movements, slow blinks, small hand gesture on the table, the lamp light flickers slightly, static camera, no zoom, realistic, no text.
```

Якщо інструмент підтримує lip-sync, то озвучку підкладай туди. Якщо ні, то Волт у кадрі тільки на початку й у кінці (5–8 с), а в середині йдуть кадри історії з озвучкою за кадром. Так навіть простіше й дешевше.

### 5.5 Голос (для ElevenLabs Voice Design або аналогу)

```
Older American man in his late sixties, low slightly raspy voice, slow calm pace, light Southwestern drawl, speaks quietly like telling a story at the kitchen table late at night, sincere and understated, never dramatic.
```

Голос теж обрати один раз і більше не міняти.

## 6. Брендинг каналу

**Аватар:**
```
Close-up portrait of the same man from the reference image, looking slightly up at the sky, faint cold blue light on his face from above, dark night background, square 1:1, photorealistic, cinematic, no text
```

**Банер (2560×1440, текст додати в Canva / CapCut):**
```
Empty two-lane desert highway at night stretching to the horizon, an old semi-truck parked on the shoulder with headlights on, a single bright unexplained light hovering low over distant mountains, starry sky, wide cinematic shot, 16:9, photorealistic, film grain, no text
```
Текст на банері: `WHAT WALT SAW` + `New UFO story every week`.

## 7. Формат відео (підставляти в промпт генерації сценарію)

| Елемент | Стандарт |
|---|---|
| Тривалість | 40–60 с, ~120–150 слів |
| Структура | Хук (Волт у кадрі, 1 фраза) → історія (кадри + озвучка) → дивна деталь / твіст → Волт у кадрі: фінальна фраза + питання до глядача |
| Перша фраза | Конкретика: рік + місце + час. Напр.: `March 1987. Route 50, Nevada. 3 AM.` |
| Подача | Від першої особи, спокійно, без "СТРАШНО!!!", з побутовими деталями (кава, радіо, CB-рація) |
| Назва відео | `[Що сталось] + 🛸` або питання. Напр.: `The Light That Followed My Truck for 40 Miles 🛸` |
| Закріплений коментар | `Ever seen something you couldn't explain? Tell me — I might read it on the channel.` (працює як збір тем) |

**Що ще потрібно від тебе:** файл-промпт генерації сценаріїв. Я адаптую його під Волта (голос персонажа, структура вище) і зроблю перші 3 сценарії.
