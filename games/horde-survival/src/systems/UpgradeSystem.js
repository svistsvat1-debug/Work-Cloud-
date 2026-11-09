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
 * Treasure chests (openChest) use the same items: several upgrades at once.
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
      if (definition.isEvolution) continue; // evolved weapons only come from chests
      const owned = weapons.getWeapon(id);
      if (owned && !owned.isMaxLevel()) options.push(this.describeWeaponLevel(owned));
      if (!weapons.ownsOrEvolved(id) && weapons.hasFreeSlot()) options.push(this.describeNewWeapon(id, definition));
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

  // ---------------------------------------------------------------- Treasure chests

  /**
   * Rolls and applies the rewards of one treasure chest. A chest is better
   * than a level-up: 1-3 item upgrades at once, always coins, sometimes healing.
   * Returns the list of rewards for the chest screen to show.
   */
  openChest() {
    const config = GameConfig.chests;
    const player = this.game.player;
    const rewards = [];

    // An evolution is the best possible reward: if one is ready, it IS the item reward.
    const evolution = this.pickEvolution();
    let itemCount = 0;
    if (evolution) {
      rewards.push(this.evolve(evolution));
    } else {
      // 1 item upgrade, plus a chance for a 2nd and then a 3rd (luck helps).
      itemCount = 1;
      for (const chance of config.extraRewardChances) {
        if (Math.random() >= chance + player.stats.luck) break;
        itemCount += 1;
      }
    }

    // (Item upgrades below are skipped when the chest gave an evolution.)
    const chosenItems = new Set();
    for (let i = 0; i < itemCount; i++) {
      // Different items when possible; never an item that is already maxed.
      let candidates = this.upgradableItems().filter((item) => !chosenItems.has(item.id));
      if (candidates.length === 0) candidates = this.upgradableItems();
      if (candidates.length === 0) break;
      const item = MathUtils.randomItem(candidates);
      chosenItems.add(item.id);
      rewards.push(this.giveItemLevel(item));
    }

    return this.addChestExtras(rewards);
  }

  /** Coins always; healing when hurt or when nothing could be upgraded. */
  addChestExtras(rewards) {
    const config = GameConfig.chests;
    const player = this.game.player;
    const gotItems = rewards.length > 0;

    const minutes = this.game.survivalTime / 60;
    let coins = MathUtils.randomInt(config.coins.min, config.coins.max) + Math.floor(minutes * config.coins.perMinute);
    if (!gotItems) coins += config.fallbackCoins;
    this.game.addCoins(coins);
    rewards.push({ kind: 'coins', icon: 'iconCoins', title: 'COINS', name: 'A pile of coins', effect: `+${coins}`, color: '#ffd166' });

    if (player.currentHealth < player.maxHealth * config.healBelowFraction || !gotItems) {
      const amount = Math.round(player.maxHealth * config.healFraction);
      player.heal(amount);
      rewards.push({ kind: 'heal', icon: 'iconHeal', title: 'HEAL', name: 'Healing light', effect: `+${amount} HP`, color: '#7ee08a' });
    }
    return rewards;
  }

  // ---------------------------------------------------------------- Evolutions

  /** Evolutions the player qualifies for right now (rules in EvolutionDefinitions.js). */
  availableEvolutions() {
    const { weapons, player } = this.game;
    return EvolutionDefinitions.filter((evolution) => {
      const weapon = weapons.getWeapon(evolution.weapon);
      return weapon && weapon.isMaxLevel() && player.getPassiveLevel(evolution.passive) > 0;
    });
  }

  /** One random evolution out of the possible ones (or null). */
  pickEvolution() {
    const possible = this.availableEvolutions();
    return possible.length > 0 ? MathUtils.randomItem(possible) : null;
  }

  evolve(evolution) {
    const before = this.game.weapons.getWeapon(evolution.weapon);
    const after = this.game.weapons.evolve(evolution.weapon, evolution.result);
    this.game.weaponsEvolved.push(after.name);
    return {
      kind: 'evolution',
      icon: after.definition.icon,
      fromIcon: before.definition.icon,
      title: 'EVOLVED!',
      name: after.name,
      fromName: before.name,
      effect: after.definition.tagline,
      color: '#ff9cf0',
    };
  }

  /** Owned weapons and passives that can still level up. */
  upgradableItems() {
    const items = [];
    for (const weapon of this.game.weapons.weapons) {
      if (!weapon.isMaxLevel()) items.push({ kind: 'weaponLevel', id: weapon.id });
    }
    const player = this.game.player;
    for (const id of player.ownedPassiveIds()) {
      if (player.getPassiveLevel(id) < GameConfig.passives.maxLevel) items.push({ kind: 'passiveLevel', id });
    }
    return items;
  }

  /** Levels up one item and describes it for the chest screen. */
  giveItemLevel(item) {
    if (item.kind === 'weaponLevel') {
      const weapon = this.game.weapons.getWeapon(item.id);
      const before = weapon.level;
      weapon.levelUp();
      return {
        kind: item.kind,
        icon: weapon.definition.icon,
        title: 'WEAPON UP',
        name: weapon.name,
        effect: weapon.isMaxLevel() ? `Lv ${before} → MAX` : `Lv ${before} → ${weapon.level}`,
        color: '#ffad5c',
      };
    }
    const player = this.game.player;
    const passive = PassiveDefinitions[item.id];
    const before = player.getPassiveLevel(item.id);
    this.apply({ kind: 'passiveLevel', id: item.id });
    const after = player.getPassiveLevel(item.id);
    return {
      kind: item.kind,
      icon: passive.icon,
      title: 'PASSIVE UP',
      name: passive.name,
      effect: after >= GameConfig.passives.maxLevel ? `Lv ${before} → MAX` : `Lv ${before} → ${after}`,
      color: '#8fd3ff',
    };
  }

  // ---------------------------------------------------------------- Helpers

  levelText(level, maxLevel) {
    return level + 1 >= maxLevel ? `Lv ${level} → MAX` : `Lv ${level} → ${level + 1}`;
  }
}
