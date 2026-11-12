import React, {useId, useMemo} from 'react';
import {useCurrentFrame} from 'remotion';
import {bbox, hatch, markerPath, poly, Pt, seedOf} from '../lib/sketch';
import {C, FONT_LABEL, FONT_TITLE} from '../lib/theme';
import {lin, popScale, prog} from '../lib/timing';
import {MarkerFill, useScale} from './marker';

// ---------- text measuring (fonts are loaded before the first frame) ----------
let ctx: CanvasRenderingContext2D | null = null;
export const measure = (text: string, size: number, font = FONT_TITLE) => {
  if (typeof document === 'undefined') return text.length * size * 0.55;
  if (!ctx) ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return text.length * size * 0.55;
  ctx.font = `${size}px ${font}`;
  return ctx.measureText(text).width;
};

// ---------- a single marker stroke that draws on ----------
export const Stroke: React.FC<{
  d: string;
  at: number;
  dur?: number;
  color?: string;
  w?: number;
  opacity?: number;
  dash?: string;
}> = ({d, at, dur = 18, color = C.ink, w: w0 = 5, opacity = 1, dash}) => {
  const f = useCurrentFrame();
  const sc = useScale();
  const w = w0 * 1.15 * Math.pow(1 / Math.max(0.15, sc), 0.55);
  const p = prog(f, at, dur);
  if (p <= 0) return null;
  if (dash) {
    return (
      <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" opacity={opacity * Math.min(1, p * 3)} strokeDasharray={dash} />
    );
  }
  return (
    <path
      d={d}
      pathLength={1}
      fill="none"
      stroke={color}
      strokeWidth={w}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray="1 1"
      strokeDashoffset={1 - p}
      opacity={opacity}
    />
  );
};

// ---------- scribble fill clipped to a shape ----------
export const Fill: React.FC<{
  pts: Pt[];
  color: string;
  at: number;
  dur?: number;
  gap?: number;
  w?: number;
  angle?: number;
  tint?: number;
  seed?: number;
}> = ({pts, color, at, dur = 14, gap = 10, w = 13, angle = -32, tint = 0.35, seed}) => {
  const f = useCurrentFrame();
  const id = useId().replace(/:/g, '');
  const s = seed ?? seedOf(pts.length, pts[0][0], pts[0][1]);
  const d = useMemo(() => hatch(bbox(pts), gap, angle, s), [pts, gap, angle, s]);
  const clip = useMemo(() => poly(pts), [pts]);
  const p = prog(f, at, dur);
  if (p <= 0) return null;
  return (
    <g>
      <clipPath id={`c${id}`}>
        <path d={clip} />
      </clipPath>
      <g clipPath={`url(#c${id})`}>
        <path d={clip} fill={color} opacity={tint * p} />
        <path d={d} pathLength={1} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 1" strokeDashoffset={1 - p} opacity={0.92} />
      </g>
    </g>
  );
};

// ---------- multi-part drawing: outlines draw on one after another, then fills ----------
export type Part = {
  pts?: Pt[];
  d?: string; // raw path (no wobble)
  closed?: boolean;
  fill?: string;
  solid?: boolean; // quick fill (small/simple areas)
  flat?: boolean; // plain colour, no marker texture
  shade?: number; // shade band width override
  w?: number;
  color?: string;
  amp?: number;
  noStroke?: boolean;
  gap?: number;
  angle?: number;
};

