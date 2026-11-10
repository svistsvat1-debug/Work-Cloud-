# Curiosity Short #1 — "Why Don't Woodpeckers Get Concussions?🤨"

Формат: 2D-explainer, 20–30 с, EN озвучка 50–70 слів, ElevenLabs **v4** з audio tags.
Референс візуального підходу: https://youtu.be/dGiQaabX3_o ("What Happened Before History? Human Origins", Kurzgesagt). Від нього беремо лише загальний підхід — простий flat 2D. Текст, тема й кадри тут оригінальні.
> Транскрипт референсу отримати не вдалося (у vidIQ закінчились кредити), відомі тільки назва й канал.

## 1. Ідея (1 речення)

Здавалося б, череп дятла працює як амортизуючий шолом. Насправді у 2022 році high-speed відео показало, що голова дятла б'є як жорсткий молоток, а від струсу мозку його рятує мізерний розмір мозку.

**Чому саме ця тема (з 3 досліджених):**

| Ідея | Джерело | Вердикт |
|---|---|---|
| Why don't woodpeckers get concussions? | Current Biology 2022 (Univ. Antwerp) | ✅ Обрано: очевидна відповідь ("шолом") хибна, свіже дослідження, легко показати в 2D |
| Why don't we nuke hurricanes? | NOAA Hurricane FAQ | ❌ Та сама схема "просте рішення", що й приклад із вулканом + тема дуже заїжджена |
| Why can't you tickle yourself? | UCL (Blakemore) | ⏸ Сильна, лишаю на наступний раз (human body) |

## 2. Озвучка — чиста версія (для субтитрів і запису)

> A woodpecker hits wood so hard that each jolt could give you a concussion. So why is the bird fine?
> For years, scientists thought its skull worked like a shock-absorbing helmet.
> But in 2022, high-speed video showed the opposite. Its head works like a stiff hammer. Cushioning would just weaken every peck.
> What saves it is size. A brain that small handles jolts that would injure ours.

**Кількість слів:** 67 (≈ 26–29 с з паузами).

## 3. ElevenLabs v4 — текст для вставки (з audio tags)

Модель: `eleven_v4`. Скопіюй блок повністю в Text to Speech:

```
[curious] A woodpecker hits wood so hard that each jolt could give you a concussion. [short pause] So why is the bird fine?

[thoughtful] For years, scientists thought its skull worked like a shock-absorbing helmet.

[surprised] But in 2022, high-speed video showed the OPPOSITE. [confidently] Its head works like a stiff hammer. Cushioning would just weaken every peck.

[short pause] [warmly] What saves it is size. A brain that small handles jolts that would injure ours.
```

**Налаштування й правила v4:**
- Тег діє до наступного тегу, тому вони стоять лише там, де міняється подача (5 тегів на 7 речень).
- Теги описують *як* говорити. Сценічні ремарки на кшталт `[music]` чи `[pecking]` модель не відтворює, тому їх тут немає.
- Капс тільки на одному слові (`OPPOSITE`): це наголос у кульмінації.
- У v4 немає параметра `speed`. Якщо озвучка вийшла довшою за 30 с, прибери обидва `[short pause]`. Якщо звучить надто швидко, додай `[slowly]` перед "What saves it is size."
- `2022` лишається цифрами: v4 сам читає це як "twenty twenty-two".
- Згенеруй 2–3 дублі й обери найприродніший.

**Голоси з бібліотеки ElevenLabs (підходять під спокійний explainer):**
| Голос | voice_id | Чому |
|---|---|---|
| Ryan — American Documentary Narrator | `GQQpeRnV5mCWTgxKhGo5` | Теплий, чіткий, "YouTube explainer" подача |
| Jennica | `GrGZY9w6IXhm3DAtiPXT` | Спокійна, "curious" подача, як друг, що розбирається разом із глядачем |
| Cedric M — Engaging Documentary Narrator | `VvVVKaa2nHZpbZdtSRSX` | Глибший британський варіант, більше "wildlife doc" |

## 4. Покадрово (2D, 9:16)

**STYLE-блок (додавати в кінець кожного промпту для картинки):**
```
vertical 9:16, flat 2D vector illustration, simple geometric shapes, no outlines, soft gradients with subtle grain, bright saturated colors on a deep navy background, cute rounded characters with simple eyes, clean minimal composition, centered subject, empty space at top and bottom for captions, no text, no watermark
```

