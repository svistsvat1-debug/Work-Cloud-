import React from 'react';
import {AbsoluteFill} from 'remotion';
import {
  C,
  CamKey,
  INK,
  Layer,
  Limb,
  OL,
  P2,
  T,
  add,
  bentPath,
  blinkAt,
  camAt,
  clamp,
  easeInOut,
  easeOut,
  easeOutBack,
  lerp,
  popIn,
  popOut,
  prog,
  rand,
  rot,
  shakeXY,
  springStep,
  wobble,
} from './core';
import {Egyptian, Face, JAR_MOUTH, ManPose, Sparkle, SweatDrop} from './egypt';

// ============================================================ layout (main plane Z 1000)
const TABLE_Y = 1300;
const TANK = {x0: 150, x1: 1010, y0: 1120, y1: TABLE_Y};
const SAND_TOP = 1214;
const GAUGE: P2 = [400, 1046];
const SCI_HIP: P2 = [80, 1290];
const GAUGE_R = 118;

// ============================================================ timeline values
/** needle 0..1 (0.5 = straight up = half) */
const needle = (t: number) => {
  let g = 0;
  const strain = easeOutBack(prog(t, T.tested, T.tested + 0.45), 1.4) * 0.95;
  g = strain;
  if (t > T.tested + 0.45) g += 0.015 * Math.sin(t * 47) + 0.01 * Math.sin(t * 29);
  if (t > T.cut) {
    const u = prog(t, T.cut, T.half - 0.05);
    g = lerp(g, 0.5, easeOutBack(u, 1.6));
  }
  if (t > T.worse - 0.06) {
    const u = prog(t, T.worse - 0.06, T.worse + 0.3);
    g = lerp(0.5, 1.04, easeOutBack(u, 2.0)) + (u >= 1 ? 0.02 * Math.sin(t * 53) : 0);
  }
  return g;
};
const sledX = (t: number) => {
  let x = 840;
  x -= 34 * easeInOut(prog(t, T.tested + 0.1, T.water2));
  x -= 110 * easeInOut(prog(t, T.cut + 0.2, T.not));
  x -= 10 * easeOut(prog(t, T.too + 0.3, T.worse + 0.4));
  return x;
};
const flood = (t: number) => easeOut(prog(t, T.too + 0.12, T.makes + 0.1));
const wetSmall = (t: number) => easeOut(prog(t, T.water2 + 0.15, T.cut + 0.3));

// ============================================================ back wall (Z 1900)
const BackWall: React.FC<{t: number}> = ({t}) => {
  const flasks: [number, number, string, number][] = [
    [-300, 0, C.flaskBlue, 1],
    [-60, 0, C.flaskGreen, 0.8],
    [180, 0, C.flaskPink, 1.1],
    [1320, 0, C.flaskBlue, 0.9],
    [1560, 0, C.flaskGreen, 1.2],
  ];
  return (
    <g>
      <rect x={-3000} y={-3000} width={7000} height={7000} fill={C.labWall} />
      {/* tiles on the lower wall */}
      <rect x={-3000} y={1250} width={7000} height={3000} fill={C.labWallShade} />
      {Array.from({length: 60}).map((_, i) => (
        <line key={`v${i}`} x1={-3000 + i * 120} x2={-3000 + i * 120} y1={1250} y2={4000} stroke={C.labTile} strokeWidth={6} />
      ))}
      {Array.from({length: 20}).map((_, i) => (
        <line key={`h${i}`} x1={-3000} x2={4000} y1={1250 + i * 120} y2={1250 + i * 120} stroke={C.labTile} strokeWidth={6} />
      ))}
      <line x1={-3000} x2={4000} y1={1250} y2={1250} stroke={INK} strokeWidth={OL} />
      {/* shelf with flasks */}
      <g transform="translate(0,300)">
        <rect x={-500} y={0} width={2300} height={36} fill={C.shelf} stroke={INK} strokeWidth={OL} />
        <rect x={-500} y={22} width={2300} height={14} fill={C.shelfShade} />
        {flasks.map(([x, , col, s], i) => (
          <g key={i} transform={`translate(${x},0) scale(${s})`}>
            <path d="M-30,-200 L30,-200 L30,-120 L100,-10 Q104,0 92,0 L-92,0 Q-104,0 -100,-10 L-30,-120 Z" fill={C.glass} stroke={INK} strokeWidth={OL} strokeLinejoin="round" />
            <path d="M-62,-62 L62,-62 L94,-10 Q96,-4 88,-4 L-88,-4 Q-96,-4 -94,-10 Z" fill={col} />
            <circle cx={-20 + 10 * Math.sin(t * 3 + i)} cy={-40 - ((t * 60 + i * 40) % 30)} r={7} fill="#fff" opacity={0.7} />
            <rect x={-38} y={-220} width={76} height={22} rx={6} fill={C.metalLight} stroke={INK} strokeWidth={6} />
          </g>
        ))}
      </g>
      {/* clock */}
      <g transform="translate(880,-160)">
        <circle r={150} fill="#fff" stroke={INK} strokeWidth={OL + 4} />
        <circle r={124} fill="none" stroke={C.labTile} strokeWidth={6} />
        {Array.from({length: 12}).map((_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return <line key={i} x1={Math.sin(a) * 104} y1={-Math.cos(a) * 104} x2={Math.sin(a) * 124} y2={-Math.cos(a) * 124} stroke={INK} strokeWidth={8} />;
        })}
        <line x1={0} y1={0} x2={0} y2={-80} stroke={INK} strokeWidth={12} strokeLinecap="round" transform={`rotate(${t * 6})`} />
        <line x1={0} y1={0} x2={56} y2={0} stroke={INK} strokeWidth={14} strokeLinecap="round" transform="rotate(-50)" />
        <circle r={12} fill={INK} />
      </g>
    </g>
  );
};

