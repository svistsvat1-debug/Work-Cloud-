import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SPR} from './sprites';
import {C1, C2, C3, C4, C5, C6, C7, FPS, T, VO_AT} from './scene';
import {easeInCubic, easeInOutCubic, easeOutCubic, lerp, pop, prog, spring, type Cam} from '../shared/anim';
import {World} from '../shared/World';
import {Eye} from '../shared/Face';
import {PuffCluster, type Puff} from '../shared/Puffs';
import {SweatDrop} from '../shared/SweatDrop';
import {SoundCues, type Cue} from '../shared/Sound';
import {useFont} from '../shared/useFont';

// "Why do farmers paint eyes on cows' butts?" - Botswana savanna.
// S1 wide: a lion tiptoes up behind a grazing cow (sign: BOTSWANA). S2: sly lion close-up hiding in the grass, ducks on
// "surprise". S3: the lion's view of the rump: two big painted eyes pop open and stare. S3b: the lion freezes, mane
// bristles, sweat, gulp. S3c: pull back: the eyes are on her butt, she chews, unbothered. S4: the guy paints them on,
// then blows on his brush. S5 wide: the eyes look at the lion -> "!" -> it turns and walks off whistling. S6: a YEARS
// counter runs to 4, the lion peeks in twice and zips away. S7: the camera slides to her friend with no eyes: a dust
// poof, only her bell is left, a lion slinks off licking its lips.

const F = (n: string) => staticFile(`cow-eyes/${n}.png`);
export const FONT = 'CowInter';
export const useCowFont = () => useFont(FONT, staticFile('fonts/Inter-Black.otf'));
const MIX_DB = 0;
export const SKY = '#8FC9F2';

// ---------- small helpers ----------
const bump = (t: number, t0: number, dur = 0.22) => Math.sin(Math.PI * prog(t, t0, t0 + dur));
const breathe = (t: number, ph = 0) => 1 + 0.009 * Math.sin(2 * Math.PI * 0.6 * t + ph);
const squashSwap = (t: number, tSwap: number): [number, number] => {
  if (t < tSwap - 0.08) return [1, 1];
  if (t < tSwap) {
    const u = prog(t, tSwap - 0.08, tSwap);
    return [1 + 0.06 * u, 1 - 0.07 * u];
  }
  const s = spring(t - tSwap, 3.2, 7);
  return [1 - 0.04 * s, 1 + 0.05 * s];
};
const popOut = (t: number, t0: number, t1: number, dur = 0.25) => (t < t1 ? pop(t, t0, dur) : Math.max(0, 1 - easeInCubic(prog(t, t1, t1 + 0.2))));

