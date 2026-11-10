# Промпти для фонів (ChatGPT) — Short про комара і краплю

Фони йдуть шарами, щоб камера в анімації давала глибину (паралакс):
дальній шар рухається повільно, ближній — швидко. Дощ, сплеск і бризки малюються в коді поверх фонів, тому на картинках дощу бути не повинно.

Як генерувати:
- До кожного промпту прикріпи `M1-reference.png` як зразок стилю (з нього береться лише стиль, комара на фоні бути не повинно).
- Розміри: BG1 і BG5 — вертикаль 1024×1536; BG2, BG3, BG4 — горизонталь 1536×1024.
- Назви файли BG1.png … BG5.png.

| Код | Що | Де в відео |
|---|---|---|
| BG1 | небо з хмарами | сцени з комаром і терезами (дальній план) |
| BG2 | далекі пагорби | дальній шар |
| BG3 | кущі й дерева | середній шар |
| BG4 | трава з калюжею | ближній шар (крапля розбивається в калюжу) |
| BG5 | вулиця з дорогою | сцена з автобусом |

**BG1 — небо (1024×1536)**
```
A vertical cartoon background of an overcast rainy sky for an animated YouTube Short. The top quarter is a row of big puffy storm clouds in soft grey with a slightly darker grey underside, outlined in thick black. Below the clouds the sky is a flat muted blue-grey that gets a little lighter toward the bottom edge. Nothing else: no ground, no hills, no sun, no birds, no raindrops. Style: flat 2D cartoon background in the same drawing style as the attached reference image (thick smooth black outlines of even weight, flat colours with one simple soft shade, clean vector-like linework), muted rainy-day colours, no texture, no text, no border, no characters, no animals, no raindrops.
```

**BG2 — далекі пагорби (1536×1024)**
```
A wide horizontal cartoon strip of distant rolling hills for a parallax background layer. Soft muted green-teal hills with a few small round cartoon trees on top, outlined in thick black; the hills fill the lower 60% of the image completely, all the way down to the bottom edge. Everything above the hill line is one plain flat solid magenta colour (#FF00FF), nothing else. Style: flat 2D cartoon background in the same drawing style as the attached reference image (thick smooth black outlines of even weight, flat colours with one simple soft shade, clean vector-like linework), muted rainy-day colours, no texture, no text, no border, no characters, no animals, no raindrops.
```

**BG3 — кущі й дерева, середній план (1536×1024)**
```
A wide horizontal cartoon strip of a row of round green bushes and a few short leafy trees for a middle parallax layer, outlined in thick black, a slightly brighter green than distant hills. The bushes stand along a straight horizontal grass line at the middle of the image; below that line everything is plain green grass down to the bottom edge. Everything above the bushes and trees is one plain flat solid magenta colour (#FF00FF), nothing else. Style: flat 2D cartoon background in the same drawing style as the attached reference image (thick smooth black outlines of even weight, flat colours with one simple soft shade, clean vector-like linework), muted rainy-day colours, no texture, no text, no border, no characters, no animals, no raindrops.
```

**BG4 — трава з калюжею, ближній план (1536×1024)**
```
A wide horizontal cartoon strip of the near ground for the front parallax layer: a straight, perfectly horizontal grass edge with a thick black outline at one third from the top of the image; below it bright green grass with darker grass tufts, a few small daisies and pebbles, down to the bottom edge. Exactly in the horizontal centre, just below the grass edge, one wide shallow oval puddle of blue water with a black outline and a white reflection streak. Everything above the grass edge is one plain flat solid magenta colour (#FF00FF), nothing else. Style: flat 2D cartoon background in the same drawing style as the attached reference image (thick smooth black outlines of even weight, flat colours with one simple soft shade, clean vector-like linework), no texture, no text, no border, no characters, no animals, no raindrops.
```

**BG5 — вулиця для сцени з автобусом (1024×1536)**
```
A vertical cartoon street background on a grey rainy day for an animated YouTube Short, seen from the middle of the road at about chest height. A straight two-lane asphalt road with a white dashed centre line starts wide at the bottom edge and runs straight away to a vanishing point exactly in the centre of the image; grey sidewalks with kerbs on both sides; simple cartoon city buildings with lit and dark windows on both sides, getting smaller toward the horizon; a couple of street lamps; a muted grey-blue cloudy sky in the top half. Empty street: no cars, no buses, no people, no characters, no raindrops, no text on signs. Style: flat 2D cartoon background in the same drawing style as the attached reference image (thick smooth black outlines of even weight, flat colours with one simple soft shade, clean vector-like linework), muted rainy-day colours, no texture, no text, no border.
```
