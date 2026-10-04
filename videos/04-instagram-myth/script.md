# #04 — "I don't need a website. I have Instagram." (ТЕСТ: аватар + спокійніший темп)

- **Pillar:** Myths & mistakes · **Day:** 4 · **Style:** Clean Light + аватар **Bolt** · **Length:** 25.3s · 9:16, 1080×1920, 30 fps
- **Тест (за рішенням власника):** перше відео з аватаром і трохи менш динамічний монтаж: шоти ~1.5–2.5 с, м'які переходи (fade/slide) замість glitch, слабші punch-зуми, менше SFX, музика 104 BPM з тихшими барабанами.
- **Аватар:** Bolt (робот із LED-обличчям). Обрав Claude, бо власник делегував вибір; можна замінити на Sunny/Alex одним рядком.
- **Hook (0–2.9s):** "I don't need a website. I have Instagram."
- **Voice:** kokoro-v1.0:am_michael@1.14 (тимчасово, до ElevenLabs)

## Final script with timing

| Time (s) | Beat | Voiceover | Visual |
|---|---|---|---|
| 00.15–02.91 | HOOK (MYTH) | "I don't need a website. I have Instagram." | MYTH card: the quote appears word by word, "Instagram." gets a yellow marker; Bolt in the corner |
| 03.21–04.34 | HOOK | Sound familiar? | Bolt close-up, lip-synced |
| 04.54–05.73 | TURN | Here's the catch. | Jump-cut closer on Bolt, nod + brow raise on "catch" |
| 06.03–08.46 | FACT 1 | On Instagram, you rent your audience. | FACT 1: generic social profile, "RENTED" tag drops on "rent" |
| 08.62–11.31 | FACT 2 | The algorithm decides who sees your posts. | FACT 2: post + 30 follower dots; a scan line leaves only a few lit, eyes on "sees" |
| 11.61–13.79 | FACT 3 | Your website is the place you own. | FACT 3: yourbusiness.com, "YOURS" tag on "own" |
| 13.96–17.52 | FACT 3 | It works 24/7, even when you don't post. | 24/7 clock spinning → night: "New booking ✓ 2:14 AM" on "don't post" |
| 17.82–20.23 | PAYOFF | So use Instagram to get attention. | Flow: Social → Attention light up |
| 20.32–22.73 | PAYOFF | And your website to turn it into clients. | Flow continues: Website → Clients ✓ |
| 23.04–24.30 | CTA | Follow for more. | Bolt close-up with a "+ Follow" pill |

## TikTok caption

"I have Instagram, I don't need a website." Here's the catch 👇

**Hashtags:** #smallbusiness #instagramtips #websitetips #entrepreneur

## Чесність / примітки

- Профіль, сайт, бронювання о 2:14 — демо. Логотипа Instagram у кадрі немає (генеричний профіль).
- Точки «підписників» — ілюстрація принципу, не статистика охоплення.

## Quality check (2026-10-04)

| Перевірка | Результат |
|---|---|
| Хук | ✅ MYTH-картка з кадру 0, цитата з'являється в темпі голосу |
| Ліпсинк | ✅ рот по фонемах озвучки, моргання, брови/кивок на акцентах |
| Субтитри | ✅ тема для світлого фону: чорні слова, акценти на жовтому маркері |
| Темп | ✅ спокійніший: 13 шотів, склейки без «блимання» на продовженнях |
| Голос vs музика / SFX | ✅ SFX майже не додають гучності; музика під голосом |
| CTA | ✅ "Follow for more" |
| Експорт | ✅ 1080×1920, 30 fps, H.264 High yuv420p, AAC 48 kHz, −14.3 LUFS, пік −1.3 dBFS, ~6.8 MB |

## Files

- `script.json`, `voice.wav` / `voice.mp3`, `timestamps.json` (words + phones)
- `final.mp4`, `final-no-music.mp4`
- Рендер: `tools/render.sh 04-instagram-myth v04-instagram-myth`
