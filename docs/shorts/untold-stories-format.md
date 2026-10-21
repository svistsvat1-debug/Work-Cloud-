# Shorts-формат "Untold Stories": розбір + сценарії

Референс: https://youtube.com/shorts/yc9TR1HzBsM
Назва: "Why Does Dad's GPS Still Move?🤨" · канал: Untold Stories (@Untold_stories-1s)

> Повністю переглянути відео не вдалося: YouTube блокує завантаження з сервера.
> Розбір нижче зроблений за назвою, обкладинкою і кадром із відео. Сюжет оригіналу і текст озвучки — [MISSING].

## 1. Формула формату (що видно)

| Елемент | Як зроблено в оригіналі |
|---|---|
| Назва | Питання "Why does [близька людина]'s [гаджет/річ] still [дія]?" + 🤨 |
| Тема | Близька людина пішла з життя, але її "цифровий слід" досі живий → загадка → емоційна розв'язка |
| Візуал | AI-фото, 9:16, POV від першої особи, ніч, дощ, мокре скло, неонові/теплі вогні, кінематографічний темний grade |
| Деталі в кадрі | Конкретні "якорі" сюжету прямо на фото (табличка EXIT 9, спідометр, міст) |
| Субтитри | Білий жирний шрифт CAPS, чорна обводка/тінь, 2–3 слова на екран, по центру кадру |
| Озвучка | Англійською, від першої особи, спокійний тихий голос (найімовірніше AI voice) — [MISSING] підтвердити |
| Монтаж | Статичні фото з повільним zoom/pan або анімація фото; зміна кадру кожні 2–4 с |

**Чому це заходить:** питання в назві = curiosity gap; горе + технологія = кожен впізнає себе; розв'язка дає емоцію (сльози/мурашки) → коментарі, шери, перегляд до кінця.

## 2. Технічний стандарт для всіх сценаріїв

- Тривалість: 35–50 с, ~110–140 слів озвучки.
- Кадри: 10–13 зображень, кожне 3–4 с.
- Gemini: генерувати у вертикальному форматі 9:16. До кожного промпту додавати STYLE-блок нижче, щоб усі кадри були в одному стилі.
- Анімація: повільний zoom-in 105–110% (CapCut "Zoom" / keyframes) або оживлення фото в Veo / Kling (дощ, світло, легкий рух камери).
- Субтитри: CapCut → Auto captions → шрифт жирний sans (тип Montserrat Black / "The Bold Font"), білий, обводка чорна, 2–3 слова.
- Звук: тихе сумне піано/ambient на фоні (−20…−25 dB) + SFX з тексту сценарію.

**STYLE-блок (додавати в кінець кожного промпту для Gemini):**
```
vertical 9:16, photorealistic, cinematic film still, first-person POV, night, moody dark color grade, teal and warm orange lights, soft film grain, shallow depth of field, shot on 35mm, no text, no watermark
```

---

## СЦЕНАРІЙ #1 — "Why Is Mom Still Reading My Texts?🤨"

**Ідея:** мами немає 4 місяці. Герой пише їй повідомлення щовечора. Одного разу зʼявляється "Read". Розв'язка: номер передали іншій людині — дівчині, яка теж втратила маму і читала всі ці повідомлення.

**Озвучка (EN, ~125 слів):**

> My mom passed away four months ago.
> But every night, I still text her.
> Just small things. "I ate today." "I miss you."
> Last Tuesday, at 2:14 AM… my phone lit up.
> "Read."
> I froze. Her phone was buried with her things in a box in my closet.
> I checked. It was there. Dead. No battery.
> Then three dots appeared. Someone was typing.
> I couldn't breathe.
> The message said: "I'm sorry. I'm not her."
> Her number had been given to someone new.
> A girl named Emma. She'd lost her mom too… the same month.
> She said she'd read every single message I sent.
> And they were the only thing that helped her sleep.
> Now, every night…
> we text each other.

**Покадрово:**

