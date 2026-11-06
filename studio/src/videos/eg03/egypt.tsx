import React from 'react';
import {C, INK, Limb, OL, P2, add, bentPath, rand, rot} from './core';

// ============================================================ world layout (painting wall at Z 1000)
export const GROUND = 1428; // sand line: bottom register + sledge
export const ROWS = [640, 900, 1160, GROUND]; // register ground lines (feet)
export const PER_ROW = 27; // 4 x 27 = 108 men ("over a hundred")
export const SPACING = 122;
export const FIRST_X = 468; // nearest puller in every row
export const pullerX = (i: number) => FIRST_X - i * SPACING;
export const SLEDGE = {x0: 556, x1: 1062, deck: 1376}; // deck top
export const ROPE_TIE: P2 = [553, 1396];
export const WM_FEET: P2 = [618, SLEDGE.deck]; // water man stands on the front of the sledge
export const POUR_SPOT: P2 = [492, GROUND]; // where the water lands
export const WALL = {x0: -3600, x1: 2200, y0: -1500, y1: 3000};

// ============================================================ small shared bits
export const Sparkle: React.FC<{x: number; y: number; s: number; rot?: number; color?: string}> = ({x, y, s, rot: r = 0, color = C.star}) => {
  if (s <= 0.01) return null;
  const d = 'M0,-30 C4,-8 8,-4 30,0 C8,4 4,8 0,30 C-4,8 -8,4 -30,0 C-8,-4 -4,-8 0,-30 Z';
  return (
    <g transform={`translate(${x},${y}) rotate(${r}) scale(${s})`}>
      <path d={d} fill={color} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
    </g>
  );
};

export const SweatDrop: React.FC<{x: number; y: number; s: number; rot?: number}> = ({x, y, s, rot: r = 0}) => {
  if (s <= 0.01) return null;
  return (
    <g transform={`translate(${x},${y}) rotate(${r}) scale(${s})`}>
      <path d="M0,-22 C7,-10 14,-2 14,7 C14,16 7,22 0,22 C-7,22 -14,16 -14,7 C-14,-2 -7,-10 0,-22 Z" fill={C.sweat} stroke={INK} strokeWidth={4.5} />
      <ellipse cx={-5} cy={6} rx={3} ry={5} fill="#fff" />
    </g>
  );
};

const star5 = (r: number) => {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push(`${(Math.cos(a) * rr).toFixed(1)},${(Math.sin(a) * rr).toFixed(1)}`);
  }
  return `M${pts.join(' L')} Z`;
};

// ============================================================ the tomb wall (static)
const FRIEZE_TOP = 292;
const FRIEZE_BOT = 372;
const DADO_TOP = 1566;

