import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SPR} from './sprites';
import {DURATION, FPS, T, VO_AT} from './scene';
export {DURATION as TC_DURATION, FPS as TC_FPS} from './scene';
import {camAt, clamp, easeInCubic, easeInOutCubic, easeOutCubic, lerp, pop, prog, rnd, shake, spring, type Cam, type CamKey} from '../shared/anim';
import {World} from '../shared/World';
import {PuffCluster} from '../shared/Puffs';
import {SweatDrop} from '../shared/SweatDrop';
import {SoundCues, type Cue} from '../shared/Sound';
import {useFont} from '../shared/useFont';

// "How did a secret nuclear mission find the Titanic?" - a Titanic hunter (the channel guy in a navy watch cap) dreams of
// the Titanic; a Navy officer hands him a TOP SECRET folder: two sunken nuclear subs. He hides the folder in a big
// TITANIC book (a literal cover story) while the press flashes. BUT the subs come first: the robot camera sled (lens eyes)
// dives to a broken sub. Twelve days left. Luckily (light bulb) - a replay: the sub sinks, breaks, heavy pieces drop,
// small bits drift with the current into a mile-long trail. So on the chart he hunts the trail, not the tiny ship.
// At night he dozes at the monitor - a boiler slides onto the screen - he jumps. Through the screen: the Titanic's bow
// in the lamp light. The cover story comes true: TRUE stamp on the book, the officer facepalms at the flashes.
// The wrecks are graves: no faces and no jokes on them; the gags are on the living and the robot.

const F = (n: string) => staticFile(`titanic-cover/${n}.png`);
export const FONT = 'TCInter';
export const useTCFont = () => useFont(FONT, staticFile('fonts/Inter-Black.otf'));
const MIX_DB = -0.3;
const INK = '#000';
const YEL = '#FFE45C';
const RED = '#E8382E';
const GRN = '#3DBB55';
const MANILA = '#E8C46A';
const MANILA_SH = '#C9A24A';
const PAPER = '#F6F1E6';
export const NIGHT = '#16264f';

// ---------- scene cuts ----------
export const C_DIVE = 8.22;
export const C_DECK2 = 9.95;
export const C_REPLAY = 12.2;
export const C_MAP = 16.56;
export const C_ROOM = 19.0;
export const C_BOW = 21.78;
export const C_END = 22.62;

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

type SprInfo = {w: number; h: number; feet: [number, number]; hd?: [number, number, number]; bottom: number; left: number; right: number; top: number};
const S = (n: string) => (SPR as unknown as Record<string, SprInfo>)[n];

const Spr: React.FC<{n: string; x: number; y: number; s: number; sx?: number; sy?: number; rot?: number; ax?: number; ay?: number; filter?: string; children?: React.ReactNode}> = ({
  n,
  x,
  y,
  s,
  sx = 1,
  sy = 1,
  rot = 0,
  ax,
  ay,
  filter,
  children,
}) => {
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
const Svg: React.FC<{children: React.ReactNode; r?: number}> = ({children, r = 7000}) => (
  <svg style={{position: 'absolute', left: -r, top: -r, overflow: 'visible'}} width={2 * r} height={2 * r} viewBox={`${-r} ${-r} ${2 * r} ${2 * r}`}>
    {children}
  </svg>
);
const Screen: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', ...style}} width={1080} height={1920}>
    {children}
  </svg>
);
const Txt: React.FC<{x: number; y: number; size: number; s?: number; text: string; rot?: number; fill?: string; stroke?: string; sw?: number; anchor?: 'middle' | 'start' | 'end'}> = ({
  x,
  y,
  size,
  s = 1,
  text,
  rot = 0,
  fill = '#fff',
  stroke = INK,
  sw = 0.2,
  anchor = 'middle',
}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <text x={0} y={size * 0.35} textAnchor={anchor} fontFamily={FONT} fontWeight={900} fontSize={size} fill={fill} stroke={stroke} strokeWidth={size * sw} paintOrder="stroke" strokeLinejoin="round">
        {text}
      </text>
    </g>
  );
const star = (x: number, y: number, r: number) =>
  `M ${x} ${y - r * 2} L ${x + r * 0.45} ${y - r * 0.45} L ${x + r * 2} ${y} L ${x + r * 0.45} ${y + r * 0.45} L ${x} ${y + r * 2} L ${x - r * 0.45} ${y + r * 0.45} L ${x - r * 2} ${y} L ${x - r * 0.45} ${y - r * 0.45} Z`;

// radiation trefoil (yellow disc, black blades)
const Trefoil: React.FC<{x: number; y: number; r: number; s?: number; rot?: number}> = ({x, y, r, s = 1, rot = 0}) => {
  if (s <= 0.001) return null;
  const blade = (a: number) => {
    const a0 = ((a - 30) * Math.PI) / 180;
    const a1 = ((a + 30) * Math.PI) / 180;
    const ri = r * 0.22;
    const ro = r * 0.8;
    return `M ${ri * Math.cos(a0)} ${ri * Math.sin(a0)} L ${ro * Math.cos(a0)} ${ro * Math.sin(a0)} A ${ro} ${ro} 0 0 1 ${ro * Math.cos(a1)} ${ro * Math.sin(a1)} L ${ri * Math.cos(a1)} ${ri * Math.sin(a1)} A ${ri} ${ri} 0 0 0 ${ri * Math.cos(a0)} ${ri * Math.sin(a0)} Z`;
  };
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <circle r={r} fill="#FFD23F" stroke={INK} strokeWidth={r * 0.1} />
      {[-90, 30, 150].map((a) => (
        <path key={a} d={blade(a)} fill={INK} />
      ))}
      <circle r={r * 0.15} fill={INK} />
    </g>
  );
};

