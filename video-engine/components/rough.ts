// Deterministic "hand-drawn marker" geometry. Everything is seeded so frames are stable.
export type Pt = [number, number];
export type Stroke = {pts: Pt[]; closed?: boolean};

export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function polyLen(pts: Pt[]): number {
  let l = 0;
  for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return l;
}

export function resample(pts: Pt[], step = 14): Pt[] {
  const out: Pt[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const d = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.max(1, Math.round(d / step));
    for (let k = 1; k <= n; k++) out.push([x0 + ((x1 - x0) * k) / n, y0 + ((y1 - y0) * k) / n]);
  }
  return out;
}

// Low-frequency wobble perpendicular to the path, like a hand holding a marker.
export function wobble(pts: Pt[], seed: number, amp = 2.2, closed = false): Pt[] {
  const r = rng(seed);
  const p = resample(closed ? [...pts, pts[0]] : pts, 12);
  const ph1 = r() * 6.28;
  const ph2 = r() * 6.28;
  const f1 = 0.012 + r() * 0.01;
  const f2 = 0.035 + r() * 0.02;
  let dist = 0;
  const out: Pt[] = [];
  for (let i = 0; i < p.length; i++) {
    if (i > 0) dist += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
    const a = i === 0 ? p[1] : p[i - 1];
    const b = i === p.length - 1 ? p[i - 1] : p[i + 1];
    let nx = -(b[1] - a[1]);
    let ny = b[0] - a[0];
    const nl = Math.hypot(nx, ny) || 1;
    nx /= nl;
    ny /= nl;
    if (i === 0 && i < p.length - 1) {
      nx = -nx;
      ny = -ny;
    }
    const o = amp * (0.7 * Math.sin(dist * f1 + ph1) + 0.3 * Math.sin(dist * f2 + ph2));
    out.push([p[i][0] + nx * o, p[i][1] + ny * o]);
  }
  if (closed && out.length > 3) {
    // marker overshoot: continue a little past the start
    const extra = Math.max(2, Math.round(out.length * 0.06));
    for (let k = 1; k <= extra; k++) {
      const q = out[k % out.length];
      out.push([q[0] + (r() - 0.5) * amp * 1.5, q[1] + (r() - 0.5) * amp * 1.5]);
    }
  }
  return out;
}

// Catmull-Rom spline through points -> smooth cubic path.
export function toPath(pts: Pt[]): string {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

export function closedPath(pts: Pt[]): string {
  return pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('') + 'Z';
}

// ---- primitives (unjittered) ----
export const line = (x1: number, y1: number, x2: number, y2: number): Stroke => ({pts: [[x1, y1], [x2, y2]]});
export const poly = (pts: Pt[], closed = false): Stroke => ({pts, closed});
export function rect(x: number, y: number, w: number, h: number): Stroke {
  return {pts: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], closed: true};
}
export function rrect(x: number, y: number, w: number, h: number, r: number): Stroke {
  const pts: Pt[] = [];
  const arc = (cx: number, cy: number, a0: number) => {
    for (let k = 0; k <= 4; k++) {
      const a = a0 + (k * Math.PI) / 8;
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
  };
  arc(x + w - r, y + r, -Math.PI / 2);
  arc(x + w - r, y + h - r, 0);
  arc(x + r, y + h - r, Math.PI / 2);
  arc(x + r, y + r, Math.PI);
  return {pts, closed: true};
}
export function ellipse(cx: number, cy: number, rx: number, ry: number, a0 = 0, a1 = Math.PI * 2, n = 36): Stroke {
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((a1 - a0) * i) / n;
    pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  const full = Math.abs(a1 - a0) >= Math.PI * 2 - 1e-6;
  if (full) pts.pop();
  return {pts, closed: full};
}
export function star(cx: number, cy: number, r: number, inner = 0.45, n = 5): Stroke {
  const pts: Pt[] = [];
  for (let i = 0; i < n * 2; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / n;
    const rr = i % 2 ? r * inner : r;
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  return {pts, closed: true};
}

// Zig-zag scribble that covers a bbox; clip it with the shape to get a marker fill.
export function scribble(x: number, y: number, w: number, h: number, seed: number, gap = 16, angle = -0.5): Pt[] {
  const r = rng(seed);
  const cx = x + w / 2;
  const cy = y + h / 2;
  const R = Math.hypot(w, h) / 2 + gap;
  const ca = Math.cos(angle);
  const sa = Math.sin(angle);
  const pts: Pt[] = [];
  let i = 0;
  for (let u = -R; u <= R; u += gap) {
    const v0 = -R + (r() - 0.5) * gap;
    const v1 = R + (r() - 0.5) * gap;
    const a: Pt = i % 2 ? [u, v1] : [u, v0];
    const b: Pt = i % 2 ? [u + gap / 2, v0] : [u + gap / 2, v1];
    for (const [uu, vv] of [a, b]) pts.push([cx + uu * ca - vv * sa, cy + uu * sa + vv * ca]);
    i++;
  }
  return pts;
}

export function bbox(pts: Pt[]) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of pts) {
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
  }
  return {x: x0, y: y0, w: x1 - x0, h: y1 - y0};
}
