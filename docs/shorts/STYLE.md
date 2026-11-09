# Стиль Shorts-відео (стандарт каналу)

Еталон: **"The Egg"** (листопад 2026). Відгук: "відео вийшло бомбезне, саме такий стиль використовувати в майбутньому".
Усі нові Shorts робимо за цим документом, поки користувач прямо не скаже інакше.

| Файл | Що в ньому |
|---|---|
| `docs/shorts/style/hero_reference.jpg` | головний герой каналу, референс для КОЖНОЇ картинки |
| `docs/shorts/style/the-egg-frames.jpg` | 6 кадрів еталону: так має виглядати результат |
| `docs/shorts/the-egg-script.md` | приклад сценарію + промпт ElevenLabs |
| `docs/shorts/the-egg-video-plan.md` | приклад beat sheet + 16 промптів для Flow |
| `docs/shorts/the-egg-publish-pack.md` | приклад пакета публікації |
| `video/` | Remotion-проєкт і весь пайплайн (`video/README.md`) |

## 1. Формат і сценарій

- Вертикальне відео 9:16. Композиція 1080×1920, 60 fps. Видаємо 4K (2160×3840) і копію 1080p.
- 20–30 с, 50–70 слів, англійська, простою розмовною мовою.
- Структура під утримання:
  1. **Хук у першому реченні.** Конкретне шокуюче твердження або питання, без привітань. Перший кадр показує саме його.
  2. **Ланцюжок відкритих петель.** Кожне речення відповідає на попереднє й відкриває нове питання.
  3. **"Очевидна відповідь неправильна"**: міні-поворот у середині.
  4. **Розв'язка — на ОСТАННЬОМУ слові перед CTA**, тобто в останні 2–4 с.
  5. **CTA: `Subscribe to see more.`** ~1,5 с, одразу після розв'язки, без довгої паузи.
  6. **Петля:** останній кадр переходить у перший. У еталоні це білий спалах і новий цикл.
- Факти тільки перевірені, з джерелом. Вигадку подаємо як історію. Чужий сюжет обов'язково кредитуємо в описі.
- Голос оповідача — "людський": трохи гумору, звертання на "you".

## 2. Голос (ElevenLabs)

- Модель **eleven_v4**, голос **"Mark - Natural Conversations"**.
- Audio tags — помірно. Тег міняємо лише там, де змінюється подача. Капс максимум на 1–2 словах.
- **Кожен дубль перевіряємо транскрипцією по шматках:** v4 буває дублює фрази й дописує зайве в кінці. Чистимо скриптом `video/images/the-egg/vo/edit_vo.py`:
  - ріжемо тільки в тиші;
  - паузи підтягуємо до 0,25–0,45 с;
  - на стиках кросфейд 15 мс.
- Обробка: компресор, потім loudnorm голосу до −16 LUFS. Фінальний мікс −15 LUFS, пік ≈ −3 dBTP (`scripts/finalize.sh`).

## 3. Візуальний стиль

- **Плаский cut-out мультик:**
  - товсті рівні чорні контури, плоскі кольори, одна м'яка блідо-сіра тінь;
  - без текстур, без градієнтів на персонажах.
- **Головний герой (маскот):**
  - білий круглоголовий чоловічок: без носа, волосся й одягу;
  - маленькі чорні овальні очі, прості брови;
  - руки-"локшина" з 4 пальцями, короткі ніжки;
  - той самий у кожному відео (`style/hero_reference.jpg`). Атрибути додаємо за сюжетом: німб, капелюхи, соска тощо.
