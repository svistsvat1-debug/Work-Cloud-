import React, {useId} from 'react';
import {Svg} from '../camera';
import {OUT, OW, lerp} from '../util';

type P = [number, number];
const mix = (a: P, b: P, u: number): P => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];

export const SweatDrop: React.FC<{x: number; y: number; s: number; rot?: number}> = ({x, y, s, rot = 0}) =>
  s <= 0.01 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d="M 0 -30 C 7 -16 17 -5 17 7 A 17 17 0 0 1 -17 7 C -17 -5 -7 -16 0 -30 Z" fill="#8FD3FF" stroke={OUT} strokeWidth={5} />
      <ellipse cx={-6} cy={3} rx={4} ry={7} fill="#fff" />
    </g>
  );

/* ------------------------------------------------------------------ Guy */
export type GuyPose = {
  point?: number; // 0..1 right arm points at own chest
  scared?: number; // 0..1 arms up
  eyes?: 'dot' | 'wide' | 'squeeze';
  look?: {x: number; y: number};
  brows?: number; // + worried
  mouth?: 'smile' | 'open' | 'oh' | 'flat';
  sweat?: number;
  sweatSlide?: number;
  headTurn?: number; // -1..1 shifts face features sideways
};

const ARM_REST: [P, P] = [[-74, -104], [-78, -58]];
const ARM_UP: [P, P] = [[-104, -206], [-96, -268]];
const ARM_POINT: [P, P] = [[84, -112], [24, -124]]; // right arm across chest (in right-arm coords)

