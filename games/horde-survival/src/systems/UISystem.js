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
    this.banner = null;
  }

  /** A big message in the middle of the screen for a few seconds (e.g. a new wave). */
  showBanner(title, subtitle, color = '#ffd166') {
    this.banner = { title, subtitle, color, time: 0 };
  }

  update(dt) {
    if (this.banner) {
      this.banner.time += dt;
      if (this.banner.time >= GameConfig.ui.bannerDuration) this.banner = null;
    }
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
    this.renderInventory(ctx);

    // Top center: survival timer and the current wave
    DrawUtils.text(ctx, MathUtils.formatTime(this.game.survivalTime), width / 2, 44, {
      size: 56,
      weight: 'bold',
      align: 'center',
    });
    const waves = this.game.waves;
    DrawUtils.text(ctx, `Wave ${waves.waveNumber} · ${waves.currentWave.name}`, width / 2, 108, {
      size: 24,
      align: 'center',
      color: '#c9d3e0',
    });
    this.renderBanner(ctx);

    // Top right: kills and coins
    DrawUtils.text(ctx, `Kills: ${this.game.kills}`, width - 40, 50, {
      size: 34,
      weight: 'bold',
      align: 'right',
    });
    DrawUtils.text(ctx, `Coins: ${this.game.runCoins}`, width - 40, 94, {
      size: 28,
      weight: 'bold',
      align: 'right',
      color: '#ffd166',
    });

    // Bottom: title and controls hint, plus FPS and position for debugging
    const hint = `${GameConfig.ui.title}  ·  move with WASD or the arrow keys`;
    DrawUtils.text(ctx, hint, 40, height - 52, { size: 22, color: '#b9c4bd' });
    if (GameConfig.ui.showDebugInfo) {
      const debug = `FPS: ${this.game.fps}   X: ${Math.round(player.x)}   Y: ${Math.round(player.y)}`;
      DrawUtils.text(ctx, debug, width - 40, height - 52, { size: 22, color: '#b9c4bd', align: 'right' });
    }
  }

  renderBanner(ctx) {
    if (!this.banner) return;
    const { title, subtitle, color, time } = this.banner;
    const duration = GameConfig.ui.bannerDuration;
    // Fade in during the first 0.3 s, fade out during the last 0.7 s.
    const alpha = Math.min(1, time / 0.3, (duration - time) / 0.7);
    ctx.globalAlpha = Math.max(0, alpha);
    DrawUtils.text(ctx, title, this.game.width / 2, 190, { size: 54, weight: 'bold', align: 'center', color });
    DrawUtils.text(ctx, subtitle, this.game.width / 2, 256, { size: 30, align: 'center', color: '#e8eef5' });
    ctx.globalAlpha = 1;
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

  /**
   * Owned weapons (first row) and passives (second row) under the HP bar:
   * icon + level badge ("MAX" at max level).
   */
  renderInventory(ctx) {
    const { x, y: barY, height: barHeight } = GameConfig.ui.playerHealthBar;
    const size = GameConfig.ui.slotIconSize;
    const weaponsTop = barY + barHeight + 16;
    const passivesTop = weaponsTop + size + 10;

    this.game.weapons.weapons.forEach((weapon, index) => {
      const badge = weapon.isMaxLevel() ? 'MAX' : String(weapon.level);
      this.drawSlot(ctx, weapon.definition.icon, x + index * (size + 10), weaponsTop, size, badge);
    });

    const player = this.game.player;
    player.ownedPassiveIds().forEach((id, index) => {
      const level = player.getPassiveLevel(id);
      const badge = level >= GameConfig.passives.maxLevel ? 'MAX' : String(level);
      this.drawSlot(ctx, PassiveDefinitions[id].icon, x + index * (size + 10), passivesTop, size * 0.8, badge);
    });
  }

  drawSlot(ctx, iconKey, left, top, size, badge) {
    ctx.drawImage(this.game.sprites[iconKey], left, top, size, size);
    ctx.font = `bold 18px ${GameConfig.ui.font}`;
    const badgeWidth = Math.max(26, ctx.measureText(badge).width + 12);
    ctx.fillStyle = 'rgba(10, 12, 20, 0.85)';
    ctx.fillRect(left + size - badgeWidth, top + size - 22, badgeWidth, 22);
    DrawUtils.text(ctx, badge, left + size - badgeWidth / 2, top + size - 22, {
      size: 18,
      weight: 'bold',
      align: 'center',
      color: badge === 'MAX' ? '#ffd166' : '#ffffff',
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
