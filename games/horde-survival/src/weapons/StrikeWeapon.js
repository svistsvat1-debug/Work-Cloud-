/**
 * Marks random enemies on screen, then lightning strikes each mark (Lightning Mark).
 * The mark follows its target for a moment, so the strike is easy to read.
 *
 * Optional stats used by evolved versions (Thunder Crown):
 *   chainChance / chainCount / chainRange  lightning jumps to nearby enemies
 * Optional definition fields: glowRGB ("r, g, b"), markColor.
 */
class StrikeWeapon extends Weapon {
  constructor(id, game) {
    super(id, game);
    this.marks = []; // { target, x, y, timer }
    this.bolts = []; // lightning visuals: { x, y, time, points, impact }
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
    const hit = new Set();
    this.game.collisions.forEachEnemyInRadius(x, y, this.stats.strikeRadius, (enemy) => {
      hit.add(enemy);
      this.hitAwayFromPlayer(enemy, this.stats.knockback);
    });
    this.bolts.push({ x, y, time: 0, impact: true, points: StrikeWeapon.makeBoltPath(x, y - 640, x, y) });
    if (this.stats.chainChance) this.chain(x, y, hit);
  }

  /** Thunder Crown: from the strike, lightning may jump to the nearest enemies not hit yet. */
  chain(x, y, alreadyHit) {
    const { chainChance, chainCount, chainRange } = this.stats;
    let fromX = x;
    let fromY = y;
    for (let jump = 0; jump < chainCount; jump++) {
      if (Math.random() >= chainChance) return;
      const candidates = this.game.collisions.findNearestEnemies(fromX, fromY, 6, chainRange);
      const next = candidates.find((enemy) => !alreadyHit.has(enemy));
      if (!next) return;
      alreadyHit.add(next);
      this.hitAwayFromPlayer(next, this.stats.knockback);
      this.bolts.push({ x: next.x, y: next.y, time: 0, impact: false, points: StrikeWeapon.makeBoltPath(fromX, fromY, next.x, next.y) });
      fromX = next.x;
      fromY = next.y;
    }
  }

  /** A zig-zag line between two points. */
  static makeBoltPath(fromX, fromY, toX, toY) {
    const points = [];
    const segments = 9;
    const length = Math.hypot(toX - fromX, toY - fromY);
    // Jitter sideways (perpendicular to the line), so the zig-zag works in any direction.
    const sideX = -(toY - fromY) / (length || 1);
    const sideY = (toX - fromX) / (length || 1);
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const jitter = i === 0 || i === segments ? 0 : MathUtils.randomRange(-1, 1) * Math.min(34, length * 0.08);
      points.push({
        x: fromX + (toX - fromX) * t + sideX * jitter,
        y: fromY + (toY - fromY) * t + sideY * jitter,
      });
    }
    return points;
  }

  render(ctx) {
    const glowRGB = this.definition.glowRGB || '120, 190, 255';

    // Marks: a spinning sigil (ring + four ticks) that tightens onto the target.
    ctx.strokeStyle = this.definition.markColor || '#9fd8ff';
    for (const mark of this.marks) {
      const progress = 1 - mark.timer / this.stats.markDelay;
      const radius = 60 - 30 * progress;
      const spin = progress * Math.PI;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(mark.x, mark.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 5;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const angle = spin + (i * Math.PI) / 2;
        ctx.moveTo(mark.x + Math.cos(angle) * (radius + 4), mark.y + Math.sin(angle) * (radius + 4));
        ctx.lineTo(mark.x + Math.cos(angle) * (radius + 16), mark.y + Math.sin(angle) * (radius + 16));
      }
      ctx.stroke();
    }

    // Lightning: a wide soft glow under a thin bright core (additive when evolved).
    if (this.isEvolved) ctx.globalCompositeOperation = 'lighter';
    for (const bolt of this.bolts) {
      const alpha = 1 - bolt.time / StrikeWeapon.BOLT_TIME;
      for (const [width, color] of [[16, `rgba(${glowRGB}, ${alpha * 0.45})`], [5, `rgba(255, 255, 255, ${alpha})`]]) {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.beginPath();
        bolt.points.forEach((point, index) => (index === 0 ? ctx.moveTo(point.x, point.y) : ctx.lineTo(point.x, point.y)));
        ctx.stroke();
      }
      if (bolt.impact) {
        ctx.fillStyle = `rgba(${glowRGB}, ${alpha * 0.5})`;
        ctx.beginPath();
        ctx.arc(bolt.x, bolt.y, this.stats.strikeRadius * (0.6 + 0.4 * alpha), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalCompositeOperation = 'source-over';
  }
}

StrikeWeapon.BOLT_TIME = 0.22;