// a simple code Titanic silhouette (side view, facing left), w = hull length
const TitanicIcon: React.FC<{x: number; y: number; w: number; s?: number; bob?: number}> = ({x, y, w, s = 1, bob = 0}) => {
  if (s <= 0.001) return null;
  const h = w * 0.17;
  const sw = w * 0.012;
  return (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(${bob})`}>
      {[0.3, 0.45, 0.6, 0.75].map((f, i) => (
        <g key={i}>
          <rect x={-w / 2 + f * w - w * 0.035} y={-h * 1.55} width={w * 0.07} height={h * 1.0} fill="#D9A441" stroke={INK} strokeWidth={sw} />
          <rect x={-w / 2 + f * w - w * 0.035} y={-h * 1.55} width={w * 0.07} height={h * 0.25} fill="#1a1a1a" />
        </g>
      ))}
      <rect x={-w * 0.36} y={-h * 0.72} width={w * 0.7} height={h * 0.32} fill="#F4F1E8" stroke={INK} strokeWidth={sw} />
      <path d={`M ${-w / 2} ${-h * 0.42} L ${w / 2} ${-h * 0.42} L ${w * 0.46} ${h * 0.5} L ${-w * 0.44} ${h * 0.5} Z`} fill="#22252b" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
      <path d={`M ${-w * 0.47} ${h * 0.18} L ${w * 0.48} ${h * 0.18} L ${w * 0.46} ${h * 0.5} L ${-w * 0.44} ${h * 0.5} Z`} fill="#B3312C" />
      <path d={`M ${-w / 2} ${-h * 0.42} L ${w / 2} ${-h * 0.42} L ${w * 0.46} ${h * 0.5} L ${-w * 0.44} ${h * 0.5} Z`} fill="none" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
      <line x1={-w * 0.44} y1={-h * 0.42} x2={-w * 0.48} y2={-h * 2.1} stroke={INK} strokeWidth={sw} />
      <line x1={w * 0.42} y1={-h * 0.42} x2={w * 0.44} y2={-h * 1.9} stroke={INK} strokeWidth={sw} />
    </g>
  );
};

// a code sub silhouette for the dossier photos / the map
const SubIcon: React.FC<{x: number; y: number; w: number; fill?: string}> = ({x, y, w, fill = '#59616b'}) => {
  const h = w * 0.16;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-w * 0.1} y={-h * 1.25} width={w * 0.18} height={h * 0.9} rx={h * 0.15} fill={fill} stroke={INK} strokeWidth={w * 0.012} />
      <path d={`M ${-w / 2} 0 Q ${-w / 2} ${-h / 2} ${-w * 0.38} ${-h / 2} L ${w * 0.38} ${-h / 2} Q ${w / 2} ${-h * 0.3} ${w / 2} 0 Q ${w / 2} ${h * 0.3} ${w * 0.38} ${h / 2} L ${-w * 0.38} ${h / 2} Q ${-w / 2} ${h / 2} ${-w / 2} 0 Z`} fill={fill} stroke={INK} strokeWidth={w * 0.012} />
      <path d={`M ${w * 0.48} 0 L ${w * 0.58} ${-h * 0.45} L ${w * 0.58} ${h * 0.45} Z`} fill={fill} stroke={INK} strokeWidth={w * 0.012} strokeLinejoin="round" />
    </g>
  );
};

// ======================================================================================================
// CHARACTERS (head radius RH in world px for every pose)
// ======================================================================================================
const RH = 100;
type Pose = 'hero' | 'book' | 'worried' | 'idea' | 'doze' | 'joy' | 'proud' | 'hand' | 'shh' | 'facepalm';
const poseS = (p: Pose) => RH / (S(p).hd as [number, number, number])[2];
type GuyState = {vis: boolean; pose: Pose; x: number; y: number; sx: number; sy: number; flip?: boolean};
const Guy: React.FC<{g: GuyState; children?: React.ReactNode}> = ({g, children}) => {
  if (!g.vis) return null;
  const s = poseS(g.pose);
  return (
    <div style={{position: 'absolute', left: g.x, top: g.y, transform: `scale(${g.flip ? -g.sx : g.sx}, ${g.sy})`, transformOrigin: '0 0'}}>
      <Spr n={g.pose} x={0} y={0} s={s}>
        {children}
      </Spr>
    </div>
  );
};
const Shadow: React.FC<{x: number; y: number; w: number; o?: number}> = ({x, y, w, o = 1}) => (
  <div style={{position: 'absolute', left: x - w / 2, top: y - w * 0.07, width: w, height: w * 0.14, borderRadius: '50%', background: `rgba(10, 14, 30, ${0.32 * o})`, filter: 'blur(3px)'}} />
);
// world position of a sprite point for a guy standing at (x, y)
const ptOf = (pose: Pose, p: [number, number], x: number, y: number, sx = 1, sy = 1): [number, number] => {
  const s = poseS(pose);
  const f = S(pose).feet;
  return [x + (p[0] - f[0]) * s * sx, y - (f[1] - p[1]) * s * sy];
};

// ======================================================================================================
// SCENE 1 / 3 / 8 - THE DECK AT NIGHT (world: the night plate at 1.1x; railing; deck floor)
// ======================================================================================================
const PS = 1.1;
const HOR = 1300; // horizon (world)
const PL_X = 200 - 215 * PS; // moon at world x ~200
const PL_Y = HOR - SPR.night.horizon * PS;
const FEET = 1760;
const HX = 330; // the hunter
const OX = 800; // the officer
const RAIL_TOP = 1560;
const DECK_TOP = 1690;

const hunter = (t: number): GuyState => {
  const b = breathe(t);
  if (t < C_DIVE) {
    if (t < T.titanic2 - 0.02) {
      const nod = t > T.secret && t < T.secret + 0.4 ? 1 - 0.03 * Math.sin(Math.PI * prog(t, T.secret, T.secret + 0.4)) : 1;
      return {vis: true, pose: 'hero', x: HX, y: FEET, sx: 1, sy: b * nod};
    }
    const [sx, sy] = squashSwap(t, T.titanic2);
    const bob = t > T.becomes && t < C_DIVE ? 1 + 0.02 * Math.max(0, Math.sin(2 * Math.PI * 2.2 * (t - T.becomes))) : 1;
    return {vis: true, pose: 'book', x: HX, y: FEET, sx, sy: sy * b * bob};
  }
  if (t >= C_DECK2 && t < C_REPLAY) {
    if (t < T.luckily - 0.02) {
      const tremble = 1.5 * Math.sin(2 * Math.PI * 9 * t);
      return {vis: true, pose: 'worried', x: HX + tremble, y: FEET, sx: 1, sy: b};
    }
    const [sx, sy] = squashSwap(t, T.luckily);
    return {vis: true, pose: 'idea', x: HX, y: FEET, sx, sy: sy * b};
  }
  if (t >= C_END) {
    const hop = t > T.comes && t < T.comes + 0.45 ? 40 * Math.sin(Math.PI * prog(t, T.comes, T.comes + 0.45)) : 0;
    const [sx, sy] = t < T.comes + 0.45 ? [1, 1] : squashSwap(t, T.comes + 0.53);
    return {vis: true, pose: 'proud', x: HX, y: FEET - hop, sx, sy: sy * b};
  }
  return {vis: false, pose: 'hero', x: 0, y: 0, sx: 1, sy: 1};
};
const officer = (t: number): GuyState => {
  const b = breathe(t, 1.3);
  if (t < C_DIVE) {
    if (t < T.navy + 0.08) return {vis: true, pose: 'hand', x: OX, y: FEET, sx: 1, sy: b};
    const [sx, sy] = squashSwap(t, T.navy + 0.1);
    return {vis: true, pose: 'shh', x: OX, y: FEET, sx, sy: sy * b};
  }
  if (t >= C_END) {
    const tremble = t > T.true ? 1.5 * Math.sin(2 * Math.PI * 10 * t) : 0;
    return {vis: true, pose: 'facepalm', x: OX + tremble, y: FEET, sx: 1, sy: b};
  }
  return {vis: false, pose: 'hand', x: 0, y: 0, sx: 1, sy: 1};
};

// the folder (manila, TOP SECRET): officer's palm -> hunter's hands
const OPALM = ptOf('hand', [45, 398], OX, FEET);
const HPALM = ptOf('hero', [800, 760], HX, FEET);
const folderPos = (t: number): [number, number, number] | null => {
  if (t >= T.titanic2 + 0.02 || t >= C_DIVE) return null;
  if (t < T.takes) return [OPALM[0], OPALM[1] + 2 * Math.sin(2 * Math.PI * 0.6 * t), -4];
  const u = easeInOutCubic(prog(t, T.takes, T.takes + 0.33));
  const x = lerp(OPALM[0], HPALM[0], u);
  const y = lerp(OPALM[1], HPALM[1], u) - 70 * Math.sin(Math.PI * u);
  const land = t > T.takes + 0.33 ? 6 * spring(t - T.takes - 0.33, 3, 6) : 0;
  return [x, y + land, lerp(-4, 6, u)];
};
const Folder: React.FC<{x: number; y: number; rot: number; stamp: number; w?: number}> = ({x, y, rot, stamp, w = 165}) => {
  const h = w * 0.7;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path d={`M ${-w / 2} ${-h} L ${-w / 2 + w * 0.36} ${-h} L ${-w / 2 + w * 0.42} ${-h - h * 0.12} L ${w / 2 - w * 0.08} ${-h - h * 0.12} L ${w / 2} ${-h} L ${w / 2} 0 L ${-w / 2} 0 Z`} fill={MANILA_SH} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <rect x={-w / 2} y={-h * 0.92} width={w} height={h * 0.92} fill={MANILA} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      {stamp > 0.001 ? (
        <g transform={`translate(0 ${-h * 0.46}) rotate(-12) scale(${stamp})`}>
          <rect x={-w * 0.45} y={-h * 0.17} width={w * 0.9} height={h * 0.34} rx={6} fill="none" stroke={RED} strokeWidth={6} />
          <text x={0} y={h * 0.08} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={w * 0.118} letterSpacing={-0.5} fill={RED}>
            TOP SECRET
          </text>
        </g>
      ) : null}
    </g>
  );
};
const stampAt = (t: number, t0: number) => (t < t0 ? 0 : 1 + 0.7 * Math.max(0, 1 - prog(t, t0, t0 + 0.12)) + (t > t0 + 0.12 ? 0.08 * spring(t - t0 - 0.12, 4, 9) : 0));

const ThoughtBubble: React.FC<{t: number; force?: boolean}> = ({t, force}) => {
  const s = force || t < 1.66 ? 1 : 1 - easeInCubic(prog(t, 1.66, 1.86));
  if (s <= 0.001 || t >= C_DIVE) return null;
  const cx = 270;
  const cy = 1090;
  const by = 6 * Math.sin(2 * Math.PI * 0.7 * t);
  const puffs = [
    {x: cx - 120, y: cy + 20, r: 70},
    {x: cx - 50, y: cy - 40, r: 85},
    {x: cx + 50, y: cy - 45, r: 85},
    {x: cx + 125, y: cy + 15, r: 70},
    {x: cx + 60, y: cy + 60, r: 75},
    {x: cx - 55, y: cy + 62, r: 75},
    {x: cx, y: cy + 10, r: 90},
  ];
  return (
    <Svg>
      <g transform={`translate(${cx} ${cy + by}) scale(${0.9 * s}) translate(${-cx} ${-cy})`}>
        <circle cx={cx + 110} cy={cy + 165} r={20} fill="#fff" stroke={INK} strokeWidth={6} />
        <circle cx={cx + 125} cy={cy + 225} r={12} fill="#fff" stroke={INK} strokeWidth={5} />
        <PuffCluster puffs={puffs} fill="#fff" ink={7} />
        {/* the dream: the Titanic on little waves */}
        <path d={`M ${cx - 150} ${cy + 55} q 25 -14 50 0 t 50 0 t 50 0 t 50 0 t 50 0 t 50 0`} fill="none" stroke="#3E7BC4" strokeWidth={8} strokeLinecap="round" />
        <TitanicIcon x={cx} y={cy + 30} w={230} bob={2.5 * Math.sin(2 * Math.PI * 0.8 * t)} />
      </g>
    </Svg>
  );
};

const Railing: React.FC = () => (
  <Svg>
    {Array.from({length: 14}).map((_, i) => {
      const x = -300 + i * 140;
      return <rect key={i} x={x - 9} y={RAIL_TOP - 8} width={18} height={DECK_TOP - RAIL_TOP + 14} fill="#E9ECEF" stroke={INK} strokeWidth={5} />;
    })}
    {[RAIL_TOP, RAIL_TOP + 62].map((y) => (
      <rect key={y} x={-400} y={y - 9} width={2100} height={18} rx={9} fill="#F4F4F2" stroke={INK} strokeWidth={5} />
    ))}
  </Svg>
);
const DeckFloor: React.FC = () => (
  <Svg>
    <rect x={-400} y={DECK_TOP} width={2100} height={1600} fill="#7D8796" />
    {Array.from({length: 9}).map((_, i) => (
      <line key={i} x1={-400} x2={1700} y1={DECK_TOP + 40 + i * 70 + i * i * 6} y2={DECK_TOP + 40 + i * 70 + i * i * 6} stroke="#6E7887" strokeWidth={5} />
    ))}
    <rect x={-400} y={DECK_TOP - 6} width={2100} height={22} fill="#A7B0BC" stroke={INK} strokeWidth={6} />
  </Svg>
);
const Stars: React.FC<{t: number}> = ({t}) => (
  <Svg>
    {Array.from({length: 7}).map((_, i) => {
      const x = 80 + rnd(i * 3.1) * 1000;
      const y = 500 + rnd(i * 7.7) * 520;
      const r = (3 + 3 * rnd(i)) * (0.6 + 0.4 * Math.abs(Math.sin(2.3 * t + i)));
      return <path key={i} d={star(x, y, r)} fill="#FFF6C8" />;
    })}
  </Svg>
);

const deckKeys = (): CamKey[] => [
  {t: 0, x: 560, y: 1290, k: 1.12},
  {t: 5.5, x: 556, y: 1300, k: 1.16},
  {t: 6.35, x: 455, y: 1395, k: 1.5},
  {t: C_DIVE, x: 452, y: 1398, k: 1.52},
  {t: C_DECK2 - 0.001, x: 452, y: 1398, k: 1.52, ease: 'cut'},
  {t: C_DECK2, x: 470, y: 1430, k: 1.45, ease: 'cut'},
  {t: C_REPLAY, x: 462, y: 1425, k: 1.5},
  {t: C_END - 0.001, x: 462, y: 1425, k: 1.5, ease: 'cut'},
  {t: C_END, x: 560, y: 1300, k: 1.14, ease: 'cut'},
  {t: 24, x: 560, y: 1290, k: 1.19},
];
const DECK_KEYS = deckKeys();

export const DeckScene: React.FC<{t: number; cam?: Cam; cover?: boolean}> = ({t, cam: camIn, cover}) => {
  const c = camIn ?? camAt(t, DECK_KEYS);
  const hit = (t0: number, a: number, d = 8) => (t >= t0 ? a * Math.exp(-d * (t - t0)) : 0);
  const amp = hit(T.secret, 5) + hit(T.titanic2, 4) + hit(T.true, 7);
  const sh = shake(t, amp);
  const cam = {x: c.x + sh.x / c.k, y: c.y + sh.y / c.k, k: c.k};
  const h = hunter(t);
  const o0 = officer(t);
  const o = cover ? {...o0, vis: false} : o0;
  const fp = folderPos(t);
  const plateW = SPR.night.w * PS;
  const plateH = SPR.night.h * PS;
  const cols = SPR.night.cols;
  const bookCover = (S('book') as unknown as {cover: number[]}).cover;
  const proudCover = (S('proud') as unknown as {cover: number[]}).cover;
  // the folder corner that peeks out of the TITANIC book, then gets tucked in
  const peek = t >= T.titanic2 && t < C_DIVE ? 1 - easeInOutCubic(prog(t, 6.25, 6.6)) : 0;
  const trueStamp = stampAt(t, T.true);
  const glow = t >= C_END ? 0.5 + 0.5 * Math.sin(2 * Math.PI * 1.6 * (t - C_END)) : 0;
  return (
    <AbsoluteFill style={{background: cols.sky}}>
      <World cam={cam}>
        <div style={{position: 'absolute', left: -3000, top: -3000, width: 7000, height: PL_Y + 3002, background: cols.sky}} />
        <div style={{position: 'absolute', left: -3000, top: PL_Y + plateH - 2, width: 7000, height: 3000, background: cols.seaLow}} />
        <div style={{position: 'absolute', left: -3000, top: PL_Y, width: 3000 + PL_X + 2, height: plateH, background: 'linear-gradient(#162651, #25438a 54%, #164d90 56%, #123970)'}} />
        <div style={{position: 'absolute', left: PL_X + plateW - 2, top: PL_Y, width: 3000, height: plateH, background: 'linear-gradient(#162651, #25438a 54%, #164d90 56%, #123970)'}} />
        <Img src={F('night')} style={{position: 'absolute', left: PL_X, top: PL_Y, width: plateW, height: plateH}} />
        <Stars t={t} />
        <Railing />
        <DeckFloor />
        {o.vis ? <Shadow x={o.x} y={FEET} w={240} /> : null}
        {h.vis ? <Shadow x={h.x} y={FEET} w={250} /> : null}
        <Guy g={o} />
        <Guy g={h}>
          {h.pose === 'book' ? (
            <g>
              {peek > 0.001 ? (
                // the TOP SECRET folder sticking out of the top of the book
                <g transform={`translate(${(bookCover[0] + bookCover[2]) / 2 + 18} ${bookCover[1] + 14 + 70 * (1 - peek)})`}>
                  <clipPath id="tc-peek">
                    <rect x={-120} y={-200} width={240} height={200 - 14} />
                  </clipPath>
                  <g clipPath="url(#tc-peek)">
                    <rect x={-52} y={-64} width={104} height={80} fill={MANILA} stroke={INK} strokeWidth={6} />
                    <text x={0} y={-30} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={22} fill={RED} transform="rotate(-8)">
                      SECRET
                    </text>
                  </g>
                </g>
              ) : null}
              <text x={(bookCover[0] + bookCover[2]) / 2 + 22} y={bookCover[1] + 62} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={29} letterSpacing={-1} fill="#F2C230" stroke="#3a0d0b" strokeWidth={3.5} paintOrder="stroke">
                TITANIC
              </text>
              <TitanicIcon x={(bookCover[0] + bookCover[2]) / 2 + 22} y={bookCover[1] + 112} w={84} />
            </g>
          ) : null}
          {h.pose === 'proud' ? (
            <g>
              {glow > 0 ? <rect x={proudCover[0] + 30} y={proudCover[1] + 10} width={proudCover[2] - proudCover[0] - 40} height={proudCover[3] - proudCover[1] - 30} rx={10} fill="#FFE9A0" opacity={0.18 * glow} /> : null}
              <text x={(proudCover[0] + proudCover[2]) / 2 + 16} y={proudCover[1] + 72} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={30} fill="#F2C230" stroke="#3a0d0b" strokeWidth={3.5} paintOrder="stroke">
                TITANIC
              </text>
              <TitanicIcon x={(proudCover[0] + proudCover[2]) / 2 + 16} y={proudCover[1] + 140} w={100} />
            </g>
          ) : null}
        </Guy>
        <Svg>
          {fp ? <Folder x={fp[0]} y={fp[1]} rot={fp[2]} stamp={stampAt(t, T.secret)} /> : null}
          {fp && cover ? <Trefoil x={fp[0] + 52} y={fp[1] - 104} r={28} rot={12} /> : null}
          {/* the green TRUE stamp on the book at the end */}
          {h.vis && h.pose === 'proud' && trueStamp > 0
            ? (() => {
                const [bx, by] = ptOf('proud', [(proudCover[0] + proudCover[2]) / 2 + 16, (proudCover[1] + proudCover[3]) / 2], h.x, h.y, h.sx, h.sy);
                return (
                  <g transform={`translate(${bx} ${by}) rotate(-14) scale(${trueStamp})`}>
                    <rect x={-104} y={-40} width={208} height={80} rx={10} fill="rgba(255,255,255,0.15)" stroke={GRN} strokeWidth={10} />
                    <text x={0} y={22} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={64} fill={GRN}>
                      TRUE
                    </text>
                  </g>
                );
              })()
            : null}
          {/* sweat on the officer at the end */}
          {o.vis && o.pose === 'facepalm' ? <SweatDrop x={OX + 70} y={FEET - 470 + 30 * prog(t, T.true + 0.1, T.true + 0.8)} r={18} s={pop(t, T.true + 0.1, 0.2)} /> : null}
          {/* sweat + gulp on the worried hunter */}
          {h.vis && h.pose === 'worried' ? <SweatDrop x={HX + 92} y={FEET - 405 + 26 * prog(t, T.left, T.left + 0.7)} r={17} s={pop(t, T.left - 0.05, 0.2)} /> : null}
          {/* whistle notes */}
          {t > 7.05 && t < C_DIVE
            ? [0, 1, 2].map((i) => {
                const t0 = 7.1 + i * 0.3;
                if (t < t0) return null;
                const u = prog(t, t0, t0 + 0.9);
                const x = HX + 120 + 60 * u + 12 * Math.sin(8 * u + i);
                const y = FEET - 380 - 200 * u;
                const a = 1 - easeInCubic(u);
                return (
                  <g key={i} transform={`translate(${x} ${y}) scale(${0.6 + 0.5 * a})`} opacity={a > 0 ? 1 : 0}>
                    <ellipse cx={0} cy={0} rx={13} ry={10} fill={INK} transform="rotate(-20)" />
                    <line x1={11} y1={-3} x2={11} y2={-46} stroke={INK} strokeWidth={6} />
                    <path d="M 11 -46 q 16 6 14 22" fill="none" stroke={INK} strokeWidth={6} />
                  </g>
                );
              })
            : null}
        </Svg>
        <ThoughtBubble t={t} force={cover} />
        {!cover ? <LightBulb t={t} h={h} /> : null}
      </World>
    </AbsoluteFill>
  );
};

const LightBulb: React.FC<{t: number; h: GuyState}> = ({t, h}) => {
  if (!h.vis || h.pose !== 'idea') return null;
  const s = pop(t, T.luckily + 0.05, 0.3);
  if (s <= 0) return null;
  const tip = (S('idea') as unknown as {tip: [number, number]}).tip;
  const [tx, ty] = ptOf('idea', tip, h.x, h.y, h.sx, h.sy);
  const x = tx + 6;
  const y = ty - 120;
  const rays = 0.5 + 0.5 * Math.sin(2 * Math.PI * 3 * (t - T.luckily));
  return (
    <Svg>
      <g transform={`translate(${x} ${y}) scale(${s})`}>
        {Array.from({length: 8}).map((_, i) => {
          const a = (i / 8) * 2 * Math.PI - Math.PI / 2;
          const r0 = 74 + 6 * rays;
          const r1 = 104 + 10 * rays;
          return <line key={i} x1={Math.cos(a) * r0} y1={Math.sin(a) * r0 - 8} x2={Math.cos(a) * r1} y2={Math.sin(a) * r1 - 8} stroke={YEL} strokeWidth={10} strokeLinecap="round" />;
        })}
        <path d="M -42 -8 A 48 48 0 1 1 42 -8 Q 30 18 26 44 L -26 44 Q -30 18 -42 -8 Z" fill="#FFF07A" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        <path d="M -16 -20 q 8 -14 20 -12" fill="none" stroke="#fff" strokeWidth={8} strokeLinecap="round" />
        <rect x={-26} y={44} width={52} height={30} rx={6} fill="#A9AFB7" stroke={INK} strokeWidth={6} />
        <line x1={-24} y1={56} x2={24} y2={56} stroke={INK} strokeWidth={4} />
        <path d="M -12 74 L 12 74 L 6 86 L -6 86 Z" fill="#6E747C" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      </g>
    </Svg>
  );
};

// ---------- deck overlays (screen space) ----------
// the open TOP SECRET dossier: two sunken nuclear subs
const Dossier: React.FC<{t: number}> = ({t}) => {
  if (t < T.check - 0.05 || t >= T.titanic2) return null;
  const open = easeOutCubic(prog(t, T.check - 0.05, T.check + 0.3));
  const close = easeInCubic(prog(t, T.so - 0.04, T.so + 0.24));
  const s = (0.25 + 0.75 * open) * (1 - 0.8 * close);
  const a = 1 - close;
  if (a <= 0.01) return null;
  const cx = 540;
  const cy = 520;
  const W = 900;
  const H = 560;
  const shk = t > T.submarines && t < T.submarines + 0.5 ? 6 * Math.sin(2 * Math.PI * 14 * t) * (1 - prog(t, T.submarines, T.submarines + 0.5)) : 0;
  const photo = (i: number, t0: number, name: string) => {
    const ps = pop(t, t0, 0.25);
    if (ps <= 0) return null;
    const px = i === 0 ? -W / 4 : W / 4;
    return (
      <g transform={`translate(${px + (i ? -shk : shk)} ${-20}) rotate(${i ? 3 : -3}) scale(${ps})`}>
        <rect x={-190} y={-150} width={380} height={300} fill="#fff" stroke={INK} strokeWidth={6} />
        <rect x={-170} y={-130} width={340} height={210} fill="#9DB4C8" stroke={INK} strokeWidth={4} />
        <rect x={-170} y={20} width={340} height={60} fill="#7590A8" />
        <SubIcon x={0} y={-10} w={250} />
        <text x={0} y={128} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={34} fill={INK}>
          {name}
        </text>
        <Trefoil x={130} y={-100} r={44} s={pop(t, T.nuclear + 0.06 * i, 0.25)} rot={10 * Math.sin(3 * t + i)} />
      </g>
    );
  };
  return (
    <Screen>
      <g transform={`translate(${cx} ${cy}) scale(${s})`} opacity={a}>
        <rect x={-W / 2 - 18} y={-H / 2 - 18} width={W + 36} height={H + 36} rx={18} fill={MANILA_SH} stroke={INK} strokeWidth={8} />
        <rect x={-W / 2} y={-H / 2} width={W / 2 - 6} height={H} rx={8} fill={PAPER} stroke={INK} strokeWidth={6} />
        <rect x={6} y={-H / 2} width={W / 2 - 6} height={H} rx={8} fill={PAPER} stroke={INK} strokeWidth={6} />
        {photo(0, T.two, 'THRESHER')}
        {photo(1, T.sunken, 'SCORPION')}
        <g transform={`translate(0 ${-H / 2 - 4}) rotate(-6) scale(${stampAt(t, T.check + 0.12)})`}>
          <rect x={-210} y={-44} width={420} height={88} rx={10} fill="rgba(255,255,255,0.9)" stroke={RED} strokeWidth={9} />
          <text x={0} y={22} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={62} fill={RED}>
            TOP SECRET
          </text>
        </g>
      </g>
    </Screen>
  );
};
const CoverCaption: React.FC<{t: number}> = ({t}) => {
  const s = popOut(t, T.cover - 0.06, C_DIVE - 0.08, 0.28);
  if (s <= 0 || t >= C_DIVE) return null;
  return (
    <Screen>
      <g transform={`translate(560 560) rotate(-4) scale(${s})`}>
        <text x={0} y={0} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={112} fill={YEL} stroke={INK} strokeWidth={26} paintOrder="stroke" strokeLinejoin="round">
          COVER STORY
        </text>
        <path d="M 150 60 Q 200 420 -60 600" fill="none" stroke={INK} strokeWidth={28} strokeLinecap="round" />
        <path d="M 150 60 Q 200 420 -60 600" fill="none" stroke={YEL} strokeWidth={13} strokeLinecap="round" />
        <path d="M -30 535 L -66 604 L 10 616" fill="none" stroke={INK} strokeWidth={28} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M -30 535 L -66 604 L 10 616" fill="none" stroke={YEL} strokeWidth={13} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </Screen>
  );
};
const FLASHES: [number, number, number][] = [
  [T.becomes, 70, 520],
  [T.cover + 0.05, 1010, 640],
  [T.story + 0.05, 120, 900],
  [T.comes + 0.04, 1000, 520],
  [T.true + 0.12, 80, 700],
];
const PressFlashes: React.FC<{t: number}> = ({t}) => {
  const items = FLASHES.filter(([t0]) => t >= t0 - 0.02 && t < t0 + 0.4);
  // full-frame white only on every other flash (never 3 flashes within one second), soft level
  const white = FLASHES.reduce((acc, [t0], i) => acc + (i !== 1 && t >= t0 && t < t0 + 0.18 ? 0.22 * (1 - prog(t, t0, t0 + 0.18)) : 0), 0);
  return (
    <>
      <Screen>
        {items.map(([t0, x, y]) => {
          const u = prog(t, t0, t0 + 0.4);
          const r = 30 + 40 * easeOutCubic(u);
          return (
            <g key={t0} opacity={1 - u}>
              {Array.from({length: 10}).map((_, i) => {
                const a = (i / 10) * 2 * Math.PI;
                return <line key={i} x1={x + Math.cos(a) * r * 0.5} y1={y + Math.sin(a) * r * 0.5} x2={x + Math.cos(a) * r * 1.6} y2={y + Math.sin(a) * r * 1.6} stroke="#fff" strokeWidth={10} strokeLinecap="round" />;
              })}
              <circle cx={x} cy={y} r={r * 0.55} fill="#fff" />
            </g>
          );
        })}
      </Screen>
      {white > 0.005 ? <AbsoluteFill style={{background: '#fff', opacity: clamp(white)}} /> : null}
    </>
  );
};
const Calendar: React.FC<{t: number}> = ({t}) => {
  if (t < C_DECK2 || t >= C_REPLAY) return null;
  const s = popOut(t, T.twelve - 0.04, T.luckily - 0.12, 0.25);
  if (s <= 0) return null;
  return (
    <Screen>
      <g transform={`translate(790 520) rotate(5) scale(${s})`}>
        <rect x={-210} y={-170} width={420} height={340} rx={22} fill="#fff" stroke={INK} strokeWidth={12} />
        <path d="M -204 -164 L 204 -164 L 204 -62 L -204 -62 Z" fill={RED} />
        <rect x={-210} y={-170} width={420} height={340} rx={22} fill="none" stroke={INK} strokeWidth={12} />
        {[-110, 0, 110].map((x) => (
          <rect key={x} x={x - 12} y={-200} width={24} height={64} rx={10} fill="#C8CDD3" stroke={INK} strokeWidth={6} />
        ))}
        <text x={0} y={-96} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={54} fill="#fff">
          DAYS LEFT
        </text>
        <text x={0} y={112} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={190} fill={INK}>
          12
        </text>
      </g>
    </Screen>
  );
};

// ======================================================================================================
// SCENE 2 / 7 - UNDER THE SEA (world: surface y = 0, sea floor y = FLOOR)
// ======================================================================================================
const FLOOR = 2600;
const SHIP_S = 0.75;
const SHIP_X = 60;
const shipY = -SPR.ship.redTop * SHIP_S; // sprite top so that the red bottom part sits under the waterline
const AFRAME: [number, number] = [SHIP_X + (SPR.ship.aframe[2] - 30) * SHIP_S, shipY + (SPR.ship.aframe[1] + 22) * SHIP_S];
const CABLE_X = SHIP_X + SPR.ship.w * SHIP_S + 40;
const SLED_S = 0.5;
const sledTopY = (t: number) => {
  if (t < 8.42) return -260 + 6 * Math.sin(2 * Math.PI * 1.2 * t);
  if (t < 8.62) return -260 + 330 * easeInCubic(prog(t, 8.42, 8.62));
  return 70 + (FLOOR - 300 - 70) * easeInOutCubic(prog(t, 8.62, 9.3));
};
// the wreck of the sub on the floor: three hull pieces + the trail of bits (also used by the replay)
const PIECE_S = 0.9;
const LAY = SPR.subLayout as unknown as Record<string, [number, number, number, number]>;
const BITS = ['bit0', 'bit1', 'bit2', 'bit3', 'bit4', 'bit5', 'bit6', 'bit7', 'bit8'];
const REST: Record<string, [number, number, number]> = {
  subA: [210, FLOOR + 12, -7],
  subB: [780, FLOOR + 14, 4],
  subC: [1410, FLOOR + 10, 9],
};
// trail of bits (x on the floor) - the current carried them far: a long chain over a mile
const BIT_X = [1900, 2350, 2700, 3150, 3500, 3950, 4400, 4900, 5450];
const EXTRA = Array.from({length: 24}).map((_, i) => ({x: 1700 + i * 168 + 70 * rnd(i * 5.3), r: 22 + 16 * rnd(i * 2.1), rot: 360 * rnd(i * 9.1)}));

const SledEyes: React.FC<{open: number; look?: [number, number]; wide?: number; brow?: number}> = ({open, look = [0, 0], wide = 1, brow = 0}) => {
  const lens = (SPR.sled as unknown as {lens: [number, number, number][]}).lens;
  return (
    <g>
      {lens.map(([cx, cy, r], i) => {
        const lid = 1 - open;
        return (
          <g key={i}>
            <clipPath id={`tc-lens-${i}`}>
              <circle cx={cx} cy={cy} r={r * 1.02} />
            </clipPath>
            <g clipPath={`url(#tc-lens-${i})`}>
              <circle cx={cx + look[0] * r * 0.25 + r * 0.32} cy={cy + look[1] * r * 0.25 - r * 0.35} r={r * 0.26 * wide} fill="#fff" />
              <circle cx={cx + look[0] * r * 0.25 - r * 0.25} cy={cy + look[1] * r * 0.25 + r * 0.25} r={r * 0.1 * wide} fill="#fff" opacity={0.8} />
              {lid > 0.001 ? <rect x={cx - r * 1.2} y={cy - r * 1.1} width={r * 2.4} height={r * 2.2 * lid} fill="#FFC72C" stroke={INK} strokeWidth={6} /> : null}
            </g>
            {brow > 0.001 ? (
              <path
                d={`M ${cx - r * 0.9} ${cy - r * 1.55 - brow * 14} Q ${cx} ${cy - r * 1.95 - brow * 24} ${cx + r * 0.9} ${cy - r * 1.55 - brow * 14}`}
                fill="none"
                stroke={INK}
                strokeWidth={16}
                strokeLinecap="round"
                opacity={brow}
              />
            ) : null}
          </g>
        );
      })}
    </g>
  );
};
const MarineSnow: React.FC<{t: number; x0: number; y0: number; w: number; h: number; n?: number; seed?: number}> = ({t, x0, y0, w, h, n = 40, seed = 0}) => (
  <Svg>
    {Array.from({length: n}).map((_, i) => {
      const x = x0 + ((rnd(i * 3.3 + seed) * w + 14 * Math.sin(0.7 * t + i)) % w);
      const y = y0 + ((rnd(i * 5.7 + seed) * h + 40 * t) % h);
      return <circle key={i} cx={x} cy={y} r={2.5 + 3 * rnd(i * 1.7 + seed)} fill="#C8D6E8" opacity={0.35 + 0.3 * rnd(i)} />;
    })}
  </Svg>
);
const Wreck: React.FC<{lamp?: boolean; trefoil?: number}> = ({trefoil = 1}) => (
  <>
    {Object.entries(REST).map(([n, [x, y, rot]]) => (
      <Spr key={n} n={n} x={x} y={y} s={PIECE_S} rot={rot} />
    ))}
    <Svg>
      <Trefoil x={REST.subB[0] - 20} y={REST.subB[1] - 150} r={34} s={trefoil} />
    </Svg>
    {BITS.map((n, i) => (
      <Spr key={n} n={n} x={BIT_X[i]} y={FLOOR + 8} s={1.6} rot={((i * 37) % 30) - 15} />
    ))}
    <Svg>
      {EXTRA.map((e, i) => (
        <rect key={i} x={e.x - e.r} y={FLOOR - e.r * 0.6} width={e.r * 2} height={e.r * 1.2} fill="#6E7780" stroke={INK} strokeWidth={4} transform={`rotate(${e.rot % 40 - 20} ${e.x} ${FLOOR})`} />
      ))}
    </Svg>
  </>
);
const SeaFloor: React.FC<{dark?: boolean}> = ({dark}) => (
  <Svg>
    <path
      d={`M -3000 ${FLOOR + 30} ${Array.from({length: 60})
        .map((_, i) => `Q ${-3000 + i * 220 + 110} ${FLOOR - 10 - 30 * rnd(i * 1.9)} ${-3000 + (i + 1) * 220} ${FLOOR + 20 + 14 * rnd(i * 4.1)}`)
        .join(' ')} L 10300 ${FLOOR + 9000} L -3000 ${FLOOR + 9000} Z`}
      fill={dark ? '#3B4452' : '#6A7584'}
      stroke={INK}
      strokeWidth={8}
    />
    {Array.from({length: 40}).map((_, i) => (
      <ellipse key={i} cx={-2500 + i * 330 + 120 * rnd(i)} cy={FLOOR + 90 + 160 * rnd(i * 3.7)} rx={30 + 30 * rnd(i * 2.2)} ry={8 + 6 * rnd(i * 1.3)} fill={dark ? '#333B48' : '#5D6876'} />
    ))}
  </Svg>
);

