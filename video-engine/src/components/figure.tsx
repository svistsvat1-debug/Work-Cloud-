import React from 'react';
import {easeInOut, easeOut, pop, prog, rnd} from '../lib/anim';
import {useScene} from '../lib/scene';
import {C, circ, Scribble, Stroke} from './draw';
import {FONT_TITLE} from './text';

export type Pose = 'stand' | 'dig' | 'sit' | 'read' | 'walk' | 'kneel' | 'drive' | 'wave';

/** Stick-figure soldier/person. (x,y) = feet center. Height ~ 210*s. */
export const Fig: React.FC<{
  x: number;
  y: number;
  s?: number;
  at?: number;
  color?: string;
  helmet?: boolean;
  headscarf?: boolean;
  cap?: boolean;
  pose?: Pose;
  mode?: 'draw' | 'pop' | 'instant';
  armband?: boolean;
  flip?: boolean;
  draw?: number;
  opacity?: number;
  bandage?: boolean;
  stripes?: number; // sergeant stripes visible (0..1 fade)
  rifle?: boolean;
}> = ({x, y, s = 1, at = 0, color = C.olive, helmet = true, headscarf, cap, pose = 'stand', mode = 'draw', armband, flip, draw = 1.0, opacity = 1, bandage, stripes, rifle}) => {
  const {t} = useScene();
  if (t < at) return null;
  const inst = mode !== 'draw';
  const sc = mode === 'pop' ? pop(t, at, 0.45) : 1;
  const lt = t - at;
  // limb animation
  let armL = 'M50,78 L28,118';
  let armR = 'M50,78 L74,118';
  let legs = 'M50,138 L32,205 M50,138 L68,205';
  let bodyTop = 'M50,62 L50,138';
  if (pose === 'dig') {
    const a = Math.sin(lt * 5) * 0.5 + 0.5;
    armL = `M50,82 L${30 + a * 8},${112 - a * 10}`;
    armR = `M50,82 L${66 + a * 10},${110 - a * 18}`;
    bodyTop = 'M52,64 L46,138';
  } else if (pose === 'sit') {
    legs = 'M50,138 L84,140 L86,205 M50,138 L78,150 L76,205';
    armL = 'M50,80 L72,112';
    armR = 'M50,80 L82,108';
  } else if (pose === 'read') {
    armL = 'M50,80 L70,104';
    armR = 'M50,80 L80,100';
  } else if (pose === 'walk') {
    const a = Math.sin(lt * 6);
    legs = `M50,138 L${50 - 18 * a},205 M50,138 L${50 + 18 * a},205`;
    armL = `M50,78 L${50 + 20 * a},118`;
    armR = `M50,78 L${50 - 20 * a},118`;
  } else if (pose === 'kneel') {
    legs = 'M50,138 L30,170 L18,205 M50,138 L78,168 L82,205';
    armL = 'M50,80 L78,128';
    armR = 'M50,80 L88,120';
  } else if (pose === 'drive') {
    armL = 'M50,80 L80,104';
    armR = 'M50,80 L86,96';
    legs = 'M50,138 L84,140 L86,180';
  } else if (pose === 'wave') {
    const a = Math.sin(lt * 7) * 8;
    armR = `M50,78 L${78 + a},40`;
  }
  const tr = `translate(${x},${y}) scale(${s * sc * (flip ? -1 : 1)},${s * sc}) translate(-50,-205)`;
  const torso = 'M38,62 Q50,56 62,62 L64,138 L36,138 Z';
  const lw = 6 / Math.max(0.4, s) * Math.min(1, s * 1.2);
  return (
    <g transform={tr} opacity={opacity}>
      <Scribble d={torso} box={[30, 50, 40, 95]} color={color} at={at + (inst ? 0 : draw * 0.6)} dur={0.5} instant={inst} sp={10} w={10} />
      <Stroke d={circ(50, 38, 19)} at={at} dur={draw * 0.4} w={lw} instant={inst} />
      <Stroke d={torso} at={at + draw * 0.2} dur={draw * 0.4} w={lw} instant={inst} />
      <Stroke d={bodyTop} at={at + draw * 0.2} dur={draw * 0.3} w={lw} instant={inst} opacity={0} />
      <Stroke d={armL + ' ' + armR} at={at + draw * 0.35} dur={draw * 0.4} w={lw} instant={inst} />
      <Stroke d={legs} at={at + draw * 0.45} dur={draw * 0.4} w={lw} instant={inst} />
      {helmet && (
        <g>
          <Scribble d="M28,36 Q30,10 50,10 Q70,10 72,36 Z" box={[24, 6, 54, 34]} color={color === C.grey || color === '#bdbdbd' ? '#8f8f8f' : C.olive} at={at + (inst ? 0 : draw * 0.5)} dur={0.4} instant={inst} sp={8} w={8} />
          <Stroke d="M24,36 L76,36 M28,36 Q30,10 50,10 Q70,10 72,36" at={at + draw * 0.15} dur={draw * 0.35} w={lw} instant={inst} />
        </g>
      )}
      {headscarf && (
        <g>
          <Scribble d="M30,34 Q30,14 50,14 Q72,14 70,34 Z" box={[26, 10, 50, 28]} color={C.red} at={at + (inst ? 0 : draw * 0.5)} dur={0.4} instant={inst} sp={8} w={8} />
          <Stroke d="M30,34 Q30,14 50,14 Q72,14 70,34 Z" at={at + draw * 0.15} dur={draw * 0.35} w={lw} instant={inst} />
        </g>
      )}
      {cap && <Stroke d="M30,26 Q50,4 70,26 Z M70,26 L82,28" at={at + draw * 0.15} dur={draw * 0.35} w={lw} instant={inst} />}
      {armband && (
        <g>
          <path d="M26,92 L40,86 L44,98 L30,104 Z" fill="#fff" stroke={C.ink} strokeWidth={2} />
          <path d="M33,90 L37,100 M30,96 L41,92" stroke={C.red} strokeWidth={3} />
        </g>
      )}
      {bandage && t > at && (
        <g>
          <path d="M58,170 L76,166 L78,178 L60,182 Z" fill="#fff" stroke={C.ink} strokeWidth={2} />
          <path d="M64,170 L70,178 M62,178 L72,169" stroke={C.red} strokeWidth={3} />
        </g>
      )}
      {stripes !== undefined && stripes > 0 && (
        <g opacity={stripes}>
          <path d="M60,88 L67,82 L74,88 M60,95 L67,89 L74,95 M60,102 L67,96 L74,102" fill="none" stroke={C.yellow} strokeWidth={4} />
        </g>
      )}
      {rifle && <Stroke d="M76,120 L92,40" at={at + draw * 0.5} dur={0.3} w={lw * 1.2} instant={inst} color="#6b4423" />}
    </g>
  );
};

