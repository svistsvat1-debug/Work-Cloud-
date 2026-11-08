# Short: Why Bees Die After Stinging You 🐝

Формат: Shorts-факт, проста 2D-анімація, 25–30 с, англійською.
Озвучка: ElevenLabs **Eleven v4** (`eleven_v4`) з audio tags.

**Ідея одним реченням:** медоносна бджола зазвичай виживає, коли жалить іншу комаху, але гине, коли жалить людину, бо наша шкіра тримає її зазубрене жало. Відірване жало ще до хвилини качає отруту і пахне «бананом», а цей запах кличе інших бджіл.

---

## 1. Фактчек структури (що змінено)

| Як було в структурі | Що кажуть джерела | Що в озвучці |
|---|---|---|
| "It can sting a bug and live" | Бджоли здебільшого виймають жало з шершня, але інколи воно застрягає в міжсегментних мембранах (Gu et al. 2021) | "can sting a bug and **usually** survive" |
| Панцир комахи vs пружна шкіра | Зазубрене жало важко витягти з волокнистих тканин, як-от шкіра (Zhao et al. 2015). Пояснення через «панцир» як причину джерела прямо не підтверджують | Голосом кажемо тільки про шкіру. Панцир можна показати на анімації, але не озвучувати як причину |
| Жало качає отруту «кілька десятків секунд» | ≥90% отрути виходить за 20 с, повністю — до 1 хв (Schumacher 1994). За словами апіолога UC Davis, отрута качається 45–60 с | "for up to a minute" |
| Як виймати жало | Спосіб (зіскрібати чи витягати пальцями) на дозу не впливає, важить тільки швидкість (Visscher et al. 1996) | "get it out fast", без «scrape» |
| Запах банана | Головний компонент тривожного феромону — isopentyl acetate («банановий» запах). Його повно біля жала, і він веде інших бджіл жалити туди ж | "banana-scented alarm that calls more bees to you" |
| «Всі бджоли» | Гинуть тільки робочі медоносні бджоли. Матка може жалити кілька разів, у трутнів жала немає, оси жалять повторно | Скрізь "honey bee" |

Назва: "Why Bees Die…" — сильніший пошуковий хук, у озвучці уточнюємо "honey bee". Точніший варіант: **Why Honey Bees Die After Stinging You 🐝**.

---

## 2. Чиста озвучка (STEP 1, без тегів) — 70 слів

> A honey bee can sting a bug and usually survive. Sting you, and it dies. Your skin snags its barbed stinger. Pulling away rips out the stinger, venom sac, and part of its belly. That stinger keeps pumping venom for up to a minute, so get it out fast. It also releases a banana-scented alarm that calls more bees to you. Bee or wasp, which is worse? Subscribe for more.

Без CTA "Subscribe for more." — 67 слів.

---

## 3. Скрипт для ElevenLabs Eleven v4 (з тегами)

Вставляти як є, одним блоком:

```
[bee buzzing]
[Curious, quick and punchy, clear American accent] A honey bee can sting a bug and usually survive.
[pause]
[Flat, dead serious] Sting you, and it dies.
[Fast, explaining] Your skin snags its barbed stinger.
[Wincing] Pulling away rips out the stinger, venom sac, and part of its belly.
[pause]
[Urgent, faster] That stinger keeps pumping venom for up to a minute — so get it out fast.
[Lower, ominous] It also releases a banana-scented alarm... that calls more bees to you.
[angry bees swarming]
[Playful, challenging] Bee or wasp — which is worse?
[Warm, upbeat] Subscribe for more.
```

**Версія без звукових ефектів:** видалити два рядки `[bee buzzing]` і `[angry bees swarming]`, а SFX додати в CapCut.

### Налаштування

