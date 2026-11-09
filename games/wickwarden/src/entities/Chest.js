import { Entity } from './Entity.js';

/** Treasure chest on the ground — opens when the player touches it. */
export class Chest extends Entity {
  constructor(x, y) {
    super();
    this.x = x;
    this.y = y;
    this.radius = 36;
    this.time = Math.random() * 10;
  }

  update(dt) {
    this.time += dt;
  }

  render(ctx, game) {
    const bob = Math.sin(this.time * 3) * 4;
    // a beam of light so chests are easy to spot
    const pulse = 0.5 + Math.sin(this.time * 4) * 0.2;
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = pulse;
    game.sprites.blit(ctx, game.sprites.get('glow_gold'), this.x, this.y - 10, 200);
    ctx.fillStyle = 'rgba(255,220,120,0.12)';
    ctx.fillRect(this.x - 26, this.y - 400, 52, 380);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    game.sprites.blit(ctx, game.sprites.get('chest', 0), this.x, this.y - 20 + bob, 120);
  }
}
