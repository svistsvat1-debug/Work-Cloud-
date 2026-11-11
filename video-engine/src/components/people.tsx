import React, {useMemo} from 'react';
import {useCurrentFrame} from 'remotion';
import {circPts, ellPts, markerPath, Pt, rectPts, roundRectPts, seedOf} from '../lib/sketch';
import {C} from '../lib/theme';
import {prog} from '../lib/timing';
import {Drawing, Part, Stroke} from './primitives';

export type Expr = 'neutral' | 'worried' | 'happy' | 'shocked' | 'determined' | 'tired' | 'sick' | 'proud' | 'sad';
export type Gear = 'helmet' | 'cap' | 'chef' | 'wac' | 'none' | 'medic';
export type Hold = 'rifle' | 'shovel' | 'clipboard' | 'ladle' | 'none' | 'rifleUp' | 'letter';

// Face drawn on a head centred at (0,0) radius 40.
const Face: React.FC<{expr: Expr; at: number; seed: number}> = ({expr, at, seed}) => {
  const f = useCurrentFrame();
  const o = prog(f, at, 6);
  const blink = (f + seed * 7) % 95 < 3;
  const eyeY = -2;
  const eyes = blink ? (
    <g stroke={C.ink} strokeWidth={4} strokeLinecap="round">
      <line x1={-19} y1={eyeY} x2={-9} y2={eyeY} />
      <line x1={9} y1={eyeY} x2={19} y2={eyeY} />
    </g>
  ) : expr === 'shocked' ? (
    <g fill={C.white} stroke={C.ink} strokeWidth={3}>
      <circle cx={-14} cy={eyeY - 2} r={8} />
      <circle cx={14} cy={eyeY - 2} r={8} />
      <circle cx={-14} cy={eyeY - 2} r={3} fill={C.ink} />
      <circle cx={14} cy={eyeY - 2} r={3} fill={C.ink} />
    </g>
  ) : (
    <g fill={C.ink}>
      <circle cx={-14} cy={eyeY} r={4.5} />
      <circle cx={14} cy={eyeY} r={4.5} />
    </g>
  );
  const brows: Record<Expr, string> = {
    neutral: 'M-22,-16 L-8,-17 M8,-17 L22,-16',
    worried: 'M-22,-13 L-8,-20 M8,-20 L22,-13',
    happy: 'M-22,-18 Q-15,-23 -8,-19 M8,-19 Q15,-23 22,-18',
    shocked: 'M-23,-22 Q-15,-29 -7,-24 M7,-24 Q15,-29 23,-22',
    determined: 'M-22,-20 L-8,-13 M8,-13 L22,-20',
    tired: 'M-22,-12 L-8,-14 M8,-14 L22,-12',
    sick: 'M-22,-13 L-8,-19 M8,-19 L22,-13',
    proud: 'M-22,-19 L-8,-18 M8,-18 L22,-19',
    sad: 'M-22,-12 L-8,-19 M8,-19 L22,-12',
  };
  const mouths: Record<Expr, string> = {
    neutral: 'M-10,18 L10,18',
    worried: 'M-11,21 Q0,13 11,21',
    happy: 'M-13,13 Q0,27 13,13',
    shocked: 'M-7,17 Q0,8 7,17 Q0,28 -7,17',
    determined: 'M-11,18 L11,16',
    tired: 'M-9,19 Q0,16 9,19',
    sick: 'M-12,20 Q-6,15 0,20 Q6,25 12,19',
    proud: 'M-12,14 Q0,24 12,14',
    sad: 'M-11,22 Q0,13 11,22',
  };
  return (
    <g opacity={o}>
      {eyes}
      <path d={brows[expr]} stroke={C.ink} strokeWidth={4} fill="none" strokeLinecap="round" />
      <path d={mouths[expr]} stroke={C.ink} strokeWidth={4} fill={expr === 'shocked' ? C.ink : 'none'} strokeLinecap="round" />
      {expr === 'worried' || expr === 'shocked' ? <path d="M30,-22 q4,8 0,12 q-4,-4 0,-12" fill="#7FC4F0" stroke={C.ink} strokeWidth={2} /> : null}
      {expr === 'sick' ? <path d="M-30,8 q-6,6 -2,12" stroke={C.green} strokeWidth={4} fill="none" /> : null}
    </g>
  );
};