| Параметр | Значення | Чому |
|---|---|---|
| Model | Eleven v4 (`eleven_v4`), не Turbo | Turbo — для real-time агентів, v4 — для voiceover |
| Voice | [MISSING] — обрати голос з бібліотеки | Акцент у v4 найнадійніше задає сам голос. Тег акценту лише підказка, результат може відрізнятися |
| Stability | старт ~50%, далі тестувати | Нижче — більше емоцій, вище — стабільніше, але пласкіше |
| Similarity | залишити за замовчуванням | Високе значення може зменшити природність |
| Speed / Style | слайдерів у v4 немає | Темп задано тегами (`quick`, `faster`) |
| Паузи | `[pause]`, тире, `...` | SSML `<break>` у v4 не працює |

### Як генерувати
1. Згенерувати 3–4 дублі й вибрати найкращий: v4 виконує теги не завжди точно.
2. Перевірити, що SFX-теги звучать як ефект, а не як шум і не зачитуються словами. Якщо ні — взяти версію без SFX.
3. Перевірити тривалість: ціль ≤ 30 с. Якщо довше — спершу прибрати `[pause]`, потім SFX-рядки.

---

## 4. Таймлайн під анімацію (орієнтовно)

| Час | Озвучка | Візуал (зі структури) |
|---|---|---|
| 0–3 с | A honey bee can sting a bug… Sting you, and it dies. | Бджола жалить комаху й відлітає → жалить руку. Текст: "It can sting a bug and live. Sting you — and it dies." |
| 3–12 с | Your skin snags… part of its belly. | «Рентген» жала із зазубринами-гарпуном; шкіра тримає зубці; жало відривається з отруйним мішечком |
| 12–19 с | That stinger keeps pumping venom… get it out fast. | Відірване жало пульсує; таймер до 1:00; рука швидко прибирає жало |
| 19–25 с | It also releases a banana-scented alarm… | Хмаринка запаху з іконкою банана; бджоли розвертаються до руки |
| 25–29 с | Bee or wasp, which is worse? Subscribe for more. | Split screen бджола vs оса → кнопка Subscribe |

Закріплений коментар: "Bee or wasp — which one's worse? 🐝"

---

## 5. Джерела

**Факти:**
- Zhao et al. (2015), *Biology Open* — зазубрене жало бджоли важко витягти зі шкіри: https://doi.org/10.1242/bio.012195
- Gu et al. (2021), *Biology* — бджоли здебільшого виймають жало з шершнів, інколи воно застрягає: https://pmc.ncbi.nlm.nih.gov/articles/PMC8229339/
- UC ANR Bug Squad (Eric Mussen, UC Davis) — гине тільки робоча бджола; отрута качається 45–60 с: https://ucanr.edu/blog/bug-squad/article/why-do-honey-bees-die-when-they-sting
- UC Riverside, bee stings — жало відривається разом з кінцем черевця; тривожний феромон допомагає знайти жертву: https://bees.ucr.edu/stings.html
- Visscher, Vetter, Camazine (1996), *The Lancet* — важить швидкість, а не спосіб: https://pubmed.ncbi.nlm.nih.gov/8709689/
- Schumacher, Tveten, Egen (1994), *J Allergy Clin Immunol* — ≥90% отрути за 20 с, повністю за 1 хв: https://doi.org/10.1016/0091-6749(94)90373-5
- University of Bristol, Molecule of the Month — isopentyl acetate кличе інших бджіл жалити біля жала: https://www.chm.bris.ac.uk/motm/ethylacetate/bee.htm
- Boch, Shearer, Stone (1962), *Nature* — isoamyl acetate як компонент феромону жала: https://doi.org/10.1038/1951018b0
- Britannica — isopentyl acetate = «banana oil»: https://www.britannica.com/video/195015/overview-bees-wasps-danger-pheromones
- University of Missouri Extension — оси й деякі бджоли жалять повторно: https://extension.missouri.edu/publications/g7391

**ElevenLabs v4:**
- Docs: https://elevenlabs.io/docs/overview/capabilities/text-to-speech/eleven-v4
- Сторінка моделі: https://elevenlabs.io/v4
- Анонс: https://elevenlabs.io/blog/eleven-v4

---

Наступна тема в черзі: "Why Do You Get Nosebleeds?"