/** Grid of small pop-in figures (crowds / queues). */
export const Crowd: React.FC<{
  x: number;
  y: number;
  cols: number;
  rows: number;
  gap?: number;
  rowGap?: number;
  s?: number;
  at: number;
  stagger?: number;
  color?: string;
  highlight?: number[];
  hiColor?: string;
  helmet?: boolean;
}> = ({x, y, cols, rows, gap = 40, rowGap = 70, s = 0.25, at, stagger = 0.02, color = '#bdbdbd', highlight = [], hiColor = C.red, helmet = false}) => {
  const {t} = useScene();
  if (t < at) return null;
  const items = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const a = at + i * stagger;
      if (t < a) continue;
      const sc = pop(t, a, 0.35);
      const cx = x + c * gap + (r % 2 ? gap / 2 : 0);
      const cy = y + r * rowGap;
      const col = highlight.includes(i) ? hiColor : color;
      items.push(
        <g key={i} transform={`translate(${cx},${cy}) scale(${s * sc}) translate(-50,-205)`}>
          <circle cx={50} cy={38} r={19} fill={col} stroke={C.ink} strokeWidth={5} />
          <path d="M38,62 Q50,56 62,62 L64,138 L36,138 Z" fill={col} stroke={C.ink} strokeWidth={5} />
          <path d="M50,138 L34,205 M50,138 L66,205" stroke={C.ink} strokeWidth={6} />
          {helmet && <path d="M28,36 Q30,10 50,10 Q70,10 72,36 Z" fill={highlight.includes(i) ? C.olive : '#8f8f8f'} stroke={C.ink} strokeWidth={4} />}
        </g>,
      );
    }
  return <g>{items}</g>;
};

