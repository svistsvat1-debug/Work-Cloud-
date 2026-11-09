/**
 * Marks random enemies on screen, then lightning strikes each mark (Lightning Mark).
 * The mark follows its target for a moment, so the strike is easy to read.
 */
class StrikeWeapon extends Weapon {
  constructor(id, game) {
    super(id, game);
    this.marks = []; // { target, x, y, timer }
    this.bolts = []; // lightning visuals: { x, y, time, points }
  }

  fire() {
    const targets = this.game.collisions.findRandomVisibleEnemies(this.stats.amount);
    if (targets.length === 0) return false;
    for (const target of targets) {
      this.marks.push({ target, x: target.x, y: target.y, timer: this.stats.markDelay });
    }
    return true;
  }

  update(dt) {
    super.update(dt); // cooldown + fire()

    for (const mark of this.marks) {
      if (!mark.target.dead) {
        mark.x = mark.target.x;
        mark.y = mark.target.y;
      }
      mark.timer -= dt;
      if (mark.timer <= 0) this.strike(mark.x, mark.y);
    }
    ArrayUtils.removeWhere(this.marks, (mark) => mark.timer <= 0);

    for (const bolt of this.bolts) bolt.time += dt;
    ArrayUtils.removeWhere(this.bolts, (bolt) => bolt.time >= StrikeWeapon.BOLT_TIME);
  }

  strike(x, y) {
    this.game.collisions.forEachEnemyInRadius(x, y, this.stats.strikeRadius, (enemy) => {
      this.hitAwayFromPlayer(enemy, this.stats.knockback);
    });
    this.bolts.push({ x, y, time: 0, points: StrikeWeapon.makeBoltPath(x, y) });
  }

  /** A zig-zag line from high above down to the target. */
  static makeBoltPath(x, y) {
    const points = [];
    const segments = 9;
    const height = 640;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const jitter = i === 0 || i === segments ? 0 : MathUtils.randomRange(-34, 34);
      points.push({ x: x + jitter + (1 - t) * 60, y: y - height * (1 - t) });
    }
    return points;
  }

  render(ctx) {
    // Marks: a pulsing ring that shrinks onto the target.
    for (const mark of this.marks) {
      const progress = 1 - mark.timer / this.stats.markDelay;
      ctx.strokeStyle = '#9fd8ff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(mark.x, mark.y, 60 - 30 * progress, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Lightning bolts: a wide soft glow under a thin bright core.
    for (const bolt of this.bolts) {
      const alpha = 1 - bolt.time / StrikeWeapon.BOLT_TIME;
      for (const [width, color] of [[16, `rgba(120, 190, 255, ${alpha * 0.45})`], [5, `rgba(255, 255, 255, ${alpha})`]]) {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();
        bolt.points.forEach((point, index) => (index === 0 ? ctx.moveTo(point.x, point.y) : ctx.lineTo(point.x, point.y)));
        ctx.stroke();
      }
      ctx.fillStyle = `rgba(190, 225, 255, ${alpha * 0.5})`;
      ctx.beginPath();
      ctx.arc(bolt.x, bolt.y, this.stats.strikeRadius * (0.6 + 0.4 * alpha), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

StrikeWeapon.BOLT_TIME = 0.22;
