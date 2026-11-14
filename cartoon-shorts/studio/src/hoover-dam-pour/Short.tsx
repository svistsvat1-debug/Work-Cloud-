import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SPR} from './sprites';
import {FPS, T, VO_AT} from './scene';
import {along, camAt, clamp, easeInCubic, easeInOutCubic, easeOutBack, easeOutCubic, lerp, pop, prog, rnd, shake, spring, type Cam, type CamKey} from '../shared/anim';
import {World} from '../shared/World';
import {Eye} from '../shared/Face';
import {PuffCluster, type Puff} from '../shared/Puffs';
import {SweatDrop} from '../shared/SweatDrop';
import {SoundCues, type Cue} from '../shared/Sound';
import {useFont} from '../shared/useFont';

// "Why didn't they just pour the Hoover Dam in one go?" - front view of a desert canyon (school diagram).
// A mixer truck pours the whole canyon full in one glorp; the concrete gets a face, heats up red, a thermometer pops;
// a counter runs to 125 YEARS while the guy grows a beard; the block cracks. Rewind poof: the dam rises in blocks,
// ice cubes ride pipes through it, and the pipe turns out to come from a giant fridge that tosses the guy a cold can.

const F = (n: string) => staticFile(`hoover-dam-pour/${n}.png`);
export const FONT = 'HooverInter';
export const useHdFont = () => useFont(FONT, staticFile('fonts/Inter-Black.otf'));
const MIX_DB = 1.5;
const INK = '#000';
const SKY = '#A9D8F2';

// ---------- world (walls native px x WS = world units) ----------
const WS = 1.15;
const WALLS = SPR.walls;
export const RIM = 9; // cliff tops
export const CREST = 126; // the dam's top
const FLOOR = 805; // bottom of the U gap
const PROF = WALLS.prof.map(([y, a, b]) => [y * WS, a * WS, b * WS] as [number, number, number]);
const gapAt = (y: number): [number, number] => {
  if (y <= PROF[0][0]) return [PROF[0][1], PROF[0][2]];
  for (let i = 1; i < PROF.length; i++) {
    if (y < PROF[i][0]) {
      const u = (y - PROF[i - 1][0]) / (PROF[i][0] - PROF[i - 1][0]);
      return [lerp(PROF[i - 1][1], PROF[i][1], u), lerp(PROF[i - 1][2], PROF[i][2], u)];
    }
  }
  const l = PROF[PROF.length - 1];
  return [l[1], l[2]];
};
export const XC = (gapAt(CREST)[0] + gapAt(CREST)[1]) / 2;
const DAM_L = gapAt(CREST)[0] - 70;
const DAM_R = gapAt(CREST)[1] + 70;
const DAM_B = FLOOR + 60;

// characters + props
const HEAD_R = 82;
type Pose = 'hero' | 'shock' | 'bored' | 'cheer' | 'drink';
// head discs (largest inscribed disc of the filled silhouette, prep qa/heads.png); shock's hands widen its disc -> bored's radius
const HEADS: Record<Pose, [number, number, number]> = {
  hero: [318, 307, 285.9],
  shock: [222, 204, 188],
  bored: [223, 199, 187.5],
  cheer: [273, 173, 156.4],
  drink: [175, 167, 153.6],
};
const sc = (n: Pose) => HEAD_R / HEADS[n][2];
export const GX = 1815; // the guy's feet (right rim), mirrored to face left
const TS = 0.36; // truck
const TX0 = 1200 - 1440 * TS; // the chute mouth (native 1440, 445) sits just over the gap
const TY0 = RIM - SPR.truck.wheel * TS;
const MOUTH = {x: TX0 + 1440 * TS, y: TY0 + 445 * TS};
const FRS = 0.27; // fridge: it drops onto the dam's crest road once the top row of blocks is in
const FRX = XC;
const FR_Y = CREST - 26;
const FR_H = SPR.fridge.feet[1] * FRS;
const FR_LAND = 12.0;

// ---------- cameras ----------
export const CAM0: CamKey = {t: 0, x: 1370, y: 250, k: 0.98};
const KEYS: CamKey[] = [
  CAM0,
  {t: 2.2, x: 1430, y: 320, k: 1.08},
  {t: 3.1, x: 1430, y: 320, k: 1.08},
  {t: 3.75, x: 1418, y: 300, k: 1.38},
  {t: 5.2, x: 1418, y: 296, k: 1.42},
  {t: 5.95, x: 1440, y: 240, k: 0.95, ease: 'io'},
  {t: 9.55, x: 1440, y: 250, k: 0.99},
  {t: 9.9, x: 1410, y: 262, k: 1.05, ease: 'out'},
  {t: 10.5, x: 1410, y: 262, k: 1.05},
  {t: 11.0, x: 1418, y: 380, k: 1.1},
  {t: 12.55, x: 1424, y: 384, k: 1.12},
  {t: 13.35, x: 1450, y: 420, k: 1.45},
  {t: 14.25, x: 1452, y: 424, k: 1.48},
  {t: 15.0, x: 1420, y: 300, k: 0.95},
  {t: 15.42, x: 1424, y: 296, k: 0.96},
  {t: 16.2, x: 1560, y: 80, k: 1.2},
  {t: 17.0, x: 1562, y: 84, k: 1.23},
];
export const camFor = (t: number): Cam => camAt(t, KEYS);

