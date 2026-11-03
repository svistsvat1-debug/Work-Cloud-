import React from 'react';
import {INK, clamp, easeOut, popIn, popOut, rnd, seg} from './util';
import {HardHat} from './Guy';
import {Tower} from './Tower';

/* Puff cluster: circles with ONE merged outline; grow, drift, then shrink away (no fading). */
export const Puff: React.FC<{x: number; y: number; t: number; t0: number; dur?: number; size?: number; color?: string; seed?: number; dir?: number; n?: number}> = ({
  x,
  y,
  t,
  t0,
  dur = 0.7,
  size = 1,
  color = '#f3ead8',
  seed = 1,
  dir = 0,
  n = 6,
}) => {
  if (t < t0 || t > t0 + dur) return null;
  const u = seg(t, t0, t0 + dur);
  const grow = u < 0.35 ? easeOut(u / 0.35) : 1 - easeOut((u - 0.35) / 0.65) * 1.0;
  const blobs = Array.from({length: n}, (_, i) => {
    const a = (i / n) * Math.PI * 2 + rnd(seed + i) * 0.8;
    const dist = (26 + rnd(seed * 3 + i) * 22) * size * (0.6 + 0.8 * easeOut(u));
    return {
      cx: x + Math.cos(a) * dist + dir * 60 * size * easeOut(u),
      cy: y + Math.sin(a) * dist * 0.6 - 30 * size * easeOut(u),
      r: (22 + rnd(seed * 7 + i) * 16) * size * Math.max(0, grow),
    };
  });
  return (
    <g>
      {blobs.map((b, i) => (
        <circle key={`o${i}`} cx={b.cx} cy={b.cy} r={b.r + 6} fill={INK} />
      ))}
      {blobs.map((b, i) => (
        <circle key={`f${i}`} cx={b.cx} cy={b.cy} r={b.r} fill={color} />
      ))}
    </g>
  );
};

export const SweatDrop: React.FC<{x: number; y: number; s: number; ang?: number}> = ({x, y, s, ang = 0}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${ang}) scale(${s})`}>
      <path d="M 0 -20 C 7 -9 14 0 14 9 A 14 14 0 0 1 -14 9 C -14 0 -7 -9 0 -20 Z" fill="#9fdcff" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <ellipse cx={-5} cy={6} rx={3.2} ry={5} fill="#ffffff" />
    </g>
  );

/** sweat drop that pops on at t0, slides down by `slide` px, pops off */
export const Sweat: React.FC<{t: number; t0: number; x: number; y: number; slide?: number; dur?: number; ang?: number; size?: number}> = ({t, t0, x, y, slide = 40, dur = 0.9, ang = 0, size = 1}) => {
  if (t < t0 || t > t0 + dur) return null;
  const s = popIn(t, t0, 0.2) * popOut(t, t0 + dur - 0.18, 0.18) * size;
  const dy = slide * easeOut(seg(t, t0 + 0.15, t0 + dur));
  return <SweatDrop x={x} y={y + dy} s={s} ang={ang} />;
};

/* Water drop living in the clay (has a face). */
export const WaterDrop: React.FC<{x: number; y: number; s: number; sq?: number; face: 'calm' | 'squeeze' | 'happy'; look?: number}> = ({x, y, s, sq = 0, face, look = 0}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) scale(${s * (1 + sq * 0.25)} ${s * (1 - sq * 0.3)})`}>
      <path d="M 0 -30 C 10 -15 22 -2 22 12 A 22 22 0 0 1 -22 12 C -22 -2 -10 -15 0 -30 Z" fill="#5cc6f5" stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
      <path d="M 12 2 A 16 16 0 0 1 4 28" stroke="#3aa5dc" strokeWidth={6} fill="none" strokeLinecap="round" />
      <ellipse cx={-10} cy={-2} rx={3.5} ry={6} fill="#ffffff" />
      {face === 'squeeze' ? (
        <g stroke={INK} strokeWidth={3.5} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M -10 7 L -4 11 L -10 15" />
          <path d="M 10 7 L 4 11 L 10 15" />
        </g>
      ) : face === 'happy' ? (
        <g stroke={INK} strokeWidth={3.5} fill="none" strokeLinecap="round">
          <path d="M -11 13 Q -7 7 -3 13" />
          <path d="M 3 13 Q 7 7 11 13" />
          <path d="M -5 19 Q 0 24 5 19" />
        </g>
      ) : (
        <g fill={INK}>
          <ellipse cx={-6 + look * 2} cy={11} rx={3} ry={4.5} />
          <ellipse cx={6 + look * 2} cy={11} rx={3} ry={4.5} />
        </g>
      )}
    </g>
  );

export const Sparkle: React.FC<{x: number; y: number; s: number; rot?: number}> = ({x, y, s, rot = 0}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d="M 0 -26 Q 3 -3 26 0 Q 3 3 0 26 Q -3 3 -26 0 Q -3 -3 0 -26 Z" fill="#ffe36b" stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
    </g>
  );

