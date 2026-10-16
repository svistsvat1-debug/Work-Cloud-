# Епізод 8 сторі-Shorts — "Dad's GPS" (сценарій)

- **Папка:** `videos/09-dads-gps/` (у репозиторії нумерація загальна; на каналі це епізод 8)
- **Тривалість:** ~34–37 с (≈90 слів)
- **Формула (з `docs/YOUTUBE_SHORTS_COMPETITORS.md`):** гачок у стилі His Story *Why Was A GPS Tracker There? 🤨* (6.8M) + тема батька, що найкраще працює в ніші, + фінал-питання без відповіді.
- **Серійність:** Highway 9, старий дайнер, міст і зелена куртка — відсилки до епізодів «Channel 19» і «Two coffees». Хто дивився попередні, впізнає й піде дивитися решту.
- **Чесність:** історія вигадана → в опис `Dramatized story.`
- [MISSING] Окремого контент-плану для каналу історій немає (є лише TikTok-план компанії). Цей епізод продовжує формулу серії; можна скласти план на місяць.

## Статус

- Озвучка й 8 картинок отримано 2026-10-16. Медсестри (09) не було: на «The nurse asked me just one thing» стоїть крупний план сина (темніший грейд).
- Відео: `final.mp4` (голос + музика), `final-no-music.mp4`. Рендер: `python3 tools/photo_story.py videos/09-dads-gps/story.json`
- Старт з обличчя сина (0–1.3 с), далі вантажівка. Фінал тримається на немовляті й руці в зеленому рукаві.

## Як тримає до кінця

1. **0–2 с, протиріччя:** «вантажівка не рухалась 2 роки, але GPS щоночі показує поїздку».
2. **Конкретика замість води:** 2:47, 38 миль, 4 хвилини, двигун працює.
3. **Відкрита петля кожні 3–4 с:** зламаний трекер? → він їде маршрутом → маршрут закінчується в його дворі → щоночі → але вчора інакше → лікарня → медсестра.
4. **Поворот на 25-й секунді:** у героя щойно народився син, тобто онук батька.
5. **Фінал-питання з мурашками:** «Хто був той старий у зеленій куртці, що тримав його на руках?». Відповіді немає, глядач іде в коментарі.

## Текст озвучки (для генерації голосу)

```
My dad's truck hasn't moved in two years.

But the GPS says it drives every night.

Two forty-seven a.m. Thirty-eight miles. Same route.

Mom said the tracker was broken.

So I drove the route myself.

Highway 9. The old diner. The bridge.

And it ended... in my driveway.

Four minutes. Engine running.

Every single night.

Last night, it didn't come to my house.

It went to the hospital... where my son was born that morning.

The nurse asked me just one thing.

"Who was the old man in the green jacket... holding him?"
```

**Голос:** той самий оповідач, що в попередніх епізодах. Низький, спокійний, трохи повільний. Паузи «...» не скорочувати. Останнє питання читати тихіше, майже пошепки.

## Що потрібно надіслати для монтажу

