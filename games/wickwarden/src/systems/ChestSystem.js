// Decides and applies treasure chest rewards, including weapon evolutions.
// Evolutions are read from the EVOLUTIONS list — no per-weapon special code.

import { GameConfig } from '../config/GameConfig.js';
import { WEAPONS, EVOLUTIONS } from '../config/Weapons.js';
import { PASSIVES } from '../config/Passives.js';
import { randomChoice, randomInt, takeWeighted } from '../core/MathUtils.js';

const CFG = GameConfig.chest;

export class ChestSystem {
  constructor(game) {
    this.game = game;
  }

  /** Evolutions whose conditions are met: weapon at max level + required passive owned. */
  findEvolutions() {
    const player = this.game.player;
    return EVOLUTIONS.filter((evo) => {
      const weapon = player.getWeapon(evo.weapon);
      return weapon && weapon.level >= weapon.def.maxLevel && player.getPassive(evo.passive);
    });
  }

  /** Opens a chest: applies rewards right away and returns what the chest screen shows. */
  open() {
    const rewards = [];
    const evolutions = this.findEvolutions();
    const isEvolution = evolutions.length > 0;

    if (isEvolution) rewards.push(this.evolve(randomChoice(evolutions)));
    else rewards.push(this.rollReward());

    const luck = this.game.player.stats.luck;
    if (Math.random() < CFG.bonusRewardChance + luck * 0.5) {
      const bonus = this.rollReward();
      bonus.bonus = true;
      rewards.push(bonus);
    }

    return { rewards, isEvolution, timer: 0, revealed: false };
  }

  evolve(evo) {
    const game = this.game;
    const player = game.player;
    const index = player.weapons.findIndex((w) => w.id === evo.weapon);
    const oldDef = WEAPONS[evo.weapon];
    const evolved = game.weapons.createWeapon(evo.result);
    evolved.timer = 0.2;
    player.weapons[index] = evolved;
    game.run.evolutions.push(evolved.def.name);
    return {
      type: 'evolution',
      title: 'WEAPON EVOLVED!',
      name: evolved.def.name,
      detail: `${oldDef.name} + ${PASSIVES[evo.passive].name}`,
      description: evolved.def.description,
      icon: evolved.def.icon,
      color: '#ffd76a',
    };
  }

  rollReward() {
    const game = this.game;
    const player = game.player;
    const upgrades = game.upgrades;
    const options = [];
    if (upgrades.upgradableWeapons().length) options.push({ type: 'weapon', weight: 40 });
    if (upgrades.upgradablePassives().length) options.push({ type: 'passive', weight: 30 });
    options.push({ type: 'coins', weight: 15 + player.stats.luck * 20 });
    if (player.health < player.stats.maxHealth) options.push({ type: 'heal', weight: 15 });

    const pick = takeWeighted(options).type;

    if (pick === 'weapon') {
      const weapon = randomChoice(upgrades.upgradableWeapons());
      game.weapons.levelUp(weapon);
      return { type: 'weapon', title: 'Weapon upgrade', name: weapon.def.name, detail: `Lv ${weapon.level - 1} → ${weapon.level}`, icon: weapon.def.icon, color: '#ffcf6b' };
    }
    if (pick === 'passive') {
      const passive = randomChoice(upgrades.upgradablePassives());
      passive.level += 1;
      player.recalculateStats();
      const def = PASSIVES[passive.id];
      return { type: 'passive', title: 'Item upgrade', name: def.name, detail: `Lv ${passive.level - 1} → ${passive.level}`, icon: def.icon, color: '#9be7ff' };
    }
    if (pick === 'heal') {
      const healed = Math.round(player.heal(CFG.healReward));
      return { type: 'heal', title: 'Healing', name: 'Warm Light', detail: `+${healed} HP`, icon: 'heart', color: '#7dff9a' };
    }
    const amount = Math.round(randomInt(CFG.coinReward[0], CFG.coinReward[1]) * (1 + player.stats.luck));
    game.run.coins += amount;
    return { type: 'coins', title: 'Gold', name: 'Gold Hoard', detail: `+${amount} gold`, icon: 'coin', color: '#ffd76a' };
  }
}
