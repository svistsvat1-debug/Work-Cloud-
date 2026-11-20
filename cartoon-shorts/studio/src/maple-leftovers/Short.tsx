import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SPR} from './sprites';
import {FPS, T, VO_AT} from './scene';
export {DURATION as MAPLE_DURATION, FPS as MAPLE_FPS} from './scene';
import {camAt, clamp, easeInCubic, easeInOutCubic, easeOutBack, easeOutCubic, lerp, pop, prog, rnd, shake, spring, type Cam, type CamKey} from '../shared/anim';
import {World} from '../shared/World';
import {Eye} from '../shared/Face';
import {PuffCluster} from '../shared/Puffs';
import {SweatDrop} from '../shared/SweatDrop';
import {SoundCues, type Cue} from '../shared/Sound';
import {useFont} from '../shared/useFont';

// "How did nuclear tests catch a tree eating leftovers?" - a scientist picks maple leaves to track the bomb tests; the tests
// doubled carbon-14 in the air and the leaves soak it up. But the leaves run two years behind the air, because the tree builds
// new leaves about half from sugar it stored years before - a brand-new leaf is basically leftovers. Maple syrup too: its sugar
// is three to five years old. Facts: Wassenaar, Crann & Murseli 2026, Sci. Rep. 16: 37339 (Gatineau Park record since 1961,
// leaf peak +842 per mil in 1964, stored fraction f = 0.5-0.7 for a stored-carbon age of 2-3 years, leaf zero-crossing 2024 =
// 2.2 +- 0.3 years after the air's 2021-22); Muhr et al. 2016, New Phytologist 209: 1410 (maple sap sugar turnover 3-5 years).

const F = (n: string) => staticFile(`maple-leftovers/${n}.png`);
export const FONT = 'MAPInter';
export const useMapleFont = () => useFont(FONT, staticFile('fonts/Inter-Black.otf'));
const MIX_DB = -0.8;
const INK = '#000';
const SKY = '#B3DDF4';
const MEADOW = '#9BCB5E';
const MEADOW_D = '#86B84E';
const GLOW = '#E4FF4A';
const BARK_IN = '#4A2E1C';
const SHELF = '#8A5A3B';
const SUGAR = '#FFF4D2';
const GLASS = '#DFF3FA';
const LID = '#B5651D';
const SYRUP = '#D98A2B';
const RED = '#E8302A';
const YEL = '#FFE45C';
const SHADOW = 'rgba(72,54,42,0.26)';

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
const bump = (t: number, t0: number, d = 0.3, a = 0.08) => (t > t0 && t < t0 + d ? 1 + a * Math.pow(Math.sin((Math.PI * (t - t0)) / d), 2) : 1);

type SprInfo = {w: number; h: number; feet: [number, number]; hd?: [number, number, number]; bottom: number; left: number; right: number; top: number};
const S = (n: string) => (SPR as unknown as Record<string, SprInfo>)[n];

// a cut-out sprite anchored at (ax, ay) (native px), placed at (x, y); s = world px per native px; children = SVG in native px
const Spr: React.FC<{
  n: string;
  x: number;
  y: number;
  s: number;
  sx?: number;
  sy?: number;
  rot?: number;
  ax?: number;
  ay?: number;
  clip?: string;
  filter?: string;
  children?: React.ReactNode;
}> = ({n, x, y, s, sx = 1, sy = 1, rot = 0, ax, ay, clip, filter, children}) => {
  const sp = S(n);
  const axx = ax ?? sp.feet[0];
  const ayy = ay ?? sp.feet[1];
  if (s <= 0.0005) return null;
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg) scale(${sx}, ${sy})`, transformOrigin: '0 0'}}>
      <div style={{position: 'absolute', left: -axx * s, top: -ayy * s, width: sp.w * s, height: sp.h * s, clipPath: clip, filter}}>
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
const Svg: React.FC<{children: React.ReactNode; r?: number}> = ({children, r = 6000}) => (
  <svg style={{position: 'absolute', left: -r, top: -r, overflow: 'visible'}} width={2 * r} height={2 * r} viewBox={`${-r} ${-r} ${2 * r} ${2 * r}`}>
    {children}
  </svg>
);
const Label: React.FC<{x: number; y: number; text: string; size: number; s: number; rot?: number; fill?: string; stroke?: string; bg?: string}> = ({
  x,
  y,
  text,
  size,
  s,
  rot = 0,
  fill = '#fff',
  stroke = '#000',
  bg,
}) =>
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
        whiteSpace: 'nowrap',
        color: fill,
        WebkitTextStroke: stroke && !bg ? `${size * 0.18}px ${stroke}` : undefined,
        paintOrder: 'stroke fill',
        background: bg,
        border: bg ? `${size * 0.1}px solid #000` : undefined,
        borderRadius: bg ? size * 0.22 : undefined,
        padding: bg ? `${size * 0.16}px ${size * 0.3}px ${size * 0.1}px` : undefined,
      }}
    >
      {text}
    </div>
  );
// a small cartoon maple-leaf glyph for the race (code, so it can run on legs)
const Legs: React.FC<{x: number; y: number; t: number; speed: number; len?: number; w?: number}> = ({x, y, t, speed, len = 26, w = 6}) => {
  const ph = Math.sin(2 * Math.PI * speed * t);
  return (
    <g>
      {[-1, 1].map((sd) => {
        const a = (sd * ph * 30 * Math.PI) / 180;
        const fx = x + sd * 8 + Math.sin(a) * len;
        const fy = y + Math.cos(a) * len;
        return (
          <g key={sd}>
            <line x1={x + sd * 8} y1={y} x2={fx} y2={fy} stroke={INK} strokeWidth={w} strokeLinecap="round" />
            <ellipse cx={fx + 4} cy={fy} rx={w * 1.4} ry={w * 0.8} fill={INK} />
          </g>
        );
      })}
    </g>
  );
};

// ======================================================================================================
// THE WORLD (world px = screen px at camera k = 1, camera centre at screen (540, 960))
// ======================================================================================================
const GY = 1640; // where the guy stands
const TREE = {x: 380, y: 1600, s: 1.05}; // tree feet (native 509, 1302)
const tw = (nx: number, ny: number): [number, number] => [TREE.x + (nx - 509) * TREE.s, TREE.y - (1302 - ny) * TREE.s];
// far layer: the ElevenLabs meadow plate, depth 1.25
const DEPTH_BG = 1.25;
const PL = S('plate') as unknown as {w: number; h: number};
const PSC = 1.15;
const PX0 = 520 - (PL.w / 2) * PSC;
const PY0 = 1250 - 1424 * PSC; // meadow line of the plate (ext row 1424) sits at layer y 1250
const CLOUD = {x: 1230, y: 1262, s: 0.7};
const CAP: [number, number] = [CLOUD.x, CLOUD.y - (599 - 150) * CLOUD.s];
const toScreen = (cam: Cam, X: number, Y: number, depth = 1): [number, number] => [540 + (cam.k / depth) * (X - cam.x), 960 + (cam.k / depth) * (Y - cam.y)];

// the guy (scientist with goggles): every pose scaled so the head disc has the same radius
const HR = 125;
const FEET: [number, number] = [740, GY];
type Pose = 'hero' | 'tap' | 'shrug' | 'gross' | 'happy' | 'shock';
const gS = (p: string) => HR / (S(p).hd as [number, number, number])[2];
const toW = (p: Pose, nx: number, ny: number, sx = 1, sy = 1): [number, number] => {
  const sp = S(p);
  const s = gS(p);
  return [FEET[0] + (nx - sp.feet[0]) * s * sx, FEET[1] - (sp.feet[1] - ny) * s * sy];
};
const CUT_D = 17.0;
const poseAt = (t: number): [Pose, number] => {
  if (t < T.but) return ['hero', -9];
  if (t < T.why) return ['tap', T.but];
  if (t < CUT_D) return ['shrug', T.why];
  if (t < T.and2) return ['gross', -9];
  if (t < T.leftovers2) return ['happy', T.and2];
  return ['shock', T.leftovers2];
};
const guyScale = (t: number, swap: number): [number, number] => {
  const [qx, qy] = squashSwap(t, swap);
  const breath = 1 + 0.009 * Math.sin(2 * Math.PI * 0.6 * t);
  const tug = bump(t, T.picks, 0.32, 0.03) * bump(t, T.why, 0.35, 0.04) * bump(t, T.half, 0.3, 0.03);
  return [qx, qy * breath * tug];
};

