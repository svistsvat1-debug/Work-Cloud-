# Hank Stories · шортс дня 4 — гачок еп. 8 «The Truck That Followed Me for 300 Miles»

За планом «Hank Stories — план контенту на 30 днів»: шортс дня N рекламує вчорашній епізод. День 4 = гачок еп. 8 (Вайомінг, 2004: вантажівка всю ніч позаду, у кабіні нікого).

- **Формат:** мінімалізм (`"style": "minimal"`, рішення власника 2026-10-19): субтитри по центру, Bebas Neue, без гачка/кнопки/аркуша. Голос Генка, ~72 слова, ~30 с, 8 картинок 9:16.
- **Гачок як у конкурентів:** перше речення — вже кульмінація («The cab was empty»). Далі ескалація короткими реченнями («I slowed down. It slowed down.»), обрив на найстрашнішому місці і петля в перше речення.
- **Перша секунда:** картинка (порожня кабіна з працюючим двигуном) + гачок угорі + голос.
- **Пов'язане відео:** Еп. 8 «The Truck That Followed Me for 300 Miles» (має бути вже опублікований).
- **Канон:** 2004, Генку 26–27, за кермом з 1995. Пса Бадді в шортсі навмисно немає, щоб не зіпсувати його появу в епізоді.
- **[CHECK]:** деталі мають збігатися зі сценарієм еп. 8 (година, двері кабіни відчинені, зупинка на стоянці). Якщо в сценарії інакше, скинь його, і я підправлю текст.

## Текст озвучки (голос Генка)

```
The cab was empty. And it had followed me for three hundred miles.

Wyoming. 2004. Two in the morning.

Same headlights in my mirror. Mile after mile.

I slowed down. It slowed down.

I pulled over. It pulled over.

At the next truck stop, I finally walked back to see who it was.

Engine running. Lights on. Driver's door wide open.

I stepped up... and looked inside.

Full story's on the channel.

And the cab...
```

**Голос:** спокійний, низький, без поспіху. Пари «I slowed down. It slowed down.» читати рівно, з паузою між ними. «I stepped up... and looked inside.» майже пошепки. Останнє «And the cab...» обрив без завершальної інтонації, щоб петля перейшла в «The cab was empty».

## Статус

- Озвучка й 7 картинок отримано (без 03 «фари в дзеркалі»: замість неї крупний план дзеркала з кадру 02). Чорні смуги на картинках обрізаються автоматично.
- Рендер: `python3 tools/photo_story.py videos/11-hank-ep08-short/story.json` → `final.mp4`, `final-no-music.mp4`. `voice.wav` обрізано до 38.15 с для петлі.

## Картинки (8 шт., 9:16)

Головний об'єкт у **середній смузі кадру**: верхні ~22% зайняті гачком і кнопкою, нижні ~40% аркушем із субтитрами.

Персонажі:
- **Генк у 2004:** truck driver about 27, short dark brown hair, light stubble, red-and-black flannel shirt under a worn denim jacket, faded ball cap
- **Його вантажівка:** white long-nose 1990s semi truck
- **Та, що слідувала:** dark, unmarked, old long-nose semi truck, glaring headlights

**01 — порожня кабіна (хук і петля)**
```
Vertical 9:16 photorealistic cinematic photograph, night, 2004. View through the wide-open driver's door of a dark, unmarked old long-nose semi truck at a lonely truck stop: the driver's seat is empty, dashboard gauges glowing, dome light on, keys in the ignition, a thin wisp of exhaust in the cold air, sodium lights and fog outside. The empty seat and the open door are in the middle of the frame; top 22% and bottom 40% of the frame dark and simple. Eerie, still, shallow depth of field, 35mm film grain. No readable text, no logos, no watermark.
```

**02 — Вайомінг, ніч, з кабіни**
```
Vertical 9:16 photorealistic cinematic photograph, Wyoming high plains, 2 a.m., 2004. Driver's point of view from inside a 1990s semi truck cab on an empty two-lane highway, endless black prairie, a few stars, the truck's headlights on the road ahead, and in the large side mirror two bright headlights of a truck far behind. The side mirror and its headlights in the middle of the frame; top 22% and bottom 40% dark and simple. Lonely, tense, shallow depth of field, 35mm film grain. No readable text, no logos, no watermark.
```

**03 — фари в дзеркалі**
```
Vertical 9:16 photorealistic cinematic close-up, night, 2004. A chrome side mirror of a semi truck at night, in the mirror two glaring headlights of a dark truck following close behind, light flares and a cold blue sky, dark highway rushing by, rain-free, sharp mirror in the middle of the frame; top 22% and bottom 40% dark and simple. Menacing, shallow depth of field, 35mm film grain. No readable text, no logos, no watermark.
```

**04 — обличчя Генка**
```
Vertical 9:16 photorealistic cinematic portrait, night, 2004. A truck driver about 27 with short dark brown hair, light stubble, red-and-black flannel shirt under a worn denim jacket and a faded ball cap, both hands on the steering wheel, eyes glancing sideways at the mirror, tense and uneasy, face lit by the green and amber glow of the dashboard and a stripe of white headlight from behind. His face in the middle of the frame; top 22% and bottom 40% dark and simple. Shallow depth of field, 35mm film grain. No text, no logos, no watermark.
```

