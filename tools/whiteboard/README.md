# Whiteboard video engine

Локальний безкоштовний конвеєр для довгих відео 16:9 у маркерному whiteboard-стилі.
Стиль описано в `docs/longform/style-whiteboard.md`.

## Файли

| Файл | Що робить |
|---|---|
| `wb.py` | Рушій: шари з «картою появи» (outline → штриховка), текст, штрихи, стрілки, штриховка, сцени, камера |
| `maps.py` | Карти з Natural Earth у маркерному стилі (контури, регіони, міста, Рейнланд, Судети) |
| `kit.py` | Готові блоки: заголовки, цифри зі «спалахами», картки QUESTION / ANSWER / CLUE, прапори, календар, STOP, блискавка, мапа рівнів |
| `gen_sprites.py` | Генерація ілюстрацій локально: SDXL + SDXL-Lightning (CPU, bf16), вирізання фону |
| `render.py` | Паралельний рендер у H.264 1080p30 + озвучка |
| `episodes/ep01.py` | Розкадровка епізоду 1 (таймінги з SRT) |
| `episodes/ep01_sprites.json` | Список ілюстрацій епізоду 1 |
| `fonts/` | Permanent Marker (Apache 2.0), Kalam (OFL) — Google Fonts |

## Запуск (нове середовище)

```bash
uv venv --python python3.12 kenv && . kenv/bin/activate
uv pip install torch diffusers transformers accelerate safetensors huggingface_hub opencv-python-headless pillow numpy scipy
# карта світу (1 раз)
curl -o countries50.geojson https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson
# 1) ілюстрації (~40 с на штуку на 4 ядрах)
python gen_sprites.py episodes/ep01_sprites.json SPRITES_DIR
# 2) контрольні кадри сцен (швидко)
python render.py ep01 --srt voice.srt --audio voice.mp3 --geo countries50.geojson --sprites SPRITES_DIR --out out.mp4 --stills STILLS_DIR
# 3) повний рендер
python render.py ep01 --srt voice.srt --audio voice.mp3 --geo countries50.geojson --sprites SPRITES_DIR --out out.mp4 --workers 4
```

## Новий епізод

1. Озвучка mp3 + SRT (таймінги реплік).
2. `episodes/epNN_sprites.json` — предмети/персонажі (по одному на картинку).
3. `episodes/epNN.py` — сцени: `S(cue)` починає сцену з репліки, елементи прив'язуються до `c(cue) + зсув`.
4. Рендер контрольних кадрів → правки → повний рендер.