/** fat down arrow = the tower's weight */
export const WeightArrow: React.FC<{x: number; y: number; s: number; sy?: number}> = ({x, y, s, sy = 1}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) scale(${s} ${s * sy})`}>
      <path d="M -26 -54 L 26 -54 L 26 2 L 52 2 L 0 52 L -52 2 L -26 2 Z" fill="#ff8a3d" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      <path d="M -12 -44 L -12 8" stroke="#ffb27f" strokeWidth={8} strokeLinecap="round" />
    </g>
  );

/** the clay's eyes (it gets a face when it gets stronger) */
export const ClayEyes: React.FC<{x: number; y: number; s: number; brows: number; look: [number, number]}> = ({x, y, s, brows, look}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y})`}>
      {[-1, 1].map((side) => (
        <g key={side} transform={`translate(${side * 64} 0) scale(${s})`}>
          <ellipse rx={23} ry={27} fill="#ffffff" stroke={INK} strokeWidth={6} />
          <circle cx={look[0] * 8} cy={look[1] * 9} r={10} fill={INK} />
          <circle cx={look[0] * 8 - 3.5} cy={look[1] * 9 - 4} r={3.2} fill="#ffffff" />
          <path d={`M ${side * 20} ${-36 + brows * 4} Q 0 ${-44} ${-side * 20} ${-36 - brows * 10}`} stroke={INK} strokeWidth={8} fill="none" strokeLinecap="round" />
        </g>
      ))}
    </g>
  );

/** a clay arm in a "double biceps" flex, rooted at (x, y) on the clay surface; side -1 = left arm */
export const ClayArm: React.FC<{x: number; y: number; s: number; flex: number; side: number; color: string}> = ({x, y, s, flex, side, color}) => {
  if (s <= 0.001) return null;
  const d = `M 0 10 Q ${side * 50} -14 ${side * 104} -40 Q ${side * 132} -58 ${side * 110} -122`;
  const bx = side * 58;
  const by = -36;
  const br = 22 + flex * 12;
  return (
    <g transform={`translate(${x} ${y}) scale(${s * 0.95})`}>
      <path d={d} stroke={INK} strokeWidth={52} fill="none" strokeLinecap="round" />
      <ellipse cx={bx} cy={by - flex * 6} rx={34 + 7} ry={br + 7} transform={`rotate(${side * -22} ${bx} ${by})`} fill={INK} />
      <circle cx={side * 108} cy={-134} r={30 + 7} fill={INK} />
      <path d={d} stroke={color} strokeWidth={38} fill="none" strokeLinecap="round" />
      <ellipse cx={bx} cy={by - flex * 6} rx={34} ry={br} transform={`rotate(${side * -22} ${bx} ${by})`} fill={color} />
      <circle cx={side * 108} cy={-134} r={30} fill={color} />
      <path d={`M ${side * 92} -150 Q ${side * 108} -160 ${side * 122} -148`} stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />
      <path d={`M ${bx - side * 18} ${by - br * 0.55 - flex * 6} Q ${bx} ${by - br - flex * 6 + 4} ${bx + side * 18} ${by - br * 0.5 - flex * 6}`} stroke="rgba(255,255,255,0.5)" strokeWidth={7} fill="none" strokeLinecap="round" />
    </g>
  );
};

/** cartoon fight cloud on the horizon: dust ball + swords + stars */
export const WarCloud: React.FC<{x: number; y: number; t: number; s: number}> = ({x, y, t, s}) => {
  if (s <= 0.001) return null;
  const blobs = Array.from({length: 8}, (_, i) => {
    const a = (i / 8) * Math.PI * 2;
    const r = 70 + 14 * Math.sin(t * 23 + i * 2.1);
    return {cx: Math.cos(a) * 95 + 8 * Math.sin(t * 31 + i), cy: Math.sin(a) * 55 + 6 * Math.cos(t * 27 + i), r};
  });
  const swords = [0, 1, 2].map((i) => {
    const ph = (t * 3.3 + i * 0.37) % 1;
    const ang = -60 + i * 70 + 25 * Math.sin(t * 11 + i * 3);
    return {ang, out: Math.sin(ph * Math.PI)};
  });
  return (
    <g transform={`translate(${x + 10 * Math.sin(t * 17)} ${y + 6 * Math.sin(t * 21)}) scale(${s})`}>
      {swords.map((sw, i) => (
        <g key={i} transform={`rotate(${sw.ang}) translate(${120 + 60 * sw.out} 0)`}>
          <path d="M -40 -9 L 60 -9 L 82 0 L 60 9 L -40 9 Z" fill="#d6dee6" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
          <rect x={-58} y={-26} width={14} height={52} rx={5} fill="#b07a3c" stroke={INK} strokeWidth={6} />
          <rect x={-86} y={-8} width={30} height={16} rx={6} fill="#8a5a2c" stroke={INK} strokeWidth={6} />
        </g>
      ))}
      {blobs.map((b, i) => (
        <circle key={`o${i}`} cx={b.cx} cy={b.cy} r={b.r + 8} fill={INK} />
      ))}
      {blobs.map((b, i) => (
        <circle key={`f${i}`} cx={b.cx} cy={b.cy} r={b.r} fill="#d9c9ad" />
      ))}
      {[0, 1, 2].map((i) => {
        const ph = (t * 2.7 + i * 0.33) % 1;
        const a = i * 2.2 + Math.floor(t * 2.7 + i * 0.33) * 1.7;
        return <Sparkle key={i} x={Math.cos(a) * 140} y={Math.sin(a) * 90 - 40} s={Math.sin(ph * Math.PI) * 1.6} rot={ph * 90} />;
      })}
    </g>
  );
};

