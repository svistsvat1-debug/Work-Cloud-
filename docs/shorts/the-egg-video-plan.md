# "The Egg": план відео (beat sheet + промпти для Google Flow)

Сценарій і озвучка: `docs/shorts/the-egg-script.md`.
Стиль: cut-out мультик як у "Can we throw trash in a volcano?" (скіл `cutout-cartoon-shorts`).
Різниця зі скілом: картинки генеруєш ти в Google Flow (Nano Banana), а не через Higgsfield. Фон я вирізаю сам.

Статус:
- [x] Голос перевірено й змонтовано: `video/public/the-egg/vo/vo_edit.mp3`, 25,8 с.
- [x] Beat sheet готовий (нижче).
- [x] 16 картинок з Flow отримано (`video/images/the-egg/src/`).
- [x] Анімація в Remotion, звуки, рендер 4K. Проєкт: `video/`, інструкція: `video/README.md`.

## 0. Що зібрано і чим відрізняється від плану

- **Картинки:**
  - 14 з 16 використано.
  - **12_god_wave і 13_god_nope** Flow намалював в іншому стилі: реалістичний дід з носом, волоссям і одягом. Тому їх не взяв, а жести Бога зробив у коді: на "Hi" він кивком вітається, на "Nope" хитає головою.
  - Щоб повернути жест рукою, згенеруй 12/13 ще раз з 11 як референсом. Я підставлю.
- **Бог** трохи тонований у теплий кремовий колір і розмитий на задньому плані. Так білий герой не зливається з ним.
- **Вирізання:**
  - Фон прибраний, разом із дірками в німбах, ґратах брами й ручці кружки.
  - Аркуші 10/15/16 розрізані на окремі спрайти.
  - Усе збільшено в 3 рази з підтягнутими лініями, бо Flow віддав 768×1376 — замало для 4K.
- **Натовп:** 32 ряди фігур із 16_crowd, зібрані в Python, далі ще 4 яруси вглиб до горизонту. На "was you" над кожною головою хвилею спалахує німб.
- **Звуки:**
  - ElevenLabs: сплеск, хор, ковток, гул натовпу, лічильник. Витрачено 300 кредитів.
  - Безкоштовні генерації ElevenLabs були зайняті, тому решту синтезовано в коді (`make_sfx.py`): whoosh, pop, poof, ding, low hit, пищалка, shimmer, тріск, вибух шкаралупи, серцебиття, тихий фоновий пад.
- **Звук фінального файлу:** голос стиснутий і вирівняний, мікс нормалізований до −15 LUFS.
- **Субтитрів у відео немає.** Їх можна додати в CapCut або YouTube, або я вшию їх у Remotion за таймінгами слів.

## 1. Голос: що було не так і що я зробив

Дубль `Mark - Natural Conversations` (eleven_v4) тривав 43,5 с. Кожен шматок я перевірив окремою транскрипцією. Знайшлися проблеми:

| Де (с) | Що там | Що зробив |
|---|---|---|
| 4,9–5,9 | "Heaven? Hell." сказано двічі, перший раз з інтонацією вниз | Вирізав перший, лишив питальний |
| 13,9–15,9 | "Every single one of them... was you." сказано двічі, перший раз як питання | Вирізав перший, лишив стверджувальний (тихший, hushed) |
| 35,3–38,4 | Зайва фраза, якої немає в сценарії: "So bright, my life is a precious gift." | Вирізав |
| 39,0–43,3 | "Subscribe to see more!" ще тричі, щоразу голосніше | Вирізав, лишив один CTA |

Також підтягнув довгі паузи (0,5–0,65 с → 0,25–0,45 с). Різав тільки в тиші, на стиках кросфейд 15 мс.
Результат: 25,8 с, рівно 64 слова сценарію (перевірено повторною транскрипцією). "egg" звучить на 23,8–24,1 с, CTA — на 24,5–25,5 с.
Відтворити монтаж: `python3 video/images/the-egg/vo/edit_vo.py video/images/the-egg/vo/take1_raw.mp3 <out_dir>`.