export const TombWall: React.FC = () => {
  const blocks: React.ReactNode[] = [];
  const cols = [C.fBlue, C.fRed, C.fGreen, C.fYellow];
  for (let x = WALL.x0, i = 0; x < WALL.x1; x += 44, i++) {
    blocks.push(<rect key={`b${i}`} x={x} y={FRIEZE_TOP + 16} width={44} height={46} fill={cols[i % 4]} stroke={INK} strokeWidth={4} />);
  }
  const stars: React.ReactNode[] = [];
  for (let y = FRIEZE_TOP - 70, r = 0; y > WALL.y0; y -= 120, r++) {
    for (let x = WALL.x0 + (r % 2) * 60; x < WALL.x1; x += 120) {
      stars.push(<path key={`s${x}_${y}`} d={star5(17)} transform={`translate(${x},${y})`} fill={C.ceilingStar} />);
    }
  }
  const cracks = [
    'M-260,520 l40,60 l-18,50 l36,70',
    'M760,410 l-30,48 l22,40',
    'M-980,1010 l34,40 l-10,46',
    'M300,1720 l40,-30 l30,44 l52,-20',
    'M960,1500 l-26,36 l20,30',
    'M-1700,760 l28,52 l-20,38',
  ];
  return (
    <g>
      {/* ceiling: night-blue with yellow stars */}
      <rect x={WALL.x0} y={WALL.y0} width={WALL.x1 - WALL.x0} height={FRIEZE_TOP - WALL.y0} fill={C.ceiling} />
      {stars}
      {/* frieze */}
      <rect x={WALL.x0} y={FRIEZE_TOP} width={WALL.x1 - WALL.x0} height={FRIEZE_BOT - FRIEZE_TOP} fill={C.fYellow} />
      {blocks}
      <line x1={WALL.x0} x2={WALL.x1} y1={FRIEZE_TOP} y2={FRIEZE_TOP} stroke={INK} strokeWidth={OL} />
      <line x1={WALL.x0} x2={WALL.x1} y1={FRIEZE_BOT} y2={FRIEZE_BOT} stroke={INK} strokeWidth={OL} />
      <rect x={WALL.x0} y={FRIEZE_TOP + 66} width={WALL.x1 - WALL.x0} height={6} fill={C.fRed} />
      {/* painted wall */}
      <rect x={WALL.x0} y={FRIEZE_BOT + OL / 2} width={WALL.x1 - WALL.x0} height={DADO_TOP - FRIEZE_BOT} fill={C.wall} />
      {/* register lines under the three upper rows */}
      {ROWS.slice(0, 3).map((y) => (
        <g key={y}>
          <rect x={WALL.x0} y={y} width={WALL.x1 - WALL.x0} height={14} fill={C.wallShade} />
          <line x1={WALL.x0} x2={WALL.x1} y1={y} y2={y} stroke={INK} strokeWidth={5} />
          <line x1={WALL.x0} x2={WALL.x1} y1={y + 14} y2={y + 14} stroke={INK} strokeWidth={3} />
        </g>
      ))}
      {/* dado + lower wall */}
      <rect x={WALL.x0} y={DADO_TOP} width={WALL.x1 - WALL.x0} height={WALL.y1 - DADO_TOP} fill={C.wallShade} />
      <rect x={WALL.x0} y={DADO_TOP + 10} width={WALL.x1 - WALL.x0} height={18} fill={C.fRed} />
      <rect x={WALL.x0} y={DADO_TOP + 28} width={WALL.x1 - WALL.x0} height={14} fill={C.fYellow} />
      <rect x={WALL.x0} y={DADO_TOP + 42} width={WALL.x1 - WALL.x0} height={18} fill={C.fBlue} />
      <line x1={WALL.x0} x2={WALL.x1} y1={DADO_TOP + 10} y2={DADO_TOP + 10} stroke={INK} strokeWidth={4} />
      <line x1={WALL.x0} x2={WALL.x1} y1={DADO_TOP + 60} y2={DADO_TOP + 60} stroke={INK} strokeWidth={4} />
      {/* age: cracks and chipped spots */}
      {cracks.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={C.wallDark} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {[
        [-420, 470, 26],
        [880, 1530, 20],
        [-1320, 1250, 30],
        [140, 1800, 34],
        [1000, 450, 18],
      ].map(([x, y, r], i) => (
        <ellipse key={`c${i}`} cx={x} cy={y} rx={r} ry={r * 0.7} fill={C.wallShade} stroke={C.wallDark} strokeWidth={3} />
      ))}
    </g>
  );
};

// ============================================================ sand strip of the bottom register
export const SandStrip: React.FC<{wet: number}> = ({wet}) => {
  const dots: React.ReactNode[] = [];
  for (let i = 0; i < 260; i++) {
    const x = WALL.x0 + rand(i * 3.1) * (WALL.x1 - WALL.x0);
    const y = GROUND + 22 + rand(i * 7.7) * 100;
    dots.push(<ellipse key={i} cx={x} cy={y} rx={5 + rand(i) * 4} ry={3 + rand(i * 1.3) * 2} fill={C.sandDot} opacity={0.55} />);
  }
  // wet patch in front of the runner (it is a painting: the man has always been pouring)
  const wx0 = 400;
  const wx1 = 566 + 40 * wet;
  return (
    <g>
      <rect x={WALL.x0} y={GROUND} width={WALL.x1 - WALL.x0} height={DADO_TOP - GROUND} fill={C.sand} />
      <rect x={WALL.x0} y={GROUND + 92} width={WALL.x1 - WALL.x0} height={DADO_TOP - GROUND - 92} fill={C.sandShade} />
      {dots}
      <path
        d={`M${wx0},${GROUND} C${wx0 + 10},${GROUND + 26} ${wx0 + 60},${GROUND + 34} ${(wx0 + wx1) / 2},${GROUND + 32} C${wx1 - 40},${GROUND + 30} ${wx1 - 6},${GROUND + 24} ${wx1},${GROUND} Z`}
        fill={C.sandWet}
      />
      <line x1={WALL.x0} x2={WALL.x1} y1={GROUND} y2={GROUND} stroke={INK} strokeWidth={OL} />
    </g>
  );
};

// ============================================================ Egyptian man (pullers and the water man)
export type Face = {
  blink?: number; // 0 open .. 1 shut
  look?: P2; // pupil offset (-1..1)
  brow?: 'neutral' | 'angry' | 'up' | 'effort';
  mouth?: 'neutral' | 'smile' | 'grit' | 'o' | 'tongue' | 'grin';
  eyes?: 'open' | 'closed' | 'squint';
  flip?: number; // head scaleX: 1 faces left, -1 faces right
};

export type ManPose = {
  hip: P2;
  lean: number;
  footF: P2;
  footB: P2;
  handF: P2;
  handB: P2;
  bendF?: number;
  bendB?: number;
  kneeF?: number;
  kneeB?: number;
  face: Face;
  kilt?: 'short' | 'long';
  jar?: {at: P2; angle: number};
  fistF?: boolean;
  fistB?: boolean;
  openHandF?: boolean;
};

const Head: React.FC<{face: Face}> = ({face}) => {
  const {blink = 0, look = [0, 0], brow = 'neutral', mouth = 'neutral', eyes = 'open', flip = 1} = face;
  const nose = 'M-24,-10 L-37,6 L-25,9';
  const eyeOpen = Math.max(0.06, 1 - blink);
  const browD =
    brow === 'angry' ? 'M-27,-13 L-5,-21' : brow === 'up' ? 'M-25,-24 Q-14,-31 -3,-23' : brow === 'effort' ? 'M-26,-22 L-5,-16' : 'M-25,-19 Q-14,-24 -3,-18';
  return (
    <g transform={`scale(${flip},1)`}>
      {/* ink silhouette */}
      <circle r={28 + OL / 2} fill={INK} />
      <path d={nose} fill={INK} stroke={INK} strokeWidth={OL} strokeLinejoin="round" />
      {/* fill */}
      <circle r={28 - OL / 2} fill={C.skin} />
      <path d={nose} fill={C.skin} stroke={C.skin} strokeWidth={0.1} />
      <path d="M-22,-4 L-30,6 L-22,6 Z" fill={C.skin} />
      {/* wig */}
      <path
        d="M-27,-12 C-27,-40 6,-46 25,-27 C34,-14 33,8 29,25 L6,25 C8,12 4,2 -6,-2 C-14,-5 -22,-6 -27,-12 Z"
        fill={C.hair}
        stroke={INK}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <ellipse cx={7} cy={3} rx={6.5} ry={8.5} fill={C.skin} stroke={INK} strokeWidth={4} />
      {/* eye */}
      {eyes === 'closed' ? (
        <path d="M-22,-6 Q-13,1 -3,-6" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
      ) : (
        <g transform={`translate(-12.5,-6) scale(1,${eyes === 'squint' ? 0.45 : eyeOpen}) translate(12.5,6)`}>
          <path d="M-23,-6 Q-13,-15 -2,-6 Q-13,2 -23,-6 Z" fill={C.eyeWhite} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
          <circle cx={-13 + look[0] * 4} cy={-6 + look[1] * 2.5} r={4.4} fill={INK} />
        </g>
      )}
      <line x1={-2} y1={-6} x2={7} y2={-9} stroke={INK} strokeWidth={3.5} strokeLinecap="round" />
      <path d={browD} fill="none" stroke={INK} strokeWidth={4.5} strokeLinecap="round" />
      {/* mouth */}
      {mouth === 'neutral' && <path d="M-27,14 L-19,15" stroke={INK} strokeWidth={3.5} strokeLinecap="round" />}
      {mouth === 'smile' && <path d="M-29,12 Q-23,19 -16,13" fill="none" stroke={INK} strokeWidth={3.5} strokeLinecap="round" />}
      {mouth === 'grin' && <path d="M-30,11 Q-22,24 -12,12 Z" fill="#fff" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />}
      {mouth === 'grit' && (
        <g>
          <rect x={-31} y={9} width={16} height={9} rx={2} fill="#fff" stroke={INK} strokeWidth={3.5} />
          <line x1={-23} y1={9} x2={-23} y2={18} stroke={INK} strokeWidth={2.5} />
        </g>
      )}
      {mouth === 'o' && <ellipse cx={-24} cy={14} rx={4.5} ry={6} fill={INK} />}
      {mouth === 'tongue' && (
        <g>
          <path d="M-29,12 Q-23,18 -16,13" fill="none" stroke={INK} strokeWidth={3.5} strokeLinecap="round" />
          <path d="M-27,15 Q-28,24 -22,23 Q-19,21 -21,15.5 Z" fill={C.blush} stroke={INK} strokeWidth={3} />
        </g>
      )}
    </g>
  );
};

export const Jar: React.FC<{tilt?: number}> = () => (
  <g>
    <path d="M-12,-30 C-30,-20 -34,6 -28,22 C-22,40 22,40 28,22 C34,6 30,-20 12,-30 Z" fill={C.jar} stroke={INK} strokeWidth={OL} strokeLinejoin="round" />
    <path d="M14,-22 C28,-8 30,12 22,30 C30,26 33,4 26,-12 Z" fill={C.jarShade} />
    <path d="M-16,-12 C-22,-2 -22,10 -18,16" fill="none" stroke={C.jarLight} strokeWidth={6} strokeLinecap="round" />
    <rect x={-13} y={-42} width={26} height={14} rx={3} fill={C.jar} stroke={INK} strokeWidth={OL - 2} />
    <rect x={-17} y={-50} width={34} height={10} rx={4} fill={C.jarLight} stroke={INK} strokeWidth={OL - 2} />
    <path d="M-26,0 L-4,4" stroke={C.fYellow} strokeWidth={5} />
    <path d="M-28,8 Q0,16 28,8" fill="none" stroke={INK} strokeWidth={3} opacity={0.5} />
  </g>
);
export const JAR_MOUTH: P2 = [0, -50];

export const Egyptian: React.FC<{x: number; y: number; p: ManPose; scale?: number}> = ({x, y, p, scale = 1}) => {
  const {hip, lean, footF, footB, handF, handB, bendF = -12, bendB = -10, kneeF = 14, kneeB = -4, face, kilt = 'short', jar} = p;
  const shF = add(hip, rot([-9, -74], lean));
  const shB = add(hip, rot([7, -73], lean));
  const headC = add(hip, rot([-5, -116], lean));
  const ankF: P2 = [footF[0], footF[1] - 12];
  const ankB: P2 = [footB[0], footB[1] - 12];
  const footPath = (f: P2) => `M${f[0] + 10},${f[1]} L${f[0] - 26},${f[1]} Q${f[0] - 34},${f[1]} ${f[0] - 30},${f[1] - 9} Q${f[0] - 24},${f[1] - 16} ${f[0] + 6},${f[1] - 16} Q${f[0] + 12},${f[1] - 12} ${f[0] + 10},${f[1]} Z`;
  const kiltD =
    kilt === 'long'
      ? 'M-27,-12 L23,-12 L34,74 Q0,82 -40,74 Z'
      : 'M-27,-12 L23,-12 L30,42 Q-2,50 -37,42 Z';
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      {/* back arm + back leg */}
      <Limb d={bentPath(shB, handB, bendB)} w={16} fill={C.skinShade} />
      {p.fistB !== false && <circle cx={handB[0]} cy={handB[1]} r={10} fill={C.skinShade} stroke={INK} strokeWidth={OL - 2} />}
      <Limb d={bentPath(hip, ankB, kneeB)} w={21} fill={C.skinShade} />
      <path d={footPath(footB)} fill={C.skinShade} stroke={INK} strokeWidth={OL - 2} strokeLinejoin="round" />
      {/* jar sits between the arms */}
      {jar && (
        <g transform={`translate(${jar.at[0]},${jar.at[1]}) rotate(${jar.angle})`}>
          <Jar />
        </g>
      )}
      {/* front leg */}
      <Limb d={bentPath(hip, ankF, kneeF)} w={21} fill={C.skin} />
      <path d={footPath(footF)} fill={C.skin} stroke={INK} strokeWidth={OL - 2} strokeLinejoin="round" />
      {/* torso */}
      <g transform={`translate(${hip[0]},${hip[1]}) rotate(${lean})`}>
        <rect x={-13} y={-96} width={15} height={26} fill={C.skin} stroke={INK} strokeWidth={OL - 2} />
        <path d="M-21,4 C-24,-28 -31,-58 -25,-77 Q-4,-92 17,-78 C21,-50 21,-22 18,4 Z" fill={C.skin} stroke={INK} strokeWidth={OL} strokeLinejoin="round" />
        <path d="M17,-74 C21,-48 21,-20 18,4 L8,4 C11,-20 11,-48 8,-70 Z" fill={C.skinShade} />
      </g>
      {/* kilt */}
      <g transform={`translate(${hip[0]},${hip[1]}) rotate(${lean * 0.45})`}>
        <path d={kiltD} fill={C.kilt} stroke={INK} strokeWidth={OL} strokeLinejoin="round" />
        <path d={kilt === 'long' ? 'M23,-12 L34,74 Q24,77 18,77 L12,-12 Z' : 'M23,-12 L30,42 Q22,45 16,45 L12,-12 Z'} fill={C.kiltShade} />
        <rect x={-28} y={-15} width={52} height={10} fill={kilt === 'long' ? C.sash : C.kiltShade} stroke={INK} strokeWidth={4} />
        <path d={kilt === 'long' ? 'M-10,-6 L-16,70' : 'M-8,-6 L-13,40'} stroke={C.kiltShade} strokeWidth={4} />
      </g>
      {/* head */}
      <g transform={`translate(${headC[0]},${headC[1]}) rotate(${lean * 0.6})`}>
        <Head face={face} />
      </g>
      {/* front arm */}
      <Limb d={bentPath(shF, handF, bendF)} w={16} fill={C.skin} />
      {p.openHandF ? (
        <g transform={`translate(${handF[0]},${handF[1]})`}>
          <ellipse rx={11} ry={14} fill={C.skin} stroke={INK} strokeWidth={OL - 2} />
          <path d="M-4,-12 L-6,-24 M2,-13 L2,-26 M7,-11 L10,-22" stroke={INK} strokeWidth={9} strokeLinecap="round" />
          <path d="M-4,-12 L-6,-24 M2,-13 L2,-26 M7,-11 L10,-22" stroke={C.skin} strokeWidth={4} strokeLinecap="round" />
        </g>
      ) : (
        p.fistF !== false && <circle cx={handF[0]} cy={handF[1]} r={11} fill={C.skin} stroke={INK} strokeWidth={OL - 2} />
      )}
    </g>
  );
};

