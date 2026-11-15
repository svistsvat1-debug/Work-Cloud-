import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SPR} from './sprites';
import {CUT_C, CUT_D, CUT_E, DURATION, FPS, T, VO_AT} from './scene';
export {DURATION as PM_DURATION, FPS as PM_FPS} from './scene';
import {camAt, clamp, easeInCubic, easeInOutCubic, easeOutCubic, lerp, pop, prog, rnd, shake, spring, type Cam, type CamKey} from '../shared/anim';
import {World} from '../shared/World';
import {Eye} from '../shared/Face';
import {PuffCluster} from '../shared/Puffs';
import {SweatDrop} from '../shared/SweatDrop';
import {SoundCues, type Cue} from '../shared/Sound';
import {useFont} from '../shared/useFont';

// "Why don't we just print more money?" - one old-town street: the guy, a money printer that comes alive,
// a bakery with a baker who RAISES the price board, then a stove at dusk.
// A: broke guy (moth from the wallet), printer wakes up, prints a fat stack, cash rains on everyone.
// B: "But" -> glide to the bakery: ONE loaf, the baker raises the price board 1 -> 2 -> 5.
// C: "So you print more": the printer goes wild; "Germany 1923" sign, the world turns sepia.
// D: the guy pushes a wheelbarrow of cash; the board rolls up to 200,000,000,000 MARKS; shock.
// E: dusk: the family warms up while the cash burns in the stove; firewood gets a red X.

const F = (n: string) => staticFile(`print-money/${n}.png`);
export const FONT = 'PMInter';
export const usePMFont = () => useFont(FONT, staticFile('fonts/Inter-Black.otf'));
const MIX_DB = -0.5;
const SKY = '#99C5EF';
const GROUND = '#A4A09F';
const TEXT_YEL = '#FFD23F';
const BILL = '#B9DDA2';
const BILL_D = '#6E9E58';

// ---------- world: ground y = 0 ----------
const HR = 105; // guy head radius (world)
const GUY_X = -370;
const PR_X = 200; // printer centre
const PR_S = 640 / (SPR.printer.right - SPR.printer.left);
const PR_CX = (SPR.printer.left + SPR.printer.right) / 2;
const prw = (nx: number, ny: number): [number, number] => [PR_X + (nx - PR_CX) * PR_S, (ny - SPR.printer.bottom) * PR_S];
const SLOT = prw(930, 525);
const TRAY = prw(1150, 590);
const CHIMNEY = prw(340, 40);
const BK_X = 1500; // bakery centre
const BK_S = 1300 / (SPR.bakery.right - SPR.bakery.left);
const BK_CX = (SPR.bakery.left + SPR.bakery.right) / 2;
const COUNTER_Y = (658 - SPR.bakery.bottom) * BK_S;
const LOAF_X = 1610;
const LOAF_S = 230 / (SPR.loaf.right - SPR.loaf.left);
const BAKER_X = 1290;
const BAKER_FEET = -81;
const BOARD = {x: 1300, y: -700, w: 1000, h: 340};
const CLONES = [930, 1080, 1230];
const ST_X = 3200; // stove
const ST_S = 340 / (SPR.stove.bottom - SPR.stove.top);
const DOOR: [number, number] = [ST_X + (144 - SPR.stove.feet[0]) * ST_S, (192 - SPR.stove.feet[1]) * ST_S];
const DOOR_R = 47;
const BAR_S = 540 / (SPR.barrow.right - SPR.barrow.left);

// ---------- cameras ----------
export const CAM0: CamKey = {t: 0, x: -45, y: -370, k: 0.96};
const CAMS_A: CamKey[] = [
  CAM0,
  {t: 3.3, x: -40, y: -375, k: 1.0},
  {t: 4.0, x: -40, y: -375, k: 1.0},
  {t: 5.0, x: 200, y: -400, k: 1.12, ease: 'io'},
  {t: 6.0, x: 210, y: -400, k: 1.15},
  {t: 7.0, x: 520, y: -430, k: 0.62, ease: 'io'},
  {t: T.but, x: 525, y: -430, k: 0.625},
  {t: 8.5, x: 1360, y: -450, k: 0.8, ease: 'io'},
  {t: 12.0, x: 1370, y: -450, k: 0.84},
];
const CAMS_C: CamKey[] = [
  {t: 12.0, x: 1370, y: -450, k: 0.84},
  {t: 12.8, x: 20, y: -390, k: 1.0, ease: 'io'},
  {t: 13.75, x: 20, y: -390, k: 1.02},
  {t: 14.5, x: 260, y: -450, k: 0.82, ease: 'io'},
  {t: CUT_D, x: 265, y: -450, k: 0.84},
];
const guyPushX = (t: number) => lerp(-150, 640, easeInOutCubic(prog(t, CUT_D, 19.0)));
const CAMS_E: CamKey[] = [
  {t: CUT_E, x: ST_X - 210, y: -330, k: 1.22},
  {t: 21.7, x: ST_X - 190, y: -330, k: 1.28, ease: 'io'},
  {t: DURATION, x: ST_X - 185, y: -330, k: 1.31},
];
export const camOf = (t: number): Cam => {
  if (t < CUT_C) return camAt(t, CAMS_A);
  if (t < CUT_D) return camAt(t, CAMS_C);
  if (t < CUT_E) {
    const gx = guyPushX(t);
    const fol = {x: Math.min(gx + 480, 1150), y: -520, k: 0.72};
    const u = easeInOutCubic(prog(t, T.marks, T.marks + 0.7));
    return {x: lerp(fol.x, 1120, u), y: lerp(fol.y, -500, u), k: Math.exp(lerp(Math.log(0.72), Math.log(0.75), u))};
  }
  return camAt(t, CAMS_E);
};

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
const popOut = (t: number, t0: number, t1: number, dur = 0.25) => (t < t1 ? pop(t, t0, dur) : Math.max(0, 1 - easeInCubic(prog(t, t1, t1 + 0.2))));