- **Світ малюється кодом:**
  - пастельний градієнт "порожнечі" (#E4DCFF → #FFF3E2);
  - хмари з одним спільним контуром, іскорки;
  - небо #74C3FF → #E6F6FF, трава #B9E09A;
  - драматичні сцени — темний індиго з прожекторами;
  - космос — темно-синій з зорями.
- **Великий білий персонаж за героєм** (як Бог): теплий тон (`sepia(0.42) saturate(1.7) hue-rotate(-6deg)`) плюс розмиття глибини 2–3 px. Інакше білий герой зливається з тлом.
- **Текст на екрані** — тільки ключові числа чи слова. Шрифт Fredoka Bold, білий з товстою чорною обводкою, акцент жовтий #FFD447.
- **Один дитячий гег на біт:** предмет злітає, піт, соска, хвиля німбів, предмети оживають, "пік" перед вибухом.
- **Камера:** 2.5D multiplane: наїзд → розкриття → супровід дії. Плавно, ≥1 с, без motion blur.

## 4. Картинки (Google Flow / Nano Banana — генерує користувач)

- Я даю повний список промптів **одним повідомленням**, кожен в окремому блоці: назва файлу, формат, референс.
- Перша картинка — герой у першій позі. Далі для персонажів і предметів у тому ж стилі референсом іде `hero_reference.jpg`; для пози іншого персонажа — його базова картинка (як 11 для 12–14 в "The Egg").
- Фон завжди рівний **#9BCFFD**: Flow не вміє прозорий, я вирізаю сам (`prep_cutouts.py`).
- Одна поза = одна картинка. Дрібні предмети й натовпи — аркушем з широкими проміжками, я розріжу.
- Пишемо "on the LEFT side of the image", а не "his left". Додаємо "No blue colours on the character".
- **Відомі проблеми:**
  - Flow інколи малює реалістичного персонажа, як 12/13 в "The Egg". Такі не беремо: просимо перегенерувати або робимо жест кодом.
  - Роздільність 768×1376, тому апскейл ×3.

STYLE-блоки (вставляти дослівно в кінець промпту):

**Перша картинка героя (без референсу):**
```
Flat 2D cartoon character for an animated YouTube Short: a simple white character with a big round head, a small soft rounded body, thin noodle arms with simple four-finger hands, short legs with rounded feet. Thick smooth black outlines of even weight, flat white fill with a very soft pale-grey shade on one side, small solid black oval eyes, simple curved black eyebrows, no nose, no hair, no clothes, a pink tongue only when the mouth is open. Clean vector-like linework, flat colours, no texture, no text, no border, no blue colours on the character. The background is one plain flat solid light-blue colour (#9BCFFD) filling the whole image: no gradient, no ground, no floor shadow, no glow, no other objects.
```

**Персонажі з референсом:**
```
Flat 2D cartoon in exactly the same drawing style as the reference image, the same character: a simple white character with a big round head, a small soft rounded body, thin noodle arms with simple four-finger hands, short legs with rounded feet, thick smooth black outlines of even weight, flat white fill with a very soft pale-grey shade on one side, small solid black oval eyes, simple curved black eyebrows, no nose, no hair, a pink tongue only when the mouth is open. Clean vector-like linework, flat colours, no texture, no text, no border, no blue colours on the character. The background is one plain flat solid light-blue colour (#9BCFFD) filling the whole image: no gradient, no ground, no floor shadow, no glow, no other objects.
```

**Предмети:**
```
Flat 2D cartoon in exactly the same drawing style as the reference image: thick smooth black outlines of even weight, flat colours with one simple soft shade, clean vector-like linework, no texture, no text, no border, no characters. The background is one plain flat solid light-blue colour (#9BCFFD) filling the whole image: no gradient, no ground, no shadow, no glow.
```

## 5. Анімація (Remotion, `video/`)

- **Структура нового відео:**
  - `images/<short>/src/` — картинки з Flow;
  - `public/<short>/` — вирізки, звуки, голос;
  - `src/<short>/` — копія `src/egg/` як шаблон;
  - нова `<Composition>` у `src/Root.tsx`.
- **Пайплайн:** `prep_cutouts.py` (вирізка, розрізання, ×3) → `build_data.py` (анкери) → `make_sfx.py` → stills / контактний аркуш → прев'ю 0.5x → pop scan → рендер 4K → `finalize.sh`.
- **Правила руху:**
  - пози міняються всередині руху (squash / turn / pop), без кросфейдів;
  - фізика для всього, що летить;
  - ефекти малюються кодом у тому ж стилі;
  - дихання й погойдування на паузах.
- **Технічні уроки "The Egg"** (обов'язково):
  - спрайти позиціонувати через `transform`, НЕ `left/top`, інакше на повільних рухах будуть стрибки на 1 px;
  - шрифти тримати локально в `public/`, бо браузер рендера не довіряє сертифікату проксі;
  - під час рендера не перебандлювати в ту саму папку (`BUNDLE_DIR`).
- **Перевірка перед рендером:**
  - контактний аркуш кожного біту й кожної заміни пози;
  - pop scan прев'ю: кожен прапорець має бути навмисною склейкою чи появою.

## 6. Звук

- Звукові ефекти — з ElevenLabs (`eleven_text_to_sound_v2`), промпт `Sound effect only, no music, no voice: …`.
- Якщо безкоштовна черга ElevenLabs зайнята, ставимо синтез із `make_sfx.py` як заглушку. Файл ElevenLabs у `sfx_src/<назва>.mp3` автоматично його замінить: потрібен лише перерахунок звуку (`CODEC=wav`) і remux, без рендеру картинки.
- **Рівні під голосом:**
  - whoosh −19…−24 dB;
  - удари −11…−16;
  - фон −24…−30.
- Великі звуки ставимо в паузи між словами. Синхронізуємо по піку чи онсету, виміряному у файлі.
- Тихий фоновий пад на всю довжину, акорди змінюються за сценами.

## 7. Видача і публікація

- 4K + 1080p, перевірка: розмір, fps, кількість кадрів, звук, транскрипція фінального міксу.
- **Пакет публікації за шаблоном `the-egg-publish-pack.md`:**
  - 3–4 назви з оцінкою vidIQ, беремо найвищу; пошукова фраза в дужках;
  - опис: хук, кредит першоджерела, джерело факту, 5 хештегів;
  - теги, закріплений коментар-питання;
  - 2 обкладинки (YouTube — під назву; TikTok/Reels — хук), текст у центральній зоні;
  - SRT з таймінгів фраз;
  - налаштування: "not made for kids", AI-мітки за правилами платформ.
