# Why Bees Die After Stinging You 🐝 — Крок 2: beat sheet + промпти для зображень

Метод: skill `cutout-cartoon-shorts`. Відступ від нього: замість Higgsfield зображення генеруються вручну в **Google Flow**. Flow не дає прозорого фону, тому кожну картинку робимо на суцільному світло-блакитному фоні `#9BCFFD`. Вирізаю на кроці 3 (key.py зі skill: заливка фону від країв + розблендинг чорного контуру).

Скрипт і джерела: `docs/shorts/why-bees-die-after-stinging.md`
Озвучка: `shorts/why-bees-die/vo/take1.mp3` · таймінги слів: `shorts/why-bees-die/vo/words.json`

---

## 1. QA озвучки (take1, Mark — Natural Conversations, eleven_v4)

- Тривалість 26,67 с, пік −3,6 dBFS, усі 70 слів прочитані правильно, теги вголос не зачитані.
- `[bee buzzing]` згенерувався: 0,30–0,98 с, ~−27 dB, тон ~235 Гц (частота помаху крил бджоли).
- `[angry bees swarming]` теж є: 21,8–22,8 с, але тихо (~−37 dB). На кроці 3 підкладаю окремий SFX рою поверх.
- Розділові знаки в нього свої ("Bee or wasp? Which is worse.") — на звучання не впливає.

## 2. Таблиця T (час композиції; голос стоїть на 0,1 с)

Довжина композиції = кінець голосу 26,5 + 0,1 + 0,5 ≈ **27,1 с** (1626 кадрів @ 60 fps).

```ts
export const T = {
  buzz: 0.40,        // SFX бджоли в голосі (0.40–1.08)
  line1: 1.42,       // "A honey bee..."
  sting1: 2.10,      // "sting"
  bug: 2.50,
  survive: 3.40,
  stingYou: 4.64,    // "Sting"
  you: 4.92,
  dies: 5.96,
  skin: 7.04,        // "Your skin..." (фраза з 6.92)
  barbed: 8.10,
  pulling: 9.16,
  rips: 9.72,
  stinger: 10.56,
  venomSac: 11.22,
  belly: 12.58,
  thatStinger: 13.42,
  pumping: 14.18,
  minute: 15.46,
  fast: 16.68,
  itAlso: 17.70,
  banana: 18.66,
  alarm: 19.40,
  calls: 20.24,
  bees: 20.90,
  you2: 21.14,
  swarm: 21.90,      // SFX рою в голосі (21.90–22.90)
  beeOrWasp: 23.18,
  wasp: 23.74,
  whichIsWorse: 24.52,
  worse: 24.80,
  subscribe: 25.64,
  voiceEnd: 26.60,
  end: 27.10,
};
```

## 3. Beat sheet

Світ: сонячний луг. Персонаж-«you» — білий хлопець із круглою головою. Бджола — кругла, тепла, жовто-коричнева. «Bug» — **оса**: саме проти ос і шершнів бджола жалить і зазвичай виживає (Gu et al. 2021). У фіналі та сама оса повертається на "Bee or wasp?". Шершень — теж оса. Дальній план: вулик-сапетка, якому код домалює обличчя.

