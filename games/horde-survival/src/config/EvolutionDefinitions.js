/**
 * EvolutionDefinitions: which weapon + passive turns into which evolved weapon.
 *
 * A weapon evolves when ALL of these are true:
 *   1. the weapon is at max level (8),
 *   2. the player owns the passive (any level),
 *   3. the player opens a treasure chest.
 * One evolution per chest; if several are possible, one is picked at random.
 *
 * The evolved weapons themselves are normal entries in WeaponDefinitions
 * (with isEvolution: true). To add an evolution: add the evolved weapon there
 * and one line here.
 */
const EvolutionDefinitions = [
  { weapon: 'bolt', passive: 'spellbook', result: 'arcaneStorm' },
  { weapon: 'blade', passive: 'powerStone', result: 'celestialBlades' },
  { weapon: 'pulse', passive: 'ironHeart', result: 'divineNova' },
  { weapon: 'lightning', passive: 'cloverCoin', result: 'thunderCrown' },
];
