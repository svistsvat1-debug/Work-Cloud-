# Звіт — kingfisher-train (відео №11, 2026-11-13)

## Фінальний текст (дослівно як у схваленій картці, без змін)
1. Why did Japan give its bullet train a nose like a bird's beak?
2. Its old nose shoved air into tunnels so hard the tunnels went boom.
3. But a kingfisher dives into water with barely a splash.
4. So engineers copied its beak, and the train slipped in quietly.

## Голос
ElevenLabs, «Mark - Natural Conversations» (UgBBYS2sOqTuMpoF3BR0), eleven_v4, 1 дубль, 15,6 с. Scribe розпізнав текст без жодної помилки. Підганяти під 20 с не довелося. Межі слів звірено з паузами за гучністю (RMS < −42 dB).

## Відео
16,3 с (978 кадрів), 1080×1920, 60 fps, H.264 crf 18. Голос стартує з 0,1 с, після останнього слова ~0,6 с хвоста. Пік міксу −3,4 dBFS.

## Біти
| час | слова | картинки | гег | звук |
|---|---|---|---|---|
| 0–3,96 | Why did Japan … bird's beak? | newtrain, hero, perch + прапорець у коді | «?» над героєм; прапорець Японії підстрибує на «Japan»; зимородок перестрибує з кабіни на ніс — дзьоб поруч із «дзьобом», іскри | pop, bird_call, whoosh, pop |
| 3,96–5,6 | Its old nose shoved air into tunnels | oldtrain + 2 вагони, hill | насуплений старий потяг гальмує; перед носом росте подушка повітря з очима «> <», затиснута між носом і порталом, і пірнає в тунель | train_rush, gas_hiss, squeeze |
| 5,6–8,56 | so hard the tunnels went boom | hill, hero → ears | камера від'їжджає: пагорб з обличчям надувається, щоки, піт; BOOM з дальнього порталу — лінії вибуху, пил, трусіння, героя відкидає, він затуляє вуха | rumble, squeeze ×2, boom |
| 8,56–12,04 | But a kingfisher dives … barely a splash | perch / dive, ставок і риба в коді | пірнає з гілки за гравітацією, «plip», крихітні брижі й дві краплі; виринає з рибою «> <», сідає на гілку, «!» | bird_call, whoosh, drip ×2, pop, bird_call |
| 12,04–13,78 | So engineers copied its beak | oldtrain → newtrain, perch | пташка сідає на старий ніс; велика хмара «пуф» — і ніс стає дзьобом, іскри | whoosh, pop, clink, bird_call |
| 13,78–16,3 | and the train slipped in quietly | newtrain, hill, dive (політ), ears → thumbs | потяг тихо прослизає крізь пагорб, той спокійно всміхається, «shhh»; герой чекає вибуху (вуха), а тоді показує великий палець; пташка перелітає пагорб і сідає на кабіну — останній кадр = кадр 0 | glide ×2, whoosh, pop, bird_call |

## Картинки (усі GPT Image 2.5, 1K, LOW, 1 варіація, без референсів)
Усього 7 картинок, жодної переробки:
- hero 2:3
- guy2 3:2 (пара: затуляє вуха / великий палець)
- oldtrain 3:2
- newtrain 3:2
- bird2 3:2 (пара: сидить / пірнає, маджента-ключ)
- hill 3:2 (маджента-ключ)
- bg 2:3

Задні вагони вирізані з картинки старого потяга. Рейки, ґрунт, ставок, риба, гілка, прапорець, подушка повітря, хмара, вибух, усі обличчя й написи намальовані в коді.

## Звуки
- **Нові (ElevenLabs SFX v2), уже додані в `sfx-library/`:** train_rush, glide, bird_call.
- **Повторно з бібліотеки:** pop, gas_hiss, squeeze, rumble, boom, whoosh, drip, clink.

## Кредити
| що | кредити |
|---|---|
| голос | 249,98 |
| Scribe | 0 |
| герой | 46,95 |
| 6 картинок | 281,72 |
| 3 звуки | 15,0 |
| **разом** | **593,65 з 900** |

Резерв не знадобився. Детальний облік: `studio/images/kingfisher-train/credits.md`.

## Що змінив прохід покращення
1. **Масштаб і кадрування.** Персонажі були задрібні, а нижні 40 % кадру займав ґрунт. Камери наблизив, землю опустив до ~78 % висоти кадру, героя збільшив, пташку збільшив з 0,11 до 0,135.
2. **Подушка повітря.** Її майже не було видно: потяг доїжджав до порталу надто рано. Тепер потяг різко гальмує, а подушка з очима «> <» видима ~1 с, затиснута між носом і порталом.
3. **Кадр 0 і BOOM.**
   - Верхня половина кадру 0 була порожнім небом — додав прапорець Японії. Він стоїть і в кадрі 0, і в останньому кадрі, тож відео зациклюється.
   - Ударна хвиля виглядала як біла «палиця» — переробив на радіальні лінії вибуху.
   - Камеру на вибуху наблизив, щоб герой був повністю в кадрі.
   - Великий палець в останньому кадрі був обрізаний — зсунув героя й камеру.

Pop-scan: усі позначені стрибки задумані (3 монтажні склейки, заміни поз, хмара «пуф»).

## Пакет для завантаження
- **Назва:** Why does Japan's bullet train have a bird's beak?
- **Інші варіанти назви:**
  - Why did Japan copy a bird to fix its fastest train?
  - What happens when a bullet train enters a tunnel?
- **Текст обкладинки:** TUNNELS WENT BOOM
- **Опис:** «Japan's bullet trains used to make tunnels go boom, so engineer Eiji Nakatsu borrowed the shape of a kingfisher's beak, a bird that dives into water with barely a splash.» + 3 джерела
- **Хештеги:** #shorts #bullettrain #kingfisher #physics #japan

Усе це — у `upload.md`.

## Посилання та файли
- **ElevenLabs flow:** https://elevenlabs.io/app/flows/rlVgNLiVNmsNvasDDyrD
- **Remotion Studio:** `cd cartoon-shorts/studio && npx remotion studio` (композиції KingfisherTrain і KingfisherTrainCover)
- **Файли:**
  - `cartoon-shorts/videos/kingfisher-train/` (mp4 — не в git, cover.png, upload.md, idea-card.md, report.md)
  - код: `cartoon-shorts/studio/src/kingfisher-train/`
  - спрайти й звуки: `cartoon-shorts/studio/public/kingfisher-train/`
  - промпти, облік і QA: `cartoon-shorts/studio/images/kingfisher-train/`

## Рішення, ухвалені самостійно
- Сцена — шкільна схема збоку (рейки на одній лінії ґрунту, пагорб з тунелем).
- Ставок — окремий «сет» на тій самій лінії ґрунту.
- Перетворення носа приховане хмарою «пуф».
- Прапорець Японії доданий як візуальна опора для слова «Japan».

Запасні варіанти не знадобилися.
