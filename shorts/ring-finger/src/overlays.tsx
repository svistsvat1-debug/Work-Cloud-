import React from 'react';
import {P2, V3, clamp, lerp, popIn, easeOutBack, add, mul} from './math';
import {Proj, INK} from './draw';
import {Rig, backHeight, FingerName} from './hand';

export const FONT = 'Fredoka, sans-serif';

// ---------------------------------------------------------------- face on a finger
export type Expr = {
  scale: number; // 0 hidden .. 1
  lookX: number; // -1..1
  lookY: number;
  lid: number; // 0 open .. 1 closed
  squeeze: number; // 0..1 -> "> <"
  browTilt: number; // deg, + = worried (inner ends up), - = effort/angry
  browRaise: number; // 0..1
  sweat: number; // -1 none, 0..1 slide progress
  effort: number; // 0..1 effort lines
  wide: number; // extra eye size
};
export const EXPR0: Expr = {scale: 0, lookX: 0, lookY: 0, lid: 0, squeeze: 0, browTilt: 0, browRaise: 0, sweat: -1, effort: 0, wide: 0};

export function faceFrame(rig: Rig, pr: Proj, finger: FingerName) {
  const d = rig.dorsal[finger];
  const j = rig.joints[finger];
  const anchor3 = add(mul(d[1], 0.5), mul(d[2], 0.5));
  const a = pr(anchor3);
  const root = pr(j[0]);
  let ux = root.x - a.x,
    uy = root.y - a.y;
  const l = Math.hypot(ux, uy) || 1;
  ux /= l;
  uy /= l;
  if (uy > 0) {
    ux = -ux;
    uy = -uy;
  }
  const ang = (Math.atan2(ux, -uy) * 180) / Math.PI;
  const s = rig.radii[finger][1] * a.k;
  return {x: a.x, y: a.y, ang, s};
}

export const Face: React.FC<{f: {x: number; y: number; ang: number; s: number}; e: Expr; t: number}> = ({f, e, t}) => {
  if (e.scale <= 0.001) return null;
  const s = f.s;
  const rx = 0.33 * s * (1 + e.wide),
    ry = 0.43 * s * (1 + e.wide);
  const sep = 0.42 * s;
  const ow = Math.max(2.5, 0.085 * s);
  const eye = (side: -1 | 1) => {
    const cx = side * sep;
    const id = `eye${side}`;
    if (e.squeeze > 0.5) {
      const w = 0.24 * s,
        h = 0.24 * s;
      const pts = side < 0 ? [[cx - w, -h], [cx + w * 0.7, 0], [cx - w, h]] : [[cx + w, -h], [cx - w * 0.7, 0], [cx + w, h]];
      return <polyline key={id} points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke={INK} strokeWidth={ow * 1.5} strokeLinecap="round" strokeLinejoin="round" />;
    }
    const px = cx + e.lookX * 0.13 * s,
      py = e.lookY * 0.15 * s;
    return (
      <g key={id}>
        <clipPath id={id}>
          <ellipse cx={cx} cy={0} rx={rx} ry={ry} />
        </clipPath>
        <ellipse cx={cx} cy={0} rx={rx} ry={ry} fill="#fff" stroke={INK} strokeWidth={ow} />
        <g clipPath={`url(#${id})`}>
          <circle cx={px} cy={py + 0.03 * s} r={0.19 * s} fill={INK} />
          <circle cx={px - 0.07 * s} cy={py - 0.05 * s} r={0.065 * s} fill="#fff" />
          {e.lid > 0.01 && <rect x={cx - rx - 2} y={-ry - 2} width={2 * rx + 4} height={(2 * ry + 4) * e.lid} fill="#E6EBF2" />}
        </g>
        {e.lid > 0.01 && (
          <line x1={cx - rx} x2={cx + rx} y1={-ry + 2 * ry * e.lid} y2={-ry + 2 * ry * e.lid} stroke={INK} strokeWidth={ow} strokeLinecap="round" />
        )}
        <ellipse cx={cx} cy={0} rx={rx} ry={ry} fill="none" stroke={INK} strokeWidth={ow} />
      </g>
    );
  };
  const brow = (side: -1 | 1) => {
    const cx = side * sep,
      cy = -ry - 0.2 * s - e.browRaise * 0.16 * s;
    const tilt = side * e.browTilt; // + tilt: inner end (towards centre) goes up
    return (
      <path
        key={'b' + side}
        d={`M${cx - 0.22 * s},${cy + 0.03 * s} Q${cx},${cy - 0.07 * s} ${cx + 0.22 * s},${cy + 0.03 * s}`}
        transform={`rotate(${tilt} ${cx} ${cy})`}
        fill="none"
        stroke={INK}
        strokeWidth={ow * 1.45}
        strokeLinecap="round"
      />
    );
  };
  const sweat = () => {
    if (e.sweat < 0 || e.sweat > 1) return null;
    const u = e.sweat;
    const sc = popIn(u, 0, 0.18) * (u > 0.85 ? 1 - (u - 0.85) / 0.15 : 1);
    const x = 0.95 * s + 0.05 * s * u,
      y = -0.25 * s + 0.75 * s * u;
    const r = 0.13 * s;
    return (
      <g transform={`translate(${x} ${y}) scale(${sc})`}>
        <path d={`M0,${-2.2 * r} C${0.5 * r},${-1.2 * r} ${r},${-0.4 * r} ${r},${0.2 * r} A${r},${r} 0 1 1 ${-r},${0.2 * r} C${-r},${-0.4 * r} ${-0.5 * r},${-1.2 * r} 0,${-2.2 * r}Z`} fill="#8FD6FF" stroke={INK} strokeWidth={ow * 0.8} />
        <circle cx={-0.35 * r} cy={0.05 * r} r={0.22 * r} fill="#fff" />
      </g>
    );
  };
  const effort = () => {
    if (e.effort <= 0.01) return null;
    const on = Math.floor(t * 12) % 2 === 0 ? 1 : 0.75;
    const ls = [];
    for (const side of [-1, 1])
      for (let i = 0; i < 3; i++) {
        const a = (-35 + i * 32) * (Math.PI / 180);
        const r0 = 0.95 * s,
          r1 = (1.2 + 0.12 * on) * s;
        const dx = Math.cos(a) * side,
          dy = Math.sin(a);
        ls.push(
          <line key={side + '' + i} x1={dx * r0} y1={dy * r0 - 0.1 * s} x2={dx * r1} y2={dy * r1 - 0.1 * s} stroke={INK} strokeWidth={ow * 1.1} strokeLinecap="round" opacity={e.effort} />,
        );
      }
    return <g>{ls}</g>;
  };
  return (
    <g transform={`translate(${f.x} ${f.y}) rotate(${f.ang}) scale(${e.scale})`}>
      {effort()}
      {eye(-1)}
      {eye(1)}
      {brow(-1)}
      {brow(1)}
      {sweat()}
    </g>
  );
};

