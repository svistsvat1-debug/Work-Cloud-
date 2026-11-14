import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SPR} from './sprites';
import {CUT_A3, CUT_B, CUT_C, CUT_D, CUT_E, FPS, T, VO_AT} from './scene';
import {camAt, clamp, easeInCubic, easeInOutCubic, easeOutCubic, lerp, pop, prog, rnd, shake, spring, type Cam, type CamKey} from '../shared/anim';
import {World} from '../shared/World';
import {Eye} from '../shared/Face';
import {PuffCluster, type Puff} from '../shared/Puffs';
import {SweatDrop} from '../shared/SweatDrop';
import {SoundCues, type Cue} from '../shared/Sound';
import {useFont} from '../shared/useFont';

// "How did an owl fix Japan's bullet train?" - side-view railway in the countryside.
// A: the bullet train speeds off (speed gauge hits 300), the camera pushes in on the T-shaped arm on its roof, which
// opens its eyes and HOWLS. A3: down the line the train screams past a row of houses that squeeze their eyes shut; the
// guy covers his ears. B: the guy (engineer + birdwatcher) with binoculars; a thought bubble with an owl. C: at dusk an
// owl flies, a magnifier shows the comb teeth on the wing chopping the air into tiny curls; the owl glides down without
// a sound and steals a mouse's cheese. D: the guy snips teeth into the arm (poof -> jagged arm). E: the train glides
// back into frame 0's station, quiet: the houses relax and fall asleep, an owl rides on the roof: "shh".

const F = (n: string) => staticFile(`owl-pantograph/${n}.png`);
export const FONT = 'OwlInter';
export const useOwlFont = () => useFont(FONT, staticFile('fonts/Inter-Black.otf'));
const MIX_DB = 2.0;
const INK = '#000';
export const SKY = '#80C8FC';
const GRASS = '#AED663';
const GRASS_D = '#93BF4E';

// ---------- world layout ----------
export const G = 1000; // rail top / ground line
const RAIL_Y = G - 12; // train bottom
const S_T = 0.9; // train scale
const PS = 0.32; // roof arm scale
const HSC = 0.78; // houses scale
const HEAD = 72; // guy head radius (world)
const GUY_Y = G + 200; // guy feet (in front of the track)
const TIP0 = 700; // the train's stop in frame 0 / the last shot
export const CAM0: CamKey = {t: 0, x: 290, y: G - 215, k: 1.0};
const XH1 = 230; // frame-0 houses centre
const XH2 = 40000; // houses down the line (A3)
const XB = 80000; // the engineer
const XC = 120000; // the owl at dusk
const XD = 160000; // the workbench
const GUY0 = -110;

// ---------- small helpers ----------
const bump = (t: number, t0: number, dur = 0.22) => Math.sin(Math.PI * prog(t, t0, t0 + dur));
const breathe = (t: number, ph = 0) => 1 + 0.009 * Math.sin(2 * Math.PI * 0.6 * t + ph);
const squashSwap = (t: number, tSwap: number): [number, number] => {
  if (t < tSwap - 0.08) return [1, 1];
  if (t < tSwap) {
    const u = prog(t, tSwap - 0.08, tSwap);
    return [1 + 0.05 * u, 1 - 0.06 * u];
  }
  const s = spring(t - tSwap, 3.2, 7);
  return [1 - 0.035 * s, 1 + 0.04 * s];
};
const popOut = (t: number, t0: number, t1: number, dur = 0.25) => (t < t1 ? pop(t, t0, dur) : Math.max(0, 1 - easeInCubic(prog(t, t1, t1 + 0.2))));

