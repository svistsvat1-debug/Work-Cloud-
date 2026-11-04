import React from 'react';
import {INK, mulberry32} from './util';

// All art is drawn in world px at depth Z 1000 (1 world px = 1 screen px when the camera is at rest).
// Flat colours + one soft shade + thick even black outlines, so everything reads as one cut-out family.

const OL = 7; // main outline weight

// ------------------------------------------------------------------ eyes
export type EyeState = {
  open: number; // 1 open, 0 closed
  lookX: number; // -1..1
  lookY: number;
  squeeze?: boolean; // "> <"
  spiral?: number; // dazed spiral phase (eagle after the zap)
};

const Eye: React.FC<{
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  side: -1 | 1;
  s: EyeState;
  lid: string;
  sclera?: string;
  pupil?: number;
  ol?: number;
  id: string;
}> = ({cx, cy, rx, ry, side, s, lid, sclera = '#fff', pupil = 0.5, ol = 5, id}) => {
  if (s.squeeze) {
    const d = rx * 0.75;
    // ">" on the left eye, "<" on the right eye
    const p = side < 0 ? `M${cx - d},${cy - d} L${cx + d * 0.9},${cy} L${cx - d},${cy + d}` : `M${cx + d},${cy - d} L${cx - d * 0.9},${cy} L${cx + d},${cy + d}`;
    return <path d={p} fill="none" stroke={INK} strokeWidth={ol + 1.5} strokeLinecap="round" strokeLinejoin="round" />;
  }
  const o = Math.max(0, Math.min(1, s.open));
  if (o < 0.08) {
    return <path d={`M${cx - rx},${cy + 2} Q${cx},${cy + ry * 0.55} ${cx + rx},${cy + 2}`} fill="none" stroke={INK} strokeWidth={ol} strokeLinecap="round" />;
  }
  const pr = Math.min(rx, ry) * pupil;
  const px = cx + s.lookX * (rx - pr) * 0.8;
  const py = cy + s.lookY * (ry - pr) * 0.8;
  const lidY = cy - ry + 2 * ry * (1 - o);
  return (
    <g>
      <defs>
        <clipPath id={id}>
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} />
        </clipPath>
      </defs>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={sclera} />
      <g clipPath={`url(#${id})`}>
        {s.spiral !== undefined ? (
          <path d={spiralPath(cx, cy, Math.min(rx, ry) * 0.85, s.spiral)} fill="none" stroke={INK} strokeWidth={ol * 0.75} strokeLinecap="round" />
        ) : (
          <>
            <circle cx={px} cy={py} r={pr} fill={INK} />
            <circle cx={px + pr * 0.35} cy={py - pr * 0.4} r={pr * 0.32} fill="#fff" />
          </>
        )}
        {o < 0.999 && (
          <>
            <rect x={cx - rx - 2} y={cy - ry - 2} width={rx * 2 + 4} height={lidY - (cy - ry) + 2} fill={lid} />
            <line x1={cx - rx} y1={lidY} x2={cx + rx} y2={lidY} stroke={INK} strokeWidth={ol * 0.8} />
          </>
        )}
      </g>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke={INK} strokeWidth={ol} />
    </g>
  );
};

const spiralPath = (cx: number, cy: number, r: number, phase: number) => {
  let d = '';
  const turns = 2.2;
  for (let i = 0; i <= 60; i++) {
    const u = i / 60;
    const a = phase + u * turns * Math.PI * 2;
    const rr = r * u;
    d += `${i ? 'L' : 'M'}${(cx + Math.cos(a) * rr).toFixed(1)},${(cy + Math.sin(a) * rr).toFixed(1)}`;
  }
  return d;
};

// ------------------------------------------------------------------ small bird (front view, feet at 0,0)
export type BirdPose = {
  eyes: EyeState;
  brow: number; // >0 angry (inner ends down), <0 worried (inner ends up)
  browUp: number; // raise in px
  beak: number; // 0 closed .. 1 open
  wingL: number; // deg, 0 = hanging at the side, + = out/up
  wingR: number;
  footLift: number; // 0..1 lifts the foot on the right side of the image
  toeWiggle: number; // radians phase
  boots: number; // 0..1 scale of the rubber boots
  tuft: number; // 0..1 tuft standing up
  blush?: number;
};

