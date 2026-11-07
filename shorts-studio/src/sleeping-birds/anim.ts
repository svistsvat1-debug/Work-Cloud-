export type V2 = [number, number];
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const prog = (t: number, t0: number, t1: number) => clamp((t - t0) / (t1 - t0));
export const lin = (u: number) => u;
export const eio = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
export const eo = (u: number) => 1 - Math.pow(1 - u, 3);
export const ei = (u: number) => u * u * u;
export const sm = (u: number) => u * u * (3 - 2 * u);
export const eoBack = (u: number, s = 1.4) => 1 + (s + 1) * Math.pow(u - 1, 3) + s * Math.pow(u - 1, 2);

export type Key = [number, number, ((u: number) => number)?];
// piecewise keyframes; the easing on a key is used for the segment that ENDS at that key
export function kf(t: number, ks: Key[]): number {
  if (t <= ks[0][0]) return ks[0][1];
  for (let i = 0; i < ks.length - 1; i++) {
    const [t0, v0] = ks[i];
    const [t1, v1, e] = ks[i + 1];
    if (t <= t1) return lerp(v0, v1, (e ?? eio)(prog(t, t0, t1)));
  }
  return ks[ks.length - 1][1];
}

// damped spring step response 0 -> 1 starting at t0
export function spring(t: number, t0: number, freq = 2.2, damp = 0.4) {
  if (t < t0) return 0;
  const tau = t - t0;
  const w = 2 * Math.PI * freq;
  const wd = w * Math.sqrt(1 - damp * damp);
  return 1 - Math.exp(-damp * w * tau) * (Math.cos(wd * tau) + ((damp * w) / wd) * Math.sin(wd * tau));
}

// pop in at t0 (0 -> 1 with overshoot), shrink away after t1
export function popScale(t: number, t0: number, t1 = 1e9, speed = 1, dOut = 0.2) {
  if (t < t0 || t > t1 + dOut) return 0;
  const sIn = spring(t, t0, 2.6 * speed, 0.42);
  const sOut = t > t1 ? 1 - ei(prog(t, t1, t1 + dOut)) : 1;
  return Math.max(0, sIn * sOut);
}

// short bump 0 -> 1 -> 0
export const bump = (t: number, t0: number, dur = 0.3) =>
  t < t0 || t > t0 + dur ? 0 : Math.sin(Math.PI * prog(t, t0, t0 + dur)) * Math.exp((-2.2 * (t - t0)) / dur);

export const add = (a: V2, b: V2): V2 => [a[0] + b[0], a[1] + b[1]];
export const sub = (a: V2, b: V2): V2 => [a[0] - b[0], a[1] - b[1]];
export const mul = (a: V2, s: number): V2 => [a[0] * s, a[1] * s];
export const mix = (a: V2, b: V2, u: number): V2 => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
export const len = (a: V2) => Math.hypot(a[0], a[1]);
export const nrm = (a: V2): V2 => {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l];
};
export const rad = (d: number) => (d * Math.PI) / 180;
export const polar = (r: number, deg: number): V2 => [r * Math.cos(rad(deg)), r * Math.sin(rad(deg))];
export const rotp = (p: V2, c: V2, deg: number): V2 => {
  const a = rad(deg);
  const s = Math.sin(a);
  const co = Math.cos(a);
  const d = sub(p, c);
  return [c[0] + d[0] * co - d[1] * s, c[1] + d[0] * s + d[1] * co];
};
export const pts = (p: V2[]) => p.map((q) => `${q[0].toFixed(2)},${q[1].toFixed(2)}`).join(' ');
export const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// smooth path through points (Catmull-Rom -> cubic Bezier)
export function smoothPath(p: V2[], tension = 1) {
  if (p.length < 2) return '';
  let d = `M${p[0][0].toFixed(2)},${p[0][1].toFixed(2)}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] ?? p2;
    const c1 = add(p1, mul(sub(p2, p0), tension / 6));
    const c2 = sub(p2, mul(sub(p3, p1), tension / 6));
    d += ` C${c1[0].toFixed(2)},${c1[1].toFixed(2)} ${c2[0].toFixed(2)},${c2[1].toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
  }
  return d;
}
