import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SPR} from './sprites';
import {DURATION, FPS, T, VO_AT} from './scene';
export {DURATION as TG_DURATION, FPS as TG_FPS} from './scene';
import {camAt, easeInCubic, easeInOutCubic, easeOutCubic, lerp, pop, prog, rnd, shake, spring, type Cam, type CamKey} from '../shared/anim';
import {World} from '../shared/World';
import {Eye} from '../shared/Face';
import {PuffCluster} from '../shared/Puffs';
import {SweatDrop} from '../shared/SweatDrop';
import {SoundCues, type Cue} from '../shared/Sound';
import {useFont} from '../shared/useFont';

// "How did a 10-year-old save a whole beach?" - one beach world seen from the sand (feet line y = 0).
// The girl (the channel's white character + a red bow) watches the sea start to fizz (the sea opens its eyes);
// tourists stare; a thought bubble shows the old tsunami film from geography class; she shouts TSUNAMI at her dad
// (who waves it off from his deck chair), won't stop; dad runs to the guard, whistle, the whole beach runs into the
// hotel on the left; the wave with an angry face rolls in and hits the empty beach; everybody waves from the roof
// (dad back in his deck chair) while the beaten wave squeezes its eyes shut.

const F = (n: string) => staticFile(`tsunami-girl/${n}.png`);
export const FONT = 'TGInter';
export const useTGFont = () => useFont(FONT, staticFile('fonts/Inter-Black.otf'));
const MIX_DB = -0.5;
const SKY = '#70C5FD';
const SEA = '#2AB6D8';
const SEA_D = '#13A8D4';
const SAND = '#FEE2A5';
const TEXT_YEL = '#FFD23F';
const WATER = '#2E8FD6';

// ---------- world ----------
const PS = 1.4; // plate scale
const PLATE_TOP = -1473;
const HORIZON = PLATE_TOP + 656 * PS; // -555
const SAND_Y = PLATE_TOP + 945 * PS; // -150
const HOT_X = -1450;
const HOT_Y = 30;
const HOT_S = 0.8;
const ROOF_Y = HOT_Y - (1180 - 150) * HOT_S; // -794
const DOOR_X = HOT_X;
const GIRL_X = 0;
const DAD_X = -480;
const DAD_X2 = -760;
const GUARD_X = -900;
const TOUR_X = 370;
const WAVE_S = 0.85;
const ROOF_T = 20.0;
// runs into the hotel: start, arrive
const RUN0 = 18.3;
const RUN = {girl: [RUN0, 19.45], dad: [RUN0 + 0.05, 19.55], tour: [17.95, 19.7], guard: [18.75, 19.85]} as const;

// ---------- cameras ----------
export const CAM0: CamKey = {t: 0, x: 170, y: -130, k: 1.4};
const CAMS: CamKey[] = [
  CAM0,
  {t: 3.2, x: 185, y: -140, k: 1.44},
  {t: 4.4, x: 200, y: -215, k: 1.4, ease: 'io'},
  {t: 5.9, x: 205, y: -218, k: 1.41},
  {t: 6.75, x: 330, y: -150, k: 1.35, ease: 'io'},
  {t: 7.45, x: 332, y: -152, k: 1.36},
  {t: 8.2, x: 130, y: -300, k: 1.2, ease: 'io'},
  {t: 10.9, x: 135, y: -305, k: 1.22},
  {t: 11.8, x: -150, y: -150, k: 1.25, ease: 'io'},
  {t: 16.2, x: -158, y: -152, k: 1.26},
  {t: 17.2, x: -600, y: -165, k: 1.05, ease: 'io'},
  {t: 17.85, x: -605, y: -167, k: 1.05},
  {t: 18.9, x: -800, y: -450, k: 0.5, ease: 'io'},
  {t: 22.2, x: -790, y: -455, k: 0.51},
  {t: 23.1, x: -1450, y: -680, k: 1.0, ease: 'io'},
  {t: DURATION, x: -1452, y: -690, k: 1.04},
];
export const camOf = (t: number): Cam => camAt(t, CAMS);

