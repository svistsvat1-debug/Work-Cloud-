import React from 'react';
import {INK, W, clamp, easeOutCubic, easeInOutCubic, popIn, popOut, rand} from './util';

// Smoke / steam puff: circle cluster with ONE merged outline; grows, drifts, then shrinks away.
export const Puff: React.FC<{t: number; at: number; x: number; y: number; dx?: number; dy?: number; size?: number; color?: string; life?: number; seed?: number}> = ({
  t,
  at,
  x,
  y,
  dx = 0,
  dy = -60,
  size = 30,
  color = '#a4a5ad',
  life = 1.0,
  seed = 1,
}) => {
  const u = (t - at) / life;
  if (u <= 0 || u >= 1) return null;
  const grow = u < 0.35 ? easeOutCubic(u / 0.35) : 1 - easeInOutCubic((u - 0.35) / 0.65);
  const px = x + dx * easeOutCubic(u);
  const py = y + dy * easeOutCubic(u);
  const blobs = [0, 1, 2, 3, 4].map((k) => {
    const a = k * 1.3 + seed;
    return {x: Math.cos(a) * size * 0.55 * (0.6 + 0.4 * rand(seed + k)), y: Math.sin(a) * size * 0.4, r: size * (0.45 + 0.3 * rand(seed * 3 + k))};
  });
  return (
    <g transform={`translate(${px} ${py}) scale(${Math.max(0, grow)})`}>
      {blobs.map((b, k) => (
        <circle key={`i${k}`} cx={b.x} cy={b.y} r={b.r + W * 0.8} fill={INK} />
      ))}
      {blobs.map((b, k) => (
        <circle key={`f${k}`} cx={b.x} cy={b.y} r={b.r} fill={color} />
      ))}
      <circle cx={blobs[0].x - size * 0.15} cy={blobs[0].y - size * 0.15} r={size * 0.14} fill="#fff" opacity={0.55} />
    </g>
  );
};

// Light-blue teardrop with outline and glint: pops on, slides, pops off.
export const SweatDrop: React.FC<{t: number; at: number; until: number; x: number; y: number; slide: number; s?: number}> = ({t, at, until, x, y, slide, s = 1}) => {
  if (t < at || t > until + 0.25) return null;
  const sc = t < until ? popIn(t, at, 0.25) : popOut(t, until, 0.22);
  const yy = y + slide * easeInOutCubic(clamp((t - at - 0.15) / (until - at - 0.15)));
  return (
    <g transform={`translate(${x} ${yy}) scale(${sc * s})`}>
      <path d="M 0 -26 Q 16 -2 15 8 Q 13 22 0 22 Q -13 22 -15 8 Q -16 -2 0 -26 Z" fill="#8fd3ff" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <ellipse cx={-5} cy={6} rx={3.5} ry={6} fill="#fff" />
    </g>
  );
};

// Outlined cartoon text (fill + ink stroke under it)
export const CText: React.FC<{x: number; y: number; size: number; children: string; fill?: string; anchor?: 'middle' | 'start' | 'end'; sw?: number}> = ({
  x,
  y,
  size,
  children,
  fill = '#fff',
  anchor = 'middle',
  sw = 9,
}) => (
  <text
    x={x}
    y={y}
    fontFamily="Inter, 'DejaVu Sans', sans-serif"
    fontWeight={900}
    fontSize={size}
    textAnchor={anchor}
    dominantBaseline="central"
    fill={fill}
    stroke={INK}
    strokeWidth={sw}
    strokeLinejoin="round"
    paintOrder="stroke"
    letterSpacing={-0.5}
  >
    {children}
  </text>
);

// Floating Z's
export const Zzz: React.FC<{t: number; from: number; to: number; x: number; y: number}> = ({t, from, to, x, y}) => {
  const out: React.ReactNode[] = [];
  for (let k = 0; k < 8; k++) {
    const at = from + k * 0.55;
    if (at > to) break;
    const u = (t - at) / 1.5;
    if (u <= 0 || u >= 1) continue;
    const sc = u < 0.25 ? easeOutCubic(u / 0.25) : u > 0.75 ? 1 - easeInOutCubic((u - 0.75) / 0.25) : 1;
    const px = x + 70 * u + 10 * Math.sin(u * 6 + k);
    const py = y - 120 * u;
    out.push(
      <g key={k} transform={`translate(${px} ${py}) rotate(${-12 + 8 * Math.sin(u * 4 + k)}) scale(${sc * (0.8 + 0.4 * u)})`}>
        <CText x={0} y={0} size={44} fill="#f3f6ff">
          Z
        </CText>
      </g>,
    );
  }
  return <g>{out}</g>;
};