## 2. Світ і персонажі

- **Герой ("you")**: білий круглоголовий чоловічок у стилі вулкан-шортса, над головою маленький золотий німб, у першому кадрі тримає червону чашку кави.
- **Бог**: велетенська, старша версія того самого персонажа з пухнастою білою бородою-хмаринкою. Це натяк на фінал ("ти станеш таким, як я"). Золоті промені позаду малюю в коді.
- **Порожнеча** (загробний світ): пастельний градієнт від лавандового до кремового, повільні іскорки, все в коді.
- **У коді, а не на картинках**: пара, бризки кави, піт, сльози, димок, промені, сяйво, німби над натовпом, лічильник, прожектори, яйце-Всесвіт, тріщини, уламки шкаралупи, зорі й галактики, спалах.

## 3. Beat sheet

Час — за змонтованим голосом. У композиції голос стоїть на 0,1 с, загальна довжина ~26,3 с.

| # | Час (с) | Слова | На екрані | Картинки | Звук |
|---|---|---|---|---|---|
| 1 | 0,0–2,1 | You died ten seconds ago. | **Кадр 0:** герой з німбом висить у порожнечі, в руці парує кава, дивиться вгору й нічого не розуміє. Погойдується, блимає | 01 + пара (код) | тихий "магічний" фон |
| 2 | 2,4–3,4 | Hi. I'm God. | На "Hi" камера відʼїжджає й піднімається, і видно велетенського Бога, який махає рукою. Герой підскакує, чашка відлітає вгору з кадру, кава розбризкується. На "God" за Богом розкриваються промені | 02; 12 → 11; чашка з 15 | whoosh, сплеск, коротке хорове "а-а" |
| 3 | 3,8–4,6 | Heaven? Hell? | Зліва вискакує хмаринка з брамою, герой дивиться туди. Справа вискакує вогник з вилами, герой дивиться туди | 03 (+ дзеркально), хмаринка й вогник з 15 | 2× pop, арфа / "фух" вогню |
| 4 | 4,9–5,1 | Nope. | Бог махає пальцем "ні-ні", іконки лопаються з димком | 13 | "буп", 2× poof |
| 5 | 5,4–6,0 | You're going back. | Камера опускається, знизу виринає Земля. Герой дивиться вниз, зʼявляється крапля поту. Камера пірнає в Землю | 04, Земля з 15 | gulp, whoosh вниз |
| 6 | 6,4–9,5 | Over 100 billion people have ever lived. | Склейка: передній ряд людей з різних епох. Камера відʼїжджає вгору, і натовп тягнеться до горизонту. Лічильник 0 → 100,000,000,000+ доходить до кінця на "lived" | 16 (ріжу на 10 фігур, натовп збираю в коді) | гул натовпу, клацання лічильника, "дзинь" |
| 7 | 9,9–11,9 | Every single one of them... was you. | Камера пливе до героя, що висить перед натовпом. Видно, що в усіх ОДНЕ обличчя. На "you" герой у шоці, над КОЖНОЮ головою в натовпі спалахує німб, натовп синхронно підстрибує | 03 → 05 | акцент "вуф" у паузі після "you" |
| 8 | 12,3–14,5 | Every killer. And every victim. | Склейка: темна сцена з прожекторами. Зліва виїжджає лиходій у масці з битою, справа — переляканий з бинтом. Дивляться одне на одного, обидва пітніють | 10 (ріжу на 2) | низьке "дан", мʼякий "бум" |
| 9 | 15,0–15,3 | Why? | Знову порожнеча: герой знизує плечима й дивиться на Бога | 06, 11 | коротке "бонг?" |
| 10 | 15,6–16,8 | Because you haven't been born yet. | Бог нахиляється ближче. На "born" героєві в рот вискакує соска | 11, 07 | пищалка на "born" |
| 11 | 17,2–18,4 | When you've been everyone... | Фігури з натовпу спіраллю злітаються в героя, він розкидає руки й сяє дедалі сильніше | 09, фігури з 16 | наростання, багато "дзинь" |
| 12 | 18,7–19,2 | you'll hatch. | Герой згортається клубочком, навколо замикається яйце, по ньому біжить тріщина | 08 | "трісь" |
| 13 | 19,6–20,2 | As a god. | Яйце розлітається на уламки, герой виростає до розміру Бога, за ним промені | 09 | "бах" + хор |
| 14 | 20,6–22,2 | Everything you've ever seen... | Склейка: космос. Земля, Сонце й галактики пливуть | Земля з 15 | космічний ембієнт |
| 15 | 22,6–24,1 | ...is just the inside of your egg. | Камера відʼїжджає: весь космос виявляється всередині яйця в долонях Бога. Бог дивиться на яйце, а отже й на нас. У центрі світиться крихітний згорнутий герой. **На "egg" яйце видно повністю, камера зупиняється** | 14, 11, 08 | підйом звуку, удар на "egg" |
| 16 | 24,5–26,3 | Subscribe to see more. | Яйце хитається, вгорі тоненька тріщина зі світлом. Камера знову повільно наїжджає, наприкінці білий спалах → петля в кадр 0 | те саме | "трісь", whoosh у спалах |

