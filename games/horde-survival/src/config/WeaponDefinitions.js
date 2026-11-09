/**
 * WeaponDefinitions: every weapon in the game, described as data.
 *
 *   behavior   which code runs it (see src/weapons/):
 *              'projectile' | 'orbit' | 'pulse' | 'strike'.
 *              Several weapons can share a behavior with different numbers.
 *   base       stats at level 1
 *   levels     what each next level ADDS to the stats:
 *              index 0 = level 2 ... index 6 = level 8 (max level).
 *              A negative cooldown means "attacks faster".
 *   amountName what "amount" counts on the cards (bolt, blade, strike)
 *   evolution  prepared for later: { passive: 'passiveId', into: 'evolvedWeaponId' }
 *
 * To add a weapon: add an entry here (and an icon in ProceduralSprites).
 * A new behavior also needs a class in src/weapons/.
 */
const WeaponDefinitions = {
  bolt: {
    name: 'Arcane Bolt',
    description: 'Fires a magic bolt at the nearest enemy.',
    tagline: 'Strong single-target damage',
    behavior: 'projectile',
    icon: 'iconBolt',
    projectileSprite: 'arcaneBolt',
    amountName: 'bolt',
    weight: 1,
    base: {
      damage: 10,
      cooldown: 0.6,
      amount: 1,
      projectileSpeed: 900,
      pierce: 1, // how many enemies one bolt can hit
      range: 950,
      knockback: 280,
      lifetime: 2,
      projectileRadius: 12,
      projectileDrawSize: 64,
    },
    levels: [
      { damage: 5 },
      { cooldown: -0.08 },
      { projectileSpeed: 200, pierce: 1 },
      { damage: 5 },
      { cooldown: -0.08 },
      { pierce: 1, projectileSpeed: 200 },
      { damage: 10 },
    ],
    evolution: null,
  },

  blade: {
    name: 'Orbiting Blade',
    description: 'Blades circle around you and cut every enemy they touch.',
    tagline: 'Close-range defense',
    behavior: 'orbit',
    icon: 'iconBlade',
    sprite: 'orbitBlade',
    amountName: 'blade',
    weight: 1,
    base: {
      damage: 8,
      amount: 1,
      orbitRadius: 130,
      rotationSpeed: 3, // radians per second
      size: 1, // 1 = normal, 1.25 = 25% bigger blades (they also orbit a bit wider)
      hitCooldown: 0.5, // the same enemy can be hit at most this often
      knockback: 200,
      bladeRadius: 22,
      bladeDrawSize: 76,
    },
    levels: [
      { amount: 1 },
      { damage: 4 },
      { size: 0.25 },
      { amount: 1 },
      { rotationSpeed: 0.75 },
      { damage: 4, size: 0.25 },
      { amount: 1, damage: 6 },
    ],
    evolution: null,
  },

  pulse: {
    name: 'Holy Pulse',
    description: 'Releases a burst of holy light around you every few seconds.',
    tagline: 'Area damage that pushes enemies away',
    behavior: 'pulse',
    icon: 'iconPulse',
    weight: 1,
    base: {
      damage: 14,
      cooldown: 3,
      radius: 220,
      knockback: 420,
      expandTime: 0.35, // how long the ring takes to grow to full size
    },
    levels: [
      { radius: 30 },
      { damage: 6 },
      { cooldown: -0.3 },
      { radius: 30 },
      { damage: 8 },
      { cooldown: -0.4 },
      { radius: 40, damage: 10 },
    ],
    evolution: null,
  },

  lightning: {
    name: 'Lightning Mark',
    description: 'Marks random enemies on screen, then lightning strikes them.',
    tagline: 'Hits anywhere on screen',
    behavior: 'strike',
    icon: 'iconLightning',
    amountName: 'strike',
    weight: 1,
    base: {
      damage: 18,
      cooldown: 2.2,
      amount: 1,
      strikeRadius: 70, // small area around the mark
      markDelay: 0.3, // seconds between the mark appearing and the strike
      knockback: 120,
    },
    levels: [
      { amount: 1 },
      { damage: 8 },
      { cooldown: -0.3 },
      { amount: 1 },
      { damage: 10 },
      { amount: 1, cooldown: -0.3 },
      { amount: 2, damage: 12 },
    ],
    evolution: null,
  },
};

/** How each stat change is written on a level-up card, e.g. { damage: 5 } -> "+5 damage". */
const WeaponStatText = {
  damage: (value) => `+${value} damage`,
  cooldown: (value) => `${value < 0 ? '−' : '+'}${Math.abs(value)}s cooldown`,
  amount: (value, weapon) => `+${value} ${weapon.amountName}${value > 1 ? 's' : ''}`,
  projectileSpeed: (value) => `+${value} speed`,
  pierce: (value) => `+${value} pierce`,
  size: (value) => `+${Math.round(value * 100)}% size`,
  rotationSpeed: (value, weapon) => `+${Math.round((value / weapon.base.rotationSpeed) * 100)}% orbit speed`,
  radius: (value) => `+${value} radius`,
};