type SprName = keyof typeof SPR;
// A sprite placed by its feet point (x, y) at scale s; squash/flip/rotate about the feet.
const Spr: React.FC<{
  n: Exclude<SprName, 'bg'>;
  x: number;
  y: number;
  s: number;
  sx?: number;
  sy?: number;
  rot?: number;
  flip?: boolean;
  children?: React.ReactNode; // svg overlay in sprite pixels
}> = ({n, x, y, s, sx = 1, sy = 1, rot = 0, flip = false, children}) => {
  const d = SPR[n];
  const [fx, fy] = d.feet;
  return (
    <div
      style={{
        position: 'absolute',
        left: x - fx * s,
        top: y - fy * s,
        width: d.w * s,
        height: d.h * s,
        transformOrigin: `${fx * s}px ${fy * s}px`,
        transform: `rotate(${rot}deg) scale(${(flip ? -1 : 1) * sx}, ${sy})`,
      }}
    >
      <Img src={F(n)} style={{position: 'absolute', left: 0, top: 0, width: '100%', height: '100%'}} />
      {children ? (
        <svg viewBox={`0 0 ${d.w} ${d.h}`} style={{position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', overflow: 'visible'}}>
          {children}
        </svg>
      ) : null}
    </div>
  );
};

const Shadow: React.FC<{x: number; y: number; w: number}> = ({x, y, w}) => (
  <div
    style={{
      position: 'absolute',
      left: x - w / 2,
      top: y - w * 0.07,
      width: w,
      height: w * 0.14,
      borderRadius: '50%',
      background: 'rgba(110, 80, 30, 0.26)',
      filter: 'blur(3px)',
    }}
  />
);

// Painted eyes: closed = two arcs; open = Eye with a pop. sc = pop scale of the whole eye.
const PaintedEye: React.FC<{x: number; y: number; r: number; sc: number; open: number; look: [number, number]; lid?: number; side: 1 | -1; brow?: number}> = ({
  x,
  y,
  r,
  sc,
  open,
  look,
  lid = 0,
  side,
  brow = 0.5,
}) => {
  if (sc <= 0.001) return null;
  if (open < 0.5 || lid > 0.5) {
    return (
      <g transform={`translate(${x} ${y}) scale(${sc})`}>
        <path d={`M ${-0.85 * r} 0 Q 0 ${0.55 * r} ${0.85 * r} 0`} fill="none" stroke="#000" strokeWidth={r * 0.22} strokeLinecap="round" />
      </g>
    );
  }
  return <Eye x={x} y={y} r={r * sc} open={1} look={look} lid={lid} side={side} brow={brow} ink={0.17} />;
};

const Bang: React.FC<{x: number; y: number; s: number; text?: string; size?: number; color?: string}> = ({x, y, s, text = '!', size = 150, color = '#FFD23F'}) =>
  s <= 0.001 ? null : (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${s})`,
        fontFamily: FONT,
        fontSize: size,
        lineHeight: 1,
        color,
        WebkitTextStroke: `${size * 0.16}px #000`,
        paintOrder: 'stroke fill',
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </div>
  );

// Grass tufts (code): golden blades with outlines, swaying.
const Tufts: React.FC<{t: number; x0: number; x1: number; y: number; h: number; n: number; seed?: number; w?: number}> = ({t, x0, x1, y, h, n, seed = 0, w = 4}) => {
  const blades: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const r1 = Math.abs(Math.sin((i + 1) * 12.9898 + seed * 78.233)) % 1;
    const bx = lerp(x0, x1, (i + 0.5) / n) + (r1 - 0.5) * ((x1 - x0) / n);
    const bh = h * (0.7 + 0.5 * r1);
    const sway = Math.sin(2 * Math.PI * 0.7 * t + i * 1.3) * 0.08 * bh;
    const lean = (r1 - 0.5) * 0.5 * bh;
    const bw = bh * 0.11;
    const fill = i % 3 === 0 ? '#D9A93C' : '#EBC45A';
    blades.push(
      <path
        key={i}
        d={`M ${bx - bw} ${y} Q ${bx - bw * 0.3 + lean * 0.4} ${y - bh * 0.6} ${bx + lean + sway} ${y - bh} Q ${bx + bw * 0.3 + lean * 0.4} ${y - bh * 0.55} ${bx + bw} ${y} Z`}
        fill={fill}
        stroke="#000"
        strokeWidth={w}
        strokeLinejoin="round"
      />,
    );
  }
  return <>{blades}</>;
};

// Screen-space savanna plate with gentle parallax / zoom.
const Plate: React.FC<{dx?: number; scale?: number; top?: number; blur?: number}> = ({dx = 0, scale = 1.375, top = -20, blur = 0}) => {
  const w = SPR.bg.w * scale;
  const h = SPR.bg.h * scale;
  return (
    <Img
      src={F('bg')}
      style={{
        position: 'absolute',
        left: (1080 - w) / 2 + dx,
        top,
        width: w,
        height: h,
        filter: blur ? `blur(${blur}px)` : undefined,
      }}
    />
  );
};

const Sign: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) =>
  s <= 0.001 ? null : (
    <div style={{position: 'absolute', left: x, top: y, transformOrigin: '0 0', transform: `scale(${s})`}}>
      <div style={{position: 'absolute', left: -14, top: -170, width: 28, height: 170, background: '#9A6A3A', border: '6px solid #000', borderRadius: 4}} />
      <div
        style={{
          position: 'absolute',
          left: -190,
          top: -250,
          width: 380,
          height: 110,
          background: '#C8904F',
          border: '8px solid #000',
          borderRadius: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: FONT,
          fontSize: 62,
          color: '#FFF6E0',
          WebkitTextStroke: '10px #000',
          paintOrder: 'stroke fill',
          letterSpacing: 2,
          transform: 'rotate(-4deg)',
        }}
      >
        BOTSWANA
      </div>
    </div>
  );