/** cloud-shaped thought bubble with a tiny tower that keeps getting built and falls over */
export const ThoughtBubble: React.FC<{x: number; y: number; t: number; t0: number; t1: number; head: [number, number]; mini: {n: number[]; tilt: number; drop: number}}> = ({x, y, t, t0, t1, head, mini}) => {
  if (t < t0 || t > t1 + 0.25) return null;
  const s = popIn(t, t0 + 0.12, 0.3) * popOut(t, t1, 0.22);
  const s1 = popIn(t, t0, 0.2) * popOut(t, t1 + 0.03, 0.18);
  const s2 = popIn(t, t0 + 0.06, 0.2) * popOut(t, t1 + 0.01, 0.18);
  const blobs = [
    [0, 0, 120],
    [-120, 20, 78],
    [120, 18, 80],
    [-66, -78, 76],
    [66, -80, 80],
    [-70, 80, 70],
    [70, 82, 72],
  ];
  const p1: [number, number] = [head[0] + (x - head[0]) * 0.35, head[1] + (y - head[1]) * 0.35 + 26];
  const p2: [number, number] = [head[0] + (x - head[0]) * 0.6, head[1] + (y - head[1]) * 0.6 + 26];
  return (
    <g>
      <circle cx={p1[0]} cy={p1[1]} r={(15 + 7) * s1} fill={INK} />
      <circle cx={p1[0]} cy={p1[1]} r={15 * s1} fill="#ffffff" />
      <circle cx={p2[0]} cy={p2[1]} r={(25 + 7) * s2} fill={INK} />
      <circle cx={p2[0]} cy={p2[1]} r={25 * s2} fill="#ffffff" />
      {s > 0.001 && (
        <g transform={`translate(${x} ${y}) scale(${s})`}>
          <clipPath id="bubble-clip">
            {blobs.map(([cx, cy, r], i) => (
              <circle key={i} cx={cx} cy={cy} r={r} />
            ))}
          </clipPath>
          {blobs.map(([cx, cy, r], i) => (
            <circle key={`o${i}`} cx={cx} cy={cy} r={r + 8} fill={INK} />
          ))}
          {blobs.map(([cx, cy, r], i) => (
            <circle key={`f${i}`} cx={cx} cy={cy} r={r} fill="#ffffff" />
          ))}
          <g clipPath="url(#bubble-clip)">
            <rect x={-260} y={104} width={520} height={100} fill="#bfe8a4" />
            <path d="M -260 104 L 260 104" stroke={INK} strokeWidth={6} />
            <g transform={`translate(-52 104) rotate(${mini.tilt} 28 0) scale(0.2)`}>
              <g transform="translate(0 0)">
                <Tower storeys={Array.from({length: 8}, (_, i) => ({on: mini.n[i] > 0.001, dy: 0, s: mini.n[i]}))} id="mini" />
              </g>
            </g>
            <Puff x={135} y={96} t={t} t0={mini.drop} dur={0.55} size={0.9} seed={41} />
          </g>
        </g>
      )}
    </g>
  );
};

/** Z letters for the sleeping tower */
export const Zzz: React.FC<{x: number; y: number; t: number; t0: number; t1: number; font: string}> = ({x, y, t, t0, t1, font}) => {
  if (t < t0 || t > t1 + 0.3) return null;
  return (
    <g>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = t0 + i * 0.42;
        if (t < a || a > t1) return null;
        const u = seg(t, a, a + 1.1);
        const s = popIn(t, a, 0.25) * popOut(t, Math.min(a + 0.85, t1), 0.22) * (0.8 + 0.5 * u);
        if (s <= 0.001) return null;
        return (
          <text
            key={i}
            x={x + 70 * u + 18 * Math.sin(u * 6)}
            y={y - 120 * u}
            fontFamily={font}
            fontWeight={700}
            fontSize={96 * s}
            fill="#ffffff"
            stroke={INK}
            strokeWidth={8}
            paintOrder="stroke"
            textAnchor="middle"
          >
            z
          </text>
        );
      })}
    </g>
  );
};

export const FlyingHat: React.FC<{x: number; y: number; rot: number}> = ({x, y, rot}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <HardHat />
  </g>
);

export const FlyingMallet: React.FC<{x: number; y: number; rot: number}> = ({x, y, rot}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <rect x={-46} y={-6} width={78} height={12} rx={6} fill="#b8773d" stroke={INK} strokeWidth={5} />
    <rect x={26} y={-25} width={30} height={50} rx={9} fill="#9c6233" stroke={INK} strokeWidth={6} />
  </g>
);

export const clamp01 = clamp;
