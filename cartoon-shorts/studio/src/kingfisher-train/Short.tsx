import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SPR} from './sprites';
import {BOOM, CUT1, CUT2, CUT3, FPS, T, VO_AT} from './scene';
import {camAt, clamp, easeInCubic, easeInOutCubic, easeOutCubic, lerp, pop, prog, rnd, shake, spring, type Cam, type CamKey} from '../shared/anim';
import {World} from '../shared/World';
import {Eye} from '../shared/Face';
import {PuffCluster, type Puff} from '../shared/Puffs';
import {SweatDrop} from '../shared/SweatDrop';
import {SoundCues, type Cue} from '../shared/Sound';
import {useFont} from '../shared/useFont';

// "Why did Japan give its bullet train a nose like a bird's beak?" - side-view school-diagram railway.
// Shot A: the beak-nosed train with a kingfisher on it, the puzzled guy. Shot B: the old blunt train shoves a pillow of
// air into the tunnel, the hill puffs up and BOOMs out of the far end, the guy gets blasted. Shot C: a kingfisher dives
// into a pond with barely a ripple and comes back with a fish. Shot D: a poof turns the old nose into the beak, the
// train slips through the calm hill and stops where frame 0 began.

const F = (n: string) => staticFile(`kingfisher-train/${n}.png`);
export const FONT = 'KingfisherInter';
export const useKfFont = () => useFont(FONT, staticFile('fonts/Inter-Black.otf'));
const MIX_DB = 4.0;
const INK = '#000';

// ---------- world ----------
export const G = 1000; // ground top line (rails sit on it)
const RAIL = G - 8; // wheel bottoms
const SKY = '#97D3F5';
const GRASS = '#8CCB5E';
const SOIL = '#CB9F63';
const S_OLD = 120 / (SPR.oldtrain.wheel - SPR.oldtrain.roof);
const S_NEW = 120 / (SPR.newtrain.wheel - SPR.newtrain.roof);
// hill: native sprite coords -> world; base of the tunnel openings at sprite y 458
const HS = 1.3;
const hx = (xs: number) => (xs - 12) * HS;
const HB = {x: hx(691), y: G + 4}; // base centre (scale origin)
const EXIT = {x: hx(1252), y: G - 66}; // centre of the right tunnel opening
const RING_R = hx(1355); // right edge of the right stone ring
// characters
const HEAD = 48;
type GuyPose = 'hero' | 'ears' | 'thumbs';
const sc = (n: GuyPose) => HEAD / SPR[n].head[2];
const GUY = {x: 2185, y: G + 34};
const BIRD_S = 0.135;
const POND_S = 0.36;
// trains
const TIP_END = 2150; // the beak train's stop (frame 0 and the last frame)
const TIP_OLD_D = -330; // the old train waiting at the tunnel in shot D
// perch points
const newImgLeft = (tip: number) => tip - SPR.newtrain.tip[0] * S_NEW;
const NEW_TOP = RAIL - SPR.newtrain.wheel * S_NEW;
const OLD_TOP = RAIL - SPR.oldtrain.wheel * S_OLD;
const cockpit = (tip: number) => ({x: newImgLeft(tip) + 990 * S_NEW, y: NEW_TOP + 16 * S_NEW});
const noseTop = (tip: number) => ({x: newImgLeft(tip) + 1400 * S_NEW, y: NEW_TOP + 174 * S_NEW});
const oldRoof = (tip: number) => ({x: tip - SPR.oldtrain.tip[0] * S_OLD + 1235 * S_OLD, y: OLD_TOP + 33 * S_OLD});
// pond (shot C)
const PX0 = -4330;
const PX1 = -3830;
const SURF = G + 6;
const POOL_B = G + 330;
const BRANCH = {x: -4120, y: G - 330};

// ---------- shots + cameras ----------
type Shot = 'A' | 'B' | 'C' | 'D';
const shotAt = (t: number): Shot => (t < CUT1 ? 'A' : t < CUT2 ? 'B' : t < CUT3 ? 'C' : 'D');
export const CAM0: CamKey = {t: 0, x: 2075, y: G - 240, k: 2.35};
const WIDE = {x: 880, y: G - 733, k: 0.6};
const KEYS: Record<'A' | 'C' | 'D', CamKey[]> = {
  A: [CAM0, {t: CUT1, x: 2078, y: G - 232, k: 2.48}],
  C: [
    {t: CUT2, x: -4120, y: G - 190, k: 1.6},
    {t: 9.6, x: -4118, y: G - 186, k: 1.62},
    {t: 10.4, x: -4105, y: G - 150, k: 1.68},
    {t: 11.3, x: -4115, y: G - 186, k: 1.7},
    {t: CUT3, x: -4115, y: G - 190, k: 1.72},
  ],
  D: [
    {t: CUT3, x: -430, y: G - 215, k: 2.3},
    {t: 13.85, x: -410, y: G - 212, k: 2.36},
    {t: 14.6, x: 860, y: G - 690, k: 0.66},
    {t: 15.55, x: CAM0.x, y: CAM0.y, k: CAM0.k},
  ],
};
// shot B: the camera follows the old train's nose, pulls back to the whole hill, then pushes in on the exit
const tipOldB = (t: number) => {
  // fast -> slowed down by the air piling up in front of the nose -> straining at the portal -> squeezes in
  if (t < 4.95) return -980 + 830 * easeOutCubic(prog(t, CUT1, 4.95));
  if (t < 5.58) return -150 + 105 * prog(t, 4.95, 5.58) + 3 * Math.sin(2 * Math.PI * 9 * t);
  if (t < 6.9) return -45 + 275 * easeInOutCubic(prog(t, 5.58, 6.9)) + 4 * Math.sin(2 * Math.PI * 9 * t);
  return 230 + 520 * easeInCubic(prog(t, 6.9, BOOM)) + 900 * Math.max(0, t - BOOM);
};
const camB = (t: number): Cam => {
  const follow = (tt: number) => ({x: Math.min(tipOldB(tt), -150) - 20, y: G - 262, k: 1.8});
  if (t < 5.35) return follow(t);
  const PUSH = {x: 1960, y: G - 370, k: 1.3};
  const mix = (a: Cam, b: Cam, u: number): Cam => ({x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), k: Math.exp(lerp(Math.log(a.k), Math.log(b.k), u))});
  if (t < 6.45) return mix(follow(5.35), WIDE, easeInOutCubic(prog(t, 5.35, 6.45)));
  if (t < 7.4) return mix(WIDE, {...WIDE, k: 0.62}, prog(t, 6.45, 7.4));
  return mix({...WIDE, k: 0.62}, PUSH, easeInOutCubic(prog(t, 7.4, 7.95)));
};

