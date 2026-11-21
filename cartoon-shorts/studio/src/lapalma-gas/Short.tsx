import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SPR} from './sprites';
import {FPS, T, VO_AT} from './scene';
export {DURATION as LAPALMA_DURATION, FPS as LAPALMA_FPS} from './scene';
import {along, camAt, clamp, easeInCubic, easeInOutCubic, easeOutCubic, lerp, pop, prog, rnd, shake, spring, type Cam, type CamKey} from '../shared/anim';
import {World} from '../shared/World';
import {Eye} from '../shared/Face';
import {SweatDrop} from '../shared/SweatDrop';
import {PuffCluster} from '../shared/Puffs';
import {SoundCues, type Cue} from '../shared/Sound';
import {useFont} from '../shared/useFont';

// "Why couldn't they go home if the lava missed?" - part 2 of the 2021 La Palma eruption, told as a story.
// Sept 2021: lava heads down toward the beach town of Puerto Naos / La Bombilla but does not damage it. By late Nov 2021 the
// ground starts releasing volcanic CO2 (5-20 % in places), which gets into homes, garages and basements; dead birds and cats are
// found near garages; ~1,300 ALERTACO2 sensors go in; the first 139 people return in Dec 2023; zones and sensors remain in 2025.
// Sources: EGU24-19009, EGU25-16933 (Padilla et al., ALERTACO2), Christian Science Monitor 14 Apr 2025 (see videos/lapalma-gas/upload.md).

const F = (n: string) => staticFile(`lapalma-gas/${n}.${n === 'island' || n === 'house' ? 'jpg' : 'png'}`);
export const FONT = 'LPGInter';
export const useLapalmaFont = () => useFont(FONT, staticFile('fonts/Inter-Black.otf'));
const INK = '#000';
const LAVA_D = '#E2501E';
const LAVA = '#FF6A2B';
const LAVA_C = '#FFC867';
const GAS = '#B7AEEA';
const GAS_INK = '#3E3478';
const SHADOW = 'rgba(72,54,42,0.26)';

const CUT_TOWN = T.so - 0.06;
const CUT_HOUSE = T.ground - 0.1;
const CUT_CLOSE = T.the - 0.04;

// ---------- helpers ----------
const squashSwap = (t: number, tSwap: number): [number, number] => {
  if (t < tSwap - 0.08) return [1, 1];
  if (t < tSwap) {
    const u = prog(t, tSwap - 0.08, tSwap);
    return [1 + 0.06 * u, 1 - 0.07 * u];
  }
  const s = spring(t - tSwap, 3.2, 7);
  return [1 - 0.035 * s, 1 + 0.04 * s];
};
const popOut = (t: number, t0: number, t1: number, dur = 0.25) => (t < t1 ? pop(t, t0, dur) : Math.max(0, 1 - easeInCubic(prog(t, t1, t1 + 0.18))));
const pulse = (t: number, t0: number, d = 0.35) => (t > t0 && t < t0 + d ? Math.sin((Math.PI * (t - t0)) / d) : 0);

type SprInfo = {w: number; h: number; feet: [number, number]; hd?: [number, number, number]; bottom: number; left: number; right: number; top: number};
const S = (n: string) => (SPR as unknown as Record<string, SprInfo>)[n];

const Spr: React.FC<{n: string; x: number; y: number; s: number; sx?: number; sy?: number; rot?: number; ax?: number; ay?: number; children?: React.ReactNode}> = ({
  n, x, y, s, sx = 1, sy = 1, rot = 0, ax, ay, children,
}) => {
  const sp = S(n);
  const axx = ax ?? sp.feet[0];
  const ayy = ay ?? sp.feet[1];
  if (s <= 0.0005) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg) scale(${sx}, ${sy})`, transformOrigin: '0 0'}}>
      <div style={{position: 'absolute', left: -axx * s, top: -ayy * s, width: sp.w * s, height: sp.h * s}}>
        <Img src={F(n)} style={{position: 'absolute', left: 0, top: 0, width: '100%', height: '100%'}} />
        {children ? (
          <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={sp.w * s} height={sp.h * s} viewBox={`0 0 ${sp.w} ${sp.h}`}>
            {children}
          </svg>
        ) : null}
      </div>
    </div>
  );
};
const Svg: React.FC<{children: React.ReactNode; r?: number}> = ({children, r = 4000}) => (
  <svg style={{position: 'absolute', left: -r, top: -r, overflow: 'visible'}} width={2 * r} height={2 * r} viewBox={`${-r} ${-r} ${2 * r} ${2 * r}`}>
    {children}
  </svg>
);
const Label: React.FC<{x: number; y: number; text: string; size: number; s: number; rot?: number; fill?: string}> = ({x, y, text, size, s, rot = 0, fill = '#fff'}) =>
  s <= 0.001 ? null : (
    <div
      style={{
        position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) rotate(${rot}deg) scale(${s})`,
        fontFamily: FONT, fontSize: size, lineHeight: 1, color: fill, whiteSpace: 'nowrap',
        WebkitTextStroke: `${Math.round(size * 0.2)}px #000`, paintOrder: 'stroke fill', textAlign: 'center',
      }}
    >
      {text}
    </div>
  );
