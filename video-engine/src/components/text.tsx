import React from 'react';
import {easeInOut, easeOut, prog, rnd} from '../lib/anim';
import {useScene} from '../lib/scene';
import {C} from './draw';

export const FONT_TITLE = '"Permanent Marker", cursive';
export const FONT_LABEL = '"Caveat Brush", cursive';

let canvas: HTMLCanvasElement | null = null;
export const measure = (text: string, size: number, font: string) => {
  if (typeof document === 'undefined') return text.length * size * 0.55;
  if (!canvas) canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  ctx.font = `${size}px ${font}`;
  return ctx.measureText(text).width;
};

const wavy = (x: number, y: number, w: number, seed: number) => {
  const n = 6;
  let d = `M${x},${y + (rnd(seed) - 0.5) * 4}`;
  for (let i = 1; i <= n; i++) d += ` L${x + (w * i) / n},${y + (rnd(seed + i) - 0.5) * 7}`;
  return d;
};

/** Hand-lettered text that writes on letter by letter, then an underline sweeps under it. */
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
  underline?: 'red' | 'double' | 'blue' | null;
  rot?: number;
  instant?: boolean;
  outlineWhite?: boolean;
}> = ({text, x, y, at, size = 56, font = 'label', color = C.ink, anchor = 'start', cps = 26, underline = null, rot = 0, instant, outlineWhite}) => {
  const {t} = useScene();
  if (t < at) return null;
  const fam = font === 'title' ? FONT_TITLE : FONT_LABEL;
  const writeDur = instant ? 0 : Math.min(1.4, text.length / cps);
  const n = instant ? text.length : Math.ceil(text.length * easeOut(prog(t, at, writeDur || 0.01)));
  const shown = text.slice(0, n);
  const w = measure(text, size, fam);
  const x0 = anchor === 'start' ? x : anchor === 'middle' ? x - w / 2 : x - w;
  const up = easeInOut(prog(t, at + writeDur, 0.35));
  const ucol = underline === 'blue' ? C.blue : C.red;
  return (
    <g transform={rot ? `rotate(${rot},${x},${y})` : undefined}>
      {outlineWhite && (
        <text x={x0} y={y} fontFamily={fam} fontSize={size} fill="none" stroke={C.board} strokeWidth={size * 0.18} strokeLinejoin="round">
          {shown}
        </text>
      )}
      <text x={x0} y={y} fontFamily={fam} fontSize={size} fill={color}>
        {shown}
      </text>
      {underline && up > 0 && (
        <>
          <path d={wavy(x0 - 6, y + size * 0.2, w + 12, 3)} fill="none" stroke={ucol} strokeWidth={Math.max(5, size * 0.09)} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - up} />
          {underline === 'double' && (
            <path d={wavy(x0 + 4, y + size * 0.34, w - 8, 9)} fill="none" stroke={ucol} strokeWidth={Math.max(4, size * 0.07)} strokeLinecap="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - up} />
          )}
        </>
      )}
    </g>
  );
};

/** Scene title: top-left, Permanent Marker, red underline. */
export const Title: React.FC<{text: string; at?: number}> = ({text, at = 0.1}) => (
  <MText text={text} x={90} y={130} at={at} size={66} font="title" underline="red" cps={30} />
);

/** Small label (Caveat Brush) */
export const Label: React.FC<{text: string; x: number; y: number; at: number; size?: number; color?: string; anchor?: 'start' | 'middle' | 'end'; underline?: 'red' | 'double' | 'blue' | null; rot?: number}> = (p) => (
  <MText font="label" size={p.size ?? 46} anchor={p.anchor ?? 'middle'} {...p} />
);

/** Number that rolls from `from` to `to`. */
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
  decimals?: number;
  step?: number;
}> = ({x, y, at, to, from = 0, dur = 1.2, size = 120, prefix = '', suffix = '', color = C.ink, anchor = 'middle', decimals = 0, step}) => {
  const {t} = useScene();
  if (t < at) return null;
  const p = prog(t, at, dur);
  const st = step ?? (to >= 100000 ? 1000 : to >= 10000 ? 10 : 1);
  let v = from + (to - from) * easeOut(p);
  v = p >= 0.98 ? to : Math.round(v / st) * st;
  const s = decimals ? v.toFixed(decimals) : Math.round(v).toLocaleString('en-US');
  return (
    <text x={x} y={y} fontFamily={FONT_TITLE} fontSize={size} fill={color} textAnchor={anchor}>
      {prefix + s + suffix}
    </text>
  );
};

/** Big static number/phrase that pops (with optional yellow '=' accents) */
export const BigText: React.FC<{text: string; x: number; y: number; at: number; size?: number; color?: string; eq?: boolean}> = ({text, x, y, at, size = 130, color = C.ink, eq}) => {
  const {t} = useScene();
  if (t < at) return null;
  const p = prog(t, at, 0.45);
  const s = p >= 1 ? 1 : 1 + 1.9 * Math.pow(p - 1, 2) + 2.9 * Math.pow(p - 1, 3);
  const w = measure(text, size, FONT_TITLE);
  return (
    <g transform={`translate(${x},${y}) scale(${s}) translate(${-x},${-y})`}>
      {eq && (
        <>
          <path d={`M${x - w / 2 - 90},${y - size * 0.42} h55 M${x - w / 2 - 90},${y - size * 0.22} h55`} stroke={C.yellow} strokeWidth={12} strokeLinecap="round" />
          <path d={`M${x + w / 2 + 35},${y - size * 0.42} h55 M${x + w / 2 + 35},${y - size * 0.22} h55`} stroke={C.yellow} strokeWidth={12} strokeLinecap="round" />
        </>
      )}
      <text x={x} y={y} fontFamily={FONT_TITLE} fontSize={size} fill={color} textAnchor="middle">
        {text}
      </text>
    </g>
  );
};
