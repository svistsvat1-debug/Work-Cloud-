import React, {useId} from 'react';
import {Svg} from '../camera';
import {OUT, OW, lerp} from '../util';

export type EyeMode = 'open' | 'wide' | 'squeeze' | 'happy' | 'closed';
export type MouthMode = 'smile' | 'o' | 'worry' | 'grin' | 'flat' | 'gulp';

export type MosquitoProps = {
  t: number; // seconds (drives wing flap + leg sway)
  flapHz?: number;
  flapAmp?: number; // degrees
  eyes?: EyeMode;
  look?: {x: number; y: number}; // -1..1
  brows?: number; // + worried (inner up), - angry (inner down)
  browLift?: number; // px up
  mouth?: MouthMode;
  spread?: number; // 0 dangling legs .. 1 legs splayed
  sweat?: number; // 0..1 visibility
  sweatSlide?: number; // 0..1 slide down the head
  mini?: boolean; // simplified (for the swarm)
  wingsOn?: boolean;
};

const C = {
  body: '#655F70',
  bodyShade: '#544E5E',
  thorax: '#5A5465',
  head: '#77718A',
  headShade: '#665F78',
  stripe: '#F4F2F7',
  leg: '#4F4959',
  legFar: '#3E3947',
  wing: '#E4F5FF',
  wingFar: '#C9E7FA',
  vein: '#97C6E4',
  prob: '#3A3542',
  tongue: '#F27B97',
  sweat: '#8FD3FF',
};

type P = [number, number];
const LEGS: {hip: P; knee: P; foot: P; knee2: P; foot2: P}[] = [
  // dangling knee/foot, then splayed knee2/foot2
  {hip: [24, 30], knee: [72, 86], foot: [96, 196], knee2: [100, 44], foot2: [190, 96]},
  {hip: [4, 38], knee: [12, 100], foot: [-4, 214], knee2: [24, 104], foot2: [56, 182]},
  {hip: [-18, 32], knee: [-72, 80], foot: [-112, 202], knee2: [-96, 44], foot2: [-196, 88]},
];

const legPath = (hip: P, knee: P, foot: P) => `M ${hip[0]} ${hip[1]} L ${knee[0]} ${knee[1]} L ${foot[0]} ${foot[1]}`;

const Leg: React.FC<{d: string; color: string; w?: number}> = ({d, color, w = 1}) => (
  <g fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} stroke={OUT} strokeWidth={11 * w} />
    <path d={d} stroke={color} strokeWidth={4.5 * w} />
  </g>
);