// ============================================================ table, tank, sand, sled
const Table: React.FC = () => (
  <g>
    <rect x={-600} y={TABLE_Y} width={2300} height={44} fill={C.tableTop} stroke={INK} strokeWidth={OL} />
    <rect x={-600} y={TABLE_Y + 44} width={2300} height={260} fill={C.table} stroke={INK} strokeWidth={OL} />
    <rect x={-600} y={TABLE_Y + 44} width={2300} height={30} fill={C.tableShade} />
    {[-200, 340, 880, 1420].map((x) => (
      <rect key={x} x={x} y={TABLE_Y + 120} width={300} height={140} rx={14} fill={C.tableShade} stroke={INK} strokeWidth={6} />
    ))}
    {[-200, 340, 880, 1420].map((x) => (
      <circle key={`k${x}`} cx={x + 150} cy={TABLE_Y + 190} r={16} fill={C.metalLight} stroke={INK} strokeWidth={6} />
    ))}
    <rect x={-600} y={TABLE_Y + 304} width={2300} height={2000} fill={C.tableShade} stroke={INK} strokeWidth={OL} />
  </g>
);

const ToySled: React.FC<{x: number; sink: number; tilt: number; nervous: number}> = ({x, sink, tilt, nervous}) => (
  <g transform={`translate(${x},${SAND_TOP + sink}) rotate(${tilt})`}>
    {/* runner */}
    <path d="M-70,0 L76,0 L76,-14 L-58,-14 C-70,-14 -80,-22 -78,-34 C-86,-26 -88,-6 -70,0 Z" fill={C.wood} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <rect x={-60} y={-26} width={136} height={14} fill={C.woodLight} stroke={INK} strokeWidth={6} />
    {/* mini statue */}
    <g transform="translate(14,-26) scale(0.24)">
      <rect x={-120} y={-120} width={260} height={120} fill={C.stone} stroke={INK} strokeWidth={22} />
      <rect x={10} y={-380} width={130} height={270} fill={C.stone} stroke={INK} strokeWidth={22} />
      <rect x={-120} y={-260} width={150} height={150} fill={C.stone} stroke={INK} strokeWidth={22} />
      <path d="M-40,-260 L-40,-480 Q-20,-560 60,-560 Q140,-560 140,-480 L140,-370 L-40,-370" fill={C.stone} stroke={INK} strokeWidth={22} />
      <path d="M20,-560 Q120,-570 150,-480 L160,-330 L100,-330 L96,-460 Q60,-500 20,-500 Z" fill={C.stoneWig} stroke={INK} strokeWidth={18} />
      <ellipse cx={0} cy={-470} rx={22} ry={nervous > 0.5 ? 30 : 20} fill="#fff" stroke={INK} strokeWidth={12} />
      <circle cx={-6} cy={-466} r={10} fill={INK} />
      {nervous > 0.5 && <path d="M-50,-560 Q-60,-520 -46,-510" fill="none" stroke={C.sweat} strokeWidth={20} strokeLinecap="round" />}
    </g>
  </g>
);