// camera
const KEYS: CamKey[] = [
  {t: 0, x: 650, y: 1160, k: 1.15},
  {t: 2.25, x: 662, y: 1140, k: 1.21},
  {t: 3.45, x: 620, y: 1020, k: 0.74},
  {t: 8.42, x: 600, y: 992, k: 0.77},
  {t: T.but, x: 640, y: 1250, k: 1.4, ease: 'cut'},
  {t: 12.7, x: 646, y: 1246, k: 1.42},
  {t: 13.4, x: 500, y: 1250, k: 1.24},
  {t: 16.95, x: 494, y: 1262, k: 1.27},
  {t: CUT_D, x: 760, y: 1300, k: 1.45, ease: 'cut'},
  {t: 19.95, x: 766, y: 1296, k: 1.47},
  {t: 20.6, x: 836, y: 1262, k: 1.5},
  {t: 21.1, x: 840, y: 1262, k: 1.5},
  {t: 21.88, x: 900, y: 1150, k: 1.85},
  {t: 22.1, x: 900, y: 1152, k: 1.85},
  {t: 22.95, x: 840, y: 1262, k: 1.5},
  {t: 23.42, x: 840, y: 1262, k: 1.5},
  {t: 24.2, x: 650, y: 1160, k: 1.15},
];
export const camOf = (t: number): Cam => {
  const c = camAt(t, KEYS);
  const amp = t > T.nuclear && t < T.nuclear + 0.8 ? 5 * Math.exp(-4 * (t - T.nuclear)) : 0;
  const sh = shake(t, amp);
  return {x: c.x + sh.x, y: c.y + sh.y, k: c.k};
};

// ---------- the bomb-carbon dots (screen space) ----------
const NDOT = 11;
type Dot = {x: number; y: number; r: number};
const dotsAt = (t: number, cam: Cam): Dot[] => {
  if (t < T.tests2 || t > T.up + 0.7) return [];
  const [cx, cy] = toScreen(cam, CAP[0], CAP[1], DEPTH_BG);
  const out: Dot[] = [];
  for (let i = 0; i < NDOT * 2; i++) {
    const p = i % NDOT;
    const child = i >= NDOT;
    const tb = child ? T.doubled + 0.025 * p : T.tests2 + 0.04 * p;
    if (t < tb) continue;
    const ang = rnd(p + 3) * Math.PI * 2;
    const rad = 60 + 105 * rnd(p + 50);
    const px = Math.min(1010, cx - 70 + Math.cos(ang) * rad * 1.05);
    const py = cy - 90 + Math.sin(ang) * rad * 0.8;
    let hx = px;
    let hy = py;
    let x0 = cx;
    let y0 = cy;
    if (child) {
      const ca = rnd(i + 90) * Math.PI * 2;
      hx = px + Math.cos(ca) * 52;
      hy = py + Math.sin(ca) * 44;
      x0 = px;
      y0 = py;
    }
    const u = easeOutCubic(prog(t, tb, tb + 0.35));
    let x = lerp(x0, hx, u);
    let y = lerp(y0, hy, u);
    // drift into the crown
    const [tx, ty] = toScreen(cam, ...tw(150 + 720 * rnd(i + 7), 160 + 520 * rnd(i + 8)));
    const d0 = T.in + 0.025 * i;
    const v = easeInOutCubic(prog(t, d0, d0 + 1.3));
    x = lerp(x, tx, v) + 9 * Math.sin(2 * Math.PI * (1.1 + 0.5 * rnd(i)) * t + i);
    y = lerp(y, ty, v) + 7 * Math.cos(2 * Math.PI * (0.9 + 0.4 * rnd(i + 1)) * t + i);
    const absorb = 1 - easeInCubic(prog(t, T.soak + 0.02 * i, T.soak + 0.02 * i + 0.4));
    const r = (11 + 4 * rnd(i + 30)) * clamp(prog(t, tb, tb + 0.12) * 1.2) * absorb;
    if (r > 0.3) out.push({x, y, r});
  }
  return out;
};
const DotG: React.FC<{d: Dot; t: number; i: number}> = ({d, t, i}) => {
  const r = d.r * (1 + 0.15 * Math.sin(2 * Math.PI * 3 * t + i));
  return (
    <g>
      <circle cx={d.x} cy={d.y} r={r * 2.4} fill={GLOW} opacity={0.3} />
      <circle cx={d.x} cy={d.y} r={r} fill={GLOW} stroke={INK} strokeWidth={r * 0.3} />
      <circle cx={d.x - r * 0.3} cy={d.y - r * 0.3} r={r * 0.3} fill="#fff" />
    </g>
  );
};

// ---------- far layer: meadow plate + the test cloud ----------
const cloudState = (t: number) => {
  const up = easeOutBack(prog(t, T.nuclear, T.nuclear + 0.6), 1.4);
  const down = easeInCubic(prog(t, 7.95, 8.45));
  const puff = bump(t, T.doubled, 0.3, 0.08);
  return {sy: t < T.nuclear ? 0 : (0.15 + 0.85 * up) * (1 - down) * puff, sx: t < T.nuclear ? 0 : (0.7 + 0.3 * easeOutCubic(prog(t, T.nuclear, T.nuclear + 0.45))) * puff};
};
const FarLayer: React.FC<{t: number; cam: Cam; cover?: boolean}> = ({t, cam, cover}) => {
  const cs = cover ? {sx: 1, sy: 1} : cloudState(t);
  const flash = !cover && t >= T.nuclear && t < T.nuclear + 0.5 ? 1 - prog(t, T.nuclear, T.nuclear + 0.5) : 0;
  const face = cover ? 1 : popOut(t, T.tests2 - 0.1, 7.9, 0.22);
  const squeeze = !cover && t > T.doubled - 0.06 && t < T.doubled + 0.32;
  return (
    <World cam={cam} depth={DEPTH_BG}>
      <div style={{position: 'absolute', left: PX0 - 1400, top: PY0 - 2600, width: PL.w * PSC + 2800, height: 2620, background: SKY}} />
      <div style={{position: 'absolute', left: PX0 - 1400, top: PY0 + PL.h * PSC - 20, width: PL.w * PSC + 2800, height: 2400, background: MEADOW}} />
      <Img src={staticFile('maple-leftovers/plate.jpg')} style={{position: 'absolute', left: PX0, top: PY0, width: PL.w * PSC, height: PL.h * PSC}} />
      {flash > 0 ? (
        <Svg>
          <circle cx={CLOUD.x} cy={1215} r={60 + 300 * (1 - flash)} fill="#FFF6C8" opacity={0.85 * flash} />
        </Svg>
      ) : null}
      {cs.sy > 0.001 ? (
        <div style={{position: 'absolute', left: CLOUD.x - 500, top: 0, width: 1000, height: 1222, overflow: 'hidden'}}>
          <Spr n="cloud" x={500} y={CLOUD.y} s={CLOUD.s} sx={cs.sx} sy={cs.sy}>
            {face > 0.01 ? (
              <g>
                <Eye x={195} y={180} r={34} open={face} squeeze={squeeze} side={-1} lid={0.35} look={[-0.5, 0.2]} brow={0.5} browTilt={-0.3} />
                <Eye x={290} y={180} r={34} open={face} squeeze={squeeze} side={1} lid={0.35} look={[-0.5, 0.2]} brow={0.5} browTilt={-0.3} />
                <path d={squeeze ? 'M 225 245 Q 243 262 262 245' : 'M 215 240 Q 245 262 275 236'} fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" />
              </g>
            ) : null}
          </Spr>
        </div>
      ) : null}
    </World>
  );
};

