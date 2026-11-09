/**
 * The picture behind the start screen and the shop.
 * Uses the image from GameConfig.ui.menuBackgroundImage when it has loaded;
 * otherwise (no image, or still loading) draws a simple dusk landscape with code.
 */
const MenuBackground = {
  image: null,
  loaded: false,

  load() {
    const src = GameConfig.ui.menuBackgroundImage;
    if (!src) return;
    this.image = new Image();
    this.image.onload = () => {
      this.loaded = true;
    };
    this.image.onerror = () => {
      this.image = null; // missing file: keep using the drawn background
    };
    this.image.src = src;
  },

  /** dim (0..1) darkens the whole picture, e.g. behind the shop cards. */
  render(ctx, game, time, dim = 0) {
    const { width, height } = game;
    if (this.loaded) ctx.drawImage(this.image, 0, 0, width, height);
    else this.renderFallback(ctx, width, height, time);

    // Darker at the bottom, so text and buttons stay readable.
    const shade = ctx.createLinearGradient(0, height * 0.55, 0, height);
    shade.addColorStop(0, 'rgba(5, 6, 12, 0)');
    shade.addColorStop(1, 'rgba(5, 6, 12, 0.75)');
    ctx.fillStyle = shade;
    ctx.fillRect(0, 0, width, height);
    if (dim > 0) {
      ctx.fillStyle = `rgba(6, 8, 14, ${dim})`;
      ctx.fillRect(0, 0, width, height);
    }
  },

  /** Dusk sky, mountains and a castle with a bell tower, drawn with code. */
  renderFallback(ctx, width, height, time) {
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, '#3b2a4f');
    sky.addColorStop(0.42, '#d9875a');
    sky.addColorStop(0.62, '#6a4f6e');
    sky.addColorStop(1, '#141a1f');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    // Setting sun
    const sun = ctx.createRadialGradient(width * 0.55, height * 0.56, 10, width * 0.55, height * 0.56, 260);
    sun.addColorStop(0, 'rgba(255, 226, 160, 0.95)');
    sun.addColorStop(1, 'rgba(255, 180, 110, 0)');
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, width, height);

    // Two mountain layers: far (hazy violet) and near (dark)
    this.mountains(ctx, width, height * 0.62, 140, '#5b4566', 7, 1.3);
    this.mountains(ctx, width, height * 0.74, 120, '#2a2f38', 5, 2.1);

    // Castle with a bell tower on the right
    ctx.fillStyle = '#1b1d26';
    const baseX = width * 0.72;
    const baseY = height * 0.6;
    ctx.fillRect(baseX, baseY - 120, 260, 140);
    ctx.fillRect(baseX + 100, baseY - 300, 70, 200); // bell tower
    ctx.fillRect(baseX - 20, baseY - 180, 50, 200);
    ctx.fillRect(baseX + 230, baseY - 170, 50, 190);
    ctx.beginPath();
    ctx.moveTo(baseX + 92, baseY - 300);
    ctx.lineTo(baseX + 135, baseY - 360);
    ctx.lineTo(baseX + 178, baseY - 300);
    ctx.fill();
    // Warm windows that flicker a little
    ctx.fillStyle = `rgba(255, 200, 110, ${0.75 + Math.sin(time * 3) * 0.15})`;
    for (const [x, y] of [[40, -90], [80, -60], [180, -80], [125, -250], [125, -200]]) {
      ctx.fillRect(baseX + x, baseY + y, 10, 16);
    }

    // Dark foreground hill
    ctx.fillStyle = '#0f1416';
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(0, height * 0.82);
    ctx.quadraticCurveTo(width * 0.3, height * 0.74, width * 0.55, height * 0.86);
    ctx.quadraticCurveTo(width * 0.8, height * 0.95, width, height * 0.84);
    ctx.lineTo(width, height);
    ctx.fill();
  },

  /** A jagged mountain range along `baseY`. */
  mountains(ctx, width, baseY, peakHeight, color, peaks, seed) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, baseY + 200);
    for (let i = 0; i <= peaks * 2; i++) {
      const x = (i / (peaks * 2)) * width;
      const up = i % 2 === 1;
      const variation = Math.sin(i * seed * 3.1) * 0.35 + 0.65;
      ctx.lineTo(x, up ? baseY - peakHeight * variation : baseY - peakHeight * 0.2);
    }
    ctx.lineTo(width, baseY + 200);
    ctx.closePath();
    ctx.fill();
  },
};
