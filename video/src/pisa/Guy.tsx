import React from 'react';
import {INK} from './util';

/*
 * The white round-head guy, drawn in code. Every pose below is its own drawing (its own joint
 * positions, hands, face) - poses are swapped inside a squash, never cross-faded.
 * Local coords: origin = middle between the feet, y up is negative. Head radius 62.
 */
type P = [number, number];
export type Hand = 'mitt' | 'fist' | 'thumb' | 'point' | 'palm' | 'none';
export type Arm = {e: P; h: P; hand?: Hand; front?: boolean; ha?: number};
export type Leg = {k: P; f: P; dir?: number};
export type Eyes = 'dot' | 'wide' | 'squeeze' | 'closed' | 'half' | 'happy';
export type Brows = 'neutral' | 'worried' | 'angry' | 'up' | 'none';
export type Mouth = 'smile' | 'open' | 'grit' | 'wavy' | 'o' | 'flat' | 'grin' | 'smirk';
export type Face = {eyes: Eyes; brows: Brows; mouth: Mouth; look?: P; facing?: number};
export type Pose = {
  hip: P;
  ang: number;
  headOff?: P;
  headAng?: number;
  armL: Arm; // arm from the shoulder on the LEFT side of the image
  armR: Arm;
  legL: Leg;
  legR: Leg;
  face: Face;
  hat?: boolean;
  glasses?: boolean;
  prop?: {kind: 'mallet' | 'clipboard'; arm: 'L' | 'R'; ang: number};
};

const W = '#ffffff';
const SHADE = '#e2e6ee';
const HAT = '#ffc93c';
const HAT_SH = '#f0a61f';
const TONGUE = '#f27c8f';
const OL = 7; // outline weight
export const HEAD_R = 62;

const rot = (p: P, a: number): P => {
  const r = (a * Math.PI) / 180;
  return [p[0] * Math.cos(r) - p[1] * Math.sin(r), p[0] * Math.sin(r) + p[1] * Math.cos(r)];
};
const add = (a: P, b: P): P => [a[0] + b[0], a[1] + b[1]];
export const shoulder = (p: Pose, side: -1 | 1) => add(p.hip, rot([side * 34, -98], p.ang));
const legRoot = (p: Pose, side: -1 | 1) => add(p.hip, rot([side * 22, -4], p.ang));
export const headCenter = (p: Pose): P => add(add(p.hip, rot([0, -172], p.ang)), p.headOff ?? [0, 0]);

/** quadratic through the elbow at its middle */
const limbD = (a: P, e: P, h: P) => {
  const c: P = [2 * e[0] - 0.5 * (a[0] + h[0]), 2 * e[1] - 0.5 * (a[1] + h[1])];
  return `M ${a[0]} ${a[1]} Q ${c[0]} ${c[1]} ${h[0]} ${h[1]}`;
};

const HandShape: React.FC<{h: P; kind: Hand; ang: number; pass: 'ink' | 'fill'}> = ({h, kind, ang, pass}) => {
  if (kind === 'none') return null;
  const ink = pass === 'ink';
  const col = ink ? INK : W;
  const g = (r: number) => (ink ? r + OL * 0.95 : r);
  return (
    <g transform={`translate(${h[0]} ${h[1]}) rotate(${ang})`}>
      {kind === 'palm' ? <ellipse rx={g(11)} ry={g(16)} fill={col} /> : <circle r={g(kind === 'mitt' ? 13 : 12)} fill={col} />}
      {kind === 'palm' && <ellipse cx={8} cy={-14} rx={g(5)} ry={g(7.5)} fill={col} transform="rotate(30 8 -14)" />}
      {kind === 'mitt' && <ellipse cx={-2} cy={-12} rx={g(5.5)} ry={g(7)} fill={col} transform="rotate(-25)" />}
      {kind === 'thumb' && <rect x={-g(5.5)} y={-26 - (ink ? OL : 0)} width={g(5.5) * 2} height={24 + (ink ? OL : 0)} rx={g(5.5)} fill={col} />}
      {kind === 'point' && <rect x={-g(5)} y={-30 - (ink ? OL : 0)} width={g(5) * 2} height={28 + (ink ? OL : 0)} rx={g(5)} fill={col} />}
    </g>
  );
};

const ArmShape: React.FC<{s: P; a: Arm; pass: 'ink' | 'fill'}> = ({s, a, pass}) => (
  <g>
    <path d={limbD(s, a.e, a.h)} stroke={pass === 'ink' ? INK : W} strokeWidth={pass === 'ink' ? 13 + 2 * OL : 13} fill="none" strokeLinecap="round" />
    <HandShape h={a.h} kind={a.hand ?? 'mitt'} ang={a.ha ?? 0} pass={pass} />
  </g>
);