export const Guy: React.FC<GuyPose> = ({
  point = 0,
  scared = 0,
  eyes = 'dot',
  look = {x: 0, y: 0},
  brows = 0,
  mouth = 'smile',
  sweat = 0,
  sweatSlide = 0,
  headTurn = 0,
}) => {
  const id = useId().replace(/:/g, '');
  const hx = 0;
  const hy = -268;
  const fx = headTurn * 16; // face shift
  const shL: P = [-42, -156];
  const shR: P = [42, -156];
  // left arm (viewer's left)
  let lE = mix(ARM_REST[0], ARM_UP[0], scared);
  let lH = mix(ARM_REST[1], ARM_UP[1], scared);
  // right arm mirrored
  const mir = (p: P): P => [-p[0], p[1]];
  let rE = mix(mir(ARM_REST[0]), mir(ARM_UP[0]), scared);
  let rH = mix(mir(ARM_REST[1]), mir(ARM_UP[1]), scared);
  rE = mix(rE, ARM_POINT[0], point);
  rH = mix(rH, ARM_POINT[1], point);
  const arm = (s: P, e: P, h: P) => `M ${s[0]} ${s[1]} Q ${e[0]} ${e[1]} ${h[0]} ${h[1]}`;

  const ex = 33;
  const ey = -276;
  const eyeEl = (sgn: number) => {
    const cx = hx + sgn * ex + fx;
    if (eyes === 'squeeze') {
      return (
        <path
          key={sgn}
          d={`M ${cx - 12 * sgn} ${ey - 13} L ${cx + 10 * sgn} ${ey} L ${cx - 12 * sgn} ${ey + 13}`}
          fill="none"
          stroke={OUT}
          strokeWidth={8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      );
    }
    const k = eyes === 'wide' ? 1.3 : 1;
    return <ellipse key={sgn} cx={cx + look.x * 7} cy={ey + look.y * 7} rx={11 * k} ry={17 * k} fill={OUT} />;
  };

  const browY = ey - 36 - (eyes === 'wide' ? 8 : 0);
  const mouthEl = () => {
    const mx = hx + fx;
    const my = -222;
    switch (mouth) {
      case 'open':
        return (
          <g>
            <path d={`M ${mx - 26} ${my - 8} Q ${mx} ${my + 46} ${mx + 26} ${my - 8} Q ${mx} ${my - 18} ${mx - 26} ${my - 8} Z`} fill={OUT} />
            <path d={`M ${mx - 13} ${my + 18} Q ${mx} ${my + 8} ${mx + 13} ${my + 18} Q ${mx} ${my + 30} ${mx - 13} ${my + 18}`} fill="#F27B97" />
          </g>
        );
      case 'oh':
        return <ellipse cx={mx} cy={my + 4} rx={10} ry={13} fill={OUT} />;
      case 'flat':
        return <path d={`M ${mx - 16} ${my + 2} L ${mx + 16} ${my + 2}`} stroke={OUT} strokeWidth={6} strokeLinecap="round" />;
      default:
        return <path d={`M ${mx - 20} ${my - 4} Q ${mx} ${my + 14} ${mx + 20} ${my - 4}`} fill="none" stroke={OUT} strokeWidth={6} strokeLinecap="round" />;
    }
  };

  return (
    <Svg box={[-200, -420, 400, 440]}>
      <defs>
        <clipPath id={`gh${id}`}>
          <circle cx={hx} cy={hy} r={100} />
        </clipPath>
        <clipPath id={`gb${id}`}>
          <path d="M -46 -176 Q -64 -92 -52 -42 Q 0 -24 52 -42 Q 64 -92 46 -176 Z" />
        </clipPath>
      </defs>
      {/* legs */}
      {[-1, 1].map((s) => (
        <g key={s}>
          <rect x={s * 24 - 14} y={-60} width={28} height={52} fill="#fff" stroke={OUT} strokeWidth={OW} />
          <ellipse cx={s * 30} cy={-8} rx={30} ry={14} fill="#fff" stroke={OUT} strokeWidth={OW} />
        </g>
      ))}
      {/* body */}
      <path d="M -46 -176 Q -64 -92 -52 -42 Q 0 -24 52 -42 Q 64 -92 46 -176 Z" fill="#fff" />
      <g clipPath={`url(#gb${id})`}>
        <ellipse cx={58} cy={-100} rx={40} ry={100} fill="#E6E6EC" />
      </g>
      <path d="M -46 -176 Q -64 -92 -52 -42 Q 0 -24 52 -42 Q 64 -92 46 -176 Z" fill="none" stroke={OUT} strokeWidth={OW} />
      {/* arms */}
      {[
        [shL, lE, lH],
        [shR, rE, rH],
      ].map(([s, e, h], i) => (
        <g key={i}>
          <path d={arm(s as P, e as P, h as P)} fill="none" stroke={OUT} strokeWidth={22} strokeLinecap="round" />
          <path d={arm(s as P, e as P, h as P)} fill="none" stroke="#fff" strokeWidth={9} strokeLinecap="round" />
          <circle cx={(h as P)[0]} cy={(h as P)[1]} r={15} fill="#fff" stroke={OUT} strokeWidth={6} />
        </g>
      ))}
      {/* head */}
      <circle cx={hx} cy={hy} r={100} fill="#fff" />
      <g clipPath={`url(#gh${id})`}>
        <circle cx={hx + 72} cy={hy + 26} r={84} fill="#E6E6EC" />
        <circle cx={hx - 16} cy={hy - 12} r={98} fill="#fff" />
      </g>
      <circle cx={hx} cy={hy} r={100} fill="none" stroke={OUT} strokeWidth={OW} />
      {eyeEl(-1)}
      {eyeEl(1)}
      <g stroke={OUT} strokeWidth={8} strokeLinecap="round" fill="none">
        {[-1, 1].map((s) => {
          const cx = hx + s * ex + fx;
          const a = 7 * brows;
          // inner end (towards centre) goes up when worried
          return <path key={s} d={`M ${cx + s * 16} ${browY + a * 0.3} Q ${cx} ${browY - 6} ${cx - s * 16} ${browY - a}`} />;
        })}
      </g>
      {mouthEl()}
      <SweatDrop x={-76 + 8 * sweatSlide} y={-322 + 60 * sweatSlide} s={sweat} rot={-16} />
    </Svg>
  );
};

/* ------------------------------------------------------------------ Bus (front view) */
export const Bus: React.FC<{look?: {x: number; y: number}; anger?: number; mouth?: 'grin' | 'open'}> = ({
  look = {x: 0, y: 0},
  anger = 1,
  mouth = 'grin',
}) => {
  const body = 'M -330 -40 L -330 -560 Q -330 -640 -250 -640 L 250 -640 Q 330 -640 330 -560 L 330 -40 Z';
  return (
    <Svg box={[-420, -680, 840, 700]}>
      {/* mirrors */}
      {[-1, 1].map((s) => (
        <g key={s}>
          <path d={`M ${s * 326} -470 L ${s * 376} -496`} stroke={OUT} strokeWidth={10} strokeLinecap="round" />
          <ellipse cx={s * 388} cy={-462} rx={20} ry={38} fill="#5A5664" stroke={OUT} strokeWidth={OW} />
        </g>
      ))}
      {/* wheels */}
      {[-1, 1].map((s) => (
        <rect key={s} x={s * 250 - 50} y={-80} width={100} height={80} rx={22} fill="#2A2730" stroke={OUT} strokeWidth={OW} />
      ))}
      <path d={body} fill="#FFC83D" />
      <rect x={-330} y={-200} width={660} height={160} fill="#F2A23A" />
      <path d={body} fill="none" stroke={OUT} strokeWidth={OW} strokeLinejoin="round" />
      {/* destination sign */}
      <rect x={-200} y={-618} width={400} height={56} rx={12} fill="#2C2A33" stroke={OUT} strokeWidth={OW} />
      <rect x={-170} y={-600} width={120} height={18} rx={6} fill="#FFB84D" />
      {/* windshield */}
      <rect x={-290} y={-540} width={580} height={210} rx={30} fill="#BFE7FF" stroke={OUT} strokeWidth={OW} />
      <path d="M -230 -540 L -300 -380 M -170 -540 L -232 -400" stroke="#fff" strokeWidth={20} strokeLinecap="round" opacity={0.9} />
      <rect x={-8} y={-540} width={16} height={210} fill={OUT} />
      {/* headlight eyes */}
      {[-1, 1].map((s) => (
        <g key={s}>
          <circle cx={s * 196} cy={-246} r={54} fill="#FFFBE6" stroke={OUT} strokeWidth={OW} />
          <circle cx={s * 196 + look.x * 16} cy={-246 + look.y * 16} r={24} fill={OUT} />
          <circle cx={s * 196 + look.x * 16 - 8} cy={-254 + look.y * 16} r={8} fill="#fff" />
          {/* angry brows: inner end down */}
          <path
            d={`M ${s * 266} ${-318 - 10 * anger} L ${s * 132} ${-318 + 22 * anger}`}
            stroke={OUT}
            strokeWidth={22}
            strokeLinecap="round"
          />
        </g>
      ))}
      {/* grille mouth */}
      {mouth === 'grin' ? (
        <g>
          <path d="M -120 -196 Q 0 -150 120 -196 L 110 -128 Q 0 -96 -110 -128 Z" fill={OUT} />
          {[-80, -40, 0, 40, 80].map((x) => (
            <rect key={x} x={x - 16} y={-186 + Math.abs(x) * 0.12} width={32} height={30} rx={5} fill="#fff" />
          ))}
        </g>
      ) : (
        <ellipse cx={0} cy={-150} rx={100} ry={48} fill={OUT} />
      )}
      {/* bumper */}
      <rect x={-344} y={-96} width={688} height={52} rx={20} fill="#5A5664" stroke={OUT} strokeWidth={OW} />
    </Svg>
  );
};

/* ------------------------------------------------------------------ Balance scale */
export const SCALE = {pivotY: -560, arm: 320, hang: 180};

export const scaleEnds = (angleDeg: number) => {
  const a = (angleDeg * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return {
    L: {x: -SCALE.arm * c, y: SCALE.pivotY - SCALE.arm * s},
    R: {x: SCALE.arm * c, y: SCALE.pivotY + SCALE.arm * s},
  };
};

const Pan: React.FC<{x: number; y: number}> = ({x, y}) => {
  const py = y + SCALE.hang;
  return (
    <g>
      <path d={`M ${x} ${y} L ${x - 120} ${py} M ${x} ${y} L ${x + 120} ${py}`} stroke={OUT} strokeWidth={5} />
      <path d={`M ${x - 140} ${py} Q ${x} ${py + 96} ${x + 140} ${py} Z`} fill="#D9E0EA" stroke={OUT} strokeWidth={OW} strokeLinejoin="round" />
      <path d={`M ${x - 112} ${py + 22} Q ${x} ${py + 70} ${x + 112} ${py + 22}`} fill="none" stroke="#B9C3D2" strokeWidth={10} strokeLinecap="round" />
      <circle cx={x} cy={y} r={11} fill="#E0B84A" stroke={OUT} strokeWidth={5} />
    </g>
  );
};

/** Pans are drawn by the scene (so contents can sit between pan back and front). This draws stand + beam + pans. */
export const ScaleArt: React.FC<{angle: number}> = ({angle}) => {
  const e = scaleEnds(angle);
  return (
    <Svg box={[-520, -820, 1040, 840]}>
      <path d="M -170 0 L 170 0 L 100 -56 L -100 -56 Z" fill="#9AA3B5" stroke={OUT} strokeWidth={OW} strokeLinejoin="round" />
      <rect x={-20} y={SCALE.pivotY} width={40} height={-SCALE.pivotY - 56} fill="#B8C0CF" stroke={OUT} strokeWidth={OW} />
      <g transform={`translate(0 ${SCALE.pivotY}) rotate(${angle})`}>
        <rect x={-SCALE.arm - 14} y={-15} width={2 * SCALE.arm + 28} height={30} rx={15} fill="#C3CAD7" stroke={OUT} strokeWidth={OW} />
      </g>
      <circle cx={0} cy={SCALE.pivotY} r={28} fill="#E0B84A" stroke={OUT} strokeWidth={OW} />
      <circle cx={-8} cy={SCALE.pivotY - 8} r={7} fill="#FFF1C2" />
      <Pan x={e.L.x} y={e.L.y} />
      <Pan x={e.R.x} y={e.R.y} />
    </Svg>
  );
};
