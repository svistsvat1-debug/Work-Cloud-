// Whiteboard marker engine — core geometry + marker rendering primitives.
// Logical canvas is always 1920x1080; output scale is applied by the renderer.
import { Path2D } from '@napi-rs/canvas';
import svgpath from 'svgpath';

export const W = 1920, H = 1080;

// ───────────────────────── palette ─────────────────────────
export const C = {
  paper: '#FAF7F0',
  ink: '#161616',
  red: '#E6291F',
  darkred: '#B81D15',
  blue: '#1B76C9',
  sky: '#39A9E6',
  navy: '#27457F',
  green: '#3FA636',
  dkgreen: '#2C7D2A',
  yellow: '#FFCB1F',
  orange: '#F5841F',
  brown: '#8E5B2D',
  tan: '#D9A86A',
  wood: '#B5773C',
  gray: '#8C8F92',
  ltgray: '#C9CBCC',
  dkgray: '#565A5E',
  steel: '#6F777B',
  skin: '#F6C7A2',
  pink: '#F39A8E',
  khaki: '#B7A76B',
  field: '#7E8872',
  cream: '#F3E4BE',
  purple: '#7B4BB7',
  white: '#FFFFFF',
};

// ───────────────────────── rng / noise ─────────────────────────
export function rng(seed) {
  let a = (seed >>> 0) || 1;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function hash2(ix, iy, seed) {
  let h = Math.imul(ix, 374761393) ^ Math.imul(iy, 668265263) ^ Math.imul(seed, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
export function vnoise(x, y, seed) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = x - ix, fy = y - iy;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash2(ix, iy, seed), b = hash2(ix + 1, iy, seed), c = hash2(ix, iy + 1, seed), d = hash2(ix + 1, iy + 1, seed);
  return (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v) * 2 - 1;
}

// ───────────────────────── colour helpers ─────────────────────────
export function hexToRgb(h) {
  const s = h.replace('#', '');
  const n = parseInt(s.length === 3 ? s.split('').map(c => c + c).join('') : s, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function rgbToHex(r, g, b) {
  const c = v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return '#' + c(r) + c(g) + c(b);
}
export function shade(hex, k) { // k>0 lighten toward white, k<0 darken toward black
  const [r, g, b] = hexToRgb(hex);
  if (k >= 0) return rgbToHex(r + (255 - r) * k, g + (255 - g) * k, b + (255 - b) * k);
  return rgbToHex(r * (1 + k), g * (1 + k), b * (1 + k));
}

// ───────────────────────── matrices ─────────────────────────
// matrix = [a,b,c,d,e,f]  (x' = a x + c y + e ; y' = b x + d y + f)
export const IDENT = [1, 0, 0, 1, 0, 0];
export function mmul(m1, m2) { // m1 ∘ m2  (apply m2 first, then m1)
  return [
    m1[0] * m2[0] + m1[2] * m2[1], m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3], m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4], m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
  ];
}
export function tfMatrix({ x = 0, y = 0, s = 1, sx, sy, rot = 0, flipX = false, ox = 0, oy = 0 } = {}) {
  // scale/rotate about local origin (ox,oy), then move that origin to (x,y)
  const kx = (sx ?? s) * (flipX ? -1 : 1), ky = sy ?? s;
  const r = rot * Math.PI / 180, co = Math.cos(r), si = Math.sin(r);
  // M = T(x,y) · R · S · T(-ox,-oy)
  const a = co * kx, b = si * kx, c = -si * ky, d = co * ky;
  return [a, b, c, d, x - (a * ox + c * oy), y - (b * ox + d * oy)];
}
export function mapply(m, x, y) { return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]; }
export function mscale(m) { return Math.sqrt(Math.abs(m[0] * m[3] - m[1] * m[2])); }

// ───────────────────────── path flattening ─────────────────────────
// returns array of sub-paths: { pts: [[x,y],...], closed }
export function flattenPath(d, m = null, step = 5) {
  let sp = svgpath(d);
  if (m) sp = sp.matrix(m);
  sp = sp.abs().unarc().unshort();
  const subs = [];
  let cur = null, sx = 0, sy = 0;
  const push = (x, y) => { cur.pts.push([x, y]); };
  sp.iterate((seg, idx, x, y) => {
    const t = seg[0];
    if (t === 'M') {
      cur = { pts: [[seg[1], seg[2]]], closed: false }; subs.push(cur); sx = seg[1]; sy = seg[2];
    } else if (t === 'L') { lineTo(x, y, seg[1], seg[2]); }
    else if (t === 'H') { lineTo(x, y, seg[1], y); }
    else if (t === 'V') { lineTo(x, y, x, seg[1]); }
    else if (t === 'C') {
      const [x1, y1, x2, y2, x3, y3] = seg.slice(1);
      const len = Math.hypot(x1 - x, y1 - y) + Math.hypot(x2 - x1, y2 - y1) + Math.hypot(x3 - x2, y3 - y2);
      const n = Math.max(3, Math.min(400, Math.ceil(len / step)));
      for (let i = 1; i <= n; i++) {
        const u = i / n, v = 1 - u;
        push(v * v * v * x + 3 * v * v * u * x1 + 3 * v * u * u * x2 + u * u * u * x3,
          v * v * v * y + 3 * v * v * u * y1 + 3 * v * u * u * y2 + u * u * u * y3);
      }
    } else if (t === 'Q') {
      const [x1, y1, x2, y2] = seg.slice(1);
      const len = Math.hypot(x1 - x, y1 - y) + Math.hypot(x2 - x1, y2 - y1);
      const n = Math.max(3, Math.min(400, Math.ceil(len / step)));
      for (let i = 1; i <= n; i++) {
        const u = i / n, v = 1 - u;
        push(v * v * x + 2 * v * u * x1 + u * u * x2, v * v * y + 2 * v * u * y1 + u * u * y2);
      }
    } else if (t === 'Z' || t === 'z') {
      if (cur) {
        const p = cur.pts[cur.pts.length - 1];
        if (Math.hypot(p[0] - sx, p[1] - sy) > 0.01) lineTo(p[0], p[1], sx, sy);
        cur.closed = true;
        // a following command without M continues from the start point
        cur = { pts: [[sx, sy]], closed: false, _implicit: true }; subs.push(cur);
      }
    }
  });
  function lineTo(x0, y0, x1, y1) {
    const len = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.max(1, Math.ceil(len / (step * 1.6)));
    for (let i = 1; i <= n; i++) push(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n);
  }
  return subs.filter(s => s.pts.length > 1);
}

export function ptsToSubs(pts, closed = false, step = 8) {
  const out = [[pts[0][0], pts[0][1]]];
  const all = closed ? pts.concat([pts[0]]) : pts;
  for (let i = 1; i < all.length; i++) {
    const [x0, y0] = all[i - 1], [x1, y1] = all[i];
    const len = Math.hypot(x1 - x0, y1 - y0);
    const n = Math.max(1, Math.ceil(len / step));
    for (let k = 1; k <= n; k++) out.push([x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n]);
  }
  return [{ pts: out, closed }];
}

// hand wobble: position based so shared edges stay shared
export function wobblePts(pts, amp, seed, freq = 1 / 58) {
  if (!amp) return pts;
  const out = new Array(pts.length);
  for (let i = 0; i < pts.length; i++) {
    const [x, y] = pts[i];
    const dx = vnoise(x * freq, y * freq, seed) * amp + vnoise(x * freq * 3.1, y * freq * 3.1, seed + 7) * amp * 0.28;
    const dy = vnoise(x * freq + 91.7, y * freq - 13.3, seed + 3) * amp + vnoise(x * freq * 3.1 + 5, y * freq * 3.1, seed + 11) * amp * 0.28;
    out[i] = [x + dx, y + dy];
  }
  return out;
}

export function bboxOf(subs) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const s of subs) for (const [x, y] of s.pts) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
}