const B = {fill: '#FFD23F', shade: '#F2B52A', belly: '#FFF1BF', wing: '#F0B323', leg: '#FF9A3C', beak: '#FF8A2B', cheek: '#FF9F80'};

const Toes: React.FC<{fx: number; fy: number; wig: number; color: string; s?: number; claw?: boolean}> = ({fx, fy, wig, color, s = 1, claw}) => {
  const toes = [-1, 0, 1].map((k) => {
    const a = (k * 32 + Math.sin(wig + k * 1.3) * 14) * (Math.PI / 180);
    const L = (k === 0 ? 14 : 12) * s;
    return [fx + Math.sin(a) * L, fy + Math.cos(a) * L] as const;
  });
  return (
    <g>
      {toes.map(([x, y], i) => (
        <line key={'o' + i} x1={fx} y1={fy - 2 * s} x2={x} y2={y} stroke={INK} strokeWidth={11 * s} strokeLinecap="round" />
      ))}
      {toes.map(([x, y], i) => (
        <line key={'f' + i} x1={fx} y1={fy - 2 * s} x2={x} y2={y} stroke={color} strokeWidth={4.6 * s} strokeLinecap="round" />
      ))}
      {claw && toes.map(([x, y], i) => <circle key={'c' + i} cx={x} cy={y} r={3.2 * s} fill={INK} />)}
    </g>
  );
};