type SprName = keyof typeof SPR;
const Spr: React.FC<{n: SprName; x: number; y: number; s: number; sx?: number; sy?: number; rot?: number; ax?: number; ay?: number; o?: number; flip?: boolean}> = ({
  n,
  x,
  y,
  s,
  sx = 1,
  sy = 1,
  rot: r = 0,
  ax,
  ay,
  o = 1,
  flip = false,
}) => {
  const sp = SPR[n] as unknown as {w: number; h: number; feet: [number, number]};
  const axx = ax ?? sp.feet[0];
  const ayy = ay ?? sp.feet[1];
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${r}deg) scale(${sx * (flip ? -1 : 1)}, ${sy})`, transformOrigin: '0 0', opacity: o}}>
      <Img src={F(n as string)} style={{position: 'absolute', left: -axx * s, top: -ayy * s, width: sp.w * s, height: sp.h * s}} />
    </div>
  );
};
const Svg: React.FC<{children: React.ReactNode; r?: number}> = ({children, r = 5000}) => (
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

// a banknote (front view)
const Bill: React.FC<{x: number; y: number; rot?: number; s?: number; sy?: number}> = ({x, y, rot = 0, s = 1, sy = 1}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s}, ${s * sy})`}>
      <rect x={-60} y={-30} width={120} height={60} rx={7} fill={BILL} stroke="#000" strokeWidth={6} />
      <rect x={-48} y={-19} width={96} height={38} rx={4} fill="none" stroke={BILL_D} strokeWidth={4} />
      <circle cx={0} cy={0} r={12} fill="none" stroke={BILL_D} strokeWidth={4} />
    </g>
  );
// a stack of bills seen from the side (n slabs)
const Stack: React.FC<{x: number; y: number; n: number; w?: number; wob?: number}> = ({x, y, n, w = 150, wob = 0}) => {
  const out: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const dx = Math.sin(i * 2.1) * 6 + wob * Math.sin(i * 0.9);
    out.push(<rect key={i} x={x - w / 2 + dx} y={y - (i + 1) * 13} width={w} height={15} rx={4} fill={i % 2 ? BILL : '#A9D290'} stroke="#000" strokeWidth={4} />);
  }
  return <g>{out}</g>;
};

// ---------- the guy ----------
type Pose = 'hero' | 'cheer' | 'push' | 'shock' | 'warm';
const poseAt = (t: number): [Pose, number] => {
  if (t < T.easy) return ['hero', -9];
  if (t < T.so3 + 0.05) return ['cheer', T.easy];
  if (t < CUT_D) return ['push', T.so3 + 0.05];
  if (t < T.marks) return ['push', CUT_D];
  if (t < CUT_E) return ['shock', T.marks];
  return ['warm', -9];
};
const headS = (n: Pose) => HR / (SPR[n] as unknown as {head: number[]}).head[2];
const headPos = (n: Pose, x: number, s: number, y = 0): [number, number] => {
  const sp = SPR[n] as unknown as {head: number[]; feet: number[]};
  return [x + (sp.head[0] - sp.feet[0]) * s, y + (sp.head[1] - sp.feet[1]) * s];
};

const Moth: React.FC<{t: number}> = ({t}) => {
  if (t < T.broke - 0.05 || t > 3.3) return null;
  // the wallet is at the hero's raised hand
  const s = headS('hero');
  const wx = GUY_X + (790 - SPR.hero.feet[0]) * s;
  const wy = (520 - SPR.hero.feet[1]) * s;
  const u = (t - T.broke) / 2.0;
  const x = wx + 260 * u + 40 * Math.sin(2 * Math.PI * 1.3 * t);
  const y = wy - 380 * u + 30 * Math.sin(2 * Math.PI * 2.1 * t);
  const fl = Math.abs(Math.sin(2 * Math.PI * 9 * t));
  const p = 1.7 * pop(t, T.broke - 0.05, 0.25);
  return (
    <g transform={`translate(${x} ${y}) scale(${p})`}>
      <ellipse cx={-16} cy={-6} rx={22} ry={16 * (0.3 + 0.7 * fl)} fill="#F1E6D2" stroke="#000" strokeWidth={4} />
      <ellipse cx={16} cy={-6} rx={22} ry={16 * (0.3 + 0.7 * fl)} fill="#F1E6D2" stroke="#000" strokeWidth={4} />
      <ellipse cx={0} cy={0} rx={7} ry={15} fill="#8C7F72" stroke="#000" strokeWidth={4} />
    </g>
  );
};

