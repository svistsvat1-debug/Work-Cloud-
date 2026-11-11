# A1 — Діагностика конкурента

Режим: **TOPIC = "find an idea yourself"**. Поля TOPIC і COMPETITOR у брифі були не заповнені, тому конкурента я знайшов сам через пошук по ніші.
Дата дослідження: 2026-11-11. Інструменти: тільки yt-dlp (пошук, списки відео каналів, метадані). Платних інструментів не використовував.

## Як знайдено конкурента

- 30 пошуків по WWII-ніші з фільтром «завантажено цього року» («ww2 soldier daily life», «ww2 rations explained», «ww2 tank crew life», «soviet soldier ww2», «ww2 home front rationing» тощо) і ще 20 точкових перевірок `ytsearch30:`.
- 1049 унікальних відео, 38 каналів (останні ~60 відео кожного): підписники, медіана, outlier score.

Малі канали зі свіжими outlier'ами (2026):

| Канал | Subs | Медіана | Outlier-відео | Перегляди | Score |
|---|---|---|---|---|---|
| **Ink Story** | 9 800 | 27 000 | What Did WW2 Soldiers Actually Do All Day? (2026-10-26) | 892 954 | **×33** |
| Legacy of Steel | 613 | 1 000 | What Did German WW2 Soldiers Actually Do All Day? (~жовт. 2026) | 157 000 | ×157 |
| Level 1 History | 1 590 | 5 600 | Your Life as Every WW2 German Army Rank (~бер. 2026) | 349 000 | ×62 |
| We Made Do | 1 990 | 975 | What Soldiers Did In The Trenches To Not Go Mad (~жовт. 2026) | 60 000 | ×61 |
| Life at the Front | 3 940 | 7 250 | What It Was Like to Fly Japan's Ohka on a One-Way Mission (~лист. 2026) | 411 000 | ×57 |
| The Rising Guy | 9 010 | 3 800 | Every WW2 Fighter Plane Ranked — Overrated vs Ruthless (~трав. 2026) | 954 000 | ×251 |
| Blitzkrieg | 6 760 | 20 500 | Every WW2 Rifle RANKED — WORST to BEST (~вер. 2026) | 553 000 | ×27 |
| The Dictator Lab | 52 800 | 8 950 | How Did Hitler Fund a Huge Military When Germany Was Broke? (2026) | 2 005 983 | ×224 |

Дати з «~» приблизні (yt-dlp у пласких списках дає відносну дату).

**Вибір:** Ink Story. У нього найсвіжіший великий outlier (16 днів), канал новий (усі відео з липня по листопад 2026), і ця ж суб-ніша («щоденна реальність звичайного солдата») зараз спрацьовує ще у трьох малих каналів. Отже, попит актуальний, а не випадковий.

## NUMBERS — головне відео конкурента

- URL: https://www.youtube.com/watch?v=z4DB1tppFU8
- Назва: **What Did WW2 Soldiers Actually Do All Day?**
- Перегляди: **892 954**. Завантажено **2026-10-26** (16 днів тому). Тривалість **17:47**. Коментарів: 111.
- Канал Ink Story: **9 800 підписників**, 36 відео, медіана **27 000**.
- **Outlier score = 892 954 / 27 000 = ×33.** Малий канал + велике свіже відео = найсильніший сигнал.

## FORMULA EXTRACTION (весь канал)

**1. PROOF — чи свіжі перегляди?** Так. Усі 36 відео з липня по листопад 2026. Топ-5: 892K, 553K, 452K, 377K, 231K. Це живий тренд, а не старий.

**2. TOP 10 за переглядами**

| # | Перегляди | Довжина | Дата (~) | Назва |
|---|---|---|---|---|
| 1 | 892K | 17m | 2026-10-26 | What Did WW2 Soldiers Actually Do All Day? |
| 2 | 553K | 20m | 2026-08 | POV: You Are a Soldier in World War 2 |
| 3 | 452K | 18m | 2026-10 | Your Life as Every Rank in the U.S. Army in WW2 |
| 4 | 377K | 19m | 2026-10 | Your Life as Every Rank in the German Army in WW2 |
| 5 | 231K | 19m | 2026-08 | POV: You Are a German Soldier in World War 2 |
| 6 | 117K | 18m | 2026-10 | Your Life at Every Level of the British Empire |
| 7 | 104K | 16m | 2026-10 | The Brutal Reality of Enlisting the Day After 9/11 |
| 8 | 97K | 16m | 2026-09 | POV: You're a Japanese Soldier in WW2 |
| 9 | 71K | 20m | 2026-10 | Your Life as Every Rank in the Soviet Red Army in WW2 |
| 10 | 65K | 19m | 2026-08 | POV: You Are an Italian Soldier in WW2 |

Мініатюри топ-10 я зібрав в один contact sheet і переглянув. У git не комічу (це їхні зображення), файл лежить у scratchpad сесії.

