# Short #2 — "Why Doesn't Rain Kill Mosquitoes?"

Категорія: тварини, що літають (комахи). Формат: вертикальний 2D cut-out cartoon, 22.6 с, 1080×1920, 60 fps.

Готові файли в цій папці:
- `mosquito-raindrop-1080p.mp4` — фінальне відео (голос + звукові ефекти, гучність нормалізована до −14 LUFS).
- `thumbnail.png` — обкладинка 1080×1920 з заголовком.
- `frame0.png` — кадр 0 без тексту (запасна обкладинка).

Код анімації і всі вихідники — `shorts-studio/` (Remotion 4).

---

## STEP 1 — тема, сценарій, джерела

**Ідея (1 речення):** Крапля дощу може важити в 50 разів більше за комара, але не вбиває його, бо комар настільки легкий, що крапля майже не гальмує — сила удару мізерна, і комар просто «їде» на краплі, а потім зісковзує вбік і летить далі.

**Чому ця тема:** очевидна відповідь («комара розчавить») неправильна; пояснення просте; добре малюється в 2D; не повторює дятлів.

Інші ідеї, які розглядав: колібрі майже не вміють ходити (джерела слабкі — переважно популярні статті), «любовна пісня» комарів через частоту крил (складно показати за 25 с).

**Озвучка (EN, готова до запису, з тегами ElevenLabs v4):**

```
[curious] Why doesn't rain kill mosquitoes? A raindrop can weigh 50 times more than one. [short pause] For you, that's like getting hit by a bus. [casually] But a mosquito is so light, the drop barely slows down when it hits. And if the drop doesn't slow down, almost no force goes into the bug. [amused] So it just rides the drop down for a moment... then slides off sideways and keeps flying.
```

**Кількість слів:** 68.

**Перевірка фактів:**

| Фраза | Що каже джерело |
|---|---|
| A raindrop can weigh 50 times more than one | Анотація PNAS: "raindrops can weigh more than 50 times a mosquito" (краплі 2–50× маси комара ~2 мг) |
| like getting hit by a bus | Автори порівнюють співвідношення мас із людиною під автобусом |
| the drop barely slows down | Через малу масу комара крапля втрачає мало імпульсу (комар гальмує краплю приблизно на 10 %, бабка 1 г — на 91 %) |
| almost no force goes into the bug | "...and so impart correspondingly low forces to the mosquitoes" |
| rides the drop down... slides off sideways and keeps flying | Комара несе 5–20 довжин тіла, потім він відривається вбік і летить далі (17 з 17 випадків) |

Свідомо не використано: прискорення 100–300 g (отримані на «манекені», для живих комарів у струмені — 80 ± 35 g).

**Джерела:**
- Dickerson, Shankles, Madhavan, Hu. *Mosquitoes survive raindrop collisions by virtue of their low mass.* PNAS 109(25):9822–9827 (2012) — https://doi.org/10.1073/pnas.1205446109
- Повний текст (PMC): https://pmc.ncbi.nlm.nih.gov/articles/PMC3382494/
- Georgia Tech news release: https://hg.gatech.edu/node/133841
- ScienceDaily: https://www.sciencedaily.com/releases/2012/06/120604155558.htm

---

## STEP 2–3 — як зроблено

### Голос
- ElevenLabs, модель `eleven_v4`, голос **Mark – Natural Conversations** (`UgBBYS2sOqTuMpoF3BR0`), 1 дубль.
- Тривалість 21.9 с. Таймінги слів — faster-whisper (`images/mosquito/words.json`) + паузи по RMS. Голос стоїть на 0.1 с.

### Бітшит (час відео)

| Час | Слова | На екрані | Звук |
|---|---|---|---|
| 0.0–2.5 | Why doesn't rain kill mosquitoes? | Кадр 0: злюща крапля з обличчям над комарем; на "kill" крапля шкіриться, комар ковтає, піт | дощ, дзижчання |
| 2.5–5.35 | A raindrop can weigh 50 times more than one. | Ваги: крапля падає на ліву шальку — шалька б'є вниз, комара підкидає сальтом; на "50" прилітає рій із 49 комарів, бейдж ×50, на "one" ваги вирівнюються | плюх, удар, поп, рій |
| 5.35–8.18 | For you, that's like getting hit by a bus. | Хлопець на дорозі показує на себе; ззаду наближається злий автобус із фарами-очима; на "bus" — руки вгору, очі > <; склейка до удару | двигун + клаксон |
| 8.18–11.86 | But a mosquito is so light, the drop barely slows down when it hits. | Комар легко підлітає; на "drop" падає велика крапля з лініями швидкості; на "hits" — удар, зірка, бризки | whoosh, slow-mo удар |
| 11.86–16.5 | And if the drop doesn't slow down, almost no force goes into the bug. | Slow-mo: комар прилип до краплі; величезна червона стрілка «сили» → здувається до крихітної; комар усміхається | поп, «пфф» |
| 16.5–22.6 | So it just rides the drop down for a moment... then slides off sideways and keeps flying. | Комар «серфить» на краплі, бачить землю, зісковзує вбік із сальто; крапля розбивається об калюжу; комар робить петлю і повертається — нова крапля зверху (луп на кадр 0) | свисток, сплеск, whoosh |

