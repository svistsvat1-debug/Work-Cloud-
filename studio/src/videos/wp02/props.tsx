import React from 'react';
import {Brain, BrainProps} from './brain';
import {C, INK, OL, clamp, lerp, rand} from './core';

// ---------------------------------------------------------------- forest
/** trunk + side branch in world coords; trunk face starts at x0 */
export const TRUNK_X0 = 650;
export const TRUNK_W = 360;
export const BRANCH = {x1: TRUNK_X0 + 10, y1: 1532, x2: -440, y2: 1488, th1: 74, th2: 40};
export const branchTopY = (x: number) => lerp(BRANCH.y1, BRANCH.y2, (BRANCH.x1 - x) / (BRANCH.x1 - BRANCH.x2));

export const Trunk: React.FC = () => {
  const x0 = TRUNK_X0;
  const x1 = TRUNK_X0 + TRUNK_W;
  const {x1: bx1, y1: by1, x2: bx2, y2: by2, th1, th2} = BRANCH;
  return (
    <g>
      {/* branch (behind trunk edge) */}
      <path
        d={`M ${bx1} ${by1} L ${bx2} ${by2} Q ${bx2 - 26} ${by2 + th2 / 2} ${bx2} ${by2 + th2} L ${bx1} ${by1 + th1} Z`}
        fill={C.trunk}
        stroke={INK}
        strokeWidth={OL}
        strokeLinejoin="round"
      />
      <path d={`M ${bx1 - 40} ${by1 + th1 - 14} L ${bx2 + 30} ${by2 + th2 - 10}`} stroke={C.trunkDark} strokeWidth={12} strokeLinecap="round" />
      <path d={`M ${bx1 - 220} ${by1 + 22} L ${bx1 - 420} ${by1 + 12}`} stroke={C.grain} strokeWidth={6} strokeLinecap="round" />
      {/* leaves on the branch tip */}
      <g transform={`translate(${bx2 + 30} ${by2 - 6}) rotate(-28)`}>
        <path d="M 0 0 C 30 -46 92 -50 118 -20 C 86 6 30 18 0 0 Z" fill={C.leaf} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        <path d="M 6 -2 Q 60 -22 110 -20" stroke={C.leafDark} strokeWidth={5} fill="none" strokeLinecap="round" />
      </g>
      <g transform={`translate(${bx2 + 64} ${by2 + 4}) rotate(150)`}>
        <path d="M 0 0 C 26 -40 82 -44 104 -18 C 76 6 26 16 0 0 Z" fill={C.leaf} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      </g>
      {/* trunk */}
      <rect x={x0} y={-3000} width={TRUNK_W} height={8000} fill={C.trunk} />
      <rect x={x1 - 70} y={-3000} width={70} height={8000} fill={C.trunkDark} />
      <g stroke={C.grain} strokeWidth={7} strokeLinecap="round" fill="none">
        {[
          [x0 + 70, -400, 300],
          [x0 + 150, 120, 420],
          [x0 + 250, -150, 260],
          [x0 + 110, 900, 360],
          [x0 + 230, 1350, 300],
          [x0 + 60, 1900, 380],
          [x0 + 290, 2200, 300],
          [x0 + 180, 2600, 420],
        ].map(([x, y, l], i) => (
          <path key={i} d={`M ${x} ${y} q ${i % 2 ? 10 : -10} ${l / 2} 0 ${l}`} />
        ))}
      </g>
      {/* knots */}
      <g>
        <ellipse cx={x0 + 230} cy={620} rx={34} ry={46} fill={C.trunkDark} stroke={C.grain} strokeWidth={7} />
        <ellipse cx={x0 + 230} cy={620} rx={14} ry={20} fill={C.grain} />
        <ellipse cx={x0 + 120} cy={2050} rx={26} ry={36} fill={C.trunkDark} stroke={C.grain} strokeWidth={7} />
      </g>
      {/* peck marks */}
      <g fill={C.grain}>
        <ellipse cx={x0 + 18} cy={812} rx={12} ry={7} />
        <ellipse cx={x0 + 26} cy={846} rx={9} ry={6} />
        <ellipse cx={x0 + 14} cy={876} rx={10} ry={6} />
      </g>
      <line x1={x0} y1={-3000} x2={x0} y2={5000} stroke={INK} strokeWidth={OL} />
      <line x1={x1} y1={-3000} x2={x1} y2={5000} stroke={INK} strokeWidth={OL} />
    </g>
  );
};

