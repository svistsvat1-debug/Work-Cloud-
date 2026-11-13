// kingfisher-train: timing (video time = voice time + 0.1 s; word edges checked against the loudness envelope) and layout.
export const FPS = 60;
export const VO_AT = 0.1;
export const DURATION = 16.3;

// video-time beats (Scribe word starts shifted to the loudness pauses; sentence pauses measured by RMS < -42 dB)
export const T = {
  why: 0.1, japan: 0.74, bullet: 1.5, train: 1.7, nose: 2.18, birds: 2.82, beak: 3.15, beakEnd: 3.42,
  its: 3.98, old: 4.22, nose2: 4.48, shoved: 4.88, air: 5.2, into: 5.46, tunnels: 5.64, so: 6.2, hard: 6.4,
  the: 6.8, tunnels2: 7.0, went: 7.36, boom: 7.68, boomEnd: 8.08,
  but: 8.6, kingfisher: 8.78, dives: 9.58, into2: 9.88, water: 10.08, with: 10.4, barely: 10.64, a: 10.98, splash: 11.2, splashEnd: 11.6,
  so2: 12.12, engineers: 12.38, copied: 12.9, its2: 13.22, beak2: 13.38, beak2End: 13.7, and: 13.78, the2: 13.9, train2: 14.1,
  slipped: 14.4, in: 14.68, quietly: 14.9, end: 15.55,
};
// hard cuts in the sentence pauses
export const CUT1 = 3.96; // -> the old train
export const CUT2 = 8.56; // -> the pond
export const CUT3 = 12.04; // -> the old train at the tunnel again
export const BOOM = 8.06; // the blast sits in the pause after "boom"
