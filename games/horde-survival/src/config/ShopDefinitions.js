/**
 * ShopDefinitions: permanent upgrades bought with coins between runs.
 * They are saved in localStorage and applied at the start of every run.
 *
 *   stat        which bonus in Player.recalculateStats() it raises
 *               ('startingCoins' is handled by Game.startNewRun instead)
 *   perLevel    how much each level adds
 *   unit        'percent' or 'flat' (for the text on the card)
 *   maxLevel    highest level that can be bought
 *   baseCost    price of level 1
 *   costGrowth  each next level costs this much more (1.4 = +40%)
 */
const ShopDefinitions = {
  maxHealth: {
    name: 'Toughness',
    description: '+5 max HP per level',
    stat: 'maxHealthBonus',
    perLevel: 5,
    unit: 'flat',
    maxLevel: 10,
    baseCost: 40,
    costGrowth: 1.35,
    icon: 'iconIronHeart',
  },
  damage: {
    name: 'Training',
    description: '+5% damage per level',
    stat: 'damageBonus',
    perLevel: 0.05,
    unit: 'percent',
    maxLevel: 10,
    baseCost: 60,
    costGrowth: 1.4,
    icon: 'iconPowerStone',
  },
  moveSpeed: {
    name: 'Agility',
    description: '+3% move speed per level',
    stat: 'moveSpeedBonus',
    perLevel: 0.03,
    unit: 'percent',
    maxLevel: 5,
    baseCost: 50,
    costGrowth: 1.4,
    icon: 'iconWindBoots',
  },
  xpGain: {
    name: 'Wisdom',
    description: '+5% XP gain per level',
    stat: 'xpBonus',
    perLevel: 0.05,
    unit: 'percent',
    maxLevel: 10,
    baseCost: 70,
    costGrowth: 1.4,
    icon: 'iconXpGain',
  },
  pickupRange: {
    name: 'Attraction',
    description: '+5% pickup range per level',
    stat: 'magnetBonus',
    perLevel: 0.05,
    unit: 'percent',
    maxLevel: 5,
    baseCost: 40,
    costGrowth: 1.35,
    icon: 'iconMagnetCharm',
  },
  startingCoins: {
    name: 'Lucky Purse',
    description: '+10 coins at the start of every run',
    stat: 'startingCoins',
    perLevel: 10,
    unit: 'flat',
    maxLevel: 5,
    baseCost: 80,
    costGrowth: 1.5,
    icon: 'iconCoins',
  },
};