const toScreen = (cam: Cam, wx: number, wy: number): [number, number] => [540 + (wx - cam.x) * cam.k, 960 + (wy - cam.y) * cam.k];

// ---------- guy ----------
type Pose = 'scared' | 'relief' | 'shrug' | 'walk' | 'stick' | 'sit';
const HEAD_R = 44; // world px (plate px) head radius in the island / house plates
const Guy: React.FC<{t: number; pose: Pose; x: number; y: number; s?: number; swapAt: number; tremble?: number; bob?: number; shadow?: boolean}> = ({
  t, pose, x, y, s = 1, swapAt, tremble = 0, bob = 0, shadow = true,
}) => {
  const sp = S(pose);
  const k = (s * HEAD_R) / (sp.hd ? sp.hd[2] : 150);
  const [qx, qy] = squashSwap(t, swapAt);
  const br = 1 + 0.009 * Math.sin(2 * Math.PI * 0.6 * t);
  const tx = tremble * (Math.sin(2 * Math.PI * 17 * t) + 0.5 * Math.sin(2 * Math.PI * 9 * t));
  return (
    <>
      {shadow ? (
        <div style={{position: 'absolute', left: x - 60 * s, top: y - 9 * s, width: 120 * s, height: 18 * s, borderRadius: '50%', background: SHADOW, filter: 'blur(3px)'}} />
      ) : null}
      <Spr n={pose} x={x + tx} y={y - bob} s={k} sx={qx} sy={qy * br} />
    </>
  );
};

