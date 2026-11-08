# Shorts: Scientists Were Wrong About Moths and Lights 💡

**Ідея (1 речення):** метеликів не притягує світло: вони тримають спину до найяскравішого джерела, бо в природі це небо, а лампа поруч збиває їм відчуття «де верх» і затягує у пастку.

Формула: як у «Scientists Were Wrong About This Bird's Head» (4 312 переглядів), але для сцени, яку бачив кожен.
Тривалість: 25–30 с. Озвучка: ElevenLabs, теги в квадратних дужках (формат audio tags v3).

## Озвучка з тегами (copy-paste в ElevenLabs)

```
[confidently] Moths aren't attracted to light.

[matter-of-fact] The old explanation: they steer by the Moon, and lamps send them spiraling.

[firmly] Wrong.

[intrigued] In 2024, scientists filmed them with high-speed cameras. They tilt their backs toward the brightest light. Normally, that's the sky, so they know which way is up.

[serious] A nearby lamp throws that off. They circle it... climb until they stall... or flip over and crash.

[slowly] They're not attracted... [dramatic] They're trapped.

[curious] What should I debunk next?
```

**Слів в озвучці:** 74 (без останнього рядка — 69).

## Чиста озвучка (без тегів)

> Moths aren't attracted to light.
> The old explanation: they steer by the Moon, and lamps send them spiraling.
> Wrong.
> In 2024, scientists filmed them with high-speed cameras. They tilt their backs toward the brightest light. Normally, that's the sky, so they know which way is up.
> A nearby lamp throws that off. They circle it, climb until they stall, or flip over and crash.
> They're not attracted. They're trapped.
> What should I debunk next?

## Прив'язка до структури

| Час | Озвучка | На екрані |
|---|---|---|
| 0–2 с | Moths aren't attracted to light. | Ніч, ліхтар, метелики кружляють · текст "Moths aren't attracted to light." |
| 2–10 с | The old explanation… spiraling. Wrong. | Місяць → метелик летить під кутом → спіраль до лампи · червоний хрестик + "Wrong." |
| 10–22 с | In 2024… flip over and crash. | Камера → метелик спиною до неба → лампа збоку: орбіта / задирання вгору / переворот і падіння |
| 22–28 с | They're not attracted. They're trapped. What should I debunk next? | "They're not attracted. They're trapped." → "What should I debunk next?" |

## Точність (перевірено)

- Дослідження: Fabian, Sondhi, Allen, Theobald, Lin. *Why flying insects gather at artificial light.* Nature Communications 15, 689 (2024).
- Знімали високошвидкісними інфрачервоними камерами в лабораторії та на польовій станції в Коста-Риці; комахи з 10 рядів, зокрема метелики.
- Траєкторії не збіглися з жодною старою моделлю, зокрема з версією про Місяць. «Wrong.» — спрощення цього висновку.
- Автори називають dorsal light response найімовірнішим поясненням; у пресі зазначено, що зв'язок із навігацією за небом ще треба підтвердити. У ролику це не стверджується як 100% доведене.
- Останній рядок — заклик до дії. Крок 1 радить без CTA: якщо прибрати його з голосу, залишити тільки текстом на екрані.

## Опис (чернетка)

```
Moths don't fly toward lamps — they get trapped by them. 💡
Source: Fabian et al., "Why flying insects gather at artificial light", Nature Communications (2024)
https://doi.org/10.1038/s41467-024-44785-3
```

## Джерела

- Стаття: https://doi.org/10.1038/s41467-024-44785-3 (повний текст: https://pmc.ncbi.nlm.nih.gov/articles/PMC10827719)
- Science News: https://www.sciencenews.org/article/insects-artificial-light-moth-direction-pollution
- FIU News: https://news.fiu.edu/2024/millennia-old-mystery-about-insects-and-light-at-night-gets-a-new-explanation

## Продакшн (крок 2–3) — що зроблено

- Голос: `video/public/moths/vo/take1.mp3` (ElevenLabs eleven_v4, Mark - Natural Conversations, 29.3 с). Розмітка слів: `video/images/moths/words.json`.
- Картинки: Google Flow (Higgsfield не підключений) → вирізано фон, апскейл ×2–3 з чіткою обводкою: `video/public/moths/sprites/`.
  - Герой = `moth_up` як маріонетка: крила окремим шаром (махи в коді), обличчя в коді. moth_down / worried від Flow вийшли іншими метеликами → стали масовкою.
  - `lamp_off` = перефарбований `lamp_on` (Flow намалював іншу лампу).
- Анімація: Remotion, `video/src/moths/` (3 шоти, 2.5D-камера, обличчя лампи/Місяця/метелика, пил, зірочки, крапля поту, підписи). Останній кадр = кадр 0 (луп).
- Звук: 19 ефектів синтезовано кодом (`video/images/moths/scripts/sfx.py`), рівні в `video/src/moths/sfx-cues.json`.
- Перевірки: contact sheets `video/out/stills/`, pop scan `video/scripts/popscan.py`.
- Рендер: `cd video && IMG=jpeg node scripts/render.mjs 2 out/moths-4K.mp4 16` (CPU, без GPU, ~40 хв), потім стандартний колірний діапазон:
  `ffmpeg -i out/moths-4K.mp4 -vf "scale=in_range=full:out_range=tv,format=yuv420p" -color_range tv -c:v libx264 -preset medium -crf 16 -movflags +faststart -c:a copy out/moths-4K-final.mp4`
- Результат перевірено: 2160×3840, 60 fps, 1788 кадрів, звук 29.8 с, пік −4.0 dBFS (−21.6 LUFS), застиглих кадрів немає, останній кадр = кадр 0.
- Remotion Studio: `cd video && npx remotion studio src/index.ts --port 3000`