export const Bird: React.FC<{pose: BirdPose; id: string}> = ({pose, id}) => {
  const {eyes, brow, browUp, beak, wingL, wingR, footLift, toeWiggle, boots, tuft} = pose;
  const fxL = -19;
  const fxR = 19 + footLift * 8;
  const fyR = -footLift * 34;
  const by = -146 - browUp;
  const legTop = -36;
  const Boot = ({fx, fy}: {fx: number; fy: number}) =>
    boots > 0.01 ? (
      <g transform={`translate(${fx},${fy + 6}) scale(${boots}) translate(${-fx},${-(fy + 6)})`}>
        <path d={`M${fx - 13},${fy - 34} L${fx + 11},${fy - 34} L${fx + 13},${fy - 8} Q${fx + 24},${fy - 6} ${fx + 24},${fy + 4} L${fx + 24},${fy + 8} L${fx - 15},${fy + 8} L${fx - 15},${fy - 8} Z`} fill="#E8453C" stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
        <rect x={fx - 15} y={fy + 1} width={39} height={7} fill="#fff" stroke={INK} strokeWidth={4} />
        <path d={`M${fx - 9},${fy - 28} L${fx - 9},${fy - 14}`} stroke="#FF8C84" strokeWidth={4} strokeLinecap="round" />
      </g>
    ) : null;
  return (
    <g>
      <defs>
        <clipPath id={id + 'body'}>
          <circle cx={0} cy={-100} r={66} />
        </clipPath>
      </defs>
      {/* legs */}
      {[
        [fxL, 0],
        [fxR, fyR],
      ].map(([fx, fy], i) => (
        <g key={i}>
          <line x1={i ? 16 : -16} y1={legTop} x2={fx} y2={fy - 4} stroke={INK} strokeWidth={12} strokeLinecap="round" />
          <line x1={i ? 16 : -16} y1={legTop} x2={fx} y2={fy - 4} stroke={B.leg} strokeWidth={5} strokeLinecap="round" />
        </g>
      ))}
      {/* body */}
      <circle cx={0} cy={-100} r={66} fill={B.shade} />
      <g clipPath={`url(#${id}body)`}>
        <circle cx={-9} cy={-107} r={63} fill={B.fill} />
        <ellipse cx={-2} cy={-70} rx={42} ry={33} fill={B.belly} />
      </g>
      <circle cx={0} cy={-100} r={66} fill="none" stroke={INK} strokeWidth={OL} />
      {/* tuft */}
      <g transform={`rotate(${-8 + tuft * 18}, 0, -164)`}>
        <path d={`M-2,-163 C-18,-182 -10,${-200 - tuft * 14} 6,${-190 - tuft * 10} C0,-180 4,-172 -2,-163 Z`} fill={B.fill} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
      </g>
      <g transform={`rotate(${10 + tuft * 22}, 4, -164)`}>
        <path d={`M4,-164 C10,-182 26,${-186 - tuft * 10} 22,${-170 - tuft * 6} C16,-170 10,-166 4,-164 Z`} fill={B.fill} stroke={INK} strokeWidth={5.5} strokeLinejoin="round" />
      </g>
      {/* cheeks */}
      <ellipse cx={-45} cy={-86} rx={10} ry={6} fill={B.cheek} opacity={0.75} />
      <ellipse cx={45} cy={-86} rx={10} ry={6} fill={B.cheek} opacity={0.75} />
      {/* eyes */}
      <Eye cx={-25} cy={-112} rx={17} ry={21} side={-1} s={eyes} lid={B.fill} id={id + 'eL'} />
      <Eye cx={25} cy={-112} rx={17} ry={21} side={1} s={eyes} lid={B.fill} id={id + 'eR'} />
      {/* brows */}
      <path d={`M-40,${by - brow * 0.3} Q-26,${by - 6 - brow * 0.2} -12,${by + brow}`} fill="none" stroke={INK} strokeWidth={6.5} strokeLinecap="round" />
      <path d={`M40,${by - brow * 0.3} Q26,${by - 6 - brow * 0.2} 12,${by + brow}`} fill="none" stroke={INK} strokeWidth={6.5} strokeLinecap="round" />
      {/* beak */}
      {beak < 0.05 ? (
        <path d="M-13,-93 L13,-93 L0,-73 Z" fill={B.beak} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      ) : (
        <g>
          <ellipse cx={0} cy={-84 + beak * 4} rx={9} ry={4 + beak * 7} fill="#7A2430" stroke={INK} strokeWidth={4} />
          <path d={`M-13,${-95 - beak * 2} L13,${-95 - beak * 2} L0,${-82 - beak * 2} Z`} fill={B.beak} stroke={INK} strokeWidth={5} strokeLinejoin="round" />
          <path d={`M-9,${-80 + beak * 8} L9,${-80 + beak * 8} L0,${-69 + beak * 8} Z`} fill={B.beak} stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
        </g>
      )}
      {/* wings */}
      <g transform={`translate(-58,-112) rotate(${18 + wingL})`}>
        <path d="M2,-6 C-22,6 -26,50 -6,76 C9,54 15,20 10,-4 Z" fill={B.wing} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      </g>
      <g transform={`translate(58,-112) scale(-1,1) rotate(${18 + wingR})`}>
        <path d="M2,-6 C-22,6 -26,50 -6,76 C9,54 15,20 10,-4 Z" fill={B.wing} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      </g>
      {/* toes over the wire */}
      <Toes fx={fxL} fy={-2} wig={0} color={B.leg} />
      <Toes fx={fxR} fy={fyR - 2} wig={toeWiggle} color={B.leg} />
      <Boot fx={fxL} fy={-2} />
      <Boot fx={fxR} fy={fyR - 2} />
    </g>
  );
};

// ------------------------------------------------------------------ eagle (front view, feet at 0,0)
export type EaglePose = {
  eyes: EyeState;
  brow: number;
  beak: number;
  wingL: number; // deg; 0 = folded down the side; -90 = straight out; -160 = up
  wingR: number;
  frizz: number; // 0..1
  skeleton: boolean;
  glow: number; // 0..1 electric outline
};

const E = {body: '#7A4A2A', shade: '#62391E', chest: '#8E5A35', wing: '#6A3F22', wingDark: '#4E2D17', head: '#FFFFFF', headShade: '#E2E2E6', beak: '#FFC21A', leg: '#FFC21A', eye: '#FFD84D'};
export const EAGLE_SHOULDER = {x: 80, y: -218};
export const EAGLE_WING_LEN = 236;

const WING_PATH = 'M0,-12 C-40,8 -54,120 -30,200 L-24,236 L-12,208 L-3,238 L5,206 L14,228 C26,140 24,40 14,-10 Z';

const wingTransform = (side: -1 | 1, a: number) =>
  side < 0 ? `translate(${-EAGLE_SHOULDER.x},${EAGLE_SHOULDER.y}) rotate(${-a})` : `translate(${EAGLE_SHOULDER.x},${EAGLE_SHOULDER.y}) scale(-1,1) rotate(${-a})`;