| Час (голос) | Слова | На екрані | Картинки | Звук |
|---|---|---|---|---|
| 0,0–1,3 | (дзижчання) | **Frame 0 = premise:** луг, хлопець праворуч, велика ромашка ліворуч, бджола на квітці, до неї підкрадається оса. Далеко — вулик | 01, 19, 07, 14, 18, (20) | дзижчання (в голосі) |
| 1,3–2,6 | A honey bee can **sting** a bug | на "sting" бджола (08) робить ривок і жалить осу; оса (15) зіщулюється від болю й відлітає назад | 08, 15 | whoosh + «пок» |
| 2,6–4,0 | and usually **survive**. | бджола задоволено робить петлю, жало ціле (блиск — код); оса тікає за лівий край | 07 | swish + «дзинь» |
| 4,5–5,3 | **Sting you**, | камера плавно їде до хлопця (02, рука вперед); бджола сідає на кисть і на "you" жалить (08 мала); хлопець → 03 «ай» | 02, 03, 08 | укол + удар |
| 5,6–6,4 | and it **dies**. | наїзд на кисть: бджола (09) в шоці дивиться в камеру — «ой-ой» | 09 | драматичний акцент |
| 6,8–8,7 | Your **skin** snags its **barbed** stinger. | **зріз шкіри**: перехід через коло-лупу на кисті. Блок шкіри (21), у ньому жало (22), зверху бджола (10) тягнеться вгору. На "barbed" — блиски на зазубринах (код) | 21, 22, 10 | zoom-whoosh, «дзинь» ×3 |
| 9,1–12,9 | Pulling away **rips** out the **stinger**, **venom sac**, and part of its **belly**. | squash → на "rips" бджола відривається вгору, жало з мішечком лишається в шкірі; бджола (11) з запамороченням відлітає вгору. Підсвітки по черзі: жало → мішечок → шматок черевця | 10→11, 22 | розрив, «боінг» |
| 13,3–17,2 | That stinger keeps **pumping** venom for up to a **minute**, so get it out **fast**. | мішечок пульсує (код), краплі отрути йдуть по жалу (код); на "minute" вискакує секундомір (23), стрілка біжить. На "fast" — кадр хлопця (04), він виймає жало, жало крутиться й вилітає з кадру | 23, 04, 22 | «блюп-блюп», тікання, «клац» |
| 17,6–21,5 | It also releases a **banana**-scented **alarm** that **calls** more **bees** to **you**. | з кисті піднімається жовта хмаринка запаху з бананом (24), пливе до вулика; на "alarm" вулик (18) розплющує злі очі (код); на "calls more bees" з входу вилітає рій (12 ×10–15); на "you" хлопець → 05 (крапля поту — код) | 24, 18, 12, 05 | «нюх», тривожне «дінь-дінь», рій наростає |
| 21,5–23,0 | (рій) | хлопець тікає праворуч (06), рій за ним, камера панорамує | 06, 12 | рій голосніше, тупіт |
| 23,1–24,0 | **Bee** or **wasp**? | дуель: бджола (13) ліворуч, оса (16) праворуч з пластирем на попі (код), між ними «VS» (код) | 13, 16 | два whoosh-in |
| 24,4–25,2 | Which is **worse**. | обидві нахиляються до камери, підскок на "worse" | — | легкий удар |
| 25,5–26,5 | **Subscribe** for more! | знизу виїжджає червона кнопка SUBSCRIBE (код); оса (17) кілька разів жалить її — це візуальний факт «оса жалить багато разів». Петля: оса вилітає ліворуч → frame 0 | 17 | клац ×3 |

Звуки (крок 3): whoosh/swish/«пок» з бібліотеки власника — [MISSING], є? Решту генерую або підбираю.

---

## 4. Як генерувати в Google Flow

1. **Модель:** Nano Banana Pro (найвища якість у Flow). Якщо щось не виходить — спробуй Nano Banana 2.1.
2. **Якість:** максимальна роздільність, яку дає Flow. Якщо є вибір — PNG, а не JPG.
3. **Порядок:**
   - спершу **01** без референсів. Згенеруй кілька варіантів і вибери найкращий — це «еталон» стилю;
   - потім **07** (бджола) і **14** (оса) з 01 як референсом;
   - решту — з референсами, вказаними в кожному промпті.
   - «EDIT»: додай вказану картинку як референс і встав промпт як є — модель змінить тільки описане.
4. **Перевірка кожної картинки:**
   - фон рівний, суцільний блакитний, без землі й тіні;
   - фігура повністю в кадрі з запасом;
   - контури чорні й замкнені;
   - немає тексту.
   Якщо щось не так — перегенеруй.
5. **Назви файлів:** як у списку, наприклад `01_guy_hero.png`. Якщо перейменувати незручно — скинь по порядку, я розберуся.
6. **Скинути:** усі файли сюди в чат.

★ — обов'язково · ○ — опційно, без них теж зберу.

**Опис хлопця** використовується тільки в 01. Далі його тримає референс.

---

## 5. Промпти (копіювати повністю, кожен самодостатній)

### Персонаж «you» — хлопець

**01_guy_hero** ★ · 3:4 · референсів немає
```
Full-body character of a simple white cartoon guy with a big round head, a small soft body, noodle arms with simple four-finger hands, short legs with rounded feet, small solid black oval eyes, simple curved black eyebrows, no nose, no hair, no clothes. Three-quarter view, body and face turned toward the left side of the image, standing relaxed, both arms hanging loosely, a calm small closed-mouth smile. Style: flat 2D cartoon with clean vector-like linework, thick smooth black outlines of even weight, flat colours with one very soft pale-grey shade on one side, simple and cute, no texture, no gradients, no text, no letters, no numbers, no border. Background: plain flat solid light-blue (#9BCFFD) filling the whole image, nothing else: no ground, no floor, no shadow, no scenery. The whole character is inside the frame with a wide empty margin on every side.
```

