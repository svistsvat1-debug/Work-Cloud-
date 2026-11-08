# Крок 2 — промпти для Google Flow (фаги)

Анімацію, камеру, фізику, обличчя на об'єктах, ефекти і звук роблю кодом. Від тебе потрібні лише **11 картинок**.

## Як генерувати

1. **Спочатку тільки #01** (головний герой, без референсу). Обери найкращий варіант, бо він задає стиль усього відео.
2. Решту генеруй, **додавши #01 як reference image / ingredient** у Flow. Для предметів (#06–#11) референс потрібен тільки для стилю ліній.
3. **#02 краще робити як редагування #01**: та сама картинка, змінюється лише рука й обличчя. Якщо Flow так не вміє, згенеруй окремо з #01 як референсом, я вирівняю по голові.
4. Формат: персонажі вертикальні (3:4 або 9:16, бери найближчий доступний), предмети 1:1, лабораторія 16:9. Завантажуй у **максимальній якості**.
5. Прозорий фон Flow не робить, тому всюди однотонний **світло-блакитний фон #9BCFFD**. Вирізаю його я.
6. Назви файли так, щоб у назві був ключ (`guy_present`, `phage` тощо). Префікс неважливий, PNG чи JPG — теж. Скидай усі разом.

## Чек перед відправкою (кожна картинка)

- Фон однотонний світло-блакитний, без тіні на підлозі, без градієнта.
- Об'єкт цілком у кадрі, з відступом від країв.
- Товстий чорний контур навколо всього, без «відкритих» країв.
- Кисті: 4 пальці, нічого не злипається з тілом.
- **На предметах і бактеріях немає облич.** Очі я малюю кодом, бо вони моргають, дивляться й злякано мружаться.
- Немає тексту, логотипів і водяних знаків.

Якщо щось не так, перегенеруй. Це дешевше, ніж латати в коді.

---

## #01 · `guy_present` — ГОЛОВНИЙ ГЕРОЙ (без референсу) · 3:4 / 9:16

```
Full body, three-quarter view facing to the LEFT. Friendly calm smile with a small closed curved mouth, relaxed eyebrows. The arm on the LEFT side of the image is stretched forward at chest height, the hand open with the palm facing up, fingers together and flat, as if showing something small resting on the palm; the hand is clearly away from the body. The other arm hangs relaxed at the side. Standing straight on both feet. Whole body in frame with a wide margin on all sides.
Flat 2D cartoon explainer style: a simple white character with a big round head, a small soft rounded body, thin noodle arms with simple four-finger hands and short legs with rounded feet, thick smooth black outlines of even weight, flat white fill with a very soft pale-grey shade on one side, small solid black oval eyes, simple curved black eyebrows, no nose, no hair, no clothes, a pink tongue only when the mouth is open. Clean vector-like linework, flat colours, no texture, no text, no border. Isolated on a plain flat solid light-blue background (#9BCFFD) that fills the whole image, nothing else: no ground, no floor shadow, no gradient, no vignette.
```

## #02 · `guy_drop` — редагування #01 · той самий формат

```
The same picture as the reference: the same character, same position, same size, same camera angle. Change only this: the hand on the LEFT side of the image is now turned palm-down, open, with the fingers spread, as if it just let go of something; the head is turned slightly toward the RIGHT side of the image, looking away innocently, eyes closed as two small curved lines, lips puckered into a small round "o" as if whistling. Everything else identical.
Flat 2D cartoon in exactly the same drawing style and the same character as the reference image: thick smooth black outlines of even weight, flat white fill with a very soft pale-grey shade on one side, no nose, no hair, no clothes. Clean vector-like linework, flat colours, no texture, no text, no border. Isolated on a plain flat solid light-blue background (#9BCFFD) that fills the whole image, nothing else: no ground, no floor shadow, no gradient.
```

## #03 · `guy_shrug` · референс #01 · 3:4 / 9:16

