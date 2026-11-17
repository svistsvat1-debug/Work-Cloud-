# shark-storm - звіт (відео #32, 2026-11-17)

## Сценарій (затверджений, без змін)
1. Fourteen baby sharks beep from tiny tags in a shallow Florida bay, hiding from the big sharks in deep water.
2. But one night, every beep heads out of the bay.
3. Straight toward the big sharks.
4. Why would they leave?
5. Hours later, a tropical storm hits an empty bay.
6. They probably felt it coming, because the air pressure drops before a storm.
7. Weeks later, the bay starts beeping again.

## Джерело
- https://youtu.be/A4pzqvN8FWw — BRIGHT SIDE Series, «The 7 Most Dangerous Natural Phenomena in the Ocean», 13,1 млн переглядів, сегмент **15:15–16:50** (самі рядки про акул — 16:30–16:47).
- У відео 20 сегментів, використано 2 (tsunami-girl, shark-storm), лишилось 18. Найкращі з тих, що лишились: «підводні чорні діри» 1:22–1:56, «квадратні хвилі» 5:10–6:18.

## Модель структури
- STRUCTURES №2: Zack D. Films «The Space Particle That Changed An Election» (21,27 млн) — https://www.youtube.com/shorts/KSBGsK13j74
- Карта: стежимо за крихітними мандрівниками → «But» (29%) → фраза-удар + питання глядачеві (44–57%) → розгадка (57–71%) → чесне «probably + because» (71–90%) → кінцівка, що повертає до першого кадру.

