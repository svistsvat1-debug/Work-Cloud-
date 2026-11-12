# A1. Діагностика конкурентів — 2026-11-12

Режим: **TOPIC = "find an idea yourself"**, COMPETITOR = none, NOTES = none (поля в промпті були не заповнені).

## Як збирались дані (тільки безкоштовно)

- `yt-dlp` пошук (`ytsearch` + фільтр YouTube "this year, sort by views") — **працює**: ~1 100 відео з WWII-ніші, 40 + 20 + 8 запитів.
- `yt-dlp --flat-playlist` по каналах — **працює**: підписники, перегляди і тривалість усіх відео каналу → медіана, outlier score.
- Офіційний RSS каналу (`youtube.com/feeds/videos.xml`) — **працює**: точні дати й повні описи 15 останніх відео.
- Мініатюри з `i.ytimg.com` — **працює**, зібрані contact sheets (у scratchpad, не в git — це чужі зображення).
- ⚠️ Сторінки відео (`yt-dlp -j <URL>`, субтитри) — **заблоковано**: YouTube вимагає "Sign in to confirm you're not a bot". Обходити bot-check я не став. Тому **транскрипт конкурента = [MISSING]**. Структуру відновлено з офіційного опису відео (RSS). Якщо хочеш точний розбір хука по секундах — встав сюди транскрипт `z4DB1tppFU8` (YouTube → "Show transcript" → скопіювати).
- Платні інструменти (vidIQ, ElevenLabs transcription) — не використовувались.

## Головний конкурент: Ink Story

**Відео:** "What Did WW2 Soldiers Actually Do All Day?" — https://www.youtube.com/watch?v=z4DB1tppFU8

| Метрика | Значення |
|---|---|
| Перегляди | 927 996 (RSS, 2026-11-12) |
| Дата | 2026-10-26 (17 днів тому) |
| Тривалість | 17:47 |
| Канал | Ink Story (@Ink-Story-2) |
| Підписники | 9 850 |
| Медіана каналу (30 довгих відео) | 28 000 |
| **OUTLIER SCORE** | **33.1x** (перегляди / медіана); 94x до кількості підписників |

### PROOF — чи свіжий успіх?
Так. Усі 30 відео каналу — 2026 рік; топ-3 відео вийшли за останні 7 тижнів (927K — 26.10, 453K — 23.09, 378K — 29.09). Це **живий тренд**, не старий успіх. Сиквел "...All Night?" (02.11) — 55K (2x), тобто формула ще працює, але сам канал її вже "доїдає".

### TOP-10 каналу (за переглядами)
| # | Перегляди | Назва |
|---|---|---|
| 1 | 927 000 | What Did WW2 Soldiers Actually Do All Day? |
| 2 | 453 000 | Your Life as Every Rank in the U.S. Army in WW2 |
| 3 | 378 000 | Your Life as Every Rank in the German Army in WW2 |
| 4 | 232 000 | POV: You Are a German Soldier in World War 2 |
| 5 | 117 000 | Your Life at Every Level of the British Empire |
| 6 | 104 000 | The Brutal Reality of Enlisting the Day After 9/11 |
| 7 | 97 000 | POV: You're a Japanese Soldier in WW2 |
| 8 | 71 000 | Your Life as Every Rank in the Soviet Red Army in WW2 |
| 9 | 65 000 | POV: You Are an Italian Soldier in WW2 |
| 10 | 62 000 | POV: You Are an American Soldier in World War 2 |

### THUMBNAIL PATTERN (contact sheet top-10)
- **10/10**: велике біле "мем-обличчя" мультяшного солдата в формі конкретної армії — головний об'єкт, ліворуч або по центру.
- **Емоція на максимумі**: страх і піт (7/10) або іронічний спокій (топ-відео: солдат дрімає під яблунею).
- **Контраст** (6/10): нещасний рядовий у багнюці vs самовдоволений генерал у палаці ("Every Rank").
- **Текст** лише на 3/10: 2–4 слова, жовті капси з чорною обводкою, і текст **ламає очікування**: "NO FIGHTING", "WRONG WAR?", "YOUR EMPIRE IS FALLING".
- **Click tactic:** "впізнаваний everyman + екстремальна емоція + перевернуте очікування". Топ-мініатюра: війна = бої → а тут "NO FIGHTING" і сонячний сад.
- Стиль виглядає як AI-ілюстрації. Наш стиль (кодовий маркерний whiteboard) від нього чітко відрізняється.

### TITLE PATTERN
- "POV: You Are a [nation] Soldier in [war]" — 14/30
- "Your Life as Every Rank in [army]" — 5/30
- "What Did [group] Actually Do All [Day/Night]?" — 3/30
- Справжня підніша: **буденне життя звичайного солдата, від другої особи ("you")**, переважно WW2.

