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

  // ---------- small drawing helpers ----------

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
