import React from 'react';
import {PuffCluster, type Puff} from '../shared/Puffs';
import {clamp, rnd} from '../shared/anim';

// Code-drawn set pieces for tsunami-wall (flat fills, black outlines like the pictures).
const INK = '#000';
export const FONT = 'TsunamiInter';
export const WATER = '#2F86DE';
export const WATER_TOP = '#5AAEF2';
export const WATER_DEEP = '#2168B8';

// Concrete sea wall seen from the side: x = left face, base on y, width w, height h (grows from 0).
export const ConcreteWall: React.FC<{x: number; y: number; w: number; h: number; m: number; tall?: boolean}> = ({x, y, w, h, m, tall = false}) => {
  if (h <= 1) return null;
  const sw = 7;
  const top = y - h;
  const joints: number[] = [];
  for (let k = 2 * m; k < h - 10; k += 2 * m) joints.push(y - k);
  return (
    <g>
      <rect x={x} y={top} width={w} height={h} fill="#C4C4C4" />
      <rect x={x + w * 0.68} y={top} width={w * 0.32} height={h} fill="#A9A9A9" />
      {joints.map((jy, i) => (
        <line key={i} x1={x + 6} x2={x + w - 6} y1={jy} y2={jy} stroke="#8E8E8E" strokeWidth={4} />
      ))}
      {tall ? (
        <>
          {/* a steel gate panel and a top railing make it read as the big floodgate */}
          <rect x={x + w * 0.2} y={top + h * 0.12} width={w * 0.6} height={h * 0.7} fill="#6E8FB0" stroke={INK} strokeWidth={5} />
          {[0.3, 0.5, 0.7].map((u) => (
            <line key={u} x1={x + w * 0.2} x2={x + w * 0.8} y1={top + h * (0.12 + 0.7 * u)} y2={top + h * (0.12 + 0.7 * u)} stroke="#4E6C8A" strokeWidth={5} />
          ))}
        </>
      ) : null}
      <rect x={x} y={top} width={w} height={h} fill="none" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
      {tall ? (
        <g>
          <line x1={x - 8} x2={x + w + 8} y1={top - 44} y2={top - 44} stroke={INK} strokeWidth={6} strokeLinecap="round" />
          {[0, 0.5, 1].map((u) => (
            <line key={u} x1={x + w * u} x2={x + w * u} y1={top} y2={top - 44} stroke={INK} strokeWidth={6} strokeLinecap="round" />
          ))}
        </g>
      ) : null}
    </g>
  );
};

// Water body with a wavy top line from x0 to x1, top at y (bottom far below). ph = wave phase.
export const Water: React.FC<{x0: number; x1: number; y: number; ph: number; amp?: number; bottom?: number}> = ({x0, x1, y, ph, amp = 9, bottom = 4200}) => {
  if (x1 <= x0) return null;
  const n = Math.max(8, Math.round((x1 - x0) / 40));
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    pts.push(`${x.toFixed(1)} ${(y + amp * Math.sin(x / 70 + ph) + amp * 0.5 * Math.sin(x / 31 - ph * 1.7)).toFixed(1)}`);
  }
  const top = `M ${pts.join(' L ')}`;
  return (
    <g>
      <path d={`${top} L ${x1} ${bottom} L ${x0} ${bottom} Z`} fill={WATER} />
      <path d={`${top} L ${x1} ${y + 46} L ${x0} ${y + 46} Z`} fill={WATER_TOP} opacity={0.75} />
      <path d={top} fill="none" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
    </g>
  );
};

// Vertical measuring arrow with end ticks; grows from the ground up to h; label in the middle.
export const Ruler: React.FC<{x: number; y: number; h: number; label: string; ls: number; size?: number}> = ({x, y, h, label, ls, size = 92}) => {
  if (h <= 4) return null;
  const top = y - h;
  const ar = 22;
  const body = (c: string, wdt: number) => (
    <g stroke={c} strokeWidth={wdt} strokeLinecap="round" strokeLinejoin="round" fill="none">
      <line x1={x} x2={x} y1={y - 6} y2={top + 6} />
      <path d={`M ${x - ar} ${top + ar * 1.1} L ${x} ${top + 4} L ${x + ar} ${top + ar * 1.1}`} />
      <path d={`M ${x - ar} ${y - ar * 1.1} L ${x} ${y - 4} L ${x + ar} ${y - ar * 1.1}`} />
      <line x1={x - 30} x2={x + 30} y1={top} y2={top} />
      <line x1={x - 30} x2={x + 30} y1={y} y2={y} />
    </g>
  );
  return (
    <g>
      {body(INK, 17)}
      {body('#FFD84A', 8)}
      {ls > 0.001 ? (
        <g transform={`translate(${x + 26} ${top + Math.min(h * 0.5, 150)}) scale(${ls})`}>
          <text x={0} y={size * 0.35} fontFamily={FONT} fontWeight={900} fontSize={size} fill="#fff" stroke={INK} strokeWidth={size * 0.16} paintOrder="stroke" strokeLinejoin="round">
            {label}
          </text>
        </g>
      ) : null}
    </g>
  );
};

// Outlined text mark in the channel's text style.
export const Mark: React.FC<{x: number; y: number; size: number; s: number; text: string; rot?: number; fill?: string; anchor?: 'middle' | 'start'}> = ({
  x,
  y,
  size,
  s,
  text,
  rot = 0,
  fill = '#fff',
  anchor = 'middle',
}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <text x={0} y={size * 0.35} textAnchor={anchor} fontFamily={FONT} fontWeight={900} fontSize={size} fill={fill} stroke={INK} strokeWidth={size * 0.14} paintOrder="stroke" strokeLinejoin="round">
        {text}
      </text>
    </g>
  );

