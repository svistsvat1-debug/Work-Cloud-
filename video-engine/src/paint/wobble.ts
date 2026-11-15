// MS-Paint look helpers: mouse-drawn wobbly lines with "boiling" (redrawn every few frames).
export type P = [number, number];

export const rng = (seed: number) => {
  let s = (seed * 9301 + 49297) % 233280;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};

// resample a polyline so every segment is at most `step` px long
const resample = (pts: P[], closed: boolean, step: number): P[] => {
  const src = closed ? [...pts, pts[0]] : pts;
  const out: P[] = [];
  for (let i = 0; i < src.length - 1; i++) {
    const [x1, y1] = src[i];
    const [x2, y2] = src[i + 1];
    const n = Math.max(1, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / step));
    for (let k = 0; k < n; k++) out.push([x1 + ((x2 - x1) * k) / n, y1 + ((y2 - y1) * k) / n]);
  }
  if (!closed) out.push(src[src.length - 1]);
  return out;
};

// jittered, smoothed path (quadratic through midpoints)
export const wob = (pts: P[], closed: boolean, seed: number, amp = 2.2, step = 26): string => {
  const r = rng(seed);
  const q = resample(pts, closed, step).map(([x, y]) => [x + (r() - 0.5) * 2 * amp, y + (r() - 0.5) * 2 * amp] as P);
  if (q.length < 2) return '';
  if (!closed) {
    let d = `M${q[0][0].toFixed(1)},${q[0][1].toFixed(1)}`;
    for (let i = 1; i < q.length - 1; i++) {
      const mx = (q[i][0] + q[i + 1][0]) / 2;
      const my = (q[i][1] + q[i + 1][1]) / 2;
      d += ` Q${q[i][0].toFixed(1)},${q[i][1].toFixed(1)} ${mx.toFixed(1)},${my.toFixed(1)}`;
    }
    const l = q[q.length - 1];
    return d + ` L${l[0].toFixed(1)},${l[1].toFixed(1)}`;
  }
  const n = q.length;
  const mid = (a: P, b: P): P => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const m0 = mid(q[n - 1], q[0]);
  let d = `M${m0[0].toFixed(1)},${m0[1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const m = mid(q[i], q[(i + 1) % n]);
    d += ` Q${q[i][0].toFixed(1)},${q[i][1].toFixed(1)} ${m[0].toFixed(1)},${m[1].toFixed(1)}`;
  }
  return d + 'Z';
};

export const ell = (cx: number, cy: number, rx: number, ry: number, n = 28, rot = 0): P[] =>
  Array.from({length: n}, (_, i) => {
    const a = (i / n) * Math.PI * 2 + rot;
    return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry] as P;
  });

export const rect = (x: number, y: number, w: number, h: number): P[] => [
  [x, y], [x + w, y], [x + w, y + h], [x, y + h],
];

// MS Paint default palette (the real 28-colour box)
export const PAL = {
  black: '#000000', white: '#FFFFFF', grey: '#7F7F7F', lgrey: '#C3C3C3',
  red: '#ED1C24', dred: '#880015', orange: '#FF7F27', yellow: '#FFF200',
  green: '#22B14C', lgreen: '#B5E61D', blue: '#00A2E8', dblue: '#3F48CC',
  turq: '#99D9EA', brown: '#B97A57', tan: '#EFE4B0', skin: '#FFC90E', pink: '#FFAEC9',
};