```
Full body, front view facing the viewer, centred. Puzzled face: one eyebrow raised higher than the other, small wavy mouth. Classic shrug: both elbows bent, both forearms raised out to the sides, both hands open with the palms facing up at shoulder height, hands clearly apart from the body and from the head. Standing on both feet. Whole body in frame with a wide margin.
Flat 2D cartoon in exactly the same drawing style and the same character as the reference image: the same simple white character with a big round head, a small soft rounded body, thin noodle arms with simple four-finger hands and short legs with rounded feet, thick smooth black outlines of even weight, flat white fill with a very soft pale-grey shade on one side, small solid black oval eyes, simple curved black eyebrows, no nose, no hair, no clothes. Clean vector-like linework, flat colours, no texture, no text, no border. Isolated on a plain flat solid light-blue background (#9BCFFD) that fills the whole image, nothing else: no ground, no floor shadow, no gradient.
```

## #04 · `guy_oldtimey` — лікар 1920-х (флешбек) · референс #01 · 3:4 / 9:16

```
Full body, three-quarter view facing to the LEFT. The same white character dressed up as an old-fashioned 1920s doctor: a big curly black handlebar moustache and a round silver doctor's head mirror on a thin black headband on the forehead (these are the only additions). Proud, confident smile, chest pushed out. The hand on the LEFT side of the image holds up a small old-fashioned brown glass medicine bottle with a cork, filled with a cloudy pale-purple liquid; the bottle is drawn opaque. The other hand rests on the hip. Whole body in frame with a wide margin.
Flat 2D cartoon in exactly the same drawing style and the same character as the reference image: big round head, small soft rounded body, thin noodle arms with simple four-finger hands, short legs with rounded feet, thick smooth black outlines of even weight, flat white fill with a very soft pale-grey shade on one side, small solid black oval eyes, no nose, no clothes. Clean vector-like linework, flat colours, no texture, no text, no border. Isolated on a plain flat solid light-blue background (#9BCFFD) that fills the whole image, nothing else: no ground, no floor shadow, no gradient.
```

## #05 · `guy_scared` · референс #01 · 3:4 / 9:16

```
Full body, front view facing the viewer, centred, leaning back a little. Scared: eyebrows tilted up in the middle, wide round eyes, mouth wide open in an oval with a pink tongue visible. Both hands raised up beside the cheeks, palms facing out, fingers spread, hands not touching the head. Knees slightly bent. Whole body in frame with a wide margin.
Flat 2D cartoon in exactly the same drawing style and the same character as the reference image: the same simple white character with a big round head, a small soft rounded body, thin noodle arms with simple four-finger hands and short legs with rounded feet, thick smooth black outlines of even weight, flat white fill with a very soft pale-grey shade on one side, small solid black oval eyes, simple curved black eyebrows, no nose, no hair, no clothes. Clean vector-like linework, flat colours, no texture, no text, no border. Isolated on a plain flat solid light-blue background (#9BCFFD) that fills the whole image, nothing else: no ground, no floor shadow, no gradient.
```

## #06 · `phage` — бактеріофаг · референс #01 (лише стиль) · 1:1

```
A cute cartoon bacteriophage virus, front view, perfectly symmetrical, standing upright: a big lavender-purple 20-sided gem-shaped head (an icosahedron drawn as a hexagon with a few simple facet lines and a lighter purple front facet), a short thick neck collar, a straight grey tail tube with horizontal stripes, a small flat base plate, and six thin bent spider-like grey legs spreading out at the bottom. The big front facet of the head is plain and empty: no face, no eyes, no mouth. The head is about half of the total height. Whole object in frame with a wide margin.
Flat 2D cartoon in exactly the same drawing style as the reference image: thick smooth black outlines of even weight, flat colours with one simple soft shade, clean vector-like linework, no texture, no text, no border, no characters. Isolated on a plain flat solid light-blue background (#9BCFFD) that fills the whole image, nothing else: no ground, no floor shadow, no gradient.
```