const Bell: React.FC<{x: number; y: number; s: number; rot?: number}> = ({x, y, s, rot = 0}) => (
  <svg style={{position: 'absolute', left: x - 60 * s, top: y - 110 * s, width: 120 * s, height: 120 * s, overflow: 'visible'}} viewBox="-60 -110 120 120">
    <g transform={`rotate(${rot} 0 -10)`}>
      <path d="M -40 -8 Q -40 -80 0 -88 Q 40 -80 40 -8 L 48 0 L -48 0 Z" fill="#F4B92D" stroke="#000" strokeWidth={8} strokeLinejoin="round" />
      <path d="M -22 -70 Q -30 -40 -28 -14" fill="none" stroke="#FFE08A" strokeWidth={8} strokeLinecap="round" />
      <circle cx={0} cy={6} r={11} fill="#B7811C" stroke="#000" strokeWidth={7} />
      <rect x={-9} y={-104} width={18} height={18} rx={6} fill="#C9302C" stroke="#000" strokeWidth={6} />
    </g>
  </svg>
);

const Sparkle: React.FC<{x: number; y: number; s: number; rot?: number}> = ({x, y, s, rot = 0}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d="M 0 -40 Q 6 -6 40 0 Q 6 6 0 40 Q -6 6 -40 0 Q -6 -6 0 -40 Z" fill="#FFE45C" stroke="#000" strokeWidth={6} strokeLinejoin="round" />
    </g>
  );

// ---------- cow eye anchors (sprite px) ----------
const SIDE_EYES: [number, number][] = [
  [190, 222],
  [328, 206],
];
const SIDE_R = 50;
const REAR_EYES: [number, number][] = [
  [255, 640],
  [585, 640],
];
const REAR_R = 100;

// ---------- world layout (wide shots) ----------
const COW_S = 0.6;
const LION_S = 0.85;
const LY = 260; // lion ground line (foreground)
const COW_X = 150; // eyes cow feet x, ground y 0
const FRIEND = {x: 660, y: -90, s: 0.45};

const camLerp = (a: Cam, b: Cam, u: number): Cam => ({x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), k: Math.exp(lerp(Math.log(a.k), Math.log(b.k), u))});

