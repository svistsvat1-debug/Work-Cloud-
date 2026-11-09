/**
 * WaveDefinitions: the timeline of a run. The survival timer picks the wave.
 *
 *   start           second the wave begins
 *   name / message  shown in the banner when the wave starts
 *   spawnsPerSecond how many enemies appear per second (on average)
 *   weights         which enemy types appear and how often (higher = more)
 *
 * After the last wave the game keeps getting harder on its own
 * (see GameConfig.difficulty). Elites have their own timer (GameConfig.elites).
 */
const WaveDefinitions = [
  {
    start: 0,
    name: 'First Silence',
    message: 'Hushlings seep out of the dark',
    spawnsPerSecond: 1.1,
    weights: { slime: 1 },
  },
  {
    start: 60,
    name: 'Muted Wings',
    message: 'Mutewings join the hunt',
    spawnsPerSecond: 1.6,
    weights: { slime: 3, bat: 1 },
  },
  {
    start: 120,
    name: 'The Gloaming',
    message: 'Gloamcrawlers scuttle out of the fog',
    spawnsPerSecond: 2.2,
    weights: { slime: 2, bat: 2, crawler: 1.5 },
  },
  {
    start: 180,
    name: 'Rising Hush',
    message: 'The silence grows stronger',
    spawnsPerSecond: 3.0,
    weights: { slime: 2, bat: 2, crawler: 2 },
  },
  {
    start: 240,
    name: 'Iron Muzzles',
    message: 'Muzzled Brutes have arrived',
    spawnsPerSecond: 3.4,
    weights: { slime: 2, bat: 1.5, crawler: 2, brute: 0.8 },
  },
  {
    start: 300,
    name: 'The Long Night',
    message: 'Ring on for as long as you can',
    spawnsPerSecond: 4.0,
    weights: { slime: 2, bat: 2, crawler: 2, brute: 1 },
  },
];
