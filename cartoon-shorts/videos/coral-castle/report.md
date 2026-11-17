# coral-castle - фінальний звіт (відео #35, 2026-11-17)

## Текст (озвучено дослівно, без змін)
This skinny guy builds a castle out of eleven hundred tons of rock. Alone. So people say it's magic. But old photos show a tripod of
telephone poles and a chain hoist. Each long pull lifts the rock a little, so one man is enough. Even his nine-ton gate turns with one
finger. But years later it jams. Fixing it takes six men and a crane.

## Джерело
- Відео: https://youtu.be/OmK9H0EVp-8 (BRIGHT SIDE Series, «Scientists Can Finally Explain How Ancient Egyptians Cut Granite»), сегмент 53:27-62:24 (Coral Castle).
- У відео 28 сегментів: використано 1, лишилося 26. Найкращі з решти: мюони й Big Void у піраміді (47:50), Серапеум і пісок (0:00, треба перевірити), повінь у гробниці Тутмоса II (33:45).
- Модель структури: STRUCTURES #5 — мій переможець moai-walk (6,0K). Схема: видима загадка → хибна відповідь («магія») → «But» з видимою підказкою → «so one man is enough» → друге «But» → панчлайн-контраст, який повертає до «Alone».

## Голос
Liam - Viral Short-Form Storyteller (eleven_v4), 1 дубль. Мова 23,4 с, темп ~2,87 сл/с. Підганяти під 25 с не довелося.
Відео 24,4 с (1464 кадри, 60 fps).

## Біти
Таблиця бітів (час / слова / картинка / гег / звук) — у studio/images/coral-castle/beats.md.

## Картинки (усі GPT Image 2.5, 1K, LOW, 1 варіація, без референсів, 0 переробок)
hero 2:3 · ed3 (тягне ланцюг / один палець / «тсс») 3:2 · crew3 (штовхає / тягне / чухає каску) 3:2 · stones (брила / брама / обеліск) 3:2 ·
wall (стіна з вежею і проходом) 3:2 · crane 3:2 · yard (фон) 2:3.

## Звуки
- Нові ElevenLabs (6): flashbulb, chain, magic, gate_turn, rust_jam, crane. Усі додані в sfx-library.
- З бібліотеки (10): crickets, winch, grind, rock_crack, whoosh, pop, gulp, boing, stone_step, flip.

## Музика
Локальний код (scripts/music.py, 0 кредитів), фа мажор, 110 BPM.
- Секції: тема → build → тема 2 → «uh-oh» → фінал.
- Стопи на обох «But»; дзвіночок на «crane»; домашній акорд 23,6 с.
- Рівень: −15 дБ під голосом, приглушення −4 дБ під словами. Пік міксу −4,0 dBFS.

## Кредити (ліміт 900)
голос 337 + Scribe 0 + 7 картинок 329 + 6 звуків 25 = **691**. Резерв не знадобився.

## Прохід покращення
1. Вихід зі старого фото був напівпрозорим наплавом → тепер рамка пролітає повз камеру (без крос-фейду).
2. Поворот брами не читався на окремих кадрах → додав дуги руху й зірочки запаморочення.
3. Сепія-фото було пласким → додав віньєтку й подряпини старого фото.

Ще до цього, за контактними аркушами, виправив:
- кадрування: ноги героя на ~80% висоти замість порожньої трави внизу;
- герой більше не стоїть за ногою триноги;
- місяць став жовтим (раніше потрапляв під нічний фільтр);
- підписи стрілок більше не обрізані краєм кадру;
- бригада 1986 року перенесена вліво й не налазить на кран.

## Upload-кит
- Назва: How did one man move 1,100 tons of rock alone?
- Інші варіанти: How did one skinny man build a castle of rock? / Why did it take 6 men and a crane to fix his gate?
- Обкладинка: 6 MEN + A CRANE
- Опис і хештеги: videos/coral-castle/upload.md

## Посилання й файли
- ElevenLabs flow: https://elevenlabs.io/app/flows/Fmkkn0JFYh4kLQEXXYnj
- Remotion Studio: `cd cartoon-shorts/studio && npx remotion studio` (композиції CoralCastle і CoralCastleCover)
- Файли:
  - videos/coral-castle/ — mp4 (не в git), cover.png, upload.md, idea-card.md, report.md;
  - studio/src/coral-castle/ — код;
  - studio/images/coral-castle/ — промпти, кредити, бюджет, музика, біти, QA;
  - studio/public/coral-castle/ — спрайти, голос, звуки, музика.

## Git
Коміти 88f66c2 (картка + пам'ять) і 07ad1b4 (відео + пам'ять) лежать у гілці claude/whyzap-next-short; ці самі коміти запушено в main (dcc237c..07ad1b4). work/ (транскрипт, сторіборди, метадані джерела) видалено, нічого з відео-джерела в репозиторії немає.
