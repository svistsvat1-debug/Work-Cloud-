import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SPR} from './sprites';
import {DURATION, FPS, T, VO_AT} from './scene';
export {DURATION as BN_DURATION, FPS as BN_FPS} from './scene';
import {camAt, clamp, easeInCubic, easeInOutCubic, easeOutCubic, lerp, pop, prog, rnd, shake, spring, type Cam, type CamKey} from '../shared/anim';
import {World} from '../shared/World';
import {PuffCluster, type Puff} from '../shared/Puffs';
import {SweatDrop} from '../shared/SweatDrop';
import {Eye} from '../shared/Face';
import {SoundCues, type Cue} from '../shared/Sound';
import {useFont} from '../shared/useFont';

// "Why is part of a nuke still under this farm?" - Goldsboro, North Carolina, 1961. A bomber breaks apart over a farm at
// night (the farm owner looks up), a hydrogen bomb loses its parachute and drills into the mud at 700 mph. Day: a
// worker in a hard hat shrugs (why not just dig it up?), digs - but the hole floods (like a hole at the beach) and the
// uranium part sleeps far deeper (~180 ft). So the owner signs one rule: a sign + a red line 5 ft down; he plants
// happily above, the bomb snores below; night falls and the camera returns to frame 0 (loop).

const F = (n: string) => staticFile(`buried-nuke/${n}.png`);
export const FONT = 'BNInter';
export const useBNFont = () => useFont(FONT, staticFile('fonts/Inter-Black.otf'));
const MIX_DB = -0.5;
const INK = '#000';
export const NIGHT_BG = '#121a44';
const YEL = '#FFE45C';
const RED = '#E8382E';

// ---------- helpers ----------
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

type SprInfo = {w: number; h: number; feet: [number, number]; hw?: [number, number, number]; bottom: number; left: number; right: number; top: number; board?: {left: number; right: number; top: number; bottom: number}};
const S = (n: string) => (SPR as unknown as Record<string, SprInfo>)[n];

