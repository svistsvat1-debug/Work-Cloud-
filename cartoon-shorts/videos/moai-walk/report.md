# Звіт: moai-walk (Short #25)

## Фінальний сценарій (слово в слово, як затверджено)
1. How did they move these stone giants with no wheels or big animals?
2. On logs, right?
3. But the statues by the old roads have rounded bases and lean forward.
4. So they rocked them side to side with ropes.
5. Legends say the statues walked.
6. Turns out, they probably did.

## Озвучка
- Голос Mark — Natural Conversations (UgBBYS2sOqTuMpoF3BR0), модель eleven_v4, 1 дубль.
- Дубль триває 16,86 с. Підганяти не довелося: паузи не різав, темп не змінював.
- Scribe розпізнав усі 48 слів без помилок. Межі речень перевірено за гучністю.
- Довжина відео: **17,3 с** (1038 кадрів, 60 fps). Голос стартує на 0,1 с, після останнього слова хвіст 0,54 с.

## Біти

| Час | Слова | Картинка | Гег | Звук |
|---|---|---|---|---|
| 0–1,3 | How did they move… | hero, moai | Кадр 0: моаї + спантеличений хлопець, над ним «?» | pop |
| 1,3–2,3 | stone giants | moai + очі в коді | Статуя розплющує очі | grind, pop |
| 2,4–3,1 | no wheels | колесо в коді | Колесо котиться, б'ється об статую, падає плазом, з'являється червоний ✕ | whoosh, knock, dustplop, pop |
| 3,2–4,4 | or big animals? | курка в коді | Єдина «велика тварина» — маленька курка; моаї косується на неї | cluck |
| 4,4–5,9 | On logs, right? | proud | Бульбашка-думка: моаї лежить на колодах і котиться | pop |
| 5,9–7,8 | But… old roads | hero | Бульбашка лопається; камера спускається до основи; табличка OLD ROAD | pop, whoosh |
| 7,9–8,8 | rounded bases | moai | Округла основа гойдається, підсвічена жовтим пунктиром | boing |
| 8,8–10,1 | lean forward | scared | Статуя нахиляється над хлопцем, жовта стрілка, крапля поту | grind, pop |
| 10,1–12,8 | So they rocked… ropes | pull ×2 | З хмарки з'являється другий хлопець; обидва тягнуть мотузки, статуя робить 4 кроки вперевалку, пил, легкий трус кадру | rope_creak ×4, stone_step ×4 |
| 12,9–14,6 | Legends say the statues walked | stunned | Статуя сама приходить на своє місце, мотузка волочиться | stone_step ×4 |
| 15,1–15,8 | Turns out | closeup | Реакція хлопця крупним планом | whoosh |
| 15,8–17,3 | they probably did | stunned, moai | Ракурс кадру 0, моаї підморгує на «did», іскорки | pop, boing |

## Картинки
Усі ElevenLabs GPT Image 2.5, 1K, LOW, 1 варіація, лише текст, без референсів. Перероблювати не довелося жодної.
- hero (2:3)
- guy pair A (3:2): proud + rope pull
- guy pair B (3:2): scared + stunned
- closeup (2:3)
- moai (2:3)
- фон острова (2:3)

У картці планувалося 7 картинок. Окрема картинка з колодами виявилася не потрібна: колоди намальовані кодом.

## Звуки
- **Нові (ElevenLabs Sound Effects v2):** stone_step (1 с), rope_creak (1 с). Обидва додав у sfx-library.
- **Повторно з бібліотеки:** pop, grind, whoosh, knock, dustplop, cluck, boing.
- Пік міксу −4,6 dBFS.

## Кредити

| Що | Кредити |
|---|---|
| Озвучка | 259,97 |
| Scribe | 0 |
| hero | 46,95 |
| 5 картинок | 234,76 |
| 2 звуки | 6,67 |
| **Разом** | **548,35 з 900** |

Резерв не знадобився.

## Прохід покращень
- Табличка OLD ROAD на слова «old roads»: стоїть за статуєю і вказує вбік.
- Кадр із мотузками крупніший (k 1,24 → 1,4) і відцентрований.
- Хмарка, коли лопається бульбашка, стала щільнішою.

Після першого контактного аркуша:
- Кадр 0 крупніший (k 1,7 → 1,95).
- Колесо, ✕ і курка тепер повністю в кадрі.
- Пунктирні лінії кута, що нагадували драбину, замінив жовтою стрілкою.
- Пил від кроків менший.

Скан різких стрибків між кадрами: позначені тільки заплановані склейки (12,86 / 15,12 / 15,84 с) і приземлення кроків.

## Upload kit
- **Назва:** How did Easter Island's statues move with no wheels?
  - Альтернативи: «How did they move Easter Island's giants?», «What if the Easter Island statues walked?»
- **Текст обкладинки:** THEY WALKED?
- Опис, джерела й хештеги — у `videos/moai-walk/upload.md`.

## Де що лежить
- **ElevenLabs flow:** https://elevenlabs.io/app/flows/HYB7JmDverW8f4lmsc6J
- **Remotion Studio:** `cd cartoon-shorts/studio && npx remotion studio` (композиції MoaiWalk і MoaiWalkCover)
- **Відео:** `videos/moai-walk/moai-walk.mp4` (не в git), обкладинка — `cover.png`.
- **Код:** `studio/src/moai-walk/`
- **Робочі матеріали:** `studio/images/moai-walk/` (промпти, бюджет, журнал кредитів, QA)

## Пам'ять каналу
- VIDEOS_LOG: рядок #25 (поки йшло виробництво, в main з'явилися відео #12–#24 з інших сесій, тому номер #25).
- IDEA_BANK: моаї позначено як used.
- STYLE: уроки відео #25.
- COMPETITORS: 3 знахідки в розділі «Found by Claude».
- sfx-library: 2 нові звуки.
