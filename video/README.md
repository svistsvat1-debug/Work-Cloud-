# Cartoon Shorts (Remotion, усе безкоштовно)

Вертикальні 2D cut-out Shorts: персонажі й ефекти намальовані кодом (SVG), голос — Kokoro (локально),
звуки — синтезовані numpy. Жодних платних сервісів чи підключень.

## Short #15 — Pisa Tower (`PisaTower`)

| Що | Де |
|---|---|
| Сценарій, джерела | `../docs/shorts/15-pisa-tower-pause.md` |
| Бит-шит | `../docs/shorts/15-pisa-tower-beats.md` |
| Анімація | `src/pisa/` (`Pisa.tsx` таймлайн, `Guy.tsx` пози, `Tower.tsx`, `World.tsx`, `Fx.tsx`) |
| Таймінги слів | `public/pisa/vo/words.json` → `src/pisa/timing.ts` |
| Звук | `public/pisa/vo/take1.wav`, `public/pisa/sfx/*.wav`, cue list `src/pisa/cues.ts` |
| Скрипти джерел | `images/pisa/` (`patch_kokoro.py`, `make_vo.py`, `sfx.py`) |

## Запуск

```bash
npm install
npx remotion studio src/index.ts          # Studio: http://localhost:3000 (композиція PisaTower)
npx remotion render src/index.ts PisaTower out/pisa-tower-4K.mp4 --scale=2 --image-format=png --crf=16 --pixel-format=yuv420p
```

`remotion.config.ts` вказує на локальний Chromium headless shell з хмарного контейнера.
На своєму комп'ютері видали рядок `setBrowserExecutable` — Remotion сам завантажить браузер.

## Перегенерувати голос / звуки

```bash
pip install kokoro-onnx soundfile onnx numpy scipy
python3 images/pisa/patch_kokoro.py <kokoro_dir>                     # один раз
python3 images/pisa/make_vo.py <kokoro_dir> public/pisa/vo           # голос am_michael + words.json
python3 images/pisa/sfx.py public/pisa/sfx                           # усі SFX
```

## Перевірка

```bash
node scripts/stills.mjs PisaTower out/cs 0.5 0 2.3 5.3 ...   # кадри на біти
python3 scripts/sheet.py out/cs out/contact-sheet.png 6      # контактний лист
python3 scripts/popscan.py out/preview-half.mp4              # pop scan превʼю
```
