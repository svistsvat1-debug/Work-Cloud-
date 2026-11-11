import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {World} from '../shared/World';
import {Eye} from '../shared/Face';
import {PuffCluster, type Puff} from '../shared/Puffs';
import {SoundCues, type Cue} from '../shared/Sound';
import {useFont} from '../shared/useFont';
import {camAt, clamp, easeInOutCubic, easeOutCubic, lerp, pop, prog, rnd, shake, type Cam} from '../shared/anim';
import {SPR} from './sprites';
import {
  APEX, AX, AY, BAG_H, BAG_S, BAG_W, BG_S, C0, C4, CAM_A, CAM_B, CAM_C, CAM_D, CAM_E, DL, DM, DS, DURATION, FPS, HR, HR_A, HX, HY,
  LM_LEFT, LM_S, LM_TOP, MOON_Q, MOON_R, MOON_S, PILE_ANG, PILE_B, PRICE_KG, SKY_OFF, T, TOSS, TOSS_LAND, VO_AT, WEEK, WEEK_KG, far,
  poseBox,
} from './scene';

const FONT = 'MoonTrashInter';
export const useMoonFont = () => useFont(FONT, staticFile('fonts/Inter-Black.otf'));
const src = (n: string) => staticFile(`moon-trash/${n}.png`);
const S = SPR as unknown as Record<string, {w: number; h: number; head?: number[]; feet?: number[]; disc?: number[]; pad?: number; at?: number[]}>;

// sin bump 0 -> 1 -> 0 over dur (used for bounces that are not hidden by a swap)
const bump = (t: number, t0: number, dur: number) => (t < t0 || t > t0 + dur ? 0 : Math.sin((Math.PI * (t - t0)) / dur));
// damped spring that starts on a swap / impact frame
const ring = (t: number, t0: number, f = 3, d = 7) => (t < t0 ? 0 : Math.exp(-d * (t - t0)) * Math.cos(2 * Math.PI * f * (t - t0)));
const breathe = (t: number, ph = 0) => 1 + 0.009 * Math.sin(2 * Math.PI * 0.6 * t + ph);

const txt = (size: number, color = '#FFFFFF', stroke = 0.16): React.CSSProperties => ({
  fontFamily: FONT,
  fontSize: size,
  color,
  WebkitTextStroke: `${Math.round(size * stroke)}px #000`,
  paintOrder: 'stroke fill',
  lineHeight: 1,
  whiteSpace: 'nowrap',
});

// ---------------------------------------------------------------- small drawn things
// a character pose anchored at its feet, scaled / rotated about the feet
const Pose: React.FC<{n: string; fx: number; fy: number; hr?: number; sx?: number; sy?: number; rot?: number; dx?: number; dy?: number; shadow?: boolean}> = ({
  n, fx, fy, hr = HR, sx = 1, sy = 1, rot = 0, dx = 0, dy = 0, shadow = true,
}) => {
  const b = poseBox(n as never, fx, fy, hr);
  const fxl = (S[n].feet as number[])[0] * b.k;
  const fyl = (S[n].feet as number[])[1] * b.k;
  return (
    <>
      {shadow ? (
        <div
          style={{
            position: 'absolute', left: fx - hr * 1.15 + dx, top: fy - hr * 0.16, width: hr * 2.3, height: hr * 0.32, borderRadius: '50%',
            background: 'rgba(20, 40, 20, 0.30)', filter: 'blur(3px)', transform: `scaleX(${clamp(1 - dy / 600, 0.5, 1)})`,
          }}
        />
      ) : null}
      <Img
        src={src(n)}
        style={{
          position: 'absolute', left: b.left + dx, top: b.top + dy, width: b.width, height: b.height,
          transformOrigin: `${fxl}px ${fyl}px`, transform: `rotate(${rot}deg) scale(${sx}, ${sy})`,
        }}
      />
    </>
  );
};

// pose-local point -> world, with the same transform as <Pose>
const posePt = (n: string, px: number, py: number, fx: number, fy: number, hr = HR, sx = 1, sy = 1, rot = 0, dx = 0, dy = 0): [number, number] => {
  const b = poseBox(n as never, fx, fy, hr);
  const lx = (px - (S[n].feet as number[])[0]) * b.k * sx;
  const ly = (py - (S[n].feet as number[])[1]) * b.k * sy;
  const r = (rot * Math.PI) / 180;
  return [fx + dx + lx * Math.cos(r) - ly * Math.sin(r), fy + dy + lx * Math.sin(r) + ly * Math.cos(r)];
};

const BlackBag: React.FC<{x: number; y: number; rot?: number; sx?: number; sy?: number; scale?: number}> = ({x, y, rot = 0, sx = 1, sy = 1, scale = 1}) => {
  const w = S.trash_bag.w * BAG_S * scale;
  const h = S.trash_bag.h * BAG_S * scale;
  return (
    <Img
      src={src('trash_bag')}
      style={{position: 'absolute', left: x - w / 2, top: y - h / 2, width: w, height: h, transform: `rotate(${rot}deg) scale(${sx}, ${sy})`, transformOrigin: '50% 85%'}}
    />
  );
};