const LegShape: React.FC<{r: P; l: Leg; pass: 'ink' | 'fill'}> = ({r, l, pass}) => {
  const ink = pass === 'ink';
  const dir = l.dir ?? -1;
  return (
    <g>
      <path d={limbD(r, l.k, l.f)} stroke={ink ? INK : W} strokeWidth={ink ? 15 + 2 * OL : 15} fill="none" strokeLinecap="round" />
      <ellipse cx={l.f[0] + dir * 9} cy={l.f[1] - 1} rx={ink ? 22 + OL : 22} ry={ink ? 12 + OL : 12} fill={ink ? INK : W} />
    </g>
  );
};

const BODY_D = 'M -46 8 Q -60 8 -58 -12 L -47 -96 Q -42 -128 0 -128 Q 42 -128 47 -96 L 58 -12 Q 60 8 46 8 Z';

const Prop: React.FC<{kind: 'mallet' | 'clipboard'; h: P; ang: number}> = ({kind, h, ang}) => (
  <g transform={`translate(${h[0]} ${h[1]}) rotate(${ang})`}>
    {kind === 'mallet' ? (
      <g>
        <rect x={-10} y={-6} width={78} height={12} rx={6} fill="#b8773d" stroke={INK} strokeWidth={5} />
        <rect x={62} y={-25} width={30} height={50} rx={9} fill="#9c6233" stroke={INK} strokeWidth={6} />
        <path d="M 70 -16 L 70 16" stroke="#c88a50" strokeWidth={5} strokeLinecap="round" />
      </g>
    ) : (
      <g>
        <rect x={-14} y={-50} width={78} height={100} rx={8} fill="#b9773e" stroke={INK} strokeWidth={6} />
        <rect x={-4} y={-36} width={58} height={78} rx={3} fill="#ffffff" stroke={INK} strokeWidth={3.5} />
        {[0, 1, 2, 3].map((i) => (
          <path key={i} d={`M 4 ${-20 + i * 16} L ${44 - (i % 2) * 12} ${-20 + i * 16}`} stroke="#9aa7b4" strokeWidth={4} strokeLinecap="round" />
        ))}
        <rect x={10} y={-58} width={30} height={14} rx={5} fill="#c9d1d9" stroke={INK} strokeWidth={4.5} />
      </g>
    )}
  </g>
);