// ---------- sounds (ElevenLabs: 3 new for this video + reused ones from sfx-library) ----------
const CUES: Cue[] = [
  {f: 'pop', at: 0.22, db: -24, rate: 1.0},
  {f: 'bird_call', at: 0.62, db: -25},
  {f: 'pop', at: T.nose, db: -26, rate: 1.25},
  {f: 'whoosh', at: 2.78, db: -30, rate: 1.6},
  {f: 'pop', at: T.beak, db: -24, rate: 1.45},
  {f: 'train_rush', at: CUT1 - 0.02, db: -17},
  {f: 'gas_hiss', at: T.shoved, db: -24, keys: [[4.88, -30], [5.3, -22], [5.9, -34]], dur: 1.05},
  {f: 'squeeze', at: 5.5, db: -18},
  {f: 'rumble', at: 6.05, db: -24, keys: [[6.05, -40], [7.9, -20], [8.05, -30]], dur: 2.0},
  {f: 'squeeze', at: 6.55, db: -21, rate: 0.75},
  {f: 'squeeze', at: 7.25, db: -21, rate: 0.6},
  {f: 'boom', at: BOOM, db: -7},
  {f: 'bird_call', at: T.kingfisher, db: -21},
  {f: 'whoosh', at: T.dives + 0.02, db: -24, rate: 0.9},
  {f: 'drip', at: 10.09, db: -14, dur: 0.12},
  {f: 'drip', at: 10.86, db: -19, dur: 0.12, rate: 1.25},
  {f: 'pop', at: 11.3, db: -26, rate: 1.1},
  {f: 'bird_call', at: 11.45, db: -27, rate: 1.1},
  {f: 'whoosh', at: 12.28, db: -30, rate: 1.5},
  {f: 'pop', at: 12.86, db: -13, rate: 0.75},
  {f: 'clink', at: 13.33, db: -18},
  {f: 'bird_call', at: 13.62, db: -27},
  {f: 'glide', at: 13.88, db: -15},
  {f: 'whoosh', at: 14.05, db: -30, rate: 1.3},
  {f: 'glide', at: 15.05, db: -24, rate: 1.1},
  {f: 'pop', at: 15.08, db: -27, rate: 0.9},
  {f: 'pop', at: 15.72, db: -23, rate: 1.35},
  {f: 'bird_call', at: 15.88, db: -26, rate: 1.05},
];

// ---------- helpers ----------
const bump = (t: number, t0: number, dur = 0.22) => Math.sin(Math.PI * prog(t, t0, t0 + dur));
const squashSwap = (t: number, tSwap: number) => {
  if (t < tSwap - 0.08) return [1, 1];
  if (t < tSwap) {
    const u = prog(t, tSwap - 0.08, tSwap);
    return [1 + 0.05 * u, 1 - 0.06 * u];
  }
  const s = spring(t - tSwap, 3.2, 7);
  return [1 - 0.035 * s, 1 + 0.04 * s];
};
const breathe = (tr: number, ph = 0) => 1 + 0.009 * Math.sin(2 * Math.PI * 0.6 * tr + ph);

