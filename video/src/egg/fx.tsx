import React from 'react';
import {AbsoluteFill, staticFile} from 'remotion';
import {Puffs, Svg, clamp, easeOutBack, easeOutCubic, lerp, prog, rnd, wobble} from './lib';
import {SPR} from './sprites';

const INK = '#141414';

// ---------- screen-space backgrounds ----------
export const VoidSky: React.FC<{dark?: number}> = ({dark = 0}) => (
  <AbsoluteFill style={{background: 'linear-gradient(180deg, #E4DCFF 0%, #F1E9FF 38%, #FFF3E2 78%, #FFE9CF 100%)'}}>
    {dark > 0 ? <AbsoluteFill style={{background: '#1E1838', opacity: dark}} /> : null}
  </AbsoluteFill>
);

// little 4-point sparkles drifting slowly (screen space, parallax via `drift`)
export const Sparkles: React.FC<{t: number; n?: number; color?: string; drift?: number[]; seed?: number; opacity?: number}> = (
  {t, n = 26, color = '#F6D365', drift = [0, 0], seed = 1, opacity = 1}) => (
  <AbsoluteFill style={{opacity}}>
    <svg width={1080} height={1920}>
      {Array.from({length: n}).map((_, i) => {
        const x = ((rnd(i, seed) * 1180 + drift[0] * (0.4 + rnd(i, seed + 3)) + t * 6 * (rnd(i, seed + 5) - 0.5)) % 1180 + 1180) % 1180 - 50;
        const y = ((rnd(i, seed + 1) * 2020 + drift[1] * (0.4 + rnd(i, seed + 3)) - t * 14 * (0.3 + rnd(i, seed + 2))) % 2020 + 2020) % 2020 - 50;
        const s = (5 + 9 * rnd(i, seed + 4)) * (0.65 + 0.35 * Math.sin(t * (1.5 + rnd(i, seed + 6) * 2) + i));
        const d = `M ${x} ${y - s} Q ${x} ${y} ${x + s} ${y} Q ${x} ${y} ${x} ${y + s} Q ${x} ${y} ${x - s} ${y} Q ${x} ${y} ${x} ${y - s} Z`;
        return <path key={i} d={d} fill={color} stroke="#B8902A" strokeWidth={1.2} opacity={0.85} />;
      })}
    </svg>
  </AbsoluteFill>
);

// ---------- god rays (world) ----------
export const Rays: React.FC<{x: number; y: number; r: number; t: number; n?: number; opacity?: number; color?: string; spin?: number}> = (
  {x, y, r, t, n = 14, opacity = 1, color = '#FFE7A0', spin = 6}) => {
  const paths = [];
  for (let i = 0; i < n; i++) {
    const a0 = ((i / n) * 360 + t * spin) * Math.PI / 180;
    const a1 = a0 + (Math.PI / n) * 0.9;
    paths.push(<path key={i} d={`M ${x} ${y} L ${x + r * Math.cos(a0)} ${y + r * Math.sin(a0)} L ${x + r * Math.cos(a1)} ${y + r * Math.sin(a1)} Z`} fill={color} />);
  }
  return (
    <Svg opacity={opacity}>
      <defs>
        <radialGradient id={`rg${Math.round(x)}${Math.round(y)}`} cx={x} cy={y} r={r} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.9} />
          <stop offset="0.35" stopColor="#FFFFFF" stopOpacity={0.55} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </radialGradient>
        <mask id={`rm${Math.round(x)}${Math.round(y)}`}>
          <circle cx={x} cy={y} r={r} fill={`url(#rg${Math.round(x)}${Math.round(y)})`} />
        </mask>
      </defs>
      <g mask={`url(#rm${Math.round(x)}${Math.round(y)})`}>{paths}</g>
    </Svg>
  );
};

export const Glow: React.FC<{x: number; y: number; r: number; color?: string; opacity?: number; id: string}> = (
  {x, y, r, color = '#FFF6C8', opacity = 1, id}) => (
  <Svg opacity={opacity}>
    <defs>
      <radialGradient id={id} cx={x} cy={y} r={r} gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor={color} stopOpacity={0.95} />
        <stop offset="0.45" stopColor={color} stopOpacity={0.45} />
        <stop offset="1" stopColor={color} stopOpacity={0} />
      </radialGradient>
    </defs>
    <circle cx={x} cy={y} r={r} fill={`url(#${id})`} />
  </Svg>
);