**05 — обидві фури на узбіччі**
```
Vertical 9:16 photorealistic cinematic photograph, night, Wyoming, 2004. Wide shot of an empty prairie highway: a white long-nose semi truck stopped on the shoulder with hazard lights blinking, and far behind it a dark unmarked semi truck also stopped on the shoulder, headlights on, nothing else for miles, dark sky with a few stars. Both trucks in the middle band of the frame; top 22% and bottom 40% simple. Uneasy, shallow depth of field, 35mm film grain. No readable text, no logos, no watermark.
```

**06 — Генк іде до вантажівки**
```
Vertical 9:16 photorealistic cinematic photograph, night, 2004. A lonely truck stop parking lot under orange sodium lights and light fog, seen from behind: a truck driver in a worn denim jacket and ball cap walking slowly toward a dark unmarked old long-nose semi truck parked with its headlights on and engine running. The man and the truck in the middle of the frame; top 22% and bottom 40% simple. Tense, cinematic, shallow depth of field, 35mm film grain. No readable text, no logos, no watermark.
```

**07 — відчинені двері, працює двигун**
```
Vertical 9:16 photorealistic cinematic photograph, night, 2004. Close view of a dark unmarked old long-nose semi truck at a truck stop: headlights on, exhaust drifting from the stack, the driver's door wide open, the cab lit by a weak yellow dome light, no one visible, fog and sodium lights behind. The open door and lit cab in the middle of the frame; top 22% and bottom 40% dark and simple. Eerie, shallow depth of field, 35mm film grain. No readable text, no logos, no watermark.
```

**08 — Генк заглядає в кабіну**
```
Vertical 9:16 photorealistic cinematic photograph, night, 2004. Shot from inside a truck cab looking out through the open driver's door: a truck driver about 27 with short dark brown hair, light stubble and a faded ball cap stands on the step, one hand on the door frame, leaning in, his face lit by the yellow dome light, eyes wide with shock and disbelief, mouth slightly open, fog and orange lights behind him. His face in the middle of the frame; top 22% and bottom 40% simple. Shallow depth of field, 35mm film grain. No text, no logos, no watermark.
```

**Порядок у монтажі:** 01 → 02 → 03 → 04 → 03 (крупніше, «slowed down») → 05 → 06 → 07 → 08 → 01 (фінал «And the cab…» → петля).

## Обкладинка шортса 9:16

```
Vertical 9:16 YouTube Shorts cover, hyper-realistic cinematic photograph, 1080x1920, night, 2004. Extreme close-up of a truck driver about 27 with short dark brown hair, light stubble and a faded ball cap, leaning into the open door of a truck cab. His face is huge and fills about 60% of the frame, eyes looking straight into the camera, terrified disbelief: eyes wide with visible whites, eyebrows raised high, mouth open. In the lower left foreground the empty driver's seat and the glowing dashboard of the cab, in sharp focus. Warm yellow dome light on his face, eyes sharp and bright, background cold blue fog with orange sodium lights, not black. Vivid saturated colors, high contrast, only the face and the empty seat as subjects. Calm empty area in the top 18% of the frame for a headline. Bottom 20% simple and calm. No text, no letters, no logos, no watermark.
```

**Negative prompt:**
```
text, words, captions, logo, watermark, extra fingers, deformed hands, two faces, ghost, monster, blood, cartoon, 3d render, illustration, dull colors, black background, cluttered background, small face, closed eyes, face in shadow, smiling, modern smartphone
```

**Текст на обкладинці:** `NOBODY WAS DRIVING.` (`NOBODY WAS` білим, `DRIVING.` жовтим, чорна обводка, верхні ~18% кадру).

## Публікація

**Назва:**
```
It Followed Me 300 Miles. Nobody Was Driving 😨 #shorts
```

**Опис:**
```
The cab was empty. And it had followed me for three hundred miles.
Wyoming, 2004. Two in the morning.

Full story: Episode 8, "The Truck That Followed Me for 300 Miles" — on the channel.

Would you have walked back to look inside? 👇
— Hank

#truckerstories #shorts #hankstories

This is a dramatized fictional story created with the help of AI, inspired by the lives of American truck drivers. Names and places are changed or invented.
```

**Теги:**
```
truck followed me, empty truck, nobody driving, wyoming 2004, night highway story, scary trucker story, trucker stories, truck driver story, creepy road story, hank trucker, hank stories, cb radio stories, rolling thunder, stories for men, untold stories
```

**Закріплений коментар:**
```
Would you have walked back to look inside? 👇
```

**Налаштування (за планом):**
```
Audience: No, it's not made for kids
Altered or synthetic content: Yes
Category: Entertainment
Language: English
Related video: Ep. 8 · The Truck That Followed Me for 300 Miles (already public)
Publish: schedule for 18:00 Warsaw time
```