## #07 · `bact_rod` — зелена паличка · референс #01 (лише стиль) · 1:1

```
A cute cartoon bacterium shaped like a long rounded capsule (a rod), lying horizontally: flat lime-green fill, a slightly darker green shade along the bottom, a few small darker-green round spots near the edges, a short row of tiny thin hair-like lines around its outline, and one long wavy thin tail (flagellum) coming out of the RIGHT end. The middle of the body is plain: no face, no eyes, no mouth. The body takes most of the width. Whole object in frame with a wide margin.
Flat 2D cartoon in exactly the same drawing style as the reference image: thick smooth black outlines of even weight, flat colours with one simple soft shade, clean vector-like linework, no texture, no text, no border, no characters. Isolated on a plain flat solid light-blue background (#9BCFFD) that fills the whole image, nothing else: no ground, no floor shadow, no gradient.
```

## #08 · `bact_round` — помаранчева кулька · референс #01 (лише стиль) · 1:1

```
A cute cartoon bacterium shaped like a round ball (a coccus): flat warm-orange fill, a slightly darker orange shade on one side, a few small darker-orange round spots near the edge, a few tiny short hair-like lines around its outline. The middle is plain: no face, no eyes, no mouth. Whole object in frame with a wide margin.
Flat 2D cartoon in exactly the same drawing style as the reference image: thick smooth black outlines of even weight, flat colours with one simple soft shade, clean vector-like linework, no texture, no text, no border, no characters. Isolated on a plain flat solid light-blue background (#9BCFFD) that fills the whole image, nothing else: no ground, no floor shadow, no gradient.
```

## #09 · `bact_comma` — рожева «квасолинка» · референс #01 (лише стиль) · 1:1

```
A cute cartoon bacterium shaped like a fat curved bean or comma, lying horizontally with the curve bulging upward: flat pink-magenta fill, a slightly darker pink shade along the bottom, a few small darker spots near the edges, one thin wavy tail (flagellum) coming out of the LEFT end. The middle of the body is plain: no face, no eyes, no mouth. Whole object in frame with a wide margin.
Flat 2D cartoon in exactly the same drawing style as the reference image: thick smooth black outlines of even weight, flat colours with one simple soft shade, clean vector-like linework, no texture, no text, no border, no characters. Isolated on a plain flat solid light-blue background (#9BCFFD) that fills the whole image, nothing else: no ground, no floor shadow, no gradient.
```

## #10 · `pill` — капсула антибіотика · референс #01 (лише стиль) · 1:1

```
A cartoon antibiotic capsule pill lying horizontally: the LEFT half bright red, the RIGHT half white, a thin black line where the two halves meet, one simple light highlight stripe along the top. No face, no text, no letters. Whole object in frame with a wide margin.
Flat 2D cartoon in exactly the same drawing style as the reference image: thick smooth black outlines of even weight, flat colours with one simple soft shade, clean vector-like linework, no texture, no text, no border, no characters. Isolated on a plain flat solid light-blue background (#9BCFFD) that fills the whole image, nothing else: no ground, no floor shadow, no gradient.
```

## #11 · `lab_bg` — лабораторний стіл (задній план) · референс #01 (лише стиль) · 16:9

```
A wide, simple cartoon laboratory counter seen straight from the front: a long light-grey counter top over a plain off-white cabinet front with a few door lines. On top of it, from left to right: a small dark-grey microscope, a rack of three test tubes with green and pink liquids, two round glass flasks with purple and orange liquids, and a short stack of petri dishes. All glass is drawn opaque (pale grey with white highlights, nothing see-through). Nothing above the counter: no wall, no shelves, no window. No characters. The counter fills the full width of the image.
Flat 2D cartoon in exactly the same drawing style as the reference image: thick smooth black outlines of even weight, flat colours with one simple soft shade, clean vector-like linework, no texture, no text, no border, no characters. Isolated on a plain flat solid light-blue background (#9BCFFD) that fills the whole image, nothing else: no ground, no floor shadow, no gradient.
```