// ---------- scene A/B: the island, the lava ----------
const LAVA_PTS: [number, number][] = [
  [510, 214], [500, 300], [486, 420], [466, 560], [440, 700], [406, 830], [362, 930], [300, 988], [222, 1018], [142, 1046], [74, 1094], [22, 1166], [-24, 1240],
];
const LAVA_D_STR = 'M ' + LAVA_PTS.map((p) => p.join(' ')).join(' L ');
const lavaU = (t: number) => {
  if (t < T.but) return lerp(0.3, 0.66, easeInOutCubic(prog(t, 0, T.but)));
  return lerp(0.66, 1, easeInOutCubic(prog(t, T.but, T.misses + 0.35)));
};
const Island: React.FC<{t: number}> = ({t}) => {
  const u = lavaU(t);
  const [tx, ty] = along(LAVA_PTS, u);
  const cool = prog(t, CUT_TOWN, CUT_TOWN + 1.5);
  // crater: lava blobs + smoke
  const blobs = Array.from({length: 7}, (_, i) => {
    const per = 0.9 + 0.3 * rnd(i);
    const ph = ((t + rnd(i + 9) * per) % per) / per;
    const vx = (rnd(i + 3) - 0.5) * 90;
    const h = 60 + 50 * rnd(i + 5);
    return {x: 510 + vx * ph, y: 205 - h * 4 * ph * (1 - ph), r: 7 + 5 * rnd(i + 7)};
  });
  const smoke = Array.from({length: 6}, (_, i) => {
    const per = 2.6;
    const ph = ((t + i * (per / 6)) % per) / per;
    return {x: 500 + 40 * Math.sin(i * 2.1) + 60 * ph, y: 190 - 230 * ph, r: (14 + 26 * ph) * Math.min(1, (1 - ph) * 3)};
  });
  const steam = t < T.misses + 0.15 ? [] : Array.from({length: 8}, (_, i) => {
    const per = 1.6;
    const t0 = T.misses + 0.15 + (i % 4) * 0.2;
    const ph = clamp(((t - t0) % per) / per);
    const born = t > t0;
    return born ? {x: 120 + 70 * rnd(i) + 30 * ph, y: 1180 - 210 * ph, r: (12 + 30 * ph) * Math.min(1, (1 - ph) * 3)} : {x: 0, y: 0, r: 0};
  });
  return (
    <>
      <Img src={F('island')} style={{position: 'absolute', left: 0, top: 0, width: 1024, height: 1536}} />
      <Svg>
        <defs>
          <radialGradient id="lpg-crater">
            <stop offset="0" stopColor="#FFB347" stopOpacity="0.6" />
            <stop offset="1" stopColor="#FF6A2B" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx={510} cy={205} rx={130} ry={70} fill="url(#lpg-crater)" opacity={1 - 0.6 * cool} />
        <PuffCluster puffs={smoke} fill="#8E8A88" ink={4} />
        <path d={LAVA_D_STR} pathLength={1} strokeDasharray={`${u} 2`} fill="none" stroke={cool > 0 ? '#5A3A2E' : LAVA_D} strokeWidth={40} strokeLinecap="round" strokeLinejoin="round" />
        <path d={LAVA_D_STR} pathLength={1} strokeDasharray={`${u} 2`} fill="none" stroke={LAVA} strokeOpacity={1 - 0.5 * cool} strokeWidth={28} strokeLinecap="round" strokeLinejoin="round" />
        <path d={LAVA_D_STR} pathLength={1} strokeDasharray={`${u} 2`} fill="none" stroke={LAVA_C} strokeOpacity={1 - 0.8 * cool} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
        {u < 0.99 ? <circle cx={tx} cy={ty} r={24 + 3 * Math.sin(t * 14)} fill={LAVA_C} opacity={0.55} /> : null}
        {blobs.map((b, i) => (
          <circle key={i} cx={b.x} cy={b.y} r={b.r} fill={i % 2 ? LAVA : LAVA_C} />
        ))}
        <PuffCluster puffs={steam} fill="#FFFFFF" ink={4} />
      </Svg>
    </>
  );
};

// ---------- scene C: the house cut-away ----------
const BASE = {x0: 127, x1: 897, top: 928, floor: 1180};
const GAR = {x0: 110, x1: 914, top: 602, floor: 903};
const levelBase = (t: number) => {
  const fill = lerp(BASE.floor, BASE.top + 6, easeInOutCubic(prog(t, T.carbon, T.air + 0.2)));
  return lerp(fill, BASE.floor + 4, easeInOutCubic(prog(t, T.two + 0.4, T.later + 0.7)));
};
const levelGar = (t: number) => {
  const fill = lerp(GAR.floor, 760, easeInOutCubic(prog(t, T.so2, T.garages + 0.5)));
  return lerp(fill, GAR.floor + 4, easeInOutCubic(prog(t, T.two, T.later + 0.3)));
};
const gasAlpha = (t: number) => lerp(0.55, 0.32, prog(t, T.invisible, T.invisible + 0.4));
const wave = (x0: number, x1: number, y: number, y1: number, t: number, a = 7) => {
  if (y >= y1 - 1) return '';
  let d = `M ${x0} ${y1} L ${x0} ${y}`;
  for (let x = x0; x <= x1; x += 24) d += ` L ${x} ${y + a * Math.sin(x / 40 + t * 3)}`;
  return d + ` L ${x1} ${y} L ${x1} ${y1} Z`;
};
const topLine = (x0: number, x1: number, y: number, t: number, a = 7) => {
  let d = `M ${x0} ${y}`;
  for (let x = x0; x <= x1; x += 24) d += ` L ${x} ${y + a * Math.sin(x / 40 + t * 3)}`;
  return d;
};
const CRACKS = [182, 366, 727];
const ALARMS: {x: number; y: number}[] = [
  {x: 250, y: 330}, {x: 780, y: 330}, {x: 512, y: 280},
  {x: 270, y: 680}, {x: 520, y: 660}, {x: 720, y: 690},
  {x: 420, y: 990}, {x: 640, y: 985}, {x: 840, y: 1000},
];
const alarmAt = (i: number) => T.so3 + 0.12 + i * 0.17;

