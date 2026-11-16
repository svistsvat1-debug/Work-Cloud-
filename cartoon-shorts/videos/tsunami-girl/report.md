# tsunami-girl — фінальний звіт (2026-11-16)

## Сценарій (фінальні рядки, без змін)
1. A ten-year-old girl is on a beach in Thailand.
2. The sea starts fizzing, like a giant soda.
3. Everyone stares.
4. But she's seen this before, on a video in geography class.
5. So she tells her parents: it's a tsunami.
6. They don't believe her.
7. She won't stop.
8. So her dad warns a guard, and the whole beach runs into a hotel.
9. Minutes later, the wave hits.
10. Nobody on her beach dies.

## Джерело
- Відео: BRIGHT SIDE Series, «The 7 Most Dangerous Natural Phenomena in the Ocean»: https://youtu.be/A4pzqvN8FWw.
- Сегмент: 11:59–12:49 (ознаки цунамі). Після цього лишилось 19 сегментів (найкращі: акули перед ураганом, «чорні діри» в океані, cross sea).
- Транскрипт: vidIQ (5 кредитів). Візуальний аналіз: недоступний, YouTube блокує хмарний сервер.

## Структура
STRUCTURES #1 (cut-out «Can we throw trash in a volcano?», ~3,6M), варіант від третьої особи: хук → море реагує → But → ескалація → панчлайн.

## Голос
- Liam – Viral Short-Form Storyteller, eleven_v4, один дубль.
- Мовлення 23,66 с, темп ~2,92 слова/с.
- Підганяти під 25 с не довелося.
- Scribe розпізнав текст слово в слово.

## Відео
- 1080×1920, 60 fps, 24,5 с (1470 кадрів).

## Біти

| час (с) | слова | картинка | гег | звук |
|---|---|---|---|---|
| 0–3,2 | girl on a beach in Thailand | girl (hero), туристи, пляж | ледь шипляче море | bubbles |
| 3,9–6,0 | sea starts fizzing… giant soda | море з бульбашками | у моря відкриваються очі, хитра посмішка; піна вилазить на пісок | fizz, pop |
| 6,1–7,5 | Everyone stares | stare (туристи) | три жовті «?» | pop ×3 |
| 7,5–10,9 | But she's seen this before… class | girl + бульбашка-думка | чорно-білий телевізор із хвилею, «GEOGRAPHY»; музична пауза на But | pop, whoosh |
| 10,9–13,6 | tells her parents: it's a tsunami | shout + dad у шезлонгу | «TSUNAMI!», лінії крику | pop |
| 13,7–14,9 | They don't believe her | chair | тато гойдається, «NAH» | laugh |
| 14,9–16,2 | She won't stop | shout | стрибає, три «TSUNAMI!» | pop ×3 |
| 16,3–17,8 | dad warns a guard | dadrun + guard | крапля поту, свисток, лінії | zip, pea_whistle |
| 17,9–20,0 | whole beach runs into a hotel | run/panic/dadrun/guard + hotel | усі «втискаються» у двері, морозиво летить | stampede, zip, pop |
| 20,0–22,2 | Minutes later, the wave hits | wave з обличчям + hotel | злі очі хвилі, удар, бризки, затоплений пляж; пауза на hits | gust, whoosh, wave_crash, flood |
| 22,3–24,5 | Nobody on her beach dies | дах готелю | усі махають, тато знову в шезлонгу, хвиля «> <» з потом і просідає | splash, фінальний акорд |

## Картинки (8, усі GPT Image 2.5, 1K, LOW, 1 варіація, без референсів)
- hero (2:3)
- girl2: крик / біг (3:2)
- dad2: шезлонг / біг (3:2)
- guard (2:3)
- tourists2: дивляться / тікають (3:2)
- hotel (2:3)
- wave (3:2)
- bg (2:3)

Перероблювати не довелося жодної.

## Звукові ефекти
- Нові (ElevenLabs SFX v2): fizz, pea_whistle, stampede. Додані в sfx-library.
- Перевикористані з бібліотеки: bubbles, pop, whoosh, laugh, zip, gust, wave_crash, flood, splash.

## Музика
Локальний код (scripts/music.py), 0 кредитів:
- G major, 111 BPM;
- секції: theme → uh-oh (But) → build → uh-oh (хвиля) → final;
- зупинки на «But» і «hits», дзвіночок і акорд на «dies»;
- на 18 дБ тихіше за голос, приглушується під словами.

## Кредити ElevenLabs

| стаття | кредити |
|---|---|
| Голос | 367,96 |
| Scribe | 0 |
| 8 картинок | 375,62 |
| 3 SFX | 15,0 (оцінка була 49,5) |
| Музика | 0 |
| **Разом** | **758,6** (ліміт 900) |

## Що виправив за прохід покращень
1. Персонажі були задрібні, а 40 % кадру займав порожній пісок. Наблизив камеру (k 1,25 → 1,4) і підняв кадр.
2. Піна виглядала як ряд кульок. Замінив на одну хвилясту білу смугу.
3. Різке ввімкнення/вимкнення розмиття та вода, що з'являлася за один кадр, давали скачок 36×. Тепер розмиття вмикається плавно, а вода піднімається знизу. Також додав бризки при ударі.

Додатково:
- обличчя моря перенесене, щоб не перекривалося з «?»;
- «TSUNAMI!» більше не обрізається краєм кадру;
- хвиля збільшена (0,62 → 0,85), очі на ній більші;
- з першого кадру море вже трохи шипить.

## Пакування
- **Назва:** How did a 10-year-old save a whole beach?
- **Запасні:** Why did a girl yell tsunami at a calm sea? / What if the sea starts fizzing on your beach?
- **Текст обкладинки:** FIZZY SEA?
- **Опис і хештеги:** у `upload.md`.

## Посилання та файли
- Flow ElevenLabs: https://elevenlabs.io/app/flows/DGk7V4HsT9effOOIrjOM
- Відкрити в студії: `cd cartoon-shorts/studio && npx remotion studio` (композиції TsunamiGirl і TsunamiGirlCover).
- Файли в `cartoon-shorts/videos/tsunami-girl/`: tsunami-girl.mp4 (не в git), cover.png, upload.md, idea-card.md, report.md.
- Код: `studio/src/tsunami-girl/`. Робочі матеріали: `studio/images/tsunami-girl/`. Ассети: `studio/public/tsunami-girl/`.

## Пам'ять
- VIDEOS_LOG #26;
- SOURCE.md (створено) і SOURCE_LOG (сегмент позначено як використаний);
- IDEA_BANK (used + 4 нові сегменти);
- STRUCTURES (used in);
- STYLE (уроки, темп Liam);
- sfx-library (+3).

## Git
Закомічено в `claude/whyzap-video-production-daltkl` і запушено в main (981e0e2). MP4 не в git (*.mp4 у .gitignore). Папку work/ з транскриптом джерела видалено.

## Запасні рішення
- Транскрипт джерела взято з vidIQ: yt-dlp, youtube-transcript-api і storyboards заблоковані. Візуальний аналіз пропущено.
- Hero генерувався в одному батчі з іншими картинками, бо зафіксований вигляд персонажа вже є в STYLE.md і референсів немає.
- Петля неточна: кінець на даху готелю, початок на пляжі.