export const Drawing: React.FC<{parts: Part[]; at: number; dur?: number; fillDur?: number; seed?: number; fillAt?: number}> = ({
  parts,
  at,
  dur = 24,
  fillDur = 14,
  seed = 1,
  fillAt,
}) => {
  const paths = useMemo(
    () =>
      parts.map((p, i) => (p.d ? p.d : p.pts ? markerPath(p.pts, !!p.closed, seed * 131 + i * 17, p.amp ?? 2.0) : '')),
    [parts, seed],
  );
  const n = parts.length;
  const slot = dur / Math.max(1, n);
  const fStart = fillAt ?? at + dur;
  const f = useCurrentFrame();
  if (f < at) return null;
  return (
    <g>
      {parts.map((p, i) =>
        p.fill && p.pts ? (
          p.flat ? (
            <path key={`f${i}`} d={poly(p.pts)} fill={p.fill} opacity={prog(f, fStart, fillDur)} />
          ) : (
            <MarkerFill key={`f${i}`} pts={p.pts} color={p.fill} at={fStart + (p.solid ? 0 : i * 0.6)} dur={p.solid ? Math.max(5, fillDur * 0.6) : fillDur} seed={seed * 7 + i} shade={p.shade} />
          )
        ) : null,
      )}
      {parts.map((p, i) =>
        p.noStroke ? null : (
          <Stroke key={`s${i}`} d={paths[i]} at={at + i * slot * 0.85} dur={Math.max(4, slot * 1.4)} color={p.color ?? C.ink} w={p.w ?? 5} />
        ),
      )}
    </g>
  );
};

// ---------- transforms ----------
export const Pop: React.FC<{at: number; x: number; y: number; dur?: number; children: React.ReactNode}> = ({at, x, y, dur = 10, children}) => {
  const f = useCurrentFrame();
  const s = popScale(f, at, dur);
  if (s <= 0) return null;
  return <g transform={`translate(${x},${y}) scale(${s}) translate(${-x},${-y})`}>{children}</g>;
};

export const Fade: React.FC<{out?: number; outDur?: number; in?: number; inDur?: number; to?: number; children: React.ReactNode}> = ({
  out,
  outDur = 10,
  in: inAt,
  inDur = 8,
  to = 0,
  children,
}) => {
  const f = useCurrentFrame();
  let o = 1;
  if (inAt !== undefined) o *= prog(f, inAt, inDur);
  if (out !== undefined) o *= 1 - (1 - to) * prog(f, out, outDur);
  if (o <= 0.001) return null;
  return <g opacity={o}>{children}</g>;
};

export const Move: React.FC<{at: number; dur?: number; from: [number, number]; to: [number, number]; children: React.ReactNode}> = ({
  at,
  dur = 20,
  from,
  to,
  children,
}) => {
  const f = useCurrentFrame();
  const p = prog(f, at, dur);
  const x = from[0] + (to[0] - from[0]) * p;
  const y = from[1] + (to[1] - from[1]) * p;
  return <g transform={`translate(${x},${y})`}>{children}</g>;
};

// ---------- marker text: letter by letter, then a red underline sweeps ----------
export const MText: React.FC<{
  text: string;
  x: number;
  y: number;
  at: number;
  size?: number;
  font?: 'title' | 'label';
  color?: string;
  anchor?: 'start' | 'middle' | 'end';
  cps?: number;
  underline?: boolean | string;
  ulAt?: number;
  rotate?: number;
  weight?: number;
}> = ({text, x, y, at, size = 56, font = 'title', color = C.ink, anchor = 'start', cps = 22, underline = false, ulAt, rotate = 0}) => {
  const f = useCurrentFrame();
  const fam = font === 'title' ? FONT_TITLE : FONT_LABEL;
  const width = measure(text, size, fam);
  const chars = [...text];
  const perChar = 30 / cps;
  const shown = Math.floor((f - at) / perChar) + 1;
  const ul = useMemo(() => {
    const x0 = anchor === 'start' ? x : anchor === 'middle' ? x - width / 2 : x - width;
    return markerPath(
      [
        [x0 - 6, y + size * 0.22],
        [x0 + width * 0.5, y + size * 0.26],
        [x0 + width + 10, y + size * 0.19],
      ],
      false,
      seedOf(text, x, y),
      2.5,
    );
  }, [x, y, width, size, anchor, text]);
  if (f < at) return null;
  const doneAt = at + chars.length * perChar;
  return (
    <g transform={rotate ? `rotate(${rotate},${x},${y})` : undefined}>
      <text x={x} y={y} fontFamily={fam} fontSize={size} fill={color} textAnchor={anchor}>
        {chars.map((ch, i) => (
          <tspan key={i} opacity={i < shown ? 1 : 0}>
            {ch}
          </tspan>
        ))}
      </text>
      {underline ? (
        <Stroke d={ul} at={ulAt ?? doneAt} dur={10} color={typeof underline === 'string' ? underline : C.red} w={Math.max(5, size * 0.11)} />
      ) : null}
    </g>
  );
};