const Alarm: React.FC<{x: number; y: number; s: number; red: boolean; t: number; size?: number}> = ({x, y, s, red, t, size = 46}) => {
  if (s <= 0.001) return null;
  const on = red ? Math.sin(2 * Math.PI * 3 * t) > 0 : Math.sin(2 * Math.PI * 1.2 * t) > -0.3;
  const h = size / 2;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-h} y={-h} width={size} height={size} rx={size * 0.18} fill="#F4F4F2" stroke={INK} strokeWidth={size * 0.11} />
      <rect x={-h * 0.55} y={h * 0.15} width={h * 1.1} height={h * 0.12} rx={2} fill="#C9C9C4" />
      <rect x={-h * 0.55} y={h * 0.45} width={h * 1.1} height={h * 0.12} rx={2} fill="#C9C9C4" />
      <circle cx={h * 0.45} cy={-h * 0.45} r={h * 0.26} fill={red ? (on ? '#FF3B2F' : '#8A2420') : on ? '#39D353' : '#1E6B2C'} stroke={INK} strokeWidth={size * 0.05} />
      {on ? <circle cx={h * 0.45} cy={-h * 0.45} r={h * 0.55} fill={red ? '#FF3B2F' : '#39D353'} opacity={0.25} /> : null}
    </g>
  );
};

const Animal: React.FC<{n: 'bird' | 'cat'; t: number; x: number; floor: number; s: number; eyes: [number, number, number][]; fur: string}> = ({n, t, x, floor, s, eyes, fur}) => {
  const sp = S(n);
  const u = easeOutCubic(prog(t, T.drop + (n === 'cat' ? 0.1 : 0), T.drop + (n === 'cat' ? 0.38 : 0.28)));
  const rot = 180 * u;
  const hop = n === 'bird' && t < T.drop ? Math.abs(Math.sin(t * 9)) * 12 : 0;
  const walkBob = n === 'cat' && t < T.drop ? Math.abs(Math.sin(t * 10)) * 3 : 0;
  const lift = Math.sin(Math.PI * u) * 40;
  const dead = u >= 1;
  return (
    <Spr n={n} x={x} y={floor - (sp.h * s) / 2 - hop - walkBob - lift} s={s} rot={rot} ax={sp.w / 2} ay={sp.h / 2}>
      {dead
        ? eyes.map(([ex, ey, r], i) => (
            <g key={i}>
              <circle cx={ex} cy={ey} r={r + 4} fill={fur} />
              <path d={`M ${ex - r} ${ey - r} L ${ex + r} ${ey + r} M ${ex + r} ${ey - r} L ${ex - r} ${ey + r}`} stroke={INK} strokeWidth={r * 0.45} strokeLinecap="round" />
            </g>
          ))
        : null}
    </Spr>
  );
};