## 4. Як генерувати в Google Flow

1. **Модель:** Nano Banana (у Flow генерація картинок безкоштовна). Усі 16 картинок роби на одній моделі.
2. **Роздільність:** максимальна, яку дає Flow. Від неї залежить якість 4K-рендеру.
3. **Формат:** вказаний біля кожної картинки. Якщо такого немає: 2:3 → 9:16, 4:5 → 3:4, 3:2 → 16:9.
4. **Порядок:** спершу **01**. Коли 01 подобається (простий персонаж, рівні товсті лінії, рівний блакитний фон), додавай її референсом до всіх наступних, як написано біля кожної (через @ або "ingredients").
5. **Варіанти:** на кожну картинку 2–4 варіанти, вибери найкращий, завантаж PNG.
6. **Перевірка кожної картинки:**
   - фон ОДНОГО рівного блакитного кольору, без градієнта й тіні;
   - усе повністю в кадрі й не торкається країв;
   - немає тексту;
   - немає нічого зайвого;
   - лінії замкнені.
   Дрібниці можна поправити ласо-інструментом Flow і текстом.
7. **Блакитний фон — це нормально:** Flow не робить прозорий фон, я виріжу його сам.
8. **Назви файлів:** точно як у списку (`01_hero_float.png` … `16_crowd.png`). Скинь мені всі 16, можна архівом.
9. **Якщо Flow не справляється з аркушем** (10, 15 або 16), генеруй предмети окремо й називай `15a_mug.png`, `15b_heaven.png`, `15c_hell.png`, `15d_earth.png`, `10a_villain.png`, `10b_victim.png`.

## 5. Промпти

### 01_hero_float — ГОЛОВНИЙ РЕФЕРЕНС
Формат 2:3 · Референс: немає
```
Full body, facing the viewer, centred, floating in the air with the legs dangling a little. A small golden-yellow halo ring floats just above the head (flat golden fill with the same black outline). The hand on the RIGHT side of the image holds a small red coffee mug by its handle at chest height. The other arm hangs relaxed. Confused expression: looking up towards the top left of the image, one eyebrow raised, a small round "o" mouth. Whole body and the halo in frame with a wide margin. Flat 2D cartoon character for an animated YouTube Short: a simple white character with a big round head, a small soft rounded body, thin noodle arms with simple four-finger hands, short legs with rounded feet. Thick smooth black outlines of even weight, flat white fill with a very soft pale-grey shade on one side, small solid black oval eyes, simple curved black eyebrows, no nose, no hair, no clothes, a pink tongue only when the mouth is open. Clean vector-like linework, flat colours, no texture, no text, no border, no blue colours on the character. The background is one plain flat solid light-blue colour (#9BCFFD) filling the whole image: no gradient, no ground, no floor shadow, no glow, no other objects.
```

