import React from 'react';
import {AbsoluteFill} from 'remotion';
import {clamp, easeOutCubic, inv, rand} from './anim';

const INK = '#111';

/** Smoke / steam puff: circles with ONE merged outline (all ink circles first, then all fills).
 * Grows, drifts out, then shrinks away (outlined puffs never fade). World coordinates. */
export const Puff: React.FC<{t: number; t0: number; x: number; y: number; size: number; fill: string; seed: number; ink?: number; life?: number}> = ({
  t,
  t0,
  x,
  y,
  size,
  fill,
  seed,
  ink = 5,
  life = 0.75,
}) => {
  const u = (t - t0) / life;
  if (u <= 0 || u >= 1) return null;
  const circles = Array.from({length: 9}, (_, i) => {
    const a = (i / 9) * Math.PI * 2 + rand(seed + i) * 0.7;
    const sp = 0.55 + rand(seed + i * 3.1) * 0.6;
    const dist = size * sp * easeOutCubic(clamp(u * 1.6));
    const grow = easeOutCubic(clamp(u * 2.5));
    const shrink = 1 - clamp((u - 0.45) / 0.55) ** 1.5;
    const r = size * (0.32 + rand(seed + i * 7.7) * 0.22) * grow * shrink;
    return {cx: x + Math.cos(a) * dist, cy: y + Math.sin(a) * dist * 0.8 - size * 0.25 * u, r};
  });
  circles.push({cx: x, cy: y - size * 0.2 * u, r: size * 0.45 * easeOutCubic(clamp(u * 3)) * (1 - clamp((u - 0.3) / 0.6) ** 1.5)});
  return (
    <g>
      {circles.map((c, i) => (c.r > 0.5 ? <circle key={`i${i}`} cx={c.cx} cy={c.cy} r={c.r + ink} fill={INK} /> : null))}
      {circles.map((c, i) => (c.r > 0.5 ? <circle key={`f${i}`} cx={c.cx} cy={c.cy} r={c.r} fill={fill} /> : null))}
    </g>
  );
};

/** "it fits" burst: an outlined gold ring that expands and thins + radial spark dashes. World coordinates. */
export const Ring: React.FC<{t: number; t0: number; x: number; y: number; size: number}> = ({t, t0, x, y, size}) => {
  const u = (t - t0) / 0.5;
  if (u <= 0 || u >= 1) return null;
  const r = size * (0.3 + 0.9 * easeOutCubic(u));
  const w = size * 0.12 * (1 - u);
  const sparks = Array.from({length: 8}, (_, i) => {
    const a = (i / 8) * Math.PI * 2 + 0.2;
    const r0 = size * (0.5 + 0.9 * easeOutCubic(u));
    const len = size * 0.28 * (1 - u);
    return {x1: x + Math.cos(a) * r0, y1: y + Math.sin(a) * r0, x2: x + Math.cos(a) * (r0 + len), y2: y + Math.sin(a) * (r0 + len)};
  });
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="none" stroke={INK} strokeWidth={w + 8} />
      <circle cx={x} cy={y} r={r} fill="none" stroke="#ffd84a" strokeWidth={w} />
      {sparks.map((s, i) => (
        <g key={i}>
          <line {...s} stroke={INK} strokeWidth={14 * (1 - u) + 2} strokeLinecap="round" />
          <line {...s} stroke="#ffd84a" strokeWidth={8 * (1 - u)} strokeLinecap="round" />
        </g>
      ))}
    </g>
  );
};

/** Sweat drop: light-blue teardrop with outline + glint; pops on, slides down, pops off. Any coordinate space. */
export const Sweat: React.FC<{t: number; t0: number; t1: number; x: number; y: number; size: number; ink: number; slide?: number}> = ({
  t,
  t0,
  t1,
  x,
  y,
  size,
  ink,
  slide = 0.6,
}) => {
  if (t < t0 || t > t1) return null;
  const sIn = clamp((t - t0) / 0.15);
  const sOut = clamp((t1 - t) / 0.12);
  const k = Math.min(easeOutCubic(sIn) * (sIn < 1 ? 1.15 - 0.15 * sIn : 1), sOut);
  const dy = size * slide * easeOutCubic(inv(t0, t1, t));
  const s = size * k;
  const cy = y + dy;
  const d = `M ${x} ${cy - s} C ${x + s * 0.15} ${cy - s * 0.55} ${x + s * 0.62} ${cy - s * 0.1} ${x + s * 0.62} ${cy + s * 0.35} A ${s * 0.62} ${s * 0.62} 0 0 1 ${x - s * 0.62} ${cy + s * 0.35} C ${x - s * 0.62} ${cy - s * 0.1} ${x - s * 0.15} ${cy - s * 0.55} ${x} ${cy - s} Z`;
  return (
    <g>
      <path d={d} fill="#8fd3ff" stroke={INK} strokeWidth={ink} strokeLinejoin="round" />
      <ellipse cx={x - s * 0.22} cy={cy + s * 0.25} rx={s * 0.12} ry={s * 0.2} fill="#fff" />
    </g>
  );
};

/** Soft contact shadow under something standing on the floor. World coordinates. */
export const Shadow: React.FC<{x: number; y: number; w: number; o?: number}> = ({x, y, w, o = 1}) =>
  w > 1 ? (
    <div
      style={{
        position: 'absolute',
        left: x - w / 2,
        top: y - w * 0.07,
        width: w,
        height: w * 0.14,
        borderRadius: '50%',
        background: `rgba(72, 54, 42, ${0.26 * o})`,
        filter: 'blur(3px)',
      }}
    />
  ) : null;

/** Old-film look for the flashback: grain, vignette, scratches, slight flicker. Screen space. */
export const Film: React.FC<{frame: number; on: boolean}> = ({frame, on}) => {
  if (!on) return null;
  const f2 = Math.floor(frame / 2);
  const scratches = [0, 1].map((i) => {
    const r = rand(f2 * 3 + i * 17);
    return r > 0.45 ? <div key={i} style={{position: 'absolute', left: 80 + rand(f2 * 7 + i) * 920, top: 0, width: 2, height: 1920, background: 'rgba(60,40,20,0.35)'}} /> : null;
  });
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <svg width={1080} height={1920} style={{position: 'absolute', opacity: 0.16, mixBlendMode: 'multiply'}}>
        <filter id={`grain${f2 % 12}`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={f2 % 12} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width={1080} height={1920} filter={`url(#grain${f2 % 12})`} />
      </svg>
      {scratches}
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(50,30,10,0.45) 100%)'}} />
      <AbsoluteFill style={{background: `rgba(255,240,210,${0.03 + rand(f2) * 0.04})`}} />
    </AbsoluteFill>
  );
};

/** White camera-flash transition: full white at t0, fades over d. Swaps happen under it. */
export const Flash: React.FC<{t: number; at: number[]; d?: number}> = ({t, at, d = 0.3}) => {
  let o = 0;
  for (const a of at) {
    if (t >= a - 0.05 && t < a) o = Math.max(o, (t - (a - 0.05)) / 0.05);
    if (t >= a && t < a + d) o = Math.max(o, 1 - (t - a) / d);
  }
  return o > 0 ? <AbsoluteFill style={{background: '#fffdf6', opacity: o}} /> : null;
};
