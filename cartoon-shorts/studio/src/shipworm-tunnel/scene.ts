// shipworm-tunnel: timing (video time = voice time + 0.1 s; sentence pauses measured by RMS < -42 dB) and shot cuts.
export const FPS = 60;
export const VO_AT = 0.1;
export const DURATION = 19.4; // voice ends 18.46 s (video) + tail for the train gag

// video-time word starts (Scribe + 0.1 s)
export const T = {
  so: 0.1, want: 0.74, tunnel: 0.98, under: 1.46, river: 1.78, thames: 2.02,
  but: 2.98, mud: 3.3, soft: 4.1, last: 4.9, crew: 5.18, flooded: 5.54, out: 5.86,
  so2: 6.58, look: 6.9, plank: 7.54, holes: 8.5,
  shipworm: 9.3, drilled: 9.78, shell: 10.42, first: 10.74, lining: 11.46, walls: 11.78, behind: 12.14,
  so3: 12.98, build: 13.3, iron: 13.78, shell2: 14.18, diggers: 14.86, front: 15.3, bricklayers: 15.98, behind2: 16.74,
  trains: 17.54, still: 17.94, use: 18.1, it: 18.34, end: 18.46,
};
export const CUT_C = 6.3; // -> close on the guy with the plank
export const CUT_D = 8.95; // -> the plank close-up (the shipworm)
export const CUT_E = 12.8; // -> back to the river cut-away (the shield)