/** Clock face with moving hands. speed = turns per second of minute hand. */
export const Clock: React.FC<{x: number; y: number; r?: number; at: number; speed?: number; red?: boolean}> = ({x, y, r = 80, at, speed = 0.5, red}) => {
  const {t} = useScene();
  if (t < at) return null;
  const s = pop(t, at, 0.45);
  const lt = Math.max(0, t - at);
  const am = lt * speed * Math.PI * 2;
  const ah = am / 12;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <circle r={r} fill="#fff" stroke={C.ink} strokeWidth={6} />
      {Array.from({length: 12}).map((_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <line key={i} x1={Math.cos(a) * r * 0.8} y1={Math.sin(a) * r * 0.8} x2={Math.cos(a) * r * 0.92} y2={Math.sin(a) * r * 0.92} stroke={C.ink} strokeWidth={4} />;
      })}
      <line x1={0} y1={0} x2={Math.sin(am) * r * 0.72} y2={-Math.cos(am) * r * 0.72} stroke={red ? C.red : C.ink} strokeWidth={6} strokeLinecap="round" />
      <line x1={0} y1={0} x2={Math.sin(ah) * r * 0.45} y2={-Math.cos(ah) * r * 0.45} stroke={C.ink} strokeWidth={8} strokeLinecap="round" />
      <circle r={6} fill={C.ink} />
    </g>
  );
};

/** Fuel gauge E..F; value animates from v0 to v1. */
export const Gauge: React.FC<{x: number; y: number; r?: number; at: number; v0?: number; v1?: number; dur?: number; label?: string}> = ({x, y, r = 90, at, v0 = 0.9, v1 = 0, dur = 1.6, label = 'FUEL'}) => {
  const {t} = useScene();
  if (t < at) return null;
  const s = pop(t, at, 0.45);
  const v = v0 + (v1 - v0) * easeInOut(prog(t, at + 0.4, dur));
  const a = Math.PI + v * Math.PI;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <path d={`M${-r},0 A${r},${r} 0 0,1 ${r},0 Z`} fill="#fff" stroke={C.ink} strokeWidth={6} />
      <path d={`M${-r * 0.85},-8 A${r * 0.85},${r * 0.85} 0 0,1 ${-r * 0.6},${-r * 0.6}`} fill="none" stroke={C.red} strokeWidth={10} />
      <text x={-r * 0.78} y={-14} fontFamily={FONT_TITLE} fontSize={26} fill={C.red}>E</text>
      <text x={r * 0.62} y={-14} fontFamily={FONT_TITLE} fontSize={26}>F</text>
      <text x={0} y={-r * 0.35} fontFamily={FONT_TITLE} fontSize={22} textAnchor="middle">{label}</text>
      <line x1={0} y1={0} x2={Math.cos(a) * r * 0.8} y2={Math.sin(a) * r * 0.8} stroke={C.ink} strokeWidth={7} strokeLinecap="round" />
      <circle r={9} fill={C.ink} />
    </g>
  );
};

/** Vertical energy/level bar that drains. */
export const LevelBar: React.FC<{x: number; y: number; w?: number; h?: number; at: number; v0?: number; v1?: number; dur?: number}> = ({x, y, w = 70, h = 300, at, v0 = 1, v1 = 0.15, dur = 2.5}) => {
  const {t} = useScene();
  if (t < at) return null;
  const s = pop(t, at, 0.4);
  const v = v0 + (v1 - v0) * easeInOut(prog(t, at + 0.4, dur));
  const col = v > 0.6 ? C.green : v > 0.3 ? C.yellow : C.red;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <rect x={-w / 2} y={-h} width={w} height={h} fill="#fff" stroke={C.ink} strokeWidth={6} rx={10} />
      <rect x={-w / 2 + 8} y={-8 - (h - 16) * v} width={w - 16} height={(h - 16) * v} fill={col} rx={6} />
    </g>
  );
};

