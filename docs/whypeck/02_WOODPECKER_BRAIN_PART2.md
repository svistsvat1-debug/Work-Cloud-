# WhyPeck · Short #2 «Woodpecker brain — part 2» (інверсія)

**Оригінал (частина 1):** «Scientists Were Wrong About This Bird's Head» — https://youtube.com/shorts/uc0ab1fAaQc
(4 078 переглядів станом на 2026-11-04 — ~3× від інших Shorts каналу). Теза: дятел не втрачає свідомість, бо мозок малий; «амортизатор» — міф.

**Інверсія (частина 2):** «Не втрачає свідомість ≠ мозок у порядку». У 2018 році в мозку дятлів знайшли скупчення білка tau — того самого маркера, що в людей пов'язаний з ушкодженням мозку від повторних ударів. Відкрите питання: це ушкодження чи захист?

## Voiceover (EN, 66 слів, ~25–27 с)

> A woodpecker bangs its head on trees all day, and never gets knocked out. So its brain is fine, right? In 2018, scientists checked woodpecker brains kept in museums. They found clumps of a protein called tau. In football players, that kind of buildup is linked to brain damage from years of hits. Blackbirds, which don't peck, showed none. So is it damage, or protection? Nobody's sure yet.

## Фактчек (важливі нюанси)

- Дослідження: Farah, Siwek, Cummings, «Tau accumulations in the brains of woodpeckers», PLOS ONE 13(2): e0191526, 2018 (Boston University). Зразки — музейні (Field Museum, Harvard), законсервовані в етанолі.
- 10 дятлів, 5 червоноплечих чорних трупіалів (red-winged blackbirds) як контроль.
- Срібне фарбування: «ниткоподібні» відкладення у 80 % дятлів. **Імуногістохімію на tau вдалося зробити лише для 3 дятлів, tau знайдено у 2 з 3.** Тому в тексті «They found clumps of a protein called tau», а не «most had tau».
- Контрольні птахи — негативне фарбування → «showed none».
- Автори прямо кажуть, що не можуть відрізнити захисний tau від патологічного → «So is it damage, or protection? Nobody's sure yet.» Новішого дослідження, яке б це розв'язало, я не знайшов — [MISSING]: перевірити перед публікацією.
- Вибірка дуже мала — не подавати як доведений факт ушкодження.

## Джерела

- PLOS ONE (оригінал): https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0191526
- PMC (повний текст): https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5796688/
- Field Museum (прес-реліз): https://www.fieldmuseum.org/about/press/woodpeckers-show-signs-possible-brain-damage-might-not-be-bad-thing
- ScienceDaily: https://www.sciencedaily.com/releases/2018/02/180202140910.htm
- Discover Magazine: https://www.discovermagazine.com/what-are-woodpeckers-doing-to-their-brains-37450

## Стиль каналу (для відповідності частині 1)