// ---------- clouds: merged-outline puffs ----------
export const CloudBank: React.FC<{x0: number; x1: number; y: number; r: number; seed?: number; t?: number; line?: number}> = (
  {x0, x1, y, r, seed = 3, t = 0, line = 9}) => {
  const circles: number[][] = [];
  const shade: number[][] = [];
  const step = r * 0.95;
  for (let i = 0, x = x0; x < x1; i++, x += step) {
    const rr = r * (0.75 + 0.55 * rnd(i, seed));
    const yy = y - rr * 0.35 + Math.sin(t * 0.6 + i) * r * 0.03;
    circles.push([x, yy, rr]);
    shade.push([x + rr * 0.12, yy + rr * 0.16, rr * 0.86, '#E3E6F3' as unknown as number]);
  }
  // body below the bumps
  circles.push([0, 0, 0]);
  return (
    <>
      <Svg>
        {circles.map((c, i) => c[2] > 0 ? <circle key={'i' + i} cx={c[0]} cy={c[1]} r={c[2] + line} fill={INK} /> : null)}
        <rect x={x0 - r} y={y} width={x1 - x0 + 2 * r} height={r * 6} fill={INK} />
        {circles.map((c, i) => c[2] > 0 ? <circle key={'f' + i} cx={c[0]} cy={c[1]} r={c[2]} fill="#FFFFFF" /> : null)}
        {shade.map((c, i) => <circle key={'s' + i} cx={c[0]} cy={c[1]} r={c[2]} fill="#E9ECF7" />)}
        <rect x={x0 - r + line} y={y} width={x1 - x0 + 2 * r - 2 * line} height={r * 6} fill="#E9ECF7" />
      </Svg>
    </>
  );
};

// ---------- small things ----------
// steam from a mug: pulses of outlined white puffs that rise, grow, drift and shrink away
export const Steam: React.FC<{x: number; y: number; t: number; scale?: number; until?: number}> = ({x, y, t, scale = 1, until = 99}) => {
  const circles: number[][] = [];
  for (let j = 0; j < 3; j++) {
    for (let k = 0; k < 4; k++) {
      const period = 1.6;
      const born = k * 0.4 + j * 0.13;
      const age = ((t - born) % period + period) % period;
      const tb = t - age;
      if (tb > until || age > 1.25) continue;
      const u = age / 1.25;
      const r = scale * 15 * Math.sin(Math.PI * Math.min(1, u * 1.15)) * (0.8 + 0.3 * rnd(j * 7 + k, 2));
      circles.push([x + scale * (j - 1) * 16 + scale * 12 * Math.sin(age * 3 + j), y - scale * (10 + 120 * u), r]);
    }
  }
  return <Puffs circles={circles} fill="#FFFFFF" line={3.5 * scale} />;
};

// coffee droplets launched at t0 from (x, y), gravity in world units
export const Droplets: React.FC<{x: number; y: number; t: number; t0: number; n?: number; scale?: number}> = ({x, y, t, t0, n = 9, scale = 1}) => {
  if (t < t0 || t > t0 + 1.4) return null;
  const dt = t - t0;
  return (
    <Svg>
      {Array.from({length: n}).map((_, i) => {
        const ang = (-150 + 120 * rnd(i, 4)) * Math.PI / 180;
        const sp = scale * (500 + 500 * rnd(i, 5));
        const vx = Math.cos(ang) * sp, vy = Math.sin(ang) * sp;
        const g = 2200 * scale;
        const px = x + vx * dt, py = y + vy * dt + 0.5 * g * dt * dt;
        const vyy = vy + g * dt;
        const a = Math.atan2(vyy, vx) * 180 / Math.PI;
        const r = scale * (7 + 7 * rnd(i, 6)) * clamp(1.4 - dt);
        if (r <= 0.5) return null;
        return <ellipse key={i} cx={px} cy={py} rx={r * 1.5} ry={r} transform={`rotate(${a} ${px} ${py})`} fill="#7A4A26" stroke={INK} strokeWidth={2.5 * scale} />;
      })}
    </Svg>
  );
};