type SprName = keyof typeof SPR;
const Spr: React.FC<{n: SprName; x: number; y: number; s: number; sx?: number; sy?: number; rot?: number; ax?: number; ay?: number; flip?: boolean}> = ({
  n,
  x,
  y,
  s,
  sx = 1,
  sy = 1,
  rot = 0,
  ax,
  ay,
  flip = false,
}) => {
  const sp = SPR[n] as unknown as {w: number; h: number; feet: [number, number]};
  const fx = ax ?? sp.feet[0];
  const fy = ay ?? sp.feet[1];
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg) scale(${sx * (flip ? -1 : 1)}, ${sy})`, transformOrigin: '0 0'}}>
      <Img src={F(n)} style={{position: 'absolute', left: -fx * s, top: -fy * s, width: sp.w * s, height: sp.h * s}} />
    </div>
  );
};
// local SVG canvas around a world point (world units)
const Svg: React.FC<{x: number; y: number; r?: number; children: React.ReactNode}> = ({x, y, r = 3000, children}) => (
  <svg style={{position: 'absolute', left: x - r, top: y - r, overflow: 'visible'}} width={2 * r} height={2 * r} viewBox={`${x - r} ${y - r} ${2 * r} ${2 * r}`}>
    {children}
  </svg>
);
const Shadow: React.FC<{x: number; y: number; w: number; o?: number}> = ({x, y, w, o = 0.26}) => (
  <div style={{position: 'absolute', left: x - w / 2, top: y - w * 0.07, width: w, height: w * 0.14, borderRadius: '50%', background: `rgba(72, 54, 42, ${o})`, filter: 'blur(3px)'}} />
);
const Mark: React.FC<{x: number; y: number; size: number; s: number; text: string; rot?: number; fill?: string}> = ({x, y, size, s, text, rot = 0, fill = '#fff'}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <text x={0} y={size * 0.35} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={size} fill={fill} stroke={INK} strokeWidth={size * 0.16} paintOrder="stroke" strokeLinejoin="round">
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

// ---------- backdrop: the generated plate (screen space, gentle parallax), its bottom on the ground line ----------
const PLATE_ROWS = 950;
const Backdrop: React.FC<{cam: Cam}> = ({cam}) => {
  const sp = clamp(0.95 + 0.3 * (cam.k - 0.75), 0.9, 1.45);
  const gy = 960 + (G - cam.y) * cam.k;
  const W = SPR.bg.w * sp;
  const ox = -((((cam.x * cam.k * 0.06) % (2 * W)) + 2 * W) % (2 * W));
  const tiles: number[] = [];
  for (let x = ox - 2 * W; x < 1080 + W; x += W) tiles.push(x);
  return (
    <div style={{position: 'absolute', left: 0, top: gy - PLATE_ROWS * sp + 4, width: 1080, height: PLATE_ROWS * sp, overflow: 'hidden'}}>
      {tiles.map((x, i) => {
        const n = Math.round((x - ox) / W);
        const flip = ((n % 2) + 2) % 2 === 1;
        return <Img key={i} src={F('bg')} style={{position: 'absolute', left: x, top: 0, width: W, height: SPR.bg.h * sp, transform: flip ? 'scaleX(-1)' : undefined}} />;
      })}
    </div>
  );
};

// ground + rails, only the visible stretch is generated (the camera travels far)
const RAIL_X0 = -3000;
const RAIL_X1 = 46000;
const Ground: React.FC<{cam: Cam}> = ({cam}) => {
  const x0 = cam.x - 560 / cam.k - 200;
  const x1 = cam.x + 560 / cam.k + 200;
  const y1 = cam.y + 980 / cam.k + 50;
  const tufts: React.ReactNode[] = [];
  for (let i = Math.floor(x0 / 170); i < x1 / 170; i++) {
    const x = i * 170 + 80 * rnd(i);
    const y = G + 60 + 520 * rnd(i * 3.7);
    tufts.push(<path key={i} d={`M ${x - 14} ${y} L ${x - 8} ${y - 18} L ${x - 2} ${y} L ${x + 4} ${y - 22} L ${x + 9} ${y} L ${x + 15} ${y - 15} L ${x + 18} ${y}`} fill="none" stroke="#5E8F2E" strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" />);
  }
  const rx0 = Math.max(x0, RAIL_X0);
  const rx1 = Math.min(x1, RAIL_X1);
  const sl: React.ReactNode[] = [];
  if (rx1 > rx0) for (let x = Math.floor(rx0 / 64) * 64; x < rx1; x += 64) sl.push(<rect key={x} x={x} y={G - 6} width={30} height={13} rx={3} fill="#6E5236" stroke={INK} strokeWidth={3} />);
  return (
    <Svg x={cam.x} y={cam.y} r={Math.max(1400, 1400 / cam.k)}>
      <rect x={x0} y={G - 2} width={x1 - x0} height={y1 - G + 2} fill={GRASS} />
      <rect x={x0} y={G - 2} width={x1 - x0} height={6} fill={GRASS_D} />
      {[XH1, XH2].map((hx) =>
        hx > x0 - 1400 && hx < x1 + 1400 ? (
          <path key={hx} d={`M ${hx - 900} ${G} C ${hx - 760} ${G - BERM} ${hx - 700} ${G - BERM - 6} ${hx - 560} ${G - BERM - 6} L ${hx + 560} ${G - BERM - 6} C ${hx + 700} ${G - BERM - 6} ${hx + 760} ${G - BERM} ${hx + 900} ${G} Z`} fill={GRASS_D} stroke={INK} strokeWidth={5} />
        ) : null,
      )}
      {tufts}
      {rx1 > rx0 ? (
        <g>
          <rect x={rx0} y={G - 4} width={rx1 - rx0} height={30} fill="#B9AFA4" stroke={INK} strokeWidth={3} />
          {sl}
          <rect x={rx0} y={G - 14} width={rx1 - rx0} height={9} fill="#8C8C8C" stroke={INK} strokeWidth={3} />
        </g>
      ) : null}
    </Svg>
  );
};

// ---------- houses (one sprite) with faces in the windows ----------
type HouseMood = {mode: 'open' | 'squeeze' | 'sleep'; look?: [number, number]; open?: number; shake?: number; smile?: number};
const Houses: React.FC<{x: number; m: HouseMood; t: number}> = ({x, m, t}) => {
  const sp = SPR.houses;
  const left = x - sp.feet[0] * HSC;
  const top = G - BERM - sp.feet[1] * HSC;
  return (
    <div style={{position: 'absolute', left, top, width: sp.w * HSC, height: sp.h * HSC}}>
      <div style={{position: 'absolute', left: 0, top: 0, width: sp.w, height: sp.h, transform: `scale(${HSC})`, transformOrigin: '0 0'}}>
        {sp.wins.map((w, i) => {
          const sh = (m.shake ?? 0) * Math.sin(2 * Math.PI * (11 + 2 * i) * t + i);
          const cx = (w[0] + w[2]) / 2;
          const cy = (w[1] + w[3]) / 2;
          // each house wobbles on its own: clip the sprite into three vertical bands at the gaps between houses
          const bands = [
            [0, 560],
            [560, 1010],
            [1010, sp.w],
          ][i];
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: bands[0],
                top: 0,
                width: bands[1] - bands[0],
                height: sp.h,
                overflow: 'hidden',
                transform: `translate(${sh * 4}px, 0) scale(${1 + 0.012 * Math.abs(sh)}, ${1 - 0.02 * Math.abs(sh)})`,
                transformOrigin: `${cx - bands[0]}px ${sp.feet[1]}px`,
              }}
            >
              <Img src={F('houses')} style={{position: 'absolute', left: -bands[0], top: 0, width: sp.w, height: sp.h}} />
              <svg style={{position: 'absolute', left: -bands[0], top: 0, overflow: 'visible'}} width={sp.w} height={sp.h}>
                <HouseFace cx={cx} cy={cy} y1={w[3]} m={m} t={t} i={i} />
              </svg>
            </div>
          );
        })}
      </div>
    </div>
  );
};
const HouseFace: React.FC<{cx: number; cy: number; y1: number; m: HouseMood; t: number; i: number}> = ({cx, cy, y1, m, t, i}) => {
  const r = 17;
  const op = m.open ?? 1;
  if (m.mode === 'sleep') {
    const br = 1 + 0.15 * Math.sin(2 * Math.PI * 0.7 * t + i);
    return (
      <g>
        {[-1, 1].map((s) => (
          <path key={s} d={`M ${cx + s * 22 - 13} ${cy} Q ${cx + s * 22} ${cy + 11} ${cx + s * 22 + 13} ${cy}`} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
        ))}
        <ellipse cx={cx} cy={y1 + 26} rx={7 * br} ry={9 * br} fill="#7A1F2B" stroke={INK} strokeWidth={4} />
      </g>
    );
  }
  const sq = m.mode === 'squeeze';
  const sm = m.smile ?? 0.6;
  return (
    <g>
      <Eye x={cx - 22} y={cy} r={r} open={op} look={m.look ?? [0, 0]} squeeze={sq} side={-1} brow={sq ? 0.9 : 0.55} browTilt={sq ? -1 : 0} ink={0.2} />
      <Eye x={cx + 22} y={cy} r={r} open={op} look={m.look ?? [0, 0]} squeeze={sq} side={1} brow={sq ? 0.9 : 0.55} browTilt={sq ? -1 : 0} ink={0.2} />
      {sq ? (
        <path
          d={`M ${cx - 24} ${y1 + 26} ${[...Array(6)].map((_, k) => `L ${cx - 24 + (k + 1) * 8} ${y1 + 26 + (k % 2 ? 6 : -6) * (1 + 0.3 * Math.sin(t * 40 + k))}`).join(' ')}`}
          fill="none"
          stroke={INK}
          strokeWidth={5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path d={`M ${cx - 16} ${y1 + 22} Q ${cx} ${y1 + 22 + 18 * sm} ${cx + 16} ${y1 + 22}`} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
      )}
    </g>
  );
};

// ---------- the roof arm (pantograph) with a code face ----------
type ArmFace = {eyes: number; squeeze?: boolean; mouth?: number; smile?: number; lid?: number; look?: [number, number]};
const ArmFaceSvg: React.FC<{f: ArmFace; t: number}> = ({f, t}) => {
  const mo = f.mouth ?? 0;
  const wob = 1 + 0.12 * Math.sin(2 * Math.PI * 9 * t);
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={SPR.panto0.w} height={SPR.panto0.h}>
      <Eye x={215} y={-22} r={44} open={f.eyes} squeeze={f.squeeze} side={-1} lid={f.lid ?? 0} look={f.look ?? [0, 0]} brow={f.squeeze ? 0.75 : 0.5} browTilt={f.squeeze ? -1 : 0} ink={0.18} />
      <Eye x={352} y={-22} r={44} open={f.eyes} squeeze={f.squeeze} side={1} lid={f.lid ?? 0} look={f.look ?? [0, 0]} brow={f.squeeze ? 0.75 : 0.5} browTilt={f.squeeze ? -1 : 0} ink={0.18} />
      {mo > 0.02 ? (
        <g transform={`translate(283 150) scale(${mo * wob}, ${mo})`}>
          <ellipse cx={0} cy={0} rx={52} ry={70} fill="#7A1F2B" stroke={INK} strokeWidth={10} />
          <ellipse cx={0} cy={38} rx={30} ry={20} fill="#FC8D90" />
        </g>
      ) : (f.smile ?? 0) > 0.01 ? (
        <path d={`M 246 128 Q 283 ${128 + 40 * (f.smile ?? 0)} 320 128`} fill="#fff" stroke={INK} strokeWidth={10} strokeLinecap="round" />
      ) : null}
    </svg>
  );
};
const Arm: React.FC<{x: number; y: number; s: number; jag: boolean; f: ArmFace; t: number; sx?: number; sy?: number}> = ({x, y, s, jag, f, t, sx = 1, sy = 1}) => {
  const n = jag ? 'panto1' : 'panto0';
  const sp = SPR[n];
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `scale(${sx}, ${sy})`, transformOrigin: '0 0'}}>
      <div style={{position: 'absolute', left: -sp.feet[0] * s, top: -sp.feet[1] * s, width: sp.w * s, height: sp.h * s}}>
        <div style={{position: 'absolute', left: 0, top: 0, width: sp.w, height: sp.h, transform: `scale(${s})`, transformOrigin: '0 0'}}>
          <Img src={F(n)} style={{position: 'absolute', left: 0, top: 0, width: sp.w, height: sp.h}} />
          <div style={{position: 'absolute', left: 0, top: jag ? 15 : 0}}>
            <ArmFaceSvg f={f} t={t} />
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------- the train: front car + 2 body cars, the arm on the roof, optional owl rider ----------
const trainLeft = (tip: number) => tip - SPR.train.right * S_T;
const TRAIN_TOP = RAIL_Y - SPR.train.feet[1] * S_T;
const ARM_NX = 560;
const BERM = 175; // houses sit on a grass berm behind the track so their faces show above the train // arm position along the front car (native px)
const armBase = (tip: number) => ({x: trainLeft(tip) + ARM_NX * S_T, y: TRAIN_TOP + 15 * S_T});
const CAR_X0 = 12;
const CAR_X1 = 960;
const CAR_W = (CAR_X1 - CAR_X0) * S_T;
const Train: React.FC<{tip: number; jag: boolean; f: ArmFace; t: number; owl?: number; armSy?: number}> = ({tip, jag, f, t, owl = 0, armSy = 1}) => {
  const left = trainLeft(tip);
  const frontLeft = left + SPR.train.left * S_T;
  const cars: React.ReactNode[] = [];
  for (let i = 0; i < 2; i++) {
    const right = frontLeft - 16 - i * (CAR_W + 16);
    cars.push(
      <React.Fragment key={i}>
        <div style={{position: 'absolute', left: right - 2, top: RAIL_Y - 190, width: 20, height: 150, background: '#4A4F57', border: '4px solid #000', boxSizing: 'border-box'}} />
        <div style={{position: 'absolute', left: right - CAR_W, top: TRAIN_TOP, width: CAR_W, height: SPR.train.h * S_T, overflow: 'hidden'}}>
          <Img src={F('train')} style={{position: 'absolute', left: -CAR_X0 * S_T, top: 0, width: SPR.train.w * S_T, height: SPR.train.h * S_T}} />
          <div style={{position: 'absolute', left: 0, top: 13 * S_T, width: 7, bottom: 13 * S_T, background: '#000'}} />
          <div style={{position: 'absolute', right: 0, top: 13 * S_T, width: 7, bottom: 13 * S_T, background: '#000'}} />
        </div>
      </React.Fragment>,
    );
  }
  const a = armBase(tip);
  return (
    <>
      {cars}
      <Img src={F('train')} style={{position: 'absolute', left, top: TRAIN_TOP, width: SPR.train.w * S_T, height: SPR.train.h * S_T}} />
      <Arm x={a.x} y={a.y} s={PS} jag={jag} f={f} t={t} sy={armSy} />
      {owl > 0.001 ? <Spr n="owlSit" x={left + 930 * S_T} y={TRAIN_TOP + 16 * S_T} s={0.27 * owl} sy={1} /> : null}
    </>
  );
};
// speed streaks around a moving train (world units, relative to the train)
const Streaks: React.FC<{tip: number; t: number; v: number; scale?: number}> = ({tip, t, v, scale = 1}) => {
  if (v < 200) return null;
  const o = clamp(v / 2500);
  const L: React.ReactNode[] = [];
  for (let i = 0; i < 9; i++) {
    const span = 3200;
    const x = tip + 500 - ((((t * 2200 + i * 397) % span) + span) % span);
    const y = TRAIN_TOP - 160 + 70 * i * (0.8 + 0.4 * rnd(i)) - (i > 4 ? -60 : 0);
    const len = (180 + 160 * rnd(i * 2.3)) * scale;
    L.push(<line key={i} x1={x} y1={y} x2={x + len} y2={y} stroke="#fff" strokeWidth={10 * scale} strokeLinecap="round" opacity={0.85 * o} />);
  }
  return <Svg x={tip} y={G}>{L}</Svg>;
};
// howl: sound arcs from the arm's mouth + wobbling "HOOO"
const Howl: React.FC<{x: number; y: number; t: number; a: number; s?: number}> = ({x, y, t, a, s = 1}) => {
  if (a <= 0.01) return null;
  const arcs: React.ReactNode[] = [];
  for (let i = 0; i < 4; i++) {
    const u = (t * 1.6 + i / 4) % 1;
    const r = (40 + 220 * u) * s;
    for (const side of [-1, 1]) {
      const a0 = (side === 1 ? -40 : 140) * (Math.PI / 180);
      const a1 = (side === 1 ? 40 : 220) * (Math.PI / 180);
      arcs.push(
        <path
          key={`${i}${side}`}
          d={`M ${x + r * Math.cos(a0)} ${y + r * Math.sin(a0)} A ${r} ${r} 0 0 1 ${x + r * Math.cos(a1)} ${y + r * Math.sin(a1)}`}
          fill="none"
          stroke={INK}
          strokeWidth={9 * s * (1 - u) * a + 1}
          strokeLinecap="round"
        />,
      );
    }
  }
  return <g>{arcs}</g>;
};

// ---------- guy poses ----------
type GuyPose = 'hero' | 'ears' | 'thumb' | 'scis';
const gsc = (n: GuyPose) => HEAD / SPR[n].head[2];
const Guy: React.FC<{n: GuyPose; x: number; y: number; sx?: number; sy?: number; dx?: number}> = ({n, x, y, sx = 1, sy = 1, dx = 0}) => (
  <>
    <Shadow x={x} y={y + 4} w={230} />
    <Spr n={n} x={x + dx} y={y} s={gsc(n)} sx={sx} sy={sy} />
  </>
);

// ---------- owl / mouse bits (shot C) ----------
const Mouse: React.FC<{x: number; y: number; t: number; nibble: number; q: number; look: number}> = ({x, y, t, nibble, q, look}) => {
  const hb = nibble * 5 * Math.sin(2 * Math.PI * 6 * t);
  return (
    <g transform={`translate(${x} ${y}) scale(1.5) translate(${-x} ${-y})`}>
      <path d={`M ${x + 50} ${y + 10} Q ${x + 120} ${y + 30} ${x + 110} ${y - 30} Q ${x + 104} ${y - 60} ${x + 135} ${y - 70}`} fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
      <path d={`M ${x + 50} ${y + 10} Q ${x + 120} ${y + 30} ${x + 110} ${y - 30} Q ${x + 104} ${y - 60} ${x + 135} ${y - 70}`} fill="none" stroke="#F2A3B4" strokeWidth={4} strokeLinecap="round" />
      <ellipse cx={x} cy={y} rx={62} ry={44} fill="#A7A7B3" stroke={INK} strokeWidth={7} />
      <g transform={`translate(${x - 52} ${y - 26 + hb}) rotate(${look * -18})`}>
        <circle cx={-6} cy={-34} r={20} fill="#F2A3B4" stroke={INK} strokeWidth={6} />
        <circle cx={22} cy={-30} r={18} fill="#F2A3B4" stroke={INK} strokeWidth={6} />
        <ellipse cx={0} cy={0} rx={36} ry={30} fill="#A7A7B3" stroke={INK} strokeWidth={7} />
        <circle cx={-32} cy={6} r={7} fill="#E46A7E" stroke={INK} strokeWidth={3} />
        <ellipse cx={-10 + 4 * look} cy={-6 - 4 * look} rx={6} ry={8} fill={INK} />
      </g>
      <Mark x={x - 40} y={y - 130} size={70} s={q} text="?" />
    </g>
  );
};
const Cheese: React.FC<{x: number; y: number; rot?: number}> = ({x, y, rot = 0}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(1.5)`}>
    <path d="M -34 18 L 34 18 L 30 -22 Z" fill="#FFD23F" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <circle cx={10} cy={4} r={6} fill="#E8B21E" />
    <circle cx={-10} cy={10} r={4} fill="#E8B21E" />
  </g>
);
// magnifier: a comb-edged feather chopping the air into tiny curls
const Magnifier: React.FC<{x: number; y: number; r: number; s: number; t: number; chop: number; tx: number; ty: number}> = ({x, y, r, s, t, chop, tx, ty}) => {
  if (s <= 0.001) return null;
  const id = 'magclip';
  const fx = -r * 0.1; // comb line (feather's front edge), air comes from the left
  const teeth: string[] = [];
  const N = 9;
  for (let i = 0; i <= N; i++) {
    const yy = -r + (2 * r * i) / N;
    teeth.push(`L ${fx} ${yy} L ${fx - 34} ${yy + r / N}`);
  }
  const lines: React.ReactNode[] = [];
  for (let i = 0; i < 5; i++) {
    const yy = -r * 0.72 + i * r * 0.36;
    const ph = (t * 1.2 + i * 0.37) % 1;
    // incoming smooth wave
    lines.push(
      <path
        key={`in${i}`}
        d={`M ${-r * 1.1} ${yy} Q ${-r * 0.8} ${yy - 22} ${-r * 0.55} ${yy} T ${fx - 40} ${yy}`}
        fill="none"
        stroke="#fff"
        strokeWidth={10}
        strokeLinecap="round"
        strokeDasharray="60 34"
        strokeDashoffset={-ph * 188}
      />,
    );
    // tiny curls behind the comb
    if (chop > 0.01) {
      for (let k = 0; k < 4; k++) {
        const u = (t * 0.9 + k / 4 + i * 0.13) % 1;
        const cx = fx + 30 + u * r * 1.1;
        const cr = 11 * chop * (1 - 0.6 * u);
        lines.push(
          <path
            key={`c${i}${k}`}
            d={`M ${cx - cr} ${yy} a ${cr} ${cr} 0 1 1 ${cr} ${cr} a ${cr * 0.5} ${cr * 0.5} 0 1 1 ${-cr * 0.5} ${-cr * 0.5}`}
            fill="none"
            stroke="#fff"
            strokeWidth={6}
            strokeLinecap="round"
            opacity={1 - u * 0.8}
          />,
        );
      }
    }
  }
  return (
    <g>
      <line x1={tx} y1={ty} x2={x - r * 0.7 * s} y2={y + r * 0.7 * s} stroke={INK} strokeWidth={6} strokeDasharray="14 12" opacity={s} />
      <g transform={`translate(${x} ${y}) scale(${s})`}>
        <defs>
          <clipPath id={id}>
            <circle cx={0} cy={0} r={r} />
          </clipPath>
        </defs>
        <circle cx={0} cy={0} r={r} fill="#6FA8DC" />
        <g clipPath={`url(#${id})`}>
          <path d={`M ${r * 1.2} ${-r * 1.2} L ${fx} ${-r * 1.2} L ${fx} ${-r} ${teeth.join(' ')} L ${fx} ${r * 1.2} L ${r * 1.2} ${r * 1.2} Z`} fill="#8A5530" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
          {[0.35, 0.6, 0.85].map((q) => (
            <line key={q} x1={fx + r * q} y1={-r * 1.2} x2={fx + r * q + 30} y2={r * 1.2} stroke="#6E4224" strokeWidth={8} />
          ))}
          {lines}
        </g>
        <circle cx={0} cy={0} r={r} fill="none" stroke={INK} strokeWidth={16} />
        <line x1={r * 0.72} y1={r * 0.72} x2={r * 1.25} y2={r * 1.25} stroke="#5A4A3A" strokeWidth={34} strokeLinecap="round" />
        <line x1={r * 0.72} y1={r * 0.72} x2={r * 1.25} y2={r * 1.25} stroke={INK} strokeWidth={34} strokeLinecap="round" strokeOpacity={0} />
      </g>
    </g>
  );
};

