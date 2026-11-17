// shark-storm: timing (video time = Scribe word start + 0.1 s, see images/shark-storm/words.json).
// Voice: Liam, 68 words, speech 0.12-24.10 s (loudness), no fitting needed (24.7 s video <= 25 s).
export const FPS = 60;
export const VO_AT = 0.1;
export const DURATION = 24.7; // voice ends ~24.1 s + the loop back to frame 0
export const T = {
  fourteen: 0.1, baby: 0.58, sharks: 0.98, beep: 1.46, from: 1.94, tiny: 2.42, tags: 2.82, shallow: 3.54, florida: 3.94, bay: 4.34,
  hiding: 5.02, big: 5.7, sharks2: 5.94, deep: 6.5, water: 6.74,
  but: 7.62, one: 7.86, night: 8.02, every: 8.66, beep2: 8.98, heads: 9.34, out: 9.54, bay2: 9.94,
  straight: 10.66, toward: 11.1, big2: 11.62, sharks3: 11.86,
  why: 12.74, would: 12.98, they: 13.14, leave: 13.3,
  hours: 14.18, later: 14.58, tropical: 15.18, storm: 15.7, hits: 16.1, empty: 16.58, bay3: 16.82,
  they2: 17.46, probably: 17.86, felt: 18.18, coming: 18.7, because: 19.18, air: 19.46, pressure: 19.7, drops: 20.02,
  before: 20.5, storm2: 20.9,
  weeks: 21.78, later2: 22.18, bay4: 22.9, starts: 23.14, beeping: 23.46, again: 23.78, end: 24.1,
};
// shots (one world: the bay cutaway); hard cuts only where the story jumps in time
export const CUT_C = 10.5; // glide to the deep: the babies pass the big shark
export const CUT_D = 12.64; // close-up: why would they leave?
export const CUT_E = 14.1; // hours later: the storm
export const CUT_F = 17.36; // earlier (flashback): they felt it coming
export const CUT_G = 21.6; // weeks later
