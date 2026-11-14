// hoover-dam-pour: timing (video time = voice time + 0.1 s; Scribe word starts, sentence ends from the loudness envelope).
export const FPS = 60;
export const VO_AT = 0.1;
export const DURATION = 17.0; // voice 16.24 s + 0.1 lead + tail (<= 20 s)

export const T = {
  why: 0.1, pour: 0.98, hoover: 1.3, dam: 1.62, one: 2.02, go: 2.26, goEnd: 2.62,
  concrete: 3.14, heats: 3.62, up: 3.94, hardens: 4.38, hardensEnd: 4.82,
  in: 5.22, piece: 5.62, itd: 6.14, take: 6.38, n125: 6.66, n125End: 7.86, years: 8.1, cool: 8.66, coolEnd: 8.92,
  and: 9.42, crack: 9.62, crackEnd: 10.02,
  so: 10.58, built: 10.98, blocks: 11.38, pumped: 12.02, ice: 12.34, water: 12.58, through: 12.9, pipes: 13.14, inside: 13.62, insideEnd: 13.82,
  basically: 14.34, dam2: 15.34, got: 15.54, fridge: 15.78, end: 16.2,
};
