# Short: "You Can't Lift This Finger (Check Yours)"

Вертикальний cartoon Short (1080x1920 comp, 60 fps, рендер 2160x3840) у Remotion.
Сценарій, озвучка й промпти — `docs/shorts/ring-finger-check-yours.md`.

## Як це зроблено
- **Рука** — 3D-модель у коді (`src/hand.ts`): капсули + полігон долоні, одна злита чорна обводка,
  м'яка сіра тінь, тіні на столі. Пальці згинаються/піднімаються плавно (без підміни картинок).
  Картинки з Google Flow не використані: 4 з 6 вийшли фото, а не мультяшним стилем.
- **Камера** — 3D (`src/draw.tsx`): фронтальний вид для трюку, вид зверху для «рентгену».
- **Рентген** (`src/overlays.tsx`): спільний м'яз (extensor digitorum) → 4 сухожилля,
  перемички (juncturae tendinum), «повідок», окремі м'язи вказівного й мізинця, у безіменного — немає.
- **Таймінг** — `src/timeline.json` (з `audio/timeline.py`): фрази виміряні по паузах в озвучці,
  після "ring finger" вставлена пауза 2 с для глядача.
- **Звук** — `audio/mix.py`: синтезовані SFX під голосом → `public/mix.wav`.

## Команди
```bash
npm i
python3 audio/timeline.py && python3 audio/mix.py   # таймінг + мікс
npx remotion studio src/index.ts                    # Remotion Studio
npx remotion render src/index.ts RingFinger out/ring-finger-4K.mp4 --scale=2 --crf=16 --pixel-format=yuv420p
# гучність для Shorts (~-15 LUFS, пік -1.5 dBTP) і підміна доріжки без перерендеру картинки:
ffmpeg -i public/mix.wav -af loudnorm=I=-14:TP=-1.5:LRA=9 -ar 48000 audio/mix_loud.wav
ffmpeg -i out/ring-finger-4K.mp4 -i audio/mix_loud.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest out/ring-finger-4K-final.mp4
./qa/stills.sh "0 7.6 14.7 21 27.9 33.9" 0.3      # контакт-шит кадрів -> qa/sheet.png
python3 qa/popscan.py out/preview.mp4               # пошук стрибків між кадрами
```
`remotion.config.ts` вказує на Chromium цієї хмарної сесії — на своєму комп'ютері видали рядок `setBrowserExecutable`.