// ---------- sounds (ElevenLabs: 2 new for this video + reused ones from sfx-library) ----------
const CUES: Cue[] = [
  {f: 'mixer', at: 0.0, db: -26, keys: [[0, -26], [1.85, -23], [2.55, -23], [2.95, -45]], dur: 3.0},
  {f: 'lava_glop', at: 0.12, db: -27},
  {f: 'lava_glop', at: 1.96, db: -17, rate: 0.8},
  {f: 'boing', at: 2.68, db: -22, rate: 0.75},
  {f: 'pop', at: 3.26, db: -24},
  {f: 'pop', at: 3.52, db: -27, rate: 1.3},
  {f: 'sizzle', at: 3.62, db: -27, keys: [[3.62, -30], [4.4, -25], [5.5, -36]], dur: 2.0},
  {f: 'pop', at: 4.86, db: -15, rate: 0.75},
  {f: 'ticks', at: 6.62, db: -25, keys: [[6.62, -25], [8.2, -25], [8.5, -40]], dur: 1.9},
  {f: 'rock_crack', at: 9.6, db: -13},
  {f: 'crack', at: 9.68, db: -19},
  {f: 'boom_low', at: 10.32, db: -19, rate: 1.25},
  {f: 'whoosh', at: 10.44, db: -21, rate: 0.7},
  {f: 'ticks', at: 10.5, db: -29, rate: 1.6, dur: 0.3},
  ...[0, 1, 2, 3, 4, 5].map((r) => ({f: 'pop', at: 10.98 + r * 0.14, db: -24, rate: 0.85 + r * 0.11})),
  {f: 'boom_low', at: FR_LAND, db: -24, rate: 1.6},
  {f: 'bubbles', at: 12.05, db: -26, keys: [[12.05, -28], [13.4, -26], [14.0, -38]], dur: 2.0},
  {f: 'clink', at: 12.36, db: -21},
  {f: 'clink', at: 12.82, db: -23, rate: 1.2},
  {f: 'freeze', at: 13.22, db: -21},
  {f: 'clink', at: 13.52, db: -23, rate: 0.9},
  {f: 'hum', at: 14.3, db: -33, keys: [[14.3, -40], [14.8, -33], [16.4, -33], [16.9, -50]], dur: 2.25},
  {f: 'pop', at: 14.55, db: -24, rate: 1.1},
  {f: 'whoosh', at: 15.05, db: -28, rate: 1.5},
  {f: 'catch', at: 15.68, db: -20},
  {f: 'can', at: 15.84, db: -18},
  {f: 'gulp', at: 16.24, db: -16},
  {f: 'gulp', at: 16.58, db: -18, rate: 1.1},
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
const mixHex = (a: string, b: string, u: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i], clamp(u)))).join(',')})`;
};

type SprName = keyof typeof SPR;
const Spr: React.FC<{n: SprName; x: number; y: number; s: number; sx?: number; sy?: number; rot?: number; ax?: number; ay?: number; children?: React.ReactNode}> = ({
  n,
  x,
  y,
  s,
  sx = 1,
  sy = 1,
  rot = 0,
  ax,
  ay,
  children,
}) => {
  const sp = SPR[n] as unknown as {w: number; h: number; feet: [number, number]};
  const fx = ax ?? sp.feet[0];
  const fy = ay ?? sp.feet[1];
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg) scale(${sx}, ${sy})`, transformOrigin: '0 0'}}>
      <Img src={F(n)} style={{position: 'absolute', left: -fx * s, top: -fy * s, width: sp.w * s, height: sp.h * s}} />
      {children ? (
        <svg style={{position: 'absolute', left: -fx * s, top: -fy * s, overflow: 'visible'}} width={sp.w * s} height={sp.h * s} viewBox={`0 0 ${sp.w} ${sp.h}`}>
          {children}
        </svg>
      ) : null}
    </div>
  );
};
const Svg: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg style={{position: 'absolute', left: -3000, top: -3000, overflow: 'visible'}} width={9000} height={9000} viewBox="-3000 -3000 9000 9000">
    {children}
  </svg>
);
const Mark: React.FC<{x: number; y: number; size: number; s: number; text: string; rot?: number; fill?: string}> = ({x, y, size, s, text, rot = 0, fill = '#fff'}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <text x={0} y={size * 0.35} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={size} fill={fill} stroke={INK} strokeWidth={size * 0.14} paintOrder="stroke" strokeLinejoin="round">
        {text}
      </text>
    </g>
  );
const Sparkle: React.FC<{x: number; y: number; r: number; s: number; rot?: number; fill?: string}> = ({x, y, r, s, rot = 0, fill = '#FFFFFF'}) => {
  if (s <= 0.001) return null;
  const p = `M 0 ${-r} Q ${r * 0.18} ${-r * 0.18} ${r} 0 Q ${r * 0.18} ${r * 0.18} 0 ${r} Q ${-r * 0.18} ${r * 0.18} ${-r} 0 Q ${-r * 0.18} ${-r * 0.18} 0 ${-r} Z`;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d={p} fill={fill} stroke={INK} strokeWidth={r * 0.14} strokeLinejoin="round" />
    </g>
  );
};

// ---------- backdrop: the generated desert plate, far away (parallax depth 2) ----------
const BG_S = 2.8;
const BG = {w: SPR.bg.w * BG_S, h: SPR.bg.h * BG_S};
const BG_X = 1417 - BG.w / 2;
const BG_Y = -380 - 0.55 * BG.h;
const Backdrop: React.FC<{cam: Cam}> = ({cam}) => (
  <World cam={cam} depth={2} blur={cam.k > 1.3 ? clamp((cam.k - 1.3) * 18, 0, 2.6) : 0}>
    <Img src={F('bg')} style={{position: 'absolute', left: BG_X, top: BG_Y, width: BG.w, height: BG.h}} />
  </World>
);

// ---------- concrete: the one-go pour ----------
const levelAt = (t: number) => {
  if (t < 1.95) return lerp(FLOOR - 70, 600, easeInOutCubic(prog(t, -0.3, 1.95)));
  const u = prog(t, 1.95, 2.72);
  return lerp(600, CREST, easeOutBack(u, 1.25));
};
const WET = '#A6A29B';
const WET_SH = '#8F8B84';
const HOT = '#EF7845';
const HOT_SH = '#D45A2C';
const heatAt = (t: number) => clamp(easeInOutCubic(prog(t, 3.55, 4.85)) - 0.22 * prog(t, 5.3, 9.6));

