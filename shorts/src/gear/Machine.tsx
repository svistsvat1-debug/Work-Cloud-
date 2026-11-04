import React from 'react';
import {INK, W, clamp} from './util';

// ---- geometry (world px on the Z=1000 plane) ---------------------------------------------------
export const GROUND_Y = 1700;
export const N_WHEELS = 12;
export const R_WHEEL = 70;
export const R_PINION = 28;
const DY = Math.sqrt(90 * 90 - 55 * 55); // 71.24: wheel i+1 meshes with the pinion on wheel i
export const WHEELS = Array.from({length: N_WHEELS}, (_, i) => ({
  x: i % 2 === 0 ? 735 : 790,
  y: 1452 - (N_WHEELS - 1 - i) * DY,
}));
export const LAST = WHEELS[N_WHEELS - 1];
// mesh points: 0 = worm -> wheel 1, i = pinion on wheel i -> wheel i+1
export const MESH = [
  {x: WHEELS[0].x, y: WHEELS[0].y - R_WHEEL},
  ...WHEELS.slice(0, -1).map((w, i) => {
    const n = WHEELS[i + 1];
    return {x: w.x + ((n.x - w.x) * R_PINION) / 90, y: w.y + ((n.y - w.y) * R_PINION) / 90};
  }),
];
export const CONCRETE = {x0: 610, x1: 910, y0: 1455, y1: GROUND_Y + 4};
export const MOTOR = {x0: 560, x1: 682, y0: 548, y1: 626};
export const FACE = {x: 760, y: 1588};

// ---- speeds: the real thing (200 rpm motor, twelve 1:50 stages) ---------------------------------
export const MOTOR_DEG_PER_S = (200 / 60) * 360; // 1200 deg/s
export const wheelAngle = (i: number, t: number) => {
  const w = MOTOR_DEG_PER_S / Math.pow(50, i + 1); // wheel 1 = 24 deg/s, wheel 2 = 0.48 deg/s, ...
  const dir = i % 2 === 0 ? 1 : -1;
  return dir * w * t + i * 37; // fixed phase so teeth/holes don't line up
};

const gearPath = (n: number, rTip: number, rRoot: number) => {
  const p = (Math.PI * 2) / n;
  const pts: string[] = [];
  for (let k = 0; k < n; k++) {
    const a = k * p;
    const q = (r: number, ang: number) => `${(r * Math.cos(ang)).toFixed(2)},${(r * Math.sin(ang)).toFixed(2)}`;
    pts.push(q(rRoot, a - 0.27 * p), q(rTip, a - 0.13 * p), q(rTip, a + 0.13 * p), q(rRoot, a + 0.27 * p));
  }
  return `M ${pts.join(' L ')} Z`;
};
const WHEEL_D = gearPath(50, R_WHEEL, R_WHEEL - 8);
const PINION_D = gearPath(10, R_PINION, R_PINION - 7);

const Wheel: React.FC<{i: number; t: number; marker?: boolean}> = ({i, t, marker}) => {
  const c = WHEELS[i];
  const fill = i % 2 === 0 ? '#f7c548' : '#f4b23c';
  const hole = i % 2 === 0 ? '#d99a2b' : '#d48d26';
  return (
    <g transform={`translate(${c.x} ${c.y}) rotate(${wheelAngle(i, t)})`}>
      <path d={WHEEL_D} fill={fill} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <circle r={R_WHEEL - 15} fill="none" stroke={hole} strokeWidth={3} />
      {[0, 1, 2, 3, 4].map((k) => (
        <circle key={k} cx={Math.cos((k * 2 * Math.PI) / 5) * 38} cy={Math.sin((k * 2 * Math.PI) / 5) * 38} r={10} fill={hole} stroke={INK} strokeWidth={4} />
      ))}
      {marker && <path d="M 30 -44 L 46 -50 L 40 -32 Z" fill="#e8483a" stroke={INK} strokeWidth={4} strokeLinejoin="round" />}
    </g>
  );
};