const House: React.FC<{t: number}> = ({t}) => {
  const lb = levelBase(t);
  const lg = levelGar(t);
  const ga = gasAlpha(t);
  const dashOff = -t * 40;
  // ground face
  const fOpen = pop(t, T.ground, 0.3);
  const exhale = t > T.breathing - 0.1 && t < T.dioxide + 0.5;
  // wisps rising up the cracks
  const wisps = t < T.breathing - 0.2 || t > T.garages + 0.6 ? [] : CRACKS.flatMap((cx, j) =>
    Array.from({length: 4}, (_, i) => {
      const per = 1.4;
      const ph = ((t - T.breathing + 0.2 + i * (per / 4) + j * 0.3) % per) / per;
      return {x: cx + 14 * Math.sin(ph * 8 + j), y: 1500 - 330 * ph, r: (10 + 14 * ph) * Math.min(1, (1 - ph) * 4)};
    }),
  );
  const mouthPuffs = !exhale ? [] : Array.from({length: 3}, (_, i) => {
    const ph = clamp((((t - T.breathing) % 0.9) + i * 0.3) / 0.9) % 1;
    return {x: 512 + 30 * Math.sin(i * 2), y: 1430 - 90 * ph, r: (14 + 18 * ph) * Math.min(1, (1 - ph) * 3)};
  });
  const redAt = (y: number) => (y > lg - 10 && y < GAR.floor) || (y > lb - 10 && y < BASE.floor);
  const arrows = pop(t, T.heavier, 0.25) * (t < T.so2 + 0.6 ? 1 : Math.max(0, 1 - prog(t, T.so2 + 0.6, T.so2 + 0.8)));
  const showAnimals = t > T.birds - 0.3 && t < T.two + 0.35;
  return (
    <>
      <Img src={F('house')} style={{position: 'absolute', left: 0, top: 0, width: 1024, height: 1536}} />
      <Svg>
        {/* ground face */}
        {fOpen > 0 ? (
          <g>
            <Eye x={466} y={1345} r={26} open={fOpen} look={[0, t < T.breathing ? -0.6 : -0.9]} lid={t > T.invisible + 0.6 && t < T.two ? 0.35 : 0} brow={0.6} />
            <Eye x={558} y={1345} r={26} open={fOpen} look={[0, t < T.breathing ? -0.6 : -0.9]} side={-1} lid={t > T.invisible + 0.6 && t < T.two ? 0.35 : 0} brow={0.6} />
            {exhale ? (
              <ellipse cx={512} cy={1415} rx={22} ry={28 + 4 * Math.sin(t * 9)} fill="#2A1A12" stroke={INK} strokeWidth={5} />
            ) : (
              <path d="M 482 1410 Q 512 1432 542 1410" fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
            )}
          </g>
        ) : null}
        <g opacity={0.85}>
          <PuffCluster puffs={wisps} fill={GAS} ink={4} />
          <PuffCluster puffs={mouthPuffs} fill={GAS} ink={4} />
        </g>
        {/* animals (behind the gas) */}
        {showAnimals ? null : null}
      </Svg>
      {showAnimals ? (
        <>
          {t > T.birds - 0.3 ? (
            <Animal n="bird" t={t} x={lerp(170, 330, easeOutCubic(prog(t, T.birds - 0.3, T.cats)))} floor={GAR.floor - 18} s={0.24} eyes={[[272, 69, 16]]} fur="#9A6A43" />
          ) : null}
          {t > T.cats - 0.4 ? (
            <Animal n="cat" t={t} x={lerp(860, 650, easeOutCubic(prog(t, T.cats - 0.4, T.drop - 0.05)))} floor={GAR.floor - 16} s={0.28} eyes={[[338, 124, 15]]} fur="#E8913A" />
          ) : null}
        </>
      ) : null}
      <Svg>
        {/* gas pools (heavier than air): basement first, then the garage */}
        <path d={wave(BASE.x0, BASE.x1, lb, BASE.floor, t)} fill={GAS} opacity={ga} />
        {lb < BASE.floor - 2 ? <path d={topLine(BASE.x0, BASE.x1, lb, t)} fill="none" stroke={GAS_INK} strokeWidth={5} strokeDasharray="18 12" strokeDashoffset={dashOff} /> : null}
        <path d={wave(GAR.x0, GAR.x1, lg, GAR.floor, t + 1)} fill={GAS} opacity={ga} />
        {lg < GAR.floor - 2 ? <path d={topLine(GAR.x0, GAR.x1, lg, t + 1)} fill="none" stroke={GAS_INK} strokeWidth={5} strokeDasharray="18 12" strokeDashoffset={dashOff} /> : null}
        {/* heavier than air: arrows pushing down */}
        {arrows > 0
          ? [300, 512, 724].map((ax, i) => {
              const by = Math.min(lb, BASE.top + 60) - 50 + 10 * Math.sin(t * 8 + i);
              return (
                <g key={i} transform={`translate(${ax} ${by}) scale(${arrows})`}>
                  <path d="M -22 -18 L 0 6 L 22 -18" fill="none" stroke={INK} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M -22 -18 L 0 6 L 22 -18" fill="none" stroke="#FFE45C" strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
                </g>
              );
            })
          : null}
        {/* alarms */}
        {ALARMS.map((a, i) => (
          <Alarm key={i} x={a.x} y={a.y} t={t + i * 0.13} s={pop(t, alarmAt(i), 0.25)} red={redAt(a.y)} />
        ))}
      </Svg>
    </>
  );
};

