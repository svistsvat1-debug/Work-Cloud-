# shorts-studio: вертикальні cut-out мультфільми (Remotion)

Повністю безкоштовний конвеєр: графіка малюється кодом (SVG у Remotion), голос генерує Kokoro (локально, без API), звукові ефекти синтезуються кодом.

## Перший Short: `BirdWire` (Why don't birds on power lines get zapped?)

| Що | Де |
|---|---|
| Композиція (1080x1920, 60 fps) | `src/birdwire/BirdWire.tsx`, реєстрація в `src/Root.tsx` |
| Персонажі й ефекти (пташка, орел, іскра Zip, стовп, дим, блискавки) | `src/birdwire/art.tsx` |
| Фон і 2.5D-шари (небо, хмари, пагорби, multiplane camera) | `src/birdwire/Scenery.tsx` |
| Таймінг бітів зі слів озвучки | `src/birdwire/timing.ts` + `src/birdwire/words.json` |
| Звук (озвучка + 29 cue + гул проводів) | `src/birdwire/Sound.tsx` |
| Озвучка | `public/birdwire/vo/take1.wav` |
| Звукові ефекти | `public/birdwire/sfx/*.wav` |
| Генерація голосу | `tools/voice.py` |
| Генерація SFX | `tools/sfx.py` |
| Контрольний аркуш | `tools/stills.mjs` + `tools/sheet.py` → `images/birdwire/qa/sheet.png` |
| Pop scan | `tools/popscan.py` |

## Запуск

```bash
npm install
pip install kokoro-onnx soundfile numpy scipy opencv-python-headless pillow
# моделі Kokoro (один раз, ~350 MB) у .models/
mkdir -p .models && cd .models
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
cd ..

SPEED=1.08 python3 -I tools/voice.py   # голос + words.json (біти підлаштуються самі)
python3 -I tools/sfx.py                # звукові ефекти
npm run studio                         # Remotion Studio: http://localhost:3000
```

Рендер 4K:

```bash
# на комп'ютері з відеокартою (видаліть setBrowserExecutable у remotion.config.ts):
npx remotion render src/index.ts BirdWire out/bird-wire-4K.mp4 --scale=2 --gl=angle --image-format=png --crf=16 --pixel-format=yuv420p
# у хмарній сесії без GPU:
npx remotion render src/index.ts BirdWire out/bird-wire-4K.mp4 --scale=2 --gl=swangle --image-format=png --crf=16 --pixel-format=yuv420p
```

Інший голос Kokoro: `VOICE=am_puck SPEED=1.05 python3 -I tools/voice.py` (чоловічі: am_michael, am_puck, am_fenrir, am_eric, am_liam, am_adam, am_echo, am_onyx).
Після зміни тексту або голосу всі біти перераховуються автоматично з `words.json`.
