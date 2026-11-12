# Звіт — desert-ice (відео №6, 2026-11-12)

## Фінальний текст (слово в слово як у затвердженій картці)
1. This guy has ice in a desert summer, centuries before fridges.
2. Deserts are the worst place for ice, right?
3. But on clear winter nights, the dry sky sucks heat out of water.
4. So Persians filled shallow pools, and by morning, they froze.
5. But ice melts, so they kept it in a mud dome with walls two meters thick.
6. That's why it lasted all summer.
7. A freezer powered by the sky.

## Голос
- ElevenLabs «Mark - Natural Conversations» (`UgBBYS2sOqTuMpoF3BR0`), модель `eleven_v4`, 1 дубль, 370 символів, 24.6 с.
- Таймінги слів — Scribe v1. Транскрипт збігся з текстом слово в слово, другий дубль не знадобився.
- Голос стоїть з 0.1 с, композиція триває 25.25 с (1515 кадрів).

## Біти

| час | слова | картинка | гег | звук |
|-----|-------|----------|-----|------|
| 0.0–2.6 | This guy has ice in a desert summer | hero, bg | сонце з обличчям косує на кубик, над піском дрижить жар | clink |
| 2.7–4.3 | centuries before fridges | hero + холодильник у коді | холодильник вискакує, на нього падає червоний X, він зникає у хмарці | pop, stamp, pop |
| 4.7–7.0 | Deserts are the worst place for ice, right? | shrug, cube | сонце нахиляється з усмішкою, кубик вислизає, тане в калюжку з парою, крапля поту | whoosh, drip, sizzle, boing |
| 7.2–8.9 | But on clear winter nights | awe (крупний план) | склейка в ніч, зорі, вискакує календар WINTER | crickets, pop |
| 8.9–11.4 | the dry sky sucks heat out of water | pool | небо відкриває очі й «смокче» помаранчеві теплові хвилі з води | pop×2, slurp |
| 11.5–13.6 | So Persians filled shallow pools | pour | герой з'являється з відром і доливає, вода плюскоче | whoosh, pop, pour |
| 13.9–15.6 | and by morning, they froze | slide | світанок, лід біжить басейном з іскрами, герой ковзає | freeze, whoosh, clink |
| 15.7–18.0 | But ice melts, so they kept it | carry, dome | склейка в день, сонце шкіриться, брила крапає, за героєм калюжки | sizzle, drip×2 |
| 17.9–18.6 | in a mud dome | block, dome | брила летить у двері, купол «ковтає» (сквош) і розплющує очі | whoosh, stamp, pop |
| 18.7–20.4 | with walls two meters thick | «рентген» у коді | розріз стіна / лід / стіна, жовта стрілка, «2 m», купол напружує «м'язи» | pop×2, rock_crack |
| 20.5–22.5 | That's why it lasted all summer | календар у коді | WINTER → SPRING → SUMMER, сонце пече, купол пітніє, але задоволений | flip×2, sizzle |
| 22.7–23.6 | A freezer | hero, cube | двері відчиняються, кубик летить дугою героєві в руку, іскри | pop, whoosh, clink |
| 23.5–25.25 | powered by the sky | небо в коді | у блакитному небі з'являється обличчя й підморгує, сонце ахає; луп до кадру 0 | pop, boing |

## Картинки (усі GPT Image 2.5 `gpt-image-2.5-sunburst`, 1K, 1 варіант, тільки текст — без референсів)
- **MEDIUM (9):** hero (з кубиком), shrug, awe (крупний план голови й грудей), pour (з відром), slide, carry (з брилою), dome (яхчал), pool (стіна й басейн, 3:2, маджента-ключ), bg (фон пустелі).
- **LOW (1):** props 3:2 — брила, кубик, відро (розрізано в prep).
- Усі вирізки чисті з першого разу, переробок не було, резерв не витрачено.
- Відхилення від плану з картки: замість аркуша-пари «знизує плечима / пітніє» зроблено окрему позу shrug і додано позу pour. Через це вийшло 9 MEDIUM замість 8; у бюджет вклалися.
- У коді намальовано: сонце з обличчям, холодильник, воду, лід, теплові хвилі, зорі, обличчя неба, обличчя купола, розріз стіни, календар, калюжки, пару, іскри.

