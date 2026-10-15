# #07 — "Forty trucks on channel 19"

- **Формат:** YouTube Shorts, сторітелінг на фото · 9:16, 1080×1920, 30 fps · **37.4 с**
- **Матеріали від власника:** 6 фото (`shots/01–06.jpg`), озвучка `voice_original.mp3` (у `voice.wav` обрізано тишу в кінці до 37.4 с), субтитри `voice.srt`
- **Рендер:** `python3 tools/photo_story.py videos/07-channel-19/story.json` → `final.mp4` (голос + музика), `final-no-music.mp4`
- **Луп:** фінальна фраза "And I still don't know why, out of…" обривається і на повторі переходить у "Forty trucks on channel nineteen". Тому в кінці немає затемнення: останній і перший кадр — те саме обличчя водія.
- **Хук (за аналізом конкурентів):** відео стартує з обличчя водія, а не з предмета.

## Монтажний лист

| Час (с) | Фото | Голос | Рух / ефект |
|---|---|---|---|
| 0.00–2.85 | 01 водій з рацією | Forty trucks on channel nineteen. | Крупно обличчя → панорама на табло рації "19" на слові "nineteen" |
| 2.85–5.40 | 04 динамік рації в інеї | Only my radio heard him. | Whip-zoom, наїзд, punch на "heard" |
| 5.40–8.20 | 02 фура на крижаній дорозі | December, two thousand one. | Повільний наїзд |
| 8.20–10.50 | 02 (jump-cut) | Ice storm. Missouri hills. | Крупніше на фуру |
| 10.50–13.40 | 04 динамік | A calm voice told me to stop at a white post… | Провал у чорне + бум, наїзд у світло динаміка |
| 13.40–15.50 | 03 обмерзлий білий стовпчик і міст | …right before the bridge. | Стовпчик → панорама на міст на слові "bridge" |
| 15.50–17.85 | 01 обличчя водія | I said, not on a hill. | Крупний план, punch на "hill" |
| 17.85–19.40 | 02 лід на дорозі | Not on ice. | Крупно крижане покриття |
| 19.40–21.95 | 04 динамік | He said, "Don't argue with me, son." | Дуже крупно, punch на "son" |
| 21.95–23.60 | 03 стовпчик | So I stopped. | Тиша + райзер |
| 23.60–27.95 | 05 вид з кабіни на міст з аварією | Four minutes later, three trucks folded across that bridge. | Білий спалах + бум, наїзд на складену фуру, punch на "folded" |
| 27.95–31.25 | 06 таксофон і годинник | Next morning, I told my dispatcher. | Провал у чорне, повільний наїзд |
| 31.25–33.30 | 06 годинник | She went quiet for a full minute. | Крупно годинник |
| 33.30–35.20 | 06 трубка, що висить | Then she said his name. | Бум, тиша, punch на "name" |
| 35.20–37.40 | 01 обличчя водія (темніше) | And I still don't know why, out of… | Повільний наїзд; без затемнення → луп |

## Для публікації

Назва, опис, теги, промпт обкладинки й налаштування → `publish.md`.

## Чесність / примітки

- Історію і фото надав власник; нічого не додано до сюжету.
- [MISSING] Історія реальна чи вигадана? Якщо вигадана, додай `Dramatized story.` в опис.
