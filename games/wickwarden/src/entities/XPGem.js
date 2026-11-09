import { Pickup } from './Pickup.js';
import { GameConfig } from '../config/GameConfig.js';

const CFG = GameConfig.gems;
const GLOW = { blue: 'glow_blue', green: 'glow_white', red: 'glow_red' };

export function gemTier(value) {
  for (const t of CFG.tiers) if (value >= t.minValue) return t.tier;
  return 'blue';
}

/** XP gems never despawn — they wait on the ground until collected. */
export class XPGem extends Pickup {
  reset(x, y, value) {
    this.resetPickup(x, y, CFG.radius);
    this.setValue(value);
    return this;
  }

  setValue(value) {
    this.value = value;
    this.tier = gemTier(value);
  }

  render(ctx, game) {
    const bob = Math.sin(game.time * 4 + this.bobPhase) * 3;
    const size = CFG.drawSize * (this.tier === 'red' ? 1.25 : this.tier === 'green' ? 1.1 : 1);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = 0.5;
    game.sprites.blit(ctx, game.sprites.get(GLOW[this.tier]), this.x, this.y + bob, size * 1.4);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    game.sprites.blit(ctx, game.sprites.get(`gem_${this.tier}`), this.x, this.y + bob, size);
  }
}