const surfPts = (t: number, L: number, notch: number) => {
  const pts: [number, number][] = [];
  const settle = t < 2.72 ? 1 : Math.exp(-4.5 * (t - 2.72));
  const amp = 7 * settle + (t > 2.72 && t < 3.6 ? 12 * Math.sin(2 * Math.PI * 3.1 * (t - 2.72)) * Math.exp(-4 * (t - 2.72)) : 0);
  for (let x = DAM_L - 40; x <= DAM_R + 40; x += 20) {
    let y = L + amp * Math.sin(x * 0.028 + t * 7) + (t < 2.62 ? -10 * Math.exp(-Math.pow((x - 1385) / 60, 2)) : 0);
    // the broken-off corner
    if (notch > 0 && x > XC + 92 && x < XC + 212) y += notch * (60 + 30 * Math.sin((x - XC) * 0.09));
    pts.push([x, y]);
  }
  return pts;
};
const Monolith: React.FC<{t: number; tr: number}> = ({t, tr}) => {
  if (t >= 10.66) return null;
  const L = levelAt(t);
  const heat = heatAt(t);
  const notch = t > 9.85 ? 1 : 0;
  const pts = surfPts(t, L, notch);
  const top = pts.map(([x, y], i) => `${i ? 'L' : 'M'} ${x} ${y}`).join(' ');
  const d = `${top} L ${DAM_R + 40} ${DAM_B} L ${DAM_L - 40} ${DAM_B} Z`;
  const fill = mixHex(WET, HOT, heat);
  const shade = mixHex(WET_SH, HOT_SH, heat);
  return (
    <g>
      <path d={d} fill={fill} />
      {/* soft left shade + a hot core */}
      <path d={d} fill={shade} opacity={0.55} clipPath="url(#hd-left)" />
      {heat > 0.05 ? <ellipse cx={XC + 20} cy={(L + FLOOR) / 2 + 40} rx={170} ry={Math.max(10, (FLOOR - L) / 2.4)} fill="#FFB25E" opacity={0.26 * heat} /> : null}
      {heat > 0.05 ? <ellipse cx={XC + 30} cy={(L + FLOOR) / 2 + 60} rx={90} ry={Math.max(6, (FLOOR - L) / 4)} fill="#FFD27A" opacity={0.2 * heat} /> : null}
      {/* wet sheen streaks on the fresh concrete */}
      {heat < 0.6
        ? [0, 1, 2].map((i) => (
            <path key={i} d={`M ${XC - 160 + i * 120} ${L + 40 + i * 30} q 30 -8 60 0`} fill="none" stroke="#C9C5BE" strokeWidth={8} strokeLinecap="round" opacity={0.8 * (1 - heat / 0.6)} />
          ))
        : null}
      <path d={top} fill="none" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      <Crack t={t} />
    </g>
  );
};
const Crack: React.FC<{t: number}> = ({t}) => {
  const u = prog(t, T.crack, T.crack + 0.2);
  const v = prog(t, T.crack + 0.08, T.crack + 0.28);
  if (u <= 0) return null;
  const main: [number, number][] = [[XC + 70, CREST - 4], [XC + 46, CREST + 60], [XC + 84, CREST + 128], [XC + 52, CREST + 196], [XC + 98, CREST + 268], [XC + 66, CREST + 340], [XC + 104, CREST + 420]];
  const br: [number, number][] = [[XC + 52, CREST + 196], [XC + 4, CREST + 240], [XC + 18, CREST + 300], [XC - 34, CREST + 352]];
  const part = (p: [number, number][], f: number) => {
    const out: [number, number][] = [p[0]];
    const n = (p.length - 1) * f;
    for (let i = 1; i < p.length; i++) {
      if (i <= n) out.push(p[i]);
      else {
        const k = n - (i - 1);
        if (k > 0) out.push([lerp(p[i - 1][0], p[i][0], k), lerp(p[i - 1][1], p[i][1], k)]);
        break;
      }
    }
    return out.map(([x, y], i) => `${i ? 'L' : 'M'} ${x} ${y}`).join(' ');
  };
  return (
    <g>
      <path d={part(main, u)} fill="none" stroke={INK} strokeWidth={14} strokeLinejoin="round" strokeLinecap="round" />
      {v > 0 ? <path d={part(br, v)} fill="none" stroke={INK} strokeWidth={10} strokeLinejoin="round" strokeLinecap="round" /> : null}
    </g>
  );
};
// the broken-off corner falls (gravity) and hides behind the canyon floor band
const Chunk: React.FC<{t: number}> = ({t}) => {
  const t0 = 9.85;
  if (t < t0 || t > 10.66) return null;
  const tt = t - t0;
  const x = XC + 152 + 70 * tt;
  const y = CREST + 40 - 260 * tt + 0.5 * 2600 * tt * tt;
  const rot = 160 * tt;
  const heat = heatAt(t);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path d="M -62 -40 L 10 -52 L 60 -30 L 58 20 L 20 48 L -40 40 L -66 6 Z" fill={mixHex(WET, HOT, heat)} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      <path d="M -40 -10 L 10 -20" stroke={INK} strokeWidth={5} strokeLinecap="round" />
    </g>
  );
};

// the stream of concrete from the chute (a parabola from the mouth to the surface)
const Stream: React.FC<{t: number}> = ({t}) => {
  if (t > 2.9) return null;
  const L = levelAt(t);
  const big = bump(t, 1.92, 0.75);
  const land = {x: lerp(1360, 1405, big), y: L};
  const u0 = easeInCubic(prog(t, 2.6, 2.9)); // the tail leaves the chute and falls
  const w = 44 + 64 * big;
  const pts: string[] = [];
  for (let i = 0; i <= 24; i++) {
    const u = lerp(u0, 1, i / 24);
    const x = lerp(MOUTH.x, land.x, u) + 4 * Math.sin(u * 9 - t * 14) * (1 - big);
    const y = MOUTH.y + (land.y - MOUTH.y) * (0.25 * u + 0.75 * u * u);
    pts.push(`${i ? 'L' : 'M'} ${x} ${y}`);
  }
  const d = pts.join(' ');
  return (
    <g>
      <path d={d} fill="none" stroke={INK} strokeWidth={w + 12} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={WET} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke="#C9C5BE" strokeWidth={Math.max(4, w * 0.18)} strokeLinecap="round" strokeDasharray="40 50" strokeDashoffset={-t * 600} />
      {/* splash blobs where it lands */}
      {u0 < 0.95
        ? [0, 1, 2, 3].map((i) => {
            const ph = (t * 2.2 + i * 0.25) % 1;
            const a = (i % 2 ? -1 : 1) * (0.5 + 0.4 * rnd(i));
            const r = (9 + 6 * rnd(i + 3)) * Math.sin(Math.PI * ph) * (1 + big);
            return r > 0.5 ? (
              <circle key={i} cx={land.x + a * 120 * ph} cy={L - 120 * Math.sin(Math.PI * ph) * (0.6 + 0.4 * rnd(i + 7))} r={r} fill={WET} stroke={INK} strokeWidth={5} />
            ) : null;
          })
        : null}
    </g>
  );
};