export const Cloud: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path
      d="M -150 40 C -190 40 -196 -14 -150 -20 C -150 -70 -86 -86 -60 -50 C -40 -104 46 -110 64 -46 C 104 -70 156 -40 140 4 C 178 8 178 40 140 40 Z"
      fill={C.white}
      stroke={'#9DB8CC'}
      strokeWidth={8}
      strokeLinejoin="round"
    />
  </g>
);

export const Hills: React.FC<{y: number; color: string; seed: number; outline?: boolean; amp?: number; step?: number}> = ({y, color, seed, outline = false, amp = 90, step = 520}) => {
  let d = `M -6000 ${y + 4000} L -6000 ${y}`;
  for (let x = -6000, i = 0; x < 7000; x += step, i++) {
    const h = amp * (0.55 + 0.45 * rand(seed + i));
    d += ` Q ${x + step / 2} ${y - h * 2} ${x + step} ${y}`;
  }
  d += ` L 7000 ${y + 4000} Z`;
  return <path d={d} fill={color} stroke={outline ? INK : 'none'} strokeWidth={outline ? 8 : 0} strokeLinejoin="round" />;
};

export const LeafTwig: React.FC<{x: number; y: number; s?: number; rot?: number}> = ({x, y, s = 1, rot = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M 0 -300 Q 10 -120 -20 40" stroke={C.shelfDark} strokeWidth={22} fill="none" strokeLinecap="round" />
    {[
      [-6, -180, -40],
      [6, -110, 30],
      [-14, -30, -55],
      [-18, 30, 20],
    ].map(([lx, ly, r], i) => (
      <g key={i} transform={`translate(${lx} ${ly}) rotate(${r + (i % 2 ? 180 : 0)})`}>
        <path d="M 0 0 C 30 -60 120 -64 150 -24 C 110 10 40 22 0 0 Z" fill={i % 2 ? C.leafDark : C.leaf} stroke={INK} strokeWidth={9} strokeLinejoin="round" />
      </g>
    ))}
  </g>
);

// ---------------------------------------------------------------- museum
export const Jar: React.FC<{x: number; y: number; brain: BrainProps; bob?: number; labelIcon?: boolean}> = ({x, y, brain, bob = 0, labelIcon = true}) => (
  <g transform={`translate(${x} ${y})`}>
    <defs>
      <clipPath id={`jar-${brain.id}`}>
        <rect x={-130} y={-346} width={260} height={346} rx={44} />
      </clipPath>
    </defs>
    <rect x={-130} y={-346} width={260} height={346} rx={44} fill={C.glass} />
    <g clipPath={`url(#jar-${brain.id})`}>
      <rect x={-140} y={-292} width={280} height={300} fill={C.liquid} />
      <rect x={-140} y={-292} width={280} height={14} fill={C.liquidDark} />
      <g transform={`translate(0 ${-150 + bob}) scale(0.8)`}>
        <Brain {...brain} />
      </g>
      <circle cx={-60} cy={-60} r={7} fill={C.white} opacity={0.8} />
      <circle cx={70} cy={-110} r={5} fill={C.white} opacity={0.8} />
      <circle cx={-80} cy={-200} r={6} fill={C.white} opacity={0.8} />
    </g>
    <rect x={-104} y={-304} width={20} height={240} rx={10} fill={C.white} opacity={0.75} />
    <rect x={-130} y={-346} width={260} height={346} rx={44} fill="none" stroke={INK} strokeWidth={OL} />
    <rect x={-142} y={-386} width={284} height={50} rx={14} fill={C.lid} stroke={INK} strokeWidth={OL} />
    <rect x={-120} y={-376} width={90} height={10} rx={5} fill={'#8893A0'} />
    {labelIcon && (
      <g>
        <rect x={-74} y={-96} width={148} height={64} rx={8} fill={C.paper} stroke={INK} strokeWidth={5} />
        <path d="M -56 -52 L -50 -80 L -40 -64 L -32 -86 L -24 -62 L -14 -78 L -16 -52 Z" fill={C.red} stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
        <g stroke={'#B9A98A'} strokeWidth={6} strokeLinecap="round">
          <line x1={4} y1={-74} x2={56} y2={-74} />
          <line x1={4} y1={-56} x2={44} y2={-56} />
        </g>
      </g>
    )}
  </g>
);

export const Shelf: React.FC<{x0: number; x1: number; y: number}> = ({x0, x1, y}) => (
  <g>
    {[x0 + 260, (x0 + x1) / 2, x1 - 260].map((bx, i) => (
      <path key={i} d={`M ${bx - 20} ${y + 40} L ${bx + 20} ${y + 40} L ${bx + 20} ${y + 150} Q ${bx} ${y + 150} ${bx - 20} ${y + 120} Z`} fill={C.shelfDark} stroke={INK} strokeWidth={7} strokeLinejoin="round" />
    ))}
    <rect x={x0} y={y} width={x1 - x0} height={48} fill={C.shelf} stroke={INK} strokeWidth={OL} />
    <rect x={x0} y={y + 30} width={x1 - x0} height={18} fill={C.shelfDark} />
    <rect x={x0} y={y} width={x1 - x0} height={48} fill="none" stroke={INK} strokeWidth={OL} />
  </g>
);

export const Calendar: React.FC<{x: number; y: number; flip: number}> = ({x, y, flip}) => {
  // flip 0..1: top page (2017) folds up about the binding, revealing 2018
  const topScale = flip < 1 ? 1 - flip : 0;
  const page = (label: string, k: string) => (
    <g key={k}>
      <rect x={-260} y={-180} width={520} height={440} rx={22} fill={C.white} stroke={INK} strokeWidth={10} />
      <g fill={'#D9D2C4'}>
        {Array.from({length: 12}).map((_, i) => (
          <rect key={i} x={-200 + (i % 6) * 70} y={140 + Math.floor(i / 6) * 50} width={44} height={30} rx={6} />
        ))}
      </g>
      <text x={0} y={90} textAnchor="middle" fontFamily="Montserrat" fontWeight={900} fontSize={150} fill={INK}>
        {label}
      </text>
    </g>
  );
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-260} y={-230} width={520} height={84} rx={22} fill={C.red} stroke={INK} strokeWidth={10} />
      {page('2018', 'b')}
      {topScale > 0.01 && <g transform={`translate(0 -180) scale(1 ${topScale}) translate(0 180)`}>{page('2017', 'a')}</g>}
      <rect x={-260} y={-230} width={520} height={84} rx={22} fill={C.red} stroke={INK} strokeWidth={10} />
      {[-150, 150].map((rx) => (
        <g key={rx}>
          <rect x={rx - 14} y={-262} width={28} height={74} rx={14} fill={'#C9CED6'} stroke={INK} strokeWidth={8} />
        </g>
      ))}
    </g>
  );
};