type SprName = keyof typeof SPR;
const Spr: React.FC<{n: SprName; x: number; y: number; s: number; sx?: number; sy?: number; rot?: number; ax?: number; ay?: number}> = ({
  n,
  x,
  y,
  s,
  sx = 1,
  sy = 1,
  rot = 0,
  ax,
  ay,
}) => {
  const sp = SPR[n] as unknown as {w: number; h: number; feet: [number, number]};
  const fx = ax ?? sp.feet[0];
  const fy = ay ?? sp.feet[1];
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg) scale(${sx}, ${sy})`, transformOrigin: '0 0'}}>
      <Img src={F(n)} style={{position: 'absolute', left: -fx * s, top: -fy * s, width: sp.w * s, height: sp.h * s}} />
    </div>
  );
};
const Svg: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg style={{position: 'absolute', left: -6000, top: -3000, overflow: 'visible'}} width={12000} height={9000} viewBox="-6000 -3000 12000 9000">
    {children}
  </svg>
);
const Shadow: React.FC<{x: number; y: number; w: number}> = ({x, y, w}) => (
  <div style={{position: 'absolute', left: x - w / 2, top: y - w * 0.07, width: w, height: w * 0.14, borderRadius: '50%', background: 'rgba(72, 54, 42, 0.26)', filter: 'blur(3px)'}} />
);
const Mark: React.FC<{x: number; y: number; size: number; s: number; text: string; rot?: number; fill?: string}> = ({x, y, size, s, text, rot = 0, fill = '#fff'}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <text x={0} y={size * 0.35} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={size} fill={fill} stroke={INK} strokeWidth={size * 0.14} paintOrder="stroke" strokeLinejoin="round">
        {text}
      </text>
    </g>
  );
const Sparkle: React.FC<{x: number; y: number; r: number; s: number; rot?: number}> = ({x, y, r, s, rot = 0}) => {
  if (s <= 0.001) return null;
  const p = `M 0 ${-r} Q ${r * 0.18} ${-r * 0.18} ${r} 0 Q ${r * 0.18} ${r * 0.18} 0 ${r} Q ${-r * 0.18} ${r * 0.18} ${-r} 0 Q ${-r * 0.18} ${-r * 0.18} 0 ${-r} Z`;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d={p} fill="#FFE45C" stroke={INK} strokeWidth={r * 0.14} strokeLinejoin="round" />
    </g>
  );
};

// ---------- backdrop: the generated sky plate (far, gentle parallax) above a code-drawn ground ----------
const PLATE_ROWS = 928; // the plate down to the foot of its far hills (its own grass is replaced by code ground)
const Backdrop: React.FC<{cam: Cam}> = ({cam}) => {
  const sp = clamp(0.9 + 0.33 * (cam.k - 0.6), 0.85, 1.48);
  const gy = 960 + (G - cam.y) * cam.k; // ground line on screen
  const W = SPR.bg.w * sp;
  const ox = -(((cam.x * cam.k * 0.3) % (2 * W)) + 2 * W) % (2 * W);
  const tiles: number[] = [];
  for (let x = ox - 2 * W; x < 1080 + W; x += W) tiles.push(x);
  return (
    <div style={{position: 'absolute', left: 0, top: gy - PLATE_ROWS * sp + 2, width: 1080, height: PLATE_ROWS * sp, overflow: 'hidden'}}>
      {tiles.map((x, i) => {
        const n = Math.round((x - ox) / W);
        const flip = ((n % 2) + 2) % 2 === 1;
        return (
          <Img
            key={i}
            src={F('bg')}
            style={{position: 'absolute', left: x, top: 0, width: W, height: SPR.bg.h * sp, transform: flip ? 'scaleX(-1)' : undefined}}
          />
        );
      })}
    </div>
  );
};
const Ground: React.FC = () => {
  const peb: React.ReactNode[] = [];
  for (let i = 0; i < 70; i++) {
    const x = -5200 + i * 130 + 60 * rnd(i);
    if (x > PX0 - 30 && x < PX1 + 30) continue;
    peb.push(<ellipse key={i} cx={x} cy={G + 80 + 420 * rnd(i * 3.1)} rx={9 + 8 * rnd(i * 2.2)} ry={6 + 5 * rnd(i * 5.3)} fill="#9C7442" />);
  }
  return (
    <g>
      <rect x={-6000} y={G} width={12000} height={4000} fill={SOIL} />
      {peb}
      <rect x={-6000} y={G} width={12000} height={26} fill={GRASS} />
      <line x1={-6000} x2={6000} y1={G + 26} y2={G + 26} stroke={INK} strokeWidth={4} />
      <line x1={-6000} x2={6000} y1={G} y2={G} stroke={INK} strokeWidth={6} />
    </g>
  );
};
const Rails: React.FC = () => {
  const sl: React.ReactNode[] = [];
  for (let x = -2600; x < 4200; x += 46) sl.push(<rect key={x} x={x} y={G - 7} width={24} height={11} rx={2} fill="#7A5A3A" stroke={INK} strokeWidth={2.5} />);
  return (
    <g>
      {sl}
      <rect x={-2600} y={G - 13} width={6800} height={7} fill="#6B6B6B" stroke={INK} strokeWidth={2.5} />
    </g>
  );
};

// ---------- trains (sprites + code faces); faces drawn in native sprite coords ----------
type TrainFace = {open: number; look: [number, number]; lid?: number; tilt?: number; squeeze?: boolean};
const TrainEyes: React.FC<{kind: 'old' | 'new'; f: TrainFace}> = ({kind, f}) => {
  const P = kind === 'old' ? [[1195, 74], [1263, 80]] : [[968, 44], [1030, 50]];
  const r = kind === 'old' ? 31 : 25;
  const sp = kind === 'old' ? SPR.oldtrain : SPR.newtrain;
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={sp.w} height={sp.h}>
      {P.map(([x, y], i) => (
        <Eye key={i} x={x} y={y} r={r} open={f.open} look={f.look} squeeze={f.squeeze} side={i === 0 ? -1 : 1} lid={f.lid ?? 0} lidTilt={f.tilt ?? 0} brow={0.45} browTilt={(f.tilt ?? 0) / 20} ink={0.17} />
      ))}
    </svg>
  );
};
const Train: React.FC<{kind: 'old' | 'new'; tip: number; face: TrainFace; cars?: number; dy?: number}> = ({kind, tip, face, cars = 2, dy = 0}) => {
  const n = kind === 'old' ? 'oldtrain' : 'newtrain';
  const sp = SPR[n];
  const s = kind === 'old' ? S_OLD : S_NEW;
  const left = tip - sp.tip[0] * s;
  const top = RAIL - sp.wheel * s + dy;
  const frontLeft = left + sp.left * s;
  const carLen = (SPR.car.right - SPR.car.left) * S_OLD;
  const carTop = RAIL - SPR.oldtrain.wheel * S_OLD;
  const out: React.ReactNode[] = [];
  for (let i = 0; i < cars; i++) {
    const right = frontLeft - 9 - i * (carLen + 9);
    out.push(
      <React.Fragment key={i}>
        <div style={{position: 'absolute', left: right - 4, top: RAIL - 92, width: 17, height: 58, background: '#555', border: '3px solid #000', boxSizing: 'border-box'}} />
        <Img src={F('car')} style={{position: 'absolute', left: right - SPR.car.right * S_OLD, top: carTop, width: SPR.car.w * S_OLD, height: SPR.car.h * S_OLD}} />
      </React.Fragment>,
    );
  }
  return (
    <>
      {out}
      <div style={{position: 'absolute', left, top, width: sp.w * s, height: sp.h * s}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: sp.w, height: sp.h, transform: `scale(${s})`, transformOrigin: '0 0'}}>
          <Img src={F(n)} style={{position: 'absolute', left: 0, top: 0, width: sp.w, height: sp.h}} />
          <TrainEyes kind={kind} f={face} />
        </div>
      </div>
    </>
  );
};

// ---------- the hill (sprite + code face) ----------
type HillFace = {open: number; look: [number, number]; squeeze?: boolean; lid?: number; puff?: number; smile?: number; cough?: number; brow?: number};
const HillFaceSvg: React.FC<{f: HillFace}> = ({f}) => {
  const pf = f.puff ?? 0;
  const sm = f.smile ?? 0;
  const co = f.cough ?? 0;
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={SPR.hill.w} height={SPR.hill.h}>
      {pf > 0.01 ? (
        <>
          <ellipse cx={605} cy={262} rx={58 * pf} ry={40 * pf} fill="#F2A3A0" opacity={0.9} />
          <ellipse cx={775} cy={258} rx={58 * pf} ry={40 * pf} fill="#F2A3A0" opacity={0.9} />
        </>
      ) : null}
      <Eye x={612} y={178} r={50} open={f.open} look={f.look} squeeze={f.squeeze} side={-1} lid={f.lid ?? 0} brow={f.brow ?? 0.5} ink={0.17} />
      <Eye x={770} y={172} r={50} open={f.open} look={f.look} squeeze={f.squeeze} side={1} lid={f.lid ?? 0} brow={f.brow ?? 0.5} ink={0.17} />
      {co > 0.01 ? (
        <g transform={`translate(690 268) scale(${co})`}>
          <ellipse cx={0} cy={0} rx={40} ry={30} fill="#7A1F2B" stroke={INK} strokeWidth={9} />
        </g>
      ) : pf > 0.05 ? (
        <g transform={`translate(690 262) scale(${0.6 + 0.4 * pf})`}>
          <ellipse cx={0} cy={0} rx={22} ry={16} fill="#7A1F2B" stroke={INK} strokeWidth={8} />
        </g>
      ) : (
        <path d={`M 640 ${258 - 6 * sm} Q 690 ${258 + 34 * sm} 740 ${258 - 6 * sm}`} fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
      )}
    </svg>
  );
};
const Hill: React.FC<{sx: number; sy: number; f: HillFace; sweat?: number; tr: number}> = ({sx, sy, f, sweat = 0, tr}) => (
  <div style={{position: 'absolute', left: HB.x, top: HB.y, transform: `scale(${sx}, ${sy})`, transformOrigin: '0 0'}}>
    <div style={{position: 'absolute', left: -691 * HS, top: -458 * HS, width: SPR.hill.w * HS, height: SPR.hill.h * HS}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: SPR.hill.w, height: SPR.hill.h, transform: `scale(${HS})`, transformOrigin: '0 0'}}>
        <Img src={F('hill')} style={{position: 'absolute', left: 0, top: 0, width: SPR.hill.w, height: SPR.hill.h}} />
        <HillFaceSvg f={f} />
        <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={SPR.hill.w} height={SPR.hill.h}>
          <SweatDrop x={870 + 10 * Math.sin(tr * 3)} y={120 + 60 * sweat} r={26} s={sweat > 0 ? Math.min(1, sweat * 4) : 0} />
        </svg>
      </div>
    </div>
  </div>
);

// ---------- small code-drawn things ----------
const AirBlob: React.FC<{x: number; y: number; w: number; h: number; t: number}> = ({x, y, w, h, t}) => {
  if (w < 4) return null;
  const puffs: Puff[] = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.3;
    puffs.push({x: x + Math.cos(a) * w * 0.32, y: y + Math.sin(a) * h * 0.3, r: Math.min(w, h) * (0.3 + 0.05 * Math.sin(t * 9 + i))});
  }
  puffs.push({x, y, r: Math.min(w, h) * 0.4});
  const er = Math.min(w, h) * 0.13;
  return (
    <g>
      <PuffCluster puffs={puffs} fill="#FFFFFF" ink={5} shade="#DCEFFF" />
      <Eye x={x + w * 0.05} y={y - h * 0.06} r={er} open={1} squeeze side={-1} />
      <Eye x={x + w * 0.24} y={y - h * 0.06} r={er} open={1} squeeze side={1} />
    </g>
  );
};
const SpeedLines: React.FC<{tip: number; u: number; t: number}> = ({tip, u, t}) => {
  if (u <= 0.01) return null;
  const ls: React.ReactNode[] = [];
  for (let i = 0; i < 6; i++) {
    const y = G - 30 - i * 17;
    const ph = (t * 3.1 + rnd(i) ) % 1;
    const x0 = tip - 620 - 420 * ph;
    ls.push(<line key={i} x1={x0} x2={x0 - 120 * u} y1={y} y2={y} stroke="#fff" strokeWidth={6} strokeLinecap="round" opacity={0.85 * u * Math.sin(Math.PI * ph)} />);
  }
  return <g>{ls}</g>;
};
const Shock: React.FC<{t: number}> = ({t}) => {
  const rings: React.ReactNode[] = [];
  // blast lines shooting out of the portal (one burst, no lingering shapes)
  const ub = prog(t, BOOM, BOOM + 0.5);
  if (ub > 0 && ub < 1) {
    for (let i = 0; i < 9; i++) {
      const a = ((-62 + (124 * i) / 8) * Math.PI) / 180;
      const r0 = 120 + 520 * easeOutCubic(ub);
      const r1 = r0 + 170 * (1 - ub) + 30;
      const x0 = EXIT.x + 60 + r0 * Math.cos(a);
      const y0 = EXIT.y + r0 * Math.sin(a) * 0.8;
      const x1 = EXIT.x + 60 + r1 * Math.cos(a);
      const y1 = EXIT.y + r1 * Math.sin(a) * 0.8;
      if (Math.max(y0, y1) > G - 6) continue;
      rings.push(
        <g key={i}>
          <line x1={x0} y1={y0} x2={x1} y2={y1} stroke={INK} strokeWidth={22 * (1 - ub) + 8} strokeLinecap="round" />
          <line x1={x0} y1={y0} x2={x1} y2={y1} stroke="#FFF6C8" strokeWidth={22 * (1 - ub)} strokeLinecap="round" />
        </g>,
      );
    }
  }
  // dust bursting out of the portal
  const u = prog(t, BOOM, BOOM + 0.9);
  const puffs: Puff[] = [];
  if (u > 0 && u < 1) {
    const life = Math.sin(Math.PI * Math.sqrt(u));
    for (let i = 0; i < 10; i++) {
      const a = -0.9 + 1.4 * rnd(i * 2.7);
      const d = 60 + 380 * easeOutCubic(u) * (0.5 + 0.6 * rnd(i * 4.1));
      puffs.push({x: EXIT.x + 40 + Math.cos(a) * d, y: Math.min(G - 20, EXIT.y + Math.sin(a) * d * 0.7), r: (34 + 36 * rnd(i * 1.3)) * life});
    }
  }
  return (
    <g>
      {rings}
      {puffs.length ? <PuffCluster puffs={puffs} fill="#E9E4DE" ink={6} shade="#CFC8C0" /> : null}
    </g>
  );
};
const Fish: React.FC<{x: number; y: number; rot?: number; s?: number; squeeze?: boolean; look?: [number, number]; flip?: boolean}> = ({x, y, rot = 0, s = 1, squeeze = false, look = [0.5, 0], flip = false}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s * (flip ? -1 : 1)} ${s})`}>
    <path d="M -46 0 L -74 -24 L -70 0 L -74 24 Z" fill="#9AA9B8" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <ellipse cx={0} cy={0} rx={50} ry={27} fill="#C6D3DE" stroke={INK} strokeWidth={6} />
    <path d="M -10 -24 Q 4 -40 18 -24" fill="#9AA9B8" stroke={INK} strokeWidth={5} />
    <Eye x={26} y={-6} r={11} open={1} look={look} squeeze={squeeze} side={1} brow={NaN} ink={0.2} />
  </g>
);
const Ripple: React.FC<{x: number; y: number; u: number}> = ({x, y, u}) => {
  if (u <= 0 || u >= 1) return null;
  const rings = [0, 0.25].map((d, i) => {
    const v = clamp((u - d) / (1 - d));
    if (v <= 0) return null;
    return <ellipse key={i} cx={x} cy={y} rx={14 + 70 * v} ry={4 + 14 * v} fill="none" stroke="#fff" strokeWidth={5 * (1 - v)} />;
  });
  // two tiny drops hop up and fall back
  const drops = [-1, 1].map((sd, i) => {
    const v = clamp(u / 0.55);
    if (v >= 1) return null;
    const dx = sd * 26 * v;
    const dy = -60 * 4 * v * (1 - v);
    return <circle key={`d${i}`} cx={x + dx} cy={y - 6 + dy} r={7} fill="#BFE3FF" stroke={INK} strokeWidth={3} />;
  });
  return (
    <g>
      {rings}
      {drops}
    </g>
  );
};
const Poof: React.FC<{x: number; y: number; t: number}> = ({x, y, t}) => {
  const u = prog(t, T.copied - 0.04, 13.62);
  if (u <= 0 || u >= 1) return null;
  const grow = easeOutCubic(prog(t, T.copied - 0.04, T.copied + 0.2));
  const shrink = 1 - easeInCubic(prog(t, 13.2, 13.5));
  const puffs: Puff[] = [];
  for (let i = 0; i < 14; i++) {
    const px = x + (rnd(i * 3.7) - 0.5) * 820;
    const py = y + (rnd(i * 5.9) - 0.5) * 150 - 20;
    puffs.push({x: px + 30 * Math.sin(t * 5 + i), y: py, r: (80 + 50 * rnd(i * 1.7)) * grow * shrink});
  }
  return <PuffCluster puffs={puffs} fill="#FFFFFF" ink={7} shade="#E3EEF7" />;
};
const Pond: React.FC<{children?: React.ReactNode; over?: boolean; t: number}> = ({over, t}) => {
  const n = 14;
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const x = PX0 + ((PX1 - PX0) * i) / n;
    pts.push(`${x.toFixed(1)} ${(SURF + 3 * Math.sin(x / 40 + t * 2.2)).toFixed(1)}`);
  }
  const top = `M ${pts.join(' L ')}`;
  const body = `${top} L ${PX1} ${POOL_B - 40} Q ${PX1} ${POOL_B} ${PX1 - 40} ${POOL_B} L ${PX0 + 40} ${POOL_B} Q ${PX0} ${POOL_B} ${PX0} ${POOL_B - 40} Z`;
  if (!over)
    return (
      <g>
        <rect x={PX0 - 4} y={G - 8} width={PX1 - PX0 + 8} height={22} fill={SKY} />
        <path d={body} fill="#2F86DE" />
        {/* reeds and pebbles on the pool floor */}
        {[0.12, 0.3, 0.74, 0.9].map((u, i) => (
          <path key={i} d={`M ${PX0 + (PX1 - PX0) * u} ${POOL_B} q ${12 * Math.sin(t * 2 + i)} -60 ${-6 + 4 * i} -110`} stroke="#2F7A3A" strokeWidth={9} fill="none" strokeLinecap="round" />
        ))}
      </g>
    );
  return (
    <g>
      <path d={body} fill="#6FC0F5" opacity={0.42} />
      <path d={`M ${PX0} ${SURF - 2} L ${PX0} ${POOL_B - 40} Q ${PX0} ${POOL_B} ${PX0 + 40} ${POOL_B} L ${PX1 - 40} ${POOL_B} Q ${PX1} ${POOL_B} ${PX1} ${POOL_B - 40} L ${PX1} ${SURF - 2}`} fill="none" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      <path d={top} fill="none" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <path d={top} fill="none" stroke="#BFE3FF" strokeWidth={3} strokeLinejoin="round" transform="translate(0 6)" />
    </g>
  );
};
const Branch: React.FC = () => (
  <g strokeLinecap="round" strokeLinejoin="round" fill="none">
    <path d={`M -4560 ${G} L -4540 ${G - 470}`} stroke={INK} strokeWidth={50} />
    <path d={`M -4560 ${G} L -4540 ${G - 470}`} stroke="#8B5A2B" strokeWidth={38} />
    <path d={`M -4545 ${G - 360} Q -4330 ${G - 345} ${BRANCH.x + 90} ${BRANCH.y + 4}`} stroke={INK} strokeWidth={26} />
    <path d={`M -4545 ${G - 360} Q -4330 ${G - 345} ${BRANCH.x + 90} ${BRANCH.y + 4}`} stroke="#8B5A2B" strokeWidth={15} />
    <ellipse cx={BRANCH.x + 60} cy={BRANCH.y - 26} rx={34} ry={16} transform={`rotate(-30 ${BRANCH.x + 60} ${BRANCH.y - 26})`} fill="#5DB04A" stroke={INK} strokeWidth={5} />
    <ellipse cx={-4380} cy={G - 380} rx={36} ry={17} transform={`rotate(-50 -4380 ${G - 380})`} fill="#5DB04A" stroke={INK} strokeWidth={5} />
    <ellipse cx={-4540} cy={G - 500} rx={90} ry={60} fill="#5DB04A" stroke={INK} strokeWidth={6} />
  </g>
);