// ---------- train timing ----------
const VMAX = 3200;
const T_GO = 0.3;
const T_TOP = 2.0;
const ACC = VMAX / (T_TOP - T_GO);
const tipA = (t: number) => {
  if (t < T_GO) return TIP0;
  if (t < T_TOP) return TIP0 + 0.5 * ACC * (t - T_GO) ** 2;
  return TIP0 + 0.5 * ACC * (T_TOP - T_GO) ** 2 + VMAX * (t - T_TOP);
};
const vA = (t: number) => (t < T_GO ? 0 : t < T_TOP ? ACC * (t - T_GO) : VMAX);
const tipA3 = (t: number) => XH2 - 1900 + 1900 * (t - CUT_A3);
const T_STOP = 21.3;
const tipE = (t: number) => TIP0 - 3400 * (1 - easeOutCubic(prog(t, CUT_E, T_STOP)));
const vE = (t: number) => (t > T_STOP ? 0 : (3400 * 3 * (1 - prog(t, CUT_E, T_STOP)) ** 2) / (T_STOP - CUT_E));

// ---------- cameras ----------
type Shot = 'A' | 'A3' | 'B' | 'C' | 'D' | 'E';
const shotAt = (t: number): Shot => (t < CUT_A3 ? 'A' : t < CUT_B ? 'A3' : t < CUT_C ? 'B' : t < CUT_D ? 'C' : t < CUT_E ? 'D' : 'E');
const mix = (a: Cam, b: Cam, u: number): Cam => ({x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), k: Math.exp(lerp(Math.log(a.k), Math.log(b.k), u))});
const camFor = (t: number): Cam => {
  const s = shotAt(t);
  if (s === 'A') {
    const tip = tipA(t);
    const follow: Cam = {x: CAM0.x + (tip - TIP0), y: CAM0.y + 10 * easeInOutCubic(prog(t, 0, 1)), k: CAM0.k * (1 + 0.02 * easeInOutCubic(prog(t, 0, 1.4)))};
    const a = armBase(tip);
    const close: Cam = {x: a.x + 30, y: a.y - 110, k: 2.25 + 0.15 * prog(t, 4.9, CUT_A3)};
    return mix(follow, close, easeInOutCubic(prog(t, 3.9, 4.85)));
  }
  if (s === 'A3') return camAt(t, [{t: CUT_A3, x: XH2 - 170, y: G - 250, k: 0.9}, {t: CUT_B, x: XH2 - 140, y: G - 255, k: 0.95}]);
  if (s === 'B')
    return camAt(t, [
      {t: CUT_B, x: XB + 120, y: G - 210, k: 1.28},
      {t: 12.4, x: XB + 130, y: G - 215, k: 1.32},
      {t: 13.5, x: XB + 260, y: G - 420, k: 1.6},
      {t: CUT_C, x: XB + 262, y: G - 424, k: 1.61},
    ]);
  if (s === 'C')
    return camAt(t, [
      {t: CUT_C, x: XC + 40, y: G - 540, k: 1.08},
      {t: 15.9, x: XC + 50, y: G - 545, k: 1.14},
      {t: 16.75, x: XC + 330, y: G - 200, k: 0.74},
      {t: CUT_D, x: XC + 350, y: G - 200, k: 0.75},
    ]);
  if (s === 'D') return camAt(t, [{t: CUT_D, x: XD + 20, y: G - 200, k: 1.02}, {t: CUT_E, x: XD + 40, y: G - 205, k: 1.1}]);
  return camAt(t, [{t: CUT_E, x: CAM0.x, y: CAM0.y + 10, k: CAM0.k * 1.02}, {t: 22.6, x: CAM0.x, y: CAM0.y + 10, k: CAM0.k * 1.02}]);
};

