import { Pickup } from './Pickup.js';
import { GameConfig } from '../config/GameConfig.js';
import { drawSprite } from '../assets/ProceduralSprites.js';

const CFG = GameConfig.coins;

export class Coin extends Pickup {
  reset(x, y, value = 1) {
    this.resetPickup(x, y, CFG.radius);
    this.value = value;
    return this;
  }

  render(ctx, game) {
    // a cheap "spinning coin" effect: squash horizontally
    const spin = Math.abs(Math.cos(game.time * 3 + this.bobPhase));
    const size = CFG.drawSize * (this.value > 1 ? 1.25 : 1);
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(0.35 + spin * 0.65, 1);
    drawSprite(ctx, game.sprites.get('coin'), 0, 0, size);
    ctx.restore();
  }
}
