# Flamingo on one leg — beat sheet і промпти картинок

Озвучка: `public/flamingo/vo/take1.mp3` (Mark - Natural Conversations, eleven_v4, 24.27 с, записав власник).
Голос стартує на 0.10 с, композиція 25.0 с (1500 кадрів, 60 fps).

## Текст (як записано)

1. A dead flamingo can still hold its own weight on one leg.
2. But not on two.
3. Researchers found this using two flamingo bodies from a zoo.
4. With the foot right under the body, the leg joints held firm, with no muscles working.
5. On two legs, the pose wouldn't hold.
6. Living flamingos even sway less once they doze off.
7. So for a flamingo, one leg is probably less work than two.

## Beat sheet (час у композиції = час слова + 0.10 с)

| Час, с | Слова | На екрані | Картинка | Гег | Звук |
|---|---|---|---|---|---|
| 0.0–3.4 | A dead flamingo ... on one leg | Кадр 0: «мертвий» фламінго стоїть на одній нозі, по центру, великий. Повільний наїзд, на «one leg» камера опускається до ноги | flam_dead_one | німб над головою, муха кружляє | дзижчання мухи, pop на «leg» |
| 4.1–5.6 | But not on two | на «not» друга нога опускається, на «two» фламінго складається в купу | flam_dead_two → flam_dead_heap | німб падає і дзенькає по купі | boing, thud, ting (у паузі) |
| 5.6–8.6 | Researchers ... two flamingo bodies from a zoo | камера від'їжджає: дослідник із планшетом, друге тіло, позаду ворота ZOO | sci_note, flam_dead_heap x2, gate | купи підстрибують по черзі на «two ... bodies», вивіска на «zoo» | олівець шкрябає, whoosh камери |
| 8.6–12.3 | With the foot right under the body, the leg joints held firm | дослідник піднімає фламінго і ставить на одну ногу; пунктир від ноги до центру тіла; наїзд на суглоби, на них клацають замки | sci_hold, flam_dead_one | язик висолоплений від старання | pop, 2 клацання замка |
| 12.3–14.1 | with no muscles working | дослідник відпускає і відскакує; вітер хитає фламінго, той пружинить назад і стоїть | sci_wow | крапля поту в дослідника | порив вітру, wobble |
| 14.5–16.7 | On two legs, the pose wouldn't hold | другу ногу опускають, коліна тремтять, на «hold» фламінго складається | sci_hold → sci_note, flam_dead_two → flam_dead_heap | німб знову падає, дослідник незворушно записує | тремтіння, thud, ting |
| 17.0–19.9 | Living flamingos even sway less once they doze off | різка склейка: ставок, живий фламінго на одній нозі хитається; на «doze» заплющує око, хитання затихає | flam_live_one → flam_sleep_one | Zzz і бульбашка з носа | плескіт ставка, хропіння |
| 20.4–24.4 | So for a flamingo, one leg is probably less work than two | камера від'їжджає: поруч другий фламінго на двох ногах тремтить і пітніє; на «two» він підтискає ногу і теж засинає | flam_live_two → flam_live_one → flam_sleep_one | краплі поту, полегшене «фух» | тремтіння, pop, хропіння |
| 24.4–25.0 | (тиша) | наїзд на сплячого фламінго на одній нозі, кадр повторює кадр 0 | flam_sleep_one | петля в кадр 0 | — |

## Модель і налаштування

ElevenLabs → GPT Image 2.5 Sunburst. Персонажі: 2:3, 4K, quality high. Декорації: 3:2, 2K, high.
Прозорого фону модель не дає, тому кожна картинка — на рівному блакитному фоні `#9BCFFD`, далі `key.py` вирізає фон.
Порядок: спершу hero (01) і дослідник (07); вони йдуть як референс для решти поз.

## Спільні блоки

**BG** (на початок кожного промпту):
```
Background: one perfectly flat, uniform, solid light-blue colour (#9BCFFD) filling the whole image, with no ground, no floor shadow, no horizon, no gradient and nothing else in the picture.
```

**STYLE** (у кінець кожного промпту):
```
Style: flat 2D cartoon cut-out sprite for an animation, drawn like a simple modern YouTube cartoon: thick smooth black outlines of even weight, flat colours with one very soft slightly darker shade on one side, clean vector-like linework.
Constraints: no texture, no gradients, no text, no border, no extra objects, no blue anywhere on the subject.
```

**FLAM_DESIGN**:
```
Design: bright pink egg-shaped body with a small tuft of pointed tail feathers, a long thin pink neck, a round head that is a bit oversized so the face reads clearly, a big downward-curved beak that is cream-white with a black tip, long thin pink stick legs with a round knobby joint in the middle and a small flat webbed foot.
```

**SCI_DESIGN**:
```
Design: a simple white cartoon character with a big round head, a small soft body, noodle arms with simple four-finger hands and short legs with rounded feet, flat white fill with a very soft pale-grey shade on one side, small solid black oval eyes, simple curved black eyebrows, no nose, no hair. He wears a short open white lab coat with a black outline, two black buttons and a red pen in the chest pocket.
```

## Картинки

Кожен промпт = BG + Subject (нижче) + DESIGN + STYLE.

### Фламінго (референс для 02–06 — картинка 01)

01 `flam_dead_one` (hero, кадр 0), 2:3
```
Subject: a single cartoon flamingo, full body, exact side view facing to the right, the whole flamingo in frame with a wide margin on every side. The flamingo is comically knocked out but still standing perfectly upright on ONE straight vertical leg; its other leg is folded up and tucked against its belly. The standing foot is directly below the middle of the body. The neck droops forward in a limp curve and the head hangs down in front of the chest. The eye is a big black X, and a small pink tongue hangs out of the side of the beak.
```