// ---------- the dam's face (on the monolith, later on the blocks) ----------
type Mouth = 'o' | 'wavy' | 'grit' | 'smile' | 'flat';
type DamFace = {open: number; look: [number, number]; lid?: number; squeeze?: boolean; mouth: Mouth; y?: number; tilt?: number};
const FaceOn: React.FC<{f: DamFace; tr: number}> = ({f, tr}) => {
  const y = f.y ?? CREST + 150;
  const ex = 64;
  const r = 40;
  const my = y + 92;
  let mouth: React.ReactNode = null;
  const sw = 9;
  if (f.mouth === 'o') mouth = <ellipse cx={XC} cy={my} rx={20} ry={26} fill="#3A1414" stroke={INK} strokeWidth={sw} />;
  if (f.mouth === 'flat') mouth = <path d={`M ${XC - 34} ${my} L ${XC + 34} ${my}`} stroke={INK} strokeWidth={sw} strokeLinecap="round" />;
  if (f.mouth === 'wavy') {
    const ph = tr * 12;
    const p: string[] = [];
    for (let i = 0; i <= 16; i++) {
      const x = XC - 46 + (92 * i) / 16;
      p.push(`${i ? 'L' : 'M'} ${x} ${my + 7 * Math.sin(i * 1.3 + ph)}`);
    }
    mouth = <path d={p.join(' ')} fill="none" stroke={INK} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />;
  }
  if (f.mouth === 'grit')
    mouth = (
      <g>
        <rect x={XC - 48} y={my - 18} width={96} height={36} rx={14} fill="#FEFDFD" stroke={INK} strokeWidth={sw} />
        <path d={`M ${XC - 48} ${my} L ${XC + 48} ${my} M ${XC - 16} ${my - 18} L ${XC - 16} ${my + 18} M ${XC + 16} ${my - 18} L ${XC + 16} ${my + 18}`} stroke={INK} strokeWidth={5} />
      </g>
    );
  if (f.mouth === 'smile')
    mouth = (
      <path d={`M ${XC - 52} ${my - 10} Q ${XC} ${my + 48} ${XC + 52} ${my - 10} Z`} fill="#7A2A22" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    );
  return (
    <g>
      <Eye x={XC - ex} y={y} r={r} open={f.open} look={f.look} lid={f.lid ?? 0} lidTilt={f.tilt ?? 0} squeeze={f.squeeze} side={-1} brow={0.5} browTilt={(f.tilt ?? 0) / 18} ink={0.2} />
      <Eye x={XC + ex} y={y} r={r} open={f.open} look={f.look} lid={f.lid ?? 0} lidTilt={f.tilt ?? 0} squeeze={f.squeeze} side={1} brow={0.5} browTilt={(f.tilt ?? 0) / 18} ink={0.2} />
      {f.open > 0.3 ? <g transform={`translate(${XC} ${my}) scale(${f.open}) translate(${-XC} ${-my})`}>{mouth}</g> : null}
    </g>
  );
};

// ---------- steam (puffs rising from the hot top) ----------
const Steam: React.FC<{t: number; L: number}> = ({t, L}) => {
  const k = clamp(prog(t, 3.6, 4.5) - 0.4 * prog(t, 5.4, 6.4) - 0.3 * prog(t, 8.6, 9.5));
  if (k <= 0.01 || t > 10.66) return null;
  const wait = prog(t, 5.4, 6.2);
  const jets = wait > 0.5 ? [XC - 120, XC + 110] : [XC - 165, XC - 20, XC + 150];
  const rise = lerp(165, 115, wait);
  return (
    <g>
      {jets.map((jx, j) => {
        const puffs: Puff[] = [];
        const period = 0.5 + 0.09 * j;
        for (let n = 0; n < 5; n++) {
          const born = Math.floor(t / period) * period - n * period + 0.17 * j;
          const age = t - born;
          if (age < 0 || age > 1.8) continue;
          const life = Math.sin((Math.PI * age) / 1.8);
          const R = (24 + 36 * age) * life * Math.max(k, 0.75 * Math.min(1, k * 4));
          const cx = jx + 26 * Math.sin(born * 5 + age * 2);
          const cy = L - 26 - rise * age;
          puffs.push({x: cx, y: cy, r: R}, {x: cx - R * 0.62, y: cy + R * 0.28, r: R * 0.68}, {x: cx + R * 0.6, y: cy + R * 0.22, r: R * 0.74});
        }
        return <PuffCluster key={j} puffs={puffs} fill="#F7F7F5" ink={5} />;
      })}
    </g>
  );
};

// ---------- thermometer stuck in the top ----------
const Thermo: React.FC<{t: number}> = ({t}) => {
  if (t < 3.5 || t >= 10.66) return null;
  const s = pop(t, 3.5, 0.3);
  const fill = 0.12 + 0.88 * easeInCubic(prog(t, 3.7, 4.82));
  const capT = 4.86;
  const len = 330;
  const capped = t < capT;
  const ct = t - capT;
  return (
    <g transform={`translate(${XC + 168} ${CREST + 60}) rotate(16) scale(${s})`}>
      {/* tube */}
      <rect x={-20} y={-len} width={40} height={len} rx={20} fill="#FEFDFD" stroke={INK} strokeWidth={8} />
      <rect x={-8} y={-len * fill + 4} width={16} height={len * fill - 4} rx={8} fill="#E8352B" />
      {[0.2, 0.35, 0.5, 0.65, 0.8].map((f) => (
        <line key={f} x1={8} x2={18} y1={-len * f} y2={-len * f} stroke={INK} strokeWidth={4} />
      ))}
      {capped ? (
        <rect x={-24} y={-len - 18} width={48} height={30} rx={8} fill="#B9B6B0" stroke={INK} strokeWidth={7} />
      ) : (
        <g>
          <g transform={`translate(${60 * ct} ${-len - 18 - 700 * ct + 1300 * ct * ct}) rotate(${600 * ct})`}>
            <rect x={-24} y={-15} width={48} height={30} rx={8} fill="#B9B6B0" stroke={INK} strokeWidth={7} />
          </g>
          {[0, 1, 2].map((i) => {
            const a = (i - 1) * 0.5;
            const tt = Math.min(ct, 0.6);
            const life = Math.sin(Math.PI * prog(ct, 0, 0.6));
            return life > 0.02 ? (
              <circle key={i} cx={Math.sin(a) * 260 * tt} cy={-len - 10 - 420 * tt + 900 * tt * tt} r={12 * life} fill="#E8352B" stroke={INK} strokeWidth={5} />
            ) : null;
          })}
        </g>
      )}
    </g>
  );
};

