import React from 'react';
import {INK, lerp, rnd} from './util';

export const GROUND = 1350;
export const TX = 430; // tower base centre (world x)
export const A_TOP = 1366; // sandy silt
export const CLAY_TOP = 1520; // soft clay
export const CLAY_BOT = 2010;
export const X0 = -2600;
export const X1 = 3600;

/* ----------------------------------------------- camera ----------------------------------------------- */
export type Cam = {x: number; y: number; k: number}; // k = scale of the main plane (Z 1000)
export const camZ = (c: Cam) => 1000 - 1000 / c.k;
export const Layer: React.FC<{cam: Cam; z: number; blur?: number; children: React.ReactNode}> = ({cam, z, blur = 0, children}) => {
  const d = z - camZ(cam);
  if (d < 300) return null;
  const k = 1000 / d;
  return (
    <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', filter: blur > 0.05 ? `blur(${blur}px)` : undefined}}>
      <g transform={`translate(540 960) scale(${k}) translate(${-cam.x} ${-cam.y})`}>{children}</g>
    </svg>
  );
};
/** frame-0 screen position -> world position on a layer at depth z (frame-0 camera = 560, 1000, k 1) */
export const placeAt = (sx: number, sy: number, z: number): [number, number] => {
  const k0 = 1000 / z;
  return [560 + (sx - 540) / k0, 1000 + (sy - 960) / k0];
};