// ---------- the tree (sprite + code face + the pantry cut-away + the sugar run + the new leaf) ----------
const EYE_L = tw(452, 900);
const EYE_R = tw(535, 900);
const MOUTH = tw(494, 958);
const WIN = {x0: tw(432, 0)[0], x1: tw(590, 0)[0], y0: tw(0, 1018)[1], y1: tw(0, 1186)[1]};
const JARS = [
  {x: WIN.x0 + 50, y: WIN.y0 + 82},
  {x: WIN.x0 + 118, y: WIN.y0 + 82},
  {x: WIN.x0 + 84, y: WIN.y1 - 14},
];
const TUBE = [
  [WIN.x1 - 22, WIN.y0 + 6],
  [WIN.x1 - 22, 1150],
  [500, 1104],
  [528, 1086],
] as [number, number][];
const NEWLEAF = {x: 528, y: 1084};
const along = (pts: [number, number][], u: number): [number, number] => {
  const seg: number[] = [];
  let tot = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    seg.push(d);
    tot += d;
  }
  let L = clamp(u) * tot;
  for (let i = 0; i < seg.length; i++) {
    if (L <= seg[i] || i === seg.length - 1) {
      const f = seg[i] ? clamp(L / seg[i]) : 0;
      return [lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)];
    }
    L -= seg[i];
  }
  return pts[pts.length - 1];
};

const SUGAR_GOLD = '#F2C76B';
const Jar: React.FC<{x: number; y: number; sc: number; tag?: string; tagS?: number; lidUp?: number}> = ({x, y, sc, tag = '', tagS = 0, lidUp = 0}) => (
  <g transform={`translate(${x} ${y}) scale(${sc / 100})`}>
    <rect x={-50} y={-112} width={100} height={112} rx={26} fill={GLASS} stroke={INK} strokeWidth={6} />
    <rect x={-41} y={-68} width={82} height={62} rx={18} fill={SUGAR_GOLD} stroke={INK} strokeWidth={4} />
    {[-24, -6, 12, 2].map((cx, i) => (
      <rect key={i} x={cx - 8} y={i === 3 ? -96 : -82} width={18} height={18} fill={SUGAR} stroke={INK} strokeWidth={3.5} transform={`rotate(${[8, -6, 12, -10][i]} ${cx} ${i === 3 ? -87 : -73})`} />
    ))}
    <line x1={-34} y1={-98} x2={-34} y2={-40} stroke="#fff" strokeWidth={7} strokeLinecap="round" opacity={0.85} />
    <rect x={-34} y={-124} width={68} height={14} fill={GLASS} stroke={INK} strokeWidth={6} />
    <g transform={`translate(0 ${-26 * lidUp}) rotate(${-14 * lidUp})`}>
      <rect x={-40} y={-142} width={80} height={20} rx={5} fill={LID} stroke={INK} strokeWidth={6} />
    </g>
    {tag && tagS > 0.01 ? (
      <g transform={`translate(0 -38) scale(${tagS})`}>
        <rect x={-44} y={-17} width={88} height={34} rx={6} fill="#fff" stroke={INK} strokeWidth={4} />
        <text x={0} y={10} textAnchor="middle" fontFamily={FONT} fontSize={25} fill={INK}>
          {tag}
        </text>
      </g>
    ) : null}
  </g>
);

const treeFace = (t: number) => {
  const open = pop(t, 7.12, 0.25);
  const slurp = t > T.soak - 0.05 && t < T.up + 0.45;
  const shifty = t > T.saved && t < CUT_D;
  const wink = t > 23.6 ? Math.sin(Math.PI * prog(t, 23.6, 23.94)) : 0;
  const vanish = 1 - easeInCubic(prog(t, 23.97, 24.19));
  // blink once in each long hold
  const blink = (tb: number) => (t > tb && t < tb + 0.16 ? Math.sin((Math.PI * (t - tb)) / 0.16) : 0);
  const lid = Math.max(blink(9.3), blink(13.7), blink(20.8));
  let look: [number, number] = [0.15, 0.1];
  if (t > T.because && t < T.half) look = [0.7, -0.6];
  if (t > T.half && t < T.saved) look = [0.8, -0.3];
  if (shifty) look = [Math.sin(2 * Math.PI * 1.4 * (t - T.saved)) > 0 ? 0.8 : -0.8, 0.1];
  return {open: open * vanish, slurp, shifty, wink, lid, look, vanish};
};