// ---------- the YEARS counter (a sign in the sky) ----------
const Counter: React.FC<{t: number}> = ({t}) => {
  const sIn = pop(t, 6.42, 0.28);
  const sOut = 1 - easeInCubic(prog(t, 10.72, 10.95));
  const s = sIn * sOut;
  if (s <= 0.001) return null;
  let n = Math.round(125 * easeInOutCubic(prog(t, T.n125, 8.45)));
  if (t > 10.46) n = Math.round(125 * (1 - prog(t, 10.46, 10.72)));
  const wob = 1 + 0.05 * bump(t, 8.45, 0.25);
  return (
    <g transform={`translate(${XC} ${-345}) scale(${s * wob}) rotate(${-3})`}>
      <rect x={-230} y={-120} width={460} height={240} rx={34} fill="#2E2A27" stroke={INK} strokeWidth={10} />
      <rect x={-208} y={-100} width={416} height={140} rx={22} fill="#3F3A36" />
      <text x={0} y={30} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={130} fill="#FFFFFF">
        {n}
      </text>
      <text x={0} y={98} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={56} fill="#FFD23F">
        {n === 1 ? 'YEAR' : 'YEARS'}
      </text>
    </g>
  );
};

// ---------- the rewind poof ----------
const Poof: React.FC<{t: number}> = ({t}) => {
  const g = easeOutCubic(prog(t, 10.44, 10.66));
  const sh = 1 - easeInOutCubic(prog(t, 10.7, 11.02));
  const R = 300 * g * sh;
  if (R < 1) return null;
  const cy = (CREST + FLOOR) / 2 - 40;
  const puffs: Puff[] = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + 0.3;
    const rr = 0.55 + 0.25 * rnd(i);
    puffs.push({x: XC + Math.cos(a) * R * 0.8, y: cy + Math.sin(a) * R * 1.05, r: R * 0.42 * rr});
  }
  puffs.push({x: XC, y: cy, r: R * 0.85});
  return <PuffCluster puffs={puffs} fill="#FFFFFF" ink={7} />;
};

// ---------- the dam in blocks + the cooling pipes ----------
const ROWS = 6;
const COLS = 8;
const BW = (DAM_R - DAM_L) / COLS;
const BH = (DAM_B - CREST) / ROWS;
const WARM = '#EFA57B';
const COOL = '#D9D3C7';
const COOL_SH = '#C5BEB1';
const rowPop = (r: number) => T.built + r * 0.14; // r = 0 bottom row
const coolAt = (t: number, r: number) => prog(t, 12.4 + (ROWS - 1 - r) * 0.2, 12.4 + (ROWS - 1 - r) * 0.2 + 0.55);
const Blocks: React.FC<{t: number}> = ({t}) => {
  if (t < T.built) return null;
  const out: React.ReactNode[] = [];
  for (let r = 0; r < ROWS; r++) {
    const y1 = DAM_B - r * BH;
    for (let c = 0; c < COLS; c++) {
      const t0 = rowPop(r) + c * 0.012;
      if (t < t0) continue;
      const s = easeOutBack(prog(t, t0, t0 + 0.22), 2.0);
      const x = DAM_L + c * BW;
      const cool = coolAt(t, r);
      const fill = c < 2 ? mixHex('#E39368', COOL_SH, cool) : mixHex(WARM, COOL, cool);
      out.push(
        <g key={`${r}-${c}`} transform={`translate(0 ${y1}) scale(1 ${s}) translate(0 ${-y1})`}>
          <rect x={x} y={y1 - BH} width={BW} height={BH} fill={fill} stroke={INK} strokeWidth={6} strokeLinejoin="round" />
        </g>,
      );
    }
  }
  // the crest road with a little railing (after the top row)
  const topS = easeOutBack(prog(t, rowPop(ROWS - 1) + 0.12, rowPop(ROWS - 1) + 0.34), 2);
  return (
    <g>
      {out}
      {topS > 0 ? (
        <g transform={`translate(0 ${CREST}) scale(1 ${topS}) translate(0 ${-CREST})`}>
          <rect x={DAM_L - 20} y={CREST - 26} width={DAM_R - DAM_L + 40} height={26} fill="#BDB6A9" stroke={INK} strokeWidth={6} />
          {Array.from({length: 13}).map((_, i) => (
            <line key={i} x1={DAM_L + i * 56} x2={DAM_L + i * 56} y1={CREST - 26} y2={CREST - 52} stroke={INK} strokeWidth={6} />
          ))}
          <line x1={DAM_L - 20} x2={DAM_R + 20} y1={CREST - 50} y2={CREST - 50} stroke={INK} strokeWidth={6} />
        </g>
      ) : null}
    </g>
  );
};
// pipe route: from the fridge along the rim, down into the dam, then snaking through every block row
const PIPE: [number, number][] = (() => {
  const p: [number, number][] = [
    [XC + 40, FR_Y - 30],
    [XC + 40, CREST + BH * 0.5],
  ];
  for (let r = 0; r < ROWS; r++) {
    const y = CREST + BH * (r + 0.5);
    const [gl, gr] = gapAt(y);
    const xr = gr - 34;
    const xl = gl + 40;
    if (r % 2 === 0) {
      p.push([xr, y]);
      if (r < ROWS - 1) p.push([xr, y + BH]);
    } else {
      p.push([xl, y]);
      if (r < ROWS - 1) p.push([xl, y + BH]);
    }
  }
  return p;
})();
const PIPE_D = PIPE.map(([x, y], i) => `${i ? 'L' : 'M'} ${x} ${y}`).join(' ');
const PIPE_LEN = PIPE.reduce((a, p, i) => (i ? a + Math.hypot(p[0] - PIPE[i - 1][0], p[1] - PIPE[i - 1][1]) : 0), 0);
const Pipes: React.FC<{t: number}> = ({t}) => {
  const u = easeInOutCubic(prog(t, T.pumped - 0.05, T.pumped + 0.6));
  if (u <= 0) return null;
  const dash = `${PIPE_LEN} ${PIPE_LEN}`;
  const off = (1 - u) * PIPE_LEN;
  const cubes: React.ReactNode[] = [];
  for (let i = 0; i < 12; i++) {
    const s0 = T.ice - 0.05 + i * 0.24;
    const v = (t - s0) / 2.1;
    if (v <= 0 || v >= 1 || v > u) continue;
    const [x, y] = along(PIPE, v);
    const life = Math.min(1, v * 12, (1 - v) * 6);
    cubes.push(
      <g key={i} transform={`translate(${x} ${y}) rotate(${20 * Math.sin(t * 6 + i)}) scale(${life})`}>
        <rect x={-19} y={-19} width={38} height={38} rx={9} fill="#E9F8FF" stroke={INK} strokeWidth={5} />
        <rect x={-12} y={-13} width={9} height={14} rx={3} fill="#FFFFFF" />
        <circle cx={-5} cy={2} r={3.6} fill={INK} />
        <circle cx={8} cy={2} r={3.6} fill={INK} />
      </g>,
    );
  }
  return (
    <g>
      <path d={PIPE_D} fill="none" stroke={INK} strokeWidth={34} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={dash} strokeDashoffset={off} />
      <path d={PIPE_D} fill="none" stroke="#7FC8F2" strokeWidth={22} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={dash} strokeDashoffset={off} />
      {u > 0.98 ? <path d={PIPE_D} fill="none" stroke="#FFFFFF" strokeWidth={5} strokeDasharray="22 60" strokeDashoffset={-t * 420} strokeLinecap="round" opacity={0.9} /> : null}
      {cubes}
    </g>
  );
};
// frost along the crest once the dam is cold
const Frost: React.FC<{t: number; tr: number}> = ({t, tr}) => {
  const u = easeOutCubic(prog(t, 13.3, 13.9));
  if (u <= 0) return null;
  const icicles: React.ReactNode[] = [];
  for (let i = 0; i < 9; i++) {
    const x = DAM_L + 40 + i * ((DAM_R - DAM_L - 80) / 8);
    const L = (26 + 22 * rnd(i + 11)) * u;
    icicles.push(<path key={i} d={`M ${x - 11} ${CREST + 6} L ${x} ${CREST + 6 + L} L ${x + 11} ${CREST + 6} Z`} fill="#E3F6FF" stroke={INK} strokeWidth={5} strokeLinejoin="round" />);
  }
  return (
    <g>
      {icicles}
      <rect x={DAM_L - 20} y={CREST - 6} width={(DAM_R - DAM_L + 40) * u} height={16} rx={8} fill="#F2FBFF" stroke={INK} strokeWidth={5} />
      {[0, 1, 2, 3].map((i) => (
        <Sparkle key={i} x={DAM_L + 80 + i * 140} y={CREST + 60 + 90 * (i % 2)} r={18} s={0.5 + 0.5 * Math.sin(2 * Math.PI * (0.8 * tr + i * 0.27))} rot={tr * 40} fill="#E9F8FF" />
      ))}
    </g>
  );
};