export const Title: React.FC<{text: string; at?: number; size?: number}> = ({text, at = 2, size = 62}) => (
  <MText text={text} x={70} y={112} at={at} size={size} underline cps={26} />
);

// ---------- yellow burst dashes around a point ----------
export const Burst: React.FC<{x: number; y: number; at: number; r?: number; rx?: number; ry?: number; n?: number; color?: string}> = ({
  x,
  y,
  at,
  r = 120,
  rx,
  ry,
  n = 12,
  color = C.yellow,
}) => {
  const f = useCurrentFrame();
  const s = popScale(f, at, 9);
  if (s <= 0) return null;
  const RX = rx ?? r;
  const RY = ry ?? r;
  const lines = [];
  for (let i = 0; i < n; i++) {
    const a = (Math.PI * 2 * i) / n + 0.2;
    const c = Math.cos(a), sn = Math.sin(a);
    const r0 = 1.0, r1 = 1.28;
    lines.push(
      <line
        key={i}
        x1={x + c * RX * r0 * s}
        y1={y + sn * RY * r0 * s}
        x2={x + c * RX * r1 * s}
        y2={y + sn * RY * r1 * s}
        stroke={color}
        strokeWidth={10}
        strokeLinecap="round"
      />,
    );
  }
  return <g>{lines}</g>;
};

// ---------- arrow with a hand-drawn head ----------
export const Arrow: React.FC<{
  from: Pt;
  to: Pt;
  at: number;
  dur?: number;
  color?: string;
  w?: number;
  bend?: number;
  label?: string;
  labelPos?: Pt;
  labelSize?: number;
  head?: number;
}> = ({from, to, at, dur = 14, color = C.red, w = 8, bend = 0, label, labelPos, labelSize = 44, head = 26}) => {
  const mid: Pt = [(from[0] + to[0]) / 2 - (to[1] - from[1]) * bend, (from[1] + to[1]) / 2 + (to[0] - from[0]) * bend];
  const d = useMemo(() => markerPath([from, mid, to], false, seedOf(from[0], to[0], from[1]), 1.6), [from, mid, to]);
  const ang = Math.atan2(to[1] - mid[1], to[0] - mid[0]);
  const h1: Pt = [to[0] - Math.cos(ang - 0.45) * head, to[1] - Math.sin(ang - 0.45) * head];
  const h2: Pt = [to[0] - Math.cos(ang + 0.45) * head, to[1] - Math.sin(ang + 0.45) * head];
  const hd = `M${h1[0]},${h1[1]}L${to[0]},${to[1]}L${h2[0]},${h2[1]}`;
  return (
    <g>
      <Stroke d={d} at={at} dur={dur} color={color} w={w} />
      <Stroke d={hd} at={at + dur - 2} dur={5} color={color} w={w} />
      {label ? (
        <MText text={label} x={(labelPos ?? mid)[0]} y={(labelPos ?? mid)[1]} at={at + dur} size={labelSize} color={color} font="title" anchor="middle" />
      ) : null}
    </g>
  );
};