const Spr: React.FC<{n: string; x: number; y: number; s: number; sx?: number; sy?: number; rot?: number; ax?: number; ay?: number; filter?: string; children?: React.ReactNode}> = ({n, x, y, s, sx = 1, sy = 1, rot = 0, ax, ay, filter, children}) => {
  const sp = S(n);
  const axx = ax ?? sp.feet[0];
  const ayy = ay ?? sp.feet[1];
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg) scale(${sx}, ${sy})`, transformOrigin: '0 0', filter}}>
      <div style={{position: 'absolute', left: -axx * s, top: -ayy * s, width: sp.w * s, height: sp.h * s}}>
        <Img src={F(n)} style={{position: 'absolute', left: 0, top: 0, width: sp.w * s, height: sp.h * s}} />
        {children ? (
          <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={sp.w * s} height={sp.h * s} viewBox={`0 0 ${sp.w} ${sp.h}`}>
            {children}
          </svg>
        ) : null}
      </div>
    </div>
  );
};
const Svg: React.FC<{children: React.ReactNode; r?: number}> = ({children, r = 6000}) => (
  <svg style={{position: 'absolute', left: -r, top: -r, overflow: 'visible'}} width={2 * r} height={2 * r} viewBox={`${-r} ${-r} ${2 * r} ${2 * r}`}>
    {children}
  </svg>
);
const Txt: React.FC<{x: number; y: number; size: number; s?: number; text: string; rot?: number; fill?: string; stroke?: string; sw?: number}> = ({x, y, size, s = 1, text, rot = 0, fill = '#fff', stroke = INK, sw = 0.2}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <text x={0} y={size * 0.35} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={size} fill={fill} stroke={stroke} strokeWidth={size * sw} paintOrder="stroke" strokeLinejoin="round">
        {text}
      </text>
    </g>
  );

// ======================================================================================================
// THE WORLD = the farm cutaway plate at 1.6x (world px)
// ======================================================================================================
const PS = 1.6;
const PW = SPR.farm.w * PS;
const PH = SPR.farm.h * PS;
const GROUND = 628 * PS; // feet line on the grass (just above the black soil line)
const SOIL = 636 * PS; // top of the soil (cutaway starts)
const WET = 945 * PS; // top of the soggy blue-grey sand band
const HX = 1000; // the impact / dig spot
const HOLE_W = 270;
const HOLE_BOT = WET + 60; // the dig reaches into the soggy band
const BOMB_DEEP = 2060; // where the uranium part rests (cartoon depth, ~180 ft label)
const FIVE_FT = GROUND + 345; // 5 ft at the guy's scale (6 ft guy ~ 415 world px)
const FX = 640; // the farm owner's spot

// the guy: white-face radius equalised over all poses
const HRW = 66;
type Pose = 'hero' | 'shock' | 'signp' | 'plant' | 'shrug' | 'dig' | 'float';
const poseS = (p: Pose) => HRW / (S(p).hw as [number, number, number])[2];

// ---------- timeline ----------
const CUT_DAY = 7.72; // night -> day: "Why not just dig it up?"
const CUT_SO = 15.98; // back to the surface: "So they pay..."
const LOOP0 = 21.45; // glide back to frame 0 + night falls
const BREAK = T.breaks + 0.02;
const DROP0 = 3.18; // the bomb drops out of the gap
const IMPACT = T.buries; // 4.34
const DRILL1 = 5.35; // stops deep down
const DIG0 = T.try + 0.04; // the hole starts to deepen
const DIG1 = 10.95; // hole bottom reached
const FLOOD0 = 10.9;
const FLOOD1 = 12.1;

const night = (t: number) => (t < CUT_DAY ? 1 : t < LOOP0 ? 0 : easeInOutCubic(prog(t, LOOP0, LOOP0 + 0.75)));

// ---------- camera ----------
const KEYS: CamKey[] = [
  {t: 0, x: 770, y: 660, k: 1.1},
  {t: 3.1, x: 820, y: 720, k: 1.1},
  {t: 4.3, x: 930, y: 900, k: 1.0},
  {t: 4.45, x: 930, y: 900, k: 1.0},
  {t: 6.0, x: 960, y: 1580, k: 0.95},
  {t: 7.6, x: 960, y: 1600, k: 0.96},
  {t: CUT_DAY, x: 905, y: 990, k: 1.2, ease: 'cut'},
  {t: 9.9, x: 920, y: 1000, k: 1.2},
  {t: 11.1, x: 1000, y: 1400, k: 1.1},
  {t: 13.35, x: 1000, y: 1420, k: 1.1},
  {t: 15.0, x: 1000, y: 1880, k: 0.96},
  {t: 15.9, x: 990, y: 1900, k: 0.96},
  {t: CUT_SO, x: 790, y: 960, k: 1.18, ease: 'cut'},
  {t: 18.9, x: 820, y: 975, k: 1.14},
  {t: 20.0, x: 880, y: 1330, k: 0.96},
  {t: LOOP0, x: 880, y: 1340, k: 0.96},
  {t: 22.3, x: 770, y: 660, k: 1.1},
  {t: 30, x: 770, y: 660, k: 1.1},
];
const camAtT = (t: number): Cam => {
  const c = camAt(t, KEYS);
  // impact shake + a small dig rumble
  const amp = 26 * Math.exp(-6 * Math.max(0, t - IMPACT)) * (t >= IMPACT ? 1 : 0) + (t > DIG0 && t < DIG1 ? 2.5 : 0);
  const sh = shake(t, amp);
  return {x: c.x + sh.x / c.k, y: c.y + sh.y / c.k, k: c.k};
};

// ---------- the plane ----------
const PLANE_S = 0.52;
const planeAt = (t: number) => {
  // flies left -> right over the farm, breaks at BREAK; the two halves tumble apart and drop out of the frame
  const x = lerp(560, 1160, t / 1.5);
  const xb = lerp(560, 1160, BREAK / 1.5);
  return {x: t < BREAK ? x : xb, y: 330 + 6 * Math.sin(2 * Math.PI * 0.7 * t)};
};
const PLANE_SPLIT = 760; // sprite x where it snaps
const Plane: React.FC<{t: number}> = ({t}) => {
  if (t > 4.2 && t < LOOP0 + 0.5) return null;
  const sp = S('plane');
  let tt = t;
  let dx = 0;
  if (t >= LOOP0) {
    // a calm new pass on the way back to frame 0 (starts left of the frame-0 position)
    tt = 0;
    dx = -700 * (1 - easeOutCubic(prog(t, LOOP0 + 0.2, 22.4)));
    if (t < LOOP0 + 0.2) return null;
  }
  const p = planeAt(tt);
  const u = Math.max(0, tt - BREAK);
  const broken = tt >= BREAK;
  const W = sp.w * PLANE_S;
  const H = sp.h * PLANE_S;
  const sx = PLANE_SPLIT * PLANE_S;
  // halves: back (left) falls left and spins, front (right) dips its nose and drifts right
  const back = broken ? {x: -150 * u - 60 * u * u, y: 60 * u * u, r: -12 * u - 6 * u * u} : {x: 0, y: 0, r: 0};
  const front = broken ? {x: 170 * u + 60 * u * u, y: 60 * u * u, r: 16 * u + 5 * u * u} : {x: 0, y: 0, r: 0};
  const eyesOpen = 1;
  const scared = broken;
  const jag = (side: 'L' | 'R') => {
    const pts: string[] = [];
    const n = 7;
    for (let i = 0; i <= n; i++) {
      const y = (i / n) * sp.h;
      const x = PLANE_SPLIT + (i % 2 ? 26 : -26);
      pts.push(`${x},${y}`);
    }
    return side === 'L' ? `0,0 ${pts.join(' ')} 0,${sp.h}` : `${sp.w},0 ${pts.join(' ')} ${sp.w},${sp.h}`;
  };
  const half = (side: 'L' | 'R', m: {x: number; y: number; r: number}) => (
    <div style={{position: 'absolute', left: p.x - W / 2 + dx + m.x, top: p.y - H / 2 + m.y, width: W, height: H, transform: `rotate(${m.r}deg)`, transformOrigin: `${sx}px ${H / 2}px`}}>
      <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={W} height={H} viewBox={`0 0 ${sp.w} ${sp.h}`}>
        <defs>
          <clipPath id={`pl-${side}`}>
            <polygon points={broken ? jag(side) : `0,0 ${sp.w},0 ${sp.w},${sp.h} 0,${sp.h}`} />
          </clipPath>
        </defs>
        <g clipPath={`url(#pl-${side})`}>
          <image href={F('plane')} x={0} y={0} width={sp.w} height={sp.h} />
        </g>
        {broken ? <polyline points={jag(side).split(' ').slice(1, 9).join(' ')} fill="none" stroke={INK} strokeWidth={9} strokeLinejoin="round" /> : null}
        {side === 'R' ? (
          <>
            <Eye x={1302} y={198} r={30} open={eyesOpen} look={scared ? [-0.4, -0.2] : [0.5, 0]} brow={scared ? 0.6 : 0.5} browTilt={scared ? -0.8 : 0} side={-1} />
            <Eye x={1378} y={196} r={30} open={eyesOpen} look={scared ? [-0.4, -0.2] : [0.5, 0]} brow={scared ? 0.6 : 0.5} browTilt={scared ? -0.8 : 0} side={1} />
            {scared ? <ellipse cx={1400} cy={292} rx={22} ry={26} fill="#3a1010" stroke={INK} strokeWidth={6} /> : <path d="M 1370 285 Q 1400 302 1430 284" fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />}
          </>
        ) : null}
      </svg>
    </div>
  );
  return (
    <>
      {half('L', back)}
      {half('R', front)}
    </>
  );
};
// smoke puffs at the break
const breakPuffs = (t: number): Puff[] => {
  const u = t - BREAK;
  if (u < 0 || u > 2.2) return [];
  const p = planeAt(BREAK);
  const cx = p.x - (S('plane').w * PLANE_S) / 2 + PLANE_SPLIT * PLANE_S;
  const out: Puff[] = [];
  for (let i = 0; i < 9; i++) {
    const a = rnd(i) * Math.PI * 2;
    const sp = 60 + 90 * rnd(i + 5);
    const life = clamp(u / (1.4 + 0.6 * rnd(i + 9)));
    const r = (26 + 30 * rnd(i + 2)) * Math.sin(Math.PI * Math.min(1, life * 1.1));
    out.push({x: cx + Math.cos(a) * sp * easeOutCubic(life), y: p.y + Math.sin(a) * sp * 0.6 * easeOutCubic(life) - 40 * life, r: Math.max(0, r)});
  }
  return out;
};