const tankParts = ({t, wet, fl, sx}: {t: number; wet: number; fl: number; sx: number}): {back: React.ReactNode; front: React.ReactNode} => {
  const {x0, x1, y0, y1} = TANK;
  const water = SAND_TOP - 70 * fl;
  const sandCol = fl > 0.02 ? C.mud : C.sand;
  const dots: React.ReactNode[] = [];
  for (let i = 0; i < 70; i++) {
    dots.push(<circle key={i} cx={x0 + 20 + rand(i * 5.3) * (x1 - x0 - 40)} cy={SAND_TOP + 14 + rand(i * 2.1) * (y1 - SAND_TOP - 24)} r={4 + rand(i) * 3} fill={fl > 0.02 ? C.mudDark : C.sandDot} opacity={0.6} />);
  }
  return {
    back: (
      <g>
        <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={C.glass} opacity={0.55} />
        <rect x={x0} y={SAND_TOP} width={x1 - x0} height={y1 - SAND_TOP} fill={sandCol} />
        {dots}
        {/* small wet patch in front of the sled */}
        {wet > 0.01 && fl < 0.02 && <path d={`M${600 - 80 * wet},${SAND_TOP} Q610,${SAND_TOP + 50 * wet} ${640 + 50 * wet},${SAND_TOP} Z`} fill={C.sandWet} />}
        <line x1={x0} x2={x1} y1={SAND_TOP} y2={SAND_TOP} stroke={INK} strokeWidth={5} />
      </g>
    ),
    front: (
      <g>
        {fl > 0.01 && (
          <g>
            <rect x={x0} y={water} width={x1 - x0} height={y1 - water} fill={C.water} opacity={0.55} />
            <path d={`M${x0},${water} ${Array.from({length: 18}).map((_, i) => `Q${x0 + (i + 0.5) * ((x1 - x0) / 18)},${water + 8 * Math.sin(t * 9 + i)} ${x0 + (i + 1) * ((x1 - x0) / 18)},${water}`).join(' ')}`} fill="none" stroke={INK} strokeWidth={5} />
            {[0, 1, 2, 3].map((i) => {
              const ph = (t * 1.4 + i * 0.27) % 1;
              return <circle key={i} cx={sx - 120 + i * 70} cy={water + 40 - ph * 40} r={8 * (1 - ph) + 3} fill="none" stroke="#fff" strokeWidth={4} opacity={0.8} />;
            })}
          </g>
        )}
        {/* glass walls */}
        <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill="none" stroke={INK} strokeWidth={OL} />
        <path d={`M${x0 + 30},${y0 + 24} L${x0 + 30},${y1 - 20} M${x1 - 40},${y0 + 24} L${x1 - 40},${y0 + 70}`} stroke="#fff" strokeWidth={10} strokeLinecap="round" opacity={0.85} />
        <rect x={x0 - 6} y={y0 - 12} width={x1 - x0 + 12} height={16} rx={6} fill={C.metalLight} stroke={INK} strokeWidth={6} />
      </g>
    ),
  };
};

// ============================================================ force gauge
const Gauge: React.FC<{g: number}> = ({g}) => {
  const R = GAUGE_R;
  const arc = (a0: number, a1: number, r: number) => {
    const p = (a: number) => [Math.sin((a * Math.PI) / 180) * r, -Math.cos((a * Math.PI) / 180) * r];
    const [ax, ay] = p(a0);
    const [bx, by] = p(a1);
    return `M${ax},${ay} A${r},${r} 0 0 1 ${bx},${by}`;
  };
  const ang = (v: number) => -120 + 240 * v;
  return (
    <g transform={`translate(${GAUGE[0]},${GAUGE[1]})`}>
      {/* handle on the left, hook on the right */}
      <path d={`M${-R - 4},0 L${-R - 60},0`} stroke={INK} strokeWidth={34} strokeLinecap="round" />
      <path d={`M${-R - 4},0 L${-R - 60},0`} stroke={C.metal} strokeWidth={18} strokeLinecap="round" />
      <path d={`M${R + 4},0 L${R + 40},0 Q${R + 66},0 ${R + 66},26 Q${R + 66},50 ${R + 44},50`} fill="none" stroke={INK} strokeWidth={22} strokeLinecap="round" />
      <path d={`M${R + 4},0 L${R + 40},0 Q${R + 66},0 ${R + 66},26 Q${R + 66},50 ${R + 44},50`} fill="none" stroke={C.metal} strokeWidth={9} strokeLinecap="round" />
      <circle r={R + 16} fill={C.gaugeRim} stroke={INK} strokeWidth={OL} />
      <circle r={R} fill={C.gaugeFace} stroke={INK} strokeWidth={5} />
      <path d={arc(ang(0), ang(0.6), R - 22)} fill="none" stroke={C.green} strokeWidth={22} />
      <path d={arc(ang(0.6), ang(0.8), R - 22)} fill="none" stroke={C.yellow} strokeWidth={22} />
      <path d={arc(ang(0.8), ang(1), R - 22)} fill="none" stroke={C.red} strokeWidth={22} />
      {Array.from({length: 11}).map((_, i) => {
        const a = (ang(i / 10) * Math.PI) / 180;
        const big = i === 5;
        const r0 = big ? R - 50 : R - 36;
        return <line key={i} x1={Math.sin(a) * r0} y1={-Math.cos(a) * r0} x2={Math.sin(a) * (R - 8)} y2={-Math.cos(a) * (R - 8)} stroke={INK} strokeWidth={big ? 8 : 5} strokeLinecap="round" />;
      })}
      {/* "1/2" mark */}
      <g transform="translate(0,-36)">
        <line x1={-12} y1={12} x2={12} y2={-12} stroke={INK} strokeWidth={5} strokeLinecap="round" />
        <circle cx={-12} cy={-10} r={5} fill={INK} />
        <circle cx={12} cy={10} r={5} fill={INK} />
      </g>
      {/* needle */}
      <g transform={`rotate(${ang(g)})`}>
        <path d={`M-9,14 L0,${-(R - 18)} L9,14 Z`} fill={C.red} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      </g>
      <circle r={16} fill={C.gaugeRim} stroke={INK} strokeWidth={5} />
      <path d={`M${-R * 0.6},${-R * 0.55} A${R * 0.85},${R * 0.85} 0 0 1 ${-R * 0.1},${-R * 0.82}`} fill="none" stroke="#fff" strokeWidth={10} strokeLinecap="round" opacity={0.7} />
    </g>
  );
};

