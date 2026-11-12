import React, {useMemo} from 'react';
import {useCurrentFrame} from 'remotion';
import {circPts, ellPts, markerPath, Pt, rectPts, roundRectPts, seedOf} from '../lib/sketch';
import {C} from '../lib/theme';
import {prog} from '../lib/timing';
import {Scaled} from './marker';
import {Drawing, Part, Stroke} from './primitives';

export type Expr = 'neutral' | 'worried' | 'happy' | 'shocked' | 'determined' | 'tired' | 'sick' | 'proud' | 'sad';
export type Gear = 'helmet' | 'cap' | 'chef' | 'wac' | 'none' | 'medic';
export type Hold = 'rifle' | 'shovel' | 'clipboard' | 'ladle' | 'none' | 'rifleUp' | 'letter';

const mir = (pts: Pt[]): Pt[] => pts.map(([x, y]) => [-x, y] as Pt).reverse();
const rot = (pts: Pt[], deg: number, cx: number, cy: number): Pt[] => {
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a), s = Math.sin(a);
  return pts.map(([x, y]) => [cx + x * c - y * s, cy + x * s + y * c] as Pt);
};
const DARK: Record<string, string> = {[C.olive]: '#4E5A2A', [C.khaki]: '#9C8B5E', [C.steel]: '#7C8471'};
const WEB: Record<string, string> = {[C.olive]: C.khaki, [C.khaki]: '#9C8B5E', [C.steel]: '#5B4636'};

// ---------------- face (head centre 0,0, radius 44) ----------------
const Face: React.FC<{expr: Expr; at: number; seed: number; skin: string}> = ({expr, at, seed, skin}) => {
  const f = useCurrentFrame();
  const o = prog(f, at, 6);
  const blink = (f + seed * 7) % 110 < 3;
  const ey = 3;
  const big = expr === 'shocked';
  const ry = big ? 11 : 9.5;
  const brows: Record<Expr, string> = {
    neutral: 'M-26,-14 Q-17,-18 -8,-15 M8,-15 Q17,-18 26,-14',
    worried: 'M-26,-10 Q-17,-15 -8,-20 M8,-20 Q17,-15 26,-10',
    happy: 'M-26,-16 Q-17,-23 -8,-17 M8,-17 Q17,-23 26,-16',
    shocked: 'M-27,-21 Q-17,-29 -7,-23 M7,-23 Q17,-29 27,-21',
    determined: 'M-26,-20 L-8,-11 M8,-11 L26,-20',
    tired: 'M-26,-10 L-8,-12 M8,-12 L26,-10',
    sick: 'M-26,-10 Q-17,-15 -8,-19 M8,-19 Q17,-15 26,-10',
    proud: 'M-26,-17 Q-17,-21 -8,-17 M8,-17 Q17,-21 26,-17',
    sad: 'M-26,-9 Q-17,-14 -8,-20 M8,-20 Q17,-14 26,-9',
  };
  const mouths: Record<Expr, string> = {
    neutral: 'M-10,22 Q0,25 10,22',
    worried: 'M-12,26 Q0,17 12,26',
    happy: 'M-15,17 Q0,34 15,17 Z',
    shocked: 'M-8,21 Q0,11 8,21 Q0,33 -8,21 Z',
    determined: 'M-12,23 L12,21',
    tired: 'M-10,24 Q0,21 10,24',
    sick: 'M-13,25 Q-6,19 0,25 Q6,31 13,24',
    proud: 'M-14,18 Q0,30 14,18',
    sad: 'M-12,27 Q0,17 12,27',
  };
  const filledMouth = expr === 'happy' || expr === 'shocked';
  return (
    <g opacity={o}>
      <ellipse cx={-27} cy={12} rx={8} ry={4.5} fill="#E8837A" opacity={0.35} />
      <ellipse cx={27} cy={12} rx={8} ry={4.5} fill="#E8837A" opacity={0.35} />
      {blink ? (
        <path d={`M-24,${ey} L-8,${ey} M8,${ey} L24,${ey}`} stroke={C.ink} strokeWidth={4} strokeLinecap="round" />
      ) : (
        <g>
          {[-16, 16].map((x) => (
            <g key={x}>
              <ellipse cx={x} cy={ey} rx={8.5} ry={ry} fill="#FFFFFF" stroke={C.ink} strokeWidth={2.6} />
              <circle cx={x + 1} cy={ey + (expr === 'tired' ? 3 : 1)} r={big ? 3.6 : 4.8} fill={C.ink} />
              <circle cx={x + 2.5} cy={ey - 1.5} r={1.4} fill="#FFFFFF" />
              {expr === 'tired' ? <path d={`M${x - 9},${ey - 3} L${x + 9},${ey - 3}`} stroke={skin} strokeWidth={6} /> : null}
            </g>
          ))}
        </g>
      )}
      <path d={brows[expr]} stroke={C.ink} strokeWidth={4.5} fill="none" strokeLinecap="round" />
      <path d="M-2,4 Q4,10 0,13" stroke={C.ink} strokeWidth={2.6} fill="none" strokeLinecap="round" opacity={0.75} />
      <path d={mouths[expr]} stroke={C.ink} strokeWidth={3.6} fill={filledMouth ? '#7A2A26' : 'none'} strokeLinecap="round" strokeLinejoin="round" />
      {expr === 'happy' ? <path d="M-9,20 Q0,25 9,20" stroke="#FFFFFF" strokeWidth={3} fill="none" /> : null}
      {expr === 'worried' || expr === 'shocked' ? <path d="M34,-26 q5,9 0,14 q-5,-5 0,-14" fill="#9FD4F5" stroke={C.ink} strokeWidth={2} /> : null}
      {expr === 'sick' ? <path d="M-34,14 q-7,7 -2,14" stroke={C.green} strokeWidth={4} fill="none" /> : null}
    </g>
  );
};

