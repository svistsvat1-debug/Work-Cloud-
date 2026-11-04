import React from 'react';
import {Brain, BrainProps} from './brain';
import {C, INK, OL, clamp, lerp} from './core';

// =====================================================================
// shared eye
// =====================================================================
export type EyeMode = 'open' | 'happy' | 'squeezeL' | 'squeezeR' | 'spiral';

const spiralPath = (cx: number, cy: number, r: number) => {
  let d = `M ${cx} ${cy}`;
  for (let i = 1; i <= 30; i++) {
    const a = i * 0.6;
    const rr = (r * i) / 30;
    d += ` L ${cx + Math.cos(a) * rr} ${cy + Math.sin(a) * rr}`;
  }
  return d;
};

export const Eye: React.FC<{
  id: string;
  x: number;
  y: number;
  r: number;
  look?: [number, number];
  lid?: number; // 0 open .. 1 closed
  mode?: EyeMode;
  pupil?: number;
  lidColor?: string;
}> = ({id, x, y, r, look = [0, 0], lid = 0, mode = 'open', pupil = 0.44, lidColor = C.whiteShade}) => {
  if (mode === 'happy')
    return <path d={`M ${x - r * 0.7} ${y + r * 0.25} Q ${x} ${y - r * 0.75} ${x + r * 0.7} ${y + r * 0.25}`} stroke={INK} strokeWidth={OL} fill="none" strokeLinecap="round" />;
  if (mode === 'squeezeL')
    return <path d={`M ${x - r * 0.55} ${y - r * 0.55} L ${x + r * 0.5} ${y} L ${x - r * 0.55} ${y + r * 0.55}`} stroke={INK} strokeWidth={OL} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
  if (mode === 'squeezeR')
    return <path d={`M ${x + r * 0.55} ${y - r * 0.55} L ${x - r * 0.5} ${y} L ${x + r * 0.55} ${y + r * 0.55}`} stroke={INK} strokeWidth={OL} fill="none" strokeLinecap="round" strokeLinejoin="round" />;
  const L = clamp(lid);
  return (
    <g>
      <defs>
        <clipPath id={`eye-${id}`}>
          <circle cx={x} cy={y} r={r} />
        </clipPath>
      </defs>
      <circle cx={x} cy={y} r={r} fill={C.white} />
      {mode === 'spiral' ? (
        <path d={spiralPath(x, y, r * 0.8)} stroke={INK} strokeWidth={r * 0.13} fill="none" strokeLinecap="round" />
      ) : (
        <g>
          <circle cx={x + look[0] * r * 0.38} cy={y + look[1] * r * 0.38} r={r * pupil} fill={INK} />
          <circle cx={x + look[0] * r * 0.38 - r * 0.14} cy={y + look[1] * r * 0.38 - r * 0.16} r={r * 0.12} fill={C.white} />
        </g>
      )}
      {L > 0.02 && (
        <g clipPath={`url(#eye-${id})`}>
          <rect x={x - r - 2} y={y - r - 2} width={2 * r + 4} height={2 * r * L + 2} fill={lidColor} />
          <line x1={x - r} y1={y - r + 2 * r * L} x2={x + r} y2={y - r + 2 * r * L} stroke={INK} strokeWidth={OL * 0.8} strokeLinecap="round" />
        </g>
      )}
      <circle cx={x} cy={y} r={r} fill="none" stroke={INK} strokeWidth={OL * 0.85} />
    </g>
  );
};

/** thick cartoon brow; tilt>0 lifts the outer end; dy moves it up (negative) */
const Brow: React.FC<{x: number; y: number; w: number; dy?: number; tilt?: number; flip?: boolean; arch?: number}> = ({x, y, w, dy = 0, tilt = 0, flip = false, arch = 6}) => {
  const s = flip ? -1 : 1;
  const x1 = x - (w / 2) * s;
  const x2 = x + (w / 2) * s;
  const y1 = y + dy + tilt * 0.5; // inner
  const y2 = y + dy - tilt * 0.5; // outer
  return <path d={`M ${x1} ${y1} Q ${x} ${y + dy - arch} ${x2} ${y2}`} stroke={INK} strokeWidth={13} fill="none" strokeLinecap="round" />;
};