// darkness with a lamp cone from the sled (world coords)
const Lamp: React.FC<{x: number; y: number; on: number; ang: number; spread?: number; len?: number; dark?: number; id: string}> = ({x, y, on, ang, spread = 0.55, len = 1500, dark = 0.86, id}) => {
  const a0 = (ang * Math.PI) / 180 - spread;
  const a1 = (ang * Math.PI) / 180 + spread;
  const p0 = [x + Math.cos(a0) * len, y + Math.sin(a0) * len];
  const p1 = [x + Math.cos(a1) * len, y + Math.sin(a1) * len];
  return (
    <Svg>
      <defs>
        <filter id={`${id}-blur`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={60} />
        </filter>
        <mask id={`${id}-mask`} maskUnits="userSpaceOnUse" x={-7000} y={-7000} width={14000} height={14000}>
          <rect x={-7000} y={-7000} width={14000} height={14000} fill="#fff" />
          {on > 0.001 ? (
            <g filter={`url(#${id}-blur)`} opacity={on}>
              <path d={`M ${x} ${y} L ${p0[0]} ${p0[1]} L ${p1[0]} ${p1[1]} Z`} fill="#000" />
              <circle cx={x} cy={y} r={180} fill="#000" />
            </g>
          ) : null}
        </mask>
      </defs>
      <rect x={-7000} y={-7000} width={14000} height={14000} fill="#02060f" opacity={dark} mask={`url(#${id}-mask)`} />
      {on > 0.001 ? <path d={`M ${x} ${y} L ${p0[0]} ${p0[1]} L ${p1[0]} ${p1[1]} Z`} fill="#FFF3B0" opacity={0.08 * on} /> : null}
    </Svg>
  );
};

const DIVE_KEYS: CamKey[] = [
  {t: C_DIVE, x: 760, y: -60, k: 0.8},
  {t: 8.55, x: 800, y: 0, k: 0.8},
  {t: 9.3, x: 880, y: FLOOR - 190, k: 0.72},
  {t: 9.95, x: 860, y: FLOOR - 180, k: 0.76},
];
const DiveScene: React.FC<{t: number}> = ({t}) => {
  const c = camAt(t, DIVE_KEYS);
  const hit = (t0: number, a: number, d = 8) => (t >= t0 ? a * Math.exp(-d * (t - t0)) : 0);
  const sh = shake(t, hit(8.62, 6) + hit(9.3, 4));
  const cam = {x: c.x + sh.x / c.k, y: c.y + sh.y / c.k, k: c.k};
  const sy = sledTopY(t);
  const sledX = CABLE_X;
  const lampOn = easeOutCubic(prog(t, 9.22, 9.4));
  const eyes = pop(t, 9.35, 0.25);
  const splash = t > 8.6 && t < 9.2 ? prog(t, 8.6, 9.2) : 0;
  return (
    <AbsoluteFill style={{background: '#02060f'}}>
      <World cam={cam}>
        <div style={{position: 'absolute', left: -4000, top: -4000, width: 9000, height: 4000, background: NIGHT}} />
        <div style={{position: 'absolute', left: -4000, top: 0, width: 9000, height: FLOOR + 600, background: 'linear-gradient(#1E3A6E, #10244A 25%, #060D1C 60%, #03070f)'}} />
        <Stars t={t} />
        <SeaFloor dark />
        <Wreck trefoil={1 + 0.5 * Math.sin(Math.PI * prog(t, 9.38, 9.7))} />
        {/* the ship on the surface */}
        <Spr n="ship" x={SHIP_X} y={shipY} s={SHIP_S} ax={0} ay={0} />
        <Svg>
          {/* cable from the A-frame over the stern down to the sled */}
          <path d={`M ${AFRAME[0]} ${AFRAME[1]} L ${CABLE_X} ${-150} L ${CABLE_X} ${sy + 4}`} fill="none" stroke={INK} strokeWidth={9} strokeLinejoin="round" />
          <circle cx={CABLE_X} cy={-150} r={16} fill="#9AA1A8" stroke={INK} strokeWidth={6} />
          {/* front water over the submerged hull */}
          <rect x={-4000} y={0} width={9000} height={240} fill="#1E3A6E" opacity={0.62} />
          <path d={`M -4000 0 ${Array.from({length: 40}).map((_, i) => `q 110 ${i % 2 ? 16 : -16} 220 0`).join(' ')}`} fill="none" stroke="#5B8FD0" strokeWidth={8} />
          {splash > 0
            ? Array.from({length: 7}).map((_, i) => {
                const a = -Math.PI / 2 + (i - 3) * 0.32;
                const d = 40 + 230 * easeOutCubic(splash);
                return <circle key={i} cx={CABLE_X + Math.cos(a) * d} cy={-10 + Math.sin(a) * d + 320 * splash * splash} r={16 * (1 - splash)} fill="#BFE0FF" stroke={INK} strokeWidth={4} />;
              })
            : null}
          {/* bubbles from the diving sled */}
          {t > 8.62 && t < 9.95
            ? Array.from({length: 10}).map((_, i) => {
                const t0 = 8.62 + i * 0.07;
                if (t < t0) return null;
                const u = prog(t, t0, t0 + 0.8);
                const by = sledTopY(t0) - 40 - 300 * u;
                return <circle key={i} cx={sledX - 60 + 120 * rnd(i) + 20 * Math.sin(10 * u + i)} cy={by} r={(8 + 8 * rnd(i * 2)) * (1 - u)} fill="none" stroke="#A9D2FF" strokeWidth={4} opacity={1 - u} />;
              })
            : null}
        </Svg>
        <MarineSnow t={t} x0={-200} y0={600} w={2600} h={2000} n={50} />
        <Lamp x={sledX - 110} y={sy + 165} on={lampOn} ang={174} spread={0.5} len={1800} dark={0.84 * easeInOutCubic(prog(t, 8.7, 9.15)) * (1 - 0.18 * lampOn)} id="tc-dive" />
        <Spr n="sled" x={sledX} y={sy} s={SLED_S} ax={(SPR.sled as unknown as {top: [number, number]}).top[0]} ay={0} rot={t > 8.62 ? 3 * Math.sin(2 * Math.PI * 1.1 * t) : 0}>
          <SledEyes open={eyes} look={[-0.8, 0.6]} />
        </Spr>
      </World>
    </AbsoluteFill>
  );
};

// ======================================================================================================
// SCENE 4 - THE REPLAY (diagram look): the sub sinks, breaks, heavy pieces drop, light bits ride the current
// ======================================================================================================
const BREAK = T.taught;
const SUB0: [number, number] = [400, 1350]; // where the intact sub (its sheet origin) starts
const subAt = (n: 'subA' | 'subB' | 'subC', t: number): [number, number, number] => {
  const L = LAY[n];
  const sp = S(n);
  // sheet position of the piece's feet anchor (closing the gaps between the pieces when intact)
  const close = n === 'subB' ? -20 : n === 'subC' ? -52 : 0;
  const fx = SUB0[0] + (L[0] + 2 - 8 + sp.feet[0] + close) * PIECE_S;
  const fy = SUB0[1] + (L[1] + 2 - 8 + sp.feet[1]) * PIECE_S;
  const sink = 160 * prog(t, C_REPLAY, BREAK);
  const [rx, ry, rr] = REST[n];
  if (t < BREAK) return [fx, fy + sink, 3];
  const delays = {subA: 0, subB: 0.05, subC: 0.02};
  const dur = {subA: 0.72, subB: 0.78, subC: 0.7};
  const u = prog(t, BREAK + delays[n], BREAK + delays[n] + dur[n]);
  const e = easeInCubic(u);
  return [lerp(fx, rx, easeInOutCubic(u)), lerp(fy + sink, ry, e), lerp(3, rr, easeOutCubic(u))];
};
const landT = (n: string) => BREAK + ({subA: 0.72, subB: 0.83, subC: 0.72} as Record<string, number>)[n];
const BIT_LAND = BIT_X.map((_, i) => 13.75 + i * 0.16);
const bitAt = (i: number, t: number): [number, number, number] | null => {
  if (t < BREAK) return null;
  const x0 = 1000 + 90 * (i % 5);
  const y0 = 1590 + 30 * ((i * 7) % 3);
  const u = prog(t, BREAK + 0.05, BIT_LAND[i]);
  const x = lerp(x0, BIT_X[i], Math.pow(u, 0.85));
  const y = lerp(y0, FLOOR + 8, u) + 26 * Math.sin(5 * u + i) * (1 - u);
  return [x, y, (i % 2 ? 1 : -1) * 300 * u];
};
const REPLAY_KEYS: CamKey[] = [
  {t: C_REPLAY, x: 930, y: 1640, k: 0.62},
  {t: BREAK, x: 940, y: 1700, k: 0.62},
  {t: 13.55, x: 1180, y: 2150, k: 0.5},
  {t: T.its, x: 1200, y: 2160, k: 0.5},
  {t: 15.0, x: 2930, y: 1090, k: 0.19, ease: 'io'},
  {t: C_MAP, x: 2940, y: 1110, k: 0.188},
];
const ReplayScene: React.FC<{t: number}> = ({t}) => {
  const c = camAt(t, REPLAY_KEYS);
  const hit = (t0: number, a: number, d = 8) => (t >= t0 ? a * Math.exp(-d * (t - t0)) : 0);
  const sh = shake(t, hit(BREAK, 7) + hit(landT('subA'), 5) + hit(landT('subB'), 6));
  const cam = {x: c.x + sh.x / c.k, y: c.y + sh.y / c.k, k: c.k};
  const pieces: ('subA' | 'subB' | 'subC')[] = ['subA', 'subB', 'subC'];
  const crack = t > BREAK - 0.02 && t < BREAK + 0.25 ? 1 - prog(t, BREAK, BREAK + 0.25) : 0;
  const bracket = easeOutCubic(prog(t, T.mile - 0.1, T.mile + 0.45));
  return (
    <AbsoluteFill style={{background: '#1B3F6E'}}>
      <World cam={cam}>
        <div style={{position: 'absolute', left: -9000, top: -9000, width: 24000, height: 9000 - 1500, background: '#3567A3'}} />
        <div style={{position: 'absolute', left: -9000, top: -1502, width: 24000, height: FLOOR + 1702, background: 'linear-gradient(#3567A3 0%, #2A5288 40%, #1B3F6E 80%)'}} />
        <SeaFloor />
        {/* current arrows: the sea pushes everything light to the right */}
        <Svg>
          {t > BREAK + 0.1
            ? Array.from({length: 6}).map((_, i) => {
                const a = clamp(prog(t, BREAK + 0.1 + i * 0.08, BREAK + 0.4 + i * 0.08)) * (1 - prog(t, 15.4, 15.9));
                if (a <= 0.01) return null;
                const y = 1500 + i * 150;
                const x = 900 + ((i * 410 + (t - BREAK) * 900) % 3600);
                return (
                  <g key={i} opacity={0.75 * a} transform={`translate(${x} ${y})`}>
                    <path d="M -180 0 q 45 -30 90 0 t 90 0" fill="none" stroke="#DDF0FF" strokeWidth={16} strokeLinecap="round" />
                    <path d="M -10 -24 L 30 0 L -10 24" fill="none" stroke="#DDF0FF" strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" />
                  </g>
                );
              })
            : null}
        </Svg>
        {/* extra small debris along the trail (lands with the bits) */}
        <Svg>
          {EXTRA.map((e, i) => {
            const tl = 13.8 + (i / EXTRA.length) * 1.3;
            if (t < tl - 0.6) return null;
            const u = prog(t, tl - 0.6, tl);
            const y = lerp(FLOOR - 500, FLOOR, u);
            return (
              <rect
                key={i}
                x={e.x - e.r}
                y={y - e.r * 0.6}
                width={e.r * 2}
                height={e.r * 1.2}
                fill="#7C858F"
                stroke={INK}
                strokeWidth={4}
                opacity={u > 0 ? 1 : 0}
                transform={`rotate(${(e.rot % 40) - 20 + 200 * (1 - u)} ${e.x} ${y})`}
              />
            );
          })}
        </Svg>
        {BITS.map((n, i) => {
          const b = bitAt(i, t);
          if (!b) return null;
          return <Spr key={n} n={n} x={b[0]} y={b[1]} s={1.6} rot={b[2]} />;
        })}
        {pieces.map((n) => {
          const [x, y, r] = subAt(n, t);
          return <Spr key={n} n={n} x={x} y={y} s={PIECE_S} rot={r} />;
        })}
        <Svg>
          {t < BREAK + 0.6 ? <Trefoil x={subAt('subB', t)[0] - 20} y={subAt('subB', t)[1] - 150} r={34} /> : <Trefoil x={REST.subB[0] - 20} y={REST.subB[1] - 150} r={34} />}
          {/* the crack flash */}
          {crack > 0
            ? [subAt('subA', t), subAt('subC', t)].map(([x, y], i) => (
                <path key={i} d={star(x + (i ? -230 : 200), y - 120, 26 * crack + 8)} fill="#FFF7C2" stroke={INK} strokeWidth={5} />
              ))
            : null}
          {/* mud puffs where the heavy pieces land */}
          {pieces.map((n) => {
            const tl = landT(n);
            if (t < tl || t > tl + 0.8) return null;
            const u = prog(t, tl, tl + 0.8);
            const [x] = REST[n];
            return (
              <PuffCluster
                key={n}
                puffs={[-1, 0, 1].map((k) => ({x: x + k * 110 * (0.6 + u), y: FLOOR - 30 - 70 * u, r: 70 * Math.sin(Math.PI * u) * (0.8 + 0.3 * rnd(k + 2))}))}
                fill="#8E99A6"
                ink={6}
              />
            );
          })}
          {/* the MILE+ bracket over the trail */}
          {bracket > 0.001 ? (
            <g>
              <line x1={100} y1={FLOOR - 520} x2={100 + (5700 - 100) * bracket} y2={FLOOR - 520} stroke={INK} strokeWidth={56} strokeLinecap="round" />
              <line x1={100} y1={FLOOR - 520} x2={100 + (5700 - 100) * bracket} y2={FLOOR - 520} stroke={YEL} strokeWidth={28} strokeLinecap="round" />
              <line x1={100} y1={FLOOR - 640} x2={100} y2={FLOOR - 400} stroke={INK} strokeWidth={56} strokeLinecap="round" />
              <line x1={100} y1={FLOOR - 640} x2={100} y2={FLOOR - 400} stroke={YEL} strokeWidth={28} strokeLinecap="round" />
              {bracket > 0.98 ? (
                <>
                  <line x1={5700} y1={FLOOR - 640} x2={5700} y2={FLOOR - 400} stroke={INK} strokeWidth={56} strokeLinecap="round" />
                  <line x1={5700} y1={FLOOR - 640} x2={5700} y2={FLOOR - 400} stroke={YEL} strokeWidth={28} strokeLinecap="round" />
                </>
              ) : null}
            </g>
          ) : null}
        </Svg>
      </World>
      <MileLabel t={t} cam={cam} />
      <ReplayTag t={t} />
    </AbsoluteFill>
  );
};
const MileLabel: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const s = pop(t, T.mile + 0.25, 0.3);
  if (s <= 0) return null;
  const x = 540 + (2900 - cam.x) * cam.k;
  const y = 960 + (FLOOR - 520 - cam.y) * cam.k - 110;
  return (
    <Screen>
      <Txt x={x} y={y - 30} size={150} s={s} text="1 MILE+" fill={YEL} sw={0.22} rot={-3} />
    </Screen>
  );
};
const ReplayTag: React.FC<{t: number}> = ({t}) => {
  const s = popOut(t, C_REPLAY, T.its, 0.2);
  if (s <= 0) return null;
  const blink = Math.floor((t - C_REPLAY) * 3) % 2 === 0;
  return (
    <Screen>
      <g transform={`translate(70 150) scale(${s})`}>
        <rect x={0} y={-50} width={380} height={100} rx={18} fill="rgba(0,0,0,0.55)" stroke="#fff" strokeWidth={5} />
        <path d="M 40 0 L 78 -26 L 78 26 Z M 78 0 L 116 -26 L 116 26 Z" fill="#fff" />
        <text x={140} y={18} fontFamily={FONT} fontWeight={900} fontSize={50} fill="#fff">
          REPLAY
        </text>
        {blink ? <circle cx={352} cy={-24} r={12} fill={RED} /> : null}
      </g>
    </Screen>
  );
};

