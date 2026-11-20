# Звіт — kitefin-headlights (#47)

**Сценарій (Liam, 67 слів, 23,12 с мови):**
A six-foot shark glows in the pitch-black sea. / Everyone said it's hiding: the glow erases its shadow from below. / But
nothing is known to hunt it. / So who's it hiding from? / Scientists bring up eight and measure the light. / The belly hides
it from prey below. / But more light spills sideways from its face, like headlights. / So maybe it sneaks up on dinner with
the lights on.

- **Джерело:** без відео-джерела (на прохання власника); «частина 1» — вірусна історія лютого 2021 про акулу-кайтфін, що
  світиться (Mallefet et al. 2021); «частина 2» — Claes et al., iScience, серпень 2026. Детально — idea-card.md.
- **Модель структури:** STRUCTURES #2, Zack D. Films «The Space Particle That Changed An Election» (21,3M): рух → But 37 %
  → число → чесне «можливо» → панчлайн-петля.
- **Голос:** Liam (VCgLBmBjldJmfphyB8sZ), eleven_v4, 1 дубль, 2,90 слова/с; підгонка до 25 с не потрібна.
- **Довжина:** 23,75 с (1425 кадрів, 60 fps, 1080x1920).
- **Біти:** studio/images/kitefin-headlights/beats.md.
- **Картинки (усі gpt-image-2.5-sunburst, 1K, LOW, 1 варіація, без референсів):** hero 2:3 (хлопець зі світломіром), guyA
  3:2 (знизування плечима / чухає голову / засліплений), guyB 3:2 (ідея / читає прилад / сміється), sharkA 2:3 (3 акули
  одна над одною: спокійна / хитра / здивована), squid 3:2 (спокійний / завмер / свистить), plate 2:3 (глибоке море).
  0 переробок. Світіння, тінь, фари, шолом, бульбашки, лінійка, піт — код.
- **Звуки:** нові ElevenLabs — car_horn, glow_on (7,67 кредиту); повторно з бібліотеки — deep_bed, pop, twinkle, whoosh,
  magic, scratch, dart, crickets, winch, ping, button, whistle, lamp_on, gulp, tiptoe.
- **Музика:** код (scripts/music.py), F мажор, 111,5 BPM, тема → стоп на обох «But» → «uh-oh» → наростання → фінал на
  домашньому акорді; 15 дБ під голосом.
- **Кредити:** голос 369,96 + Scribe 0 + 6 картинок 281,72 + звуки 7,67 = **659,35 з 900** (резерв не знадобився).
- **Прохід покращень:** акула виходила хвостом за кадр у фінальних бітах → зсунуто; світіння в кадрі 0 слабке → посилено;
  напис «VIEW FROM BELOW» перекривав хлопця → зсунуто; голос тихуватий (пік −5,9 dBFS) → +1,5 дБ, перерендер.
- **Перевірки:** контактні листи (qa/contact*.jpg), поп-скан: усі піки — заплановані зміни поз / розвороти.
- **Пакет:** upload.md. ElevenLabs flow: https://elevenlabs.io/app/flows/FDEdh8iKs1zPqHJjliH8
- **Remotion Studio:** `cd cartoon-shorts/studio && npx remotion studio` (композиції KitefinHeadlights, KitefinHeadlightsCover).
- **Пам'ять:** VIDEOS_LOG (#47), IDEA_BANK (used + №2 + відкинуті), STRUCTURES (#2 used in), STYLE (уроки, темп Liam),
  COMPETITORS (Found by Claude), sfx-library (+2). SOURCE_LOG не змінювався (відео-джерела немає).
- **Чесно:** один маленький ролик (421 перегляд) уже згадує «фари» цієї акули; мультфільму / історії / «частини 2» немає.