// ============================================================ pullers
export type PullerAnim = {lean: number; step: number; bob: number; reach: number; face: Face};
export const pullerPose = (a: PullerAnim): ManPose => ({
  hip: [0, -100 + a.bob],
  lean: a.lean,
  footF: [-50 + 9 * a.step, 0],
  footB: [44 - 9 * a.step, 0],
  handF: [-66 + a.reach * 6, -124 + a.reach * 2],
  handB: [-50 + a.reach * 6, -128 + a.reach * 2],
  bendF: -14,
  bendB: -12,
  kneeF: 16,
  kneeB: -3,
  face: a.face,
});
export const handWorld = (x: number, y: number, a: PullerAnim): P2 => [x - 66 + a.reach * 6, y - 124 + a.reach * 2];

export const RowRope: React.FC<{pts: P2[]}> = ({pts}) => {
  const d = `M${pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L')}`;
  return (
    <g>
      <path d={d} fill="none" stroke={INK} strokeWidth={12 + OL} strokeLinejoin="round" strokeLinecap="round" />
      <path d={d} fill="none" stroke={C.rope} strokeWidth={12} strokeLinejoin="round" strokeLinecap="round" />
      <path d={d} fill="none" stroke={C.ropeShade} strokeWidth={3} strokeDasharray="10 14" strokeLinejoin="round" />
    </g>
  );
};

