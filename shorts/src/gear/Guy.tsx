import React from 'react';
import {INK, W} from './util';

// The main character, drawn in code in the flat cut-out style:
// white round-head guy, small soft body, noodle arms, short legs, thick even black outlines.
// Local coordinates: feet centre at (0,0), y up = negative. Faces to the right (3/4 view).

export type PoseName = 'point' | 'ears' | 'chin' | 'shock' | 'watch' | 'sleep' | 'shrug';
export type FaceName = 'curious' | 'squeeze' | 'think' | 'shock' | 'bored' | 'sleep' | 'startled' | 'happy';
type Hand = 'mitt' | 'point' | 'open';
type Arm = {hand: [number, number]; ctrl: [number, number]; type: Hand; ang?: number};
type Pose = {back: Arm; front: Arm; armsOnTop?: boolean; watch?: [number, number, number]};

const SH_B: [number, number] = [-44, -208];
const SH_F: [number, number] = [46, -208];

const POSES: Record<PoseName, Pose> = {
  point: {back: {hand: [-84, -116], ctrl: [-72, -168], type: 'mitt'}, front: {hand: [170, -232], ctrl: [112, -204], type: 'point', ang: 14}},
  ears: {back: {hand: [-98, -318], ctrl: [-118, -236], type: 'open'}, front: {hand: [108, -318], ctrl: [126, -236], type: 'open'}, armsOnTop: true},
  chin: {back: {hand: [-80, -118], ctrl: [-70, -170], type: 'mitt'}, front: {hand: [40, -262], ctrl: [104, -186], type: 'mitt'}, armsOnTop: true},
  shock: {back: {hand: [-132, -150], ctrl: [-98, -192], type: 'open'}, front: {hand: [140, -158], ctrl: [104, -196], type: 'open'}},
  watch: {back: {hand: [-74, -138], ctrl: [-104, -186], type: 'mitt'}, front: {hand: [104, -224], ctrl: [104, -156], type: 'mitt'}, watch: [104, -262, 0]},
  sleep: {back: {hand: [-76, -116], ctrl: [-68, -168], type: 'mitt'}, front: {hand: [86, -146], ctrl: [74, -176], type: 'mitt'}, watch: [92, -120, 18]},
  shrug: {back: {hand: [-134, -252], ctrl: [-112, -168], type: 'open'}, front: {hand: [142, -254], ctrl: [116, -168], type: 'open'}},
};

const armPath = (sh: [number, number], a: Arm) => `M ${sh[0]} ${sh[1]} Q ${a.ctrl[0]} ${a.ctrl[1]} ${a.hand[0]} ${a.hand[1]}`;

const ArmTube: React.FC<{sh: [number, number]; a: Arm}> = ({sh, a}) => {
  const d = armPath(sh, a);
  const [hx, hy] = a.hand;
  const ang = ((a.ang ?? 0) * Math.PI) / 180;
  return (
    <g>
      <path d={d} fill="none" stroke={INK} strokeWidth={13 + 2 * W} strokeLinecap="round" />
      {a.type === 'point' && (
        <line x1={hx} y1={hy} x2={hx + Math.cos(ang) * 26} y2={hy + Math.sin(ang) * 26} stroke={INK} strokeWidth={9 + 2 * W} strokeLinecap="round" />
      )}
      <circle cx={hx} cy={hy} r={16 + W / 2} fill={INK} />
      {a.type === 'open' && <circle cx={hx + (hx > 0 ? 10 : -10)} cy={hy - 12} r={7 + W / 2} fill={INK} />}
      <path d={d} fill="none" stroke="#fff" strokeWidth={13} strokeLinecap="round" />
      {a.type === 'point' && <line x1={hx} y1={hy} x2={hx + Math.cos(ang) * 26} y2={hy + Math.sin(ang) * 26} stroke="#fff" strokeWidth={9} strokeLinecap="round" />}
      <circle cx={hx} cy={hy} r={16 - W / 2} fill="#fff" />
      {a.type === 'open' && <circle cx={hx + (hx > 0 ? 10 : -10)} cy={hy - 12} r={7 - W / 2 + 1} fill="#fff" />}
    </g>
  );
};

export const Stopwatch: React.FC<{x: number; y: number; rot: number; hand: number}> = ({x, y, rot, hand}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <rect x={-6} y={-40} width={12} height={12} rx={3} fill="#c8d1d8" stroke={INK} strokeWidth={5} />
    <circle cx={0} cy={-6} r={27} fill="#e9eef2" stroke={INK} strokeWidth={6} />
    <circle cx={0} cy={-6} r={19} fill="#fff" />
    <line x1={0} y1={-6} x2={Math.sin((hand * Math.PI) / 180) * 15} y2={-6 - Math.cos((hand * Math.PI) / 180) * 15} stroke="#e8483a" strokeWidth={4} strokeLinecap="round" />
    <circle cx={0} cy={-6} r={3.5} fill={INK} />
  </g>
);