// Tear-off year card (screen space), flips by scaleY.
export const YearCard: React.FC<{x: number; y: number; w: number; text: string; s: number; rot?: number}> = ({x, y, w, text, s, rot = 0}) => {
  if (s <= 0.001) return null;
  const h = w * 0.8;
  const sw = w * 0.035;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={w * 0.08} fill="#fff" stroke={INK} strokeWidth={sw} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h * 0.3} rx={w * 0.08} fill="#E2453C" stroke={INK} strokeWidth={sw} />
      <text x={0} y={h * 0.3} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={h * 0.46} fill="#111">
        {text}
      </text>
      <circle cx={-w * 0.25} cy={-h * 0.5} r={w * 0.05} fill="#555" stroke={INK} strokeWidth={sw * 0.6} />
      <circle cx={w * 0.25} cy={-h * 0.5} r={w * 0.05} fill="#555" stroke={INK} strokeWidth={sw * 0.6} />
    </g>
  );
};

// Small Japanese flag on a pole (pole base at x, y).
export const Flag: React.FC<{x: number; y: number; s: number; wave: number}> = ({x, y, s, wave}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <line x1={0} x2={0} y1={0} y2={-190} stroke={INK} strokeWidth={9} strokeLinecap="round" />
      <path
        d={`M 4 -186 Q 60 ${-196 + wave} 120 -186 L 120 -106 Q 60 ${-116 + wave} 4 -106 Z`}
        fill="#fff"
        stroke={INK}
        strokeWidth={6}
        strokeLinejoin="round"
      />
      <circle cx={62} cy={-146 + wave * 0.5} r={22} fill="#D9342B" />
    </g>
  );

// White foam splash: a burst of puffs that grows then shrinks (u = 0..1 life). seed varies the shape.
export const Splash: React.FC<{x: number; y: number; r: number; u: number; seed: number; n?: number; spread?: number; up?: number}> = ({
  x,
  y,
  r,
  u,
  seed,
  n = 9,
  spread = 1,
  up = 1,
}) => {
  if (u <= 0 || u >= 1) return null;
  const life = Math.sin(Math.PI * clamp(u));
  const puffs: Puff[] = [];
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (rnd(seed + i * 3.3) - 0.5) * 2.4 * spread;
    const d = r * (0.4 + 1.5 * rnd(seed + i * 7.1)) * (0.35 + 0.65 * u);
    puffs.push({x: x + Math.cos(a) * d, y: y + Math.sin(a) * d * up - r * 0.6 * u * up, r: r * (0.32 + 0.4 * rnd(seed + i * 1.9)) * life});
  }
  return <PuffCluster puffs={puffs} fill="#FFFFFF" ink={6} shade="#D6ECFF" />;
};

// Dust puffs (wall rising out of the ground).
export const Dust: React.FC<{x: number; y: number; w: number; u: number; seed: number}> = ({x, y, w, u, seed}) => {
  if (u <= 0 || u >= 1) return null;
  const life = Math.sin(Math.PI * u);
  const puffs: Puff[] = [];
  for (let i = 0; i < 8; i++) {
    const side = i % 2 ? 1 : -1;
    const px = x + side * (w * 0.5 + 40 + 160 * u * rnd(seed + i));
    puffs.push({x: px, y: y - 20 - 50 * u * rnd(seed + i * 2.3), r: (26 + 30 * rnd(seed + i * 5.1)) * life});
  }
  return <PuffCluster puffs={puffs} fill="#E3D3B5" ink={5} shade="#CDB894" />;
};

// Falling water drops (spill over the wall).
export const Drops: React.FC<{x: number; y: number; u: number; seed: number; n?: number; w?: number}> = ({x, y, u, seed, n = 7, w = 160}) => {
  if (u <= 0 || u >= 1) return null;
  return (
    <g>
      {Array.from({length: n}).map((_, i) => {
        const vx = (rnd(seed + i) - 0.2) * w;
        const t = u * (0.8 + 0.4 * rnd(seed + i * 4.4));
        const px = x + vx * t;
        const py = y - 120 * t + 900 * t * t;
        const r = 13 + 9 * rnd(seed + i * 2.7);
        const s = 1 - clamp((u - 0.75) / 0.25);
        return (
          <g key={i} transform={`translate(${px} ${py}) scale(${s})`}>
            <path d={`M 0 ${-r * 1.6} C ${r * 0.9} ${-r * 0.4} ${r} ${r * 0.2} 0 ${r} C ${-r} ${r * 0.2} ${-r * 0.9} ${-r * 0.4} 0 ${-r * 1.6} Z`} fill={WATER_TOP} stroke={INK} strokeWidth={4} />
          </g>
        );
      })}
    </g>
  );
};

// Foreground grass hill (its own near layer) with a soil front.
export const FgHill: React.FC<{y: number; x0: number; x1: number}> = ({y, x0, x1}) => {
  const n = 40;
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    pts.push(`${x.toFixed(1)} ${(y - 26 * Math.sin(x / 260) - 14 * Math.sin(x / 113 + 1)).toFixed(1)}`);
  }
  const top = `M ${pts.join(' L ')}`;
  return (
    <g>
      <path d={`${top} L ${x1} ${y + 3000} L ${x0} ${y + 3000} Z`} fill="#C9A46C" />
      <path d={`${top} L ${x1} ${y + 70} L ${x0} ${y + 70} Z`} fill="#8CCB5E" />
      <path d={pts.map((p, i) => `${i ? 'L' : 'M'} ${p.split(' ')[0]} ${Number(p.split(' ')[1]) + 70}`).join(' ')} fill="none" stroke={INK} strokeWidth={6} />
      <path d={top} fill="none" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
    </g>
  );
};