// teardrop (sweat or tear): pops on, slides, pops off
export const Drop: React.FC<{x: number; y: number; t: number; t0: number; t1: number; size?: number; slide?: number; fall?: boolean}> = (
  {x, y, t, t0, t1, size = 30, slide = 40, fall = false}) => {
  if (t < t0 || t > t1) return null;
  const u = prog(t, t0, t1);
  const pop = easeOutBack(clamp((t - t0) / 0.18)) * clamp((t1 - t) / 0.12);
  const dy = fall ? 0.5 * 1800 * Math.pow(Math.max(0, t - t0 - 0.15), 2) : slide * easeOutCubic(u);
  const s = size * pop;
  if (s < 0.5) return null;
  const cx = x, cy = y + dy;
  const d = `M ${cx} ${cy - s} C ${cx + s * 0.25} ${cy - s * 0.45} ${cx + s * 0.62} ${cy - s * 0.05} ${cx + s * 0.62} ${cy + s * 0.32} ` +
    `C ${cx + s * 0.62} ${cy + s * 0.72} ${cx + s * 0.3} ${cy + s * 0.95} ${cx} ${cy + s * 0.95} ` +
    `C ${cx - s * 0.3} ${cy + s * 0.95} ${cx - s * 0.62} ${cy + s * 0.72} ${cx - s * 0.62} ${cy + s * 0.32} ` +
    `C ${cx - s * 0.62} ${cy - s * 0.05} ${cx - s * 0.25} ${cy - s * 0.45} ${cx} ${cy - s} Z`;
  return (
    <Svg>
      <path d={d} fill="#8FD8FF" stroke={INK} strokeWidth={size * 0.14} strokeLinejoin="round" />
      <ellipse cx={cx - s * 0.22} cy={cy + s * 0.22} rx={s * 0.12} ry={s * 0.2} fill="#FFFFFF" />
    </Svg>
  );
};

// smoke poof: puffs grow then shrink away (no fading of outlined shapes)
export const Poof: React.FC<{x: number; y: number; t: number; t0: number; r?: number; seed?: number}> = ({x, y, t, t0, r = 60, seed = 1}) => {
  if (t < t0 || t > t0 + 0.75) return null;
  const u = (t - t0) / 0.75;
  const circles: number[][] = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + rnd(i, seed);
    const dist = r * (0.3 + 0.9 * easeOutCubic(u)) * (0.7 + 0.5 * rnd(i, seed + 1));
    const rr = r * 0.55 * Math.sin(Math.PI * Math.min(1, u * 1.1)) * (0.7 + 0.5 * rnd(i, seed + 2));
    circles.push([x + Math.cos(a) * dist, y + Math.sin(a) * dist * 0.8 - u * r * 0.4, rr]);
  }
  return <Puffs circles={circles} fill="#F4F4F8" line={r * 0.07} />;
};

// ---------- the egg ----------
export const eggPath = (cx: number, cy: number, a: number, b: number, k = 0.13, n = 96) => {
  let d = '';
  for (let i = 0; i <= n; i++) {
    const th = (i / n) * Math.PI * 2;
    const x = cx + a * Math.sin(th) * (1 - k * Math.cos(th));
    const y = cy - b * Math.cos(th);
    d += (i === 0 ? 'M ' : ' L ') + x.toFixed(1) + ' ' + y.toFixed(1);
  }
  return d + ' Z';
};