const FaceShape: React.FC<{f: Face}> = ({f}) => {
  const fx = (f.facing ?? 0) * 15;
  const lk = f.look ?? [0, 0];
  const ex = [-21 + fx, 21 + fx];
  const ey = -4;
  const sw = {stroke: INK, strokeLinecap: 'round' as const, fill: 'none'};
  const eye = (x: number, side: number) => {
    const cx = x + lk[0] * 4;
    const cy = ey + lk[1] * 4;
    switch (f.eyes) {
      case 'dot':
        return <ellipse key={side} cx={cx} cy={cy} rx={7.5} ry={11} fill={INK} />;
      case 'wide':
        return <ellipse key={side} cx={cx} cy={cy - 2} rx={9} ry={14} fill={INK} />;
      case 'half':
        return (
          <g key={side}>
            <ellipse cx={cx} cy={cy + 3} rx={7.5} ry={7.5} fill={INK} />
            <path d={`M ${cx - 11} ${cy - 3} L ${cx + 11} ${cy - 3}`} {...sw} strokeWidth={5} />
          </g>
        );
      case 'squeeze':
        return side < 0 ? (
          <path key={side} d={`M ${x - 9} ${ey - 9} L ${x + 7} ${ey} L ${x - 9} ${ey + 9}`} {...sw} strokeWidth={6} strokeLinejoin="round" />
        ) : (
          <path key={side} d={`M ${x + 9} ${ey - 9} L ${x - 7} ${ey} L ${x + 9} ${ey + 9}`} {...sw} strokeWidth={6} strokeLinejoin="round" />
        );
      case 'closed':
        return <path key={side} d={`M ${x - 10} ${ey - 1} Q ${x} ${ey + 8} ${x + 10} ${ey - 1}`} {...sw} strokeWidth={5.5} />;
      case 'happy':
        return <path key={side} d={`M ${x - 10} ${ey + 4} Q ${x} ${ey - 9} ${x + 10} ${ey + 4}`} {...sw} strokeWidth={5.5} />;
    }
  };
  const brow = (x: number, side: number) => {
    const o = side; // -1 left, 1 right ; inner end is toward the middle
    const bx = x;
    switch (f.brows) {
      case 'none':
        return null;
      case 'neutral':
        return <path key={side} d={`M ${bx - 10} ${-25} Q ${bx} ${-31} ${bx + 10} ${-25}`} {...sw} strokeWidth={5} />;
      case 'up':
        return <path key={side} d={`M ${bx - 10} ${-33} Q ${bx} ${-41} ${bx + 10} ${-33}`} {...sw} strokeWidth={5} />;
      case 'worried':
        return <path key={side} d={`M ${bx - 10} ${-26} Q ${bx} ${-29} ${bx + 10} ${-37}`} {...sw} strokeWidth={5} transform={o > 0 ? `translate(${2 * bx} 0) scale(-1 1)` : undefined} />;
      case 'angry':
        return <path key={side} d={`M ${bx - 11} ${-33} Q ${bx} ${-31} ${bx + 10} ${-23}`} {...sw} strokeWidth={5.5} transform={o > 0 ? `translate(${2 * bx} 0) scale(-1 1)` : undefined} />;
    }
  };
  const mx = fx * 0.7;
  const mouth = () => {
    switch (f.mouth) {
      case 'smile':
        return <path d={`M ${mx - 14} 20 Q ${mx} 32 ${mx + 14} 20`} {...sw} strokeWidth={5} />;
      case 'smirk':
        return <path d={`M ${mx - 12} 24 Q ${mx + 4} 29 ${mx + 14} 18`} {...sw} strokeWidth={5} />;
      case 'flat':
        return <path d={`M ${mx - 10} 24 L ${mx + 10} 24`} {...sw} strokeWidth={5} />;
      case 'wavy':
        return <path d={`M ${mx - 15} 25 q 5 -6 10 0 t 10 0 t 10 0`} {...sw} strokeWidth={4.5} />;
      case 'o':
        return <ellipse cx={mx} cy={24} rx={6.5} ry={8.5} fill={INK} />;
      case 'open':
        return (
          <g>
            <ellipse cx={mx} cy={25} rx={12} ry={15} fill={INK} />
            <ellipse cx={mx} cy={33} rx={7.5} ry={5} fill={TONGUE} />
          </g>
        );
      case 'grin':
        return (
          <g>
            <path d={`M ${mx - 18} 16 Q ${mx} 44 ${mx + 18} 16 Z`} fill={INK} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
            <ellipse cx={mx} cy={31} rx={7} ry={4.5} fill={TONGUE} />
          </g>
        );
      case 'grit':
        return (
          <g>
            <rect x={mx - 17} y={15} width={34} height={17} rx={6} fill="#ffffff" stroke={INK} strokeWidth={4.5} />
            <path d={`M ${mx - 15} 23.5 L ${mx + 15} 23.5 M ${mx - 5} 16 L ${mx - 5} 31 M ${mx + 6} 16 L ${mx + 6} 31`} stroke={INK} strokeWidth={3} />
          </g>
        );
    }
  };
  return (
    <g>
      {ex.map((x, i) => eye(x, i === 0 ? -1 : 1))}
      {ex.map((x, i) => brow(x, i === 0 ? -1 : 1))}
      {mouth()}
    </g>
  );
};

export const HardHat: React.FC = () => (
  <g>
    <path d="M -56 -26 Q -60 -82 0 -84 Q 60 -82 56 -26 Z" fill={HAT} stroke={INK} strokeWidth={OL} strokeLinejoin="round" />
    <path d="M 22 -78 Q 52 -66 52 -30 L 30 -30 Q 32 -60 14 -79 Z" fill={HAT_SH} />
    <path d="M -10 -84 L -10 -30 M 10 -84 L 10 -30" stroke={HAT_SH} strokeWidth={5} />
    <path d="M -56 -26 Q -60 -82 0 -84 Q 60 -82 56 -26" fill="none" stroke={INK} strokeWidth={OL} />
    <rect x={-74} y={-36} width={148} height={16} rx={8} fill={HAT} stroke={INK} strokeWidth={OL} />
  </g>
);

const Glasses: React.FC<{facing: number}> = ({facing}) => {
  const fx = facing * 15;
  return (
    <g stroke={INK} strokeWidth={4.5} fill="rgba(255,255,255,0.35)">
      <circle cx={-21 + fx} cy={-4} r={15} />
      <circle cx={21 + fx} cy={-4} r={15} />
      <path d={`M ${-6 + fx} -6 Q ${fx} -10 ${6 + fx} -6`} fill="none" />
    </g>
  );
};

