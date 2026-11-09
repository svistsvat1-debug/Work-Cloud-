/**
 * Creates sprites with canvas drawing code, so the game needs no image files.
 *
 * Every character sprite is drawn into a 182x182 canvas (GameConfig.spriteSourceSize).
 * The game then draws that canvas smaller on screen (drawSize in GameConfig).
 */
const ProceduralSprites = {
  createAll() {
    return {
      player: this.createPlayer(),
      slime: this.createSlime(),
      bat: this.createBat(),
      projectile: this.createProjectile(),
    };
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

  // ---------- small drawing helpers ----------

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
