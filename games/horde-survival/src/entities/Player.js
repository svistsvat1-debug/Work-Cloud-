/**
 * The player. Movement is the only control: WASD or the arrow keys.
 */
class Player {
  constructor(x, y) {
    const config = GameConfig.player;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = config.radius;
    this.speed = config.speed;
    this.drawSize = config.drawSize;
    this.maxHealth = config.maxHealth;
    this.currentHealth = config.maxHealth;
    this.level = 1;
    this.facing = 1; // 1 = looking right, -1 = looking left
    this.walkTime = 0; // drives the small walking bounce
    this.invulnerableTimer = 0; // > 0 means enemies can't hurt us right now
    this.hurtTimer = 0; // > 0 shows the red "ouch" flash
  }

  update(dt, game) {
    const direction = game.input.getMoveDirection();

    // Ease the velocity toward the target velocity: responsive, but not robotic.
    const smoothing = MathUtils.smoothFactor(GameConfig.player.acceleration, dt);
    this.vx += (direction.x * this.speed - this.vx) * smoothing;
    this.vy += (direction.y * this.speed - this.vy) * smoothing;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

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

  /** Returns true if the hit landed (false while invulnerable). */
  takeDamage(amount, game) {
    if (this.invulnerableTimer > 0 || this.isDead()) return false;

    this.currentHealth = Math.max(0, this.currentHealth - amount);
    this.invulnerableTimer = GameConfig.player.invulnerabilityTime;
    this.hurtTimer = GameConfig.player.hurtFlashTime;

    const shake = GameConfig.player.hurtShake;
    game.camera.shake(shake.strength, shake.duration);
    game.effects.spawnDamageNumber(this.x, this.y - this.drawSize * 0.45, amount, '#ff6b6b');

    if (this.isDead()) game.onPlayerDied();
    return true;
  }

  render(ctx, sprites) {
    const size = this.drawSize;
    DrawUtils.shadow(ctx, this.x, this.y + size * 0.43, size * 0.26);

    // A small squash-and-stretch bounce while walking makes a still image feel alive.
    const bounce = this.isMoving() ? Math.sin(this.walkTime * 16) * 0.05 : 0;

    // While invulnerable the player blinks; right after a hit it flashes red.
    const blinkOff = this.invulnerableTimer > 0 && Math.floor(this.invulnerableTimer * 14) % 2 === 0;
    const alpha = blinkOff ? 0.35 : 1;
    const sprite = this.hurtTimer > 0 ? sprites.playerHurt : sprites.player;
    DrawUtils.character(ctx, sprite, this.x, this.y, size, this.facing, 1 - bounce * 0.5, 1 + bounce, alpha);

    // Small health bar above the head
    const barWidth = 84;
    DrawUtils.bar(
      ctx,
      this.x - barWidth / 2,
      this.y - size * 0.6,
      barWidth,
      9,
      this.currentHealth / this.maxHealth,
      DrawUtils.healthColor(this.currentHealth / this.maxHealth)
    );
  }
}
