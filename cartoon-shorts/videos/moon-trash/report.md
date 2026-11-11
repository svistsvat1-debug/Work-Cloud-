# Звіт — moon-trash (Why don't we dump our trash on the Moon?)

## Фінальний текст (без змін, як затверджено)
1. Why don't we just dump our trash on the Moon?
2. Nobody lives there, so who cares, right?
3. But landing one kilo on the Moon costs over a million dollars.
4. So a week of your trash would cost millions.
5. Every kilo counts, so Apollo astronauts left their trash up there to fly home lighter.
6. Which means the Moon already has a dump: ninety-six bags, some full of astronaut poop.

## Голос
ElevenLabs «Mark - Natural Conversations» (`UgBBYS2sOqTuMpoF3BR0`), модель eleven_v4, один дубль, 23,5 с.
Scribe v1 розпізнав усі 68 слів без помилок, тож другий дубль не знадобився. Голос стартує на 0,1 с, ролик триває 25,0 с.

## Біти (час відео = час слова + 0,1 с)
| Час | Слова | Картинка | Гег | Звук |
|---|---|---|---|---|
| 0–2,6 | Why don't we just dump our trash on the Moon? | hero_hold на пагорбі, Місяць спить | камера наїжджає, «z» над Місяцем, підстрибування на «trash» | — |
| 2,66–3,4 | Nobody lives there | Місяць (камера піднімається) | Місяць спить і хропе, на плечі в нього купка білих пакетів | snore (бібліотека) |
| 3,58–4,34 | so who cares, right? | hero_hold → windup → throw_follow | присідання-замах, кидок на «right?» | whoosh (бібліотека) |
| 5,14–7,1 | But landing one kilo on the Moon… | пакет зависає, цінник «$1,200,000 PER KILO» | Місяць розплющує одне підозріле око | pop |
| 7,14–8,5 | costs over a million dollars | throw_follow → shocked_full | пакет падає героєві на голову, трясеться кадр | whoosh, catch (бібліотека) |
| 8,5–9,46 | dollars | shocked_cu (склейка) | крупний план, пакет із цінником на голові, крапля поту | pop |
| 9,46–12,58 | So a week of your trash would cost millions. | shocked_full + 7 чорних пакетів | пакети гупають у купу, лічильник $0 → $18,700,000, «ка-чінг» у паузі | catch ×7, ticks (бібліотека), kaching |
| 12,58–14,1 | Every kilo counts | Місяць: lm_descent + lm_ascent, astronaut_toss | кабіна з очима тужиться злетіти «> <», крапля поту | thruster ×2, pop |
| 14,1–16,4 | so Apollo astronauts left their trash up there | astronaut_toss | стрибок у низькій гравітації, 3 білі пакети летять через плече й падають у пил | dustplop ×3 |
| 16,4–17,78 | to fly home lighter | lm_ascent злітає | астронавт стрибає в кабіну, кабіна щаслива ^ ^, злітає з полум'ям, нижня ступінь і пакети лишаються | boing, thruster |
| 17,78–20,4 | Which means the Moon already has a dump | Місяць крупно | очі розплющуються, дивиться на купу пакетів, на «dump» купа підстрибує | pop |
| 20,42–22,1 | ninety-six bags | Місяць + «96 BAGS» | лічильник 0 → 96 | ticks, pop |
| 22,1–23,7 | some full of astronaut poop | Місяць | вдих-принюхування, з пакета визирає какашка, на «poop» Місяць зеленіє, очі «> <», язик, хвилі смороду, муха | stink, fly |
| 23,8–25,0 | (кінець) | hero_hold | камера від'їжджає до кадру 0, зелений Місяць хитає «ні», петля | fly (затихає) |

## Картинки (GPT Image 2.5 sunburst, 1K, 1 варіант, лише текстові промпти, без референсів)
- **MEDIUM (10):** hero_hold, windup, throw_follow, shocked_cu (крупний план по груди), shocked_full, astronaut_toss, lunar_module (3:2, у prep розрізаний на ascent / descent), moon, bg_night, bg_lunar.
- **LOW (1):** trash_bag.
- Переробок не було, резерв не чіпав. У коді намальовано: білі пакети Apollo, цінник, лічильники, обличчя Місяця й кабіни, полум'я, пил, сморід, муху, краплі поту.