const TreeLayer: React.FC<{t: number; cover?: boolean}> = ({t, cover}) => {
  const rus = !cover && t > T.picks ? Math.sin(2 * Math.PI * 5 * (t - T.picks)) * Math.exp(-5 * (t - T.picks)) : 0;
  const glow = cover ? 0 : Math.max(0, Math.sin(Math.PI * prog(t, T.soak - 0.1, T.up + 1.0))) * (0.6 + 0.2 * Math.sin(2 * Math.PI * 4 * t));
  const f = cover ? {open: 0, slurp: false, shifty: false, wink: 0, lid: 0, look: [0, 0] as [number, number], vanish: 0} : treeFace(t);
  const gulpS = f.slurp ? 1 + 0.1 * Math.sin(2 * Math.PI * 6 * (t - T.soak)) : 1;
  // pantry window
  const win = cover ? 0 : popOut(t, T.because + 0.02, 16.95, 0.3);
  const tube = cover ? 0 : popOut(t, T.tree, 15.0, 0.25);
  const sweat = !cover && t > T.ago - 0.1 && t < CUT_D ? pop(t, T.ago - 0.1, 0.25) : 0;
  return (
    <>
      <Svg>
        <ellipse cx={TREE.x} cy={TREE.y + 4} rx={330} ry={34} fill={SHADOW} />
      </Svg>
      <Spr n="tree" x={TREE.x} y={TREE.y} s={TREE.s} rot={0.8 * rus} sx={1 + 0.01 * rus}>
        {glow > 0.01 ? <ellipse cx={509} cy={440} rx={470} ry={400} fill={GLOW} opacity={0.32 * glow} /> : null}
      </Spr>
      {/* the trunk's face */}
      {f.open > 0.01 ? (
        <Svg>
          <Eye x={EYE_L[0]} y={EYE_L[1]} r={27} open={f.open} lid={Math.max(f.lid, f.shifty ? 0.35 : 0)} look={f.look} side={-1} squeeze={f.slurp} brow={0.55} browTilt={f.shifty ? -0.4 : 0} />
          <Eye x={EYE_R[0]} y={EYE_R[1]} r={27} open={f.open} lid={Math.max(f.lid, f.wink, f.shifty ? 0.35 : 0)} look={f.look} side={1} squeeze={f.slurp} brow={0.55} browTilt={f.shifty ? -0.4 : 0} />
          {f.slurp ? (
            <g transform={`translate(${MOUTH[0]} ${MOUTH[1]}) scale(${gulpS})`}>
              <ellipse cx={0} cy={0} rx={15} ry={19} fill="#3A1A10" stroke={INK} strokeWidth={6} />
              <ellipse cx={0} cy={9} rx={9} ry={6} fill="#FC8D90" />
            </g>
          ) : (
            <path
              transform={`translate(${MOUTH[0]} ${MOUTH[1]}) scale(${f.vanish}) translate(${-MOUTH[0]} ${-MOUTH[1]})`}
              d={f.shifty ? `M ${MOUTH[0] - 20} ${MOUTH[1] + 4} q 10 -7 20 0 q 10 7 20 0` : `M ${MOUTH[0] - 24} ${MOUTH[1] - 4} Q ${MOUTH[0]} ${MOUTH[1] + 18} ${MOUTH[0] + 24} ${MOUTH[1] - 4}`}
              fill="none"
              stroke={INK}
              strokeWidth={7}
              strokeLinecap="round"
            />
          )}
          <SweatDrop x={EYE_R[0] + 44} y={EYE_R[1] - 30 + 30 * prog(t, T.ago, CUT_D)} r={12} s={sweat} />
        </Svg>
      ) : null}
      {/* pantry cut-away in the trunk */}
      {win > 0.01 ? (
        <Svg>
          <g transform={`translate(${(WIN.x0 + WIN.x1) / 2} ${(WIN.y0 + WIN.y1) / 2}) scale(${win}) translate(${-(WIN.x0 + WIN.x1) / 2} ${-(WIN.y0 + WIN.y1) / 2})`}>
            <rect x={WIN.x0} y={WIN.y0} width={WIN.x1 - WIN.x0} height={WIN.y1 - WIN.y0} rx={22} fill={BARK_IN} stroke={INK} strokeWidth={9} />
            {/* cobwebs in the top corners */}
            <path d={`M ${WIN.x0 + 8} ${WIN.y0 + 34} Q ${WIN.x0 + 22} ${WIN.y0 + 22} ${WIN.x0 + 34} ${WIN.y0 + 8} M ${WIN.x0 + 8} ${WIN.y0 + 20} Q ${WIN.x0 + 15} ${WIN.y0 + 15} ${WIN.x0 + 20} ${WIN.y0 + 8} M ${WIN.x0 + 8} ${WIN.y0 + 8} L ${WIN.x0 + 30} ${WIN.y0 + 30}`} fill="none" stroke="#D9D9D9" strokeWidth={2.4} />
            <path d={`M ${WIN.x1 - 8} ${WIN.y0 + 30} Q ${WIN.x1 - 20} ${WIN.y0 + 20} ${WIN.x1 - 30} ${WIN.y0 + 8} M ${WIN.x1 - 8} ${WIN.y0 + 8} L ${WIN.x1 - 26} ${WIN.y0 + 26}`} fill="none" stroke="#D9D9D9" strokeWidth={2.4} />
            <rect x={WIN.x0 + 6} y={WIN.y0 + 82} width={WIN.x1 - WIN.x0 - 12} height={9} fill={SHELF} stroke={INK} strokeWidth={3} />
            <rect x={WIN.x0 + 6} y={WIN.y1 - 14} width={WIN.x1 - WIN.x0 - 12} height={9} fill={SHELF} stroke={INK} strokeWidth={3} />
            {JARS.map((j, i) => (
              <Jar key={i} x={j.x} y={j.y - 2} sc={42} />
            ))}
          </g>
        </Svg>
      ) : null}
      {/* x-ray sap tube + sugar cubes riding up to the new leaf */}
      {tube > 0.01 ? (
        <Svg>
          <polyline points={TUBE.map((p) => p.join(',')).join(' ')} fill="none" stroke={INK} strokeWidth={26 * tube} strokeLinecap="round" strokeLinejoin="round" />
          <polyline points={TUBE.map((p) => p.join(',')).join(' ')} fill="none" stroke="#C99A6B" strokeWidth={17 * tube} strokeLinecap="round" strokeLinejoin="round" />
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const t0 = T.builds + 0.11 * i;
            const u = easeInOutCubic(prog(t, t0, t0 + 0.6));
            if (t < t0 || u >= 1) return null;
            const [x, y] = along(TUBE, u);
            return <rect key={i} x={x - 8} y={y - 8} width={16} height={16} fill={SUGAR} stroke={INK} strokeWidth={3} transform={`rotate(${40 * i + 300 * u} ${x} ${y})`} />;
          })}
        </Svg>
      ) : null}
    </>
  );
};

// the new leaf that grows on "new leaves": half fresh, half old sugar (golden) on "half"
const NewLeaf: React.FC<{t: number}> = ({t}) => {
  if (t < T.new - 0.02 || t > CUT_D) return null;
  if (t > SPEC0 && t < SPEC1 + 0.36) return null; // flying as the big specimen (screen space)
  const g = easeOutBack(prog(t, T.new, T.new + 0.35), 1.6);
  const s = 0.26 * g;
  const sway = 4 * Math.sin(2 * Math.PI * 0.9 * t);
  const gold = t > SPEC1 ? 1 : 0;
  return (
    <>
      <Spr n="leaf" x={NEWLEAF.x} y={NEWLEAF.y} s={s} rot={192 + sway} ax={227} ay={548} />
      {gold > 0.01 ? <Spr n="leaf" x={NEWLEAF.x} y={NEWLEAF.y} s={s} rot={192 + sway} ax={227} ay={548} clip="inset(0 0 0 50%)" filter={GOLD_F} /> : null}
    </>
  );
};
// on "half": the new leaf flies up big (screen space) - right half golden = old sugar
const SPEC0 = T.half - 0.08;
const SPEC1 = T.saved - 0.1;
const GOLD_F = 'sepia(1) saturate(2.2) hue-rotate(-12deg) brightness(1.08)';
const Sparkle: React.FC<{cx: number; cy: number; r: number}> = ({cx, cy, r}) => (
  <path d={`M ${cx} ${cy - r} L ${cx + r * 0.25} ${cy - r * 0.25} L ${cx + r} ${cy} L ${cx + r * 0.25} ${cy + r * 0.25} L ${cx} ${cy + r} L ${cx - r * 0.25} ${cy + r * 0.25} L ${cx - r} ${cy} L ${cx - r * 0.25} ${cy - r * 0.25} Z`} fill="#fff" stroke={INK} strokeWidth={4} />
);
const Specimen: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  if (t < SPEC0 || t > SPEC1 + 0.36) return null;
  const [hx, hy] = toScreen(cam, NEWLEAF.x, NEWLEAF.y);
  const out = t < SPEC1 ? easeInOutCubic(prog(t, SPEC0, SPEC0 + 0.42)) : 1 - easeInOutCubic(prog(t, SPEC1, SPEC1 + 0.36));
  const X = lerp(hx, 470, out);
  const Y = lerp(hy, 760, out);
  const sc = lerp(0.26 * cam.k, 0.74, out);
  const rot = lerp(192, 360, out) + 3 * Math.sin(2 * Math.PI * 0.8 * t);
  const gold = pop(t, T.half + 0.05, 0.3);
  const lab = t < SPEC1 ? pop(t, T.sugar - 0.04, 0.25) : 1 - prog(t, SPEC1, SPEC1 + 0.15);
  return (
    <AbsoluteFill>
      <Spr n="leaf" x={X} y={Y} s={sc} rot={rot} ax={227} ay={548} />
      {gold > 0.01 ? (
        <Spr n="leaf" x={X} y={Y} s={sc} rot={rot} ax={227} ay={548} clip="inset(0 0 0 50%)" filter={`sepia(1) saturate(${2.2 * gold}) hue-rotate(-12deg) brightness(1.08)`}>
          {[0, 1, 2].map((i) => (
            <Sparkle key={i} cx={300 + 50 * i} cy={120 + 110 * i} r={20 * gold * (0.7 + 0.3 * Math.sin(2 * Math.PI * (2.2 + 0.4 * i) * t + i * 2))} />
          ))}
        </Spr>
      ) : null}
      {gold > 0.01 && out > 0.9 ? (
        <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1080} height={1920}>
          <line x1={X} y1={Y - 0.74 * 548 + 20} x2={X} y2={Y - 0.74 * 548 + 360} stroke={INK} strokeWidth={6} strokeDasharray="16 12" opacity={gold} />
        </svg>
      ) : null}
      <Label x={X + 330} y={Y - 300} text="OLD SUGAR" size={50} s={lab} rot={-5} bg="#fff" fill={INK} />
      <Label x={X - 300} y={Y - 300} text="FRESH" size={50} s={lab} rot={4} bg="#fff" fill={INK} />
    </AbsoluteFill>
  );
};