// ---------- characters ----------
const guyHead = (n: Pose, s: number) => {
  const sp = SPR[n] as unknown as {feet: [number, number]};
  const [hx, hy, hr] = HEADS[n];
  return {x: GX - (hx - sp.feet[0]) * s, y: RIM + (hy - sp.feet[1]) * s, r: hr * s};
};
const Beard: React.FC<{n: Pose; len: number}> = ({n, len}) => {
  if (len < 2) return null;
  const s = sc(n);
  const h = guyHead(n, s);
  const cx = h.x - 0.12 * h.r;
  const cy = h.y + 0.62 * h.r;
  const w = 0.55 * h.r;
  const L = len;
  const d = `M ${cx - w} ${cy} Q ${cx - w * 1.1} ${cy + L * 0.5} ${cx - w * 0.25} ${cy + L} Q ${cx} ${cy + L * 0.92} ${cx + w * 0.2} ${cy + L * 1.02} Q ${cx + w * 1.1} ${cy + L * 0.5} ${cx + w} ${cy} Q ${cx} ${cy + 0.25 * h.r} ${cx - w} ${cy} Z`;
  return (
    <g>
      <path d={d} fill="#E9E6E1" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
      {L > 40 ? <path d={`M ${cx - w * 0.35} ${cy + 0.3 * h.r} Q ${cx - w * 0.45} ${cy + L * 0.55} ${cx - w * 0.2} ${cy + L * 0.82}`} fill="none" stroke="#B9B4AC" strokeWidth={5} strokeLinecap="round" /> : null}
      {L > 40 ? <path d={`M ${cx + w * 0.35} ${cy + 0.3 * h.r} Q ${cx + w * 0.4} ${cy + L * 0.5} ${cx + w * 0.1} ${cy + L * 0.75}`} fill="none" stroke="#B9B4AC" strokeWidth={5} strokeLinecap="round" /> : null}
    </g>
  );
};
const Guy: React.FC<{n: Pose; t: number; tr: number; tSwap: number; tremble?: number; bounce?: number}> = ({n, t, tr, tSwap, tremble = 0, bounce = 0}) => {
  const s = sc(n);
  const [ax, ay] = squashSwap(t, tSwap);
  const tx = tremble * 1.6 * Math.sin(2 * Math.PI * 13 * tr);
  return (
    <>
      <div style={{position: 'absolute', left: GX - 70, top: RIM - 10, width: 140, height: 20, borderRadius: '50%', background: 'rgba(72, 54, 42, 0.26)', filter: 'blur(3px)'}} />
      <Spr n={n} x={GX + tx} y={RIM - bounce} s={s} sx={-ax} sy={ay * breathe(tr)} />
    </>
  );
};
const guyPose = (t: number): {n: Pose; tSwap: number} => {
  if (t < 5.42) return {n: 'hero', tSwap: -1};
  if (t < T.crack + 0.04) return {n: 'bored', tSwap: 5.42};
  if (t < 10.66) return {n: 'shock', tSwap: T.crack + 0.04};
  if (t < T.blocks) return {n: 'hero', tSwap: 10.66};
  if (t < 15.66) return {n: 'cheer', tSwap: T.blocks};
  return {n: 'drink', tSwap: 15.66};
};