### 02_hero_startled
Формат 2:3 · Референс: 01
```
Full body, facing the viewer, centred, jumping with fright: both arms thrown straight up, hands open and empty, body stretched tall, knees bent. Scared expression: eyebrows high, eyes wide, mouth wide open. The same small golden halo ring above the head. No mug, no objects, no clothes. Whole body and the halo in frame with a wide margin. Flat 2D cartoon in exactly the same drawing style as the reference image, the same character: a simple white character with a big round head, a small soft rounded body, thin noodle arms with simple four-finger hands, short legs with rounded feet, thick smooth black outlines of even weight, flat white fill with a very soft pale-grey shade on one side, small solid black oval eyes, simple curved black eyebrows, no nose, no hair, a pink tongue only when the mouth is open. Clean vector-like linework, flat colours, no texture, no text, no border, no blue colours on the character. The background is one plain flat solid light-blue colour (#9BCFFD) filling the whole image: no gradient, no ground, no floor shadow, no glow, no other objects.
```

### 03_hero_look_side
Формат 2:3 · Референс: 01
```
Full body, three-quarter view facing to the LEFT side of the image, floating with the legs dangling a little. Curious expression: head and eyes turned to the left side of the image, eyebrows raised, a small closed smile. Both hands empty, relaxed at the sides. The same small golden halo ring above the head. No mug, no clothes. Whole body and the halo in frame with a wide margin. Flat 2D cartoon in exactly the same drawing style as the reference image, the same character: a simple white character with a big round head, a small soft rounded body, thin noodle arms with simple four-finger hands, short legs with rounded feet, thick smooth black outlines of even weight, flat white fill with a very soft pale-grey shade on one side, small solid black oval eyes, simple curved black eyebrows, no nose, no hair, a pink tongue only when the mouth is open. Clean vector-like linework, flat colours, no texture, no text, no border, no blue colours on the character. The background is one plain flat solid light-blue colour (#9BCFFD) filling the whole image: no gradient, no ground, no floor shadow, no glow, no other objects.
```

### 04_hero_nervous
Формат 2:3 · Референс: 01
```
Full body, facing the viewer, centred, floating, looking DOWN towards the bottom of the image. Nervous "eek" expression: eyebrows tilted up in the middle, eyes looking down, a wide nervous grimace showing clenched white teeth. Both hands clasped together in front of the chest. The same small golden halo ring above the head. No mug, no clothes. Whole body and the halo in frame with a wide margin. Flat 2D cartoon in exactly the same drawing style as the reference image, the same character: a simple white character with a big round head, a small soft rounded body, thin noodle arms with simple four-finger hands, short legs with rounded feet, thick smooth black outlines of even weight, flat white fill with a very soft pale-grey shade on one side, small solid black oval eyes, simple curved black eyebrows, no nose, no hair, a pink tongue only when the mouth is open. Clean vector-like linework, flat colours, no texture, no text, no border, no blue colours on the character. The background is one plain flat solid light-blue colour (#9BCFFD) filling the whole image: no gradient, no ground, no floor shadow, no glow, no other objects.
```

### 05_hero_shocked
Формат 2:3 · Референс: 01
```
Full body, facing the viewer, centred, totally shocked: both hands pressed against the cheeks, jaw dropped with the mouth stretched very long and wide open, eyes huge, eyebrows very high. The same small golden halo ring above the head. No mug, no clothes. Whole body and the halo in frame with a wide margin. Flat 2D cartoon in exactly the same drawing style as the reference image, the same character: a simple white character with a big round head, a small soft rounded body, thin noodle arms with simple four-finger hands, short legs with rounded feet, thick smooth black outlines of even weight, flat white fill with a very soft pale-grey shade on one side, small solid black oval eyes, simple curved black eyebrows, no nose, no hair, a pink tongue only when the mouth is open. Clean vector-like linework, flat colours, no texture, no text, no border, no blue colours on the character. The background is one plain flat solid light-blue colour (#9BCFFD) filling the whole image: no gradient, no ground, no floor shadow, no glow, no other objects.
```