// ---------- the bomb ----------
const BOMB_S = 0.5;
const bombState = (t: number) => {
  // fall: from the gap to the ground, nose down; then drills to BOMB_DEEP
  const gp = planeAt(BREAK);
  const x0 = gp.x - (S('plane').w * PLANE_S) / 2 + PLANE_SPLIT * PLANE_S + 40;
  const y0 = gp.y + 40;
  if (t < DROP0) return null;
  if (t < IMPACT) {
    const u = prog(t, DROP0, IMPACT);
    return {x: lerp(x0, HX, u), y: lerp(y0, GROUND - 90, easeInCubic(u * 0.85 + 0.15 * u * u)), rot: lerp(30, 90, easeOutCubic(prog(t, DROP0, DROP0 + 0.6))), phase: 'fall' as const};
  }
  const u = easeOutCubic(prog(t, IMPACT, DRILL1));
  return {x: HX, y: lerp(GROUND - 90, BOMB_DEEP, u), rot: 90 + 6 * Math.sin(2 * Math.PI * 0.4 * t) * u, phase: 'deep' as const};
};
const Bomb: React.FC<{t: number}> = ({t}) => {
  const b = bombState(t);
  if (!b) return null;
  const sp = S('bomb');
  const sleeping = t > 13.0;
  const dizzy = t >= DRILL1 && t < 13.0;
  const blinkLid = sleeping ? 1 : dizzy ? 0.45 : 0;
  const scared = b.phase === 'fall';
  return (
    <Spr n="bomb" x={b.x} y={b.y} s={BOMB_S} rot={b.rot} ax={sp.w * 0.78} ay={sp.h / 2}>
      <Eye x={392} y={108} r={34} open={1} lid={blinkLid} look={scared ? [0, -0.6] : [0, 0]} brow={sleeping ? NaN : 0.55} browTilt={scared ? -0.8 : 0} side={-1} ink={0.18} />
      <Eye x={478} y={108} r={34} open={1} lid={blinkLid} look={scared ? [0, -0.6] : [0, 0]} brow={sleeping ? NaN : 0.55} browTilt={scared ? -0.8 : 0} side={1} ink={0.18} />
      {scared ? (
        <ellipse cx={436} cy={192} rx={20} ry={26} fill="#3a1010" stroke={INK} strokeWidth={7} />
      ) : sleeping ? (
        <ellipse cx={436} cy={196} rx={12} ry={9} fill="#3a1010" stroke={INK} strokeWidth={6} />
      ) : (
        <path d="M 400 196 Q 418 182 436 196 Q 454 210 472 196" fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round" />
      )}
    </Spr>
  );
};
// the parachute: pops out of the tail, rips, and the rags flutter away
const Chute: React.FC<{t: number}> = ({t}) => {
  const t0 = T.hydrogen + 0.02;
  const tr = t0 + 0.3;
  if (t < t0 || t > tr + 0.75) return null;
  const b = bombState(t);
  if (!b) return null;
  // tail is behind the bomb (up, since the nose points down)
  const tailX = b.x - Math.cos((b.rot * Math.PI) / 180) * 230;
  const tailY = b.y - Math.sin((b.rot * Math.PI) / 180) * 230;
  const s = pop(t, t0, 0.18);
  if (t < tr) {
    return (
      <Svg>
        <g transform={`translate(${tailX} ${tailY - 60}) scale(${s})`}>
          <line x1={-60} y1={0} x2={0} y2={60} stroke={INK} strokeWidth={4} />
          <line x1={60} y1={0} x2={0} y2={60} stroke={INK} strokeWidth={4} />
          <path d="M -80 0 Q 0 -90 80 0 Z" fill="#fff" stroke={INK} strokeWidth={9} strokeLinejoin="round" />
          <path d="M -26 -40 L -40 0 M 26 -40 L 40 0" stroke="#d9d4d0" strokeWidth={6} />
        </g>
      </Svg>
    );
  }
  const u = t - tr;
  return (
    <Svg>
      {[-1, 1].map((d) => (
        <g key={d} transform={`translate(${tailX + d * (40 + 140 * u)} ${tailY - 70 - 260 * u + 80 * u * u}) rotate(${d * (30 + 300 * u)})`} opacity={1 - clamp((u - 0.8) / 0.4)}>
          <path d="M -46 0 Q -10 -40 30 -6 L 18 4 L 4 -6 L -10 8 Z" fill="#fff" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        </g>
      ))}
    </Svg>
  );
};
// underground trail + mud splash
const Trail: React.FC<{t: number}> = ({t}) => {
  if (t < IMPACT || t >= CUT_SO) return null;
  const b = bombState(t);
  if (!b) return null;
  const bottom = Math.max(SOIL, b.y - 160);
  return (
    <Svg>
      <line x1={HX} y1={SOIL - 6} x2={HX} y2={bottom} stroke={INK} strokeWidth={34} strokeLinecap="round" />
      <line x1={HX} y1={SOIL - 6} x2={HX} y2={bottom} stroke="#2a1a10" strokeWidth={22} strokeLinecap="round" />
    </Svg>
  );
};
const MudSplash: React.FC<{t: number}> = ({t}) => {
  const u = t - IMPACT;
  if (u < 0 || u > 1.3) return null;
  const blobs = [];
  for (let i = 0; i < 12; i++) {
    const a = -Math.PI / 2 + (rnd(i + 30) - 0.5) * 2.2;
    const v = 520 + 380 * rnd(i + 40);
    const x = HX + Math.cos(a) * v * u;
    const y = GROUND + Math.sin(a) * v * u + 0.5 * 1800 * u * u;
    if (y > GROUND + 10) continue;
    const r = (14 + 14 * rnd(i + 50)) * (1 - 0.3 * u);
    blobs.push(<ellipse key={i} cx={x} cy={y} rx={r * 1.15} ry={r} fill="#5a3a22" stroke={INK} strokeWidth={6} />);
  }
  return <Svg>{blobs}</Svg>;
};

