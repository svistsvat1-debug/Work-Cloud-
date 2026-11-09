/**
 * Shown when the player dies. The world stays frozen behind it.
 * Restart with the button or the R key.
 */
class GameOverScreen {
  constructor(game) {
    this.game = game;
    this.restartButton = GameConfig.ui.restartButton;
  }

  update(dt) {
    const input = this.game.input;
    if (input.wasPressed('restart') || input.wasClicked(this.restartButton)) {
      this.game.startNewRun();
    }
  }

  render(ctx) {
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
