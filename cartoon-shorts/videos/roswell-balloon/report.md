# Звіт — roswell-balloon (відео #40), 2026-11-19

Зупинку на затвердження пропущено за прямим проханням власника («Зроби ролик зразу без мого підтвердження»). Картка ідеї: `idea-card.md`.

## Фінальний текст (Liam, дослівно як у картці)
1. A rancher finds shiny foil, rubber and sticks all over the ranch.
2. So the Army announces it's got a flying disc.
3. But hours later, it takes that back: just a weather balloon.
4. Thirty years later, people start saying: aliens, and a cover-up.
5. Turns out, there was a cover-up.
6. It really was a balloon. Just not for weather.
7. A secret one, built to listen for Soviet nuclear bombs.

## Джерело і структура
- Відео-джерело: https://youtu.be/zXhnUu2ic3k (BRIGHT SIDE Series, 24K), сегмент 18:04–21:57 «The Roswell incident». Лишилось 12 сегментів (найкращі: Apollo 10 «space music», вашингтонські НЛО 1952, супутник-куля Echo).
- Модель структури: STRUCTURES #5 (наш хіт #25 moai-walk): дивна знахідка → перша відповідь → «But» на 33 % → легенда → «Turns out…» робить легенду правдою → справжня відповідь з ядерним панчем.

## Голос і довжина
- Liam (VCgLBmBjldJmfphyB8sZ), eleven_v4, один дубль, 373 символи. Темп 2,73 сл/с (24,5 с сирої мови).
- Підгонка під 25 с: дві паузи (0,6 і 0,5 с) скорочено до 0,25 с (лише тиша, без зміни темпу і слів). Фінал 24,5 с (1470 кадрів, 60 fps, 1080×1920).

## Біти
Див. `studio/images/roswell-balloon/beats.md`: ранчо (0–4,7) → авіабаза + газета (4,7–7,5) → «But»: годинник, табличка, тарілка стає метеозондом (7,5–11,2) → ніч, дошка змови, 1947→1978 (11,2–15,7) → «shh» і TOP SECRET на воротах ангара (15,7–17,8) → ворота відкриваються, піднімається потяг куль, хмара хитає головою (17,8–20,6) → над хмарами: пристрій із вухом, далекий вибух, кільця звуку, «!» на «bombs», шматок фольги падає (петля) (20,6–24,5).

## Картинки (усі GPT Image 2.5, 1K, LOW, 1 варіація, без референсів)
hero (ранчер, 2:3) · rancher3 (3:2) · officer3 (3:2) · fan3 (шапки з фольги, 3:2) · objects (відбивач-«змій», купа уламків, тарілка; 3:2) · ranch (2:3) · base (2:3) · sky (2:3). 0 переробок. Повторно використано вирізку репортера з #39 (0 кредитів).

## Звуки і музика
- Нові (ElevenLabs Sound Effects v2): foil, megaphone, pin, balloons, listen — додано в `sfx-library/`.
- Повторні з бібліотеки: twinkle, rubber_stretch, crash, gust, press_frenzy, flashbulb, whoosh, ticks, deflate, sun_poof, flip, stamp, swoop, boom_low, pop, magic, squeak, zoomaway, sad_horn, boing.
- Музика: локальний код, соль мажор, 119,5 BPM, зупинка на «But», пінги на «disc», «cover-up», «bombs»; 15 dB під голосом. Пік міксу −4,17 dBFS.

## Кредити ElevenLabs
голос 372,96 + Scribe 0 + 8 картинок 375,62 + 5 звуків 18,33 = **766,91** (ліміт 900). Деталі: `studio/images/roswell-balloon/credits.md`.
Flow: https://elevenlabs.io/app/flows/XaG6yQsDZc2v3BYHIrfS

## Прохід покращень
Тарілка → метеозонд став читатися (коротший «пуф», більша сумна кулька); газета падає пласко; у фіналі пристрій ×1,3, вибух ближче, камера ближче; у сцені «shh» камера наїжджає на TOP SECRET; «?» піднято над капелюхом.

## Upload kit
`upload.md`: назва «What really crashed at Roswell?», текст обкладинки «IT WAS LISTENING», опис із джерелами та хештегами, субтитри `roswell-balloon.en.srt`.

## Відкрити в Remotion Studio
`cd cartoon-shorts/studio && npm ci && npx remotion studio` → композиції `RoswellBalloon` і `RoswellBalloonCover`.