// ---------- the hole and the water ----------
const holeBottom = (t: number) => (t < DIG0 ? SOIL + 40 : lerp(SOIL + 40, HOLE_BOT, easeInOutCubic(prog(t, DIG0, DIG1))));
const waterTop = (t: number) => (t < FLOOD0 ? HOLE_BOT + 50 : lerp(HOLE_BOT, WET - 230, easeOutCubic(prog(t, FLOOD0, FLOOD1))) + 6 * Math.sin(2 * Math.PI * 0.9 * t));
const Hole: React.FC<{t: number}> = ({t}) => {
  if (t < IMPACT) return null;
  if (t >= CUT_SO) {
    // filled in: a fresh dirt patch on the field
    return (
      <Svg>
        <path d={`M ${HX - 150} ${GROUND + 8} Q ${HX} ${GROUND - 46} ${HX + 150} ${GROUND + 8} Z`} fill="#6b4529" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
        <circle cx={HX - 40} cy={GROUND - 14} r={6} fill="#3d2616" />
        <circle cx={HX + 50} cy={GROUND - 8} r={5} fill="#3d2616" />
      </Svg>
    );
  }
  const hb = holeBottom(t);
  const wt = waterTop(t);
  const x0 = HX - HOLE_W / 2;
  const pile = clamp(prog(t, DIG0, DIG1)) * 70;
  const dig = t >= DIG0 - 0.3;
  return (
    <Svg>
      {/* the dirt pile beside the hole */}
      {pile > 1 ? <path d={`M ${HX + HOLE_W / 2 + 10} ${GROUND + 6} Q ${HX + HOLE_W / 2 + 110} ${GROUND - pile * 1.6} ${HX + HOLE_W / 2 + 230} ${GROUND + 6} Z`} fill="#6b4529" stroke={INK} strokeWidth={8} /> : null}
      {dig ? (
        <>
          <rect x={x0} y={SOIL - 10} width={HOLE_W} height={hb - SOIL + 10} fill="#2c1b10" stroke={INK} strokeWidth={9} />
          {t >= FLOOD0 ? (
            <>
              <rect x={x0 + 5} y={wt} width={HOLE_W - 10} height={HOLE_BOT - wt - 4} fill="#3F95D6" />
              <path d={`M ${x0 + 5} ${wt} Q ${HX - 60} ${wt - 10} ${HX} ${wt} T ${x0 + HOLE_W - 5} ${wt}`} fill="none" stroke="#9FD6FF" strokeWidth={10} />
              <line x1={x0 + 5} y1={wt + 4} x2={x0 + HOLE_W - 5} y2={wt + 4} stroke={INK} strokeWidth={5} />
            </>
          ) : null}
        </>
      ) : (
        <ellipse cx={HX} cy={GROUND + 4} rx={70} ry={20} fill="#2c1b10" stroke={INK} strokeWidth={8} />
      )}
    </Svg>
  );
};
// water seeping from the soggy band into the hole
const Seeps: React.FC<{t: number}> = ({t}) => {
  if (t < FLOOD0 - 0.4 || t > 13.6 || t >= CUT_SO) return null;
  const out = [];
  for (let i = 0; i < 10; i++) {
    const side = i % 2 ? 1 : -1;
    const t0 = FLOOD0 - 0.4 + 0.14 * i + 0.1 * rnd(i);
    const u = ((t - t0) % 0.9) / 0.9;
    if (t < t0) continue;
    const y0 = WET + 30 + 40 * rnd(i + 3);
    const x = HX + side * (HOLE_W / 2 - 4) - side * 60 * u;
    const y = y0 + 260 * u * u;
    if (y > waterTop(t)) continue;
    out.push(
      <g key={i} transform={`translate(${x} ${y}) scale(${0.9 + 0.3 * rnd(i)})`}>
        <path d="M 0 -18 C 10 -4 12 4 0 12 C -12 4 -10 -4 0 -18 Z" fill="#3F95D6" stroke={INK} strokeWidth={4} />
      </g>,
    );
  }
  return <Svg>{out}</Svg>;
};
// dirt clods thrown out of the hole while digging
const Clods: React.FC<{t: number}> = ({t}) => {
  if (t < DIG0 || t > DIG1 + 0.8) return null;
  const out = [];
  for (let i = 0; i < 14; i++) {
    const t0 = DIG0 + i * 0.075;
    const u = t - t0;
    if (u < 0 || u > 0.9) continue;
    const yb = holeBottom(t0);
    const x = HX - 30 + 320 * u + 30 * rnd(i);
    const y = yb - 60 - 1250 * u + 0.5 * 2600 * u * u;
    const r = 12 + 10 * rnd(i + 7);
    out.push(<ellipse key={i} cx={x} cy={y} rx={r * 1.2} ry={r} fill="#6b4529" stroke={INK} strokeWidth={5} transform={`rotate(${400 * u} ${x} ${y})`} />);
  }
  return <Svg>{out}</Svg>;
};