const Pinion: React.FC<{i: number; t: number}> = ({i, t}) => {
  const c = WHEELS[i];
  return (
    <g transform={`translate(${c.x} ${c.y}) rotate(${wheelAngle(i, t) * 1 + 9})`}>
      <path d={PINION_D} fill="#e8604a" stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
      <circle r={9} fill="#5b6770" stroke={INK} strokeWidth={4} />
      <line x1={0} y1={0} x2={0} y2={-6} stroke="#cfd6db" strokeWidth={3} strokeLinecap="round" />
    </g>
  );
};

const Hub: React.FC<{i: number}> = ({i}) => {
  const c = WHEELS[i];
  return <circle cx={c.x} cy={c.y} r={10} fill="#5b6770" stroke={INK} strokeWidth={4} />;
};

// Motor + worm on the top of wheel 1. The worm's stripes move at exactly the speed of wheel 1's rim.
const Motor: React.FC<{t: number; bump: number; jx: number; jy: number}> = ({t, bump, jx, jy}) => {
  const fan = (MOTOR_DEG_PER_S * t) % 360;
  const pitch = (2 * Math.PI * R_WHEEL) / 50; // 8.8 px
  const wormShift = ((MOTOR_DEG_PER_S / 360) * pitch * t) % pitch;
  const wx0 = 698;
  const wx1 = 774;
  const wy = WHEELS[0].y - R_WHEEL - 11;
  const cx = (MOTOR.x0 + MOTOR.x1) / 2;
  const cy = (MOTOR.y0 + MOTOR.y1) / 2;
  return (
    <g>
      {/* shelf */}
      <rect x={548} y={MOTOR.y1 - 2} width={110} height={16} rx={4} fill="#45606e" stroke={INK} strokeWidth={W - 1} />
      <g transform={`translate(${jx} ${jy}) translate(${cx} ${MOTOR.y1}) scale(${1 + bump * 0.6} ${1 - bump}) translate(${-cx} ${-MOTOR.y1})`}>
        {/* shaft + coupling */}
        <rect x={MOTOR.x1 - 4} y={wy - 5} width={wx0 - MOTOR.x1 + 8} height={10} fill="#b9c3ca" stroke={INK} strokeWidth={4} />
        {/* body */}
        <rect x={MOTOR.x0} y={MOTOR.y0} width={MOTOR.x1 - MOTOR.x0} height={MOTOR.y1 - MOTOR.y0} rx={20} fill="#ea5a43" stroke={INK} strokeWidth={W} />
        <path d={`M ${MOTOR.x0 + 14} ${MOTOR.y0 + 10} L ${MOTOR.x0 + 14} ${MOTOR.y1 - 10}`} stroke="#c9402f" strokeWidth={6} strokeLinecap="round" />
        {[0, 1, 2].map((k) => (
          <line key={k} x1={MOTOR.x1 - 30 + k * 9} y1={MOTOR.y0 + 14} x2={MOTOR.x1 - 30 + k * 9} y2={MOTOR.y1 - 14} stroke="#c9402f" strokeWidth={5} strokeLinecap="round" />
        ))}
        {/* cooling fan on the front: turns at the real 200 rpm */}
        <circle cx={cx - 8} cy={cy} r={26} fill="#f3f0ea" stroke={INK} strokeWidth={6} />
        <g transform={`translate(${cx - 8} ${cy}) rotate(${fan})`}>
          {[0, 90, 180, 270].map((a) => (
            <path key={a} transform={`rotate(${a})`} d="M 0 0 Q 8 -6 4 -20 Q -2 -14 0 0 Z" fill="#7c8a94" stroke={INK} strokeWidth={3.5} strokeLinejoin="round" />
          ))}
          <circle r={5} fill={INK} />
        </g>
        {/* exhaust pipe */}
        <rect x={MOTOR.x0 + 26} y={MOTOR.y0 - 16} width={18} height={20} rx={4} fill="#7c8a94" stroke={INK} strokeWidth={5} />
      </g>
      {/* worm screw */}
      <defs>
        <clipPath id="wormClip">
          <rect x={wx0} y={wy - 11} width={wx1 - wx0} height={22} rx={8} />
        </clipPath>
      </defs>
      <rect x={wx0} y={wy - 11} width={wx1 - wx0} height={22} rx={8} fill="#cfd8de" />
      <g clipPath="url(#wormClip)">
        {Array.from({length: 14}, (_, k) => {
          const x = wx0 - 20 + k * pitch + wormShift;
          return <line key={k} x1={x} y1={wy + 13} x2={x + 9} y2={wy - 13} stroke="#7c8a94" strokeWidth={3.5} />;
        })}
      </g>
      <rect x={wx0} y={wy - 11} width={wx1 - wx0} height={22} rx={8} fill="none" stroke={INK} strokeWidth={5} />
      <rect x={wx1} y={wy - 9} width={14} height={18} rx={3} fill="#45606e" stroke={INK} strokeWidth={4} />
    </g>
  );
};