// ============================================================ sledge + statue
export const Sledge: React.FC<{dx?: number}> = ({dx = 0}) => {
  const {x0, x1, deck} = SLEDGE;
  return (
    <g transform={`translate(${dx},0)`}>
      {/* runner with the curled front */}
      <path
        d={`M${x0 + 30},${GROUND} L${x1},${GROUND} L${x1},${deck + 30} L${x0 + 34},${deck + 30} C${x0 + 6},${deck + 30} ${x0 - 14},${deck + 10} ${x0 - 8},${deck - 22} C${x0 - 22},${deck - 10} ${x0 - 22},${GROUND - 6} ${x0 + 30},${GROUND} Z`}
        fill={C.wood}
        stroke={INK}
        strokeWidth={OL}
        strokeLinejoin="round"
      />
      <path d={`M${x0 + 30},${GROUND - 8} L${x1 - 4},${GROUND - 8}`} stroke={C.woodShade} strokeWidth={8} />
      {/* deck beam */}
      <rect x={x0 + 20} y={deck} width={x1 - x0 - 20} height={30} fill={C.woodLight} stroke={INK} strokeWidth={OL} />
      {[0.25, 0.5, 0.75].map((u) => (
        <line key={u} x1={x0 + 20 + u * (x1 - x0 - 20)} x2={x0 + 20 + u * (x1 - x0 - 20)} y1={deck + 4} y2={deck + 26} stroke={C.woodShade} strokeWidth={4} />
      ))}
      {/* cross struts */}
      {[0.12, 0.42, 0.72, 0.95].map((u) => (
        <rect key={u} x={x0 + 20 + u * (x1 - x0 - 60)} y={deck + 30} width={22} height={GROUND - deck - 30} fill={C.woodShade} stroke={INK} strokeWidth={4} />
      ))}
    </g>
  );
};