// ---------- the guys ----------
type GuyState = {pose: Pose; x: number; y: number; sq: [number, number]; flip: boolean; ay?: number; vis: boolean};
const farmer = (t: number): GuyState => {
  let pose: Pose = 'hero';
  let sq: [number, number] = [1, 1];
  if (t < CUT_DAY) {
    if (t >= T.apart - 0.04) {
      pose = 'shock';
      sq = squashSwap(t, T.apart - 0.04);
    }
    return {pose, x: FX, y: GROUND, sq, flip: false, vis: true};
  }
  if (t < CUT_SO) return {pose, x: FX, y: GROUND, sq, flip: false, vis: false};
  if (t < T.sign) return {pose: 'hero', x: FX, y: GROUND, sq: [1, breathe(t)], flip: false, vis: true};
  if (t < T.never + 0.1) return {pose: 'signp', x: FX, y: GROUND, sq: squashSwap(t, T.sign), flip: false, vis: true};
  if (t < LOOP0 + 0.05) return {pose: 'plant', x: FX + 20, y: GROUND, sq: squashSwap(t, T.never + 0.1), flip: false, vis: true};
  return {pose: 'hero', x: FX, y: GROUND, sq: squashSwap(t, LOOP0 + 0.05), flip: false, vis: true};
};
const worker = (t: number): GuyState => {
  if (t < CUT_DAY || t >= CUT_SO) return {pose: 'shrug', x: 0, y: 0, sq: [1, 1], flip: false, vis: false};
  if (t < T.they) return {pose: 'shrug', x: 790, y: GROUND, sq: [1, breathe(t)], flip: false, vis: true};
  if (t < FLOOD0) {
    // dig pose: first at the rim, then hops in and rides the bottom down
    const hop = prog(t, T.try - 0.15, DIG0 + 0.2);
    const x = lerp(HX - 150, HX - 70, hop);
    const yr = GROUND;
    const yb = holeBottom(t);
    const y = hop <= 0 ? yr : hop < 1 ? lerp(yr, yb, hop) - 120 * Math.sin(Math.PI * hop) : yb;
    return {pose: 'dig', x, y, sq: squashSwap(t, T.they), flip: false, vis: true};
  }
  // floating on the rising water (ring at the waterline)
  const wt = waterTop(t);
  return {pose: 'float', x: HX, y: wt, sq: squashSwap(t, FLOOD0), flip: false, ay: 0.64, vis: true};
};
const Guy: React.FC<{g: GuyState; t: number}> = ({g}) => {
  if (!g.vis) return null;
  const s = poseS(g.pose);
  const sp = S(g.pose);
  const ay = g.ay !== undefined ? sp.h * g.ay : sp.feet[1];
  return <Spr n={g.pose} x={g.x} y={g.y} s={s} sx={(g.flip ? -1 : 1) * g.sq[0]} sy={g.sq[1]} ax={sp.feet[0]} ay={ay} />;
};

// ---------- props ----------
const Post: React.FC<{t: number}> = ({t}) => {
  const s0 = pop(t, T.rule, 0.3);
  if (s0 <= 0) return null;
  const sp = S('post');
  const s = 0.95;
  const b = sp.board!;
  const drop = (1 - easeOutCubic(prog(t, T.rule, T.rule + 0.18))) * 260;
  return (
    <Spr n="post" x={HX + 10} y={GROUND + 18 - drop} s={s} sy={0.9 + 0.1 * s0}>
      <text x={(b.left + b.right) / 2} y={b.top + (b.bottom - b.top) * 0.42} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={42} fill="#4a2a12">
        NO DIGGING
      </text>
      <text x={(b.left + b.right) / 2} y={b.top + (b.bottom - b.top) * 0.8} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={42} fill={RED}>
        BELOW 5 FT
      </text>
    </Spr>
  );
};
const Cash: React.FC<{t: number}> = ({t}) => {
  if (t < T.pay - 0.35 || t > T.sign + 0.1) return null;
  const u = prog(t, T.pay - 0.35, T.pay);
  const x = lerp(FX + 760, FX + 300, easeOutCubic(u));
  const y = lerp(GROUND - 560, GROUND - 300, easeOutCubic(u)) + 8 * Math.sin(2 * Math.PI * 1.3 * t);
  const sc = t > T.sign - 0.1 ? 1 - prog(t, T.sign - 0.1, T.sign + 0.1) : 1;
  return (
    <Svg>
      <g transform={`translate(${x} ${y}) rotate(${-8 + 20 * (1 - u)}) scale(${sc})`}>
        <rect x={-120} y={-58} width={240} height={116} rx={10} fill="#8DD18A" stroke={INK} strokeWidth={8} />
        <rect x={-100} y={-40} width={200} height={80} rx={6} fill="none" stroke="#3E8E46" strokeWidth={5} />
        <text x={0} y={16} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={50} fill="#1F5A26">
          $1,000
        </text>
      </g>
    </Svg>
  );
};