### 06_hero_shrug
Формат 2:3 · Референс: 01
```
Full body, facing the viewer, centred, a big "why?" shrug: both arms out to the sides with the elbows bent and the open palms facing up, shoulders raised. Looking up towards the top of the image, eyebrows raised and tilted, a small puzzled frown. The same small golden halo ring above the head. No mug, no clothes. Whole body and the halo in frame with a wide margin. Flat 2D cartoon in exactly the same drawing style as the reference image, the same character: a simple white character with a big round head, a small soft rounded body, thin noodle arms with simple four-finger hands, short legs with rounded feet, thick smooth black outlines of even weight, flat white fill with a very soft pale-grey shade on one side, small solid black oval eyes, simple curved black eyebrows, no nose, no hair, a pink tongue only when the mouth is open. Clean vector-like linework, flat colours, no texture, no text, no border, no blue colours on the character. The background is one plain flat solid light-blue colour (#9BCFFD) filling the whole image: no gradient, no ground, no floor shadow, no glow, no other objects.
```

### 07_hero_pacifier
Формат 2:3 · Референс: 01
```
Full body, facing the viewer, centred, floating, with an orange baby pacifier in the mouth. Confused, embarrassed expression: eyes wide, eyebrows tilted up. Both arms hanging stiffly at the sides. The same small golden halo ring above the head. No mug, no clothes. Whole body and the halo in frame with a wide margin. Flat 2D cartoon in exactly the same drawing style as the reference image, the same character: a simple white character with a big round head, a small soft rounded body, thin noodle arms with simple four-finger hands, short legs with rounded feet, thick smooth black outlines of even weight, flat white fill with a very soft pale-grey shade on one side, small solid black oval eyes, simple curved black eyebrows, no nose, no hair, a pink tongue only when the mouth is open. Clean vector-like linework, flat colours, no texture, no text, no border, no blue colours on the character. The background is one plain flat solid light-blue colour (#9BCFFD) filling the whole image: no gradient, no ground, no floor shadow, no glow, no other objects.
```

### 08_hero_curled
Формат 1:1 · Референс: 01
```
Full body, side view facing to the RIGHT side of the image, curled up into a ball like a sleeping unborn baby: knees pulled up to the chest, both arms hugging the knees, head tucked down a little, eyes closed as two curved lines, a peaceful small smile. No halo, no mug, no clothes. Whole body in frame with a wide margin. Flat 2D cartoon in exactly the same drawing style as the reference image, the same character: a simple white character with a big round head, a small soft rounded body, thin noodle arms with simple four-finger hands, short legs with rounded feet, thick smooth black outlines of even weight, flat white fill with a very soft pale-grey shade on one side, small solid black oval eyes, simple curved black eyebrows, no nose, no hair, a pink tongue only when the mouth is open. Clean vector-like linework, flat colours, no texture, no text, no border, no blue colours on the character. The background is one plain flat solid light-blue colour (#9BCFFD) filling the whole image: no gradient, no ground, no floor shadow, no glow, no other objects.
```

### 09_hero_god
Формат 2:3 · Референс: 01
```
Full body, facing the viewer, centred, floating, arms spread wide open to both sides with open hands, chest out, head tilted slightly up. Blissful expression: eyes closed as happy upward curves, a big wide smile. The same small golden halo ring above the head. No mug, no clothes. Whole body and the halo in frame with a wide margin. Flat 2D cartoon in exactly the same drawing style as the reference image, the same character: a simple white character with a big round head, a small soft rounded body, thin noodle arms with simple four-finger hands, short legs with rounded feet, thick smooth black outlines of even weight, flat white fill with a very soft pale-grey shade on one side, small solid black oval eyes, simple curved black eyebrows, no nose, no hair, a pink tongue only when the mouth is open. Clean vector-like linework, flat colours, no texture, no text, no border, no blue colours on the character. The background is one plain flat solid light-blue colour (#9BCFFD) filling the whole image: no gradient, no ground, no floor shadow, no glow, no other objects.
```

