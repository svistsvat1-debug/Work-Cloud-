// Permanent upgrades bought with gold between runs (saved in localStorage).
// cost(level) = round(baseCost * costGrowth ^ level)

export const META_UPGRADES = [
  { id: 'maxHealth', name: 'Thick Wax', icon: 'heart', description: '+5 max HP', maxLevel: 10, baseCost: 40, costGrowth: 1.35, perLevel: { maxHealth: 5 } },
  { id: 'damage', name: 'Brighter Flame', icon: 'stone', description: '+5% damage', maxLevel: 10, baseCost: 60, costGrowth: 1.4, perLevel: { damageMult: 0.05 } },
  { id: 'speed', name: 'Quick Step', icon: 'boots', description: '+3% move speed', maxLevel: 5, baseCost: 50, costGrowth: 1.45, perLevel: { speedMult: 0.03 } },
  { id: 'xp', name: 'Wisdom of Ash', icon: 'book', description: '+5% XP gain', maxLevel: 10, baseCost: 55, costGrowth: 1.4, perLevel: { xpMult: 0.05 } },
  { id: 'pickup', name: 'Long Reach', icon: 'charm', description: '+5% pickup range', maxLevel: 10, baseCost: 30, costGrowth: 1.35, perLevel: { magnetMult: 0.05 } },
  { id: 'startCoins', name: 'Old Savings', icon: 'coin', description: 'Start runs with +10 gold', maxLevel: 5, baseCost: 80, costGrowth: 1.5, perLevel: { startCoins: 10 } },
];

export function getMetaCost(upgrade, level) {
  return Math.round(upgrade.baseCost * Math.pow(upgrade.costGrowth, level));
}
