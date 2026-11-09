/**
 * EffectsSystem holds short-lived visual effects that are not game objects,
 * like the "poof" when an enemy dies.
 */
class EffectsSystem {
  constructor(game) {
    this.game = game;
    this.puffs = [];
  }

  /** A quick expanding ring + flash where an enemy died. */
  spawnPuff(x, y, color, size) {
    this.puffs.push({ x, y, color, size, time: 0, duration: 0.35 });
  }

  update(dt) {
    for (const puff of this.puffs) puff.time += dt;
    this.puffs = this.puffs.filter((puff) => puff.time < puff.duration);
  }

  render(ctx) {
    for (const puff of this.puffs) {
      const progress = puff.time / puff.duration; // 0 -> 1
      ctx.globalAlpha = 1 - progress;
      ctx.fillStyle = puff.color;
      ctx.beginPath();
      ctx.arc(puff.x, puff.y, puff.size * 0.35 * (1 - progress), 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = puff.color;
      ctx.lineWidth = 10 * (1 - progress);
      ctx.beginPath();
      ctx.arc(puff.x, puff.y, puff.size * (0.3 + 0.5 * progress), 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}
