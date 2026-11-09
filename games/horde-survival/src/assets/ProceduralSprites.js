/**
 * Creates sprites with canvas drawing code, so the game needs no image files.
 *
 * Every character sprite is drawn into a 182x182 canvas (GameConfig.spriteSourceSize).
 * The game then draws that canvas smaller on screen (drawSize in GameConfig).
 */
const ProceduralSprites = {
  createAll() {
    const sprites = {
      player: this.createPlayer(),
      slime: this.createSlime(),
      bat: this.createBat(),
      arcaneBolt: this.createProjectile(),
      orbitBlade: this.createOrbitBlade(),
      gemBlue: this.createGem('#4fc3ff', '#d2f1ff', '#1b5f99'),
      gemGreen: this.createGem('#4fe07a', '#d4ffdf', '#1d7a3a'),
      gemRed: this.createGem('#ff5a6e', '#ffd0d6', '#9b1f30'),
      ...this.createUpgradeIcons(),
      ...this.createWeaponIcons(),
    };

    // Tinted copies for hit feedback: red for the player, white flash for enemies.
    sprites.playerHurt = this.createTinted(sprites.player, '#ff3b3b', 0.65);
    for (const type of Object.keys(GameConfig.enemies)) {
      sprites[`${type}Flash`] = this.createTinted(sprites[type], '#ffffff', 0.8);
    }
    return sprites;
  },

  /** Copy of a sprite with a color painted over its visible pixels. */
  createTinted(source, color, strength) {
    const canvas = this.createCanvas(source.width);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(source, 0, 0);
    // "source-atop" paints only where the sprite already has pixels.
    ctx.globalCompositeOperation = 'source-atop';
    ctx.globalAlpha = strength;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return canvas;
  },

  /** An empty square canvas for one sprite. */
  createCanvas(size = GameConfig.spriteSourceSize) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    return canvas;
  },

  /** A small armored hero. Faces right; the game mirrors it to face left. */
  createPlayer() {
    const canvas = this.createCanvas();
    const ctx = canvas.getContext('2d');
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#15121c';

    // Cape (behind the body)
    ctx.fillStyle = '#2a6f8f';
    ctx.beginPath();
    ctx.moveTo(64, 96);
    ctx.lineTo(118, 96);
    ctx.quadraticCurveTo(134, 130, 126, 158);
    ctx.quadraticCurveTo(91, 166, 56, 158);
    ctx.quadraticCurveTo(48, 130, 64, 96);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Legs
    ctx.fillStyle = '#2c303d';
    this.roundRect(ctx, 72, 136, 16, 32, 6);
    ctx.fill();
    ctx.stroke();
    this.roundRect(ctx, 94, 136, 16, 32, 6);
    ctx.fill();
    ctx.stroke();

    // Body armor + highlight + belt
    ctx.fillStyle = '#9ea9bb';
    this.roundRect(ctx, 62, 90, 58, 54, 18);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    this.roundRect(ctx, 70, 97, 16, 30, 8);
    ctx.fill();
    ctx.fillStyle = '#d9a441';
    ctx.fillRect(65, 125, 52, 9);

    // Plume (behind the helmet)
    ctx.fillStyle = '#3cc9c4';
    ctx.beginPath();
    ctx.moveTo(98, 38);
    ctx.quadraticCurveTo(72, 12, 46, 28);
    ctx.quadraticCurveTo(66, 30, 76, 48);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Helmet + shine
    ctx.fillStyle = '#c9d1dd';
    this.circle(ctx, 91, 64, 33);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.ellipse(78, 50, 10, 6, -0.6, 0, Math.PI * 2);
    ctx.fill();

    // Visor and glowing eyes (looking right)
    ctx.fillStyle = '#191c25';
    this.roundRect(ctx, 70, 57, 48, 17, 7);
    ctx.fill();
    ctx.fillStyle = '#8ff7ff';
    this.circle(ctx, 92, 65, 4);
    ctx.fill();
    this.circle(ctx, 108, 65, 4);
    ctx.fill();

    return canvas;
  },

  /** A bouncy blob with big eyes. */
  createSlime() {
    const canvas = this.createCanvas();
    const ctx = canvas.getContext('2d');
    ctx.lineJoin = 'round';
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#1e3b14';

    const bodyColor = ctx.createLinearGradient(0, 48, 0, 166);
    bodyColor.addColorStop(0, '#b8f26c');
    bodyColor.addColorStop(1, '#4f9e34');
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.moveTo(30, 150);
    ctx.bezierCurveTo(26, 96, 58, 48, 91, 48);
    ctx.bezierCurveTo(124, 48, 156, 96, 152, 150);
    ctx.quadraticCurveTo(152, 166, 132, 166);
    ctx.lineTo(50, 166);
    ctx.quadraticCurveTo(30, 166, 30, 150);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.ellipse(64, 82, 14, 9, -0.5, 0, Math.PI * 2);
    ctx.fill();

    // Face (looking right)
    this.eye(ctx, 92, 106, 12);
    this.eye(ctx, 124, 106, 12);
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(110, 128, 10, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();

    return canvas;
  },

  /** A purple bat with wide wings and glowing eyes. */
  createBat() {
    const canvas = this.createCanvas();
    const ctx = canvas.getContext('2d');
    ctx.lineJoin = 'round';
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#1b1028';

    // Wings (mirrored left and right)
    ctx.fillStyle = '#5f3b98';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(91 + side * 16, 82);
      ctx.quadraticCurveTo(91 + side * 58, 36, 91 + side * 86, 62);
      ctx.quadraticCurveTo(91 + side * 72, 82, 91 + side * 76, 106);
      ctx.quadraticCurveTo(91 + side * 58, 94, 91 + side * 50, 114);
      ctx.quadraticCurveTo(91 + side * 36, 100, 91 + side * 16, 110);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Ears
    ctx.fillStyle = '#8a5cc9';
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(91 + side * 6, 72);
      ctx.lineTo(91 + side * 22, 44);
      ctx.lineTo(91 + side * 28, 78);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Body
    ctx.fillStyle = '#8a5cc9';
    this.circle(ctx, 91, 98, 30);
    ctx.fill();
    ctx.stroke();

    // Glowing eyes and tiny fangs
    ctx.fillStyle = '#ffe066';
    this.circle(ctx, 82, 94, 7);
    ctx.fill();
    this.circle(ctx, 104, 94, 7);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(84, 112);
    ctx.lineTo(88, 122);
    ctx.lineTo(92, 112);
    ctx.moveTo(94, 112);
    ctx.lineTo(98, 122);
    ctx.lineTo(102, 112);
    ctx.fill();

    return canvas;
  },

  /** A glowing magic bolt flying to the right (the game rotates it toward the target). */
  createProjectile() {
    const canvas = this.createCanvas();
    const ctx = canvas.getContext('2d');

    // Tail
    const tail = ctx.createLinearGradient(4, 0, 91, 0);
    tail.addColorStop(0, 'rgba(120, 220, 255, 0)');
    tail.addColorStop(1, 'rgba(170, 240, 255, 0.9)');
    ctx.fillStyle = tail;
    ctx.beginPath();
    ctx.moveTo(4, 91);
    ctx.quadraticCurveTo(50, 70, 91, 72);
    ctx.lineTo(91, 110);
    ctx.quadraticCurveTo(50, 112, 4, 91);
    ctx.fill();

    // Glow
    const glow = ctx.createRadialGradient(91, 91, 0, 91, 91, 52);
    glow.addColorStop(0, 'rgba(210, 250, 255, 1)');
    glow.addColorStop(0.35, 'rgba(110, 220, 255, 0.85)');
    glow.addColorStop(1, 'rgba(60, 160, 255, 0)');
    ctx.fillStyle = glow;
    this.circle(ctx, 91, 91, 52);
    ctx.fill();

    // Bright core
    ctx.fillStyle = '#ffffff';
    this.circle(ctx, 91, 91, 17);
    ctx.fill();

    return canvas;
  },

  /** A faceted crystal with a soft glow. */
  createGem(baseColor, lightColor, darkColor) {
    const canvas = this.createCanvas();
    const ctx = canvas.getContext('2d');

    const glow = ctx.createRadialGradient(91, 91, 8, 91, 91, 90);
    glow.addColorStop(0, lightColor);
    glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = glow;
    this.circle(ctx, 91, 91, 90);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Diamond body
    ctx.beginPath();
    ctx.moveTo(91, 18);
    ctx.lineTo(148, 91);
    ctx.lineTo(91, 164);
    ctx.lineTo(34, 91);
    ctx.closePath();
    ctx.fillStyle = baseColor;
    ctx.fill();
    ctx.lineJoin = 'round';
    ctx.lineWidth = 9;
    ctx.strokeStyle = darkColor;
    ctx.stroke();

    // Facets: light upper-left, shadowed lower-right
    ctx.fillStyle = lightColor;
    ctx.beginPath();
    ctx.moveTo(91, 26);
    ctx.lineTo(42, 91);
    ctx.lineTo(91, 91);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.beginPath();
    ctx.moveTo(91, 91);
    ctx.lineTo(140, 91);
    ctx.lineTo(91, 156);
    ctx.closePath();
    ctx.fill();

    return canvas;
  },

  /** Icons for the level-up cards: a colored badge with a white symbol. */
  createUpgradeIcons() {
    return {
      iconDamage: this.createIcon('#d9534f', (ctx) => this.star(ctx, 91, 91, 8, 60, 26)),
      iconFireRate: this.createIcon('#f0ad4e', (ctx) => {
        this.chevron(ctx, 40);
        this.chevron(ctx, 84);
      }),
      iconProjectileSpeed: this.createIcon('#3fa7d6', (ctx) => {
        ctx.beginPath();
        ctx.moveTo(34, 80);
        ctx.lineTo(104, 80);
        ctx.lineTo(104, 54);
        ctx.lineTo(150, 91);
        ctx.lineTo(104, 128);
        ctx.lineTo(104, 102);
        ctx.lineTo(34, 102);
        ctx.closePath();
      }),
      iconMoveSpeed: this.createIcon('#4cae4c', (ctx) => {
        // A boot
        ctx.beginPath();
        ctx.moveTo(62, 36);
        ctx.lineTo(104, 36);
        ctx.lineTo(104, 104);
        ctx.lineTo(140, 112);
        ctx.quadraticCurveTo(152, 118, 150, 142);
        ctx.lineTo(56, 142);
        ctx.closePath();
      }),
      iconMaxHealth: this.createIcon('#c9302c', (ctx) => this.heart(ctx, 91, 96, 52)),
      iconHeal: this.createIcon('#2fa86f', (ctx) => {
        ctx.beginPath();
        ctx.rect(76, 38, 30, 106);
        ctx.rect(38, 76, 106, 30);
      }),
      iconMagnet: this.createIcon('#7e57c2', (ctx) => {
        // Horseshoe magnet: an upside-down U
        ctx.beginPath();
        ctx.moveTo(40, 140);
        ctx.lineTo(40, 88);
        ctx.arc(91, 88, 51, Math.PI, 0);
        ctx.lineTo(142, 140);
        ctx.lineTo(112, 140);
        ctx.lineTo(112, 88);
        ctx.arc(91, 88, 21, 0, Math.PI, true);
        ctx.lineTo(70, 140);
        ctx.closePath();
      }),
    };
  },

  /** A spinning dagger for the Orbiting Blade (points up; the game rotates it). */
  createOrbitBlade() {
    const canvas = this.createCanvas();
    const ctx = canvas.getContext('2d');

    const glow = ctx.createRadialGradient(91, 80, 4, 91, 80, 86);
    glow.addColorStop(0, 'rgba(180, 220, 255, 0.55)');
    glow.addColorStop(1, 'rgba(180, 220, 255, 0)');
    ctx.fillStyle = glow;
    this.circle(ctx, 91, 80, 86);
    ctx.fill();

    ctx.lineJoin = 'round';
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#1c2230';

    // Blade
    const steel = ctx.createLinearGradient(70, 0, 112, 0);
    steel.addColorStop(0, '#f4f8ff');
    steel.addColorStop(1, '#93a4bd');
    ctx.fillStyle = steel;
    ctx.beginPath();
    ctx.moveTo(91, 10);
    ctx.lineTo(113, 70);
    ctx.lineTo(102, 128);
    ctx.lineTo(80, 128);
    ctx.lineTo(69, 70);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(91, 22);
    ctx.lineTo(91, 120);
    ctx.stroke();

    // Crossguard, grip, pommel
    ctx.strokeStyle = '#1c2230';
    ctx.lineWidth = 5;
    ctx.fillStyle = '#e0b84a';
    this.roundRect(ctx, 60, 124, 62, 14, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#6b4a2f';
    this.roundRect(ctx, 84, 138, 14, 28, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#e0b84a';
    this.circle(ctx, 91, 170, 8);
    ctx.fill();
    ctx.stroke();

    return canvas;
  },

  /** Icons for the weapons (level-up cards and the HUD). */
  createWeaponIcons() {
    return {
      iconBolt: this.createIcon('#5b6ee1', (ctx) => {
        ctx.beginPath();
        ctx.arc(108, 74, 30, 0, Math.PI * 2);
        ctx.moveTo(84, 92);
        ctx.lineTo(36, 146);
        ctx.lineTo(96, 104);
        ctx.closePath();
      }),
      iconBlade: this.createIcon('#7d8aa0', (ctx) => {
        ctx.beginPath();
        ctx.moveTo(91, 24);
        ctx.lineTo(108, 70);
        ctx.lineTo(100, 118);
        ctx.lineTo(124, 118);
        ctx.lineTo(124, 132);
        ctx.lineTo(98, 132);
        ctx.lineTo(98, 158);
        ctx.lineTo(84, 158);
        ctx.lineTo(84, 132);
        ctx.lineTo(58, 132);
        ctx.lineTo(58, 118);
        ctx.lineTo(82, 118);
        ctx.lineTo(74, 70);
        ctx.closePath();
      }),
      iconPulse: this.createIcon('#d9a83a', (ctx) => {
        // A ring (outer circle minus inner circle) around a dot
        ctx.beginPath();
        ctx.arc(91, 91, 58, 0, Math.PI * 2);
        ctx.arc(91, 91, 40, 0, Math.PI * 2, true);
        ctx.moveTo(113, 91);
        ctx.arc(91, 91, 22, 0, Math.PI * 2);
      }),
      iconLightning: this.createIcon('#3e7bd6', (ctx) => {
        ctx.beginPath();
        ctx.moveTo(104, 20);
        ctx.lineTo(50, 102);
        ctx.lineTo(86, 102);
        ctx.lineTo(70, 162);
        ctx.lineTo(134, 74);
        ctx.lineTo(98, 74);
        ctx.lineTo(116, 20);
        ctx.closePath();
      }),
    };
  },

  /** Badge + symbol. drawSymbol(ctx) only builds a path; it is filled white with a dark outline. */
  createIcon(color, drawSymbol) {
    const canvas = this.createCanvas();
    const ctx = canvas.getContext('2d');

    this.roundRect(ctx, 12, 12, 158, 158, 34);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 8;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.stroke();
    this.roundRect(ctx, 24, 20, 134, 56, 24);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.fill();

    ctx.lineJoin = 'round';
    ctx.lineWidth = 8;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillStyle = '#ffffff';
    drawSymbol(ctx);
    ctx.stroke();
    ctx.fill();
    return canvas;
  },

  // ---------- small drawing helpers ----------

  star(ctx, x, y, points, outerRadius, innerRadius) {
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = -Math.PI / 2 + (i * Math.PI) / points;
      ctx.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
    }
    ctx.closePath();
  },

  heart(ctx, x, y, size) {
    ctx.beginPath();
    ctx.moveTo(x, y + size * 0.9);
    ctx.bezierCurveTo(x - size * 1.4, y - size * 0.1, x - size * 0.6, y - size * 1.1, x, y - size * 0.35);
    ctx.bezierCurveTo(x + size * 0.6, y - size * 1.1, x + size * 1.4, y - size * 0.1, x, y + size * 0.9);
    ctx.closePath();
  },

  /** A ">" shape starting at x, used twice for a fast-forward icon. */
  chevron(ctx, x) {
    ctx.beginPath();
    ctx.moveTo(x, 44);
    ctx.lineTo(x + 30, 44);
    ctx.lineTo(x + 62, 91);
    ctx.lineTo(x + 30, 138);
    ctx.lineTo(x, 138);
    ctx.lineTo(x + 32, 91);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
  },

  /** A cartoon eye: white circle with a pupil looking right. */
  eye(ctx, x, y, radius) {
    ctx.fillStyle = '#ffffff';
    this.circle(ctx, x, y, radius);
    ctx.fill();
    ctx.fillStyle = '#16121c';
    this.circle(ctx, x + radius * 0.35, y + 1, radius * 0.5);
    ctx.fill();
  },

  circle(ctx, x, y, radius) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
  },

  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
  },
};