- Дятел: біла кругла голова, червоний зубчастий чубчик, великі круглі очі з бровами, сіро-блакитний трикутний дзьоб, чорні «вуса», чорна спина з білими плямками, біле черевце, сірі лапки на коричневому стовбурі.
- Фон: блакитне небо з білими хмарами, зелені пагорби, стовбур #96582E–#A66333.
- Мозок: пастельно-рожевий (#FFAEC8) з kawaii-обличчям, чорний контур.
- Голос: чоловік 25–40, General American, середньо-низький, теплий, рівний темп пояснювача.

## Виробництво (skill `cutout-cartoon-shorts`)

**Фінал:** `videos/whypeck-02-woodpecker-brain/final-4K.mp4` (20,5 МБ) — 2160×3840, 60 fps, 1590 кадрів, 26,5 с, H.264 + AAC 320k, голос + SFX + музика, −14,1 LUFS. Рендер: 6 частин по 265 кадрів (`studio/_render_seg.mjs`, ~45 хв на CPU), склейка без перекодування + звук. Остання сцена закільцьована з кадром 0 (дятел знову стукає).

**Голос:** ElevenLabs через Higgsfield (`text2speech_v2`, variant `elevenlabs`), пресет **Mark** — молодий чоловічий американський, природний розмовний; 25,8 с; job `f1029c01-85f5-4faf-be02-f21f494bdb67`; 1,2 кредиту. Таймінги слів — Whisper small.en + паузи за RMS (`vo/words_raw.json`). Kokoro (`voice.wav`) був лише тимчасовою доріжкою.

**Картинки:** усі персонажі, пози, реквізит і фони намальовані кодом (SVG у Remotion) у стилі частини 1 — 0 кредитів. Причина: на старті мережа сесії блокувала CDN Higgsfield; плюс так стиль 1:1 збігається з першою частиною.

**Звук:** SFX і піцикато-музика синтезуються кодом (`mix.py`, royalty-free), голос 0 дБ, SFX −13…−31 дБ, музика −27 дБ з дакінгом під голос.

### Аркуш бітів (час відео = час слова + 0,1 с)

| Час | Слова | На екрані | Звук |
|---|---|---|---|
| 0,0 | A woodpecker bangs its head… | Кадр 0: дятел у профіль стукає в стовбур, летять тріски | ток-ток |
| 2,0 | all day | повільний наїзд камери | — |
| 3,2–4,3 | and never gets knocked out | поворот голови до глядача (swap у squash), зірочки пробують з'явитися — трусить головою, зірки лопаються, самовдоволений погляд | whoosh, twinkle, pops |
| 4,6–6,7 | So its brain is fine, right? | скан-лінія → x-ray голова, наїзд на рожевий мозок; «fine» — іскри, «right?» — кивок; мозок косить оком і пітніє (сумнів) | scan, chime, drip |
| 6,7 | In 2018… | склейка: музей, полиця з банками-мозками; календар 2017 → 2018 | whoosh, paper |
| 8,3–10,5 | scientists checked woodpecker brains kept in museums | лупа виїжджає; мозок у банці з міткою дятла розплющує очі, потім решта мозків | whoosh, pops |
| 10,8–13,7 | They found clumps of a protein called tau | наїзд у лінзу; фіолетові скупчення вискакують по одному; мозок наляканий → пітніє → «gulp» | bubble pops, gulp |
| 14,1–18,7 | In football players… years of hits | склейка: дятел; з неба падає футбольний шолом (фізика), потім 3 м'ячі б'ють у шолом на «years / of / hits» | свист, clunk, bonk ×3 |
| 19,0–21,9 | Blackbirds, which don't peck, showed none | склейка: прилітає червоноплечий трупіал, сідає на гілку, хитає головою «ні»; x-ray обох: у трупіала мозок чистий з іскрами, у дятла — зі скупченнями | flaps, thud, scan, chime |
| 22,0–24,1 | So is it damage, or protection? | трупіал відлітає, наїзд на мозок дятла; «damage» — тріщина й спіральні очі; «protection» — на мозок стрибає крихітний шолом | crack, boing |
| 24,3–25,5 | Nobody's sure yet | від'їзд камери, x-ray вимикається, знизує крилом, три знаки питання | blips |
| 25,6–26,5 | — | повертається до стовбура і знову стукає → петля в кадр 0 | ток-ток |

### Перевірки
- Контакт-листи кадрів на кожному біті — ок (шолом перероблено з вирізом для очей, крило в «shrug» відсунуто від обличчя).
- Pop scan прев'ю (різниця кадрів > 2,2× локальної медіани): усі прапорці — заплановані події (стуки, 3 склейки, 2 swap голови, падіння шолома, удари м'ячів, лупа). Шов петлі ≈ звичайний кадр стуку.

### Як перезібрати
```bash
python3 videos/whypeck-02-woodpecker-brain/build_beats.py
python3 videos/whypeck-02-woodpecker-brain/mix.py
cd studio && node _render_seg.mjs 2 265   # частини -> out/seg/, далі склейка ffmpeg concat + mix.wav
```
Remotion Studio: `cd studio && npm run studio` → композиція `wp02-woodpecker-brain`.

## Пошук голосу «Mark» в ElevenLabs (статус 2026-11-05)

- Higgsfield показує лише пресет **Mark** (male, young, рушій elevenlabs, Higgsfield ID `27c04473-84a9-4b60-a41f-c8e8458bd4f1`). Його власне прев'ю: «Hey, it's Mark. Just keeping it real… late night coffee chat or a casual vlog». ElevenLabs-ID Higgsfield не віддає.
- Кандидати в бібліотеці ElevenLabs (сторонній каталог json2video + публічна сторінка elevenlabs.io): **Mark - Natural Conversations** `UgBBYS2sOqTuMpoF3BR0`; **Mark - Friendly Companion** `1SM7GgM6IMuvQlz2BwM3` (опис «Mark - ConvoAI», прев'ю завантажене, F0 ≈107 Гц проти 122 Гц у нашій озвучці — той самий регістр, але це не доказ); також «Mark» `ec0Fx65Vil8JBr4VRwe6`, «Mark - Normal» `WTUK291rZZ9CLPCiFTfh`, «Mark - Clear, Natural and Conversational» `YeJvxQiuGycUuaORfuAA`.
- Повний пошук блокує ElevenLabs без входу («You must be logged in to use filters / fetch more than 3 voices»).
- Наступний крок після входу (конектор ElevenLabs або API-ключ як network secret `xi-api-key` для `api.elevenlabs.io`): `GET /v1/shared-voices?search=Mark`, завантажити прев'ю всіх «Mark», порівняти тембр з `vo/eleven_mark_take1.mp3`, видати точну назву + ID + посилання.