// ============================================================ scientist (round white head, glasses, lab coat)
type SciExpr = 'neutral' | 'strain' | 'easy' | 'wag' | 'shock';
const Scientist: React.FC<{lean: number; handA: P2; handB: P2; expr: SciExpr; blink: number; wagAngle: number; squash: number}> = ({lean, handA, handB, expr, blink, wagAngle, squash}) => {
  const hip: P2 = SCI_HIP;
  const shL = add(hip, rot([-62, -270], lean));
  const shR = add(hip, rot([60, -272], lean));
  const headC = add(hip, rot([4, -390], lean));
  const eyeY = -8;
  const eye = (cx: number) => {
    if (expr === 'strain')
      return <path d={`M${cx - 12},${eyeY - 10} L${cx + 8},${eyeY} L${cx - 12},${eyeY + 10}`} fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" transform={cx > 30 ? `translate(${2 * cx},0) scale(-1,1)` : undefined} />;
    if (expr === 'wag') return <path d={`M${cx - 12},${eyeY + 2} Q${cx},${eyeY - 8} ${cx + 12},${eyeY + 2}`} fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />;
    const ry = (expr === 'shock' || expr === 'easy' ? 15 : 12) * Math.max(0.1, 1 - blink);
    return <ellipse cx={cx} cy={eyeY} rx={expr === 'shock' ? 11 : 9} ry={ry} fill={INK} />;
  };
  const brows: Record<SciExpr, string> = {
    neutral: 'M-6,-52 Q14,-60 34,-52 M50,-52 Q70,-60 90,-52',
    strain: 'M-4,-58 L32,-44 M52,-44 L88,-58',
    easy: 'M-6,-62 Q14,-74 34,-62 M50,-62 Q70,-74 90,-62',
    wag: 'M-6,-50 Q14,-56 34,-50 M50,-56 Q70,-66 90,-58',
    shock: 'M-6,-66 Q14,-80 34,-66 M50,-66 Q70,-80 90,-66',
  };
  const mouth: Record<SciExpr, React.ReactNode> = {
    neutral: <path d="M24,44 Q42,54 60,44" fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />,
    strain: (
      <g>
        <rect x={10} y={30} width={64} height={30} rx={8} fill="#fff" stroke={INK} strokeWidth={7} />
        <line x1={10} y1={45} x2={74} y2={45} stroke={INK} strokeWidth={4} />
        <line x1={31} y1={30} x2={31} y2={60} stroke={INK} strokeWidth={4} />
        <line x1={53} y1={30} x2={53} y2={60} stroke={INK} strokeWidth={4} />
      </g>
    ),
    easy: <path d="M16,36 Q42,70 68,36 Z" fill={INK} stroke={INK} strokeWidth={6} strokeLinejoin="round" />,
    wag: <path d="M22,46 Q44,52 64,38" fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />,
    shock: <ellipse cx={42} cy={50} rx={18} ry={24} fill={INK} />,
  };
  return (
    <g>
      {/* back arm */}
      <Limb d={bentPath(shL, handA, 30)} w={50} fill={C.coatShade} />
      <circle cx={handA[0]} cy={handA[1]} r={26} fill={C.head} stroke={INK} strokeWidth={OL} />
      {/* body (lab coat) */}
      <g transform={`translate(${hip[0]},${hip[1]}) rotate(${lean}) scale(${2 - squash},${squash})`}>
        <path d="M-96,20 L-84,-230 Q-80,-286 -20,-292 L30,-292 Q86,-286 90,-230 L100,20 Z" fill={C.coat} stroke={INK} strokeWidth={OL} strokeLinejoin="round" />
        <path d="M60,-270 Q86,-250 88,-210 L98,20 L70,20 Z" fill={C.coatShade} />
        <path d="M-24,-290 L4,-160 L30,-290 Z" fill={C.shirt} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <path d="M0,-270 L-12,-200 L4,-170 L18,-200 Z" fill={C.tie} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        <path d="M-24,-290 L-2,-150 L-52,-210 Z M30,-290 L8,-150 L60,-214 Z" fill={C.coat} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        <rect x={34} y={-150} width={44} height={50} rx={6} fill={C.coat} stroke={INK} strokeWidth={5} />
        <rect x={44} y={-170} width={8} height={30} rx={3} fill={C.red} stroke={INK} strokeWidth={3} />
      </g>
      {/* head */}
      <g transform={`translate(${headC[0]},${headC[1]}) rotate(${lean * 0.5})`}>
        <circle r={104} fill={C.head} stroke={INK} strokeWidth={OL + 1} />
        <path d="M70,-70 Q104,-20 92,44 Q70,90 20,100 Q80,60 80,0 Q80,-40 70,-70 Z" fill={C.headShade} />
        {eye(22)}
        {eye(66)}
        <circle cx={22} cy={eyeY} r={30} fill="none" stroke={INK} strokeWidth={7} />
        <circle cx={68} cy={eyeY} r={30} fill="none" stroke={INK} strokeWidth={7} />
        <path d="M52,-10 Q45,-18 38,-10" fill="none" stroke={INK} strokeWidth={6} />
        <path d="M-8,-10 L-60,-24" stroke={INK} strokeWidth={6} />
        <path d={brows[expr]} fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" />
        {mouth[expr]}
        {expr === 'strain' && (
          <>
            <ellipse cx={-8} cy={32} rx={16} ry={9} fill={C.blush} opacity={0.85} />
            <ellipse cx={92} cy={32} rx={12} ry={8} fill={C.blush} opacity={0.85} />
          </>
        )}
      </g>
      {/* front arm (+ wagging finger) */}
      {expr === 'wag' ? (
        <g>
          <Limb d={bentPath(shR, [shR[0] + 40, shR[1] - 50], -20)} w={50} fill={C.coat} />
          <g transform={`translate(${shR[0] + 40},${shR[1] - 50}) rotate(${wagAngle})`}>
            <circle r={26} fill={C.head} stroke={INK} strokeWidth={OL} />
            <Limb d="M4,-18 L6,-66" w={14} fill={C.head} ol={6} />
          </g>
        </g>
      ) : (
        <>
          <Limb d={bentPath(shR, handB, -24)} w={50} fill={C.coat} />
          <circle cx={handB[0]} cy={handB[1]} r={26} fill={C.head} stroke={INK} strokeWidth={OL} />
        </>
      )}
    </g>
  );
};