/* ----------------------------------------------- sky ----------------------------------------------- */
const mix = (a: string, b: string, u: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i], u))).join(',')})`;
};
export const Sky: React.FC<{night: number}> = ({night}) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      background: `linear-gradient(180deg, ${mix('#7fcdfc', '#141c46', night)} 0%, ${mix('#b9e6ff', '#2d3c78', night)} 55%, ${mix('#e3f6ff', '#4b5a92', night)} 100%)`,
    }}
  />
);

const star = (s: number) => `M 0 ${-s} Q 0 0 ${s} 0 Q 0 0 0 ${s} Q 0 0 ${-s} 0 Q 0 0 0 ${-s} Z`;
export const Stars: React.FC<{night: number; t: number}> = ({night, t}) => {
  if (night < 0.02) return null;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      {Array.from({length: 26}, (_, i) => {
        const x = rnd(i * 3.1) * 1080;
        const y = rnd(i * 7.7) * 900;
        const s = (5 + rnd(i) * 7) * night * (0.85 + 0.15 * Math.sin(t * 9 + i));
        return <path key={i} d={star(s)} transform={`translate(${x} ${y})`} fill="#fff6c8" />;
      })}
    </svg>
  );
};

export const SunMoon: React.FC<{theta: number}> = ({theta}) => {
  const C = [540, 1330];
  const R = 1076;
  const sx = C[0] + R * Math.cos(theta);
  const sy = C[1] + R * Math.sin(theta);
  const mx = C[0] + R * Math.cos(theta + Math.PI);
  const my = C[1] + R * Math.sin(theta + Math.PI);
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0}}>
      <g transform={`translate(${sx} ${sy})`}>
        <circle r={92} fill="#fff1a8" opacity={0.45} />
        {Array.from({length: 10}, (_, i) => (
          <path key={i} d="M 0 -84 L 0 -102" stroke={INK} strokeWidth={14} strokeLinecap="round" transform={`rotate(${i * 36 + theta * 20})`} />
        ))}
        {Array.from({length: 10}, (_, i) => (
          <path key={i} d="M 0 -84 L 0 -102" stroke="#ffd84a" strokeWidth={6} strokeLinecap="round" transform={`rotate(${i * 36 + theta * 20})`} />
        ))}
        <circle r={66} fill="#ffd84a" stroke={INK} strokeWidth={6} />
        <circle r={48} fill="#ffe680" />
      </g>
      <g transform={`translate(${mx} ${my}) rotate(-20)`}>
        <path d="M 0 -58 A 58 58 0 1 0 0 58 A 44 52 0 1 1 0 -58 Z" fill="#fff4cf" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      </g>
    </svg>
  );
};

/* ----------------------------------------------- clouds (Z 4500) ----------------------------------------------- */
const cloudBlobs = [
  [0, 0, 70],
  [70, 12, 55],
  [-70, 14, 52],
  [30, -38, 52],
  [-28, -30, 46],
];
export const Cloud: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    {cloudBlobs.map(([cx, cy, r], i) => (
      <circle key={`o${i}`} cx={cx} cy={cy} r={r + 8} fill={INK} />
    ))}
    <rect x={-120} y={14} width={240} height={50} rx={25} fill={INK} />
    {cloudBlobs.map(([cx, cy, r], i) => (
      <circle key={`f${i}`} cx={cx} cy={cy} r={r} fill="#ffffff" />
    ))}
    <rect x={-112} y={14} width={224} height={42} rx={21} fill="#ffffff" />
    <path d="M -100 40 Q 0 58 100 40" stroke="#dfe9f2" strokeWidth={10} fill="none" strokeLinecap="round" />
  </g>
);
export const CLOUD_SPAN = 9000;
export const Clouds: React.FC<{off: number}> = ({off}) => {
  const base: [number, number, number][] = [
    [160, 330, 0.9],
    [860, 210, 1.15],
    [560, 520, 0.7],
    [-500, 420, 1.0],
    [1500, 380, 0.85],
  ];
  return (
    <g>
      {base.map(([sx, sy, s], i) => {
        const [wx, wy] = placeAt(sx, sy, 4500);
        let x = wx + off;
        x = ((((x + 4000) % CLOUD_SPAN) + CLOUD_SPAN) % CLOUD_SPAN) - 4000;
        return <Cloud key={i} x={x} y={wy} s={s * 4.5} />;
      })}
    </g>
  );
};

/* ----------------------------------------------- hills (Z 2600) ----------------------------------------------- */
const hillPath = (pts: [number, number][], bottom: number) =>
  `M ${pts[0][0]} ${bottom} L ${pts[0][0]} ${pts[0][1]} ` +
  pts
    .slice(1)
    .map((p, i) => {
      const q = pts[i];
      const mx = (q[0] + p[0]) / 2;
      return `Q ${q[0]} ${q[1]} ${mx} ${(q[1] + p[1]) / 2}`;
    })
    .join(' ') +
  ` L ${pts[pts.length - 1][0]} ${pts[pts.length - 1][1]} L ${pts[pts.length - 1][0]} ${bottom} Z`;

export const Hills: React.FC = () => {
  const z = 2600;
  const P = (sx: number, sy: number) => placeAt(sx, sy, z);
  const far = [-900, -500, -100, 250, 600, 950, 1300, 1700, 2100].map((sx, i) => P(sx, 1120 + (i % 2 === 0 ? 30 : -30) + (i % 3) * 8));
  const near = [-1000, -650, -250, 120, 420, 780, 1150, 1500, 1900].map((sx, i) => P(sx, 1185 + (i % 2 === 0 ? -22 : 26)));
  const cypress = [
    [90, 1172],
    [130, 1180],
    [930, 1166],
    [985, 1176],
    [705, 1190],
  ].map(([sx, sy]) => P(sx, sy));
  return (
    <g>
      <path d={hillPath(far, 9000)} fill="#bfe3a4" stroke={INK} strokeWidth={14} strokeLinejoin="round" />
      {cypress.map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${2.4 + (i % 2) * 0.4})`}>
          <path d="M 0 -95 Q 22 -40 14 0 L -14 0 Q -22 -40 0 -95 Z" fill="#4f9a55" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
          <path d="M 4 -70 Q 14 -36 9 -6" stroke="#3c7f43" strokeWidth={5} fill="none" />
        </g>
      ))}
      <path d={hillPath(near, 9000)} fill="#a2d67e" stroke={INK} strokeWidth={14} strokeLinejoin="round" />
    </g>
  );
};

