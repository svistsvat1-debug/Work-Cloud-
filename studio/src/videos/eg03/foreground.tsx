import React from 'react';
import {C, INK, OL, rand, loopSin} from './core';

/** hanging oil lamp (foreground, top-left): gentle swing, flickering flame */
export const HangingLamp: React.FC<{x: number; y: number; t: number}> = ({x, y, t}) => {
  const swing = 3 * loopSin(t, 14) + 1.5 * loopSin(t, 23, 1.1);
  const fl = 1 + 0.1 * Math.sin(t * 19) + 0.06 * Math.sin(t * 31 + 1);
  const sw = 5 * Math.sin(t * 13 + 0.3);
  return (
    <g transform={`translate(${x},${y}) rotate(${swing})`}>
      {/* chains */}
      <path d="M0,-1400 L0,-120 M0,-120 L-70,0 M0,-120 L70,0" fill="none" stroke={INK} strokeWidth={14} />
      <path d="M0,-1400 L0,-120 M0,-120 L-70,0 M0,-120 L70,0" fill="none" stroke={C.metalShade} strokeWidth={5} strokeDasharray="14 8" />
      {/* bowl */}
      <path d="M-120,0 L120,0 Q110,80 0,92 Q-110,80 -120,0 Z" fill={C.jar} stroke={INK} strokeWidth={OL + 2} strokeLinejoin="round" />
      <path d="M40,6 L118,6 Q108,70 30,88 Q70,60 40,6 Z" fill={C.jarShade} />
      <rect x={-132} y={-14} width={264} height={22} rx={10} fill={C.jarLight} stroke={INK} strokeWidth={OL} />
      {/* flame */}
      <g transform={`translate(0,-14) scale(1,${fl})`}>
        <path d={`M-40,0 C-48,-50 ${-8 + sw},-80 ${sw * 1.4},-150 C${22 + sw},-86 50,-56 40,0 Q0,16 -40,0 Z`} fill={C.flame} stroke={INK} strokeWidth={OL} strokeLinejoin="round" />
        <path d={`M-22,0 C-26,-34 ${-2 + sw},-58 ${sw},-102 C${12 + sw},-58 30,-34 22,0 Q0,8 -22,0 Z`} fill={C.flameMid} />
        <path d={`M-10,0 C-12,-18 ${sw * 0.4},-34 ${sw * 0.6},-56 C${6 + sw * 0.4},-32 14,-16 10,0 Z`} fill={C.flameCore} />
      </g>
    </g>
  );
};

/** tomb floor ledge in front of the wall (foreground, bottom) with pots and stones */
export const FloorLedge: React.FC<{y: number}> = ({y}) => (
  <g>
    <rect x={-4000} y={y} width={8000} height={2000} fill={C.pillar} stroke={INK} strokeWidth={OL} />
    <rect x={-4000} y={y + 20} width={8000} height={2000} fill={C.pillarShade} />
    <rect x={-4000} y={y} width={8000} height={20} fill={C.pillarLight} stroke={INK} strokeWidth={4} />
    {/* pots */}
    {[
      [-180, 1.0],
      [-40, 0.78],
      [1240, 0.9],
      [1380, 1.1],
      [-1500, 0.95],
    ].map(([px, s], i) => (
      <g key={i} transform={`translate(${px},${y + 6}) scale(${s})`}>
        <path d="M-60,0 C-90,-40 -96,-120 -60,-170 L-40,-196 L40,-196 L60,-170 C96,-120 90,-40 60,0 Z" fill={C.jar} stroke={INK} strokeWidth={OL + 2} strokeLinejoin="round" />
        <path d="M30,-180 C70,-130 74,-50 50,-4 L20,-4 C40,-60 40,-130 20,-180 Z" fill={C.jarShade} />
        <rect x={-48} y={-216} width={96} height={26} rx={8} fill={C.jarLight} stroke={INK} strokeWidth={OL} />
        <path d="M-80,-110 Q0,-90 80,-110" fill="none" stroke={C.fYellow} strokeWidth={10} />
      </g>
    ))}
    {[
      [300, 40],
      [520, 26],
      [880, 34],
      [-760, 30],
    ].map(([sx, r], i) => (
      <ellipse key={`st${i}`} cx={sx} cy={y + 4} rx={r * 1.6} ry={r} fill={C.stoneShade} stroke={INK} strokeWidth={OL} />
    ))}
  </g>
);

/** dust motes drifting in the torch light (screen space, loop-safe) */
export const Dust: React.FC<{t: number; opacity?: number}> = ({t, opacity = 1}) => {
  const out: React.ReactNode[] = [];
  for (let i = 0; i < 26; i++) {
    const x = 1080 * rand(i * 4.7) + 40 * loopSin(t, 3 + (i % 4), i);
    const y = 1920 * rand(i * 8.3) + 60 * loopSin(t, 2 + (i % 3), i * 1.7);
    const r = 3 + rand(i * 2.9) * 5;
    out.push(<circle key={i} cx={x} cy={y} r={r} fill="#FFF3D2" opacity={(0.25 + 0.35 * (0.5 + 0.5 * loopSin(t, 5 + (i % 5), i))) * opacity} />);
  }
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
      {out}
    </svg>
  );
};
