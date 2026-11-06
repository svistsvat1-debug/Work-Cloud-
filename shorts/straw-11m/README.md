# Short: Why an 11-meter straw can't let you drink through it

Статус: сценарій + промпти готові → чекаємо озвучку (ElevenLabs) і картинки (Google Flow) → далі крок 3 (Remotion).

## Ідея (1 речення)
Хлопець на балконі 4-го поверху п'є сік через 11-метрову трубочку — і не може, бо напій штовхає вгору тиск повітря, а його вистачає максимум на ~10 м води, навіть з ідеальним вакуумним насосом.

## Voiceover (68 слів)
Why can't anyone drink through an eleven-meter straw? It's not about weak lungs. A straw doesn't actually suck your drink up. When you sip, you lower the pressure in your mouth, and the air outside pushes the drink up. But that push has a limit. Air can only hold up about ten meters of water. So even a perfect vacuum pump would leave the water stuck short of your lips.

## Факти і джерела
- Трубочка працює, бо атмосферний тиск штовхає рідину вгору; з ідеальним вакуумом на рівні моря — максимум ≈10.3 м води:
  https://chem.libretexts.org/Courses/Pasadena_City_College/Chem_2A%3A_General_Organic_and_Biological_Chemistry_(Ku)/11%3A_Gases/11.01%3A_Extra-Long_Straws
- Історія: насоси Тоскани не піднімали воду вище ~10 м; Торрічеллі пояснив це вагою повітря (APS News):
  https://www.aps.org/publications/apsnews/201210/physicshistory.cfm
- Розрахунок межі всмоктувального підйому (~10 м): https://www.tec-science.com/?p=24452
- Нюанс (у текст не йде): реальний рот не робить ідеальний вакуум, тож практична межа ще нижча; при кімнатній температурі вода вгорі ще й закипає при низькому тиску, тож стовп трохи нижчий за 10.3 м. "Short of your lips" лишається правдою в будь-якому разі.

## Beat sheet (орієнтовно, точні часи — після озвучки)
| ~час | слова | на екрані | картинка | звук |
|---|---|---|---|---|
| 0.0 | Why can't anyone drink through an eleven-meter straw? | Кадр 0: високий будинок, на балконі 4-го поверху герой, червоно-біла трубочка тягнеться вниз до склянки соку на траві. Лінійка "11 m" збоку | building, P01, glass | — |
| 2.6 | It's not about weak lungs. | Камера наїжджає на героя, він робить величезний вдих, груди надуваються | P01 → P02 | whoosh, inhale |
| 4.3 | A straw doesn't actually suck your drink up. | Він п'є (P03), склянка внизу відкриває очі | P03, glass+face | slurp |
| 6.8 | When you sip, you lower the pressure in your mouth, | Х-рей трубочки: всередині повітря "розріджується" (рідкі точки) | P03 | soft hiss |
| 9.6 | and the air outside pushes the drink up. | Маленькі хмарки-повітря з обличчями тиснуть долонями на сік у склянці → сік піднімається по трубочці | glass | push/bloop |
| 11.6 | But that push has a limit. | Сік повзе вгору і зупиняється; хмарки пітніють | P04 (> <) | creak |
| 13.2 | Air can only hold up about ten meters of water. | Камера ковзає вниз-вгору по лінійці: сік стоїть на 10 м, вище — порожньо | P04 → P05 | tick |
| 16.0 | So even a perfect vacuum pump | Зверху падає вакуумний насос, герой качає | O02 → P06/P07 | thud, pump squeaks |
| 18.0 | would leave the water stuck short of your lips. | Сік тремтить на тій самій позначці, до губ ~1 м; герой дивиться в камеру (P08), крапля поту | P08 | small "plip" |
| ~21 | (кінець) | Камера відʼїжджає у кадр 0 → луп | building | — |

## Анімація (крок 3) — як зроблено
- Озвучка: ElevenLabs, Mark – Natural Conversations, v4 (`raw/take1.mp3`, 23.7 с), таймінги слів — faster-whisper (`words.json`).
- Картинки: Google Flow на #00FF00 → `key.py` (кеїнг + despill, 2x) → `cut/`; `prep.py` міряє голову/ноги, ділить P06 на персонажа+ручку і корпус насоса; у будинку перила замінені вікном з нижнього поверху (перила/балкон малюються кодом).
- Не використано: фото-P07 (реальна людина) і перегенерований P07 (ручка не з'єднана з насосом) — качання зроблено зі P06 (stretch + шток кодом). Склянка, лінійка, трубочка, хмарки-повітря, шланг, піт — кодом.
- Remotion: `anim/` (`npm run studio`), композиція `Straw`, 1080x1920, 60 fps, 25.1 с. Рендер: `node anim/render.mjs 2 out/straw-11m-4K.mp4 16`.
- SFX: процедурно (`sfx.py` → `anim/public/straw/sfx.wav`), пік міксу −2.5 dBFS.
- QA: `qa/contact.jpg` (кадри по бітах), pop scan (`popscan.py`) — усі стрибки = заплановані свопи/удари.