// ---------- the bird ----------
// perch: anchor at the feet (sprite 240, 525); dive: anchor at the beak tip (sprite bottom)
const PERCH_FEET: [number, number] = [240, 525];
const Bird: React.FC<{mode: 'perch' | 'dive'; x: number; y: number; s: number; rot?: number; sx?: number; sy?: number}> = ({mode, x, y, s, rot = 0, sx = 1, sy = 1}) =>
  mode === 'perch' ? (
    <Spr n="perch" x={x} y={y} s={s} rot={rot} sx={sx} sy={sy} ax={PERCH_FEET[0]} ay={PERCH_FEET[1]} />
  ) : (
    <Spr n="dive" x={x} y={y} s={s} rot={rot} sx={sx} sy={sy} ax={SPR.dive.bottom[0]} ay={SPR.dive.bottom[1]} />
  );
// beak tip of the perch pose in world coords for a bird at (x, y) with scale s and rotation rot (deg)
const perchBeak = (x: number, y: number, s: number, rot = 0) => {
  const dx = (SPR.perch.right[0] - PERCH_FEET[0]) * s;
  const dy = (SPR.perch.right[1] - PERCH_FEET[1]) * s;
  const a = (rot * Math.PI) / 180;
  return {x: x + dx * Math.cos(a) - dy * Math.sin(a), y: y + dx * Math.sin(a) + dy * Math.cos(a)};
};