// price tag on a string from the bag's knot (world units; s = size factor)
const PriceTag: React.FC<{kx: number; ky: number; ang: number; s?: number; appear: number}> = ({kx, ky, ang, s = 0.8, appear}) => {
  if (appear <= 0.001) return null;
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
      <g transform={`translate(${kx} ${ky}) rotate(${ang}) scale(${s * appear})`}>
        <path d="M 0 0 C 40 -10 70 10 92 38" fill="none" stroke="#000" strokeWidth={5} strokeLinecap="round" />
        <g transform="translate(92 38) rotate(14)">
          <path d="M 0 -26 L 34 -62 L 270 -62 Q 286 -62 286 -46 L 286 46 Q 286 62 270 62 L 34 62 Z" fill="#FFF6D8" stroke="#000" strokeWidth={7} strokeLinejoin="round" />
          <circle cx={30} cy={0} r={10} fill="#1B2A5A" stroke="#000" strokeWidth={5} />
          <text x={160} y={8} textAnchor="middle" style={{fontFamily: FONT, fontSize: 41}} fill="#111">$1,200,000</text>
          <text x={162} y={46} textAnchor="middle" style={{fontFamily: FONT, fontSize: 28}} fill="#C0392B">PER KILO</text>
        </g>
      </g>
    </svg>
  );
};

