// Passive items: global stat boosts. Each level adds `perLevel` once more.
// Stat names match the modifier object built in StatModifiers.js.

export const PASSIVES = {
  spellbook: {
    id: 'spellbook',
    name: 'Tallow Codex',
    icon: 'book',
    description: 'Weapons recharge 8% faster.',
    maxLevel: 5,
    perLevel: { cooldownMult: -0.08 },
  },
  powerStone: {
    id: 'powerStone',
    name: 'Kindling Stone',
    icon: 'stone',
    description: 'All weapons deal +10% damage.',
    maxLevel: 5,
    perLevel: { damageMult: 0.1 },
  },
  windBoots: {
    id: 'windBoots',
    name: 'Ashwalk Boots',
    icon: 'boots',
    description: 'Move 8% faster.',
    maxLevel: 5,
    perLevel: { speedMult: 0.08 },
  },
  magnetCharm: {
    id: 'magnetCharm',
    name: 'Lodestone Charm',
    icon: 'charm',
    description: 'Pull XP and gold from 25% farther.',
    maxLevel: 5,
    perLevel: { magnetMult: 0.25 },
  },
  ironHeart: {
    id: 'ironHeart',
    name: 'Ironwood Heart',
    icon: 'heart',
    description: '+20 max HP.',
    maxLevel: 5,
    perLevel: { maxHealth: 20 },
  },
  cloverCoin: {
    id: 'cloverCoin',
    name: 'Lucky Wick',
    icon: 'clover',
    description: '+10% luck: more gold, richer chests.',
    maxLevel: 5,
    perLevel: { luck: 0.1 },
  },
};
