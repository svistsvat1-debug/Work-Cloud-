# Канал про НЛО: оформлення каналу

> Тут лише налаштування самого каналу: персонаж, назва, аватар, банер, опис, ключові слова.
> Сценарії й відео робимо окремо, після того як прийде промпт генерації сценаріїв.
> Мова каналу — англійська (як у `untold-stories-format.md`).

## 1. Персонаж-ведучий

**Walt** — вигаданий далекобійник років 30, який їздить нічними трасами пустелі в Неваді. Він розповідає історії про НЛО: свої, а також ті, що йому "надсилають" глядачі.

**Візуальні якорі** (однакові в аватарі, банері й усіх кадрах, саме за ними персонажа впізнають):
- темне скуйовджене волосся, коротка темна щетина, уважні сміливі очі;
- **чорна кепка далекобійника з неоново-зеленою нашивкою-НЛО** (головна впізнавана деталь);
- темно-синій бомбер (льотна куртка) з такою ж зеленою нашивкою-НЛО на грудях, під ним чорне худі;
- кольори персонажа: чорний / темно-синій + неоново-зелений, як у бренду каналу (ніч + світло НЛО);
- зелене світло "згори" (від НЛО) на обличчі.

**Стиль:** стилізований 3D-мультяшний, як у більшості story-каналів на YouTube зараз. Не фотореалізм.
Чому так:
1. Мультяшне обличчя з чіткими формами читається в маленькому кружечку аватара.
2. Образ виходить "брендом", а не випадковим AI-фото.
3. Анімований / явно нереалістичний контент не підпадає під обов'язкову позначку YouTube "altered or synthetic content" (вона потрібна, коли відео можна сплутати з реальністю).

## 2. Назва каналу

| Назва | Handle | Логіка |
|---|---|---|
| **Walt's UFO Files** (рекомендую) | `@WaltsUFOFiles` | Ім'я персонажа + "UFO" для пошуку + "files" (архів історій, серійність) |
| Walt UFO Stories | `@WaltUFOStories` | Максимально прямо: хто + про що |
| UFO Walt | `@UFOWalt` | Коротко й запам'ятовується, але менш "теплий" образ |

Чи вільні handle — [MISSING], перевір під час створення каналу.

## 3. Аватар каналу

**Промпт (Gemini / Midjourney / ChatGPT, квадрат):**
```
Stylized 3D animated cartoon character portrait, a young American trucker named Walt, around 30 years old, handsome friendly face, big expressive eyes, messy dark brown hair sticking out from under the cap, short dark stubble, black trucker cap with a glowing neon-green flying saucer patch on the front, dark navy bomber flight jacket with the same neon-green flying saucer patch on the chest, black hoodie underneath. He looks up with a curious, slightly amazed half-smile, a soft green glow from above lights his face. Head and shoulders, centered, facing the viewer at a slight angle. Simple dark navy night-sky background with a few stars, strong rim light, high contrast, bold clean shapes, readable at small size. 1:1 square, high quality 3D animation movie style render, no text, no logo, no watermark.
```

**Перевірка аватара перед завантаженням:**
- зменш картинку до ~100 px: обличчя й кепка мають читатися;
- обличчя по центру, бо YouTube обрізає аватар у коло;
- без тексту на аватарі.

**Референс персонажа** (згенерувати один раз і потім завантажувати як reference для всіх наступних картинок з Walt):
```
Character reference sheet of the same stylized 3D cartoon young trucker Walt from the reference image: front view, three-quarter view and side view, full body, standing, same black trucker cap with neon-green flying saucer patch, same dark navy bomber jacket with the patch, black hoodie, dark jeans, black work boots. Plain light grey background, consistent proportions, 3D animation movie style, no text.
```

## 4. Банер каналу

Розмір 2560×1440. Усе важливе (текст, Walt) має бути в центральній зоні **1546×423**: на телефоні видно лише її.

**Промпт:**
```
Wide cinematic banner in stylized 3D animated cartoon style. Empty desert highway at night stretching to the horizon, a black semi-truck parked on the shoulder with headlights on. The same young trucker Walt from the reference image leans against the truck in the center, looking up at a glowing green flying saucer hovering low over distant mountains. Starry navy-blue night sky, warm headlight glow vs cold green UFO light. All key elements in the center of the frame, empty dark space on the left and right sides. 16:9, high quality 3D animation movie style, no text.
```

**Текст на банері** (додати в Canva або CapCut, по центру):
```
WALT'S UFO FILES
New UFO stories every week
```

## 5. Опис каналу (вставляти в "About")

```
Pull up a chair. 🛸

I'm Walt. I drive night routes through the Nevada desert —
and some of the things I've seen in that sky, I never told anyone.

On this channel I tell UFO stories: strange lights over empty highways,
missing time, voices on the CB radio, and the stories you send me.

New UFO stories every week. Subscribe so you don't miss the next file.

━━━━━━━━━━━━━━━━━━━━
⚠️ DISCLAIMER
All stories on this channel are FICTIONAL and DRAMATIZED.
"Walt" is a fictional character. Stories, voices and visuals are created
with the help of AI tools for entertainment purposes only.
Stories are inspired by publicly reported UFO/UAP sightings, but the
events and people in them are not real. Any resemblance to real persons
or events is purely coincidental.
```

> Дисклеймер стоїть наприкінці, як ти просив, і чітко каже три речі: історії вигадані й драматизовані, персонаж вигаданий, при створенні використано AI. Довжина опису вкладається в ліміт YouTube (1000 символів).

## 6. Ключові слова каналу

YouTube Studio → Settings → Channel → Basic info → **Keywords**:
```
ufo stories, ufo sightings, uap, alien encounter, ufo story animation, trucker ufo story, nevada ufo, area 51 stories, scary stories, unexplained mysteries, paranormal stories, walts ufo files
```

**Хештеги** (для профілю TikTok / Instagram та як стандартний набір під відео):
```
#ufo #uap #ufostories #aliens #unexplained #storytime #animation
```

## 7. Налаштування під монетизацію

Дисклеймер в описі потрібен, але сам по собі монетизацію не гарантує. YouTube оцінює також такі речі:

| Що | Як зробити |
|---|---|
| Inauthentic content (масовий / повторюваний контент) | Кожна історія з власним сюжетом, місцем і поворотом. Однакові інтро/аутро — це нормально, однакові історії — ні |
| AI-позначка під відео | Під час завантаження: "Altered or synthetic content" → **Yes**, якщо кадр виглядає реалістично. Для мультяшного стилю не обов'язково, але позначка не зменшує охоплення, тому ставити безпечно |
| Пояснення в кожному відео | Короткий рядок в описі кожного відео: `Fictional dramatized story. Created with AI tools.` |
| Людський внесок | Ти сам обираєш теги, редагуєш сценарій і монтаж. За потреби (наприклад, при апеляції) це має бути видно |

## 8. Чекліст створення каналу

1. Створити канал → назва `Walt's UFO Files` → handle.
2. Згенерувати аватар → перевірити на 100 px → завантажити.
3. Згенерувати референс персонажа → зберегти `walt_reference.png`.
4. Згенерувати банер → додати текст → перевірити, що в зоні 1546×423 нічого не обрізається.
5. Вставити опис і ключові слова.
6. Country = [MISSING] (країна для YPP), мова каналу = English.
7. Далі — промпт сценаріїв → адаптую під Walt.