// ---------- guy ----------
const Guy: React.FC<{n: GuyPose; t: number; tr: number; tSwap: number; dx?: number; tremble?: number}> = ({n, t, tr, tSwap, dx = 0, tremble = 0}) => {
  const [sx, sy] = squashSwap(t, tSwap);
  const tx = tremble * 2.5 * Math.sin(2 * Math.PI * 13 * tr);
  return (
    <>
      <Shadow x={GUY.x + dx} y={GUY.y} w={150} />
      <Spr n={n} x={GUY.x + dx + tx} y={GUY.y} s={sc(n)} sx={sx} sy={sy * breathe(tr)} />
    </>
  );
};


// a small Japanese flag on a pole behind the train: in frame 0 and the last frame (loop), it jumps up on "Japan"
const Flag: React.FC<{x: number; h: number; tr: number}> = ({x, h, tr}) => {
  if (h <= 2) return null;
  const top = G - h;
  const w = 128;
  const fh = 86;
  const wv = (u: number) => 7 * Math.sin(2 * Math.PI * (1.4 * tr - u * 1.2));
  const path = `M ${x} ${top} Q ${x + w * 0.5} ${top + wv(0.5) - 8} ${x + w} ${top + wv(1)} L ${x + w} ${top + fh + wv(1)} Q ${x + w * 0.5} ${top + fh + wv(0.5) - 8} ${x} ${top + fh} Z`;
  return (
    <g>
      <line x1={x} x2={x} y1={G} y2={top - 10} stroke={INK} strokeWidth={13} strokeLinecap="round" />
      <line x1={x} x2={x} y1={G} y2={top - 10} stroke="#B8B8B8" strokeWidth={6} strokeLinecap="round" />
      <path d={path} fill="#FFFFFF" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      <circle cx={x + w * 0.5} cy={top + fh * 0.5 + wv(0.5) * 0.6 - 4} r={fh * 0.3} fill="#D7262E" />
      <circle cx={x} cy={top - 12} r={9} fill="#F2C230" stroke={INK} strokeWidth={4} />
    </g>
  );
};
const FLAG_X = 1975;
const FLAG_H = 400;

