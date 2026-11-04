import React from 'react';
import {C, INK, lerp, clamp} from './core';

export type BrainFace = 'happy' | 'sleep' | 'open' | 'side' | 'worried' | 'dizzy' | 'proud' | 'shock' | 'gulp';

export const BRAIN_PATH =
  'M -96 12 C -116 -26 -92 -66 -54 -60 C -50 -92 -6 -100 12 -76 C 36 -102 84 -90 86 -54 ' +
  'C 116 -46 118 0 94 16 C 104 50 66 76 34 62 C 14 82 -28 80 -44 60 C -80 72 -112 46 -96 12 Z';

const CLUMPS: [number, number, number][] = [
  [-64, -30, 1],
  [-22, -60, 0.9],
  [26, -58, 1.05],
  [66, -28, 0.95],
  [82, 14, 0.85],
  [-82, 26, 0.9],
];

const spiral = (cx: number, cy: number, r: number) => {
  let d = `M ${cx} ${cy}`;
  for (let i = 1; i <= 26; i++) {
    const a = i * 0.62;
    const rr = (r * i) / 26;
    d += ` L ${cx + Math.cos(a) * rr} ${cy + Math.sin(a) * rr}`;
  }
  return d;
};

const BrainEye: React.FC<{x: number; face: BrainFace; look: [number, number]; left: boolean}> = ({x, face, look, left}) => {
  const y = 12;
  if (face === 'sleep') return <path d={`M ${x - 9} ${y} Q ${x} ${y + 6} ${x + 9} ${y}`} stroke={INK} strokeWidth={4.5} fill="none" strokeLinecap="round" />;
  if (face === 'proud') return <path d={`M ${x - 9} ${y + 3} Q ${x} ${y - 8} ${x + 9} ${y + 3}`} stroke={INK} strokeWidth={5} fill="none" strokeLinecap="round" />;
  if (face === 'gulp')
    return left ? (
      <path d={`M ${x - 8} ${y - 7} L ${x + 6} ${y} L ${x - 8} ${y + 7}`} stroke={INK} strokeWidth={4.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    ) : (
      <path d={`M ${x + 8} ${y - 7} L ${x - 6} ${y} L ${x + 8} ${y + 7}`} stroke={INK} strokeWidth={4.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    );
  if (face === 'dizzy')
    return (
      <g>
        <circle cx={x} cy={y} r={11} fill={C.white} stroke={INK} strokeWidth={3.5} />
        <path d={spiral(x, y, 9)} stroke={INK} strokeWidth={2.4} fill="none" />
      </g>
    );
  if (face === 'shock' || face === 'open' || face === 'worried' || face === 'side') {
    const big = face === 'shock' || face === 'open';
    const r = big ? 11 : 9.5;
    return (
      <g>
        <ellipse cx={x} cy={y} rx={r} ry={r * 1.12} fill={C.white} stroke={INK} strokeWidth={3.5} />
        <circle cx={x + look[0] * 4.5} cy={y + look[1] * 4.5} r={face === 'shock' ? 3.6 : 5.6} fill={INK} />
        <circle cx={x + look[0] * 4.5 - 1.6} cy={y + look[1] * 4.5 - 2} r={1.6} fill={C.white} />
        {face === 'side' && <rect x={x - r - 2} y={y - r * 1.2} width={2 * r + 4} height={r * 0.95} fill={C.brainShade} stroke="none" />}
        {face === 'side' && <line x1={x - r} y1={y - r * 0.25} x2={x + r} y2={y - r * 0.25} stroke={INK} strokeWidth={3.5} strokeLinecap="round" />}
      </g>
    );
  }
  // happy
  return (
    <g>
      <ellipse cx={x + look[0] * 3} cy={y + look[1] * 3} rx={6.5} ry={8.5} fill={INK} />
      <circle cx={x + look[0] * 3 - 2} cy={y + look[1] * 3 - 3} r={2} fill={C.white} />
    </g>
  );
};

const Mouth: React.FC<{face: BrainFace}> = ({face}) => {
  const y = 34;
  switch (face) {
    case 'happy':
      return <path d={`M -12 ${y - 3} Q 0 ${y + 10} 12 ${y - 3}`} stroke={INK} strokeWidth={4.5} fill="none" strokeLinecap="round" />;
    case 'proud':
      return (
        <g>
          <path d={`M -15 ${y - 5} Q 0 ${y + 16} 15 ${y - 5} Z`} fill={INK} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
          <path d={`M -6 ${y + 4} Q 0 ${y + 1} 6 ${y + 4} Q 0 ${y + 9} -6 ${y + 4} Z`} fill={C.blush} />
        </g>
      );
    case 'sleep':
      return <path d={`M -5 ${y} L 5 ${y}`} stroke={INK} strokeWidth={4} strokeLinecap="round" />;
    case 'open':
    case 'shock':
      return <ellipse cx={0} cy={y + 1} rx={face === 'shock' ? 7 : 5} ry={face === 'shock' ? 9 : 6} fill={INK} />;
    case 'side':
      return <path d={`M -8 ${y} L 8 ${y}`} stroke={INK} strokeWidth={4} strokeLinecap="round" />;
    case 'worried':
    case 'dizzy':
    case 'gulp':
      return <path d={`M -14 ${y + 2} q 3.5 -6 7 0 q 3.5 6 7 0 q 3.5 -6 7 0 q 3.5 6 7 0`} stroke={INK} strokeWidth={4} fill="none" strokeLinecap="round" />;
  }
};

const Brows: React.FC<{face: BrainFace}> = ({face}) => {
  if (face === 'worried' || face === 'gulp')
    return (
      <g stroke={INK} strokeWidth={4} strokeLinecap="round">
        <line x1={-38} y1={-6} x2={-20} y2={-12} />
        <line x1={38} y1={-6} x2={20} y2={-12} />
      </g>
    );
  if (face === 'proud' || face === 'shock')
    return (
      <g stroke={INK} strokeWidth={4} strokeLinecap="round" fill="none">
        <path d="M -38 -8 Q -28 -16 -18 -9" />
        <path d="M 38 -8 Q 28 -16 18 -9" />
      </g>
    );
  return null;
};

export const SweatDrop: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) =>
  s <= 0.01 ? null : (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M 0 -18 C 7 -6 12 2 12 8 C 12 15 6 20 0 20 C -6 20 -12 15 -12 8 C -12 2 -7 -6 0 -18 Z" fill={C.sweat} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
      <ellipse cx={-4} cy={7} rx={2.5} ry={4} fill={C.white} />
    </g>
  );

export const TinyHelmet: React.FC<{s: number}> = ({s}) =>
  s <= 0.01 ? null : (
    <g transform={`translate(0 -54) scale(${s}) translate(0 54)`}>
      <path d="M -96 -34 C -100 -104 -44 -126 4 -124 C 56 -122 104 -98 98 -34 Z" fill={C.helmet} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d="M -10 -123 L 14 -123 L 12 -36 L -8 -36 Z" fill={C.white} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <path d="M -70 -60 C -60 -90 -30 -104 -4 -106" stroke={'#F05A6B'} strokeWidth={8} fill="none" strokeLinecap="round" />
      <circle cx={70} cy={-56} r={9} fill={C.mask} stroke={INK} strokeWidth={4} />
    </g>
  );

export type BrainProps = {
  id: string;
  face: BrainFace;
  look?: [number, number];
  clumps?: number[]; // per-clump scale 0..1(+)
  clumpWiggle?: number;
  crack?: number; // 0..1 draw progress, negative = hidden
  helmet?: number; // tiny helmet pop scale
  sweat?: number; // 0..1 progress of the slide, <0 hidden
  sparkle?: number;
};

export const Brain: React.FC<BrainProps> = ({id, face, look = [0, 0], clumps = [], clumpWiggle = 0, crack = -1, helmet = 0, sweat = -1}) => (
  <g>
    <defs>
      <clipPath id={`bclip-${id}`}>
        <path d={BRAIN_PATH} />
      </clipPath>
    </defs>
    <path d={BRAIN_PATH} fill={C.brain} />
    <g clipPath={`url(#bclip-${id})`}>
      <ellipse cx={0} cy={66} rx={110} ry={30} fill={C.brainShade} />
      <ellipse cx={-34} cy={-56} rx={26} ry={10} fill={'#FFC9DA'} />
    </g>
    <g stroke={C.brainLine} strokeWidth={5} fill="none" strokeLinecap="round">
      <path d="M -62 -44 Q -46 -30 -64 -14" />
      <path d="M -22 -66 Q -6 -54 -20 -38" />
      <path d="M 40 -64 Q 58 -50 46 -32" />
      <path d="M 74 -14 Q 56 -2 70 16" />
      <path d="M -80 40 Q -64 46 -72 58" />
      <path d="M 2 -80 Q 10 -64 0 -50" />
    </g>
    <path d={BRAIN_PATH} fill="none" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    {clumps.map((s, i) => {
      if (s <= 0.01) return null;
      const [cx, cy, sz] = CLUMPS[i % CLUMPS.length];
      const w = 1 + 0.12 * clumpWiggle * Math.sin(i * 1.7 + clumpWiggle * 9);
      return (
        <g key={i} transform={`translate(${cx} ${cy}) scale(${s * sz * w})`}>
          <g fill={INK}>
            <circle cx={-6} cy={-3} r={15} />
            <circle cx={8} cy={-6} r={12.5} />
            <circle cx={3} cy={8} r={12} />
          </g>
          <g fill={C.clump}>
            <circle cx={-6} cy={-3} r={11} />
            <circle cx={8} cy={-6} r={8.5} />
            <circle cx={3} cy={8} r={8} />
          </g>
          <circle cx={-9} cy={-7} r={3.4} fill={C.clumpLight} />
        </g>
      );
    })}
    {crack >= 0 && (
      <path
        d="M -4 -82 L 10 -60 L -8 -42 L 12 -22 L -4 -4 L 6 4"
        stroke={INK}
        strokeWidth={6}
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeDasharray="140"
        strokeDashoffset={140 * (1 - clamp(crack))}
      />
    )}
    <Brows face={face} />
    <BrainEye x={-28} face={face} look={look} left />
    <BrainEye x={28} face={face} look={look} left={false} />
    {(face === 'happy' || face === 'proud') && (
      <g fill={C.blush} opacity={0.9}>
        <ellipse cx={-50} cy={30} rx={11} ry={6.5} />
        <ellipse cx={50} cy={30} rx={11} ry={6.5} />
      </g>
    )}
    <Mouth face={face} />
    <TinyHelmet s={helmet} />
    {sweat >= 0 && <SweatDrop x={78} y={lerp(-44, 4, sweat)} s={sweat < 0.1 ? sweat * 10 : sweat > 0.9 ? (1 - sweat) * 10 : 1} />}
  </g>
);