export const Person: React.FC<{
  x: number;
  y: number; // feet position (or chest line for bust)
  at: number;
  s?: number;
  expr?: Expr;
  gear?: Gear;
  skin?: string;
  uniform?: string;
  hold?: Hold;
  pose?: 'stand' | 'bust' | 'lie' | 'walk';
  flip?: boolean;
  dur?: number;
  seed?: number;
  look?: number; // rotate head a bit
}> = ({x, y, at, s = 1, expr = 'neutral', gear = 'helmet', skin = C.skinLight, uniform = C.olive, hold = 'none', pose = 'stand', flip = false, dur = 20, seed = 3, look = 0}) => {
  const f = useCurrentFrame();
  const bob = pose === 'walk' ? Math.sin(f / 4) * 3 : Math.sin((f + seed * 11) / 22) * 1.2;
  const sd = seed;
  const body: Part[] = useMemo(() => {
    const parts: Part[] = [];
    if (pose !== 'bust') {
      // legs
      const step = pose === 'walk' ? 14 : 0;
      parts.push({pts: [[-14, -70], [-24 - step, 0]], w: 9, color: C.ink});
      parts.push({pts: [[14, -70], [24 + step, 0]], w: 9, color: C.ink});
    }
    // torso
    parts.push({pts: [[-36, -160], [36, -160], [31, -66], [-31, -66]], closed: true, fill: uniform, gap: 9});
    // arms
    if (hold === 'rifleUp') {
      parts.push({pts: [[-32, -150], [-52, -110], [-30, -92]], w: 8});
      parts.push({pts: [[32, -150], [50, -190]], w: 8});
    } else if (hold === 'none') {
      parts.push({pts: [[-33, -150], [-56, -95]], w: 8});
      parts.push({pts: [[33, -150], [56, -95]], w: 8});
    } else {
      parts.push({pts: [[-33, -150], [-48, -112], [-16, -104]], w: 8});
      parts.push({pts: [[33, -150], [50, -118], [24, -108]], w: 8});
    }
    return parts;
  }, [pose, uniform, hold]);
  const holdParts: Part[] = useMemo(() => {
    switch (hold) {
      case 'rifle':
        return [
          {pts: [[-70, -70], [-30, -100], [10, -128], [62, -168]], w: 7, color: C.ink},
          {pts: [[-82, -58], [-48, -82], [-40, -70], [-74, -48]], closed: true, fill: C.brown, solid: true},
        ];
      case 'rifleUp':
        return [{pts: [[44, -150], [60, -240]], w: 7}];
      case 'shovel':
        return [
          {pts: [[-20, -120], [70, -20]], w: 7, color: C.brown},
          {pts: [[60, -30], [92, -6], [78, 10], [52, -16]], closed: true, fill: C.steel, solid: true},
        ];
      case 'clipboard':
        return [{pts: rectPts(-10, -136, 52, 64), closed: true, fill: C.paper, solid: true}, {pts: [[0, -118], [32, -118]], w: 3}, {pts: [[0, -104], [30, -104]], w: 3}];
      case 'ladle':
        return [{pts: [[20, -110], [70, -180]], w: 6, color: C.steel}, {pts: ellPts(76, -186, 16, 10), closed: true, fill: C.steel, solid: true}];
      case 'letter':
        return [{pts: rectPts(-16, -134, 60, 40), closed: true, fill: C.white, solid: true}, {pts: [[-16, -134], [14, -112], [44, -134]], w: 3}];
      default:
        return [];
    }
  }, [hold]);
  const headParts: Part[] = useMemo(() => {
    const parts: Part[] = [{pts: circPts(0, 0, 40, 24), closed: true, fill: skin, solid: true}];
    if (gear === 'helmet' || gear === 'medic') {
      parts.push({pts: [...ellPts(0, -8, 47, 40, 14, Math.PI, Math.PI * 2), [56, -2], [-56, -2]], closed: true, fill: C.olive, gap: 8});
    } else if (gear === 'cap') {
      parts.push({pts: [[-40, -22], [-30, -44], [34, -40], [42, -20]], closed: true, fill: C.khaki, gap: 7});
    } else if (gear === 'wac') {
      parts.push({pts: [[-44, -18], [-36, -46], [36, -46], [44, -18], [56, -12], [-56, -12]], closed: true, fill: C.khaki, gap: 7});
    } else if (gear === 'chef') {
      parts.push({pts: [[-30, -26], [-46, -56], [-30, -84], [0, -76], [30, -86], [46, -58], [30, -26]], closed: true, fill: C.white, solid: true});
    }
    return parts;
  }, [gear, skin]);
  if (f < at) return null;
  const headY = pose === 'bust' ? -196 : -200;
  const tf = `translate(${x},${y + bob}) scale(${(flip ? -1 : 1) * s},${s})${pose === 'lie' ? ' rotate(-90)' : ''}`;
  return (
    <g transform={tf}>
      {pose === 'bust' ? (
        <g clipPath={undefined}>
          <Drawing parts={body.filter((_, i) => i >= 0)} at={at + 4} dur={dur * 0.6} seed={sd} />
        </g>
      ) : (
        <Drawing parts={body} at={at + 4} dur={dur * 0.7} seed={sd} />
      )}
      <Drawing parts={holdParts} at={at + dur * 0.6} dur={dur * 0.4} seed={sd + 5} />
      <g transform={`translate(0,${headY}) rotate(${look})`}>
        <Drawing parts={headParts} at={at} dur={dur * 0.5} fillAt={at + 3} fillDur={6} seed={sd + 9} />
        <g transform={flip ? 'scale(-1,1)' : undefined}>
          <Face expr={expr} at={at + dur * 0.4} seed={sd} />
        </g>
        {gear === 'medic' ? <circle cx={0} cy={-30} r={9} fill={C.white} stroke={C.ink} strokeWidth={3} opacity={prog(f, at + dur, 6)} /> : null}
      </g>
      {gear === 'medic' ? (
        <g opacity={prog(f, at + dur, 6)}>
          <rect x={22} y={-150} width={18} height={26} fill={C.white} stroke={C.ink} strokeWidth={3} />
        </g>
      ) : null}
    </g>
  );
};