// ---------- helpers ----------
const bump = (t: number, t0: number, dur = 0.22) => Math.sin(Math.PI * prog(t, t0, t0 + dur));
const breathe = (t: number, ph = 0) => 1 + 0.009 * Math.sin(2 * Math.PI * 0.6 * t + ph);
const squashSwap = (t: number, tSwap: number): [number, number] => {
  if (t < tSwap - 0.08) return [1, 1];
  if (t < tSwap) {
    const u = prog(t, tSwap - 0.08, tSwap);
    return [1 + 0.06 * u, 1 - 0.07 * u];
  }
  const s = spring(t - tSwap, 3.2, 7);
  return [1 - 0.035 * s, 1 + 0.04 * s];
};
const hop = (t: number, hz = 3.6, h = 16) => -h * Math.abs(Math.sin(2 * Math.PI * hz * t));

type SprName = keyof typeof SPR;
type SP = {w: number; h: number; feet: [number, number]; head?: number[]; left: number; right: number; top: number; bottom: number};
const sp = (n: SprName) => SPR[n] as unknown as SP;
const Spr: React.FC<{n: SprName; x: number; y: number; s: number; sx?: number; sy?: number; rot?: number; ax?: number; ay?: number; filter?: string}> = ({
  n,
  x,
  y,
  s,
  sx = 1,
  sy = 1,
  rot: r = 0,
  ax,
  ay,
  filter,
}) => {
  const p = sp(n);
  const axx = ax ?? p.feet[0];
  const ayy = ay ?? p.feet[1];
  if (sx <= 0.001 || sy <= 0.001) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${r}deg) scale(${sx}, ${sy})`, transformOrigin: '0 0'}}>
      <Img src={F(n as string)} style={{position: 'absolute', left: -axx * s, top: -ayy * s, width: p.w * s, height: p.h * s, filter}} />
    </div>
  );
};
const Svg: React.FC<{children: React.ReactNode; r?: number}> = ({children, r = 12000}) => (
  <svg style={{position: 'absolute', left: -r, top: -r, overflow: 'visible'}} width={2 * r} height={2 * r} viewBox={`${-r} ${-r} ${2 * r} ${2 * r}`}>
    {children}
  </svg>
);
const Label: React.FC<{x: number; y: number; s: number; text: string; size?: number; rot?: number; color?: string}> = ({x, y, s, text, size = 64, rot = 0, color = TEXT_YEL}) =>
  s <= 0.001 ? null : (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${s})`,
        fontFamily: FONT,
        fontSize: size,
        lineHeight: 1,
        color,
        WebkitTextStroke: `${size * 0.2}px #000`,
        paintOrder: 'stroke fill',
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </div>
  );
const Shadow: React.FC<{x: number; y: number; w: number}> = ({x, y, w}) => (
  <ellipse cx={x} cy={y + 4} rx={w / 2} ry={w * 0.09} fill="rgba(72, 54, 42, 0.26)" style={{filter: 'blur(3px)'}} />
);

// door entry: squeeze to nothing in 0.14 s with a small dust puff
const doorSqueeze = (t: number, tArr: number) => (t < tArr ? 1 : 1 - easeInCubic(prog(t, tArr, tArr + 0.14)));
const runX = (t: number, x0: number, x1: number, [a, b]: readonly [number, number]) => {
  const u = prog(t, a, b);
  return lerp(x0, x1, u < 0.15 ? (u * u) / 0.3 : 0.075 + (u - 0.15) * (0.925 / 0.85));
};

// ---------- backdrop: plate + flat extensions ----------
const Backdrop: React.FC = () => (
  <>
    <Svg>
      <rect x={-12000} y={-12000} width={24000} height={12000 + HORIZON} fill={SKY} />
      <rect x={-12000} y={HORIZON} width={24000} height={SAND_Y - HORIZON} fill={SEA} />
      <rect x={-12000} y={HORIZON} width={24000} height={60} fill={SEA_D} />
      <line x1={-12000} x2={12000} y1={HORIZON} y2={HORIZON} stroke="#000" strokeWidth={5} />
      <rect x={-12000} y={SAND_Y - 40} width={24000} height={12000} fill={SAND} />
      <path d={`M -12000 ${SAND_Y - 40} L 12000 ${SAND_Y - 40}`} stroke="#fff" strokeWidth={22} />
    </Svg>
    <Img src={F('bg')} style={{position: 'absolute', left: -512 * PS, top: PLATE_TOP, width: 1024 * PS, height: 1536 * PS}} />
  </>
);

