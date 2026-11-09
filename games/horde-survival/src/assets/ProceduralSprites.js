/**
 * Creates sprites with canvas drawing code, so the game needs no image files.
 * Characters (animated) are in CharacterSprites.js, the world in WorldSprites.js;
 * this file makes items, projectiles and icons, and puts everything together.
 *
 * Every sprite is drawn into a 182x182 canvas (GameConfig.spriteSourceSize).
 * The game then draws that canvas smaller on screen (drawSize in GameConfig).
 */
const ProceduralSprites = {
  createAll() {
    const sprites = {
      ...CharacterSprites.createAll(), // player and enemies: arrays of animation frames
      chest: this.createChest(false),
      chestOpen: this.createChest(true),
      chimeBolt: this.createBolt(),
      carillonBolt: this.createBolt({ light: '255, 230, 250', mid: '255, 120, 225', edge: '170, 70, 255' }),
      pealBlade: this.createOrbitBlade(),
      choirBlade: this.createOrbitBlade({ glow: '255, 240, 190', steelLight: '#ffffff', steelDark: '#ffd166', guard: '#ffffff', grip: '#e0b84a' }),
      ...this.createEvolvedIcons(),
      gemBlue: this.createGem('#4fc3ff', '#d2f1ff', '#1b5f99'),
      gemGreen: this.createGem('#4fe07a', '#d4ffdf', '#1d7a3a'),
      gemRed: this.createGem('#ff5a6e', '#ffd0d6', '#9b1f30'),
      coin: this.createCoin(),
      glowGold: WorldSprites.createGlow('255, 214, 107'),
      glowPink: WorldSprites.createGlow('255, 120, 225'),
      ...this.createPassiveIcons(),
      ...this.createWeaponIcons(),
    };

    this.addHitTints(sprites);
    return sprites;
  },

  /**
   * Tinted copies of every frame for hit feedback: red for the player, white
   * flash for enemies. Called again when an image file replaces a sprite.
   */
  addHitTints(sprites) {
    sprites.playerHurt = sprites.player.map((frame) => this.createTinted(frame, '#ff3b3b', 0.6));
    for (const type of Object.keys(GameConfig.enemies)) {
      sprites[`${type}Flash`] = sprites[type].map((frame) => this.createTinted(frame, '#ffffff', 0.8));
    }
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

  /** A wooden treasure chest with gold trim. `open` shows the lid up and light inside. */
  createChest(open) {
    const canvas = this.createCanvas();
    const ctx = canvas.getContext('2d');
    ctx.lineJoin = 'round';
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#2a1608';

    if (open) {
      // Light pouring out
      const light = ctx.createLinearGradient(0, 20, 0, 100);
      light.addColorStop(0, 'rgba(255, 240, 170, 0)');
      light.addColorStop(1, 'rgba(255, 240, 170, 0.9)');
      ctx.fillStyle = light;
      ctx.beginPath();
      ctx.moveTo(44, 96);
      ctx.lineTo(20, 10);
      ctx.lineTo(162, 10);
      ctx.lineTo(138, 96);
      ctx.closePath();
      ctx.fill();
      // Lid tilted back
      ctx.fillStyle = '#9c6634';
      this.roundRect(ctx, 34, 40, 114, 30, 12);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#e0b84a';
      ctx.fillRect(34, 50, 114, 8);
      // Treasure inside
      ctx.fillStyle = '#ffd166';
      for (const [x, y] of [[66, 92], [84, 86], [102, 90], [118, 94]]) {
        this.circle(ctx, x, y, 9);
        ctx.fill();
      }
    }

    // Body
    ctx.fillStyle = '#8b5a2b';
    this.roundRect(ctx, 30, 92, 122, 70, 10);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(42, 22, 8, 0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(34, 116);
    ctx.lineTo(148, 116);
    ctx.moveTo(34, 140);
    ctx.lineTo(148, 140);
    ctx.stroke();

    if (!open) {
      // Closed lid
      ctx.strokeStyle = '#2a1608';
      ctx.lineWidth = 6;
      ctx.fillStyle = '#a56b37';
      ctx.beginPath();
      ctx.moveTo(30, 96);
      ctx.lineTo(30, 72);
      ctx.quadraticCurveTo(91, 34, 152, 72);
      ctx.lineTo(152, 96);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Gold bands and lock
    ctx.strokeStyle = '#2a1608';
    ctx.lineWidth = 4;
    ctx.fillStyle = '#e0b84a';
    for (const x of [44, 128]) {
      ctx.fillRect(x, open ? 92 : 62, 12, open ? 70 : 100);
      ctx.strokeRect(x, open ? 92 : 62, 12, open ? 70 : 100);
    }
    ctx.fillStyle = '#d9a24f'; // bell-shaped bronze lock
    ctx.beginPath();
    ctx.moveTo(78, 124);
    ctx.quadraticCurveTo(80, 96, 91, 94);
    ctx.quadraticCurveTo(102, 96, 104, 124);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#2a1608';
    this.circle(ctx, 91, 110, 4);
    ctx.fill();
    ctx.fillRect(89, 110, 4, 9);

    return canvas;
  },

  /**
   * A glowing orb of sound flying to the right (the game rotates it toward the target),
   * trailed by sound-wave arcs. `palette` (RGB strings) recolors it for evolved weapons.
   */
  createBolt(palette = { light: '255, 247, 214', mid: '255, 214, 107', edge: '230, 150, 40' }) {
    const canvas = this.createCanvas();
    const ctx = canvas.getContext('2d');

    // Sound-wave arcs behind the orb, fading out
    ctx.lineCap = 'round';
    [[68, 0.85, 10], [46, 0.55, 8], [26, 0.3, 6]].forEach(([x, alpha, width]) => {
      ctx.strokeStyle = `rgba(${palette.mid}, ${alpha})`;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.arc(x + 40, 91, 40, Math.PI * 0.72, Math.PI * 1.28);
      ctx.stroke();
    });

    // Glow
    const glow = ctx.createRadialGradient(112, 91, 0, 112, 91, 56);
    glow.addColorStop(0, `rgba(${palette.light}, 1)`);
    glow.addColorStop(0.35, `rgba(${palette.mid}, 0.85)`);
    glow.addColorStop(1, `rgba(${palette.edge}, 0)`);
    ctx.fillStyle = glow;
    this.circle(ctx, 112, 91, 56);
    ctx.fill();

    // Bright core
    ctx.fillStyle = '#ffffff';
    this.circle(ctx, 112, 91, 17);
    ctx.fill();
    return canvas;
  },

  /** A gold coin with a small bell stamped on it. */
  createCoin() {
    const canvas = this.createCanvas();
    const ctx = canvas.getContext('2d');
    ctx.lineJoin = 'round';

    const gold = ctx.createLinearGradient(30, 20, 150, 160);
    gold.addColorStop(0, '#fff1a8');
    gold.addColorStop(0.5, '#f2c14e');
    gold.addColorStop(1, '#b07a1e');
    ctx.fillStyle = gold;
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#6b4a12';
    this.circle(ctx, 91, 91, 70);
    ctx.fill();
    ctx.stroke();
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(107, 74, 18, 0.6)';
    this.circle(ctx, 91, 91, 54);
    ctx.stroke();

    // Stamped bell
    ctx.fillStyle = '#c98f25';
    ctx.strokeStyle = '#6b4a12';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(66, 118);
    ctx.quadraticCurveTo(70, 112, 72, 92);
    ctx.quadraticCurveTo(76, 62, 91, 60);
    ctx.quadraticCurveTo(106, 62, 110, 92);
    ctx.quadraticCurveTo(112, 112, 116, 118);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    this.circle(ctx, 91, 124, 7);
    ctx.fill();
    ctx.stroke();

    // Shine
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.beginPath();
    ctx.ellipse(62, 58, 16, 9, -0.7, 0, Math.PI * 2);
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

    // A tall crystal shard: light left face, dark right face
    const shard = [[91, 14], [124, 58], [114, 146], [91, 170], [68, 146], [58, 58]];
    ctx.beginPath();
    shard.forEach(([x, y], index) => (index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.closePath();
    ctx.fillStyle = baseColor;
    ctx.fill();
    ctx.lineJoin = 'round';
    ctx.lineWidth = 9;
    ctx.strokeStyle = darkColor;
    ctx.stroke();
    ctx.fillStyle = lightColor;
    ctx.beginPath();
    ctx.moveTo(91, 22);
    ctx.lineTo(64, 60);
    ctx.lineTo(74, 140);
    ctx.lineTo(91, 150);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.moveTo(91, 22);
    ctx.lineTo(118, 60);
    ctx.lineTo(108, 140);
    ctx.lineTo(91, 150);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillRect(76, 50, 6, 26); // sparkle

    return canvas;
  },

  /** Icons for passive items and fallback rewards: a colored badge with a white symbol. */
  createPassiveIcons() {
    return {
      iconMetronome: this.createIcon('#8e5bd6', (ctx) => {
        // A metronome: tall body with a swinging arm and weight
        ctx.beginPath();
        ctx.moveTo(56, 152);
        ctx.lineTo(126, 152);
        ctx.lineTo(104, 30);
        ctx.lineTo(78, 30);
        ctx.closePath();
      }, false, (ctx) => {
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(91, 136);
        ctx.lineTo(124, 50);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(116, 72, 9, 0, Math.PI * 2);
        ctx.fill();
      }),
      iconClapper: this.createIcon('#d9534f', (ctx) => {
        // A heavy bell clapper: a thick rod with a big ball at the end
        ctx.beginPath();
        ctx.moveTo(52, 40);
        ctx.lineTo(66, 30);
        ctx.lineTo(116, 104);
        ctx.lineTo(100, 114);
        ctx.closePath();
        ctx.moveTo(146, 128);
        ctx.arc(122, 128, 24, 0, Math.PI * 2);
      }),
      iconBoots: this.createIcon('#4cae4c', (ctx) => {
        // A boot with two speed lines behind it
        ctx.beginPath();
        ctx.moveTo(74, 36);
        ctx.lineTo(114, 36);
        ctx.lineTo(114, 104);
        ctx.lineTo(146, 112);
        ctx.quadraticCurveTo(158, 118, 156, 142);
        ctx.lineTo(68, 142);
        ctx.closePath();
        ctx.rect(22, 70, 40, 12);
        ctx.rect(30, 98, 32, 12);
      }),
      iconTuningFork: this.createIcon('#7e57c2', (ctx) => {
        // A tuning fork: two prongs joined by a curve, and a handle
        ctx.beginPath();
        ctx.moveTo(56, 28);
        ctx.lineTo(74, 28);
        ctx.lineTo(74, 86);
        ctx.arc(91, 86, 17, Math.PI, 0, true);
        ctx.lineTo(108, 28);
        ctx.lineTo(126, 28);
        ctx.lineTo(126, 86);
        ctx.arc(91, 86, 35, 0, Math.PI);
        ctx.closePath();
        ctx.rect(83, 118, 16, 42);
      }, false, (ctx) => {
        ctx.lineWidth = 4;
        for (const r of [16, 26]) {
          ctx.beginPath();
          ctx.arc(91, 50, r + 38, -0.5, 0.5); // humming waves
          ctx.stroke();
        }
      }),
      iconBronzeHeart: this.createIcon('#7d8aa0', (ctx) => this.heart(ctx, 91, 96, 52)),
      iconWishingChime: this.createIcon('#3fae5a', (ctx) => {
        // A small wishing bell with a ring on top
        ctx.beginPath();
        ctx.moveTo(40, 132);
        ctx.quadraticCurveTo(46, 120, 50, 92);
        ctx.quadraticCurveTo(56, 50, 91, 48);
        ctx.quadraticCurveTo(126, 50, 132, 92);
        ctx.quadraticCurveTo(136, 120, 142, 132);
        ctx.closePath();
        ctx.moveTo(103, 36);
        ctx.arc(91, 36, 12, 0, Math.PI * 2);
        ctx.moveTo(101, 148);
        ctx.arc(91, 148, 10, 0, Math.PI * 2);
      }, false, (ctx) => {
        // a four-leaf clover stamped on the bell
        for (const [dx, dy] of [[-7, -7], [7, -7], [-7, 7], [7, 7]]) {
          ctx.beginPath();
          ctx.arc(91 + dx, 100 + dy, 7, 0, Math.PI * 2);
          ctx.fill();
        }
      }),
      iconHeal: this.createIcon('#2fa86f', (ctx) => {
        ctx.beginPath();
        ctx.rect(76, 38, 30, 106);
        ctx.rect(38, 76, 106, 30);
      }),
      iconXpGain: this.createIcon('#2f7fc1', (ctx) => {
        // A crystal shard
        ctx.beginPath();
        ctx.moveTo(91, 26);
        ctx.lineTo(138, 91);
        ctx.lineTo(91, 156);
        ctx.lineTo(44, 91);
        ctx.closePath();
      }),
      iconCoins: this.createIcon('#e0a92e', (ctx) => {
        // A coin: ring + slot
        ctx.beginPath();
        ctx.arc(91, 91, 58, 0, Math.PI * 2);
        ctx.arc(91, 91, 40, 0, Math.PI * 2, true);
        ctx.rect(84, 64, 14, 54);
      }),
    };
  },

  /** A spinning dagger for the Peal Blades (points up; the game rotates it). */
  createOrbitBlade(colors = { glow: '255, 214, 140', steelLight: '#fbf1d0', steelDark: '#c9963f', guard: '#2d8084', grip: '#164447' }) {
    const canvas = this.createCanvas();
    const ctx = canvas.getContext('2d');

    const glow = ctx.createRadialGradient(91, 80, 4, 91, 80, 86);
    glow.addColorStop(0, `rgba(${colors.glow}, 0.55)`);
    glow.addColorStop(1, `rgba(${colors.glow}, 0)`);
    ctx.fillStyle = glow;
    this.circle(ctx, 91, 80, 86);
    ctx.fill();

    ctx.lineJoin = 'round';
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#1c2230';

    // Blade
    const steel = ctx.createLinearGradient(70, 0, 112, 0);
    steel.addColorStop(0, colors.steelLight);
    steel.addColorStop(1, colors.steelDark);
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
    ctx.fillStyle = colors.guard;
    this.roundRect(ctx, 60, 124, 62, 14, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = colors.grip || '#6b4a2f';
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

  /** Icons for evolved weapons: richer colors and a golden inner frame. */
  createEvolvedIcons() {
    return {
      iconCarillonStorm: this.createIcon('#b8329c', (ctx) => {
        // Two bolts
        ctx.beginPath();
        for (const [x, y] of [[118, 62], [92, 110]]) {
          ctx.moveTo(x + 22, y);
          ctx.arc(x, y, 22, 0, Math.PI * 2);
          ctx.moveTo(x - 16, y + 14);
          ctx.lineTo(x - 56, y + 50);
          ctx.lineTo(x - 6, y + 22);
          ctx.closePath();
        }
      }, true),
      iconChoirOfBlades: this.createIcon('#c9930f', (ctx) => this.star(ctx, 91, 91, 6, 64, 18), true),
      iconCathedralToll: this.createIcon('#e0a93a', (ctx) => this.star(ctx, 91, 91, 12, 66, 34), true),
      iconStormKnell: this.createIcon('#3657b8', (ctx) => {
        // A crown with a lightning bolt on it
        ctx.beginPath();
        ctx.moveTo(34, 140);
        ctx.lineTo(34, 62);
        ctx.lineTo(62, 92);
        ctx.lineTo(91, 46);
        ctx.lineTo(120, 92);
        ctx.lineTo(148, 62);
        ctx.lineTo(148, 140);
        ctx.closePath();
      }, true),
    };
  },

  /**
   * Badge + symbol. drawSymbol(ctx) only builds a path; it is filled white with a dark outline.
   * evolved = true adds a golden inner frame.
   */
  createIcon(color, drawSymbol, evolved = false, details = null) {
    const canvas = this.createCanvas();
    const ctx = canvas.getContext('2d');

    this.roundRect(ctx, 12, 12, 158, 158, 34);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.lineWidth = 8;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.stroke();
    if (evolved) {
      this.roundRect(ctx, 22, 22, 138, 138, 26);
      ctx.lineWidth = 5;
      ctx.strokeStyle = '#ffe08a';
      ctx.stroke();
    }
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
    if (details) {
      // Small dark details on top of the white symbol
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      details(ctx);
    }
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
