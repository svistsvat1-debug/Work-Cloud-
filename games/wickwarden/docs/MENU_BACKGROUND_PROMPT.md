# Фон меню

У грі вже є процедурний pixel-art фон (`src/assets/MenuBackground.js`): малюється на полотні 480×270
і масштабується ×4 до 1920×1080 без згладжування. У ньому: захід сонця, замок на скелі праворуч,
пагорби, сосни, туман, лицар 32×32 (на екрані 128×128) зі спини з мечем на скелі ліворуч,
вільне місце вгорі по центру під логотип. Анімуються туман, жарини й вогники у вікнах.

## Як замінити на згенероване зображення

1. Згенеруй картинку 1920×1080 промптом нижче (будь-який генератор зображень, на який у вас є права).
2. Збережи як `assets/menu-background.png`.
3. У `src/config/GameConfig.js` вкажи `menuBackgroundImage: 'assets/menu-background.png'`.

Якщо файл не завантажиться, гра покаже процедурний фон.

## Промпт

Create a beautiful 1920x1080 2D pixel art game menu background in a mature fantasy animation style, not childish. The scene shows a majestic stone castle sitting high on a mountain in the distance, surrounded by a rich green landscape, pine trees, rolling hills, cliffs, and soft atmospheric fog. The castle should feel grand, ancient, and mysterious, with warm light coming from some windows and dramatic cinematic lighting.

In the foreground, place a pixelated warrior knight standing with his back slightly turned toward the viewer, holding a sword. The warrior should look like a 128x128 pixel character sprite, detailed but still clearly pixel art, with armor, cape, sword, and strong heroic silhouette. He should feel serious, powerful, and ready for adventure.

The artwork should have beautiful pixel shading, clean shapes, strong composition, detailed environment, cinematic depth, soft sunset or golden-hour lighting, and a professional fantasy RPG menu feeling. Make the image polished, readable, and game-ready, with no glitches, no distorted anatomy, no blurry details, no random objects, and no childish cartoon style. Leave some clean open space in the upper center area for the game title/logo.