// =====================================================================
// woodpecker (matches the part-1 character)
// local origin = feet grip point; trunk face starts at x = 50
// =====================================================================
export type WPExpr = 'neutral' | 'smug' | 'up' | 'squeeze' | 'worried' | 'side' | 'dizzy' | 'shrug' | 'proud' | 'look';

export const HEAD_FRONT: [number, number] = [-140, -440];
export const HEAD_SIDE: [number, number] = [-185, -435];
export const NECK: [number, number] = [-140, -330];
const R = 120;

const Crest: React.FC<{side?: boolean}> = ({side}) =>
  side ? (
    <path
      d="M -30 -108 L -110 -196 L -78 -118 L -168 -150 L -100 -84 L -150 -60 L -84 -50 Z"
      fill={C.red}
      stroke={INK}
      strokeWidth={OL}
      strokeLinejoin="round"
    />
  ) : (
    <path d="M -64 -86 L -84 -178 L -34 -118 L -6 -210 L 22 -120 L 76 -180 L 64 -86 Z" fill={C.red} stroke={INK} strokeWidth={OL} strokeLinejoin="round" />
  );

const expressionSetup = (expr: WPExpr) => {
  // returns [eyeModeL, eyeModeR, look, lid, browL(dy,tilt), browR(dy,tilt), pupil]
  switch (expr) {
    case 'smug':
      return {mL: 'open', mR: 'open', look: [0.35, 0.05], lid: 0.48, bL: [-2, 8], bR: [6, -4], pupil: 0.44} as const;
    case 'up':
      return {mL: 'open', mR: 'open', look: [0.1, -0.85], lid: 0, bL: [-18, -6], bR: [-18, -6], pupil: 0.36} as const;
    case 'squeeze':
      return {mL: 'squeezeL', mR: 'squeezeR', look: [0, 0], lid: 0, bL: [6, -14], bR: [6, -14], pupil: 0.44} as const;
    case 'worried':
      return {mL: 'open', mR: 'open', look: [0, 0.35], lid: 0.12, bL: [-10, -20], bR: [-10, -20], pupil: 0.4} as const;
    case 'side':
      return {mL: 'open', mR: 'open', look: [-0.85, 0.1], lid: 0.42, bL: [4, 0], bR: [4, 0], pupil: 0.44} as const;
    case 'dizzy':
      return {mL: 'spiral', mR: 'spiral', look: [0, 0], lid: 0, bL: [-8, -10], bR: [-8, -10], pupil: 0.44} as const;
    case 'shrug':
      return {mL: 'open', mR: 'open', look: [0.55, -0.55], lid: 0.08, bL: [-20, 10], bR: [-8, -10], pupil: 0.42} as const;
    case 'proud':
      return {mL: 'happy', mR: 'happy', look: [0, 0], lid: 0, bL: [-12, 6], bR: [-12, 6], pupil: 0.44} as const;
    case 'look':
      return {mL: 'open', mR: 'open', look: [-0.8, 0.2], lid: 0, bL: [-4, 0], bR: [-4, 0], pupil: 0.44} as const;
    default:
      return {mL: 'open', mR: 'open', look: [0, 0], lid: 0, bL: [0, 0], bR: [0, 0], pupil: 0.44} as const;
  }
};

const WPHeadFrontNormal: React.FC<{id: string; expr: WPExpr; blink: number; lookOverride?: [number, number]}> = ({id, expr, blink, lookOverride}) => {
  const e = expressionSetup(expr);
  const look = lookOverride ?? (e.look as unknown as [number, number]);
  const lid = Math.max(e.lid, blink);
  return (
    <g>
      <circle r={R} fill={C.white} />
      <path d={`M ${-R + 4} 10 A ${R - 4} ${R - 4} 0 0 0 ${-20} ${R - 6} Q -96 60 ${-R + 4} 10 Z`} fill={C.whiteShade} />
      <circle r={R} fill="none" stroke={INK} strokeWidth={OL} />
      <g stroke={INK} strokeWidth={17} strokeLinecap="round" fill="none">
        <path d="M -20 44 Q -64 60 -112 38" />
        <path d="M 20 44 Q 64 60 112 38" />
      </g>
      <Eye id={`${id}-l`} x={-44} y={-12} r={33} look={look} lid={lid} mode={e.mL} pupil={e.pupil} />
      <Eye id={`${id}-r`} x={44} y={-12} r={33} look={look} lid={lid} mode={e.mR} pupil={e.pupil} />
      <Brow x={-46} y={-62} w={50} dy={e.bL[0]} tilt={e.bL[1]} />
      <Brow x={46} y={-62} w={50} dy={e.bR[0]} tilt={e.bR[1]} flip />
      <path d="M -26 30 L 26 30 L 0 84 Z" fill={C.beak} stroke={INK} strokeWidth={OL * 0.9} strokeLinejoin="round" />
      <path d="M 0 30 L 0 84 L 26 30 Z" fill={C.beakShade} opacity={0.55} />
      <path d="M -26 30 L 26 30 L 0 84 Z" fill="none" stroke={INK} strokeWidth={OL * 0.9} strokeLinejoin="round" />
    </g>
  );
};