const Panel: React.FC = () => {
  const x0 = 642;
  const x1 = 884;
  const y0 = 600;
  const y1 = CONCRETE.y0 + 20;
  const rivets = [];
  for (let y = y0 + 26; y < y1 - 10; y += 120) rivets.push(y);
  return (
    <g>
      <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} rx={16} fill="#5d7d8e" stroke={INK} strokeWidth={W} />
      <rect x={x1 - 34} y={y0 + 12} width={22} height={y1 - y0 - 24} rx={8} fill="#52707f" />
      {rivets.map((y) => (
        <g key={y}>
          <circle cx={x0 + 16} cy={y} r={5} fill="#46626f" stroke={INK} strokeWidth={3} />
          <circle cx={x1 - 16} cy={y} r={5} fill="#46626f" stroke={INK} strokeWidth={3} />
        </g>
      ))}
    </g>
  );
};

export const Concrete: React.FC<{sx: number; sy: number}> = ({sx, sy}) => {
  const {x0, x1, y0, y1} = CONCRETE;
  const cx = (x0 + x1) / 2;
  const top = `M ${x0 + 12} ${y1} L ${x0} ${y1} L ${x0} ${y0 + 18} Q ${x0} ${y0} ${x0 + 18} ${y0}
    L ${LAST.x - 74} ${y0} Q ${LAST.x - 64} ${y0 - 10} ${LAST.x - 50} ${y0 - 6}
    Q ${LAST.x} ${y0 - 14} ${LAST.x + 50} ${y0 - 6} Q ${LAST.x + 64} ${y0 - 10} ${LAST.x + 74} ${y0}
    L ${x1 - 18} ${y0} Q ${x1} ${y0} ${x1} ${y0 + 18} L ${x1} ${y1} Z`;
  return (
    <g transform={`translate(${cx} ${y1}) scale(${sx} ${sy}) translate(${-cx} ${-y1})`}>
      <defs>
        <clipPath id="concClip">
          <path d={top} />
        </clipPath>
      </defs>
      <path d={top} fill="#c4c4bc" />
      <g clipPath="url(#concClip)">
        <rect x={x1 - 46} y={y0 - 20} width={60} height={y1 - y0 + 30} fill="#afafa7" />
        {[
          [650, 1500, 7],
          [690, 1660, 5],
          [840, 1520, 6],
          [880, 1640, 8],
          [640, 1600, 4],
          [860, 1585, 4],
          [700, 1475, 4],
        ].map(([x, y, r], k) => (
          <ellipse key={k} cx={x} cy={y} rx={r} ry={r * 0.8} fill="#a3a39a" />
        ))}
      </g>
      <path d={top} fill="none" stroke={INK} strokeWidth={W} strokeLinejoin="round" />
    </g>
  );
};

export const MachineBack: React.FC<{t: number; motorBump: number; motorJitter: {x: number; y: number}}> = ({t, motorBump, motorJitter}) => (
  <g>
    <Panel />
    {WHEELS.map((_, i) => (
      <g key={i}>
        <Wheel i={i} t={t} marker={i === N_WHEELS - 1} />
        {i < N_WHEELS - 1 ? <Pinion i={i} t={t} /> : <Hub i={i} />}
      </g>
    ))}
    <Motor t={t} bump={motorBump} jx={motorJitter.x} jy={motorJitter.y} />
  </g>
);

