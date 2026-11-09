/**
 * UISystem draws everything that sits on top of the world: text, bars, menus.
 * It always works in screen coordinates (0..1920, 0..1080).
 */
class UISystem {
  constructor(game) {
    this.game = game;
    // Clickable area of the restart button on the game over screen.
    this.restartButton = { x: 780, y: 690, width: 360, height: 84 };
    // The HP bar shows recent damage as a lighter "trail" that catches up.
    this.healthTrail = 1;
  }

  render() {
    const ctx = this.game.ctx;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    this.renderHud(ctx);
    if (this.game.state === 'gameover') this.renderGameOver(ctx);

    ctx.restore();
  }

  renderHud(ctx) {
    const { player, width, height } = this.game;

    this.renderPlayerHealth(ctx, player);

    // Top center: survival timer
    this.drawText(ctx, MathUtils.formatTime(this.game.survivalTime), width / 2, 28, {
      size: 56,
      weight: 'bold',
      align: 'center',
    });

    // Top right: kills
    this.drawText(ctx, `Kills: ${this.game.kills}`, width - 40, 32, {
      size: 34,
      weight: 'bold',
      align: 'right',
    });

    // Bottom: title, controls hint, FPS and position
    this.drawText(ctx, `${GameConfig.ui.title}  ·  move with WASD or the arrow keys`, 40, height - 52, {
      size: 22,
      color: '#b9c4bd',
    });
    this.drawText(
      ctx,
      `FPS: ${this.game.fps}   X: ${Math.round(player.x)}   Y: ${Math.round(player.y)}`,
      width - 40,
      height - 52,
      { size: 22, color: '#b9c4bd', align: 'right' }
    );
  }

  /** The large HP bar in the top-left corner. */
  renderPlayerHealth(ctx, player) {
    const x = 40;
    const y = 36;
    const barWidth = 460;
    const barHeight = 30;
    const fraction = player.currentHealth / player.maxHealth;

    // The trail slides down toward the real value, showing how much was just lost.
    this.healthTrail = Math.max(fraction, MathUtils.lerp(this.healthTrail, fraction, 0.05));

    DrawUtils.bar(ctx, x, y, barWidth, barHeight, this.healthTrail, '#f4e2e2');
    ctx.fillStyle = DrawUtils.healthColor(fraction);
    ctx.fillRect(x, y, barWidth * fraction, barHeight);

    this.drawText(ctx, `HP ${Math.ceil(player.currentHealth)} / ${player.maxHealth}`, x + 14, y + 2, {
      size: 22,
      weight: 'bold',
    });
  }

  renderGameOver(ctx) {
    const { width, height, player } = this.game;
    const centerX = width / 2;

    ctx.fillStyle = 'rgba(6, 8, 10, 0.78)';
    ctx.fillRect(0, 0, width, height);

    this.drawText(ctx, 'GAME OVER', centerX, 250, {
      size: 96,
      weight: 'bold',
      align: 'center',
      color: '#ff6464',
    });

    const lines = [
      `Survival time: ${MathUtils.formatTime(this.game.survivalTime)}`,
      `Enemies killed: ${this.game.kills}`,
      `Final level: ${player.level}`,
    ];
    lines.forEach((line, index) => {
      this.drawText(ctx, line, centerX, 420 + index * 64, { size: 42, align: 'center' });
    });

    this.drawButton(ctx, this.restartButton, 'Restart');
    this.drawText(ctx, 'or press R to restart', centerX, 800, {
      size: 26,
      align: 'center',
      color: '#b9c4bd',
    });
  }

  drawButton(ctx, button, label) {
    const hovered = this.game.input.isPointerOver(button);
    ctx.fillStyle = hovered ? '#3fae6a' : '#2e8c55';
    ctx.fillRect(button.x, button.y, button.width, button.height);
    ctx.strokeStyle = '#bff5cf';
    ctx.lineWidth = 3;
    ctx.strokeRect(button.x, button.y, button.width, button.height);
    this.drawText(ctx, label, button.x + button.width / 2, button.y + 20, {
      size: 40,
      weight: 'bold',
      align: 'center',
    });
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
