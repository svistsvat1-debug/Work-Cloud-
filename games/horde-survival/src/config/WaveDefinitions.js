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
    name: 'The Gathering',
    message: 'Slimes ooze out of the dark',
    spawnsPerSecond: 0.9,
    weights: { slime: 1 },
  },
  {
    start: 60,
    name: 'Wings in the Night',
    message: 'More slimes, and bats join the hunt',
    spawnsPerSecond: 1.4,
    weights: { slime: 3, bat: 1 },
  },
  {
    start: 120,
    name: 'Swift Swarm',
    message: 'Fast hunters are coming',
    spawnsPerSecond: 1.9,
    weights: { slime: 2, bat: 2, crawler: 1.5 },
  },
  {
    start: 180,
    name: 'Rising Tide',
    message: 'The swarm grows stronger',
    spawnsPerSecond: 2.8,
    weights: { slime: 2, bat: 2, crawler: 2 },
  },
  {
    start: 240,
    name: 'Heavy Footsteps',
    message: 'Brutes have arrived',
    spawnsPerSecond: 3.2,
    weights: { slime: 2, bat: 1.5, crawler: 2, brute: 0.8 },
  },
  {
    start: 300,
    name: 'Endless Horde',
    message: 'Survive as long as you can',
    spawnsPerSecond: 3.8,
    weights: { slime: 2, bat: 2, crawler: 2, brute: 1 },
  },
];
