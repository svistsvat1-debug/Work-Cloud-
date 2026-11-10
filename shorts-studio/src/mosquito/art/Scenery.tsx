import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Cam, Layer, Svg} from '../camera';
import {OUT, OW, rand} from '../util';
import {RainBit} from './Raindrop';

/* ------------------------------------------------------------------ Sky (screen space) */
export const Sky: React.FC<{top?: string; bottom?: string}> = ({top = '#6E89A6', bottom = '#B4C7D6'}) => (
  <AbsoluteFill style={{background: `linear-gradient(180deg, ${top} 0%, ${bottom} 100%)`}} />
);

/* ------------------------------------------------------------------ Puffy cloud row (one merged outline) */
export const Clouds: React.FC<{x: number; y: number; w: number; seed?: number; fill?: string; shade?: string}> = ({
  x,
  y,
  w,
  seed = 1,
  fill = '#93A1B2',
  shade = '#7F8DA0',
}) => {
  const n = Math.round(w / 110);
  const circles = Array.from({length: n}, (_, i) => ({
    cx: x - w / 2 + (i + 0.5) * (w / n) + (rand(i, seed) - 0.5) * 40,
    cy: y + (rand(i, seed + 3) - 0.5) * 60,
    r: 95 + rand(i, seed + 7) * 70,
  }));
  return (
    <Svg box={[x - w / 2 - 300, y - 400, w + 600, 700]}>
      <rect x={x - w / 2 - 260} y={y - 380} width={w + 520} height={380} fill={fill} />
      {circles.map((c, i) => (
        <circle key={`o${i}`} cx={c.cx} cy={c.cy} r={c.r + OW} fill={OUT} />
      ))}
      <rect x={x - w / 2 - 260} y={y - 380} width={w + 520} height={360} fill={fill} />
      {circles.map((c, i) => (
        <circle key={`f${i}`} cx={c.cx} cy={c.cy} r={c.r} fill={fill} />
      ))}
      {circles.map((c, i) => (
        <circle key={`s${i}`} cx={c.cx + c.r * 0.12} cy={c.cy + c.r * 0.35} r={c.r * 0.62} fill={shade} opacity={0.55} />
      ))}
    </Svg>
  );
};

/* ------------------------------------------------------------------ Hills + ground bands */
export const Hills: React.FC<{y: number; color?: string; seed?: number; w?: number}> = ({y, color = '#6E9C84', seed = 2, w = 6000}) => {
  const pts: string[] = [];
  const n = 14;
  for (let i = 0; i <= n; i++) {
    const x = -w / 2 + (i / n) * w + 540;
    const h = 120 + rand(i, seed) * 220;
    pts.push(`${x} ${y - h}`);
  }
  let d = `M ${-w / 2 + 540} ${y + 2000} L ${pts[0]}`;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1].split(' ').map(Number);
    const [x1, y1] = pts[i].split(' ').map(Number);
    d += ` Q ${(x0 + x1) / 2} ${Math.min(y0, y1) - 90} ${x1} ${y1}`;
  }
  d += ` L ${w / 2 + 540} ${y + 2000} Z`;
  return (
    <Svg box={[-w / 2 + 540, y - 600, w, 2700]}>
      <path d={d} fill={color} stroke={OUT} strokeWidth={OW} strokeLinejoin="round" />
    </Svg>
  );
};