// ---------------- the soldier ----------------
export const Person: React.FC<{
  x: number;
  y: number; // feet position (bust keeps the same anchor)
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
  look?: number;
}> = ({x, y, at, s = 1, expr = 'neutral', gear = 'helmet', skin = C.skinLight, uniform = C.olive, hold = 'none', pose = 'stand', flip = false, dur = 22, seed = 3, look = 0}) => {
  const f = useCurrentFrame();
  const bob = pose === 'walk' ? Math.sin(f / 4) * 3 : Math.sin((f + seed * 11) / 24) * 1.1;
  const dark = DARK[uniform] ?? '#4E5A2A';
  const web = WEB[uniform] ?? C.khaki;
  const shirt = uniform === C.khaki ? C.olive : C.khaki;

  const legs: Part[] = useMemo(() => {
    if (pose === 'bust') return [];
    const w = pose === 'walk' ? 14 : 0;
    const legL: Pt[] = [[-32, -84], [-3, -84], [-6 - w, -12], [-30 - w, -12]];
    const bootL: Pt[] = [[-34 - w, -15], [-6 - w, -15], [-4 - w, -5], [-1 - w, 0], [-40 - w, 0], [-40 - w, -7]];
    const legR: Pt[] = mir([[-32, -84], [-3, -84], [-6 + w, -12], [-30 + w, -12]]);
    const bootR: Pt[] = mir([[-34 + w, -15], [-6 + w, -15], [-4 + w, -5], [-1 + w, 0], [-40 + w, 0], [-40 + w, -7]]);
    return [
      {pts: legL, closed: true, fill: dark},
      {pts: legR, closed: true, fill: dark},
      {pts: bootL, closed: true, fill: '#5B4636', solid: true},
      {pts: bootR, closed: true, fill: '#5B4636', solid: true},
    ];
  }, [pose, dark]);

  const torso: Part[] = useMemo(() => {
    const body: Pt[] = [[-42, -150], [-32, -159], [32, -159], [42, -150], [40, -112], [37, -80], [-37, -80], [-40, -112]];
    const parts: Part[] = [
      {pts: rectPts(-10, -166, 20, 12), closed: true, fill: skin, solid: true},
      {pts: body, closed: true, fill: uniform},
      {pts: [[-12, -159], [12, -159], [0, -141]], closed: true, fill: shirt, solid: true},
      {pts: [[-31, -159], [-12, -159], [0, -141], [-6, -137], [-22, -146]], closed: true, fill: dark, solid: true},
      {pts: mir([[-31, -159], [-12, -159], [0, -141], [-6, -137], [-22, -146]]), closed: true, fill: dark, solid: true},
      {pts: rectPts(-31, -136, 19, 19), closed: true, fill: uniform, solid: true, shade: 3},
      {pts: rectPts(12, -136, 19, 19), closed: true, fill: uniform, solid: true, shade: 3},
      {pts: [[-32, -131], [-11, -131]], w: 3},
      {pts: [[11, -131], [32, -131]], w: 3},
      {pts: [[-24, -158], [-21, -91]], w: 6, color: web},
      {pts: [[24, -158], [21, -91]], w: 6, color: web},
      {pts: rectPts(-38, -91, 76, 11), closed: true, fill: web, solid: true, shade: 2},
      {pts: rectPts(-34, -89, 12, 16), closed: true, fill: web, solid: true, shade: 2},
      {pts: rectPts(-20, -89, 12, 16), closed: true, fill: web, solid: true, shade: 2},
      {pts: rectPts(8, -89, 12, 16), closed: true, fill: web, solid: true, shade: 2},
      {pts: rectPts(22, -89, 12, 16), closed: true, fill: web, solid: true, shade: 2},
    ];
    return parts;
  }, [uniform, dark, web, shirt, skin]);

  // arms + held object
  const {arms, item, hands} = useMemo(() => {
    const sleeveDownL: Pt[] = [[-41, -151], [-55, -139], [-61, -108], [-57, -84], [-44, -84], [-46, -110], [-37, -131]];
    const holdL: Pt[] = [[-41, -151], [-55, -137], [-52, -104], [-34, -92], [-26, -102], [-40, -114], [-36, -133]];
    const holdR: Pt[] = [[41, -151], [53, -137], [46, -122], [24, -120], [19, -132], [34, -137], [36, -146]];
    const upR: Pt[] = [[37, -153], [52, -160], [62, -196], [49, -201], [40, -170]];
    let armsP: Pt[][] = [];
    let handsP: Pt[] = [];
    let itemP: Part[] = [];
    const h = (x0: number, y0: number) => [x0, y0] as Pt;
    switch (hold) {
      case 'none':
        armsP = [sleeveDownL, mir(sleeveDownL)];
        handsP = [h(-51, -79), h(51, -79)];
        break;
      case 'rifleUp':
        armsP = [sleeveDownL, upR];
        handsP = [h(-51, -79), h(56, -205)];
        itemP = [
          {pts: rot([[-6, -60], [6, -60], [6, 26], [-6, 26]], 0, 56, -220), closed: true, fill: C.steel, solid: true},
          {pts: rot([[-9, 26], [9, 26], [11, 80], [-11, 80]], 0, 56, -220), closed: true, fill: C.wood, solid: true},
          {pts: [[56, -280], [56, -320]], w: 5, color: C.ink},
        ];
        break;
      default:
        armsP = [holdL, holdR];
        handsP = [h(-30, -94), h(16, -126)];
    }
    if (hold === 'rifle') {
      const R = (pts: Pt[]) => rot(pts, -38, -4, -112);
      itemP = [
        {pts: R([[-94, -7], [-94, 12], [-62, 11], [-42, 5], [-42, -5], [-62, -7]]), closed: true, fill: C.wood},
        {pts: R([[-42, -5], [-8, -5], [-8, 6], [-42, 6]]), closed: true, fill: C.steel, solid: true},
        {pts: R([[-8, -4], [48, -4], [48, 4], [-8, 4]]), closed: true, fill: C.wood, solid: true},
        {pts: R([[48, 0], [100, 0]]), w: 6, color: '#3A3A3A'},
        {pts: R([[96, -1], [96, -8]]), w: 4},
        {pts: R([[-82, 12], [-20, 24], [40, 6]]), w: 3, color: web},
      ];
      handsP = [rot([[-34, 0]], -38, -4, -112)[0], rot([[22, 0]], -38, -4, -112)[0]];
      armsP = [
        [[-41, -151], [-55, -137], [-54, -104], [-38, -86], [-28, -94], [-40, -112], [-36, -133]],
        [[41, -151], [53, -137], [44, -122], [20, -122], [16, -135], [34, -139], [36, -146]],
      ];
    } else if (hold === 'shovel') {
      itemP = [
        {pts: [[-34, -124], [72, -14]], w: 8, color: C.wood},
        {pts: [[60, -26], [96, 4], [80, 22], [48, -10]], closed: true, fill: C.steel, solid: true},
      ];
    } else if (hold === 'clipboard') {
      itemP = [
        {pts: rectPts(-26, -138, 52, 62), closed: true, fill: C.paper, solid: true, shade: 3},
        {pts: rectPts(-8, -144, 16, 10), closed: true, fill: C.steel, solid: true},
        {pts: [[-16, -118], [16, -118]], w: 3},
        {pts: [[-16, -104], [12, -104]], w: 3},
        {pts: [[-16, -90], [16, -90]], w: 3},
      ];
    } else if (hold === 'ladle') {
      itemP = [
        {pts: [[16, -126], [64, -196]], w: 7, color: C.steel},
        {pts: ellPts(70, -202, 18, 11, 14), closed: true, fill: C.steel, solid: true},
      ];
    } else if (hold === 'letter') {
      itemP = [
        {pts: rectPts(-30, -138, 60, 40), closed: true, fill: '#FFFFFF', solid: true, shade: 3},
        {pts: [[-30, -138], [0, -116], [30, -138]], w: 3},
      ];
    }
    const armParts: Part[] = armsP.map((a) => ({pts: a, closed: true, fill: uniform}));
    const handParts: Part[] = handsP.map((p) => ({pts: circPts(p[0], p[1], 10, 12), closed: true, fill: skin, solid: true, shade: 2}));
    return {arms: armParts, item: itemP, hands: handParts};
  }, [hold, uniform, skin, web]);

  const head: Part[] = useMemo(() => {
    const parts: Part[] = [
      {pts: circPts(-43, 2, 9, 10), closed: true, fill: skin, solid: true, shade: 2},
      {pts: circPts(43, 2, 9, 10), closed: true, fill: skin, solid: true, shade: 2},
      {pts: circPts(0, 0, 44, 28), closed: true, fill: skin, solid: true, shade: 6},
    ];
    if (gear === 'helmet' || gear === 'medic') {
      parts.push({pts: [...ellPts(0, -24, 52, 44, 18, Math.PI, Math.PI * 2), [60, -19], [66, -12], [-66, -12], [-60, -19]], closed: true, fill: C.olive});
    } else if (gear === 'cap') {
      parts.push({pts: [...ellPts(0, -18, 44, 26, 10, Math.PI, Math.PI * 2)], closed: true, fill: '#5B4636', solid: true});
      parts.push({pts: [[-42, -28], [-34, -48], [36, -50], [44, -30], [0, -22]], closed: true, fill: uniform === C.khaki ? C.khaki : C.olive, solid: true});
    } else if (gear === 'wac') {
      parts.push({pts: [[-36, -34], [-30, -64], [30, -64], [36, -34]], closed: true, fill: C.khaki, solid: true});
      parts.push({pts: [[-60, -32], [60, -32], [52, -21], [-52, -21]], closed: true, fill: C.khaki, solid: true});
    } else if (gear === 'chef') {
      parts.push({pts: [[-36, -26], [-52, -60], [-32, -92], [0, -84], [32, -94], [52, -62], [36, -26]], closed: true, fill: '#FFFFFF'});
      parts.push({pts: rectPts(-38, -36, 76, 13), closed: true, fill: '#FFFFFF', solid: true});
    } else {
      parts.push({pts: [...ellPts(0, -12, 46, 36, 12, Math.PI, Math.PI * 2)], closed: true, fill: '#5B4636', solid: true});
    }
    return parts;
  }, [gear, skin, uniform]);

  const net = useMemo(
    () =>
      gear === 'helmet' || gear === 'medic'
        ? [-30, -10, 10, 30].map((xx, i) => markerPath([[xx - 10, -56], [xx, -40], [xx + 8, -22]], false, seedOf('net', i), 1.2))
        : [],
    [gear],
  );

  if (f < at) return null;
  const headY = -198;
  const tf = `translate(${x},${y + bob}) scale(${(flip ? -1 : 1) * s},${s})${pose === 'lie' ? ' rotate(-90)' : ''}`;
  const t1 = at + 4;
  return (
    <g transform={tf}>
      <Scaled s={s}>
        <Drawing parts={legs} at={t1} dur={dur * 0.35} seed={seed} fillDur={10} />
        <Drawing parts={torso} at={t1 + dur * 0.1} dur={dur * 0.5} seed={seed + 1} fillDur={10} />
        <Drawing parts={item} at={t1 + dur * 0.45} dur={dur * 0.3} seed={seed + 2} fillDur={8} />
        <Drawing parts={arms} at={t1 + dur * 0.4} dur={dur * 0.35} seed={seed + 3} fillDur={10} />
        <Drawing parts={hands} at={t1 + dur * 0.6} dur={dur * 0.2} seed={seed + 4} fillDur={6} />
        <g transform={`translate(0,${headY}) rotate(${look})`}>
          <Drawing parts={head} at={at} dur={dur * 0.45} fillAt={at + dur * 0.35} fillDur={8} seed={seed + 9} />
          {net.map((d, i) => (
            <Stroke key={i} d={d} at={at + dur * 0.6} dur={6} w={2} opacity={0.45} />
          ))}
          <g transform={flip ? 'scale(-1,1)' : undefined}>
            <Face expr={expr} at={at + dur * 0.45} seed={seed} skin={skin} />
          </g>
          {gear === 'medic' ? <circle cx={0} cy={-44} r={12} fill="#FFFFFF" stroke={C.ink} strokeWidth={3} opacity={prog(f, at + dur, 6)} /> : null}
        </g>
        {gear === 'medic' ? (
          <g opacity={prog(f, at + dur, 6)}>
            <rect x={-52} y={-142} width={14} height={22} fill="#FFFFFF" stroke={C.ink} strokeWidth={2.5} />
          </g>
        ) : null}
      </Scaled>
    </g>
  );
};

