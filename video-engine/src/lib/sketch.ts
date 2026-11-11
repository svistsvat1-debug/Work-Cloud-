// Hand-drawn geometry: seeded wobble, smooth marker paths, scribble hatching.
export type Pt = [number, number];

export const rng = (seed: number) => {
  let s = (Math.floor(seed) ^ 0x9e3779b9) >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return (s % 1000003) / 1000003;
  };
};

export const seedOf = (...v: (number | string)[]) => {
  let h = 2166136261;
  const str = v.join('|');
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

// Subdivide a polyline/polygon and push points sideways with a smooth random walk.
export const wobble = (pts: Pt[], seed: number, amp = 2.2, step = 24, closed = false): Pt[] => {
  if (pts.length < 2) return pts;
  const r = rng(seed);
  const out: Pt[] = [];
  const segs = closed ? pts.length : pts.length - 1;
  let off = (r() - 0.5) * 0.6;
  let vel = 0;
  for (let i = 0; i < segs; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const n = Math.max(1, Math.round(len / step));
    const nx = -(b[1] - a[1]) / len;
    const ny = (b[0] - a[0]) / len;
    for (let k = 0; k < n; k++) {
      const t = k / n;
      vel += (r() - 0.5) * 0.8;
      vel *= 0.75;
      off += vel;
      off *= 0.86;
      out.push([a[0] + (b[0] - a[0]) * t + nx * off * amp, a[1] + (b[1] - a[1]) * t + ny * off * amp]);
    }
  }
  if (!closed) {
    const l = pts[pts.length - 1];
    out.push([l[0] + (r() - 0.5) * amp, l[1] + (r() - 0.5) * amp]);
  }
  return out;
};

// Catmull-Rom -> cubic Bezier.
export const smooth = (p: Pt[], closed = false): string => {
  if (p.length < 2) return '';
  const pts = closed ? [p[p.length - 1], ...p, p[0], p[1]] : [p[0], ...p, p[p.length - 1]];
  let d = `M${p[0][0].toFixed(1)},${p[0][1].toFixed(1)}`;
  const last = closed ? p.length + 1 : p.length;
  for (let i = 1; i < last; i++) {
    const p0 = pts[i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
};

export const poly = (pts: Pt[]) => `M${pts.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join('L')}Z`;

// Outline as a marker stroke: closed shapes overshoot their start a little, like a real hand.
export const markerPath = (pts: Pt[], closed: boolean, seed: number, amp = 2.2) => {
  const w = wobble(pts, seed, amp, 24, closed);
  if (closed) {
    const over = w.slice(0, Math.min(3, w.length));
    return smooth([...w, ...over], false);
  }
  return smooth(w, false);
};

// Point generators
export const rectPts = (x: number, y: number, w: number, h: number): Pt[] => [
  [x, y],
  [x + w, y],
  [x + w, y + h],
  [x, y + h],
];
export const ellPts = (cx: number, cy: number, rx: number, ry: number, n = 28, a0 = 0, a1 = Math.PI * 2): Pt[] => {
  const out: Pt[] = [];
  const full = Math.abs(a1 - a0 - Math.PI * 2) < 1e-6;
  const cnt = full ? n : n + 1;
  for (let i = 0; i < cnt; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return out;
};
export const circPts = (cx: number, cy: number, r: number, n = 26) => ellPts(cx, cy, r, r, n);
export const roundRectPts = (x: number, y: number, w: number, h: number, r: number): Pt[] => {
  const out: Pt[] = [];
  const corner = (cx: number, cy: number, a0: number) => {
    for (let i = 0; i <= 4; i++) {
      const a = a0 + (Math.PI / 2) * (i / 4);
      out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
  };
  corner(x + w - r, y + r, -Math.PI / 2);
  corner(x + w - r, y + h - r, 0);
  corner(x + r, y + h - r, Math.PI / 2);
  corner(x + r, y + r, Math.PI);
  return out;
};
export const starPts = (cx: number, cy: number, R: number, r: number, n = 5, rot = -Math.PI / 2): Pt[] => {
  const out: Pt[] = [];
  for (let i = 0; i < n * 2; i++) {
    const rad = i % 2 === 0 ? R : r;
    const a = rot + (Math.PI * i) / n;
    out.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad]);
  }
  return out;
};

export const bbox = (pts: Pt[]) => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) {
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  return {x0, y0, x1, y1};
};

// Zig-zag hatch covering a bbox at an angle (later clipped to the shape).
export const hatch = (b: {x0: number; y0: number; x1: number; y1: number}, gap: number, angleDeg: number, seed: number): string => {
  const r = rng(seed);
  const a = (angleDeg * Math.PI) / 180;
  const ux = Math.cos(a), uy = Math.sin(a);
  const vx = -uy, vy = ux;
  const corners: Pt[] = [
    [b.x0 - 10, b.y0 - 10],
    [b.x1 + 10, b.y0 - 10],
    [b.x1 + 10, b.y1 + 10],
    [b.x0 - 10, b.y1 + 10],
  ];
  const us = corners.map(([x, y]) => x * ux + y * uy);
  const vs = corners.map(([x, y]) => x * vx + y * vy);
  const umin = Math.min(...us), umax = Math.max(...us);
  const vmin = Math.min(...vs), vmax = Math.max(...vs);
  const pts: Pt[] = [];
  let flip = false;
  for (let v = vmin; v <= vmax + gap; v += gap) {
    const j1 = (r() - 0.5) * gap * 0.5;
    const j2 = (r() - 0.5) * gap * 0.5;
    const s = flip ? umax : umin;
    const e = flip ? umin : umax;
    pts.push([s * ux + (v + j1) * vx, s * uy + (v + j1) * vy]);
    pts.push([e * ux + (v + j2) * vx, e * uy + (v + j2) * vy]);
    flip = !flip;
  }
  return `M${pts.map((q) => `${q[0].toFixed(1)},${q[1].toFixed(1)}`).join('L')}`;
};
