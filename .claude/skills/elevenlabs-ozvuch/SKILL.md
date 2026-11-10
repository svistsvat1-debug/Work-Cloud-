---
name: elevenlabs-ozvuch
description: Озвучка тексту через ElevenLabs (акаунт користувача). Використовуй ТІЛЬКИ коли користувач явно пише "озвуч eleven labs", "озвуч елевен", "озвуч через ElevenLabs" або прямо називає ElevenLabs для озвучки. Для інших запитів на озвучку цей skill не використовуй.
---

# Озвучка через ElevenLabs

## Доступ (працює і в хмарі, і локально на ПК)
- **Хмарна сесія (claude.ai/code):** ключ збережений як network secret середовища для `api.elevenlabs.io`; проксі підставляє його сам, змінної середовища немає.
- **Локально на ПК:** ключ лежить у змінній середовища `ELEVENLABS_API_KEY` на комп'ютері користувача.
- Тому в кожному запиті використовуй такий header (у хмарі змінна порожня → проксі підставить справжній ключ):
  ```bash
  KEY="${ELEVENLABS_API_KEY:-proxy-injected}"
  curl -sS https://api.elevenlabs.io/v1/user/subscription -H "xi-api-key: $KEY"
  ```
- Ніколи не виводь значення ключа в чат чи логи.
- Якщо API відповідає 401/403 або "no rule allows host":
  - локально → скажи, що не задана або неправильна змінна `ELEVENLABS_API_KEY` (інструкція — `docs/ELEVENLABS_SETUP.md`);
  - у хмарі → ключ не підключений у цьому середовищі, запропонуй підключити заново.
- Акаунт: тариф Free, 10 000 кредитів на місяць (станом на 2026-11-10).

## Голоси акаунта
| Голос | voice_id | Мова |
|---|---|---|
| Volodymyr — Light and Captivating | `B31Kx7rXmNnYqp1QWHR2` | uk |
| Artem Klopotenko — Low, Rich and Deep | `h9NSQvWZaC4NFusYsxT9` | uk |
| Anton | `GVRiwBELe0czFUAJj0nX` | uk |
| Alena — Calm, Smooth and Natural | `BEprpS2vpgM32yNJpTXq` | uk |
| Declan Sage — Wise, Deliberate, Captivating | `kqVT88a5QfII1HNAEPTJ` | en |

Актуальний список: `curl -sS https://api.elevenlabs.io/v1/voices -H "xi-api-key: $KEY"`.

## Порядок роботи
1. Візьми текст від користувача. Якщо тексту немає — запитай.
2. Голос: якщо користувач не назвав — запитай один раз, запропонувавши українські голоси з таблиці. Default voice поки не обраний [MISSING].
3. Перевір залишок кредитів, якщо текст довгий (> 2000 символів):
   `curl -sS https://api.elevenlabs.io/v1/user/subscription -H "xi-api-key: $KEY"` → `character_limit - character_count`.
   Якщо не вистачає — скажи про це до генерації.
4. Згенеруй аудіо:
   ```bash
   mkdir -p docs/audio
   KEY="${ELEVENLABS_API_KEY:-proxy-injected}"
   curl -sS -X POST "https://api.elevenlabs.io/v1/text-to-speech/<VOICE_ID>?output_format=mp3_44100_128" \
     -H "xi-api-key: $KEY" -H "Content-Type: application/json" \
     -d @payload.json -o "docs/audio/<коротка-назва>.mp3"
   ```
   `payload.json` (пиши у scratchpad, через python/json, щоб не ламати лапки й кирилицю):
   ```json
   {"text": "...", "model_id": "eleven_multilingual_v2",
    "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}}
   ```
   - Модель за замовчуванням: `eleven_multilingual_v2` (стабільна, підтримує українську).
   - Для емоційнішої подачі можна `eleven_v3`, для швидкої/дешевшої — `eleven_flash_v2_5`.
5. Перевір, що файл — справді аудіо (`file docs/audio/...mp3`), а не JSON з помилкою. Якщо помилка — покажи її текст користувачу.
6. Надішли файл користувачу (SendUserFile) і коротко напиши: голос, модель, кількість символів.

## Правила
- Не озвучуй нічого без явного запиту — кожна генерація витрачає кредити.
- Не вигадуй текст замість користувача; якщо треба написати скрипт — спочатку покажи текст на погодження.