// ---------- the leaf character (from "But" to the pan) ----------
const LEAFC0: [number, number] = [891, 999]; // the leaf in the hero's raised hand (world)
const LEAFC1: [number, number] = [522, 1236];
const leafChar = (t: number) => {
  const u = easeOutBack(prog(t, T.but, T.but + 0.5), 1.2);
  const out = easeInOutCubic(prog(t, 12.55, 13.15));
  const bob = 10 * Math.sin(2 * Math.PI * 0.8 * (t - T.but));
  const shrug = t > T.why && t < T.why + 0.6 ? 14 * Math.sin(2 * Math.PI * 3.2 * (t - T.why)) * (1 - prog(t, T.why, T.why + 0.6)) : 0;
  const x = lerp(lerp(LEAFC0[0], LEAFC1[0], u), 330, out);
  const y = lerp(lerp(LEAFC0[1], LEAFC1[1], u), 980, out) + bob * (1 - out);
  const s = lerp(lerp(0.24, 0.42, clamp(u)), 0.0, out);
  const rot = lerp(0, -10, clamp(u)) + 5 * Math.sin(2 * Math.PI * 0.6 * t) + shrug + 220 * out;
  return {x, y, s, rot};
};
const LeafChar: React.FC<{t: number}> = ({t}) => {
  if (t < T.but || t > 13.15) return null;
  const c = leafChar(t);
  const eyes = pop(t, T.but + 0.35, 0.22);
  const stamp = t > T.late - 0.02 ? clamp(1.7 - 0.7 * easeOutCubic(prog(t, T.late, T.late + 0.14))) : 0;
  const sweat = pop(t, T.late + 0.35, 0.25);
  const shrugEyes = t > T.why && t < T.why + 0.6;
  return (
    <Spr n="leaf" x={c.x} y={c.y} s={c.s} rot={c.rot} ax={227} ay={300}>
      <Eye x={182} y={235} r={36} open={eyes} look={[0.7, 0.1]} side={-1} lid={0.15} brow={0.5} browTilt={shrugEyes ? -0.6 : 0.5} ink={0.18} />
      <Eye x={272} y={235} r={36} open={eyes} look={[0.7, 0.1]} side={1} lid={0.15} brow={0.5} browTilt={shrugEyes ? -0.6 : 0.5} ink={0.18} />
      {eyes > 0.01 ? <path d="M 200 318 q 14 -10 28 0 q 14 10 28 0" fill="none" stroke={INK} strokeWidth={9} strokeLinecap="round" /> : null}
      <SweatDrop x={330} y={150 + 40 * prog(t, T.late + 0.35, 12.5)} r={24} s={sweat} />
      {stamp > 0.01 ? (
        <g transform={`translate(227 395) rotate(-14) scale(${stamp})`} opacity={clamp(prog(t, T.late - 0.02, T.late + 0.04) * 2)}>
          <rect x={-120} y={-46} width={240} height={92} rx={12} fill="#fff" stroke={RED} strokeWidth={14} />
          <text x={0} y={30} textAnchor="middle" fontFamily={FONT} fontSize={82} fill={RED}>
            LATE
          </text>
        </g>
      ) : null}
    </Spr>
  );
};

// ---------- the guy + what he holds ----------
const BOT_S = 0.34;
const BOT_AT: [number, number] = [168, 372]; // the fist grips the bottle's body
const bottleRot = (t: number) => {
  if (t < T.and2) return 0;
  if (t < T.leftovers2) return lerp(0, -125, easeInOutCubic(prog(t, T.and2 + 0.08, T.syrup - 0.05)));
  return lerp(-125, 0, easeOutBack(prog(t, T.leftovers2, T.leftovers2 + 0.28), 1.3));
};
const Guy: React.FC<{t: number; cover?: boolean}> = ({t, cover}) => {
  const [p, swap] = cover ? (['hero', -9] as [Pose, number]) : poseAt(t);
  const [sx, sy0] = cover ? [1, 1] : guyScale(t, swap);
  const tremble = p === 'gross' ? 1.6 * Math.sin(2 * Math.PI * 11 * t) : 0;
  const sy = sy0;
  const s = gS(p);
  return (
    <>
      <Svg>
        <ellipse cx={FEET[0] + 4} cy={FEET[1] + 3} rx={135} ry={20} fill={SHADOW} />
      </Svg>
      <Spr n={p} x={FEET[0] + tremble} y={FEET[1]} s={s} sx={sx} sy={sy} />
    </>
  );
};
// the bottle (gripped by its body in the raised fist: behind the guy while pouring, in front once upright), syrup, candles, hat
const Breakfast: React.FC<{t: number; layer: 'back' | 'front'}> = ({t, layer}) => {
  if (t < T.and2) return null;
  const [p, swap] = poseAt(t);
  const [sx, sy] = guyScale(t, swap);
  const [fx, fy] = toW(p, 452, 147, sx, sy);
  const rot = bottleRot(t);
  const a = (rot * Math.PI) / 180;
  const capD = (BOT_AT[1] - 22) * BOT_S;
  const cap: [number, number] = [fx + capD * Math.sin(a), fy - capD * Math.cos(a)];
  const top: [number, number] = toW(p, 322, 376, sx, sy); // top of the pancake stack
  const pourX = fx + capD * Math.sin((-125 * Math.PI) / 180); // where the syrup lands (fixed, also after he jerks it upright)
  // syrup stream from the cap to the pancakes: grows, then gets cut on "Leftovers too"
  const pour0 = T.syrup - 0.02;
  const grow = easeInOutCubic(prog(t, pour0, pour0 + 0.25));
  const cut = prog(t, T.leftovers2, T.leftovers2 + 0.3);
  const showStream = t > pour0 && cut < 1;
  const sA = cut; // the cut-off part falls from the cap end
  const qp = (u: number): [number, number] => [pourX, lerp(t < T.leftovers2 ? cap[1] : top[1] - 100, top[1] + 2, u)];
  const pts: string[] = [];
  const u0 = sA;
  const u1 = grow;
  for (let i = 0; i <= 16; i++) {
    const u = lerp(u0, u1, i / 16);
    const [x, y] = qp(u);
    pts.push(`${x + 2.5 * Math.sin(2 * Math.PI * 4 * t + u * 9) * u},${y}`);
  }
  const pool = clamp(prog(t, pour0 + 0.2, T.leftovers2));
  const eyes = pop(t, T.leftovers2 + 0.06, 0.22);
  const note = t > T.too - 0.02 ? clamp(1.6 - 0.6 * easeOutCubic(prog(t, T.too, T.too + 0.14))) : 0;
  const hat = pop(t, T.years3 - 0.04, 0.28);
  const hatTilt = -12 + 6 * Math.sin(2 * Math.PI * 1.5 * t);
  const candles = [T.three, T.three + 0.08, T.three + 0.16, T.five, T.five + 0.08];
  const flick = (i: number) => 1 + 0.12 * Math.sin(2 * Math.PI * (7 + i) * t + i);
  const sweat = pop(t, T.too + 0.3, 0.25);
  const front = t >= T.leftovers2;
  const bottle = (
    <Spr n="bottle" x={fx} y={fy} s={BOT_S} rot={rot} ax={BOT_AT[0]} ay={BOT_AT[1]}>
      {eyes > 0.01 ? (
        <g>
          <Eye x={122} y={300} r={34} open={eyes} look={[-0.6, -0.2]} side={-1} brow={0.5} browTilt={0.4} />
          <Eye x={214} y={300} r={34} open={eyes} look={[-0.6, -0.2]} side={1} brow={0.5} browTilt={0.4} />
          <path d="M 140 375 q 28 -16 56 0" fill="none" stroke={INK} strokeWidth={10} strokeLinecap="round" />
          <SweatDrop x={270} y={240 + 40 * prog(t, T.too + 0.3, 24)} r={22} s={sweat} />
        </g>
      ) : null}
      {note > 0.01 ? (
        <g transform={`translate(168 470) rotate(8) scale(${note})`}>
          <rect x={-205} y={-50} width={410} height={100} fill={YEL} stroke={INK} strokeWidth={10} />
          <text x={0} y={22} textAnchor="middle" fontFamily={FONT} fontSize={62} fill={INK}>
            LEFTOVERS
          </text>
        </g>
      ) : null}
      {hat > 0.01 ? (
        <g transform={`translate(168 18) rotate(${hatTilt}) scale(${hat})`}>
          <path d="M -62 0 L 0 -150 L 62 0 Z" fill="#7EC8F2" stroke={INK} strokeWidth={10} strokeLinejoin="round" />
          <path d="M -36 -62 L 30 -78 M -48 -28 L 46 -50 M -20 -110 L 16 -118" stroke="#F28DB2" strokeWidth={14} strokeLinecap="round" />
          <circle cx={0} cy={-156} r={22} fill={YEL} stroke={INK} strokeWidth={8} />
        </g>
      ) : null}
    </Spr>
  );
  if (layer === 'back') return front ? null : bottle;
  return (
    <>
      <Svg>
        {pool > 0.01 ? (
          <g>
            <ellipse cx={pourX} cy={top[1] + 4} rx={50 * pool} ry={11 * pool} fill={SYRUP} stroke={INK} strokeWidth={4} />
            <path d={`M ${pourX - 34 * pool} ${top[1] + 8} q -5 ${22 * pool} 0 ${34 * pool}`} fill="none" stroke={INK} strokeWidth={13} strokeLinecap="round" />
            <path d={`M ${pourX - 34 * pool} ${top[1] + 8} q -5 ${22 * pool} 0 ${34 * pool}`} fill="none" stroke={SYRUP} strokeWidth={6} strokeLinecap="round" />
          </g>
        ) : null}
        {showStream && grow > 0.02 ? (
          <g>
            <polyline points={pts.join(' ')} fill="none" stroke={INK} strokeWidth={17} strokeLinecap="round" strokeLinejoin="round" />
            <polyline points={pts.join(' ')} fill="none" stroke={SYRUP} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        ) : null}
        {candles.map((tc, i) => {
          const c = pop(t, tc, 0.22);
          if (c <= 0.01) return null;
          const cx = top[0] - 44 + 22 * i;
          const cy = top[1] - 2;
          const col = i % 2 ? '#7EC8F2' : '#F28DB2';
          const f = flick(i);
          return (
            <g key={i} transform={`translate(${cx} ${cy}) scale(${c})`}>
              <rect x={-5} y={-38} width={10} height={38} fill={col} stroke={INK} strokeWidth={3} />
              <line x1={0} y1={-38} x2={0} y2={-44} stroke={INK} strokeWidth={3} />
              <path d={`M 0 ${-66 * f} C 9 ${-54} 9 ${-46} 0 -44 C -9 -46 -9 -54 0 ${-66 * f} Z`} fill="#FFD23F" stroke={INK} strokeWidth={3} />
            </g>
          );
        })}
      </Svg>
      {front ? bottle : null}
    </>
  );
};