const Guy: React.FC<{t: number}> = ({t}) => {
  const [pose, tSwap] = poseAt(t);
  const s = headS(pose);
  const [sqx, sqy] = squashSwap(t, tSwap);
  let x = GUY_X;
  let bob = 0;
  let rot = 0;
  if (pose === 'push' && t < CUT_D) {
    x = GUY_X + 12;
    const ph = Math.sin(2 * Math.PI * 3.2 * t);
    rot = 3 * ph;
    bob = 6 * Math.abs(ph);
  }
  if (t >= CUT_D && t < CUT_E) {
    x = guyPushX(t);
    if (pose === 'push') {
      const ph = Math.sin(2 * Math.PI * 2.6 * t);
      bob = 10 * Math.abs(ph);
      rot = 2 * ph;
    }
  }
  if (pose === 'warm') x = ST_X - 450;
  const tremble = pose === 'shock' ? Math.sin(2 * Math.PI * 9 * t) * 2 : 0;
  const jump = pose === 'cheer' && t < CUT_C ? 40 * bump(t, T.fat, 0.3) + 40 * bump(t, T.everyone, 0.3) + 25 * bump(t, T.easy + 0.05, 0.3) : 0;
  const by = breathe(t) * (1 + 0.02 * bump(t, T.broke, 0.3));
  const [hx, hy] = headPos(pose, x, s);
  return (
    <>
      <div style={{position: 'absolute', left: x - 150, top: -18, width: 300, height: 36, borderRadius: '50%', background: 'rgba(60, 50, 40, 0.24)', filter: 'blur(3px)'}} />
      <Spr n={pose} x={x + tremble} y={-bob - jump} s={s} sx={sqx} sy={sqy * by} rot={rot} />
      {pose === 'shock' ? (
        <Svg>
          <SweatDrop x={hx + HR * 1.0} y={hy - HR * 0.3 + 30 * prog(t, T.marks + 0.3, CUT_E)} r={20} s={popOut(t, T.marks + 0.2, CUT_E)} rot={10} />
        </Svg>
      ) : null}
      {pose === 'push' && t < CUT_D && t > T.more ? (
        <Svg>
          <SweatDrop x={hx + HR * 0.9} y={hy - HR * 0.5 + 25 * prog(t, T.more, CUT_D)} r={18} s={popOut(t, T.more + 0.1, 15.9)} rot={15} />
        </Svg>
      ) : null}
    </>
  );
};

// small townspeople (clones of the cheer pose)
const Clones: React.FC<{t: number}> = ({t}) => {
  if (t < T.everyone - 0.02 || t >= CUT_C) return null;
  const s = headS('cheer') * 0.62;
  return (
    <>
      {CLONES.map((cx, i) => {
        const p = pop(t, T.everyone + i * 0.09, 0.3);
        const hop = 22 * Math.abs(Math.sin(2 * Math.PI * 1.6 * t + i * 1.1)) * (t < T.but ? 1 : 0.35);
        return (
          <React.Fragment key={i}>
            <div style={{position: 'absolute', left: cx - 90, top: -12, width: 180, height: 24, borderRadius: '50%', background: 'rgba(60, 50, 40, 0.22)', filter: 'blur(3px)', transform: `scaleX(${p})`}} />
            <Spr n="cheer" x={cx} y={-hop} s={s * p} sy={breathe(t, i)} />
          </React.Fragment>
        );
      })}
    </>
  );
};

// ---------- the printer ----------
const printing = (t: number) => (t >= T.print && t < T.everyoneEnd ? 1 : t >= T.so3 && t < CUT_D ? 2 : 0);
const Printer: React.FC<{t: number}> = ({t}) => {
  const mode = printing(t);
  const hz = mode === 2 ? 7 : 4.5;
  const ph = Math.sin(2 * Math.PI * hz * t);
  const wake = bump(t, T.money, 0.35);
  const sx = 1 + (mode ? 0.015 * ph : 0) - 0.03 * wake;
  const sy = 1 - (mode ? 0.02 * ph : 0) + 0.05 * wake;
  const jitter = mode === 2 ? Math.sin(2 * Math.PI * 13 * t) * 4 : 0;
  // face on the rollers
  const open = pop(t, T.money, 0.3);
  const squeeze = mode === 2 && t > T.more - 0.1;
  const [e1x, e1y] = prw(735, 300);
  const [e2x, e2y] = prw(905, 300);
  const look: [number, number] = t < 3.5 ? [-0.6, 0.1] : mode ? [0.6, 0.3] : [0.2, 0];
  const eyeY = (y: number) => y + (y - 0) * (sy - 1);
  const lid = t >= CUT_D ? 0 : 0;
  return (
    <>
      <div style={{position: 'absolute', left: PR_X - 400, top: -22, width: 800, height: 44, borderRadius: '50%', background: 'rgba(60, 50, 40, 0.26)', filter: 'blur(3px)'}} />
      <Spr n="printer" x={PR_X + jitter} y={0} s={PR_S} sx={sx} sy={sy} ax={PR_CX} ay={SPR.printer.bottom} />
      <Svg>
        <g transform={`translate(${jitter} 0)`}>
          <Eye x={PR_X + (e1x - PR_X) * sx} y={eyeY(e1y)} r={40} open={open} look={look} lid={lid} side={-1} squeeze={squeeze} brow={0.6} browTilt={mode === 2 ? -1 : 0} />
          <Eye x={PR_X + (e2x - PR_X) * sx} y={eyeY(e2y)} r={40} open={open} look={look} lid={lid} side={1} squeeze={squeeze} brow={0.6} browTilt={mode === 2 ? -1 : 0} />
        </g>
        {mode === 2 && t > T.more ? <SweatDrop x={prw(1080, 160)[0]} y={prw(1080, 160)[1] + 30 * prog(t, T.more, 15.5)} r={22} s={popOut(t, T.more + 0.15, 15.6)} rot={20} /> : null}
      </Svg>
    </>
  );
};