export type StatueFace = {open: number; look: P2; lid: number; brow: number};
export const STATUE_EYE: P2 = [818, 648];
export const Statue: React.FC<{dx?: number; face: StatueFace; squash?: number}> = ({dx = 0, face, squash = 1}) => {
  const s = {fill: C.stone, stroke: INK, strokeWidth: OL, strokeLinejoin: 'round' as const};
  const base = SLEDGE.deck;
  return (
    <g transform={`translate(${dx},0) translate(850,${base}) scale(${2 - squash},${squash}) translate(-850,${-base})`}>
      {/* pedestal */}
      <rect x={690} y={1298} width={330} height={base - 1298} {...s} />
      <rect x={690} y={1298} width={330} height={16} fill={C.stoneShade} stroke={INK} strokeWidth={4} />
      {/* throne */}
      <rect x={858} y={930} width={160} height={370} {...s} />
      <rect x={986} y={938} width={28} height={356} fill={C.stoneShade} />
      <path d="M876,1010 L1000,1010 M876,1120 L1000,1120 M876,1230 L1000,1230" stroke={C.stoneDark} strokeWidth={5} />
      {/* shins + feet */}
      <rect x={712} y={1062} width={88} height={226} rx={10} {...s} />
      <path d="M684,1300 L684,1276 Q684,1258 704,1256 L800,1256 L800,1300 Z" {...s} />
      <rect x={772} y={1070} width={22} height={190} fill={C.stoneShade} />
      {/* lap */}
      <path d="M700,1000 Q700,982 720,982 L900,982 L900,1076 L720,1076 Q700,1076 700,1058 Z" {...s} />
      {/* torso */}
      <path d="M806,1000 L796,770 Q800,724 846,716 L928,716 Q950,730 950,790 L944,1000 Z" {...s} />
      <path d="M930,724 Q950,740 950,790 L944,1000 L916,1000 L922,760 Z" fill={C.stoneShade} />
      {/* arm resting on the lap */}
      <path d="M884,760 Q912,780 908,860 L900,950 Q896,996 846,1000 L740,1000 Q716,1000 716,980 Q718,962 742,962 L840,960 Q860,958 862,930 L866,800 Q868,770 884,760 Z" {...s} />
      <path d="M742,962 L716,972" stroke={C.stoneDark} strokeWidth={5} />
      {/* head */}
      <g transform={`translate(0,0)`}>
        <rect x={826} y={690} width={56} height={40} fill={C.stone} stroke={INK} strokeWidth={OL} />
        {/* beard */}
        <path d="M806,700 L798,758 Q806,770 820,766 L826,704 Z" fill={C.stoneWig} stroke={INK} strokeWidth={OL - 2} strokeLinejoin="round" />
        {/* face */}
        <path d="M800,560 Q806,540 850,538 Q912,538 924,590 L926,680 Q900,712 846,712 Q810,712 804,690 L794,672 Q790,664 796,656 L784,632 Q780,622 790,616 L796,612 Z" {...s} />
        {/* wig / headcloth */}
        <path d="M806,566 Q820,520 872,518 Q936,520 944,584 L950,720 L900,720 L898,640 Q880,600 840,594 Q820,594 808,590 Z" fill={C.stoneWig} stroke={INK} strokeWidth={OL} strokeLinejoin="round" />
        <path d="M900,560 L940,600 M890,600 L944,650 M900,650 L948,700" stroke={'#5A4B3C'} strokeWidth={5} />
        <ellipse cx={890} cy={652} rx={12} ry={18} fill={C.stone} stroke={INK} strokeWidth={4} />
        {/* mouth */}
        <path d="M800,680 Q808,686 816,682" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
        <StatueEye face={face} />
      </g>
    </g>
  );
};

