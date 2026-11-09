/**
 * UISystem draws everything that sits on top of the world: the HUD (bars,
 * timer, counters) and the current menu screen. It works in screen
 * coordinates (0..1920, 0..1080).
 */
class UISystem {
  constructor(game) {
    this.game = game;
    this.levelUpMenu = new LevelUpMenu(game);
    this.chestScreen = new ChestScreen(game);
    this.gameOverScreen = new GameOverScreen(game);
    this.reset();
  }

  reset() {
    // The HP bar shows recent damage as a lighter "trail" that catches up.
    this.healthTrail = 1;
    this.banners = []; // waiting banners; the first one is on screen
  }

  /** A big message for a few seconds (new wave, boss...). Several banners queue up. */
  showBanner(title, subtitle, color = '#ffd166') {
    if (this.banners.length >= 3) this.banners.shift(); // keep the queue short
    this.banners.push({ title, subtitle, color, time: 0 });
  }

  update(dt) {
    const banner = this.banners[0];
    if (banner) {
      banner.time += dt;
      if (banner.time >= GameConfig.ui.bannerDuration) this.banners.shift();
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
    if (this.game.state === GameState.CHEST) this.chestScreen.render(ctx);
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
    this.renderBossBars(ctx);
    this.renderChestPointers(ctx);
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

  /** A big health bar at the top for every living boss (at most two). */
  renderBossBars(ctx) {
    const { width, height, y } = GameConfig.ui.bossBar;
    const bosses = this.game.enemies.filter((enemy) => enemy.stats.isBoss && !enemy.dead).slice(0, 2);
    bosses.forEach((boss, index) => {
      const top = y + index * 62;
      const left = (this.game.width - width) / 2;
      DrawUtils.text(ctx, boss.stats.name, this.game.width / 2, top - 30, {
        size: 24,
        weight: 'bold',
        align: 'center',
        color: '#e3c2ff',
      });
      DrawUtils.bar(ctx, left, top, width, height, boss.currentHealth / boss.maxHealth, '#b44dff');
    });
  }

  /** Gold arrows at the screen edge pointing to chests that are off screen. */
  renderChestPointers(ctx) {
    const { camera, width, height } = this.game;
    const inset = 70;
    for (const pickup of this.game.pickups) {
      if (!(pickup instanceof Chest) || pickup.isVisible(camera)) continue;
      const angle = Math.atan2(pickup.y - camera.y, pickup.x - camera.x);
      // Push the arrow from the screen center toward the chest until it hits the inset border.
      const scale = Math.min(
        (width / 2 - inset) / Math.abs(Math.cos(angle) || 1e-6),
        (height / 2 - inset) / Math.abs(Math.sin(angle) || 1e-6)
      );
      const x = width / 2 + Math.cos(angle) * scale;
      const y = height / 2 + Math.sin(angle) * scale;
      ctx.drawImage(this.game.sprites.chest, x - 30, y - 30, 60, 60);
      ctx.save();
      ctx.translate(x + Math.cos(angle) * 46, y + Math.sin(angle) * 46);
      ctx.rotate(angle);
      ctx.fillStyle = '#ffd166';
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(-10, -12);
      ctx.lineTo(-10, 12);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }

  renderBanner(ctx) {
    const banner = this.banners[0];
    if (!banner) return;
    const { title, subtitle, color, time } = banner;
    const duration = GameConfig.ui.bannerDuration;
    // Fade in during the first 0.3 s, fade out during the last 0.7 s.
    const alpha = Math.min(1, time / 0.3, (duration - time) / 0.7);
    ctx.globalAlpha = Math.max(0, alpha);
    DrawUtils.text(ctx, title, this.game.width / 2, 270, { size: 54, weight: 'bold', align: 'center', color });
    DrawUtils.text(ctx, subtitle, this.game.width / 2, 336, { size: 30, align: 'center', color: '#e8eef5' });
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

    const readyToEvolve = new Set(this.game.upgrades.availableEvolutions().map((evolution) => evolution.weapon));
    this.game.weapons.weapons.forEach((weapon, index) => {
      const left = x + index * (size + 10);
      if (weapon.isEvolved) {
        // Evolved weapons: thick golden frame and an EVO badge.
        this.drawFrame(ctx, left, weaponsTop, size, '#ff9cf0', 5);
        this.drawSlot(ctx, weapon.definition.icon, left, weaponsTop, size, 'EVO');
        return;
      }
      // Ready to evolve (max level + its passive): a pulsing frame hints "open a chest!".
      if (readyToEvolve.has(weapon.id) && Math.floor(this.game.survivalTime * 3) % 2 === 0) {
        this.drawFrame(ctx, left, weaponsTop, size, '#ffe08a', 3);
      }
      this.drawSlot(ctx, weapon.definition.icon, left, weaponsTop, size, weapon.isMaxLevel() ? 'MAX' : String(weapon.level));
    });

    const player = this.game.player;
    player.ownedPassiveIds().forEach((id, index) => {
      const level = player.getPassiveLevel(id);
      const badge = level >= GameConfig.passives.maxLevel ? 'MAX' : String(level);
      this.drawSlot(ctx, PassiveDefinitions[id].icon, x + index * (size + 10), passivesTop, size * 0.8, badge);
    });
  }

  drawFrame(ctx, left, top, size, color, width) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.strokeRect(left - 4, top - 4, size + 8, size + 8);
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
      color: badge === 'EVO' ? '#ff9cf0' : badge === 'MAX' ? '#ffd166' : '#ffffff',
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