// zig-zag crack, drawn in progressively (u = 0..1)
export const crackPoints = (x0: number, y0: number, len: number, ang: number, seed: number, segs = 7) => {
  const pts: number[][] = [[x0, y0]];
  let x = x0, y = y0;
  for (let i = 1; i <= segs; i++) {
    const side = i % 2 === 0 ? 1 : -1;
    const a = ang + side * (0.55 + 0.35 * rnd(i, seed));
    const l = (len / segs) * (0.8 + 0.5 * rnd(i, seed + 1));
    x += Math.cos(a) * l; y += Math.sin(a) * l;
    pts.push([x, y]);
  }
  return pts;
};
export const Crack: React.FC<{pts: number[][]; u: number; width: number; glow?: number}> = ({pts, u, width, glow = 0}) => {
  if (u <= 0) return null;
  const n = pts.length - 1;
  const m = u * n;
  const shown: number[][] = [];
  for (let i = 0; i <= Math.floor(m) && i <= n; i++) shown.push(pts[i]);
  if (m < n) {
    const i = Math.floor(m), f = m - i;
    shown.push([lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)]);
  }
  const d = shown.map((p, i) => (i ? 'L' : 'M') + ' ' + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  return (
    <Svg>
      {glow > 0 ? <path d={d} fill="none" stroke="#FFF8D8" strokeWidth={width * (2.5 + 5 * glow)} strokeLinecap="round" strokeLinejoin="round" opacity={0.55 * glow} /> : null}
      <path d={d} fill="none" stroke={INK} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" />
      {glow > 0 ? <path d={d} fill="none" stroke="#FFFBEA" strokeWidth={width * 0.45 * glow} strokeLinecap="round" strokeLinejoin="round" /> : null}
    </Svg>
  );
};

// shell shards flying out with gravity and spin
export const Shards: React.FC<{x: number; y: number; t: number; t0: number; size: number; n?: number}> = ({x, y, t, t0, size, n = 16}) => {
  if (t < t0 || t > t0 + 1.6) return null;
  const dt = t - t0;
  return (
    <Svg>
      {Array.from({length: n}).map((_, i) => {
        const ang = (i / n) * Math.PI * 2 + rnd(i, 9) * 0.4;
        const sp = size * (2.2 + 2.2 * rnd(i, 10));
        const px = x + Math.cos(ang) * (size * 0.5 + sp * dt);
        const py = y + Math.sin(ang) * (size * 0.6 + sp * dt) + 0.5 * size * 9 * dt * dt;
        const rot = (rnd(i, 11) - 0.5) * 900 * dt;
        const s = size * (0.16 + 0.14 * rnd(i, 12)) * clamp((1.6 - dt) / 0.4);
        if (s < 1) return null;
        const pts = [[-s, -s * 0.6], [s * 0.9, -s * 0.8], [s * 0.6, s * 0.7], [-s * 0.4, s * 0.5]]
          .map(([a, b]) => `${(px + a * Math.cos(rot * Math.PI / 180) - b * Math.sin(rot * Math.PI / 180)).toFixed(1)},${(py + a * Math.sin(rot * Math.PI / 180) + b * Math.cos(rot * Math.PI / 180)).toFixed(1)}`)
          .join(' ');
        return <polygon key={i} points={pts} fill="#FFF4DE" stroke={INK} strokeWidth={size * 0.035} strokeLinejoin="round" />;
      })}
    </Svg>
  );
};

// ---------- space ----------
export const Stars: React.FC<{x0: number; y0: number; w: number; h: number; t: number; n?: number; size?: number; seed?: number}> = (
  {x0, y0, w, h, t, n = 220, size = 6, seed = 5}) => (
  <Svg>
    {Array.from({length: n}).map((_, i) => {
      const x = x0 + rnd(i, seed) * w, y = y0 + rnd(i, seed + 1) * h;
      const tw = 0.6 + 0.4 * Math.sin(t * (2 + 3 * rnd(i, seed + 2)) + i);
      const r = size * (0.4 + rnd(i, seed + 3)) * tw;
      if (rnd(i, seed + 4) > 0.85) {
        const s = r * 2.4;
        return <path key={i} d={`M ${x} ${y - s} Q ${x} ${y} ${x + s} ${y} Q ${x} ${y} ${x} ${y + s} Q ${x} ${y} ${x - s} ${y} Q ${x} ${y} ${x} ${y - s} Z`} fill="#FFF1B8" />;
      }
      return <circle key={i} cx={x} cy={y} r={r} fill={rnd(i, seed + 5) > 0.7 ? '#FFE9A8' : '#FFFFFF'} />;
    })}
  </Svg>
);