### LENGTH PATTERN
15:33–21:07, типово 17–19 хв.

### FORMULA CARD
> **Second-person animated "everyday reality" explainer about the ORDINARY soldier of one army/war; thumbnail = white-faced cartoon everyman soldier with an extreme emotion + a contrast (rank vs rank, war vs calm) + 0–3 words of yellow caps text that flips the expectation; title shape = "POV: You Are a [X] Soldier in [war]" / "Your Life as Every Rank in [army]" / "What Did [group] Actually Do All Day?"; length = 16–20 min.**

### PACKAGING топ-відео
- Назва: питання + слово "Actually" (обіцянка "правди, яку не показують у кіно").
- Мініатюра: 3 об'єкти (солдат, що дрімає; дерево з яблуками; дрібні солдати на фоні + дим). Текст "NO FIGHTING".
- Мініатюра НЕ повторює назву, а дає відповідь-провокацію. Сильно, але є мінус (див. weak spots).

### STRUCTURE (відновлено з офіційного опису; транскрипт [MISSING])
- **Hook:** "In July 1944, an American infantryman in Normandy could spend an entire day on the front lines without firing a single bullet. But that didn't mean he was safe." → далі "You wake up before sunrise in a muddy foxhole..."
- **Stakes:** небезпека без бою (міномети, патрулі).
- **"Quests":** хронологія дня з 5:00 до ночі — окопи → K-rations → чистка гвинтівки → носіння припасів → патруль → поранені й листи → вартa вночі.
- **Відповідь:** "fighting wasn't always the biggest part" — фактично дана вже на мініатюрі ("NO FIGHTING") і в першому реченні опису.

### WEAK SPOTS
1. **"And then... and then"** — структура "година за годиною" за визначенням є списком подій. Немає наростання ставок.
2. **Відповідь дана заздалегідь** — мініатюра "NO FIGHTING" і хук уже кажуть, що бої — не головне. Глядач, який повірив мініатюрі, не має питання, що тримало б до кінця.
3. **17–18 хв на один "типовий день"** — ймовірні "мертві" хвилини (рутинні блоки без нового питання). Точно виміряти без транскрипта не можу.
4. **Формулу вже масово клонують:** LegacyOfSteeel скопіював мініатюру й опис майже один-в-один (172K). За останні 2 тижні — десятки клонів "What Did X Actually Do All Day?" з 3–800 переглядами. Пряма копія формули = бути ще одним клоном.

### GAP — що глядач хоче дивитись ДАЛІ
Відео показує день **під час** війни. Природне наступне питання: **"А коли війна закінчилась — вони просто поїхали додому?"** Докази попиту саме зараз:
- WW2LifeUncovered (1 370 підписників): "7 Things the USA Army Took From Their Soldiers on Their Last Day" — **512 000**, 2026-10-25 (374x до підписників).
- Off Duty Tales (907 підписників, теж stick-figure стиль): "How Did American Soldiers Actually Get Home After WW2?" — **10 000 за 7 днів**, 9.1x медіани.
- The History Underground: "The Incredible Things American GIs Sent Home From WWII" — 671 000, 2026-10-07.

## Інші сильні сигнали ніші (останні 12 міс., малі канали)

| Канал | Підписники | Відео | Перегляди | Дата | Outlier |
|---|---|---|---|---|---|
| LegacyOfSteeel | 643 | What Did German WW2 Soldiers Actually Do All Day? | 172 000 | 2026-10-30 | 173x |
| Whatif4k | 1 520 | Your Life as Every Rank in the Japanese Army in WW2 | 264 000 | 2026-10-10 | 746x |
| EveryRank17 | 1 030 | Your Life as Every Rank in the US Air Force in WW2 | 231 000 | 2026-10-11 | 40x |
| EveryRank17 | 1 030 | How Long Would You Survive in Every WW2 Job? | 131 000 | 2026-10-08 | 23x |
| Inside the Steel | 13 600 | What It Was Like to Fight Inside a B-17 Tail Gunner Position at 25,000 Feet | 1 300 000 | 2026-10-13 | 67x |
| WWII Unlocked | 10 100 | Japanese POWs in Wisconsin Were Served White Rice... | 829 000 | 2026-01-23 | 193x |
| GlimmerGlimpses | 5 900 | Being on a Destroyer During WW2 was Hell | 239 000 | [MISSING] дата | ~33x |

**Висновок по ніші:** найгарячіша WWII-підніша осені 2026 — "звичайна людина на війні, від другої особи, анімація". Мікроканали з <1 500 підписників отримують 130–500K. Попит доведено; виграє той, хто бере **нову тему** у цій формулі, а не 30-ту копію "All Day".
