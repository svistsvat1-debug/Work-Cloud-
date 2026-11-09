/**
 * UpgradeSystem: all "what can the player get, and what does it do" logic.
 *
 * Level-up options:
 *   newWeapon     a weapon the player doesn't have yet (needs a free weapon slot)
 *   weaponLevel   +1 level for an owned weapon (never offered at max level)
 *   newPassive    a passive item the player doesn't have yet (needs a free slot)
 *   passiveLevel  +1 level for an owned passive (never offered at max level)
 *   fallback      healing or coins, only when there isn't enough else to offer
 *
 * Weapons, passives and fallbacks are described in data files. Nothing here is
 * specific to one item, so adding new items never requires changes here.
 */
class UpgradeSystem {
  constructor(game) {
    this.game = game;
  }

  /** `count` different options, picked at random (weight = how likely). */
  rollChoices(count) {
    const pool = [...this.weaponOptions(), ...this.passiveOptions()];
    const choices = [];
    while (choices.length < count && pool.length > 0) {
      const option = MathUtils.pickWeighted(pool, (candidate) => candidate.weight);
      pool.splice(pool.indexOf(option), 1); // never show the same option twice
      choices.push(option);
    }

    // Not enough real upgrades left (everything maxed)? Fill up with fallbacks.
    for (const id of Object.keys(FallbackRewards)) {
      if (choices.length >= count) break;
      choices.push(this.describeFallback(id));
    }
    return choices;
  }

  apply(choice) {
    const { weapons, player } = this.game;
    switch (choice.kind) {
      case 'newWeapon':
        weapons.addWeapon(choice.id);
        break;
      case 'weaponLevel':
        weapons.getWeapon(choice.id).levelUp();
        break;
      case 'newPassive':
      case 'passiveLevel':
        player.passiveLevels[choice.id] = player.getPassiveLevel(choice.id) + 1;
        player.recalculateStats();
        break;
      case 'fallback':
        this.giveFallback(choice.id);
        break;
    }
  }

  // ---------------------------------------------------------------- Weapons

  weaponOptions() {
    const weapons = this.game.weapons;
    const options = [];
    for (const [id, definition] of Object.entries(WeaponDefinitions)) {
      const owned = weapons.getWeapon(id);
      if (owned && !owned.isMaxLevel()) options.push(this.describeWeaponLevel(owned));
      if (!owned && weapons.hasFreeSlot()) options.push(this.describeNewWeapon(id, definition));
    }
    return options;
  }

  describeNewWeapon(id, definition) {
    return {
      kind: 'newWeapon',
      id,
      tag: 'WEAPON',
      name: definition.name,
      icon: definition.icon,
      isNew: true,
      levelText: 'NEW WEAPON!',
      description: definition.description,
      effectText: definition.tagline,
      weight: definition.weight,
    };
  }

  describeWeaponLevel(weapon) {
    const definition = weapon.definition;
    const nextLevel = weapon.level + 1;
    const bonus = definition.levels[weapon.level - 1]; // levels[0] is level 2
    const bonusText = Object.entries(bonus)
      .map(([stat, value]) => WeaponStatText[stat](value, definition))
      .join(', ');
    return {
      kind: 'weaponLevel',
      id: weapon.id,
      tag: 'WEAPON',
      name: definition.name,
      icon: definition.icon,
      isNew: false,
      levelText: this.levelText(weapon.level, weapon.maxLevel),
      description: definition.description,
      effectText: bonusText,
      weight: definition.weight * GameConfig.weapons.ownedUpgradeWeight,
    };
  }

  // ---------------------------------------------------------------- Passives

  passiveOptions() {
    const player = this.game.player;
    const config = GameConfig.passives;
    const hasFreeSlot = player.ownedPassiveIds().length < config.maxSlots;
    const options = [];
    for (const [id, passive] of Object.entries(PassiveDefinitions)) {
      const level = player.getPassiveLevel(id);
      if (level >= config.maxLevel) continue; // maxed out: never offered
      if (level === 0 && !hasFreeSlot) continue; // no room for a new passive
      options.push(this.describePassive(id, passive, level));
    }
    return options;
  }

  describePassive(id, passive, level) {
    const total = (atLevel) => this.formatPassiveNumber(passive, passive.perLevel * atLevel);
    return {
      kind: level === 0 ? 'newPassive' : 'passiveLevel',
      id,
      tag: 'PASSIVE',
      name: passive.name,
      icon: passive.icon,
      isNew: level === 0,
      levelText: level === 0 ? 'NEW!' : this.levelText(level, GameConfig.passives.maxLevel),
      description: passive.description,
      effectText: level === 0 ? `${total(1)} ${passive.label}` : `${total(level)} → ${total(level + 1)} ${passive.label}`,
      weight: passive.weight * (level > 0 ? GameConfig.passives.ownedUpgradeWeight : 1),
    };
  }

  /** e.g. 0.16 -> "−16%", 40 -> "+40" (the label is added by the caller) */
  formatPassiveNumber(passive, value) {
    const number = passive.unit === 'percent' ? `${Math.round(value * 100)}%` : `${Math.round(value)}`;
    return `${passive.sign}${number}`;
  }

  // ---------------------------------------------------------------- Fallbacks

  describeFallback(id) {
    const reward = FallbackRewards[id];
    const player = this.game.player;
    const effectText = reward.healFraction
      ? `+${Math.round(player.maxHealth * reward.healFraction)} HP`
      : `+${reward.coins} coins`;
    return {
      kind: 'fallback',
      id,
      tag: 'REWARD',
      name: reward.name,
      icon: reward.icon,
      isNew: false,
      levelText: 'Instant',
      description: reward.description,
      effectText,
      weight: 1,
    };
  }

  giveFallback(id) {
    const reward = FallbackRewards[id];
    if (reward.healFraction) this.game.player.heal(this.game.player.maxHealth * reward.healFraction);
    if (reward.coins) this.game.addCoins(reward.coins);
  }

  // ---------------------------------------------------------------- Helpers

  levelText(level, maxLevel) {
    return level + 1 >= maxLevel ? `Lv ${level} → MAX` : `Lv ${level} → ${level + 1}`;
  }
}
