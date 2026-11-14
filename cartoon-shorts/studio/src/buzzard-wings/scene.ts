// buzzard-wings: timing (video time = voice time + 0.1 s; Scribe word starts) and shot cuts.
export const FPS = 60;
export const VO_AT = 0.1;
export const DURATION = 24.0; // voice ends 23.46 s (video) + tail

export const T = {
  man: 0.26, hangs: 0.58, glider: 1.22, gust: 2.18, tips: 2.58, over: 2.98,
  throws: 3.94, body: 4.5, against: 4.94, but: 5.54, not: 5.86, enough: 6.02,
  crashes: 6.98,
  so: 8.18, two: 8.58, bike: 8.82, makers: 9.14, watch: 9.54, buzzards: 9.86, instead: 10.34,
  gust2: 11.46, tips2: 11.78, bird: 12.26, too: 12.58, but2: 13.06, swing: 13.62,
  twists: 14.74, wingtips: 15.46,
  so3: 16.34, brothers: 16.66, twist: 17.06, wings: 17.98, cables: 18.46, rolls: 19.46, back: 19.7, level: 19.94,
  planes: 20.74, still: 21.18, doIt: 21.38, flaps: 22.26, wingtips2: 22.86, end: 23.46,
};
export const T_IMPACT = 7.1; // the glider hits the sand
export const CUT_B = 8.05; // -> the brothers on the dunes
export const CUT_C = 16.22; // -> the Wright glider on cables
export const CUT_D = 20.55; // -> the modern plane
