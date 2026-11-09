// Visual "juice": particles, expanding rings, lightning bolts and floating numbers.
// Everything here is capped so effects never hurt performance or readability.

import { GameConfig } from '../config/GameConfig.js';
import { TAU, randomRange } from '../core/MathUtils.js';
import { removeInactive, releaseAll, Pool } from '../core/Pool.js';

const CFG = GameConfig.effects;

export class EffectsSystem {
  constructor(game) {
    this.game = game;
    this.particles = [];
    this.particlePool = new Pool(() => ({ active: true }));
    this.rings = [];
    this.bolts = [];
    this.texts = [];
    this.textPool = new Pool(() => ({ active: true }));
  }

  clear() {
    releaseAll(this.particles, this.particlePool);
    releaseAll(this.texts, this.textPool);
    this.rings.length = 0;
    this.bolts.length = 0;
  }

  get particleCount() {
    return this.particles.length;
  }

  /** Small square particles flying outward. Count is reduced when the screen is busy. */
  burst(x, y, color, count, speed = 220, size = 7, life = 0.5) {
    const free = CFG.maxParticles - this.particles.length;
    if (free <= 0) return;
    const busy = this.particles.length > CFG.maxParticles * 0.6;
    const n = Math.min(free, busy ? Math.ceil(count / 2) : count);
    for (let i = 0; i < n; i++) {
      const p = this.particlePool.get();
      const angle = Math.random() * TAU;
      const s = speed * randomRange(0.35, 1);
      p.active = true;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * s;
      p.vy = Math.sin(angle) * s;
      p.life = p.maxLife = life * randomRange(0.6, 1);
      p.size = size * randomRange(0.6, 1.2);
      p.color = color;
      this.particles.push(p);
    }
  }

  /** Expanding ring, used by pulse weapons, chest openings, boss deaths. */
  ring(x, y, radius, color, duration = 0.45, fill = true) {
    this.rings.push({ x, y, radius, color, time: 0, duration, fill });
  }

  /** Jagged lightning line between two points. */
  lightning(x1, y1, x2, y2, color = '#cfefff', duration = 0.2, width = 6) {
    const points = [x1, y1];
    const segments = 7;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const offset = (Math.random() - 0.5) * Math.min(60, len * 0.2);
      points.push(x1 + dx * t + nx * offset, y1 + dy * t + ny * offset);
    }
    points.push(x2, y2);
    this.bolts.push({ points, color, time: 0, duration, width });
  }

  /** Floating text (damage numbers, "+5 HP", ...). */
  text(x, y, value, color = '#ffffff', size = 26) {
    if (this.texts.length >= CFG.maxFloatingTexts) return;
    const t = this.textPool.get();
    t.active = true;
    t.x = x + randomRange(-10, 10);
    t.y = y;
    t.value = String(value);
    t.color = color;
    t.size = size;
    t.life = t.maxLife = 0.7;
    this.texts.push(t);
  }

  update(dt) {
    for (const p of this.particles) {
      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }
      const drag = Math.exp(-4 * dt);
      p.vx *= drag;
      p.vy *= drag;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
    removeInactive(this.particles, this.particlePool);

    for (const t of this.texts) {
      t.life -= dt;
      t.y -= 60 * dt;
      if (t.life <= 0) t.active = false;
    }
    removeInactive(this.texts, this.textPool);

    for (const r of this.rings) r.time += dt;
    this.rings = this.rings.filter((r) => r.time < r.duration);
    for (const b of this.bolts) b.time += dt;
    this.bolts = this.bolts.filter((b) => b.time < b.duration);
  }

  /** Effects that sit on the ground, under enemies. */
  renderUnder(ctx) {
    for (const r of this.rings) {
      const t = r.time / r.duration;
      const radius = r.radius * (0.35 + 0.65 * Math.min(1, t * 2.5));
      const alpha = 1 - t;
      ctx.globalAlpha = alpha * 0.9;
      if (r.fill) {
        const g = ctx.createRadialGradient(r.x, r.y, radius * 0.5, r.x, r.y, radius);
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(1, r.color);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(r.x, r.y, radius, 0, TAU);
        ctx.fill();
      }
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(r.x, r.y, radius, 0, TAU);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  renderOver(ctx, sprites) {
    // lightning
    ctx.lineJoin = 'round';
    for (const b of this.bolts) {
      const alpha = 1 - b.time / b.duration;
      ctx.globalAlpha = alpha;
      for (const [color, width] of [[b.color, b.width * 2.2], ['#ffffff', b.width * 0.6]]) {
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.globalAlpha = color === '#ffffff' ? alpha : alpha * 0.55;
        ctx.beginPath();
        ctx.moveTo(b.points[0], b.points[1]);
        for (let i = 2; i < b.points.length; i += 2) ctx.lineTo(b.points[i], b.points[i + 1]);
        ctx.stroke();
      }
      const ex = b.points[b.points.length - 2];
      const ey = b.points[b.points.length - 1];
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = alpha * 0.5;
      sprites.blit(ctx, sprites.get('glow_blue'), ex, ey, 110);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.globalAlpha = 1;

    // particles
    for (const p of this.particles) {
      ctx.globalAlpha = Math.min(1, (p.life / p.maxLife) * 1.5);
      ctx.fillStyle = p.color;
      const s = p.size;
      ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    }
    ctx.globalAlpha = 1;

    // floating numbers
    ctx.textAlign = 'center';
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'rgba(10,6,16,0.9)';
    for (const t of this.texts) {
      const k = t.life / t.maxLife;
      ctx.globalAlpha = Math.min(1, k * 2);
      const pop = k > 0.8 ? 1 + (k - 0.8) * 2 : 1;
      ctx.font = `bold ${Math.round(t.size * pop)}px "Trebuchet MS", sans-serif`;
      ctx.strokeText(t.value, t.x, t.y);
      ctx.fillStyle = t.color;
      ctx.fillText(t.value, t.x, t.y);
    }
    ctx.globalAlpha = 1;
  }
}