## Звуки (усі ElevenLabs Sound Effects v2)
- **Нові (7):** kaching, dustplop, boing, thruster, fly, stink, pop. Усі додав до `sfx-library/` з описами в index.md.
- **З бібліотеки (4, 0 кредитів):** snore, whoosh, catch, ticks.

## Кредити
| Що | Кредити |
|---|---|
| Голос (368 символів) | 368 |
| Scribe | 0 |
| Герой | 81 |
| Пакет із 10 картинок (9 MEDIUM + 1 LOW) | 776 |
| 7 звуків | 26 (оцінка була 86, фактично ~3,3 кредити за секунду) |
| **Разом** | **1251 з 1500** |

Детально по кожному запуску: `studio/images/moon-trash/credits.md`.

## Прохід покращення (один)
1. Пакет зависав у небі на 2 с без жодної дії → сплячий Місяць тепер підглядає на нього одним підозрілим оком.
2. Текст на цінику вилазив за край і був дрібний → цінник більший, шрифт зменшено, щоб усе влазило, камера зсунута так, щоб цінник був у кадрі.
3. У кадрі 0 герой був дрібний → камера на старті ближче (герой ~36 % висоти кадру), останній ключ камери такий самий, тож петля стикується точно.
4. Стрибок астронавта виглядав як політ → низький стрибок, астронавт зменшується й ховається за кабіною. Ще на «dump» купа пакетів на Місяці підстрибує.

## Рішення та fallback
- Рендер на CPU (headless Chromium, `gl=swangle`): відеокарти в контейнері немає.
- Мікс у Remotion знову вийшов тихим (пік −8,65 dBFS на превʼю), тож у коді додано +4,6 дБ до голосу й усіх звуків (MIX_DB), без перекодування.
- Скло шолома астронавта згенерувалося зеленим (крізь нього просвічував хромакей) → у prep перефарбовано в блідо-блакитне напівпрозоре скло.
- Знайшов і виправив баг нормалізації кольорів у prep: у попередньому відео білий колір персонажа перетворювався на сіру тінь. Нова версія присвоює найближчий колір палітри.
- vidIQ має лише 3 кредити, а пошук YouTube блокує автоматичний доступ, тож перегляди Shorts про сміття на Місяці не перевірені. У COMPETITORS.md нічого не додано, бо не було надійних даних (переглядів, підписників, дат).

## Перевірка фінального файлу
- `videos/moon-trash/moon-trash.mp4`: H.264, 1080×1920, 60 fps, 1500 кадрів = 25,0 с; звук AAC 48 кГц стерео, 25,0 с.
- Пік міксу −4,07 dBFS, кліпінгу немає (0 семплів).
- Скан стрибків: позначені лише заплановані склейки (8,50 / 9,47 / 12,58 / 17,78), зміни поз (3,95 / 4,35), удар пакета по голові (8,03), падіння пакетів і лічильники (9,65–11,63, 20,48–20,58), поява какашки (22,93) і панчлайн «poop» (23,23).
- Останні 40 кадрів рухаються (середня різниця 7,6): заморожених кадрів немає. Останній кадр збігається з кадром 0 за кадруванням, тож петля стикується.

## Посилання та файли
- Flow ElevenLabs: https://elevenlabs.io/app/flows/7aMLNnlpcL6MQl7vDoxw
- Відкрити проєкт у Remotion Studio: `cd cartoon-shorts/studio && npm i && npx remotion studio` (композиції `MoonTrash` і `MoonTrashCover`)
- Код: `studio/src/moon-trash/` (Short.tsx, scene.ts, sprites.ts, Cover.tsx); спрайти, голос і звуки: `studio/public/moon-trash/`
- Робочі матеріали: `studio/images/moon-trash/` (prompts.md, budget.md, credits.md, words.json, prep.py, qa/ з контактними аркушами)
- Пакет для завантаження: `videos/moon-trash/` (upload.md, cover.png, moon-trash.en.srt, idea-card.md, цей звіт). MP4 не комітиться (.gitignore), надсилаю файлом.