// steam puffs from the chimney
const Steam: React.FC<{t: number}> = ({t}) => {
  const puffs: {x: number; y: number; r: number}[] = [];
  const starts: number[] = [T.money];
  for (let k = 0; k < 8; k++) starts.push(T.print + k * 0.32);
  for (let k = 0; k < 18; k++) starts.push(T.so3 + k * 0.2);
  starts.forEach((t0, i) => {
    const u = (t - t0) / 0.9;
    if (u < 0 || u > 1 || (t0 > T.so3 && t > CUT_D)) return;
    const r = 50 * Math.sin(Math.PI * u) * (i === 0 ? 1.5 : 1);
    puffs.push({x: CHIMNEY[0] + 30 * u + 10 * Math.sin(i * 1.7), y: CHIMNEY[1] - 40 - 230 * u, r});
  });
  if (!puffs.length) return null;
  return <PuffCluster puffs={puffs} fill="#FFFFFF" ink={5} shade="#EEF1F4" />;
};

// sheets sliding out of the slot and flying off to the right
const Sheets: React.FC<{t: number}> = ({t}) => {
  const out: React.ReactNode[] = [];
  const add = (t0: number, i: number, far: boolean) => {
    const u = (t - t0) / 1.1;
    if (u < 0 || u > 1) return;
    const slide = clamp(u / 0.25);
    const fly = clamp((u - 0.25) / 0.75);
    const x0 = lerp(SLOT[0], TRAY[0], slide);
    const y0 = lerp(SLOT[1], TRAY[1] - 10, slide);
    const vx = far ? 900 + 500 * rnd(i) : 300 + 300 * rnd(i);
    const x = x0 + vx * fly;
    const y = y0 - 520 * fly + 600 * fly * fly;
    const rot = fly * (300 + 200 * rnd(i + 5)) * (rnd(i + 2) > 0.5 ? 1 : -1);
    out.push(<Bill key={`${t0}`} x={x} y={y} rot={rot} sy={fly > 0 ? Math.cos(fly * 9 + i) * 0.6 + 0.4 : 1} s={0.9} />);
  };
  // first: a few sheets go onto the stack; then they fly out to everyone
  for (let k = 0; k < 7; k++) add(T.everyone - 0.5 + k * 0.14, k, true);
  for (let k = 0; k < 22; k++) add(T.so3 + 0.05 + k * 0.17, k + 30, true);
  return <g>{out}</g>;
};
// the fat stack on the tray
const stackN = (t: number) => (t < T.print ? 0 : t < CUT_D ? Math.min(14, Math.floor(prog(t, T.print, T.stack + 0.15) * 14)) : 0);

// banknotes raining on everyone
const Rain: React.FC<{t: number}> = ({t}) => {
  if (t < T.everyone - 0.6 || t > 9.5) return null;
  const items: React.ReactNode[] = [];
  for (let i = 0; i < 26; i++) {
    const t0 = T.everyone - 0.6 + i * 0.07;
    const dur = 1.5 + 0.4 * rnd(i + 3);
    const u = (t - t0) / dur;
    if (u < 0 || u > 1.15) continue;
    const x0 = 700 + rnd(i) * 720;
    const y = lerp(-1700, -20, Math.min(u, 1));
    const x = x0 + 50 * Math.sin(2 * Math.PI * 1.2 * (t - t0) + i);
    const sc = u < 1 ? 1 : 1 - (u - 1) / 0.15;
    const rot = 30 * Math.sin(2 * Math.PI * 0.9 * (t - t0) + i * 2);
    items.push(<Bill key={i} x={x} y={y} rot={rot} s={0.8 * sc} sy={0.5 + 0.5 * Math.cos(2 * Math.PI * 1.5 * (t - t0) + i)} />);
  }
  return <g>{items}</g>;
};