// Small crowd figure (cheap: flat colours, used in grids of up to 100).
export const Mini: React.FC<{x: number; y: number; at: number; s?: number; color?: string; grey?: boolean; head?: string}> = ({x, y, at, s = 1, color = C.olive, grey = false, head = C.skinLight}) => {
  const f = useCurrentFrame();
  const o = prog(f, at, 5);
  if (o <= 0) return null;
  const c = grey ? '#C9CED1' : color;
  const ink = grey ? '#9AA2A6' : C.ink;
  const helmet = !grey && color !== C.khaki;
  const dark = grey ? '#B4BABD' : DARK[color] ?? '#4E5A2A';
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} opacity={o}>
      <path d="M-9,-12 L-8,8 L-1,8 L-1,-12 Z M1,-12 L1,8 L8,8 L9,-12 Z" fill={dark} stroke={ink} strokeWidth={2.2} strokeLinejoin="round" />
      <path d="M-13,-30 Q-12,-35 -6,-36 L6,-36 Q12,-35 13,-30 L11,-10 L-11,-10 Z" fill={c} stroke={ink} strokeWidth={2.4} strokeLinejoin="round" />
      <path d="M-13,-29 L-16,-14 M13,-29 L16,-14" stroke={ink} strokeWidth={4} strokeLinecap="round" />
      <circle cx={0} cy={-46} r={10.5} fill={grey ? '#E6E9EA' : head} stroke={ink} strokeWidth={2.4} />
      {helmet ? <path d="M-13,-47 Q-12,-61 0,-61 Q12,-61 13,-47 L15,-45 L-15,-45 Z" fill={color === C.steel ? '#7C8471' : C.olive} stroke={ink} strokeWidth={2.4} strokeLinejoin="round" /> : null}
      {!helmet && !grey ? <path d="M-10,-53 L-7,-58 L8,-59 L11,-53 Z" fill={c} stroke={ink} strokeWidth={2} /> : null}
      <circle cx={-3.5} cy={-45} r={1.6} fill={ink} />
      <circle cx={3.5} cy={-45} r={1.6} fill={ink} />
    </g>
  );
};

export const Bubble: React.FC<{x: number; y: number; at: number; text?: string}> = ({x, y, at, text = '?'}) => {
  const f = useCurrentFrame();
  const d = useMemo(() => markerPath(ellPts(x, y, 70, 52, 22), true, seedOf('bub', x, y), 2), [x, y]);
  const o = prog(f, at, 8);
  if (o <= 0) return null;
  return (
    <g opacity={o}>
      <path d={d} fill="#FFFFFF" stroke="none" />
      <Stroke d={d} at={at} dur={10} w={5} />
      <circle cx={x - 70} cy={y + 64} r={10} fill="#FFFFFF" stroke={C.ink} strokeWidth={4} />
      <circle cx={x - 92} cy={y + 92} r={6} fill="#FFFFFF" stroke={C.ink} strokeWidth={4} />
      <text x={x} y={y + 26} textAnchor="middle" fontFamily="PermanentMarker" fontSize={72} fill={C.steel}>
        {text}
      </text>
    </g>
  );
};

export const roundRect = roundRectPts;
export type {Pt};
