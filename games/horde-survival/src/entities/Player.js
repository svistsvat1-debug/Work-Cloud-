/**
 * The player. Movement is the only control: WASD or the arrow keys.
 * The player also owns the run's progress: XP, level and passive item levels.
 */
class Player extends Entity {
  /** permanentLevels: levels bought in the shop, e.g. { damage: 2 } (see ShopDefinitions). */
  constructor(x, y, permanentLevels = {}) {
    const config = GameConfig.player;
    super(x, y, config.radius, config.drawSize);
    this.permanentLevels = permanentLevels;
    this.maxHealth = config.maxHealth;
    this.currentHealth = config.maxHealth;

    this.level = 1;
    this.xp = 0;
    this.xpToNextLevel = Player.xpRequiredFor(1);
    this.pendingLevelUps = 0; // level-ups earned but not chosen yet
    this.passiveLevels = {}; // passive id -> level, e.g. { powerStone: 2 }
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
    this.xp += amount * this.stats.xpMultiplier;
    // Enough XP for several levels at once? Each one is counted and chosen in turn.
    while (this.xp >= this.xpToNextLevel) {
      this.xp -= this.xpToNextLevel;
      this.level += 1;
      this.pendingLevelUps += 1;
      this.xpToNextLevel = Player.xpRequiredFor(this.level);
    }
  }

  getPassiveLevel(id) {
    return this.passiveLevels[id] || 0;
  }

  ownedPassiveIds() {
    return Object.keys(this.passiveLevels);
  }

  /**
   * Rebuilds player.stats from scratch: base values + every passive level.
   * Recalculating (instead of adding a bit each time) means stats can never drift.
   */
  recalculateStats() {
    // 1. Add up the bonuses from passives (this run) and shop upgrades (permanent).
    const bonus = {
      damageBonus: 0,
      cooldownReduction: 0,
      moveSpeedBonus: 0,
      magnetBonus: 0,
      maxHealthBonus: 0,
      xpBonus: 0,
      luck: 0,
    };
    for (const [id, level] of Object.entries(this.passiveLevels)) {
      const passive = PassiveDefinitions[id];
      bonus[passive.stat] += passive.perLevel * level;
    }
    for (const [id, level] of Object.entries(this.permanentLevels)) {
      const upgrade = ShopDefinitions[id];
      if (upgrade && upgrade.stat in bonus) bonus[upgrade.stat] += upgrade.perLevel * level;
    }

    // 2. Turn bonuses into the numbers the rest of the game reads.
    this.stats = {
      damageMultiplier: 1 + bonus.damageBonus,
      cooldownMultiplier: Math.max(0.4, 1 - bonus.cooldownReduction), // never below 40% cooldown
      moveSpeedMultiplier: 1 + bonus.moveSpeedBonus,
      magnetMultiplier: 1 + bonus.magnetBonus,
      projectileSpeedMultiplier: 1,
      xpMultiplier: 1 + bonus.xpBonus,
      luck: bonus.luck,
    };

    const config = GameConfig.player;
    const previousMaxHealth = this.maxHealth;
    this.maxHealth = config.maxHealth + bonus.maxHealthBonus;
    // Gaining max HP also heals by the same amount.
    this.heal(Math.max(0, this.maxHealth - previousMaxHealth));
    this.speed = config.speed * this.stats.moveSpeedMultiplier;
    this.magnetRadius = config.magnetRadius * this.stats.magnetMultiplier;
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
    game.audio.play('hurt');
    game.effects.spawnDamageNumber(this.x, this.y - this.drawSize * 0.45, amount, '#ff6b6b');

    if (this.isDead()) game.onPlayerDied();
    return true;
  }

  // ---------------------------------------------------------------- Drawing

  render(ctx, sprites) {
    const config = GameConfig.player;
    const size = this.drawSize;
    DrawUtils.shadow(ctx, this.x, this.y + size * 0.43, size * 0.26);
    // A soft light ring at the feet, so you can always find yourself in a crowd.
    ctx.strokeStyle = 'rgba(143, 247, 255, 0.45)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + size * 0.43, size * 0.36, size * 0.13, 0, 0, Math.PI * 2);
    ctx.stroke();

    // A small squash-and-stretch bounce while walking makes a still image feel alive.
    const bounce = this.isMoving()
      ? Math.sin(this.walkTime * config.walkBounce.speed) * config.walkBounce.amount
      : 0;

    // While invulnerable the player blinks; right after a hit it flashes red.
    const blinkOff =
      this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer * config.blinkRate) % 2 === 0;
    // Walk cycle while moving; frame 1 (neutral stance) when standing still.
    const frames = this.hurtTimer > 0 ? sprites.playerHurt : sprites.player;
    const frameIndex = this.isMoving() ? Math.floor(this.walkTime * config.walkFrameRate) % frames.length : 1 % frames.length;
    const sprite = frames[frameIndex];
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