### 10_villain_victim (два персонажі на одному аркуші, я розріжу)
Формат 3:2 · Референс: 01
```
Two copies of the same character, full body, standing far apart with a wide empty gap of background between them, so they do not touch. On the LEFT side of the image: a cartoon villain version, three-quarter view facing to the right, wearing a black bandit eye mask, a sneaky mean grin, eyebrows angled down, holding a wooden baseball bat that rests on the shoulder. On the RIGHT side of the image: a scared victim version, three-quarter view facing to the left, a white bandage wrapped around the head with a round red bump on top, worried eyebrows tilted up, a wobbly frightened mouth, both hands raised in front of the chest. No halos, no other clothes. Both whole bodies in frame with a wide margin. Flat 2D cartoon in exactly the same drawing style as the reference image, the same character: a simple white character with a big round head, a small soft rounded body, thin noodle arms with simple four-finger hands, short legs with rounded feet, thick smooth black outlines of even weight, flat white fill with a very soft pale-grey shade on one side, small solid black oval eyes, simple curved black eyebrows, no nose, no hair, a pink tongue only when the mouth is open. Clean vector-like linework, flat colours, no texture, no text, no border, no blue colours on the character. The background is one plain flat solid light-blue colour (#9BCFFD) filling the whole image: no gradient, no ground, no floor shadow, no glow, no other objects.
```

### 11_god_neutral — РЕФЕРЕНС ДЛЯ 12–14
Формат 4:5 · Референс: 01
```
A giant, older and wiser version of the same character, waist-up, facing the viewer, centred: the same big round white head and small solid black oval eyes, but the eyes are calm and half-closed, simple curved eyebrows, a warm gentle smile, and a big fluffy white beard shaped like a soft cloud that covers the chin and the top of the chest (white fill, soft pale-grey shade, the same thick black outline). Both hands resting together in front of the belly. No halo, no crown, no clothes. Head, beard and hands fully in frame with a margin at the top and the sides; the body is cut off by the bottom edge of the image. Flat 2D cartoon in exactly the same drawing style as the reference image, the same character: a simple white character with a big round head, a small soft rounded body, thin noodle arms with simple four-finger hands, short legs with rounded feet, thick smooth black outlines of even weight, flat white fill with a very soft pale-grey shade on one side, small solid black oval eyes, simple curved black eyebrows, no nose, no hair, a pink tongue only when the mouth is open. Clean vector-like linework, flat colours, no texture, no text, no border, no blue colours on the character. The background is one plain flat solid light-blue colour (#9BCFFD) filling the whole image: no gradient, no ground, no floor shadow, no glow, no other objects.
```

### 12_god_wave
Формат 4:5 · Референс: 11
```
Edit of the reference picture: the same giant bearded character, the same size and the same position, but the hand on the RIGHT side of the image is now raised next to the head with the palm open towards the viewer, waving hello, and the smile is bigger and friendlier, with the eyes a little more open. The other hand stays where it was. Everything else identical. Flat 2D cartoon in exactly the same drawing style as the reference image: thick smooth black outlines of even weight, flat white fill with a very soft pale-grey shade, clean vector-like linework, flat colours, no texture, no text, no border. The background is one plain flat solid light-blue colour (#9BCFFD) filling the whole image: no gradient, no floor shadow, no glow, no other objects.
```

### 13_god_nope
Формат 4:5 · Референс: 11
```
Edit of the reference picture: the same giant bearded character, the same size and the same position, but the hand on the RIGHT side of the image is now raised next to the head with the index finger pointing up, wagging "no-no", and the expression is a playful smirk with one eyebrow raised. The other hand stays where it was. Everything else identical. Flat 2D cartoon in exactly the same drawing style as the reference image: thick smooth black outlines of even weight, flat white fill with a very soft pale-grey shade, clean vector-like linework, flat colours, no texture, no text, no border. The background is one plain flat solid light-blue colour (#9BCFFD) filling the whole image: no gradient, no floor shadow, no glow, no other objects.
```

