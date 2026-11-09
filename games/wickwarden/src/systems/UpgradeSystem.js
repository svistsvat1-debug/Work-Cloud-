// Builds the 3 level-up choices and applies the chosen one.
// All upgrade logic lives here, reading data from config/Weapons.js and config/Passives.js.

import { GameConfig } from '../config/GameConfig.js';
import { WEAPONS, getBaseWeaponIds } from '../config/Weapons.js';
import { PASSIVES } from '../config/Passives.js';
import { takeWeighted } from '../core/MathUtils.js';

const CFG = GameConfig.player;

const TAGS = {
  newWeapon: { label: 'NEW WEAPON', color: '#ff9a4a' },
  weaponUpgrade: { label: 'WEAPON', color: '#ffcf6b' },
  newPassive: { label: 'NEW ITEM', color: '#6bd7ff' },
  passiveUpgrade: { label: 'ITEM', color: '#9be7ff' },
  heal: { label: 'BONUS', color: '#7dff9a' },
  coins: { label: 'BONUS', color: '#ffd76a' },
};

export class UpgradeSystem {
  constructor(game) {
    this.game = game;
  }

  get player() {
    return this.game.player;
  }

  /** True if the player owns this weapon or the evolution made from it. */
  ownsWeaponFamily(id) {
    return this.player.weapons.some((w) => w.id === id || w.def.evolvedFrom === id);
  }

  upgradableWeapons() {
    return this.player.weapons.filter((w) => !w.def.evolution && w.level < w.def.maxLevel);
  }

  upgradablePassives() {
    return this.player.passives.filter((p) => p.level < PASSIVES[p.id].maxLevel);
  }

  buildChoices(count = 3) {
    const player = this.player;
    const pool = [];

    for (const w of this.upgradableWeapons()) pool.push({ kind: 'weaponUpgrade', id: w.id, weight: 1.2 });
    if (player.weapons.length < CFG.maxWeapons) {
      for (const id of getBaseWeaponIds()) {
        if (!this.ownsWeaponFamily(id)) pool.push({ kind: 'newWeapon', id, weight: 1 });
      }
    }
    for (const p of this.upgradablePassives()) pool.push({ kind: 'passiveUpgrade', id: p.id, weight: 1 });
    if (player.passives.length < CFG.maxPassives) {
      for (const id of Object.keys(PASSIVES)) {
        if (!player.getPassive(id)) pool.push({ kind: 'newPassive', id, weight: 0.9 });
      }
    }

    const choices = [];
    while (choices.length < count && pool.length > 0) choices.push(this.describe(takeWeighted(pool)));

    // Everything maxed? Offer healing and gold instead of an empty menu.
    for (const kind of ['heal', 'coins']) {
      if (choices.length < count) choices.push(this.describe({ kind }));
    }
    return choices;
  }

  /** Turns a raw choice into everything the UI needs to show. */
  describe(entry) {
    const { kind, id } = entry;
    const tag = TAGS[kind];
    const base = { kind, id, tag: tag.label, tagColor: tag.color };

    if (kind === 'newWeapon' || kind === 'weaponUpgrade') {
      const def = WEAPONS[id];
      const owned = this.player.getWeapon(id);
      const level = owned ? owned.level : 0;
      return {
        ...base,
        name: def.name,
        icon: def.icon,
        levelText: owned ? `Lv ${level} → ${level + 1}${level + 1 === def.maxLevel ? ' (MAX)' : ''}` : 'NEW!',
        description: owned ? def.levels[level - 1].text : def.description,
      };
    }
    if (kind === 'newPassive' || kind === 'passiveUpgrade') {
      const def = PASSIVES[id];
      const owned = this.player.getPassive(id);
      const level = owned ? owned.level : 0;
      return {
        ...base,
        name: def.name,
        icon: def.icon,
        levelText: owned ? `Lv ${level} → ${level + 1}${level + 1 === def.maxLevel ? ' (MAX)' : ''}` : 'NEW!',
        description: def.description,
      };
    }
    if (kind === 'heal') {
      return { ...base, name: 'Warm Supper', icon: 'heart', levelText: 'Instant', description: `Restore ${CFG.healOnLevelUpFallback} HP.` };
    }
    return { ...base, name: 'Gold Pouch', icon: 'coin', levelText: 'Instant', description: `+${CFG.coinsFallback} gold for the shop.` };
  }

  apply(choice) {
    const game = this.game;
    const player = this.player;
    switch (choice.kind) {
      case 'newWeapon':
        player.weapons.push(game.weapons.createWeapon(choice.id));
        break;
      case 'weaponUpgrade':
        game.weapons.levelUp(player.getWeapon(choice.id));
        break;
      case 'newPassive':
        player.passives.push({ id: choice.id, level: 1 });
        player.recalculateStats();
        break;
      case 'passiveUpgrade':
        player.getPassive(choice.id).level += 1;
        player.recalculateStats();
        break;
      case 'heal':
        player.heal(CFG.healOnLevelUpFallback);
        break;
      case 'coins':
        game.run.coins += CFG.coinsFallback;
        break;
      default:
        break;
    }
  }
}