### Зображення
**GPT Image 2.5 через ElevenLabs не використано:** підключений конектор ElevenLabs — обмежена версія (лише голос і звук; генерація зображень/відео/музики в ній вимкнена). Higgsfield за твоєю вимогою не використовувався.
Тому всі персонажі та фони (комар, крапля з обличчям, рій, ваги, хлопець, автобус, дощ, калюжа, сплеск) намальовані в коді як SVG у тому самому flat-стилі: товсті чорні контури, пласкі кольори, одна тінь. Кредити на зображення — 0.
Щоб наступного разу генерувати картинки через ElevenLabs: Settings → Connectors → Add custom connector → `https://api.elevenlabs.io/v1/mcp` (повний конектор ElevenLabs).

### Звукові ефекти (усі — ElevenLabs Sound Effects v2, по 1 генерації)
дощ (луп), дзижчання комара (луп), плюх у шальку, удар ваг, поп, рій комарів, автобус (двигун + клаксон), whoosh краплі, slow-mo удар, здування стрілки, свисток (зісковзування), сплеск у калюжу. Нарізка/нормалізація — `images/mosquito/sfx_prep.py`, розстановка — `src/mosquito/cues.ts`.

### Кредити ElevenLabs
| Що | Кредити |
|---|---|
| Голос (eleven_v4, 1 дубль) | 394 |
| 12 звукових ефектів × 50 | 600 |
| Зображення | 0 |
| **Разом** | **994** |

### Перевірки
- Contact sheets ключових бітів — переглянуті, виправлено кадрування ваг і видимість автобуса.
- Pop-scan превʼю (кадр за кадром): усі піки — заплановані склейки (2.5 с, 5.35 с, 8.18 с), удар ваг, стрибок хлопця.
- Останній кадр = кадр 0 (луп).

---

## Пакет для публікації (YouTube Shorts / TikTok / Reels)

**Назва (основна):** Why Doesn't Rain Kill Mosquitoes?🤨

Альтернативи для A/B:
- A Raindrop Is 50x Heavier Than a Mosquito… So Why Does It Survive?
- Mosquitoes Survive Rain By Doing THIS
- Why Rain Can't Crush a Mosquito

**Опис:**
```
A single raindrop can weigh 50 times more than a mosquito – for you, that's like getting hit by a bus. So why do mosquitoes fly through rain just fine?

Georgia Tech researchers filmed it: a mosquito is so light that the drop barely slows down, so almost no force goes into the bug. It rides the drop for a moment, then slides off sideways and keeps flying.

Source: Dickerson et al., PNAS (2012) – doi.org/10.1073/pnas.1205446109

#shorts #mosquito #science #animals #insects #rain #physics #funfacts
```

**Теги:** mosquito, mosquitoes, why doesn't rain kill mosquitoes, mosquito rain, raindrop, mosquito raindrop, mosquitoes in rain, insects, flying insects, animal facts, science facts, physics, georgia tech, PNAS, cartoon, animation, fun facts, shorts

**Хештеги (TikTok/Reels):** #mosquito #sciencefacts #animalfacts #rain #physics #learnontiktok #cartoon

**Обкладинка:** `thumbnail.png` (кадр 0 + заголовок "WHY DOESN'T RAIN KILL MOSQUITOES?"). Для Shorts можна також вибрати кадр 0 у редакторі (`frame0.png`).

**Закріплений коментар:**
```
Bonus fact: in the study, most raindrops hit the mosquito's legs or wings, not its body (13 of 17 hits). Which flying animal should I cover next?
```

**Час публікації:** [MISSING] — потрібна аналітика каналу (коли активна аудиторія).