// ============ S1 / S5 / S6 / S7: the wide world ============
const Wide: React.FC<{t: number; cover?: boolean}> = ({t, cover = false}) => {
  const phase = t < C1 ? 1 : t < C7 ? 5 : 6;
  // camera
  let cam: Cam;
  if (cover) cam = {x: -90, y: -380, k: 1.05};
  else if (phase === 1) cam = camLerp({x: 40, y: -414, k: 0.95}, {x: -60, y: -360, k: 1.08}, easeInOutCubic(prog(t, 0, 2.95)));
  else if (phase === 5) cam = camLerp({x: -60, y: -360, k: 1.08}, {x: -240, y: -380, k: 1.0}, easeInOutCubic(prog(t, 15.4, 16.3)));
  else {
    const a = {x: 250, y: -450, k: 0.9};
    const b = {x: 640, y: -450, k: 1.05};
    cam = camLerp(a, b, easeInOutCubic(prog(t, 19.85, 20.45)));
  }
  const bgDx = -cam.x * 0.12;

  // --- cow with (or without) eyes ---
  const hasEyes = phase !== 1 || cover;
  const cowBreath = breathe(t);
  // eyes look at the lion
  let look: [number, number] = [-0.8, 0.55];
  let eyeBump = 1;
  if (phase === 5) eyeBump = 1 + 0.18 * bump(t, T.spotted, 0.3);
  if (phase === 6) {
    const peek = (t > 16.9 && t < 17.55) || (t > 17.95 && t < 18.6);
    look = peek ? [-0.85, 0.5] : t > 19.3 ? [0.2, 0.15] : [-0.3, 0.2];
    if (t > 20.0) look = [1, 0.1];
  }
  const wink = phase === 6 && t > T.eaten && t < T.eaten + 0.35 ? 1 : 0;

  // --- lion ---
  let lion: React.ReactNode = null;
  if (phase === 1 || cover) {
    const u = cover ? 1 : prog(t, 0, 2.9);
    const x = lerp(-540, -420, u);
    const step = Math.abs(Math.sin(Math.PI * 2.0 * Math.min(t, 2.9)));
    const y = -12 * step;
    const rot = 3 * Math.sin(Math.PI * 4.0 * Math.min(t, 2.9));
    lion = (
      <>
        <Shadow x={x} y={LY} w={450} />
        <Spr n="lionSneak" x={x} y={LY + y} s={LION_S} rot={rot} sy={breathe(t, 1)} />
      </>
    );
  } else if (phase === 5) {
    const recoil = bump(t, T.lion2, 0.3);
    if (t < T.walks) {
      const tremble = t > T.spotted ? 2 * Math.sin(2 * Math.PI * 18 * t) : 0;
      lion = (
        <>
          <Shadow x={-420} y={LY} w={450} />
          <Spr n="lionSneak" x={-420 - 18 * recoil + tremble} y={LY} s={LION_S} sx={1 - 0.05 * recoil} sy={1 + 0.08 * recoil} rot={-4 * recoil} />
        </>
      );
    } else {
      const [sx, sy] = squashSwap(t, T.walks);
      const u = prog(t, T.walks + 0.15, C7);
      const x = lerp(-400, -1300, u);
      const bob = -10 * Math.abs(Math.sin(Math.PI * 3.2 * (t - T.walks)));
      lion = (
        <>
          <Shadow x={x} y={LY} w={400} />
          <Spr n="lionWalk" x={x} y={LY + bob} s={LION_S} flip sx={sx} sy={sy} />
        </>
      );
    }
  } else if (phase === 6) {
    // two peeks from the left edge, then (S7) the lion slinks off from the friend
    const peekX = (t0: number) => {
      const inn = easeOutCubic(prog(t, t0, t0 + 0.25));
      const out = easeInCubic(prog(t, t0 + 0.5, t0 + 0.65));
      return lerp(-950, -500, inn) - 500 * out;
    };
    const px = t < 17.7 ? peekX(16.9) : peekX(17.95);
    if (t > 16.9 && t < 18.65) lion = <Spr n="lionSneak" x={px} y={LY} s={LION_S} />;
    if (t > 20.85) {
      const u = easeInCubic(prog(t, 20.85, 21.45));
      lion = <Spr n="lionSneak" x={lerp(FRIEND.x + 60, FRIEND.x + 900, u)} y={FRIEND.y + 60} s={LION_S * 0.7} />;
    }
  }

  // --- friend cow (S6/S7) + dust poof ---
  let friend: React.ReactNode = null;
  let poof: React.ReactNode = null;
  let bell: React.ReactNode = null;
  if (phase === 6) {
    const gone = t > 20.62;
    if (!gone) friend = <Spr n="cowSide" x={FRIEND.x} y={FRIEND.y} s={FRIEND.s} sy={breathe(t, 2)} />;
    const ps = t < 20.45 ? 0 : t < 21.0 ? easeOutCubic(prog(t, 20.45, 20.65)) : 1 - easeInCubic(prog(t, 21.0, 21.35));
    if (ps > 0.01) {
      const cx = FRIEND.x + 60;
      const cy = FRIEND.y - 150;
      const puffs: Puff[] = [];
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2 + t * 3;
        const rr = 200 + 30 * Math.sin(t * 9 + i);
        puffs.push({x: cx + Math.cos(a) * rr * 1.25, y: cy + Math.sin(a) * rr * 0.6, r: (120 + 25 * Math.sin(t * 11 + i * 2)) * ps});
      }
      puffs.push({x: cx, y: cy, r: 230 * ps});
      poof = (
        <svg style={{position: 'absolute', left: 0, top: 0, width: 1, height: 1, overflow: 'visible'}}>
          <PuffCluster puffs={puffs} fill="#E3CFA4" shade="#D2BA88" ink={9} />
        </svg>
      );
    }
    if (t > 20.95) {
      const tb = t - 21.0;
      const by = tb < 0 ? -200 : -Math.abs(Math.cos(Math.PI * 2.4 * tb)) * 120 * Math.exp(-4 * tb);
      bell = <Bell x={FRIEND.x + 60} y={FRIEND.y + by} s={1.9} rot={20 * Math.sin(8 * tb) * Math.exp(-3 * tb)} />;
    }
  }

  // eyes on the main cow (side view)
  const eyesSc = hasEyes ? 1 : 0;
  const sweat = phase === 6 ? popOut(t, 21.2, 99) : 0;
  const cowEyes = (
    <>
      {SIDE_EYES.map(([ex, ey], i) => (
        <PaintedEye
          key={i}
          x={ex}
          y={ey}
          r={SIDE_R * eyeBump}
          sc={eyesSc}
          open={1}
          look={look}
          lid={i === 1 ? wink : 0}
          side={i === 0 ? -1 : 1}
          brow={phase === 5 && t > T.spotted ? 0.65 : 0.5}
        />
      ))}
      <SweatDrop x={1180} y={110} r={42} s={sweat} rot={-12} />
    </>
  );

  // BOTSWANA sign
  const signS = phase === 1 ? pop(t, T.botswana - 0.05, 0.3) : 0;

  return (
    <AbsoluteFill style={{background: SKY}}>
      <Plate dx={bgDx} />
      <World cam={cam}>
        <Sign x={-330} y={-40} s={signS * 0.75} />
        {friend}
        {bell}
        <Shadow x={COW_X + 40} y={0} w={760} />
        <Spr n="cowSide" x={COW_X} y={0} s={COW_S} sy={cowBreath}>
          {cowEyes}
        </Spr>
        {lion}
        {poof}
        {phase === 5 && !cover ? <Bang x={-170} y={-150} s={popOut(t, T.lion2 + 0.1, T.walks)} /> : null}
        <svg style={{position: 'absolute', left: 0, top: 0, width: 1, height: 1, overflow: 'visible'}}>
          <Tufts t={t} x0={-1400} x1={1500} y={40} h={70} n={34} seed={1} w={4} />
          <Tufts t={t} x0={-1500} x1={1600} y={340} h={110} n={30} seed={7} w={5} />
        </svg>
      </World>
      {phase === 6 ? <Counter t={t} /> : null}
    </AbsoluteFill>
  );
};