// ---------------------------------------------------------------- caption
export const Caption: React.FC<{lines: string[]; y: number; t: number; t0: number; t1: number; size?: number; color?: string}> = ({lines, y, t, t0, t1, size = 84, color = '#fff'}) => {
  if (t < t0 || t > t1) return null;
  const sIn = t0 <= 0 ? 1 : popIn(t, t0, 0.24);
  const sOut = t > t1 - 0.12 ? Math.max(0, (t1 - t) / 0.12) : 1;
  const sc = 0.55 + 0.45 * sIn;
  const op = Math.min(1, sIn * 3) * sOut;
  const lh = size * 1.08;
  const y0 = y - ((lines.length - 1) * lh) / 2;
  return (
    <g transform={`translate(540 ${y}) scale(${sc * (0.9 + 0.1 * sOut)}) translate(-540 ${-y})`} opacity={op}>
      {lines.map((l, i) => (
        <text
          key={i}
          x={540}
          y={y0 + i * lh}
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily={FONT}
          fontWeight={700}
          fontSize={size}
          fill={color}
          stroke={INK}
          strokeWidth={size * 0.2}
          strokeLinejoin="round"
          paintOrder="stroke"
          letterSpacing={1}
        >
          {l}
        </text>
      ))}
    </g>
  );
};