// ---------- rolling number ----------
export const fmt = (n: number) => Math.round(n).toLocaleString('en-US');
export const Counter: React.FC<{
  x: number;
  y: number;
  at: number;
  to: number;
  from?: number;
  dur?: number;
  size?: number;
  prefix?: string;
  suffix?: string;
  color?: string;
  anchor?: 'start' | 'middle' | 'end';
  burst?: boolean;
}> = ({x, y, at, to, from = 0, dur = 24, size = 110, prefix = '', suffix = '', color = C.ink, anchor = 'middle', burst = false}) => {
  const f = useCurrentFrame();
  if (f < at) return null;
  const p = lin(f, at, dur);
  const e = 1 - Math.pow(1 - p, 3);
  const v = from + (to - from) * e;
  const s = popScale(f, at, 8);
  const txt = `${prefix}${fmt(v)}${suffix}`;
  const wFinal = measure(`${prefix}${fmt(to)}${suffix}`, size);
  return (
    <g>
      {burst ? <Burst x={anchor === 'middle' ? x : anchor === 'start' ? x + wFinal / 2 : x - wFinal / 2} y={y - size * 0.33} at={at + dur} rx={wFinal * 0.62 + 30} ry={size * 0.75} /> : null}
      <g transform={`translate(${x},${y}) scale(${s}) translate(${-x},${-y})`}>
        <text x={x} y={y} fontFamily={FONT_TITLE} fontSize={size} fill={color} textAnchor={anchor}>
          {txt}
        </text>
      </g>
    </g>
  );
};

// ---------- small helpers ----------
export const Label: React.FC<{text: string; x: number; y: number; at: number; size?: number; color?: string; anchor?: 'start' | 'middle' | 'end'}> = ({
  text,
  x,
  y,
  at,
  size = 56,
  color = C.ink,
  anchor = 'middle',
}) => <MText text={text} x={x} y={y} at={at} size={size} font="label" color={color} anchor={anchor} cps={30} />;

export const RedX: React.FC<{x: number; y: number; at: number; r?: number}> = ({x, y, at, r = 60}) => {
  const d1 = useMemo(() => markerPath([[x - r, y - r], [x + r, y + r]], false, seedOf('x1', x, y), 2), [x, y, r]);
  const d2 = useMemo(() => markerPath([[x + r, y - r], [x - r, y + r]], false, seedOf('x2', x, y), 2), [x, y, r]);
  return (
    <g>
      <Stroke d={d1} at={at} dur={6} color={C.red} w={11} />
      <Stroke d={d2} at={at + 5} dur={6} color={C.red} w={11} />
    </g>
  );
};

export const Check: React.FC<{x: number; y: number; at: number; s?: number; color?: string}> = ({x, y, at, s = 1, color = C.green}) => {
  const d = useMemo(() => markerPath([[x - 18 * s, y], [x - 4 * s, y + 16 * s], [x + 24 * s, y - 22 * s]], false, seedOf('ck', x, y), 1.2), [x, y, s]);
  return <Stroke d={d} at={at} dur={8} color={color} w={9 * s} />;
};

export const Circle: React.FC<{x: number; y: number; r: number; at: number; color?: string; w?: number; dur?: number}> = ({x, y, r, at, color = C.red, w = 7, dur = 12}) => {
  const d = useMemo(() => {
    const pts: Pt[] = [];
    for (let i = 0; i <= 30; i++) {
      const a = -1.2 + (Math.PI * 2.15 * i) / 30;
      pts.push([x + Math.cos(a) * r * 1.15, y + Math.sin(a) * r * 0.8]);
    }
    return markerPath(pts, false, seedOf('circ', x, y), 2);
  }, [x, y, r]);
  return <Stroke d={d} at={at} dur={dur} color={color} w={w} />;
};

export const Line: React.FC<{pts: Pt[]; at: number; dur?: number; color?: string; w?: number; amp?: number}> = ({pts, at, dur = 14, color = C.ink, w = 5, amp = 2}) => {
  const d = useMemo(() => markerPath(pts, false, seedOf('ln', pts[0][0], pts[0][1], pts.length), amp), [pts, amp]);
  return <Stroke d={d} at={at} dur={dur} color={color} w={w} />;
};

export const QMark: React.FC<{x: number; y: number; at: number; size?: number; color?: string}> = ({x, y, at, size = 110, color = C.steel}) => (
  <Pop at={at} x={x} y={y - size * 0.35}>
    <text x={x} y={y} fontFamily={FONT_TITLE} fontSize={size} fill={color} textAnchor="middle">
      ?
    </text>
  </Pop>
);
