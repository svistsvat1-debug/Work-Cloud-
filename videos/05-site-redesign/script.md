# #05 — This website was losing clients. (Before → After)

- **Pillar:** Before → After · **Day:** 5 · **Style:** Retro Web → Dark Neon + аватар Bolt · **Length:** 24.4s · 9:16, 1080×1920, 30 fps
- **Темп:** спокійний (схвалений після тесту #04).
- **Hook (0–2.4s):** "This website was losing clients." на ретро-сайті з бігучим рядком.
- **Voice:** kokoro-v1.0:am_michael@1.14 (тимчасово, до ElevenLabs)

## Final script with timing

| Time (s) | Beat | Voiceover | Visual |
|---|---|---|---|
| 00.15–02.41 | HOOK | This website was losing clients. | Retro concept site (marquee "WELCOME TO OUR WEBSITE!!!", bevel links, visitor counter); Bolt in the corner |
| 02.71–04.57 | SETUP | Let's fix it, step by step. | Bolt close-up |
| 04.87–06.18 | FIX 1 | First, the headline. | Zoom on the headline, yellow outline |
| 06.30–07.96 | FIX 1 | Say what you do, and where. | Headline becomes "House cleaning in Springfield" + location |
| 08.26–09.54 | FIX 2 | Next, one button. | Zoom on the messy links, yellow outline |
| 09.64–12.18 | FIX 2 | One clear next step: Book a cleaning. | Links replaced by one yellow "Book a cleaning →" button |
| 12.48–13.46 | FIX 3 | Then, trust. | Bolt close-up (closer) |
| 13.56–15.93 | FIX 3 | Show reviews right next to the button. | Visitor counter becomes stars + reviews next to the button |
| 16.23–17.54 | FIX 4 | Finally, mobile. | Desktop site shrinks into a phone |
| 17.64–20.07 | FIX 4 | Your clients probably see it on their phone. | Thumb taps "Book a cleaning" on the phone |
| 20.37–21.75 | REVEAL | Before. And after. | Before/after slider sweeps from retro to new; music drop |
| 22.16–23.41 | CTA | Follow for more. | Bolt close-up with "+ Follow" |

## TikTok caption

4 fixes that turn an old website into one that books clients ✨

**Hashtags:** #websitedesign #beforeandafter #smallbusiness #webdesigntips

## Чесність / примітки

- "Sparkle Clean" — вигаданий бізнес, на сайті плашка «CONCEPT · fictional business». Телефон 555-0134 — вигаданий (діапазон 555 для фікції).
- Відгуки на «після» — сірі плейсхолдери без тексту й цифр.
- "Your clients probably see it on their phone" — порада, без статистики.

## Quality check (2026-10-04)

| Перевірка | Результат |
|---|---|
| Хук | ✅ ретро-сайт з кадру 0 |
| Ліпсинк | ✅ Bolt (з жовтим світінням на темному фоні) |
| Субтитри | ✅ у safe-колонці, не перекривають сайт |
| Темп | ✅ спокійний: 13 шотів, зуми прив'язані до лівого краю (текст не обрізається) |
| Звук | ✅ голос головний; музика 106 BPM, energy 0.6 |
| Експорт | ✅ 1080×1920, 30 fps, H.264 High yuv420p, AAC 48 kHz, −14.4 LUFS, пік −1.8 dBFS (ціль true peak тепер −2 dB), ~14 MB |

## Files

- `script.json`, `voice.wav` / `voice.mp3`, `timestamps.json`
- `final.mp4`, `final-no-music.mp4`
- Рендер: `tools/render.sh 05-site-redesign v05-site-redesign`