const WPHeadFrontXray: React.FC<{brain: BrainProps}> = ({brain}) => (
  <g>
    <circle r={R} fill={C.xray} />
    <circle r={R - 18} fill="none" stroke={C.xrayLine} strokeWidth={6} strokeDasharray="14 12" />
    <g transform="translate(0 -14) scale(0.86)">
      <Brain {...brain} />
    </g>
    <circle r={R} fill="none" stroke={INK} strokeWidth={OL} />
    <path d="M -26 30 L 26 30 L 0 84 Z" fill={'#B9D2E6'} stroke={INK} strokeWidth={OL * 0.9} strokeLinejoin="round" opacity={0.95} />
  </g>
);

/** scan wipe between normal head (below the line) and x-ray head (above it) */
const ScanWipe: React.FC<{id: string; p: number; r: number; normal: React.ReactNode; xray: React.ReactNode}> = ({id, p, r, normal, xray}) => {
  if (p <= 0.001) return <>{normal}</>;
  if (p >= 0.999) return <>{xray}</>;
  const y = lerp(-r - 30, r + 40, p);
  return (
    <g>
      <defs>
        <clipPath id={`scanA-${id}`}>
          <rect x={-400} y={y} width={800} height={800} />
        </clipPath>
        <clipPath id={`scanB-${id}`}>
          <rect x={-400} y={-800 + y} width={800} height={800} />
        </clipPath>
      </defs>
      <g clipPath={`url(#scanA-${id})`}>{normal}</g>
      <g clipPath={`url(#scanB-${id})`}>{xray}</g>
      <rect x={-r - 34} y={y - 7} width={2 * r + 68} height={14} rx={7} fill="#7FE3FF" stroke={INK} strokeWidth={4} />
      <rect x={-r - 26} y={y - 2} width={2 * r + 52} height={4} rx={2} fill="#FFFFFF" />
    </g>
  );
};

const WPHeadSide: React.FC<{id: string; blink: number}> = ({id, blink}) => (
  <g>
    <Crest side />
    <circle r={R} fill={C.white} />
    <path d={`M ${-R + 4} 14 A ${R - 4} ${R - 4} 0 0 0 ${10} ${R - 4} Q -84 70 ${-R + 4} 14 Z`} fill={C.whiteShade} />
    <circle r={R} fill="none" stroke={INK} strokeWidth={OL} />
    <path d="M 104 40 Q 40 76 -56 54" stroke={INK} strokeWidth={17} strokeLinecap="round" fill="none" />
    <Eye id={`${id}-s`} x={36} y={-22} r={34} look={[0.75, 0.05]} lid={blink} />
    <Brow x={30} y={-76} w={54} dy={0} tilt={-4} />
    <path d="M 98 -14 L 232 16 L 98 46 Z" fill={C.beak} stroke={INK} strokeWidth={OL * 0.9} strokeLinejoin="round" />
    <path d="M 98 16 L 232 16 L 98 46 Z" fill={C.beakShade} opacity={0.55} />
    <path d="M 98 -14 L 232 16 L 98 46 Z" fill="none" stroke={INK} strokeWidth={OL * 0.9} strokeLinejoin="round" />
  </g>
);

