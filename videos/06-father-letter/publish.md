# #06 — пакет для публікації на YouTube Shorts

Зроблено за `docs/YOUTUBE_TITLE_RULES.md` і `docs/YOUTUBE_THUMBNAIL_RULES.md`. Мова — англійська, як у відео.

## Назва

**Обрана:** `My Dad Hid a Letter for 15 Years. The Last 2 Lines…` (51 символ)

Чому ця: формула «подія + обрив», конкретика (15 років, 2 рядки), перші 4 слова чіпляють самі по собі, розв'язку не видає. Обіцянка чесна: відео справді побудоване навколо двох дописаних рядків.

Інші варіанти:
1. My Dad Hid a Letter for 15 Years. The Last 2 Lines…
2. Dad's Hidden Letter Knew Something I Never Told ANYONE
3. I Found Dad's Letter After 15 Years. He Added 2 Lines
4. Why Did My Father Hide This Letter for 15 Years?
5. Dad Wrote About a Night He Couldn't Have Known
6. 15 Years Under His Truck Seat. Addressed to Me
7. My Father Knew a Secret I Never Told Anyone

Назва + обкладинка в парі: обкладинка дає емоцію і питання («HOW DID HE KNOW?»), назва дає контекст (лист, 15 років, 2 рядки). Вони не повторюють одна одну.

## Обкладинка 9:16 (1080×1920)

**Схема (3 елементи):** шокований син (обличчя) + старий лист із синім чорнилом + текст `HOW DID HE KNOW?`.

### Промпт (без тексту — текст краще накласти окремо, нейромережі псують літери)

```
Vertical 9:16 YouTube Shorts cover, photorealistic cinematic photograph, 1080x1920.
Tight close-up of a rugged man in his late 30s with short messy brown hair and light stubble, wearing a worn olive-brown work jacket, the same man as a long-haul truck driver. His face is large, filling about a third of the frame, placed in the center of the image. Extreme shocked expression: eyes wide open, eyebrows raised high, mouth slightly open in disbelief, looking straight into the camera. Face brightly and evenly lit by warm amber light, eyes sharp, clear and not in shadow, a tear on one cheek.
In the lower-left foreground he holds up an old yellowed, creased handwritten letter toward the camera; the paper is large and in sharp focus, faded brown handwriting at the top and two fresh lines of bright blue ink at the bottom, handwriting illegible.
Background: night highway in thick glowing fog with a bright green highway exit sign, heavily blurred bokeh, saturated teal-green and warm orange color contrast, background is not black.
Shallow depth of field, high contrast, vivid saturated colors, clean simple composition with only three elements: face, letter, blurred sign. Empty calm area in the top 20% of the frame for a headline. Bottom 20% of the frame calm and simple, nothing important there.
No text, no letters, no words, no logos, no watermark, no frame, no borders.
```

**Negative prompt** (якщо генератор підтримує): `text, words, letters, captions, logo, watermark, signature, extra fingers, deformed hands, multiple faces, cartoon, illustration, dull colors, black background, cluttered background, small face, closed eyes, face in shadow`

**Для Midjourney** додай у кінець: `--ar 9:16 --style raw`

### Варіант із текстом одразу в картинці (якщо генератор добре пише літери: Ideogram, GPT-image, Nano Banana)

Додай до промпту замість рядка «No text…»:

```
At the top of the frame, a huge bold sans-serif headline in two lines: "HOW DID" in white and "HE KNOW?" in bright yellow, thick black outline and drop shadow, perfectly legible, not covering the face. No other text, no logos, no watermark.
```

### Текст на обкладинці

- `HOW DID / HE KNOW?`, 2 рядки, жирний шрифт без засічок, великими літерами.
- `HOW DID` білим, `HE KNOW?` жовтим (#FFD400), товста чорна обводка + тінь.
- Розташування: верхні ~20% кадру, не перекриває обличчя.
- Низ і правий край лишаються чистими: у стрічці Shorts там назва й кнопки.

### Перевірка перед публікацією

- Зменш обкладинку до розміру стрічки на телефоні. За секунду має бути зрозуміло: шокований чоловік + лист. Текст має читатися.
- Обличчя має бути тим самим типажем, що в кадрі 05 відео (бородатий водій), тоді клікбейт чесний.

## Опис

```
He hid it under his truck seat for 15 years. Addressed to me. Dated the morning I left home.

At the bottom, in different ink, he'd added two more lines… about a night I never told anyone.

How do you think he knew? 👇

#shorts #storytime #mystery
```

Перші 3 хештеги YouTube показує над назвою. Більше не треба, інакше це схоже на спам.

[MISSING] Історія реальна чи вигадана? Якщо вигадана, додай рядок `Dramatized story.` у кінець опису. Так інтрига лишається, а глядач не почувається обманутим.

## Теги

```
my father hid a letter, hidden letter, letter from dad, father son story, dad letter story, emotional story, mystery story, unexplained story, storytime, short story, truck driver story, letter found after death, true story shorts, sad story, creepy story
```

(~250 символів; ліміт YouTube 500.)

## Налаштування

| Поле | Значення |
|---|---|
| Аудиторія | No, it's not made for kids |
| Altered or synthetic content | **Yes**: фото реалістичні й згенеровані, без позначки YouTube може обмежити або позначити ролик сам |
| Категорія | Entertainment |
| Мова відео / мова назви й опису | English / English |
| Субтитри | Не обов'язково, вони вже вшиті у відео. Можна завантажити `voice.srt` як English CC (за замовчуванням вимкнені, тож дубля не буде) |
| Коментарі | On, сортування Top |
| Закріплений коментар | `How do you think he knew? Wrong answers only 👇` |
| Remixing | Allow video and audio remixing |
| Paid promotion | No |
| Ліцензія | Standard YouTube License |
| Плейлист | Створи `Mystery Stories` і клади туди всі такі історії |
| Related video | Посилання на наступну історію каналу, коли вона з'явиться |
| Час публікації | [MISSING]: коли активна аудиторія каналу (дивись YouTube Analytics → Audience → When your viewers are on YouTube) |

## Обкладинка для Shorts: як поставити

У додатку YouTube під час завантаження Shorts обкладинку обирають із кадрів відео. Якщо кнопки завантаження власного зображення в акаунті немає, можна вклеїти згенеровану обкладинку останнім кадром відео (~0.1 с) і вибрати саме його. Хук на початку не страждає, луп майже не помітний.
