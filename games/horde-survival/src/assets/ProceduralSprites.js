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
      crawler: this.createCrawler(),
      brute: this.createBrute(),
      elite: this.createElite(),
      boss: this.createBoss(),
      chest: this.createChest(false),
      chestOpen: this.createChest(true),
      arcaneBolt: this.createBolt(),
      stormBolt: this.createBolt({ tail: '255, 120, 230', light: '255, 225, 250', mid: '255, 110, 220', edge: '160, 60, 255' }),
      orbitBlade: this.createOrbitBlade(),
      celestialBlade: this.createOrbitBlade({ glow: '255, 220, 120', steelLight: '#fff8d6', steelDark: '#e0b84a', guard: '#ffffff' }),
      ...this.createEvolvedIcons(),
      gemBlue: this.createGem('#4fc3ff', '#d2f1ff', '#1b5f99'),
      gemGreen: this.createGem('#4fe07a', '#d4ffdf', '#1d7a3a'),
      gemRed: this.createGem('#ff5a6e', '#ffd0d6', '#9b1f30'),
      ...this.createPassiveIcons(),
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

  /** An orange beetle on six legs. Faces right. */
  createCrawler() {
    const canvas = this.createCanvas();
    const ctx = canvas.getContext('2d');
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // Legs (behind the body)
    ctx.strokeStyle = '#3d1d0b';
    ctx.lineWidth = 8;
    for (let i = 0; i < 3; i++) {
      const x = 58 + i * 28;
      ctx.beginPath();
      ctx.moveTo(x, 118);
      ctx.lineTo(x - 16, 142);
      ctx.lineTo(x - 6, 164);
      ctx.stroke();
    }

    // Antennae
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(140, 96);
    ctx.quadraticCurveTo(150, 70, 168, 64);
    ctx.moveTo(130, 96);
    ctx.quadraticCurveTo(132, 68, 146, 56);
    ctx.stroke();

    // Shell
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#3d1d0b';
    const shell = ctx.createLinearGradient(0, 74, 0, 142);
    shell.addColorStop(0, '#ffb066');
    shell.addColorStop(1, '#c9561c');
    ctx.fillStyle = shell;
    ctx.beginPath();
    ctx.ellipse(86, 110, 54, 34, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(80, 30, 8, 0.45)';
    for (const [x, y, r] of [[62, 100, 8], [86, 94, 7], [104, 112, 8], [72, 120, 6]]) {
      this.circle(ctx, x, y, r);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.beginPath();
    ctx.ellipse(70, 88, 20, 7, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Head with eyes and mandibles
    ctx.fillStyle = '#a8441a';
    this.circle(ctx, 138, 112, 21);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffe066';
    this.circle(ctx, 146, 106, 6);
    ctx.fill();
    ctx.fillStyle = '#1a0d05';
    this.circle(ctx, 148, 106, 3);
    ctx.fill();
    ctx.strokeStyle = '#f2e6d0';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(152, 120);
    ctx.quadraticCurveTo(166, 120, 164, 132);
    ctx.stroke();

    return canvas;
  },

  /** A big horned brute. Faces right. */
  createBrute() {
    return this.createHornedBeast({
      bodyTop: '#c4a383',
      bodyBottom: '#7a5c42',
      belly: '#dcc3a2',
      outline: '#2d1f14',
      horn: '#efe3c8',
      eye: '#ffffff',
      pupil: '#1a1008',
      glow: null,
    });
  },

  /** A crimson, gold-armored elite with glowing eyes. Faces right. */
  createElite() {
    return this.createHornedBeast({
      bodyTop: '#d9474f',
      bodyBottom: '#6e1621',
      belly: '#e2b34a',
      outline: '#22080c',
      horn: '#2a1418',
      hornTip: '#ffd166',
      eye: '#ffe066',
      pupil: '#ff8a00',
      glow: 'rgba(255, 70, 70, 0.55)',
    });
  },

  /** Shared drawing for the brute and the elite: same shape, different colors. */
  createHornedBeast(colors) {
    const canvas = this.createCanvas();
    const ctx = canvas.getContext('2d');
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    if (colors.glow) {
      const aura = ctx.createRadialGradient(91, 104, 20, 91, 104, 90);
      aura.addColorStop(0, colors.glow);
      aura.addColorStop(1, 'rgba(255, 70, 70, 0)');
      ctx.fillStyle = aura;
      this.circle(ctx, 91, 104, 90);
      ctx.fill();
    }

    ctx.lineWidth = 6;
    ctx.strokeStyle = colors.outline;

    // Horns
    for (const side of [-1, 1]) {
      ctx.fillStyle = colors.horn;
      ctx.beginPath();
      ctx.moveTo(91 + side * 22, 62);
      ctx.quadraticCurveTo(91 + side * 52, 50, 91 + side * 54, 18);
      ctx.quadraticCurveTo(91 + side * 66, 52, 91 + side * 40, 72);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      if (colors.hornTip) {
        ctx.fillStyle = colors.hornTip;
        this.circle(ctx, 91 + side * 54, 22, 6);
        ctx.fill();
      }
    }

    // Fists
    ctx.fillStyle = colors.bodyBottom;
    this.circle(ctx, 30, 130, 19);
    ctx.fill();
    ctx.stroke();
    this.circle(ctx, 154, 132, 21);
    ctx.fill();
    ctx.stroke();

    // Body
    const body = ctx.createLinearGradient(0, 52, 0, 170);
    body.addColorStop(0, colors.bodyTop);
    body.addColorStop(1, colors.bodyBottom);
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(91, 112, 62, 58, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Belly / chest plate
    ctx.fillStyle = colors.belly;
    ctx.beginPath();
    ctx.ellipse(96, 130, 34, 26, 0, 0, Math.PI * 2);
    ctx.fill();

    // Angry face looking right
    ctx.fillStyle = colors.eye;
    this.circle(ctx, 104, 92, 9);
    ctx.fill();
    this.circle(ctx, 130, 92, 9);
    ctx.fill();
    ctx.fillStyle = colors.pupil;
    this.circle(ctx, 107, 93, 4.5);
    ctx.fill();
    this.circle(ctx, 133, 93, 4.5);
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(94, 78);
    ctx.lineTo(114, 84);
    ctx.moveTo(140, 78);
    ctx.lineTo(122, 84);
    ctx.stroke();

    // Tusks
    ctx.fillStyle = '#f7f1e3';
    ctx.lineWidth = 3;
    for (const x of [108, 128]) {
      ctx.beginPath();
      ctx.moveTo(x - 5, 112);
      ctx.lineTo(x, 98);
      ctx.lineTo(x + 5, 112);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    return canvas;
  },

  /** The boss: a hulking shadow giant with one huge glowing eye. Faces right. */
  createBoss() {
    const canvas = this.createCanvas();
    const ctx = canvas.getContext('2d');
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // Purple aura
    const aura = ctx.createRadialGradient(91, 100, 20, 91, 100, 91);
    aura.addColorStop(0, 'rgba(199, 125, 255, 0.55)');
    aura.addColorStop(1, 'rgba(199, 125, 255, 0)');
    ctx.fillStyle = aura;
    this.circle(ctx, 91, 100, 91);
    ctx.fill();

    ctx.lineWidth = 6;
    ctx.strokeStyle = '#0e0716';

    // Spikes along the back
    ctx.fillStyle = '#2a1840';
    for (let i = 0; i < 5; i++) {
      const x = 40 + i * 25;
      ctx.beginPath();
      ctx.moveTo(x - 13, 66);
      ctx.lineTo(x, 22 + Math.abs(i - 2) * 9);
      ctx.lineTo(x + 13, 66);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Fists
    ctx.fillStyle = '#3a2556';
    this.circle(ctx, 26, 134, 21);
    ctx.fill();
    ctx.stroke();
    this.circle(ctx, 158, 136, 23);
    ctx.fill();
    ctx.stroke();

    // Body
    const body = ctx.createLinearGradient(0, 50, 0, 172);
    body.addColorStop(0, '#6b4a8f');
    body.addColorStop(1, '#241536');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(30, 120);
    ctx.bezierCurveTo(26, 64, 60, 48, 91, 48);
    ctx.bezierCurveTo(122, 48, 158, 64, 154, 120);
    ctx.bezierCurveTo(152, 160, 124, 170, 91, 170);
    ctx.bezierCurveTo(58, 170, 32, 160, 30, 120);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing cracks
    ctx.strokeStyle = 'rgba(214, 150, 255, 0.85)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(52, 132);
    ctx.lineTo(62, 118);
    ctx.lineTo(58, 104);
    ctx.moveTo(70, 156);
    ctx.lineTo(80, 142);
    ctx.stroke();

    // One huge eye looking right
    const eye = ctx.createRadialGradient(110, 96, 4, 110, 96, 26);
    eye.addColorStop(0, '#fff2ff');
    eye.addColorStop(0.45, '#ff6fe1');
    eye.addColorStop(1, '#8a1fa0');
    ctx.fillStyle = eye;
    ctx.strokeStyle = '#0e0716';
    ctx.lineWidth = 5;
    this.circle(ctx, 110, 96, 24);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#12051a';
    ctx.beginPath();
    ctx.ellipse(115, 96, 5, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Jagged teeth
    ctx.fillStyle = '#f4ecff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(80, 136);
    for (let i = 0; i < 6; i++) {
      ctx.lineTo(86 + i * 10, 148);
      ctx.lineTo(91 + i * 10, 136);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

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
    this.roundRect(ctx, 78, 94, 26, 30, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#2a1608';
    this.circle(ctx, 91, 106, 4);
    ctx.fill();
    ctx.fillRect(89, 106, 4, 10);

    return canvas;
  },

  /**
   * A glowing magic bolt flying to the right (the game rotates it toward the target).
   * `palette` (RGB strings) lets evolved weapons reuse the same shape in other colors.
   */
  createBolt(palette = { tail: '120, 220, 255', light: '210, 250, 255', mid: '110, 220, 255', edge: '60, 160, 255' }) {
    const canvas = this.createCanvas();
    const ctx = canvas.getContext('2d');

    // Tail
    const tail = ctx.createLinearGradient(4, 0, 91, 0);
    tail.addColorStop(0, `rgba(${palette.tail}, 0)`);
    tail.addColorStop(1, `rgba(${palette.light}, 0.9)`);
    ctx.fillStyle = tail;
    ctx.beginPath();
    ctx.moveTo(4, 91);
    ctx.quadraticCurveTo(50, 70, 91, 72);
    ctx.lineTo(91, 110);
    ctx.quadraticCurveTo(50, 112, 4, 91);
    ctx.fill();

    // Glow
    const glow = ctx.createRadialGradient(91, 91, 0, 91, 91, 52);
    glow.addColorStop(0, `rgba(${palette.light}, 1)`);
    glow.addColorStop(0.35, `rgba(${palette.mid}, 0.85)`);
    glow.addColorStop(1, `rgba(${palette.edge}, 0)`);
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

  /** Icons for passive items and fallback rewards: a colored badge with a white symbol. */
  createPassiveIcons() {
    return {
      iconSpellbook: this.createIcon('#8e5bd6', (ctx) => {
        // An open book
        ctx.beginPath();
        ctx.moveTo(91, 62);
        ctx.quadraticCurveTo(62, 40, 32, 46);
        ctx.lineTo(32, 136);
        ctx.quadraticCurveTo(62, 130, 91, 150);
        ctx.quadraticCurveTo(120, 130, 150, 136);
        ctx.lineTo(150, 46);
        ctx.quadraticCurveTo(120, 40, 91, 62);
        ctx.closePath();
      }),
      iconPowerStone: this.createIcon('#d9534f', (ctx) => {
        // A cut gemstone
        ctx.beginPath();
        ctx.moveTo(91, 30);
        ctx.lineTo(140, 66);
        ctx.lineTo(122, 148);
        ctx.lineTo(60, 148);
        ctx.lineTo(42, 66);
        ctx.closePath();
      }),
      iconWindBoots: this.createIcon('#4cae4c', (ctx) => {
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
      iconMagnetCharm: this.createIcon('#7e57c2', (ctx) => {
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
      iconIronHeart: this.createIcon('#7d8aa0', (ctx) => this.heart(ctx, 91, 96, 52)),
      iconCloverCoin: this.createIcon('#3fae5a', (ctx) => {
        // Four-leaf clover: four round leaves and a stem
        ctx.beginPath();
        for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
          ctx.moveTo(91 + dx * 24 + 26, 84 + dy * 24);
          ctx.arc(91 + dx * 24, 84 + dy * 24, 26, 0, Math.PI * 2);
        }
        ctx.rect(85, 110, 12, 50);
      }),
      iconHeal: this.createIcon('#2fa86f', (ctx) => {
        ctx.beginPath();
        ctx.rect(76, 38, 30, 106);
        ctx.rect(38, 76, 106, 30);
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

  /** A spinning dagger for the Orbiting Blade (points up; the game rotates it). */
  createOrbitBlade(colors = { glow: '180, 220, 255', steelLight: '#f4f8ff', steelDark: '#93a4bd', guard: '#e0b84a' }) {
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

  /** Icons for evolved weapons: richer colors and a golden inner frame. */
  createEvolvedIcons() {
    return {
      iconArcaneStorm: this.createIcon('#b8329c', (ctx) => {
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
      iconCelestialBlades: this.createIcon('#c9930f', (ctx) => this.star(ctx, 91, 91, 6, 64, 18), true),
      iconDivineNova: this.createIcon('#e0a93a', (ctx) => this.star(ctx, 91, 91, 12, 66, 34), true),
      iconThunderCrown: this.createIcon('#3657b8', (ctx) => {
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
  createIcon(color, drawSymbol, evolved = false) {
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