export const Guy: React.FC<{p: Pose}> = ({p}) => {
  const sL = shoulder(p, -1);
  const sR = shoulder(p, 1);
  const lL = legRoot(p, -1);
  const lR = legRoot(p, 1);
  const hc = headCenter(p);
  const arms: {s: P; a: Arm; side: 'L' | 'R'}[] = [
    {s: sL, a: p.armL, side: 'L'},
    {s: sR, a: p.armR, side: 'R'},
  ];
  const back = arms.filter((x) => !x.a.front);
  const front = arms.filter((x) => x.a.front);
  const prop = (side: 'L' | 'R') => {
    if (!p.prop || p.prop.arm !== side) return null;
    const a = side === 'L' ? p.armL : p.armR;
    return <Prop kind={p.prop.kind} h={a.h} ang={p.prop.ang} />;
  };
  const armGroup = (list: typeof arms) =>
    list.map((x) => (
      <g key={x.side}>
        <ArmShape s={x.s} a={x.a} pass="ink" />
        {prop(x.side)}
        <ArmShape s={x.s} a={x.a} pass="fill" />
      </g>
    ));
  const clipId = `head-${Math.round(hc[0])}-${Math.round(hc[1])}-${p.face.eyes}-${p.face.mouth}`;
  return (
    <g>
      {armGroup(back)}
      {/* legs: one merged outline */}
      <LegShape r={lL} l={p.legL} pass="ink" />
      <LegShape r={lR} l={p.legR} pass="ink" />
      <LegShape r={lL} l={p.legL} pass="fill" />
      <LegShape r={lR} l={p.legR} pass="fill" />
      {/* body */}
      <g transform={`translate(${p.hip[0]} ${p.hip[1]}) rotate(${p.ang})`}>
        <path d={BODY_D} fill={SHADE} />
        <path d="M -46 8 Q -60 8 -58 -12 L -47 -96 Q -42 -128 0 -128 Q 28 -128 32 -100 L 34 -12 Q 34 8 20 8 Z" fill={W} />
        <path d={BODY_D} fill="none" stroke={INK} strokeWidth={OL} strokeLinejoin="round" />
      </g>
      {/* head */}
      <g transform={`translate(${hc[0]} ${hc[1]}) rotate(${p.headAng ?? 0})`}>
        <clipPath id={clipId}>
          <circle r={HEAD_R} />
        </clipPath>
        <circle r={HEAD_R} fill={SHADE} />
        <circle r={HEAD_R - 3} cx={-11} cy={-9} fill={W} clipPath={`url(#${clipId})`} />
        <circle r={HEAD_R} fill="none" stroke={INK} strokeWidth={OL} />
        <FaceShape f={p.face} />
        {p.glasses && <Glasses facing={p.face.facing ?? 0} />}
        {p.hat && <HardHat />}
      </g>
      {armGroup(front)}
    </g>
  );
};

/* ------------------------------------------------------------------------------------------ */
/* The pose library. Facing left (toward the tower) unless said otherwise.                      */
/* ------------------------------------------------------------------------------------------ */
const standLegs = (dir = -1): {legL: Leg; legR: Leg} => ({
  legL: {k: [-26, -40], f: [-28, -8], dir},
  legR: {k: [26, -40], f: [28, -8], dir},
});

