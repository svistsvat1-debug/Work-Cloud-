# Shorts video (Remotion) — повністю безкоштовний пайплайн

Перший ролик: **Hummingbird** (колібрі переживає холодну ніч, торпор), 26,5 с, 1080×1920 @ 60 fps → 4K 2160×3840.

Нічого платного і жодних підключень:
- голос: **Kokoro-82M** локально (ONNX, `kokoro-onnx`), голос `am_michael`;
- картинки: персонажі й реквізит **намальовані кодом** (SVG у `src/hummingbird/art.tsx`) замість Higgsfield;
- звуки: **синтезовані кодом** (`tools/sfx.py`);
- анімація й рендер: Remotion 4 (безкоштовний для фізосіб і компаній до 3 людей).

## Запуск

```bash
cd video
npm install
npx remotion studio              # Studio: http://localhost:3000 → композиція "Hummingbird"
npx remotion render src/index.ts Hummingbird out/hummingbird-4K.mp4 --scale=2 --crf=16 --pixel-format=yuv420p
```

> `remotion.config.ts` вказує на Chromium хмарного контейнера (`setBrowserExecutable`). На своєму комп'ютері видаліть цей рядок, і Remotion сам завантажить браузер.

Гучність під Shorts (−14 LUFS), відео копіюється без перекодування:
```bash
ffmpeg -i out/hummingbird-4K.mp4 -c:v copy -af loudnorm=I=-14:TP=-1.5:LRA=11 -c:a aac -b:a 256k out/hummingbird-4K-final.mp4
```

## Перегенерувати голос і звуки (Python 3.10+)

```bash
python -m venv .venv && .venv/bin/pip install kokoro-onnx soundfile numpy scipy pillow opencv-python-headless
# модель (безкоштовно, з GitHub): kokoro-v1.0.onnx + voices-v1.0.bin
#   https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0
.venv/bin/python tools/tts.py MODEL_DIR public/hummingbird/vo am_michael   # голос + words.json
.venv/bin/python tools/align.py MODEL_DIR public/hummingbird/vo/words.json # уточнення таймінгу слів
.venv/bin/python tools/sfx.py public/hummingbird/sfx 26.7                  # усі SFX
```
Інші чоловічі голоси Kokoro: `am_puck`, `am_fenrir`, `am_eric`, `am_liam`. Усі бити рахуються від слів у `words.json` (`src/hummingbird/timing.ts`), тож після зміни голосу анімація підлаштується сама.

## QA

```bash
node tools/stills.mjs out/qa/s 0 2.6 8.35 11.6 15.6 20.5 23.85 last   # кадри на битах
python tools/sheet.py out/qa/s out/qa/sheet.png                         # contact sheet
npx remotion render src/index.ts Hummingbird out/qa/preview.mp4 --scale=0.25
python tools/popscan.py out/qa/preview.mp4                               # пошук різких стрибків
```

## Beat sheet (час = секунди відео)

| Час | Слова | На екрані | Гег | Звук |
|---|---|---|---|---|
| 0.0 | How does a hummingbird survive… | Колібрі зависає в центрі, ніч, Анди, місяць, квітка | Місяць дрімає | цвіркуни, гул крил |
| 1.8 | …a cold night… | Сніг, лінії вітру | Колібрі тремтить | вітер |
| 2.3–3.2 | …without food? | Колібрі пірнає дзьобом у квітку | Квітка мружиться й закривається в бутон | whoosh, pop, fwip |
| 3.8 | It burns energy so fast… | Батарейка з обличчям над колібрі, швидко сідає | Батарейка нервує | pop, «power-down» |
| 5.4–8.2 | …staying warm until morning could use up its fat. | Шкала «місяць → сонце»: заряд закінчується на півдорозі | Батарейка потіє, колібрі теж | drip, bonk |
| 8.8–10.1 | So it does the opposite. | Термостат | Хитра морда, клац дзьобом: тепло → холод | click |
| 10.5–11.4 | It goes still… | Сідає на гілку → настовбурчується, дзьоб у небо, очі закриті | squash-заміна поз | tap, poof |
| 12.3 | …go cold. | Синіє, іній, сніг сильніший | — | freeze, вітер |
| 13.6–17.4 | Its heartbeat drops… 1,200… 40 | Серце з обличчям + табличка 1,200 → 40 | Серце засинає, нічний ковпак, позіхає | удари серця сповільнюються, тріскачка |
| 17.7–21.6 | One black metaltail cooled to 3.3 °C | Термометр 40 °C → 3.3 °C | Сніжна шапка, лід на дзьобі, бурульки | slide-whistle, тріск льоду, цокання зубів |
| 21.9–23.1 | That's fridge cold. | Холодильник падає на гілку, відчиняється | Гілка прогинається, холодильник вражений | fall, гуп, двері, шипіння |
| 23.3–25.2 | No bird has been measured colder. | Медаль падає на колібрі | Місяць прокидається вражений, іскри | ding, sparkle |
| 25.2–26.5 | — | Розморожується й злітає в позицію кадру 0 | Луп у перший кадр | crack, poof, whoosh |
