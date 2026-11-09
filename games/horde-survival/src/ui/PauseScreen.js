/**
 * Pause: Esc or P during a run (the game also pauses by itself when the
 * window loses focus). Resume, or end the run to see the summary.
 */
class PauseScreen {
  constructor(game) {
    this.game = game;
    this.resumeButton = { x: 760, y: 470, width: 400, height: 100 };
    this.endRunButton = { x: 760, y: 610, width: 400, height: 90 };
  }

  update(dt) {
    const input = this.game.input;
    if (input.wasPressed('pause') || input.wasPressed('confirm') || input.wasClicked(this.resumeButton)) {
      this.game.resume();
    } else if (input.wasClicked(this.endRunButton)) {
      this.game.endRun();
    }
  }

  render(ctx) {
    const { width, height, input } = this.game;
    ctx.fillStyle = 'rgba(6, 8, 14, 0.7)';
    ctx.fillRect(0, 0, width, height);
    DrawUtils.text(ctx, 'PAUSED', width / 2, 300, { size: 96, weight: 'bold', align: 'center', color: '#ffd166' });
    DrawUtils.button(ctx, this.resumeButton, 'Resume', input.isPointerOver(this.resumeButton), 'primary', 44);
    DrawUtils.button(ctx, this.endRunButton, 'End run', input.isPointerOver(this.endRunButton), 'danger', 36);
    DrawUtils.text(ctx, 'Esc / P / Enter: resume', width / 2, 740, { size: 26, align: 'center', color: '#b9c4bd' });
  }
}