// Douglas–Peucker
export function simplify(pts, tol) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = pts[a], [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1e-9;
    let md = 0, mi = -1;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs((pts[i][0] - ax) * dy - (pts[i][1] - ay) * dx) / L;
      if (d > md) { md = d; mi = i; }
    }
    if (md > tol) { keep[mi] = 1; stack.push([a, mi], [mi, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}

// Chaikin smoothing for hand-authored polylines
export function smooth(pts, iter = 2, closed = false) {
  let p = pts;
  for (let k = 0; k < iter; k++) {
    const q = [];
    const n = p.length;
    if (!closed) q.push(p[0]);
    for (let i = 0; i < (closed ? n : n - 1); i++) {
      const a = p[i], b = p[(i + 1) % n];
      q.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25]);
      q.push([a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
    }
    if (!closed) q.push(p[n - 1]);
    p = q;
  }
  return p;
}

// ───────────────────────── marker stroke ─────────────────────────
export function makeStroke(pts, { color = C.ink, w = 7, seed = 1, taper = true, vary = 0.13 } = {}) {
  const n = pts.length;
  const cum = new Float64Array(n);
  for (let i = 1; i < n; i++) cum[i] = cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  const total = cum[n - 1];
  // per-point width, quantised into runs
  const wq = new Float32Array(n);
  const tl = Math.min(14, total * 0.18);
  for (let i = 0; i < n; i++) {
    let k = 1 + vary * vnoise(cum[i] / 46 + seed * 0.37, seed * 1.31, seed);
    if (taper && tl > 0) {
      const a = Math.min(1, cum[i] / tl), b = Math.min(1, (total - cum[i]) / tl);
      k *= (0.72 + 0.28 * a) * (0.8 + 0.2 * b);
    }
    wq[i] = Math.max(1, Math.round(w * k * 2) / 2);
  }
  return { pts, cum, total, wq, color, w };
}

export function drawStroke(ctx, S, p) {
  if (p <= 0 || S.total <= 0) return;
  const L = S.total * Math.min(1, p);
  const { pts, cum, wq } = S;
  ctx.strokeStyle = S.color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const n = pts.length;
  let i = 0;
  while (i < n - 1 && cum[i] < L) {
    const w = wq[i];
    ctx.beginPath(); ctx.moveTo(pts[i][0], pts[i][1]);
    let j = i + 1;
    for (; j < n; j++) {
      if (cum[j] <= L) {
        ctx.lineTo(pts[j][0], pts[j][1]);
        if (wq[j] !== w) { break; }
      } else {
        const t = (L - cum[j - 1]) / (cum[j] - cum[j - 1] || 1);
        ctx.lineTo(pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * t, pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * t);
        j = n; break;
      }
    }
    ctx.lineWidth = w; ctx.stroke();
    if (j >= n) break;
    i = j;
  }
}

// ───────────────────────── marker hatch fill ─────────────────────────
export function subsToPath2D(subs, forceClose = false) {
  const p = new Path2D();
  for (const s of subs) {
    p.moveTo(s.pts[0][0], s.pts[0][1]);
    for (let i = 1; i < s.pts.length; i++) p.lineTo(s.pts[i][0], s.pts[i][1]);
    if (s.closed || forceClose) p.closePath();
  }
  return p;
}

// subs: array of {pts, closed} outlining the region (holes allowed with evenodd)
export function makeFill(subs, { color = C.red, angle = -32, gap = null, seed = 1, rule = 'evenodd', solid = false, sweep = null, tone = 0.05, streak = 0.14, density = 1, texture = 1, paper = C.paper } = {}) {
  const bb = bboxOf(subs);
  const clip = subsToPath2D(subs, true);
  if (solid) return { solid: true, clip, color, rule, bb, total: Math.max(1, bb.w * 1.2) };
  const R = rng(seed * 7919 + 13);
  // pass lines run along direction `a`; they are stacked along the normal (sweep direction)
  let a = angle * Math.PI / 180;
  if (sweep !== null) a = (sweep + 90) * Math.PI / 180;
  const ca = Math.cos(a), sa = Math.sin(a);
  if (gap === null) gap = Math.max(8, Math.min(19, Math.sqrt(bb.w * bb.h) / 13));
  gap /= density;
  let vmin = Infinity, vmax = -Infinity;
  const rot = subs.map(s => s.pts.map(([x, y]) => { const u = x * ca + y * sa, v = -x * sa + y * ca; if (v < vmin) vmin = v; if (v > vmax) vmax = v; return [u, v]; }));
  const passes = [];
  let flip = false, total = 0;
  const pw = gap * 1.62;
  const lighter = shade(color, 0.2), darker = shade(color, -0.16);
  for (let v = vmin + gap * 0.45; v < vmax + gap * 0.3; v += gap * (0.92 + R() * 0.16)) {
    let u0 = Infinity, u1 = -Infinity;
    for (const r of rot) {
      const n = r.length;
      for (let i = 0; i < n; i++) {
        const p = r[i], q = r[(i + 1) % n];
        if ((p[1] <= v && q[1] > v) || (q[1] <= v && p[1] > v)) {
          const u = p[0] + (q[0] - p[0]) * (v - p[1]) / (q[1] - p[1]);
          if (u < u0) u0 = u; if (u > u1) u1 = u;
        }
      }
    }
    if (u0 === Infinity) continue;
    u0 -= pw * 0.5; u1 += pw * 0.5;
    const len = u1 - u0;
    const bow = (R() - 0.5) * Math.min(gap * 0.7, len * 0.05);
    const tilt = (R() - 0.5) * gap * 0.35;
    const P = (uu, vv) => [uu * ca - vv * sa, uu * sa + vv * ca];
    const pts = [];
    const n = Math.max(2, Math.ceil(len / 60));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      pts.push(P(u0 + len * t, v + tilt * (t - 0.5) + bow * Math.sin(Math.PI * t)));
    }
    if (flip) pts.reverse();
    // texture: short lighter/darker over-strokes + tiny paper specks, revealed as the pass advances
    const extras = [];
    if (texture > 0) {
      const ne = Math.round((len / 95) * texture * (0.6 + R() * 0.8));
      for (let e = 0; e < ne; e++) {
        const el = 26 + R() * 95, c = u0 + pw * 0.4 + R() * Math.max(1, len - pw * 0.8 - el);
        const vv = v + (R() - 0.5) * gap * 0.9, dv = (R() - 0.5) * gap * 0.5;
        const r3 = R();
        const kind = r3 < 0.46 ? 'l' : r3 < 0.86 ? 'd' : 'p';
        const A = P(c, vv), B = P(c + el * (kind === 'p' ? 0.35 : 1), vv + dv);
        const at = flip ? 1 - (c + el - u0) / len : (c - u0) / len;
        extras.push({
          a: flip ? B : A, b: flip ? A : B, at: Math.max(0, Math.min(0.98, at)),
          w: kind === 'p' ? 1.3 + R() * 1.8 : gap * (0.32 + R() * 0.5),
          color: kind === 'l' ? lighter : kind === 'd' ? darker : paper,
          alpha: kind === 'p' ? 0.85 : 0.32 + R() * 0.3,
        });
      }
      extras.sort((x, y) => x.at - y.at);
    }
    flip = !flip;
    const k = (R() - 0.5) * 2 * tone;
    passes.push({ pts, len, w: pw * (0.9 + R() * 0.22), color: shade(color, k), start: total, edge: R() < 0.8, extras });
    total += len;
  }
  return { solid: false, clip, color, rule, passes, total: Math.max(total, 1), bb, gap, streakColor: shade(color, -0.22), streak };
}

export function drawFill(ctx, F, p) {
  if (p <= 0) return;
  p = Math.min(1, p);
  ctx.save();
  ctx.clip(F.clip, F.rule);
  if (F.solid) {
    ctx.fillStyle = F.color;
    if (p >= 1) ctx.fill(F.clip, F.rule);
    else { const b = F.bb; ctx.fillRect(b.x0 - 4, b.y0 - 4, (b.w + 8) * p, b.h + 8); }
    ctx.restore(); return;
  }
  const L = F.total * p;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const P of F.passes) {
    if (P.start >= L) break;
    const q = Math.min(1, (L - P.start) / P.len);
    const pts = P.pts, n = pts.length - 1;
    const upto = q * n;
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i <= n; i++) {
      if (i <= upto) ctx.lineTo(pts[i][0], pts[i][1]);
      else { const t = upto - (i - 1); if (t > 0) ctx.lineTo(pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t); break; }
    }
    ctx.strokeStyle = P.color; ctx.lineWidth = P.w; ctx.globalAlpha = 1; ctx.stroke();
    if (P.edge && F.streak > 0) { // darker centre streak, like real marker passes
      ctx.strokeStyle = F.streakColor; ctx.lineWidth = Math.max(1.2, F.gap * 0.16); ctx.globalAlpha = F.streak; ctx.stroke();
    }
    for (const e of P.extras) {
      if (e.at >= q) break;
      ctx.beginPath(); ctx.moveTo(e.a[0], e.a[1]); ctx.lineTo(e.b[0], e.b[1]);
      ctx.strokeStyle = e.color; ctx.lineWidth = e.w; ctx.globalAlpha = e.alpha; ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}
