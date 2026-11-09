/**
 * A ring of light that grows around the player and hits every enemy it
 * passes, pushing them away (Holy Pulse). It only fires when an enemy is
 * close enough to be hit.
 *
 * Optional stats used by evolved versions (Divine Nova):
 *   healPerHit / maxHealPerPulse  heal the player for each enemy hit
 *   fadeTime                      how long the light lingers after growing
 * Optional definition fields: ringColor, fillColor.
 */
class PulseWeapon extends Weapon {
  constructor(id, game) {
    super(id, game);
    this.pulses = []; // active rings: { time, radius, healedTotal, healShown, hit: Set of enemies already hit }
  }

  get fadeTime() {
    return this.stats.fadeTime || 0.25;
  }

  fire() {
    const player = this.game.player;
    if (!this.game.collisions.anyEnemyInRadius(player.x, player.y, this.stats.radius)) return false;
    this.pulses.push({ time: 0, radius: 0, healedTotal: 0, healShown: false, hit: new Set() });
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

      if (progress >= 1) {
        // Fully grown: show how much it healed (once), then just fade out.
        if (!pulse.healShown && pulse.healedTotal > 0) {
          this.game.effects.spawnText(player.x, player.y - player.drawSize * 0.7, `+${pulse.healedTotal} HP`, '#7ee08a');
          pulse.healShown = true;
        }
        continue;
      }
      this.game.collisions.forEachEnemyInRadius(player.x, player.y, pulse.radius, (enemy) => {
        if (pulse.hit.has(enemy)) return; // each enemy is hit once per pulse
        pulse.hit.add(enemy);
        this.hitAwayFromPlayer(enemy, stats.knockback);
        this.healFromHit(pulse);
      });
    }
    ArrayUtils.removeWhere(this.pulses, (pulse) => pulse.time >= stats.expandTime + this.fadeTime);
  }

  /** Divine Nova: each enemy hit heals a little, up to maxHealPerPulse per pulse. */
  healFromHit(pulse) {
    const { healPerHit, maxHealPerPulse } = this.stats;
    if (!healPerHit || pulse.healedTotal >= maxHealPerPulse) return;
    const amount = Math.min(healPerHit, maxHealPerPulse - pulse.healedTotal);
    pulse.healedTotal += amount;
    this.game.player.heal(amount);
  }

  render(ctx) {
    const player = this.game.player;
    const ringColor = this.definition.ringColor || '#ffe27a';
    const fillColor = this.definition.fillColor || '#fff1b8';
    for (const pulse of this.pulses) {
      const fadeProgress = Math.max(0, pulse.time - this.stats.expandTime) / this.fadeTime;
      const alpha = 1 - fadeProgress;
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = alpha * 0.16;
      ctx.fillStyle = fillColor;
      ctx.beginPath();
      ctx.arc(player.x, player.y, pulse.radius, 0, Math.PI * 2);
      ctx.fill();
      // Evolved rings glow (additive light); only the thin rings, not the big fill, to stay fast.
      if (this.isEvolved) ctx.globalCompositeOperation = 'lighter';
      // A bell's toll: the main ring plus two fainter echo rings behind it.
      ctx.strokeStyle = ringColor;
      [[1, 1, 12], [0.86, 0.45, 7], [0.72, 0.22, 5]].forEach(([scale, strength, width]) => {
        ctx.globalAlpha = alpha * strength;
        ctx.lineWidth = width * (1 - fadeProgress * 0.7);
        ctx.beginPath();
        ctx.arc(player.x, player.y, pulse.radius * scale, 0, Math.PI * 2);
        ctx.stroke();
      });
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }
}
