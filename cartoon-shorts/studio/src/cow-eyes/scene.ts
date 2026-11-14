// cow-eyes: timing (video time = voice time + 0.1 s; sentence pauses measured by RMS < -42 dB) and shot cuts.
export const FPS = 60;
export const VO_AT = 0.1;
export const DURATION = 21.9; // voice ends 21.14 s (video) + tail for the punchline

// video-time word starts (Scribe + 0.1 s)
export const T = {
  lion: 0.34, sneaks: 0.82, cow: 1.78, botswana: 2.26,
  it: 3.38, see: 4.5, because: 4.98, lions: 5.22, hunt: 5.7, surprise: 6.02,
  but: 7.22, two: 7.46, huge: 7.94, eyes: 8.42, stare: 8.82, right: 9.22, back: 9.58, it2: 9.94,
  from: 10.58, butt: 10.98,
  someone: 11.86, painted: 12.22, them: 12.58, on: 12.74,
  so: 13.54, lion2: 13.78, thinks: 14.18, spotted: 14.74, walks: 15.42, away: 15.78,
  in: 16.58, four: 16.82, years: 17.14, not: 17.74, one: 18.1, cow2: 18.34, eyes2: 18.82, gets: 19.26, eaten: 19.42,
  her: 20.18, friends: 20.34, do: 20.66, end: 21.14,
};
// hard cuts (inside pauses, except C3 which cuts to the lion on "right back at it")
export const C1 = 3.05; // wide -> sly lion close-up
export const C2 = 7.0; // -> the cow's rump (lion's view)
export const C3 = 9.16; // -> the shocked lion
export const C4 = 10.5; // -> the whole cow from behind
export const C5 = 11.5; // -> the guy paints the eyes
export const C6 = 13.3; // -> wide: the lion gives up
export const C7 = 16.3; // -> four years: the herd
