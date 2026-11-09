/**
 * PassiveDefinitions: passive items. They don't attack; they make the player
 * or all weapons better. Each passive has levels 1..maxLevel (GameConfig.passives).
 *
 *   stat      which bonus in Player.recalculateStats() it raises
 *   perLevel  how much each level adds to that bonus
 *   unit      'percent' shows 0.1 as "10%", 'flat' shows the number as is
 *   sign      '+' or '−' in front of the number on the card
 *   label     what the number means, e.g. "damage"
 *   weight    how often it shows up in level-up choices (1 = normal)
 *
 * To add a passive, add an entry here (and an icon in ProceduralSprites).
 * A brand-new stat also needs one line in Player.recalculateStats().
 */
const PassiveDefinitions = {
  metronome: {
    name: 'Metronome',
    description: 'A faster tempo: all weapons recharge sooner.',
    stat: 'cooldownReduction',
    perLevel: 0.08,
    unit: 'percent',
    sign: '−',
    label: 'cooldown',
    weight: 1,
    icon: 'iconMetronome',
  },
  bronzeClapper: {
    name: 'Bronze Clapper',
    description: 'A heavier clapper: all weapons hit harder.',
    stat: 'damageBonus',
    perLevel: 0.1,
    unit: 'percent',
    sign: '+',
    label: 'damage',
    weight: 1,
    icon: 'iconClapper',
  },
  pilgrimBoots: {
    name: 'Pilgrim Boots',
    description: 'Light boots for long roads: move faster.',
    stat: 'moveSpeedBonus',
    perLevel: 0.1,
    unit: 'percent',
    sign: '+',
    label: 'move speed',
    weight: 1,
    icon: 'iconBoots',
  },
  tuningFork: {
    name: 'Tuning Fork',
    description: 'Its hum pulls echo shards (XP) from further away.',
    stat: 'magnetBonus',
    perLevel: 0.25,
    unit: 'percent',
    sign: '+',
    label: 'pickup range',
    weight: 0.9,
    icon: 'iconTuningFork',
  },
  bronzeHeart: {
    name: 'Bronze Heart',
    description: 'More max HP (and heals that much right away).',
    stat: 'maxHealthBonus',
    perLevel: 20,
    unit: 'flat',
    sign: '+',
    label: 'max HP',
    weight: 1,
    icon: 'iconBronzeHeart',
  },
  wishingChime: {
    name: 'Wishing Chime',
    description: 'Luck: better chest rewards and more valuable shards.',
    stat: 'luck',
    perLevel: 0.1,
    unit: 'percent',
    sign: '+',
    label: 'luck',
    weight: 0.8,
    icon: 'iconWishingChime',
  },
};

/**
 * Fallback rewards: offered only when there is not enough else to choose
 * (for example when every weapon and passive is maxed out).
 */
const FallbackRewards = {
  heal: {
    name: 'Healing Draught',
    description: 'Restore part of your max HP.',
    healFraction: 0.3,
    icon: 'iconHeal',
  },
  coins: {
    name: 'Bell Coins',
    description: 'A handful of bell coins.',
    coins: 25,
    icon: 'iconCoins',
  },
};