1. **Озвучка:** mp3 або wav (SRT не обов'язковий, таймінги я беру з самого голосу).
2. **9 картинок 9:16** за промптами нижче, пронумеровані 01–09 у тому самому порядку.

## Монтажний план

| ~Час | Рядок | Кадр |
|---|---|---|
| 0–2.5 | My dad's truck hasn't moved in two years. | 03 обличчя сина в світлі телефона → 01 вантажівка під пилом |
| 2.5–5 | But the GPS says it drives every night. | 02 екран телефона з маршрутом, punch на "every night" |
| 5–8.5 | 2:47 AM. 38 miles. Same route. | 02 крупно маршрут → 03 обличчя |
| 8.5–10.5 | Mom said the tracker was broken. | 04 мама на кухні |
| 10.5–12 | So I drove the route myself. | 05 нічна траса з кабіни, whip |
| 12–15 | Highway 9. The old diner. The bridge. | 05 jump-cuts: знак → неон дайнера → міст |
| 15–17.5 | And it ended... in my driveway. | 06 будинок уночі, бум |
| 17.5–20.5 | Four minutes. Engine running. Every single night. | 06 наїзд на порожню під'їзну доріжку |
| 20.5–23 | Last night, it didn't come to my house. | 03 обличчя сина, тиша + райзер |
| 23–27.5 | It went to the hospital... where my son was born that morning. | 07 лікарня вночі, спалах + бум на "my son" |
| 27.5–29.5 | The nurse asked me just one thing. | 09 медсестра |
| 29.5–35 | "Who was the old man in the green jacket... holding him?" | 08 немовля і стара рука в зеленому рукаві, повільний наїзд, тиша |

## Промпти для 9 зображень (9:16)

Персонажі ті самі, що в «Two coffees»:
- **Син:** man in his early 30s, short messy dark brown hair, light stubble, grey hoodie under a worn brown canvas jacket
- **Батько:** man in his 60s, short grey beard, weathered kind face, faded green canvas work jacket
- **Мама:** woman in her early 60s, grey hair in a short bob, cardigan

**01 — вантажівка батька, що не рухалась 2 роки**
```
Vertical 9:16 photorealistic cinematic photograph. An old white semi truck cab parked alone on a gravel lot beside a small rural house at night, covered in thick dust and fallen leaves, flat tires, cobwebs on the mirrors, clearly untouched for years, lit by a single sodium streetlight, light fog, cold blue night with warm orange light, shallow depth of field, 35mm film grain. No text, no logos, no watermark.
```

**02 — екран телефона з GPS-маршрутом**
```
Vertical 9:16 photorealistic cinematic close-up photograph. A man's hand holding a smartphone in a dark bedroom at night, the screen shows a dark GPS tracking map with a glowing bright red route line along a highway and a small truck icon on it, the screen light reflecting on his fingers, everything else dark and blurred, moody blue and red light, shallow depth of field, 35mm film grain. No readable text, no logos, no watermark.
```

**03 — обличчя сина в світлі телефона**
```
Vertical 9:16 photorealistic cinematic photograph. Close-up of a man in his early 30s with short messy dark brown hair and light stubble, wearing a grey hoodie, sitting up in bed at night, his face lit only by the cold blue glow of a smartphone in his hands, staring at the screen in shock and disbelief, eyes wide, eyebrows raised, mouth slightly open, dark bedroom behind him, shallow depth of field, 35mm film grain. No text, no logos, no watermark.
```

**04 — мама на кухні**
```
Vertical 9:16 photorealistic cinematic photograph. A tired woman in her early 60s with grey hair in a short bob, wearing a cardigan, standing in a small old kitchen at night holding a mug, shaking her head with a sad, dismissive half-smile, warm dim lamp light, rain on the dark window behind her, shallow depth of field, 35mm film grain. No text, no logos, no watermark.
```

**05 — нічна траса з кабіни (Highway 9, дайнер, міст)**
```
Vertical 9:16 photorealistic cinematic photograph. Driver's point of view through a rain-speckled windshield at night on an empty two-lane highway, a green highway sign with the number 9 on the right, further down the road the glowing red and teal neon of an old roadside diner, and a steel bridge with lights in the foggy distance, wet asphalt reflecting the lights, dashboard softly glowing at the bottom, shallow depth of field, 35mm film grain. No other text, no logos, no watermark.
```

**06 — будинок сина вночі, порожня під'їзна доріжка**
```
Vertical 9:16 photorealistic cinematic photograph. A small suburban house at 3 a.m., porch light on, an empty concrete driveway glistening wet, thin fog, faint warm glow on the driveway as if from headlights that just turned off, no vehicle visible, eerie stillness, cold blue night with warm porch light, shallow depth of field, 35mm film grain. No text, no logos, no watermark.
```

**07 — лікарня вночі**
```
Vertical 9:16 photorealistic cinematic photograph. A hospital building at night seen from a nearly empty parking lot, rain, one window on the second floor glowing warm while the others are dark, red emergency sign glow on wet asphalt, fog under the streetlights, cold blue and warm orange contrast, shallow depth of field, 35mm film grain. No readable text, no logos, no watermark.
```

**08 — немовля і стара рука в зеленому рукаві**
```
Vertical 9:16 photorealistic cinematic photograph. A sleeping newborn baby wrapped in a white hospital blanket in a clear hospital bassinet at night, an old weathered man's hand in a faded green canvas jacket sleeve resting gently on the blanket, the rest of the man out of frame, soft warm light from a bedside lamp, quiet tender and slightly eerie mood, shallow depth of field, 35mm film grain. No text, no logos, no watermark.
```

**09 — медсестра**
```
Vertical 9:16 photorealistic cinematic photograph. A kind nurse in her 40s in light blue scrubs standing in a dim hospital corridor at night, holding a clipboard to her chest, looking at the camera with a puzzled and slightly unsettled expression, as if asking a strange question, warm and cold mixed light, shallow depth of field, 35mm film grain. No readable text, no logos, no watermark.
```

## Пакет публікації

**Назва:**
```
Why Does Dad's GPS Still Move? 🤨
```
Скелет ролика His Story *Why Was A GPS Tracker There? 🤨* (6.8M) + батько. Запасні: `My Dead Dad's Truck Still Drives 😨` · `Dad's Truck Hasn't Moved In 2 Years 👀` · `Who Was Holding My Son? 😨`

**Текст на обкладинці:** `2 YEARS DEAD.`

**Промпт обкладинки (клікбейт, як у конкурентів):**
```
Vertical 9:16 YouTube Shorts thumbnail, hyper-realistic cinematic photograph, 1080x1920. Extreme close-up of a man in his early 30s with short messy dark brown hair and light stubble, grey hoodie, in a dark bedroom at night. His face is enormous and fills about 60% of the frame, eyes looking straight into the camera. Extreme fear and disbelief: eyes wide open with visible whites, eyebrows raised as high as possible, mouth open in a silent gasp, face lit by the bright blue glow of a smartphone and a warm orange rim light, eyes razor sharp. In the lower left foreground he holds up the smartphone toward the camera, the screen shows a dark GPS map with a glowing red route line and a small truck icon, in sharp focus. Background: soft saturated blue and orange bokeh, not black. Ultra vivid saturated colors, strong contrast, only the face and the phone as subjects. Empty calm area in the top 18% of the frame. Bottom 20% simple and calm. No text, no letters, no logos, no watermark, no borders.
```

**Negative prompt:**
```
text, words, captions, logo, watermark, signature, extra fingers, deformed hands, two faces, ghost, cartoon, 3d render, illustration, dull colors, desaturated, black background, cluttered background, small face, closed eyes, face in shadow, smiling, calm expression
```

**Накладання на обкладинку:** `2 YEARS` білим, `DEAD.` жовтим (#FFD400), чорна обводка 10–12 px, верхні 18% кадру; червоне коло (#FF1E1E) навколо іконки вантажівки на екрані телефона.

**Опис:**
```
My dad's truck hasn't moved in two years. But every night at 2:47 a.m., the GPS says it drives the same 38 miles.

So I drove the route myself…

Who do you think was holding my son? 👇

Dramatized story.

#shorts #storytime #mystery
```

**Теги:**
```
dad gps story, gps tracker story, dead dad truck, trucker story, father story, sign from dad, grandpa ghost, hospital story, newborn story, mystery story, unexplained story, creepy story, storytime, true story shorts, emotional story
```

**Закріплений коментар:**
```
Who do you think was holding my son? 👇
```