| # | Час | Озвучка | Промпт для зображення (+ STYLE) | Анімація / SFX |
|---|---|---|---|---|
| 1 | 0–2.5 с | A woodpecker hits wood so hard… | A red-crested woodpecker mid-peck against a brown tree trunk, motion lines behind its head, tiny wood chips flying | Голова "стукає" 3 рази (keyframe position) · SFX: tok-tok-tok |
| 2 | 2.5–5 с | …that each jolt could give you a concussion. | A simple cartoon human head in profile with dizzy stars and a small bump, the woodpecker in the background | Camera shake на "jolt" · SFX: дзвін у вухах (коротко) |
| 3 | 5–7 с | So why is the bird fine? | The woodpecker sitting calmly on a branch, looking at the viewer, perfectly fine, big empty space above its head | Легке "дихання" (scale 100→102%) · текст-оверлей "?" у монтажі |
| 4 | 7–11 с | For years, scientists thought its skull worked like a shock-absorbing helmet. | Cutaway diagram of a woodpecker head, inside the skull a soft cushion and a spring like a helmet, two small scientists with a clipboard nodding | Пружина стискається · SFX: м'який "boing" |
| 5 | 11–14 с | But in 2022, high-speed video showed the opposite. | A big high-speed camera on a tripod filming the woodpecker, a film strip with frames of the pecking motion | Плівка їде вбік · SFX: клацання камери · оверлей "2022" у монтажі |
| 6 | 14–17 с | Its head works like a stiff hammer. | The woodpecker's head shown as a solid hammer silhouette striking the tree, cushion and spring crossed out and falling away | Пружина й подушка падають униз · SFX: металевий "clank" |
| 7 | 17–20 с | Cushioning would just weaken every peck. | Side by side: a hammer wrapped in a pillow bouncing weakly off a tree versus a bare hammer making a clean hole | Ліва бʼє слабко, права пробиває · SFX: глухий thud → хрусткий удар |
| 8 | 20–22.5 с | What saves it is size. | A tiny woodpecker brain next to a huge human brain on a simple scale, size comparison | Zoom-out, щоб показати різницю · SFX: whoosh |
| 9 | 22.5–27 с | A brain that small handles jolts that would injure ours. | The tiny woodpecker brain calm and smiling, the big human brain wobbling with dizzy stars, then the woodpecker pecking happily again | Великий мозок хитається · фінал: дятел знову стукає (loop на кадр 1) |

**Монтаж:** CapCut. Субтитри: Auto captions, жирний sans (Montserrat Black), білі, 2–3 слова на екран, по центру. Музика: легкий ambient/pluck, −20…−25 dB. Фінал без CTA, кадр 9 перетікає в кадр 1, щоб відео зациклювалося.

## 5. Публікація

**Назва:** Why Don't Woodpeckers Get Concussions?🤨
**Опис:** Their heads aren't shock absorbers. #science #animals #shorts
**Обкладинка:** кадр 2 (людина з зірочками) + дятел + текст "NO HELMET?"
**Закріплений коментар:** "Which animal 'superpower' should we break down next? 🐦"

## 6. Перевірка фактів

| Твердження в озвучці | Що каже джерело |
|---|---|
| each jolt could give you a concussion | "the deceleration shock with each peck exceeds the known threshold for a concussion in monkeys and humans" (Cell Press via ScienceDaily) |
| scientists thought its skull worked like a shock-absorbing helmet | "This led to the notion that their skulls must act like shock-absorbing helmets" (ScienceDaily); "researchers long thought… acts like an airbag or helmet" (PopSci) |
| in 2022, high-speed video showed the opposite | High-speed video of 6 birds, 3 species, Current Biology, 14.07.2022 |
| works like a stiff hammer | "their heads act more like stiff hammers" (ScienceDaily / Phys.org) |
| cushioning would weaken every peck | "any shock absorbance would hinder the woodpeckers' pecking abilities" (ScienceDaily) |
| a brain that small handles jolts that would injure ours | "the woodpeckers' smaller brains can withstand it"; "brain loadings that are lower than that of humans suffering a concussion" (Van Wassenbergh, Phys.org) |

**Де лишається невизначеність:** висновок про мозок отримано з біомеханічних розрахунків, а не з вимірювань травм. Автори кажуть, що він стосується звичайного довбання дерева. Удар по металу на повну силу вони не перевіряли (PopSci, ScienceDaily). В озвучці немає слів "never" чи "always", тож це формулювання не порушує.

Свідомо не використано: "20 ударів на секунду". Цифра залежить від типу удару: близько 20/с для коротких серій і drumming, близько 3/с при видовбуванні (Univ. Antwerp / JEB), до 13/с у downy woodpecker (Brown, 2025). Одне число без контексту було б неточним.

## 7. Джерела

- Оригінальне дослідження: Van Wassenbergh S. et al. (2022) *Woodpeckers minimize cranial absorption of shocks*, Current Biology. https://doi.org/10.1016/j.cub.2022.05.052
- Прес-реліз Cell Press (ScienceDaily): https://www.sciencedaily.com/releases/2022/07/220714145037.htm
- Phys.org: https://phys.org/news/2022-07-woodpeckers-stiff-safety-helmets.html
- Popular Science (історія ідеї "шолома" й обмеження): https://www.popsci.com/environment/understanding-woodpecker-brains/