// ---------- the sea: fizz bubbles + a face ----------
const fizzAmt = (t: number) => {
  if (t > 21.0) return Math.max(0, 1 - prog(t, 21.0, 21.4));
  return 0.35 + 0.65 * easeOutCubic(prog(t, T.fizzing - 0.1, T.fizzing + 0.5)) + 0.4 * prog(t, T.giant, T.soda);
};
const Bubbles: React.FC<{t: number}> = ({t}) => {
  const amt = fizzAmt(t);
  const out: React.ReactNode[] = [];
  const N = 90;
  for (let i = 0; i < N; i++) {
    if (rnd(i * 3.1) > amt) continue;
    const per = 0.8 + rnd(i) * 0.9;
    const ph = rnd(i + 7) * per;
    const u = ((t + ph) % per) / per;
    const x = -1500 + rnd(i + 11) * 3000;
    const y0 = lerp(HORIZON + 40, SAND_Y - 50, rnd(i + 23));
    const big = amt > 1 && rnd(i + 31) > 0.6 ? 1.6 : 1;
    const r = (6 + rnd(i + 5) * 12) * big * Math.sin(Math.PI * Math.min(1, u * 1.15));
    if (r < 1) continue;
    out.push(<circle key={i} cx={x + 6 * Math.sin(6 * u + i)} cy={y0 - u * (40 + 60 * big)} r={r} fill="#E9FBFF" stroke="#000" strokeWidth={3} />);
  }
  // giant soda: foam spills over the shore line
  const spill = easeOutCubic(prog(t, T.soda, T.soda + 0.6)) * (1 - prog(t, 20.6, 21.2));
  let foam = '';
  if (spill > 0.01) {
    const pts: string[] = [];
    for (let x = -2400; x <= 2400; x += 40) pts.push(`${x === -2400 ? 'M' : 'L'} ${x} ${SAND_Y - 30 + 7 * Math.sin(x / 47 + t * 4)}`);
    foam = pts.join(' ');
  }
  return (
    <g>
      {out}
      {foam ? <path d={foam} stroke="#000" strokeWidth={36 * spill + 8} fill="none" strokeLinecap="round" /> : null}
      {foam ? <path d={foam} stroke="#FFFFFF" strokeWidth={36 * spill} fill="none" strokeLinecap="round" /> : null}
    </g>
  );
};
const SeaFace: React.FC<{t: number}> = ({t}) => {
  const open = pop(t, T.fizzing, 0.3) * (1 - prog(t, 20.4, 20.6));
  if (open <= 0.01) return null;
  const blink = Math.abs(t - 9.0) < 0.07 || Math.abs(t - 14.3) < 0.07 ? 0.9 : 0;
  const look: [number, number] = t < T.everyone ? [-0.8, 0.4] : t < T.staresEnd ? [0.9, 0.4] : [-0.9, 0.5];
  const y = HORIZON + 120;
  const x = 60;
  const grin = 0.4 + 0.6 * prog(t, T.giant, T.soda);
  return (
    <g>
      <Eye x={x} y={y} r={30} open={open} look={look} lid={blink || 0.25} lidTilt={-12} side={-1} brow={0.5} browTilt={-0.6} />
      <Eye x={x + 110} y={y} r={30} open={open} look={look} lid={blink || 0.25} lidTilt={-12} side={1} brow={0.5} browTilt={-0.6} />
      <path
        d={`M ${x - 10} ${y + 62} Q ${x + 55} ${y + 62 + 40 * grin * open} ${x + 120} ${y + 58}`}
        fill="none"
        stroke="#000"
        strokeWidth={7}
        strokeLinecap="round"
      />
    </g>
  );
};