| # | Час | Текст озвучки | Промпт для Gemini (+ STYLE-блок) | Рух / SFX |
|---|---|---|---|---|
| 1 | 0–3 с | My mom passed away four months ago. | A framed photo of a smiling middle-aged woman standing on a dark bedroom nightstand, lit by a single small lamp, rain on the window behind | Повільний zoom-in · дощ |
| 2 | 3–6 с | But every night, I still text her. | Close-up of a hand holding a smartphone in a dark bed, screen glowing, chat contact named "Mom ❤️", blurry face silhouette in the background | Легке світіння екрана |
| 3 | 6–9 с | "I ate today." "I miss you." | Over-the-shoulder view of a phone screen with a long column of sent blue message bubbles, no replies, dark room | Звук відправки повідомлення |
| 4 | 9–12 с | Last Tuesday, at 2:14 AM… my phone lit up. | A smartphone lying face up on a dark wooden nightstand, screen suddenly lighting up the room, digital clock showing 2:14 nearby | Вібрація телефону |
| 5 | 12–14 с | "Read." | Extreme close-up of a phone chat screen, under the last blue message the small word "Read" | Різка тиша, музика стоп |
| 6 | 14–18 с | Her phone was buried… in a box in my closet. | A cardboard box opened on a closet floor at night, inside: a woman's scarf, glasses, an old black smartphone, flashlight beam on it | Скрип дверцят |
| 7 | 18–21 с | It was there. Dead. No battery. | Close-up of a hand holding an old smartphone with a black dead screen, cracked corner, cold flashlight light | Удар (low boom) |
| 8 | 21–24 с | Then three dots appeared. Someone was typing. | Phone screen close-up showing a typing indicator bubble with three dots in a chat, reflection of a shocked eye on the glass | Звук "typing" |
| 9 | 24–28 с | "I'm sorry. I'm not her." | Phone screen with a grey incoming message bubble, a person sitting on the bedroom floor in the dark, back against the bed | Музика повертається, піано |
| 10 | 28–32 с | Her number had been given to someone new. A girl named Emma. | A young woman sitting by a rainy window in a different apartment at night, holding a phone, face softly lit by the screen, sad expression | Дощ по склу |
| 11 | 32–37 с | She'd lost her mom too… read every single message. | The same young woman's hands holding the phone, a small framed photo of an older woman next to her on the windowsill | Повільний zoom-in |
| 12 | 37–41 с | The only thing that helped her sleep. | Split composition: two windows in two different buildings at night, each with one warm light on, rain, city lights | Піано наростає |
| 13 | 41–45 с | Now, every night… we text each other. | Phone screen showing a warm chat with grey and blue messages back and forth, a cup of tea next to it, soft morning light starting through the window | Тихий фінал, fade out |

**Назва:** Why Is Mom Still Reading My Texts?🤨
**Опис:** Some messages find the right person. #storytime #emotional #shorts
**Обкладинка:** кадр #5 ("Read") + текст на обкладинці: "SHE READ IT."
**Закріплений коментар (для залученості):** "Would you text the number again? 💬"

---

## СЦЕНАРІЙ #2 — [чекає фідбек по #1]
## СЦЕНАРІЙ #3 — [чекає фідбек по #1]

Банк ідей у тому ж форматі (на 10 сценаріїв):
1. Why Is Mom Still Reading My Texts? — сценарій вище
2. Why Does Grandpa's Spotify Still Play at 3 AM?
3. Why Does Dad's Car Still Get Parking Tickets?
4. Why Does My Brother's Gamer Account Go Online Every Friday?
5. Why Does Grandma's Doorbell Camera Still Record Someone?
6. Why Is Dad's Smartwatch Still Counting Steps?
7. Why Does Mom's Email Still Send Me Birthday Cards?
8. Why Does My Late Friend's Phone Still Share Location?
9. Why Does Grandpa's Bank Card Still Pay for Groceries?
10. Why Does Dad's Alarm Still Ring at 5 AM?
