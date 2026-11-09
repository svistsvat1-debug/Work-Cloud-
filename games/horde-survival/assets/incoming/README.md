# Вхідний арт

Тут лежать оригінали згенерованих картинок. `tools/process_art.py` робить з них спрайти в `assets/sprites/`.
`masks/` — маски фону для фото (BiRefNet, локально), тож для перезбирання модель не потрібна.

| Оригінал | Спрайт(и) | Примітка |
|---|---|---|
| `player.jpg` | `player.png` | фон вирізано |
| `enemy-slime.jpg` | `slime.png` | фон вирізано |
| `enemy-bat.jpg` | `bat.png` | фон вирізано |
| `enemy-crawler.jpg` | `crawler.png` | віддзеркалено: усі дивляться праворуч |
| `enemy-brute.jpg` | `brute.png` | ноги обрізані в оригіналі, тож низ розтушовано |
| `enemy-elite.jpg` | `elite.png` | + фіолетова аура |
| `enemy-elite-pixel.jpg` | `elite-pixel.png` | запасний піксельний варіант, зараз не використовується |
| `enemy-boss.jpg` | `boss.png` | + фіолетова аура |
| `gem.jpg` | `gem-blue.png`, `gem-green.png`, `gem-red.png` | кольори перефарбовані з одного кристала |
| `coin.jpg` | `coin.png` | |
| `chest-closed.jpg` | `chest.png` | |
| `chest-open.jpg` | `chest-open.png` | інший ракурс, ніж у закритої |
| `blade.jpg` | `peal-blade.png`, `choir-blade.png` | золота версія для еволюції |
| `icon-blade.jpg` | `icon-blade.png` | у рамці, як інші іконки |
| `ground-tile.jpg` | `ground-1.jpg` … `ground-4.jpg` | 4 варіанти зі спільними краями, без швів |
| `decorations.jpg` | `deco-*.png` (8 шт.) | пурпуровий фон прибрано хромакеєм |
| `menu-background-original.jpg` | `assets/images/menu-background.jpg` | 1920×1080 |

Нову картинку назви як у таблиці й запусти `python3 tools/process_art.py build` з папки гри.
Найкраще працює однотонний зелений (#00FF00) або пурпуровий (#FF00FF) фон. Тоді маска не потрібна, достатньо `cut='green'` у списку `SPRITES` скрипта.
