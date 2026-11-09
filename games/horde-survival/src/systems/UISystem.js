/**
 * UISystem draws everything that sits on top of the world: text, bars, menus.
 * It always works in screen coordinates (0..1920, 0..1080).
 */
class UISystem {
  constructor(game) {
    this.game = game;
  }

  render() {
    const { ctx, player } = this.game;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    this.drawText(ctx, GameConfig.ui.title, 40, 36, { size: 44, weight: 'bold' });
    this.drawText(ctx, 'Move with WASD or the arrow keys', 40, 92, { size: 24, color: '#b9c4bd' });

    const right = this.game.width - 40;
    this.drawText(ctx, `FPS: ${this.game.fps}`, right, 36, { size: 26, align: 'right' });
    this.drawText(ctx, `X: ${Math.round(player.x)}   Y: ${Math.round(player.y)}`, right, 72, {
      size: 26,
      align: 'right',
    });

    ctx.restore();
  }

  /** Text with a dark drop shadow, so it stays readable on any background. */
  drawText(ctx, text, x, y, { size = 24, weight = 'normal', color = '#ffffff', align = 'left' } = {}) {
    ctx.font = `${weight} ${size}px ${GameConfig.ui.font}`;
    ctx.textAlign = align;
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillText(text, x + 2, y + 3);
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }
}
