# sun-trash — звіт (2026-11-15)

**Фінальний текст (без змін, 70 слів):**
1. So you load a rocket with trash and aim at the Sun.
2. But your rocket already flies sideways with Earth, at sixty-seven thousand miles an hour.
3. So the trash just circles the Sun, like Earth.
4. To fall in, it must lose almost all that speed.
5. That's fifty-five times the energy of a trip to Mars.
6. So you turn around, and with way less fuel, the trash leaves the solar system.

**Голос:** Liam - Viral Short-Form Storyteller (VCgLBmBjldJmfphyB8sZ), eleven_v4, 1 дубль, 23.20 с → темп ~3.0 сл/с (числа словами сповільнюють). Підганяти під 25 с не довелося. Scribe розпізнав текст слово в слово.
**Довжина відео:** 23.8 с (1428 кадрів, 60 fps, 1080x1920), пік міксу −4.2 dBFS.

## Біти
| час | слова | картинка | гег | звук |
|---|---|---|---|---|
| 0–1.3 | So you load a rocket with trash | hero з мішком, ракета, сплюще Сонце | кидок мішка на ракету, ракета хитається | whoosh, catch |
| 1.3–3.3 | and aim at the Sun | aim (палець угору) | ракета наводиться, червоний приціл на обличчі Сонця, Сонце прокидається, піт | flip, pop, gulp |
| 3.3–8.9 | But … sideways with Earth, 67,000 mph | shock | відʼїзд: Земля мчить по орбіті, стрілка, лінії швидкості, «67,000 MPH» | whoosh, swoop ×2, pop |
| 8.9–11.7 | So the trash just circles the Sun, like Earth | aim | запуск, ракета по еліпсу Кеплера кружляє навколо Сонця; у Сонця спіральні очі | launch, swoop, dizzy, pop |
| 11.7–15.0 | To fall in, it must lose almost all that speed | pull | важіль BRAKE, спідометр має впасти в зону «FALL IN», піт | lever ×3 |
| 15.0–18.5 | That's 55 times the energy of a trip to Mars | shock → palm | 1 каністра «TO MARS» проти вежі з 55 каністр і лічильником ×1…×55, facepalm | clank ×2, gulp, boing |
| 18.5–21.9 | So you turn around, and with way less fuel | aim → thumb | ракета робить пірует, одна каністра «×1» падає в неї, полумʼя | swoop, pop ×2, catch, thruster |
| 21.9–23.8 | the trash leaves the solar system | wave → hero | ракета зникає вправо, зірочка, Сонце щасливе й засинає, нова ракета вискакує (луп на кадр 0) | zoomaway, pop, boing |

## Картинки (усі GPT Image 2.5, 1K, LOW, 1 варіація, без референсів)
hero (2:3), aim/shock (3:2), pull/wave (3:2), palm/thumb (3:2), rocket (2:3), can+bag (3:2), space plate (2:3) — 7 шт., 0 переробок. Земля, Марс, Сонце з обличчям, приціл, спідометр, важіль, полумʼя, дим — кодом.

## Звуки
Нові (ElevenLabs SFX v2): launch, swoop, lever, clank, zoomaway, dizzy (усі додані в sfx-library). Повторно з бібліотеки: whoosh, catch, gulp, pop, thruster, boing, flip.

## Музика
Локальний код (scripts/music.py), 0 кредитів: C-dur, 117 BPM; тема → стоп на «But» → uh-oh → тема2 (запуск) → стоп на склейці BRAKE → build (55 каністр) → тема → фінальний акорд + дзвіночок на «system»; −18 дБ під голосом, −4 дБ дакінг під словами.

## Кредити (жорстка межа 900)
голос 369 + Scribe 0 + hero 47 + 6 картинок 282 + 6 звуків 28 = **726**; резерв не знадобився. Журнал: studio/images/sun-trash/credits.md.

## Покращувальний прохід
1. Ракета в широкому плані орбіти надто дрібна → масштаб 1.7 → 2.3.
2. Стрілка спідометра на «lose» майже не рухалась → тепер падає одразу з «боротьбою».
3. Кільце з 6 клубків диму довкола ракети при розвороті читалося як квітка → кілька клубків з хвоста.
Ще до превʼю: обличчя Сонця було ширше за кадр хука (масштаб рис 0.6 у ближніх планах), бейдж 67,000 MPH налазив на Сонце (зафіксовано вгорі), Сонце наприкінці засинає як на кадрі 0.

## Пакування
Назва: Why don't we shoot our trash into the Sun? (інші: What if we launched all our trash into the Sun? / Why can't a rocket just drop trash into the Sun?). Обкладинка: «55X HARDER THAN MARS». Опис і хештеги — videos/sun-trash/upload.md.

ElevenLabs flow: https://elevenlabs.io/app/flows/eANYKAHtqBgHKxRNOhGS
Remotion Studio: `cd cartoon-shorts/studio && npx remotion studio` (композиції SunTrash і SunTrashCover).

## Fallbacks / нотатки
- nasa.gov та illinois.edu не відкривались із сесії (мережа) — факти перевірено через пошукові витяги цих сторінок.
- Знайдено й виправлено конфлікт імпорту в Root.tsx (ST_DURATION уже використовувався), через нього композиція спершу мала 19.4 с.