// ---------- bakery: loaf, baker, price board ----------
const priceText = (t: number): string => {
  if (t < T.raises) return '1';
  if (t < T.price) return '2';
  if (t < CUT_C) return '5';
  if (t < T.costs) return '100';
  const u = Math.pow(prog(t, T.costs, T.marks), 1.25);
  const v = Math.round(Math.pow(10, lerp(2, Math.log10(2e11), u)));
  const vv = u >= 1 ? 200000000000 : v;
  return vv.toLocaleString('en-US');
};
const Board: React.FC<{t: number; s: number; x?: number; y?: number}> = ({t, s, x = BOARD.x, y = BOARD.y}) => {
  if (s <= 0.001) return null;
  const txt = priceText(t);
  const fs = Math.min(230, (BOARD.w - 70) / (0.74 * txt.length));
  const flip = [T.raises, T.price, T.marks].reduce((a, tf) => a + bump(t, tf, 0.25), 0);
  const marks = t >= CUT_C;
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${s}) rotate(${-2 + 2 * Math.sin(2 * Math.PI * 0.7 * t)}deg) scale(${1 + 0.08 * flip})`}}>
      <div
        style={{
          width: BOARD.w,
          height: BOARD.h,
          background: '#FFF6DF',
          border: '12px solid #000',
          borderRadius: 26,
          boxShadow: 'inset 0 -18px 0 #EFDDB4',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: FONT,
          boxSizing: 'border-box',
        }}
      >
        <div style={{fontSize: 56, color: '#B5532A', lineHeight: 1.05}}>1 BREAD =</div>
        <div style={{fontSize: fs, color: '#111', lineHeight: 1.0}}>{txt}</div>
        {marks ? <div style={{fontSize: 56, color: '#B5532A', lineHeight: 1.05}}>MARKS</div> : null}
      </div>
    </div>
  );
};

const Baker: React.FC<{t: number}> = ({t}) => {
  if (t < T.baker - 0.02 || t >= CUT_E) return null;
  const s = headS('cheer');
  const rise = easeOutCubic(prog(t, T.baker, T.baker + 0.3));
  const lift = 30 * bump(t, T.raises, 0.3) + 30 * bump(t, T.price, 0.3) + 45 * bump(t, T.marks, 0.35);
  const yFeet = BAKER_FEET + 420 * (1 - rise) - lift;
  const [hx, hy] = headPos('cheer', BAKER_X, s, yFeet);
  // clip everything below the counter top
  return (
    <>
      <div style={{position: 'absolute', left: BAKER_X - 600, top: -2000, width: 1200, height: 2000 + COUNTER_Y + 4, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: -(BAKER_X - 600), top: 2000}}>
          <Spr n="cheer" x={BAKER_X} y={yFeet} s={s} sy={breathe(t, 2)} />
          <Svg>
            {/* chef hat */}
            <g transform={`translate(${hx} ${hy - HR * 0.92})`}>
              <PuffCluster
                puffs={[
                  {x: -48, y: -48, r: 46},
                  {x: 0, y: -70, r: 52},
                  {x: 48, y: -48, r: 46},
                ]}
                fill="#FFFFFF"
                ink={7}
                shade="#EEF1F4"
              />
              <rect x={-72} y={-40} width={144} height={50} rx={10} fill="#FFFFFF" stroke="#000" strokeWidth={7} />
            </g>
          </Svg>
        </div>
      </div>
      <Board t={t} s={rise} y={BOARD.y + 420 * (1 - rise) - lift} />
    </>
  );
};

const Loaf: React.FC<{t: number}> = ({t}) => {
  const b = bump(t, T.same, 0.3) + bump(t, T.bread, 0.3) + bump(t, T.loaf, 0.3);
  return (
    <>
      <Spr n="loaf" x={LOAF_X} y={COUNTER_Y + 6} s={LOAF_S} sx={1 + 0.06 * b} sy={1 + 0.1 * b} />
      <Label x={LOAF_X} y={COUNTER_Y - 190} s={popOut(t, T.same - 0.05, CUT_C - 0.3)} text="ONLY 1" size={70} rot={-4} />
    </>
  );
};

// ---------- sign: GERMANY 1923 ----------
const Sign: React.FC<{t: number}> = ({t}) => {
  if (t < T.germany - 0.02 || t >= CUT_D) return null;
  const p = pop(t, T.germany, 0.35);
  const x = 720;
  return (
    <div style={{position: 'absolute', left: x, top: 0, transform: `scale(${p})`, transformOrigin: '0 0'}}>
      <div style={{position: 'absolute', left: -14, top: -430, width: 28, height: 430, background: '#8A5A2B', border: '7px solid #000', boxSizing: 'border-box'}} />
      <div
        style={{
          position: 'absolute',
          left: -230,
          top: -700,
          width: 460,
          height: 300,
          background: '#C98E55',
          border: '10px solid #000',
          borderRadius: 18,
          boxSizing: 'border-box',
          fontFamily: FONT,
          color: '#FFF3D6',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          transform: `rotate(${-3 + 3 * bump(t, T.twenty3, 0.3)}deg)`,
        }}
      >
        <div style={{fontSize: 80, lineHeight: 1.05, WebkitTextStroke: '10px #000', paintOrder: 'stroke fill'}}>GERMANY</div>
        <div style={{fontSize: 110 * (1 + 0.15 * bump(t, T.twenty3, 0.3)), lineHeight: 1.05, WebkitTextStroke: '12px #000', paintOrder: 'stroke fill'}}>1923</div>
      </div>
    </div>
  );
};

// ---------- wheelbarrow full of cash ----------
const Barrow: React.FC<{x: number; t: number; flip?: boolean; full?: number}> = ({x, t, flip = true, full = 1}) => {
  // flip = handles on the LEFT (pushed by the guy); x = left edge
  const s = BAR_S;
  const w = SPR.barrow.w * s;
  const trayL = flip ? x + (SPR.barrow.w - 489) * s : x + 148 * s;
  const trayR = flip ? x + (SPR.barrow.w - 148) * s : x + 489 * s;
  const trayY = -178 + (40 - 98) * s + 10;
  const bills: React.ReactNode[] = [];
  const n = Math.round(16 * full);
  for (let i = 0; i < n; i++) {
    const row = Math.floor(i / 5);
    const c = i % 5;
    const bx = lerp(trayL + 30, trayR - 30, (c + 0.5 * (row % 2)) / 4.5);
    const by = trayY - row * 34 - 18 * Math.sin((c / 4) * Math.PI);
    bills.push(<Bill key={i} x={bx} y={by} rot={(rnd(i) - 0.5) * 50} s={0.75} sy={0.8} />);
  }
  const wob = Math.sin(2 * Math.PI * 2.6 * t) * 1.2;
  return (
    <>
      <div style={{position: 'absolute', left: x + 40, top: -14, width: w - 80, height: 28, borderRadius: '50%', background: 'rgba(60, 50, 40, 0.22)', filter: 'blur(3px)'}} />
      <Svg>
        <g transform={`rotate(${wob} ${x + w / 2} -100)`}>{bills}</g>
      </Svg>
      <div style={{position: 'absolute', left: 0, top: 0, transform: `rotate(${wob}deg)`, transformOrigin: `${x + w / 2}px -100px`}}>
        <Spr n="barrow" x={flip ? x + w : x} y={-178 + (SPR.barrow.bottom - 98) * s} s={s} flip={flip} ax={0} ay={SPR.barrow.bottom} />
      </div>
    </>
  );
};

// ---------- the stove scene ----------
const fireOn = (t: number) => clamp((t - T.burn) / 0.2);
const Stove: React.FC<{t: number}> = ({t}) => {
  const flare = bump(t, T.stove - 0.05, 0.6);
  const sq = 1 + 0.06 * flare;
  const op = fireOn(t);
  const fl = (k: number) => 0.85 + 0.15 * Math.sin(2 * Math.PI * (5 + k) * t + k * 2);
  const [dx, dy] = DOOR;
  const happy = t > T.stove;
  return (
    <>
      <div style={{position: 'absolute', left: ST_X - 140, top: -16, width: 280, height: 32, borderRadius: '50%', background: 'rgba(40, 30, 20, 0.3)', filter: 'blur(3px)'}} />
      <Spr n="stove" x={ST_X} y={0} s={ST_S} sx={1 / Math.sqrt(sq)} sy={sq} />
      <Svg>
        {op > 0 ? (
          <g transform={`translate(${dx} ${dy})`}>
            <circle r={DOOR_R * 1.05} fill="#1A1210" stroke="#000" strokeWidth={6} />
            <g transform={`scale(${op * (1.25 + 0.5 * flare)})`}>
              <path d={`M ${-30} 30 Q ${-34 * fl(0)} ${-10} ${-10} ${-44 * fl(1) * (1 + flare)} Q 0 ${-10} 6 ${-30 * fl(2) * (1 + flare)} Q 22 0 ${30} 30 Z`} fill="#FF7A2B" />
              <path d={`M ${-16} 30 Q ${-18} 6 ${-4} ${-22 * fl(3) * (1 + flare)} Q 8 4 18 30 Z`} fill="#FFC867" />
            </g>
            {/* the door swung open to the left */}
            <ellipse cx={-DOOR_R * 1.15} cy={0} rx={DOOR_R * 0.28 * (0.3 + 0.7 * op)} ry={DOOR_R} fill="#2A2A2A" stroke="#000" strokeWidth={6} />
          </g>
        ) : null}
        {/* face above the door */}
        <Eye x={ST_X - 34} y={dy - 92} r={19} open={pop(t, CUT_E + 0.15, 0.3)} lid={happy ? 0.45 : 0} look={happy ? [0, 0] : [0.5, -0.2]} side={-1} brow={0.7} />
        <Eye x={ST_X + 34} y={dy - 92} r={19} open={pop(t, CUT_E + 0.15, 0.3)} lid={happy ? 0.45 : 0} look={happy ? [0, 0] : [0.5, -0.2]} side={1} brow={0.7} />
      </Svg>
    </>
  );
};
// chimney smoke + bundles flying into the stove
const StoveFx: React.FC<{t: number}> = ({t}) => {
  const g: React.ReactNode[] = [];
  const chim: [number, number] = [ST_X + (136 - SPR.stove.feet[0]) * ST_S, (20 - SPR.stove.feet[1]) * ST_S];
  const puffs: {x: number; y: number; r: number}[] = [];
  for (let k = 0; k < 10; k++) {
    const t0 = T.burn + 0.1 + k * 0.33;
    const u = (t - t0) / 1.2;
    if (u < 0 || u > 1) continue;
    puffs.push({x: chim[0] + 40 * u + 12 * Math.sin(k), y: chim[1] - 30 - 260 * u, r: 28 * Math.sin(Math.PI * u) * (k === 3 ? 1.5 : 1)});
  }
  g.push(<PuffCluster key="sm" puffs={puffs} fill="#8D8783" ink={5} shade="#7A7470" />);
  // 4 bundles of cash thrown from the barrow into the door
  const src: [number, number] = [ST_X + 330, -250];
  for (let i = 0; i < 4; i++) {
    const t0 = T.cash2 - 0.35 + i * 0.16;
    const u = (t - t0) / 0.5;
    if (u < 0 || u > 1) continue;
    const x = lerp(src[0] + i * 20, DOOR[0], u);
    const y = lerp(src[1], DOOR[1], u) - 180 * Math.sin(Math.PI * u);
    g.push(
      <g key={`b${i}`}>
        <Bill x={x} y={y} rot={-200 * u - i * 30} s={0.8 * (1 - 0.5 * u)} />
      </g>,
    );
  }
  // sparks on the flare
  for (let i = 0; i < 6; i++) {
    const u = (t - T.stove - i * 0.05) / 0.7;
    if (u < 0 || u > 1) continue;
    const a = -Math.PI / 2 + (rnd(i + 70) - 0.5) * 2.2;
    g.push(<circle key={`s${i}`} cx={DOOR[0] + Math.cos(a) * 180 * u} cy={DOOR[1] + Math.sin(a) * 180 * u + 120 * u * u} r={9 * (1 - u)} fill="#FFC867" stroke="#000" strokeWidth={3} />);
  }
  return <Svg>{g}</Svg>;
};
// the firewood that is too expensive
const Firewood: React.FC<{t: number}> = ({t}) => {
  const p = pop(t, T.cheaper - 0.05, 0.3);
  if (p <= 0.001) return null;
  const x = ST_X - 30;
  const y = -640;
  const xs = pop(t, T.firewood + 0.05, 0.25);
  return (
    <Svg>
      <g transform={`translate(${x} ${y}) scale(${p}) rotate(-8)`}>
        <rect x={-110} y={-36} width={220} height={72} rx={36} fill="#9A6234" stroke="#000" strokeWidth={8} />
        <ellipse cx={110} cy={0} rx={22} ry={36} fill="#E7B77D" stroke="#000" strokeWidth={8} />
        <ellipse cx={110} cy={0} rx={10} ry={17} fill="none" stroke="#B9844B" strokeWidth={5} />
        <path d="M -70 -10 L -10 -10 M -40 12 L 40 12" stroke="#6E4322" strokeWidth={6} strokeLinecap="round" />
      </g>
      {xs > 0.001 ? (
        <g transform={`translate(${x} ${y}) scale(${0.72 * xs})`}>
          <path d="M -120 -110 L 120 110 M 120 -110 L -120 110" stroke="#000" strokeWidth={46} strokeLinecap="round" />
          <path d="M -120 -110 L 120 110 M 120 -110 L -120 110" stroke="#E2332B" strokeWidth={28} strokeLinecap="round" />
        </g>
      ) : null}
    </Svg>
  );
};
const Family: React.FC<{t: number}> = ({t}) => {
  const s = headS('warm');
  const kids: [number, number][] = [
    [ST_X - 295, 0.68],
    [ST_X - 175, 0.55],
  ];
  return (
    <>
      {kids.map(([kx, ks], i) => (
        <React.Fragment key={i}>
          <div style={{position: 'absolute', left: kx - 110 * ks, top: -12, width: 220 * ks, height: 24, borderRadius: '50%', background: 'rgba(40, 30, 20, 0.24)', filter: 'blur(3px)'}} />
          <Spr n="warm" x={kx} y={-12 * bump(t, T.stove + i * 0.08, 0.3)} s={s * ks} sy={breathe(t, i + 1)} />
        </React.Fragment>
      ))}
    </>
  );
};

// ---------- the whole world at time t ----------
export const Scene: React.FC<{t: number; cam: Cam; cover?: boolean}> = ({t, cam, cover}) => {
  const blur = 2.6 * clamp((cam.k - 1.25) / 0.4);
  const shakeAmp = printing(t) === 2 ? 3 : 0;
  const sh = shake(t, shakeAmp + 3 * bump(t, T.money, 0.25) + 4 * bump(t, T.stove, 0.3));
  const camS = {x: cam.x - sh.x / cam.k, y: cam.y - sh.y / cam.k, k: cam.k};
  const sepia = cover ? 0 : t < T.thats ? 0 : 0.42 * easeInOutCubic(prog(t, T.thats, T.germany + 0.4));
  const dusk = t >= CUT_E && !cover ? 1 : 0;
  const barrowX = guyPushX(t) + 178;
  return (
    <AbsoluteFill style={{background: SKY, filter: sepia > 0.001 ? `sepia(${sepia})` : undefined}}>
      <World cam={camS} depth={1.35} blur={blur}>
        <div style={{position: 'absolute', left: -9000, top: -330, width: 18000, height: 6000, background: GROUND}} />
        {[-3, -2, -1, 0, 1, 2, 3].map((i) => (
          <Img
            key={i}
            src={F('bg')}
            style={{position: 'absolute', left: i * 2048, top: -330 - 1690, width: 2048, height: 3072, transform: i % 2 ? 'scaleX(-1)' : undefined}}
          />
        ))}
      </World>
      <World cam={camS}>
        {t < CUT_E ? (
          <>
            <Spr n="bakery" x={BK_X} y={0} s={BK_S} ax={BK_CX} ay={SPR.bakery.bottom} />
            <Baker t={t} />
            <Loaf t={t} />
            {t < CUT_D ? <Printer t={t} /> : null}
            <Svg>
              {stackN(t) > 0 ? <Stack x={TRAY[0] - 60} y={TRAY[1] + 8} n={stackN(t)} wob={printing(t) ? 3 * Math.sin(2 * Math.PI * 4.5 * t) : 0} /> : null}
              <Steam t={t} />
              {cover ? null : <Sheets t={t} />}
            </Svg>
            <Sign t={t} />
            <Clones t={t} />
            {t >= CUT_D ? <Barrow x={barrowX} t={t} /> : null}
            <Guy t={t} />
            <Svg>
              <Moth t={t} />
              {cover ? null : <Rain t={t} />}
            </Svg>
          </>
        ) : (
          <>
            <Barrow x={ST_X + 150} t={0} flip={false} full={1 - 0.45 * prog(t, T.cash2 - 0.35, T.cash2 + 0.3)} />
            <Stove t={t} />
            <StoveFx t={t} />
            <Family t={t} />
            <Guy t={t} />
            <Firewood t={t} />
          </>
        )}
        <Label x={PR_X - 40} y={-690} s={t < CUT_D && !cover ? popOut(t, T.more - 0.05, 13.6, 0.25) : 0} text="MORE!" size={92} rot={-6} />
      </World>
      {dusk ? (
        <>
          <AbsoluteFill style={{background: 'rgba(40, 36, 110, 0.22)'}} />
          <StoveGlow t={t} cam={camS} />
        </>
      ) : null}
    </AbsoluteFill>
  );
};
const StoveGlow: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const sx = 540 + (DOOR[0] - cam.x) * cam.k;
  const sy = 960 + (DOOR[1] - cam.y) * cam.k;
  const a = 0.15 + 0.3 * fireOn(t) + 0.15 * bump(t, T.stove - 0.05, 0.6) + 0.03 * Math.sin(2 * Math.PI * 3 * t);
  const R = 900 * cam.k;
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle ${R}px at ${sx}px ${sy}px, rgba(255, 170, 70, ${a}) 0%, rgba(255, 150, 60, ${a * 0.4}) 45%, rgba(255, 150, 60, 0) 100%)`,
        mixBlendMode: 'screen',
      }}
    />
  );
};