// ======================================================================================================
// SCENE 5 - THE SEARCH CHART (top view): lines a mile apart catch the long trail, not the tiny ship
// ======================================================================================================
const LINES = [150, 345, 540, 735, 930];
const TRAIL: [number, number][] = [
  [440, 720],
  [700, 1330],
];
const SHIPDOT: [number, number] = [650, 1440];
const CROSS_Y = lerp(TRAIL[0][1], TRAIL[1][1], (540 - TRAIL[0][0]) / (TRAIL[1][0] - TRAIL[0][0]));
const sledOnMap = (t: number): [number, number] => {
  if (t < T.hunts) return [540, 300];
  if (t < T.trail2 + 0.05) return [540, lerp(300, CROSS_Y, easeInOutCubic(prog(t, T.hunts, T.trail2 + 0.05)))];
  if (t < T.ship + 0.1) return [540, CROSS_Y];
  // then it follows the trail toward the ship
  const u = easeInOutCubic(prog(t, T.ship + 0.1, C_ROOM));
  const fx = lerp(540, TRAIL[1][0] - 20, u);
  const fy = lerp(CROSS_Y, TRAIL[1][1] - 40, u);
  return [fx, fy];
};
const MapScene: React.FC<{t: number}> = ({t}) => {
  const z = 1 + 0.04 * prog(t, C_MAP, C_ROOM);
  const draw = easeInOutCubic(prog(t, C_MAP, C_MAP + 0.45));
  const glow = t > T.trail2 ? 0.5 + 0.5 * Math.sin(2 * Math.PI * 2.5 * (t - T.trail2)) : 0;
  const ping = t > T.trail2 + 0.05 && t < T.trail2 + 0.9 ? prog(t, T.trail2 + 0.05, T.trail2 + 0.9) : 0;
  const [sx, sy] = sledOnMap(t);
  const xs = pop(t, T.not + 0.05, 0.25);
  const dots = 13;
  return (
    <AbsoluteFill style={{background: '#163E66'}}>
      <Screen style={{transform: `scale(${z})`, transformOrigin: '540px 960px'}}>
        {/* chart grid */}
        {Array.from({length: 13}).map((_, i) => (
          <line key={`h${i}`} x1={0} x2={1080} y1={i * 160} y2={i * 160} stroke="#245683" strokeWidth={3} />
        ))}
        {Array.from({length: 8}).map((_, i) => (
          <line key={`v${i}`} y1={0} y2={1920} x1={i * 160 - 40} x2={i * 160 - 40} stroke="#245683" strokeWidth={3} />
        ))}
        {/* compass */}
        <g transform="translate(930 180)">
          <circle r={62} fill="none" stroke="#9EC3E6" strokeWidth={5} />
          <path d="M 0 -78 L 16 0 L 0 -12 L -16 0 Z" fill="#fff" stroke={INK} strokeWidth={3} />
          <text x={0} y={46} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={34} fill="#9EC3E6">
            N
          </text>
        </g>
        {/* search lines, one mile apart */}
        {LINES.map((x, i) => (
          <line key={x} x1={x} x2={x} y1={240} y2={240 + 1500 * draw} stroke="#fff" strokeWidth={8} strokeDasharray="26 20" opacity={0.85} strokeDashoffset={-i * 9} />
        ))}
        {draw > 0.6 ? (
          <g opacity={prog(t, C_MAP + 0.3, C_MAP + 0.6)}>
            <line x1={LINES[0] + 10} x2={LINES[1] - 10} y1={320} y2={320} stroke={YEL} strokeWidth={8} />
            <path d={`M ${LINES[0] + 26} 304 L ${LINES[0] + 8} 320 L ${LINES[0] + 26} 336 M ${LINES[1] - 26} 304 L ${LINES[1] - 8} 320 L ${LINES[1] - 26} 336`} fill="none" stroke={YEL} strokeWidth={8} strokeLinecap="round" />
            <text x={(LINES[0] + LINES[1]) / 2} y={292} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={40} fill={YEL} stroke={INK} strokeWidth={8} paintOrder="stroke">
              1 MILE
            </text>
          </g>
        ) : null}
        {/* the debris trail: a long chain of bits */}
        {Array.from({length: dots}).map((_, i) => {
          const u = i / (dots - 1);
          const x = lerp(TRAIL[0][0], TRAIL[1][0], u) + 10 * Math.sin(i * 1.7);
          const y = lerp(TRAIL[0][1], TRAIL[1][1], u);
          return (
            <g key={i}>
              {glow > 0 ? <circle cx={x} cy={y} r={26} fill={YEL} opacity={0.35 * glow} /> : null}
              <rect x={x - 11} y={y - 8} width={22} height={16} rx={3} fill="#AEB6C0" stroke={INK} strokeWidth={4} transform={`rotate(${(i * 47) % 90} ${x} ${y})`} />
            </g>
          );
        })}
        {t > T.trail2 ? <Txt x={300} y={1080} size={50} s={pop(t, T.trail2, 0.25)} text="DEBRIS TRAIL" fill={YEL} sw={0.2} rot={-8} /> : null}
        {/* the tiny ship at the end of the trail (between two lines: a sweep would miss it) */}
        <g transform={`translate(${SHIPDOT[0]} ${SHIPDOT[1]})`}>
          <TitanicIcon x={0} y={0} w={120} />
          {xs > 0 ? (
            <g transform={`scale(${xs})`}>
              <path d="M -56 -64 L 56 40 M 56 -64 L -56 40" stroke={INK} strokeWidth={26} strokeLinecap="round" />
              <path d="M -56 -64 L 56 40 M 56 -64 L -56 40" stroke={RED} strokeWidth={14} strokeLinecap="round" />
            </g>
          ) : null}
        </g>
        {/* the sweep ping where the line crosses the trail */}
        {ping > 0 ? (
          <g>
            <circle cx={540} cy={CROSS_Y} r={30 + 220 * ping} fill="none" stroke={YEL} strokeWidth={10 * (1 - ping) + 2} opacity={1 - ping} />
            <circle cx={540} cy={CROSS_Y} r={20 + 120 * ping} fill="none" stroke="#fff" strokeWidth={6 * (1 - ping) + 1} opacity={1 - ping} />
          </g>
        ) : null}
        {/* the sled on the chart */}
        <g transform={`translate(${sx} ${sy})`}>
          <rect x={-30} y={-22} width={60} height={44} rx={8} fill="#FFC72C" stroke={INK} strokeWidth={6} />
          <circle cx={-12} cy={2} r={9} fill={INK} />
          <circle cx={12} cy={2} r={9} fill={INK} />
          <circle cx={-9} cy={-1} r={3} fill="#fff" />
          <circle cx={15} cy={-1} r={3} fill="#fff" />
        </g>
      </Screen>
    </AbsoluteFill>
  );
};

