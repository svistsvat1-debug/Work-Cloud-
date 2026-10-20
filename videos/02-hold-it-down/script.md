# #02 — Owner's away. Someone's gotta hold it down.

- **Pillar:** Trend-jacking · **Day:** 2 · **Style:** Phone Native (lock screen) · **Length:** 20.7s · 9:16, 1080×1920, 30 fps
- **Trend:** "Someone's gotta hold it down" (перевірено 2026-10-04: формат «не всі можуть бути в LA / на події — хтось має тримати оборону»). У нас «хтось» — це система автоматизації.
- **Hook (0–2s):** "Owner's away. Someone's gotta hold it down."
- **Voice:** kokoro-v1.0:am_michael@1.22 (тимчасово, до ElevenLabs)

## Final script with timing

| Time (s) | Beat | Voiceover | Visual |
|---|---|---|---|
| 00.08–01.19 | HOOK | Owner's away. | Lock screen 9:04, Focus "Conference"; calendar notification "Marketing Summit" pops |
| 01.27–03.08 | HOOK | Someone's gotta hold it down. | Calendar notification swipes away, phone buzzes, Focus pill glows (punch zoom) |
| 03.34–05.00 | PROBLEM→FIX | New lead at 9PM? | Notification: Website · New lead "Need a quote this week" |
| 05.04–06.50 | PROBLEM→FIX | Replied in seconds. | Notification: Automation · Auto-reply sent ✓ |
| 06.66–07.84 | PROBLEM→FIX | Booking request? | Notification: Calendar · Booking request (zoom-out punch) |
| 07.88–08.82 | PROBLEM→FIX | Confirmed. | Same card flips to "Booking confirmed ✓ · reminder set" (glitch) |
| 08.98–10.71 | PROBLEM→FIX | No reply in two days? | Notification: Inbox · No reply from lead (whip) |
| 10.76–11.91 | PROBLEM→FIX | Follow-up sent. | Notification: Automation · Follow-up sent ✓ |
| 12.07–14.01 | VALUE | Every lead, in the CRM. | Pipeline app: cards drop into New / Booked / Following up (whip) |
| 14.25–15.81 | TURN | So who's holding it down? | Stack collapses: "5 things handled while you were away"; music breakdown |
| 16.01–17.30 | REVEAL | Not an employee. | Person icon struck through in yellow (glitch) |
| 17.39–18.30 | REVEAL | A system. | Website → Lead → CRM → Follow-up light up; yellow flash + music drop |
| 18.61–19.79 | CTA | Follow for more. | End card: yellow follow "+" with pulses |

Музика (синтезована): groove 124 BPM → брейкдаун на "So who's holding it down?" → riser → дроп на "A system."

## TikTok caption

Not everyone can be at the conference. Someone's gotta hold it down 🫡

**Hashtags:** #someonesgottaholditdown #smallbusiness #businessautomation #aiforbusiness

> Порада: це трендове відео. Найкраще публікувати `final-no-music.mp4` і додати в TikTok оригінальний трендовий звук «someone's gotta hold it down» тихо під голос.

## Чесність / примітки

- Усі сповіщення, лід, запит і час — демонстраційні; логотипів брендів немає (генеричні іконки).
- "5 things handled" рахує саме 5 сповіщень, показаних у відео. Іншої статистики немає.

## Quality check (2026-10-04)

| Перевірка | Результат |
|---|---|
| Хук у перші 2 с | ✅ "Owner's away" на 0.1–1.2 с + екран блокування з Focus "Conference" з кадру 0 |
| Субтитри | ✅ word-by-word з таймінгів моделі, у safe-колонці |
| Темп | ✅ 13 шотів + поява сповіщень кожні ~0.5–1.3 с |
| Голос vs музика / SFX | ✅ SFX додають ~0.8 LU; музика під голосом із ducking |
| CTA | ✅ "Follow for more" |
| Експорт | ✅ 1080×1920, 30 fps, H.264 High yuv420p, AAC 48 kHz, −14.5 LUFS, пік −1.4 dBFS, ~8.7 MB |

## Files

- `script.json`, `voice.wav` / `voice.mp3`, `timestamps.json`
- `final.mp4` (з музикою), `final-no-music.mp4` (під трендовий звук)
- Рендер: `tools/render.sh 02-hold-it-down v02-hold-it-down`
