import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SPR} from './sprites';
import {CUT_C, CUT_D, CUT_E, CUT_F, CUT_G, DURATION, FPS, T, VO_AT} from './scene';
export {DURATION as SHS_DURATION, FPS as SHS_FPS} from './scene';
import {along, camAt, clamp, easeInCubic, easeInOutCubic, easeOutCubic, lerp, pop, prog, rnd, shake, spring, type Cam, type CamKey} from '../shared/anim';
import {World} from '../shared/World';
import {PuffCluster, type Puff} from '../shared/Puffs';
import {SweatDrop} from '../shared/SweatDrop';
import {Eye} from '../shared/Face';
import {SoundCues, type Cue} from '../shared/Sound';
import {useFont} from '../shared/useFont';

// "Why do sharks leave before a hurricane?" - fourteen tagged baby blacktips beep in a shallow Florida bay (the guy on
// the dock listens with headphones). One night every beep heads out, straight past a big shark. Why? Hours later a
// tropical storm hits an empty bay. Flashback: the babies feel the air pressure drop (barometer) and dart out.
// Weeks later the bay beeps again and the guy jumps for joy; the last frame is frame 0 again (loop).

const F = (n: string) => staticFile(`shark-storm/${n}.png`);
export const FONT = 'SHSInter';
export const useSHSFont = () => useFont(FONT, staticFile('fonts/Inter-Black.otf'));
const MIX_DB = -0.5;
const INK = '#000';
export const NAVY = '#0E1640';
const YEL = '#FFE45C';

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

type SprInfo = {w: number; h: number; feet: [number, number]; hw?: [number, number, number]; tag?: [number, number]; align?: [number, number]; post?: {cx: number; bottom: number}; bottom: number; left: number; right: number; top: number};
const S = (n: string) => (SPR as unknown as Record<string, SprInfo>)[n];

