// moai-hats: timing (video time = word start + 0.1 s; word ends checked by loudness, see images/moai-hats/words.json).
// Voice: Liam, 65 words / 326 chars, speech 0.08-19.26 s of the take (19.18 s = 3.39 words/s), no fitting (20.0 s video <= 25 s).
export const FPS = 60;
export const VO_AT = 0.1;
export const DURATION = 20.0;
export const T = {
  the: 0.1, islanders: 0.34, want: 0.82, crown: 1.1, stone: 1.62, giant: 2.02, twelve: 2.66, hat: 3.46, hatEnd: 3.84,
  but: 4.26, nobody: 4.5, crane: 5.14, craneEnd: 5.62,
  lucky: 6.06, them: 6.62, hat2: 7.14, round: 7.54, roundEnd: 7.86,
  so: 8.38, probably: 8.98, roll: 9.38, up: 9.7, ramp: 9.94, with: 10.5, rope: 10.78, looped: 11.06, around: 11.34,
  halves: 11.94, pull: 12.34, pullEnd: 12.56,
  one: 13.14, last: 13.3, shove: 13.58, flops: 14.38, onto: 14.74, his: 14.98, head: 15.18, headEnd: 15.32,
  one2: 15.86, hat3: 16.1, never: 16.42, made: 16.74, though: 17.1, thoughEnd: 17.24,
  its: 17.7, still: 17.98, bottom: 18.46, ramp2: 18.9, end: 19.36,
};
// shots (hard cuts): the yard -> the ramp (on "So") -> the landing (on "One last shove") -> the stuck hat (on "One hat")
export const C_RAMP = 8.32;
export const C_TOP = 13.1;
export const C_STUCK = 15.8;
