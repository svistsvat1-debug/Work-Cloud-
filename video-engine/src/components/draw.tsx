import React, {useId} from 'react';
import {back, easeInOut, easeOut, pop, prog, rnd} from '../lib/anim';
import {useScene} from '../lib/scene';

export const C = {
  board: '#FAF8F3',
  ink: '#1A1A1A',
  red: '#E8322B',
  orange: '#F58A1F',
  yellow: '#FFC93C',
  blue: '#1E88E5',
  green: '#3BA55C',
  olive: '#6B7B3A',
  khaki: '#C2B280',
  steel: '#6E7B85',
  grey: '#9A9A9A',
  light: '#D9D4C7',
};

/** A marker stroke that draws on along its length. */
export const Stroke: React.FC<{
  d: string;
  at?: number;
  dur?: number;
  color?: string;
  w?: number;
  opacity?: number;
  dash?: string;
  instant?: boolean;
}> = ({d, at = 0, dur = 0.8, color = C.ink, w = 5, opacity = 1, dash, instant}) => {
  const {t} = useScene();
  const p = instant ? (t >= at ? 1 : 0) : easeInOut(prog(t, at, dur));
  if (p <= 0) return null;
  if (dash) {
    // dashed lines: reveal with a mask-like trick using a second solid path as clip is costly; fade+draw approx
    return (
      <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} opacity={opacity * Math.min(1, p * 1.5)} />
    );
  }
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={w}
      strokeLinecap="round"
      strokeLinejoin="round"
      pathLength={1}
      strokeDasharray="1 1"
      strokeDashoffset={1 - p}
      opacity={opacity}
    />
  );
};

/** zig-zag scribble path covering a bbox (diagonal hatching like marker fill) */
const zigzag = (x: number, y: number, w: number, h: number, sp: number, seed: number) => {
  const pts: string[] = [];
  const n = Math.ceil((w + h) / sp) + 1;
  for (let i = 0; i < n; i++) {
    const o = i * sp;
    const j1 = (rnd(seed + i) - 0.5) * sp * 0.6;
    const j2 = (rnd(seed + i + 99) - 0.5) * sp * 0.6;
    // segment from left/top edge to bottom/right edge (45deg)
    const a = i % 2 === 0;
    const p1 = [x + Math.max(0, o - h) + j1, y + Math.min(h, o)];
    const p2 = [x + Math.min(w, o) + j2, y + Math.max(0, o - w)];
    const [s, e] = a ? [p1, p2] : [p2, p1];
    pts.push(`${pts.length ? 'L' : 'M'}${s[0].toFixed(1)},${s[1].toFixed(1)} L${e[0].toFixed(1)},${e[1].toFixed(1)}`);
  }
  return pts.join(' ');
};

/** Marker scribble fill clipped to a shape. */
export const Scribble: React.FC<{
  d: string;
  box: [number, number, number, number];
  color: string;
  at?: number;
  dur?: number;
  sp?: number;
  w?: number;
  opacity?: number;
  seed?: number;
  instant?: boolean;
}> = ({d, box, color, at = 0, dur = 0.7, sp = 15, w = 15, opacity = 0.9, seed = 1, instant}) => {
  const id = useId().replace(/:/g, '');
  const {t} = useScene();
  const p = instant ? (t >= at ? 1 : 0) : easeOut(prog(t, at, dur));
  if (p <= 0) return null;
  const [x, y, bw, bh] = box;
  return (
    <g>
      <defs>
        <clipPath id={`c${id}`}>
          <path d={d} />
        </clipPath>
      </defs>
      <g clipPath={`url(#c${id})`}>
        <path d={`M${x},${y} h${bw} v${bh} h${-bw} Z`} fill={color} opacity={0.35 * p} />
        <path
          d={zigzag(x - 10, y - 10, bw + 20, bh + 20, sp, seed)}
          fill="none"
          stroke={color}
          strokeWidth={w}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray="1 1"
          strokeDashoffset={1 - p}
          opacity={opacity}
        />
      </g>
    </g>
  );
};

export type Part = {d: string; fill?: string; w?: number; noStroke?: boolean; color?: string};
export type IconDef = {w: number; h: number; parts: Part[]};

/** Parametric icon: outlines draw on, then scribble fill. (x,y) = center. */
export const Icon: React.FC<{
  def: IconDef;
  x: number;
  y: number;
  s?: number;
  at?: number;
  draw?: number;
  fill?: number;
  rot?: number;
  flip?: boolean;
  mode?: 'draw' | 'pop' | 'instant';
  opacity?: number;
  override?: Record<number, string>;
  seed?: number;
}> = ({def, x, y, s = 1, at = 0, draw = 0.9, fill = 0.6, rot = 0, flip, mode = 'draw', opacity = 1, override, seed = 3}) => {
  const {t} = useScene();
  if (t < at) return null;
  const instant = mode === 'instant' || mode === 'pop';
  const sc = mode === 'pop' ? pop(t, at, 0.45) : 1;
  const tr = `translate(${x},${y}) rotate(${rot}) scale(${s * sc * (flip ? -1 : 1)},${s * sc}) translate(${-def.w / 2},${-def.h / 2})`;
  const fillAt = at + (instant ? 0 : draw * 0.85);
  return (
    <g transform={tr} opacity={opacity}>
      {def.parts.map((p, i) => {
        const col = override?.[i] ?? p.fill;
        return col ? (
          <Scribble key={'f' + i} d={p.d} box={[0, 0, def.w, def.h]} color={col} at={fillAt + i * 0.05} dur={fill} instant={instant} seed={seed + i} sp={Math.max(9, 15 / Math.max(0.6, s))} w={Math.max(9, 15 / Math.max(0.6, s))} />
        ) : null;
      })}
      {def.parts.map((p, i) =>
        p.noStroke ? null : (
          <Stroke key={'s' + i} d={p.d} at={at + (instant ? 0 : (i / def.parts.length) * draw * 0.35)} dur={draw * 0.65} w={(p.w ?? 5) / s} color={p.color ?? C.ink} instant={instant} />
        ),
      )}
    </g>
  );
};

