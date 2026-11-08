# Short: "Why don't doctors use bacteria-killing viruses?" (фаги)

Референс-ідея: Kurzgesagt — "The Deadliest Being on Planet Earth – The Bacteriophage" · https://youtu.be/YI3tsmFsrOg
Кут для Shorts: не «найсмертоносніша істота», а питання з очевидним рішенням → чому ним не користуються → неочікувана відповідь.

**Ідея одним реченням:** Існують віруси, які вбивають бактерії й не заражають людей. Лікарі справді лікували ними ще до антибіотиків, але відмовились, бо кожен фаг б'є лише по певних бактеріях. Тепер, коли бактерії стають стійкими до антибіотиків, фаги знову тестують.

- Тривалість: ~25–28 с
- Слів в озвучці: **64** (теги не враховано)
- Модель: Eleven v4 (теги також працюють на v4 Turbo і v3)

## Озвучка з тегами (вставляти в ElevenLabs)

```
[curious] Some viruses, called phages, kill bacteria but can't infect people. So why don't doctors use them instead of antibiotics?
[pause] [playful] They did. Before antibiotics even existed.
[thoughtful] But each phage kills only certain types of bacteria, so every infection needed the right match. Antibiotics killed many kinds at once, so Western doctors mostly dropped phages.
[pause] [optimistic] Now that more bacteria resist antibiotics, doctors are testing phages again.
```

## Чистий текст (для субтитрів)

Some viruses, called phages, kill bacteria but can't infect people. So why don't doctors use them instead of antibiotics? They did. Before antibiotics even existed. But each phage kills only certain types of bacteria, so every infection needed the right match. Antibiotics killed many kinds at once, so Western doctors mostly dropped phages. Now that more bacteria resist antibiotics, doctors are testing phages again.

## Нотатки до генерації

- Тег ставиться перед словами, на які діє; емоція тягнеться далі, тому новий тег — лише там, де змінюється подача.
- Тільки квадратні дужки: в інших дужках тег може бути прочитаний вголос.
- Якщо подача не та — заміни емоцію на сусідню ([playful] → [amazed], [optimistic] → [content]) і перегенеруй.
- Якщо модель неправильно вимовляє "phages" (правильно: ФЕЙ-джиз), напиши в тексті для озвучки `fay-jizz`, а в субтитрах лиши "phages".
- Якщо вийшло довше за 30 с — прибери обидва `[pause]`.

## Що з фактів важливо не перекрутити

- «Can't infect people»: у фагів немає механізму проникнення в клітини людини (немає відповідних рецепторів). Це не означає, що фаг-терапія повністю без ризиків.
- Відмова від фагів на Заході — це не лише антибіотики: ще й непослідовні результати та слабке розуміння біології фагів у 1920–40-х. Тому в тексті "mostly dropped", без абсолютних тверджень.
- У Грузії, Польщі та Росії фаги використовували й далі — тому "Western doctors".
- Фаг-терапія досі експериментальна в більшості країн (у США — не схвалена FDA, доступ через compassionate use / клінічні дослідження). Тому в фіналі "testing", а не "using".

## Джерела

1. Shukla & Aswani, *Clinical Medicine & Research*, 2021 — історія фаг-терапії в США, комерційні препарати Eli Lilly, Squibb, Swan-Myers до 1931 р., спад після антибіотиків 1940-х, повернення інтересу через резистентність: https://pmc.ncbi.nlm.nih.gov/articles/PMC8231696/
2. Adesanya et al., *AIMS Microbiology*, 2020 — фаги не здатні заражати клітини ссавців (рецептори), вузька специфічність аж до штаму: https://pmc.ncbi.nlm.nih.gov/articles/PMC7595837/
3. Romero-Calle et al., *Antibiotics*, 2019 — фаги вбивають лише частину штамів, антибіотики — широкий спектр, рутинне використання лише в Грузії, Польщі, Росії: https://pmc.ncbi.nlm.nih.gov/articles/PMC6784059/
4. CIDRAP (University of Minnesota), 2017 — кейс Тома Паттерсона (UC San Diego): фаги не схвалені FDA, підбір фага під конкретний штам, інтерес згас з появою антибіотиків: https://www.cidrap.umn.edu/news-perspective/2017/11/save-life-doctors-turn-bacteria-killing-viruses
5. ElevenLabs — Eleven v4 Audio Tags (список тегів і правила): https://elevenlabs.io/blog/elevenlabs-audio-tags-list
