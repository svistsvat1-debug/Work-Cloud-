// moai-walk: timing (video time = voice time + 0.1 s; sentence pauses measured by RMS < -42 dB) and beats.
export const FPS = 60;
export const VO_AT = 0.1;
// voice: 16.86 s, last loud frame at 16.66 s (+0.1 lead) -> end 16.76 + ~0.54 tail
export const DURATION = 17.3;

// video-time word starts (Scribe start + 0.1)
export const T = {
  how: 0.1, move: 0.78, stone: 1.14, giants: 1.62, no: 2.26, wheels: 2.58, big: 3.22, animals: 3.46,
  on: 4.42, logs: 4.66, right: 5.18,
  but: 5.94, statues: 6.26, old: 6.98, roads: 7.22, rounded: 7.9, bases: 8.34, lean: 8.82, forward: 9.22,
  so: 10.14, rocked: 10.54, side: 10.98, side2: 11.5, ropes: 11.86,
  legends: 12.9, statues2: 13.62, walked: 14.26,
  turns: 15.18, out: 15.46, probably: 16.22, did: 16.58, end: 16.76,
};
// sentence pauses (video time): 3.96-4.46, 5.32-5.94, 9.60-10.08, 12.32-12.88, 14.62-15.10, 15.64-15.84
export const CUT4 = 12.86; // -> the moai walks in on its own
export const CUT5 = 15.12; // -> the stunned guy, close
export const CUT6 = 15.84; // -> back to the frame-0 framing (loop)
