# "Why You See Stars When You Stand Up" — крок 3: анімація і рендер

Результат: `video/out/why-you-see-stars-4K.mp4` (2160×3840, 60 fps, ~30,5 с). Сам MP4 у git не комітимо, бо він великий. Його можна перерендерити командою нижче.

## Де що лежить

| Що | Шлях |
|---|---|
| Remotion-проєкт | `video/` (композиція `WhyYouSeeStars`) |
| Код анімації | `video/src/stars/Stars.tsx` (сцени), `lib.tsx` (камера, хелпери), `cues.ts` (звуки) |
| Заміри спрайтів | `video/src/stars/sprites.json` (генерує `prep.py`) |
| Оригінали картинок з Flow | `video/images/why-you-see-stars/raw/` |
| Вирізання + заміри | `video/images/why-you-see-stars/prep.py` → `video/public/why-you-see-stars/img/` |
| Звукові ефекти | `video/images/why-you-see-stars/sfx.py` → `video/public/why-you-see-stars/sfx/` |
| Озвучка + таймінг слів | `video/public/why-you-see-stars/vo/take1.mp3`, `video/images/why-you-see-stars/words.json` |
| Контроль якості | `video/scripts/stills.mjs` (контактний аркуш), `sheet.py`, `popscan.py` |

## Як перезібрати

```bash
cd video && npm install
python3 images/why-you-see-stars/prep.py      # запускати з images/why-you-see-stars/
npx remotion studio src/index.ts              # Studio: http://localhost:3000
npx remotion render src/index.ts WhyYouSeeStars out/why-you-see-stars-4K-raw.mp4 \
  --scale=2 --concurrency=4 --gl=swangle --image-format=jpeg --jpeg-quality=95 --crf=16 --pixel-format=yuv420p
ffmpeg -i out/why-you-see-stars-4K-raw.mp4 -c:v copy -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 -c:a aac -b:a 256k out/why-you-see-stars-4K.mp4
```
На власному комп'ютері з відеокартою замість `--gl=swangle` можна ставити `--gl=angle`.

## Сцени (час = таймінг слів + 0,1 с)

| Час | Слова | Сцена |
|---|---|---|
| 0–2,6 | You just lost a fight with gravity. | Герой на дивані → стрибок уперед (поза змінюється на злеті) → хитається, зірочки по орбіті, краї кадру сіріють, камера наїжджає |
| 2,6–9,8 | Stand up fast… reaches your head. | Рентген-монітор: скан зверху вниз, глечик "0.5 L" спорожнюється, кров стікає в ноги, манометр з очима падає в червоне, наїзд на голову, мозок блідне, крапля поту |
| 9,8–12,5 | Your oxygen-hungry retina glitches first… | Око з виделкою й ножем ковтає бульбашки O₂ → glitch → спіраль, повіка, брови опускаються |
| 12,5–15,1 | sparks… then a grey tunnel. | POV вітальні: іскри, сірий тунель, кольори зникають |
| 15,1–18,85 | Fighter pilots… It's called a grey-out. | Винищувач у віражі з інверсійними слідами → наїзд у кабіну → пілот з G-обличчям, піт, "GREY-OUT" |
| 18,85–21,7 | Then pressure sensors… catch the drop. | Рентген шиї: два датчики, "пінг"-кола, "!", кров іде вгору |
| 21,7–23,85 | Your heart speeds up, vessels squeeze, | Серце з обличчям б'ється дедалі швидше, судина стискається, клітини крові прискорюються |
| 23,85–25,3 | and your vision comes back. | POV: тунель розкривається, кольори повертаються |
| 25,3–30,5 | How often…? Happens a lot, or you faint? Tell a doctor. | Герой по пояс, бульбашка "?" → бульбашка з червоним хрестом і "TELL A DOCTOR" |

## Що змінено відносно інструкції і чому

- **Картинки з Google Flow, а не Higgsfield.** Генерація на зеленому фоні, прозорість зроблена кодом (chroma key + despill). Картинки прийшли як JPEG 768×1376, тому збільшені ×2 (Lanczos + bilateral). Для 4K вони трохи м'якші, ніж були б 4K-оригінали.
- **#06 (телефон) не використано:** Flow намалював іншу людину (дівчину в зеленій футболці). Фінал зроблено через бульбашку з хрестом і текстом.
- **#15 (очманіле око) не використано:** Flow намалював інший персонаж (червону кулю). Очманілий стан ока зроблено кодом: спіраль, повіка, брови вирізані з #14 окремими спрайтами.
- **#02:** диван там інший, ніж #09, тому героя вирізано з #02 і посаджено на диван #09. Так після стрибка лишається той самий диван.
- **#04 (рентген):** силует не збігається з #01, тому рентген показано окремою сценою «монітор», а не панеллю поверх героя.
- **#01 hero** у ролику не знадобився.
- **Звуки** синтезовані кодом (`sfx.py`), бо бібліотеки звуків і Higgsfield немає. Гучність кожного ефекту перевірена так, щоб він був тихіший за голос.
- **Озвучка** — дубль користувача (ElevenLabs, Mark — Natural Conversations, eleven_v4). Таймінг слів — forced alignment через pocketsphinx.
- **Рендер на CPU** (`--gl=swangle`): у хмарному контейнері немає відеокарти.
- **Гучність:** голос з ElevenLabs має близько −24 LUFS, тому фінальний мікс нормалізовано до −14 LUFS (стандарт для Shorts).
- **Луп:** останній кадр (герой по пояс у вітальні) не збігається з першим (диван). Повного лупу немає.
