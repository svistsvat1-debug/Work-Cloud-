// Detects overlaps (circle vs circle) using a spatial grid.
// What *happens* on a hit is handled by CombatSystem.

import { GameConfig } from '../config/GameConfig.js';
import { SpatialGrid } from '../core/SpatialGrid.js';
import { circlesOverlap } from '../core/MathUtils.js';

const CFG = GameConfig.collision;
const LARGEST_ENEMY_RADIUS = Math.max(...Object.values(GameConfig.enemies).map((e) => e.radius));

export class CollisionSystem {
  constructor(game) {
    this.game = game;
    this.grid = new SpatialGrid(CFG.cellSize);
    this.buffer = [];
  }

  rebuild(enemies) {
    this.grid.clear();
    for (const enemy of enemies) if (enemy.active) this.grid.insert(enemy);
  }

  /** Enemies whose circles may touch the circle (x, y, radius). Fills and returns `out`. */
  queryEnemies(x, y, radius, out) {
    return this.grid.query(x, y, radius + LARGEST_ENEMY_RADIUS, out);
  }

  /** Gently pushes overlapping enemies apart so the horde doesn't collapse into one blob. */
  separateEnemies(enemies) {
    const near = this.buffer;
    for (const a of enemies) {
      this.grid.query(a.x, a.y, a.radius * 2, near);
      let checked = 0;
      for (const b of near) {
        if (b.id <= a.id) continue; // each pair once
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const minDist = (a.radius + b.radius) * 0.85;
        const distSq = dx * dx + dy * dy;
        if (distSq >= minDist * minDist || distSq === 0) continue;
        const dist = Math.sqrt(distSq);
        const push = (minDist - dist) * CFG.separationStrength;
        // heavier (bigger) enemies get pushed less
        const massA = a.radius * a.radius;
        const massB = b.radius * b.radius;
        const shareA = massB / (massA + massB);
        const nx = dx / dist;
        const ny = dy / dist;
        a.x -= nx * push * shareA;
        a.y -= ny * push * shareA;
        b.x += nx * push * (1 - shareA);
        b.y += ny * push * (1 - shareA);
        if (++checked >= 6) break; // limit work in very dense crowds
      }
    }
  }

  projectilesVsEnemies(projectiles) {
    const combat = this.game.combat;
    const near = this.buffer;
    for (const p of projectiles) {
      if (!p.active) continue;
      this.queryEnemies(p.x, p.y, p.radius, near);
      for (const enemy of near) {
        if (!enemy.active || p.hitIds.has(enemy.id)) continue;
        if (!circlesOverlap(p.x, p.y, p.radius, enemy.x, enemy.y, enemy.radius)) continue;
        p.hitIds.add(enemy.id);
        const speed = Math.hypot(p.vx, p.vy) || 1;
        combat.damageEnemy(enemy, p.damage, (p.vx / speed) * p.knockback, (p.vy / speed) * p.knockback);
        p.pierce -= 1;
        if (p.pierce <= 0) {
          p.active = false;
          break;
        }
      }
    }
  }

  enemiesVsPlayer() {
    const player = this.game.player;
    if (player.isInvincible) return;
    const near = this.queryEnemies(player.x, player.y, player.radius, this.buffer);
    for (const enemy of near) {
      if (!enemy.active) continue;
      if (circlesOverlap(player.x, player.y, player.radius, enemy.x, enemy.y, enemy.radius)) {
        this.game.combat.damagePlayer(enemy.damage);
        return; // invincibility starts after the first hit
      }
    }
  }
}
