# Звіт — nuke-gas-fire (2026-11-12)

**Готово:** вертикальний Short 1080×1920, 60 fps, 24.85 с (1491 кадр), голос і звукові ефекти зведені в один трек, пік −3.9 dBFS.
Файли: `nuke-gas-fire.mp4` (у git не потрапляє, надіслано окремо) і `cover.png`.

## Фінальний текст (затверджений, без змін)
1. This fire burned for almost three years, until the Soviets nuked it.
2. Why not just plug the well?
3. They tried, but the gas, enough for a whole city every day, just escaped into nearby wells.
4. So they set off a nuke almost a mile underground, right beside the well.
5. The blast squeezed the rock and pinched the well shut, like stepping on a hose.
6. Fire out in twenty-three seconds.

69 слів, 375 знаків. Під час виробництва фактичних помилок не знайшлося, тож текст не змінювали.

## Голос
- ElevenLabs «Mark - Natural Conversations» (voice_id UgBBYS2sOqTuMpoF3BR0), модель eleven_v4, один дубль, 24.16 с.
- Таймінги слів: Scribe v1. Транскрипт збігся з текстом слово в слово, тому другий дубль не знадобився.
- Голос стартує на 0.1 с. Паузи знайдено за гучністю (RMS < −42 dB). Вибух стоїть у паузі 17.2–17.8 с, поп корка — у паузі 12.5–13.0 с.

## Таблиця бітів
| час | слова | картинки | гег | звук |
|-----|-------|----------|-----|------|
| 0.0 | (кадр 0) | roast, свердловина + вишка + балки, bg_desert | хлопець смажить маршмелоу на гігантському газовому вогні з обличчям; у небі «1963» | gas_roar |
| 0.4–2.8 | This fire burned for almost three years, | roast | рік перегортається 1964/1965/1966 на «almost/three/years»; маршмелоу підсмажується до чорного й димить | pop ×3, sizzle |
| 2.9–4.6 | until the Soviets nuked it. | nuke, shock | на тросі спускається жовта бомба й розплющує очі; полум'я злякано «о» й пітніє; хлопець підстрибує; у паузі бомбу смикають назад угору | whoosh, boing, whoosh |
| 4.7–6.4 | Why not just plug the well? | cork, push | гігантський корок падає на трубу на «plug» і заганяє полум'я всередину («> <»); хлопець притискає корок | whoosh, stamp, squeeze |
| 6.5–7.4 | They tried, | hero | корок тремтить, з-під нього шипить газ, тиск росте | gas_hiss, rumble |
| 7.5–10.6 | but the gas, enough for a whole city every day, | bg_under | на «but» камера відкочується й опускається в розріз землі: газові бульбашки біжать трубою; значок «1 CITY / EVERY DAY» з вікнами, що загоряються | whoosh, pop |
| 10.7–13.0 | just escaped into nearby wells. | 2 вентилі, shock | у породі тріщини, газ тече вбік у дві сусідні свердловини, з їхніх вентилів вискакують вогники з обличчями; хлопець підстрибує; у паузі корок вилітає і велике полум'я повертається | gas_hiss ×3, pop ×3, whoosh |
| 13.2–17.2 | So they set off a nuke almost a mile underground, right beside the well. | nuke | бурять похилу свердловину; бомба їде вниз на тросі; росте шкала глибини з підписом «1.5 km»; бомба зупиняється біля труби, дивиться на неї, пітніє, мружиться | winch ×3, boing, pop |
| 17.25 | (пауза) | — | спалах, ударні кільця, тріщини, сильна тряска | boom_low, rumble |
| 17.8–20.7 | The blast squeezed the rock and pinched the well shut, | — | розпечена порожнина; риски тиснуть на трубу на «squeezed» і «pinched»; стінки труби сходяться, газ під перетиском збивається в купу | squeeze ×2, rock_crack |
| 20.7–22.2 | like stepping on a hose. | step | різкий перехід: хлопець підстрибує й наступає на садовий шланг, струмінь гасне, падають дві краплі; самовдоволений підскок на «hose» | hose_spray, stamp, sputter |
| 22.3–24.3 | Fire out in twenty-three seconds. | sad | камера наближається на згасання: секундомір 0→23 с, полум'я з переляканим обличчям меншає, «> <», на «seconds» лишаються пф і кільце диму; хлопець з сирим маршмелоу | ticks, flame_out |
| 24.3–24.85 | (петля) | sad | кільце диму піднімається, цвіркуни, камера плавно повертається в кадр 0 | crickets |

## Картинки (усі ElevenLabs gpt-image-2.5-sunburst, 1K, 1 варіант, тільки текстовий промпт, без референсів)
- **MEDIUM (10):**
  - персонаж: hero, roast, push, shock, step, sad;
  - об'єкти: nuke (бомба, отримує обличчя в коді), rig 3:2 (у prep розрізано на вишку, свердловину й балки);
  - фони: bg_desert, bg_under.
- **LOW (1):** props 3:2 (у prep розрізано на корок і два вентилі).
- Усі 11 картинок пройшли перевірку на кольоровому аркуші з першої спроби, без жодної переробки. Кольори персонажа нормалізовано до палітри каналу.

