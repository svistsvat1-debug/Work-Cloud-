// megalodon-trench: timing (video time = fitted word start + 0.1 s, see images/megalodon-trench/words.json).
// Voice: Liam, 67 words, raw speech 24.86 s -> fitted to 23.94 s by shortening 5 pauses (silence only, no tempo change).
export const FPS = 60;
export const VO_AT = 0.1;
export const DURATION = 24.6; // speech ends 23.98 s + the ending gag
export const T = {
  the: 0.1, last: 0.42, megalodon: 0.66, dives: 1.3, into: 1.74, mariana: 2.02, trench: 2.5, to: 2.98, hide: 3.14, forever: 3.54,
  nearly: 4.47, seven: 4.75, miles: 5.07, darkness: 5.55, whod: 6.39, ever: 6.59, look: 6.83,
  but: 7.48, three: 7.72, miles2: 7.92, down: 8.24, there: 8.84, no: 9.2, other: 9.44, sharks: 9.68,
  not: 10.6, one: 10.8,
  probably: 11.66, because: 12.06, sharks2: 12.42, giant: 12.86, oily: 13.26, liver: 13.66, its: 14.26, float: 14.46,
  takes: 15.18, lots: 15.42, rich: 15.94, food: 16.14, and: 16.74, only: 16.94, crumbs: 17.26, drift: 17.66, down2: 18.02, here: 18.22,
  so: 18.65, deeper: 18.93, hides: 19.37, hungrier: 20.17, gets: 20.81,
  at: 21.44, bottom: 21.68, dinner: 22.32, is: 22.72, two: 23.08, inches: 23.28, long: 23.68, end: 23.98,
};
export const CUT_B = 4.4; // hard cut: inside the trench ("Nearly seven miles of darkness")
export const LAND = 21.78; // the megalodon lands on the bottom