// ---------- shots ----------
const ShotA: React.FC<{t: number; tr: number; cover?: boolean}> = ({t, tr, cover = false}) => {
  const p0 = cockpit(TIP_END);
  const p1 = noseTop(TIP_END);
  // the bird hops from the cockpit roof to the nose on "bird's", beak beside beak on "beak"
  const hu = prog(t, 2.72, 3.08);
  const hop = hu > 0 && hu < 1;
  const bx = lerp(p0.x, p1.x, easeInOutCubic(hu));
  const by = lerp(p0.y, p1.y, hu) - 90 * Math.sin(Math.PI * hu);
  const brot = lerp(0, 15, easeInOutCubic(hu));
  const land = t > 3.08 ? spring(t - 3.08, 3, 7) : 0;
  const bob = t < 2.72 ? bump(t, 0.55, 0.25) * 0.08 + bump(t, 1.6, 0.25) * 0.05 : 0;
  const blink = t > 1.2 && t < 1.32;
  const tipB = perchBeak(bx, by, BIRD_S, brot);
  const fh = FLAG_H * (1 + 0.1 * bump(t, T.japan - 0.02, 0.3) - 0.04 * bump(t, T.japan + 0.28, 0.25));
  return (
    <>
      <Svg>
        {cover ? null : <Flag x={FLAG_X} h={fh} tr={tr} />}
      </Svg>
      <Train kind="new" tip={TIP_END} face={{open: blink ? 0.12 : 1, look: t < 2.7 ? [0.7, 0.2] : [0.8, 0.9]}} />
      <Hill sx={1} sy={1} f={{open: 1, look: [0.6, 0.1], smile: 0.6}} tr={tr} />
      <Guy n="hero" t={t} tr={tr} tSwap={-1} />
      <Bird mode="perch" x={bx} y={by} s={BIRD_S} rot={brot} sx={1 + 0.06 * land - (hop ? 0 : bob * 0.5)} sy={1 - 0.08 * land + bob} />
      <Svg>
        <Mark x={GUY.x + 30} y={GUY.y - 290} size={110} s={pop(t, 0.2, 0.25)} text="?" rot={10 + 6 * Math.sin(2 * Math.PI * 1.1 * tr)} />
        <Mark x={GUY.x - 40} y={GUY.y - 330} size={80} s={pop(t, T.nose, 0.25)} text="?" rot={-12 + 6 * Math.sin(2 * Math.PI * 1.3 * tr + 1)} />
        <Sparkle x={tipB.x + 4} y={tipB.y} r={20} s={bump(t, T.beak, 0.35)} rot={20 * t} />
        <Sparkle x={TIP_END + 4} y={NEW_TOP + 189 * S_NEW} r={22} s={bump(t, T.beak + 0.1, 0.35)} rot={-20 * t} />
      </Svg>
    </>
  );
};

const ShotB: React.FC<{t: number; tr: number}> = ({t, tr}) => {
  const tip = tipOldB(t);
  // the pillow of air in front of the nose, squeezed into the portal
  // grows in front of the nose, gets squeezed between the nose and the portal, then shoots into the tunnel
  const gap = 18 - tip; // room between the nose and the stone ring
  const grow = easeOutCubic(prog(t, 4.35, 4.9));
  const gone = easeInCubic(prog(t, 5.5, 5.72));
  const bw = Math.max(0, Math.min(170 * grow, gap - 6)) * (1 - gone) + 1;
  const bh = 116 * grow * (1 + 0.45 * clamp(1 - bw / 170) * (1 - gone)) * (1 - 0.5 * gone);
  const blobX = tip + 10 + bw * 0.5 + 300 * gone;
  const inflate = easeInOutCubic(prog(t, 5.62, 7.9));
  const after = t > BOOM ? spring(t - BOOM, 2.6, 5) : 0;
  const deflate = t > BOOM ? 1 - easeOutCubic(prog(t, BOOM, BOOM + 0.18)) : 1;
  const wob = 0.012 * Math.sin(2 * Math.PI * 4 * tr) * inflate * deflate;
  const sx = 1 + (0.07 * inflate + wob) * deflate - 0.04 * after;
  const sy = 1 + (0.13 * inflate + wob) * deflate - 0.07 * after;
  const boomed = t >= BOOM;
  const face: HillFace = boomed
    ? {open: 1, look: [0.6, 0], squeeze: t < BOOM + 0.45, cough: t < BOOM + 0.45 ? 1 : 0, smile: -0.4, brow: 0.7}
    : {open: pop(t, 5.15, 0.25) || 0.001, look: t < 6.2 ? [-0.8, 0.3] : [0, -0.3], puff: easeOutCubic(prog(t, 6.15, 6.6)), lid: 0, brow: 0.5 + 0.3 * inflate};
  const sweat = t > 6.85 && t < BOOM ? prog(t, 6.85, 7.9) : 0;
  const trainFace: TrainFace = t < 5.55 ? {open: 1, look: [0.8, 0], lid: 0.3, tilt: 18} : {open: 1, look: [0.8, 0], squeeze: true};
  const guyN: GuyPose = t < BOOM ? 'hero' : 'ears';
  const push = boomed ? 70 * easeOutCubic(prog(t, BOOM, BOOM + 0.35)) : 0;
  const speed = 1 - prog(t, 4.5, 4.95);
  return (
    <>
      <Svg>
        <SpeedLines tip={tip} u={speed} t={tr} />
        <AirBlob x={blobX} y={G - 66} w={bw} h={bh} t={tr} />
      </Svg>
      <Train kind="old" tip={tip} face={trainFace} dy={t < 5.6 ? 1.5 * Math.sin(2 * Math.PI * 11 * tr) : 0} />
      <Hill sx={sx} sy={sy} f={face} sweat={sweat} tr={tr} />
      <Svg>
        <Shock t={t} />
      </Svg>
      <Guy n={guyN} t={t} tr={tr} tSwap={BOOM} dx={push} tremble={boomed ? 1 : 0} />
      <Svg>
        <Mark x={EXIT.x + 330} y={G - 430} size={160} s={pop(t, BOOM, 0.22) * (1 - prog(t, 8.45, 8.56))} text="BOOM!" rot={-8 + 3 * Math.sin(2 * Math.PI * 3 * tr)} fill="#FFD23F" />
      </Svg>
    </>
  );
};