// a sprite anchored at (ax, ay) sprite px, placed at world (x, y)
const Spr: React.FC<{n: string; x: number; y: number; s: number; sx?: number; sy?: number; rot?: number; ax?: number; ay?: number; filter?: string}> = ({n, x, y, s, sx = 1, sy = 1, rot = 0, ax, ay, filter}) => {
  const sp = S(n);
  const axx = ax ?? sp.feet[0];
  const ayy = ay ?? sp.feet[1];
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg) scale(${sx}, ${sy})`, transformOrigin: '0 0', filter}}>
      <Img src={F(n)} style={{position: 'absolute', left: -axx * s, top: -ayy * s, width: sp.w * s, height: sp.h * s}} />
    </div>
  );
};
const Svg: React.FC<{children: React.ReactNode; r?: number}> = ({children, r = 6000}) => (
  <svg style={{position: 'absolute', left: -r, top: -r, overflow: 'visible'}} width={2 * r} height={2 * r} viewBox={`${-r} ${-r} ${2 * r} ${2 * r}`}>
    {children}
  </svg>
);
const Txt: React.FC<{x: number; y: number; size: number; s?: number; text: string; rot?: number; fill?: string}> = ({x, y, size, s = 1, text, rot = 0, fill = '#fff'}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <text x={0} y={size * 0.35} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={size} fill={fill} stroke={INK} strokeWidth={size * 0.2} paintOrder="stroke" strokeLinejoin="round">
        {text}
      </text>
    </g>
  );

// ======================================================================================================
// THE WORLD = the bay plate at 1.6x (world px), everything in one plane
// ======================================================================================================
const PS = 1.6;
const PW = SPR.bay.w * PS;
const PH = SPR.bay.h * PS;
const SURF = SPR.bay.surface * PS + 2; // water surface line
const DOCK = SPR.bay.dock_top * PS + 2; // dock top (feet line)
const DOCK_R = SPR.bay.dock_right * PS;
const rgb = (c: readonly number[]) => `rgb(${c[0]},${c[1]},${c[2]})`;

// the guy: white-face radius equalised over all poses
const HRW = 60;
const GX = 470; // standing spot on the dock
type Pose = 'hero' | 'shock' | 'shrug' | 'cling' | 'point' | 'joy' | 'sit';
const poseS = (p: Pose) => HRW / (S(p).hw as [number, number, number])[2];

// babies: home spots in the shallow bay (x, y, scale, faces right?)
const HOME: [number, number, number, boolean][] = [
  [150, 965, 0.3, true], [335, 925, 0.27, false], [520, 985, 0.31, true], [700, 945, 0.26, false],
  [245, 1090, 0.33, false], [440, 1105, 0.29, true], [640, 1085, 0.32, false], [835, 1015, 0.27, true],
  [125, 1235, 0.3, true], [330, 1255, 0.34, false], [545, 1250, 0.28, true], [745, 1205, 0.31, false],
  [925, 1130, 0.26, false], [455, 1360, 0.27, true],
];
const NB = HOME.length;
const HIDE = [12, 7, 3, 11];
const BIG = {x: 1335, y: 1520, s: 0.85};

// exodus paths (night): home -> mouth of the bay -> under the big shark -> open sea
const OUT_T0 = T.every; // first one leaves on "every"
const outStart = (i: number) => OUT_T0 + 0.085 * ((i * 4) % NB) + 0.2 * rnd(i + 3);
const OUT_DUR = 3.4;
const outPath = (i: number): [number, number][] => {
  const [hx, hy] = HOME[i];
  const dy = (rnd(i + 11) - 0.5) * 170;
  return [[hx, hy], [930 + 40 * rnd(i), 1330 + dy * 0.5], [1120, 1840 + dy * 0.4], [1450, 2010 + dy * 0.45], [2050, 2150 + dy * 0.6]];
};
// flashback dart (shorter, out of frame to the right)
const DART_T0 = 20.38;
const dartStart = (i: number) => DART_T0 + 0.045 * i + 0.12 * rnd(i + 21);
const dartPath = (i: number): [number, number][] => {
  const [hx, hy] = HOME[i];
  return [[hx, hy], [hx + 260, hy + 40], [1250, hy + 160 + 60 * rnd(i)]];
};
// return (weeks later): from the right edge back home, in a stream
const BACK_T0 = 23.12;
const backStart = (i: number) => BACK_T0 + 0.085 * ((i * 5) % NB);
const BACK_DUR = 1.05;
const backPath = (i: number): [number, number][] => {
  const [hx, hy] = HOME[i];
  return [[1250, hy + 120], [hx + 120, hy + 20], [hx, hy]];
};

// visual pings on the babies' tags: [baby, start]
const PINGS: [number, number][] = (() => {
  const out: [number, number][] = [];
  for (let i = 0; i < NB; i++) {
    // before the voice says "beep": a few pings in progress already on frame 0
    if (i % 3 === 0) out.push([i, -0.35 - 0.2 * rnd(i)]);
    out.push([i, T.beep + 0.075 * ((i * 3) % NB)]);
    for (let k = 1; k < 5; k++) out.push([i, T.beep + 1.3 * k + 1.1 * rnd(i * 7 + k)]);
    out.push([i, outStart(i) + 0.15]);
    out.push([i, outStart(i) + 0.9]);
    out.push([i, backStart(i) + 0.15]);
    out.push([i, backStart(i) + 0.8]);
  }
  return out;
})();
const PingArcs: React.FC<{x: number; y: number; u: number; sc: number}> = ({x, y, u, sc}) => {
  if (u <= 0 || u >= 1) return null;
  return (
    <g transform={`translate(${x} ${y}) scale(${sc})`}>
      {[0, 0.28, 0.56].map((d, k) => {
        const v = clamp((u - d) / 0.44);
        if (v <= 0 || v >= 1) return null;
        const r = 16 + 46 * v;
        const op = 1 - v;
        const p = `M ${-r * 0.7} ${-r * 0.72} A ${r} ${r} 0 0 1 ${r * 0.7} ${-r * 0.72}`;
        return (
          <g key={k} opacity={op}>
            <path d={p} fill="none" stroke={INK} strokeWidth={13} strokeLinecap="round" />
            <path d={p} fill="none" stroke={YEL} strokeWidth={6.5} strokeLinecap="round" />
          </g>
        );
      })}
    </g>
  );
};

// ---------- the babies' state at time t ----------
type BabyState = {x: number; y: number; s: number; pose: 'b_calm' | 'b_scared' | 'b_zoom'; flip: boolean; rot: number; sq: [number, number]; sweat: number; bang: number; vis: boolean};
const babyAt = (i: number, t: number): BabyState => {
  const [hx, hy, s, right] = HOME[i];
  const bob = 7 * Math.sin(2 * Math.PI * 0.62 * t + i * 1.7);
  const wig = 3 * Math.sin(2 * Math.PI * 1.1 * t + i);
  const home: BabyState = {x: hx + 10 * Math.sin(2 * Math.PI * 0.21 * t + i), y: hy + bob, s, pose: 'b_calm', flip: !right, rot: wig, sq: [1, 1], sweat: 0, bang: 0, vis: true};
  // weeks later: stream back in from the right, turn to the home facing at the end
  if (t >= CUT_G) {
    const t0 = backStart(i);
    if (t < t0) return {...home, vis: false};
    const u = prog(t, t0, t0 + BACK_DUR);
    if (u < 1) {
      const [x, y] = along(backPath(i), easeOutCubic(u));
      return {...home, x, y: y + bob * 0.5, pose: 'b_zoom', flip: true, rot: 0, sq: squashSwap(t, t0 + 0.02)};
    }
    const sq = right ? squashSwap(t, t0 + BACK_DUR + 0.12) : squashSwap(t, t0 + BACK_DUR);
    return {...home, flip: right ? t < t0 + BACK_DUR + 0.12 : true, sq};
  }
  // flashback: at home -> freeze ("felt") -> dart out
  if (t >= CUT_F) {
    const tf = T.felt + 0.04 * i;
    if (t < tf) return home;
    const td = dartStart(i);
    if (t < td) {
      const tremble = 2.2 * Math.sin(2 * Math.PI * 9 * t + i);
      return {...home, x: home.x + tremble, pose: 'b_scared', flip: !right, rot: 0, sq: squashSwap(t, tf), bang: popOut(t, tf, td - 0.05, 0.22)};
    }
    const u = prog(t, td, td + 0.9);
    const [x, y, a] = along(dartPath(i), easeInCubic(u) * 0.6 + u * 0.4);
    return {...home, x, y, pose: 'b_zoom', flip: false, rot: (a * 180) / Math.PI * 0.4, sq: squashSwap(t, td), vis: u < 1};
  }
  // storm: nobody home
  if (t >= CUT_E) return {...home, vis: false};
  // "hiding from the big sharks": the babies nearest the deep back away, scared, when the big shark shows up
  if (HIDE.includes(i) && t >= T.big - 0.1 && t < T.but + 0.6) {
    const th = T.big - 0.1 + 0.07 * HIDE.indexOf(i);
    const back = 150 * easeOutCubic(prog(t, th, th + 0.45)) * (1 - easeInOutCubic(prog(t, T.but - 0.1, T.but + 0.6)));
    const scared = t >= th && t < T.but + 0.1;
    const tremble = scared ? 2 * Math.sin(2 * Math.PI * 9 * t + i) : 0;
    return {...home, x: home.x - back + tremble, pose: scared ? 'b_scared' : 'b_calm', flip: scared ? false : home.flip, rot: scared ? 0 : home.rot, sq: scared ? squashSwap(t, th) : squashSwap(t, T.but + 0.1)};
  }
  // the night exodus
  const t0 = outStart(i);
  if (t >= t0) {
    const u = prog(t, t0, t0 + OUT_DUR);
    const [x, y, a] = along(outPath(i), u < 0.12 ? (u * u) / 0.24 : u - 0.06);
    const sweat = t > CUT_C ? popOut(t, CUT_C + 0.35 + 0.05 * i, 12.5, 0.2) : 0;
    return {...home, x, y, pose: 'b_zoom', flip: false, rot: (a * 180) / Math.PI * 0.45, sq: squashSwap(t, t0), sweat, vis: u < 1};
  }
  return home;
};

const Baby: React.FC<{b: BabyState; t: number; i: number}> = ({b, t, i}) => {
  if (!b.vis) return null;
  const sp = S(b.pose);
  const fl = b.flip ? -1 : 1;
  return (
    <div style={{position: 'absolute', left: b.x, top: b.y, transform: `rotate(${b.rot * fl}deg) scale(${fl * b.sq[0]}, ${b.sq[1]})`, transformOrigin: '0 0'}}>
      <Img src={F(b.pose)} style={{position: 'absolute', left: -sp.w * 0.5 * b.s, top: -sp.h * 0.5 * b.s, width: sp.w * b.s, height: sp.h * b.s}} />
      {b.sweat > 0.01 ? (
        <svg style={{position: 'absolute', left: -200, top: -200, overflow: 'visible'}} width={400} height={400} viewBox="-200 -200 400 400">
          <SweatDrop x={sp.w * 0.27 * b.s} y={-sp.h * 0.42 * b.s - 6 * prog(t, CUT_C + 0.35 + 0.05 * i, 12.4)} r={12} s={b.sweat} rot={18} />
        </svg>
      ) : null}
    </div>
  );
};

// the "!" over a frightened baby (world, not flipped)
const Bang: React.FC<{b: BabyState}> = ({b}) => {
  if (!b.vis || b.bang <= 0.01) return null;
  return <Txt x={b.x} y={b.y - 95 * b.s * 3} size={74} s={b.bang} text="!" fill={YEL} />;
};

// ---------- the guy ----------
const guyAt = (t: number) => {
  // returns pose, anchor position and squash
  if (t >= CUT_G) {
    const tj = T.beeping - 0.1; // jump for joy
    const tl = 24.12; // lands in the hero pose (frame-0 spot)
    if (t < tj) return {p: 'sit' as Pose, x: 628, y: DOCK, sq: squashSwap(t, CUT_G), jump: 0};
    if (t < tl) {
      const u = prog(t, tj, tl);
      return {p: 'joy' as Pose, x: lerp(628, GX, u), y: DOCK - 210 * Math.sin(Math.PI * u), sq: squashSwap(t, tj), jump: u};
    }
    return {p: 'hero' as Pose, x: GX, y: DOCK, sq: squashSwap(t, tl), jump: 0};
  }
  if (t >= CUT_F) return {p: 'hero' as Pose, x: GX, y: DOCK, sq: [1, 1] as [number, number], jump: 0};
  if (t >= CUT_E) {
    if (t < T.tropical) return {p: 'hero' as Pose, x: GX, y: DOCK, sq: [1, 1] as [number, number], jump: 0};
    if (t < T.hits) return {p: 'point' as Pose, x: GX, y: DOCK, sq: squashSwap(t, T.tropical), jump: 0};
    return {p: 'cling' as Pose, x: 0, y: DOCK, sq: squashSwap(t, T.hits), jump: 0};
  }
  if (t >= CUT_D) return {p: 'shrug' as Pose, x: GX, y: DOCK, sq: squashSwap(t, T.leave - 0.05), jump: 0};
  if (t >= T.bay2) return {p: 'shock' as Pose, x: GX, y: DOCK, sq: squashSwap(t, T.bay2), jump: 0};
  return {p: 'hero' as Pose, x: GX, y: DOCK, sq: [1, 1] as [number, number], jump: 0};
};

const Guy: React.FC<{t: number; filter?: string}> = ({t, filter}) => {
  const g = guyAt(t);
  const s = poseS(g.p);
  const sp = S(g.p);
  const br = breathe(t);
  if (g.p === 'cling') {
    // the post he hugs stands on the dock end; the whole body flutters like a flag in the wind
    const post = sp.post as {cx: number; bottom: number};
    const fl = 2.5 * Math.sin(2 * Math.PI * 7.3 * t) + 1.5 * Math.sin(2 * Math.PI * 11.1 * t);
    return (
      <div style={{position: 'absolute', left: DOCK_R - 58, top: DOCK, transform: `scale(${g.sq[0]}, ${g.sq[1]})`, transformOrigin: '0 0', filter}}>
        <Img src={F('cling')} style={{position: 'absolute', left: -post.cx * s, top: -post.bottom * s, width: sp.w * s, height: sp.h * s, transform: `rotate(${fl * 0.4}deg) skewY(${fl * 0.5}deg)`, transformOrigin: `${post.cx * s}px ${(post.bottom - 40) * s}px`}} />
      </div>
    );
  }
  const tremble = g.p === 'shock' ? 2 * Math.sin(2 * Math.PI * 10 * t) : 0;
  const hop = g.p === 'shrug' ? -14 * bump(t, T.leave - 0.02, 0.3) : 0;
  const ay = g.p === 'sit' ? sp.h * 0.6 : sp.feet[1];
  const flip = g.p === 'point' ? -1 : 1;
  const rot = g.p === 'joy' ? 6 * Math.sin(Math.PI * g.jump) : 0;
  return (
    <div style={{position: 'absolute', left: g.x + tremble, top: g.y + hop, transform: `rotate(${rot}deg) scale(${flip * g.sq[0]}, ${g.sq[1] * (g.p === 'hero' || g.p === 'shrug' ? br : 1)})`, transformOrigin: '0 0', filter}}>
      <Img src={F(g.p)} style={{position: 'absolute', left: -sp.feet[0] * s, top: -ay * s, width: sp.w * s, height: sp.h * s}} />
    </div>
  );
};

// ---------- set pieces in code ----------
const FloridaSign: React.FC<{t: number}> = ({t}) => {
  const b = bump(t, T.florida - 0.05, 0.35);
  const x = 262;
  return (
    <g transform={`translate(${x} ${DOCK}) scale(${1 + 0.12 * b}, ${1 - 0.06 * b + 0.12 * b})`}>
      <rect x={-9} y={-170} width={18} height={170} fill="#8A5A2E" stroke={INK} strokeWidth={6} />
      <g transform={`rotate(${-4 + 3 * Math.sin(2 * Math.PI * 0.4 * t)} 0 -150)`}>
        <rect x={-110} y={-230} width={220} height={82} rx={14} fill="#C98B4E" stroke={INK} strokeWidth={8} />
        <text x={0} y={-176} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={43} fill="#fff" stroke={INK} strokeWidth={9} paintOrder="stroke" strokeLinejoin="round">
          FLORIDA
        </text>
      </g>
    </g>
  );
};

const STORM_PUFFS: Puff[] = Array.from({length: 26}, (_, i) => ({
  x: -160 + (i / 25) * 2000 + 40 * (rnd(i + 2) - 0.5),
  y: (i % 2 ? 250 : 420) + 60 * rnd(i + 5),
  r: 150 + 80 * rnd(i + 9),
}));
const StormCloud: React.FC<{t: number; s: number}> = ({t, s}) => {
  if (s <= 0.001) return null;
  const slide = (1 - easeOutCubic(prog(t, CUT_E + 0.7, T.storm + 0.1))) * 1600;
  const boil = (i: number) => 1 + 0.05 * Math.sin(2 * Math.PI * 0.9 * t + i);
  const puffs = STORM_PUFFS.map((p, i) => ({x: p.x + slide, y: p.y - 40, r: p.r * boil(i)}));
  const ex = 1010 + slide;
  const ey = 420;
  const eyeOpen = pop(t, T.storm - 0.05, 0.3);
  return (
    <g>
      <PuffCluster puffs={puffs} fill="#59626E" shade="#4A525D" ink={9} />
      <Eye x={ex - 95} y={ey} r={48} open={eyeOpen} lid={0.32} lidTilt={-24} side={-1} look={[-0.4, 0.6]} brow={0.5} browTilt={0.9} />
      <Eye x={ex + 95} y={ey} r={48} open={eyeOpen} lid={0.32} lidTilt={-24} side={1} look={[-0.4, 0.6]} brow={0.5} browTilt={0.9} />
    </g>
  );
};
const Lightning: React.FC<{t: number; t0: number; x: number}> = ({t, t0, x}) => {
  const u = prog(t, t0, t0 + 0.32);
  if (t < t0 || u >= 1) return null;
  const op = u < 0.5 ? 1 : 1 - (u - 0.5) * 2;
  const pts = [[0, 0], [-40, 120], [10, 120], [-50, 270], [5, 270], [-35, 380]].map(([a, b]) => `${x + a},${480 + b}`).join(' ');
  const pts2 = [[0, 0], [-40, 120], [10, 120], [-50, 270], [5, 270], [-35, 380], [25, 250], [-25, 250], [40, 100], [-10, 100]].map(([a, b]) => `${x + a},${480 + b}`).join(' ');
  return (
    <g opacity={op}>
      <polygon points={pts2} fill="#FFF07A" stroke={INK} strokeWidth={9} strokeLinejoin="round" />
      <polyline points={pts} fill="none" stroke="#fff" strokeWidth={5} strokeLinejoin="round" />
    </g>
  );
};
// storm waves: water rises above the flat surface line
const Waves: React.FC<{t: number; s: number}> = ({t, s}) => {
  if (s <= 0.01) return null;
  const A = 46 * s;
  const pts: string[] = [];
  for (let x = -300; x <= PW + 600; x += 24) {
    const y = SURF - A * (0.55 + 0.45 * Math.sin(x * 0.012 - t * 5.2)) - A * 0.35 * Math.sin(x * 0.031 + t * 3.1);
    pts.push(`${x},${y.toFixed(1)}`);
  }
  const crest = `M ${pts.join(' L ')}`;
  return (
    <g>
      <path d={`${crest} L ${PW + 600},${SURF + 22} L -300,${SURF + 22} Z`} fill="#3FB4DE" />
      <path d={crest} fill="none" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
      <path d={crest} fill="none" stroke="#E6F8FF" strokeWidth={5} strokeLinejoin="round" transform="translate(0 9)" opacity={0.8} />
    </g>
  );
};
const NightSky: React.FC<{n: number; t: number}> = ({n, t}) => {
  if (n <= 0.01) return null;
  return (
    <g opacity={n}>
      {Array.from({length: 38}, (_, i) => {
        const x = 40 + rnd(i + 40) * (PW + 400);
        const y = 30 + rnd(i + 90) * 600;
        if (x < 700 && y > 560) return null;
        const tw = 0.6 + 0.4 * Math.sin(2 * Math.PI * (0.5 + rnd(i)) * t + i);
        return <circle key={i} cx={x} cy={y} r={(3 + 4 * rnd(i + 7)) * tw} fill="#FFF8D0" />;
      })}
      <g transform="translate(1180 190)">
        <circle r={70} fill="#FFF3B8" stroke={INK} strokeWidth={8} />
        <circle cx={34} cy={-20} r={62} fill="#26346E" />
      </g>
    </g>
  );
};
// weeks later: a cobweb on the bored guy + a tiny spider on a thread
const Cobweb: React.FC<{t: number}> = ({t}) => {
  if (t < CUT_G || t > T.beeping) return null;
  const s = pop(t, CUT_G + 0.35, 0.3) * (t > T.beeping - 0.12 ? 1 - prog(t, T.beeping - 0.12, T.beeping) : 1);
  const cx = 628 - 112;
  const cy = DOCK - 4;
  const r = 105;
  const spokes = [180, 200, 225, 250, 270].map((d) => (d * Math.PI) / 180);
  const sy = 120 + 40 * Math.sin(2 * Math.PI * 0.5 * t);
  return (
    <g transform={`translate(${cx} ${cy}) scale(${s})`} opacity={0.9}>
      {spokes.map((a, i) => (
        <line key={i} x1={0} y1={0} x2={Math.cos(a) * r} y2={Math.sin(a) * r} stroke="#fff" strokeWidth={3.5} />
      ))}
      {[0.35, 0.6, 0.85].map((f, k) => (
        <polyline key={k} points={spokes.map((a) => `${Math.cos(a) * r * f},${Math.sin(a) * r * f}`).join(' ')} fill="none" stroke="#fff" strokeWidth={3} />
      ))}
      <line x1={-60} y1={0} x2={-60} y2={sy} stroke="#fff" strokeWidth={2.5} />
      <g transform={`translate(-60 ${sy})`}>
        {[-1, 1].map((d) =>
          [0, 1, 2].map((k) => <path key={`${d}${k}`} d={`M 0 ${-4 + k * 5} q ${d * 12} -10 ${d * 20} ${2 + k * 5}`} stroke={INK} strokeWidth={3} fill="none" />),
        )}
        <circle r={10} fill={INK} />
        <circle cx={-3} cy={-3} r={2.5} fill="#fff" />
        <circle cx={3} cy={-3} r={2.5} fill="#fff" />
      </g>
    </g>
  );
};

// ---------- looks ----------
const nightAt = (t: number) => {
  if (t >= CUT_G) return 0;
  if (t >= CUT_F) return 1;
  if (t >= CUT_E) return 0;
  return easeInOutCubic(prog(t, T.but, T.night + 0.3));
};
const stormAt = (t: number) => (t >= CUT_E && t < CUT_F ? 0.45 + 0.55 * easeInOutCubic(prog(t, T.tropical - 0.2, T.storm + 0.3)) : 0);

// ---------- camera ----------
const CAMS: CamKey[] = [
  {t: 0, x: 600, y: 1000, k: 1.1},
  {t: 5.35, x: 612, y: 1012, k: 1.13},
  {t: 6.75, x: 1040, y: 1330, k: 0.98},
  {t: T.but, x: 1048, y: 1336, k: 0.99},
  {t: 8.55, x: 870, y: 1229, k: 0.79},
  {t: CUT_C, x: 860, y: 1226, k: 0.82},
  {t: 11.1, x: 1098, y: 1498, k: 1.0},
  {t: CUT_D, x: 1098, y: 1498, k: 1.04},
];
const CAMS_D: CamKey[] = [
  {t: CUT_D, x: 520, y: 660, k: 1.5},
  {t: CUT_E, x: 520, y: 665, k: 1.57},
];
const CAMS_E: CamKey[] = [
  {t: CUT_E, x: 690, y: 980, k: 0.96},
  {t: T.hits - 0.1, x: 700, y: 990, k: 1.0},
  {t: T.empty + 0.25, x: 690, y: 1160, k: 1.02},
  {t: CUT_F, x: 690, y: 1170, k: 1.04},
];
const CAMS_F: CamKey[] = [
  {t: CUT_F, x: 545, y: 1030, k: 1.12},
  {t: T.drops, x: 560, y: 1060, k: 1.2},
  {t: CUT_G, x: 600, y: 1070, k: 1.14},
];
const CAMS_G: CamKey[] = [
  {t: CUT_G, x: 560, y: 920, k: 1.2},
  {t: T.starts, x: 565, y: 925, k: 1.24},
  {t: 24.45, x: 600, y: 1000, k: 1.1},
  {t: DURATION, x: 600, y: 1000, k: 1.1},
];
const camAtT = (t: number): Cam => {
  let c: Cam;
  if (t < CUT_D) c = camAt(t, CAMS);
  else if (t < CUT_E) c = camAt(t, CAMS_D);
  else if (t < CUT_F) c = camAt(t, CAMS_E);
  else if (t < CUT_G) c = camAt(t, CAMS_F);
  else c = camAt(t, CAMS_G);
  const amp = 9 * Math.exp(-6 * Math.max(0, t - T.hits)) * (t >= T.hits && t < CUT_F ? 1 : 0) + (t >= CUT_E + 1.6 && t < CUT_F ? 2.2 * stormAt(t) : 0);
  const sh = shake(t, amp);
  return {x: c.x + sh.x, y: c.y + sh.y, k: c.k};
};

// ======================================================================================================
export const BayScene: React.FC<{t: number; cam?: Cam; cover?: boolean; noSign?: boolean}> = ({t, cam: camOverride, cover = false, noSign = false}) => {
  const cam = camOverride ?? camAtT(t);
  const n = nightAt(t);
  const st = stormAt(t);
  const plateFilter = `brightness(${1 - 0.2 * n - 0.22 * st}) saturate(${1 - 0.25 * st})`;
  const sprFilter = n > 0.01 || st > 0.01 ? `brightness(${1 - 0.1 * n - 0.12 * st})` : undefined;
  const babies = cover ? [] : HOME.map((_, i) => babyAt(i, t));
  const bigHungry = t >= T.big2 && t < CUT_D;
  const bigS = bigHungry ? squashSwap(t, T.big2) : [1, 1];
  const bigLunge = bigHungry ? 26 * easeOutCubic(prog(t, T.big2, T.big2 + 0.4)) : 0;
  const showBig = (t < CUT_D || cover) && !noSign;
  return (
    <AbsoluteFill>
      {/* plate + extensions */}
      <World cam={cam} blur={t >= CUT_D && t < CUT_E && !cover ? 3.2 : 0}>
        <div style={{filter: plateFilter}}>
          <Svg>
            <rect x={-3000} y={-3000} width={9000} height={3000 + SURF} fill={rgb(SPR.bay.sky)} />
            <rect x={PW - 4} y={SURF} width={3000} height={4000} fill={rgb(SPR.bay.water_r)} />
            <rect x={-3000} y={SURF} width={3004} height={4000} fill={rgb(SPR.bay.sand_col)} />
            <rect x={PW - 4} y={SURF - 3} width={3000} height={9} fill={INK} />
            <rect x={-3000} y={PH - 4} width={9000} height={3000} fill={rgb(SPR.bay.sand_col)} />
          </Svg>
          <Img src={F('bay')} style={{position: 'absolute', left: 0, top: 0, width: PW, height: PH}} />
        </div>
        {n > 0.01 ? <div style={{position: 'absolute', left: -3000, top: -3000, width: 9000, height: 9000, background: '#34449A', mixBlendMode: 'multiply', opacity: 0.62 * n}} /> : null}
        {st > 0.01 ? <div style={{position: 'absolute', left: -3000, top: -3000, width: 9000, height: 9000, background: '#6E7F86', mixBlendMode: 'multiply', opacity: 0.8 * st}} /> : null}
        <Svg>
          <NightSky n={n} t={t} />
          <StormCloud t={t} s={st} />
          <Lightning t={t} t0={T.hits - 0.02} x={1020} />
          <Lightning t={t} t0={16.95} x={1260} />
          {noSign ? null : <FloridaSign t={t} />}
        </Svg>
      </World>
      {/* characters */}
      <World cam={cam}>
        <div style={{filter: sprFilter, position: 'absolute', left: 0, top: 0}}>
          {showBig ? (
            <Spr
              n={bigHungry ? 'big_hungry' : 'big_lazy'}
              x={BIG.x - bigLunge + (bigHungry ? (S('big_hungry').align as [number, number])[0] * BIG.s : 0)}
              y={BIG.y + 8 * Math.sin(2 * Math.PI * 0.4 * t)}
              s={BIG.s}
              ax={S('big_lazy').w / 2}
              ay={S('big_lazy').h / 2}
              sx={bigS[0]}
              sy={bigS[1]}
              rot={bigHungry ? -6 * easeOutCubic(prog(t, T.big2, T.big2 + 0.4)) : 0}
            />
          ) : null}
          {babies.map((b, i) => (
            <Baby key={i} b={b} t={t} i={i} />
          ))}
          <Guy t={t} />
        </div>
        <div style={{position: 'absolute', left: 0, top: 0}}>
          <Svg>
            {cover
              ? null
              : PINGS.map(([i, t0], k) => {
                  const b = babies[i];
                  if (!b.vis) return null;
                  const u = (t - t0) / 1.0;
                  if (u <= 0 || u >= 1) return null;
                  if (t >= CUT_E && t < CUT_G) return null;
                  const sp = S(b.pose);
                  const tag = sp.tag as [number, number];
                  const fl = b.flip ? -1 : 1;
                  const tx = b.x + fl * (tag[0] - sp.w / 2) * b.s;
                  const ty = b.y + (tag[1] - sp.h / 2) * b.s;
                  return <PingArcs key={k} x={tx} y={ty - 6} u={u} sc={0.8 + b.s} />;
                })}
            {babies.map((b, i) => (
              <Bang key={i} b={b} />
            ))}
            <Waves t={t} s={st} />
            <Cobweb t={t} />
          </Svg>
        </div>
      </World>
    </AbsoluteFill>
  );
};

// ---------- screen-space overlays ----------
const Rain: React.FC<{t: number; s: number}> = ({t, s}) => {
  if (s <= 0.05) return null;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
      {Array.from({length: 80}, (_, i) => {
        const sp = 1500 + 500 * rnd(i + 3);
        const y = ((rnd(i + 70) * 2200 + sp * t) % 2200) - 140;
        const x = ((rnd(i + 30) * 1400 - 0.36 * y + 400 * t) % 1400) - 80;
        return <line key={i} x1={x} y1={y} x2={x - 22} y2={y + 70} stroke="#DDF2FF" strokeWidth={5} strokeLinecap="round" opacity={0.75 * s} />;
      })}
    </svg>
  );
};
const Flash: React.FC<{t: number}> = ({t}) => {
  const a = 0.75 * Math.max(0, 1 - prog(t, T.hits - 0.02, T.hits + 0.2)) * (t >= T.hits - 0.02 ? 1 : 0) + 0.45 * Math.max(0, 1 - prog(t, 16.95, 17.12)) * (t >= 16.95 ? 1 : 0);
  const cut = 0.8 * Math.max(0, 1 - prog(t, CUT_F, CUT_F + 0.18)) * (t >= CUT_F ? 1 : 0);
  const o = a + cut;
  return o > 0.01 ? <AbsoluteFill style={{background: '#fff', opacity: clamp(o)}} /> : null;
};
const Tag: React.FC<{t: number; t0: number; t1: number; text: string; color?: string}> = ({t, t0, t1, text, color = YEL}) => {
  const s = popOut(t, t0, t1, 0.28);
  if (s <= 0.001) return null;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <Txt x={540} y={1590} size={104} s={s} text={text} rot={-3} fill={color} />
    </svg>
  );
};
const Counter14: React.FC<{t: number}> = ({t}) => {
  const s = popOut(t, T.fourteen + 0.02, T.beep + 0.2, 0.25);
  if (s <= 0.001) return null;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <g transform={`translate(860 1030) scale(${s}) rotate(6)`}>
        <circle r={92} fill={YEL} stroke={INK} strokeWidth={11} />
        <text x={0} y={36} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={104} fill="#fff" stroke={INK} strokeWidth={18} paintOrder="stroke" strokeLinejoin="round">
          14
        </text>
      </g>
    </svg>
  );
};
const Question: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const s = popOut(t, T.leave - 0.06, CUT_E - 0.05, 0.3);
  if (s <= 0.001 || t < CUT_D || t >= CUT_E) return null;
  const sx = 540 + (GX + 175 - cam.x) * cam.k;
  const sy = 960 + (DOCK - 420 - cam.y) * cam.k;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <Txt x={sx} y={sy + 8 * Math.sin(2 * Math.PI * 1.4 * t)} size={170} s={s} text="?" rot={10} fill={YEL} />
    </svg>
  );
};
const Shock: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const s = popOut(t, T.bay2 + 0.02, CUT_C + 0.45, 0.22);
  if (s <= 0.001) return null;
  const sx = 540 + (GX + 110 - cam.x) * cam.k;
  const sy = 960 + (DOCK - 430 - cam.y) * cam.k;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <Txt x={sx} y={sy} size={120} s={s} text="!" rot={8} fill={YEL} />
    </svg>
  );
};
// barometer: air pressure needle falls from FAIR to STORM on "drops"
const Barometer: React.FC<{t: number}> = ({t}) => {
  const s = popOut(t, T.air - 0.08, CUT_G - 0.2, 0.3);
  if (s <= 0.001) return null;
  const u = easeInOutCubic(prog(t, T.drops - 0.05, T.drops + 0.45));
  const wob = 4 * Math.sin(2 * Math.PI * 3 * t) * Math.exp(-4 * Math.max(0, t - T.drops - 0.45)) * (t > T.drops + 0.45 ? 1 : 0);
  const ang = lerp(48, -52, u) + wob;
  const cx = 805;
  const cy = 380;
  const r = 150;
  const a = (ang * Math.PI) / 180;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <g transform={`translate(${cx} ${cy}) scale(${s})`}>
        <circle r={r + 16} fill="#C98B4E" stroke={INK} strokeWidth={10} />
        <circle r={r - 6} fill="#FFF8E6" stroke={INK} strokeWidth={7} />
        <path d={`M ${-r * 0.78 * Math.sin((60 * Math.PI) / 180)} ${-r * 0.78 * Math.cos((60 * Math.PI) / 180)} A ${r * 0.78} ${r * 0.78} 0 0 1 ${r * 0.78 * Math.sin((60 * Math.PI) / 180)} ${-r * 0.78 * Math.cos((60 * Math.PI) / 180)}`} fill="none" stroke="#E8433A" strokeWidth={14} strokeDasharray="0" opacity={0.0} />
        {Array.from({length: 11}, (_, i) => {
          const b = ((-60 + i * 12) * Math.PI) / 180;
          return <line key={i} x1={Math.sin(b) * r * 0.66} y1={-Math.cos(b) * r * 0.66} x2={Math.sin(b) * r * 0.8} y2={-Math.cos(b) * r * 0.8} stroke={i < 3 ? '#E8433A' : i > 7 ? '#2E9B4E' : INK} strokeWidth={i % 5 === 0 ? 8 : 5} strokeLinecap="round" />;
        })}
        <text x={-r * 0.46} y={r * 0.12} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={34} fill="#E8433A">
          STORM
        </text>
        <text x={r * 0.5} y={r * 0.12} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={34} fill="#2E9B4E">
          FAIR
        </text>
        <line x1={0} y1={0} x2={Math.sin(a) * r * 0.72} y2={-Math.cos(a) * r * 0.72} stroke={INK} strokeWidth={11} strokeLinecap="round" />
        <circle r={16} fill={INK} />
      </g>
      <Txt x={cx} y={cy + (r + 70) * s} size={56} s={s} text="AIR PRESSURE" fill="#fff" />
    </svg>
  );
};

// ---------- sound ----------
export const CUES: Cue[] = [
  {f: 'beach_bed', at: 0.0, db: -31, dur: T.but + 0.2, keys: [[0, -31], [T.but - 0.3, -31], [T.but + 0.2, -45]]},
  {f: 'ping', at: T.beep - 0.02, db: -12},
  {f: 'ping', at: 1.78, db: -19, rate: 1.12},
  {f: 'ping', at: 2.12, db: -20, rate: 0.92},
  {f: 'ping', at: 2.5, db: -21, rate: 1.22},
  {f: 'ping', at: 3.05, db: -22, rate: 1.04},
  {f: 'ping', at: 3.75, db: -23, rate: 0.95},
  {f: 'ping', at: 4.55, db: -24, rate: 1.15},
  {f: 'pop', at: T.florida - 0.03, db: -24, rate: 1.1},
  {f: 'bubbles', at: 5.6, db: -27},
  {f: 'ping', at: 6.1, db: -26, rate: 0.9},
  {f: 'crickets', at: T.night - 0.05, db: -21},
  {f: 'dart', at: T.every + 0.05, db: -19},
  {f: 'ping', at: T.every + 0.1, db: -16},
  {f: 'ping', at: 9.02, db: -19, rate: 0.9},
  {f: 'ping', at: 9.36, db: -22, rate: 0.8},
  {f: 'ping', at: 9.7, db: -26, rate: 0.72},
  {f: 'gulp', at: T.bay2 + 0.02, db: -15},
  {f: 'crickets', at: 10.25, db: -22},
  {f: 'dart', at: 10.9, db: -20, rate: 0.95},
  {f: 'lick', at: T.big2 - 0.05, db: -13},
  {f: 'bubbles', at: 12.0, db: -26},
  {f: 'pop', at: T.leave - 0.06, db: -20},
  {f: 'crickets', at: 13.0, db: -24},
  {f: 'ticks', at: CUT_E + 0.02, db: -27, dur: 1.0, keys: [[CUT_E, -27], [CUT_E + 0.8, -27], [CUT_E + 1.0, -42]]},
  {f: 'gust', at: 14.9, db: -22},
  {f: 'storm', at: T.tropical - 0.05, db: -14},
  {f: 'rain', at: 15.4, db: -25, dur: 2.0},
  {f: 'thunder', at: T.hits - 0.04, db: -11},
  {f: 'wave_crash', at: T.hits + 0.12, db: -18},
  {f: 'rain', at: 16.6, db: -25, dur: CUT_F - 16.6, keys: [[16.6, -25], [CUT_F - 0.15, -25], [CUT_F, -40]]},
  {f: 'thunder', at: 16.93, db: -16, rate: 0.9, dur: CUT_F - 16.93 + 0.1},
  {f: 'zoomaway', at: CUT_F - 0.12, db: -21},
  {f: 'crickets', at: 17.7, db: -25},
  {f: 'pop', at: T.felt + 0.02, db: -21},
  {f: 'pop', at: T.felt + 0.14, db: -22, rate: 1.15},
  {f: 'pop', at: T.felt + 0.26, db: -23, rate: 1.3},
  {f: 'pop', at: T.air - 0.06, db: -19, rate: 0.85},
  {f: 'needle', at: T.drops - 0.5, db: -13},
  {f: 'dart', at: DART_T0 + 0.02, db: -16},
  {f: 'dart', at: DART_T0 + 0.22, db: -19, rate: 1.1},
  {f: 'dart', at: DART_T0 + 0.42, db: -21, rate: 0.9},
  {f: 'flip', at: CUT_G - 0.02, db: -17},
  {f: 'beach_bed', at: CUT_G, db: -31, dur: DURATION - CUT_G, keys: [[CUT_G, -31], [DURATION - 0.4, -31], [DURATION - 0.02, -50]]},
  {f: 'ping', at: T.starts + 0.08, db: -13},
  {f: 'boing', at: T.beeping - 0.1, db: -18},
  {f: 'ping', at: 23.62, db: -18, rate: 1.12},
  {f: 'ping', at: 23.86, db: -19, rate: 0.95},
  {f: 'twinkle', at: T.again + 0.02, db: -22},
  {f: 'ping', at: 24.12, db: -21, rate: 1.2, dur: DURATION - 24.12},
];

// ======================================================================================================
export const SceneAt: React.FC<{t: number}> = ({t}) => {
  const cam = camAtT(t);
  return (
    <AbsoluteFill>
      <BayScene t={t} cam={cam} />
      <Rain t={t} s={stormAt(t) > 0.5 ? (stormAt(t) - 0.5) * 2 : 0} />
      <Flash t={t} />
      <Counter14 t={t} />
      <Shock t={t} cam={cam} />
      <Question t={t} cam={cam} />
      <Barometer t={t} />
      <Tag t={t} t0={CUT_E + 0.02} t1={T.tropical - 0.05} text="HOURS LATER" />
      <Tag t={t} t0={CUT_F + 0.06} t1={T.felt + 0.3} text="EARLIER" color="#9BE3FF" />
      <Tag t={t} t0={CUT_G + 0.02} t1={T.bay4} text="WEEKS LATER" />
    </AbsoluteFill>
  );
};

export const SharkStormShort: React.FC = () => {
  useSHSFont();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  return (
    <AbsoluteFill style={{background: NAVY}}>
      <SceneAt t={t} />
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('shark-storm/vo/take1.mp3')} volume={Math.pow(10, MIX_DB / 20)} />
      </Sequence>
      <Sequence from={0} layout="none">
        <Audio src={staticFile('shark-storm/music/bed.wav')} volume={Math.pow(10, MIX_DB / 20)} />
      </Sequence>
      <SoundCues cues={CUES.map((c) => ({...c, db: c.db + MIX_DB, keys: c.keys?.map(([kt, kd]) => [kt, kd + MIX_DB] as [number, number])}))} dir="shark-storm/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};