// ============================================================ thought bubble (screen space)
const ThoughtBubble: React.FC<{t: number; s: number; x: number; from: P2}> = ({t, s, x, from}) => {
  if (s <= 0.01) return null;
  const cx = 600;
  const cy = 470;
  const puffs: [number, number, number][] = [
    [-260, 10, 130],
    [-150, -110, 140],
    [10, -140, 150],
    [170, -110, 140],
    [280, 0, 130],
    [180, 110, 140],
    [0, 140, 150],
    [-170, 110, 140],
    [0, 0, 220],
  ];
  const trail: [number, number, number][] = [
    [from[0] + (cx - 120 - from[0]) * 0.25, from[1] + (cy + 200 - from[1]) * 0.25, 22],
    [from[0] + (cx - 120 - from[0]) * 0.55, from[1] + (cy + 200 - from[1]) * 0.55, 32],
  ];
  // inside: ice rink with the sled skating
  const sx = lerp(-230, 210, easeInOut(prog(t, T.because, T.xStamp + 0.1)));
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
      <defs>
        <clipPath id="bubbleClip">
          {puffs.map(([px, py, r], i) => (
            <circle key={i} cx={px} cy={py} r={r - 6} />
          ))}
        </clipPath>
      </defs>
      {trail.map(([x0, y0, r], i) => (
        <circle key={`t${i}`} cx={x0} cy={y0} r={r * Math.min(1, s * 1.5)} fill={C.bubble} stroke={INK} strokeWidth={OL} />
      ))}
      <g transform={`translate(${cx},${cy}) scale(${s})`}>
        {puffs.map(([px, py, r], i) => (
          <circle key={`i${i}`} cx={px} cy={py} r={r + OL / 2} fill={INK} />
        ))}
        {puffs.map(([px, py, r], i) => (
          <circle key={`f${i}`} cx={px} cy={py} r={r - OL / 2} fill={C.bubble} />
        ))}
        <g clipPath="url(#bubbleClip)">
          <ellipse cx={0} cy={60} rx={330} ry={120} fill={C.ice} stroke={INK} strokeWidth={6} />
          <path d="M-220,40 L-120,40 M-60,90 L80,90 M120,30 L240,30" stroke="#fff" strokeWidth={12} strokeLinecap="round" />
          <g transform={`translate(${sx},${40}) rotate(${-8 + 8 * Math.sin(t * 12)}) scale(1.6)`}>
            <path d="M-70,0 L76,0 L76,-14 L-58,-14 C-70,-14 -80,-22 -78,-34 C-86,-26 -88,-6 -70,0 Z" fill={C.wood} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
            <rect x={-60} y={-26} width={136} height={14} fill={C.woodLight} stroke={INK} strokeWidth={6} />
            <rect x={-10} y={-90} width={60} height={64} rx={8} fill={C.stone} stroke={INK} strokeWidth={6} />
          </g>
          {[0, 1, 2].map((i) => (
            <path key={i} d={`M${sx - 150 - i * 30},${10 + i * 22} L${sx - 230 - i * 30},${10 + i * 22}`} stroke={C.iceShade} strokeWidth={10} strokeLinecap="round" />
          ))}
          <Sparkle x={sx + 120} y={-40} s={0.6 + 0.2 * Math.sin(t * 20)} rot={t * 90} color="#fff" />
          <Sparkle x={-150} y={-60} s={0.5} rot={20} color="#fff" />
        </g>
        {x > 0.01 && (
          <g transform={`scale(${x}) rotate(-6)`}>
            <path d="M-170,-150 L170,150 M170,-150 L-170,150" stroke={INK} strokeWidth={84} strokeLinecap="round" />
            <path d="M-170,-150 L170,150 M170,-150 L-170,150" stroke={C.red} strokeWidth={56} strokeLinecap="round" />
          </g>
        )}
      </g>
    </svg>
  );
};

