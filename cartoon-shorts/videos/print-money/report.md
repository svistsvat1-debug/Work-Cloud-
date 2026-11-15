# print-money — звіт (відео #22)

Ідея власника: «Why don't we just print more money». Власник попросив робити відео одразу, без картки й зупинки на підтвердження (MODE A).

## Фінальний текст (68 слів, 377 символів)
So your country is broke, but you own a money printer. Easy fix, right? You print a fat stack of cash for everyone. But the bakery still bakes the same bread. So the baker raises the price. So you print more. That's Germany, nineteen twenty-three. Soon a loaf of bread costs two hundred billion marks. So families burn the cash in the stove, because it's cheaper than firewood.

## Структурна модель
memory/STRUCTURES.md #1: структура каналу «So you... But... So...» з відео про вулкан. Хук із «you» та метою (3,0 с) → очевидний план → «But» на 7,5 с (31 %) → ескалація → «Germany 1923» на 57 % → у фіналі план обертається проти тебе. Транскрипта моделі немає й ніколи не було.

## Голос
Liam - Viral Short-Form Storyteller, eleven_v4, один дубль. Мовлення 23,46 с, ~2,9 слова/с (числа словами сповільнюють). Підганяти під 25 с не довелося.
Довжина відео: 24,2 с (1452 кадри, 60 fps, 1080x1920).

## Біти
| час | слова | на екрані | гег | звук |
|---|---|---|---|---|
| 0,0–2,9 | So your country is broke | сумний хлопець із порожнім гаманцем біля принтера | з гаманця вилітає міль | pop |
| 2,6–3,4 | money printer | принтер розплющує очі | підскакує, пихкає парою | boing, hiss |
| 3,5–7,3 | Easy fix… cash for everyone | хлопець радіє, принтер друкує товсту пачку, гроші дощем падають на людей | городяни підстрибують | press, cash, pop |
| 7,5–10,2 | But the bakery… same bread | плавний проліт до пекарні, одна хлібина | «ONLY 1» | whoosh, pop |
| 10,3–12,2 | the baker raises the price | пекар вистрибує з-за прилавка й буквально ПІДНІМАЄ табличку з ціною 1 → 2 → 5 | каламбур «raises» | flip, kaching |
| 12,3–13,5 | So you print more | назад до принтера, хлопець крутить колесо, принтер шаленіє | очі «> <», піт, «MORE!» | press x1.25, hiss, cash |
| 13,7–16,0 | That's Germany, 1923 | табличка GERMANY 1923, світ стає сепією | табличка підстрибує на «1923» | stamp |
| 16,1–19,9 | Soon a loaf… 200 billion marks | хлопець котить тачку грошей, ціна на табличці росте до 200,000,000,000 MARKS | шок, крапля поту | barrow, ticks, kaching, sad horn |
| 20,0–24,2 | So families burn the cash… firewood | сутінки: сім'я гріється біля пічки з обличчям, пачки грошей летять у топку | спалах вогню, червоний хрест на дровах | cash, fire x2, pop, stamp |

## Картинки (усі GPT Image 2.5, 1K, LOW, 1 варіація, без референсів)
hero (2:3), throw_push (3:2, радість / штовхає), shock_warm (3:2, шок / гріється сидячи), printer (3:2), bakery (3:2, ключ magenta), props (3:2, тачка + пічка + хлібина), bg (2:3, міська площа). 7 картинок, жодної переробки. Герой ішов в одному пакеті з рештою, бо зафіксований вигляд персонажа вже є в STYLE.md.

## Звуки
Нові (ElevenLabs SFX v2, додано в sfx-library): press, cash, fire, barrow.
Повторно з бібліотеки: pop, boing, hiss, whoosh, flip, kaching, stamp, ticks, sad_horn.

## Музика (код, 0 кредитів)
G major, 114,5 BPM, частини theme / uh-oh / build / uh-oh / theme2 / final. Зупинки на «But» і перед кадром із пічкою, дзвіночок на «firewood». Фон на 18 дБ тихіший за голос, під словами приглушується на 4 дБ. Пік міксу −4,2 dBFS.

## Кредити
голос 376,96 + Scribe 0 + 7 картинок 328,67 + 4 звуки 20,67 = **726,30** (ліміт 900).

## Що змінив прохід покращення
- Кадр 0: хлопець налазив на колесо принтера. Принтер став меншим, хлопця посунуто ліворуч.
- Табличку з ціною обрізав край кадру. Її посунуто ліворуч, камера тепер стежить за хлопцем зі зміщенням.
- Сцена з пічкою була дрібна: камера наближена з k 0,98 до 1,22–1,31.
- Пару від принтера й спалах вогню збільшено.
- Червоний хрест закривав поліно — його зменшено.
- На обкладинці хлопця обрізало, камеру зсунуто.

## Upload kit
Назва: **Why don't we just print more money?** (інші варіанти: What if a country just printed more money? / Why can't a broke country print more cash?)
Текст обкладинки: FOR 1 BREAD?
Опис і джерела: videos/print-money/upload.md. Хештеги: #shorts #money #inflation #history #economics

## Посилання й файли
- ElevenLabs flow: https://elevenlabs.io/app/flows/rnVJif6tBwpMlzDccvmH
- Remotion Studio: `cd cartoon-shorts/studio && npx remotion studio` (композиції PrintMoney / PrintMoneyCover)
- Код: studio/src/print-money/; вихідні картинки: studio/images/print-money/; ассети: studio/public/print-money/
- MP4: studio/out/print-money.mp4 і videos/print-money/print-money.mp4 (не комітиться)