// ---------- the scene ----------
const FallingLeaves: React.FC<{t: number}> = ({t}) => (
  <>
    {[0, 1].map((i) => {
      const t0 = T.picks + 0.05 + 0.18 * i;
      const tau = t - t0;
      if (tau < 0 || tau > 3.2) return null;
      const x = 900 + 110 * i + 55 * Math.sin(2 * Math.PI * 0.7 * tau + i);
      const y = 990 + 190 * tau;
      if (y > GY - 10) return null;
      return <Spr key={i} n="leaf" x={x} y={y} s={0.17} rot={40 * Math.sin(2 * Math.PI * 0.7 * tau + i) + 30 * i} ax={227} ay={230} />;
    })}
  </>
);

const StinkAndFly: React.FC<{t: number}> = ({t}) => {
  if (t < CUT_D || t > T.and2 + 0.05) return null;
  const [lx, ly] = toW('gross', 537, 290);
  const st = pop(t, T.leaf, 0.3);
  const note = t > T.leftovers - 0.02 ? clamp(1.6 - 0.6 * easeOutCubic(prog(t, T.leftovers, T.leftovers + 0.14))) : 0;
  const fa = 2 * Math.PI * 1.6 * (t - CUT_D);
  const fxx = lx + 95 * Math.cos(fa);
  const fyy = ly - 40 + 50 * Math.sin(2 * fa);
  const fly = pop(t, T.leaf + 0.15, 0.2);
  return (
    <Svg>
      {st > 0.01
        ? [0, 1, 2].map((i) => {
            const ph = (t * 0.8 + i / 3) % 1;
            const life = Math.sin(Math.PI * ph);
            const x = lx - 30 + 30 * i;
            const y = ly - 70 - 120 * ph;
            const w = 9 * st * life;
            return (
              <g key={i}>
                <path d={`M ${x} ${y + 40} q -12 -10 0 -20 q 12 -10 0 -20`} fill="none" stroke={INK} strokeWidth={w + 6} strokeLinecap="round" />
                <path d={`M ${x} ${y + 40} q -12 -10 0 -20 q 12 -10 0 -20`} fill="none" stroke="#9CB548" strokeWidth={w} strokeLinecap="round" />
              </g>
            );
          })
        : null}
      {fly > 0.01 ? (
        <g transform={`translate(${fxx} ${fyy}) scale(${fly})`}>
          <ellipse cx={-6} cy={-9} rx={9} ry={6} fill="#fff" stroke={INK} strokeWidth={2.5} transform={`rotate(${-30 + 20 * Math.sin(2 * Math.PI * 25 * t)})`} />
          <ellipse cx={6} cy={-9} rx={9} ry={6} fill="#fff" stroke={INK} strokeWidth={2.5} transform={`rotate(${30 - 20 * Math.sin(2 * Math.PI * 25 * t)})`} />
          <ellipse cx={0} cy={0} rx={10} ry={8} fill={INK} />
        </g>
      ) : null}
      {note > 0.01 ? (
        <g transform={`translate(${lx} ${ly + 6}) rotate(-8) scale(${note})`}>
          <rect x={-118} y={-30} width={236} height={60} fill={YEL} stroke={INK} strokeWidth={6} />
          <text x={0} y={13} textAnchor="middle" fontFamily={FONT} fontSize={34} fill={INK}>
            LEFTOVERS
          </text>
        </g>
      ) : null}
    </Svg>
  );
};

export const MapleScene: React.FC<{t: number; cam?: Cam; cover?: boolean}> = ({t, cam: camIn, cover}) => {
  const cam = camIn ?? camOf(t);
  const q = cover ? 0 : popOut(t, T.why - 0.02, T.why + 0.75, 0.25);
  const qd = cover ? 0 : popOut(t, T.leftovers2 - 0.02, T.leftovers2 + 0.55, 0.2);
  return (
    <AbsoluteFill style={{backgroundColor: SKY}}>
      <FarLayer t={t} cam={cam} cover={cover} />
      <World cam={cam}>
        <div style={{position: 'absolute', left: -2600, top: 1478, width: 6800, height: 3000, background: MEADOW}} />
        <Svg>
          {[
            [140, 1720, 280, 38],
            [1010, 1830, 320, 46],
            [600, 1560, 170, 20],
            [1260, 1610, 220, 28],
            [-260, 1600, 240, 30],
          ].map(([x, y, rx, ry], i) => (
            <ellipse key={i} cx={x} cy={y} rx={rx} ry={ry} fill={MEADOW_D} />
          ))}
        </Svg>
        <TreeLayer t={t} cover={cover} />
        {cover ? null : <NewLeaf t={t} />}
        {cover ? null : <Breakfast t={t} layer="back" />}
        {cover ? null : <FallingLeaves t={t} />}
        <Guy t={t} cover={cover} />
        {cover ? null : <Breakfast t={t} layer="front" />}
        {cover ? null : (
          <Svg>
            {t > T.picks && t < T.picks + 0.45 ? <Sparkle cx={LEAFC0[0] + 40} cy={LEAFC0[1] - 60} r={34 * Math.sin(Math.PI * prog(t, T.picks, T.picks + 0.45))} /> : null}
          </Svg>
        )}
        {cover ? null : <LeafChar t={t} />}
        {cover ? null : <StinkAndFly t={t} />}
        <Label x={760} y={930} text="?" size={170} s={q} rot={10} fill={YEL} />
        <Label x={1010} y={1010} text="!!" size={120} s={qd} rot={12} fill={YEL} />
      </World>
      {cover ? null : <Overlays t={t} cam={cam} />}
    </AbsoluteFill>
  );
};