// ---------- camera ----------
const CAM_A: CamKey[] = [
  {t: 0, x: 512, y: 740, k: 1.42},
  {t: T.town, x: 500, y: 800, k: 1.42},
  {t: T.but + 0.45, x: 445, y: 850, k: 1.5},
];
const CAM_B: CamKey[] = [
  {t: CUT_TOWN, x: 500, y: 1060, k: 2.2},
  {t: CUT_HOUSE, x: 540, y: 1066, k: 2.32},
];
const CAM_C: CamKey[] = [
  {t: CUT_HOUSE, x: 512, y: 936, k: 1.6},
  {t: T.its - 0.1, x: 512, y: 920, k: 1.62},
  {t: T.heavier, x: 512, y: 780, k: 1.42},
  {t: T.birds - 0.35, x: 512, y: 780, k: 1.42},
  {t: T.birds + 0.25, x: 480, y: 790, k: 2.0},
  {t: T.so3 - 0.1, x: 480, y: 800, k: 2.02},
  {t: T.over + 0.2, x: 512, y: 768, k: 1.25},
  {t: T.families - 0.1, x: 512, y: 768, k: 1.25},
  {t: T.inn - 0.1, x: 512, y: 440, k: 2.1},
];

// ---------- sounds ----------
const CUES: Cue[] = [
  {f: 'rumble', at: 0.0, db: -27, dur: 2.0},
  {f: 'lava_glop', at: 0.05, db: -25, keys: [[0, -25], [2.2, -27], [3.4, -40]]},
  {f: 'whoosh', at: T.but - 0.15, db: -27},
  {f: 'sizzle', at: T.misses + 0.1, db: -22},
  {f: 'whoosh', at: CUT_TOWN - 0.16, db: -31},
  {f: 'barrier', at: T.cant - 0.02, db: -15},
  {f: 'boing', at: T.home - 0.05, db: -27},
  {f: 'whoosh', at: CUT_HOUSE - 0.16, db: -31},
  {f: 'gas_hiss', at: T.breathing - 0.1, db: -24},
  {f: 'pop', at: T.dioxide, db: -22},
  {f: 'pop', at: T.invisible, db: -24},
  {f: 'bird_call', at: T.birds - 0.1, db: -24},
  {f: 'meow', at: T.cats - 0.05, db: -22},
  {f: 'faint', at: T.drop - 0.05, db: -17},
  {f: 'faint', at: T.drop + 0.08, db: -20, rate: 0.85},
  {f: 'whoosh', at: T.so3 - 0.15, db: -31},
  ...ALARMS.map((_, i) => ({f: 'pop', at: alarmAt(i), db: -27 - (i % 3)}) as Cue),
  {f: 'alarm_chirp', at: T.alarms - 0.05, db: -22},
  {f: 'flip', at: T.years + 0.15, db: -20},
  {f: 'door_in', at: T.families - 0.05, db: -20},
  {f: 'whoosh', at: CUT_CLOSE - 0.14, db: -31},
  {f: 'alarm_chirp', at: T.alarms2 + 0.05, db: -17},
  {f: 'gulp', at: T.still - 0.05, db: -18},
  {f: 'alarm_chirp', at: T.on + 0.02, db: -15},
];