export const Mosquito: React.FC<MosquitoProps> = ({
  t,
  flapHz = 14,
  flapAmp = 26,
  eyes = 'open',
  look = {x: 0, y: 0},
  brows = 0,
  browLift = 0,
  mouth = 'smile',
  spread = 0,
  sweat = 0,
  sweatSlide = 0,
  mini = false,
  wingsOn = true,
}) => {
  const id = useId().replace(/:/g, '');
  const flap = Math.sin(2 * Math.PI * flapHz * t);
  const wingA = -22 + flapAmp * flap;
  const wingB = -10 + flapAmp * Math.sin(2 * Math.PI * flapHz * t - 0.5);

  const legs = LEGS.map((L, i) => {
    const sw = (k: number) => Math.sin(2 * Math.PI * 0.9 * t + i * 1.7 + k) * 6 * (1 - spread);
    const knee: P = [lerp(L.knee[0], L.knee2[0], spread) + sw(0) * 0.5, lerp(L.knee[1], L.knee2[1], spread)];
    const foot: P = [lerp(L.foot[0], L.foot2[0], spread) + sw(1), lerp(L.foot[1], L.foot2[1], spread)];
    return {hip: L.hip, knee, foot};
  });

  // eyes
  const E = [
    {x: 64, y: -40, rx: 21, ry: 25},
    {x: 104, y: -36, rx: 19, ry: 23},
  ];
  const wideK = eyes === 'wide' ? 1.16 : 1;
  const pupR = eyes === 'wide' ? 7.5 : 10;

  const brow = (i: number) => {
    const e = E[i];
    const by = e.y - e.ry * wideK - 12 - browLift;
    const s = i === 0 ? 1 : -1; // inner side is +x for eye 0, -x for eye 1
    const a = 6 * brows;
    return `M ${e.x - 15} ${by + s * a} L ${e.x + 15} ${by - s * a}`;
  };

  const wing = (ang: number, fill: string, key: string) => (
    <g key={key} transform={`translate(-6 -40) rotate(${ang})`}>
      <ellipse cx={-96} cy={0} rx={100} ry={27} fill={fill} fillOpacity={0.88} stroke={OUT} strokeWidth={OW * 0.85} />
      {!mini && (
        <g stroke={C.vein} strokeWidth={3} fill="none" strokeLinecap="round">
          <path d="M -12 -2 Q -90 -10 -180 -4" />
          <path d="M -30 6 Q -100 10 -168 8" />
        </g>
      )}
    </g>
  );

  return (
    <Svg box={[-280, -190, 560, 440]}>
      <defs>
        <clipPath id={`abd${id}`}>
          <ellipse cx={-118} cy={30} rx={92} ry={36} transform="rotate(18 -118 30)" />
        </clipPath>
        <clipPath id={`head${id}`}>
          <circle cx={80} cy={-26} r={54} />
        </clipPath>
      </defs>

      {/* far wing + far legs behind the body */}
      {wingsOn && wing(wingB - 12, C.wingFar, 'wf')}
      {legs.map((l, i) => (
        <Leg key={`lf${i}`} d={legPath([l.hip[0] + 12, l.hip[1] - 6], [l.knee[0] + 16, l.knee[1] - 8], [l.foot[0] + 18, l.foot[1] - 10])} color={C.legFar} />
      ))}

      {/* abdomen with stripes */}
      <g>
        <ellipse cx={-118} cy={30} rx={92} ry={36} transform="rotate(18 -118 30)" fill={C.body} />
        <g clipPath={`url(#abd${id})`}>
          <ellipse cx={-96} cy={70} rx={110} ry={30} transform="rotate(18 -118 30)" fill={C.bodyShade} />
          {[-78, -122, -166].map((x) => (
            <rect key={x} x={x} y={-40} width={13} height={160} fill={C.stripe} transform={`rotate(18 ${x} 30)`} />
          ))}
        </g>
        <ellipse cx={-118} cy={30} rx={92} ry={36} transform="rotate(18 -118 30)" fill="none" stroke={OUT} strokeWidth={OW} />
      </g>

      {/* thorax */}
      <ellipse cx={0} cy={0} rx={50} ry={46} fill={C.thorax} stroke={OUT} strokeWidth={OW} />
      {!mini && <path d="M -20 -26 Q 0 -40 20 -26" fill="none" stroke={C.stripe} strokeWidth={6} strokeLinecap="round" />}

      {/* proboscis */}
      <g fill="none" strokeLinecap="round">
        <path d="M 124 -6 Q 172 8 214 40" stroke={OUT} strokeWidth={12} />
        <path d="M 124 -6 Q 172 8 214 40" stroke={C.prob} strokeWidth={5} />
      </g>

      {/* antennae */}
      {!mini && (
        <g fill="none" stroke={OUT} strokeWidth={5} strokeLinecap="round">
          <path d="M 70 -76 Q 60 -100 50 -124" />
          <path d="M 96 -78 Q 104 -102 104 -126" />
          {[0.3, 0.55, 0.8].map((u) => (
            <g key={u}>
              <path d={`M ${70 - 20 * u} ${-76 - 48 * u} l -12 -2`} />
              <path d={`M ${70 - 20 * u} ${-76 - 48 * u} l 10 -6`} />
              <path d={`M ${96 + 8 * u} ${-78 - 48 * u} l -11 -5`} />
              <path d={`M ${96 + 8 * u} ${-78 - 48 * u} l 12 -2`} />
            </g>
          ))}
        </g>
      )}

      {/* head */}
      <circle cx={80} cy={-26} r={54} fill={C.head} />
      <g clipPath={`url(#head${id})`}>
        <circle cx={60} cy={2} r={56} fill={C.headShade} />
        <circle cx={78} cy={-36} r={52} fill={C.head} />
      </g>
      <circle cx={80} cy={-26} r={54} fill="none" stroke={OUT} strokeWidth={OW} />

      {/* eyes */}
      {E.map((e, i) => {
        if (eyes === 'squeeze') {
          const s = i === 0 ? 1 : -1;
          return (
            <path
              key={i}
              d={`M ${e.x - 11 * s} ${e.y - 12} L ${e.x + 10 * s} ${e.y} L ${e.x - 11 * s} ${e.y + 12}`}
              fill="none"
              stroke={OUT}
              strokeWidth={7}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        }
        if (eyes === 'happy' || eyes === 'closed') {
          const d =
            eyes === 'happy'
              ? `M ${e.x - 14} ${e.y + 5} Q ${e.x} ${e.y - 14} ${e.x + 14} ${e.y + 5}`
              : `M ${e.x - 14} ${e.y} Q ${e.x} ${e.y + 8} ${e.x + 14} ${e.y}`;
          return <path key={i} d={d} fill="none" stroke={OUT} strokeWidth={7} strokeLinecap="round" />;
        }
        const px = e.x + look.x * 8;
        const py = e.y + look.y * 10;
        return (
          <g key={i}>
            <ellipse cx={e.x} cy={e.y} rx={e.rx * wideK} ry={e.ry * wideK} fill="#fff" stroke={OUT} strokeWidth={6} />
            <circle cx={px} cy={py} r={pupR} fill={OUT} />
            <circle cx={px - 3} cy={py - 4} r={3.5} fill="#fff" />
          </g>
        );
      })}

      {/* brows */}
      {!mini && (
        <g stroke={OUT} strokeWidth={8} strokeLinecap="round" fill="none">
          <path d={brow(0)} />
          <path d={brow(1)} />
        </g>
      )}

      {/* mouth */}
      {!mini && <Mouth mode={mouth} />}

      {/* near legs */}
      {legs.map((l, i) => (
        <Leg key={`ln${i}`} d={legPath(l.hip, l.knee, l.foot)} color={C.leg} />
      ))}

      {/* near wing on top */}
      {wingsOn && wing(wingA, C.wing, 'wn')}

      {/* sweat drop */}
      {sweat > 0.01 && (
        <g transform={`translate(${34 - 6 * sweatSlide} ${-74 + 46 * sweatSlide}) scale(${sweat})`}>
          <path d="M 0 -26 C 6 -14 15 -4 15 6 A 15 15 0 0 1 -15 6 C -15 -4 -6 -14 0 -26 Z" fill={C.sweat} stroke={OUT} strokeWidth={5} />
          <ellipse cx={-5} cy={3} rx={3.5} ry={6} fill="#fff" />
        </g>
      )}
    </Svg>
  );
};

const Mouth: React.FC<{mode: MouthMode}> = ({mode}) => {
  const cx = 86;
  const cy = 8;
  switch (mode) {
    case 'o':
      return <ellipse cx={cx} cy={cy + 2} rx={9} ry={11} fill={OUT} />;
    case 'worry':
      return (
        <path
          d={`M ${cx - 14} ${cy + 4} q 5 -6 10 0 q 5 6 10 0 q 4 -5 8 0`}
          fill="none"
          stroke={OUT}
          strokeWidth={5}
          strokeLinecap="round"
        />
      );
    case 'grin':
      return (
        <g>
          <path d={`M ${cx - 16} ${cy - 2} Q ${cx} ${cy + 26} ${cx + 16} ${cy - 2} Z`} fill={OUT} />
          <path d={`M ${cx - 7} ${cy + 10} Q ${cx} ${cy + 4} ${cx + 8} ${cy + 10} Q ${cx} ${cy + 18} ${cx - 7} ${cy + 10}`} fill="#F27B97" />
        </g>
      );
    case 'flat':
      return <path d={`M ${cx - 10} ${cy + 4} L ${cx + 10} ${cy + 4}`} stroke={OUT} strokeWidth={5} strokeLinecap="round" />;
    case 'gulp':
      return (
        <path d={`M ${cx - 10} ${cy + 8} Q ${cx} ${cy - 2} ${cx + 10} ${cy + 8}`} fill="none" stroke={OUT} strokeWidth={5} strokeLinecap="round" />
      );
    default:
      return (
        <path d={`M ${cx - 12} ${cy} Q ${cx} ${cy + 12} ${cx + 12} ${cy}`} fill="none" stroke={OUT} strokeWidth={5} strokeLinecap="round" />
      );
  }
};
