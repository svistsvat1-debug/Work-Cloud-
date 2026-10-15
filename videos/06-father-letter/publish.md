# #06 — пакет для публікації на YouTube Shorts

Зроблено за `docs/YOUTUBE_TITLE_RULES.md`, `docs/YOUTUBE_THUMBNAIL_RULES.md` і аналізом конкурентів `docs/YOUTUBE_SHORTS_COMPETITORS.md`. Мова — англійська, як у відео.

## Назва (v2: правила власника + аналіз конкурентів, див. `docs/YOUTUBE_SHORTS_COMPETITORS.md`)

**Обрана:** `My Dad Hid This For 15 Years 👀` (30 символів)

Чому ця:
- Скелет ролика конкурента на 5.2M: *He Waited 40 Years For This 👀*. Займенник-загадка *This* + конкретна цифра + одне емодзі.
- Формула власника «хто + дивна дія», перші 4 слова чіпляють, розв'язки немає.
- Коротка, тож у стрічці Shorts не обріжеться.
- Пара з обкладинкою: назва питає «що він ховав?», обкладинка показує лист, шок і `HE KNEW.`, тобто «що саме він знав?». Одна одну не повторюють.
- Чесно: у відео справді лист, схований на 15 років.

Запасні (для перезаливу або наступних частин):
1. `Dad Knew Something I Never Told ANYONE 😳`: скелет *I Left A Note Saying I KNOW* (7.9M) + *He Suddenly Knew Everything* (2.5M)
2. `How Did My Dad Know? 😨`: питання; з нею текст обкладинки міняй на `15 YEARS.`
3. `I Never Told Dad About That Night 😨`: зізнання
4. `Dad's Letter Knew My Secret 👀`
5. `He Hid It Under His Seat For 15 Years 👀`

## Обкладинка 9:16 (1080×1920), v2

**Що змінено після аналізу конкурентів:** обличчя тепер займає ~половину кадру (у лідерів воно навіть більше, ніж третина з наших правил). Фон — та сама зелена кабіна вантажівки, що й у кадрі 05 відео, щоб обкладинка не обманювала. Текст скорочено до 2 слів.

**Схема (3 елементи):** обличчя сина (шок + сльоза) + старий лист із синім чорнилом + `HE KNEW.`

### Промпт

```
Vertical 9:16 YouTube Shorts cover, photorealistic cinematic photograph, 1080x1920, shot on 50mm, shallow depth of field.
Extreme close-up of a rugged man in his late 30s with short messy brown hair and a short brown beard, wearing a worn olive-brown canvas work jacket. His face is huge and fills about half of the frame, centered slightly above the middle of the image. Overwhelming shock and disbelief: eyes wide open and glistening with tears, eyebrows raised high, mouth open, one tear running down his cheek, looking straight into the camera lens. Face lit by a warm amber dome light from above, eyes bright, sharp and fully visible, skin texture detailed.
In the lower left of the frame he holds up an old yellowed, creased handwritten letter close to the camera, large and in sharp focus: faded brown handwriting on top and two fresh lines of bright blue ink at the bottom, handwriting illegible.
Setting: inside the cab of an old green semi truck at night, rain drops on the windshield behind him, the background is a soft blurred mix of saturated emerald green and warm orange bokeh lights, not black.
Vivid saturated colors, high contrast, clean simple composition with only the face and the letter as subjects. Calm empty area in the top 18% of the frame for a headline. Bottom 20% of the frame simple and calm.
No text, no letters, no words, no logos, no watermark, no frame, no borders.
```

**Negative prompt:** `text, words, letters, captions, logo, watermark, signature, extra fingers, deformed hands, two faces, cartoon, 3d render, illustration, dull colors, black background, cluttered background, small face, closed eyes, face in shadow, smiling`

**Midjourney:** додай у кінець `--ar 9:16 --style raw`

### Текст на обкладинці

- `HE KNEW.`: 2 слова, один рядок, жирний шрифт без засічок, великими літерами, жовтий (#FFD400) з товстою чорною обводкою й тінню.
- Розташування: верхні ~18% кадру, над головою, не перекриває обличчя.
- Низ і правий край чисті: у стрічці там назва й кнопки.
- Якщо генератор добре пише текст (Ideogram, GPT-image, Nano Banana), заміни рядок «No text…» на:
  `At the very top of the frame, a huge bold sans-serif headline "HE KNEW." in bright yellow with a thick black outline and drop shadow, perfectly legible, not covering the face. No other text, no logos, no watermark.`

### Перевірка перед публікацією

- Зменш до розміру стрічки на телефоні: за секунду має читатися «шокований чоловік + лист + HE KNEW.».
- Поклади поруч з обкладинками His Story / PrimePath (див. `docs/YOUTUBE_SHORTS_COMPETITORS.md`): обличчя має бути не дрібнішим.

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