// ---------------------------------------------------------------- badges & chips
export const Badge: React.FC<{x: number; y: number; r: number; kind: 'ok' | 'q' | 'no' | 'plus'; sc?: number}> = ({x, y, r, kind, sc = 1}) => {
  if (sc <= 0.001) return null;
  const fill = kind === 'ok' || kind === 'plus' ? '#43D17A' : kind === 'q' ? '#FFD23F' : '#FF5A5F';
  const w = r * 0.2;
  let glyph;
  if (kind === 'ok') glyph = <polyline points={`${-0.45 * r},${0.02 * r} ${-0.12 * r},${0.36 * r} ${0.5 * r},${-0.34 * r}`} fill="none" stroke="#fff" strokeWidth={w * 1.25} strokeLinecap="round" strokeLinejoin="round" />;
  else if (kind === 'no')
    glyph = (
      <g stroke="#fff" strokeWidth={w * 1.25} strokeLinecap="round">
        <line x1={-0.36 * r} y1={-0.36 * r} x2={0.36 * r} y2={0.36 * r} />
        <line x1={0.36 * r} y1={-0.36 * r} x2={-0.36 * r} y2={0.36 * r} />
      </g>
    );
  else if (kind === 'plus')
    glyph = (
      <g stroke="#fff" strokeWidth={w * 1.25} strokeLinecap="round">
        <line x1={0} y1={-0.42 * r} x2={0} y2={0.42 * r} />
        <line x1={-0.42 * r} y1={0} x2={0.42 * r} y2={0} />
      </g>
    );
  else
    glyph = (
      <text x={0} y={0.04 * r} textAnchor="middle" dominantBaseline="central" fontFamily={FONT} fontWeight={700} fontSize={r * 1.35} fill={INK}>
        ?
      </text>
    );
  return (
    <g transform={`translate(${x} ${y}) scale(${sc})`}>
      <circle r={r} fill={fill} stroke={INK} strokeWidth={Math.max(3, r * 0.14)} />
      {glyph}
    </g>
  );
};

export type ChipState = {label: string; kind: 'none' | 'ok' | 'q' | 'no'; since: number};
export const Chips: React.FC<{chips: ChipState[]; t: number; t0: number; t1: number}> = ({chips, t, t0, t1}) => {
  if (t < t0 || t > t1 + 0.3) return null;
  const W = 232,
    H = 92,
    G = 16;
  const x0 = 540 - (chips.length * W + (chips.length - 1) * G) / 2;
  return (
    <g>
      {chips.map((c, i) => {
        const sIn = popIn(t, t0 + i * 0.07, 0.3);
        const sOut = t > t1 ? Math.max(0, 1 - (t - t1) / 0.2) : 1;
        const bump = c.kind !== 'none' ? 1 + 0.18 * Math.max(0, 1 - (t - c.since) / 0.25) * (t >= c.since ? 1 : 0) : 1;
        const cx = x0 + i * (W + G) + W / 2,
          cy = 165;
        const bg = c.kind === 'ok' ? '#E3FBEA' : c.kind === 'no' ? '#FFE3E3' : c.kind === 'q' ? '#FFF6D6' : '#FFFFFF';
        return (
          <g key={i} transform={`translate(${cx} ${cy}) scale(${sIn * sOut * bump})`}>
            <rect x={-W / 2} y={-H / 2} width={W} height={H} rx={H / 2} fill={bg} stroke={INK} strokeWidth={6} />
            <text x={-W / 2 + 26} y={2} dominantBaseline="central" fontFamily={FONT} fontWeight={700} fontSize={38} fill={INK}>
              {c.label}
            </text>
            {c.kind !== 'none' && <Badge x={W / 2 - 40} y={0} r={27} kind={c.kind} sc={popIn(t, c.since, 0.25)} />}
            {c.kind === 'none' && <circle cx={W / 2 - 40} cy={0} r={22} fill="none" stroke="#B9C0CC" strokeWidth={5} strokeDasharray="7 7" />}
          </g>
        );
      })}
    </g>
  );
};

// ---------------------------------------------------------------- try-it timer bar
export const TimerBar: React.FC<{t: number; t0: number; t1: number; y: number}> = ({t, t0, t1, y}) => {
  if (t < t0 || t > t1 + 0.15) return null;
  const sc = popIn(t, t0, 0.25) * (t > t1 ? Math.max(0, 1 - (t - t1) / 0.15) : 1);
  const u = clamp((t - t0 - 0.1) / (t1 - t0 - 0.15));
  const W = 440,
    H = 46;
  return (
    <g transform={`translate(540 ${y}) scale(${sc})`}>
      <rect x={-W / 2} y={-H / 2} width={W} height={H} rx={H / 2} fill="#fff" stroke={INK} strokeWidth={6} />
      <clipPath id="tbar">
        <rect x={-W / 2 + 7} y={-H / 2 + 7} width={W - 14} height={H - 14} rx={(H - 14) / 2} />
      </clipPath>
      <rect x={-W / 2 + 7} y={-H / 2 + 7} width={(W - 14) * u} height={H - 14} fill="#FFB238" clipPath="url(#tbar)" />
    </g>
  );
};