/** Pop-in wrapper (scale with overshoot around a point). */
export const Pop: React.FC<{x: number; y: number; at: number; dur?: number; children: React.ReactNode}> = ({x, y, at, dur = 0.45, children}) => {
  const {t} = useScene();
  if (t < at) return null;
  const s = pop(t, at, dur);
  return <g transform={`translate(${x},${y}) scale(${s}) translate(${-x},${-y})`}>{children}</g>;
};

/** Fade wrapper */
export const Fade: React.FC<{at: number; dur?: number; out?: number; outDur?: number; children: React.ReactNode}> = ({at, dur = 0.4, out, outDur = 0.4, children}) => {
  const {t} = useScene();
  if (t < at) return null;
  let o = prog(t, at, dur);
  if (out !== undefined) o *= 1 - prog(t, out, outDur);
  if (o <= 0) return null;
  return <g opacity={o}>{children}</g>;
};

/** Move wrapper: translate from (dx0,dy0) to (dx1,dy1) between at..at+dur */
export const Move: React.FC<{at: number; dur: number; from?: [number, number]; to?: [number, number]; children: React.ReactNode}> = ({at, dur, from = [0, 0], to = [0, 0], children}) => {
  const {t} = useScene();
  const p = easeInOut(prog(t, at, dur));
  const x = from[0] + (to[0] - from[0]) * p;
  const y = from[1] + (to[1] - from[1]) * p;
  return <g transform={`translate(${x},${y})`}>{children}</g>;
};

/** Yellow burst dashes around a point (key numbers). */
export const Burst: React.FC<{x: number; y: number; r?: number; rx?: number; ry?: number; at: number; n?: number; color?: string}> = ({x, y, r = 120, rx, ry, at, n = 14, color = C.yellow}) => {
  const {t} = useScene();
  if (t < at) return null;
  const s = back(prog(t, at, 0.5));
  const RX = rx ?? r;
  const RY = ry ?? r;
  return (
    <g>
      {Array.from({length: n}).map((_, i) => {
        const a = (i / n) * Math.PI * 2 + 0.2;
        const len = 0.22 + rnd(i + 5) * 0.12;
        const x1 = x + Math.cos(a) * RX * (1 + 0.02) ;
        const y1 = y + Math.sin(a) * RY;
        const x2 = x + Math.cos(a) * RX * (1 + len * s);
        const y2 = y + Math.sin(a) * RY * (1 + len * s);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={9} strokeLinecap="round" opacity={Math.min(1, s * 1.2)} />;
      })}
    </g>
  );
};

/** Red marker arrow (curved), head pops after the line is drawn. */
export const Arrow: React.FC<{
  from: [number, number];
  to: [number, number];
  at: number;
  dur?: number;
  bend?: number;
  color?: string;
  w?: number;
  head?: number;
  dash?: boolean;
}> = ({from, to, at, dur = 0.7, bend = 0.2, color = C.red, w = 7, head = 26, dash}) => {
  const {t} = useScene();
  if (t < at) return null;
  const [x1, y1] = from;
  const [x2, y2] = to;
  const mx = (x1 + x2) / 2 - (y2 - y1) * bend;
  const my = (y1 + y2) / 2 + (x2 - x1) * bend;
  const d = `M${x1},${y1} Q${mx},${my} ${x2},${y2}`;
  const p = prog(t, at, dur);
  const ang = Math.atan2(y2 - my, x2 - mx);
  const hs = back(prog(t, at + dur * 0.9, 0.35));
  const hx1 = x2 - Math.cos(ang - 0.45) * head * hs;
  const hy1 = y2 - Math.sin(ang - 0.45) * head * hs;
  const hx2 = x2 - Math.cos(ang + 0.45) * head * hs;
  const hy2 = y2 - Math.sin(ang + 0.45) * head * hs;
  return (
    <g>
      {dash ? (
        <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeDasharray="4 18" opacity={Math.min(1, p * 2)} />
      ) : (
        <path d={d} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - easeInOut(p)} />
      )}
      {hs > 0 && <path d={`M${hx1},${hy1} L${x2},${y2} L${hx2},${hy2}`} fill="none" stroke={color} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />}
    </g>
  );
};

/** Hand-drawn rough rectangle path */
export const roughRect = (x: number, y: number, w: number, h: number, j = 3, seed = 1) => {
  const r = (i: number) => (rnd(seed + i) - 0.5) * 2 * j;
  return `M${x + r(1)},${y + r(2)} L${x + w + r(3)},${y + r(4)} L${x + w + r(5)},${y + h + r(6)} L${x + r(7)},${y + h + r(8)} Z`;
};

/** circle path */
export const circ = (cx: number, cy: number, r: number) => `M${cx - r},${cy} a${r},${r} 0 1,0 ${2 * r},0 a${r},${r} 0 1,0 ${-2 * r},0`;
