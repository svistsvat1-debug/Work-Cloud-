# Prompts — "11-meter straw"

## A. ElevenLabs (озвучка)

- Voice: звичайний природний чоловічий голос, не глибокий, не диктор. Пошук у Voice Library: "natural conversational", Use case: Social media, English (American).
  Варіанти: **Tim Riley – Natural. Conversational** (1-й вибір), James – Natural, Jerry B., Alex.
- Model: Eleven v3 (або новіша модель, яка в тебе є — v4, якщо доступна). Текст БЕЗ тегів.
- Settings: Stability ~50 (Natural), Similarity ~75, Style 0, Speed 1.0 (якщо звучить повільно — 1.05).
- Формат: MP3 44.1 kHz 128 kbps+ (або WAV). 1 дубль, назви `take1.mp3`.

Текст (копіюй як є):

```
Why can't anyone drink through an eleven-meter straw? It's not about weak lungs. A straw doesn't actually suck your drink up. When you sip, you lower the pressure in your mouth, and the air outside pushes the drink up. But that push has a limit. Air can only hold up about ten meters of water. So even a perfect vacuum pump would leave the water stuck short of your lips.
```

## B. Google Flow (картинки)

Flow не робить прозорий фон → усе генеруємо на **суцільному чисто-зеленому фоні #00FF00**, я сам виріжу (key). Тому в персонажі/предметах НЕ має бути зеленого.

Порядок:
1. Згенеруй **H00 (hero)**. Вибери найкращий варіант.
2. Для всіх інших — додай H00 як reference / ingredient (в Flow: "Add image" / Ingredients) і встав промпт.
3. P07 роби як **edit** P06 (додай P06 як референс).
4. Назви файли як у таблиці (H00.png, P01.png …) і скинь мені (див. кінець файлу).

### Сталі блоки стилю (вже вставлені в кожен промпт нижче)

