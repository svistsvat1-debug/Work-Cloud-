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
    this.maxHealth = stats.maxHealth;
    this.currentHealth = stats.maxHealth;
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

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (Math.abs(this.vx) > 1) this.facing = Math.sign(this.vx);
    this.animTime += dt;
  }

  takeDamage(amount, game) {
    if (this.dead) return;
    this.currentHealth -= amount;
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

    DrawUtils.shadow(ctx, this.x, this.y + size * this.stats.shadowOffset, size * 0.26);
    DrawUtils.character(ctx, sprites[this.type], this.x, this.y + liftY, size, this.facing, scaleX, scaleY);
  }
}