const StatueEye: React.FC<{face: StatueFace}> = ({face}) => {
  const [ex, ey] = STATUE_EYE;
  const o = face.open;
  return (
    <g transform={`translate(${ex},${ey})`}>
      {/* carved (closed / painted) eye */}
      <path d="M-20,0 Q-2,-12 18,0 Q-2,8 -20,0 Z" fill={C.stoneDark} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      <line x1={18} y1={0} x2={30} y2={-4} stroke={INK} strokeWidth={4} strokeLinecap="round" />
      {o > 0.01 && (
        <g transform={`scale(1,${o})`}>
          <ellipse cx={0} cy={-4} rx={21} ry={17} fill={C.eyeWhite} stroke={INK} strokeWidth={4.5} />
          <circle cx={face.look[0] * 9} cy={-4 + face.look[1] * 7} r={8} fill={INK} />
          <circle cx={face.look[0] * 9 - 3} cy={-7 + face.look[1] * 7} r={2.6} fill="#fff" />
          {face.lid > 0.01 && (
            <g>
              <clipPath id="stLid">
                <ellipse cx={0} cy={-4} rx={21} ry={17} />
              </clipPath>
              <rect x={-24} y={-24} width={48} height={40 * face.lid * 0.5 + 2} fill={C.stoneShade} clipPath="url(#stLid)" />
              <line x1={-22} x2={22} y1={-22 + 40 * face.lid * 0.5} y2={-22 + 40 * face.lid * 0.5} stroke={INK} strokeWidth={4} />
            </g>
          )}
        </g>
      )}
      {/* brow */}
      {o > 0.01 && (
        <path d={`M-22,${-30 - 4 * face.brow} Q0,${-40 - 6 * face.brow} 22,${-28 - 2 * face.brow}`} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
      )}
    </g>
  );
};

// ============================================================ water
/** stream from the jar mouth falling under gravity to the ground; width w */
export const WaterStream: React.FC<{from: P2; to: P2; w: number; t: number; amount?: number}> = ({from, to, w, t}) => {
  if (w <= 0.3) return null;
  const cx = from[0] - 8;
  const cy = from[1] + (to[1] - from[1]) * 0.15;
  const d = `M${from[0]},${from[1]} Q${cx},${cy} ${to[0]},${to[1]}`;
  const wob = 1 + 0.08 * Math.sin(t * 40);
  return (
    <g>
      <path d={d} fill="none" stroke={INK} strokeWidth={w * wob + 8} strokeLinecap="round" />
      <path d={d} fill="none" stroke={C.water} strokeWidth={w * wob} strokeLinecap="round" />
      <path d={d} fill="none" stroke={C.waterLight} strokeWidth={Math.max(1, w * 0.28)} strokeLinecap="round" strokeDasharray="22 30" strokeDashoffset={-t * 900} />
    </g>
  );
};

/** splash droplets at the landing spot (deterministic, time based) */
export const Splash: React.FC<{at: P2; t: number; t0: number; t1: number; rate?: number; size?: number}> = ({at, t, t0, t1, rate = 18, size = 1}) => {
  const out: React.ReactNode[] = [];
  const n0 = Math.floor((t - 0.6 - t0) * rate);
  const n1 = Math.floor((Math.min(t, t1) - t0) * rate);
  for (let i = Math.max(0, n0); i <= n1; i++) {
    const born = t0 + i / rate;
    const age = t - born;
    if (age < 0 || age > 0.6) continue;
    const ang = (-160 + rand(i * 2.3) * 140) * (Math.PI / 180);
    const sp = (260 + rand(i * 5.1) * 260) * size;
    const vx = Math.cos(ang) * sp;
    const vy = Math.sin(ang) * sp;
    const x = at[0] + vx * age;
    const y = at[1] + vy * age + 0.5 * 2600 * age * age;
    if (y > at[1] + 4) continue;
    const r = (5 + rand(i * 9.7) * 5) * size;
    out.push(<circle key={i} cx={x} cy={y} r={r} fill={C.water} stroke={INK} strokeWidth={3} />);
  }
  return <g>{out}</g>;
};