// YEARS counter in the sky (S6)
const Counter: React.FC<{t: number}> = ({t}) => {
  const steps = [16.55, 16.85, 17.15, 17.45];
  let n = 0;
  steps.forEach((s, i) => {
    if (t >= s) n = i + 1;
  });
  if (n === 0) return null;
  const last = steps[n - 1];
  const s = 1 + 0.12 * bump(t, last, 0.2);
  const out = t > 19.85 ? 1 - easeInCubic(prog(t, 19.85, 20.1)) : 1;
  if (out <= 0.01) return null;
  return <Bang x={540} y={430} s={s * out * pop(t, 16.55, 0.25)} text={`${n} YEAR${n > 1 ? 'S' : ''}`} size={130} color="#FFFFFF" />;
};

// ============ S2 / S3b: lion close-ups ============
const LionClose: React.FC<{t: number; shock: boolean}> = ({t, shock}) => {
  const t0 = shock ? C3 : C1;
  const push = shock ? lerp(1.42, 1.5, easeOutCubic(prog(t, C3, C4))) : lerp(1.4, 1.52, easeInOutCubic(prog(t, C1, C2)));
  let y = 1990;
  let sx = 1;
  let sy = breathe(t);
  let x = 540;
  if (!shock) {
    // duck into the grass on "surprise"
    const d = easeOutCubic(prog(t, T.surprise, T.surprise + 0.3));
    y += 330 * d;
    const sq = bump(t, T.surprise, 0.25);
    sx *= 1 + 0.05 * sq;
    sy *= 1 - 0.06 * sq;
    x += 14 * Math.sin(2 * Math.PI * 0.5 * (t - t0));
  } else {
    const b = bump(t, C3, 0.18);
    sx *= 1 + 0.08 * b;
    sy *= 1 + 0.1 * b;
    x += 3 * Math.sin(2 * Math.PI * 17 * t) + 2 * Math.sin(2 * Math.PI * 11 * t);
  }
  const sweat = shock ? popOut(t, 9.55, 99) : 0;
  const slide = shock ? easeInOutCubic(prog(t, 9.6, 10.45)) * 60 : 0;
  return (
    <AbsoluteFill style={{background: SKY}}>
      <Plate scale={1.9} top={-560} dx={shock ? 40 : -40} blur={5} />
      <Spr n={shock ? 'faceShock' : 'faceSly'} x={x} y={y} s={push} sx={sx} sy={sy} />
      <svg style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, overflow: 'visible'}}>
        <SweatDrop x={800} y={1000 + slide} r={44} s={sweat} rot={-10} />
        <Tufts t={t} x0={-80} x1={1160} y={1960} h={360} n={16} seed={shock ? 3 : 2} w={7} />
      </svg>
    </AbsoluteFill>
  );
};