export const BirdPicture: React.FC<{x: number; y: number}> = ({x, y}) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-250} y={-210} width={500} height={420} rx={10} fill={'#B98544'} stroke={INK} strokeWidth={10} />
    <rect x={-210} y={-170} width={420} height={340} fill={'#DCEFF9'} stroke={INK} strokeWidth={7} />
    <path d="M -210 110 Q -100 40 0 100 Q 100 150 210 80 L 210 170 L -210 170 Z" fill={C.hillMid} />
    <rect x={60} y={-170} width={60} height={300} fill={C.trunk} stroke={INK} strokeWidth={6} />
    <ellipse cx={34} cy={-20} rx={30} ry={46} fill={C.black} stroke={INK} strokeWidth={5} />
    <circle cx={30} cy={-80} r={26} fill={C.white} stroke={INK} strokeWidth={5} />
    <path d="M 14 -100 L 22 -122 L 34 -104 L 44 -120 L 46 -100 Z" fill={C.red} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    <path d="M 52 -82 L 76 -76 L 52 -70 Z" fill={C.beak} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
  </g>
);

export const Stanchions: React.FC<{xs: number[]; y: number}> = ({xs, y}) => (
  <g>
    {xs.slice(0, -1).map((x, i) => {
      const x2 = xs[i + 1];
      return (
        <g key={i}>
          <path d={`M ${x} ${y - 300} Q ${(x + x2) / 2} ${y - 120} ${x2} ${y - 300}`} stroke={INK} strokeWidth={42} fill="none" strokeLinecap="round" />
          <path d={`M ${x} ${y - 300} Q ${(x + x2) / 2} ${y - 120} ${x2} ${y - 300}`} stroke={C.rope} strokeWidth={28} fill="none" strokeLinecap="round" />
        </g>
      );
    })}
    {xs.map((x) => (
      <g key={x}>
        <rect x={x - 22} y={y - 320} width={44} height={420} rx={12} fill={C.brass} stroke={INK} strokeWidth={OL} />
        <circle cx={x} cy={y - 330} r={36} fill={C.brass} stroke={INK} strokeWidth={OL} />
        <rect x={x - 8} y={y - 300} width={10} height={360} rx={5} fill={'#F5D782'} />
      </g>
    ))}
  </g>
);

