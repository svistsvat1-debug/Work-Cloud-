import React from 'react';
import {rnd} from '../shared/anim';

// Code-drawn props for turkey-eggs (flat fills, black outlines like the pictures).
const INK = '#000';
export const FONT = 'TurkeyInter';

// Egg standing on its bottom point (x, y). w = width. turkey = speckled cream, else plain white.
// crack 0..1 reveals a zig-zag crack around the middle; wobble in degrees.
export const Egg: React.FC<{x: number; y: number; w: number; turkey?: boolean; crack?: number; rot?: number; sx?: number; sy?: number; top?: boolean}> = ({
  x,
  y,
  w,
  turkey = true,
  crack = 0,
  rot = 0,
  sx = 1,
  sy = 1,
  top = true,
}) => {
  const h = w * 1.3;
  const sw = w * 0.055;
  const fill = turkey ? '#F2E6CF' : '#FFFFFF';
  const shade = turkey ? '#E2D2B4' : '#E9E9E9';
  const id = `egg${Math.round(x)}_${Math.round(y)}_${Math.round(w)}`;
  const body = `M 0 ${-h} C ${w * 0.62} ${-h} ${w * 0.56} 0 0 0 C ${-w * 0.56} 0 ${-w * 0.62} ${-h} 0 ${-h} Z`;
  const zig: string[] = [];
  const n = 7;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    zig.push(`${i ? 'L' : 'M'} ${(-0.5 + u) * w * 0.98} ${-h * 0.52 + (i % 2 ? -1 : 1) * w * 0.07}`);
  }
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${sx} ${sy})`}>
      <defs>
        <clipPath id={id}>
          <path d={body} />
        </clipPath>
      </defs>
      {top ? (
        <>
          <path d={body} fill={fill} />
          <g clipPath={`url(#${id})`}>
            <ellipse cx={-w * 0.32} cy={-h * 0.45} rx={w * 0.3} ry={h * 0.55} fill={shade} />
            <ellipse cx={w * 0.16} cy={-h * 0.72} rx={w * 0.07} ry={h * 0.12} fill="#fff" opacity={0.8} />
            {turkey
              ? Array.from({length: 16}).map((_, i) => (
                  <ellipse
                    key={i}
                    cx={(rnd(i * 3.1) - 0.5) * w * 0.85}
                    cy={-h * (0.12 + rnd(i * 7.7) * 0.8)}
                    rx={w * (0.025 + rnd(i) * 0.025)}
                    ry={w * (0.02 + rnd(i * 2) * 0.02)}
                    fill="#9C6B45"
                  />
                ))
              : null}
            {crack > 0 ? (
              <path
                d={zig.join(' ')}
                fill="none"
                stroke={INK}
                strokeWidth={sw * 0.9}
                strokeLinejoin="round"
                strokeLinecap="round"
                strokeDasharray={w * 1.6}
                strokeDashoffset={w * 1.6 * (1 - crack)}
              />
            ) : null}
          </g>
          <path d={body} fill="none" stroke={INK} strokeWidth={sw} />
        </>
      ) : null}
    </g>
  );
};