**02_guy_hand_out** ★ · 3:4 · референс: 01
```
The same white cartoon guy as in the reference image, same drawing style. Full body, three-quarter view facing the left side of the image. The arm on the left side of the image is stretched straight forward at shoulder height, hand open, palm down, fingers together; the other arm hangs relaxed. He looks at the back of the stretched hand with raised eyebrows and a small curious smile. Flat 2D cartoon, thick smooth black outlines of even weight, flat colours, no texture, no text. Background: plain flat solid light-blue (#9BCFFD) filling the whole image, nothing else: no ground, no floor, no shadow. The whole body is inside the frame with a wide empty margin.
```

**03_guy_ouch** ★ · 3:4 · EDIT, референс: 02
```
Edit the reference image. Keep the same guy, the same pose, and the stretched arm and hand in exactly the same position and size. Change only the face and the other arm: eyes squeezed shut, drawn as two small black sideways V shapes pointing at each other, eyebrows pinched together, mouth wide open yelling with a pink tongue; the other arm thrown up in shock with fingers spread. Everything else identical. Keep the plain flat solid light-blue (#9BCFFD) background, no shadow, no text.
```

**04_guy_pinch** ★ · 3:4 · референс: 01
```
The same white cartoon guy as in the reference image, same drawing style. Waist-up close-up, facing the viewer, centred. He holds the hand on the left side of the image up at chest height with the back of the hand toward the viewer. With the other hand he pinches the back of that hand between thumb and index finger, as if quickly pulling out a tiny splinter; nothing is visible between the fingers. Face: focused and worried, eyebrows tilted, eyes looking down at the hand, lips pressed together. Flat 2D cartoon, thick smooth black outlines of even weight, flat colours, no texture, no text. Background: plain flat solid light-blue (#9BCFFD) filling the whole image, nothing else, no shadow. Head and both hands fully inside the frame with a margin.
```

**05_guy_scared** ★ · 3:4 · референс: 01
```
The same white cartoon guy as in the reference image, same drawing style. Full body, facing the viewer, slightly turned toward the left side of the image, knees a little bent. Scared: eyebrows tilted up in the middle, wide eyes with tiny pupils, mouth wide open with a pink tongue, both hands raised beside his head with palms out and fingers spread. Flat 2D cartoon, thick smooth black outlines of even weight, flat colours, no texture, no text. Background: plain flat solid light-blue (#9BCFFD) filling the whole image, nothing else: no ground, no floor, no shadow. The whole body is inside the frame with a wide empty margin.
```

**06_guy_run** ○ · 3:4 · референси: 01, 05
```
The same white cartoon guy as in the reference images, same drawing style. Full body, side view, running fast toward the right side of the image, mid-stride with one leg far forward and one far back, arms flailing above his head, scared face looking back over his shoulder toward the left side of the image: eyebrows up, wide eyes, mouth wide open. Flat 2D cartoon, thick smooth black outlines of even weight, flat colours, no texture, no text, no motion lines. Background: plain flat solid light-blue (#9BCFFD) filling the whole image, nothing else: no ground, no shadow. The whole body is inside the frame with a wide empty margin.
```

### Бджола

**07_bee_hero** ★ · 1:1 · референс: 01 (тільки стиль)
```
A cute chubby cartoon worker honey bee, drawn in exactly the same drawing style as the reference image (same outline weight, same simple solid black eyes). A round golden-yellow body with three thick dark-brown stripes, a round dark-brown head with big solid black oval eyes with a small white glint, two short curly antennae, two small rounded white wings with a pale-grey shade, six thin black legs, and a small pointed dark-brown stinger at the tip of the abdomen. Side view, flying toward the right side of the image, wings raised, happy face with a small open smile. The stinger is clearly visible. Only the bee, no other characters. Flat 2D cartoon, thick smooth black outlines, flat colours, no texture, no text. Background: plain flat solid light-blue (#9BCFFD) filling the whole image, nothing else, no shadow. The whole bee is inside the frame with a wide empty margin.
```

**08_bee_sting** ★ · 1:1 · референс: 07
```
The same honey bee as in the reference image, same drawing style. Side view facing the right side of the image, in a stinging pose: the abdomen curled down and forward under its body, the stinger pointing down and forward, wings raised, determined face with angry eyebrows tilted down to the middle and a gritted-teeth grin. Flat 2D cartoon, thick smooth black outlines, flat colours, no texture, no text. Background: plain flat solid light-blue (#9BCFFD) filling the whole image, nothing else, no shadow. The whole bee is inside the frame with a wide empty margin.
```

**09_bee_uhoh** ★ · 1:1 · EDIT, референс: 08
```
Edit the reference image. Keep the same bee in exactly the same pose, position and size. Change only the face: shocked, eyebrows raised high, wide eyes with small pupils looking straight at the viewer, a tiny round open mouth. Everything else identical. Keep the plain flat solid light-blue (#9BCFFD) background, no shadow, no text.
```

