/**
 * UISystem draws everything that sits on top of the world: the HUD (bars,
 * timer, counters) and the current menu screen. It works in screen
 * coordinates (0..1920, 0..1080).
 */
class UISystem {
  constructor(game) {
    this.game = game;
    this.levelUpMenu = new LevelUpMenu(game);
    this.gameOverScreen = new GameOverScreen(game);
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
    if (this.game.state === GameState.LEVEL_UP) this.levelUpMenu.render(ctx);
    if (this.game.state === GameState.GAME_OVER) this.gameOverScreen.render(ctx);

    ctx.restore();
  }

  renderHud(ctx) {
    const { player, width, height } = this.game;

    this.renderXpBar(ctx, player);
    this.renderPlayerHealth(ctx, player);

    // Top center: survival timer
    DrawUtils.text(ctx, MathUtils.formatTime(this.game.survivalTime), width / 2, 44, {
      size: 56,
      weight: 'bold',
      align: 'center',
    });

    // Top right: kills
    DrawUtils.text(ctx, `Kills: ${this.game.kills}`, width - 40, 50, {
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

  /** Full-width XP bar along the top edge, with the level written inside. */
  renderXpBar(ctx, player) {
    const barHeight = GameConfig.ui.xpBar.height;
    const width = this.game.width;
    ctx.fillStyle = 'rgba(8, 10, 18, 0.85)';
    ctx.fillRect(0, 0, width, barHeight + 4);
    ctx.fillStyle = '#4fb8ff';
    ctx.fillRect(0, 0, width * (player.xp / player.xpToNextLevel), barHeight);
    DrawUtils.text(ctx, `LV ${player.level}   ${Math.floor(player.xp)} / ${player.xpToNextLevel} XP`, width / 2, 1, {
      size: 21,
      weight: 'bold',
      align: 'center',
    });
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
}