// ============ S3 / S3c: the cow from behind ============
const Rear: React.FC<{t: number; cover?: boolean}> = ({t, cover = false}) => {
  const late = t >= C4 || cover;
  // camera: scale + rump centre on screen
  let s: number;
  let cx: number;
  let cy: number;
  if (!late) {
    s = lerp(1.3, 1.38, easeInOutCubic(prog(t, C2, C3)));
    s *= 1 + 0.05 * bump(t, T.stare, 0.3);
    cx = 540;
    cy = 1010;
  } else {
    const u = cover ? 1 : easeInOutCubic(prog(t, C4, C4 + 0.75));
    s = lerp(1.25, 1.0, u);
    cx = 540;
    cy = lerp(1010, 1120, u);
  }
  const d = SPR.cowRear;
  const rumpX = 420;
  const rumpY = 640;
  const fx = cx + (d.feet[0] - rumpX) * s;
  const fy = cy + (d.feet[1] - rumpY) * s;
  // eyes: closed arcs pop on "huge", open on "eyes", stare on "stare"
  const sc = late ? 1 : pop(t, T.huge, 0.3);
  const open = late || t >= T.eyes ? 1 : 0;
  const look: [number, number] = late ? [0, 0.05] : t > T.stare ? [0, 0] : [0.5, -0.3];
  const blink = late && !cover && t > T.butt && t < T.butt + 0.16 ? 1 : 0;
  const eyeR = REAR_R * (1 + (late ? 0 : 0.12 * bump(t, T.stare, 0.3)) + (t >= T.eyes && !late ? 0.1 * spring(t - T.eyes, 3, 6) : 0));
  return (
    <AbsoluteFill style={{background: SKY}}>
      <Plate scale={late ? 1.5 : 1.8} top={late ? -180 : -420} blur={late ? 2 : 4} />
      {late ? <Shadow x={fx} y={fy} w={700 * s} /> : null}
      <Spr n="cowRear" x={fx} y={fy} s={s} sy={breathe(t)}>
        {REAR_EYES.map(([ex, ey], i) => (
          <PaintedEye key={i} x={ex} y={ey} r={eyeR} sc={sc} open={open} look={look} lid={blink} side={i === 0 ? -1 : 1} brow={0.45} />
        ))}
      </Spr>
      {!late ? (
        <svg style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, overflow: 'visible'}}>
          <Tufts t={t} x0={-80} x1={1160} y={1960} h={300} n={15} seed={4} w={7} />
        </svg>
      ) : null}
    </AbsoluteFill>
  );
};