## Звукові ефекти
- **Нові (ElevenLabs Sound Effects v2), 4 шт.:** gas_roar, gas_hiss, winch, flame_out.
- **Повторно використані з sfx-library, 13 шт.:** rumble, boom, pop, whoosh, squeeze, ticks, hose_spray, sputter, sizzle, boing, crickets, stamp, rock_crack.
- **Похідний:** boom_low. Зроблений кодом із boom.wav (тон нижче ×0.78, low-pass 900 Hz), нічого нового не генерував.
- Усі нові звуки разом із boom_low додано в `sfx-library/` і в його index.md.

## Кредити (ліміт 1500)
| що | кредити |
|----|---------|
| голос (375 знаків) + hero | 455.6 |
| Scribe | 0 |
| 9 MEDIUM + 1 LOW картинок | 772.2 |
| 4 нові звуки | 23.3 |
| **разом** | **1251.1** |

Перед кожним платним запуском робив оцінку (estimate). Резерв (~150) не знадобився. Детально: `studio/images/nuke-gas-fire/credits.md`.

## Прохід покращень (один)
1. **5.3–7.5 с, порожній кадр.** Було: широкий кадр, багато порожнього неба, корок дрібний і статичний. Стало: ближчий план (k 1.5) на хлопця й корок, з-під корка шипить газ, і тиск наростає.
2. **18–20.6 с, вибух.** Було: порожнина з рисками з обох боків читалася як «смугастий м'яч». Стало: риски лише з боку труби, у порожнині гаряче ядро, яке остигає.
3. **Кульмінація «Fire out in twenty-three seconds».** Було: секундомір і згасання полум'я дрібні. Стало: камера наближається на згасання, секундомір більший, потім камера плавно повертається в кадр 0 для петлі.

Також виправлено те, що знайшли перевірки:
- з контактних аркушів: край розрізу внизу кадру 0; вишка за головою хлопця; табличка з роком перекривала ногу (рік тепер великим написом у небі); камера виїжджала за межі фону; бомба була замалою; газ у сусідні свердловини майже не було видно; струмінь шланга опинявся поза кадром;
- з pop-scan фінального файлу: позначка на 4.02 с — приземлення хлопця після стрибка, це навмисний рух. Тремтіння, що вмикалося там стрибком, тепер наростає плавно;
- з перевірки петлі: круглий кінець похилої свердловини в останньому кадрі.

## Перевірки
- **Контактні аркуші:** `studio/images/nuke-gas-fire/qa/contact1–3.jpg`.
- **Pop-scan прев'ю й фінального файлу** (`qa/popscan_final.txt`): усі позначки — навмисні (заміни поз, приземлення після стрибка, корок, поп, вибух, різкий перехід до шланга, приземлення на шланг).
- **Фінальний файл:**
  - 1080×1920, 60 fps, 1491 кадр = 24.85 с × 60;
  - аудіо 24.85 с, пік −3.9 dBFS (MIX_DB +3);
  - в останні 0.5 с кадр рухається: камера повертається, піднімається кільце диму, хлопець дихає.

## Upload-кит
- **Назва (мій вибір):** Why did the Soviets put out a fire with a nuke?
- **Інші варіанти:**
  - Why didn't they just plug this burning gas well?
  - What happens if you nuke a fire?
- **Текст обкладинки:** 3 YEARS ON FIRE
- **Опис:** In 1963 a gas well in Uzbekistan blew out and burned for almost three years. In 1966 Soviet engineers set off a nuclear charge about 1.5 km underground right beside it: the blast squeezed the well shut, and the flame went out 23 seconds later. + джерела (Nordyke 1998 / OSTI / Wikipedia).
- **Хештеги:** #shorts #history #science #engineering #nuclear
- **Повний кит:** `upload.md`, субтитри: `nuke-gas-fire.en.srt`.

## Посилання та файли
- Flow ElevenLabs: https://elevenlabs.io/app/flows/hkv1oIdyHhUPeYACIuS6
- Відкрити в Remotion Studio: `cd cartoon-shorts/studio && npx remotion studio` (композиції NukeGasFire і NukeGasFireCover).
- Файли:
  - `studio/src/nuke-gas-fire/` — код сцени;
  - `studio/public/nuke-gas-fire/` — спрайти, голос, звуки;
  - `studio/images/nuke-gas-fire/` — промпти, бюджет, кредити, prep, QA;
  - `videos/nuke-gas-fire/` — картка ідеї, upload-кит, субтитри, обкладинка, звіт.

## Записано в пам'ять
- `VIDEOS_LOG.md`: рядок №5.
- `IDEA_BANK.md`: ця ідея позначена як used. Також додано астероїд/DART (№2), баг 2038 року (№3) та індичок.
- `STYLE.md`: уроки відео №5.
- `COMPETITORS.md`: розділ «Found by Claude».
- `sfx-library`: 5 файлів + index.

## Фолбеки та рішення
- Для поп-скану й рівнів використовував ffmpeg із Remotion. У ньому немає фільтра lowpass, тому приглушений бум зробив у Python.
- Рендер ішов через swangle (у контейнері немає GPU), 4 потоки, рендер триває ~10 хв.
- Табличку з роками в кадрі замінив на великий напис у небі: табличка заважала гегу зі шлангом.
- Шкалу глибини підписав «1.5 km» (за джерелом ~1 500 м). Голос каже «almost a mile», і це узгоджується.
