/**
 * A monster that chases the player.
 * Its numbers (speed, health, size...) come from GameConfig.enemies[type].
 */
class Enemy extends Entity {
  constructor(type, x, y) {
    const stats = GameConfig.enemies[type];
    super(x, y, stats.radius, stats.drawSize);
    this.type = type;
    this.stats = stats;
    this.speed = stats.speed;
    this.damage = stats.damage;
    this.maxHealth = stats.maxHealth;
    this.currentHealth = stats.maxHealth;
    this.knockbackX = 0;
    this.knockbackY = 0;
    this.flashTimer = 0; // > 0 means "just got hit": draw the white flash
    this.facing = 1;
    this.animTime = Math.random() * 10; // random start, so enemies don't animate in sync
  }

  update(dt, game) {
    const player = game.player;
    const direction = MathUtils.normalize(player.x - this.x, player.y - this.y);
    let chaseX = direction.x * this.speed;
    let chaseY = direction.y * this.speed;

    // Some enemies wobble sideways while they chase (bats flutter).
    const wobble = this.stats.wobble;
    if (wobble) {
      const sideways = Math.sin(this.animTime * wobble.speed) * wobble.strength;
      chaseX += -direction.y * sideways;
      chaseY += direction.x * sideways;
    }

    // Knockback pushes the enemy away for a moment, then fades out.
    this.vx = chaseX + this.knockbackX;
    this.vy = chaseY + this.knockbackY;
    this.move(dt);
    const fade = Math.exp(-GameConfig.combat.knockbackDecay * dt);
    this.knockbackX *= fade;
    this.knockbackY *= fade;

    if (Math.abs(chaseX) > 1) this.facing = Math.sign(chaseX);
    this.flashTimer = Math.max(0, this.flashTimer - dt);
    this.animTime += dt;
  }

  /** Adds a push (pixels per second) that fades out over a short time. */
  applyKnockback(pushX, pushY) {
    this.knockbackX += pushX * this.stats.knockbackMultiplier;
    this.knockbackY += pushY * this.stats.knockbackMultiplier;
  }

  /** knockbackX / knockbackY: push velocity (pixels per second) away from the hit. */
  takeDamage(amount, game, knockbackX = 0, knockbackY = 0) {
    if (this.dead) return;
    this.currentHealth -= amount;
    this.flashTimer = GameConfig.combat.hitFlashTime;
    this.applyKnockback(knockbackX, knockbackY);
    game.effects.spawnDamageNumber(this.x, this.y - this.drawSize * 0.35, amount);

    if (this.currentHealth <= 0) {
      this.dead = true;
      game.onEnemyKilled(this);
    }
  }

  render(ctx, sprites) {
    const size = this.drawSize;
    const animation = this.stats.animation;
    const wave = Math.sin(this.animTime * animation.speed);
    let scaleX = 1;
    let scaleY = 1;
    let liftY = 0;

    // Cheap animation without extra frames: slimes squish, bats bob up and down.
    if (animation.style === 'squish') {
      scaleX = 1 + wave * animation.squash;
      scaleY = 1 - wave * animation.squash;
    } else if (animation.style === 'flap') {
      liftY = wave * animation.lift;
      scaleY = 1 + Math.sin(this.animTime * animation.speed * 2) * animation.squash;
    }

    const sprite = this.flashTimer > 0 ? sprites[`${this.type}Flash`] : sprites[this.type];
    DrawUtils.shadow(ctx, this.x, this.y + size * this.stats.shadowOffset, size * 0.26);
    DrawUtils.character(ctx, sprite, this.x, this.y + liftY, size, this.facing, scaleX, scaleY);
    this.renderHealthBar(ctx);
  }

  renderHealthBar(ctx) {
    const isDamaged = this.currentHealth < this.maxHealth;
    if (GameConfig.ui.enemyHealthBars === 'damaged' && !isDamaged) return;
    const bar = GameConfig.ui.enemyHealthBar;
    const width = this.drawSize * bar.widthFactor;
    DrawUtils.bar(
      ctx,
      this.x - width / 2,
      this.y - this.drawSize * bar.offsetY,
      width,
      bar.height,
      this.currentHealth / this.maxHealth,
      '#ef5050'
    );
  }
}
