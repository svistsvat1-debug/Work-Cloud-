/**
 * EvolutionDefinitions: which weapon + passive turns into which evolved weapon.
 *
 * A weapon evolves when ALL of these are true:
 *   1. the weapon is at max level (8),
 *   2. the player owns the passive (any level),
 *   3. the player opens a treasure chest.
 * One evolution per chest; if several are possible, one is picked at random.
 *
 * Names in the game: Chime Bolt + Metronome = Carillon Storm, Peal Blades +
 * Bronze Clapper = Choir of Blades, Toll Wave + Bronze Heart = Cathedral Toll,
 * Thunder Peal + Wishing Chime = Storm Knell. (The ids below are short
 * internal names; the names players see live in the definition files.)
 *
 * The evolved weapons themselves are normal entries in WeaponDefinitions
 * (with isEvolution: true). To add an evolution: add the evolved weapon there
 * and one line here.
 */
const EvolutionDefinitions = [
  { weapon: 'bolt', passive: 'metronome', result: 'carillonStorm' },
  { weapon: 'blade', passive: 'bronzeClapper', result: 'choirOfBlades' },
  { weapon: 'pulse', passive: 'bronzeHeart', result: 'cathedralToll' },
  { weapon: 'lightning', passive: 'wishingChime', result: 'stormKnell' },
];