// ---- face -------------------------------------------------------------------------------------
const EX = [-4, 40];
const EY = -322;

const Eyes: React.FC<{face: FaceName; look: [number, number]; blink: number}> = ({face, look, blink}) => {
  const [lx, ly] = look;
  if (face === 'squeeze') {
    return (
      <g stroke={INK} strokeWidth={6} fill="none" strokeLinecap="round" strokeLinejoin="round">
        <polyline points={`${EX[0] - 11},${EY - 11} ${EX[0] + 7},${EY} ${EX[0] - 11},${EY + 11}`} />
        <polyline points={`${EX[1] + 11},${EY - 11} ${EX[1] - 7},${EY} ${EX[1] + 11},${EY + 11}`} />
      </g>
    );
  }
  if (face === 'sleep') {
    return (
      <g stroke={INK} strokeWidth={5.5} fill="none" strokeLinecap="round">
        {EX.map((x) => (
          <path key={x} d={`M ${x - 10} ${EY - 2} Q ${x} ${EY + 9} ${x + 10} ${EY - 2}`} />
        ))}
      </g>
    );
  }
  if (face === 'shock' || face === 'startled') {
    return (
      <g>
        {EX.map((x) => (
          <g key={x}>
            <ellipse cx={x} cy={EY} rx={14} ry={17} fill="#fff" stroke={INK} strokeWidth={5} />
            <circle cx={x + lx * 5} cy={EY + ly * 6} r={6.5} fill={INK} />
          </g>
        ))}
      </g>
    );
  }
  // solid oval eyes (default style) with optional half lids
  const ry = 12 * (1 - blink * 0.92);
  return (
    <g>
      {EX.map((x) => (
        <g key={x}>
          <ellipse cx={x + lx * 3} cy={EY + ly * 3} rx={8} ry={Math.max(1.2, ry)} fill={INK} />
          {face === 'bored' && (
            <>
              <rect x={x - 13} y={EY - 18} width={26} height={16} fill="#fff" />
              <line x1={x - 11} y1={EY - 2} x2={x + 11} y2={EY - 2} stroke={INK} strokeWidth={4.5} strokeLinecap="round" />
            </>
          )}
        </g>
      ))}
    </g>
  );
};

const Brows: React.FC<{face: FaceName}> = ({face}) => {
  // [inner raise, outer raise] for each brow (positive = up)
  const cfg: Record<FaceName, [number, number, number]> = {
    curious: [6, 3, 0],
    think: [2, 8, 0],
    squeeze: [10, -2, 0],
    shock: [14, 10, 0],
    startled: [14, 10, 0],
    bored: [-2, -2, 0],
    sleep: [0, 0, 0],
    happy: [4, 10, 0],
  };
  const [inner, outer] = cfg[face];
  const y0 = -348;
  const L = `M ${EX[0] - 14} ${y0 - outer} Q ${EX[0]} ${y0 - 6 - (inner + outer) / 2} ${EX[0] + 12} ${y0 - inner}`;
  const Rp = `M ${EX[1] - 12} ${y0 - inner} Q ${EX[1]} ${y0 - 6 - (inner + outer) / 2} ${EX[1] + 14} ${y0 - outer}`;
  return (
    <g stroke={INK} strokeWidth={5.5} fill="none" strokeLinecap="round">
      <path d={L} />
      <path d={Rp} />
    </g>
  );
};

const Mouth: React.FC<{face: FaceName; talk: number}> = ({face}) => {
  const mx = 22;
  const my = -282;
  switch (face) {
    case 'shock':
      return (
        <g>
          <ellipse cx={mx} cy={my + 6} rx={15} ry={21} fill={INK} />
          <ellipse cx={mx} cy={my + 17} rx={9} ry={7} fill="#f08a9a" />
        </g>
      );
    case 'squeeze':
      return (
        <g>
          <rect x={mx - 20} y={my - 8} width={40} height={18} rx={7} fill="#fff" stroke={INK} strokeWidth={5} />
          <line x1={mx - 7} y1={my - 7} x2={mx - 7} y2={my + 9} stroke={INK} strokeWidth={3} />
          <line x1={mx + 7} y1={my - 7} x2={mx + 7} y2={my + 9} stroke={INK} strokeWidth={3} />
        </g>
      );
    case 'sleep':
      return <ellipse cx={mx} cy={my + 2} rx={6} ry={7.5} fill={INK} />;
    case 'startled':
      return <ellipse cx={mx} cy={my + 2} rx={8} ry={10} fill={INK} />;
    case 'bored':
      return <line x1={mx - 12} y1={my} x2={mx + 12} y2={my + 1} stroke={INK} strokeWidth={5.5} strokeLinecap="round" />;
    case 'happy':
      return <path d={`M ${mx - 20} ${my - 4} Q ${mx + 2} ${my + 18} ${mx + 22} ${my - 8}`} stroke={INK} strokeWidth={5.5} fill="none" strokeLinecap="round" />;
    case 'think':
      return <path d={`M ${mx - 12} ${my + 2} Q ${mx} ${my - 4} ${mx + 12} ${my + 2}`} stroke={INK} strokeWidth={5.5} fill="none" strokeLinecap="round" />;
    default:
      return <path d={`M ${mx - 13} ${my - 2} Q ${mx} ${my + 9} ${mx + 13} ${my - 2}`} stroke={INK} strokeWidth={5.5} fill="none" strokeLinecap="round" />;
  }
};