// ---------- the scene ----------
export const LapalmaScene: React.FC<{t: number; cam?: Cam; cover?: boolean}> = ({t, cam: camOverride, cover = false}) => {
  // ---- A: the island, lava coming down ----
  if (t < CUT_TOWN || cover) {
    const c0 = camOverride ?? camAt(t, CAM_A);
    const sh = shake(t, 3 * (1 - prog(t, 0, 2.4)) + 6 * pulse(t, T.misses + 0.1, 0.4));
    const cam = {...c0, x: c0.x - sh.x / c0.k, y: c0.y - sh.y / c0.k};
    const relieved = t >= T.misses && !cover;
    return (
      <AbsoluteFill style={{background: '#BFE3F2'}}>
        <World cam={cam}>
          <Island t={t} />
          <Guy t={t} pose={relieved ? 'relief' : 'scared'} x={655} y={1212} s={1.55} swapAt={T.misses} tremble={relieved ? 0 : 1.6} />
        </World>
      </AbsoluteFill>
    );
  }
  // ---- B: the town, the barrier ----
  if (t < CUT_HOUSE) {
    const cam = camAt(t, CAM_B);
    const walkU = easeOutCubic(prog(t, CUT_TOWN, T.cant + 0.05));
    const gx = lerp(290, 420, walkU);
    const bob = t < T.cant ? Math.abs(Math.sin(t * 11)) * 8 : 0;
    const bs = pop(t, T.cant - 0.04, 0.28);
    const shrug = t >= T.home;
    const sh = shake(t, 7 * pulse(t, T.cant, 0.3));
    const c = {...cam, x: cam.x - sh.x / cam.k, y: cam.y - sh.y / cam.k};
    const bS = S('barrier');
    const signY = 1208 - bS.feet[1] * 0.48 * bs + 30;
    return (
      <AbsoluteFill style={{background: '#BFE3F2'}}>
        <World cam={c}>
          <Island t={t} />
          {bs > 0 ? (
            <div style={{position: 'absolute', left: 0, top: 0}}>
              <Spr n="barrier" x={605} y={1210} s={0.48 * bs} />
              <Svg>
                <g transform={`translate(605 ${signY}) scale(${bs}) rotate(${4 * Math.sin(t * 6) * (1 - prog(t, T.cant, T.cant + 1.2))})`}>
                  <rect x={-78} y={-24} width={156} height={48} rx={8} fill="#fff" stroke={INK} strokeWidth={6} />
                  <rect x={-70} y={-16} width={140} height={32} rx={5} fill="none" stroke="#D7322B" strokeWidth={5} />
                  <text x={0} y={10} textAnchor="middle" fontFamily={FONT} fontSize={28} fill="#D7322B">
                    PELIGRO
                  </text>
                </g>
              </Svg>
            </div>
          ) : null}
          <Guy t={t} pose={shrug ? 'shrug' : 'walk'} x={gx} y={1210} s={1.05} swapAt={T.home} bob={bob} />
          {t > T.cant + 0.1 && t < T.home ? (
            <Svg>
              <g transform={`translate(${gx + 20} ${1210 - 300}) scale(${pop(t, T.cant + 0.1, 0.25)})`}>
                <text x={0} y={0} textAnchor="middle" fontFamily={FONT} fontSize={90} fill="#FFE45C" stroke={INK} strokeWidth={14} paintOrder="stroke">
                  ?
                </text>
              </g>
            </Svg>
          ) : null}
        </World>
      </AbsoluteFill>
    );
  }
  // ---- C: inside the ground and the house ----
  if (t < CUT_CLOSE) {
    const cam = camAt(t, CAM_C);
    const sh = shake(t, 2.5 * pulse(t, T.breathing, 1.0) + 3 * pulse(t, T.drop + 0.25, 0.3));
    const c = {...cam, x: cam.x - sh.x / cam.k, y: cam.y - sh.y / cam.k};
    const lb = levelBase(t);
    const [lx, ly] = toScreen(c, 512, Math.min(lb + 70, 1100));
    const co2 = popOut(t, T.dioxide - 0.05, T.birds - 0.4);
    const inv = popOut(t, T.invisible - 0.05, T.birds - 0.4);
    const stickS = popOut(t, T.so3 + 0.05, T.two + 0.2);
    const walkS = t > T.families - 0.2;
    const walkU = easeInOutCubic(prog(t, T.families - 0.2, T.inn));
    // the 1,000+ counter
    const cnt = Math.round(1000 * easeOutCubic(prog(t, T.over, T.alarms)));
    const cntS = popOut(t, T.over - 0.1, T.two - 0.1);
    // calendar 2021 -> 2023
    const calS = popOut(t, T.two - 0.08, T.families - 0.25);
    const flipped = t > T.years + 0.3;
    return (
      <AbsoluteFill style={{background: '#BFE3F2'}}>
        <World cam={c}>
          <House t={t} />
          {stickS > 0 ? (
            <div style={{opacity: 1}}>
              <Guy t={t} pose="stick" x={640} y={548} s={1.0 * stickS} swapAt={T.so3 + 0.05} />
            </div>
          ) : null}
          {walkS ? (
            t < T.inn ? (
              <Guy t={t} pose="walk" x={lerp(160, 470, walkU)} y={548} s={1.0} swapAt={T.families - 0.2} bob={Math.abs(Math.sin(t * 11)) * 7} />
            ) : (
              <Guy t={t} pose="sit" x={512} y={552} s={1.0} swapAt={T.inn} />
            )
          ) : null}
        </World>
        <Label x={lx} y={ly} text="CO₂" size={96} s={co2} fill="#D9D2FF" />
        <Label x={lx} y={ly + 95} text="(invisible)" size={52} s={inv} fill="#fff" />
        <Label x={540} y={300} text={`${cnt.toLocaleString('en-US')}${cnt >= 1000 ? '+' : ''}`} size={150} s={cntS} fill="#39D353" />
        <Label x={540} y={420} text="GAS ALARMS" size={70} s={cntS} fill="#fff" />
        {calS > 0 ? (
          <div style={{position: 'absolute', left: 540, top: 900, transform: `translate(-50%, -50%) scale(${calS}) rotate(-3deg)`}}>
            <div style={{width: 470, height: 400, background: '#fff', border: '12px solid #000', borderRadius: 30, overflow: 'hidden', position: 'relative'}}>
              <div style={{height: 110, background: '#D7322B', borderBottom: '10px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontSize: 64, color: '#fff'}}>
                {flipped ? 'DEC' : 'NOV'}
              </div>
              <div style={{position: 'absolute', top: 120, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontSize: 150, color: '#000', transform: `scaleY(${t > T.years + 0.15 && t < T.years + 0.45 ? Math.abs(Math.cos(((t - T.years - 0.15) / 0.3) * Math.PI)) : 1})`}}>
                {flipped ? '2023' : '2021'}
              </div>
            </div>
          </div>
        ) : null}
      </AbsoluteFill>
    );
  }
  // ---- D: the punchline close-up ----
  const sp = S('close');
  const gs = 1.12;
  const gx = 360;
  const gy = 1990;
  const tr = 1.5 * (Math.sin(2 * Math.PI * 15 * t) + 0.5 * Math.sin(2 * Math.PI * 8 * t)) * prog(t, T.still - 0.1, T.still + 0.1);
  const [qx, qy] = squashSwap(t, CUT_CLOSE);
  const hd = sp.hd as [number, number, number];
  const headX = gx + (hd[0] - sp.feet[0]) * gs;
  const headY = gy + (hd[1] - sp.feet[1]) * gs;
  const sw = popOut(t, T.still - 0.05, 30, 0.25);
  const flash = pulse(t, T.on, 0.5) + 0.6 * pulse(t, T.alarms2 + 0.05, 0.35);
  const aS = pop(t, CUT_CLOSE + 0.05, 0.3) * (1 + 0.12 * flash);
  return (
    <AbsoluteFill style={{background: '#F6E7B8'}}>
      <World cam={{x: 600, y: 380, k: 3.0}} blur={5}>
        <Img src={F('house')} style={{position: 'absolute', left: 0, top: 0, width: 1024, height: 1536}} />
      </World>
      <svg style={{position: 'absolute', left: 0, top: 0}} width={1080} height={1920}>
        {flash > 0.02 ? <circle cx={880} cy={470} r={150 + 160 * flash} fill="#39D353" opacity={0.25 * flash} /> : null}
        <Alarm x={880} y={470} s={aS} red={false} t={t} size={190} />
      </svg>
      <Spr n="close" x={gx + tr} y={gy} s={gs} sx={qx} sy={qy * (1 + 0.006 * Math.sin(2 * Math.PI * 0.6 * t))} />
      <svg style={{position: 'absolute', left: 0, top: 0}} width={1080} height={1920}>
        <SweatDrop x={headX + hd[2] * gs * 0.78} y={headY - hd[2] * gs * 0.35 + 60 * prog(t, T.still, T.end + 0.5)} r={26} s={sw} rot={-15} />
      </svg>
    </AbsoluteFill>
  );
};

export const LapalmaGasShort: React.FC = () => {
  useLapalmaFont();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  return (
    <AbsoluteFill>
      <LapalmaScene t={t} />
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('lapalma-gas/vo/take1.mp3')} />
      </Sequence>
      <Audio src={staticFile('lapalma-gas/music/bed.wav')} />
      <SoundCues cues={CUES} dir="lapalma-gas/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};