/** magnifying glass; children are drawn inside the lens (lens centre = origin) */
export const Magnifier: React.FC<{id: string; r?: number; children?: React.ReactNode}> = ({id, r = 190, children}) => (
  <g>
    <g transform={`rotate(45) translate(${r + 10} 0)`}>
      <rect x={0} y={-26} width={70} height={52} rx={8} fill={'#7B8592'} stroke={INK} strokeWidth={OL} />
      <rect x={60} y={-32} width={300} height={64} rx={30} fill={'#5B3720'} stroke={INK} strokeWidth={OL} />
      <rect x={90} y={-18} width={220} height={10} rx={5} fill={'#86583A'} />
    </g>
    <defs>
      <clipPath id={`lens-${id}`}>
        <circle r={r} />
      </clipPath>
    </defs>
    <circle r={r} fill={C.liquid} />
    <g clipPath={`url(#lens-${id})`}>{children}</g>
    <circle r={r} fill="#BFE6FF" opacity={0.18} />
    <path d={`M ${-r * 0.62} ${-r * 0.34} A ${r * 0.72} ${r * 0.72} 0 0 1 ${-r * 0.2} ${-r * 0.7}`} stroke={C.white} strokeWidth={r * 0.08} fill="none" strokeLinecap="round" opacity={0.9} />
    <circle r={r + 13} fill="none" stroke={INK} strokeWidth={42} />
    <circle r={r + 13} fill="none" stroke={'#56606C'} strokeWidth={24} />
    <circle r={r + 13} fill="none" stroke={'#7D8794'} strokeWidth={6} strokeDasharray={`${r * 1.2} ${r * 8}`} />
  </g>
);

// ---------------------------------------------------------------- football
export const Football: React.FC<{rot?: number}> = ({rot = 0}) => (
  <g transform={`rotate(${rot})`}>
    <path d="M -78 0 C -50 -52 50 -52 78 0 C 50 52 -50 52 -78 0 Z" fill={C.football} stroke={INK} strokeWidth={OL} strokeLinejoin="round" />
    <path d="M -64 -10 C -40 -38 0 -44 30 -36" stroke={'#A9622F'} strokeWidth={9} fill="none" strokeLinecap="round" />
    <path d="M -50 -30 Q -44 0 -50 30" stroke={C.white} strokeWidth={8} fill="none" />
    <path d="M 50 -30 Q 44 0 50 30" stroke={C.white} strokeWidth={8} fill="none" />
    <g stroke={INK} strokeWidth={13} strokeLinecap="round">
      <line x1={-22} y1={-6} x2={22} y2={-6} />
      {[-14, -4, 6, 16].map((x) => (
        <line key={x} x1={x} y1={-15} x2={x} y2={3} />
      ))}
    </g>
    <g stroke={C.white} strokeWidth={6} strokeLinecap="round">
      <line x1={-22} y1={-6} x2={22} y2={-6} />
      {[-14, -4, 6, 16].map((x) => (
        <line key={x} x1={x} y1={-15} x2={x} y2={3} />
      ))}
    </g>
  </g>
);