/** Pie chart with marker look. frac 0..1 of red slice. */
export const Pie: React.FC<{x: number; y: number; r?: number; at: number; frac: number; color?: string; base?: string; dur?: number}> = ({x, y, r = 150, at, frac, color = C.red, base = '#e2ddd0', dur = 1.0}) => {
  const {t} = useScene();
  if (t < at) return null;
  const s = pop(t, at, 0.4);
  const f = frac * easeOut(prog(t, at + 0.3, dur));
  const a = -Math.PI / 2 + f * Math.PI * 2;
  const large = f > 0.5 ? 1 : 0;
  const d = f >= 0.999 ? circ(0, 0, r) : `M0,0 L0,${-r} A${r},${r} 0 ${large},1 ${Math.cos(a) * r},${Math.sin(a) * r} Z`;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <circle r={r} fill={base} stroke={C.ink} strokeWidth={6} />
      {f > 0.001 && <path d={d} fill={color} stroke={C.ink} strokeWidth={5} />}
    </g>
  );
};

/** Balance scale; tilt animates to `tilt` (deg, + = right side down). */
export const Balance: React.FC<{x: number; y: number; at: number; tilt: number; tiltAt: number; left?: React.ReactNode; right?: React.ReactNode}> = ({x, y, at, tilt, tiltAt, left, right}) => {
  const {t} = useScene();
  if (t < at) return null;
  const s = pop(t, at, 0.4);
  const a = tilt * easeInOut(prog(t, tiltAt, 0.9));
  const rad = (a * Math.PI) / 180;
  const L = 230;
  const lx = -Math.cos(rad) * L;
  const ly = -Math.sin(rad) * L;
  const rx = Math.cos(rad) * L;
  const ry = Math.sin(rad) * L;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <path d="M0,0 L0,240 M-90,240 L90,240" stroke={C.ink} strokeWidth={9} strokeLinecap="round" />
      <path d={`M${lx},${ly} L${rx},${ry}`} stroke={C.ink} strokeWidth={9} strokeLinecap="round" />
      <path d={`M${lx},${ly} L${lx - 60},${ly + 90} L${lx + 60},${ly + 90} Z M${rx},${ry} L${rx - 60},${ry + 90} L${rx + 60},${ry + 90} Z`} fill="none" stroke={C.ink} strokeWidth={5} />
      <path d={`M${lx - 75},${ly + 90} L${lx + 75},${ly + 90} M${rx - 75},${ry + 90} L${rx + 75},${ry + 90}`} stroke={C.ink} strokeWidth={8} strokeLinecap="round" />
      <g transform={`translate(${lx},${ly + 90})`}>{left}</g>
      <g transform={`translate(${rx},${ry + 90})`}>{right}</g>
      <circle r={12} fill={C.red} stroke={C.ink} strokeWidth={4} />
    </g>
  );
};

/** Simple cartoon smoke puff (no fire/gore) */
export const Puff: React.FC<{x: number; y: number; at: number; s?: number; color?: string}> = ({x, y, at, s = 1, color = '#cfcfcf'}) => {
  const {t} = useScene();
  if (t < at) return null;
  const lt = t - at;
  const p = easeOut(prog(t, at, 0.6));
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} opacity={Math.max(0.35, 1 - lt * 0.15)}>
      {[0, 1, 2, 3, 4].map((i) => (
        <circle key={i} cx={(i - 2) * 22 + Math.sin(lt * 2 + i) * 4} cy={-Math.abs(i - 2) * 6 - lt * 10 * (i % 2 ? 1 : 0.6)} r={(22 + rnd(i) * 14) * p} fill={color} stroke={C.ink} strokeWidth={4} />
      ))}
    </g>
  );
};