// ============================================================ the Egyptian visiting the lab
const VISIT_IDLE: ManPose = {
  hip: [0, -100],
  lean: 0,
  footF: [-24, 0],
  footB: [16, 0],
  handF: [-66, -152],
  handB: [-10, -150],
  bendF: -16,
  bendB: -14,
  jar: {at: [-38, -150], angle: 0},
  face: {},
  kilt: 'long',
};
const VISIT_POUR: ManPose = {...VISIT_IDLE, lean: -10, handF: [-98, -168], handB: [-58, -128], bendF: -10, bendB: -16, jar: {at: [-76, -150], angle: -112}};
const VISIT_DUMP: ManPose = {...VISIT_IDLE, lean: -22, handF: [-110, -196], handB: [-76, -140], bendF: -6, bendB: -16, jar: {at: [-96, -170], angle: -168}};
const VSCALE = 2.0;
const visitorFeet = (t: number): P2 => {
  const enter = easeOutBack(prog(t, T.water2 - 0.42, T.water2 - 0.08), 1.3);
  return [885, lerp(1950, 1400, enter)];
};
const lerpP = (a: P2, b: P2, u: number): P2 => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
const blendPose = (a: ManPose, b: ManPose, u: number): ManPose => ({
  ...b,
  lean: lerp(a.lean, b.lean, u),
  handF: lerpP(a.handF, b.handF, u),
  handB: lerpP(a.handB, b.handB, u),
  bendF: lerp(a.bendF ?? -12, b.bendF ?? -12, u),
  bendB: lerp(a.bendB ?? -10, b.bendB ?? -10, u),
  jar: {at: lerpP(a.jar!.at, b.jar!.at, u), angle: lerp(a.jar!.angle, b.jar!.angle, u)},
});
const visitorPose = (t: number): ManPose => {
  let p = VISIT_IDLE;
  const pourIn = easeOutBack(prog(t, T.water2 - 0.04, T.water2 + 0.2), 1.2);
  const pourOut = easeInOut(prog(t, T.cut + 0.45, T.cut + 0.75));
  p = blendPose(VISIT_IDLE, VISIT_POUR, pourIn * (1 - pourOut));
  if (t > T.too - 0.15) p = blendPose(p, VISIT_DUMP, easeOutBack(prog(t, T.too - 0.15, T.too + 0.12), 1.3) * (1 - easeInOut(prog(t, T.makes + 0.15, T.worse))));
  let face: Face = {blink: blinkAt(t, [14.6, 16.9, 18.9]), look: [-1, 0.6]};
  if (t > T.water2 - 0.05 && t < T.cut + 0.5) face = {...face, mouth: 'smile'};
  else if (t >= T.cut + 0.5 && t < T.too - 0.15) face = {...face, mouth: 'grin', brow: 'up'};
  else if (t >= T.too - 0.15 && t < T.makes + 0.1) face = {...face, mouth: 'grin', eyes: 'squint', brow: 'effort'};
  else if (t >= T.makes + 0.1) face = {...face, mouth: 'o', brow: 'up', look: [-1, 1]};
  return {...p, face};
};
const visitorMouth = (t: number): P2 => {
  const p = visitorPose(t);
  const f = visitorFeet(t);
  const local = add(p.jar!.at, rot(JAR_MOUTH, p.jar!.angle));
  return [f[0] + local[0] * VSCALE, f[1] + local[1] * VSCALE];
};

