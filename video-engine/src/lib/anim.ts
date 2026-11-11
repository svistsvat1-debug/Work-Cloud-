// Small animation helpers (time in seconds).
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const prog = (t: number, start: number, dur: number) => (dur <= 0 ? (t >= start ? 1 : 0) : clamp((t - start) / dur));
export const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);
export const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
/** easeOutBack: 0 -> overshoot -> 1 */
export const back = (x: number, k = 1.9) => {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const c3 = k + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + k * Math.pow(x - 1, 2);
};
/** pop-in scale with small overshoot */
export const pop = (t: number, at: number, dur = 0.45) => back(prog(t, at, dur));
export const lerp = (a: number, b: number, x: number) => a + (b - a) * x;

/** deterministic pseudo random */
export const rnd = (seed: number) => {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

export const fmtInt = (n: number) => Math.round(n).toLocaleString('en-US');
