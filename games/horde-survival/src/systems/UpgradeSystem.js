/**
 * UpgradeSystem decides what the level-up menu offers and applies the choice.
 *
 * Possible choices ("options"):
 *   newWeapon    a weapon the player doesn't have yet (needs a free slot)
 *   weaponLevel  +1 level for an owned weapon (not offered at max level)
 *   stat         a stat upgrade from UpgradeDefinitions
 *
 * Weapons and upgrades are described in data files; nothing here is specific
 * to one weapon or upgrade, so adding new ones never requires changes here.
 */
class UpgradeSystem {
  constructor(game) {
    this.game = game;
  }

  /** Up to `count` different options, picked at random (weight = how likely). */
  rollChoices(count) {
    const pool = [...this.weaponOptions(), ...this.statOptions()];
    const choices = [];
    while (choices.length < count && pool.length > 0) {
      const option = MathUtils.pickWeighted(pool, (candidate) => candidate.weight);
      pool.splice(pool.indexOf(option), 1); // never show the same option twice
      choices.push(option);
    }
    return choices;
  }

  apply(choice) {
    const weapons = this.game.weapons;
    if (choice.kind === 'newWeapon') weapons.addWeapon(choice.id);
    else if (choice.kind === 'weaponLevel') weapons.getWeapon(choice.id).levelUp();
    else if (choice.kind === 'stat') this.applyStatUpgrade(choice.id);
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
      levelText: nextLevel === weapon.maxLevel ? `Lv ${weapon.level} → MAX` : `Lv ${weapon.level} → ${nextLevel}`,
      description: definition.description,
      effectText: bonusText,
      weight: definition.weight * GameConfig.weapons.ownedUpgradeWeight,
    };
  }

  // ---------------------------------------------------------------- Stat upgrades

  statOptions() {
    const player = this.game.player;
    return Object.keys(UpgradeDefinitions)
      .filter((id) => this.isStatUpgradeAvailable(id, player))
      .map((id) => this.describeStatUpgrade(id, player));
  }

  isStatUpgradeAvailable(id, player) {
    const upgrade = UpgradeDefinitions[id];
    if (upgrade.instant) return player.currentHealth < player.maxHealth; // healing at full HP is useless
    return player.getUpgradeLevel(id) < upgrade.maxLevel;
  }

  describeStatUpgrade(id, player) {
    const upgrade = UpgradeDefinitions[id];
    const option = {
      kind: 'stat',
      id,
      tag: 'UPGRADE',
      name: upgrade.name,
      icon: upgrade.icon,
      description: upgrade.description,
      weight: upgrade.weight,
    };
    if (upgrade.instant) {
      option.levelText = 'Instant';
      option.effectText = `+${Math.round(player.maxHealth * upgrade.instant.healFraction)} HP`;
      return option;
    }
    const level = player.getUpgradeLevel(id);
    const total = (atLevel) => this.formatValue(upgrade, upgrade.perLevel * atLevel);
    option.isNew = level === 0;
    option.levelText = level === 0 ? 'NEW!' : `Lv ${level} → ${level + 1}`;
    option.effectText = level === 0 ? total(1) : `${total(level)} → ${total(level + 1)}`;
    return option;
  }

  formatValue(upgrade, value) {
    if (upgrade.format === 'percent') return `+${Math.round(value * 100)}%`;
    return `+${Math.round(value)}`;
  }

  applyStatUpgrade(id) {
    const player = this.game.player;
    const upgrade = UpgradeDefinitions[id];
    if (upgrade.instant) {
      player.heal(player.maxHealth * upgrade.instant.healFraction);
      return;
    }
    player.upgradeLevels[id] = player.getUpgradeLevel(id) + 1;
    player.recalculateStats();
  }
}