STYLE_CHAR = Flat 2D cartoon in exactly the same drawing style as the reference image: the same simple white character with a big round head, a small soft body, noodle arms with simple four-finger hands and short legs with rounded feet, thick smooth black outlines of even weight, flat white fill with a very soft pale-grey shade on one side, small solid black oval eyes, simple curved black eyebrows, no nose, no hair, no clothes, a pink tongue only when the mouth is open. Clean vector-like linework, flat colours, no texture, no text, no border. Whole figure centred with a wide empty margin on every side. The background is one plain flat solid pure green colour (#00FF00) filling the entire image: no floor, no ground line, no horizon, no gradient, no shadow.

STYLE_OBJ = Flat 2D cartoon in the same drawing style as the reference image: thick smooth black outlines of even weight, flat colours with one simple soft shade, clean vector-like linework, no texture, no text, no border, no characters. Centred with a wide empty margin on every side. The background is one plain flat solid pure green colour (#00FF00) filling the entire image: no floor, no ground line, no horizon, no gradient, no shadow. Nothing in the object is green.

---

### H00 — hero (9:16, без референсу)
```
Full body, three-quarter view facing to the right. A simple friendly cartoon character standing relaxed, arms down, small calm smile, mouth closed. Flat 2D cartoon: a simple white character with a big round head, a small soft body, noodle arms with simple four-finger hands and short legs with rounded feet, thick smooth black outlines of even weight, flat white fill with a very soft pale-grey shade on one side, small solid black oval eyes, simple curved black eyebrows, no nose, no hair, no clothes. Clean vector-like linework, flat colours, no texture, no text, no border. Whole figure centred with a wide empty margin on every side. The background is one plain flat solid pure green colour (#00FF00) filling the entire image: no floor, no ground line, no horizon, no gradient, no shadow.
```

### P01 — готовий пити (9:16, ref H00)
```
Full body, three-quarter view facing to the right. The character is happy and eager: eyebrows raised, eyes looking down to the right, mouth open in a wide smile showing a pink tongue. Both hands are raised in front of the chest on the right side of the image, fingers pinched together as if holding a thin vertical drinking straw just below the chin, but NO straw is drawn, the hands hold nothing. STYLE_CHAR
```

### P02 — величезний вдих (9:16, ref H00)
```
Full body, three-quarter view facing to the right. The character takes a huge deep breath: chest and belly puffed up big and round, shoulders raised, cheeks slightly puffed, mouth closed, eyes closed in two calm curved lines, eyebrows raised proudly. Both hands make fists raised at the sides like flexing. STYLE_CHAR
```

### P03 — п'є (9:16, ref H00)
```
Full body, three-quarter view facing to the right, leaning slightly forward. The character is sipping through a straw: lips pushed forward into a small round "o", cheeks slightly sucked in, eyes half closed and relaxed, eyebrows calm. Both hands are in front of the mouth on the right side of the image, fingers pinched together as if holding a thin vertical straw just below the lips, but NO straw is drawn, the hands hold nothing. STYLE_CHAR
```

### P04 — тягне з усіх сил (9:16, ref H00)
```
Full body, three-quarter view facing to the right, leaning forward, body tense, knees slightly bent. The character is sucking as hard as possible: eyes squeezed shut drawn as "> <" chevrons, eyebrows angled down hard, cheeks deeply sucked in, lips pushed forward into a tiny tight "o". Both hands are in front of the mouth on the right side of the image, fingers pinched together as if holding a thin vertical straw just below the lips, but NO straw is drawn, the hands hold nothing. STYLE_CHAR
```

### P05 — розгублений (9:16, ref H00)
```
Full body, three-quarter view facing to the right. The character is confused: eyes wide open, one eyebrow raised high and the other flat, mouth a small wavy line, head tilted, looking down to the right. The hand on the RIGHT side of the image is held at chest height with fingers pinched as if holding a thin straw (no straw drawn); the hand on the LEFT side of the image scratches the top of the head. STYLE_CHAR
```

### P06 — качає насос, ручка внизу (9:16, ref H00 + O02)
```
Full body, side view facing to the right. The character stands on the left, determined: eyebrows angled down, teeth clenched in a flat grin, knees bent. On the right side of the image stands the same grey hand vacuum pump as the second reference image (a tall metal cylinder on a small round base, a round pressure gauge on the side, a T-shaped handle on top). The character grips the T-handle with both hands and pushes it all the way DOWN, the handle rod is short. Both the character and the whole pump fully in frame. STYLE_CHAR
```

### P07 — качає насос, ручка вгорі (9:16, ref P06) — EDIT
```
The same picture as the reference image, with only one change: the T-shaped pump handle is pulled all the way UP so a long shiny metal rod shows between the handle and the cylinder, and the character is stretched up on tiptoes with arms raised holding the handle. The same character, the same pump in the same place, the same size, the same pure green #00FF00 background, everything else identical.
```

### P08 — "ну от" в камеру (9:16, ref H00)
```
Full body, facing the viewer, centred. The character looks straight at the viewer with a flat unimpressed expression: eyelids half closed over the eyes, eyebrows flat, mouth a short straight line. Arms hang down loosely at the sides, empty open hands. STYLE_CHAR
```

### O01 — склянка соку (1:1, ref H00 для стилю)
```
A tall simple drinking glass full of orange juice, front view, straight-sided glass slightly wider at the top, pale light-blue transparent-looking glass drawn with a thick black outline and two white glint lines, flat bright orange juice filling it to near the top with a lighter orange top surface ellipse, two pale ice cubes. No straw, no face, no table. STYLE_OBJ
```

### O02 — вакуумний насос окремо (1:1, ref H00 для стилю)
```
A cartoon hand vacuum pump standing upright, side view: a tall grey metal cylinder on a small round dark-grey base, a round white pressure gauge with a black needle and no numbers on the side, a red T-shaped handle on top with a short metal rod, a short black rubber hose coming out of the base to the right and ending in an open end. STYLE_OBJ
```

### S01 — будинок з балконом (9:16, ref H00 для стилю)
```
A simple tall narrow cartoon apartment building, straight-on front view, four storeys, pale cream-yellow walls with one soft shade, simple blue windows with white frames, a flat roof with a thin edge. On the top (fourth) floor a small concrete balcony slab sticks out to the RIGHT side of the building with a simple black-outlined metal railing on it; the balcony is empty. The building fills the full height of the image, the bottom edge of the building is a straight horizontal line, no ground, no door step, no trees. STYLE_OBJ
```

(Лінійку "10 m / 11 m", трубочку, траву, небо, хмарки-повітря, очі склянки, піт і сік у трубочці малюю кодом.)

---

## C. Як скинути мені результати

Найпростіше — один з варіантів:
1. **GitHub (найкраще):** завантаж файли у репозиторій у гілку `claude/nifty-pasteur-1gs52e`, папка `shorts/straw-11m/raw/` (H00.png, P01.png … S01.png, take1.mp3) → GitHub: Add file → Upload files.
2. **Google Drive:** поклади все в одну папку і скинь мені назву папки — я заберу через Drive.

Картинки — в максимальній якості (Download → full / upscale 2K/4K, якщо Flow дає).
