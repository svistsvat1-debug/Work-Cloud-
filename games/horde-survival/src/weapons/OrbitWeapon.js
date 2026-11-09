/**
 * Blades that circle around the player and damage enemies they touch (Orbiting Blade).
 * It has no cooldown: the blades are always there. Each enemy can only be
 * hit once every `hitCooldown` seconds, otherwise it would be hit every frame.
 */
class OrbitWeapon extends Weapon {
  constructor(id, game) {
    super(id, game);
    this.angle = 0;
    this.blades = []; // current blade positions, used for drawing
  }

  update(dt) {
    const player = this.game.player;
    const stats = this.stats;
    const now = this.game.survivalTime;
    const orbitRadius = stats.orbitRadius * (1 + (stats.size - 1) * 0.5); // bigger blades orbit a bit wider
    const bladeRadius = stats.bladeRadius * stats.size;

    this.angle += stats.rotationSpeed * dt;
    this.blades.length = 0;

    for (let i = 0; i < stats.amount; i++) {
      // Spread the blades evenly around the circle.
      const angle = this.angle + (i * Math.PI * 2) / stats.amount;
      const blade = {
        x: player.x + Math.cos(angle) * orbitRadius,
        y: player.y + Math.sin(angle) * orbitRadius,
        angle,
      };
      this.blades.push(blade);

      this.game.collisions.forEachEnemyInRadius(blade.x, blade.y, bladeRadius, (enemy) => {
        if (!enemy.canBeHitBy(this.id, now)) return;
        enemy.markHitBy(this.id, now + stats.hitCooldown);
        this.hitAwayFromPlayer(enemy, stats.knockback);
      });
    }
  }

  render(ctx, sprites) {
    const size = this.stats.bladeDrawSize * this.stats.size;
    const sprite = sprites[this.definition.sprite];

    // Evolved blades leave a faint ring along their path.
    if (this.definition.orbitTrailColor && this.blades.length > 0) {
      const player = this.game.player;
      const first = this.blades[0];
      ctx.strokeStyle = this.definition.orbitTrailColor;
      ctx.lineWidth = 26;
      ctx.beginPath();
      ctx.arc(player.x, player.y, Math.hypot(first.x - player.x, first.y - player.y), 0, Math.PI * 2);
      ctx.stroke();
    }

    for (const blade of this.blades) {
      // Point the blade along its path, plus a fast spin for style.
      DrawUtils.rotated(ctx, sprite, blade.x, blade.y, size, blade.angle + Math.PI / 2 + this.angle * 2);
    }
  }
}
