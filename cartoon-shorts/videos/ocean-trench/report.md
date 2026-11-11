# Звіт — ocean-trench (Why don't we dump trash into the deepest ocean trench?)

## Фінальний текст (без змін, як затверджено)
1. Why don't we just dump our trash into the deepest ocean trench?
2. The seafloor there slides into the Earth, so it eats everything, right?
3. But it slides about as fast as your fingernails grow.
4. So one trash bag takes millions of years to go down.
5. Even then, some of what sinks ends up in magma,
6. which means a bit of your trash could come back up... through a volcano.

## Голос
ElevenLabs «Mark - Natural Conversations» (`UgBBYS2sOqTuMpoF3BR0`), модель eleven_v4, один дубль, 20,64 с.
Scribe v1 розпізнав усі 69 слів без помилок, тому другий дубль не знадобився. Голос починається на 0,1 с, ролик триває 21,9 с.

## Біти (час відео = час слова + 0,1 с)
| Час | Слова | Картинка | Гег | Звук |
|---|---|---|---|---|
| 0–1,9 | Why don't we just dump our trash… | hero_hold у човні, западина внизу | камера наїжджає; підстрибування на «trash» | — |
| 1,92–3,06 | …deepest ocean trench? | windup → throw_follow + пакет | замах, пакет летить дугою, плюх | whoosh, splash |
| 3,1–5,3 | The seafloor there slides into the Earth | пакет тоне на дно западини; загальний план | бульбашки; білі штрихи плит їдуть під землю | bubbles, grind |
| 5,8–6,4 | so it eats everything | западина розплющує очі | очі вискакують, язик облизує пакет | — |
| 6,42–7,26 | right? | smug_cu | самовдоволений палець угору (склейка) | — |
| 7,26–9,15 | But it slides about as fast… | западина з нудьгуючими очима | равлик обганяє плиту | — |
| 9,15–10,45 | …your fingernails grow | bored | герой нудьгує і розглядає нігті | — |
| 10,45–13,9 | So one trash bag takes millions of years… | sleep, загальний план | герой засинає, «Z»; лічильник 0 → 2 000 000 YEARS; пакет повзе плитою | snore, ticks, grind |
| 13,9–16,8 | Even then, some of what sinks ends up in magma | пакет на кінці плити | пакет тоне й плавиться, лишається світна крапля з вузликом | bubbles |
| 16,8–19,1 | which means a bit of your trash could come back up… | вулкан | крапля піднімається до вулкана; вулкан розплющує очі, «вдихає» | rumble (наростає) |
| 19,12 (пауза) | — | вулкан | вибух: корона лави, бризки, дим, тремтіння камери, очі «> <» | boom |
| 19,6–20,32 | through a volcano | alarm → deadpan_bag | пакет летить назад героєві й падає в руки | whoosh, catch |
| 20,3–21,9 | (кінець) | deadpan_bag | мертвий спокій; вулкан пускає самовдоволене кільце диму; петля до кадру 0 | — |

## Картинки (GPT Image 2.5 sunburst, 1K, 1 варіант, лише текстовий промпт, без референсів)
- **MEDIUM:** hero_hold, windup, throw_follow, smug_cu, pair_bored_sleep (3:2, розрізано на bored/sleep), pair_catch (3:2, розрізано на alarm/deadpan_bag), volcano, bg_cutaway (фон).
- **LOW:** bag, boat.
- Переробок не було: резерв не чіпали.

## Звуки (усі ElevenLabs Sound Effects v2)
- **Нові (9):** splash, bubbles, grind, snore, ticks, rumble, boom, whoosh, catch. Усі скопійовано в `sfx-library/` з описами в index.md.
- **Взяті з бібліотеки:** 0 (бібліотека була порожня).

## Кредити
| Що | Кредити |
|---|---|
| Голос | 363 |
| Scribe | 0 |
| Герой | 81 |
| Пакет із 9 картинок | 658 |
| 9 звуків | 49 (оцінка показувала 163, фактична ціна ~3,3 кредити за секунду) |
| **Разом** | **~1151 з 1500** |

Детально по кожному запуску: `studio/images/ocean-trench/credits.md`.

## Прохід покращення (один)
1. Кадр 0 був надто загальний (герой ~12 % висоти) → камера ближче, герой ~16 %, западина лишається в кадрі.
2. «But it slides… fingernails» було статичним планом → намальований у коді равлик повзе краєм западини й обганяє плиту.
3. «Z» над сплячим героєм були дрібні → збільшено; бризки лави тримаються біля вулкана й не летять у човен.
4. Скан стрибків знайшов два різкі старти «пружини» (крупний план і лічильник), обидва виправлено. Решта позначок — заплановані склейки та свопи поз.

## Fallback і рішення
- Рендер на CPU (headless Chromium, `gl=swangle`): відеокарти в контейнері немає.
- Шрифт для лічильника, «Z» і обкладинки — Inter Black (OFL, файл у `studio/public/fonts`).
- vidIQ закінчив кредити на етапі пошуку ідеї, тож попит перевіряв веб-пошуком.

## Перевірка фінального файлу
- `videos/ocean-trench/ocean-trench.mp4`: H.264, 1080×1920, 60 fps, 1314 кадрів = 21,9 с; звук AAC 21,89 с.
- Пік міксу −4,0 dBFS, кліпінгу немає. Remotion дав −8,6, тому на зведений звук додано +4,6 дБ без перекодування картинки.
- Скан стрибків на фінальному файлі: позначені лише заплановані склейки (6,43 / 7,27 / 9,17), свопи поз, вибух (19,13), пружина крупного плану, цифри лічильника і швидкий рух камери на 2,85.
- Останні 40 кадрів рухаються (середня різниця 0,58): заморожених кадрів немає.
