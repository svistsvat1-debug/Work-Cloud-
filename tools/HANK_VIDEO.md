# Hank: збирання довгого відео

Вхід від власника: картинка-фон (кабіна, вигляд через лобове скло), озвучка `voice.mp3`, субтитри `voice.srt`.

## Кроки

1. **Фон-петля 10 с, ідеально безшовна.** Машина стоїть, падає лише сніг з крижаним дощем, центр притемнений під субтитри.
   ```
   python3 -I tools/hank_snowloop.py bg.jpg loop.mp4
   ```
   - Маска лобового скла задана прямокутником у координатах вихідної картинки 1376×768 (`P(62, 42)` — `P(1342, 646)`). Для іншої картинки підправ ці числа.
   - Із третім аргументом (тека) скрипт лише зберігає два кадри для перевірки.

2. **Паузи в озвучці** — для точнішої підсвітки слів:
   ```
   ffmpeg -i voice.mp3 -af silencedetect=noise=-38dB:d=0.09 -f null - 2>&1 | grep -E "silence_(start|end)" | sed -E 's/.*silence_(start|end): ([0-9.]+).*/\1 \2/' > silences.txt
   ```

3. **Субтитри ASS:**
   ```
   python3 -I tools/hank_srt2ass.py voice.srt silences.txt subs.ass
   ```
   - Великі білі (Instrument Sans Bold 78, по центру), поточне слово бурштинове `#FFC857`, м'яка темна «хмаринка» під текстом.
   - Пряма мова в лапках — курсивом, кожна фраза з'являється легким «поп-ін».
   - Шрифти: `.claude/skills/ui-styling/canvas-fonts/InstrumentSans-Bold.ttf` і `InstrumentSans-BoldItalic.ttf` скопіюй у теку `fonts/`.

4. **Звук до ~−14 LUFS:**
   ```
   ffmpeg -i voice.mp3 -af "acompressor=threshold=-30dB:ratio=3:attack=8:release=120:makeup=6,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000" voice_norm.wav
   ```

5. **Рендер.** DUR — тривалість озвучки. Фейд відео — від кінця останньої репліки, фейд звуку — останні ~0,35 с.
   ```
   ffmpeg -stream_loop -1 -i loop.mp4 -i voice_norm.wav \
     -filter_complex "[0:v]ass=subs.ass:fontsdir=fonts,fade=t=in:st=0:d=0.6,fade=t=out:st=<DUR-0.55>:d=0.5[v];[1:a]afade=t=out:st=<DUR-0.35>:d=0.35[a]" \
     -map "[v]" -map "[a]" -t <DUR> -c:v libx264 -preset slow -crf 27 -aq-mode 3 -pix_fmt yuv420p -r 30 \
     -c:a aac -b:a 160k -movflags +faststart out.mp4
   ```
   - 18 хв відео — це близько 15 хв рендеру на 4 ядрах і ~220 МБ (crf 27; дрібний сніг дорого стискається).

## Доставка власнику: ліміт 30 МБ на файл

Повна якість (crf 27, 30 fps) — це ~228 МБ на 18 хв, у чат вона не проходить. Тому для передачі робимо легку версію:

- **Фон:** рідший сніг і 24 кадри/с:
  ```
  LOOP_FPS=24 LOOP_DENSITY=0.6 LOOP_FAR=0.25 python3 -I tools/hank_snowloop.py bg.jpg loop_light.mp4
  ```
- **Рендер:** 1080p, два проходи, `-preset slower -b:v 160k -g 480 -bf 8 -refs 6 -r 24`, звук окремо: `-af "alimiter=limit=0.79:attack=1:release=50:level=false" -ar 48000 -ac 1 -c:a aac -b:a 64k`, потім `-c copy` у відео. На 48k AAC дає перевищення піку до +3,7 дБ; на 64k пік 0 дБ.
- **Результат:** ~28,6 МБ на 18 хв, текст і сніг чіткі (фон майже статичний).
