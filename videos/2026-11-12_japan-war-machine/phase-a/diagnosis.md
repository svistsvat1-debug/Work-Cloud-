# A1. Діагностика конкурентів — 2026-11-12

Режим: **TOPIC = "find an idea yourself"**, COMPETITOR = none, NOTES = none (поля INPUT у промпті були не заповнені).
Свідомо НЕ брав Ink Story ("What Did WW2 Soldiers Actually Do All Day?"): на його основі вже зроблено 4 наші відео в інших гілках (85 points, 1 GI / support army ×2, Soviet soldiers). Потрібна нова формула.

## Як збирались дані (тільки безкоштовно)
- `yt-dlp` пошук: 30 запитів `ytsearch30` (relevance) + 25 запитів з фільтром YouTube "this year + sort by views" (~1 500 відео) + 23 запити для перевірки підніш.
- `yt-dlp --flat-playlist -J` по 8 каналах: підписники, перегляди, тривалість → медіана, outlier score.
- Дати: сторінка каналу (`… ago`) + RSS.
- Транскрипт і метадані відео-конкурента: `yt-dlp --write-auto-subs` + `--write-info-json` — **спрацювало** для `kF3P_9QdWvM` і `RscLRpY7j5Y`. Для інших відео YouTube віддав "Sign in to confirm you're not a bot" — обходити не став.
- Мініатюри з `i.ytimg.com`, contact sheet (локально, не в git — чужі зображення).
- Платні інструменти не використовувались.

## Головний конкурент: History Inside

**Відео:** "Germany's Abandoned Tanks: What the Allies Did With Them?" — https://www.youtube.com/watch?v=kF3P_9QdWvM

| Метрика | Значення |
|---|---|
| Перегляди | 1 339 153 (info.json, 2026-11-12) |
| Лайки | 11 738 |
| Дата | 2025-12-11 (11 місяців тому) |
| Тривалість | 11:16 |
| Канал | History Inside (@HistoryInsideWW2) |
| Підписники | 100 000 |
| Медіана каналу (останні 50 відео) | 81 500 (усі 120 відео: 66 500) |
| **OUTLIER SCORE** | **16.4x** (до медіани останніх 50) · 20.1x (до медіани всіх) |

### PROOF — чи свіжий успіх?
Так, канал живий: "What Happened to Germany's Top Fighter Aces After the War?" — 795K за 2,5 місяці (~10x), "Stauffenberg's Family After WW2" — 442K за 4 місяці. Але **"техніка після війни" у них слабшає**: "Tiger Tanks After WW2" — 6,2K за 2 тижні, "Atlantic Wall" — 23K, "German Battleships" — 14K. Тобто німецька техніка вже вичерпана — **глядач хоче нову країну**, а не ще одне відео про Тигри.

### TOP-10 каналу (за переглядами)
| # | Перегляди | Назва |
|---|---|---|
| 1 | 2 200 000 | Where Did the Waffen SS Go After 1945? |
| 2 | 1 600 000 | The Fate of Hermann Göring's Family After the Fall of Nazi Germany |
| 3 | 1 600 000 | What Happened to the German U-Boats After WW2? |
| 4 | 1 300 000 | Germany's Abandoned Tanks: What the Allies Did With Them? |
| 5 | 917 000 | What Happened to Erwin Rommel's Family After WW2? |
| 6 | 889 000 | What Happened to the 24 German Generals Captured at Stalingrad? |
| 7 | 795 000 | What Happened to Germany's Top Fighter Aces After the War? |
| 8 | 601 000 | Heinrich Müller – The Gestapo Chief Who Vanished After WW2 |
| 9 | 598 000 | The Führerbunker After 1945 — What Really Happened? |
| 10 | 593 000 | Where Did Heinrich Himmler's Wife and Daughter Go After the War? |
| (11) | 579 000 | What Happened to the Luftwaffe Planes After WW2? |

