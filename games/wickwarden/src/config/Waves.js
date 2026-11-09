// Time-based wave director data.
// `interval` = seconds between spawn groups at the START of the wave.
// Inside a wave the interval smoothly moves toward the next wave's interval.
// `mix` = relative spawn weights per enemy type.

export const WAVES = [
  { start: 0, name: 'Dusk Falls', interval: 1.2, group: [1, 2], mix: { slime: 1 } },
  { start: 60, name: 'Wings in the Dark', interval: 0.95, group: [1, 2], mix: { slime: 3, bat: 2 } },
  { start: 120, name: 'The Skittering', interval: 0.75, group: [1, 3], mix: { slime: 2, bat: 3, crawler: 3 } },
  { start: 180, name: 'The Swarm Grows', interval: 0.48, group: [2, 3], mix: { slime: 2, bat: 2, crawler: 2 } },
  { start: 240, name: 'Heavy Footsteps', interval: 0.42, group: [2, 4], mix: { slime: 2, bat: 2, crawler: 2, brute: 1 } },
  { start: 300, name: 'Endless Night', interval: 0.36, group: [2, 4], mix: { slime: 2, bat: 2, crawler: 2, brute: 1.2, elite: 0.2 } },
];