**10_bee_torn_pull** ★ · 1:1 · референс: 07
```
The same honey bee as in the reference image, same drawing style, big and centred. Side view facing the right side of the image, body tilted so the abdomen points straight down, wings beating upward hard as if pulling up with all its strength. Straining face: eyes squeezed shut, teeth clenched. The tip of the abdomen is torn off: the abdomen ends in a ragged, jagged open edge, and there is no stinger. Cute cartoon, not gory. Flat 2D cartoon, thick smooth black outlines, flat colours, no texture, no text. Background: plain flat solid light-blue (#9BCFFD) filling the whole image, nothing else, no shadow. The whole bee is inside the frame with a wide empty margin.
```

**11_bee_torn_dizzy** ★ · 1:1 · EDIT, референс: 10
```
Edit the reference image. Keep the same bee with the same torn, ragged abdomen end and the same size. Change the pose and face: floating limp and tilted, wings drooping, dizzy spiral eyes, a wobbly open mouth. Everything else identical. Keep the plain flat solid light-blue (#9BCFFD) background, no shadow, no text.
```

**12_bee_angry** ★ · 1:1 · референс: 07
```
The same honey bee as in the reference image, same drawing style. Side view, flying fast toward the left side of the image, body leaning forward, stinger at the back, angry face: thick eyebrows tilted down to the middle, narrowed eyes, frowning mouth. Flat 2D cartoon, thick smooth black outlines, flat colours, no texture, no text, no motion lines. Background: plain flat solid light-blue (#9BCFFD) filling the whole image, nothing else, no shadow. The whole bee is inside the frame with a wide empty margin.
```

**13_bee_smug** ★ · 1:1 · референс: 07
```
The same honey bee as in the reference image, same drawing style. Three-quarter front view, hovering, turned toward the right side of the image, front legs crossed over its chest like folded arms, smug face: half-closed eyelids, one eyebrow raised, a confident sideways smile. The stinger is visible. Flat 2D cartoon, thick smooth black outlines, flat colours, no texture, no text. Background: plain flat solid light-blue (#9BCFFD) filling the whole image, nothing else, no shadow. The whole bee is inside the frame with a wide empty margin.
```

### Оса

**14_wasp_hero** ★ · 1:1 · референси: 07, 01
```
A lean, mean cartoon wasp, drawn in exactly the same drawing style as the reference images (same outline weight, same simple cartoon eyes), clearly bigger and longer than the honey bee in the reference. Bright lemon-yellow body with sharp black stripes, a very thin pinched waist, a long pointed abdomen ending in a sharp black stinger, an angular head with narrow slanted eyes and thick angry black eyebrows, two long narrow pale-grey wings, thin black legs. Side view, flying toward the left side of the image, sneaky evil grin showing teeth. Only the wasp, no other characters. Flat 2D cartoon, thick smooth black outlines, flat colours, no texture, no text. Background: plain flat solid light-blue (#9BCFFD) filling the whole image, nothing else, no shadow. The whole wasp is inside the frame with a wide empty margin.
```

**15_wasp_ouch** ★ · 1:1 · EDIT, референс: 14
```
Edit the reference image. Keep the same wasp at the same size and position. Change the pose and face: body jolted and arched backward in pain, eyes squeezed shut, mouth wide open yelling, legs splayed. Everything else identical. Keep the plain flat solid light-blue (#9BCFFD) background, no shadow, no text.
```

**16_wasp_smug** ★ · 1:1 · референс: 14
```
The same wasp as in the reference image, same drawing style. Three-quarter front view, hovering, turned toward the left side of the image, front legs crossed over its chest like folded arms, smug face: half-closed eyelids, a sly sideways grin. The stinger is visible. Flat 2D cartoon, thick smooth black outlines, flat colours, no texture, no text. Background: plain flat solid light-blue (#9BCFFD) filling the whole image, nothing else, no shadow. The whole wasp is inside the frame with a wide empty margin.
```

**17_wasp_jab** ○ · 1:1 · референс: 14
```
The same wasp as in the reference image, same drawing style. Side view facing the right side of the image, the abdomen swung forward between its legs so the stinger points straight forward, jabbing at something, gleeful face with a wide grin. Flat 2D cartoon, thick smooth black outlines, flat colours, no texture, no text, no motion lines. Background: plain flat solid light-blue (#9BCFFD) filling the whole image, nothing else, no shadow. The whole wasp is inside the frame with a wide empty margin.
```

