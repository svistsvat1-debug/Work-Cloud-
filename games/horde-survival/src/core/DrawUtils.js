/**
 * Drawing helpers shared by the player, enemies and other objects,
 * so every object draws its sprite and shadow the same way.
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
  character(ctx, image, x, y, size, facing = 1, scaleX = 1, scaleY = 1) {
    ctx.save();
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
};