### THUMBNAIL PATTERN (contact sheet топ-10)
- **Відео про людей (7/10):** кольоризований портрет офіцера крупно справа + чорно-біла архівна сцена зліва (парад, руїни, сім'я).
- **Відео про техніку (3/10 + Luftwaffe):** **спліт "одна машина | тисячі таких самих"**: зліва один Tiger / U-boat / Bf 109 крупно, справа — аерофото рядів танків на звалищі, U-boat'ів у бункері, літаків на аеродромі.
- **Тексту немає взагалі** (0/10). Картинка сама питає "що з цим сталося?".
- На мініатюрах про SS — нацистська символіка. Ми таке НЕ повторюємо (правило безпеки).
- **Click tactic:** "масштаб + доля": один впізнаваний об'єкт проти маси таких самих, покинутих. Глядач бачить кладовище техніки і хоче знати, чим воно закінчилось.
- Маленький канал Tales Of Britain (2,4K підписників) скопіював тактику: "блискучий Lancaster | іржавий Lancaster" — і отримав 55x.

### TITLE PATTERN
- 49 з 120 назв: "What Happened to X After WW2?" / "The Fate of X After WW2" / "Where Did X Go After 1945?"
- Справжня підніша: **"доля переможених після 1945"** — люди, техніка, місця Німеччини. Майже все — про Німеччину.

### LENGTH PATTERN
Медіана 11:21, діапазон 9:15–13 хв (два компіляційних відео по 26 хв).

### FORMULA CARD
> **Narrated "aftermath" explainer about the defeated side's people and machines after 1945 (almost only Germany); thumbnail = one iconic subject vs. a mass of identical abandoned ones (or colorized portrait + B/W scene), no text; title shape = "What Happened to [the defeated side's X] After WW2?" / "Where Did [X] Go After 1945?"; length = 9–13 min.**

### PACKAGING топ-відео (Abandoned Tanks)
- Назва: "Germany's Abandoned Tanks: What the Allies Did With Them?" — об'єкт + питання "що зробили переможці".
- Мініатюра: 2 об'єкти (один танк | поле рядів танків). Тексту 0.
- Мініатюра НЕ повторює назву дослівно, але показує "кладовище" — частину відповіді (їх зібрали в купи).

### STRUCTURE (за транскриптом)
- **Hook (0:00–0:25):** "In May 1945… thousands of German tanks were still scattered… What would happen to Hitler's armored fleet?" — чітке питання, без ставок для людини.
- **Розділи (з глав опису):** 0:00 Tanks in 1945 → 1:44 Allied testing → 4:31 Scrapping → 7:21 German tanks used after WW2.
- **Відповідь:** по шматках по ходу ("most were destroyed by 1948" вже на 6:53). Фінал — перелік країн (Франція, Чехословаччина, Іспанія, Сирія) і музеї.
- **CTA:** "watch what happened to German U-boats next".

### WEAK SPOTS
1. **"And then… and then":** енциклопедичний перелік країн і заводів (Bochum, Essen, Magdeburg; Romania, Bulgaria, Yugoslavia…) без питань між ними.
2. **Відповідь дана рано:** "most… destroyed by 1948" на ~7:00, далі 4 хв "довідника".
3. **Нуль людей:** жодного солдата, механіка, родини. Тільки "Allied teams", "workshops".
4. **Мертві хвилини:** 4:15–6:50 — повтори "scrapped / recycled / target hulks" без нового питання.
5. **Голос і візуал:** монотонний TTS + архівні/AI фото (у нас рух, світло, ігрова структура).

### GAP — що глядач хоче далі
1. **Іншу переможену країну.** Німеччину розібрано до дна (Tiger 6K). **Японія** — друга велика переможена армія, а "що сталося з японською технікою" майже не знято (див. ideas.md).
2. **Людську історію всередині "техніки"** — хто плавав на цих кораблях після капітуляції.
3. **Твіст "техніка повернулась"** — у них лише короткий кінець про Сирію; глядачу цікаво, коли розібрана машина знову стала потрібна.

## Інші сигнали з ніші (підтверджують попит на "aftermath")
| Канал | Підписники | Відео | Перегляди | Вік | Outlier |
|---|---|---|---|---|---|
| WW2 Life Uncovered | 1 370 | Where the Rifles, Jeeps and Planes Went After WW2 | 135 000 | 10 днів | ~100x до підписників |
| Tales Of Britain | 2 420 | What Happened to Britain's Lancaster Bombers After WW2? | 61 000 | 10 міс | 55x (медіана 1,1K) |
| Tales Of Britain | 2 420 | What Happened to Britain's Spitfires After WW2? | 53 000 | 11 міс | 48x |
| Histoics | 44 600 | What Happened to the Japanese Navy After WW2 | 39 079 | [MISSING] дата | 39x (медіана 1K) |
| WW2 Aftermath | 7 310 | What REALLY Happened to America's Destroyer Escorts After WW2 | 49 905 | [MISSING] | 2.9x |
| Steel Afterlife | 4 | What Happened to the 50,000 Shermans After WW2? | 1 100 | [MISSING] | — (слабка упаковка) |
