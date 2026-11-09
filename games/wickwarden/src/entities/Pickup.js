import { Entity } from './Entity.js';
import { GameConfig } from '../config/GameConfig.js';

const CFG = GameConfig.pickups;

/**
 * Base class for things the player collects (XP gems, gold).
 * Once the player comes within the magnet radius, the pickup flies to them.
 */
export class Pickup extends Entity {
  resetPickup(x, y, radius) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.active = true;
    this.magnetized = false;
    this.speed = 0;
    this.bobPhase = Math.random() * Math.PI * 2;
  }

  /** Moves toward the player when magnetized. Returns true when collected. */
  update(dt, game) {
    const player = game.player;
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distSq = dx * dx + dy * dy;
    const magnet = player.stats.magnetRadius;

    if (!this.magnetized && distSq < magnet * magnet) this.magnetized = true;

    if (this.magnetized) {
      const dist = Math.sqrt(distSq) || 1;
      this.speed = Math.min(CFG.magnetMaxSpeed, this.speed + CFG.magnetAcceleration * dt);
      const step = Math.min(dist, this.speed * dt);
      this.x += (dx / dist) * step;
      this.y += (dy / dist) * step;
    }

    const reach = player.stats.pickupRadius + this.radius;
    return dx * dx + dy * dy <= reach * reach;
  }
}