const ShotC: React.FC<{t: number; tr: number}> = ({t, tr}) => {
  // perch on the branch -> anticipation -> dive (gravity) -> under water to the fish -> back up with the fish -> perch
  const tDive = T.dives + 0.04;
  const tIn = 10.1; // beak reaches the surface
  const tCatch = 10.52;
  const tUp = 10.62;
  const tOut = 10.86; // beak leaves the water
  const tLand = 11.3;
  const x0 = BRANCH.x + 34;
  const y0 = BRANCH.y + 40;
  const fishX = lerp(-4290, x0 - 30, easeOutCubic(prog(t, CUT2, tCatch)));
  const caught = t >= tCatch;
  let bird: React.ReactNode;
  let beak = {x: 0, y: 0};
  let fishRot = 0;
  if (t < tDive) {
    const a = prog(t, tDive - 0.16, tDive);
    const bob = bump(t, T.kingfisher - 0.05, 0.25) * 0.07;
    bird = <Bird mode="perch" x={BRANCH.x} y={BRANCH.y} s={POND_S} sx={1 + 0.06 * a} sy={1 - 0.1 * a + bob} />;
  } else if (t < tUp) {
    let y: number;
    if (t < tIn) {
      const tt = t - tDive;
      const T0 = tIn - tDive;
      y = y0 + (SURF - y0) * (tt / T0) * (tt / T0);
    } else y = SURF + (G + 200 - SURF) * easeOutCubic(prog(t, tIn, tCatch));
    bird = <Bird mode="dive" x={x0} y={y} s={POND_S * 0.82} sx={1 - 0.04 * bump(t, tDive, 0.12)} />;
    beak = {x: x0, y};
  } else if (t < tLand) {
    // rising beak-first (the dive pose flipped), then an arc back to the branch
    const u = prog(t, tUp, tLand);
    const ry = lerp(G + 200, BRANCH.y - 60, easeInOutCubic(u));
    const rx = lerp(x0, BRANCH.x + 40, easeInOutCubic(prog(t, tOut, tLand)));
    bird = <Bird mode="dive" x={rx} y={ry} s={POND_S * 0.82} sy={-1} />;
    beak = {x: rx, y: ry};
    fishRot = 90;
  } else {
    const l = spring(t - tLand, 3, 7);
    bird = <Bird mode="perch" x={BRANCH.x} y={BRANCH.y} s={POND_S} sx={1 + 0.05 * l} sy={1 - 0.08 * l + 0.008 * Math.sin(2 * Math.PI * 0.6 * tr)} />;
    beak = perchBeak(BRANCH.x, BRANCH.y, POND_S);
    fishRot = 0;
  }
  const wig = 14 * Math.sin(2 * Math.PI * 5 * tr);
  const fish = caught ? (
    <Fish x={beak.x + (t >= tLand ? 30 : 0)} y={beak.y + (t >= tLand ? 26 : t >= tUp ? -30 : 34)} rot={fishRot + wig} s={0.9} squeeze />
  ) : (
    <Fish x={fishX} y={G + 214 + 8 * Math.sin(2 * Math.PI * 1.2 * tr)} rot={4 * Math.sin(2 * Math.PI * 2 * tr)} s={1} look={t > 10.15 ? [0, -1] : [0.6, 0]} />
  );
  return (
    <>
      <Svg>
        <Pond t={tr} />
        <Branch />
        {fish}
      </Svg>
      {bird}
      <Svg>
        <Pond over t={tr} />
        <Ripple x={x0} y={SURF} u={prog(t, tIn - 0.02, tIn + 0.75)} />
        <Ripple x={x0} y={SURF} u={prog(t, tOut - 0.02, tOut + 0.7)} />
        <Mark x={x0 + 150} y={SURF - 70} size={58} s={pop(t, tIn + 0.04, 0.2) * (1 - prog(t, 11.0, 11.15))} text="plip" rot={-6} />
        <Mark x={BRANCH.x + 130} y={BRANCH.y - 250} size={100} s={pop(t, tLand + 0.15, 0.22)} text="!" rot={8 + 5 * Math.sin(2 * Math.PI * 1.2 * tr)} fill="#FFD23F" />
      </Svg>
    </>
  );
};

