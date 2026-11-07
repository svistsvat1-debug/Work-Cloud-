// Word times from forced alignment of vo/take1.mp3 (voice placed at VO_AT). Every beat is keyed to these.
export const FPS = 60;
export const VO_AT = 0.1;
const v = (x: number) => +(x + VO_AT).toFixed(3);

export const T = {
  asleep: v(0.82), so: v(1.84), fall: v(2.93), fallEnd: v(3.52),
  classic: v(3.84), answer: v(4.26), answerEnd: v(4.68),
  tendons: v(5.53), run: v(5.99), behind: v(6.21), joint: v(6.75), into: v(7.13), toes: v(7.45), toesEnd: v(8.14),
  crouching: v(8.31), pulls: v(8.85), shut: v(9.24), shutEnd: v(9.59),
  and2: v(9.98), backward: v(10.36), knee: v(10.78), kneeEnd: v(11.08),
  actually: v(11.72), ankle: v(12.22), ankleEnd: v(12.61),
  many: v(12.99), songbirds: v(13.26), tiny: v(14.0), ridges: v(14.48), lock: v(15.04), tendons2: v(15.63),
  zip: v(16.2), tie: v(16.51), tieEnd: v(16.87),
  standing: v(17.29), up: v(17.71), unlocks: v(18.03), themEnd: v(18.6),
  but: v(18.99), starlings: v(19.17), tendons3: v(20.01), cut: v(20.45), still: v(20.84), slept: v(21.21),
  perch: v(21.8), perchEnd: v(22.32),
  so2: v(22.62), balance: v(22.99), does: v(23.45), work: v(24.17), workEnd: v(24.6),
};

// scan to x-ray and back
export const XR_IN: [number, number] = [3.85, 4.55];
export const XR_OUT: [number, number] = [20.95, 21.55];
// lens bubble + clicks
export const LENS: [number, number] = [13.36, 18.32];
export const CLICKS = [15.15, 15.45, 15.75, 16.3, 16.6];
export const SNIPS = [20.47, 20.7];
export const BONK = 3.02;
export const DURATION = 26.3;