// Eyes / brows / mouth on the concrete block ("objects come alive")
export type ConcreteFaceState = {
  open: number; // 0..1 scale of the whole face (pop in / out)
  lid: number; // 0 open .. 1 closed
  look: [number, number];
  brow: number; // -1 angry .. 0 flat .. +1 worried/raised
  squeeze: boolean;
  mouth: 'none' | 'worry' | 'o' | 'flat' | 'smile' | 'sleep';
};

export const ConcreteFace: React.FC<{s: ConcreteFaceState}> = ({s}) => {
  if (s.open <= 0.001) return null;
  const eyes = [
    [FACE.x - 46, FACE.y],
    [FACE.x + 46, FACE.y],
  ];
  return (
    <g transform={`translate(${FACE.x} ${FACE.y}) scale(${s.open}) translate(${-FACE.x} ${-FACE.y})`}>
      {eyes.map(([x, y], k) => {
        if (s.squeeze) {
          const d = k === 0 ? 1 : -1;
          return (
            <polyline
              key={k}
              points={`${x - 14 * d},${y - 14} ${x + 10 * d},${y} ${x - 14 * d},${y + 14}`}
              fill="none"
              stroke={INK}
              strokeWidth={7}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        }
        const lidY = y - 30 + 60 * clamp(s.lid);
        return (
          <g key={k}>
            <defs>
              <clipPath id={`ceye${k}`}>
                <ellipse cx={x} cy={y} rx={24} ry={29} />
              </clipPath>
            </defs>
            <ellipse cx={x} cy={y} rx={24} ry={29} fill="#fff" />
            <g clipPath={`url(#ceye${k})`}>
              <circle cx={x + s.look[0] * 10} cy={y + s.look[1] * 12} r={10} fill={INK} />
              <circle cx={x + s.look[0] * 10 + 3.5} cy={y + s.look[1] * 12 - 4} r={3.2} fill="#fff" />
              {s.lid > 0.01 && (
                <>
                  <rect x={x - 30} y={y - 40} width={60} height={lidY - (y - 40)} fill="#9e9e96" />
                  <line x1={x - 30} y1={lidY} x2={x + 30} y2={lidY} stroke={INK} strokeWidth={5} />
                </>
              )}
            </g>
            <ellipse cx={x} cy={y} rx={24} ry={29} fill="none" stroke={INK} strokeWidth={6} />
          </g>
        );
      })}
      {/* brows */}
      {eyes.map(([x, y], k) => {
        const d = k === 0 ? -1 : 1; // outer side
        const inner = y - 44 - s.brow * 9;
        const outer = y - 44 + s.brow * 5;
        return <line key={`b${k}`} x1={x - d * 14} y1={inner} x2={x + d * 20} y2={outer} stroke={INK} strokeWidth={9} strokeLinecap="round" />;
      })}
      {/* mouth */}
      {s.mouth === 'worry' && <path d={`M ${FACE.x - 26} ${FACE.y + 58} q 9 -9 17 0 q 9 9 17 0 q 9 -9 18 0`} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />}
      {s.mouth === 'o' && <ellipse cx={FACE.x} cy={FACE.y + 58} rx={10} ry={12} fill={INK} />}
      {s.mouth === 'sleep' && <ellipse cx={FACE.x} cy={FACE.y + 58} rx={7} ry={6} fill={INK} />}
      {s.mouth === 'flat' && <line x1={FACE.x - 16} y1={FACE.y + 58} x2={FACE.x + 16} y2={FACE.y + 58} stroke={INK} strokeWidth={6} strokeLinecap="round" />}
      {s.mouth === 'smile' && <path d={`M ${FACE.x - 26} ${FACE.y + 50} Q ${FACE.x} ${FACE.y + 72} ${FACE.x + 28} ${FACE.y + 48}`} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />}
    </g>
  );
};
