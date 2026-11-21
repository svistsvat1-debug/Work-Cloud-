// lapalma-gas: timing (video time = Scribe word start + 0.1 s, see images/lapalma-gas/words.json).
// Voice: Liam, 60 words / 333 chars, speech 22.4 s (2.68 words/s) at 0.1 s + 0.5 s tail -> video 23.0 s (1380 frames). No fitting needed.
export const FPS = 60;
export const VO_AT = 0.1;
export const DURATION = 23.0;
export const T = {
  lava: 0.1, pours: 0.58, toward: 1.02, beach: 1.38, town: 1.7,
  but: 2.42, misses: 2.74,
  so: 3.62, why: 3.94, cant: 4.18, anyone: 4.42, home: 4.98,
  ground: 5.94, starts: 6.42, breathing: 6.66, out: 7.14, carbon: 7.3, dioxide: 7.7,
  its: 8.74, invisible: 8.98, heavier: 9.86, air: 10.42, so2: 10.98, pools: 11.26, garages: 11.7,
  birds: 12.82, cats: 13.3, drop: 13.82, dead: 14.02,
  so3: 14.98, over: 15.46, thousand: 15.94, gas: 16.42, alarms: 16.74, inside: 17.3,
  two: 18.1, years: 18.26, later: 18.66, families: 19.14, walk: 19.66, back: 19.9, inn: 20.14,
  the: 20.74, alarms2: 20.98, still: 21.54, on: 21.94, end: 22.5,
};
