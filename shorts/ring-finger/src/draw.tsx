import React from 'react';
import {V3, P2, sub, dot, cross, norm, add, mul, lerp3} from './math';
import {Rig, Cap, Part} from './hand';

export type Cam = {pos: V3; target: V3; up: V3; f: number; cx: number; cy: number};
export type Pr = P2 & {z: number; k: number};
export type Proj = (p: V3) => Pr;

export function makeProj(c: Cam): Proj {
  const F = norm(sub(c.target, c.pos));
  const R = norm(cross(F, c.up));
  const U = cross(R, F);
  return (p: V3) => {
    const d = sub(p, c.pos);
    const z = Math.max(0.5, dot(d, F));
    return {x: c.cx + (c.f * dot(d, R)) / z, y: c.cy - (c.f * dot(d, U)) / z, z, k: c.f / z};
  };
}

/** spherical camera around a target: pitch = degrees below horizontal, yaw = degrees round the y axis (0 = in front, +z) */
export function orbitCam(target: V3, dist: number, pitch: number, yaw: number, f: number, cy = 960): Cam {
  const p = (pitch * Math.PI) / 180,
    y = (yaw * Math.PI) / 180;
  const pos = add(target, mul([Math.sin(y) * Math.cos(p), Math.sin(p), Math.cos(y) * Math.cos(p)], dist));
  return {pos, target, up: [0, 1, 0], f, cx: 540, cy};
}
export function topCam(target: V3, height: number, f: number, cy = 960): Cam {
  return {pos: add(target, [0, height, 0]), target, up: [0, 0, 1], f, cx: 540, cy};
}

