# iceberg-tow — фінальний звіт (#24)

**Відео:** 22.76 с, 1080x1920, 60 fps, 1366 кадрів, голос + музика + звуки. Обкладинка: cover.png («20 SHIPS?»).

## Сценарій (затверджено наперед власником: «Роби зразу без підтвердження»)
1. So you tie a rope to an iceberg and tow it to Dubai.
2. But most of it hides under the water, so it drags like an anchor, slower than you walk.
3. For months, the warm sea eats it from below.
4. So you need one two kilometers long and up to twenty ships.
5. And when it arrives, it's too deep to reach the beach.
6. So it sits offshore and melts into salt water.
70 слів, 355 символів; транскрипт Scribe збігся дослівно; жодних змін після запису.

## Структурна модель
STRUCTURES #1 — what-if «So you… But… So…» (cut-out «Can we throw trash in a volcano?», ~3.6M за даними власника, без транскрипту). Карта: хук «you + об'єкт + мета» (0–3.4 с) → «But» на 3.6 с (16 %) → ескалація «So you need…» (54 %) → розв'язка в останніх двох реченнях (71–98 %).

## Голос
Liam – Viral Short-Form Storyteller (eleven_v4, 1 дубль). 22.16 с мовлення → ~3.16 сл/с. Підганяти під 25 с не довелося.

## Біти
| час | слова | на екрані / гег | звук |
|---|---|---|---|
| 0.1–3.4 | So you tie a rope… Dubai | хлопець на буксирі, мотузка натягується; айсберг відкриває очі на «iceberg»; дим з труби; DUBAI на горизонті | rope, pop, chug, boing |
| 3.6–5.5 | But most of it hides under the water | камера пірнає; вода стає прозорою, видно величезну підводну частину + HIDDEN | whoosh, gulp, музична зупинка |
| 5.6–9.0 | drags like an anchor, slower than you walk | айсберг тягне назад, «штамп» якоря на підводній частині; качечка обганяє буксир; хлопець знесилений | chug, glacier_groan, splash, pop |
| 9.1–12.3 | For months, the warm sea eats it from below | календар гортає місяці, сонце «гаряче», теплові хвилі; маленькі «роти» моря гризуть кіль, айсберг меншає | whoosh×3, nibble×2 |
| 12.3–16.1 | one two kilometers long… twenty ships | айсберг роздувається до 2 KM, з'являються 20 буксирів, x20; шокований хлопець | glacier_groan, boing, pop×4, horns, ping |
| 16.1–19.3 | too deep to reach the beach | берег: кіль б'ється об морське дно далеко від пляжу (поштовх, пил), хлопець тягне з берега, стрілка-відстань | ground, rope, музична зупинка |
| 19.3–22.76 | sits offshore and melts into salt water | айсберг тане (краплі, кола), зникає; хлопець із порожньою склянкою, наїзд камери | drip×3, pop, splash, sad_horn |

## Картинки (усі GPT Image 2.5, 1K, LOW, 1 варіація, без референсів, 0 переробок)
hero (2:3, тягне мотузку), shock_tired (3:2, пара поз), glass_strain (3:2, пара поз), tug (3:2), iceberg (2:3, цілий з підводною частиною, magenta), city (3:2, magenta), bg (2:3, океан).

## Звуки
Нові (ElevenLabs SFX v2): chug, rope, ground, horns, nibble (додані в sfx-library). Повторно: whoosh, pop, boing, drip, splash, gulp, sad_horn, glacier_groan.

## Музика
Код (scripts/music.py): F major, 119.5 BPM, тема → «uh-oh» з зупинкою на «But» → build на «So you need» → «uh-oh» із зупинкою на ударі кіля → фінальний акорд на «water»; на 18 dB під голосом, дакінг −4 dB. 0 кредитів.

## Кредити
голос 346.97 + Scribe 0 + 7 картинок 328.67 + 5 звуків 25.0 (оцінка 82.5) + музика 0 = **700.6** (ліміт 900).
Flow: https://elevenlabs.io/app/flows/RU58m0zuz1DOuTJQEsIu

## Прохід покращень
1. Берег: кадр був заширокий (пів кадру — пісок, хлопця обрізало) → ближче й зсув праворуч.
2. Фінал був статичним широким планом → наїзд на хлопця з порожньою склянкою після зникнення айсберга.
3. 20 буксирів були крихітні → більші, 4 ряди в глибину; HIDDEN обрізався краєм → перенесено на підводну частину; місто ховалося за буксиром → горизонт піднято; сонце обрізалось → опущено.

## Чесні застереження
- «Dubai» і «2 км / до 20 суден» — з моделі Condron 2023 для маршруту до ОАЕ (айсберг без захисту: ≥ ~2000 м × 600 м, 10–20 суден).
- «too deep to reach the beach»: джерела кажуть, що 9/10 айсберга під водою і його не підвести до причалу — лід доведеться обробляти далеко від берега; удар кіля об дно — мультяшна драматизація цього.
- Відео не зациклюється точно (кінець: хлопець на пляжі; початок: буксир у морі).
- Звук не прослуховувався вухом — перевірено за рівнями (пік мікс −4.4 dBFS у прев'ю).