02 `flam_dead_two`, 2:3
```
Subject: the same flamingo as in the reference image, same size, same colours, same side view facing to the right, whole body in frame with a wide margin. Now BOTH legs are down and straight, a little apart, so it stands on two legs. The body sags slightly, the neck droops forward in a limp curve, the head hangs down. The eye is a big black X, and a small pink tongue hangs out of the beak.
```

03 `flam_dead_heap`, 3:2
```
Subject: the same flamingo as in the reference image, same colours and line weight, collapsed on the ground in a funny limp heap, side view: the body lies on its belly, both long legs are splayed out and bent in different directions, the neck is flopped flat along the ground toward the right side of the image. The eye is a big black X, a small pink tongue hangs out. A wide, low shape, whole heap in frame with a wide margin.
```

04 `flam_live_one`, 2:3
```
Subject: the same flamingo as in the reference image, same size, same colours, exact side view facing to the right, whole body in frame with a wide margin. It is alive and awake, standing on ONE straight vertical leg with the other leg folded up and tucked against its belly; the standing foot is directly below the middle of the body. The neck is upright in a neat S-curve with the head held high. A simple round black eye with a small white glint, calm friendly look, beak closed.
```

05 `flam_sleep_one`, 2:3 (редагування картинки 04, референс тільки вона)
```
Change: the eye is now closed, drawn as one small downward-curved black line, with a peaceful sleeping look.
Preserve: everything else exactly — the pose, the one-legged stance, the body, neck, head position, beak, legs, colours, outline weight, framing and the flat light-blue background.
Constraints: no extra objects, no text, no "Z" letters.
```

06 `flam_live_two`, 2:3
```
Subject: the same flamingo as in the reference image, same size, same colours, exact side view facing to the right, whole body in frame with a wide margin. It is alive and standing on TWO legs with both knees slightly bent, clearly making an effort: the body is tense, the neck is upright in an S-curve, a wide round worried black eye with a white glint, one small raised eyebrow line, the beak clenched in a strained grimace.
```

### Дослідник (референс для 08–09 — картинка 07)

07 `sci_note`, 2:3
```
Subject: a single cartoon researcher, full body, three-quarter view facing to the right, whole body in frame with a wide margin. He holds a brown clipboard with a white sheet in the hand on the LEFT side of the image and a yellow pencil in the hand on the RIGHT side of the image, as if taking notes. Curious face: one eyebrow raised, small closed mouth.
```

08 `sci_hold`, 2:3
```
Subject: the same researcher as in the reference image, same size, same colours, full body, three-quarter view facing to the right, whole body in frame with a wide margin. Both arms are stretched forward toward the RIGHT side of the image at chest height, hands open as if carefully holding something upright in front of him. The hands are empty. Focused face, the tip of a pink tongue sticking out of the corner of the mouth.
```

09 `sci_wow`, 2:3
```
Subject: the same researcher as in the reference image, same size, same colours, full body, three-quarter view facing to the right, leaning back slightly, whole body in frame with a wide margin. Both arms are raised with open empty hands. Amazed face: eyebrows high, wide eyes, mouth open in a round "o" with a pink tongue visible.
```

### Декорації (без SCI/FLAM DESIGN)

10 `gate`, 3:2
```
Subject: a simple cartoon wooden zoo entrance gate, front view, symmetrical, whole gate in frame with a wide margin: two thick brown wooden posts and a curved wooden sign board across the top. EXACT TEXT on the board: ZOO, in big bold cream-white capital letters, verbatim — no extra characters.
```
(у блоці Constraints для цієї картинки прибрати "no text")

11 `reeds`, 3:2
```
Subject: a row of three separate clumps of green pond reeds with brown cattail tops, side view. Each clump stands apart from the others with clear empty space between them, all on the same baseline, whole row in frame with a wide margin.
```

## Звуки (ElevenLabs Sound Effects v2) і музика (ElevenLabs Music v2.5)

| Файл | Промпт | Тривалість |
|---|---|---|
| fly | Sound effect only, no music, no voice: a single small cartoon fly buzzing around, light and comic | 3 с |
| pop | Sound effect only, no music, no voice: one short soft cartoon pop | 0.5 с |
| boing | Sound effect only, no music, no voice: one short rubbery cartoon wobble boing | 1 с |
| thud | Sound effect only, no music, no voice: a soft heavy cartoon body flop onto the ground with a feathery puff | 1 с |
| ting | Sound effect only, no music, no voice: one tiny bright metallic ting, like a small ring dropping on a pillow | 1 с |
| whoosh | Sound effect only, no music, no voice: one soft short airy whoosh | 1 с |
| scribble | Sound effect only, no music, no voice: a pencil quickly scribbling on paper | 1.5 с |
| click | Sound effect only, no music, no voice: one small crisp padlock click | 0.5 с |
| wind | Sound effect only, no music, no voice: one short gust of wind passing by | 1.5 с |
| rattle | Sound effect only, no music, no voice: cartoon knees knocking and trembling, light wooden rattle | 1.5 с |
| snore | Sound effect only, no music, no voice: a soft cute cartoon snore with a little whistle, one breath in and out | 2 с |
| pond | Sound effect only, no music, no voice: calm pond ambience, gentle water lapping, a few distant birds | 8 с, loop |
| music | Light playful instrumental bed for a short science cartoon: pizzicato strings, soft marimba and a gentle bass, medium tempo, curious and friendly, no vocals, no big build-ups | 26 с, instrumental |