const CUES: Cue[] = [
  {f: 'pop', at: T.broke + 0.02, db: -24},
  {f: 'boing', at: T.money, db: -24},
  {f: 'hiss', at: T.money + 0.05, db: -30, dur: 0.6},
  {f: 'pop', at: T.easy, db: -24},
  {f: 'press', at: T.print, db: -22, dur: 2.0},
  {f: 'press', at: T.print + 1.95, db: -24, dur: 0.6, keys: [[T.print + 1.95, -24], [T.print + 2.5, -40]]},
  {f: 'cash', at: T.everyone - 0.3, db: -20},
  {f: 'pop', at: T.everyone, db: -24},
  {f: 'pop', at: T.everyone + 0.09, db: -25, rate: 1.15},
  {f: 'pop', at: T.everyone + 0.18, db: -25, rate: 1.3},
  {f: 'cash', at: 7.0, db: -24, rate: 0.9},
  {f: 'whoosh', at: T.but + 0.15, db: -30},
  {f: 'pop', at: T.same, db: -22},
  {f: 'pop', at: T.baker, db: -21, rate: 0.85},
  {f: 'flip', at: T.raises - 0.25, db: -22},
  {f: 'flip', at: T.price - 0.25, db: -22, rate: 1.1},
  {f: 'kaching', at: T.price + 0.05, db: -24},
  {f: 'whoosh', at: 12.25, db: -27},
  {f: 'press', at: T.so3 + 0.1, db: -20, rate: 1.25, dur: 1.6},
  {f: 'press', at: T.so3 + 1.7, db: -22, rate: 1.25, dur: 1.6},
  {f: 'hiss', at: T.so3 + 0.2, db: -30, dur: 1.4},
  {f: 'cash', at: T.more, db: -21},
  {f: 'press', at: T.so3 + 3.3, db: -25, rate: 1.25, dur: 0.5, keys: [[T.so3 + 3.3, -25], [T.so3 + 3.8, -45]]},
  {f: 'stamp', at: T.germany, db: -18},
  {f: 'barrow', at: CUT_D, db: -21, dur: 1.48},
  {f: 'barrow', at: CUT_D + 1.4, db: -22, dur: 1.48, keys: [[CUT_D + 1.4, -22], [CUT_D + 2.7, -24], [CUT_D + 2.9, -45]]},
  {f: 'ticks', at: T.costs, db: -26, dur: 1.9, keys: [[T.costs, -26], [T.marks - 0.1, -26], [T.marks + 0.05, -45]]},
  {f: 'kaching', at: T.marks, db: -21},
  {f: 'sad_horn', at: T.marks + 0.35, db: -27, dur: 0.6, keys: [[T.marks + 0.35, -27], [T.marks + 0.8, -27], [T.marks + 0.95, -45]]},
  {f: 'whoosh', at: CUT_E - 0.1, db: -28},
  {f: 'cash', at: T.cash2 - 0.4, db: -24, rate: 1.1},
  {f: 'fire', at: T.burn, db: -22},
  {f: 'fire', at: T.stove - 0.05, db: -17},
  {f: 'pop', at: T.cheaper, db: -22},
  {f: 'stamp', at: T.firewood + 0.05, db: -19},
];

export const PrintMoneyShort: React.FC = () => {
  usePMFont();
  const f = useCurrentFrame();
  const t = f / FPS;
  return (
    <AbsoluteFill style={{background: SKY}}>
      <Scene t={t} cam={camOf(t)} />
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('print-money/vo/take1.mp3')} volume={Math.pow(10, MIX_DB / 20)} />
      </Sequence>
      <Audio src={staticFile('print-money/music/bed.wav')} volume={Math.pow(10, MIX_DB / 20)} />
      <SoundCues cues={CUES.map((c) => ({...c, db: c.db + MIX_DB, keys: c.keys?.map(([a, b]) => [a, b + MIX_DB] as [number, number])}))} dir="print-money/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};