### Сет і пропси

**18_hive** ★ · 3:4 · референс: 01 (тільки стиль)
```
A classic dome-shaped straw beehive (bee skep) made of coiled straw rings, golden-tan, with a small dark arched entrance hole at the bottom, standing on a short wooden stand. The front of the dome has a smooth, plain area without details. No bees, no face, no characters. Drawn in exactly the same drawing style as the reference image: flat 2D cartoon, thick smooth black outlines of even weight, flat colours with one soft shade, no texture, no text. Background: plain flat solid light-blue (#9BCFFD) filling the whole image, nothing else: no ground, no grass, no shadow. The whole object is inside the frame with a wide empty margin.
```

**19_flower** ★ · 3:4 · референс: 01 (тільки стиль)
```
One big simple cartoon daisy on a tall green stem with two leaves: white rounded petals, a yellow centre, the flower head facing the viewer. No insects, no characters. Drawn in exactly the same drawing style as the reference image: flat 2D cartoon, thick smooth black outlines of even weight, flat colours, no texture, no text. Background: plain flat solid light-blue (#9BCFFD) filling the whole image, nothing else: no ground, no grass, no shadow. The whole flower is inside the frame with a wide empty margin.
```

**20_meadow_row** ○ · 16:9 · референс: 01 (тільки стиль)
```
A row of five separate small meadow plants standing side by side on the same baseline with clear empty gaps between them: a clump of green grass, a small pink flower, a round green bush, a three-leaf clover, a small yellow flower. No characters. Drawn in exactly the same drawing style as the reference image: flat 2D cartoon, thick smooth black outlines of even weight, flat colours, no texture, no text. Background: plain flat solid light-blue (#9BCFFD) filling the whole image, nothing else: no ground line, no shadow. Every plant fully inside the frame.
```

**21_skin_section** ★ · 4:3 · референс: 01 (тільки стиль)
```
A simple cartoon cross-section block of human skin, seen from the side like a slice of layered cake: a thin pale-peach top layer (the surface), a thick pink middle layer with two simple red wavy blood vessels running through it, and a pale-yellow bottom layer of small round fat cells. Thick black outline around the whole block and between the layers. Educational and cute, not gory. Drawn in exactly the same drawing style as the reference image: flat 2D cartoon, flat colours, no texture, no text, no labels. Background: plain flat solid light-blue (#9BCFFD) filling the whole image, nothing else, no shadow. The whole block is inside the frame with a margin.
```

**22_stinger** ★ · 3:4 · референс: 07 (кольори бджоли)
```
A large educational cartoon close-up of a honey bee stinger that has been torn off the bee, pointing straight down: a long thin dark-brown stinger shaped like a harpoon with clearly visible backward-pointing barbs along both edges; at its top, a round pale-yellow venom sac; above that, a small torn piece of the bee's golden-yellow and dark-brown striped belly with a ragged edge at the very top. Cute, not gory. No bee, no characters. Drawn in exactly the same drawing style as the reference image: flat 2D cartoon, thick smooth black outlines, flat colours, no texture, no text, no labels. Background: plain flat solid light-blue (#9BCFFD) filling the whole image, nothing else, no shadow. The whole object is inside the frame with a wide empty margin.
```

**23_stopwatch** ★ · 1:1 · референс: 01 (тільки стиль)
```
A cartoon stopwatch: a round silver-grey case with a small button on top and a plain white face with only short black tick marks around the edge, with no numbers and no hands. Drawn in exactly the same drawing style as the reference image: flat 2D cartoon, thick smooth black outlines, flat colours, no texture, no text. Background: plain flat solid light-blue (#9BCFFD) filling the whole image, nothing else, no shadow. The whole stopwatch is inside the frame with a wide empty margin.
```

**24_banana** ★ · 1:1 · референс: 01 (тільки стиль)
```
One simple cartoon banana, slightly curved, bright yellow with a small brown tip at each end. Drawn in exactly the same drawing style as the reference image: flat 2D cartoon, thick smooth black outlines, flat colours, no texture, no text. Background: plain flat solid light-blue (#9BCFFD) filling the whole image, nothing else, no shadow. The whole banana is inside the frame with a wide empty margin.
```

---

## 6. Що в коді, а не в картинках (крок 3)

Обличчя вулика (очі розплющуються, злі брови), блиски на зазубринах, пульсація мішечка, краплі отрути, стрілка секундоміра, хмаринка запаху (жовта, з контуром), крапля поту, пластир на осі, «VS», кнопка SUBSCRIBE, небо й земля, тінь під хлопцем, 2.5D камера, коло-лупа для зрізу шкіри.
