# Звіт - building-move (№13, 2026-11-14)

## Фінальний сценарій (формат історії, нове правило власника)
1. In 1930, a phone company needed this building gone.
2. The plan: knock it down.
3. But it was a working phone exchange, so one swing would cut off the calls.
4. So the architect said: move it.
5. They rolled and turned eleven thousand tons, with six hundred people working inside.

48 слів, 268 символів. Голос: ElevenLabs «Mark - Natural Conversations», eleven_v4, 1 дубль, 18,72 с (мовлення закінчується на 18,6 с).
Підганяти під 20 с не довелося. Scribe розпізнав усі 48 слів без помилок.

## Відео
1080×1920, 60 fps, 19,3 с (1158 кадрів), звук на всю довжину, пік −4,5 dBFS. Петля: останній кадр (оператор у вікні) повертає до «In 1930…» за змістом.

## Біти
| час | слова | на екрані / картинка | гег | звук |
|---|---|---|---|---|
| 0,0–2,0 | In 1930, a phone company | будівля (front) + хлопець (hero, дзеркально) вказує на неї; табличка «1930» | — | pop |
| 2,0–3,9 | needed this building gone | синє креслення нового офісу в небі | у будівлі відкриваються очі, вона дивиться на креслення, пітніє, хвиляста «нервова» лінія рота | flip, pop, gulp |
| 3,9–6,1 | The plan: knock it down | заїжджає кран (crane, дзеркально), куля (props) | куля відводиться назад, будівля тремтить | rumble, winch, creak |
| 6,1–8,4 | But it was a working phone exchange | хлопець (shock); у вікнах з'являються оператори (operator, клон); дроти в місто; бульбашка з телефоном | телефон дзвонить, по дротах біжать сигнали | squeeze, pop×6, ring×3 |
| 8,4–10,9 | so one swing would cut off the calls | куля летить і впирається в стіну | будівля «> <»; дроти рвуться й іскрять; телефон замовкає, «?» | whoosh, knock, crack, crickets |
| 10,9–13,1 | So the architect said: move it | клуб диму (поверненння «що якби»), кран їде; хлопець (idea) + лампочка; жовта стрілка вліво | будівля полегшено всміхається | whoosh, rumble, clink, whoosh |
| 13,3–16,4 | They rolled and turned eleven thousand tons | домкрати + колоди; хлопець (push) штовхає; поворот front → side; «11,000 TONS»; хлопець (cheer) | дроти провисають, але тримаються | winch, pop×5, grind, creak, stamp, boing |
| 16,0–16,5 | with | наїзд у вікно, склейка | — | whoosh |
| 16,5–19,3 | six hundred people working inside | оператор (operator) із кавою; за вікном пливе вулиця й стовп; «600 PEOPLE» | пара від кави, дзвонить гарнітура, підморгування на «inside» | pop, ring, clink |

## Картинки (усі GPT Image 2.5, 1K, LOW, 1 варіація, без референсів)
hero 2:3 · guyA 3:2 (переляк / ідея) · guyB 3:2 (штовхає / радіє) · operator 2:3 · building 3:2 (фасад / бік) · crane 2:3 · props 3:2 (телефон + куля) · bg 2:3.
8 картинок, 0 переробок. Усе пройшло перевірку на кольоровому тлі з першого разу.

## Звуки
Новий (ElevenLabs Sound Effects v2): ring.wav (дзвінок старого телефона), додано в sfx-library.
Повторно з бібліотеки: whoosh, knock, crack, crickets, winch, creak, grind, pop, stamp, clink, gulp, flip, boing, rumble, squeeze.

## Кредити
| що | кредити |
|---|---|
| голос (268 симв.) | 267,97 |
| Scribe | 0 |
| 8 картинок LOW 1K | 375,62 |
| 1 звук | 5,0 |
| **разом** | **648,67** (ліміт 900) |

## Прохід покращень
1. Занадто швидка панорама 8,6 → 9,15 с (показала покадрова перевірка) розтягнута до 8,45 → 9,2 с.
2. Лінія землі опущена в кадрі: менше порожньої вулиці, більше неба для бульбашок і табличок.
3. Наїзд у вікно починається раніше, отримав whoosh; «11,000 TONS» зникає до наїзду (раніше обрізалось).
4. Загальна гучність +2 дБ (пік −6,4 → −4,5 dBFS).
До цього, з першого контактного аркуша: брови будівлі (були вертикальні палиці), більший хлопець у першому кадрі, стрілка «move it» у кадрі, «600 PEOPLE» не перекриває обличчя, обірвані дроти видно (звисають з даху з іскрами).

## Файли
- videos/building-move/building-move.mp4 (не комітиться), cover.png, upload.md, idea-card.md, report.md
- studio/src/building-move/ (Short.tsx, Cover.tsx, scene.ts, sprites.ts), studio/public/building-move/
- studio/images/building-move/ (prompts.md, budget.md, credits.md, prep.py, qa/)
- Відкрити в Remotion Studio: `cd cartoon-shorts/studio && npx remotion studio`
- ElevenLabs flow: https://elevenlabs.io/app/flows/5jvwQAkH5g6oQ1dJbenz