export const GroundBand: React.FC<{y: number; color?: string; dark?: string; line?: boolean; w?: number; tufts?: boolean}> = ({
  y,
  color = '#7DBA6A',
  dark = '#68A458',
  line = true,
  w = 7000,
  tufts = true,
}) => (
  <Svg box={[540 - w / 2, y - 80, w, 3200]}>
    <rect x={540 - w / 2} y={y} width={w} height={3000} fill={color} />
    <rect x={540 - w / 2} y={y + 60} width={w} height={3000} fill={dark} opacity={0.6} />
    {line && <path d={`M ${540 - w / 2} ${y} L ${540 + w / 2} ${y}`} stroke={OUT} strokeWidth={OW} />}
    {tufts &&
      Array.from({length: 40}, (_, i) => {
        const x = 540 - w / 2 + (i + rand(i, 9)) * (w / 40);
        const ty = y + 24 + rand(i, 4) * 60;
        return (
          <path
            key={i}
            d={`M ${x - 14} ${ty} L ${x - 6} ${ty - 22} L ${x} ${ty} L ${x + 8} ${ty - 26} L ${x + 14} ${ty}`}
            fill="none"
            stroke="#4E8A42"
            strokeWidth={5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        );
      })}
  </Svg>
);

export const Puddle: React.FC<{x: number; y: number; rx: number; ry: number}> = ({x, y, rx, ry}) => (
  <Svg box={[x - rx - 20, y - ry - 20, 2 * rx + 40, 2 * ry + 40]}>
    <ellipse cx={x} cy={y} rx={rx} ry={ry} fill="#5DA6D6" stroke={OUT} strokeWidth={OW} />
    <ellipse cx={x - rx * 0.25} cy={y - ry * 0.2} rx={rx * 0.45} ry={ry * 0.32} fill="#8CC8EE" />
    <path d={`M ${x + rx * 0.2} ${y - ry * 0.35} L ${x + rx * 0.55} ${y - ry * 0.35}`} stroke="#E6F5FF" strokeWidth={8} strokeLinecap="round" />
  </Svg>
);

/* ------------------------------------------------------------------ Rain field (world space, wrapped around the camera) */
export type RainSpec = {z: number; count: number; r: number; v: number; tile: [number, number]; blur?: number; seed: number; outline: string; fill: string; opacity?: number};

export const RAIN_LAYERS: RainSpec[] = [
  {z: 2600, count: 60, r: 7, v: 1500, tile: [3400, 6000], seed: 3, outline: '#6D90AF', fill: '#D9EEFF', opacity: 0.85},
  {z: 1500, count: 34, r: 8, v: 1300, tile: [2000, 3500], seed: 7, outline: '#4F7DA6', fill: '#D3ECFF', opacity: 0.95},
  {z: 640, count: 6, r: 10, v: 900, tile: [900, 1600], seed: 11, blur: 3, outline: '#3E6C96', fill: '#CDE8FF', opacity: 0.75},
];

const wrap = (v: number, start: number, len: number) => ((((v - start) % len) + len) % len) + start;

export const RainField: React.FC<{cam: Cam; simT: number; speed: number; spec: RainSpec; wind?: number}> = ({cam, simT, speed, spec, wind = 0.12}) => {
  const [TW, TH] = spec.tile;
  const stretch = 1 + 2.1 * Math.min(1, speed);
  const tilt = -Math.atan(wind) * (180 / Math.PI);
  return (
    <Layer cam={cam} z={spec.z} blur={spec.blur}>
      <Svg box={[cam.x - TW / 2 - 60, cam.y - TH / 2 - 120, TW + 120, TH + 240]} style={{opacity: spec.opacity ?? 1}}>
        {Array.from({length: spec.count}, (_, i) => {
          const v = spec.v * (0.85 + 0.3 * rand(i, spec.seed + 1));
          const bx = rand(i, spec.seed) * TW;
          const by = rand(i, spec.seed + 2) * TH;
          const x = wrap(bx + v * wind * simT, cam.x - TW / 2, TW);
          const y = wrap(by + v * simT, cam.y - TH / 2, TH);
          return <RainBit key={i} x={x} y={y} r={spec.r} stretch={stretch} tilt={tilt} outline={spec.outline} fill={spec.fill} />;
        })}
      </Svg>
    </Layer>
  );
};

/* ------------------------------------------------------------------ Street (for the bus beat) */
export const Buildings: React.FC<{y: number}> = ({y}) => {
  const b = [
    {x: -1700, w: 520, h: 900, c: '#8792A6'},
    {x: -1150, w: 380, h: 1300, c: '#97A1B3'},
    {x: -720, w: 560, h: 1000, c: '#7F8AA0'},
    {x: 1250, w: 520, h: 1150, c: '#8B95A8'},
    {x: 1820, w: 420, h: 1450, c: '#99A3B5'},
    {x: 2290, w: 560, h: 950, c: '#7E899F'},
  ];
  return (
    <Svg box={[-2300, y - 1600, 5600, 1700]}>
      {b.map((q, i) => (
        <g key={i}>
          <rect x={q.x} y={y - q.h} width={q.w} height={q.h} fill={q.c} stroke={OUT} strokeWidth={OW * 2} />
          {Array.from({length: Math.floor(q.h / 190)}, (_, r) =>
            Array.from({length: Math.floor(q.w / 150)}, (_, c) => (
              <rect
                key={`${r}-${c}`}
                x={q.x + 50 + c * 150}
                y={y - q.h + 60 + r * 190}
                width={80}
                height={110}
                rx={8}
                fill={rand(r * 7 + c, i) > 0.7 ? '#FFE7A3' : '#C9D6E6'}
                stroke={OUT}
                strokeWidth={OW * 1.4}
              />
            )),
          )}
        </g>
      ))}
    </Svg>
  );
};

/** Road on the ground plane, drawn in screen space from the camera (true perspective). */
export const Road: React.FC<{cam: Cam; groundY: number}> = ({cam, groundY}) => {
  const proj = (x: number, z: number) => {
    const k = 1000 / (z - cam.z);
    return [540 + (x - cam.x) * k, 960 + (groundY - cam.y) * k] as [number, number];
  };
  const zn = cam.z + 260;
  const zf = 60000;
  const half = 560;
  const rc = 330;
  const [a0, a1] = [proj(rc - half, zn), proj(rc + half, zn)];
  const [b0, b1] = [proj(rc - half, zf), proj(rc + half, zf)];
  const [s0, s1] = [proj(rc - half - 260, zn), proj(rc + half + 260, zn)];
  const dashes: React.ReactNode[] = [];
  for (let i = 0; i < 40; i++) {
    const z0 = 1100 + i * 700;
    const z1 = z0 + 330;
    if (z0 < zn) continue;
    const p = [proj(rc - 14, z0), proj(rc + 14, z0), proj(rc + 14, z1), proj(rc - 14, z1)];
    dashes.push(<path key={i} d={`M ${p[0].join(' ')} L ${p[1].join(' ')} L ${p[2].join(' ')} L ${p[3].join(' ')} Z`} fill="#F4F1E6" />);
  }
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
        <rect x={0} y={960} width={1080} height={960} fill="#7DBA6A" />
        <path d={`M ${s0.join(' ')} L ${s1.join(' ')} L ${b1.join(' ')} L ${b0.join(' ')} Z`} fill="#BFC4CC" />
        <path d={`M ${a0.join(' ')} L ${a1.join(' ')} L ${b1.join(' ')} L ${b0.join(' ')} Z`} fill="#5E626D" />
        <path d={`M ${a0.join(' ')} L ${b0.join(' ')} M ${a1.join(' ')} L ${b1.join(' ')}`} stroke={OUT} strokeWidth={5} />
        {dashes}
        <path d={`M 0 960 L 1080 960`} stroke={OUT} strokeWidth={5} />
      </svg>
    </AbsoluteFill>
  );
};
