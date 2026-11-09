/**
 * A monster that chases the player.
 * Its numbers (speed, health, size...) come from GameConfig.enemies[type].
 */
class Enemy {
  constructor(type, x, y) {
    const stats = GameConfig.enemies[type];
    this.type = type;
    this.stats = stats;
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = stats.radius;
    this.drawSize = stats.drawSize;
    this.speed = stats.speed;
    this.damage = stats.damage;
    this.maxHealth = stats.maxHealth;
    this.currentHealth = stats.maxHealth;
    this.knockbackX = 0;
    this.knockbackY = 0;
    this.flashTimer = 0; // > 0 means "just got hit": draw the white flash
    this.facing = 1;
    this.animTime = Math.random() * 10; // random start, so enemies don't animate in sync
    this.dead = false;
  }

  update(dt, game) {
    const player = game.player;
    const direction = MathUtils.normalize(player.x - this.x, player.y - this.y);
    this.vx = direction.x * this.speed;
    this.vy = direction.y * this.speed;

    // Some enemies wobble sideways while they chase (bats flutter).
    if (this.stats.wobble) {
      const sideways = Math.sin(this.animTime * 5) * this.stats.wobble;
      this.vx += -direction.y * sideways;
      this.vy += direction.x * sideways;
    }

    // Knockback pushes the enemy away for a moment, then fades out.
    this.x += (this.vx + this.knockbackX) * dt;
    this.y += (this.vy + this.knockbackY) * dt;
    const fade = Math.exp(-GameConfig.combat.knockbackDecay * dt);
    this.knockbackX *= fade;
    this.knockbackY *= fade;

    if (Math.abs(this.vx) > 1) this.facing = Math.sign(this.vx);
    this.flashTimer = Math.max(0, this.flashTimer - dt);
    this.animTime += dt;
  }

  /** knockbackX / knockbackY: push velocity (pixels per second) away from the hit. */
  takeDamage(amount, game, knockbackX = 0, knockbackY = 0) {
    if (this.dead) return;
    this.currentHealth -= amount;
    this.flashTimer = GameConfig.combat.hitFlashTime;
    this.knockbackX += knockbackX * this.stats.knockbackMultiplier;
    this.knockbackY += knockbackY * this.stats.knockbackMultiplier;
    game.effects.spawnDamageNumber(this.x, this.y - this.drawSize * 0.35, amount);

    if (this.currentHealth <= 0) {
      this.dead = true;
      game.onEnemyKilled(this);
    }
  }

  render(ctx, sprites) {
    const size = this.drawSize;
    let scaleX = 1;
    let scaleY = 1;
    let liftY = 0;

    // Cheap animation without extra frames: slimes squish, bats bob up and down.
    if (this.stats.animation === 'squish') {
      const squish = Math.sin(this.animTime * 7) * 0.07;
      scaleX = 1 + squish;
      scaleY = 1 - squish;
    } else if (this.stats.animation === 'flap') {
      liftY = Math.sin(this.animTime * 9) * 6;
      scaleY = 1 + Math.sin(this.animTime * 18) * 0.08;
    }

    const sprite = this.flashTimer > 0 ? sprites[`${this.type}Flash`] : sprites[this.type];
    DrawUtils.shadow(ctx, this.x, this.y + size * this.stats.shadowOffset, size * 0.26);
    DrawUtils.character(ctx, sprite, this.x, this.y + liftY, size, this.facing, scaleX, scaleY);
    this.renderHealthBar(ctx);
  }

  renderHealthBar(ctx) {
    const isDamaged = this.currentHealth < this.maxHealth;
    if (GameConfig.ui.enemyHealthBars === 'damaged' && !isDamaged) return;
    const width = this.drawSize * 0.55;
    DrawUtils.bar(
      ctx,
      this.x - width / 2,
      this.y - this.drawSize * 0.42,
      width,
      5,
      this.currentHealth / this.maxHealth,
      '#ef5050'
    );
  }
}
