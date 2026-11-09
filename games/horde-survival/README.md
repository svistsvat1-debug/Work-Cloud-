# HUSHBREAKER

Оригінальна 2D-гра в жанрі horde survival для браузера: HTML5 Canvas + чистий JavaScript, без бібліотек і збірки.
Останній лицар Ордену Дзвону тримає оборону проти Тиші та її безротих створінь.

## Як запустити

Двічі клікни `index.html`: гра відкриється в браузері (Chrome, Edge, Firefox). Сервер не потрібен.
Скрипти підключені звичайними тегами `<script>`, без ES modules, бо браузер не завантажує модулі з `file://`.

## Керування

| Дія | Клавіші |
|---|---|
| Рух | WASD або стрілки |
| Вибір апгрейду | 1 / 2 / 3 або клік |
| Продовжити (скриня) | Space / Enter |
| Пауза | Esc / P |
| Звук вкл/викл | M або кнопка з динаміком |
| Debug-панель | F3 або `` ` `` |

Чіти в debug-панелі: **L** рівень, **T** +1 хв, **E** елітний ворог, **B** бос, **K** вбити всіх, **G** безсмертя, **I** картинки ↔ намальоване кодом.

## Структура

```
index.html, styles.css
src/main.js                 масштабування canvas під вікно (16:9), старт гри
src/config/                 усі числа й дані: GameConfig, зброя, пасивки, хвилі, еволюції, магазин
src/core/                   Game (цикл і стани), Input, Camera, MathUtils, SaveData, кеш спрайтів, сітка колізій
src/entities/               Player, Enemy, Projectile, XPGem, Coin, Chest
src/weapons/                базовий Weapon і 4 поведінки: снаряд, орбіта, хвиля, удар з неба
src/systems/                спавн, хвилі, колізії, зброя, апгрейди, ефекти, звук, рендер світу, UI
src/ui/                     екрани: старт, магазин, рівень, скриня, пауза, game over
src/assets/                 спрайти, намальовані кодом, і ImageSprites (картинки з файлів)
assets/images/              фон меню
assets/sprites/             готові спрайти з картинок (PNG 182×182, тайли землі JPG 384×384)
assets/incoming/            оригінали згенерованих картинок і маски фону
tools/process_art.py        перетворює оригінали на спрайти
```

## Картинки замість спрайтів, намальованих кодом

1. Поклади оригінал у `assets/incoming/` (назви файлів — у `assets/incoming/README.md`).
2. Запусти з цієї папки `python3 tools/process_art.py build`. Скрипт прибере фон, вріже картинку в 182×182 і запише PNG в `assets/sprites/`. Для фото з реальним фоном спершу потрібна маска: `python3 tools/process_art.py masks --model birefnet.onnx`, модель BiRefNet (MIT) лежить на Hugging Face: `onnx-community/BiRefNet-ONNX`.
3. Пропиши файл у `GameConfig.spriteImages`, наприклад `player: 'assets/sprites/player.png'`.

Якщо файлу немає, гра малює спрайт кодом. Щоб повернути намальоване кодом, видали рядок або постав `useSpriteImages: false`.

Журнал змін по кроках: `docs/game/build-log.md` (у корені репозиторію).
