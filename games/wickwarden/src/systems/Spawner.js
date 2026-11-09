// Time-based wave director: decides what spawns, how often, and how strong.

import { GameConfig } from '../config/GameConfig.js';
import { WAVES } from '../config/Waves.js';
import { lerp, randomInt, weightedKey, TAU, clamp } from '../core/MathUtils.js';

const SPAWN = GameConfig.spawn;
const SCALING = GameConfig.scaling;
const BOSS = GameConfig.boss;

export class Spawner {
  constructor(game) {
    this.game = game;
    this.reset();
  }

  reset() {
    this.spawnTimer = 0.8;
    this.waveIndex = -1;
    this.nextBossTime = BOSS.interval;
    this.bossCount = 0;
    this.nextSurroundTime = SPAWN.surroundStart;
  }

  getWaveIndex(time) {
    let index = 0;
    for (let i = 0; i < WAVES.length; i++) if (time >= WAVES[i].start) index = i;
    return index;
  }

  get currentWave() {
    return WAVES[Math.max(0, this.waveIndex)];
  }

  /** Enemy stat multipliers for the current survival time. */
  getScaling(time) {
    const m = time / 60;
    return {
      health: 1 + m * SCALING.healthPerMinute + m * m * SCALING.healthPerMinuteSq,
      speed: Math.min(SCALING.maxSpeedMult, 1 + m * SCALING.speedPerMinute),
      damage: 1 + m * SCALING.damagePerMinute,
    };
  }

  /** Seconds between spawn groups — eases between waves, keeps shrinking late game. */
  getSpawnInterval(time) {
    const wave = WAVES[this.waveIndex];
    const next = WAVES[this.waveIndex + 1];
    let interval = wave.interval;
    if (next) interval = lerp(wave.interval, next.interval, (time - wave.start) / (next.start - wave.start));
    if (time > SCALING.lateGameStart) {
      const t = clamp((time - SCALING.lateGameStart) / SCALING.lateGameRampSeconds, 0, 1);
      interval *= lerp(1, SCALING.minIntervalMult, t);
    }
    return interval;
  }

  update(dt) {
    const game = this.game;
    const time = game.run.time;

    const index = this.getWaveIndex(time);
    if (index !== this.waveIndex) {
      this.waveIndex = index;
      const wave = WAVES[index];
      game.ui.announce(`Wave ${index + 1}`, index === 0 ? `${wave.name} — survive!` : `${wave.name} · the swarm grows stronger`);
    }

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      if (game.enemies.length < SPAWN.maxEnemies) {
        this.spawnGroup();
        this.spawnTimer += this.getSpawnInterval(time);
      } else {
        this.spawnTimer = 0.25; // too many enemies: wait instead of overloading
      }
    }

    if (time >= this.nextBossTime) {
      this.nextBossTime += BOSS.interval;
      this.spawnBoss();
    }

    if (time >= this.nextSurroundTime) {
      this.nextSurroundTime += SPAWN.surroundInterval;
      this.spawnSurround();
    }

    this.relocateFarEnemies();
  }

  /** A random point just outside the visible screen, on any side. */
  randomSpawnPoint() {
    const cam = this.game.camera;
    const m = SPAWN.margin;
    const w = cam.width;
    const h = cam.height;
    const r = Math.random() * 2 * (w + h);
    if (r < w) return { x: cam.left + r, y: cam.top - m };
    if (r < 2 * w) return { x: cam.left + (r - w), y: cam.bottom + m };
    if (r < 2 * w + h) return { x: cam.left - m, y: cam.top + (r - 2 * w) };
    return { x: cam.right + m, y: cam.top + (r - 2 * w - h) };
  }

  spawnGroup() {
    const wave = this.currentWave;
    const type = weightedKey(wave.mix);
    const count = Math.min(randomInt(wave.group[0], wave.group[1]), SPAWN.maxEnemies - this.game.enemies.length);
    const point = this.randomSpawnPoint();
    const scaling = this.getScaling(this.game.run.time);
    for (let i = 0; i < count; i++) {
      const spread = SPAWN.groupSpread;
      this.game.spawnEnemy(type, point.x + (Math.random() - 0.5) * spread * 2, point.y + (Math.random() - 0.5) * spread * 2, scaling);
    }
  }

  /** "They close in!" — a ring of weak enemies around the player, just off-screen. */
  spawnSurround() {
    const game = this.game;
    const time = game.run.time;
    const type = time < 180 ? 'slime' : 'bat';
    const room = SPAWN.maxEnemies - game.enemies.length;
    const count = Math.min(room, Math.min(36, 18 + Math.floor(time / 60) * 2));
    if (count < 8) return;
    const scaling = this.getScaling(time);
    const offset = Math.random() * TAU;
    for (let i = 0; i < count; i++) {
      const a = offset + (i / count) * TAU;
      game.spawnEnemy(type, game.player.x + Math.cos(a) * SPAWN.surroundRadius, game.player.y + Math.sin(a) * SPAWN.surroundRadius, scaling);
    }
    game.ui.announce('They close in!', null, '#ff9a7a');
  }

  spawnBoss() {
    const game = this.game;
    this.bossCount += 1;
    const base = this.getScaling(game.run.time);
    const scaling = {
      health: 1 + BOSS.healthGrowthPerBoss * (this.bossCount - 1),
      speed: Math.min(1.15, base.speed),
      damage: base.damage,
    };
    const point = this.randomSpawnPoint();
    game.spawnEnemy('boss', point.x, point.y, scaling);
    game.ui.announce(`${GameConfig.enemies.boss.name} approaches!`, 'Watch for its charge — it glows red first', '#ff6a6a');
    game.audio.play('bossSpawn');
  }

  /** Enemies left far behind are moved back to the screen edge, so the pressure stays on. */
  relocateFarEnemies() {
    const player = this.game.player;
    const limitSq = SPAWN.despawnDistance * SPAWN.despawnDistance;
    for (const enemy of this.game.enemies) {
      const dx = enemy.x - player.x;
      const dy = enemy.y - player.y;
      if (dx * dx + dy * dy > limitSq) {
        const point = this.randomSpawnPoint();
        enemy.x = point.x;
        enemy.y = point.y;
      }
    }
  }
}
