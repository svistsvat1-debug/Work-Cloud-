# Manim-анімації (Manim Community Edition)

Три готові сцени для навчальних відео / Shorts. Кожна — один `.py` файл, без зовнішніх файлів і assets.

| Файл | Сцена (клас) | Тривалість | Що показує |
|---|---|---|---|
| `wave_surface.py` | `WavingSurface` | ~29 с | 3D-поверхня `z = sin(x² + y² − t)/2`, яка «живе», live-формула, точки-зонди, рух камери |
| `math_steps.py` | `SolvingMathProblems` | ~45 с | 3 задачі покроково: `2x + 5 = 17`, `x² − 5x + 6 = 0`, теорема Піфагора (3, 4 → 5) |
| `chart_problems.py` | `ProblemTimeChart` | ~28 с | Bar chart часу на 5 задач → total, average, fastest, slowest → summary card |

## Встановлення

```bash
pip install manim
```

Також потрібні системні залежності Manim (ffmpeg, Cairo/Pango) і **LaTeX** для `wave_surface.py` та `math_steps.py`
(вони використовують `MathTex`). `chart_problems.py` працює без LaTeX.
Інструкція: https://docs.manim.community/en/stable/installation.html

## Рендер

Запускати з цієї папки (`animations/manim/`):

```bash
# швидкий preview (480p, 15 fps)
manim -pql wave_surface.py WavingSurface
manim -pql math_steps.py SolvingMathProblems
manim -pql chart_problems.py ProblemTimeChart

# фінальна якість (1080p, 60 fps)
manim -pqh wave_surface.py WavingSurface
manim -pqh math_steps.py SolvingMathProblems
manim -pqh chart_problems.py ProblemTimeChart
```

`-p` — відкрити відео після рендеру, `-ql/-qm/-qh/-qk` — 480p / 720p / 1080p / 4K.
Готові відео з'являються в `media/videos/<назва_файлу>/<якість>/`.

Вертикальне відео для Shorts/Reels (9:16): додай `-r 1080,1920`, але тоді варто перевірити розкладку елементів.

## Час рендеру

`wave_surface.py` найважча (≈1300 полігонів поверхні на кадр, 3D-шейдинг):
у тестовому контейнері `-ql` рендерилась ≈3.5 хв. `-qh` має у 4 рази більше кадрів і більшу роздільність,
тож закладай десятки хвилин. Для чернеток використовуй `-ql` / `-qm`.
Прискорити: зменшити `RESOLUTION` у конфігу на початку файлу.

## Як змінювати

- **wave_surface.py** — блок `CONFIG` угорі: функція `wave()` + `WAVE_TEX` (формула на екрані), швидкість хвилі, кольори, розмір домену, щільність сітки.
- **math_steps.py** — блок `STYLE` (кольори, розмір формул, `STEP_PAUSE` — темп). Кожна задача — окремий метод `problem_*`.
- **chart_problems.py** — список `DATA`: зміни значення, і total / average / fastest / slowest перерахуються автоматично.
