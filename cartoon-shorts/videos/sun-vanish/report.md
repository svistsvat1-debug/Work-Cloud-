# sun-vanish - звіт (відео #30, 2026-11-17)

## Сценарій (затверджений, без змін)
1. So you're tanning on the beach, and the Sun vanishes.
2. But nothing happens, because its light and its pull need over eight minutes to reach us.
3. So you keep tanning, and Earth keeps circling an empty spot.
4. But then the lights go out, and Earth flies off into the dark in a straight line, like a stone from a sling.
5. So you just got the last tan in history.

## Джерело
- https://youtu.be/xtqWGeG4NJA (BRIGHT SIDE Series, «What if you wake up and see THIS instead of the sun», 4,2M переглядів), сегмент **2:31–5:12**.
- У відео 18 сегментів; використано 1, лишилось 17 (найкращі: чорна діра замість Сонця 0:00–2:31, нейтрино 12:40–13:05, шестикутник Сатурна 16:50–18:05).

## Модель структури
- Zack D. Films «What If Humans Had Hummingbird Hearts» (28,6M) — https://www.youtube.com/shorts/ob4_mDwWkM0
- Карта: обіцянка в «you»-what-if → ламається одразу («but») → рядок «because» → оманливий спокій → друге «but» → кумедна побутова картинка-пуант.

## Голос
- Liam – Viral Short-Form Storyteller (VCgLBmBjldJmfphyB8sZ), eleven_v4, 1 дубль, 353 символи.
- Мовлення 21,42 с → темп ~3,22 слова/с. Підганяти під 25 с не довелося.

## Відео
- 1080×1920, 60 fps, 23,0 с (1380 кадрів), звук 23,02 с, пік міксу −3,9 dBFS. Наприкінці картинка ще рухається.
- Файли: `videos/sun-vanish/sun-vanish.mp4` (у git не йде) і `videos/sun-vanish/cover.png`.

## Біти
Таблиця бітів (час / слова / картинка / гег / звук / музика): `studio/images/sun-vanish/beats.md`.

## Картинки (усі gpt-image-2.5-sunburst, 1K, LOW, 1 варіація, лише текст, 0 переробок)
hero 3:2 · lie3 2:3 (3 лежачі пози колонкою) · react3 3:2 · end2 3:2 · props 3:2 · beach 2:3 · space 2:3.
Сонце, Земля, промінь, «мотузка» гравітації, рушник, секундомір, праща, медаль, сніг, іній і засмага — кодом.

## Звуки
- Нові (ElevenLabs): sun_poof, lights_out, sling, chatter, flop, beach_bed — додано в sfx-library.
- Перевикористані: crickets, ticks, pop, gulp, swoop, whoosh, zoomaway, freeze, twinkle, boing.

## Музика
Локальний код (scripts/music.py): C-мажор, 111,5 BPM; теми theme / uh-oh / theme2 / build / final; зупинки на «But» і «out»; дзвіночок на «history»; підклад на 21,4 dB тихіше за голос.

## Кредити ElevenLabs
Голос 352,96 + Scribe 0 + 7 картинок 328,67 + 6 звуків 26,66 = **708,29** (ліміт 900, план ≤ 870). Журнал: `studio/images/sun-vanish/credits.md`.

## Прохід покращень
1. Додав «клац» у момент, коли мотузка відпускає Землю: сплеск, іскра, pop + boing.
2. Фінальна горда поза тепер теж тремтить від холоду.
3. Повільніший поворот камери на «empty spot».

Раніше на контрольних аркушах також збільшив героя на пляжі й Землю в космосі, перемалював бульбашку з пращею (була нечитабельна) і зробив ніч синьою замість брудно-коричневої.

## Upload-кіт
`videos/sun-vanish/upload.md`: назва «What happens if the Sun suddenly vanishes?», текст на обкладинці «8 MINUTES LATE», опис із джерелами, хештеги #shorts #space #sun #physics #whatif.

## Посилання
- ElevenLabs flow: https://elevenlabs.io/app/flows/PBNDsKGBLNX0ZYe46kTM
- Remotion Studio: `cd cartoon-shorts/studio && npx remotion studio` (композиції SunVanish і SunVanishCover).

## Пам'ять і git
- VIDEOS_LOG: рядок #30 (#29 — це satellite-storm з паралельної сесії). SOURCE_LOG: сегмент 2:31–5:12 позначено як використаний. IDEA_BANK: ідея → used.
- STYLE: уроки #29 і темп Liam. STRUCTURES: модель #3. COMPETITORS: 4 відео в розділі «Found by Claude».
- sfx-library: +6 звуків з рядками в index.md.
- Завантажені матеріали відео-джерела (work/) видалено.