// "÷50" label
export const Tag: React.FC<{x: number; y: number; s: number; text?: string}> = ({x, y, s, text = '÷50'}) => {
  if (s <= 0.001) return null;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-52} y={-28} width={104} height={56} rx={16} fill="#fff" stroke={INK} strokeWidth={6} />
      <CText x={0} y={2} size={34} fill="#e8483a" sw={0}>
        {text}
      </CText>
    </g>
  );
};

// red pointer arrow (points left at its tip)
export const Pointer: React.FC<{x: number; y: number; s: number; rot?: number}> = ({x, y, s, rot = 0}) => {
  if (s <= 0.001) return null;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d="M 0 0 L 34 -30 L 34 -13 L 84 -13 L 84 13 L 34 13 L 34 30 Z" fill="#e8483a" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    </g>
  );
};

// dashed "one turn" ring with an arrow head, drawn on by `u` (0..1)
export const TurnRing: React.FC<{cx: number; cy: number; r: number; u: number; s: number}> = ({cx, cy, r, u, s}) => {
  if (u <= 0 || s <= 0.001) return null;
  const a0 = -Math.PI / 2;
  const a1 = a0 + u * Math.PI * 2 * 0.97;
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const p = (a: number) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
  const [x0, y0] = p(a0);
  const [x1, y1] = p(a1);
  const head = (a1 * 180) / Math.PI + 90;
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`}>
      <path d={`M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`} fill="none" stroke={INK} strokeWidth={22} strokeLinecap="round" strokeDasharray="1 30" />
      <path d={`M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`} fill="none" stroke="#ffe066" strokeWidth={11} strokeLinecap="round" strokeDasharray="1 30" />
      <g transform={`translate(${x1} ${y1}) rotate(${head})`}>
        <path d="M -16 8 L 0 -14 L 16 8 Z" fill="#ffe066" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      </g>
    </g>
  );
};

// ---- sky things --------------------------------------------------------------------------------
export const Sun: React.FC<{x: number; y: number; r: number; t: number}> = ({x, y, r, t}) => (
  <g transform={`translate(${x} ${y})`}>
    <g transform={`rotate(${(36 * t) / 27})`}>
      {Array.from({length: 10}, (_, k) => (
        <path key={k} transform={`rotate(${k * 36})`} d={`M ${-r * 0.16} ${-r * 1.18} L 0 ${-r * 1.5} L ${r * 0.16} ${-r * 1.18} Z`} fill="#ffd34d" stroke={INK} strokeWidth={r * 0.07} strokeLinejoin="round" />
      ))}
    </g>
    <circle r={r} fill="#ffd34d" stroke={INK} strokeWidth={r * 0.08} />
    <circle cx={-r * 0.3} cy={-r * 0.3} r={r * 0.22} fill="#ffe892" />
  </g>
);

export const Moon: React.FC<{x: number; y: number; r: number}> = ({x, y, r}) => (
  <g transform={`translate(${x} ${y}) rotate(-20)`}>
    <path d={`M 0 ${-r} A ${r} ${r} 0 1 0 0 ${r} A ${r * 0.72} ${r * 0.72} 0 1 1 0 ${-r} Z`} fill="#fff3c4" stroke={INK} strokeWidth={r * 0.09} strokeLinejoin="round" />
  </g>
);

export const Star: React.FC<{x: number; y: number; r: number; s: number}> = ({x, y, r, s}) => {
  if (s <= 0.001) return null;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d={`M 0 ${-r} Q ${r * 0.18} ${-r * 0.18} ${r} 0 Q ${r * 0.18} ${r * 0.18} 0 ${r} Q ${-r * 0.18} ${r * 0.18} ${-r} 0 Q ${-r * 0.18} ${-r * 0.18} 0 ${-r} Z`} fill="#fffbe6" />
    </g>
  );
};

export const Galaxy: React.FC<{x: number; y: number; r: number; s: number; rot: number}> = ({x, y, r, s, rot}) => {
  if (s <= 0.001) return null;
  const arm = (k: number) => {
    const pts: string[] = [];
    for (let i = 0; i <= 26; i++) {
      const u = i / 26;
      const a = k * Math.PI + u * Math.PI * 1.55;
      const rr = r * (0.12 + 0.88 * u);
      pts.push(`${(Math.cos(a) * rr).toFixed(1)},${(Math.sin(a) * rr * 0.62).toFixed(1)}`);
    }
    return `M ${pts.join(' L ')}`;
  };
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(${-18})`}>
      <g transform={`rotate(${rot})`}>
        {[0, 1].map((k) => (
          <path key={`o${k}`} d={arm(k)} fill="none" stroke={INK} strokeWidth={r * 0.28 + 12} strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {[0, 1].map((k) => (
          <path key={`f${k}`} d={arm(k)} fill="none" stroke="#b9a6ff" strokeWidth={r * 0.28} strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {[0, 1].map((k) => (
          <path key={`h${k}`} d={arm(k)} fill="none" stroke="#e6dcff" strokeWidth={r * 0.1} strokeLinecap="round" strokeLinejoin="round" />
        ))}
      </g>
      <ellipse rx={r * 0.32} ry={r * 0.24} fill="#fff1b8" stroke={INK} strokeWidth={6} />
    </g>
  );
};

export const Cloud: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => {
  const c = [
    [0, 0, 60],
    [-62, 14, 44],
    [64, 12, 48],
    [-20, -30, 46],
    [30, -26, 40],
  ];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {c.map(([cx, cy, r], k) => (
        <circle key={`i${k}`} cx={cx} cy={cy} r={r + 8} fill={INK} />
      ))}
      <rect x={-104} y={10} width={208} height={52} rx={26} fill={INK} />
      {c.map(([cx, cy, r], k) => (
        <circle key={`f${k}`} cx={cx} cy={cy} r={r} fill="#fff" />
      ))}
      <rect x={-96} y={14} width={192} height={40} rx={20} fill="#fff" />
    </g>
  );
};

export const Bush: React.FC<{x: number; y: number; s: number; c?: string}> = ({x, y, s, c = '#5fb35a'}) => {
  const b = [
    [0, -50, 56],
    [-50, -26, 40],
    [52, -28, 42],
  ];
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      {b.map(([cx, cy, r], k) => (
        <circle key={`i${k}`} cx={cx} cy={cy} r={r + 8} fill={INK} />
      ))}
      {b.map(([cx, cy, r], k) => (
        <circle key={`f${k}`} cx={cx} cy={cy} r={r} fill={c} />
      ))}
      <circle cx={-14} cy={-70} r={12} fill="#7ccb72" />
    </g>
  );
};

export const Toolbox: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M -60 -96 Q -60 -128 -30 -128 L 30 -128 Q 60 -128 60 -96" fill="none" stroke={INK} strokeWidth={20} strokeLinecap="round" />
    <path d="M -60 -96 Q -60 -128 -30 -128 L 30 -128 Q 60 -128 60 -96" fill="none" stroke="#8a97a0" strokeWidth={8} strokeLinecap="round" />
    <rect x={-110} y={-100} width={220} height={100} rx={14} fill="#e8483a" stroke={INK} strokeWidth={W} />
    <rect x={-110} y={-100} width={220} height={30} rx={10} fill="#c93a2e" stroke={INK} strokeWidth={W} />
    <rect x={-18} y={-80} width={36} height={18} rx={4} fill="#ffd34d" stroke={INK} strokeWidth={5} />
    {/* wrench leaning on it */}
    <g transform="translate(150 -6) rotate(-28)">
      <rect x={-10} y={-120} width={20} height={120} rx={8} fill="#b9c3ca" stroke={INK} strokeWidth={6} />
      <path d="M -26 -150 Q -26 -118 0 -118 Q 26 -118 26 -150 L 12 -150 L 12 -134 L -12 -134 L -12 -150 Z" fill="#b9c3ca" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    </g>
  </g>
);

// rolling hills band (far layer) with the black horizon line on its top edge
export const Hills: React.FC<{y: number}> = ({y}) => {
  const d = `M -6000 ${y + 60} Q -4800 ${y - 120} -3600 ${y + 20} Q -2600 ${y + 120} -1700 ${y - 40} Q -900 ${y - 160} 0 ${y + 10}
    Q 900 ${y + 140} 1800 ${y - 60} Q 2700 ${y - 190} 3600 ${y + 30} Q 4500 ${y + 150} 5400 ${y - 30} Q 6200 ${y - 120} 7000 ${y + 40}
    L 7000 ${y + 5000} L -6000 ${y + 5000} Z`;
  return (
    <g>
      <path d={d} fill="#8ccd6c" stroke={INK} strokeWidth={14} strokeLinejoin="round" />
    </g>
  );
};
