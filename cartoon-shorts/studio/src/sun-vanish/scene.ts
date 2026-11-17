// sun-vanish: timing (video time = Scribe word start + 0.1 s, see images/sun-vanish/words.json).
// Voice: Liam, 69 words, speech 0.12-21.54 s (no fitting needed).
export const FPS = 60;
export const VO_AT = 0.1;
export const DURATION = 23.0; // voice ends 21.54 s + the medal / snow ending
export const T = {
  so: 0.1, tanning: 0.46, beach: 0.98, and: 1.66, sun: 2.02, vanishes: 2.34,
  but: 3.38, nothing: 3.62, happens: 3.94, because: 4.7, light: 5.14, pull: 5.78, need: 6.18, over: 6.42, eight: 6.86,
  minutes: 7.14, reach: 7.74, us: 7.94,
  so2: 8.66, keep: 9.14, tanning2: 9.3, and2: 9.98, earth: 10.18, keeps: 10.5, circling: 10.74, empty: 11.3, spot: 11.62,
  but2: 12.5, then: 12.66, lights: 12.9, go: 13.22, out: 13.46,
  and3: 14.1, earth2: 14.26, flies: 14.58, off: 15.06, into: 15.22, dark: 15.66, straight: 16.3, line: 16.66,
  like: 17.06, stone: 17.5, from: 17.78, sling: 18.06,
  so3: 19.1, you3: 19.3, just: 19.54, got: 19.7, last: 20.26, tan: 20.5, history: 21.06, end: 21.78,
};
// shots: beach (A C E G J) intercut with the space view (B D F H)
export const CUT_B = T.vanishes; // space: the Sun goes poof
export const CUT_C = T.but; // beach: nothing happens
export const CUT_D = T.because; // space: light + pull still on the way
export const CUT_E = T.so2; // beach: keep tanning
export const CUT_F = T.and2; // space: Earth circles an empty spot
export const CUT_G = T.but2; // beach: the lights go out
export const CUT_H = T.and3; // space: Earth flies off in a straight line (+ sling bubble)
export const CUT_J = T.so3; // beach at night: the last tan in history
export const T_POOF = 2.62; // the Sun vanishes (space)
export const T_ARR = 14.3; // the light front and the slack in the pull reach Earth (space view)
