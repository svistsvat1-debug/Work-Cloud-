// Runs every weapon the player owns. Each weapon has its own cooldown timer.
// The weapon's `behavior` (from config/Weapons.js) picks which update function runs.

import { WEAPONS } from '../config/Weapons.js';
import { statsForLevel } from '../core/StatModifiers.js';
import { TAU, circlesOverlap, distanceSq } from '../core/MathUtils.js';
import { drawSprite } from '../assets/ProceduralSprites.js';

export class WeaponSystem {
  constructor(game) {
    this.game = game;
    this.strikes = []; // pending lightning strikes (marker shown first, then the hit)
    this.buffer = [];
    this.chainBuffer = [];
    this.behaviors = {
      projectile: (w, dt) => this.updateProjectile(w, dt),
      orbit: (w, dt) => this.updateOrbit(w, dt),
      pulse: (w, dt) => this.updatePulse(w, dt),
      strike: (w, dt) => this.updateStrike(w, dt),
    };
  }

  clear() {
    this.strikes.length = 0;
  }

  createWeapon(id) {
    const weapon = { id, def: WEAPONS[id], level: 1, timer: 0.4, angle: 0, stats: null };
    this.refreshStats(weapon);
    return weapon;
  }

  refreshStats(weapon) {
    weapon.stats = statsForLevel(weapon.def.base, weapon.def.levels, weapon.level);
  }

  levelUp(weapon) {
    if (weapon.level >= weapon.def.maxLevel) return false;
    weapon.level += 1;
    this.refreshStats(weapon);
    return true;
  }

  cooldown(weapon) {
    return weapon.stats.cooldown * this.game.player.stats.cooldownMult;
  }

  update(dt) {
    for (const weapon of this.game.player.weapons) this.behaviors[weapon.def.behavior](weapon, dt);
    this.updateStrikes(dt);
  }

  // ---------- targeting helpers ----------

  findNearestEnemy(x, y, range) {
    let best = null;
    let bestDist = range * range;
    for (const enemy of this.game.enemies) {
      if (!enemy.active) continue;
      const d = distanceSq(x, y, enemy.x, enemy.y);
      if (d < bestDist) {
        bestDist = d;
        best = enemy;
      }
    }
    return best;
  }

  visibleEnemies(out) {
    out.length = 0;
    const camera = this.game.camera;
    for (const enemy of this.game.enemies) {
      if (enemy.active && camera.isVisible(enemy.x, enemy.y, -30)) out.push(enemy);
    }
    return out;
  }

  // ---------- behaviors ----------

  /** Ember Shot / Ember Tempest: shoot at the nearest enemy. */
  updateProjectile(weapon, dt) {
    weapon.timer -= dt;
    if (weapon.timer > 0) return;
    const game = this.game;
    const player = game.player;
    const s = weapon.stats;
    const originY = player.y - 30;
    const target = this.findNearestEnemy(player.x, originY, s.range);
    if (!target) {
      weapon.timer = 0; // wait until an enemy exists
      return;
    }
    const baseAngle = Math.atan2(target.y - originY, target.x - player.x);
    const evolved = !!weapon.def.evolution;
    for (let i = 0; i < s.amount; i++) {
      const angle = baseAngle + (i - (s.amount - 1) / 2) * s.spread;
      game.spawnProjectile(player.x, originY, Math.cos(angle) * s.speed, Math.sin(angle) * s.speed, {
        damage: s.damage,
        pierce: s.pierce,
        size: s.size,
        knockback: s.knockback,
        visual: weapon.def.icon,
        glow: evolved ? 'glow_blue' : 'glow_orange',
      });
    }
    game.audio.play('shoot');
    weapon.timer = this.cooldown(weapon);
  }

  bladePosition(weapon, index) {
    const s = weapon.stats;
    const player = this.game.player;
    const angle = weapon.angle + (index / s.amount) * TAU;
    return { x: player.x + Math.cos(angle) * s.orbitRadius, y: player.y - 20 + Math.sin(angle) * s.orbitRadius, angle };
  }

  /** Ward Knives / Sunwheel: blades circle the player. */
  updateOrbit(weapon, dt) {
    const game = this.game;
    const s = weapon.stats;
    const now = game.run.time;
    weapon.angle += s.rotationSpeed * dt;
    for (let i = 0; i < s.amount; i++) {
      const blade = this.bladePosition(weapon, i);
      const near = game.collision.queryEnemies(blade.x, blade.y, s.size, this.buffer);
      for (const enemy of near) {
        if (!enemy.active || !circlesOverlap(blade.x, blade.y, s.size, enemy.x, enemy.y, enemy.radius)) continue;
        const last = enemy.hitTimes.get(weapon.id);
        if (last !== undefined && now - last < s.hitInterval) continue;
        enemy.hitTimes.set(weapon.id, now);
        const dx = enemy.x - game.player.x;
        const dy = enemy.y - game.player.y;
        const len = Math.hypot(dx, dy) || 1;
        game.combat.damageEnemy(enemy, s.damage, (dx / len) * s.knockback, (dy / len) * s.knockback);
      }
    }
  }