const Truck: React.FC<{t: number; tr: number}> = ({t, tr}) => {
  const strain = bump(t, 1.88, 0.8);
  const vib = t < 2.9 ? 1.4 * Math.sin(2 * Math.PI * 17 * tr) : 0;
  const sy = 1 - 0.05 * strain + 0.02 * spring(t - 2.68, 3, 6) * (t > 2.68 ? 1 : 0);
  const look: [number, number] = t < 2.8 ? [0.8, 0.6] : t < 9.6 ? [0.9, 0.2] : [0.9, 0.5];
  const squeeze = strain > 0.35;
  return (
    <Spr n="truck" x={TX0 + SPR.truck.feet[0] * TS} y={RIM + vib * 0.3} s={TS} sy={sy} sx={1 + 0.03 * strain}>
      {t < 2.9
        ? [0, 1, 2].map((i) => {
            const a0 = ((tr * 260 + i * 120) % 360) * (Math.PI / 180);
            const R = 330;
            const cx = 870;
            const cy = 280;
            const p0 = [cx + R * Math.cos(a0), cy + 0.62 * R * Math.sin(a0)];
            const p1 = [cx + R * Math.cos(a0 + 0.55), cy + 0.62 * R * Math.sin(a0 + 0.55)];
            return Math.sin(a0) < 0.2 ? (
              <path key={i} d={`M ${p0[0]} ${p0[1]} A ${R} ${0.62 * R} 0 0 1 ${p1[0]} ${p1[1]}`} fill="none" stroke={INK} strokeWidth={14} strokeLinecap="round" opacity={0.85} />
            ) : null;
          })
        : null}
      <Eye x={1000} y={200} r={56} open={1} look={look} squeeze={squeeze} side={-1} brow={0.5} lid={t > 6.6 && t < 9.6 ? 0.5 : 0} ink={0.18} />
      <Eye x={1125} y={192} r={56} open={1} look={look} squeeze={squeeze} side={1} brow={0.5} lid={t > 6.6 && t < 9.6 ? 0.5 : 0} ink={0.18} />
    </Spr>
  );
};
const Fridge: React.FC<{t: number; tr: number}> = ({t, tr}) => {
  if (t < FR_LAND - 0.3) return null;
  const tf = Math.min(t, FR_LAND);
  const fall = FR_LAND - tf; // seconds before landing
  const y = FR_Y - 0.5 * 9000 * fall * fall;
  const land = t > FR_LAND ? spring(t - FR_LAND, 3, 6) : 0;
  const open = pop(t, 14.5, 0.26);
  const wink = t > T.fridge - 0.05 && t < T.fridge + 0.5;
  const toss = bump(t, 15.0, 0.25);
  const look: [number, number] = t < 15.0 ? [0.5, 0.6] : [0.95, -0.2];
  return (
    <Spr n="fridge" x={FRX} y={y} s={FRS} sx={1 + 0.12 * land + 0.04 * toss} sy={1 - 0.14 * land - 0.06 * toss + 0.006 * Math.sin(2 * Math.PI * 0.7 * tr)}>
      <Eye x={290} y={330} r={66} open={open} look={look} side={-1} brow={0.55} ink={0.18} />
      <Eye x={455} y={330} r={66} open={open} look={look} side={1} brow={0.55} squeeze={wink} ink={0.18} />
      {open > 0.3 ? <path d="M 300 500 Q 372 585 445 500" fill="none" stroke={INK} strokeWidth={16} strokeLinecap="round" /> : null}
    </Spr>
  );
};
// dust puffs when the fridge lands on the crest
const LandDust: React.FC<{t: number}> = ({t}) => {
  const a = t - FR_LAND;
  if (a < 0 || a > 0.6) return null;
  const life = Math.sin((Math.PI * a) / 0.6);
  const puffs: Puff[] = [];
  for (let i = 0; i < 6; i++) {
    const side = i % 2 ? 1 : -1;
    puffs.push({x: FRX + side * (70 + 160 * a * (1 + 0.3 * (i >> 1))), y: FR_Y - 10 - 30 * a - 8 * (i >> 1), r: (16 + 8 * (i >> 1)) * life});
  }
  return <PuffCluster puffs={puffs} fill="#F1ECE4" ink={5} />;
};
// the can tossed from the fridge into the guy's hand (lands exactly on the can drawn in the drink pose)
const CAN_T0 = 15.04;
const CAN_T1 = 15.66;
const Can: React.FC<{t: number}> = ({t}) => {
  if (t < CAN_T0 || t >= CAN_T1) return null;
  const sd = sc('drink');
  const fx = SPR.drink.feet[0];
  const fy = SPR.drink.feet[1];
  const end = {x: GX - (SPR.drink.can[0] - fx) * sd, y: RIM + (SPR.drink.can[1] - fy) * sd};
  const start = {x: FRX + 70, y: FR_Y - FR_H * 0.7};
  const u = prog(t, CAN_T0, CAN_T1);
  const x = lerp(start.x, end.x, u);
  const apex = Math.min(start.y, end.y) - 150;
  // parabola through start, apex (at u=0.45) and end
  const ya = (uu: number) => {
    const ua = 0.45;
    if (uu < ua) return apex + (start.y - apex) * Math.pow((ua - uu) / ua, 2);
    return apex + (end.y - apex) * Math.pow((uu - ua) / (1 - ua), 2);
  };
  const y = ya(u);
  const rot = -540 * u + 20;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <rect x={-22} y={-34} width={44} height={68} rx={10} fill="#E3342B" stroke={INK} strokeWidth={6} />
      <rect x={-22} y={-6} width={44} height={14} fill="#FFFFFF" />
      <rect x={-22} y={-34} width={44} height={68} rx={10} fill="none" stroke={INK} strokeWidth={6} />
    </g>
  );
};

