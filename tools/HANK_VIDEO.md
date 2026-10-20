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

## Варіант: фон із кліпу Gemini + субтитри без виділення слів (з еп. 7)

Рішення власника: жовтої підсвітки слова не робимо, бо вона часто не потрапляє в таймінг. Кожна фраза біла і з'являється/зникає цілком.

1. **Петля з кліпу Gemini** (8–10 с, 720p). Початок і кінець у Gemini не збігаються, тому:
   - береш частину, де рух уже стабільний (з 2-ї секунди);
   - кінець плавно переводиш у початок за 1,5 с;
   - заодно масштабуєш до 1080p і накладаєш притемнення центру (`band.png`, 30 %).
   ```
   ffmpeg -i gem.mp4 -loop 1 -i band.png -filter_complex "[0:v]scale=1920:1080:flags=lanczos,fps=24,format=yuv420p,split=3[s1][s2][s3];[s1]trim=start=3.5:end=8.5,setpts=PTS-STARTPTS[mid];[s2]trim=start=8.5:end=10.0,setpts=PTS-STARTPTS[tail];[s3]trim=start=2.0:end=3.5,setpts=PTS-STARTPTS[head];[tail][head]blend=all_expr='A*(1-T/1.5)+B*(T/1.5)'[x];[mid][x]concat=n=2:v=1:a=0[l];[l][1:v]overlay=0:0:shortest=1,format=yuv420p[out]" -map "[out]" -an -c:v libx264 -preset slow -crf 14 -r 24 loop.mp4
   ```
   - Перевірка: різниця кадрів на стику має бути не більша за найбільший природний крок усередині петлі.
2. **Субтитри:**
   ```
   python3 -I tools/hank_srt2ass.py voice.srt silences.txt subs.ass fade
   ```
   Фраза з'являється з легкого розфокусу, трохи знизу, літери «збираються»; на виході розчиняється в розмиття. Пряма мова курсивом.
3. **Рендер для чату (≤30 МБ, ~19 хв):** 2 проходи, `-b:v 140k`, звук 64k mono з лімітером, потім `-c copy`.

## З еп. 8: точна петля і ще більші субтитри

1. **Петля кадр у кадр** замість `blend` у ffmpeg (там стик виходив гіршим):
   ```
   python3 -I tools/hank_gemloop.py gem.mp4 loop.mp4 14 180 36 310
   ```
   - Аргументи: A, B, X у кадрах і висота центру субтитрів.
   - Точки A+X і B бери там, де природний крок між кадрами кліпу малий.
   - Перевірка: крок на стику не більший за найбільший природний (еп. 8: 0,43 при 0,44).
   - Притемнення під субтитрами скрипт робить сам: смуга по висоті центру тексту.
2. **Великі субтитри** (рішення власника з еп. 8: більші, ніж 78):
   ```
   HANK_FS=104 HANK_Y=310 HANK_WRAP=1560 python3 -I tools/hank_srt2ass.py voice.srt silences.txt subs.ass fade
   ```
   - `HANK_FS`: розмір шрифту. `HANK_Y`: центр тексту по висоті; кладемо його туди, де фон темний (еп. 8 — небо над дорогою).
   - `HANK_WRAP`: найбільша ширина рядка в пікселях. На екрані максимум 2 рядки, довгі фрази діляться в часі за паузами.
   - З еп. 11 (рішення власника): субтитри **рівно по центру** (`HANK_Y=540`), шрифт на вибір через `HANK_FONT_NAME` + `HANK_FONTFILE`. Еп. 11: Lora Bold 110, `HANK_WRAP=1500`; файли Lora-Bold.ttf і Lora-BoldItalic.ttf з `.claude/skills/ui-styling/canvas-fonts/` скопіюй у `fonts/`. Фон для Gemini тоді просимо з темним порожнім центром, а смугу притемнення робимо по центру (`hank_gemloop.py … 540`).
3. **Перегляд кадру з субтитрами** без довгого декодування: `-vf "setpts=PTS+<сек>/TB,ass=subs.ass:fontsdir=fonts" -frames:v 1`.
4. **Звук:** на 64k AAC лімітер 0.79 дав пік +0,1 дБ, тому ставимо `limit=0.7`.
