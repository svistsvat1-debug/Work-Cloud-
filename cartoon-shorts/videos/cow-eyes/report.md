# Звіт — cow-eyes (#16), 2026-11-14

**Фінальний текст (дослівно як затверджено):**
A lion sneaks up behind a cow in Botswana. / It needs her not to see it, because lions hunt by surprise. / But two huge eyes stare right back at it... from her butt. / Someone painted them on. / So the lion thinks it's been spotted and walks away. / In four years, not one cow with eyes gets eaten. / Her friends do.

**Голос.** ElevenLabs Mark - Natural Conversations, eleven_v4, один дубль, 20,96 с. Вкладатися в 25 с не довелося.
**Відео.** 21,9 с, 1080×1920, 60 fps, 1314 кадрів. Пік звуку −4,0 dBFS: після рендеру мікс піднято на 3 дБ, відео не перекодовувалось.

## Біти
| час | слова | картинка | гег | звук |
|---|---|---|---|---|
| 0–3,05 | A lion sneaks… Botswana | широкий план: lionSneak на передньому плані, cowSide, фон | лев крадеться навшпиньки, на «Botswana» вискакує табличка BOTSWANA | tiptoe ×2, pop |
| 3,05–7,0 | It needs her not to see it… surprise | faceSly крупно | лев у високій траві; на «surprise» пірнає в траву | growl, whoosh |
| 7,0–9,16 | But two huge eyes stare… | cowRear (погляд лева) | на заду з'являються дуги, на «eyes» розплющуються намальовані очі, на «stare» — зум | pop, boing |
| 9,16–10,5 | …right back at it | faceShock | грива дибки, тремтіння, крапля поту | gulp |
| 10,5–11,5 | from her butt | cowRear, відʼїзд | видно всю корову, вона спокійно жує; очі на заду кліпають | pop |
| 11,5–13,3 | Someone painted them on | hero + cowSide | персонаж малює очі по одному, на «on» міняє позу: дмухає на пензель, іскри | brush ×2, pop |
| 13,3–16,3 | So the lion… walks away | широкий план: lionSneak → lionWalk (дзеркально) | очі дивляться на лева, «!», лев іде геть, роблячи вигляд, що нічого не сталося | boing, whistle |
| 16,3–19,9 | In four years… eaten | широкий план із подругою | лічильник 1→4 YEARS, лев двічі визирає й тікає, на «eaten» очі підморгують | ticks, zip ×2 |
| 19,9–21,9 | Her friends do. | камера на подругу | хмарка пилу, лишається тільки дзвіночок, лев вислизає праворуч, у корови крапля поту | whoosh, munch, pop, moo |

## Картинки
Усі — GPT Image 2.5, 1K, LOW, по одній варіації, тільки з тексту, без референсів:
- hero (2:3)
- guyS (2:3)
- cowSide (3:2)
- cowRear (2:3)
- lion — пара-лист (3:2)
- lionFace — пара-лист (3:2)
- bg (2:3)

Перероблювати не довелося жодної.

## Звуки
- **Нові (5):** growl, moo, tiptoe, brush, whistle. Усі додано в sfx-library.
- **Повторно з бібліотеки (7):** pop, boing, gulp, whoosh, ticks, zip, munch.

## Кредити
| стаття | кредити |
|---|---|
| Голос | 303,97 |
| Scribe | 0 |
| Картинки | 328,67 |
| Звуки | 20,00 |
| **Разом** | **652,64 / 900** |

Резерв не знадобився.

## Прохід покращень
1. Широкі плани спочатку вийшли дрібними: тонка смужка з персонажами, пів кадру — порожнє небо. Переробив у глибину: лев на передньому плані нижче й більший, корова позаду.
2. Лев на кадрі 0 майже не потрапляв у кадр. Під час «підглядання» він теж був ледве видний. Наблизив обидва моменти.
3. Кліпання намальованих очей виглядало як сірі диски. Тепер очі закриваються дугами.
4. Крапля поту у фіналі опинялася за кадром. Перенесено до голови корови.
5. Текст обкладинки обрізався збоку. Шрифт зменшено, текст відцентровано.

## Інше
- **Flow:** https://elevenlabs.io/app/flows/XYm4Yh6Hid6IZFvixfVb
- **Студія:** `cd cartoon-shorts/studio && npx remotion studio`
- **Фолбеки:**
  - Сесія знову стартувала в середовищі Default, яке блокує завантаження з elevenlabsusercontent.com. Переключився на середовище «Work-Cloud-».
  - Remotion не зміг завантажити власний Chrome, тому використано headless shell від Playwright.
  - OpenCV поставив через pip.
- **Не точний луп:** кінець показує корову з дзвіночком, а початок — корову з левом.
