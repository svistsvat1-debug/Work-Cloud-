/**
 * Drawing helpers shared by the player, enemies and the UI,
 * so everything draws sprites, shadows and bars the same way.
 */
const DrawUtils = {
  /** Soft oval shadow on the ground. */
  shadow(ctx, x, y, width, alpha = 0.35) {
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    ctx.beginPath();
    ctx.ellipse(x, y, width, width * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
  },

  /**
   * Draws a character sprite centered on (x, y) at the given on-screen size.
   * facing = -1 mirrors it. scaleX / scaleY squash or stretch it around the feet.
   */
  character(ctx, image, x, y, size, facing = 1, scaleX = 1, scaleY = 1, alpha = 1) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y + size / 2); // pivot at the feet
    ctx.scale(facing * scaleX, scaleY);
    ctx.drawImage(image, -size / 2, -size, size, size);
    ctx.restore();
  },

  /** Draws a sprite centered on (x, y), rotated by `rotation` radians. */
  rotated(ctx, image, x, y, size, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.drawImage(image, -size / 2, -size / 2, size, size);
    ctx.restore();
  },

  /**
   * A horizontal bar (health, XP...). `fraction` is 0..1.
   * (x, y) is the top-left corner.
   */
  bar(ctx, x, y, width, height, fraction, fillColor, backColor = 'rgba(10, 8, 12, 0.75)') {
    ctx.fillStyle = backColor;
    ctx.fillRect(x - 2, y - 2, width + 4, height + 4);
    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y, width * MathUtils.clamp(fraction, 0, 1), height);
  },

  /** Green when healthy, yellow when hurt, red when almost dead. */
  healthColor(fraction) {
    if (fraction > 0.6) return '#5ad66f';
    if (fraction > 0.3) return '#f2c94c';
    return '#ef5050';
  },
};