### 14_god_hands
Формат 3:2 · Референс: 11
```
Only the two big hands of the same giant character, with no body and no face: four-finger cartoon hands with white fill, a very soft pale-grey shade and the same thick black outline, cupped together side by side with the palms facing up, seen from the front, empty, as if gently holding something round and precious. The wrists are cut off by the bottom edge of the image. Centred, with a margin at the top and the sides. Flat 2D cartoon in exactly the same drawing style as the reference image: thick smooth black outlines of even weight, flat colours, clean vector-like linework, no texture, no text, no border. The background is one plain flat solid light-blue colour (#9BCFFD) filling the whole image: no gradient, no shadow, no glow, no other objects.
```

### 15_props (чотири предмети на одному аркуші, я розріжу)
Формат 1:1 · Референс: 01
```
Four separate objects arranged in a 2 by 2 grid, with wide empty gaps of background between them, none touching each other: top left, a small red coffee mug seen from the side with dark brown coffee at the top and the handle on the right; top right, a fluffy white cloud with a small golden gate standing on top of it (heaven); bottom left, a red and orange cartoon flame with a small red devil pitchfork stuck in it (hell); bottom right, the planet Earth as a cartoon ball with medium-blue oceans, green continents and a few small white clouds. Flat 2D cartoon in exactly the same drawing style as the reference image: thick smooth black outlines of even weight, flat colours with one simple soft shade, clean vector-like linework, no texture, no text, no border, no characters. The background is one plain flat solid light-blue colour (#9BCFFD) filling the whole image: no gradient, no ground, no shadow, no glow.
```

### 16_crowd (десять людей з різних епох, я розріжу)
Формат 16:9 · Референс: 01
```
Ten copies of the same character in two neat rows of five, full body, all facing the viewer with friendly smiles, with clear empty background space between every character so none of them touch or overlap. Each one wears a different simple outfit or hat from a different time in history: a caveman fur tunic holding a wooden club; a gold and black striped Egyptian pharaoh headdress; a Roman soldier helmet with a red crest; a grey medieval knight helmet; a Viking helmet with horns; a pirate hat with an eye patch; a black top hat with a bow tie; a brown cowboy hat; a tall white chef hat; a yellow construction hard hat. The same face, the same body and the same white colour on all of them. No halos. All characters fully in frame with a margin. Flat 2D cartoon in exactly the same drawing style as the reference image, the same character: a simple white character with a big round head, a small soft rounded body, thin noodle arms with simple four-finger hands, short legs with rounded feet, thick smooth black outlines of even weight, flat white fill with a very soft pale-grey shade on one side, small solid black oval eyes, simple curved black eyebrows, no nose, no hair, a pink tongue only when the mouth is open. Clean vector-like linework, flat colours, no texture, no text, no border, no blue colours on the character. The background is one plain flat solid light-blue colour (#9BCFFD) filling the whole image: no gradient, no ground, no floor shadow, no glow, no other objects.
```

## 6. Що я роблю, коли отримаю картинки

1. Вирізаю фон, у тому числі закриті блакитні дірки (кільце німба, ґрати брами, проміжки між руками). Розрізаю аркуші 10, 15 і 16. Перевіряю кожну вирізку на кольоровому аркуші.
2. Підганяю розміри голів, ноги й руки (prep), вирівнюю пози Бога (11/12/13) по голові.
3. Збираю Remotion-проєкт: 2.5D-камера, заміна поз у русі (squash/stretch), фізика чашки й уламків, усі ефекти в коді.
4. Звуки: генерую через ElevenLabs (витрачає твої кредити ElevenLabs), кладу окремим шаром під голос.
5. Контактний аркуш кожного біту + перевірка на "стрибки" кадрів. Потім рендер 4K 2160×3840, 60 fps.
