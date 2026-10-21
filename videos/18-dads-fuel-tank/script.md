# Сторі-шортс за формулою «Dad's GPS» #4 — «Dad's Fuel Tank»

Четвертий із 10 на основі хіта «Why Does Dad's GPS Still Move? 🤨». Формат: коротко (~76 слів, ~30 с), промпт картинки + промпт анімації до кожного кадру.

- **Стиль монтажу:** мінімалізм (`"style": "minimal"`), субтитри по центру, Bebas Neue.
- **Голос:** Генк. 7 кадрів 9:16 (6 нових + Kenworth у сараї з «Dad's Logbook»). Фінал без «Full story's on the channel».
- **Канон Генка:** Рей помер 2010 (16 років тому), зелений Kenworth W900 1979 стоїть у сараї (як у #1 і #2). Генк завжди веде журнал палива.
- **[CHECK]:** нового факту канону немає. Що Генк досі заправляє батькову вантажівку — лише деталь цієї історії.

## Статус

- Озвучка, 3 кліпи (01 Генк біля бака, 04 дружина, сарай) і 4 картинки (02, 05, 06, 07) отримано 2026-10-21. Рендер: `python3 tools/photo_story.py videos/18-dads-fuel-tank/story.json` → `final.mp4`, `final-no-music.mp4`. `voice.wav` обрізано до 33.7 с для петлі.
- Кліп сараю не взято: у ньому вантажівка 1940-х, а не W900 Рея (канон). Замість нього кадр W900 з «Dad's Logbook» (`shots/03.jpg`).
- Удар і спалах на початку листа, музика стихає на «Empty again» і перед петлею.

## Формула хіта → цей сюжет

| Крок | Dad's GPS | Dad's Fuel Tank |
|---|---|---|
| 1. Річ мертвого батька «живе» | GPS показує поїздки | Бак, який Генк заливає, щомісяця порожній |
| 2. Точні цифри | 2:47, 38 миль | 150 галонів, щомісяця |
| 3. Просте пояснення | Мама: трекер зламаний | Дружина: хтось краде |
| 4. Герой перевіряє сам | Проїхав маршрут | Замок на кришку бака |
| 5. Неможливе | Маршрут закінчується в його дворі | Замок цілий, бак знову порожній |
| 6. Хтось чужий бачив батька | Медсестра в лікарні | Лист від незнайомого водія: Рей заправив його в заметіль на I-80 |
| 7. Обрив | «Хто тримав його на руках?» | «Said his boy keeps it full.» Лист датовано минулим тижнем |

## Текст озвучки (голос Генка)

```
My dad's been gone sixteen years.

I still fill his truck's tank.

And every month, it's empty.

A hundred and fifty gallons.

The truck never leaves the barn.

My wife said someone's stealing it.

So I put a lock on the cap.

Empty again.

Then a stranger's letter came.

"Your dad saved my life. Blizzard on I-80. My tank was dry.

He filled it. Wouldn't take a dime.

Said his boy keeps it full."

The letter was dated last week.
```

**Голос:**
- Низький, спокійний, короткі паузи.
- «Empty again.» тихо, після паузи.
- Лист читати трохи інакше, ніби вголос з паперу.
- «The letter was dated last week.» повільно, майже пошепки, без завершальної інтонації. Ця фраза переходить на початок відео.

## Кадри (картинка + анімація, 9:16)

Субтитри по центру, тому обличчя й головні предмети — **у верхній третині**. Кліпи анімації: 9:16, 5–10 с, без звуку, рух повільний, камера майже нерухома. Надсилати `01.mp4`… (або `.jpg`, якщо кадр без анімації).

Персонажі:
- **Генк сьогодні:** man about 49, short graying hair, short gray-brown beard, worn denim jacket
- **Дружина Генка:** woman in her late 40s, shoulder-length brown hair, cardigan
- **Вантажівка Рея:** green 1979 Kenworth W900, long nose, chrome stacks
- **Рей:** обличчя не показуємо

**Negative prompt для всіх кліпів:**
```
text, subtitles, letters, watermark, logo, morphing, warping, face distortion, extra fingers, extra limbs, new people appearing, fast camera movement, camera shake, zoom out, cuts, flicker, cartoon, low quality
```

### 01 — Генк біля бака (старт з обличчя)
**Картинка:**
```
Vertical 9:16 photorealistic cinematic photograph, inside an old wooden barn, early morning. A man about 49 with short graying hair, a short gray-brown beard and a worn denim jacket crouching beside the big chrome fuel tank of an old green semi truck, the fuel cap open in his hand, shining a flashlight into the tank, staring at the camera side in shock and disbelief, eyes wide, cold light through the barn boards on his face, his face in the upper third of the frame, shallow depth of field, 35mm film grain. No readable text, no logos, no watermark.
```
**Анімація:**
```
Slow cinematic push-in toward his face. He slowly lowers the flashlight from the open fuel tank, his eyes widen, he exhales and his breath is visible in the cold air. Dust floats in the light beams. His face stays in the upper third of the frame. Realistic, subtle motion, 5 seconds.
```

### 02 — стрілка на «E»
**Картинка:**
```
Vertical 9:16 photorealistic cinematic close-up. The dusty dashboard of an old 1970s semi truck: a round analog fuel gauge with the needle resting on empty, a thin layer of dust on the glass, a warm flashlight beam crossing the gauge, the gauge in the upper half of the frame, shallow depth of field, 35mm film grain. No readable text, no logos, no watermark.
```
**Анімація:**
```
Very slow push-in on the fuel gauge. The flashlight beam slowly moves across the glass, dust particles drift in the beam, the needle trembles slightly and settles on empty. Realistic, subtle motion, 5 seconds.
```

### 03 — Kenworth у сараї
Нову картинку генерувати не треба: беру кадр 02 з «Dad's Logbook» (той самий сарай і вантажівка). Якщо хочете його анімувати, ось промпт:
```
Very slow push-in toward the old green truck in the barn. Dust drifts slowly through the beams of sunlight, a cobweb sways gently, the light flickers softly through the gaps in the boards. The truck stays completely still. Nostalgic, quiet, realistic, 5 seconds.
```

### 04 — дружина
**Картинка:**
```
Vertical 9:16 photorealistic cinematic photograph, early morning, present day. A woman in her late 40s with shoulder-length brown hair, wearing a knitted cardigan, standing in the open doorway of an old wooden barn with her arms crossed, looking at the camera with a worried, skeptical expression, an old green semi truck blurred behind her in the barn, soft morning light, her face in the upper third of the frame, shallow depth of field, 35mm film grain. Only one person, a woman. No readable text, no logos, no watermark.
```
**Анімація:**
```
Slow push-in toward her face. She shakes her head slightly and sighs, a strand of hair moves in the breeze, morning light shifts softly on her face. Her face stays in the upper third of the frame. Realistic, subtle motion, 5 seconds.
```

### 05 — замок на кришці бака
**Картинка:**
```
Vertical 9:16 photorealistic cinematic close-up, inside a barn. A heavy brass padlock locking a chain around the chrome fuel cap of an old green semi truck's fuel tank, a man's hand with a wedding ring snapping it shut, dust on the chrome, cold morning light, the padlock in the upper half of the frame, shallow depth of field, 35mm film grain. No readable text, no logos, no watermark.
```
**Анімація:**
```
Very slow push-in on the padlock. The hand snaps the padlock shut and slowly pulls away, the chain swings slightly and settles, dust floats in the light. Realistic, subtle motion, 5 seconds.
```

### 06 — Генк читає лист
**Картинка:**
```
Vertical 9:16 photorealistic cinematic photograph, evening, present day. The same man about 49 with graying hair and a gray-brown beard in a worn denim jacket sitting at a kitchen table, holding a handwritten letter on lined paper in both hands, an opened envelope on the table, his eyes wet, stunned and moved, warm lamp light on his face, his face in the upper third of the frame, shallow depth of field, 35mm film grain. Handwriting illegible. No readable text, no logos, no watermark.
```
**Анімація:**
```
Slow push-in toward his face. He reads, his hands tremble slightly, a tear forms in his eye, he slowly lowers the letter and looks into the distance. Warm lamp light flickers softly. His face stays in the upper third of the frame. Realistic, subtle motion, 5 seconds.
```

### 07 — заметіль на I-80 (фінал)
**Картинка:**
```
Vertical 9:16 photorealistic cinematic photograph, night, heavy blizzard on an empty interstate highway. An old green 1979 Kenworth W900 semi truck with a long nose stopped on the shoulder beside a stranded modern semi truck with hazard lights blinking, a big broad-shouldered man in an old trucker cap and a faded flannel coat, seen from behind, carrying a red fuel can through the snow toward the stranded truck, his face not visible, headlights glowing through the falling snow, both trucks in the upper half of the frame, tender and mysterious, shallow depth of field, 35mm film grain. No readable text, no logos, no watermark.
```
**Анімація:**
```
Very slow push-in. Heavy snow falls through the headlight beams, the hazard lights blink orange, the big man walks slowly through the snow toward the stranded truck carrying the fuel can, always seen from behind, his face never visible. Exhaust drifts from the green truck's chrome stacks. Tender and mysterious, realistic, 5 seconds.
```

**Порядок у монтажі:** 01 → 03 («never leaves the barn») → 02 → 04 → 05 → 02 («Empty again») → 06 («a stranger's letter») → 07 (лист: «Blizzard on I-80…») → 06 крупно («dated last week», тиша) → петля в 01.

## Обкладинка шортса 9:16

```
Vertical 9:16 YouTube Shorts cover, hyper-realistic cinematic photograph, 1080x1920, inside an old barn at dawn. Extreme close-up of a man about 49 with short graying hair and a short gray-brown beard in a worn denim jacket. His face is huge and fills about 60% of the frame, eyes looking straight into the camera, shocked disbelief: eyes wide with visible whites, eyebrows raised high, mouth open. In the lower left foreground the open chrome fuel cap of an old green semi truck with a heavy brass padlock hanging from it, in sharp focus. Cold blue dawn light and a warm orange flashlight glow on his face, eyes sharp and bright, background soft blue and orange bokeh, not black. Vivid saturated colors, high contrast, only the face and the padlocked fuel cap as subjects. Calm empty area in the top 18% of the frame for a headline. Bottom 20% simple and calm. No text, no letters, no logos, no watermark.
```

**Negative prompt:**
```
text, words, captions, logo, watermark, signature, readable numbers, extra fingers, deformed hands, two faces, ghost, cartoon, 3d render, illustration, dull colors, desaturated, black background, cluttered background, small face, closed eyes, face in shadow, smiling, calm expression
```

**Текст на обкладинці:** `EMPTY AGAIN.` (`EMPTY` білим, `AGAIN.` жовтим #FFD400, чорна обводка, верхні ~18% кадру). Червоне коло (#FF1E1E) навколо замка.

## Публікація

**Назва:**
```
Why Is Dad's Truck Tank Always Empty? 🤨 #shorts
```
Запасні: `Locked Tank. Still Empty Every Month 😨` · `Dead 16 Years. He Still Helps Truckers 🥹`

**Опис:**
```
My dad's been gone sixteen years. I still fill his truck's tank. And every month, it's empty. The truck never leaves the barn.

Then a stranger's letter came…

Would you keep filling it? 👇
— Hank

#shorts #storytime #mystery

This is a dramatized fictional story created with the help of AI, inspired by the lives of American truck drivers. Names and places are changed or invented.
```

**Теги:**
```
dad truck story, dead dad truck, empty fuel tank, ghost truck, green kenworth, blizzard i80, trucker saved, sign from dad, father son story, trucker story, mystery story, unexplained story, emotional story, storytime, hank stories
```

**Закріплений коментар:**
```
Would you keep filling it? 👇
```

**Налаштування:**
```
Audience: No, it's not made for kids
Altered or synthetic content: Yes
Category: Entertainment
Language: English
Related video: Why Does Dad's GPS Still Move? 🤨
Publish: schedule for 18:00 Warsaw time
```