// ---------- screen-space overlays: the bomb carbon, its tags, the race, the age tag, confetti ----------
const AIR_GO = T.two;
const AIR_FIN = 10.55;
const LEAF_GO = 10.42;
const LEAF_FIN = T.air2 + 0.02;
const FIN_X = 830;
const Race: React.FC<{t: number}> = ({t}) => {
  const s = popOut(t, 10.0, 11.92, 0.28);
  if (s <= 0.001) return null;
  const year = t < AIR_FIN ? '' : t < 10.95 ? '2022' : t < LEAF_FIN ? '2023' : '2024';
  const yb = (tb: number) => bump(t, tb, 0.22, 0.18);
  const ys = t < AIR_FIN ? 0 : pop(t, AIR_FIN, 0.2) * yb(10.95) * yb(LEAF_FIN);
  const ax = t < AIR_GO ? 120 : lerp(120, 1180, easeInCubic(prog(t, AIR_GO, AIR_GO + 0.62)));
  const lx = t < LEAF_GO ? 120 : lerp(120, FIN_X + 20, easeInOutCubic(prog(t, LEAF_GO, LEAF_FIN + 0.03)));
  const late = pop(t, LEAF_FIN + 0.05, 0.25);
  const GYR = 560;
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', left: 540, top: 455, transform: `translate(-50%, -50%) scale(${s})`, width: 980, height: 420}}>
        <svg width={980} height={420} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} viewBox="40 245 980 420">
          <rect x={50} y={255} width={960} height={400} rx={34} fill="#EAF6FF" stroke={INK} strokeWidth={9} />
          <rect x={56} y={GYR} width={948} height={89} fill={MEADOW} />
          <line x1={56} y1={GYR} x2={1004} y2={GYR} stroke={INK} strokeWidth={6} />
          <rect x={50} y={255} width={960} height={400} rx={34} fill="none" stroke={INK} strokeWidth={9} />
          {/* finish line + flag */}
          {Array.from({length: 8}, (_, i) => (
            <rect key={i} x={FIN_X - 9} y={GYR + 4 + i * 11} width={9} height={11} fill={i % 2 ? '#fff' : INK} />
          ))}
          <line x1={FIN_X} y1={GYR} x2={FIN_X} y2={GYR - 180} stroke={INK} strokeWidth={7} strokeLinecap="round" />
          <g transform={`translate(${FIN_X} ${GYR - 178}) skewY(${4 * Math.sin(2 * Math.PI * 1.6 * t)})`}>
            <rect x={0} y={0} width={86} height={58} fill="#fff" stroke={INK} strokeWidth={6} />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <rect key={i} x={(i % 3) * 28.7 + ((Math.floor(i / 3) % 2) ? 14 : 0)} y={Math.floor(i / 3) * 29} width={14.3} height={29} fill={INK} />
            ))}
          </g>
          {/* the air: a puffy cloud running */}
          {ax < 1150 ? (
            <g transform={`translate(${ax} ${GYR - 62})`}>
              <Legs x={0} y={30} t={t} speed={9} len={30} w={7} />
              <PuffCluster puffs={[{x: -34, y: 0, r: 30}, {x: 0, y: -16, r: 38}, {x: 34, y: 0, r: 30}, {x: 0, y: 14, r: 30}]} fill="#fff" ink={7} />
              <Eye x={-12} y={-6} r={12} open={1} look={[0.9, 0]} brow={NaN} />
              <Eye x={14} y={-6} r={12} open={1} look={[0.9, 0]} brow={NaN} />
              {[0, 1, 2].map((i) => (
                <line key={i} x1={-70 - 20 * i} y1={-14 + 16 * i} x2={-110 - 30 * i} y2={-14 + 16 * i} stroke={INK} strokeWidth={6} strokeLinecap="round" />
              ))}
              <text x={0} y={-62} textAnchor="middle" fontFamily={FONT} fontSize={38} fill="#fff" stroke={INK} strokeWidth={8} paintOrder="stroke">
                AIR
              </text>
            </g>
          ) : null}
          {/* the leaf: waddles on short legs */}
          <g transform={`translate(${lx} ${GYR - 54 - 6 * Math.abs(Math.sin(2 * Math.PI * 3.5 * t))})`}>
            <Legs x={0} y={22} t={t} speed={3.5} len={28} w={7} />
          </g>
          <text x={FIN_X} y={GYR - 214} textAnchor="middle" fontFamily={FONT} fontSize={0.001 + 64 * ys} fill={YEL} stroke={INK} strokeWidth={12} paintOrder="stroke">
            {year}
          </text>
          {late > 0.01 ? (
            <g transform={`translate(${FIN_X - 370} ${GYR - 105}) rotate(-6) scale(${late})`}>
              <text x={0} y={0} textAnchor="middle" fontFamily={FONT} fontSize={70} fill={RED} stroke={INK} strokeWidth={10} paintOrder="stroke">
                +2 YEARS
              </text>
            </g>
          ) : null}
        </svg>
        {/* the leaf sprite (rides on the legs drawn above) */}
        <div style={{position: 'absolute', left: lx - 40 - 2, top: GYR - 245 - 54 - 6 * Math.abs(Math.sin(2 * Math.PI * 3.5 * t)) - 2}}>
          <Spr n="leaf" x={0} y={0} s={0.2} ax={227} ay={300} rot={8 * Math.sin(2 * Math.PI * 3.5 * t)}>
            <Eye x={182} y={235} r={40} open={1} look={[0.8, 0.2]} side={-1} brow={0.5} browTilt={0.6} ink={0.2} />
            <Eye x={272} y={235} r={40} open={1} look={[0.8, 0.2]} side={1} brow={0.5} browTilt={0.6} ink={0.2} />
            <ellipse cx={227} cy={325} rx={20} ry={24} fill="#3A1A10" stroke={INK} strokeWidth={9} />
          </Spr>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// zoom bubble on the pantry in the trunk ("sugar it saved years ago"), screen space
