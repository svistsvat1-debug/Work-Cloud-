/**
 * EffectsSystem holds short-lived visual effects that are not game objects:
 * the "poof" when an enemy dies and the floating damage numbers.
 * Every effect has a `time` that counts up and a `duration`; it is removed when time runs out.
 */
class EffectsSystem {
  constructor(game) {
    this.game = game;
    this.reset();
  }

  reset() {
    this.puffs = [];
    this.damageNumbers = [];
  }

  /** A quick expanding ring + flash where an enemy died. */
  spawnPuff(x, y, color, size) {
    this.puffs.push({ x, y, color, size, time: 0, duration: GameConfig.effects.puffDuration });
  }

  /** A number that floats up and fades out. */
  spawnDamageNumber(x, y, amount, color = '#ffffff') {
    this.spawnText(x, y, String(Math.round(amount)), color);
  }

  /** Any short text that floats up and fades out (damage, "+12 HP"...). */
  spawnText(x, y, text, color = '#ffffff') {
    const config = GameConfig.effects;
    if (this.damageNumbers.length >= config.maxDamageNumbers) this.damageNumbers.shift();
    this.damageNumbers.push({
      x: x + MathUtils.randomRange(-14, 14),
      y,
      text,
      color,
      time: 0,
      duration: config.damageNumberDuration,
    });
  }

  update(dt) {
    for (const list of [this.puffs, this.damageNumbers]) {
      for (const effect of list) effect.time += dt;
      ArrayUtils.removeWhere(list, (effect) => effect.time >= effect.duration);
    }
  }

  render(ctx) {
    this.renderPuffs(ctx);
    this.renderDamageNumbers(ctx);
    ctx.globalAlpha = 1;
  }

  renderPuffs(ctx) {
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
  }

  renderDamageNumbers(ctx) {
    const config = GameConfig.effects;
    ctx.font = `bold ${config.damageNumberSize}px ${GameConfig.ui.font}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    for (const number of this.damageNumbers) {
      const progress = number.time / number.duration;
      const easeOut = 1 - (1 - progress) * (1 - progress); // fast at first, then slows down
      const y = number.y - config.damageNumberRise * easeOut;
      ctx.globalAlpha = progress < 0.6 ? 1 : 1 - (progress - 0.6) / 0.4;
      ctx.strokeText(number.text, number.x, y);
      ctx.fillStyle = number.color;
      ctx.fillText(number.text, number.x, y);
    }
  }
}