/* ----------------------------------------------- ground cut-away (main plane) ----------------------------------------------- */
export const STRONG = '#8f735f';
export const SOFT = '#b8a08c';
const dotsA = Array.from({length: 120}, (_, i) => [X0 + rnd(i * 1.3) * (X1 - X0), A_TOP + 20 + rnd(i * 2.9) * 120, 3 + rnd(i * 5.1) * 4]);
const dotsC = Array.from({length: 160}, (_, i) => [X0 + rnd(i * 4.3) * (X1 - X0), CLAY_BOT + 30 + rnd(i * 6.7) * 900, 3 + rnd(i * 1.7) * 4]);
const gloss = Array.from({length: 22}, (_, i) => [TX - 600 + rnd(i * 8.3) * 1200, CLAY_TOP + 60 + rnd(i * 3.7) * 380, 18 + rnd(i * 9.1) * 22]);
const tufts = Array.from({length: 40}, (_, i) => X0 + i * 160 + rnd(i) * 60);

export const clayTopY = (x: number, dent: number, wob: number, t: number) =>
  CLAY_TOP + 6 * Math.sin(x / 140) + dent * Math.exp(-(((x - TX) / 230) ** 2)) + wob * Math.sin(t * 19 + x / 60) * Math.exp(-(((x - TX) / 300) ** 2));

export const Ground: React.FC<{soft: number; dent: number; wob: number; t: number}> = ({soft, dent, wob, t}) => {
  const xs: number[] = [];
  for (let x = X0; x <= X1; x += 25) xs.push(x);
  const top = xs.map((x) => `${x} ${clayTopY(x, dent, wob, t).toFixed(1)}`).join(' L ');
  const bot = xs.map((x) => `${x} ${(CLAY_BOT + 7 * Math.sin(x / 170 + 1)).toFixed(1)}`);
  const clayD = `M ${top} L ${bot.slice().reverse().join(' L ')} Z`;
  const clayCol = mix(STRONG, SOFT, soft);
  return (
    <g>
      {/* deep sand */}
      <rect x={X0} y={CLAY_BOT - 20} width={X1 - X0} height={4000} fill="#dcb97c" />
      {dotsC.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#c9a364" />
      ))}
      {/* sandy silt (foundation layer) */}
      <rect x={X0} y={A_TOP} width={X1 - X0} height={CLAY_TOP - A_TOP + 60} fill="#ecce95" />
      {dotsA.map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#d8b679" />
      ))}
      {/* soft clay */}
      <path d={clayD} fill={clayCol} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      {gloss.map(([x, y, r], i) => (
        <ellipse key={i} cx={x} cy={y + dent * 0.25 * Math.exp(-(((x - TX) / 230) ** 2))} rx={r * soft} ry={r * 0.32 * soft} fill="#ffffff" opacity={0.35} />
      ))}
      {/* grass edge */}
      <rect x={X0} y={GROUND - 4} width={X1 - X0} height={A_TOP - GROUND + 10} fill="#7cc957" />
      <path d={`M ${X0} ${A_TOP + 5} L ${X1} ${A_TOP + 5}`} stroke="#5aa83b" strokeWidth={6} />
      <path d={`M ${X0} ${GROUND - 4} L ${X1} ${GROUND - 4}`} stroke={INK} strokeWidth={6} />
      {tufts.map((x, i) => (
        <path key={i} d={`M ${x - 16} ${GROUND - 2} Q ${x - 12} ${GROUND - 22} ${x - 6} ${GROUND - 30} Q ${x - 2} ${GROUND - 14} ${x} ${GROUND - 4} Q ${x + 4} ${GROUND - 24} ${x + 12} ${GROUND - 28} Q ${x + 12} ${GROUND - 12} ${x + 16} ${GROUND - 2}`} fill="#7cc957" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      ))}
    </g>
  );
};

/* ----------------------------------------------- year sign ----------------------------------------------- */
export const YearSign: React.FC<{year: number; s: number; font: string}> = ({year, s, font}) => (
  <g transform={`translate(935 ${GROUND}) scale(${s * 0.92})`}>
    <rect x={-9} y={-150} width={18} height={150} rx={4} fill="#9c6233" stroke={INK} strokeWidth={6} />
    <rect x={-92} y={-210} width={184} height={88} rx={14} fill="#c98a4c" stroke={INK} strokeWidth={7} />
    <rect x={-80} y={-198} width={160} height={64} rx={9} fill="#d99d5f" />
    <text x={0} y={-146} textAnchor="middle" fontFamily={font} fontWeight={700} fontSize={60} fill={INK}>
      {year}
    </text>
  </g>
);