// ---------- labels / HUD (world) ----------
const NCcard = (t: number) => popOut(t, T.north - 0.05, DROP0 - 0.1, 0.25);
const DepthArrow: React.FC<{t: number}> = ({t}) => {
  const s = pop(t, T.even - 0.1, 0.3);
  if (s <= 0 || t >= CUT_SO) return null;
  const x = HX + 330;
  const y0 = SOIL + 10;
  const y1 = BOMB_DEEP - 20;
  const ym = (y0 + y1) / 2 + 110;
  const head = (y: number, d: number) => `M ${x - 26} ${y + d * 30} L ${x} ${y} L ${x + 26} ${y + d * 30}`;
  return (
    <Svg>
      <g opacity={s} transform={`translate(${x} ${(y0 + y1) / 2}) scale(1 ${s}) translate(${-x} ${-(y0 + y1) / 2})`}>
        {[
          [INK, 16],
          ['#fff', 7],
        ].map(([c, w]) => (
          <g key={String(c)} stroke={c as string} strokeWidth={w as number} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <line x1={x} y1={y0} x2={x} y2={ym - 30} />
            <line x1={x} y1={ym + 30} x2={x} y2={y1} />
            <path d={head(y0, 1)} />
            <path d={head(y1, -1)} />
            <line x1={x - 34} y1={ym - 20} x2={x + 34} y2={ym - 44} />
            <line x1={x - 34} y1={ym + 44} x2={x + 34} y2={ym + 20} />
          </g>
        ))}
      </g>
      <Txt x={x - 10} y={ym - 140} size={64} s={pop(t, T.deeper, 0.3)} text="~180 FT" fill={YEL} />
    </Svg>
  );
};
const UraniumTag: React.FC<{t: number}> = ({t}) => {
  const s = popOut(t, T.uranium, CUT_SO - 0.1, 0.3);
  if (s <= 0) return null;
  return (
    <Svg>
      <line x1={HX - 150} y1={BOMB_DEEP - 70} x2={HX - 60} y2={BOMB_DEEP - 20} stroke={INK} strokeWidth={8} />
      <Txt x={HX - 260} y={BOMB_DEEP - 110} size={52} s={s} text="URANIUM PART" fill="#B8FF6A" />
    </Svg>
  );
};
const Zzz: React.FC<{t: number; t0: number; x: number; y: number}> = ({t, t0, x, y}) => {
  if (t < t0) return null;
  const out = [];
  for (let i = 0; i < 3; i++) {
    const u = ((t - t0 + i * 0.5) % 1.5) / 1.5;
    out.push(<Txt key={i} x={x + 40 * u + 20 * i} y={y - 150 * u} size={34 + 14 * i} s={Math.sin(Math.PI * u)} text="z" fill="#fff" />);
  }
  return <Svg>{out}</Svg>;
};
const FiveFoot: React.FC<{t: number}> = ({t}) => {
  if (t < T.never - 0.1 || t >= LOOP0 + 0.5) return null;
  const u = easeInOutCubic(prog(t, T.never - 0.1, T.never + 0.6));
  const fade = 1 - prog(t, LOOP0, LOOP0 + 0.5);
  const x0 = 120;
  const x1 = lerp(x0, PW - 120, u);
  const xa = 1260;
  const sl = pop(t, T.five, 0.3);
  return (
    <Svg>
      <g opacity={fade}>
        <line x1={x0} y1={FIVE_FT} x2={x1} y2={FIVE_FT} stroke={INK} strokeWidth={16} strokeDasharray="44 26" strokeLinecap="round" />
        <line x1={x0} y1={FIVE_FT} x2={x1} y2={FIVE_FT} stroke={RED} strokeWidth={9} strokeDasharray="44 26" strokeLinecap="round" />
        {sl > 0 ? (
          <g>
            {[
              [INK, 14],
              ['#fff', 6],
            ].map(([c, w]) => (
              <g key={String(c)} stroke={c as string} strokeWidth={w as number} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={sl}>
                <line x1={xa} y1={SOIL + 14} x2={xa} y2={FIVE_FT - 16} />
                <path d={`M ${xa - 20} ${SOIL + 38} L ${xa} ${SOIL + 14} L ${xa + 20} ${SOIL + 38}`} />
                <path d={`M ${xa - 20} ${FIVE_FT - 40} L ${xa} ${FIVE_FT - 16} L ${xa + 20} ${FIVE_FT - 40}`} />
              </g>
            ))}
            <Txt x={xa - 130} y={(SOIL + FIVE_FT) / 2 + 20} size={70} s={sl} text="5 FT" fill={YEL} />
          </g>
        ) : null}
      </g>
    </Svg>
  );
};
// stars + moon on the night sky
const NightSky: React.FC<{n: number}> = ({n}) =>
  n <= 0.01 ? null : (
    <Svg>
      <g opacity={n}>
        {Array.from({length: 26}).map((_, i) => {
          const x = 40 + rnd(i + 70) * (PW - 80);
          const y = 40 + rnd(i + 90) * 820;
          const r = 4 + 4 * rnd(i + 110);
          return <path key={i} d={`M ${x} ${y - r * 2} L ${x + r * 0.5} ${y - r * 0.5} L ${x + r * 2} ${y} L ${x + r * 0.5} ${y + r * 0.5} L ${x} ${y + r * 2} L ${x - r * 0.5} ${y + r * 0.5} L ${x - r * 2} ${y} L ${x - r * 0.5} ${y - r * 0.5} Z`} fill="#FFF6C8" />;
        })}
        <circle cx={1380} cy={170} r={70} fill="#FFF3B0" stroke={INK} strokeWidth={8} />
        <circle cx={1410} cy={150} r={62} fill="#2a3470" />
      </g>
    </Svg>
  );

