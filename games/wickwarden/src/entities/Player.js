import { Entity } from './Entity.js';
import { GameConfig } from '../config/GameConfig.js';
import { PASSIVES } from '../config/Passives.js';
import { damp } from '../core/MathUtils.js';
import { emptyModifiers, addModifiers } from '../core/StatModifiers.js';

const CFG = GameConfig.player;

/** XP needed to go from `level` to `level + 1`. */
export function xpRequired(level) {
  const { base, linear, curve } = GameConfig.xp;
  const n = level - 1;
  return Math.floor(base + linear * n + curve * n * n);
}

export class Player extends Entity {
  constructor() {
    super();
    this.reset(emptyModifiers());
  }

  /** metaModifiers = permanent shop bonuses, summed into one modifier object. */
  reset(metaModifiers) {
    this.x = 0;
    this.y = 0;
    this.vx = 0;
    this.vy = 0;
    this.radius = CFG.radius;
    this.active = true;

    this.level = 1;
    this.xp = 0;
    this.xpToNext = xpRequired(1);

    this.weapons = []; // weapon instances (see WeaponSystem.createWeapon)
    this.passives = []; // { id, level }
    this.metaModifiers = metaModifiers;
    this.stats = {};

    this.invincibleTimer = 0;
    this.facing = 1;
    this.animTime = 0;
    this.moving = false;

    this.recalculateStats();
    this.health = this.stats.maxHealth;
  }

  /** Rebuilds final stats from base config + permanent upgrades + passives. */
  recalculateStats() {
    const mods = addModifiers(emptyModifiers(), this.metaModifiers);
    for (const passive of this.passives) {
      addModifiers(mods, PASSIVES[passive.id].perLevel, passive.level);
    }

    const previousMax = this.stats.maxHealth;
    this.stats = {
      maxHealth: CFG.maxHealth + mods.maxHealth,
      speed: CFG.speed * (1 + mods.speedMult),
      damageMult: 1 + mods.damageMult,
      cooldownMult: Math.max(0.4, 1 + mods.cooldownMult),
      magnetRadius: CFG.magnetRadius * (1 + mods.magnetMult),
      pickupRadius: CFG.pickupRadius * (1 + mods.magnetMult * 0.5),
      xpMult: 1 + mods.xpMult,
      luck: mods.luck,
    };

    // Gaining max HP also heals by the same amount.
    if (previousMax !== undefined && this.stats.maxHealth > previousMax) {
      this.health += this.stats.maxHealth - previousMax;
    }
    if (this.health !== undefined) this.health = Math.min(this.health, this.stats.maxHealth);
  }

  update(dt, game) {
    const move = game.input.getMoveVector();
    const speed = this.stats.speed;
    // Smoothly accelerate toward the target velocity.
    this.vx = damp(this.vx, move.x * speed, CFG.acceleration, dt);
    this.vy = damp(this.vy, move.y * speed, CFG.acceleration, dt);
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    this.moving = move.x !== 0 || move.y !== 0;
    if (move.x !== 0) this.facing = move.x > 0 ? 1 : -1;
    this.animTime += dt;
    if (this.invincibleTimer > 0) this.invincibleTimer -= dt;
  }

  get isInvincible() {
    return this.invincibleTimer > 0;
  }

  /** Returns true if the damage was applied (false while invincible). */
  takeDamage(amount) {
    if (this.isInvincible || this.health <= 0) return false;
    this.health = Math.max(0, this.health - amount);
    this.invincibleTimer = CFG.invincibleTime;
    return true;
  }

  heal(amount) {
    const before = this.health;
    this.health = Math.min(this.stats.maxHealth, this.health + amount);
    return this.health - before;
  }

  /** Adds XP and returns how many levels were gained (can be more than one). */
  addXP(amount) {
    this.xp += amount * this.stats.xpMult;
    let levelsGained = 0;
    while (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level += 1;
      this.xpToNext = xpRequired(this.level);
      levelsGained += 1;
    }
    return levelsGained;
  }

  getWeapon(id) {
    return this.weapons.find((w) => w.id === id);
  }

  getPassive(id) {
    return this.passives.find((p) => p.id === id);
  }

  render(ctx, game) {
    // Blink while invincible.
    if (this.isInvincible && Math.floor(this.invincibleTimer * 16) % 2 === 0) ctx.globalAlpha = 0.35;
    const frame = this.moving ? Math.floor(this.animTime * 8) % 4 : 0;
    const bob = this.moving ? 0 : Math.sin(this.animTime * 3) * 2;
    game.sprites.blit(ctx, game.sprites.get('player', frame), this.x, this.y - 20 + bob, CFG.drawSize, this.facing < 0);
    ctx.globalAlpha = 1;
  }
}
