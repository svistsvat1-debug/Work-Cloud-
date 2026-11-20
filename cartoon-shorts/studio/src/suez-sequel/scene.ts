// suez-sequel: timing (video time = fitted word start + 0.1 s, see images/suez-sequel/words.json).
// Voice: Liam, 68 words / 375 chars, raw speech 25.08 s (2.71 words/s) -> six pauses > 0.35 s shortened to 0.25 s
// (silence only, 1.12 s cut, no tempo change) -> 24.03 s fitted take at 0.1 s + tail -> video 24.5 s (1470 frames).
export const FPS = 60;
export const VO_AT = 0.1;
export const DURATION = 24.5;
export const T = {
  giant: 0.46, ship: 0.94, finally: 1.58, unstuck: 2.06, suez: 2.94, canal: 3.34,
  so: 4.06, off: 4.54, europe: 4.86, right: 5.3,
  but: 5.71, halfway: 5.87, canal2: 6.51, egypt: 7.23, stops: 7.71, it: 8.11,
  pay: 8.44, mess: 8.84, first: 9.16, over: 9.96, nine: 10.36, hundred: 10.76, million: 11.32, dollars: 11.8,
  owners: 12.65, refuse: 12.97,
  so2: 13.88, ship2: 14.12, sits: 14.52, lake: 15.04, crew: 15.52, board: 15.88, for: 16.48, three: 16.68, months: 17.16,
  then: 17.83, deal: 18.55,
  and: 19.02, six: 19.18, weeks: 19.46, later: 19.66, sails: 20.26, right2: 20.7, back: 21.02, same: 21.58, canal3: 21.82,
  with: 22.54, two: 22.86, tugboats: 23.1, watching: 23.66, end: 24.13,
};
