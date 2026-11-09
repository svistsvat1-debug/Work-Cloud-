/**
 * The player. Movement is the only control: WASD or the arrow keys.
 * The player also owns the run's progress: XP, level and upgrade levels.
 */
class Player extends Entity {
  constructor(x, y) {
    const config = GameConfig.player;
    super(x, y, config.radius, config.drawSize);
    this.maxHealth = config.maxHealth;
    this.currentHealth = config.maxHealth;

    this.level = 1;
    this.xp = 0;
    this.xpToNextLevel = Player.xpRequiredFor(1);
    this.pendingLevelUps = 0; // level-ups earned but not chosen yet
    this.upgradeLevels = {}; // upgrade id -> level, e.g. { damage: 2 }
    this.recalculateStats();

    this.facing = 1; // 1 = looking right, -1 = looking left
    this.walkTime = 0; // drives the small walking bounce
    this.invulnerableTimer = 0; // > 0 means enemies can't hurt us right now
    this.hurtTimer = 0; // > 0 shows the red "ouch" flash
  }

  /** XP needed to go from `level` to the next one (formula in GameConfig.xp). */
  static xpRequiredFor(level) {
    const { base, linear, quadratic } = GameConfig.xp;
    const n = level - 1;
    return Math.round(base + linear * n + quadratic * n * n);
  }

  update(dt, game) {
    const direction = game.input.getMoveDirection();

    // Ease the velocity toward the target velocity: responsive, but not robotic.
    const smoothing = MathUtils.smoothFactor(GameConfig.player.acceleration, dt);
    this.vx += (direction.x * this.speed - this.vx) * smoothing;
    this.vy += (direction.y * this.speed - this.vy) * smoothing;
    this.move(dt);

    if (direction.x !== 0) this.facing = Math.sign(direction.x);
    if (this.isMoving()) this.walkTime += dt;

    this.invulnerableTimer = Math.max(0, this.invulnerableTimer - dt);
    this.hurtTimer = Math.max(0, this.hurtTimer - dt);
  }

  isMoving() {
    return Math.abs(this.vx) + Math.abs(this.vy) > 20;
  }

  isDead() {
    return this.currentHealth <= 0;
  }

  // ---------------------------------------------------------------- Progress

  addXp(amount) {
    this.xp += amount;
    // Enough XP for several levels at once? Each one is counted and chosen in turn.
    while (this.xp >= this.xpToNextLevel) {
      this.xp -= this.xpToNextLevel;
      this.level += 1;
      this.pendingLevelUps += 1;
      this.xpToNextLevel = Player.xpRequiredFor(this.level);
    }
  }

  getUpgradeLevel(id) {
    return this.upgradeLevels[id] || 0;
  }

  /**
   * Rebuilds player.stats from scratch: base values + every upgrade level.
   * Recalculating (instead of adding a bit each time) means stats can never drift.
   */
  recalculateStats() {
    const stats = {
      damageMultiplier: 1,
      fireRateMultiplier: 1,
      projectileSpeedMultiplier: 1,
      moveSpeedMultiplier: 1,
      magnetMultiplier: 1,
      maxHealthBonus: 0,
    };
    for (const [id, level] of Object.entries(this.upgradeLevels)) {
      const upgrade = UpgradeDefinitions[id];
      if (upgrade.stat) stats[upgrade.stat] += upgrade.perLevel * level;
    }
    this.stats = stats;

    const config = GameConfig.player;
    const previousMaxHealth = this.maxHealth;
    this.maxHealth = config.maxHealth + stats.maxHealthBonus;
    // Gaining max HP also heals by the same amount.
    this.heal(Math.max(0, this.maxHealth - previousMaxHealth));
    this.speed = config.speed * stats.moveSpeedMultiplier;
    this.magnetRadius = config.magnetRadius * stats.magnetMultiplier;
    this.pickupRadius = config.pickupRadius;
  }

  heal(amount) {
    this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
  }

  /** Returns true if the hit landed (false while invulnerable). */
  takeDamage(amount, game) {
    if (this.invulnerableTimer > 0 || this.isDead()) return false;

    const config = GameConfig.player;
    this.currentHealth = Math.max(0, this.currentHealth - amount);
    this.invulnerableTimer = config.invulnerabilityTime;
    this.hurtTimer = config.hurtFlashTime;
    game.camera.shake(config.hurtShake.strength, config.hurtShake.duration);
    game.effects.spawnDamageNumber(this.x, this.y - this.drawSize * 0.45, amount, '#ff6b6b');

    if (this.isDead()) game.onPlayerDied();
    return true;
  }

  // ---------------------------------------------------------------- Drawing

  render(ctx, sprites) {
    const config = GameConfig.player;
    const size = this.drawSize;
    DrawUtils.shadow(ctx, this.x, this.y + size * 0.43, size * 0.26);

    // A small squash-and-stretch bounce while walking makes a still image feel alive.
    const bounce = this.isMoving()
      ? Math.sin(this.walkTime * config.walkBounce.speed) * config.walkBounce.amount
      : 0;

    // While invulnerable the player blinks; right after a hit it flashes red.
    const blinkOff =
      this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer * config.blinkRate) % 2 === 0;
    const sprite = this.hurtTimer > 0 ? sprites.playerHurt : sprites.player;
    DrawUtils.character(ctx, sprite, this.x, this.y, size, this.facing, 1 - bounce * 0.5, 1 + bounce, blinkOff ? 0.35 : 1);

    // Small health bar above the head
    const bar = config.healthBar;
    const fraction = this.currentHealth / this.maxHealth;
    DrawUtils.bar(
      ctx,
      this.x - bar.width / 2,
      this.y - size * bar.offsetY,
      bar.width,
      bar.height,
      fraction,
      DrawUtils.healthColor(fraction)
    );
  }
}