const PantryInset: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const s = popOut(t, T.saved - 0.06, 16.92, 0.3);
  if (s <= 0.001) return null;
  const [wx0, wy0] = toScreen(cam, (WIN.x0 + WIN.x1) / 2, (WIN.y0 + WIN.y1) / 2);
  const INSET = {x: wx0, y: wy0 - 20, r: 210};
  const lid = Math.sin(Math.PI * prog(t, T.ago - 0.12, T.ago + 0.3));
  const dust = prog(t, T.ago - 0.05, T.ago + 0.55);
  const shelfY = INSET.y + 112;
  return (
    <AbsoluteFill>
      <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1080} height={1920}>
        <g transform={`translate(${INSET.x} ${INSET.y}) scale(${s}) translate(${-INSET.x} ${-INSET.y})`}>
          <circle cx={INSET.x} cy={INSET.y} r={INSET.r} fill={BARK_IN} stroke={INK} strokeWidth={12} />
          <clipPath id="insetclip">
            <circle cx={INSET.x} cy={INSET.y} r={INSET.r - 6} />
          </clipPath>
          <g clipPath="url(#insetclip)">
            <path d={`M ${INSET.x - 200} ${INSET.y - 60} Q ${INSET.x - 130} ${INSET.y - 110} ${INSET.x - 70} ${INSET.y - 200} M ${INSET.x - 200} ${INSET.y - 120} Q ${INSET.x - 160} ${INSET.y - 150} ${INSET.x - 130} ${INSET.y - 200} M ${INSET.x - 210} ${INSET.y - 210} L ${INSET.x - 110} ${INSET.y - 110}`} fill="none" stroke="#D9D9D9" strokeWidth={4} />
            <path d={`M ${INSET.x + 200} ${INSET.y - 80} Q ${INSET.x + 150} ${INSET.y - 130} ${INSET.x + 100} ${INSET.y - 200} M ${INSET.x + 210} ${INSET.y - 210} L ${INSET.x + 130} ${INSET.y - 130}`} fill="none" stroke="#D9D9D9" strokeWidth={4} />
            <rect x={INSET.x - 240} y={shelfY} width={480} height={24} fill={SHELF} stroke={INK} strokeWidth={6} />
            <Jar x={INSET.x - 80} y={shelfY} sc={108} tag="2 YRS" tagS={pop(t, T.years2 - 0.02, 0.25)} />
            <Jar x={INSET.x + 80} y={shelfY} sc={108} tag="3 YRS" tagS={pop(t, T.years2 + 0.1, 0.25)} lidUp={lid} />
            {dust > 0 && dust < 1 ? (
              <PuffCluster
                puffs={Array.from({length: 7}, (_, i) => {
                  const a = -Math.PI / 2 + (i - 3) * 0.42;
                  const g = Math.sin(Math.PI * dust);
                  return {x: INSET.x + 80 + Math.cos(a) * 70 * (0.4 + dust), y: shelfY - 160 + Math.sin(a) * 50 * (0.4 + dust), r: 30 * g * (0.8 + 0.3 * rnd(i + 4))};
                })}
                fill="#B9B1A8"
                ink={6}
              />
            ) : null}
          </g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};

const Confetti: React.FC<{t: number; x: number; y: number}> = ({t, x, y}) => {
  if (t < T.old) return null;
  const tau = t - T.old;
  return (
    <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1080} height={1920}>
      {Array.from({length: 34}, (_, i) => {
        const a = -Math.PI / 2 + (rnd(i) - 0.5) * 2.4;
        const v = 700 + 600 * rnd(i + 10);
        const px = x + Math.cos(a) * v * tau * 0.8;
        const py = y + Math.sin(a) * v * tau + 0.5 * 1500 * tau * tau;
        const cols = ['#F28DB2', '#7EC8F2', YEL, '#9BCB5E', RED];
        const sz = 1 - prog(tau, 0.5, 0.95);
        if (sz <= 0) return null;
        return <rect key={i} x={px - 9} y={py - 5} width={18 * sz} height={10 * sz} fill={cols[i % 5]} stroke={INK} strokeWidth={2.5} transform={`rotate(${360 * rnd(i + 3) + 700 * tau} ${px} ${py})`} />;
      })}
    </svg>
  );
};

const Overlays: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const dots = dotsAt(t, cam);
  const [cx, cy] = toScreen(cam, CAP[0], CAP[1], DEPTH_BG);
  const x2 = popOut(t, T.doubled + 0.03, 6.3, 0.25);
  const c14 = popOut(t, T.carbon - 0.04, 7.2, 0.25);
  const age = popOut(t, T.years3 - 0.04, 24.4, 0.28);
  // party: confetti from the bottle hat (screen space of the hat)
  const [hx, hy] = toScreen(cam, 925, 985);
  return (
    <AbsoluteFill>
      <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1080} height={1920}>
        {dots.map((d, i) => (
          <DotG key={i} d={d} t={t} i={i} />
        ))}
      </svg>
      <Label x={cx - 10} y={cy - 330} text="x2" size={110} s={x2} rot={-8} fill={YEL} />
      <Label x={Math.min(cx - 160, 760)} y={cy - 475} text="CARBON-14" size={60} s={c14} rot={-4} bg="#fff" fill={INK} />
      <PantryInset t={t} cam={cam} />
      <Specimen t={t} cam={cam} />
      <Race t={t} />
      <Label x={540} y={360} text="3-5 YEARS OLD" size={92} s={age} rot={-4} fill={YEL} />
      <Confetti t={t} x={hx} y={hy} />
    </AbsoluteFill>
  );
};

// ---------- sound ----------
const CUES: Cue[] = [
  {f: 'leaf_rustle', at: T.picks - 0.08, db: -22},
  {f: 'boom_low', at: T.nuclear + 0.02, db: -18},
  {f: 'pop', at: T.tests2, db: -22},
  {f: 'pop', at: T.doubled + 0.02, db: -20, rate: 1.3},
  {f: 'pop', at: T.doubled + 0.12, db: -22, rate: 1.5},
  {f: 'twinkle', at: T.carbon - 0.02, db: -24},
  {f: 'whoosh', at: T.in + 0.25, db: -27},
  {f: 'slurp', at: T.soak - 0.05, db: -20, dur: 0.85},
  {f: 'scratch', at: T.but - 0.03, db: -17},
  {f: 'tick_tock', at: T.run - 0.05, db: -19},
  {f: 'stamp', at: T.late - 0.01, db: -15},
  {f: 'zoomaway', at: AIR_GO + 0.05, db: -22},
  {f: 'flip', at: AIR_FIN - 0.3, db: -22},
  {f: 'tiptoe', at: LEAF_GO, db: -22, dur: 0.95},
  {f: 'flip', at: 10.95 - 0.3, db: -24},
  {f: 'flip', at: LEAF_FIN - 0.3, db: -21},
  {f: 'boing', at: T.why - 0.02, db: -23},
  {f: 'creak', at: T.because, db: -22, dur: 0.55},
  {f: 'sugar_rattle', at: T.builds - 0.02, db: -19},
  {f: 'sprout', at: T.new - 0.02, db: -20},
  {f: 'magic', at: T.half - 0.02, db: -23},
  {f: 'pop', at: T.years2, db: -22},
  {f: 'dustplop', at: T.ago - 0.06, db: -18},
  {f: 'stink', at: T.leaf - 0.02, db: -24},
  {f: 'fly', at: T.leaf + 0.1, db: -29, dur: 1.9},
  {f: 'stamp', at: T.leftovers - 0.01, db: -15},
  {f: 'syrup_glug', at: T.syrup - 0.05, db: -15},
  {f: 'gulp', at: T.leftovers2 + 0.02, db: -18},
  {f: 'stamp', at: T.too - 0.01, db: -16},
  {f: 'pop', at: T.three, db: -22},
  {f: 'pop', at: T.three + 0.08, db: -22, rate: 1.12},
  {f: 'pop', at: T.three + 0.16, db: -22, rate: 1.25},
  {f: 'pop', at: T.five, db: -21, rate: 1.35},
  {f: 'pop', at: T.five + 0.08, db: -21, rate: 1.5},
  {f: 'party_horn', at: T.old, db: -17},
  {f: 'twinkle', at: 23.84, db: -24},
];

export const MapleLeftoversShort: React.FC = () => {
  useMapleFont();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  return (
    <AbsoluteFill style={{backgroundColor: SKY}}>
      <MapleScene t={t} />
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('maple-leftovers/vo/take1.mp3')} volume={Math.pow(10, MIX_DB / 20)} />
      </Sequence>
      <Sequence from={Math.round(0.1 * FPS)} layout="none">
        <Audio src={staticFile('maple-leftovers/music/bed.wav')} />
      </Sequence>
      <SoundCues cues={CUES} dir="maple-leftovers/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};