// Tiny person icon used in grids/crowds (cheap).
export const Mini: React.FC<{x: number; y: number; at: number; s?: number; color?: string; grey?: boolean; head?: string}> = ({x, y, at, s = 1, color = C.olive, grey = false, head = C.skinLight}) => {
  const f = useCurrentFrame();
  const o = prog(f, at, 5);
  if (o <= 0) return null;
  const c = grey ? C.grey : color;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} opacity={o}>
      <circle cx={0} cy={-38} r={10} fill={grey ? '#E4E7E9' : head} stroke={grey ? C.grey : C.ink} strokeWidth={3} />
      <path d="M-11,-26 L11,-26 L9,-6 L-9,-6 Z" fill={c} stroke={grey ? C.grey : C.ink} strokeWidth={3} strokeLinejoin="round" />
      <path d="M-5,-6 L-7,8 M5,-6 L7,8" stroke={grey ? C.grey : C.ink} strokeWidth={3} strokeLinecap="round" />
    </g>
  );
};

// A sweating/thinking bubble etc.
export const Bubble: React.FC<{x: number; y: number; at: number; text?: string}> = ({x, y, at, text = '?'}) => {
  const f = useCurrentFrame();
  const d = useMemo(() => markerPath(ellPts(x, y, 70, 52, 22), true, seedOf('bub', x, y), 2), [x, y]);
  const o = prog(f, at, 8);
  if (o <= 0) return null;
  return (
    <g opacity={o}>
      <path d={markerPath(ellPts(x, y, 70, 52, 22), true, seedOf('bub', x, y), 2)} fill={C.white} stroke="none" />
      <Stroke d={d} at={at} dur={10} w={5} />
      <circle cx={x - 70} cy={y + 64} r={10} fill={C.white} stroke={C.ink} strokeWidth={4} />
      <circle cx={x - 92} cy={y + 92} r={6} fill={C.white} stroke={C.ink} strokeWidth={4} />
      <text x={x} y={y + 26} textAnchor="middle" fontFamily="PermanentMarker" fontSize={72} fill={C.steel}>
        {text}
      </text>
    </g>
  );
};

export const roundRect = roundRectPts;
export type {Pt};