// ---------------------------------------------------------------- YES / NO buttons
export const YesNo: React.FC<{t: number; t0: number; tNo: number; t1: number; y: number}> = ({t, t0, tNo, t1, y}) => {
  if (t < t0 || t > t1 + 0.2) return null;
  const out = t > t1 ? Math.max(0, 1 - (t - t1) / 0.2) : 1;
  const b = (x: number, label: string, fill: string, ts: number) => {
    const sc = popIn(t, ts, 0.3) * out;
    const wob = 1 + 0.04 * Math.sin((t - ts) * 9) * Math.exp(-(t - ts) * 2) * (t > ts ? 1 : 0);
    return (
      <g transform={`translate(${x} ${y}) scale(${sc * wob})`}>
        <rect x={-150} y={-62} width={300} height={124} rx={62} fill={fill} stroke={INK} strokeWidth={8} />
        <text x={0} y={4} textAnchor="middle" dominantBaseline="central" fontFamily={FONT} fontWeight={700} fontSize={70} fill="#fff" stroke={INK} strokeWidth={12} paintOrder="stroke" strokeLinejoin="round">
          {label}
        </text>
      </g>
    );
  };
  return (
    <g>
      {b(355, 'YES', '#43D17A', t0)}
      {b(725, 'NO', '#FF5A5F', tNo)}
    </g>
  );
};

// ---------------------------------------------------------------- x-ray anatomy (on the top view)
const forearmTop = (rig: Rig, z: number) => {
  for (const c of rig.forearm) {
    const za = c.a[2],
      zb = c.b[2];
    if (z <= za && z >= zb) {
      const u = (za - z) / (za - zb);
      return {y: lerp(c.a[1], c.b[1], u) + lerp(c.ra, c.rb, u), x: lerp(c.a[0], c.b[0], u)};
    }
  }
  return {y: 4.5, x: 0};
};
const surf = (rig: Rig, x: number, z: number): V3 => {
  if (z <= -10.8) {
    const f = forearmTop(rig, z);
    return [x + f.x, f.y - 0.1, z];
  }
  return [x, backHeight(rig, z), z];
};
const smooth = (ps: P2[]) => {
  if (ps.length < 3) return 'M' + ps.map((p) => `${p.x},${p.y}`).join('L');
  let d = `M${ps[0].x.toFixed(1)},${ps[0].y.toFixed(1)}`;
  for (let i = 1; i < ps.length - 1; i++) {
    const m = {x: (ps[i].x + ps[i + 1].x) / 2, y: (ps[i].y + ps[i + 1].y) / 2};
    d += ` Q${ps[i].x.toFixed(1)},${ps[i].y.toFixed(1)} ${m.x.toFixed(1)},${m.y.toFixed(1)}`;
  }
  const l = ps[ps.length - 1];
  return d + ` L${l.x.toFixed(1)},${l.y.toFixed(1)}`;
};

type TendonDef = {finger: FingerName; start: [number, number]; wrist: number};
const ED: TendonDef[] = [
  {finger: 'index', start: [0.35, -17.5], wrist: 0.75},
  {finger: 'middle', start: [0.1, -17.2], wrist: 0.25},
  {finger: 'ring', start: [-0.2, -17.2], wrist: -0.25},
  {finger: 'pinky', start: [-0.45, -17.5], wrist: -0.75},
];

function tendonPts(rig: Rig, start: [number, number], wristX: number, finger: FingerName, side = 0): V3[] {
  const j = rig.joints[finger],
    d = rig.dorsal[finger];
  const mcpX = j[0][0] + side;
  const pts: V3[] = [surf(rig, start[0], start[1]), surf(rig, wristX, -11.4), surf(rig, lerp(wristX, mcpX, 0.55), -5.5), surf(rig, lerp(wristX, mcpX, 0.9), -1.8)];
  pts.push(add(d[0], [side, 0.05, 0]));
  pts.push(add(d[1], [side * 0.5, 0.05, 0]));
  if (finger !== 'middle') pts.push(add(add(mul(d[1], 0.4), mul(d[2], 0.6)), [0, 0.05, 0]));
  return pts;
}
/** point on a 3D polyline at a given z (first crossing) */
function atZ(pts: V3[], z: number): V3 {
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i],
      b = pts[i + 1];
    if ((a[2] - z) * (b[2] - z) <= 0 && a[2] !== b[2]) {
      const u = (z - a[2]) / (b[2] - a[2]);
      return [lerp(a[0], b[0], u), lerp(a[1], b[1], u), z];
    }
  }
  return pts[pts.length - 1];
}