// ======================================================================================================
// THE SCENE (world)
// ======================================================================================================
export const FarmScene: React.FC<{t: number; cam: Cam; cover?: boolean}> = ({t, cam, cover}) => {
  const n = night(t);
  const plateFilter = n > 0 ? `brightness(${1 - 0.2 * n})` : undefined;
  const sprFilter = n > 0 ? `brightness(${1 - 0.1 * n})` : undefined;
  const f = farmer(t);
  const w = worker(t);
  const cs = NCcard(t);
  const showWorkerFront = t >= DIG0 - 0.2; // in the hole: draw after the hole fill
  return (
    <AbsoluteFill style={{background: n > 0.5 ? '#2a3470' : '#8ECEF9'}}>
      <World cam={cam}>
        {/* plate + extensions below / sides */}
        <div style={{position: 'absolute', left: -2000, top: PH - 4, width: PW + 4000, height: 3000, background: 'rgb(83,53,37)', filter: plateFilter}} />
        <div style={{position: 'absolute', left: -2000, top: -3000, width: PW + 4000, height: 3004, background: 'rgb(142,206,249)', filter: plateFilter}} />
        <div style={{position: 'absolute', left: -2000, top: -4, width: 2000, height: PH, background: 'rgb(142,206,249)', filter: plateFilter}} />
        <div style={{position: 'absolute', left: PW, top: -4, width: 2000, height: PH, background: 'rgb(142,206,249)', filter: plateFilter}} />
        <Img src={F('farm')} style={{position: 'absolute', left: 0, top: 0, width: PW, height: PH, filter: plateFilter}} />
        {/* night: blue multiply over the plate */}
        {n > 0 ? <div style={{position: 'absolute', left: -2000, top: -2000, width: PW + 4000, height: PH + 5000, background: '#34449A', mixBlendMode: 'multiply', opacity: 0.62 * n}} /> : null}
        <NightSky n={n} />
        <Trail t={t} />
        <Hole t={t} />
        <Seeps t={t} />
        {!showWorkerFront ? <Guy g={w} t={t} /> : null}
        <div style={{position: 'absolute', left: 0, top: 0, filter: sprFilter}}>
          <Bomb t={t} />
          <Guy g={f} t={t} />
          {showWorkerFront ? <Guy g={w} t={t} /> : null}
          <Post t={t} />
        </div>
        <Chute t={t} />
        <MudSplash t={t} />
        <Clods t={t} />
        <Svg>
          <PuffCluster puffs={breakPuffs(t)} fill="#6F6A68" shade="#5E5957" ink={7} />
          {/* worker sweat while flooding / looking down */}
          {w.vis && w.pose === 'float' ? <SweatDrop x={w.x + 70} y={w.y - 330 + 30 * prog(t, 13.5, 14.3)} r={18} s={popOut(t, 13.5, 15.6, 0.2)} /> : null}
          {/* "?" over the farmer after the impact (no explosion) */}
          {t >= BREAK + 0.1 && t < IMPACT ? <Txt x={FX + 95} y={GROUND - 500} size={96} s={popOut(t, BREAK + 0.1, DROP0, 0.22)} text="!" fill={YEL} /> : null}
          {t >= IMPACT + 0.5 && t < CUT_DAY ? <Txt x={FX + 60} y={GROUND - 520} size={90} s={pop(t, IMPACT + 0.5, 0.25)} text="?" fill={YEL} /> : null}
        </Svg>
        <Plane t={t} />
        <UraniumTag t={t} />
        <DepthArrow t={t} />
        {!cover ? <Zzz t={t} t0={13.2} x={HX + 80} y={BOMB_DEEP - 140} /> : null}
        <FiveFoot t={t} />
        {!cover ? <Cash t={t} /> : null}
        {!cover ? (
          <Svg>
            <g transform={`translate(800 ${GROUND - 470}) rotate(-4) scale(${cs})`}>
              <rect x={-250} y={-62} width={500} height={124} rx={18} fill="#fff" stroke={INK} strokeWidth={10} />
              <text x={0} y={-8} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={46} fill={INK}>
                NORTH CAROLINA
              </text>
              <text x={0} y={42} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={40} fill={RED}>
                1961
              </text>
            </g>
          </Svg>
        ) : null}
      </World>
    </AbsoluteFill>
  );
};