export const Galaxy: React.FC<{x: number; y: number; r: number; t: number; color?: string; seed?: number; tilt?: number}> = (
  {x, y, r, t, color = '#D9C8FF', seed = 2, tilt = 0.55}) => (
  <Svg>
    <ellipse cx={x} cy={y} rx={r * 0.32} ry={r * 0.32 * tilt} fill="#FFF6E0" opacity={0.85} />
    {Array.from({length: 150}).map((_, i) => {
      const arm = i % 2;
      const u = (i / 150);
      const th = u * 4.2 + arm * Math.PI + t * 0.25;
      const rr = r * (0.12 + 0.88 * u);
      const jx = (rnd(i, seed) - 0.5) * r * 0.12, jy = (rnd(i, seed + 1) - 0.5) * r * 0.12;
      const px = x + Math.cos(th) * rr + jx, py = y + Math.sin(th) * rr * tilt + jy * tilt;
      return <circle key={i} cx={px} cy={py} r={r * 0.018 * (1.6 - u)} fill={i % 5 === 0 ? '#FFFFFF' : color} opacity={0.9 - 0.5 * u} />;
    })}
  </Svg>
);

export const Sun: React.FC<{x: number; y: number; r: number; t: number; line: number}> = ({x, y, r, t, line}) => {
  const rays = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + t * 0.3;
    const a1 = a - 0.13, a2 = a + 0.13;
    const R0 = r * 1.08, R1 = r * (1.45 + 0.08 * Math.sin(t * 3 + i));
    rays.push(<polygon key={i} points={`${x + R0 * Math.cos(a1)},${y + R0 * Math.sin(a1)} ${x + R1 * Math.cos(a)},${y + R1 * Math.sin(a)} ${x + R0 * Math.cos(a2)},${y + R0 * Math.sin(a2)}`}
      fill="#FFB938" stroke={INK} strokeWidth={line} strokeLinejoin="round" />);
  }
  return (
    <Svg>
      {rays}
      <circle cx={x} cy={y} r={r} fill="#FFD447" stroke={INK} strokeWidth={line} />
      <circle cx={x + r * 0.18} cy={y + r * 0.2} r={r * 0.72} fill="#FFC633" />
      <circle cx={x - r * 0.3} cy={y - r * 0.32} r={r * 0.16} fill="#FFF3B0" />
    </Svg>
  );
};

export const RingPlanet: React.FC<{x: number; y: number; r: number; line: number}> = ({x, y, r, line}) => (
  <Svg>
    <path d={`M ${x - r * 1.9} ${y} A ${r * 1.9} ${r * 0.5} -12 0 1 ${x + r * 1.9} ${y}`} transform={`rotate(-14 ${x} ${y})`} fill="none" stroke={INK} strokeWidth={r * 0.32 + line * 2} />
    <path d={`M ${x - r * 1.9} ${y} A ${r * 1.9} ${r * 0.5} -12 0 1 ${x + r * 1.9} ${y}`} transform={`rotate(-14 ${x} ${y})`} fill="none" stroke="#F2B66B" strokeWidth={r * 0.32} />
    <circle cx={x} cy={y} r={r} fill="#E58A5C" stroke={INK} strokeWidth={line} />
    <path d={`M ${x - r * 0.95} ${y - r * 0.25} Q ${x} ${y - r * 0.05} ${x + r * 0.95} ${y - r * 0.3}`} fill="none" stroke="#C96B44" strokeWidth={r * 0.14} />
    <path d={`M ${x - r * 1.9} ${y} A ${r * 1.9} ${r * 0.5} -12 0 0 ${x + r * 1.9} ${y}`} transform={`rotate(-14 ${x} ${y})`} fill="none" stroke={INK} strokeWidth={r * 0.32 + line * 2} />
    <path d={`M ${x - r * 1.9} ${y} A ${r * 1.9} ${r * 0.5} -12 0 0 ${x + r * 1.9} ${y}`} transform={`rotate(-14 ${x} ${y})`} fill="none" stroke="#F2B66B" strokeWidth={r * 0.32} />
  </Svg>
);

// a sprite inside an SVG (for clipped groups)
export const SvgSprite: React.FC<{name: string; x: number; y: number; s: number; rot?: number}> = ({name, x, y, s, rot = 0}) => {
  const info = SPR[name];
  const w = info.w * s, h = info.h * s;
  return (
    <g transform={`rotate(${rot} ${x} ${y})`}>
      <image href={staticFile(info.src)} x={x - info.head[0] * s} y={y - info.head[1] * s} width={w} height={h} />
    </g>
  );
};

export {wobble};
