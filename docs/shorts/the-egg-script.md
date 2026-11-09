# Shorts: "The Egg": сценарій + промпт для ElevenLabs v4

Референс: https://youtu.be/h6fcK_fRYaI — "The Egg - A Short Story", канал Kurzgesagt – In a Nutshell.
Це анімована адаптація оповідання Andy Weir "The Egg" (2009).
Статус: крок 1 (сценарій + озвучка) готовий. Крок 2 (відео): план, beat sheet і промпти для картинок — у `docs/shorts/the-egg-video-plan.md`.

## Ідея (1 речення)

Бог зустрічає тебе через 10 секунд після смерті й по одному відкриває секрети: ти був кожною людиною, яка будь-коли жила, а весь Всесвіт — це яйце, з якого ти ще не вилупився.

## Що взято з формату оригіналу

- Оповідач — Бог, говорить до глядача на "ти" (друга особа).
- Сухий гумор Бога і короткі репліки. Питання звучать ніби від глядача ("Heaven? Hell?", "Why?").
- Одкровення йдуть сходинками: смерть → ні раю, ні пекла → ти повертаєшся → ти — усі люди → навіщо? → Всесвіт — яйце.
- Головне одкровення стоїть в останньому реченні.
- Текст написаний з нуля: без цитат з оповідання і з відео Kurzgesagt.

## Структура утримання (beat map)

Таймінги орієнтовні, точні будуть після генерації озвучки.

| Час | Репліка | Що робить для утримання |
|---|---|---|
| 0–2 с | You died ten seconds ago. | Хук: шок + premise у першому кадрі |
| 2–3,5 с | Hi. I'm God. | Злам шаблону (гумор): ясно, хто говорить |
| 3,5–6 с | Heaven? Hell? Nope. You're going back. | "Очевидна відповідь неправильна" → петля "куди назад?" |
| 6–9 с | Over 100 billion people have ever lived. | Мікропетля: "навіщо він називає це число?" |
| 9–12 с | Every single one of them... was you. | Твіст №1, закриває мікропетлю |
| 12–14,5 с | Every killer. And every victim. | Емоційний удар |
| 14,5–15,5 с | Why? | Головна петля: питання, яке в голові в глядача |
| 15,5–17,5 с | Because you haven't been born yet. | Парадокс ("я ж щойно помер?") — свайпати не хочеться |
| 17,5–21 с | When you've been everyone... you'll hatch. As a god. | Твіст №2 + нова петля "вилупишся — з чого?" |
| 21–25 с | Everything you've ever seen... is just the inside of your egg. | РОЗВ'ЯЗКА на останньому слові "egg" |
| 25–26,5 с | Subscribe to see more. | CTA ~1,5 с одразу після розв'язки → петля в кадр 0 |

Петля: розв'язка → CTA → відео стартує з "You died ten seconds ago". За сюжетом це новий цикл життя, тому повтор виглядає природно.

## Озвучка: чистий текст (для субтитрів)

```
You died ten seconds ago. Hi. I'm God.
Heaven? Hell? Nope. You're going back.
Over 100 billion people have ever lived. Every single one of them... was you.
Every killer. And every victim.
Why? Because you haven't been born yet.
When you've been everyone... you'll hatch. As a god.
Everything you've ever seen... is just the inside of your egg.
Subscribe to see more.
```

Слів: 64 (60 — історія, 4 — CTA). Орієнтовна тривалість: ~25–28 с.

## Промпт для ElevenLabs v4 (copy-paste)

```
[warm, calm, quietly amused, like an old friend sharing a secret] You died ten seconds ago. [soft chuckle] Hi. I'm God.
[playful] Heaven? Hell? [short pause] Nope. You're going back.
[casual] Over 100 billion people have ever lived. [hushed] Every single one of them... was YOU.
[serious, slowly] Every killer. [short pause] And every victim.
[curious] Why? [warmly] Because you haven't been born yet.
[gradually building wonder] When you've been everyone... you'll hatch. [short pause] As a god.
[whispers, in awe] Everything you've ever seen... is just the inside of your egg.
[warm, casual] Subscribe to see more.
```