  /** Lantern Pulse / Dawnbreak: damage everything in a circle around the player. */
  updatePulse(weapon, dt) {
    weapon.timer -= dt;
    if (weapon.timer > 0) return;
    weapon.timer = this.cooldown(weapon);
    const game = this.game;
    const player = game.player;
    const s = weapon.stats;
    const evolved = !!weapon.def.evolution;
    let healed = 0;

    const near = game.collision.queryEnemies(player.x, player.y, s.radius, this.buffer);
    for (const enemy of near) {
      if (!enemy.active || !circlesOverlap(player.x, player.y, s.radius, enemy.x, enemy.y, enemy.radius)) continue;
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      const len = Math.hypot(dx, dy) || 1;
      game.combat.damageEnemy(enemy, s.damage, (dx / len) * s.knockback, (dy / len) * s.knockback);
      if (s.healPerHit) healed += s.healPerHit;
    }

    if (healed > 0) {
      const amount = Math.round(player.heal(Math.min(healed, s.maxHealPerPulse)));
      if (amount > 0) game.effects.text(player.x, player.y - 110, `+${amount}`, '#7dff9a', 28);
    }
    game.effects.ring(player.x, player.y, s.radius, evolved ? 'rgba(255,230,140,0.85)' : 'rgba(255,170,80,0.75)', s.effectDuration);
    if (evolved) game.effects.ring(player.x, player.y, s.radius * 0.6, 'rgba(255,255,220,0.6)', s.effectDuration * 0.8, false);
    game.audio.play(evolved ? 'nova' : 'pulse');
  }

  /** Storm Brand / Stormcrown: mark random visible enemies, then strike them. */
  updateStrike(weapon, dt) {
    weapon.timer -= dt;
    if (weapon.timer > 0) return;
    const targets = this.visibleEnemies(this.buffer);
    if (targets.length === 0) {
      weapon.timer = 0;
      return;
    }
    const s = weapon.stats;
    const count = Math.min(s.amount, targets.length);
    for (let i = 0; i < count; i++) {
      // pick a random target without repeats (swap the chosen one to the end)
      const j = Math.floor(Math.random() * (targets.length - i));
      const enemy = targets[j];
      targets[j] = targets[targets.length - 1 - i];
      targets[targets.length - 1 - i] = enemy;
      this.strikes.push({ x: enemy.x, y: enemy.y, enemy, enemyId: enemy.id, timer: s.delay, delay: s.delay, stats: s, evolved: !!weapon.def.evolution });
    }
    weapon.timer = this.cooldown(weapon);
  }

  updateStrikes(dt) {
    if (this.strikes.length === 0) return;
    const remaining = [];
    for (const strike of this.strikes) {
      // the marker follows its target while it is alive
      if (strike.enemy.active && strike.enemy.id === strike.enemyId) {
        strike.x = strike.enemy.x;
        strike.y = strike.enemy.y;
      }
      strike.timer -= dt;
      if (strike.timer <= 0) this.resolveStrike(strike);
      else remaining.push(strike);
    }
    this.strikes = remaining;
  }

  resolveStrike(strike) {
    const game = this.game;
    const s = strike.stats;
    const color = strike.evolved ? '#fff2a0' : '#bfe9ff';
    game.effects.lightning(strike.x + (Math.random() - 0.5) * 80, strike.y - 650, strike.x, strike.y, color, 0.22, strike.evolved ? 8 : 6);
    game.effects.burst(strike.x, strike.y, color, 6, 260, 6, 0.3);
    game.audio.play('lightning');

    const near = game.collision.queryEnemies(strike.x, strike.y, s.area, this.buffer);
    const hit = [];
    for (const enemy of near) {
      if (enemy.active && circlesOverlap(strike.x, strike.y, s.area, enemy.x, enemy.y, enemy.radius)) hit.push(enemy);
    }
    for (const enemy of hit) game.combat.damageEnemy(enemy, s.damage, 0, 0);

    // Stormcrown: chance to chain to nearby enemies
    if (s.chainChance && Math.random() < s.chainChance) this.chainLightning(strike.x, strike.y, s, hit);
  }

  chainLightning(x, y, s, alreadyHit) {
    const game = this.game;
    const near = game.collision.queryEnemies(x, y, s.chainRange, this.chainBuffer)
      .filter((e) => e.active && !alreadyHit.includes(e) && distanceSq(x, y, e.x, e.y) <= s.chainRange * s.chainRange)
      .sort((a, b) => distanceSq(x, y, a.x, a.y) - distanceSq(x, y, b.x, b.y));
    let fromX = x;
    let fromY = y;
    for (let i = 0; i < Math.min(s.chainCount, near.length); i++) {
      const enemy = near[i];
      game.effects.lightning(fromX, fromY, enemy.x, enemy.y, '#fff2a0', 0.2, 5);
      game.combat.damageEnemy(enemy, s.damage * 0.6, 0, 0);
      fromX = enemy.x;
      fromY = enemy.y;
    }
  }

  // ---------- drawing ----------

  /** Strike markers sit on the ground under enemies. */
  renderUnder(ctx) {
    const sprites = this.game.sprites;
    for (const strike of this.strikes) {
      const t = 1 - strike.timer / strike.delay;
      ctx.globalAlpha = 0.5 + t * 0.5;
      drawSprite(ctx, sprites.get('mark'), strike.x, strike.y, strike.stats.area * 2.4 * (1.3 - t * 0.3), false, t * 2);
    }
    ctx.globalAlpha = 1;
  }

  /** Orbiting blades are drawn above enemies. */
  render(ctx) {
    const sprites = this.game.sprites;
    for (const weapon of this.game.player.weapons) {
      if (weapon.def.behavior !== 'orbit') continue;
      const s = weapon.stats;
      const evolved = !!weapon.def.evolution;
      for (let i = 0; i < s.amount; i++) {
        const blade = this.bladePosition(weapon, i);
        if (evolved) {
          ctx.globalCompositeOperation = 'lighter';
          this.game.sprites.blit(ctx, sprites.get('glow_gold'), blade.x, blade.y, s.size * 4);
          ctx.globalCompositeOperation = 'source-over';
        }
        drawSprite(ctx, sprites.get(weapon.def.icon), blade.x, blade.y, s.size * 3.2, false, blade.angle + Math.PI / 2);
      }
    }
  }
}
