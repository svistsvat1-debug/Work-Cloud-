/**
 * UpgradeSystem decides what the level-up menu offers and applies the choice.
 * All upgrades are described in UpgradeDefinitions.js; this file has no
 * upgrade-specific code, so adding upgrades never requires changes here.
 */
class UpgradeSystem {
  constructor(game) {
    this.game = game;
  }

  /** Up to `count` different upgrades the player can take right now, picked at random. */
  rollChoices(count) {
    const player = this.game.player;
    const pool = Object.keys(UpgradeDefinitions).filter((id) => this.isAvailable(id, player));
    const choices = [];
    while (choices.length < count && pool.length > 0) {
      const id = MathUtils.pickWeighted(pool, (upgradeId) => UpgradeDefinitions[upgradeId].weight);
      pool.splice(pool.indexOf(id), 1); // never show the same upgrade twice
      choices.push(this.describe(id, player));
    }
    return choices;
  }

  isAvailable(id, player) {
    const upgrade = UpgradeDefinitions[id];
    if (upgrade.instant) return player.currentHealth < player.maxHealth; // healing at full HP is useless
    return player.getUpgradeLevel(id) < upgrade.maxLevel;
  }

  /** Everything the menu needs to draw one card. */
  describe(id, player) {
    const upgrade = UpgradeDefinitions[id];
    if (upgrade.instant) {
      return {
        id,
        upgrade,
        name: upgrade.name,
        levelText: 'Instant',
        description: upgrade.description,
        effectText: `+${Math.round(player.maxHealth * upgrade.instant.healFraction)} HP`,
      };
    }

    const level = player.getUpgradeLevel(id);
    const total = (atLevel) => this.formatValue(upgrade, upgrade.perLevel * atLevel);
    return {
      id,
      upgrade,
      name: upgrade.name,
      isNew: level === 0,
      levelText: level === 0 ? 'NEW!' : `Lv ${level} → ${level + 1}`,
      description: upgrade.description,
      effectText: level === 0 ? total(1) : `${total(level)} → ${total(level + 1)}`,
    };
  }

  formatValue(upgrade, value) {
    if (upgrade.format === 'percent') return `+${Math.round(value * 100)}%`;
    return `+${Math.round(value)}`;
  }

  apply(choice) {
    const player = this.game.player;
    const upgrade = choice.upgrade;
    if (upgrade.instant) {
      player.heal(player.maxHealth * upgrade.instant.healFraction);
      return;
    }
    player.upgradeLevels[choice.id] = player.getUpgradeLevel(choice.id) + 1;
    player.recalculateStats();
  }
}