Налаштування:
- Model: **Eleven v4** (`eleven_v4`). Не Turbo: Turbo зроблена для real-time агентів.
- Voice: **K. V. Hagen – Deep Warm Natural Narrator** (природний, розмовний, глибокий). Альтернатива: **Henry – Deep, Professional, and Soothing** (вже є у твоєму workspace).
- Stability: почни з дефолту 0.5. Якщо теги звучать слабко — 0.35–0.4. Якщо голос "плаває" або є артефакти — 0.6.
- Speed і SSML у v4 немає. Темп задається тегами `[slowly]`, `[short pause]` і трикрапками.
- Згенеруй 3–4 дублі й вибери найкращий. Ціль: 24–28 с.
- Якщо дубль довший за 30 с — спершу прибери `[short pause]`, потім `slowly` з `[serious, slowly]`.
- Якщо шепіт у фіналі звучить затихо — заміни `[whispers, in awe]` на `[softly, in awe]`.
- Капс тільки в `YOU`, у субтитрах пиши звичайним регістром.

## Джерела

- Оригінал оповідання, Andy Weir, "The Egg" (Galactanet, 2009): https://galactanet.com/oneoff/theegg_mod.html
- Довідка про оповідання (дата публікації 15.08.2009, адаптації): https://en.wikipedia.org/wiki/The_Egg_(Weir_short_story)
- Референс-відео Kurzgesagt: https://www.youtube.com/watch?v=h6fcK_fRYaI
- Адаптація Kurzgesagt зроблена зі згоди Weir (вторинне джерело): https://www.slashfilm.com/2151111/andy-weir-adaptation-the-egg-streaming-youtube-free/
- Факт "100+ млрд людей": PRB, Kaneda & Haub, листопад 2022 — "About 117 billion members of our species have ever been born on Earth": https://www.prb.org/articles/how-many-people-have-ever-lived-on-earth/
- ElevenLabs v4 (модель, теги, налаштування): https://elevenlabs.io/docs/overview/capabilities/text-to-speech/eleven-v4
- ElevenLabs, список audio tags і поради щодо розміщення: https://elevenlabs.io/blog/elevenlabs-audio-tags-list

## Примітки

- Єдиний реальний факт в озвучці — "over 100 billion people have ever lived". PRB називає ~117 млрд (2022). Самі автори пишуть, що це оцінка: даних немає для понад 99% історії людства. Тому в тексті "over 100 billion", а не точне число.
- Решта — сюжет художнього оповідання. У назві й описі подаємо це як історію, а не як факт.
- В опис обов'язково: `Inspired by the short story "The Egg" by Andy Weir (2009).` Ідея сюжету належить автору, текст сценарію наш. Kurzgesagt робили адаптацію зі згоди автора. Якщо плануєш серію таких адаптацій на монетизованому каналі, варто це врахувати (це не юридична порада).
- Свідомо прибрані імена з оригіналу (Hitler, Lincoln, Jesus): у Shorts це ризик обмежень і флейму, а "Every killer. And every victim." дає той самий удар.

## Стандарт для наступних Shorts (з побажань до цього завдання)

- 20–30 с, 50–70 слів, англійська.
- Розв'язка — в останньому реченні перед CTA (останні 2–4 с). До неї — ланцюжок відкритих петель, кожне речення відповідає на попереднє і відкриває нове питання.
- CTA в кінці: `Subscribe to see more.` (~1,5 с, одразу після розв'язки, без довгої паузи).
- Озвучка: ElevenLabs v4 з audio tags. Тег міняємо там, де міняється подача, а не на кожному реченні.
- Останній кадр петлею переходить у перший.