// rock layers drawn over the flat extension under the generated canyon floor
const Strata: React.FC = () => {
  const line = (y0: number, amp: number, ph: number) => {
    const p: string[] = [];
    for (let x = -200; x <= WALLS.w * WS + 200; x += 60) p.push(`${p.length ? 'L' : 'M'} ${x} ${y0 + amp * Math.sin(x * 0.006 + ph) + 6 * Math.sin(x * 0.03 + ph * 2)}`);
    return p.join(' ');
  };
  const W2 = WALLS.w * WS + 200;
  return (
    <g>
      <path d={`${line(1130, 10, 1)} L ${W2} 1220 L -200 1220 Z`} fill="#C65A30" />
      <path d={line(1130, 10, 1)} fill="none" stroke={INK} strokeWidth={6} />
      <path d={line(1220, 8, 2.5)} fill="none" stroke={INK} strokeWidth={6} />
      <path d={line(1330, 12, 4)} fill="none" stroke={INK} strokeWidth={6} />
    </g>
  );
};

// ---------- the scene ----------
export const Scene: React.FC<{t: number; tr: number; cam: Cam; cover?: boolean}> = ({t, tr, cam}) => {
  const L = levelAt(t);
  const gp = guyPose(t);
  const beardLen = 240 * easeInOutCubic(prog(t, 6.72, 8.6)) * (1 - easeInOutCubic(prog(t, 10.46, 10.74)));
  // face on the monolith
  let face: DamFace | null = null;
  if (t >= 3.2 && t < 10.66) {
    const open = pop(t, 3.22, 0.28);
    const hot = t > 3.75;
    face = {
      open,
      look: t < 3.7 ? [0.4, -0.6] : t < 5.3 ? [0.6, -0.9] : t < 9.5 ? [0.2, 0.2] : [0, 0],
      lid: t > 6.6 && t < 9.55 ? 0.55 : 0,
      tilt: 0,
      squeeze: t > T.crack - 0.02,
      mouth: t > T.crack - 0.02 ? 'grit' : t > 6.6 ? 'flat' : hot ? 'wavy' : 'o',
      y: Math.max(L, CREST) + 150,
    };
  }
  // face on the block dam
  let face2: DamFace | null = null;
  if (t >= 11.86) {
    const cool = coolAt(t, 2);
    face2 = {
      open: pop(t, 11.86, 0.26),
      look: t < 12.5 ? [0.7, -0.5] : t < 13.2 ? [0.5, 0.4] : [0.2, 0.1],
      lid: cool > 0.6 ? 0.42 : 0,
      mouth: cool > 0.55 ? 'smile' : t > 12.0 ? 'grit' : 'o',
      y: CREST + 160,
    };
  }
  const sweat = (t > 4.0 && t < 9.6) || (t > 12.0 && t < 12.95);
  return (
    <>
      <Backdrop cam={cam} />
      <World cam={cam}>
        <Svg>
          <defs>
            <clipPath id="hd-left">
              <rect x={DAM_L - 60} y={-200} width={XC - 150 - (DAM_L - 60)} height={1400} />
            </clipPath>
          </defs>
          <Thermo t={t} />
          <Monolith t={t} tr={tr} />
          <Blocks t={t} />
          <Pipes t={t} />
          <Frost t={t} tr={tr} />
          {face ? <FaceOn f={face} tr={tr} /> : null}
          {face2 ? <FaceOn f={face2} tr={tr} /> : null}
          {sweat ? (
            <>
              <SweatDrop x={XC + 150 + 6 * Math.sin(tr * 3)} y={(face?.y ?? CREST + 160) - 40 + 50 * ((tr * 0.8) % 1)} r={20} s={Math.sin(Math.PI * ((tr * 0.8) % 1))} />
              <SweatDrop x={XC - 150} y={(face?.y ?? CREST + 160) - 20 + 50 * ((tr * 0.8 + 0.5) % 1)} r={16} s={Math.sin(Math.PI * ((tr * 0.8 + 0.5) % 1))} rot={10} />
            </>
          ) : null}
          <Steam t={t} L={Math.max(L, CREST)} />
          <Chunk t={t} />
          <Stream t={t} />
        </Svg>
        <Fridge t={t} tr={tr} />
        <Svg>
          <LandDust t={t} />
        </Svg>
        <Img src={F('walls')} style={{position: 'absolute', left: 0, top: 0, width: WALLS.w * WS, height: WALLS.h * WS}} />
        <Svg>
          <Strata />
        </Svg>
        <Svg>
          <Counter t={t} />
        </Svg>
        <Truck t={t} tr={tr} />
        <Guy n={gp.n} t={t} tr={tr} tSwap={gp.tSwap} tremble={gp.n === 'shock' ? 1 : 0} bounce={gp.n === 'cheer' ? 14 * Math.abs(Math.sin(2 * Math.PI * 1.4 * (t - T.blocks))) * (1 - prog(t, 13.4, 13.9)) : 0} />
        <Svg>
          <Beard n={gp.n} len={beardLen} />
          <Can t={t} />
          <Mark x={GX - 30} y={RIM - 440} size={64} s={pop(t, 16.42, 0.22) * (1 - prog(t, 16.86, 16.98))} text="ahh" rot={-8} />
          <Poof t={t} />
        </Svg>
      </World>
    </>
  );
};

export const HooverDamPourShort: React.FC = () => {
  useHdFont();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  let cam = camFor(t);
  let amp = 0;
  amp += t > 1.95 && t < 2.9 ? 6 * bump(t, 1.95, 0.9) : 0;
  amp += t > 4.86 ? 5 * Math.exp(-8 * (t - 4.86)) * (t < 5.5 ? 1 : 0) : 0;
  amp += t > T.crack ? 18 * Math.exp(-5 * (t - T.crack)) * (t < 10.6 ? 1 : 0) : 0;
  amp += t > 10.32 ? 6 * Math.exp(-7 * (t - 10.32)) * (t < 10.9 ? 1 : 0) : 0;
  const sh = shake(t, amp);
  cam = {x: cam.x - sh.x / cam.k, y: cam.y - sh.y / cam.k, k: cam.k};
  return (
    <AbsoluteFill style={{background: SKY}}>
      <Scene t={t} tr={t} cam={cam} />
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('hoover-dam-pour/vo/take1.mp3')} volume={Math.pow(10, MIX_DB / 20)} />
      </Sequence>
      <SoundCues cues={CUES.map((c) => ({...c, db: c.db + MIX_DB, keys: c.keys?.map(([a, b]) => [a, b + MIX_DB] as [number, number])}))} dir="hoover-dam-pour/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};