// ============================================================ ghost pile (what dry sand would do)
export const GhostPile: React.FC<{h: number; pop: number; x: number}> = ({h, pop, x}) => {
  if (h <= 0.01 || pop >= 0.999) return null;
  const x1 = SLEDGE.x0 - 10;
  const x0 = x1 - 168;
  const top = GROUND - 116 * h;
  const d = `M${x0},${GROUND} C${x0 + 36},${GROUND - 6} ${x0 + 62},${top} ${x0 + 102},${top} C${x1 - 16},${top} ${x1},${GROUND - 44 * h} ${x1},${GROUND} Z`;
  const s = 1 - easeInOutLocal(pop);
  const cx = x0 + 86;
  const cy = GROUND - 46 * h;
  return (
    <g transform={`translate(${cx},${GROUND}) scale(${s}) translate(${-cx},${-GROUND})`}>
      <path d={d} fill="#FFE6B8" opacity={0.92} />
      <path d={d} fill="none" stroke={INK} strokeWidth={7} strokeDasharray="18 12" strokeLinejoin="round" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <circle key={i} cx={x0 + 30 + i * 17} cy={GROUND - 12 - 46 * h * Math.sin(((i + 0.5) / 7) * Math.PI)} r={5} fill={C.sandDot} />
      ))}
      {x > 0.01 && (
        <g transform={`translate(${cx},${cy}) scale(${x}) rotate(-8)`}>
          <path d="M-62,-58 L62,58 M62,-58 L-62,58" stroke={INK} strokeWidth={42} strokeLinecap="round" />
          <path d="M-62,-58 L62,58 M62,-58 L-62,58" stroke={C.red} strokeWidth={26} strokeLinecap="round" />
        </g>
      )}
    </g>
  );
};
const easeInOutLocal = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);

// ============================================================ foreground tomb pillars + torch (Z 640)
export const Pillar: React.FC<{x: number; w: number; torch?: boolean; t: number}> = ({x, w, torch, t}) => {
  const y0 = -1800;
  const y1 = 3600;
  return (
    <g>
      <rect x={x} y={y0} width={w} height={y1 - y0} fill={C.pillar} stroke={INK} strokeWidth={OL} />
      <rect x={x + w * 0.68} y={y0} width={w * 0.32} height={y1 - y0} fill={C.pillarShade} />
      <rect x={x + w * 0.1} y={y0} width={w * 0.12} height={y1 - y0} fill={C.pillarLight} />
      {[-600, -200, 200, 600, 1000, 1400, 1800, 2200, 2600].map((y) => (
        <line key={y} x1={x} x2={x + w} y1={y} y2={y} stroke={C.pillarShade} strokeWidth={6} />
      ))}
      {torch && <Torch x={x + (w > 0 ? w : 0)} y={720} t={t} side={x < 500 ? 1 : -1} />}
    </g>
  );
};

export const Torch: React.FC<{x: number; y: number; t: number; side: number}> = ({x, y, t, side}) => {
  const f = (k: number, ph: number) => Math.sin(t * k + ph);
  const h = 1 + 0.08 * f(17, 0) + 0.05 * f(29, 1.3);
  const sw = 6 * f(11, 0.4) + 4 * f(23, 2.1);
  const tx = x + side * 70;
  return (
    <g>
      {/* bracket */}
      <path d={`M${x},${y + 40} L${tx},${y + 40} L${tx},${y + 10}`} fill="none" stroke={INK} strokeWidth={22} strokeLinecap="round" strokeLinejoin="round" />
      <path d={`M${x},${y + 40} L${tx},${y + 40} L${tx},${y + 10}`} fill="none" stroke={C.metalShade} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
      {/* stick */}
      <rect x={tx - 16} y={y - 40} width={32} height={110} rx={8} fill={C.wood} stroke={INK} strokeWidth={OL} />
      {/* flame */}
      <g transform={`translate(${tx},${y - 40}) scale(1,${h})`}>
        <path d={`M-38,0 C-46,-50 ${-10 + sw},-80 ${sw * 1.6},-150 C${20 + sw},-90 52,-60 38,0 Q0,18 -38,0 Z`} fill={C.flame} stroke={INK} strokeWidth={OL} strokeLinejoin="round" />
        <path d={`M-22,0 C-26,-34 ${-4 + sw},-58 ${sw * 1.2},-104 C${12 + sw},-60 30,-36 22,0 Q0,10 -22,0 Z`} fill={C.flameMid} />
        <path d={`M-10,0 C-12,-20 ${sw * 0.5},-36 ${sw * 0.8},-60 C${6 + sw * 0.5},-34 14,-18 10,0 Z`} fill={C.flameCore} />
      </g>
    </g>
  );
};

// ============================================================ magnifier lens with wet sand grains (screen space)
type Grain = {x: number; y: number; r: number; seed: number};
const GRAINS: Grain[] = (() => {
  const out: Grain[] = [];
  const pts: P2[] = [
    [-210, -150], [-60, -190], [90, -170], [230, -120],
    [-250, 10], [-110, -30], [40, -20], [180, 20], [300, 60],
    [-200, 160], [-50, 130], [100, 150], [240, 200],
    [-120, 280], [40, 300], [-300, -60], [170, -260], [-180, -290],
  ];
  pts.forEach(([x, y], i) => out.push({x, y, r: 62 + rand(i * 3.3) * 16, seed: i}));
  return out;
})();
const NEIGH: [number, number][] = (() => {
  const out: [number, number][] = [];
  for (let i = 0; i < GRAINS.length; i++)
    for (let j = i + 1; j < GRAINS.length; j++) {
      const a = GRAINS[i];
      const b = GRAINS[j];
      if (Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r + 26) out.push([i, j]);
    }
  return out;
})();