function spindle(rig: Rig, pr: Proj, x0: number, z0: number, x1: number, z1: number, w: number): P2[] {
  const L: P2[] = [],
    R: P2[] = [];
  for (let i = 0; i <= 18; i++) {
    const u = i / 18;
    const x = lerp(x0, x1, u),
      z = lerp(z0, z1, u);
    const hw = w * Math.pow(Math.sin(Math.PI * u), 0.75) + 0.04;
    L.push(pr(surf(rig, x - hw, z)));
    R.push(pr(surf(rig, x + hw, z)));
  }
  return L.concat(R.reverse());
}
const polyD = (ps: P2[]) => 'M' + ps.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join('L') + 'Z';
const centroid = (ps: P2[]) => ({x: ps.reduce((s, p) => s + p.x, 0) / ps.length, y: ps.reduce((s, p) => s + p.y, 0) / ps.length});

export type XrayState = {
  muscle: number; // pop progress of the shared muscle
  tendons: number; // draw progress 0..1
  bands: number; // pop of the juncturae
  leash: number; // 0..1 highlight of middle tendon + ring band
  twang: number; // band wobble (cm)
  backup: number; // pop of the two extra muscles
  ringNo: number; // ring tendon red flash 0..1
  time: number;
};

export const Anatomy: React.FC<{rig: Rig; pr: Proj; s: XrayState}> = ({rig, pr, s}) => {
  const k = pr(surf(rig, 0, -8)).k;
  const items: React.ReactNode[] = [];
  // muscles
  const muscle = (key: string, ps: P2[], sc: number, fill: string, stroke: string, glow = 0) => {
    if (sc <= 0.001) return;
    const c = centroid(ps);
    items.push(
      <g key={key} transform={`translate(${c.x} ${c.y}) scale(${sc}) translate(${-c.x} ${-c.y})`}>
        {glow > 0 && <path d={polyD(ps)} fill="none" stroke={fill} strokeWidth={0.5 * k} opacity={0.35 * glow} filter="url(#glow)" />}
        <path d={polyD(ps)} fill={fill} stroke={stroke} strokeWidth={0.14 * k} strokeLinejoin="round" />
        {[0.3, 0.5, 0.7].map((u) => {
          const i = Math.round(u * 18);
          const a = ps[i],
            b = ps[ps.length - 1 - i];
          return <line key={u} x1={lerp(a.x, b.x, 0.25)} y1={lerp(a.y, b.y, 0.25)} x2={lerp(a.x, b.x, 0.75)} y2={lerp(a.y, b.y, 0.75)} stroke={stroke} strokeOpacity={0.35} strokeWidth={0.08 * k} strokeLinecap="round" />;
        })}
      </g>,
    );
  };
  const tendon = (key: string, pts3: V3[], prog: number, color: string, edge: string, w = 0.42, glow = 0) => {
    if (prog <= 0.001) return;
    const d = smooth(pts3.map((p) => pr(p)));
    items.push(
      <g key={key}>
        {glow > 0 && <path d={d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - prog} fill="none" stroke={color} strokeWidth={(w + 0.5) * k} opacity={0.45 * glow} strokeLinecap="round" filter="url(#glow)" />}
        <path d={d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - prog} fill="none" stroke={edge} strokeWidth={(w + 0.16) * k} strokeLinecap="round" strokeLinejoin="round" />
        <path d={d} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - prog} fill="none" stroke={color} strokeWidth={w * k} strokeLinecap="round" strokeLinejoin="round" />
      </g>,
    );
  };

  const edPts = ED.map((td) => tendonPts(rig, td.start, td.wrist, td.finger));
  // shared muscle (extensor digitorum)
  muscle('ed', spindle(rig, pr, -0.35, -32, -0.15, -17, 0.95), s.muscle, '#FF5C7A', '#8E1531', 0.6 * s.muscle);
  // backup muscles: extensor indicis (thumb side) and extensor digiti minimi (little-finger side)
  const bk = s.backup;
  muscle('ei', spindle(rig, pr, 1.35, -24.5, 1.15, -14.5, 0.5), bk, '#4BE38A', '#11703C', bk);
  muscle('edm', spindle(rig, pr, -1.95, -31, -1.65, -17, 0.5), bk, '#4BE38A', '#11703C', bk);

  ED.forEach((td, i) => {
    const hl = td.finger === 'middle' || td.finger === 'ring' ? 1 : 0.75;
    let col = hl === 1 ? '#FFF1C4' : '#E9DDB4';
    let glow = 0;
    if (td.finger === 'middle' && s.leash > 0) glow = s.leash;
    if (td.finger === 'ring' && s.ringNo > 0) {
      col = s.ringNo > 0.5 ? '#FF8A8E' : col;
      glow = s.ringNo;
    }
    tendon('t' + i, edPts[i], s.tendons, col, '#8A6A2A', 0.42, glow);
  });
  if (bk > 0.01) {
    tendon('tei', tendonPts(rig, [1.15, -14.5], 0.95, 'index', -0.38), clamp(bk * 1.4 - 0.4), '#B9F7CF', '#11703C', 0.3, 0.6);
    tendon('tedm', tendonPts(rig, [-1.65, -17], -1.05, 'pinky', 0.32), clamp(bk * 1.4 - 0.4), '#B9F7CF', '#11703C', 0.3, 0.6);
  }
  // juncturae tendinum: little bands tying the ring tendon to its neighbours
  if (s.bands > 0.001) {
    const band = (key: string, a: V3, b: V3, hot: number) => {
      const pa = pr(a),
        pb = pr(b);
      const mx = (pa.x + pb.x) / 2,
        my = (pa.y + pb.y) / 2;
      const nx = -(pb.y - pa.y),
        ny = pb.x - pa.x;
      const nl = Math.hypot(nx, ny) || 1;
      const off = s.twang * k * (key === 'b1' ? 1 : 0.4);
      const d = `M${pa.x},${pa.y} Q${mx + (nx / nl) * off},${my + (ny / nl) * off} ${pb.x},${pb.y}`;
      const sc = s.bands;
      const w = (0.34 + 0.2 * hot) * k * sc;
      items.push(
        <g key={key}>
          {hot > 0 && <path d={d} fill="none" stroke="#FF6B3D" strokeWidth={w + 0.7 * k} opacity={0.5 * hot} strokeLinecap="round" filter="url(#glow)" />}
          <path d={d} fill="none" stroke="#7A3A00" strokeWidth={w + 0.16 * k} strokeLinecap="round" />
          <path d={d} fill="none" stroke={hot > 0.5 ? '#FF7A3D' : '#FFB238'} strokeWidth={w} strokeLinecap="round" />
          {hot > 0.5 && <path d={d} fill="none" stroke="#FFE2C4" strokeWidth={w * 0.35} strokeDasharray={`${0.25 * k} ${0.25 * k}`} strokeLinecap="round" />}
        </g>,
      );
    };
    band('b1', atZ(edPts[2], -2.4), atZ(edPts[1], -3.4), s.leash);
    band('b2', atZ(edPts[2], -2.8), atZ(edPts[3], -3.8), 0);
  }
  // "pull" arrows on the middle tendon while the folded finger holds it
  if (s.leash > 0.05) {
    const mp = edPts[1];
    for (let i = 0; i < 3; i++) {
      const u = (((s.time * 0.9 + i / 3) % 1) + 1) % 1;
      const z = lerp(-9, -1.2, u);
      const a = pr(add(atZ(mp, z), [0, 0.3, 0])),
        b = pr(add(atZ(mp, z + 0.6), [0, 0.3, 0]));
      const dx = b.x - a.x,
        dy = b.y - a.y,
        l = Math.hypot(dx, dy) || 1;
      const ux = dx / l,
        uy = dy / l;
      const sz = 0.38 * k;
      const op = Math.sin(Math.PI * u) * s.leash;
      items.push(
        <polyline
          key={'ar' + i}
          points={`${a.x - ux * sz - uy * sz},${a.y - uy * sz + ux * sz} ${a.x},${a.y} ${a.x - ux * sz + uy * sz},${a.y - uy * sz - ux * sz}`}
          fill="none"
          stroke="#FF6B3D"
          strokeWidth={0.16 * k}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={op}
        />,
      );
    }
  }
  return <g>{items}</g>;
};

export function knucklePos(rig: Rig, pr: Proj, f: FingerName, lift = 1.6) {
  const p = pr(add(rig.dorsal[f][0], [0, lift, -1.2]));
  return p;
}
export {easeOutBack};
