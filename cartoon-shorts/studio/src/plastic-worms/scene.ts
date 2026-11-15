// plastic-worms: timing (video time = voice time + 0.1 s; Scribe word starts) and shot cuts.
export const FPS = 60;
export const VO_AT = 0.1;
export const DURATION = 23.45; // voice ends ~22.95 s (video) + 0.5 s tail

export const T = {
  so: 0.1, dump: 0.42, mountain: 0.82, foam: 1.54, trash: 1.86, box: 2.66, mealworms: 3.06, mwEnd: 3.82,
  and: 3.94, actually: 4.5, eat: 4.9, it: 5.14, itEnd: 5.46,
  they: 5.62, breathe: 6.1, half: 6.5, out: 6.98, air: 7.3, airEnd: 7.7,
  but: 8.1, hundred: 8.62, worms: 8.98, finish: 9.38, one: 10.1, small: 10.42, pill: 10.74, foam2: 11.14, day: 11.46, dayEnd: 11.78,
  so2: 12.18, mountain2: 12.62, outlast: 13.14, you: 13.62, kids: 14.34, and2: 14.94, worms2: 15.22, worms2End: 15.7,
  because: 16.02, real: 16.5, eaters: 16.82, tiny: 17.38, bacteria: 17.78, guts: 18.74, gutsEnd: 19.14,
  so3: 19.62, now: 19.78, scientists: 20.18, want: 20.74, bacteria2: 20.98, not: 21.94, worms3: 22.26, end: 22.98,
};
export const CUT_B = 3.9; // -> close-up on the tub: worms eat and burp
export const CUT_C = 8.06; // -> wide: "But" (the mountain is still there)
export const CUT_E = 15.9; // -> x-ray: bacteria in the worm's gut
export const CUT_F = 19.5; // -> wide: scientists want the bacteria
