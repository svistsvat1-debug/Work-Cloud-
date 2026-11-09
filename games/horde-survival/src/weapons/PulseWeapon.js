/**
 * A ring of light that grows around the player and hits every enemy it
 * passes, pushing them away (Holy Pulse). It only fires when an enemy is
 * close enough to be hit.
 */
class PulseWeapon extends Weapon {
  constructor(id, game) {
    super(id, game);
    this.pulses = []; // active rings: { time, radius, hit: Set of enemies already hit }
  }

  fire() {
    const player = this.game.player;
    if (!this.game.collisions.anyEnemyInRadius(player.x, player.y, this.stats.radius)) return false;
    this.pulses.push({ time: 0, radius: 0, hit: new Set() });
    return true;
  }

  update(dt) {
    super.update(dt); // cooldown + fire()

    const player = this.game.player;
    const stats = this.stats;
    for (const pulse of this.pulses) {
      pulse.time += dt;
      const progress = Math.min(1, pulse.time / stats.expandTime);
      pulse.radius = stats.radius * (1 - Math.pow(1 - progress, 3)); // fast start, soft finish

      if (progress >= 1) continue; // fully grown: only fading out now
      this.game.collisions.forEachEnemyInRadius(player.x, player.y, pulse.radius, (enemy) => {
        if (pulse.hit.has(enemy)) return; // each enemy is hit once per pulse
        pulse.hit.add(enemy);
        this.hitAwayFromPlayer(enemy, stats.knockback);
      });
    }
    ArrayUtils.removeWhere(this.pulses, (pulse) => pulse.time >= stats.expandTime + PulseWeapon.FADE_TIME);
  }

  render(ctx) {
    const player = this.game.player;
    for (const pulse of this.pulses) {
      const fadeProgress = Math.max(0, pulse.time - this.stats.expandTime) / PulseWeapon.FADE_TIME;
      const alpha = 1 - fadeProgress;
      ctx.globalAlpha = alpha * 0.18;
      ctx.fillStyle = '#fff1b8';
      ctx.beginPath();
      ctx.arc(player.x, player.y, pulse.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = '#ffe27a';
      ctx.lineWidth = 12 * (1 - fadeProgress * 0.7);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}

PulseWeapon.FADE_TIME = 0.25;