export const POSES: Record<string, Pose> = {
  // frame 0 / loop end: pushing the leaning tower back up with both hands
  push: {
    hip: [22, -70],
    ang: -20,
    headOff: [6, 6],
    armL: {e: [-80, -130], h: [-118, -160], hand: 'palm', front: true, ha: 0},
    armR: {e: [-40, -190], h: [-112, -214], hand: 'palm', front: false, ha: 0},
    legL: {k: [-14, -40], f: [-22, -8], dir: -1},
    legR: {k: [52, -36], f: [78, -8], dir: -1},
    face: {eyes: 'dot', brows: 'angry', mouth: 'flat', look: [-1, -0.4], facing: -1},
  },
  pushStrain: {
    hip: [26, -66],
    ang: -24,
    headOff: [6, 10],
    armL: {e: [-82, -126], h: [-120, -158], hand: 'palm', front: true, ha: 0},
    armR: {e: [-42, -186], h: [-114, -212], hand: 'palm', front: false, ha: 0},
    legL: {k: [-10, -36], f: [-20, -8], dir: -1},
    legR: {k: [60, -32], f: [92, -8], dir: -1},
    face: {eyes: 'squeeze', brows: 'worried', mouth: 'grit', look: [0, 0], facing: -0.6},
  },
  // builder: standing, trowel in the right-side hand, proud
  builder: {
    hip: [0, -72],
    ang: -3,
    armL: {e: [-62, -108], h: [-58, -70], hand: 'fist', front: true},
    armR: {e: [62, -112], h: [66, -158], hand: 'fist', front: true},
    ...standLegs(-1),
    face: {eyes: 'dot', brows: 'neutral', mouth: 'smile', look: [-1, -0.6], facing: -0.7},
    hat: true,
    prop: {kind: 'mallet', arm: 'R', ang: -78},
  },
  thumbs: {
    hip: [0, -74],
    ang: 2,
    armL: {e: [-72, -132], h: [-84, -176], hand: 'thumb', front: true, ha: -10},
    armR: {e: [60, -110], h: [64, -72], hand: 'fist', front: true},
    ...standLegs(-1),
    face: {eyes: 'happy', brows: 'up', mouth: 'grin', look: [0, 0], facing: -0.3},
    hat: true,
    prop: {kind: 'mallet', arm: 'R', ang: 84},
  },
  scared: {
    hip: [6, -70],
    ang: 5,
    headOff: [2, 4],
    armL: {e: [-70, -120], h: [-54, -176], hand: 'mitt', front: true, ha: 25},
    armR: {e: [62, -112], h: [68, -74], hand: 'fist', front: true},
    legL: {k: [-30, -38], f: [-36, -8], dir: -1},
    legR: {k: [30, -42], f: [38, -8], dir: 1},
    face: {eyes: 'wide', brows: 'worried', mouth: 'wavy', look: [-1, 0.8], facing: -0.5},
    hat: true,
    prop: {kind: 'mallet', arm: 'R', ang: 96},
  },
  // tosses the mallet over his shoulder (empty hands after the release)
  toss: {
    hip: [-6, -72],
    ang: 8,
    armL: {e: [-64, -112], h: [-74, -76], hand: 'mitt', front: true, ha: 20},
    armR: {e: [70, -168], h: [92, -224], hand: 'mitt', front: false, ha: 40},
    ...standLegs(-1),
    face: {eyes: 'closed', brows: 'neutral', mouth: 'smirk', look: [0, 0], facing: -0.4},
    hat: true,
  },
  // walk cycle, drawn facing left (mirror for walking right)
  walkA: {
    hip: [0, -74],
    ang: -7,
    armL: {e: [-46, -112], h: [-66, -84], hand: 'fist', front: true},
    armR: {e: [44, -114], h: [64, -88], hand: 'fist', front: false},
    legL: {k: [-34, -40], f: [-50, -8], dir: -1},
    legR: {k: [30, -38], f: [46, -12], dir: -1},
    face: {eyes: 'dot', brows: 'neutral', mouth: 'smile', look: [-1, 0], facing: -1},
    hat: true,
  },
  walkB: {
    hip: [0, -82],
    ang: -4,
    armL: {e: [-38, -108], h: [-38, -74], hand: 'fist', front: true},
    armR: {e: [38, -110], h: [42, -76], hand: 'fist', front: false},
    legL: {k: [-20, -48], f: [-14, -22], dir: -1},
    legR: {k: [12, -42], f: [10, -8], dir: -1},
    face: {eyes: 'dot', brows: 'neutral', mouth: 'smile', look: [-1, 0], facing: -1},
    hat: true,
  },
  // engineer: glasses, hard hat, clipboard, index finger up
  engineer: {
    hip: [0, -72],
    ang: -2,
    armL: {e: [-70, -128], h: [-80, -184], hand: 'point', front: true, ha: -8},
    armR: {e: [58, -108], h: [26, -112], hand: 'fist', front: true},
    ...standLegs(-1),
    face: {eyes: 'dot', brows: 'up', mouth: 'smile', look: [-0.6, -0.8], facing: -0.5},
    hat: true,
    glasses: true,
    prop: {kind: 'clipboard', arm: 'R', ang: -8},
  },
  engineerWince: {
    hip: [4, -70],
    ang: 5,
    headOff: [0, 6],
    armL: {e: [-64, -114], h: [-40, -150], hand: 'mitt', front: true, ha: 40},
    armR: {e: [58, -106], h: [26, -112], hand: 'fist', front: true},
    ...standLegs(-1),
    face: {eyes: 'squeeze', brows: 'worried', mouth: 'wavy', look: [0, 0], facing: -0.4},
    hat: true,
    glasses: true,
    prop: {kind: 'clipboard', arm: 'R', ang: -4},
  },
};
