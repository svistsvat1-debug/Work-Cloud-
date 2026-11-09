import { Entity } from './Entity.js';
import { drawSprite } from '../assets/ProceduralSprites.js';

export class Projectile extends Entity {
  constructor() {
    super();
    this.hitIds = new Set(); // enemies already hit (so piercing shots don't hit twice)
  }

  /** options: { damage, pierce, size, knockback, visual, glow } */
  reset(x, y, vx, vy, options) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.active = true;
    this.damage = options.damage;
    this.pierce = options.pierce; // how many enemies it can still hit
    this.radius = options.size;
    this.knockback = options.knockback;
    this.visual = options.visual;
    this.glow = options.glow;
    this.angle = Math.atan2(vy, vx);
    this.life = 3; // safety timeout in seconds
    this.hitIds.clear();
    return this;
  }

  update(dt, game) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.life -= dt;
    // Remove once it leaves the screen (with a margin) or lives too long.
    if (this.life <= 0 || !game.camera.isVisible(this.x, this.y, 150)) this.active = false;
  }

  render(ctx, game) {
    const size = this.radius * 5;
    if (this.glow) {
      ctx.globalCompositeOperation = 'lighter';
      game.sprites.blit(ctx, game.sprites.get(this.glow), this.x, this.y, size * 1.6);
      ctx.globalCompositeOperation = 'source-over';
    }
    drawSprite(ctx, game.sprites.get(this.visual), this.x, this.y, size, false, this.angle);
  }
}
