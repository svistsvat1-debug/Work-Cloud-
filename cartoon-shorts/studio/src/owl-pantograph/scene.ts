// owl-pantograph: timing (video time = voice time + 0.1 s; sentence pauses measured by RMS < -42 dB) and shot cuts.
export const FPS = 60;
export const VO_AT = 0.1;
export const DURATION = 22.6; // voice ends 22.04 s (video) + tail

// video-time word starts (Scribe + 0.1 s)
export const T = {
  japan: 0.1, bullet: 0.82, train: 1.14, hit: 1.58, n300: 1.78, km: 2.66, hour: 3.3,
  but: 4.18, arm: 4.62, roof: 5.06, howled: 5.46, wind: 6.1,
  too: 6.86, loud: 7.06, homes: 7.7, nearby: 7.98,
  so: 9.06, engineer: 9.54, eiji: 10.02, nakatsu: 10.38, birdwatcher: 11.3, thought: 12.26, owls: 12.66,
  tiny: 13.7, combs: 14.1, feathers: 14.74, chop: 15.22, air: 15.62, so2: 16.26, hunt: 16.58, almost: 16.9, silently: 17.46,
  he: 18.58, copied: 18.74, jagged: 19.22, edge: 19.62,
  and: 20.14, roof2: 20.34, went: 20.74, quiet: 20.98, as: 21.46, owl: 21.86, end: 22.04,
};
// hard cuts inside the sentence pauses
export const CUT_A3 = 6.74; // -> the houses down the line
export const CUT_B = 8.94; // -> the engineer
export const CUT_C = 13.64; // -> the owl
export const CUT_D = 18.54; // -> the workbench
export const CUT_E = 20.08; // -> back to frame 0's station