// ============================================================ camera
const camB = (t: number) =>
  camAt(
    [
      {t: T.cutLab, x: 470, y: 990, z: 40, ease: (u: number) => u},
      {t: T.physicists, x: 450, y: 1000, z: 80},
      {t: T.tested + 0.5, x: 400, y: 1030, z: 60},
      {t: T.water2 - 0.45, x: 400, y: 1030, z: 60},
      {t: T.water2 + 0.15, x: 455, y: 1020, z: 50},
      {t: T.cut + 0.3, x: 455, y: 1020, z: 50},
      {t: T.half - 0.1, x: 360, y: 1040, z: 380},
      {t: T.not - 0.1, x: 360, y: 1040, z: 380},
      {t: T.because + 0.3, x: 480, y: 880, z: 60},
      {t: T.xStamp + 0.25, x: 480, y: 880, z: 60},
      {t: T.too + 0.1, x: 470, y: 1000, z: 60},
      {t: T.makes, x: 470, y: 1000, z: 60},
      {t: T.worse + 0.25, x: 330, y: 1045, z: 200},
    ] as CamKey[],
    t,
  );

// ============================================================ the lab shot
export const LabShot: React.FC<{t: number}> = ({t}) => {
  const cam = camB(t);
  const g = needle(t);
  const sx = sledX(t);
  const fl = flood(t);
  const appear = 1;
  const hop = -34 * Math.max(0, Math.sin(Math.PI * clamp((t - T.physicists + 0.04) / 0.32)));
  // scientist pose
  const straining = (t > T.tested && t < T.cut + 0.3) || (t > T.worse - 0.05);
  let expr: SciExpr = 'neutral';
  if (t > T.tested && t < T.cut + 0.3) expr = 'strain';
  else if (t >= T.cut + 0.3 && t < T.not - 0.04) expr = 'easy';
  else if (t >= T.not - 0.04 && t < T.too + 0.05) expr = 'wag';
  else if (t >= T.too + 0.05 && t < T.worse - 0.05) expr = 'shock';
  else if (t >= T.worse - 0.05) expr = 'strain';
  const lean = (straining ? -9 + 1.5 * Math.sin(t * 31) : expr === 'easy' ? -3 : expr === 'shock' ? 4 : 0) + 0.8 * Math.sin(2 * Math.PI * 0.5 * t);
  const pullDX = straining ? -10 : 0;
  const handle: P2 = [GAUGE[0] - GAUGE_R - 70 + pullDX, GAUGE[1]];
  const handA: P2 = [handle[0] - 8, handle[1] - 6];
  const handB: P2 = [handle[0] + 26, handle[1] + 8];
  const swaps = [T.tested, T.cut + 0.3, T.not - 0.04, T.too + 0.05, T.worse - 0.05];
  let squash = 1;
  for (const w of swaps) squash *= 1 - 0.08 * Math.max(0, 1 - Math.abs(t - w) / 0.08);
  squash *= appear * (1 + 0.012 * Math.sin(2 * Math.PI * 0.6 * t));
  const wag = 16 * Math.sin((t - T.not) * 2 * Math.PI * 3);
  // gauge jump with the pull
  const gx = pullDX * 0.6;
  // bubble
  const bubbleS = popIn(t, T.because - 0.04, 0.3) * popOut(t, T.xStamp + 0.32, 0.22);
  const xS = popIn(t, T.xStamp, 0.18);
  const scr = (p: P2): P2 => {
    const k = 1000 / (1000 - cam.z);
    return [540 + (p[0] - cam.x) * k, 960 + (p[1] - cam.y) * k];
  };
  const headScreen = scr([SCI_HIP[0] + 30, 880]);
  // visitor
  const vf = visitorFeet(t);
  const vp = visitorPose(t);
  const vm = visitorMouth(t);
  const pour1 = clamp(prog(t, T.water2 + 0.1, T.water2 + 0.24)) * (1 - clamp(prog(t, T.cut + 0.35, T.cut + 0.5)));
  const dump = clamp(prog(t, T.too, T.too + 0.12)) * (1 - clamp(prog(t, T.makes, T.makes + 0.2)));
  const streamTo: P2 = [vm[0] - 30, fl > 0.02 ? SAND_TOP - 70 * fl : SAND_TOP];
  const sh = shakeXY(t, 10 * Math.exp(-7 * Math.max(0, t - T.too - 0.15)) * (t > T.too + 0.15 ? 1 : 0) + 5 * Math.exp(-7 * Math.max(0, t - T.worse)) * (t > T.worse ? 1 : 0));
  const tank = tankParts({t, wet: wetSmall(t), fl, sx});
  const ropeFrom: P2 = [sx - 76, SAND_TOP - 20 + 12 * fl];
  const hook: P2 = [GAUGE[0] + GAUGE_R + 46 + gx, GAUGE[1] + 50];
  const sweat = straining ? ((t * 1.3) % 1) : -1;
  return (
    <AbsoluteFill style={{background: C.labWall}}>
      <Layer cam={cam} z={1900} blur={1.6} shake={[sh[0] * 0.4, sh[1] * 0.4]}>
        <BackWall t={t} />
      </Layer>
      <Layer cam={cam} z={1000} shake={sh}>
        {/* the Egyptian visitor stands behind the table */}
        {t > T.water2 - 0.45 && (
          <g>
            <Egyptian x={vf[0]} y={vf[1]} p={vp} scale={VSCALE} />
          </g>
        )}
        <g transform={`translate(0,${hop}) translate(${SCI_HIP[0]},1300) scale(${appear}) translate(${-SCI_HIP[0]},-1300)`}>
          <Scientist lean={lean} handA={handA} handB={handB} expr={expr} blink={blinkAt(t, [12.0, 15.5, 17.0])} wagAngle={wag} squash={squash} />
        </g>
        {tank.back}
        {/* rope sled -> gauge hook */}
        <path d={`M${ropeFrom[0]},${ropeFrom[1]} L${hook[0]},${hook[1]}`} stroke={INK} strokeWidth={16} strokeLinecap="round" />
        <path d={`M${ropeFrom[0]},${ropeFrom[1]} L${hook[0]},${hook[1]}`} stroke={C.rope} strokeWidth={8} strokeLinecap="round" />
        <ToySled x={sx} sink={14 * fl} tilt={-4 * fl} nervous={fl} />
        {tank.front}
        <Table />
        <g transform={`translate(${gx},0)`}>
          <Gauge g={g} />
        </g>
        {/* water from the jar into the tank */}
        {(pour1 > 0.01 || dump > 0.01) && (
          <g>
            <path d={`M${vm[0]},${vm[1]} Q${vm[0] - 20},${vm[1] + 40} ${streamTo[0]},${streamTo[1]}`} fill="none" stroke={INK} strokeWidth={24 * pour1 + 70 * dump + 8} strokeLinecap="round" />
            <path d={`M${vm[0]},${vm[1]} Q${vm[0] - 20},${vm[1] + 40} ${streamTo[0]},${streamTo[1]}`} fill="none" stroke={C.water} strokeWidth={24 * pour1 + 70 * dump} strokeLinecap="round" />
            <path d={`M${vm[0]},${vm[1]} Q${vm[0] - 20},${vm[1] + 40} ${streamTo[0]},${streamTo[1]}`} fill="none" stroke={C.waterLight} strokeWidth={6 + 14 * dump} strokeLinecap="round" strokeDasharray="20 28" strokeDashoffset={-t * 900} />
          </g>
        )}
        {/* flood splash blobs flying out of the tank */}
        {t > T.too + 0.1 &&
          Array.from({length: 16}).map((_, i) => {
            const born = T.too + 0.1 + i * 0.035;
            const age = t - born;
            if (age < 0 || age > 0.9) return null;
            const ang = (-150 + rand(i * 3.7) * 120) * (Math.PI / 180);
            const sp = 600 + rand(i * 1.9) * 500;
            const x = streamTo[0] + Math.cos(ang) * sp * age;
            const y = SAND_TOP - 40 + Math.sin(ang) * sp * age + 0.5 * 2800 * age * age;
            const r = 10 + rand(i * 7.1) * 12;
            return <ellipse key={i} cx={x} cy={y} rx={r} ry={r * 1.25} fill={C.water} stroke={INK} strokeWidth={5} transform={`rotate(${(ang * 180) / Math.PI} ${x} ${y})`} />;
          })}
        {sweat >= 0 && sweat < 0.7 && <SweatDrop x={SCI_HIP[0] - 104 - 20 * sweat} y={790 + 90 * sweat} s={popIn(sweat, 0, 0.12) * popOut(sweat, 0.55, 0.15) * 2} rot={-20} />}
        {t > T.half - 0.1 && t < T.not - 0.1 && (
          <>
            <Sparkle x={GAUGE[0] - 160} y={GAUGE[1] - 150} s={popIn(t, T.half - 0.08, 0.25) * popOut(t, T.half + 0.6, 0.2) * 1.1} rot={t * 80} />
            <Sparkle x={GAUGE[0] + 170} y={GAUGE[1] - 130} s={popIn(t, T.half, 0.25) * popOut(t, T.half + 0.65, 0.2) * 0.8} rot={-t * 80} />
          </>
        )}
      </Layer>
      {/* foreground flask (blurred) */}
      <Layer cam={cam} z={640} blur={3.2} shake={sh}>
        <g transform="translate(1050,1500) scale(1.5)">
          <path d="M-40,-260 L40,-260 L40,-150 L130,-10 Q134,0 120,0 L-120,0 Q-134,0 -130,-10 L-40,-150 Z" fill={C.glass} stroke={INK} strokeWidth={OL} strokeLinejoin="round" />
          <path d="M-80,-80 L80,-80 L122,-10 Q124,-4 114,-4 L-114,-4 Q-124,-4 -122,-10 Z" fill={C.flaskPink} />
        </g>
      </Layer>
      <ThoughtBubble t={t} s={bubbleS} x={xS} from={[headScreen[0] + 60, headScreen[1] - 150]} />
    </AbsoluteFill>
  );
};
