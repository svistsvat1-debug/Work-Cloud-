/**
 * EffectsSystem holds short-lived visual effects that are not game objects:
 * puffs, particles and floating text (damage numbers, "+12 HP").
 * Every effect has a `time` that counts up and a `duration`; it is removed when
 * time runs out. Particles are recycled with an ObjectPool and capped, so even
 * a huge fight never spawns more than GameConfig.effects.maxParticles.
 */
class EffectsSystem {
  constructor(game) {
    this.game = game;
    this.particlePool = new ObjectPool(() => ({}));
    this.particles = [];
    this.reset();
  }

  reset() {
    for (const particle of this.particles) this.particlePool.release(particle);
    this.particles.length = 0;
    this.puffs = [];
    this.damageNumbers = [];
  }

  // ---------------------------------------------------------------- Spawning

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

  /** One particle. Dropped silently when the cap is reached (the screen is busy enough). */
  spawnParticle(x, y, vx, vy, duration, size, color, gravity = 0, additive = false) {
    if (this.particles.length >= GameConfig.effects.maxParticles) return;
    const particle = this.particlePool.get();
    particle.x = x;
    particle.y = y;
    particle.vx = vx;
    particle.vy = vy;
    particle.time = 0;
    particle.duration = duration;
    particle.size = size;
    particle.color = color;
    particle.gravity = gravity;
    particle.additive = additive;
    this.particles.push(particle);
  }

  /** Particles flying out in every direction (enemy deaths, chest bursts). */
  burst(x, y, color, count, speed, size = 6) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = speed * MathUtils.randomRange(0.35, 1);
      this.spawnParticle(
        x,
        y,
        Math.cos(angle) * velocity,
        Math.sin(angle) * velocity - speed * 0.2,
        MathUtils.randomRange(0.3, 0.6),
        size * MathUtils.randomRange(0.6, 1.2),
        color,
        speed * 1.2
      );
    }
  }

  /** A few glowing sparks drifting up (pickups). */
  sparkle(x, y, color, count = 5) {
    for (let i = 0; i < count; i++) {
      this.spawnParticle(
        x + MathUtils.randomRange(-14, 14),
        y + MathUtils.randomRange(-10, 10),
        MathUtils.randomRange(-40, 40),
        MathUtils.randomRange(-140, -60),
        MathUtils.randomRange(0.25, 0.45),
        MathUtils.randomRange(3, 6),
        color,
        0,
        true
      );
    }
  }

  // ---------------------------------------------------------------- Update and drawing

  update(dt) {
    for (const list of [this.puffs, this.damageNumbers]) {
      for (const effect of list) effect.time += dt;
      ArrayUtils.removeWhere(list, (effect) => effect.time >= effect.duration);
    }

    // Particles: move, fall, then recycle the finished ones (swap-remove keeps it fast).
    const particles = this.particles;
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];
      particle.time += dt;
      if (particle.time >= particle.duration) {
        this.particlePool.release(particle);
        particles[i] = particles[particles.length - 1];
        particles.pop();
        continue;
      }
      particle.vy += particle.gravity * dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
    }
  }

  render(ctx) {
    this.renderPuffs(ctx);
    this.renderParticles(ctx);
    this.renderDamageNumbers(ctx);
    ctx.globalAlpha = 1;
  }

  renderParticles(ctx) {
    // Normal particles first, then glowing ones with additive blending.
    for (const additive of [false, true]) {
      ctx.globalCompositeOperation = additive ? 'lighter' : 'source-over';
      for (const particle of this.particles) {
        if (particle.additive !== additive) continue;
        const life = 1 - particle.time / particle.duration;
        ctx.globalAlpha = life;
        ctx.fillStyle = particle.color;
        const size = particle.size * (0.5 + 0.5 * life);
        ctx.fillRect(particle.x - size / 2, particle.y - size / 2, size, size);
      }
    }
    ctx.globalCompositeOperation = 'source-over';
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
    ctx.globalAlpha = 1;
  }

  renderDamageNumbers(ctx) {
    const config = GameConfig.effects;
    ctx.font = `bold ${config.damageNumberSize}px ${GameConfig.ui.font}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const number of this.damageNumbers) {
      const progress = number.time / number.duration;
      const easeOut = 1 - (1 - progress) * (1 - progress); // fast at first, then slows down
      const y = number.y - config.damageNumberRise * easeOut;
      ctx.globalAlpha = progress < 0.6 ? 1 : 1 - (progress - 0.6) / 0.4;
      // A dark copy slightly offset works as an outline and is much cheaper than strokeText.
      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.fillText(number.text, number.x + 2, y + 2);
      ctx.fillStyle = number.color;
      ctx.fillText(number.text, number.x, y);
    }
  }
}