// ---------- sounds (ElevenLabs: 4 new for this video + reused ones from sfx-library) ----------
const CUES: Cue[] = [
  {f: 'train', at: 0.3, db: -24},
  {f: 'pop', at: 1.5, db: -26, rate: 1.1},
  {f: 'whoosh', at: 1.72, db: -26, rate: 0.9},
  {f: 'pop', at: T.n300, db: -22, rate: 1.4},
  {f: 'whoosh', at: 3.92, db: -30, rate: 1.4},
  {f: 'pop', at: T.arm, db: -24, rate: 1.2},
  {f: 'howl', at: T.howled - 0.04, db: -17, keys: [[5.42, -26], [5.7, -15], [6.6, -18], [6.75, -24], [7.0, -17], [8.0, -19], [8.25, -40]]},
  {f: 'train', at: 6.82, db: -20},
  {f: 'pop', at: T.engineer, db: -24, rate: 1.0},
  {f: 'pop', at: T.eiji, db: -27, rate: 1.2},
  {f: 'pop', at: T.birdwatcher, db: -24, rate: 1.35},
  {f: 'pop', at: 12.3, db: -28, rate: 1.5},
  {f: 'pop', at: 12.44, db: -28, rate: 1.7},
  {f: 'pop', at: T.owls, db: -22, rate: 0.9},
  {f: 'hoot', at: 13.14, db: -16},
  {f: 'pop', at: T.combs, db: -24, rate: 1.1},
  {f: 'pop', at: 15.24, db: -32, rate: 1.9},
  {f: 'pop', at: 15.36, db: -32, rate: 2.1},
  {f: 'pop', at: 15.48, db: -32, rate: 1.8},
  {f: 'whoosh', at: 17.0, db: -40, rate: 0.6},
  {f: 'pop', at: 18.0, db: -24, rate: 1.3},
  {f: 'snip', at: 18.78, db: -16},
  {f: 'snip', at: 19.24, db: -17, rate: 1.1},
  {f: 'pop', at: 19.62, db: -14, rate: 0.7},
  {f: 'pop', at: 20.0, db: -26, rate: 1.5},
  {f: 'train', at: 20.08, db: -30, rate: 0.9},
  {f: 'snore', at: 21.45, db: -27, dur: 1.1},
  {f: 'pop', at: T.owl, db: -28, rate: 1.3},
];