**3. THUMBNAIL PATTERN.** На кожній мініатюрі одна велика кругла біла «мем-голова» солдата в однострої своєї армії, з гвинтівкою, на 40–50% кадру. Емоція завжди гіперболізована: страх і піт (більшість), самовдоволення (генерали) або спокій (#1). Повторюються два макети:
- **Обличчя + 1–3 слова** жовтим блочним шрифтом з чорним контуром: «NO FIGHTING», «30 SECONDS LEFT», «WRONG WAR?», «YOUR EMPIRE IS FALLING».
- **Статусний спліт**: нещасний рядовий у багнюці зліва, самовдоволений генерал у палаці справа (усі відео «Every Rank»).

**Click tactic:** емоційне обличчя + суперечність («NO FIGHTING» у відео про війну) або контраст (низ ієрархії vs верх).

**4. TITLE PATTERN.** Повторюються три форми: «POV: You Are a [nation] Soldier in WW2», «Your Life as Every Rank in the [army] in WW2», «What Did WW2 Soldiers Actually Do All Day/Night?». Головне повторюване слово — звичайний солдат конкретної армії чи нації. **Справжня суб-ніша — особистий досвід звичайного солдата конкретної армії, розказаний у 2-й особі.** Події війни — лише декорація.

**5. LENGTH PATTERN.** 10.7–21.1 хв, медіана **17.7 хв**.

**6. FORMULA CARD**

> **Анімаційна документалка в 2-й особі про «прожитий досвід»** на тему **щоденної реальності звичайного солдата WWII (за армією або званням)**. Мініатюра = одна велика кругла голова солдата з гіперболізованою емоцією + 1–3 жовті слова (суперечність або відлік) АБО спліт «рядовий vs генерал». Форма назви = «What Did [group] Actually Do All Day?» / «POV: You Are a [nation] Soldier» / «Your Life as Every Rank in [army]». Довжина = 16–20 хв.

## PACKAGING (відео #1)

- **Формула назви:** питання + «actually» (обіцянка розвінчати міф) + буденний проміжок часу («all day»). Загадка: «війна = бої… чи ні?»
- **Об'єкти на мініатюрі (лічба):** 1) великий розслаблений GI з M1, 2) фонова група (солдати сплять під яблунею, один копає, один пише лист), 3) чорний дим і вогонь на горизонті, 4) напис «NO FIGHTING». Це 4 елементи, і фон перевантажений.
- **Чи мініатюра повторює назву?** Ні. Вона *відповідає* на назву суперечністю («NO FIGHTING»). Відповідь видана з 0:00, але це працює, бо спокій на тлі диму — парадокс.

## STRUCTURE (відео #1)

Транскрипт: **[MISSING]**. yt-dlp отримав HTTP 429, далі «Sign in to confirm you're not a bot». Обходити блокування я не став. Структуру нижче відновив за офіційними розділами (chapters) і описом відео. Якщо хочеш глибший розбір хука, встав транскрипт (YouTube → ⋯ → Show transcript).

Розділи: 0:00 Morning routine and setup → 1:30 Survival basics → 2:26 Engineering the battlefield → 4:16 Maintenance and logistics → 6:15 Patrol and field operations → 8:00 Under fire and medical aid → 10:45 Planning and civilian contact → 12:49 Evening rest and morale → 14:11–17:47 Night watch and reflection.

- **Хук (перші ~20 с, за описом):** «In July 1944, an American infantryman in Normandy could spend an entire day on the front lines without firing a single bullet. But that didn't mean he was safe.» Далі «You wake up before sunrise in a muddy foxhole…». Ставка: нудьга vs раптова небезпека.
- **Stakes:** «сьогодні може бути атака — або ще 12 годин виснажливої роботи».
- **Квести:** в ігровому сенсі їх немає. Це хронологія одного дня, з 5:00 до ночі.
- **Де відповідь:** на самому початку, у мініатюрі й першому реченні («without firing a single bullet»).

## WEAK SPOTS

1. **Список «and then… and then» закладений у формат.** Ранок, копання, чистка, патруль, обстріл, вечір, ніч. Історію рухає годинник, а не питання.
2. **Відповідь дана зарано.** Мініатюра і перше речення вже кажуть «вони переважно не воювали».
3. **Пік посередині** (8:00–10:45, під вогнем). Після нього енергія падає.
4. **Ймовірні мертві хвилини:** останні 3.5 хв (14:11–17:47), «нічна варта і роздуми», повільне затухання. 17:47 забагато для одного дня без наростання ставок.
5. Їхнє продовження «What Did WW2 Soldiers Actually Do All Night?» набрало **52K за ~8 днів**, це ~1/17 від батьківського відео. Те саме POV «ще раз» аудиторію не тримає.

## GAP — що глядач хоче побачити ДАЛІ

У відео стрілець їсть K-раціони, отримує припаси, пише листи додому, допомагає пораненим. Але **ніде не показано, хто все це привіз і скільки людей для цього треба було.** Після «він майже не воював цілий день» логічне наступне питання:

> **«Якщо він не воював, а їжа, пальне, пошта й медики все одно приходили — хто стояв за ним і скільки їх було?»**

У безликому анімаційному форматі на це ніхто не відповідає (див. ideas.md: «Why the Odds of Actually Fighting in WWII Were So Small» — 762 перегляди; «How Long You'd Last in Every WW2 Job» — 12.5K). Це наш GAP.

## Попередження про ринок (важливо)

Суб-ніша гаряча, тому її вже клонують. За точною назвою «What Did WW2 Soldiers Actually Do All Day?» знаходиться **15+ копій** від мікроканалів з 2–400 переглядами. Те саме з «B-17 crews survived 25 missions», «every WW2 ration ranked», «how Finnish soldiers survived −40°». **Скопійована назва чи скопійований предмет не працює.** Потрібні новий предмет і нова структура.