// ---------- screen-space overlays ----------
const Gauge: React.FC<{t: number}> = ({t}) => {
  const s = popOut(t, T.seven - 0.08, CUT_DAY - 0.25, 0.25);
  if (s <= 0) return null;
  const v = easeOutCubic(prog(t, T.seven, T.hour));
  const ang = -120 + 240 * v * (1 + 0.04 * Math.sin(2 * Math.PI * 7 * t) * (t > T.hour ? 1 : 0));
  const R = 120;
  return (
    <svg style={{position: 'absolute', left: 0, top: 0}} width={1080} height={1920}>
      <g transform={`translate(800 330) scale(${s})`}>
        <circle r={R + 12} fill="#fff" stroke={INK} strokeWidth={12} />
        {Array.from({length: 9}).map((_, i) => {
          const a = ((-120 + 30 * i - 90) * Math.PI) / 180;
          return <line key={i} x1={Math.cos(a) * (R - 26)} y1={Math.sin(a) * (R - 26)} x2={Math.cos(a) * (R - 4)} y2={Math.sin(a) * (R - 4)} stroke={i > 6 ? RED : INK} strokeWidth={8} strokeLinecap="round" />;
        })}
        <path d={`M 0 0 L ${Math.cos(((ang - 90) * Math.PI) / 180) * (R - 20)} ${Math.sin(((ang - 90) * Math.PI) / 180) * (R - 20)}`} stroke={RED} strokeWidth={12} strokeLinecap="round" />
        <circle r={16} fill={INK} />
        <text x={0} y={R + 82} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={66} fill={YEL} stroke={INK} strokeWidth={14} paintOrder="stroke">
          {`${Math.round(700 * v)} MPH`}
        </text>
      </g>
    </svg>
  );
};
const BeachBubble: React.FC<{t: number}> = ({t}) => {
  const s = popOut(t, T.like - 0.08, 13.45, 0.3);
  if (s <= 0) return null;
  const R = 230;
  const fill = easeInOutCubic(prog(t, T.digging, T.beach + 0.5));
  const id = 'beachclip';
  return (
    <svg style={{position: 'absolute', left: 0, top: 0}} width={1080} height={1920}>
      <circle cx={470} cy={770} r={18 * s} fill="#fff" stroke={INK} strokeWidth={6} />
      <circle cx={420} cy={690} r={28 * s} fill="#fff" stroke={INK} strokeWidth={7} />
      <g transform={`translate(290 400) scale(${0.87 * s})`}>
        <defs>
          <clipPath id={id}>
            <circle r={R} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${id})`}>
          <rect x={-R} y={-R} width={2 * R} height={2 * R} fill="#8ECEF9" />
          <circle cx={-120} cy={-130} r={46} fill="#FFE45C" stroke={INK} strokeWidth={6} />
          <rect x={-R} y={-30} width={2 * R} height={70} fill="#2F8FE0" />
          <path d={`M ${-R} 30 Q 0 10 ${R} 40 L ${R} ${R} L ${-R} ${R} Z`} fill="#F2D38C" stroke={INK} strokeWidth={7} />
          {/* the hole in the sand + water filling it */}
          <ellipse cx={10} cy={110} rx={95} ry={42} fill="#B88A4A" stroke={INK} strokeWidth={7} />
          <ellipse cx={10} cy={110 + 22 * (1 - fill)} rx={88 * (0.25 + 0.75 * fill)} ry={34 * (0.25 + 0.75 * fill)} fill="#3F95D6" />
          {/* little red bucket + spade */}
          <path d="M 120 120 L 180 120 L 170 190 L 130 190 Z" fill={RED} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
          <path d="M 122 120 Q 150 80 178 120" fill="none" stroke={INK} strokeWidth={5} />
          <line x1={-120} y1={60} x2={-80} y2={150} stroke="#A0693C" strokeWidth={10} strokeLinecap="round" />
          <path d="M -90 140 L -66 180 L -52 150 Z" fill="#9aa3ad" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
        </g>
        <circle r={R} fill="none" stroke={INK} strokeWidth={12} />
      </g>
    </svg>
  );
};

// ======================================================================================================
// SOUND
// ======================================================================================================
const CUES: Cue[] = [
  {f: 'jet', at: 0.0, db: -24},
  {f: 'plane_break', at: BREAK - 0.12, db: -11},
  {f: 'crickets', at: 2.0, db: -30},
  {f: 'whoosh', at: DROP0 - 0.05, db: -26},
  {f: 'bomb_fall', at: DROP0, db: -21, keys: [[DROP0, -21], [IMPACT - 0.2, -18], [IMPACT, -40]], dur: IMPACT - DROP0 + 0.05},
  {f: 'pop', at: T.hydrogen, db: -22},
  {f: 'flap', at: T.hydrogen + 0.3, db: -18},
  {f: 'flap', at: T.hydrogen + 0.42, db: -21, rate: 1.1},
  {f: 'mud_whoomp', at: IMPACT - 0.2, db: -9},
  {f: 'crickets', at: 6.9, db: -28},
  {f: 'whoosh', at: CUT_DAY - 0.1, db: -28},
  {f: 'pop', at: 8.0, db: -26},
  {f: 'dig', at: T.they + 0.05, db: -18},
  {f: 'dig', at: DIG0 + 0.25, db: -18},
  {f: 'dig', at: DIG0 + 0.55, db: -19},
  {f: 'dig', at: DIG0 + 0.85, db: -19},
  {f: 'bubbles', at: FLOOD0, db: -22},
  {f: 'pour', at: FLOOD0 + 0.1, db: -20},
  {f: 'drip', at: 12.15, db: -24},
  {f: 'pop', at: T.like - 0.08, db: -24},
  {f: 'drip', at: T.beach + 0.1, db: -26},
  {f: 'pop', at: T.uranium, db: -24},
  {f: 'snore', at: 13.3, db: -26},
  {f: 'pop', at: T.deeper, db: -22},
  {f: 'whoosh', at: CUT_SO - 0.12, db: -28},
  {f: 'cash', at: T.pay - 0.3, db: -24},
  {f: 'kaching', at: T.pay, db: -16},
  {f: 'scribble', at: T.sign, db: -17},
  {f: 'stone_step', at: T.rule + 0.12, db: -14},
  {f: 'sprout', at: T.dig2, db: -22},
  {f: 'pop', at: T.five, db: -22},
  {f: 'snore', at: 20.0, db: -27},
  {f: 'whoosh', at: LOOP0 + 0.1, db: -30},
  {f: 'jet', at: LOOP0 + 0.3, db: -30, keys: [[LOOP0 + 0.3, -30], [22.3, -36]], dur: 22.35 - LOOP0 - 0.3},
];

export const BuriedNukeShort: React.FC = () => {
  useBNFont();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = camAtT(t);
  return (
    <AbsoluteFill style={{background: NIGHT_BG}}>
      <FarmScene t={t} cam={cam} />
      <Gauge t={t} />
      <BeachBubble t={t} />
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('buried-nuke/vo/take1.mp3')} volume={Math.pow(10, MIX_DB / 20)} />
      </Sequence>
      <Audio src={staticFile('buried-nuke/music/bed.wav')} volume={Math.pow(10, MIX_DB / 20)} />
      <SoundCues cues={CUES.map((c) => ({...c, db: c.db + MIX_DB, keys: c.keys?.map(([kt, kd]) => [kt, kd + MIX_DB] as [number, number])}))} dir="buried-nuke/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};
export const BN_TOTAL = Math.round(DURATION * FPS);
