// antarctic-trash: timing (video time = voice time + 0.1 s; Scribe word starts) and shot cuts.
export const FPS = 60;
export const VO_AT = 0.1;
export const DURATION = 21.4; // voice ends 20.90 s (video) + 0.5 s tail

export const T = {
  base: 0.82, antarctica: 1.22, trash: 2.34, piling: 3.06, up: 3.54, upEnd: 3.86,
  easy: 4.26, drag: 5.1, frozen: 5.78, sea: 6.18, seaEnd: 6.7,
  but: 6.9, ice: 7.3, breaks: 7.54, up2: 7.94, pile: 8.66, sinks: 8.98, bay: 9.7, bayEnd: 10.22,
  so: 10.42, bury: 10.98, deep: 11.46, ice2: 11.94,
  but2: 12.58, ice3: 12.9, sliding: 13.38, ocean: 14.18, oceanEnd: 14.78,
  one: 14.98, old: 15.22, base2: 15.46, drifted: 15.78, iceberg: 16.66, icebergEnd: 17.38,
  so3: 17.54, trash2: 18.18, packed: 18.66, up3: 18.98, shipped: 19.46, all: 19.94, home: 20.42, end: 20.9,
};
export const CUT_B = T.so; // -> the land: burying the bag
export const CUT_C = T.so3; // -> the shore with the cargo ship