// ---------- the thought bubble with the old class film ----------
const Thought: React.FC<{t: number}> = ({t}) => {
  const s = pop(t, T.seen, 0.3) * (1 - easeInCubic(prog(t, 10.75, 10.95)));
  if (s <= 0.01) return null;
  const cx = 250;
  const cy = -600;
  const tv = pop(t, T.video - 0.05, 0.25);
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`}>
      <circle cx={70} cy={-270} r={16} fill="#fff" stroke="#000" strokeWidth={5} />
      <circle cx={115} cy={-345} r={26} fill="#fff" stroke="#000" strokeWidth={5} />
      <PuffCluster
        puffs={[
          {x: cx, y: cy, r: 190},
          {x: cx - 170, y: cy + 20, r: 120},
          {x: cx + 170, y: cy + 15, r: 125},
          {x: cx - 90, y: cy - 120, r: 120},
          {x: cx + 100, y: cy - 115, r: 120},
          {x: cx, y: cy + 110, r: 120},
        ]}
        fill="#FFFFFF"
        ink={6}
      />
      {tv > 0.01 ? (
        <g transform={`translate(${cx} ${cy + 25}) scale(${tv})`}>
          <line x1={-20} y1={-105} x2={-70} y2={-175} stroke="#000" strokeWidth={6} strokeLinecap="round" />
          <line x1={20} y1={-105} x2={70} y2={-175} stroke="#000" strokeWidth={6} strokeLinecap="round" />
          <rect x={-170} y={-110} width={340} height={230} rx={26} fill="#8B5A2B" stroke="#000" strokeWidth={7} />
          <rect x={-140} y={-85} width={230} height={180} rx={18} fill="#D8D8D8" stroke="#000" strokeWidth={5} />
          <circle cx={128} cy={-40} r={14} fill="#333" stroke="#000" strokeWidth={4} />
          <circle cx={128} cy={10} r={14} fill="#333" stroke="#000" strokeWidth={4} />
          <rect x={-140} y={40} width={230} height={55} fill="#9A9A9A" />
          <line x1={-140} x2={90} y1={40} y2={40} stroke="#000" strokeWidth={4} />
        </g>
      ) : null}
    </g>
  );
};
const ThoughtFilm: React.FC<{t: number}> = ({t}) => {
  // the black-and-white wave sprite inside the TV screen (HTML layer so it can use the sprite)
  const s = pop(t, T.seen, 0.3) * (1 - easeInCubic(prog(t, 10.75, 10.95)));
  const tv = pop(t, T.video - 0.05, 0.25);
  if (s * tv <= 0.01) return null;
  const wx = lerp(40, -60, prog(t, T.video, T.klassEnd));
  const bob = 6 * Math.sin(t * 7);
  return (
    <div style={{position: 'absolute', left: 250, top: -575, transform: `scale(${s * tv})`, transformOrigin: '0 0'}}>
      <div style={{position: 'absolute', left: -137, top: -82, width: 224, height: 120, overflow: 'hidden', borderRadius: 14}}>
        <Spr n="wave" x={wx + 110} y={128 + bob} s={0.15} filter="grayscale(1) contrast(1.25)" />
      </div>
    </div>
  );
};
const Chalk: React.FC<{t: number}> = ({t}) => {
  const s = pop(t, T.seen, 0.3) * (1 - easeInCubic(prog(t, 10.75, 10.95)));
  const b = pop(t, T.geography, 0.25);
  if (s * b <= 0.01) return null;
  return <Label x={250} y={-815} s={s * b * 0.85} text="GEOGRAPHY" size={64} rot={-3} color="#9CF29C" />;
};

// ---------- the wave with a face ----------
const WAVE_HIT_X = -900;
const waveX = (t: number) => lerp(1700, WAVE_HIT_X, easeInCubic(prog(t, 20.45, T.hits)));
const Wave: React.FC<{t: number}> = ({t}) => {
  if (t < 20.4) return null;
  const x = waveX(t);
  const after = t - T.hits;
  const sink = easeInCubic(prog(t, 22.9, 23.9));
  const sy = (after > 0 ? 1 - 0.12 * spring(after, 2.5, 5) : 1 + 0.06 * prog(t, 20.8, T.hits)) * (1 - 0.8 * sink);
  const sx = after > 0 ? 1 + 0.08 * spring(after, 2.5, 5) : 1;
  return <Spr n="wave" x={x + 380 * sink} y={160} s={WAVE_S} sx={sx} sy={sy} />;
};
const WaveFace: React.FC<{t: number}> = ({t}) => {
  if (t < 20.4) return null;
  const x = waveX(t);
  const sink = easeInCubic(prog(t, 22.9, 23.9));
  if (sink > 0.85) return null;
  const sy = 1 - 0.8 * sink;
  const ex = x + 380 * sink + 150;
  const ey = 160 - 560 * WAVE_S * sy;
  const open = pop(t, 20.6, 0.3);
  const beaten = t > T.nobody + 0.2;
  const look: [number, number] = beaten ? [0, 0] : [-1, 0.2];
  return (
    <g>
      <Eye x={ex} y={ey} r={46} open={open} look={look} squeeze={beaten} side={-1} lid={0.3} lidTilt={18} brow={0.4} browTilt={beaten ? -1 : 1.2} />
      <Eye x={ex + 130} y={ey + 8} r={46} open={open} look={look} squeeze={beaten} side={1} lid={0.3} lidTilt={18} brow={0.4} browTilt={beaten ? -1 : 1.2} />
      {beaten ? <SweatDrop x={ex + 175} y={ey - 30} r={20} s={pop(t, T.nobody + 0.4, 0.25)} rot={10} /> : null}
    </g>
  );
};
const Flood: React.FC<{t: number}> = ({t}) => {
  const rise = easeOutCubic(prog(t, T.hits - 0.05, T.hits + 0.5));
  const fall = easeInOutCubic(prog(t, 23.0, 24.4));
  const lvl = lerp(1600, -170, rise) + 430 * fall;
  if (rise <= 0.001) return null;
  const pts: string[] = [];
  for (let x = -2600; x <= 2200; x += 80) pts.push(`L ${x} ${lvl + 14 * Math.sin(x / 90 + t * 5)}`);
  const d = `M -2600 3200 ${pts.join(' ')} L 2200 3200 Z`;
  return (
    <g>
      <path d={d} fill={WATER} stroke="#000" strokeWidth={8} />
      {t > T.hits && t < T.hits + 0.9 ? (
        <PuffCluster
          puffs={Array.from({length: 9}, (_, i) => {
            const u = prog(t, T.hits, T.hits + 0.9);
            const a = (-160 + i * 17) * (Math.PI / 180);
            const d0 = 120 + 520 * easeOutCubic(u);
            return {x: HOT_X + 330 + d0 * Math.cos(a), y: -300 + d0 * Math.sin(a) + 500 * u * u, r: (60 + 30 * rnd(i)) * Math.sin(Math.PI * Math.min(1, u * 1.1))};
          })}
          fill="#E9FBFF"
          ink={6}
        />
      ) : null}
      {Array.from({length: 18}, (_, i) => (
        <circle key={i} cx={-2400 + i * 260 + 40 * Math.sin(t * 2 + i)} cy={lvl + 30 + 20 * rnd(i)} r={14 + 10 * rnd(i + 3)} fill="#E9FBFF" stroke="#000" strokeWidth={3} />
      ))}
    </g>
  );
};

// ---------- the scene ----------
export const Scene: React.FC<{t: number; cam: Cam; cover?: boolean}> = ({t, cam, cover}) => {
  // girl
  const gRunning = t >= RUN.girl[0];
  const gPose: SprName = t < T.tells ? 'hero' : t < RUN.girl[0] ? 'shout' : 'run';
  const gS = gPose === 'hero' ? 60 / 277 : gPose === 'shout' ? 60 / 157 : 60 / 137;
  const gSwap = t < T.tells ? -1 : t < RUN.girl[0] ? T.tells : RUN.girl[0];
  const [gsx, gsy] = squashSwap(t, gSwap);
  const gx = gRunning ? runX(t, GIRL_X, DOOR_X, RUN.girl) : GIRL_X;
  const jumping = t > T.she && t < T.stopEnd + 0.1;
  const gy = gRunning ? hop(t) : jumping ? -38 * Math.abs(Math.sin(2 * Math.PI * 2.4 * (t - T.she))) : -22 * bump(t, T.tsunami, 0.3);
  const gIn = doorSqueeze(t, RUN.girl[1]);
  // dad
  const dPose: SprName = t < T.dad ? 'chair' : 'dadrun';
  const [dsx, dsy] = squashSwap(t, T.dad);
  const dx = t < T.dad ? DAD_X : t < RUN.dad[0] ? lerp(DAD_X, DAD_X2, easeInOutCubic(prog(t, T.dad, T.guard))) : runX(t, DAD_X2, DOOR_X, RUN.dad);
  const dy = t > T.dad && t < T.guard ? hop(t, 3.8, 14) : t >= RUN.dad[0] ? hop(t, 3.8, 14) : 0;
  const dRot = t > T.they && t < T.she ? 4 * Math.sin(2 * Math.PI * 1.6 * (t - T.they)) : 0;
  const dIn = doorSqueeze(t, RUN.dad[1]);
  // guard
  const grX = t < RUN.guard[0] ? GUARD_X : runX(t, GUARD_X, DOOR_X, RUN.guard);
  const grBump = 1 + 0.08 * bump(t, T.guard, 0.25) + 0.05 * bump(t, T.guard + 0.35, 0.25);
  const grIn = doorSqueeze(t, RUN.guard[1]);
  // tourists
  const tPose: SprName = t < RUN.tour[0] ? 'stare' : 'panic';
  const [tsx, tsy] = squashSwap(t, RUN.tour[0]);
  const tx = t < RUN.tour[0] ? TOUR_X : runX(t, TOUR_X, DOOR_X, RUN.tour);
  const tIn = doorSqueeze(t, RUN.tour[1]);
  const tS = tPose === 'stare' ? 0.78 : 0.82;
  // roof crowd
  const roof = (d: number) => pop(t, ROOF_T + d, 0.3);
  const hotShake = shake(t, 10 * bump(t, T.hits, 0.5));
  const blur = 2.5 * easeInOutCubic(prog(t, T.seen, T.seen + 0.35)) * (1 - easeInOutCubic(prog(t, 10.55, 10.95)));
  const tsunamiS = pop(t, T.tsunami, 0.25) * (1 - easeInCubic(prog(t, T.tsunamiEnd - 0.05, T.tsunamiEnd + 0.15)));
  return (
    <AbsoluteFill style={{background: SKY}}>
      <World cam={cam} blur={blur}>
        <Backdrop />
        <Svg>
          <Bubbles t={t} />
          <SeaFace t={t} />
        </Svg>
      </World>
      <World cam={cam}>
        {/* hotel + roof crowd */}
        <div style={{position: 'absolute', left: hotShake.x, top: hotShake.y}}>
          <Spr n="hotel" x={HOT_X} y={HOT_Y} s={HOT_S} />
          <Spr n="chair" x={HOT_X - 210} y={ROOF_Y} s={0.38} sx={roof(0.1)} sy={roof(0.1)} />
          <Spr n="stare" x={HOT_X + 120} y={ROOF_Y} s={0.6} sx={roof(0.25)} sy={roof(0.25)} />
          <Spr n="guard" x={HOT_X + 255} y={ROOF_Y} s={0.2} sx={roof(0.35)} sy={roof(0.35)} />
          <Spr
            n="shout"
            x={HOT_X - 40}
            y={ROOF_Y + (t > T.nobody ? -30 * Math.abs(Math.sin(2 * Math.PI * 2 * (t - T.nobody))) : 0)}
            s={0.3}
            sx={roof(0)}
            sy={roof(0)}
          />
        </div>
        <Svg>
          {gIn > 0 && t < RUN.girl[1] + 0.2 ? <Shadow x={gx} y={0} w={140} /> : null}
          {t < RUN.dad[1] ? <Shadow x={dx} y={0} w={200} /> : null}
          {t < RUN.guard[1] ? <Shadow x={grX} y={0} w={170} /> : null}
          {t < RUN.tour[1] && !cover ? <Shadow x={tx} y={0} w={380} /> : null}
          {[RUN.girl[1], RUN.dad[1], RUN.tour[1], RUN.guard[1]].map((ta, i) =>
            t > ta && t < ta + 0.5 ? (
              <PuffCluster
                key={i}
                puffs={[0, 1, 2].map((j) => ({x: DOOR_X + 60 + j * 40, y: -20 - j * 20 - 60 * prog(t, ta, ta + 0.5), r: 30 * Math.sin(Math.PI * prog(t, ta, ta + 0.5))}))}
                fill="#F3E6C8"
                ink={4}
              />
            ) : null,
          )}
        </Svg>
        <Spr n="guard" x={grX} y={(t >= RUN.guard[0] ? hop(t, 4, 12) : 0)} s={0.255} sx={grBump * grIn} sy={grBump} />
        <Spr n={dPose} x={dx} y={dy} s={0.5} sx={dsx * dIn} sy={dsy} rot={dRot} />
        {cover ? null : <Spr n={tPose} x={tx} y={t >= RUN.tour[0] ? hop(t, 3.4, 18) : 0} s={tS} sx={tsx * tIn} sy={tsy * (t < RUN.tour[0] ? breathe(t, 1) : 1)} />}
        <Spr n={gPose} x={gx} y={gy} s={gS} sx={gsx * gIn} sy={gsy * (gPose === 'hero' ? breathe(t) : 1)} />
        <Svg>
          {/* sweat on dad while he runs to the guard */}
          {t > T.dad && t < RUN.dad[1] ? <SweatDrop x={dx + 70} y={dy - 330} r={16} s={pop(t, T.dad + 0.1, 0.25)} rot={-15} /> : null}
          {/* whistle tweet lines */}
          {t > T.guard && t < T.guard + 0.7
            ? [-1, 0, 1].map((i) => {
                const u = prog(t, T.guard, T.guard + 0.7);
                const a = (-90 + i * 35) * (Math.PI / 180);
                const r0 = 90 + 60 * u;
                return (
                  <line
                    key={i}
                    x1={GUARD_X + r0 * Math.cos(a)}
                    y1={-215 + r0 * Math.sin(a)}
                    x2={GUARD_X + (r0 + 40) * Math.cos(a)}
                    y2={-215 + (r0 + 40) * Math.sin(a)}
                    stroke="#000"
                    strokeWidth={7}
                    strokeLinecap="round"
                  />
                );
              })
            : null}
          {/* shout lines around the girl */}
          {t > T.tells && t < T.stopEnd
            ? [-1, 1].map((sd) =>
                [0, 1, 2].map((i) => {
                  const ph = (t * 3 + i * 0.33) % 1;
                  const a = ((sd > 0 ? -30 : -150) + (i - 1) * 25) * (Math.PI / 180);
                  const r0 = 110 + 40 * ph;
                  return (
                    <line
                      key={`${sd}${i}`}
                      x1={gx + r0 * Math.cos(a)}
                      y1={gy - 160 + r0 * Math.sin(a)}
                      x2={gx + (r0 + 30) * Math.cos(a)}
                      y2={gy - 160 + (r0 + 30) * Math.sin(a)}
                      stroke="#000"
                      strokeWidth={6}
                      strokeLinecap="round"
                    />
                  );
                }),
              )
            : null}
          {/* question marks over the staring tourists */}
          {t > T.stares && t < T.tells
            ? [0, 1, 2].map((i) => {
                const s = pop(t, T.stares + i * 0.12, 0.25);
                return s > 0.01 ? (
                  <text key={i} x={TOUR_X - 130 + i * 120} y={-360 + 8 * Math.sin(t * 4 + i)} fontFamily={FONT} fontSize={70 * s} textAnchor="middle" fill={TEXT_YEL} stroke="#000" strokeWidth={10} paintOrder="stroke">
                    ?
                  </text>
                ) : null;
              })
            : null}
          <Thought t={t} />
        </Svg>
        <ThoughtFilm t={t} />
        <Chalk t={t} />
        <Wave t={t} />
        <Svg>
          <WaveFace t={t} />
          <Flood t={t} />
        </Svg>
        <Label x={gx - 120} y={-390} s={tsunamiS} text="TSUNAMI!" size={84} rot={-6} />
        {jumping
          ? [0, 1, 2].map((i) => {
              const t0 = T.she + 0.05 + i * 0.35;
              const s = pop(t, t0, 0.2) * (1 - easeInCubic(prog(t, T.stopEnd - 0.1, T.stopEnd + 0.1)));
              return <Label key={i} x={gx + [-250, 20, -140][i]} y={[-290, -400, -510][i]} s={s * 0.8} text="TSUNAMI!" size={64} rot={[-12, 10, -3][i]} color={i === 1 ? '#FF6B6B' : TEXT_YEL} />;
            })
          : null}
        <Label x={DAD_X + 40} y={-420} s={pop(t, T.believe, 0.25) * (1 - easeInCubic(prog(t, T.she - 0.1, T.she + 0.1)))} text="NAH" size={60} rot={8} color="#FFFFFF" />
      </World>
    </AbsoluteFill>
  );
};

export const SceneWithShake: React.FC<{t: number; cam: Cam; cover?: boolean}> = ({t, cam, cover}) => {
  const sh = shake(t, 9 * bump(t, T.hits, 0.45) + 2 * bump(t, RUN0, 1.4));
  return <Scene t={t} cam={{x: cam.x - sh.x / cam.k, y: cam.y - sh.y / cam.k, k: cam.k}} cover={cover} />;
};

const CUES: Cue[] = [
  {f: 'bubbles', at: 0.1, db: -36, keys: [[0.1, -36], [3.9, -36], [4.3, -27]]},
  {f: 'fizz', at: T.fizzing - 0.05, db: -22},
  {f: 'bubbles', at: 2.1, db: -36},
  {f: 'fizz', at: T.giant, db: -20, rate: 0.9},
  {f: 'pop', at: T.fizzing + 0.05, db: -24},
  {f: 'bubbles', at: 5.5, db: -30, keys: [[5.5, -30], [7.2, -34], [7.5, -60]]},
  {f: 'pop', at: T.stares, db: -26, rate: 1.2},
  {f: 'pop', at: T.stares + 0.12, db: -26, rate: 1.35},
  {f: 'pop', at: T.stares + 0.24, db: -26, rate: 1.5},
  {f: 'pop', at: T.seen, db: -22, rate: 0.8},
  {f: 'whoosh', at: T.video - 0.12, db: -30, rate: 1.2},
  {f: 'pop', at: T.geography, db: -25},
  {f: 'pop', at: 10.75, db: -26, rate: 0.7},
  {f: 'whoosh', at: T.tells - 0.1, db: -28},
  {f: 'pop', at: T.tsunami, db: -20, rate: 0.75},
  {f: 'laugh', at: T.believe - 0.1, db: -27, rate: 0.9},
  {f: 'pop', at: T.she + 0.05, db: -25, rate: 1.1},
  {f: 'pop', at: T.she + 0.4, db: -25, rate: 1.25},
  {f: 'pop', at: T.she + 0.75, db: -25, rate: 1.4},
  {f: 'zip', at: T.dad - 0.1, db: -26},
  {f: 'pea_whistle', at: T.guard - 0.02, db: -19},
  {f: 'stampede', at: 17.95, db: -21},
  {f: 'stampede', at: 18.6, db: -22, rate: 0.9},
  {f: 'zip', at: 18.9, db: -27, rate: 1.1},
  {f: 'pop', at: 19.45, db: -24},
  {f: 'pop', at: 19.7, db: -24, rate: 1.2},
  {f: 'pop', at: 19.85, db: -24, rate: 1.4},
  {f: 'gust', at: 20.2, db: -26, rate: 0.8},
  {f: 'whoosh', at: 21.2, db: -24, rate: 0.6},
  {f: 'wave_crash', at: T.hits - 0.35, db: -12},
  {f: 'flood', at: T.hits + 0.1, db: -20, keys: [[21.84, -20], [23.0, -26], [24.3, -60]]},
  {f: 'splash', at: 23.1, db: -26, rate: 0.8},
];

export const TsunamiGirlShort: React.FC = () => {
  useTGFont();
  const f = useCurrentFrame();
  const t = f / FPS;
  return (
    <AbsoluteFill style={{background: SKY}}>
      <SceneWithShake t={t} cam={camOf(t)} />
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('tsunami-girl/vo/take1.mp3')} volume={Math.pow(10, MIX_DB / 20)} />
      </Sequence>
      <Audio src={staticFile('tsunami-girl/music/bed.wav')} volume={Math.pow(10, MIX_DB / 20)} />
      <SoundCues cues={CUES.map((c) => ({...c, db: c.db + MIX_DB, keys: c.keys?.map(([a, b]) => [a, b + MIX_DB] as [number, number])}))} dir="tsunami-girl/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};

