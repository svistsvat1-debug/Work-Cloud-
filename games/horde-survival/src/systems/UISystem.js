/**
 * UISystem draws everything that sits on top of the world: text, bars, menus.
 * It always works in screen coordinates (0..1920, 0..1080).
 */
class UISystem {
  constructor(game) {
    this.game = game;
    this.restartButton = GameConfig.ui.restartButton;
    this.reset();
  }

  reset() {
    // The HP bar shows recent damage as a lighter "trail" that catches up.
    this.healthTrail = 1;
  }

  update(dt) {
    const player = this.game.player;
    const fraction = player.currentHealth / player.maxHealth;
    this.healthTrail = Math.max(fraction, MathUtils.lerp(this.healthTrail, fraction, MathUtils.smoothFactor(3, dt)));
  }

  render() {
    const ctx = this.game.ctx;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    this.renderHud(ctx);
    if (this.game.state === GameState.GAME_OVER) this.renderGameOver(ctx);

    ctx.restore();
  }

  renderHud(ctx) {
    const { player, width, height } = this.game;

    this.renderPlayerHealth(ctx, player);

    // Top center: survival timer
    DrawUtils.text(ctx, MathUtils.formatTime(this.game.survivalTime), width / 2, 28, {
      size: 56,
      weight: 'bold',
      align: 'center',
    });

    // Top right: kills
    DrawUtils.text(ctx, `Kills: ${this.game.kills}`, width - 40, 32, {
      size: 34,
      weight: 'bold',
      align: 'right',
    });

    // Bottom: title and controls hint, plus FPS and position for debugging
    const hint = `${GameConfig.ui.title}  ·  move with WASD or the arrow keys`;
    DrawUtils.text(ctx, hint, 40, height - 52, { size: 22, color: '#b9c4bd' });
    if (GameConfig.ui.showDebugInfo) {
      const debug = `FPS: ${this.game.fps}   X: ${Math.round(player.x)}   Y: ${Math.round(player.y)}`;
      DrawUtils.text(ctx, debug, width - 40, height - 52, { size: 22, color: '#b9c4bd', align: 'right' });
    }
  }

  /** The large HP bar in the top-left corner. */
  renderPlayerHealth(ctx, player) {
    const { x, y, width, height } = GameConfig.ui.playerHealthBar;
    const fraction = player.currentHealth / player.maxHealth;

    DrawUtils.bar(ctx, x, y, width, height, this.healthTrail, '#f4e2e2');
    ctx.fillStyle = DrawUtils.healthColor(fraction);
    ctx.fillRect(x, y, width * fraction, height);
    DrawUtils.text(ctx, `HP ${Math.ceil(player.currentHealth)} / ${player.maxHealth}`, x + 14, y + 2, {
      size: 22,
      weight: 'bold',
    });
  }

  renderGameOver(ctx) {
    const { width, height, player } = this.game;
    const centerX = width / 2;

    ctx.fillStyle = 'rgba(6, 8, 10, 0.78)';
    ctx.fillRect(0, 0, width, height);

    DrawUtils.text(ctx, 'GAME OVER', centerX, 250, {
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
      DrawUtils.text(ctx, line, centerX, 420 + index * 64, { size: 42, align: 'center' });
    });

    const button = this.restartButton;
    DrawUtils.button(ctx, button, 'Restart', this.game.input.isPointerOver(button));
    DrawUtils.text(ctx, 'or press R to restart', centerX, button.y + button.height + 26, {
      size: 26,
      align: 'center',
      color: '#b9c4bd',
    });
  }
}
