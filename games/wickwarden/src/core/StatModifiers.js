// Helpers for adding up stat bonuses from passives and permanent upgrades.
// A "modifier" object is a flat bag of numbers, e.g. { damageMult: 0.1, maxHealth: 20 }.

export function emptyModifiers() {
  return { maxHealth: 0, damageMult: 0, cooldownMult: 0, speedMult: 0, magnetMult: 0, xpMult: 0, luck: 0, startCoins: 0 };
}

/** target += perLevel * times (for every stat in perLevel). */
export function addModifiers(target, perLevel, times = 1) {
  for (const stat in perLevel) {
    target[stat] = (target[stat] || 0) + perLevel[stat] * times;
  }
  return target;
}

/** stats = base + sum of the bonus tables for levels 2..level. Used by weapons. */
export function statsForLevel(base, levels, level) {
  const stats = { ...base };
  for (let i = 0; i < level - 1 && i < levels.length; i++) {
    for (const stat in levels[i]) {
      if (stat === 'text') continue;
      stats[stat] = (stats[stat] || 0) + levels[i][stat];
    }
  }
  return stats;
}
