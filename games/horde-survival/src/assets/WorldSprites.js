/**
 * Procedural art for the world: seamless ground tiles, large ground patches
 * (moss, dirt, old stone floor) and small decorations (rocks, bones, candles...).
 * Everything is drawn once at startup into canvases, then reused every frame.
 */
const WorldSprites = {
  createAll() {
    const size = GameConfig.world.tileSize;
    const sprites = {
      groundTiles: [],
      patches: {
        moss: this.createPatch('rgba(16, 30, 18, 0.26)'),
        dirt: this.createPatch('rgba(84, 66, 42, 0.22)'),
        meadow: this.createPatch('rgba(90, 120, 80, 0.14)'),
        stone: this.createStoneFloor(),
      },
      candleGlow: this.createGlow('255, 190, 110'),
      decoGrass: this.createGrassTuft(),
      decoStones: this.createStones(),
      decoRock: this.createRock(),
      decoBones: this.createBones(),
      decoCandles: this.createCandles(),
      decoGrave: this.createGrave(),
      decoPillar: this.createPillar(),
      decoBell: this.createFallenBell(),
    };
    for (let i = 0; i < GameConfig.world.groundVariants; i++) sprites.groundTiles.push(this.createGroundTile(size));
    return sprites;
  },

  canvas(size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    return canvas;
  },

  // ---------------------------------------------------------------- Ground

  /**
   * A seamless ground tile: dark mossy grass with specks, blades and pebbles.
   * Anything crossing an edge is drawn again on the opposite side, so tiles fit
   * together without visible seams.
   */
  createGroundTile(size) {
    const canvas = this.canvas(size);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#25322a';
    ctx.fillRect(0, 0, size, size);

    const wrapped = (draw, x, y, reach) => {
      for (const dx of [0, -size, size]) {
        for (const dy of [0, -size, size]) {
          if (dx !== 0 && Math.abs(x + dx - size / 2) > size / 2 + reach) continue;
          if (dy !== 0 && Math.abs(y + dy - size / 2) > size / 2 + reach) continue;
          draw(x + dx, y + dy);
        }
      }
    };

    // Soft specks of darker and lighter green
    const specks = ['#1f2a23', '#2a382e', '#2f3e33', '#1b251e'];
    for (let i = 0; i < 1100; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const s = 1 + Math.random() * 3;
      ctx.fillStyle = specks[i % specks.length];
      wrapped((px, py) => ctx.fillRect(px, py, s, s), x, y, 4);
    }

    // Short grass blades
    ctx.lineCap = 'round';
    for (let i = 0; i < 150; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const length = 4 + Math.random() * 7;
      const lean = (Math.random() - 0.5) * 5;
      ctx.strokeStyle = Math.random() < 0.5 ? '#304436' : '#36503d';
      ctx.lineWidth = 2;
      wrapped((px, py) => {
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + lean, py - length);
        ctx.stroke();
      }, x, y, 12);
    }

    // A few pebbles with a tiny highlight
    for (let i = 0; i < 14; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = 2 + Math.random() * 3;
      wrapped((px, py) => {
        ctx.fillStyle = '#3c4541';
        ctx.beginPath();
        ctx.ellipse(px, py, r * 1.3, r, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.fillRect(px - r * 0.6, py - r * 0.6, r * 0.7, r * 0.5);
      }, x, y, 8);
    }
    return canvas;
  },

  /** A soft, irregular blob used to break up the ground into larger areas. */
  createPatch(color) {
    const canvas = this.canvas(256);
    const ctx = canvas.getContext('2d');
    for (let i = 0; i < 9; i++) {
      const x = 128 + (Math.random() - 0.5) * 90;
      const y = 128 + (Math.random() - 0.5) * 90;
      const r = 50 + Math.random() * 60;
      const blob = ctx.createRadialGradient(x, y, 0, x, y, r);
      blob.addColorStop(0, color);
      blob.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = blob;
      ctx.fillRect(0, 0, 256, 256);
    }
    return canvas;
  },

  /** A patch of old cobblestones (ruined floor) that fades out at the edges. */
  createStoneFloor() {
    const canvas = this.canvas(256);
    const ctx = canvas.getContext('2d');
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const x = col * 30 + (row % 2) * 15 + 4;
        const y = row * 28 + 6;
        const distance = Math.hypot(x + 13 - 128, y + 12 - 128) / 128;
        if (distance > 0.95 || Math.random() < distance * 0.55) continue; // ragged, fading edge
        ctx.globalAlpha = Math.max(0, 0.5 - distance * 0.4);
        ctx.fillStyle = Math.random() < 0.5 ? '#4a504c' : '#42484a';
        this.roundRect(ctx, x, y, 26, 24, 6);
        ctx.fill();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
        ctx.fillRect(x + 4, y + 3, 14, 4);
        ctx.fillStyle = 'rgba(40, 70, 40, 0.5)'; // moss between stones
        ctx.fillRect(x - 2, y + 22, 30, 3);
      }
    }
    ctx.globalAlpha = 1;
    return canvas;
  },

  createGlow(rgb) {
    const canvas = this.canvas(128);
    const ctx = canvas.getContext('2d');
    const glow = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    glow.addColorStop(0, `rgba(${rgb}, 0.55)`);
    glow.addColorStop(1, `rgba(${rgb}, 0)`);
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, 128, 128);
    return canvas;
  },

  // ---------------------------------------------------------------- Decorations (128x128)

  createGrassTuft() {
    const canvas = this.canvas(128);
    const ctx = canvas.getContext('2d');
    const blades = [[-30, 50, '#2f4a35'], [-18, 64, '#3a5a40'], [-6, 72, '#2f4a35'], [6, 66, '#45684a'], [18, 56, '#3a5a40'], [30, 44, '#2f4a35'], [0, 50, '#4f7752']];
    for (const [lean, height, color] of blades) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(64 - 7 + lean * 0.2, 112);
      ctx.quadraticCurveTo(64 + lean * 0.6, 112 - height * 0.6, 64 + lean, 112 - height);
      ctx.quadraticCurveTo(64 + lean * 0.4, 112 - height * 0.5, 64 + 7 + lean * 0.2, 112);
      ctx.closePath();
      ctx.fill();
    }
    return canvas;
  },

  createStones() {
    const canvas = this.canvas(128);
    const ctx = canvas.getContext('2d');
    for (const [x, y, w, h] of [[40, 92, 26, 18], [70, 98, 34, 22], [58, 76, 20, 14], [92, 84, 16, 12]]) {
      this.stone(ctx, x, y, w, h, '#5b625f');
    }
    return canvas;
  },

  createRock() {
    const canvas = this.canvas(128);
    const ctx = canvas.getContext('2d');
    ctx.lineJoin = 'round';
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#171c1b';
    ctx.fillStyle = '#5d6562';
    ctx.beginPath();
    ctx.moveTo(18, 108);
    ctx.lineTo(26, 70);
    ctx.lineTo(52, 44);
    ctx.lineTo(86, 46);
    ctx.lineTo(108, 70);
    ctx.lineTo(112, 108);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    ctx.moveTo(32, 72);
    ctx.lineTo(54, 50);
    ctx.lineTo(70, 52);
    ctx.lineTo(44, 80);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#3f6b45'; // moss on top
    ctx.beginPath();
    ctx.ellipse(70, 52, 24, 8, -0.1, 0, Math.PI * 2);
    ctx.fill();
    return canvas;
  },

  createBones() {
    const canvas = this.canvas(128);
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#2b2620';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(30, 104);
    ctx.lineTo(98, 86);
    ctx.moveTo(36, 82);
    ctx.lineTo(96, 108);
    ctx.stroke();
    ctx.strokeStyle = '#d8d0bd';
    ctx.lineWidth = 7;
    ctx.stroke();
    // Skull
    ctx.fillStyle = '#e2dac6';
    ctx.strokeStyle = '#2b2620';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(62, 70, 20, Math.PI, 0);
    ctx.lineTo(80, 84);
    ctx.lineTo(44, 84);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#2b2620';
    for (const x of [54, 70]) {
      ctx.beginPath();
      ctx.arc(x, 72, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    return canvas;
  },

  createCandles() {
    const canvas = this.canvas(128);
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#2a2219';
    ctx.lineWidth = 4;
    for (const [x, top] of WorldSprites.CANDLE_TOPS) {
      const px = x * 128;
      const py = top * 128;
      ctx.fillStyle = '#e8dcc0';
      this.roundRect(ctx, px - 8, py, 16, 112 - py, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'; // wax drip highlight
      ctx.fillRect(px - 5, py + 4, 3, 12);
      ctx.strokeStyle = '#2a2219';
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px, py - 6); // wick
      ctx.stroke();
    }
    return canvas;
  },

  createGrave() {
    const canvas = this.canvas(128);
    const ctx = canvas.getContext('2d');
    ctx.lineJoin = 'round';
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#161a1a';
    ctx.fillStyle = '#6b716f';
    ctx.beginPath();
    ctx.moveTo(34, 114);
    ctx.lineTo(34, 50);
    ctx.arc(64, 50, 30, Math.PI, 0);
    ctx.lineTo(94, 114);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(20, 24, 24, 0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(56, 34);
    ctx.lineTo(62, 52);
    ctx.lineTo(54, 66); // crack
    ctx.moveTo(48, 76);
    ctx.lineTo(80, 76);
    ctx.moveTo(64, 64);
    ctx.lineTo(64, 92); // engraved cross
    ctx.stroke();
    ctx.fillStyle = '#3f6b45';
    ctx.fillRect(30, 104, 68, 10); // grass at the base
    return canvas;
  },

  createPillar() {
    const canvas = this.canvas(128);
    const ctx = canvas.getContext('2d');
    ctx.lineJoin = 'round';
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#151918';
    ctx.fillStyle = '#7a807c';
    ctx.beginPath();
    ctx.moveTo(42, 116);
    ctx.lineTo(42, 34);
    ctx.lineTo(54, 26);
    ctx.lineTo(62, 36);
    ctx.lineTo(74, 22);
    ctx.lineTo(86, 34);
    ctx.lineTo(86, 116);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(20, 24, 24, 0.45)';
    ctx.lineWidth = 3;
    for (const x of [54, 64, 74]) {
      ctx.beginPath();
      ctx.moveTo(x, 40);
      ctx.lineTo(x, 112);
      ctx.stroke();
    }
    ctx.fillStyle = '#5d6562';
    this.stone(ctx, 24, 112, 18, 10, '#5d6562');
    this.stone(ctx, 98, 110, 22, 12, '#5d6562');
    return canvas;
  },

  /** A small cracked bronze bell, half sunk into the ground (a nod to the game's story). */
  createFallenBell() {
    const canvas = this.canvas(128);
    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.translate(64, 80);
    ctx.rotate(-0.5);
    ctx.lineJoin = 'round';
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#2a1a0c';
    const bronze = ctx.createLinearGradient(-30, -40, 30, 30);
    bronze.addColorStop(0, '#e0a95a');
    bronze.addColorStop(1, '#7a4a1e');
    ctx.fillStyle = bronze;
    ctx.beginPath();
    ctx.moveTo(-34, 28);
    ctx.quadraticCurveTo(-28, 20, -24, -6);
    ctx.quadraticCurveTo(-18, -38, 0, -40);
    ctx.quadraticCurveTo(18, -38, 24, -6);
    ctx.quadraticCurveTo(28, 20, 34, 28);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#1d1208';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(4, -38);
    ctx.lineTo(-4, -16);
    ctx.lineTo(6, 2);
    ctx.lineTo(0, 22); // the crack
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#25322a'; // ground covering the lower part
    ctx.beginPath();
    ctx.ellipse(64, 112, 48, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    return canvas;
  },

  // ---------------------------------------------------------------- Helpers

  stone(ctx, x, y, width, height, color) {
    ctx.fillStyle = color;
    ctx.strokeStyle = '#1a1f1e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(x, y, width / 2, height / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.ellipse(x - width * 0.15, y - height * 0.2, width * 0.22, height * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
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

/** Where the candle flames sit inside the 128x128 candles sprite (as fractions). */
WorldSprites.CANDLE_TOPS = [
  [0.3, 0.5],
  [0.5, 0.34],
  [0.7, 0.56],
];
