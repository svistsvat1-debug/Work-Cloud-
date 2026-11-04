import React from 'react';
import {AbsoluteFill} from 'remotion';
import {INK} from './util';
import {Puffs} from './art';

export type Cam = {x: number; y: number; z: number};

/** one flat layer of the 2.5D multiplane world. k = F / (Z - camZ), F = 1000 */
export const Layer: React.FC<{cam: Cam; z: number; blur?: number; shake?: {x: number; y: number}; minDepth?: number; children: React.ReactNode}> = ({cam, z, blur = 0, shake = {x: 0, y: 0}, minDepth = 300, children}) => {
  const d = z - cam.z;
  if (d < minDepth) return null;
  const k = 1000 / d;
  return (
    <AbsoluteFill style={{filter: blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : undefined}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          transformOrigin: '0 0',
          transform: `translate(${540 + shake.x}px, ${960 + shake.y}px) scale(${k}) translate(${-cam.x}px, ${-cam.y}px)`,
        }}
      >
        <svg width={1} height={1} style={{overflow: 'visible', position: 'absolute', left: 0, top: 0}}>
          {children}
        </svg>
      </div>
    </AbsoluteFill>
  );
};

export const Sky: React.FC = () => <AbsoluteFill style={{background: 'linear-gradient(180deg, #63BDF3 0%, #9BD7FA 55%, #D9F2FF 100%)'}} />;

const cloud = (cx: number, cy: number, s: number) =>
  [
    [-1.1, 0.25, 0.55],
    [-0.55, -0.15, 0.75],
    [0.15, -0.35, 0.95],
    [0.85, -0.05, 0.7],
    [1.35, 0.3, 0.45],
    [0.2, 0.3, 0.7],
    [-0.5, 0.35, 0.6],
    [0.9, 0.35, 0.55],
  ].map(([x, y, r]) => ({x: cx + x * s, y: cy + y * s, r: r * s}));

export const Clouds: React.FC<{t: number; dur: number}> = ({t, dur}) => {
  const drift = 70 * Math.sin((2 * Math.PI * t) / dur); // gentle sway that returns -> seamless loop
  const all = [
    ...cloud(-1250 + drift, -2650, 330),
    ...cloud(1950 + drift * 0.8, -1950, 280),
    ...cloud(250 + drift * 1.1, -1000, 220),
    ...cloud(2900 + drift, -3300, 360),
    ...cloud(-2600 + drift * 0.9, -1300, 260),
  ];
  return <Puffs items={all} fill="#FFFFFF" ol={22} />;
};

const hillPath = (x0: number, x1: number, base: number, amps: [number, number, number][], bottom: number) => {
  let d = `M${x0},${bottom}`;
  for (let x = x0; x <= x1; x += 40) {
    const y = base + amps.reduce((s, [a, f, p]) => s + a * Math.sin(x * f + p), 0);
    d += ` L${x},${y.toFixed(1)}`;
  }
  return d + ` L${x1},${bottom} Z`;
};

export const FarHills: React.FC = () => (
  <g>
    <path d={hillPath(-4000, 5000, 2930, [[120, 0.0011, 0.4], [60, 0.0027, 2.0], [25, 0.007, 1.0]], 12000)} fill="#A6DD93" stroke={INK} strokeWidth={18} strokeLinejoin="round" />
  </g>
);

const Tree: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <g transform={`translate(${x},${y}) scale(${s})`}>
    <rect x={-14} y={-90} width={28} height={92} fill="#8F5F36" stroke={INK} strokeWidth={11} />
    <Puffs
      items={[
        {x: 0, y: -170, r: 78},
        {x: -58, y: -120, r: 58},
        {x: 58, y: -122, r: 60},
        {x: 0, y: -110, r: 62},
      ]}
      fill="#5FB255"
      ol={11}
    />
  </g>
);

const nearBase = 2480;
const nearAmps: [number, number, number][] = [
  [90, 0.0014, 1.7],
  [40, 0.0035, 0.3],
];
const nearY = (x: number) => nearBase + nearAmps.reduce((s, [a, f, p]) => s + a * Math.sin(x * f + p), 0);

export const NearHills: React.FC = () => (
  <g>
    {[-1500, -350, 1350, 2150, 3300].map((x, i) => (
      <Tree key={i} x={x} y={nearY(x) + 10} s={i % 2 ? 1.25 : 1.6} />
    ))}
    <path d={hillPath(-4000, 5000, nearBase, nearAmps, 12000)} fill="#7FC86C" stroke={INK} strokeWidth={11} strokeLinejoin="round" />
  </g>
);
