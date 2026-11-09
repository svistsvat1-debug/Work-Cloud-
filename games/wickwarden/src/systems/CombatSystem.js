// Everything that happens when something gets hurt or dies:
// damage numbers, knockback, drops, kill counts, game over.

import { GameConfig } from '../config/GameConfig.js';
import { randomRange, TAU } from '../core/MathUtils.js';

const DEATH_COLORS = {
  slime: '#6b4ca3',
  bat: '#8a7464',
  crawler: '#ff8a35',
  brute: '#8a8597',
  elite: '#ff6fe0',
  boss: '#ffe066',
};

export class CombatSystem {
  constructor(game) {
    this.game = game;
  }

  /** Applies weapon damage (with the player's damage bonus) and knockback. */
  damageEnemy(enemy, baseDamage, knockX = 0, knockY = 0) {
    if (!enemy.active || enemy.health <= 0) return 0;
    const game = this.game;
    const damage = Math.max(1, Math.round(baseDamage * game.player.stats.damageMult * randomRange(0.95, 1.05)));
    enemy.health -= damage;
    enemy.flashTimer = 0.1;
    enemy.applyKnockback(knockX, knockY);

    const big = damage >= 40;
    game.effects.text(enemy.x, enemy.y - enemy.drawSize * 0.45, damage, big ? '#ffd76a' : '#ffffff', big ? 28 : 21);
    game.audio.play('hit');

    if (enemy.health <= 0) this.killEnemy(enemy);
    return damage;
  }

  killEnemy(enemy) {
    const game = this.game;
    const run = game.run;
    enemy.active = false;
    run.kills += 1;

    const color = DEATH_COLORS[enemy.type] || '#ffffff';
    game.effects.burst(enemy.x, enemy.y, color, enemy.isBoss ? 60 : 8, enemy.isBoss ? 520 : 240, enemy.isBoss ? 12 : 7);
    game.audio.play('enemyDeath');

    if (enemy.isBoss) {
      this.onBossKilled(enemy);
      return;
    }

    game.dropGem(enemy.x, enemy.y, enemy.xpValue);

    const luck = game.player.stats.luck;
    const coinChance = GameConfig.coins.baseDropChance + luck * GameConfig.coins.luckDropBonus;
    if (enemy.isElite) {
      game.dropCoin(enemy.x + 20, enemy.y, 5);
      if (Math.random() < GameConfig.chest.eliteDropChance + luck * 0.1) game.dropChest(enemy.x, enemy.y);
    } else if (Math.random() < coinChance) {
      game.dropCoin(enemy.x, enemy.y, 1);
    }
  }

  onBossKilled(boss) {
    const game = this.game;
    const cfg = GameConfig.boss;
    game.run.bossesDefeated += 1;
    game.dropChest(boss.x, boss.y);
    // XP and gold burst in a circle around the boss
    for (let i = 0; i < cfg.gemCount; i++) {
      const a = (i / cfg.gemCount) * TAU;
      game.dropGem(boss.x + Math.cos(a) * 90, boss.y + Math.sin(a) * 90, Math.ceil(boss.xpValue / cfg.gemCount));
    }
    for (let i = 0; i < cfg.coinCount; i++) {
      const a = Math.random() * TAU;
      const r = randomRange(60, 160);
      game.dropCoin(boss.x + Math.cos(a) * r, boss.y + Math.sin(a) * r, 1);
    }
    game.effects.ring(boss.x, boss.y, 420, 'rgba(255,224,102,0.8)', 0.9);
    game.camera.shake(GameConfig.effects.shake.bossDeath, 0.6);
    game.audio.play('bossDeath');
    game.ui.announce('Boss defeated!', 'Open the chest it left behind', '#ffd76a');
  }

  damagePlayer(amount) {
    const game = this.game;
    const player = game.player;
    if (!player.takeDamage(amount)) return;
    game.camera.shake(GameConfig.effects.shake.playerHit, 0.2);
    game.audio.play('playerHurt');
    game.effects.text(player.x, player.y - 90, `-${amount}`, '#ff5a5a', 30);
    game.effects.burst(player.x, player.y - 20, '#ff5a5a', 6, 200, 6, 0.35);
    if (player.health <= 0) game.endRun();
  }
}