export const WPHelmet: React.FC = () => (
  <g>
    <path
      d="M -136 22 C -146 -112 -70 -170 0 -170 C 70 -170 146 -112 136 22 L 100 26 C 98 -20 88 -66 58 -80 C 30 -90 -30 -90 -58 -80 C -88 -66 -98 -20 -100 26 Z"
      fill={C.helmet}
      stroke={INK}
      strokeWidth={OL}
      strokeLinejoin="round"
    />
    <path d="M -100 -96 C -84 -136 -44 -154 0 -156" stroke={'#F2606F'} strokeWidth={14} fill="none" strokeLinecap="round" />
    <path d="M -17 -169 L 17 -169 L 15 -88 L -15 -88 Z" fill={C.white} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <circle cx={-118} cy={-10} r={12} fill={C.mask} stroke={INK} strokeWidth={6} />
    <circle cx={118} cy={-10} r={12} fill={C.mask} stroke={INK} strokeWidth={6} />
    <g fill="none" strokeLinecap="round">
      <path d="M -112 18 Q -104 104 0 112 Q 104 104 112 18" stroke={INK} strokeWidth={22} />
      <path d="M -96 62 L 96 62" stroke={INK} strokeWidth={20} />
      <path d="M -112 18 Q -104 104 0 112 Q 104 104 112 18" stroke={C.mask} strokeWidth={10} />
      <path d="M -96 62 L 96 62" stroke={C.mask} strokeWidth={9} />
    </g>
  </g>
);

export type WoodpeckerProps = {
  id: string;
  head: 'side' | 'front';
  expr?: WPExpr;
  look?: [number, number];
  blink?: number;
  peck?: number; // beak displacement along x (side head)
  headRot?: number;
  headDX?: number;
  headDY?: number;
  squash?: [number, number]; // body scale about the feet
  wing?: 'rest' | 'shrug';
  xray?: number; // 0..1 scan progress
  brain?: BrainProps;
  helmet?: {y: number; rot: number; x?: number} | null;
  headScaleX?: number;
};

const Foot: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g transform={`translate(${x} ${y})`} fill="none" strokeLinecap="round" strokeLinejoin="round">
    <g stroke={INK} strokeWidth={22}>
      <path d="M -30 -6 L 0 0 L 40 -16" />
      <path d="M 0 0 L 46 4" />
      <path d="M 0 0 L 36 22" />
    </g>
    <g stroke={C.feet} strokeWidth={11}>
      <path d="M -30 -6 L 0 0 L 40 -16" />
      <path d="M 0 0 L 46 4" />
      <path d="M 0 0 L 36 22" />
    </g>
  </g>
);

const WingRest: React.FC = () => (
  <g>
    <path
      d="M -150 -350 C -246 -306 -256 -140 -176 -30 C -142 -64 -112 -150 -112 -252 C -114 -306 -128 -340 -150 -350 Z"
      fill={C.black}
      stroke={INK}
      strokeWidth={OL}
      strokeLinejoin="round"
    />
    <g fill={C.white}>
      {[
        [-190, -250],
        [-160, -214],
        [-200, -186],
        [-168, -150],
        [-196, -112],
        [-160, -96],
      ].map(([x, y], i) => (
        <ellipse key={i} cx={x} cy={y} rx={10} ry={7.5} transform={`rotate(-20 ${x} ${y})`} />
      ))}
    </g>
  </g>
);

const WingShrug: React.FC = () => (
  <g>
    <path
      d="M -132 -330 C -196 -360 -262 -420 -300 -500 L -268 -492 L -290 -540 L -252 -514 L -262 -560 L -226 -520 C -206 -470 -164 -410 -96 -300 Z"
      fill={C.black}
      stroke={INK}
      strokeWidth={OL}
      strokeLinejoin="round"
    />
    <g fill={C.white}>
      {[
        [-232, -456],
        [-200, -420],
        [-170, -380],
        [-210, -396],
      ].map(([x, y], i) => (
        <ellipse key={i} cx={x} cy={y} rx={9} ry={7} transform={`rotate(-40 ${x} ${y})`} />
      ))}
    </g>
  </g>
);