## Звукові ефекти (усі ElevenLabs)
- **Нові (6):** freeze, slurp, pour, clink, drip, flip. Усі додано в `sfx-library/` з описом в index.md.
- **Повторно використані з sfx-library (7):** whoosh, crickets, pop, boing, stamp, rock_crack, sizzle.
- Пік міксу на превʼю −4.3 dBFS (MIX_DB +3.5).

## Кредити ElevenLabs

| # | що | оцінка | фактично |
|---|----|--------|----------|
| 1 | голос + hero | 450.5 | 450.6 |
| 2 | Scribe | 0 | 0 |
| 3 | 9 картинок (8 MEDIUM + 1 LOW) | 691.6 | 691.6 |
| 4 | 6 звукових ефектів | 80.3 | 24.3 |
| | **Разом** | | **1166.5 з 1500** |

## Прохід покращень (один)
1. Нічна сцена з басейном була темна, а нижня третина кадру — порожній сірий пісок. Ніч зробив світлішою (0.66 → 0.55), камеру підняв — тепер більше неба з обличчям.
2. На склейці «But ice melts» герой з брилою з'являвся наполовину за кадром. Тепер він стартує в кадрі й лишає калюжки на піску.
3. Останній кадр різав купол через одне око. Фінальну камеру зсунуто вліво, видно лише край купола.
- Ще раніше, з контактних аркушів: сонце обрізалось угорі (опустив його); герой уночі був брудно-фіолетовий (окреме слабке тонування для персонажів); календар закривав око неба й підморгування (свій кут для кожної сцени, ховається раніше); «рентген» стіни перенесено над двері й збільшено; прибрано дивну стулку дверей.

## Пакет для завантаження
- **Назва:** How did people get ice in the desert before fridges?
- **Інші варіанти назви:** Why didn't desert ice melt all summer? / Why don't we make ice with the night sky?
- **Текст на обкладинці:** FROZEN BY THE SKY?
- **Опис, джерела й хештеги:** `videos/desert-ice/upload.md` (`#shorts #history #science #ice #persia`).

## Посилання і файли
- **Flow в ElevenLabs:** https://elevenlabs.io/app/flows/VqhmLh2HEFpLylssLgsM
- **Відкрити проєкт у Remotion Studio:** `cd cartoon-shorts/studio && npx remotion studio`. Композиції `DesertIce` і `DesertIceCover`.
- **Файли:**
  - відео: `videos/desert-ice/desert-ice.mp4` (не в git);
  - обкладинка: `videos/desert-ice/cover.png`;
  - пакет для завантаження: `upload.md`;
  - картка ідеї: `idea-card.md`;
  - код: `studio/src/desert-ice/`;
  - спрайти й звуки: `studio/public/desert-ice/`;
  - промпти, кредити, біти, QA: `studio/images/desert-ice/`.

## Пам'ять
- `memory/VIDEOS_LOG.md` — рядок №6 (перегляди порожні).
- `memory/IDEA_BANK.md` — ідея позначена як used; додано ідею про віндкетчер і відхилений міф про мокре простирадло.
- `memory/STYLE.md` — уроки відео №6.
- `memory/COMPETITORS.md` — розділ «Found by Claude»: референс і відео про яхчал.
- `sfx-library/` — 6 нових звуків.

## Запасні варіанти
- Жодного не знадобилося.
- Дрібниця: на машині не було пакета `cv2`, тому для кеювання поставив `opencv-python-headless`.

## Git
- Усі зміни лише в `cartoon-shorts/`. Запушено на гілку `claude/determined-planck-ule4e0` і fast-forward у `main`.
- MP4 не комітиться (`*.mp4` у .gitignore), його надіслано окремим файлом.
- Фінальний файл перевірено: 1080x1920, 60 fps, 1515 кадрів = 25.25 с, звук 25.26 с, пік −4.3 dBFS, в останні 0.5 с кадр рухається.
