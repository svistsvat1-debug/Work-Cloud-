# "Why You See Stars When You Stand Up" — крок 2: beat sheet + промпти для Google Flow

Озвучка: `assets/why-you-see-stars/vo/take1.mp3` (ElevenLabs, Mark — Natural Conversations, v4), 29,96 с, мова від 0,14 до 29,78 с.

## Чим відрізняється від інструкції (Higgsfield → Google Flow)

- Flow не робить прозорий фон. Тому кожен cut-out генеруємо на **суцільному яскраво-зеленому фоні (chroma-key)**, а прозорість я зроблю кодом у кроці 3. Через це **в об'єктах і персонажах не має бути зеленого кольору**.
- Фони сцен (#10, #11) — звичайні непрозорі картинки на весь кадр.
- Таймінг нижче — по фразах, виміряний за паузами (-42 dB). Word-level таймінг через Whisper зараз недоступний: мережа середовища блокує завантаження моделі з huggingface.co. Для кроку 3 таймінгу по фразах достатньо. Якщо знадобиться точність до слова, вирішимо це на кроці 3.

## Beat sheet (час = час у файлі озвучки)

| Час | Слова | Що на екрані | Картинки | Звук (крок 3) |
|---|---|---|---|---|
| 0,14–2,08 | You just lost a fight with gravity. | Вітальня. Кадр 0: герой розвалився на дивані. На "You just" він підскакує (squash-swap): диван окремо + герой стоїть, хитається. Навколо голови кружляють зірочки, краї кадру сіріють (код) | #02 → #09 + #03, фон #10 | whoosh вгору, "дзинь" боксерського гонгу на "fight" |
| 2,58–6,36 | Stand up fast, and about half a liter of blood drops into your legs. | Герой випрямляється (#01). Рентген-панель їде через нього, всередині видно судини (#04). На "half a liter" вискакує мірний глечик (#12) з підписом "0.5 L" (код). На "drops into your legs" червоне в судинах стікає вниз, ноги "наливаються", глечик порожніє | #01, #04, #12 | гул сканера, "буль-буль" |
| 6,82–7,42 | Pressure dips. | Вискакує манометр (#13), стрілка (код) падає в червоне, в манометра очі "> <" (код) | #13 | слайд-свисток вниз |
| 7,98–9,30 | Less blood reaches your head. | Камера на рентген-голову: мозок блідне, останні краплі | #04 | низьке "вом-вом" |
| 9,76–12,12 | Your oxygen-hungry retina glitches first... | Око-персонаж з виделкою й ножем "їсть" бульбашки O₂ (код). Бульбашки закінчуються, на "glitches" swap на очманіле око + glitch-мерехтіння | #14 → #15 | "поп-поп", glitch-дзижчання |
| 12,54–13,16 | sparks... | POV: вітальня очима героя, всюди спалахують іскри (код) | #11 | дзвінкі іскринки |
| 13,70–14,44 | then a grey tunnel. | Сірий тунель стискається з країв, кольори зникають (код) | #11 | приглушений гул |
| 15,18–17,28 | Fighter pilots get that tunnel in hard turns. | Тунель лишається, за ним — небо: винищувач у крутому віражі (хмари й інверсійні сліди кодом), наїзд на кабіну → пілот з G-обличчям | #08 → #07 | рев/whoosh літака |
| 17,50–18,40 | It's called a grey-out. | Тунель тісно навколо обличчя пілота, слово "GREY-OUT" (код) | #07 | глухий удар |
| 18,90–21,22 | Then pressure sensors in your neck catch the drop. | Знову рентген (#04), крупно шия: два датчики блимають, "ping"-кола, "!" (код) | #04 | "пінг-пінг" |
| 21,68–22,48 | Your heart speeds up, | Серце (#16) з обличчям (код) качає все швидше | #16 | серцебиття прискорюється |
| 22,68–23,66 | vessels squeeze, | Судина (код) стискається, кров'яні кульки летять вгору | код | "скрип"-стиск |
| 23,82–24,80 | and your vision comes back. | POV-вітальня: тунель розкривається, повертаються кольори | #11 | "вуух" вгору |
| 25,42–26,70 | How often does this happen to you? | Герой по пояс, показує на глядача | #05 | "поп" |
| 27,18–29,78 | Happens a lot, or you faint? Tell a doctor. | Swap: герой тримає телефон. Дисклеймер текстом на екрані (код) | #06 | тихий клік |

Довжина ролика ≈ 30,4 с (озвучка зі зсувом 0,1 с + 0,5 с хвіст).

## Як генерувати у Flow

- Модель: Nano Banana Pro (або найновіша Nano Banana у списку): вона найкраще тримає персонажа і вміє редагувати картинку за референсом.
- Порядок:
  1. **#01** — головний персонаж. Згенеруй 2–4 варіанти, вибери найкращий.
  2. Далі в кожен промпт додавай референс, вказаний біля нього (#01 майже скрізь).
  3. **#02, #06, #11, #15** роби в останню чергу: вони редагують або продовжують інші картинки.
- Перевір кожну картинку перед тим, як брати:
  - фон суцільний зелений, без тіні й градієнта;
  - на об'єкті немає зеленого;
  - нічого не обрізано краєм кадру;
  - немає тексту чи цифр;
  - контур однаково товстий, персонаж той самий (голова, очі, руки).
- Завантаж у максимальній роздільності, назви файли за номерами (`01_hero.png`, `02_sofa_sitting.png` …) і скинь усі разом.

## Промпти

### #01 hero — головний персонаж · 9:16 · без референсу
```
Full body, front view, centred: the character stands straight and relaxed, arms hanging loosely at the sides, a friendly calm face with a small closed-mouth smile. Whole body in frame with a wide margin. Flat 2D cartoon character: simple white character, big round head, small soft body, thin noodle arms with four-finger hands, short legs with rounded feet, thick smooth black outlines of even weight, flat white fill with a soft pale-grey shade on one side, small solid black oval eyes, simple curved black eyebrows, no nose, no hair, no clothes. Clean vector linework, flat colours, no texture, no gradients, no text, no border. Isolated on a plain flat solid bright chroma-key green background filling the whole image: no shadow, no floor, no other objects, no green on the character.
```

### #03 dizzy — підскочив і хитається · 9:16 · референс #01
```
Full body, front view, centred: the character just stood up too fast and is dizzy: swaying, body leaning slightly toward the left side of the image, knees a little bent and wobbly, both arms stretched out to the sides for balance with open hands, eyes drawn as two small black spirals, a wavy uneasy mouth, tilted eyebrows. No stars, no motion lines, no effects around him. Whole body in frame with a wide margin. Flat 2D cartoon, the same character and drawing style as the reference image: simple white character, big round head, small soft body, thin noodle arms with four-finger hands, short legs with rounded feet, thick smooth black outlines of even weight, flat white fill with a soft pale-grey shade on one side, small solid black oval eyes, simple curved black eyebrows, no nose, no hair, no clothes. Clean vector linework, flat colours, no texture, no gradients, no text, no border. Isolated on a plain flat solid bright chroma-key green background filling the whole image: no shadow, no floor, no other objects, no green on the character.
```

### #04 x-ray — рентген героя · 9:16 · референс #01 (редагування)
```
Edit this exact picture into a cartoon X-ray of the same character. Keep exactly the same pose, silhouette, outline, size and position. The body fill becomes flat dark navy blue with the same thick black outline. Inside the body: one simple bright red heart in the chest; smooth bright red blood-vessel tubes of even thickness run from the heart up through the neck into the head, down both arms to the hands, and down both legs to the feet; a pale pink brain fills the top of the head. The eyes become two small white ovals. No skeleton, no bones, no other organs, no glow, no text. Same flat cartoon style, same thick black outlines, same plain flat bright chroma-key green background, no shadow.
```

### #05 point — по пояс, показує на глядача · 9:16 · референс #01
```
Waist-up close-up, facing the viewer, centred, head in the upper third of the image: a curious friendly look, one eyebrow raised, a small smile; the hand on the RIGHT side of the image points at the viewer with the index finger, the other arm relaxed down at the side. Head, hands and body fully in frame with a margin at the top and sides. Flat 2D cartoon, the same character and drawing style as the reference image: simple white character, big round head, small soft body, thin noodle arms with four-finger hands, thick smooth black outlines of even weight, flat white fill with a soft pale-grey shade on one side, small solid black oval eyes, simple curved black eyebrows, no nose, no hair, no clothes. Clean vector linework, flat colours, no texture, no gradients, no text, no border. Isolated on a plain flat solid bright chroma-key green background filling the whole image: no shadow, no other objects, no green on the character.
```

### #07 pilot — пілот на перевантаженні · 9:16 · референс #01
```
Waist-up close-up, facing the viewer, centred: the character is a fighter pilot pulling hard G-force in a tight turn. He wears a simple light-grey flight helmet with one red stripe and a dark visor pushed up; no oxygen mask, no logos, no clothes. His face is squeezed by the G-force: cheeks stretched downward, teeth clenched in a wide grimace, eyes squinting hard, eyebrows pulled down. Both hands grip a short black control stick in front of his chest. The whole figure is tilted about 10 degrees as if the plane is turning. Head, hands and helmet fully in frame with a margin. Flat 2D cartoon, the same character and drawing style as the reference image: simple white character, big round head, small soft body, thin noodle arms with four-finger hands, thick smooth black outlines of even weight, flat white fill with a soft pale-grey shade on one side, simple curved black eyebrows, no nose, no hair. Clean vector linework, flat colours, no texture, no gradients, no text, no border. Isolated on a plain flat solid bright chroma-key green background filling the whole image: no shadow, no other objects, no green on the character.
```

### #08 jet — винищувач у віражі · 16:9 · референс #01 (стиль)
```
A cartoon fighter jet in a hard banking turn: wings tilted steeply, about 60 degrees, seen from the side and slightly below, nose pointing to the right side of the image. Rounded, friendly, toy-like shapes; light-grey body with darker grey details; a clear light-blue bubble canopy with a tiny white round-head pilot in a grey helmet visible inside. No national markings, no numbers, no text, no weapons, no exhaust flame, no smoke or vapour trails. Whole jet in frame with a margin. Flat 2D cartoon, the same drawing style as the reference image: thick smooth black outlines of even weight, flat colours with one soft shade, clean vector linework, no texture, no gradients, no border. Isolated on a plain flat solid bright chroma-key green background filling the whole image: no shadow, no sky, no clouds, no other objects, no green on the jet.
```

### #09 sofa — диван · 16:9 · референс #01 (стиль)
```
A cosy mustard-yellow three-seat sofa, straight front view: two soft back cushions and two seat cushions, rounded armrests, short dark-wooden legs, empty with nobody on it. Whole sofa in frame with a margin. Flat 2D cartoon, the same drawing style as the reference image: thick smooth black outlines of even weight, flat colours with one soft shade, clean vector linework, no texture, no gradients, no text, no border, no characters. Isolated on a plain flat solid bright chroma-key green background filling the whole image: no shadow, no floor, no other objects, no green on the sofa.
```

### #10 room — вітальня, фон для першої сцени · 9:16 · референс #01 (стиль)
```
A cosy living-room interior seen straight on: the back wall fills most of the image, pale peach colour, with a window showing light-blue sky and one white cloud, a simple framed abstract picture, and a round wall clock. A warm wooden floor fills the bottom quarter of the image with a soft orange rug. The middle of the room is completely empty: no furniture in the centre, no sofa, no chairs. Straight eye-level view, centred and symmetrical. Flat 2D cartoon background, the same drawing style as the reference image: thick smooth black outlines, flat soft colours with one soft shade, clean vector linework, no texture, no text, no people, calm and uncluttered, no green colours, no plants.
```

### #12 jug — мірний глечик "пів літра" · 1:1 · референс #01 (стиль)
```
A clear plastic measuring jug with a handle on the right side of the image, front view, half filled with flat bright red liquid (cartoon blood, no splashes), simple short measurement tick marks on the side without any numbers or letters. Whole jug in frame with a margin. Flat 2D cartoon, the same drawing style as the reference image: thick smooth black outlines of even weight, flat colours with one soft shade, clean vector linework, no texture, no gradients, no text, no numbers, no border, no characters. Isolated on a plain flat solid bright chroma-key green background filling the whole image: no shadow, no floor, no other objects, no green on the jug.
```

### #13 gauge — манометр без стрілки · 1:1 · референс #01 (стиль)
```
A round old-style pressure gauge, straight front view: a thick dark-grey metal rim, a cream dial face with a curved scale arc (red at the left low end, yellow in the middle, light blue at the right high end), simple tick marks without any numbers or letters, a small brass connector at the bottom. NO needle and no centre pin: the middle of the dial is empty. Whole gauge in frame with a margin. Flat 2D cartoon, the same drawing style as the reference image: thick smooth black outlines of even weight, flat colours with one soft shade, clean vector linework, no texture, no gradients, no text, no numbers, no border, no characters. Isolated on a plain flat solid bright chroma-key green background filling the whole image: no shadow, no floor, no other objects, no green on the gauge.
```

### #14 eye hungry — голодне око з виделкою й ножем · 1:1 · референс #01
```
A cute cartoon eyeball character, front view: a big round white eyeball with a soft pale-grey shade on one side, a brown iris with a black pupil and a white glint, looking up eagerly; two thick curved black eyebrows floating above the eyeball, raised with excitement; thin noodle arms with simple four-finger hands: the hand on the LEFT side of the image holds a fork upright, the hand on the RIGHT side holds a knife upright; short legs with rounded feet; a small white napkin with red checks tied around its lower half like a bib. Whole character in frame with a margin. Flat 2D cartoon, the same drawing style as the reference image: thick smooth black outlines of even weight, flat colours with one soft shade, clean vector linework, no texture, no gradients, no text, no border. Isolated on a plain flat solid bright chroma-key green background filling the whole image: no shadow, no floor, no other objects, no green on the character.
```

### #16 heart — серце-качок · 1:1 · референс #01
```
A cute cartoon human heart character: a simplified anatomical heart shape, rounded and slightly tilted, not a love-heart symbol; flat red with a darker red shade on one side; two short thick tubes on top, one red and one blue; thin noodle arms with four-finger hands, both fists raised and pumping like an excited athlete; no legs. The front of the heart is plain with NO face: no eyes, no mouth. Whole character in frame with a margin. Flat 2D cartoon, the same drawing style as the reference image: thick smooth black outlines of even weight, flat colours with one soft shade, clean vector linework, no texture, no gradients, no text, no border. Isolated on a plain flat solid bright chroma-key green background filling the whole image: no shadow, no floor, no other objects, no green on the character.
```

### #02 sofa sitting — герой на дивані · 16:9 · референси #09 + #01 (робити після #09)
```
Edit the yellow sofa from the reference: keep the sofa exactly the same — same size, shape, colours, angle and position in the image. Now the white character from the other reference sits slouched comfortably in the middle of the sofa, front view, leaning back, both arms resting along the top of the sofa back, legs bent with feet down in front of the sofa, a relaxed happy face with half-closed eyes and a small smile. Same flat 2D cartoon style, same thick black outlines, the character drawn exactly as in his reference (white, big round head, noodle arms, four-finger hands, small black oval eyes, no clothes). Same plain flat bright chroma-key green background filling the whole image, no shadow, no floor, no text, no other objects.
```

### #06 phone — по пояс з телефоном · 9:16 · референс #05 (редагування)
```
Edit this exact picture: keep the character, head, body, size and position identical. Change only the arms: the hand on the RIGHT side of the image now holds a simple black smartphone up next to the head, with a plain light-blue screen facing the viewer and nothing on the screen; the hand on the LEFT side of the image points at the phone. Expression: kind but serious, eyebrows slightly raised, a small closed-mouth smile. Same flat cartoon style, same thick black outlines, same plain flat bright chroma-key green background, no shadow, no text.
```

### #11 POV — вітальня очима героя · 9:16 · референс #10
```
First-person view of a person who just stood up in the same living room as the reference (same colours and style), looking straight at the opposite wall at eye level: a TV with a dark screen on a low wooden cabinet in the centre, a window with light-blue sky on one side, a tall floor lamp on the other side, the same orange rug on the wooden floor at the bottom. Straight-on, centred, calm, no people, no hands, no text. Flat 2D cartoon background, the same drawing style as the reference image: thick smooth black outlines, flat soft colours with one soft shade, clean vector linework, no texture, uncluttered, no green colours, no plants.
```

### #15 eye dazed — очманіле око · 1:1 · референс #14 (редагування)
```
Edit this exact picture: keep the eyeball character, its size, position and style identical. Make it dazed: the iris and pupil become a black spiral, the eyebrows droop, both arms hang limp, the fork and knife are falling out of its hands in mid-air, the napkin is crooked. Same flat cartoon style, same thick black outlines, same plain flat bright chroma-key green background, no shadow, no text.
```

## Що робиться кодом, а не картинками (крок 3)

Зірочки та іскри, сірий тунель і знебарвлення, рентген-панель, стікання крові в судинах (маска червоного з #04), стрілка й обличчя манометра, бульбашки O₂, glitch, небо, хмари й інверсійні сліди, датчики в шиї з "ping", обличчя серця, судина, що стискається, підписи "0.5 L" та "GREY-OUT", дисклеймер, підлога/тіні.
