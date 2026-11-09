// Data-driven weapon definitions.
//
// Each weapon has:
//   behavior  — which function in WeaponSystem runs it ('projectile' | 'orbit' | 'pulse' | 'strike')
//   base      — stats at level 1
//   levels    — the bonus added at level 2, 3, ... 8 (so maxLevel = levels.length + 1)
//
// Evolved weapons are normal weapon entries with `evolution: true` and no levels.
// The recipe that creates them lives in EVOLUTIONS below — WeaponSystem/ChestSystem
// read that list, so adding a new evolution never needs new code.

export const WEAPONS = {
  arcaneBolt: {
    id: 'arcaneBolt',
    name: 'Ember Shot',
    behavior: 'projectile',
    icon: 'bolt',
    description: 'Fires embers at the nearest enemy.',
    base: { damage: 13, cooldown: 0.6, speed: 950, pierce: 1, amount: 1, size: 16, knockback: 240, range: 1150, spread: 0.14 },
    levels: [
      { amount: 1, text: '+1 ember per volley' },
      { damage: 5, text: '+5 damage' },
      { cooldown: -0.1, text: 'Fires 0.1s faster' },
      { pierce: 1, text: 'Embers pierce +1 enemy' },
      { amount: 1, speed: 150, text: '+1 ember, faster embers' },
      { damage: 6, text: '+6 damage' },
      { pierce: 1, cooldown: -0.08, text: 'Pierce +1, fires faster' },
    ],
  },

  orbitBlade: {
    id: 'orbitBlade',
    name: 'Ward Knives',
    behavior: 'orbit',
    icon: 'blade',
    description: 'Knives circle you and cut anything they touch.',
    base: { damage: 9, amount: 1, orbitRadius: 140, size: 28, rotationSpeed: 3.2, hitInterval: 0.5, knockback: 200 },
    levels: [
      { amount: 1, text: '+1 knife' },
      { damage: 4, text: '+4 damage' },
      { size: 8, orbitRadius: 15, text: 'Bigger knives, wider orbit' },
      { amount: 1, text: '+1 knife' },
      { rotationSpeed: 0.8, damage: 4, text: 'Spins faster, +4 damage' },
      { amount: 1, text: '+1 knife' },
      { damage: 6, size: 8, text: '+6 damage, bigger knives' },
    ],
  },

  holyPulse: {
    id: 'holyPulse',
    name: 'Lantern Pulse',
    behavior: 'pulse',
    icon: 'pulse',
    description: 'Your lantern flares, burning everything nearby.',
    base: { damage: 14, cooldown: 3.0, radius: 210, knockback: 430, effectDuration: 0.45 },
    levels: [
      { radius: 35, text: '+35 radius' },
      { damage: 7, text: '+7 damage' },
      { cooldown: -0.35, text: 'Pulses 0.35s faster' },
      { radius: 35, text: '+35 radius' },
      { damage: 8, text: '+8 damage' },
      { cooldown: -0.35, text: 'Pulses 0.35s faster' },
      { radius: 40, damage: 10, text: '+40 radius, +10 damage' },
    ],
  },

  lightningMark: {
    id: 'lightningMark',
    name: 'Storm Brand',
    behavior: 'strike',
    icon: 'mark',
    description: 'Brands random enemies, then calls lightning on them.',
    base: { damage: 24, cooldown: 2.4, amount: 2, area: 70, delay: 0.35 },
    levels: [
      { amount: 1, text: '+1 strike' },
      { damage: 10, text: '+10 damage' },
      { cooldown: -0.3, text: 'Strikes 0.3s faster' },
      { amount: 1, text: '+1 strike' },
      { area: 20, damage: 8, text: 'Bigger blast, +8 damage' },
      { amount: 1, text: '+1 strike' },
      { cooldown: -0.3, damage: 10, text: 'Faster, +10 damage' },
    ],
  },

  // ---------- Evolutions ----------

  arcaneStorm: {
    id: 'arcaneStorm',
    name: 'Ember Tempest',
    behavior: 'projectile',
    icon: 'tempest',
    evolution: true,
    description: 'A white-hot storm of piercing embers.',
    base: { damage: 26, cooldown: 0.28, speed: 1250, pierce: 5, amount: 4, size: 22, knockback: 300, range: 1300, spread: 0.16 },
    levels: [],
  },

  celestialBlades: {
    id: 'celestialBlades',
    name: 'Sunwheel',
    behavior: 'orbit',
    icon: 'sunblade',
    evolution: true,
    description: 'A wheel of burning blades guards you.',
    base: { damage: 30, amount: 7, orbitRadius: 190, size: 44, rotationSpeed: 4.0, hitInterval: 0.35, knockback: 320 },
    levels: [],
  },

  divineNova: {
    id: 'divineNova',
    name: 'Dawnbreak',
    behavior: 'pulse',
    icon: 'nova',
    evolution: true,
    description: 'A sunrise bursts from you and mends your wounds.',
    base: { damage: 42, cooldown: 2.2, radius: 430, knockback: 540, effectDuration: 0.95, healPerHit: 0.5, maxHealPerPulse: 8 },
    levels: [],
  },

  thunderCrown: {
    id: 'thunderCrown',
    name: 'Stormcrown',
    behavior: 'strike',
    icon: 'crown',
    evolution: true,
    description: 'Lightning rains down and leaps between enemies.',
    base: { damage: 55, cooldown: 1.4, amount: 7, area: 110, delay: 0.25, chainChance: 0.6, chainCount: 3, chainRange: 280 },
    levels: [],
  },
};

// weapon (at max level) + passive (any level) + chest  =>  evolved weapon
export const EVOLUTIONS = [
  { weapon: 'arcaneBolt', passive: 'spellbook', result: 'arcaneStorm' },
  { weapon: 'orbitBlade', passive: 'powerStone', result: 'celestialBlades' },
  { weapon: 'holyPulse', passive: 'ironHeart', result: 'divineNova' },
  { weapon: 'lightningMark', passive: 'cloverCoin', result: 'thunderCrown' },
];

export const STARTING_WEAPON = 'arcaneBolt';

// Fill in derived fields once, so the rest of the code can rely on them.
for (const def of Object.values(WEAPONS)) {
  def.maxLevel = def.levels.length + 1;
}
for (const evo of EVOLUTIONS) {
  WEAPONS[evo.result].evolvedFrom = evo.weapon;
  WEAPONS[evo.result].requiresPassive = evo.passive;
}

export function getBaseWeaponIds() {
  return Object.values(WEAPONS)
    .filter((def) => !def.evolution)
    .map((def) => def.id);
}