// Top half of a cracked shell (flies off on hatching).
export const ShellCap: React.FC<{x: number; y: number; w: number; rot: number; s?: number}> = ({x, y, w, rot, s = 1}) => {
  const h = w * 1.3;
  const n = 7;
  const pts: string[] = [];
  for (let i = n; i >= 0; i--) {
    const u = i / n;
    pts.push(`L ${(-0.5 + u) * w * 0.98} ${h * 0.48 + (i % 2 ? -1 : 1) * w * 0.07}`);
  }
  const d = `M ${-0.49 * w} ${h * 0.48} C ${-w * 0.6} 0 ${-w * 0.3} 0 0 0 C ${w * 0.3} 0 ${w * 0.6} 0 ${0.49 * w} ${h * 0.48} ${pts.join(' ')} Z`;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s}) translate(0 ${-h * 0.48})`}>
      <path d={d} fill="#F2E6CF" stroke={INK} strokeWidth={w * 0.055} strokeLinejoin="round" />
      {Array.from({length: 6}).map((_, i) => (
        <ellipse key={i} cx={(rnd(i * 5.3) - 0.5) * w * 0.7} cy={h * (0.12 + rnd(i * 1.7) * 0.25)} rx={w * 0.03} ry={w * 0.025} fill="#9C6B45" />
      ))}
    </g>
  );
};

// Hanging price tag with a string; text grows "$" -> "$$$".
export const PriceTag: React.FC<{x: number; y: number; w: number; text: string; rot: number; s: number}> = ({x, y, w, text, rot, s}) => {
  if (s <= 0.001) return null;
  const h = w * 0.62;
  const sw = w * 0.04;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <line x1={0} y1={0} x2={0} y2={h * 0.6} stroke={INK} strokeWidth={sw * 0.8} />
      <g transform={`translate(0 ${h * 0.6})`}>
        <path
          d={`M ${-w * 0.5} ${h * 0.25} L ${-w * 0.3} 0 L ${w * 0.3} 0 L ${w * 0.5} ${h * 0.25} L ${w * 0.5} ${h} L ${-w * 0.5} ${h} Z`}
          fill="#FFD84A"
          stroke={INK}
          strokeWidth={sw}
          strokeLinejoin="round"
        />
        <circle cx={0} cy={h * 0.18} r={w * 0.05} fill="#fff" stroke={INK} strokeWidth={sw * 0.6} />
        <text
          x={0}
          y={h * 0.82}
          textAnchor="middle"
          fontFamily={FONT}
          fontWeight={900}
          fontSize={h * 0.55}
          fill="#2E9B3E"
          stroke={INK}
          strokeWidth={sw * 0.7}
          paintOrder="stroke"
        >
          {text}
        </text>
      </g>
    </g>
  );
};

// Tear-off day calendar card (flipped by scaleY through 0, word switched on the flat frame).
export const DayCard: React.FC<{x: number; y: number; w: number; text: string; flip: number; s: number}> = ({x, y, w, text, flip, s}) => {
  if (s <= 0.001) return null;
  const h = w * 0.9;
  const sw = w * 0.035;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={w * 0.08} fill="#fff" stroke={INK} strokeWidth={sw} />
      <g transform={`scale(1 ${flip})`}>
        <rect x={-w / 2} y={-h / 2} width={w} height={h * 0.32} rx={w * 0.08} fill="#E2453C" stroke={INK} strokeWidth={sw} />
        <text x={0} y={h * 0.28} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={h * 0.4} fill="#111">
          {text}
        </text>
      </g>
      <circle cx={-w * 0.25} cy={-h * 0.5} r={w * 0.05} fill="#555" stroke={INK} strokeWidth={sw * 0.6} />
      <circle cx={w * 0.25} cy={-h * 0.5} r={w * 0.05} fill="#555" stroke={INK} strokeWidth={sw * 0.6} />
    </g>
  );
};

// Thought bubble: three small puffs from (x0, y0) up to a cloud centred at (x, y) of width w.
export const Bubble: React.FC<{x0: number; y0: number; x: number; y: number; w: number; s: number[]; children?: React.ReactNode}> = ({
  x0,
  y0,
  x,
  y,
  w,
  s,
  children,
}) => {
  const sw = w * 0.022;
  const lobes: [number, number, number][] = [
    [-0.32, 0.05, 0.24],
    [-0.12, -0.16, 0.27],
    [0.14, -0.17, 0.26],
    [0.34, 0.02, 0.23],
    [0.15, 0.2, 0.25],
    [-0.15, 0.2, 0.25],
  ];
  const dots = [0.18, 0.4, 0.62];
  return (
    <g>
      {dots.map((u, i) =>
        s[i] > 0.001 ? (
          <circle
            key={i}
            cx={x0 + (x - x0) * u}
            cy={y0 + (y + w * 0.3 - y0) * u}
            r={w * (0.03 + i * 0.022) * s[i]}
            fill="#fff"
            stroke={INK}
            strokeWidth={sw}
          />
        ) : null,
      )}
      {s[3] > 0.001 ? (
        <g transform={`translate(${x} ${y}) scale(${s[3]})`}>
          {lobes.map(([lx, ly, r], i) => (
            <circle key={`o${i}`} cx={lx * w} cy={ly * w * 0.8} r={r * w + sw} fill={INK} />
          ))}
          {lobes.map(([lx, ly, r], i) => (
            <circle key={`f${i}`} cx={lx * w} cy={ly * w * 0.8} r={r * w} fill="#fff" />
          ))}
          {children}
        </g>
      ) : null}
    </g>
  );
};

// Fat green check mark with an outline.
export const Check: React.FC<{x: number; y: number; w: number; s: number}> = ({x, y, w, s}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d={`M ${-w * 0.42} 0 L ${-w * 0.12} ${w * 0.3} L ${w * 0.45} ${-w * 0.35}`} fill="none" stroke={INK} strokeWidth={w * 0.28} strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M ${-w * 0.42} 0 L ${-w * 0.12} ${w * 0.3} L ${w * 0.45} ${-w * 0.35}`} fill="none" stroke="#3DBE4F" strokeWidth={w * 0.17} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );

// Outlined text mark ("?", "!") in the channel's text style.
export const Mark: React.FC<{x: number; y: number; size: number; s: number; text: string; rot?: number; fill?: string}> = ({x, y, size, s, text, rot = 0, fill = '#fff'}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <text
        x={0}
        y={size * 0.35}
        textAnchor="middle"
        fontFamily={FONT}
        fontWeight={900}
        fontSize={size}
        fill={fill}
        stroke={INK}
        strokeWidth={size * 0.12}
        paintOrder="stroke"
        strokeLinejoin="round"
      >
        {text}
      </text>
    </g>
  );