export const Woodpecker: React.FC<WoodpeckerProps> = ({
  id,
  head,
  expr = 'neutral',
  look,
  blink = 0,
  peck = 0,
  headRot = 0,
  headDX = 0,
  headDY = 0,
  squash = [1, 1],
  wing = 'rest',
  xray = 0,
  brain,
  helmet = null,
  headScaleX = 1,
}) => {
  const hc = head === 'side' ? HEAD_SIDE : HEAD_FRONT;
  const hx = hc[0] + headDX + (head === 'side' ? peck : 0);
  const hy = hc[1] + headDY;
  const pr = head === 'side' ? peck * 0.11 : 0;
  return (
    <g transform={`scale(${squash[0]} ${squash[1]})`}>
      {/* tail */}
      <path d="M -64 -44 L 22 -54 L 72 158 L 40 196 L 6 166 Z" fill={C.black} stroke={INK} strokeWidth={OL} strokeLinejoin="round" />
      <defs>
        <clipPath id={`body-${id}`}>
          <ellipse cx={-100} cy={-206} rx={122} ry={192} transform="rotate(12 -100 -206)" />
        </clipPath>
      </defs>
      <ellipse cx={-100} cy={-206} rx={122} ry={192} transform="rotate(12 -100 -206)" fill={C.black} />
      <g clipPath={`url(#body-${id})`}>
        <ellipse cx={-34} cy={-196} rx={92} ry={206} transform="rotate(12 -34 -196)" fill={C.white} />
        <ellipse cx={16} cy={-176} rx={34} ry={190} transform="rotate(12 16 -176)" fill={C.whiteShade} />
        <path d="M -76 -52 Q -40 -14 4 -48 Q -30 -80 -76 -52 Z" fill={C.red} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      </g>
      <ellipse cx={-100} cy={-206} rx={122} ry={192} transform="rotate(12 -100 -206)" fill="none" stroke={INK} strokeWidth={OL} />
      <Foot x={16} y={-70} />
      <Foot x={24} y={-14} />
      {wing === 'rest' ? <WingRest /> : null}
      {wing === 'shrug' ? (
        <g transform="translate(-96 34) rotate(-10 -132 -330)">
          <WingShrug />
        </g>
      ) : null}
      {/* head */}
      <g transform={`rotate(${headRot + pr} ${NECK[0]} ${NECK[1]}) translate(${hx} ${hy}) scale(${headScaleX} 1)`}>
        {head === 'side' ? (
          <WPHeadSide id={id} blink={blink} />
        ) : (
          <g>
            <Crest />
            <ScanWipe
              id={id}
              p={xray}
              r={R}
              normal={<WPHeadFrontNormal id={id} expr={expr} blink={blink} lookOverride={look} />}
              xray={brain ? <WPHeadFrontXray brain={brain} /> : <WPHeadFrontNormal id={`${id}x`} expr={expr} blink={blink} />}
            />
          </g>
        )}
        {helmet && (
          <g transform={`translate(${helmet.x ?? 0} ${helmet.y}) rotate(${helmet.rot})`}>
            <WPHelmet />
          </g>
        )}
      </g>
    </g>
  );
};

/** beak tip of the side head at rest, in woodpecker-local coords */
export const BEAK_TIP: [number, number] = [HEAD_SIDE[0] + 232, HEAD_SIDE[1] + 16];

// =====================================================================
// red-winged blackbird (origin = feet on the branch, faces right)
// =====================================================================
export type BBExpr = 'neutral' | 'smug' | 'happy' | 'look';
const BB_HEAD: [number, number] = [32, -270];
const BB_R = 78;

const BBHeadNormal: React.FC<{id: string; expr: BBExpr; blink: number}> = ({id, expr, blink}) => {
  const lid = expr === 'smug' ? Math.max(0.46, blink) : blink;
  return (
    <g>
      <circle r={BB_R} fill={C.bird} stroke={INK} strokeWidth={OL} />
      <path d={`M ${-BB_R + 18} -30 Q -30 -64 6 -70`} stroke={'#3A3A42'} strokeWidth={10} fill="none" strokeLinecap="round" />
      {expr === 'happy' ? (
        <path d="M 6 -6 Q 24 -30 42 -6" stroke={C.white} strokeWidth={9} fill="none" strokeLinecap="round" />
      ) : (
        <Eye id={`${id}-bb`} x={24} y={-8} r={27} look={expr === 'look' ? [-0.6, -0.4] : [0.6, 0]} lid={lid} lidColor={'#3A3A42'} />
      )}
      <path d={`M -6 ${expr === 'smug' ? -48 : -52} Q 22 ${expr === 'smug' ? -66 : -60} 50 -46`} stroke={'#4A4A55'} strokeWidth={11} fill="none" strokeLinecap="round" />
      <path d="M 64 -12 L 128 8 L 64 28 Z" fill={C.birdBeak} stroke={INK} strokeWidth={OL * 0.85} strokeLinejoin="round" />
      <line x1={64} y1={8} x2={126} y2={8} stroke={INK} strokeWidth={4} />
    </g>
  );
};