// ---------- 2D geometry ----------
const N = 22;
function circ(c: P2, r: number, out: P2[]) {
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    out.push({x: c.x + r * Math.cos(a), y: c.y + r * Math.sin(a)});
  }
}
function hull(ps: P2[]): P2[] {
  const p = ps.slice().sort((a, b) => a.x - b.x || a.y - b.y);
  const cr = (o: P2, a: P2, b: P2) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lo: P2[] = [],
    up: P2[] = [];
  for (const q of p) {
    while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
    up.push(q);
  }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
const area = (p: P2[]) => p.reduce((s, a, i) => s + a.x * p[(i + 1) % p.length].y - p[(i + 1) % p.length].x * a.y, 0);
export function capHull(a: P2, ra: number, b: P2, rb: number): P2[] {
  const pts: P2[] = [];
  circ(a, Math.max(0.1, ra), pts);
  circ(b, Math.max(0.1, rb), pts);
  return hull(pts);
}
export const pathOf = (polys: P2[][]) =>
  polys.map((p) => 'M' + p.map((q) => q.x.toFixed(1) + ',' + q.y.toFixed(1)).join('L') + 'Z').join('');

// ---------- hand drawing ----------
export const INK = '#151515';
export const SHADE = '#D5DCE8';
export const LIGHT = '#FFFFFF';
const LDIR = {x: -0.55, y: -0.83}; // highlight side on screen (upper left)

export type Passes = {ink: string; shade: string; light: string; root?: {x: number; y: number; r: number}};

export function partPasses(part: Part, pr: Proj, ow: number): Passes {
  // ow = outline width in cm (world), so lines keep their weight relative to the hand
  const ink: P2[][] = [],
    shade: P2[][] = [],
    light: P2[][] = [];
  let rsum = 0,
    rn = 0;
  part.caps.forEach((c, ci) => {
    const a = pr(c.a),
      b = pr(c.b);
    const ra = c.ra * a.k,
      rb = c.rb * b.k;
    rsum += ra + rb;
    rn += 2;
    if (part.root && ci === 0) {
      ink.push(capHull(a, (c.ra + ow) * a.k, b, (c.rb + ow) * b.k));
      shade.push(capHull(a, ra, b, rb));
    } else {
      ink.push(capHull(a, (c.ra + ow) * a.k, b, (c.rb + ow) * b.k));
      shade.push(capHull(a, ra, b, rb));
    }
    const oa = 0.13 * ra,
      ob = 0.13 * rb;
    if (part.root && ci === 0) light.push(capHull(a, ra * 0.98, b, rb * 0.84));
    else light.push(capHull({x: a.x + LDIR.x * oa, y: a.y + LDIR.y * oa}, ra * 0.84, {x: b.x + LDIR.x * ob, y: b.y + LDIR.y * ob}, rb * 0.84));
  });
  if (part.poly) {
    let pp = part.poly.map((p) => pr(p) as P2);
    // same winding as the capsule hulls, so the nonzero fill rule unions everything
    if (ink.length && area(ink[0]) * area(pp) < 0) pp = pp.slice().reverse();
    ink.push(pp);
    shade.push(pp);
    const o = (0.13 * rsum) / Math.max(1, rn);
    light.push(pp.map((q) => ({x: q.x + LDIR.x * o, y: q.y + LDIR.y * o})));
  }
  let root;
  if (part.root) {
    const r = pr(part.root.p);
    root = {x: r.x, y: r.y, r: (part.root.r + ow) * r.k * 1.06};
  }
  return {ink: pathOf(ink), shade: pathOf(shade), light: pathOf(light), root};
}

/** whole hand: base layer, then separated (lifted) fingers sorted far -> near,
 *  then the base again clipped round the roots of lifted fingers, so they grow out of the hand */
export const HandSVG: React.FC<{rig: Rig; pr: Proj; ow: number; xray?: number; camPos: V3; id: string; backdrop?: React.ReactNode}> = ({rig, pr, ow, xray = 0, camPos, id, backdrop}) => {
  const dist = (p: Part) => {
    const c = p.caps[Math.floor(p.caps.length / 2)];
    const d = sub(mul(add(c.a, c.b), 0.5), camPos);
    return dot(d, d);
  };
  const base = rig.parts.filter((p) => !p.sep).map((p) => partPasses(p, pr, ow));
  const sep = rig.parts
    .filter((p) => p.sep)
    .sort((a, b) => dist(b) - dist(a))
    .map((p) => partPasses(p, pr, ow));
  const x = xray > 0.5;
  const draw = (ps: Passes, i: number) =>
    x ? (
      <g key={i}>
        <path d={ps.ink} fill="#7FE6FF" />
        <path d={ps.shade} fill="#1A4A73" />
      </g>
    ) : (
      <g key={i}>
        <path d={ps.ink} fill={INK} />
        <path d={ps.shade} fill={SHADE} />
        <path d={ps.light} fill={LIGHT} />
      </g>
    );
  return (
    <g>
      {base.map(draw)}
      {sep.map((ps, i) => {
        if (!ps.root) return draw(ps, i);
        const mid = `rootmask${id}${i}`;
        return (
          <g key={'s' + i}>
            <mask id={mid} maskUnits="userSpaceOnUse" x={-200} y={-200} width={1480} height={2320}>
              <rect x={-200} y={-200} width={1480} height={2320} fill="#fff" />
              <circle cx={ps.root.x} cy={ps.root.y} r={ps.root.r} fill="#000" />
            </mask>
            <g mask={`url(#${mid})`}>
              <path d={ps.ink} fill={x ? '#7FE6FF' : INK} />
              <path d={ps.shade} fill={x ? '#1A4A73' : SHADE} />
            </g>
            {x ? <path d={ps.shade} fill="#1A4A73" mask={`url(#${mid})`} /> : <path d={ps.light} fill={LIGHT} />}
          </g>
        );
      })}
    </g>
  );
};

// ---------- shadows on the table ----------
const LT: V3 = [0.32, 0, 0.38]; // shadow shift per cm of height
const onTable = (p: V3): V3 => [p[0] + LT[0] * p[1], 0, p[2] + LT[2] * p[1]];
export function shadowPath(rig: Rig, pr: Proj): string {
  const polys: P2[][] = [];
  for (const part of rig.parts) {
    for (const c of part.caps) {
      if (c.a[2] < -30) continue;
      const a = pr(onTable(c.a)),
        b = pr(onTable(c.b));
      polys.push(capHull(a, c.ra * a.k * 0.95, b, c.rb * b.k * 0.95));
    }
    if (part.poly) {
      let pp = part.poly.map((p) => pr(onTable(p)) as P2);
      if (area(pp) * area(polys[0]) < 0) pp = pp.reverse();
      polys.push(pp);
    }
  }
  return pathOf(polys);
}
/** soft dark spots right under the parts that touch the table */
export function contactPath(rig: Rig, pr: Proj): string {
  const polys: P2[][] = [];
  for (const part of rig.parts)
    for (const c of part.caps)
      for (const [p, r] of [
        [c.a, c.ra],
        [c.b, c.rb],
      ] as [V3, number][]) {
        const gap = p[1] - r;
        if (gap < 0.5) {
          const q = pr([p[0] + 0.1, 0, p[2] + 0.15]);
          const s = r * q.k * (1.05 - gap);
          polys.push(capHull({x: q.x - s * 0.5, y: q.y}, s * 0.55, {x: q.x + s * 0.5, y: q.y}, s * 0.55));
        }
      }
  return pathOf(polys);
}

// ---------- table ----------
export const TABLE = '#E3AA6C';
export const TableSVG: React.FC<{pr: Proj}> = ({pr}) => {
  const lines: {d: string; w: number; c: string}[] = [];
  const line = (x: number, wob: number, seed: number) => {
    const pts: P2[] = [];
    for (let z = 45; z >= -400; z -= z > -60 ? 5 : 20) {
      const q = pr([x + wob * Math.sin(z * 0.06 + seed) + wob * 0.5 * Math.sin(z * 0.17 + seed * 2), 0, z]);
      if (q.z > 3) pts.push(q);
    }
    return pts.length > 1 ? 'M' + pts.map((q) => q.x.toFixed(1) + ',' + q.y.toFixed(1)).join('L') : '';
  };
  const seams = [-38, -24, -10.5, 9.5, 23.5, 37];
  for (const x of seams) lines.push({d: line(x, 0, 0), w: 0.28, c: '#BE7E45'});
  let s = 1;
  for (let i = 0; i < seams.length - 1; i++)
    for (let j = 1; j <= 3; j++) {
      const x = seams[i] + ((seams[i + 1] - seams[i]) * j) / 4 + Math.sin(s * 3.1) * 1.2;
      lines.push({d: line(x, 0.6, s++), w: 0.11, c: '#D69A5C'});
    }
  // stroke widths are in world cm -> approximate with the scale at the hand
  const k = pr([0, 0, 0]).k;
  return (
    <g>
      <rect x={-50} y={-50} width={1180} height={2020} fill={TABLE} />
      {lines.map((l, i) => (
        <path key={i} d={l.d} stroke={l.c} strokeWidth={l.w * k} fill="none" strokeLinecap="round" />
      ))}
    </g>
  );
};