// ---------- the scene ----------
export const Scene: React.FC<{t: number; cam: Cam; cover?: boolean}> = ({t, cam, cover = false}) => {
  const shot = shotAt(t);
  const blur = 0;
  const night = shot === 'C' ? 1 : 0;
  // ---- A: the train speeds off, the arm comes alive and howls
  let train: React.ReactNode = null;
  let effects: React.ReactNode = null;
  let actors: React.ReactNode = null;
  let overlay: React.ReactNode = null;
  if (shot === 'A') {
    const tip = tipA(t);
    const v = vA(t);
    const a = armBase(tip);
    const eyes = pop(t, T.arm, 0.3);
    const howl = prog(t, T.howled, T.howled + 0.15);
    const f: ArmFace = {eyes, squeeze: t > T.howled + 0.05, mouth: howl, look: [-0.3, 0]};
    const bodyBob = howl > 0 ? 1 + 0.03 * Math.sin(2 * Math.PI * 7 * t) : 1 + 0.06 * bump(t, T.arm, 0.3);
    train = (
      <>
        <Houses x={XH1} m={{mode: 'open', look: [0.5, 0.3], smile: 0.7}} t={t} />
        <Train tip={tip} jag={false} f={f} t={t} armSy={bodyBob} />
      </>
    );
    const mouth = {x: a.x, y: a.y - (749 - 150) * PS * bodyBob};
    effects = (
      <>
        <Streaks tip={tip} t={t} v={v} />
        <Svg x={a.x} y={a.y}>
          <Howl x={mouth.x} y={mouth.y} t={t} a={howl} s={0.55} />
          <Mark x={mouth.x + 20} y={mouth.y - 270} size={64} s={popOut(t, 5.62, 9)} rot={-10 + 4 * Math.sin(t * 30)} text="HOOOO" />
        </Svg>
      </>
    );
    actors = <Guy n="hero" x={GUY0} y={GUY_Y} sy={breathe(t)} />;
    // speed gauge (screen space)
    const gs = popOut(t, 1.45, 3.9, 0.3);
    const ang = -120 + 240 * clamp(v / VMAX) + 3 * Math.sin(t * 40) * clamp(v / VMAX);
    const show300 = pop(t, T.n300, 0.3);
    overlay =
      gs > 0.001 ? (
        <g transform={`translate(540 360) scale(${gs})`}>
          <circle r={190} fill="#fff" stroke={INK} strokeWidth={14} />
          {[...Array(9)].map((_, i) => {
            const aa = ((-120 + i * 30 - 90) * Math.PI) / 180;
            return <line key={i} x1={150 * Math.cos(aa)} y1={150 * Math.sin(aa)} x2={175 * Math.cos(aa)} y2={175 * Math.sin(aa)} stroke={INK} strokeWidth={9} strokeLinecap="round" />;
          })}
          <g transform={`rotate(${ang})`}>
            <path d="M -14 0 L 0 -150 L 14 0 Z" fill="#E8432F" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
          </g>
          <circle r={24} fill={INK} />
          <Mark x={0} y={92} size={86} s={show300} text="300" fill="#FFD23F" />
          <Mark x={0} y={160} size={40} s={show300} text="KM/H" />
        </g>
      ) : null;
  }
  // ---- A3: the train screams past the houses down the line
  if (shot === 'A3') {
    const tip = tipA3(t);
    const near = t > T.too - 0.05;
    const f: ArmFace = {eyes: 1, squeeze: true, mouth: 1, look: [-0.3, 0]};
    const a = armBase(tip);
    const sh = near ? 1 - 0.6 * prog(t, 8.4, CUT_B) : 0;
    train = (
      <>
        {cover ? null : <Houses x={XH2} m={near ? {mode: 'squeeze', shake: sh} : {mode: 'open', look: [-0.8, 0.2], smile: 0.4}} t={t} />}
        <Train tip={tip} jag={false} f={f} t={t} armSy={1 + 0.03 * Math.sin(2 * Math.PI * 7 * t)} />
      </>
    );
    effects = (
      <>
        <Streaks tip={tip} t={t} v={1900} />
        <Svg x={a.x} y={a.y}>
          <Howl x={a.x} y={a.y - (749 - 150) * PS} t={t} a={1} s={1.2} />
        </Svg>
      </>
    );
    const ss = squashSwap(t, CUT_A3 + 0.12);
    const trem = near ? 3 * Math.sin(2 * Math.PI * 13 * t) : 0;
    actors = (
      <>
        <Guy n="ears" x={XH2 - 430} y={GUY_Y} sx={ss[0]} sy={ss[1] * (1 + 0.015 * Math.sin(2 * Math.PI * 9 * t))} dx={trem} />
        <Svg x={XH2 - 430} y={GUY_Y}>
          <SweatDrop x={XH2 - 430 + 80} y={GUY_Y - 300 + 40 * prog(t, 7.2, 8.6)} r={16} s={t > 7.2 ? popOut(t, 7.2, 8.6) : 0} />
        </Svg>
      </>
    );
  }
  // ---- B: the engineer and birdwatcher thinks of owls
  if (shot === 'B') {
    const bb = bump(t, T.birdwatcher, 0.3);
    const tl = popOut(t, T.engineer, 12.3);
    const nl = popOut(t, T.eiji, 12.3);
    const bl = popOut(t, T.birdwatcher, 12.3);
    const gx = XB - 40;
    actors = (
      <>
        <Guy n="hero" x={gx} y={GUY_Y - 100} sy={breathe(t) * (1 + 0.05 * bb)} sx={1 - 0.03 * bb} />
        <Svg x={XB} y={G}>
          {/* little birds across the sky on "birdwatcher" */}
          {[0, 1, 2].map((i) => {
            const u = prog(t, T.birdwatcher - 0.1 + i * 0.12, 12.9 + i * 0.12);
            if (u <= 0 || u >= 1) return null;
            const x = XB + 160 + 420 * u + 40 * i;
            const y = G - 520 - 70 * i - 60 * u + 12 * Math.sin(t * 9 + i);
            const w = 16 * Math.sin(2 * Math.PI * 3 * t + i);
            return <path key={i} d={`M ${x - 26} ${y + w} Q ${x - 13} ${y - 10} ${x} ${y} Q ${x + 13} ${y - 10} ${x + 26} ${y + w}`} fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />;
          })}
          {/* thought bubble */}
          <circle cx={gx + 150} cy={G - 330} r={18 * pop(t, T.thought, 0.2)} fill="#fff" stroke={INK} strokeWidth={6} />
          <circle cx={gx + 205} cy={G - 420} r={28 * pop(t, 12.4, 0.2)} fill="#fff" stroke={INK} strokeWidth={6} />
          {(() => {
            const s = pop(t, T.owls, 0.3);
            if (s <= 0.001) return null;
            const cx = gx + 330;
            const cy = G - 640;
            const P: Puff[] = [
              {x: 0, y: 0, r: 150},
              {x: -130, y: 40, r: 95},
              {x: 130, y: 40, r: 95},
              {x: -95, y: -95, r: 95},
              {x: 95, y: -95, r: 95},
              {x: 0, y: 120, r: 95},
              {x: -150, y: -20, r: 80},
              {x: 150, y: -20, r: 80},
            ].map((p) => ({x: cx + p.x * s, y: cy + p.y * s, r: p.r * s}));
            return <PuffCluster puffs={P} fill="#fff" ink={7} />;
          })()}
        </Svg>
        {(() => {
          const s = pop(t, T.owls + 0.08, 0.3);
          if (s <= 0.001) return null;
          return <Spr n="owlSit" x={gx + 330} y={G - 640 + 120} s={0.42 * s} rot={4 * Math.sin(2 * Math.PI * 0.8 * t)} />;
        })()}
      </>
    );
    overlay = (
      <g>
        <Mark x={540} y={240} size={58} s={tl} text="ENGINEER" fill="#FFD23F" />
        <Mark x={540} y={330} size={92} s={nl} text="EIJI NAKATSU" />
        <Mark x={540} y={430} size={58} s={bl} rot={-3} text="+ BIRDWATCHER" fill="#8FD3FF" />
      </g>
    );
  }
  // ---- C: the owl at dusk; comb teeth chop the air; a silent swoop steals the cheese
  if (shot === 'C') {
    const P0 = {x: XC - 180, y: G - 260};
    const P1 = {x: XC + 225, y: G + 196};
    const P2 = {x: XC + 1500, y: G - 520};
    const t1 = 16.2;
    const t2 = 17.45;
    const t3 = 18.5;
    let ox = P0.x;
    let oy = P0.y + 14 * Math.sin(2 * Math.PI * 0.9 * t);
    let rot = 3 * Math.sin(2 * Math.PI * 0.9 * t + 1);
    if (t > t1 && t <= t2) {
      const u = prog(t, t1, t2);
      ox = lerp(P0.x, P1.x, easeInOutCubic(u));
      oy = lerp(P0.y, P1.y, easeInCubic(u) * 0.7 + 0.3 * u * u);
      rot = 12 * Math.sin(Math.PI * u);
    } else if (t > t2) {
      const u = prog(t, t2, t3);
      ox = lerp(P1.x, P2.x, u);
      oy = lerp(P1.y, P2.y, easeOutCubic(u));
      rot = -16 * Math.sin(Math.PI * Math.min(1, u * 1.4));
    }
    const os = lerp(0.75, 0.42, easeInOutCubic(prog(t, 16.0, 16.9)));
    const grabbed = t > t2;
    const fp = {x: ox, y: oy};
    const ms = popOut(t, T.combs, 15.95, 0.3);
    const wing = {x: ox + (285 - 255) * os, y: oy + (240 - 700) * os};
    actors = (
      <>
        <Svg x={XC} y={G}>
          <circle cx={XC + 1250} cy={G - 1250} r={95} fill="#FFF4C2" stroke={INK} strokeWidth={8} />
          <Mouse x={XC + 430} y={G + 200} t={t} nibble={grabbed ? 0 : 1} q={t > 17.95 ? pop(t, 17.95, 0.3) : 0} look={grabbed ? easeOutCubic(prog(t, 17.6, 17.9)) : 0} />
          {!grabbed ? <Cheese x={P1.x + 5} y={P1.y + 6} /> : null}
          <ellipse cx={ox} cy={G + 210} rx={90 * os} ry={14 * os} fill="rgba(0,0,0,0.18)" opacity={t > t1 ? 1 : 0} />
        </Svg>
        <Spr n="owlFly" x={ox} y={oy} s={os} rot={rot} />
        <Svg x={XC} y={G}>
          {grabbed ? <Cheese x={fp.x + 2} y={fp.y + 4} rot={rot} /> : null}
          <Magnifier x={XC + 255} y={G - 830} r={190} s={ms} t={t} chop={pop(t, T.chop, 0.3)} tx={wing.x} ty={wing.y} />
          <Mark x={XC + 255} y={G - 1080} size={52} s={popOut(t, T.chop + 0.05, 15.95)} text="CHOP" fill="#FFD23F" />
          <Mark x={P1.x - 20} y={G - 60} size={46} s={t > 16.9 && t < 18.0 ? popOut(t, 16.95, 17.9) : 0} rot={-4} text="..." />
        </Svg>
      </>
    );
  }
  // ---- D: the guy snips teeth into the arm
  if (shot === 'D') {
    const jag = t > 19.72;
    const hop = bump(t, T.copied - 0.04, 0.26) + bump(t, T.jagged - 0.02, 0.26);
    const ax = XD + 220;
    const ay = G + 150;
    const PB = 0.72;
    const ss = squashSwap(t, 19.72);
    const ps = clamp(prog(t, 19.5, 19.7)) * (1 - easeInCubic(prog(t, 19.75, 20.05)));
    const tri: React.ReactNode[] = [];
    [18.8, 19.26].forEach((t0, j) => {
      for (let i = 0; i < 5; i++) {
        const dt = t - t0;
        if (dt < 0 || dt > 0.8) continue;
        const x0 = ax + 14;
        const y0 = ay - 220 - 70 * i - 80 * j;
        const vx = 260 + 180 * rnd(i + j * 7);
        const vy = -260 - 120 * rnd(i * 3 + j);
        const x = x0 + vx * dt;
        const y = y0 + vy * dt + 0.5 * 2400 * dt * dt;
        tri.push(<path key={`${j}${i}`} transform={`translate(${x} ${y}) rotate(${dt * 720 * (i % 2 ? 1 : -1)})`} d="M -14 -12 L 16 0 L -14 12 Z" fill="#C9C9C9" stroke={INK} strokeWidth={5} strokeLinejoin="round" />);
      }
    });
    actors = (
      <>
        <Guy n="scis" x={XD - 290 + 30 * prog(t, T.copied, 19.4)} y={ay} sy={breathe(t) * (1 + 0.05 * hop)} sx={1 - 0.03 * hop} />
        <Shadow x={ax} y={ay + 4} w={260} />
        <Arm x={ax} y={ay} s={PB} jag={jag} f={{eyes: 1, look: [-0.6, 0.2], smile: jag ? 0.9 : 0, mouth: jag ? 0 : 0.35 + 0.1 * Math.sin(t * 20), squeeze: !jag && hop > 0.2}} t={t} sx={ss[0]} sy={ss[1]} />
        <Svg x={XD} y={G}>
          {tri}
          {ps > 0.001 ? (
            <PuffCluster
              puffs={[{x: ax, y: ay - 280, r: 190 * ps}, ...[...Array(9)].map((_, i) => {
                const aa = (i / 9) * 2 * Math.PI;
                return {x: ax + 150 * Math.cos(aa) * ps, y: ay - 280 + 220 * Math.sin(aa) * ps, r: (120 + 30 * rnd(i)) * ps};
              })]}
              fill="#fff"
              ink={7}
            />
          ) : null}
          <Sparkle x={ax + 140} y={ay - 470} r={40} s={popOut(t, 19.98, 21)} rot={t * 90} />
          <Sparkle x={ax - 160} y={ay - 330} r={28} s={popOut(t, 20.02, 21)} rot={-t * 90} />
        </Svg>
      </>
    );
  }
  // ---- E: back at the station: quiet. The houses relax and fall asleep, an owl rides on the roof
  if (shot === 'E') {
    const tip = tipE(t);
    const mood: HouseMood =
      t < T.quiet - 0.1 ? {mode: 'squeeze', shake: 0.25} : t < 21.45 ? {mode: 'open', look: [0.2, 0.5], smile: 0.2, open: 1} : {mode: 'sleep'};
    const owlHop = bump(t, T.owl - 0.05, 0.3);
    const a = armBase(tip);
    train = (
      <>
        <Houses x={XH1} m={mood} t={t} />
        <Train tip={tip} jag f={{eyes: 1, smile: 0.8, lid: 0.35, look: [0.2, 0.2]}} t={t} owl={1 + 0.08 * owlHop} />
      </>
    );
    const v = vE(t);
    effects = (
      <>
        <Streaks tip={tip} t={t} v={v} scale={0.8} />
        <Svg x={a.x} y={a.y}>
          {[0, 1, 2].map((i) => {
            const u = ((t - 21.45) * 0.55 + i / 3) % 1;
            if (t < 21.45) return null;
            return <Mark key={i} x={XH1 + 120 + 90 * u + 20 * i} y={G - 640 - 260 * u} size={60 + 34 * u} s={Math.sin(Math.PI * u)} text="z" fill="#fff" />;
          })}
          <Mark x={trainLeft(tip) + 930 * S_T + 10} y={TRAIN_TOP - 200} size={80} s={pop(t, T.owl, 0.3)} rot={-6} text="shh" />
        </Svg>
      </>
    );
    const sw = squashSwap(t, T.quiet);
    actors = <Guy n={t < T.quiet ? 'ears' : 'thumb'} x={GUY0} y={GUY_Y} sx={sw[0]} sy={sw[1] * breathe(t)} />;
  }
  return (
    <>
      <Backdrop cam={cam} />
      <World cam={cam} blur={blur}>
        <Ground cam={cam} />
        {train}
        {effects}
      </World>
      {night ? <AbsoluteFill style={{background: 'rgba(22, 30, 92, 0.48)'}} /> : null}
      <World cam={cam}>{actors}</World>
      {overlay ? (
        <AbsoluteFill>
          <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', left: 0, top: 0}}>
            {overlay}
          </svg>
        </AbsoluteFill>
      ) : null}
    </>
  );
};

export const OwlPantographShort: React.FC = () => {
  useOwlFont();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const shot = shotAt(t);
  let cam = camFor(t);
  let amp = 0;
  if (shot === 'A') amp += t > T.howled ? 5 * prog(t, T.howled, T.howled + 0.3) : 0;
  if (shot === 'A3') amp += t > T.too ? 7 * (1 - prog(t, 8.3, CUT_B)) : 0;
  if (shot === 'D') amp += t > 19.62 ? 8 * Math.exp(-7 * (t - 19.62)) : 0;
  const sh = shake(t, amp);
  cam = {x: cam.x - sh.x / cam.k, y: cam.y - sh.y / cam.k, k: cam.k};
  return (
    <AbsoluteFill style={{background: SKY}}>
      <Scene t={t} cam={cam} />
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('owl-pantograph/vo/take1.mp3')} volume={Math.pow(10, MIX_DB / 20)} />
      </Sequence>
      <SoundCues cues={CUES.map((c) => ({...c, db: c.db + MIX_DB, keys: c.keys?.map(([a, b]) => [a, b + MIX_DB] as [number, number])}))} dir="owl-pantograph/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};
export {camFor, shotAt};