const BBHeadXray: React.FC<{brain: BrainProps}> = ({brain}) => (
  <g>
    <circle r={BB_R} fill={C.xray} />
    <circle r={BB_R - 13} fill="none" stroke={C.xrayLine} strokeWidth={5} strokeDasharray="11 9" />
    <g transform="translate(-4 -6) scale(0.54)">
      <Brain {...brain} />
    </g>
    <circle r={BB_R} fill="none" stroke={INK} strokeWidth={OL} />
    <path d="M 64 -12 L 128 8 L 64 28 Z" fill={'#9FB3C4'} stroke={INK} strokeWidth={OL * 0.85} strokeLinejoin="round" />
  </g>
);

export type BlackbirdProps = {
  id: string;
  expr?: BBExpr;
  blink?: number;
  headRot?: number;
  squash?: [number, number];
  flying?: number; // wing phase, null when perched
  perched?: boolean;
  xray?: number;
  brain?: BrainProps;
};

export const Blackbird: React.FC<BlackbirdProps> = ({id, expr = 'neutral', blink = 0, headRot = 0, squash = [1, 1], flying, perched = true, xray = 0, brain}) => {
  const wingUp = flying !== undefined && Math.sin(flying) > 0;
  return (
    <g transform={`scale(${squash[0]} ${squash[1]})`}>
      {perched ? (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <g stroke={INK} strokeWidth={14}>
            <path d="M -10 -40 L -12 0 M -30 0 L 6 2 M -12 0 L -2 14" />
            <path d="M 26 -40 L 28 0 M 10 0 L 46 2 M 28 0 L 38 14" />
          </g>
          <g stroke={'#5C5F66'} strokeWidth={6}>
            <path d="M -10 -40 L -12 0 M -30 0 L 6 2 M -12 0 L -2 14" />
            <path d="M 26 -40 L 28 0 M 10 0 L 46 2 M 28 0 L 38 14" />
          </g>
        </g>
      ) : null}
      {flying !== undefined && !wingUp && (
        <path d="M -40 -150 C -120 -110 -190 -40 -220 40 C -160 10 -90 -40 -20 -100 Z" fill={C.bird} stroke={INK} strokeWidth={OL} strokeLinejoin="round" />
      )}
      <path d="M -60 -70 L -186 30 L -160 56 L -36 -20 Z" fill={C.bird} stroke={INK} strokeWidth={OL} strokeLinejoin="round" />
      <ellipse cx={-6} cy={-124} rx={94} ry={118} transform="rotate(-14 -6 -124)" fill={C.bird} stroke={INK} strokeWidth={OL} />
      <path d="M -70 -160 Q -20 -190 30 -150" stroke={'#3A3A42'} strokeWidth={10} fill="none" strokeLinecap="round" />
      <g transform="rotate(-22 -30 -140)">
        <ellipse cx={-30} cy={-126} rx={42} ry={18} fill={C.birdYellow} stroke={INK} strokeWidth={6} />
        <ellipse cx={-30} cy={-138} rx={40} ry={20} fill={C.birdShoulder} stroke={INK} strokeWidth={6} />
      </g>
      {flying !== undefined && wingUp && (
        <path d="M -30 -170 C -110 -240 -170 -330 -180 -420 C -110 -380 -50 -300 10 -200 Z" fill={C.bird} stroke={INK} strokeWidth={OL} strokeLinejoin="round" />
      )}
      <g transform={`rotate(${headRot} 14 -200) translate(${BB_HEAD[0]} ${BB_HEAD[1]})`}>
        <ScanWipe id={`bb-${id}`} p={xray} r={BB_R} normal={<BBHeadNormal id={id} expr={expr} blink={blink} />} xray={brain ? <BBHeadXray brain={brain} /> : <BBHeadNormal id={`${id}x`} expr={expr} blink={blink} />} />
      </g>
    </g>
  );
};
