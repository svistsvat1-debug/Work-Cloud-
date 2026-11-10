import React, {useId} from 'react';
import {Svg} from '../camera';
import {OUT, OW} from '../util';

export const dropPath = (R: number) =>
  `M 0 ${-2.15 * R} C ${0.22 * R} ${-1.45 * R} ${R} ${-0.75 * R} ${R} 0 A ${R} ${R} 0 0 1 ${-R} 0 C ${-R} ${-0.75 * R} ${-0.22 * R} ${-1.45 * R} 0 ${-2.15 * R} Z`;

export type DropFace = {
  eyes?: 'open' | 'squint' | 'closed' | 'wide';
  look?: {x: number; y: number};
  brows?: number; // - angry, + worried
  mouth?: 'smirk' | 'smile' | 'o' | 'grit' | 'flat' | 'grin';
};

const BLUE = '#74C8F8';
const SHADE = '#4EA8E9';
const DEEP = '#3A8FD4';

/** Raindrop: tip up, round part centred on (0,0) with radius R. */
export const Raindrop: React.FC<{R: number; face?: DropFace; ow?: number}> = ({R, face, ow = OW}) => {
  const id = useId().replace(/:/g, '');
  const d = dropPath(R);
  return (
    <Svg box={[-R - 20, -2.2 * R - 20, 2 * R + 40, 3.2 * R + 40]}>
      <defs>
        <clipPath id={`dc${id}`}>
          <path d={d} />
        </clipPath>
      </defs>
      <path d={d} fill={BLUE} />
      <g clipPath={`url(#dc${id})`}>
        <ellipse cx={R * 0.95} cy={R * 0.15} rx={R * 0.72} ry={R * 1.6} fill={SHADE} />
        <ellipse cx={R * 0.25} cy={R * 1.18} rx={R * 1.2} ry={R * 0.42} fill={DEEP} opacity={0.55} />
      </g>
      <ellipse cx={-R * 0.48} cy={-R * 0.42} rx={R * 0.13} ry={R * 0.26} transform={`rotate(24 ${-R * 0.48} ${-R * 0.42})`} fill="#fff" />
      <circle cx={-R * 0.38} cy={-R * 0.02} r={R * 0.07} fill="#fff" />
      <path d={d} fill="none" stroke={OUT} strokeWidth={ow} strokeLinejoin="round" />
      {face && <Face R={R} f={face} />}
    </Svg>
  );
};

const Face: React.FC<{R: number; f: DropFace}> = ({R, f}) => {
  const ex = R * 0.34;
  const ey = -R * 0.08;
  const rx = R * 0.17;
  const ry = R * 0.21;
  const look = f.look ?? {x: 0, y: 0};
  const brows = f.brows ?? 0;
  const eyes = f.eyes ?? 'open';
  const sw = Math.max(5, R * 0.045);
  const wk = eyes === 'wide' ? 1.15 : 1;
  return (
    <g>
      {[-1, 1].map((s) => {
        const cx = s * ex;
        if (eyes === 'closed') {
          return <path key={s} d={`M ${cx - rx} ${ey} Q ${cx} ${ey + ry * 0.6} ${cx + rx} ${ey}`} fill="none" stroke={OUT} strokeWidth={sw} strokeLinecap="round" />;
        }
        const ryy = eyes === 'squint' ? ry * 0.55 : ry * wk;
        const px = cx + look.x * rx * 0.45;
        const py = ey + look.y * ryy * 0.4 + (eyes === 'squint' ? ry * 0.1 : 0);
        return (
          <g key={s}>
            <ellipse cx={cx} cy={ey} rx={rx * wk} ry={ryy} fill="#fff" stroke={OUT} strokeWidth={sw} />
            <circle cx={px} cy={py} r={Math.min(rx, ryy) * (eyes === 'wide' ? 0.42 : 0.55)} fill={OUT} />
            <circle cx={px - rx * 0.18} cy={py - ryy * 0.22} r={rx * 0.16} fill="#fff" />
          </g>
        );
      })}
      {/* brows: inner ends are towards x = 0 */}
      <g stroke={OUT} strokeWidth={sw * 1.5} strokeLinecap="round">
        {[-1, 1].map((s) => {
          const cx = s * ex;
          const by = ey - ry * wk - R * 0.1;
          const a = R * 0.09 * brows; // + worried: inner end up
          const inner = cx - s * rx * 0.95;
          const outer = cx + s * rx * 0.95;
          return <path key={s} d={`M ${outer} ${by + a * 0.4} L ${inner} ${by - a}`} />;
        })}
      </g>
      <DropMouth R={R} mode={f.mouth ?? 'smile'} sw={sw} />
    </g>
  );
};

const DropMouth: React.FC<{R: number; mode: NonNullable<DropFace['mouth']>; sw: number}> = ({R, mode, sw}) => {
  const y = R * 0.36;
  const w = R * 0.22;
  switch (mode) {
    case 'smirk':
      return <path d={`M ${-w} ${y} Q ${0} ${y + R * 0.14} ${w * 1.1} ${y - R * 0.1}`} fill="none" stroke={OUT} strokeWidth={sw} strokeLinecap="round" />;
    case 'o':
      return <ellipse cx={0} cy={y + R * 0.04} rx={R * 0.08} ry={R * 0.11} fill={OUT} />;
    case 'grit':
      return (
        <g>
          <rect x={-w} y={y - R * 0.07} width={2 * w} height={R * 0.16} rx={R * 0.05} fill="#fff" stroke={OUT} strokeWidth={sw} />
          <path d={`M ${-w * 0.33} ${y - R * 0.07} v ${R * 0.16} M ${w * 0.33} ${y - R * 0.07} v ${R * 0.16}`} stroke={OUT} strokeWidth={sw * 0.7} />
        </g>
      );
    case 'flat':
      return <path d={`M ${-w * 0.7} ${y} L ${w * 0.7} ${y}`} stroke={OUT} strokeWidth={sw} strokeLinecap="round" />;
    case 'grin':
      return (
        <g>
          <path d={`M ${-w} ${y - R * 0.04} Q 0 ${y + R * 0.3} ${w} ${y - R * 0.04} Z`} fill={OUT} />
          <path d={`M ${-w * 0.45} ${y + R * 0.1} Q 0 ${y + R * 0.04} ${w * 0.45} ${y + R * 0.1} Q 0 ${y + R * 0.2} ${-w * 0.45} ${y + R * 0.1}`} fill="#F27B97" />
        </g>
      );
    default:
      return <path d={`M ${-w} ${y} Q 0 ${y + R * 0.16} ${w} ${y}`} fill="none" stroke={OUT} strokeWidth={sw} strokeLinecap="round" />;
  }
};

/** Small background rain drop, stretched by speed. */
export const RainBit: React.FC<{x: number; y: number; r: number; stretch: number; tilt: number; outline: string; fill: string}> = ({
  x,
  y,
  r,
  stretch,
  tilt,
  outline,
  fill,
}) => (
  <path
    d={dropPath(r)}
    transform={`translate(${x} ${y}) rotate(${tilt}) scale(1 ${stretch})`}
    fill={fill}
    stroke={outline}
    strokeWidth={Math.max(2, r * 0.32)}
    vectorEffect="non-scaling-stroke"
  />
);