// small white Apollo-style waste bag drawn in code (centre of the bottom at 0,0; w = width)
const WhiteBag: React.FC<{x: number; y: number; w: number; rot?: number; sx?: number; sy?: number; ink?: number}> = ({x, y, w, rot = 0, sx = 1, sy = 1, ink}) => {
  const h = w * 1.05;
  const sw = ink ?? Math.max(2, w * 0.07);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${sx} ${sy})`}>
      <path
        d={`M ${-w * 0.5} ${-h * 0.12} Q ${-w * 0.56} ${-h * 0.62} ${-w * 0.14} ${-h * 0.8} L ${w * 0.14} ${-h * 0.8} Q ${w * 0.56} ${-h * 0.62} ${w * 0.5} ${-h * 0.12} Q ${w * 0.48} 0 ${w * 0.3} 0 L ${-w * 0.3} 0 Q ${-w * 0.48} 0 ${-w * 0.5} ${-h * 0.12} Z`}
        fill="#F4F4F2" stroke="#000" strokeWidth={sw} strokeLinejoin="round"
      />
      <path d={`M ${-w * 0.22} ${-h * 0.3} Q ${-w * 0.3} ${-h * 0.55} ${-w * 0.08} ${-h * 0.7}`} fill="none" stroke="#D5D3CF" strokeWidth={sw * 0.9} strokeLinecap="round" />
      <path d={`M 0 ${-h * 0.8} L ${-w * 0.2} ${-h * 1.02} L ${-w * 0.02} ${-h * 0.9} L ${w * 0.18} ${-h * 1.04} Z`} fill="#F4F4F2" stroke="#000" strokeWidth={sw * 0.9} strokeLinejoin="round" />
    </g>
  );
};

const SweatDrop: React.FC<{x: number; y: number; r: number; s: number}> = ({x, y, r, s}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d={`M 0 ${-r * 1.7} C ${r * 0.9} ${-r * 0.4} ${r} ${r * 0.2} 0 ${r} C ${-r} ${r * 0.2} ${-r * 0.9} ${-r * 0.4} 0 ${-r * 1.7} Z`} fill="#8FD3FF" stroke="#000" strokeWidth={r * 0.18} />
      <ellipse cx={-r * 0.32} cy={-r * 0.1} rx={r * 0.16} ry={r * 0.3} fill="#fff" />
    </g>
  );

const Flame: React.FC<{x: number; y: number; s: number; t: number}> = ({x, y, s, t}) => {
  if (s <= 0.01) return null;
  const f = 1 + 0.12 * Math.sin(2 * Math.PI * 17 * t) + 0.08 * Math.sin(2 * Math.PI * 9.3 * t + 1);
  return (
    <g transform={`translate(${x} ${y}) scale(${s} ${s * f})`}>
      <path d="M -34 0 Q -30 60 0 120 Q 30 60 34 0 Z" fill="#FF6A2B" />
      <path d="M -20 0 Q -16 40 0 80 Q 16 40 20 0 Z" fill="#FFC867" />
    </g>
  );
};

const puffRing = (cx: number, cy: number, t: number, t0: number, n: number, spread: number, rMax: number, seed: number): Puff[] => {
  const u = (t - t0) / 0.9;
  if (u <= 0 || u >= 1) return [];
  const grow = u < 0.35 ? easeOutCubic(u / 0.35) : 1 - easeInOutCubic((u - 0.35) / 0.65);
  return Array.from({length: n}, (_, i) => {
    const a = Math.PI + (Math.PI * (i + 0.5)) / n + (rnd(seed + i) - 0.5) * 0.3;
    const d = spread * (0.4 + 0.6 * easeOutCubic(u)) * (0.7 + 0.5 * rnd(seed + 10 + i));
    return {x: cx + Math.cos(a) * d * 1.6, y: cy + Math.sin(a) * d * 0.45 - 8 * u, r: rMax * grow * (0.6 + 0.5 * rnd(seed + 20 + i))};
  });
};

// ---------------------------------------------------------------- the Moon (far layer): disc + face + Apollo pile
const MoonActor: React.FC<{t: number}> = ({t}) => {
  const [qx, qy] = MOON_Q;
  const R = MOON_R;
  const awake = t >= T.which;
  const disgust = t >= T.poop;
  // body motion: inhale before the stink, squash on it, head-shake "no" at the end
  const inhale = 0.05 * bump(t, T.some, T.poop - T.some + 0.05);
  const squash = disgust ? 0.07 * ring(t, T.poop, 2.6, 5) : 0;
  const snore = awake ? 0 : 0.012 * Math.sin(2 * Math.PI * 0.45 * t);
  const sy = 1 + inhale + snore - squash;
  const sx = 1 - inhale * 0.5 + squash * 0.6 - snore * 0.5;
  const shakeNo = t > 24.15 ? 7 * Math.sin(2 * Math.PI * 2.6 * (t - 24.15)) * clamp((24.95 - t) / 0.3) : 0;
  const w = S.moon.w * MOON_S;
  const h = S.moon.h * MOON_S;
  const disc = S.moon.disc as number[];
  const left = qx - disc[0] * MOON_S;
  const top = qy - disc[1] * MOON_S;
  // eyes
  const eyeOpen = awake ? pop(t, T.which, 0.28) : 0;
  let look: [number, number] = [0, 0];
  if (t >= T.theMoon && t < T.ninety - 0.1) look = [0.55, -0.75];
  if (t >= T.some && t < T.poop) look = [0.5, -0.8];
  const lid = t >= T.dump && t < T.some ? 0.32 : t >= T.some && t < T.poop ? 0.22 : 0;
  const browTilt = t >= T.dump && t < T.poop ? 0.9 : 0;
  const er = R * 0.15;
  const ex = R * 0.31;
  const ey = qy - R * 0.08;
  // mouth
  const my = qy + R * 0.33;
  let mouth: React.ReactNode;
  if (!awake) {
    const o = 0.7 + 0.3 * Math.sin(2 * Math.PI * 0.45 * t);
    mouth = <ellipse cx={qx} cy={my} rx={R * 0.07 * o} ry={R * 0.09 * o} fill="#5A2A2A" stroke="#000" strokeWidth={R * 0.022} />;
  } else if (!disgust) {
    const frown = t >= T.dump ? 1 : 0;
    mouth = <path d={`M ${qx - R * 0.16} ${my + frown * R * 0.03} Q ${qx} ${my - frown * R * 0.07} ${qx + R * 0.16} ${my + frown * R * 0.03}`} fill="none" stroke="#000" strokeWidth={R * 0.03} strokeLinecap="round" />;
  } else {
    const tg = pop(t, T.poop, 0.25);
    mouth = (
      <g>
        <ellipse cx={qx + R * 0.02} cy={my + R * 0.1 * tg} rx={R * 0.075} ry={R * 0.11 * tg} fill="#FC8D90" stroke="#000" strokeWidth={R * 0.022} />
        <path d={`M ${qx - R * 0.2} ${my} q ${R * 0.05} ${-R * 0.05} ${R * 0.1} 0 t ${R * 0.1} 0 t ${R * 0.1} 0 t ${R * 0.1} 0`} fill="none" stroke="#000" strokeWidth={R * 0.03} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    );
  }
  // while the bag hovers in front of it, the sleeping Moon peeks at it with one suspicious eye
  const peek = !awake ? pop(t, 5.45, 0.25) * (1 - prog(t, 6.92, 7.04)) : 0;
  const closed = (x: number) => (
    <path d={`M ${x - er * 0.85} ${ey} Q ${x} ${ey + er * 0.75} ${x + er * 0.85} ${ey}`} fill="none" stroke="#000" strokeWidth={R * 0.03} strokeLinecap="round" />
  );
  // pile of Apollo waste bags on the top-right shoulder
  const bw = R * 0.13;
  const pile: [number, number, number][] = [
    [-2.1, 0.25, -12], [-0.7, 0.18, 6], [0.7, 0.18, -5], [2.1, 0.25, 10],
    [-1.4, -0.7, 8], [0, -0.75, -6], [1.4, -0.7, 4],
    [-0.7, -1.62, -8], [0.7, -1.6, 9],
  ];
  const poopU = pop(t, T.astronaut, 0.3);
  const stinkU = clamp((t - T.poop) / 0.35);
  const greenU = disgust ? clamp((t - T.poop) / 0.2) : 0;
  const z = (i: number) => {
    const t0 = (i * 1.2) % 3.6;
    const u = (((t - t0) % 3.6) + 3.6) % 3.6 / 2.4;
    if (awake || u > 1) return null;
    const s = u < 0.3 ? u / 0.3 : 1 - Math.max(0, (u - 0.75) / 0.25);
    return (
      <text key={i} x={qx - R * 0.35 - u * R * 0.5} y={my - R * 0.1 - u * R * 0.75} textAnchor="middle" fill="#FFFFFF" stroke="#000" strokeWidth={R * 0.03} paintOrder="stroke"
        style={{fontFamily: FONT, fontSize: R * (0.16 + 0.08 * u)}} transform={`scale(1)`} opacity={1} fontWeight={900}>
        {s > 0.02 ? 'z' : ''}
      </text>
    );
  };
  const fly = t > T.poop + 0.1;
  const fa = (t - T.poop) * 7.5;
  const flyX = PILE_B[0] + Math.cos(fa) * R * 0.32 + Math.sin(fa * 2.3) * R * 0.04;
  const flyY = PILE_B[1] - R * 0.32 + Math.sin(fa) * R * 0.14;
  return (
    <div style={{position: 'absolute', left: 0, top: 0, transformOrigin: `${qx}px ${qy + R}px`, transform: `rotate(${shakeNo}deg) scale(${sx}, ${sy})`}}>
      <Img src={src('moon')} style={{position: 'absolute', left, top, width: w, height: h}} />
      <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
        {greenU > 0 ? <circle cx={qx} cy={qy} r={R * 0.985} fill="#7CC243" opacity={0.42 * greenU} style={{mixBlendMode: 'multiply'}} /> : null}
        {/* pile */}
        <g transform={`translate(${PILE_B[0]} ${PILE_B[1]}) rotate(${(PILE_ANG * 180) / Math.PI})`}>
          {pile.map(([px, py, r], i) => (
            <WhiteBag key={i} x={px * bw * 0.98} y={py * bw * 1.05 + bw * 0.25} w={bw} rot={r} sy={1 + 0.3 * bump(t, T.dump + i * 0.05, 0.24)} sx={1 - 0.12 * bump(t, T.dump + i * 0.05, 0.24)} />
          ))}
          {poopU > 0 ? (
            <g transform={`translate(${0.7 * bw} ${-1.6 * bw - bw * 0.62}) scale(${poopU})`}>
              <ellipse cx={0} cy={0} rx={bw * 0.42} ry={bw * 0.2} fill="#8B5A2B" stroke="#000" strokeWidth={bw * 0.07} />
              <ellipse cx={0} cy={-bw * 0.2} rx={bw * 0.3} ry={bw * 0.16} fill="#8B5A2B" stroke="#000" strokeWidth={bw * 0.07} />
              <path d={`M ${-bw * 0.14} ${-bw * 0.34} Q 0 ${-bw * 0.62} ${bw * 0.12} ${-bw * 0.42}`} fill="#8B5A2B" stroke="#000" strokeWidth={bw * 0.07} strokeLinejoin="round" />
            </g>
          ) : null}
          {stinkU > 0
            ? [-1, 0, 1].map((i) => {
                const ph = (t - T.poop) * 5 + i * 1.7;
                const x0 = i * bw * 0.9;
                const len = bw * 2.4 * stinkU;
                const d = Array.from({length: 9}, (_, j) => {
                  const v = (j / 8) * len;
                  return `${j ? 'L' : 'M'} ${x0 + Math.sin(ph + j * 0.9) * bw * 0.22} ${-bw * 2.5 - v}`;
                }).join(' ');
                return (
                  <g key={i}>
                    <path d={d} fill="none" stroke="#000" strokeWidth={bw * 0.24} strokeLinecap="round" strokeLinejoin="round" />
                    <path d={d} fill="none" stroke="#8BC34A" strokeWidth={bw * 0.12} strokeLinecap="round" strokeLinejoin="round" />
                  </g>
                );
              })
            : null}
        </g>
        {fly ? (
          <g transform={`translate(${flyX} ${flyY})`}>
            <ellipse cx={-R * 0.04} cy={-R * 0.045} rx={R * 0.055} ry={R * 0.032} fill="#fff" stroke="#000" strokeWidth={R * 0.01} transform={`rotate(${-30 + 25 * Math.sin(t * 90)})`} />
            <ellipse cx={R * 0.04} cy={-R * 0.045} rx={R * 0.055} ry={R * 0.032} fill="#fff" stroke="#000" strokeWidth={R * 0.01} transform={`rotate(${30 - 25 * Math.sin(t * 90)})`} />
            <circle cx={0} cy={0} r={R * 0.04} fill="#111" stroke="#000" strokeWidth={R * 0.008} />
          </g>
        ) : null}
        {/* face */}
        {awake ? (
          <>
            <Eye x={qx - ex} y={ey} r={er} open={eyeOpen} look={look} lid={lid} lidTilt={browTilt * 14} side={-1} squeeze={disgust} brow={0.5} browTilt={browTilt} />
            <Eye x={qx + ex} y={ey} r={er} open={eyeOpen} look={look} lid={lid} lidTilt={browTilt * 14} side={1} squeeze={disgust} brow={0.5} browTilt={browTilt} />
          </>
        ) : (
          <>
            {closed(qx - ex)}
            {peek > 0.02 ? (
              <Eye x={qx + ex} y={ey} r={er} open={peek} look={[-0.75, 0.7]} lid={0.42} lidTilt={12} side={1} brow={0.5} browTilt={0.9} />
            ) : (
              closed(qx + ex)
            )}
          </>
        )}
        {mouth}
        {[0, 1, 2].map(z)}
      </svg>
    </div>
  );
};

// ---------------------------------------------------------------- Earth world
type EarthShot = 'A' | 'B' | 'C' | 'E';
const EarthWorld: React.FC<{t: number; cam: Cam; shot: EarthShot; noHero?: boolean; extraBlur?: number}> = ({t, cam, shot, noHero = false, extraBlur = 0}) => {
  const sky = S.bg_night;
  const pad = (sky.pad as number) * BG_S;
  const skyO = far([0, -pad], DS);
  const skyBlur = clamp((cam.k - 1.15) * 7.5, 0, 3.2) + extraBlur;
  const moonBlur = (shot === 'A' ? clamp((cam.k - 1.2) * 7, 0, 2.2) : 0) + extraBlur;

  // ---- hero pose by time
  let pose = 'hero_hold';
  let sx = 1;
  let sy = breathe(t);
  let rot = 0;
  let dx = 0;
  const dy = 0;
  if (shot === 'A') {
    if (t < T.cares) {
      sy *= 1 + 0.03 * bump(t, T.trash, 0.3);
      const a = prog(t, T.cares - 0.16, T.cares);
      sy *= 1 - 0.06 * a;
      sx *= 1 + 0.04 * a;
    } else if (t < T.right) {
      pose = 'windup';
      sy *= 1 + 0.04 * ring(t, T.cares, 3, 8);
      rot = -3 * prog(t, T.cares, T.right);
    } else if (t < T.million) {
      pose = 'throw_follow';
      rot = 6 * ring(t, T.right, 2.2, 6);
      sy *= 1 + 0.03 * ring(t, T.right, 3, 8);
    } else {
      pose = 'shocked_full';
      sy *= 1 - 0.12 * ring(t, T.million, 3, 7);
      sx *= 1 + 0.08 * ring(t, T.million, 3, 7);
    }
  } else if (shot === 'C') {
    pose = 'shocked_full';
    dx = 2.2 * Math.sin(2 * Math.PI * 13 * t) + 1.4 * Math.sin(2 * Math.PI * 7.3 * t);
    const fl = WEEK.reduce((m, b) => m + bump(t, b.at, 0.16), 0);
    sy *= 1 - 0.035 * fl;
  }
  const showHero = !noHero && shot !== 'B';

  // ---- the black bag
  let bag: {x: number; y: number; rot: number; sy: number} | null = null;
  let tagAng = 0;
  const handTF = posePt('throw_follow', 796, 30, HX, HY);
  if (shot === 'A' && t >= T.right && t < T.costs) {
    const u = prog(t, T.right, T.but);
    const x = lerp(handTF[0] + 20, APEX[0], u);
    const y = APEX[1] + (handTF[1] - BAG_H * 0.3 - APEX[1]) * (1 - u) * (1 - u);
    const r = -220 * (1 - easeOutCubic(u));
    const hover = t > T.but ? 7 * Math.sin(2 * Math.PI * 1.1 * (t - T.but)) : 0;
    bag = {x, y: y + hover, rot: r, sy: 1};
    tagAng = 16 * ring(t, T.but + 0.06, 1.2, 1.4);
  }
  // head-top landing point on shocked_full (follows its squash / tremble)
  const sf = S.shocked_full;
  const head = sf.head as number[];
  const onHead = (ssx: number, ssy: number, ddx: number): [number, number] => posePt('shocked_full', head[0] + 6, head[1] - head[2], HX, HY, HR, ssx, ssy, 0, ddx, 0);
  if (shot === 'A' && t >= T.costs && t < T.million) {
    const u = prog(t, T.costs, T.million);
    const land = onHead(1, 1, 0);
    bag = {x: lerp(APEX[0], land[0], u), y: lerp(APEX[1], land[1] - BAG_H * 0.36, u * u), rot: 18 * Math.sin(u * 5), sy: 1};
    tagAng = -24 * u;
  }
  if ((shot === 'A' && t >= T.million) || shot === 'C') {
    const p = onHead(sx, sy, dx);
    const imp = shot === 'A' ? ring(t, T.million, 3.2, 7) : 0;
    bag = {x: p[0], y: p[1] - BAG_H * 0.36 * sy, rot: 7, sy: 1 - 0.14 * imp};
    tagAng = 10 * ring(t, T.million, 1.6, 2.5) + (shot === 'C' ? 3 * Math.sin(2 * Math.PI * 0.9 * t) : 0);
  }
  const knot = bag ? [bag.x + Math.sin((bag.rot * Math.PI) / 180) * BAG_H * 0.42, bag.y - Math.cos((bag.rot * Math.PI) / 180) * BAG_H * 0.42 * bag.sy] : [0, 0];
  const tagIn = shot === 'A' ? pop(t, T.but + 0.06, 0.3) : 1;

  return (
    <AbsoluteFill style={{backgroundColor: '#1A2D63'}}>
      <World cam={cam} depth={DS} blur={skyBlur}>
        <Img src={src('bg_night_sky')} style={{position: 'absolute', left: skyO[0], top: skyO[1], width: sky.w * BG_S * DS, height: (sky.h + (sky.pad as number)) * BG_S * DS}} />
      </World>
      <World cam={cam} depth={DM} blur={moonBlur}>
        <MoonActor t={t} />
      </World>
      <World cam={cam} blur={extraBlur}>
        <Img src={src('bg_night_front')} style={{position: 'absolute', left: 0, top: 0, width: sky.w * BG_S, height: sky.h * BG_S}} />
        {shot === 'C'
          ? WEEK.map((b, i) => {
              const u = prog(t, b.at - 0.42, b.at);
              if (u <= 0) return null;
              const y = lerp(b.y - 1300, b.y, u * u);
              const squash = 1 - 0.18 * ring(t, b.at, 3.5, 9);
              return <BlackBag key={i} x={b.x} y={y} rot={b.rot} sy={t >= b.at ? squash : 1} sx={t >= b.at ? 2 - squash : 1} />;
            })
          : null}
        {showHero ? <Pose n={pose} fx={HX} fy={HY} sx={sx} sy={sy} rot={rot} dx={dx} dy={dy} /> : null}
        {bag && showHero ? <BlackBag x={bag.x} y={bag.y} rot={bag.rot} sy={bag.sy} /> : null}
        {bag && showHero ? <PriceTag kx={knot[0]} ky={knot[1]} ang={tagAng} appear={tagIn} s={0.95} /> : null}
      </World>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- close-up (shot B)
const CloseUp: React.FC<{t: number}> = ({t}) => {
  const u = prog(t, T.dollars, T.soWeek);
  const zoom = 1 + 0.035 * easeInOutCubic(u);
  const hr = 372;
  const k = (hr / (S.shocked_cu.head as number[])[2]) * zoom;
  const hx = 540 + 2.5 * Math.sin(2 * Math.PI * 12.5 * t) + 1.5 * Math.sin(2 * Math.PI * 6.9 * t);
  const hy = 960 + 1.5 * Math.sin(2 * Math.PI * 11 * t);
  const head = S.shocked_cu.head as number[];
  const left = hx - head[0] * k;
  const top = hy - head[1] * k;
  const headTop = hy - head[2] * k;
  const bagScale = (hr / HR) * zoom;
  const bh = BAG_H * bagScale;
  const sw = pop(t, T.dollars + 0.18, 0.22);
  const slide = prog(t, T.dollars + 0.25, T.soWeek);
  return (
    <AbsoluteFill>
      <EarthWorld t={t} cam={CAM_B} shot="B" noHero extraBlur={6} />
      <AbsoluteFill style={{backgroundColor: 'rgba(10, 16, 40, 0.18)'}} />
      <Img src={src('shocked_cu')} style={{position: 'absolute', left, top, width: S.shocked_cu.w * k, height: S.shocked_cu.h * k}} />
      <div style={{position: 'absolute', left: 0, top: 0}}>
        <BlackBag x={hx + 18} y={headTop - bh * 0.34} rot={7} scale={bagScale} />
        <PriceTag kx={hx + 18 + Math.sin(0.122) * bh * 0.42} ky={headTop - bh * 0.34 - bh * 0.42} ang={8 + 4 * Math.sin(2 * Math.PI * 0.9 * t)} s={1.25} appear={1} />
      </div>
      <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
        <SweatDrop x={hx + head[2] * k * 0.78} y={hy - head[2] * k * 0.35 + slide * 150} r={34} s={sw * (1 - prog(t, T.soWeek - 0.15, T.soWeek))} />
      </svg>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- lunar world (shot D)
const LunarWorld: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const L = S.bg_lunar;
  const pad = (L.pad as number) * BG_S;
  const skyA = far([SKY_OFF[0], SKY_OFF[1] - pad], DL, C4);
  const skyB = far([SKY_OFF[0] - L.w * BG_S, SKY_OFF[1] - pad], DL, C4);
  const skyW = L.w * BG_S * DL;
  const skyH = (L.h + (L.pad as number)) * BG_S * DL;

  // lander stages
  const asc = S.lm_ascent;
  const des = S.lm_descent;
  const ascLeft = LM_LEFT + (asc.at as number[])[0] * LM_S;
  const ascTop = LM_TOP + (asc.at as number[])[1] * LM_S;
  const ascW = asc.w * LM_S;
  const ascH = asc.h * LM_S;
  const hop = 22 * bump(t, 12.95, 0.3) + 26 * bump(t, 13.42, 0.32);
  const lift = t > T.home ? 1700 * Math.pow(t - T.home, 2) + 60 * (t - T.home) : 0;
  const ascDy = -hop - lift;
  const wob = t > T.home ? 3 * Math.sin(2 * Math.PI * 4 * (t - T.home)) : 0;
  const strain = (t > 12.85 && t < 13.85) || (t > T.lighter + 0.6);
  const happy = t > T.fly - 0.1;
  const flameS = Math.max(0.55 * bump(t, 12.95, 0.3), 0.6 * bump(t, 13.42, 0.32), t > T.home ? clamp((t - T.home) / 0.12) : 0);
  // ascent-stage eyes (sprite px -> world)
  const eye = (px: number, py: number): [number, number] => [ascLeft + px * LM_S, ascTop + py * LM_S + ascDy];
  const er = 31 * LM_S;

  // astronaut
  const tossBump = TOSS.reduce((m, t0) => m + bump(t, t0 - 0.12, 0.12), 0);
  const tossStretch = TOSS.reduce((m, t0) => m + bump(t, t0, 0.22), 0);
  const jumpU = prog(t, 16.4, 16.78);
  const ascC: [number, number] = [ascLeft + ascW * 0.5, ascTop + ascH * 0.62];
  let ax = AX;
  let ay = AY;
  let aScale = 1;
  const aHop = 46 * bump(t, T.astronauts, 0.55);
  if (jumpU > 0) {
    ax = lerp(AX, ascC[0] + 20, easeInOutCubic(jumpU));
    ay = lerp(AY, ascC[1] + 150, jumpU) - 90 * Math.sin(Math.PI * Math.min(1, jumpU * 1.1));
    aScale = 1 - 0.45 * easeInOutCubic(jumpU);
  }
  const aVisible = t < 16.78;
  const behind = jumpU > 0;
  const aSy = breathe(t, 1) * (1 - 0.07 * tossBump + 0.05 * tossStretch);
  const astro = aVisible ? (
    <Pose n="astronaut_toss" fx={ax} fy={ay - aHop} hr={HR_A * aScale} sy={aSy} sx={1 + 0.04 * tossBump} shadow={!behind} />
  ) : null;
  const hand = posePt('astronaut_toss', 457, 75, AX, AY, HR_A);

  // tossed white bags
  const bags = TOSS.map((t0, i) => {
    if (t < t0) return null;
    const [lx, ly] = TOSS_LAND[i];
    const fl = 0.6;
    const u = clamp((t - t0) / fl);
    const x = lerp(hand[0] + 6, lx, u);
    const yA = Math.min(hand[1], ly) - 130;
    const y = u < 0.45 ? lerp(hand[1], yA, easeOutCubic(u / 0.45)) : lerp(yA, ly, Math.pow((u - 0.45) / 0.55, 2));
    const rot = u < 1 ? 300 * u : 0;
    const sq = u >= 1 ? 1 - 0.2 * ring(t, t0 + fl, 3, 8) : 1;
    return <WhiteBag key={i} x={x} y={y + 30} w={62} rot={rot + (u >= 1 ? (i - 1) * 9 : 0)} sy={sq} sx={2 - sq} ink={4} />;
  });
  const dust = TOSS.map((t0, i) => puffRing(TOSS_LAND[i][0], TOSS_LAND[i][1] + 30, t, t0 + 0.6, 5, 40, 20, 50 + i * 7));
  const liftDust = puffRing(LM_LEFT + 310, LM_TOP + (des.at as number[])[1] * LM_S + 10, t, T.home, 9, 150, 42, 9);

  return (
    <AbsoluteFill style={{backgroundColor: '#0B0B0D'}}>
      <World cam={cam} depth={DL}>
        <Img src={src('bg_lunar_sky')} style={{position: 'absolute', left: skyA[0], top: skyA[1], width: skyW, height: skyH}} />
        <Img src={src('bg_lunar_sky')} style={{position: 'absolute', left: skyB[0], top: skyB[1], width: skyW, height: skyH}} />
      </World>
      <World cam={cam}>
        <Img src={src('bg_lunar_front')} style={{position: 'absolute', left: 0, top: 0, width: L.w * BG_S, height: L.h * BG_S}} />
        <div style={{position: 'absolute', left: LM_LEFT - 30, top: LM_TOP + S.lander.h * LM_S - 26, width: S.lander.w * LM_S + 60, height: 44, borderRadius: '50%', background: 'rgba(40,40,40,0.28)', filter: 'blur(4px)'}} />
        {behind ? astro : null}
        <Img src={src('lm_descent')} style={{position: 'absolute', left: LM_LEFT + (des.at as number[])[0] * LM_S, top: LM_TOP + (des.at as number[])[1] * LM_S, width: des.w * LM_S, height: des.h * LM_S}} />
        <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
          <Flame x={ascLeft + ascW * 0.5} y={ascTop + ascH - 6 + ascDy} s={flameS} t={t} />
        </svg>
        <Img src={src('lm_ascent')} style={{position: 'absolute', left: ascLeft, top: ascTop + ascDy, width: ascW, height: ascH, transform: `rotate(${wob}deg)`}} />
        <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
          {happy ? (
            [eye(308, 232), eye(374, 232)].map(([x, y], i) => (
              <path key={i} d={`M ${x - er * 0.8} ${y + er * 0.2} Q ${x} ${y - er * 0.9} ${x + er * 0.8} ${y + er * 0.2}`} fill="none" stroke="#000" strokeWidth={er * 0.32} strokeLinecap="round" />
            ))
          ) : (
            <>
              <Eye x={eye(308, 232)[0]} y={eye(308, 232)[1]} r={er} open={pop(t, T.every + 0.15, 0.25)} squeeze={strain} side={-1} brow={0.55} browTilt={strain ? -0.6 : 0} look={[0.4, 0.1]} />
              <Eye x={eye(374, 232)[0]} y={eye(374, 232)[1]} r={er} open={pop(t, T.every + 0.15, 0.25)} squeeze={strain} side={1} brow={0.55} browTilt={strain ? -0.6 : 0} look={[0.4, 0.1]} />
            </>
          )}
          <SweatDrop x={eye(430, 200)[0]} y={eye(430, 200)[1] + 40 * prog(t, 13.0, 13.9)} r={12} s={pop(t, 12.98, 0.2) * (1 - prog(t, 13.85, 14.0))} />
        </svg>
        {!behind ? astro : null}
        <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1} height={1}>
          {bags}
          {dust.map((p, i) => (
            <PuffCluster key={i} puffs={p} fill="#E2E2E2" ink={4} />
          ))}
          <PuffCluster puffs={liftDust} fill="#D6D6D6" ink={5} />
        </svg>
      </World>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- screen overlays
const money = (v: number) => '$' + Math.round(v).toLocaleString('en-US');
const WeekCounter: React.FC<{t: number}> = ({t}) => {
  const step = PRICE_KG * (WEEK_KG / 7);
  let v = 0;
  WEEK.forEach((b) => {
    v += step * easeOutCubic(prog(t, b.at, b.at + 0.2));
  });
  if (t > WEEK[6].at + 0.2) v = 18700000;
  const s = pop(t, T.soWeek + 0.05, 0.3) * (1 + 0.1 * bump(t, T.kaching, 0.3));
  return (
    <AbsoluteFill style={{alignItems: 'center', top: 170}}>
      <div style={{transform: `scale(${s})`, display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
        <div style={txt(50)}>1 WEEK OF TRASH ≈ {WEEK_KG} KG</div>
        <div style={{...txt(122, t > T.kaching ? '#7CFF6B' : '#FFD23F'), marginTop: 14}}>{money(v)}</div>
      </div>
    </AbsoluteFill>
  );
};
const BagCounter: React.FC<{t: number}> = ({t}) => {
  const n = Math.round(96 * easeOutCubic(prog(t, T.ninety, T.bags)));
  const s = pop(t, T.ninety, 0.25) * (1 + 0.12 * bump(t, T.bags, 0.25)) * (1 - easeInOutCubic(prog(t, T.outStart - 0.25, T.outStart + 0.05)));
  if (s <= 0.001) return null;
  return (
    <AbsoluteFill style={{left: 70, top: 300}}>
      <div style={{transform: `scale(${s}) rotate(-6deg)`, transformOrigin: '0 50%', display: 'flex', alignItems: 'baseline', gap: 22}}>
        <div style={txt(190, '#FFFFFF')}>{n}</div>
        <div style={txt(84, '#FFD23F')}>BAGS</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- the Short
export const MoonTrashScene: React.FC<{t: number; camOverride?: Cam; noShake?: boolean}> = ({t, camOverride, noShake}) => {
  let body: React.ReactNode;
  if (t < T.dollars) {
    const c = camOverride ?? camAt(t, CAM_A);
    const sh = noShake ? {x: 0, y: 0} : shake(t, 10 * Math.exp(-9 * Math.max(0, t - T.million)) * (t >= T.million ? 1 : 0));
    body = (
      <AbsoluteFill style={{transform: `translate(${sh.x}px, ${sh.y}px)`}}>
        <EarthWorld t={t} cam={c} shot="A" />
      </AbsoluteFill>
    );
  } else if (t < T.soWeek) {
    body = <CloseUp t={t} />;
  } else if (t < T.every) {
    const c = camAt(t, CAM_C);
    const thump = WEEK.reduce((m, b) => m + bump(t, b.at, 0.14), 0);
    const sh = shake(t, 3.5 * thump);
    body = (
      <AbsoluteFill style={{transform: `translate(${sh.x}px, ${sh.y}px)`}}>
        <EarthWorld t={t} cam={c} shot="C" />
        <WeekCounter t={t} />
      </AbsoluteFill>
    );
  } else if (t < T.which) {
    const c = camAt(t, CAM_D);
    const sh = shake(t, 5 * bump(t, T.home, 0.5));
    body = (
      <AbsoluteFill style={{transform: `translate(${sh.x}px, ${sh.y}px)`}}>
        <LunarWorld t={t} cam={c} />
      </AbsoluteFill>
    );
  } else {
    const c = camOverride ?? camAt(t, CAM_E);
    const sh = shake(t, 6 * bump(t, T.poop, 0.35));
    body = (
      <AbsoluteFill style={{transform: `translate(${sh.x}px, ${sh.y}px)`}}>
        <EarthWorld t={t} cam={c} shot="E" />
        <BagCounter t={t} />
      </AbsoluteFill>
    );
  }
  return <AbsoluteFill style={{backgroundColor: '#000'}}>{body}</AbsoluteFill>;
};

// Remotion's mix came out ~4.6 dB low on the preview (peak -8.65 dBFS): lift voice + sfx together to reach ~ -4 dBFS
const MIX_DB = 4.6;
const MIX_GAIN = Math.pow(10, MIX_DB / 20);
const CUES_RAW: Cue[] = [
  {f: 'snore', at: 2.12, db: -29, dur: 1.3, keys: [[2.12, -29], [3.2, -29], [3.42, -60]]},
  {f: 'whoosh', at: T.right - 0.1, db: -26},
  {f: 'pop', at: T.but + 0.05, db: -20},
  {f: 'whoosh', at: 7.55, db: -31},
  {f: 'catch', at: T.million, db: -14},
  {f: 'pop', at: T.dollars + 0.18, db: -26},
  ...WEEK.map((b, i) => ({f: 'catch', at: b.at, db: i % 2 ? -21 : -19})),
  {f: 'ticks', at: 9.6, db: -31, dur: 1.95},
  {f: 'kaching', at: T.kaching, db: -11},
  {f: 'thruster', at: 12.93, db: -30, dur: 0.34, keys: [[12.93, -30], [13.2, -30], [13.27, -60]]},
  {f: 'thruster', at: 13.4, db: -29, dur: 0.36, keys: [[13.4, -29], [13.68, -29], [13.76, -60]]},
  {f: 'pop', at: T.every + 0.15, db: -24},
  ...TOSS.map((t0, i) => ({f: 'dustplop', at: t0 + 0.6, db: i === 1 ? -17 : -16})),
  {f: 'boing', at: T.home - 0.02, db: -21},
  {f: 'thruster', at: T.home, db: -17},
  {f: 'pop', at: T.which, db: -18},
  {f: 'ticks', at: T.ninety, db: -31, dur: 0.75},
  {f: 'pop', at: T.bags, db: -21},
  {f: 'stink', at: T.poop + 0.08, db: -15},
  {f: 'fly', at: T.poop + 0.2, db: -25, keys: [[T.poop + 0.2, -25], [24.5, -25], [25.0, -45]]},
];
const CUES: Cue[] = CUES_RAW.map((c) => ({...c, db: c.db + MIX_DB, keys: c.keys?.map(([kt, kd]) => [kt, kd + MIX_DB] as [number, number])}));

export const MoonTrashShort: React.FC = () => {
  useMoonFont();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  return (
    <AbsoluteFill>
      <MoonTrashScene t={t} />
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('moon-trash/vo/take1.mp3')} volume={MIX_GAIN} />
      </Sequence>
      <SoundCues cues={CUES} dir="moon-trash/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};

export const MOON_TRASH_FRAMES = Math.round(DURATION * FPS);
export {BAG_W, C0, HR};