const Beard: React.FC<{amt: number}> = ({amt}) => {
  if (amt <= 0.001) return null;
  // fluffy white beard hanging from the chin; grows downward from the jaw line
  const d =
    'M -62 -300 Q -66 -250 -50 -214 Q -40 -186 -22 -192 Q -12 -168 6 -180 Q 20 -160 36 -178 Q 54 -164 64 -190 Q 82 -196 84 -230 Q 92 -268 82 -300 Q 60 -262 22 -262 Q -22 -262 -62 -300 Z';
  return (
    <g transform={`translate(0 -300) scale(${0.35 + 0.65 * amt} ${amt}) translate(0 300)`}>
      <path d={d} fill="#fff" stroke={INK} strokeWidth={W} strokeLinejoin="round" />
      <path d="M -30 -236 Q -20 -214 -8 -224 M 30 -232 Q 40 -210 52 -222" stroke="#c9ccd6" strokeWidth={5} fill="none" strokeLinecap="round" />
    </g>
  );
};

export type GuyProps = {
  pose: PoseName;
  face: FaceName;
  look?: [number, number];
  blink?: number;
  beard?: number;
  headTilt?: number;
  watchHand?: number;
};

export const GuyDrawing: React.FC<GuyProps> = ({pose, face, look = [0, 0], blink = 0, beard = 0, headTilt = 0, watchHand = 0}) => {
  const P = POSES[pose];
  const backArm = <ArmTube sh={SH_B} a={P.back} />;
  const frontArm = <ArmTube sh={SH_F} a={P.front} />;
  const body = 'M -50 -226 C -64 -200 -72 -152 -68 -120 C -64 -80 -50 -60 0 -58 C 50 -60 64 -80 68 -120 C 72 -152 64 -200 50 -226 C 30 -252 -30 -252 -50 -226 Z';
  return (
    <g>
      {/* legs + feet */}
      <g strokeLinecap="round">
        <line x1={-24} y1={-80} x2={-28} y2={-18} stroke={INK} strokeWidth={16 + 2 * W} />
        <line x1={28} y1={-80} x2={32} y2={-18} stroke={INK} strokeWidth={16 + 2 * W} />
        <line x1={-24} y1={-80} x2={-28} y2={-18} stroke="#fff" strokeWidth={16} />
        <line x1={28} y1={-80} x2={32} y2={-18} stroke="#fff" strokeWidth={16} />
      </g>
      <ellipse cx={-20} cy={-12} rx={30} ry={14} fill="#fff" stroke={INK} strokeWidth={W} />
      <ellipse cx={44} cy={-12} rx={31} ry={14} fill="#fff" stroke={INK} strokeWidth={W} />
      {!P.armsOnTop && backArm}
      {/* body with a soft shade on the left */}
      <defs>
        <clipPath id="guyBody">
          <path d={body} />
        </clipPath>
        <clipPath id="guyHead">
          <circle cx={6} cy={-318} r={88} />
        </clipPath>
      </defs>
      <path d={body} fill="#e3e5ee" />
      <g clipPath="url(#guyBody)">
        <ellipse cx={12} cy={-150} rx={74} ry={110} fill="#fff" />
      </g>
      <path d={body} fill="none" stroke={INK} strokeWidth={W} />
      {!P.armsOnTop && frontArm}
      {/* head */}
      <g transform={`rotate(${headTilt} 0 -240)`}>
        <circle cx={6} cy={-318} r={88} fill="#e3e5ee" />
        <g clipPath="url(#guyHead)">
          <circle cx={18} cy={-326} r={86} fill="#fff" />
        </g>
        <circle cx={6} cy={-318} r={88} fill="none" stroke={INK} strokeWidth={W} />
        <Brows face={face} />
        <Eyes face={face} look={look} blink={blink} />
        <Mouth face={face} talk={0} />
        <Beard amt={beard} />
      </g>
      {P.armsOnTop && backArm}
      {P.armsOnTop && frontArm}
      {P.watch && <Stopwatch x={P.watch[0]} y={P.watch[1]} rot={P.watch[2]} hand={watchHand} />}
    </g>
  );
};
