# Whiteboard-відео «Як імунітет бореться з бактеріями»

Готові файли — у `out/`:
- `immune_system_whiteboard.mp4` — 1920×1080, ~2:07, озвучка українською, без субтитрів і логотипів;
- `immune_system_whiteboard_subs.mp4` — те саме з вшитими субтитрами;
- `subtitles_uk.srt` — субтитри окремим файлом (для YouTube / Reels).

Сценарій і розкадровка: `docs/videos/immune-system-whiteboard.md`.

## Як це зроблено
- `script.json` — текст озвучки по сценах.
- `gen_audio.py` + `tts.py` — генерує озвучку (Edge TTS, `uk-UA-OstapNeural`) і таймінги речень → `timing.json`, `build/timing.js`.
- `build/engine.js` — рушій анімації «на дошці»: малювання ліній маркером, заливка штрихуванням, рукописний текст, рухи.
- `build/scenes.js` — 12 «дощок» (сцен), синхронізованих зі словами озвучки.
- `build/render.js` — рендер кадрів через Playwright/Chromium → ffmpeg (`node render.js 4 ../out`).
- `post.py` — зводить голос і робить субтитри (`out/voice.m4a`, `out/subtitles_uk.srt`, `out/subs.ass`).

Склейка:
```bash
cd out && printf "file 'part0.mp4'\nfile 'part1.mp4'\nfile 'part2.mp4'\nfile 'part3.mp4'\n" > list.txt
ffmpeg -f concat -safe 0 -i list.txt -c copy video.mp4
ffmpeg -i video.mp4 -i voice.m4a -map 0:v -map 1:a -c copy -shortest immune_system_whiteboard.mp4
ffmpeg -i immune_system_whiteboard.mp4 -vf ass=subs.ass -c:a copy immune_system_whiteboard_subs.mp4
```
Шрифт Caveat — SIL Open Font License.
