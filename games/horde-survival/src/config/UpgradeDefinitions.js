/**
 * UpgradeDefinitions: everything the level-up menu can offer.
 *
 * To add a new upgrade, add one entry here. No other file needs to change
 * unless the upgrade affects a brand-new player stat.
 *
 * Fields:
 *   name         title on the card
 *   description  what it improves (short!)
 *   stat         which value in player.stats it raises
 *   perLevel     how much each level adds to that stat
 *   format       'percent' shows +20%, 'flat' shows +20
 *   maxLevel     after this level it is no longer offered
 *   weight       how often it shows up (1 = normal)
 *   icon         sprite key of its icon
 * Instant upgrades (like healing) use `instant` instead of `stat`, have no level
 * and can be picked again and again.
 */
const UpgradeDefinitions = {
  damage: {
    name: 'Arcane Power',
    description: 'Weapon damage',
    stat: 'damageMultiplier',
    perLevel: 0.2,
    format: 'percent',
    maxLevel: 5,
    weight: 1,
    icon: 'iconDamage',
  },
  fireRate: {
    name: 'Quick Casting',
    description: 'Fire rate',
    stat: 'fireRateMultiplier',
    perLevel: 0.15,
    format: 'percent',
    maxLevel: 5,
    weight: 1,
    icon: 'iconFireRate',
  },
  projectileSpeed: {
    name: 'Swift Bolts',
    description: 'Projectile speed',
    stat: 'projectileSpeedMultiplier',
    perLevel: 0.2,
    format: 'percent',
    maxLevel: 5,
    weight: 0.8,
    icon: 'iconProjectileSpeed',
  },
  moveSpeed: {
    name: 'Light Boots',
    description: 'Movement speed',
    stat: 'moveSpeedMultiplier',
    perLevel: 0.08,
    format: 'percent',
    maxLevel: 5,
    weight: 1,
    icon: 'iconMoveSpeed',
  },
  maxHealth: {
    name: 'Vitality',
    description: 'Max HP (also heals that much)',
    stat: 'maxHealthBonus',
    perLevel: 20,
    format: 'flat',
    maxLevel: 5,
    weight: 1,
    icon: 'iconMaxHealth',
  },
  magnet: {
    name: 'Magnet',
    description: 'XP pickup range',
    stat: 'magnetMultiplier',
    perLevel: 0.3,
    format: 'percent',
    maxLevel: 5,
    weight: 0.8,
    icon: 'iconMagnet',
  },
  heal: {
    name: 'Healing Draught',
    description: 'Restore 30% of max HP right now',
    instant: { healFraction: 0.3 },
    weight: 0.7,
    icon: 'iconHeal',
  },
};