const spiky = (cx: number, cy: number, r0: number, r1: number, n: number, seed: number) => {
  const R = mulberry32(seed);
  let d = '';
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2 + R() * 0.12;
    const r = i % 2 ? r0 : r1 * (0.85 + R() * 0.3);
    d += `${i ? 'L' : 'M'}${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`;
  }
  return d + 'Z';
};

export const Eagle: React.FC<{pose: EaglePose; id: string}> = ({pose, id}) => {
  const {eyes, brow, beak, wingL, wingR, frizz, skeleton, glow} = pose;
  const Wing = ({side, a}: {side: -1 | 1; a: number}) => (
    <g transform={wingTransform(side, a)}>
      <path d={WING_PATH} fill={skeleton ? '#141414' : E.wing} stroke={INK} strokeWidth={OL} strokeLinejoin="round" />
      {!skeleton && <path d="M-12,40 C-20,90 -18,140 -10,190 M2,30 C0,90 4,140 6,186" fill="none" stroke={E.wingDark} strokeWidth={5} strokeLinecap="round" />}
      {skeleton && <path d="M0,0 L-6,120 L-12,210 M-6,120 L6,200" fill="none" stroke="#fff" strokeWidth={9} strokeLinecap="round" />}
    </g>
  );
  const legs = (
    <g>
      {[-30, 30].map((x) => (
        <g key={x}>
          <line x1={x * 0.9} y1={-70} x2={x} y2={-6} stroke={INK} strokeWidth={19} strokeLinecap="round" />
          <line x1={x * 0.9} y1={-70} x2={x} y2={-6} stroke={skeleton ? '#fff' : E.leg} strokeWidth={9} strokeLinecap="round" />
          <Toes fx={x} fy={-2} wig={0} color={skeleton ? '#fff' : E.leg} s={1.35} claw />
        </g>
      ))}
    </g>
  );
  const glowStroke = glow > 0 ? <g opacity={1}>{/* electric outline */}</g> : null;
  return (
    <g>
      <defs>
        <clipPath id={id + 'body'}>
          <ellipse cx={0} cy={-152} rx={92} ry={108} />
        </clipPath>
        <clipPath id={id + 'head'}>
          <circle cx={0} cy={-272} r={64} />
        </clipPath>
      </defs>
      {glowStroke}
      {glow > 0 && (
        <g fill="none" stroke="#FFE04A" strokeWidth={22 * glow} strokeLinejoin="round">
          <ellipse cx={0} cy={-152} rx={98} ry={114} />
          <circle cx={0} cy={-272} r={70} />
        </g>
      )}
      {legs}
      {/* frizz spikes behind body & head */}
      {frizz > 0 && !skeleton && (
        <g>
          <path d={spiky(0, -152, 92, 92 + 26 * frizz, 16, 3)} fill={E.body} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
          <path d={spiky(0, -272, 62, 62 + 30 * frizz, 13, 9)} fill={E.head} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        </g>
      )}
      {/* body */}
      <ellipse cx={0} cy={-152} rx={92} ry={108} fill={skeleton ? '#141414' : E.shade} />
      {!skeleton && (
        <g clipPath={`url(#${id}body)`}>
          <ellipse cx={-12} cy={-160} rx={88} ry={106} fill={E.body} />
          {[-110, -80, -50].map((y, i) => (
            <path key={i} d={`M${-26 + i * 4},${y} L${-14 + i * 4},${y + 12} L${-2 + i * 4},${y} M${10 - i * 2},${y + 8} L${22 - i * 2},${y + 20} L${34 - i * 2},${y + 8}`} fill="none" stroke={E.chest} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {frizz > 0 && (
            <g opacity={0.9}>
              <ellipse cx={-30} cy={-120} rx={26 * frizz} ry={18 * frizz} fill="#3B302A" />
              <ellipse cx={34} cy={-170} rx={20 * frizz} ry={14 * frizz} fill="#3B302A" />
            </g>
          )}
        </g>
      )}
      <ellipse cx={0} cy={-152} rx={92} ry={108} fill="none" stroke={INK} strokeWidth={OL} />
      {skeleton && (
        <g fill="none" stroke="#fff" strokeLinecap="round" strokeWidth={10}>
          <line x1={0} y1={-215} x2={0} y2={-70} />
          {[-190, -160, -130, -100].map((y, i) => (
            <path key={i} d={`M-6,${y} Q-50,${y + 4} -${54 - i * 6},${y + 26} M6,${y} Q50,${y + 4} ${54 - i * 6},${y + 26}`} strokeWidth={8} />
          ))}
          <path d="M-40,-62 Q0,-40 40,-62" strokeWidth={9} />
        </g>
      )}
      {/* neck ruff */}
      {!skeleton && <path d="M-60,-226 L-48,-206 L-34,-222 L-20,-202 L-6,-220 L8,-200 L22,-220 L36,-204 L50,-222 L62,-206 L58,-240 L-58,-240 Z" fill={E.head} stroke={INK} strokeWidth={6} strokeLinejoin="round" />}
      {/* head */}
      <circle cx={0} cy={-272} r={64} fill={skeleton ? '#141414' : E.headShade} />
      {!skeleton && (
        <g clipPath={`url(#${id}head)`}>
          <circle cx={-8} cy={-280} r={61} fill={E.head} />
          {frizz > 0 && <ellipse cx={30} cy={-300} rx={22 * frizz} ry={14 * frizz} fill="#4A4440" opacity={0.85} />}
        </g>
      )}
      <circle cx={0} cy={-272} r={64} fill="none" stroke={INK} strokeWidth={OL} />
      {skeleton ? (
        <g>
          <circle cx={0} cy={-276} r={46} fill="none" stroke="#fff" strokeWidth={10} />
          <circle cx={-18} cy={-284} r={11} fill="#fff" />
          <circle cx={18} cy={-284} r={11} fill="#fff" />
          <path d="M-14,-252 L14,-252 L0,-232 Z" fill="#fff" />
        </g>
      ) : (
        <g>
          <Eye cx={-24} cy={-286} rx={14} ry={15} side={-1} s={eyes} lid={E.head} sclera={E.eye} pupil={0.5} id={id + 'eL'} />
          <Eye cx={24} cy={-286} rx={14} ry={15} side={1} s={eyes} lid={E.head} sclera={E.eye} pupil={0.5} id={id + 'eR'} />
          <path d={`M-48,${-314 - brow * 0.4} L-10,${-304 + brow}`} stroke={INK} strokeWidth={11} strokeLinecap="round" />
          <path d={`M48,${-314 - brow * 0.4} L10,${-304 + brow}`} stroke={INK} strokeWidth={11} strokeLinecap="round" />
          {beak > 0.05 && <ellipse cx={0} cy={-244 + beak * 8} rx={12} ry={6 + beak * 12} fill="#7A2430" stroke={INK} strokeWidth={5} />}
          <path d={`M-22,${-268 - beak * 4} Q0,${-288 - beak * 4} 22,${-268 - beak * 4} Q17,${-242 - beak * 4} 0,${-228 - beak * 2} Q-17,${-242 - beak * 4} -22,${-268 - beak * 4} Z`} fill={E.beak} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
          {beak > 0.05 && <path d={`M-13,${-238 + beak * 14} Q0,${-228 + beak * 16} 13,${-238 + beak * 14}`} fill={E.beak} stroke={INK} strokeWidth={5} strokeLinejoin="round" />}
          <circle cx={-6} cy={-268 - beak * 4} r={2.6} fill={INK} />
          <circle cx={6} cy={-268 - beak * 4} r={2.6} fill={INK} />
        </g>
      )}
      <Wing side={-1} a={wingL} />
      <Wing side={1} a={wingR} />
    </g>
  );
};

/** where the right-side wing tip is (eagle-local) for a wing angle */
export const eagleWingTip = (a: number) => {
  // right wing: translate(shoulder) scale(-1,1) rotate(-a) applied to (0, len)
  const r = (-a * Math.PI) / 180;
  const x0 = -Math.sin(r) * EAGLE_WING_LEN; // rotate (0,L): (-L sin r, L cos r)
  const y0 = Math.cos(r) * EAGLE_WING_LEN;
  return {x: EAGLE_SHOULDER.x - x0, y: EAGLE_SHOULDER.y + y0};
};

// ------------------------------------------------------------------ the spark ("Zip")
export const Spark: React.FC<{x: number; y: number; s: number; lookX?: number; lookY?: number; grin?: number; vx?: number; t: number; squash?: number}> = ({x, y, s, lookX = 0, lookY = 0, grin = 0, vx = 0, t, squash = 1}) => {
  if (s <= 0.01) return null;
  const R = mulberry32(11);
  const wob = Math.floor(t * 12);
  let d = '';
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + 0.1;
    const rr = i % 2 ? 17 : 31 + R() * 6 + ((wob + i) % 3) * 1.5;
    d += `${i ? 'L' : 'M'}${(Math.cos(a) * rr).toFixed(1)},${(Math.sin(a) * rr).toFixed(1)}`;
  }
  d += 'Z';
  const trail = Math.min(1, Math.abs(vx) / 900);
  const dir = vx >= 0 ? -1 : 1;
  return (
    <g transform={`translate(${x},${y}) scale(${s * (1 + 0.15 * trail) * (2 - squash)},${s * squash})`}>
      {trail > 0.05 &&
        [-12, 0, 12].map((yy, i) => {
          const L = 40 + 30 * trail + i * 6;
          const zz = `M${dir * 30},${yy} l${dir * L * 0.25},-7 l${dir * L * 0.25},14 l${dir * L * 0.25},-14 l${dir * L * 0.25},7`;
          return (
            <g key={i}>
              <path d={zz} fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
              <path d={zz} fill="none" stroke="#FFE04A" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
            </g>
          );
        })}
      <path d={d} fill="#FFE04A" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <circle cx={-9} cy={-4} r={7.5} fill="#fff" stroke={INK} strokeWidth={3} />
      <circle cx={9} cy={-4} r={7.5} fill="#fff" stroke={INK} strokeWidth={3} />
      <circle cx={-9 + lookX * 3} cy={-4 + lookY * 3} r={3.8} fill={INK} />
      <circle cx={9 + lookX * 3} cy={-4 + lookY * 3} r={3.8} fill={INK} />
      {grin > 0.05 ? (
        <path d={`M-9,7 Q0,${9 + grin * 12} 9,7 Z`} fill="#7A2430" stroke={INK} strokeWidth={3} strokeLinejoin="round" />
      ) : (
        <path d="M-6,9 Q0,13 6,9" fill="none" stroke={INK} strokeWidth={3} strokeLinecap="round" />
      )}
    </g>
  );
};

// ------------------------------------------------------------------ pole
export const Pole: React.FC<{x: number; glow: number}> = ({x, glow}) => (
  <g>
    {glow > 0 && (
      <g fill="none" stroke="#FFE04A" strokeWidth={16 * glow} strokeLinejoin="round">
        <rect x={x - 24} y={560} width={48} height={3000} />
        <rect x={x - 96} y={672} width={192} height={24} />
        <rect x={x - 96} y={1092} width={192} height={24} />
      </g>
    )}
    <rect x={x - 22} y={560} width={44} height={3000} fill="#8F5F36" stroke={INK} strokeWidth={OL} />
    <rect x={x + 8} y={564} width={10} height={2990} fill="#7A4F2B" />
    <path d={`M${x - 10},620 L${x - 10},700 M${x - 4},800 L${x - 4},900 M${x - 12},1180 L${x - 12},1280`} stroke="#6B4424" strokeWidth={4} strokeLinecap="round" />
    <path d={`M${x - 22},560 Q${x},544 ${x + 22},560 Z`} fill="#8F5F36" stroke={INK} strokeWidth={OL} strokeLinejoin="round" />
    {[672, 1092].map((y) => (
      <g key={y}>
        <rect x={x - 94} y={y} width={188} height={22} rx={3} fill="#7F5330" stroke={INK} strokeWidth={6} />
        {[x - 70, x + 70].map((ix) => (
          <path key={ix} d={`M${ix - 12},${y} L${ix - 9},${y - 12} L${ix - 14},${y - 14} L${ix - 9},${y - 24} L${ix + 9},${y - 24} L${ix + 14},${y - 14} L${ix + 9},${y - 12} L${ix + 12},${y} Z`} fill="#9FD6C2" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        ))}
      </g>
    ))}
  </g>
);

// ------------------------------------------------------------------ small effects
/** smoke / steam cluster with ONE merged outline */
export const Puffs: React.FC<{items: {x: number; y: number; r: number}[]; fill: string; ol?: number}> = ({items, fill, ol = 6}) => (
  <g>
    {items.map((c, i) => (c.r > 0.5 ? <circle key={'o' + i} cx={c.x} cy={c.y} r={c.r + ol} fill={INK} /> : null))}
    {items.map((c, i) => (c.r > 0.5 ? <circle key={'f' + i} cx={c.x} cy={c.y} r={c.r} fill={fill} /> : null))}
  </g>
);

export const Bolt: React.FC<{x0: number; y0: number; x1: number; y1: number; seed: number; amp?: number; n?: number; w?: number}> = ({x0, y0, x1, y1, seed, amp = 22, n = 7, w = 1}) => {
  const R = mulberry32(seed);
  const dx = x1 - x0;
  const dy = y1 - y0;
  const L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L;
  const ny = dx / L;
  let d = `M${x0},${y0}`;
  for (let i = 1; i < n; i++) {
    const u = i / n;
    const o = (R() * 2 - 1) * amp;
    d += ` L${(x0 + dx * u + nx * o).toFixed(1)},${(y0 + dy * u + ny * o).toFixed(1)}`;
  }
  d += ` L${x1},${y1}`;
  return (
    <g>
      <path d={d} fill="none" stroke={INK} strokeWidth={15 * w} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke="#FFE04A" strokeWidth={7 * w} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke="#FFFBE0" strokeWidth={2.2 * w} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};

/** contact dot with an expanding pulse ring (rings thin out instead of fading) */
export const Dot: React.FC<{x: number; y: number; s: number; color: string; t: number; phase?: number}> = ({x, y, s, color, t, phase = 0}) => {
  if (s <= 0.01) return null;
  const p = (t * 1.4 + phase) % 1;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      <circle r={14 + p * 26} fill="none" stroke={color} strokeWidth={7 * (1 - p)} />
      <circle r={14} fill={color} stroke={INK} strokeWidth={5} />
      <circle cx={-4} cy={-4} r={4} fill="#fff" />
    </g>
  );
};

export const Equals: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) =>
  s > 0.01 ? (
    <g transform={`translate(${x},${y}) scale(${s})`}>
      {[-9, 9].map((yy) => (
        <rect key={yy} x={-20} y={yy - 5} width={40} height={10} rx={5} fill="#fff" stroke={INK} strokeWidth={4.5} />
      ))}
    </g>
  ) : null;

export const Sweat: React.FC<{x: number; y: number; s: number; rot?: number}> = ({x, y, s, rot = 0}) =>
  s > 0.01 ? (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
      <path d="M0,-16 C9,-3 12,6 0,12 C-12,6 -9,-3 0,-16 Z" fill="#8FD8FF" stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
      <ellipse cx={-3} cy={3} rx={2.6} ry={4} fill="#fff" />
    </g>
  ) : null;

export const Note: React.FC<{x: number; y: number; s: number; rot?: number}> = ({x, y, s, rot = 0}) =>
  s > 0.01 ? (
    <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
      <ellipse cx={0} cy={0} rx={10} ry={7.5} transform="rotate(-20)" fill={INK} />
      <path d="M8,-3 L8,-38 Q18,-30 22,-20" fill="none" stroke={INK} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ) : null;

export const Feather: React.FC<{x: number; y: number; rot: number; s?: number}> = ({x, y, rot, s = 1}) => (
  <g transform={`translate(${x},${y}) rotate(${rot}) scale(${s})`}>
    <path d="M0,-28 C14,-16 12,14 0,28 C-12,14 -14,-16 0,-28 Z" fill={E.wing} stroke={INK} strokeWidth={4.5} strokeLinejoin="round" />
    <line x1={0} y1={-24} x2={0} y2={34} stroke={INK} strokeWidth={3.5} strokeLinecap="round" />
  </g>
);