const grainPath = (g: Grain) => {
  const n = 9;
  const pts: string[] = [];
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    const rr = g.r * (0.86 + 0.16 * rand(g.seed * 11 + k));
    pts.push(`${(Math.cos(a) * rr).toFixed(1)},${(Math.sin(a) * rr).toFixed(1)}`);
  }
  // smooth closed curve through the points (Catmull-Rom -> cubic)
  const P = pts.map((s) => s.split(',').map(Number) as P2);
  let d = `M${P[0][0]},${P[0][1]}`;
  for (let k = 0; k < n; k++) {
    const p0 = P[(k - 1 + n) % n];
    const p1 = P[k];
    const p2 = P[(k + 1) % n];
    const p3 = P[(k + 2) % n];
    d += ` C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0]},${p2[1]}`;
  }
  return d + ' Z';
};
const GRAIN_D = GRAINS.map(grainPath);
const GRAIN_COLS = ['#F0C27A', '#E8B266', '#F5CF8E', '#DDA45A'];

/** lens: s = pop scale, bridges 0..1, happy 0..1, t for jiggle */
export const SandLens: React.FC<{cx: number; cy: number; R: number; s: number; bridges: number; happy: number; t: number}> = ({cx, cy, R, s, bridges, happy, t}) => {
  if (s <= 0.01) return null;
  const loose = 1 - bridges;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
      <defs>
        <clipPath id="lensClip">
          <circle cx={0} cy={0} r={R} />
        </clipPath>
      </defs>
      <g transform={`translate(${cx},${cy}) scale(${s})`}>
        {/* handle */}
        <g transform="rotate(38)">
          <rect x={R - 10} y={-34} width={300} height={68} rx={30} fill={INK} />
          <rect x={R + 2} y={-24} width={276} height={48} rx={22} fill={C.wood} />
          <rect x={R + 2} y={-24} width={276} height={16} rx={8} fill={C.woodLight} />
        </g>
        <circle r={R + 30} fill={INK} />
        <circle r={R + 22} fill={C.metal} />
        <circle r={R + 22} fill="none" stroke={C.metalLight} strokeWidth={8} strokeDasharray={`${R * 1.2} ${R * 5}`} transform="rotate(200)" />
        <g clipPath="url(#lensClip)">
          <rect x={-R} y={-R} width={2 * R} height={2 * R} fill={C.sandWetDark} />
          {/* water bridges between neighbouring grains */}
          {NEIGH.map(([i, j], k) => {
            const a = GRAINS[i];
            const b = GRAINS[j];
            const local = Math.max(0, Math.min(1, bridges * 1.6 - (k % 7) * 0.08));
            if (local <= 0.01) return null;
            const w = 34 * local;
            return (
              <g key={`b${k}`}>
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={INK} strokeWidth={w + 8} strokeLinecap="round" />
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={C.water} strokeWidth={w} strokeLinecap="round" />
                <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={C.waterLight} strokeWidth={w * 0.25} strokeLinecap="round" />
              </g>
            );
          })}
          {GRAINS.map((g, i) => {
            const jx = loose * 7 * Math.sin(t * 13 + i * 1.7);
            const jy = loose * 7 * Math.cos(t * 11 + i * 2.3);
            const look = Math.sin(t * 2 + i) * 0.6;
            return (
              <g key={i} transform={`translate(${g.x + jx},${g.y + jy})`}>
                <path d={GRAIN_D[i]} fill={GRAIN_COLS[i % 4]} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
                <path d={GRAIN_D[i]} fill="#000" opacity={0.08} transform="translate(10,12) scale(0.8)" />
                {/* face */}
                <g transform={`translate(${-6 + (i % 3) * 4},${-4})`}>
                  <ellipse cx={-16 + look * 3} cy={-6} rx={7} ry={happy > 0.5 ? 3.5 : 9} fill={INK} />
                  <ellipse cx={16 + look * 3} cy={-6} rx={7} ry={happy > 0.5 ? 3.5 : 9} fill={INK} />
                  {happy > 0.5 ? (
                    <path d="M-14,10 Q0,26 14,10" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
                  ) : (
                    <path d="M-10,16 Q0,10 10,16" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
                  )}
                  {happy > 0.5 && (
                    <>
                      <ellipse cx={-28} cy={8} rx={8} ry={5} fill={C.blush} opacity={0.8} />
                      <ellipse cx={28} cy={8} rx={8} ry={5} fill={C.blush} opacity={0.8} />
                    </>
                  )}
                </g>
              </g>
            );
          })}
          {/* glass glint */}
          <path d={`M${-R * 0.7},${-R * 0.35} A${R * 0.8},${R * 0.8} 0 0 1 ${-R * 0.25},${-R * 0.75}`} fill="none" stroke="#fff" strokeWidth={22} strokeLinecap="round" opacity={0.45} />
        </g>
        <circle r={R} fill="none" stroke={INK} strokeWidth={8} />
      </g>
    </svg>
  );
};