// ============ S4: the guy paints the eyes on ============
const Paint: React.FC<{t: number}> = ({t}) => {
  const cs = 0.95;
  const cowLeft = 430;
  const cowFeetY = 1700;
  const cfx = cowLeft + SPR.cowSide.feet[0] * cs;
  const swap = t >= T.on;
  // painting dabs
  const dab = t > 11.85 && t < 12.7 ? Math.sin(2 * Math.PI * 5.5 * (t - 11.85)) : 0;
  const lean = 80 * easeInOutCubic(prog(t, 12.38, 12.55)) * (1 - easeInOutCubic(prog(t, 12.62, 12.74)));
  const gx = 250 + lean;
  const [sx, sy] = squashSwap(t, T.on);
  const e1 = pop(t, T.painted + 0.02, 0.25);
  const e2 = pop(t, T.them - 0.05, 0.25);
  const opened = t > 12.95;
  const sp = popOut(t, T.on + 0.08, 13.2, 0.2);
  const push = lerp(1.0, 1.06, easeInOutCubic(prog(t, C5, C6)));
  return (
    <AbsoluteFill style={{background: SKY}}>
      <Plate scale={1.6} top={-400} dx={-80} blur={2.5} />
      <AbsoluteFill style={{transformOrigin: '540px 1300px', transform: `scale(${push})`}}>
        <Shadow x={cfx + 40} y={cowFeetY} w={1150} />
        <Spr n="cowSide" x={cfx} y={cowFeetY} s={cs} sy={breathe(t)}>
          {SIDE_EYES.map(([ex, ey], i) => (
            <PaintedEye key={i} x={ex} y={ey} r={SIDE_R} sc={i === 0 ? e1 : e2} open={1} look={opened ? [-1, 0] : [-0.6, 0.4]} side={i === 0 ? -1 : 1} />
          ))}
        </Spr>
        <Shadow x={gx} y={1720} w={330} />
        {!swap ? (
          <Spr n="hero" x={gx} y={1720} s={0.52} rot={2.5 * dab} sy={breathe(t, 1)} />
        ) : (
          <Spr n="guyS" x={gx} y={1720} s={0.52} sx={sx} sy={sy * breathe(t, 1)} />
        )}
        <svg style={{position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, overflow: 'visible'}}>
          <Sparkle x={150} y={1140} s={sp} rot={t * 90} />
          <Sparkle x={95} y={1230} s={sp * 0.6} rot={-t * 120} />
          <Tufts t={t} x0={-80} x1={1160} y={1760} h={90} n={20} seed={5} w={5} />
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- the scene at time t ----------
export const Scene: React.FC<{t: number}> = ({t}) => {
  if (t < C1) return <Wide t={t} />;
  if (t < C2) return <LionClose t={t} shock={false} />;
  if (t < C3) return <Rear t={t} />;
  if (t < C4) return <LionClose t={t} shock />;
  if (t < C5) return <Rear t={t} />;
  if (t < C6) return <Paint t={t} />;
  return <Wide t={t} />;
};

export const CoverScene: React.FC = () => <Wide t={14.0} cover />;

// ---------- sound ----------
const CUES: Cue[] = [
  {f: 'tiptoe', at: 0.25, db: -22},
  {f: 'tiptoe', at: 1.75, db: -24},
  {f: 'pop', at: T.botswana - 0.05, db: -22},
  {f: 'growl', at: 5.3, db: -21},
  {f: 'whoosh', at: T.surprise - 0.05, db: -28},
  {f: 'pop', at: T.huge - 0.02, db: -20},
  {f: 'boing', at: T.eyes - 0.02, db: -19},
  {f: 'gulp', at: 10.02, db: -14},
  {f: 'pop', at: T.butt, db: -24},
  {f: 'brush', at: 11.82, db: -15},
  {f: 'brush', at: 12.36, db: -16},
  {f: 'pop', at: T.on + 0.08, db: -22},
  {f: 'boing', at: T.lion2 + 0.08, db: -24},
  {f: 'whistle', at: T.walks + 0.12, db: -21},
  {f: 'ticks', at: 16.5, db: -26, dur: 1.1},
  {f: 'zip', at: 17.38, db: -24},
  {f: 'zip', at: 18.43, db: -25},
  {f: 'whoosh', at: 19.86, db: -29},
  {f: 'munch', at: 20.5, db: -15},
  {f: 'pop', at: 21.0, db: -20},
  {f: 'moo', at: 21.25, db: -19, keys: [[21.25, -19], [21.75, -19], [21.88, -60]]},
];

export const CowEyesShort: React.FC = () => {
  useCowFont();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  return (
    <AbsoluteFill style={{background: SKY}}>
      <Scene t={t} />
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('cow-eyes/vo/take1.mp3')} volume={Math.pow(10, MIX_DB / 20)} />
      </Sequence>
      <SoundCues cues={CUES} dir="cow-eyes/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};