const ShotD: React.FC<{t: number; tr: number}> = ({t, tr}) => {
  const swapT = 13.1;
  const isNew = t >= swapT;
  const tip = isNew ? -108 + (TIP_END + 108) * easeInOutCubic(prog(t, 13.85, 15.85)) : TIP_OLD_D;
  // the bird: lands on the old roof, jumps up in the poof, lands on the new cockpit, flies over the hill
  let bird: React.ReactNode;
  const pr = oldRoof(TIP_OLD_D);
  const pc = cockpit(-108);
  const pe = cockpit(TIP_END);
  if (t < 12.42) {
    const u = prog(t, CUT3, 12.42);
    const x = lerp(pr.x + 260, pr.x, easeOutCubic(u));
    const y = lerp(pr.y - 260, pr.y, u) - 60 * Math.sin(Math.PI * u);
    bird = <Bird mode="dive" x={x + 30} y={y - 30} s={BIRD_S * 0.9} rot={-90 - 30 * (1 - u)} />;
  } else if (t < T.copied - 0.04) {
    const l = spring(t - 12.42, 3, 7);
    bird = <Bird mode="perch" x={pr.x} y={pr.y} s={BIRD_S} sx={1 + 0.06 * l} sy={1 - 0.08 * l + 0.05 * bump(t, 12.6, 0.2)} />;
  } else if (t < 13.62) {
    const u = prog(t, T.copied - 0.04, 13.62);
    const x = lerp(pr.x, pc.x, u);
    const y = lerp(pr.y, pc.y, u) - 150 * Math.sin(Math.PI * u);
    bird = <Bird mode="perch" x={x} y={y} s={BIRD_S} rot={-8 * Math.sin(Math.PI * u)} />;
  } else if (t < 14.02) {
    const l = spring(t - 13.62, 3, 7);
    // the bird rides the cockpit roof until it hops off
    const c = cockpit(tip);
    bird = <Bird mode="perch" x={c.x} y={c.y} s={BIRD_S} sx={1 + 0.06 * l} sy={1 - 0.08 * l + 0.06 * bump(t, 13.7, 0.2)} />;
  } else if (t < 15.85) {
    const u = prog(t, 14.02, 15.85);
    const c0 = cockpit(-108 + (TIP_END + 108) * easeInOutCubic(prog(14.02, 13.85, 15.85)));
    const x = lerp(c0.x, pe.x, easeInOutCubic(u));
    const y = lerp(c0.y, pe.y, u) - 720 * Math.sin(Math.PI * u);
    const ang = Math.atan2(-720 * Math.PI * Math.cos(Math.PI * u) + (pe.y - c0.y), Math.max(1, pe.x - c0.x)) * (180 / Math.PI);
    bird = <Bird mode="dive" x={x + 30} y={y - 30} s={BIRD_S * 0.9} rot={-90 + ang * 0.6} />;
  } else {
    const l = spring(t - 15.85, 3, 7);
    bird = <Bird mode="perch" x={pe.x} y={pe.y} s={BIRD_S} sx={1 + 0.06 * l} sy={1 - 0.08 * l + 0.006 * Math.sin(2 * Math.PI * 0.6 * tr)} />;
  }
  const oldFace: TrainFace = {open: 1, look: t < 12.5 ? [0.6, -0.8] : [0.2, -0.9], squeeze: t > T.copied - 0.1};
  const newFace: TrainFace = {open: 1, look: t < 15.3 ? [0.9, 0] : [0.7, 0.3], lid: t > 15.9 ? 0.35 : 0};
  const guyN: GuyPose = t < 15.05 ? 'hero' : t < 15.72 ? 'ears' : 'thumbs';
  const hillFace: HillFace = {open: 1, look: [clamp(lerp(-0.8, 0.8, prog(t, 13.85, 15.2)), -1, 1), 0.15], smile: 0.7, lid: t > 14.4 && t < 15.6 ? 0.35 : 0};
  return (
    <>
      <Svg>
        <Flag x={FLAG_X} h={FLAG_H} tr={tr} />
      </Svg>
      {isNew ? <Train kind="new" tip={tip} face={newFace} /> : <Train kind="old" tip={tip} face={oldFace} />}
      <Hill sx={1} sy={1 + 0.012 * Math.sin(2 * Math.PI * 0.5 * tr)} f={hillFace} tr={tr} />
      <Guy n={guyN} t={t} tr={tr} tSwap={t < 15.4 ? 15.05 : 15.72} tremble={guyN === 'ears' ? 0.6 : 0} />
      {bird}
      <Svg>
        <Poof x={TIP_OLD_D - 260} y={G - 70} t={t} />
        <Sparkle x={-108 - 20} y={NEW_TOP + 175 * S_NEW} r={26} s={bump(t, 13.36, 0.4)} rot={30 * t} />
        <Sparkle x={-108 - 140} y={NEW_TOP + 120 * S_NEW} r={18} s={bump(t, 13.45, 0.4)} rot={-30 * t} />
        <Mark x={RING_R + 120} y={G - 300} size={70} s={pop(t, 15.15, 0.2) * (1 - prog(t, 15.5, 15.62))} text="shhh" rot={-6} />
      </Svg>
    </>
  );
};

export const Scene: React.FC<{t: number; tr: number; cam: Cam; cover?: boolean}> = ({t, tr, cam, cover = false}) => {
  const shot = shotAt(t);
  return (
    <>
      <Backdrop cam={cam} />
      <World cam={cam}>
        <Svg>
          <Ground />
          {shot !== 'C' ? <Rails /> : null}
        </Svg>
        {shot === 'A' ? <ShotA t={t} tr={tr} cover={cover} /> : shot === 'B' ? <ShotB t={t} tr={tr} /> : shot === 'C' ? <ShotC t={t} tr={tr} /> : <ShotD t={t} tr={tr} />}
      </World>
    </>
  );
};

export const camFor = (t: number): Cam => {
  const shot = shotAt(t);
  return shot === 'B' ? camB(t) : camAt(t, KEYS[shot]);
};

export const KingfisherTrainShort: React.FC = () => {
  useKfFont();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const shot = shotAt(t);
  let cam = camFor(t);
  let amp = 0;
  if (shot === 'B') {
    amp += t > 6.0 && t < BOOM ? 4 * prog(t, 6.0, 7.9) : 0;
    amp += t > BOOM ? 30 * Math.exp(-5 * (t - BOOM)) : 0;
  }
  if (shot === 'D') amp += t > T.copied && t < 13.3 ? 5 * Math.exp(-6 * (t - T.copied)) : 0;
  const sh = shake(t, amp);
  cam = {x: cam.x - sh.x / cam.k, y: cam.y - sh.y / cam.k, k: cam.k};
  return (
    <AbsoluteFill style={{background: SKY}}>
      <Scene t={t} tr={t} cam={cam} />
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('kingfisher-train/vo/take1.mp3')} volume={Math.pow(10, MIX_DB / 20)} />
      </Sequence>
      <SoundCues cues={CUES.map((c) => ({...c, db: c.db + MIX_DB, keys: c.keys?.map(([a, b]) => [a, b + MIX_DB] as [number, number])}))} dir="kingfisher-train/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};