## Голос
- Liam – Viral Short-Form Storyteller (VCgLBmBjldJmfphyB8sZ), eleven_v4, 1 дубль, 379 символів.
- Мовлення 23,98 с → **~2,84 слова/с** (повільно, як у #27: 7 речень, багато крапок і питання).
- Підганяти під 25 с не довелося: голос закінчується на 24,1 с, відео 24,7 с.

## Відео
- 1080×1920, 60 fps, **24,7 с (1482 кадри)**, звук 24,70 с, пік міксу −3,8 dBFS. Наприкінці картинка ще рухається.
- Останній кадр повторює перший: петля.

## Біти
| час | слова | що на екрані | гег | звук |
|---|---|---|---|---|
| 0–1,46 | Fourteen baby sharks | розріз бухти: персонаж у навушниках на причалі, 14 мальків з датчиками, бейдж «14» | «пінг»-дуги вже пульсують | — |
| 1,46–4,98 | beep … Florida bay | хвиля пінгів над усіма датчиками, табличка FLORIDA підстрибує | пінги в такт «beep» | ping ×7, pop |
| 5,0–7,3 | hiding from the big sharks… | камера пливе в глибину до сонної великої акули | крайні мальки злякано задкують | bubbles |
| 7,62–8,5 | But one night | день → синя ніч, зорі, місяць | музика замовкає | crickets |
| 8,66–10,26 | every beep heads out of the bay | мальки потоком пливуть схилом у глибину | персонаж у шоці, «!» | dart, ping ×4 (нижчають), gulp |
| 10,66–12,54 | Straight toward the big sharks | потік пливе прямо на ніс великої акули й під нею | акула прокидається, облизується, мальки пітніють | dart, lick |
| 12,64–13,94 | Why would they leave? | великий план: персонаж розводить руками, фон розмитий | «?» | pop, crickets |
| 14,1–15,9 | Hours later, a tropical storm | HOURS LATER, сіра бухта порожня, насувається хмара з очима | персонаж показує на хмару | ticks, gust, storm |
| 16,1–17,26 | hits an empty bay | блискавка + спалах + тряска | персонаж тріпоче на стовпі, мов прапор | thunder, wave_crash, rain |
| 17,36–19,06 | They probably felt it coming | спалах → EARLIER, та сама ніч | мальки завмирають, над кожним «!» | zoomaway, pop ×3 |
| 19,18–21,3 | because the air pressure drops… | барометр AIR PRESSURE | на «drops» стрілка падає з FAIR на STORM, мальки зриваються | needle, dart ×3 |
| 21,6–23,1 | Weeks later, the bay | WEEKS LATER, сонячно | персонаж нудьгує, павутина й павучок | flip, beach_bed |
| 23,14–24,7 | starts beeping again | мальки повертаються з пінгами | персонаж стрибає від радості й стає в позу першого кадру | ping ×5, boing, twinkle |

Повна таблиця: `studio/images/shark-storm/beats.md`.

## Картинки
Усі gpt-image-2.5-sunburst, 1K, LOW, 1 варіація, лише текстові промпти, 0 переробок:
- `hero` 2:3 — персонаж у навушниках слухає;
- `guy3a` 3:2 — шок / знизує плечима / вчепився в стовп;
- `guy3b` 3:2 — показує пальцем / стрибає від радості / сидить і нудьгує;
- `baby3` 3:2 — маля: спокійне / налякане / мчить;
- `big2` 3:2 — велика акула: сонна / голодна;
- `bay` 2:3 — розріз бухти з причалом.

Усе вирізалося чисто при dist < 60. Решту малює код: ніч, хмару з очима, блискавку, хвилі, дощ, барометр, павутину, пінги.

## Звуки
- **Нові ElevenLabs (5):** ping, storm, needle, dart, lick — 18,33 кредиту за рахунком (оцінка була 60,5).
- **Повторно з бібліотеки (0 кредитів):** crickets, thunder, rain, wave_crash, gust, bubbles, gulp, pop, boing, flip, ticks, twinkle, zoomaway, beach_bed.

## Музика (код, 0 кредитів)
- F-мажор, 111,5 BPM.
- Тема → зупинка на «But» → тривожна частина (ніч) → наростання (шторм) → тривожна (флешбек) → наростання на «drops» → коротка зупинка на «WEEKS LATER» → фінальна тема з дзвіночками на «beeping» і домашнім акордом.
- Музика на 15 дБ тихіше за голос і приглушується ще на 4 дБ під словами. Обрав середину між твоїм «музику має бути чути» (12 дБ у #29) і 22–26 дБ із промпту.

## Кредити ElevenLabs
| що | кредитів |
|---|---|
| голос | 378,96 |
| Scribe | 0 |
| hero | 46,95 |
| 5 картинок | 234,76 |
| 5 звуків | 18,33 |
| **разом** | **679,00** (ліміт 900, план ≤ 870; резерв не знадобився) |

План був ~829. Сьома картинка не знадобилась: хмару, барометр і ніч зробив кодом.

## Прохід покращень (один)
1. О 10,8 с мальки злипалися в купу прямо на тілі великої акули. Змінив маршрут (під її ніс і низом) і розтягнув старт зграї — тепер це потік.
2. Рядок «hiding from the big sharks» був без дії. Додав гег: 4 крайні мальки злякано задкують, коли з'являється велика акула.
3. Брови хмари малювались довгими лініями (не той масштаб параметра) — виправив.

Ще після першого контактного аркуша:
- ніч була занадто темною (пісок сірий, персонаж сірий) — освітлив;
- хмару опустив і збільшив;
- написи HOURS / EARLIER / WEEKS LATER переніс униз, щоб не закривали голову;
- табличку FLORIDA посунув у кадр;
- великий план зменшив до 1,5x і розмив фон (фон не збільшується понад 2x без розмиття).

Сканер стрибків позначає лише заплановані склейки, заміни поз, спалахи й написи.

## Upload kit
- **Назва:** Why do sharks leave before a hurricane? (інші: «How do sharks know a storm is coming?», «Why did 14 baby sharks flee their safe bay?»)
- **Текст обкладинки:** BABY SHARKS KNEW
- **Опис, джерела, хештеги:** `videos/shark-storm/upload.md` (#shorts #sharks #hurricane #animals #science)

## Де що
- **Відео:** `videos/shark-storm/shark-storm.mp4` (не в git, надіслано файлом). Обкладинка: `videos/shark-storm/cover.png`.
- **Картка й upload kit:** `videos/shark-storm/idea-card.md`, `videos/shark-storm/upload.md`.
- **Код:** `studio/src/shark-storm/` (Short.tsx, Cover.tsx, scene.ts, sprites.ts).
- **Робочі файли:** `studio/images/shark-storm/` (промпти, prep, ключування, ledger, beats, music).
- **Спрайти й звук:** `studio/public/shark-storm/`.
- **Flow ElevenLabs:** https://elevenlabs.io/app/flows/TL4DSqErUTVGJYpL3Qb9
- **Відкрити в Remotion Studio:** `cd cartoon-shorts/studio && npx remotion studio` → композиції SharkStorm / SharkStormCover.

## Що записано в пам'ять
- **VIDEOS_LOG:** рядок #32 (#31 тим часом зайняло відео deep-dive з іншої сесії).
- **SOURCE_LOG:** сегмент 15:15–16:50 позначено → shark-storm, лишилось 18.
- **IDEA_BANK:** акули → used, додано №2/№3.
- **STYLE:** уроки #31 + темп Liam.
- **STRUCTURES:** №2 used in shark-storm.
- **COMPETITORS:** знахідки в «Found by Claude».
- **sfx-library:** +5 звуків з рядками в index.md.

## Fallbacks
- Транскрипт моделі структури (Zack D. Films) цього разу не завантажився (429 / IP block). Перевірку на збіги з моделлю в коді не повторив; з транскриптом джерела — 0 збігів по 5 і 4 слова.
- Відеофайл джерела YouTube не віддав, тому візуальний прохід зроблено по сторібордах (1 кадр на ~10 с).