// ======================================================================================================
// SCENE 6 - THE CONTROL ROOM AT NIGHT: the monitor shows the live feed; a boiler slides onto the screen
// ======================================================================================================
const MON = {x: 470, y: 520, w: 560, h: 430}; // the screen area (inside the casing)
const roomHunter = (t: number): GuyState => {
  const b = breathe(t);
  if (t < 20.62) {
    const droop = 1 + 0.015 * Math.sin(2 * Math.PI * 0.5 * t);
    return {vis: true, pose: 'doze', x: 235, y: 1730, sx: 1.32, sy: 1.32 * b * droop};
  }
  const [sx, sy] = squashSwap(t, 20.66);
  const u = prog(t, 20.66, 21.2);
  const jump = 150 * Math.sin(Math.PI * u) + (t > 21.2 ? 30 * Math.abs(Math.sin(2 * Math.PI * 1.8 * (t - 21.2))) : 0);
  return {vis: true, pose: 'joy', x: 250, y: 1730 - jump, sx: 1.32 * sx, sy: 1.32 * sy};
};
const boilerX = (t: number) => {
  if (t < T.boiler) return MON.w + 360;
  return lerp(MON.w + 360, MON.w / 2, easeOutCubic(prog(t, T.boiler, T.screen + 0.1)));
};
const RoomScene: React.FC<{t: number}> = ({t}) => {
  const zoomIn = easeInCubic(prog(t, C_BOW - 0.32, C_BOW));
  const z = (1 + 0.04 * prog(t, C_ROOM, C_BOW - 0.32)) * (1 + 3.2 * zoomIn);
  const ox = MON.x + MON.w / 2;
  const oy = MON.y + MON.h / 2;
  const g = roomHunter(t);
  const alert = t > T.boiler + 0.05 && t < T.boiler + 0.75 ? (Math.floor((t - T.boiler) * 8) % 2 === 0 ? 1 : 0) : 0;
  const bx = boilerX(t);
  const scroll = (t - C_ROOM) * (t < T.screen ? 220 : 220 * Math.max(0, 1 - (t - T.screen) * 2));
  const zz = t < 20.62;
  const sweat = 0;
  void sweat;
  return (
    <AbsoluteFill style={{background: '#0E1630'}}>
      <AbsoluteFill style={{transform: `scale(${z})`, transformOrigin: `${ox}px ${oy}px`}}>
        {/* wall + porthole with the night sky */}
        <Screen>
          <rect x={0} y={0} width={1080} height={1920} fill="#1A2546" />
          <rect x={0} y={1420} width={1080} height={500} fill="#141C36" />
          <g transform="translate(200 360)">
            <circle r={130} fill="#9AA1A8" stroke={INK} strokeWidth={8} />
            <circle r={104} fill="#13234F" stroke={INK} strokeWidth={6} />
            <circle cx={-26} cy={-30} r={34} fill="#F6E7A6" stroke={INK} strokeWidth={4} />
            {[[40, -50], [60, 20], [-50, 50], [20, 60]].map(([x, y], i) => (
              <path key={i} d={star(x, y, 4 + 2 * Math.sin(3 * t + i))} fill="#FFF6C8" />
            ))}
            {Array.from({length: 8}).map((_, i) => {
              const a = (i / 8) * 2 * Math.PI;
              return <circle key={i} cx={Math.cos(a) * 117} cy={Math.sin(a) * 117} r={7} fill="#6E747C" stroke={INK} strokeWidth={3} />;
            })}
          </g>
          {/* desk */}
          <rect x={360} y={1060} width={760} height={60} rx={10} fill="#6B4A35" stroke={INK} strokeWidth={8} />
          <rect x={400} y={1120} width={40} height={420} fill="#5A3D2B" stroke={INK} strokeWidth={6} />
          <rect x={1000} y={1120} width={40} height={420} fill="#5A3D2B" stroke={INK} strokeWidth={6} />
          {/* the monitor */}
          <rect x={MON.x - 50} y={MON.y - 50} width={MON.w + 100} height={MON.h + 130} rx={36} fill="#D8CFB1" stroke={INK} strokeWidth={10} />
          <rect x={MON.x + MON.w / 2 - 80} y={MON.y + MON.h + 80} width={160} height={70} fill="#BFB696" stroke={INK} strokeWidth={8} />
          <rect x={MON.x + MON.w / 2 - 150} y={MON.y + MON.h + 140} width={300} height={40} rx={12} fill="#D8CFB1" stroke={INK} strokeWidth={8} />
          <circle cx={MON.x + MON.w - 10} cy={MON.y + MON.h + 40} r={12} fill={alert ? RED : '#7FD27F'} stroke={INK} strokeWidth={4} />
          {[0, 1, 2].map((i) => (
            <rect key={i} x={MON.x + 10 + i * 46} y={MON.y + MON.h + 30} width={30} height={20} rx={4} fill="#9C9479" stroke={INK} strokeWidth={4} />
          ))}
        </Screen>
        {/* the live feed inside the screen */}
        <div style={{position: 'absolute', left: MON.x, top: MON.y, width: MON.w, height: MON.h, overflow: 'hidden', borderRadius: 24, background: '#1d2a33'}}>
          <svg width={MON.w} height={MON.h} style={{position: 'absolute', left: 0, top: 0}}>
            <rect width={MON.w} height={MON.h} fill="#26363F" />
            <rect y={MON.h * 0.55} width={MON.w} height={MON.h * 0.45} fill="#3C4B52" />
            {Array.from({length: 18}).map((_, i) => {
              const x = (((i * 97 - scroll * (0.8 + 0.4 * rnd(i))) % (MON.w + 80)) + MON.w + 80) % (MON.w + 80) - 40;
              const y = MON.h * 0.6 + 160 * rnd(i * 3.3);
              return <ellipse key={i} cx={x} cy={y} rx={16 + 20 * rnd(i)} ry={6 + 5 * rnd(i * 2)} fill="#56656B" />;
            })}
          </svg>
          <div style={{position: 'absolute', left: 0, top: 0, width: MON.w, height: MON.h}}>
            <Spr n="boiler" x={bx} y={MON.h * 0.93} s={0.5} ax={SPR.boiler.w / 2} ay={SPR.boiler.feet[1]} />
          </div>
          {/* scanlines + vignette + REC dot */}
          <svg width={MON.w} height={MON.h} style={{position: 'absolute', left: 0, top: 0}}>
            {Array.from({length: Math.floor(MON.h / 8)}).map((_, i) => (
              <rect key={i} y={i * 8} width={MON.w} height={3} fill="#000" opacity={0.18} />
            ))}
            <rect width={MON.w} height={MON.h} fill="#5CFF9A" opacity={0.06} />
            {Math.floor(t * 2) % 2 === 0 ? <circle cx={34} cy={32} r={11} fill={RED} /> : null}
            <text x={54} y={42} fontFamily={FONT} fontWeight={900} fontSize={28} fill="#fff" opacity={0.9}>
              LIVE
            </text>
          </svg>
          {alert ? <div style={{position: 'absolute', inset: 0, border: `14px solid ${RED}`, borderRadius: 24}} /> : null}
        </div>
        {/* the hunter + Zzz */}
        <div style={{position: 'absolute', left: 0, top: 0}}>
          <Shadow x={g.x} y={1730} w={300} o={g.pose === 'joy' ? 0.6 : 1} />
          <Guy g={g} />
        </div>
        <Screen>
          {zz
            ? [0, 1, 2].map((i) => {
                const u = ((t - C_ROOM) * 0.9 + i / 3) % 1;
                return <Txt key={i} x={360 + 70 * u + 14 * i} y={1060 - 220 * u - 36 * i} size={72 - 12 * i} s={1} text="Z" fill="#fff" sw={0.16} rot={-12} />;
              })
            : null}
          {t > 20.66 && t < C_BOW ? <Txt x={450} y={860} size={150} s={pop(t, 20.66, 0.2)} text="!" fill={YEL} sw={0.22} rot={8} /> : null}
        </Screen>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ======================================================================================================
// SCENE 7 - THROUGH THE SCREEN: the Titanic's bow in the lamp light (quiet, no gags on the wreck)
// ======================================================================================================
const BOW_KEYS: CamKey[] = [
  {t: C_BOW, x: 770, y: FLOOR - 300, k: 0.7},
  {t: C_END, x: 740, y: FLOOR - 290, k: 0.75},
];
const BowScene: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(t, BOW_KEYS);
  const lamp = easeOutCubic(prog(t, C_BOW, C_BOW + 0.25));
  const wide = 1 + 0.25 * pop(t, C_BOW + 0.15, 0.25);
  return (
    <AbsoluteFill style={{background: '#02060f'}}>
      <World cam={cam}>
        <div style={{position: 'absolute', left: -4000, top: 0, width: 9000, height: FLOOR + 600, background: 'linear-gradient(#0A1730, #050B18 50%, #03070f)'}} />
        <SeaFloor dark />
        <Spr n="bow" x={1010} y={FLOOR + 40} s={0.9} rot={-2} />
        <MarineSnow t={t} x0={-300} y0={1600} w={2200} h={1300} n={45} seed={9} />
        <Lamp x={290} y={FLOOR - 180} on={lamp} ang={-12} spread={0.62} len={2200} dark={0.62} id="tc-bow" />
        <Spr n="sled" x={190} y={FLOOR - 330} s={0.42} ax={(SPR.sled as unknown as {top: [number, number]}).top[0]} ay={0} rot={-4}>
          <SledEyes open={1} look={[0.9, 0.2]} wide={wide} brow={pop(t, C_BOW + 0.15, 0.25)} />
        </Spr>
      </World>
    </AbsoluteFill>
  );
};

// ======================================================================================================
// SOUND
// ======================================================================================================
const CUES: Cue[] = [
  {f: 'pop', at: 0.0, db: -30},
  {f: 'whoosh', at: T.takes, db: -28},
  {f: 'pop', at: T.takes + 0.31, db: -24},
  {f: 'stamp', at: T.secret - 0.02, db: -13},
  {f: 'pop', at: 1.68, db: -28, rate: 1.2},
  {f: 'whoosh', at: T.check - 0.08, db: -26},
  {f: 'stamp', at: T.check + 0.1, db: -17, rate: 1.1},
  {f: 'pop', at: T.two, db: -23},
  {f: 'pop', at: T.sunken, db: -23, rate: 1.15},
  {f: 'geiger', at: T.nuclear + 0.02, db: -22, dur: 0.9},
  {f: 'whoosh', at: T.so - 0.06, db: -27, rate: 0.9},
  {f: 'book_slam', at: T.titanic2 - 0.03, db: -14},
  {f: 'flashbulb', at: T.becomes - 0.02, db: -18},
  {f: 'flashbulb', at: T.cover + 0.03, db: -19, rate: 1.1},
  {f: 'flashbulb', at: T.story + 0.03, db: -19, rate: 0.95},
  {f: 'pop', at: T.cover - 0.06, db: -24},
  {f: 'whistle', at: 7.08, db: -21, dur: 1.05},
  // the dive
  {f: 'winch', at: C_DIVE + 0.02, db: -21},
  {f: 'splash', at: 8.58, db: -15},
  {f: 'bubbles', at: 8.66, db: -22, dur: 1.2},
  {f: 'deep_bed', at: 8.7, db: -30, dur: 1.26, keys: [[8.7, -40], [9.0, -28], [9.85, -28], [9.95, -45]]},
  {f: 'button', at: 9.2, db: -21},
  {f: 'chirps', at: 9.36, db: -23},
  {f: 'hull_creak', at: 9.45, db: -22, dur: 0.5},
  // twelve days
  {f: 'flip', at: T.twelve - 0.06, db: -17},
  {f: 'gulp', at: T.left + 0.05, db: -19},
  {f: 'pop', at: T.luckily + 0.04, db: -21},
  {f: 'twinkle', at: T.luckily + 0.12, db: -22},
  // the replay
  {f: 'deep_bed', at: C_REPLAY, db: -32, dur: 3.0},
  {f: 'deep_bed', at: C_REPLAY + 2.95, db: -32, dur: 1.39, keys: [[15.15, -32], [16.5, -42]]},
  {f: 'hull_creak', at: BREAK - 0.12, db: -18},
  {f: 'mud_whoomp', at: landT('subA') - 0.04, db: -19},
  {f: 'mud_whoomp', at: landT('subB') - 0.04, db: -18, rate: 0.9},
  {f: 'debris_land', at: 13.72, db: -22},
  {f: 'debris_land', at: 14.42, db: -23, rate: 1.1},
  {f: 'whoosh', at: T.its - 0.05, db: -29, rate: 0.8},
  {f: 'whoosh', at: T.mile - 0.08, db: -26},
  {f: 'pop', at: T.mile + 0.25, db: -21},
  // the chart
  {f: 'whoosh', at: C_MAP - 0.04, db: -28},
  {f: 'sonar', at: C_MAP + 0.3, db: -27},
  {f: 'ping', at: T.trail2 + 0.03, db: -17},
  {f: 'pop', at: T.not + 0.05, db: -22},
  // the control room
  {f: 'snore', at: C_ROOM + 0.05, db: -21, dur: 0.95},
  {f: 'alert', at: T.boiler + 0.05, db: -15},
  {f: 'whoosh', at: T.slides - 0.1, db: -30, rate: 0.85},
  {f: 'boing', at: 20.64, db: -19},
  {f: 'pop', at: 20.66, db: -22, rate: 1.2},
  {f: 'whoosh', at: C_BOW - 0.3, db: -24, rate: 0.75},
  // the bow
  {f: 'deep_bed', at: C_BOW, db: -27, dur: 0.86},
  {f: 'chirps', at: C_BOW + 0.15, db: -25, rate: 0.9},
  {f: 'hull_creak', at: C_BOW + 0.2, db: -26, dur: 0.6},
  // the end
  {f: 'flashbulb', at: T.comes + 0.02, db: -19},
  {f: 'boing', at: T.comes + 0.02, db: -26, rate: 1.2},
  {f: 'stamp', at: T.true - 0.02, db: -13},
  {f: 'flashbulb', at: T.true + 0.1, db: -20, rate: 1.1},
  {f: 'magic', at: T.true + 0.12, db: -21},
  {f: 'gulp', at: T.true + 0.3, db: -23},
];

export const TitanicCoverShort: React.FC = () => {
  useTCFont();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  let scene: React.ReactNode;
  if (t < C_DIVE || (t >= C_DECK2 && t < C_REPLAY) || t >= C_END) scene = <DeckScene t={t} />;
  else if (t < C_DECK2) scene = <DiveScene t={t} />;
  else if (t < C_MAP) scene = <ReplayScene t={t} />;
  else if (t < C_ROOM) scene = <MapScene t={t} />;
  else if (t < C_BOW) scene = <RoomScene t={t} />;
  else scene = <BowScene t={t} />;
  return (
    <AbsoluteFill style={{background: NIGHT}}>
      {scene}
      <Dossier t={t} />
      <CoverCaption t={t} />
      <Calendar t={t} />
      {t < C_DIVE || t >= C_END ? <PressFlashes t={t} /> : null}
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('titanic-cover/vo/take1.mp3')} volume={Math.pow(10, MIX_DB / 20)} />
      </Sequence>
      <Audio src={staticFile('titanic-cover/music/bed.wav')} volume={Math.pow(10, MIX_DB / 20)} />
      <SoundCues cues={CUES.map((c) => ({...c, db: c.db + MIX_DB, keys: c.keys?.map(([kt, kd]) => [kt, kd + MIX_DB] as [number, number])}))} dir="titanic-cover/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};
export const TC_TOTAL = Math.round(DURATION * FPS);