// ---------------------------------------------------------------- fx
export const STAR_PATH = (() => {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 ? 13 : 32;
    d += `${i ? 'L' : 'M'} ${Math.cos(a) * r} ${Math.sin(a) * r} `;
  }
  return d + 'Z';
})();

export const Star: React.FC<{x: number; y: number; s: number; rot?: number}> = ({x, y, s, rot = 0}) =>
  s <= 0.01 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d={STAR_PATH} fill={C.star} stroke={INK} strokeWidth={6.5} strokeLinejoin="round" />
    </g>
  );

export const Sparkle: React.FC<{x: number; y: number; s: number; rot?: number}> = ({x, y, s, rot = 0}) =>
  s <= 0.01 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d="M 0 -40 Q 6 -6 40 0 Q 6 6 0 40 Q -6 6 -40 0 Q -6 -6 0 -40 Z" fill={C.white} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <path d="M 0 -18 Q 3 -3 18 0 Q 3 3 0 18 Q -3 3 -18 0 Q -3 -3 0 -18 Z" fill={C.star} />
    </g>
  );

export const QMark: React.FC<{x: number; y: number; s: number; rot?: number}> = ({x, y, s, rot = 0}) =>
  s <= 0.01 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <text x={0} y={44} textAnchor="middle" fontFamily="Montserrat" fontWeight={900} fontSize={130} fill={C.white} stroke={INK} strokeWidth={14} paintOrder="stroke" strokeLinejoin="round">
        ?
      </text>
    </g>
  );

export const ImpactLines: React.FC<{x: number; y: number; u: number; rot?: number}> = ({x, y, u, rot = 0}) => {
  if (u <= 0 || u >= 1) return null;
  const r0 = lerp(40, 110, u);
  const r1 = lerp(80, 130, u);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`} stroke={INK} strokeWidth={9 * (1 - u) + 2} strokeLinecap="round">
      {[-60, -25, 10, 45, 80].map((a) => {
        const rad = ((a + 180) * Math.PI) / 180;
        return <line key={a} x1={Math.cos(rad) * r0} y1={Math.sin(rad) * r0} x2={Math.cos(rad) * r1} y2={Math.sin(rad) * r1} />;
      })}
    </g>
  );
};

export type ChipSpawn = {t: number; seed: number; x: number; y: number};
/** wood chips: real projectile motion, shrink away at the end of life */
export const Chips: React.FC<{t: number; spawns: ChipSpawn[]}> = ({t, spawns}) => (
  <g>
    {spawns.flatMap((sp) =>
      [0, 1, 2].map((k) => {
        const age = t - sp.t;
        const life = 0.8;
        if (age < 0 || age > life) return null;
        const r1 = rand(sp.seed * 7 + k);
        const r2 = rand(sp.seed * 13 + k * 3);
        const r3 = rand(sp.seed * 29 + k * 5);
        const vx = -(260 + 460 * r1);
        const vy = -(380 + 520 * r2);
        const g = 2600;
        const x = sp.x + vx * age;
        const y = sp.y + vy * age + 0.5 * g * age * age;
        const rot = (r3 - 0.5) * 1400 * age + r3 * 90;
        const s = age > life - 0.18 ? clamp((life - age) / 0.18) : 1;
        const w = 30 + 14 * r3;
        return (
          <rect
            key={`${sp.seed}-${k}`}
            x={-w / 2}
            y={-8}
            width={w}
            height={16}
            rx={4}
            fill={C.chip}
            stroke={INK}
            strokeWidth={4.5}
            transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}
          />
        );
      }),
    )}
  </g>
);
