import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SPR} from './sprites';
import {
  BAG_REST,
  BG_H,
  BG_S,
  BG_W,
  BOAT_W,
  BX,
  CAM,
  CONDUIT,
  CRATER,
  DASH_SAND,
  DASH_SLAB,
  FPS,
  GX,
  GY,
  HR,
  MELT_AT,
  SLAB_PATH,
  SPLASH,
  SURF,
  T,
  TRENCH_TIP,
  VO_AT,
  V_BASE,
  V_H,
  V_LEFT,
  V_S,
  V_TOP,
  V_W,
  poseBox,
} from './scene';
import {along, arcY, camAt, clamp, easeInCubic, easeInOutCubic, easeOutCubic, lerp, pop, prog, rnd, shake, spring} from '../shared/anim';
import {World} from '../shared/World';
import {Eye} from '../shared/Face';
import {PuffCluster, type Puff} from '../shared/Puffs';
import {SoundCues, type Cue} from '../shared/Sound';
import {useFont} from '../shared/useFont';

const F = (n: string) => staticFile(`ocean-trench/${n}.png`);
const FONT = 'OceanTrenchInter';

// ---------- sounds (all ElevenLabs) ----------
const CUES: Cue[] = [
  {f: 'whoosh', at: T.swing - 0.04, db: -25},
  {f: 'splash', at: T.splash, db: -15},
  {f: 'bubbles', at: T.splash + 0.15, db: -27},
  {f: 'grind', at: T.slides - 0.05, db: -25},
  {f: 'snore', at: 10.75, db: -23},
  {f: 'ticks', at: T.countA, db: -27, dur: 2.35},
  {f: 'grind', at: 11.3, db: -27},
  {f: 'bubbles', at: T.sinkMagma, db: -24},
  {f: 'rumble', at: 17.15, db: -40, dur: T.boom - 17.15, keys: [[17.15, -42], [18.4, -33], [19.08, -22], [T.boom, -24]]},
  {f: 'boom', at: T.boom, db: -8},
  {f: 'whoosh', at: 19.42, db: -22},
  {f: 'catch', at: T.catch, db: -14},
];

// ---------- guy pose timeline ----------
type Pose = 'hero_hold' | 'windup' | 'throw_follow' | 'bored' | 'sleep' | 'alarm' | 'deadpan_bag';
const poseAt = (t: number): Pose => {
  if (t < T.windup) return 'hero_hold';
  if (t < T.swing) return 'windup';
  if (t < T.nailsCut) return 'throw_follow';
  if (t < T.sleep) return 'bored';
  if (t < T.boom + 0.06) return 'sleep';
  if (t < T.catch) return 'alarm';
  return 'deadpan_bag';
};
// squash / stretch around each swap (about the feet)
const poseScale = (t: number): [number, number, number] => {
  let sx = 1;
  let sy = 1 + 0.009 * Math.sin(2 * Math.PI * 0.6 * t); // breathing
  let rot = 0;
  // little bounce on "trash"
  sy += 0.03 * Math.sin(Math.PI * prog(t, T.trash, T.trash + 0.22));
  // anticipation before wind-up, stretch after
  if (t > T.windup - 0.1 && t < T.windup) {
    const u = prog(t, T.windup - 0.1, T.windup);
    sy -= 0.06 * u;
    sx += 0.04 * u;
  }
  if (t >= T.windup) sy += 0.03 * spring(t - T.windup, 3.5, 6);
  // throw lean: -5 -> +5 deg and settle
  if (t >= T.windup && t < T.swing) rot = -5 * easeOutCubic(prog(t, T.windup, T.windup + 0.25));
  if (t >= T.swing) rot = 5 * spring(t - T.swing, 2.2, 3.5);
  // falling asleep: squash swap
  if (t > T.sleep - 0.08 && t < T.sleep) sy -= 0.05 * prog(t, T.sleep - 0.08, T.sleep);
  if (t >= T.sleep && t < T.sleep + 1) sy += 0.025 * spring(t - T.sleep, 2.5, 5);
  // startle on the blast: jump-stretch
  if (t >= T.boom && t < T.boom + 1) sy += 0.08 * spring(t - T.boom, 3, 5);
  // tremble while the bag flies at him
  if (t > T.boom + 0.2 && t < T.catch) sx += 0.006 * Math.sin(2 * Math.PI * 17 * t);
  // weight dip on the catch
  if (t >= T.catch) sy -= 0.05 * Math.max(0, spring(t - T.catch, 2.6, 5));
  return [sx, sy, rot];
};

// ---------- the bag ----------
const BAG = SPR.bag;
const BAG_FILL_W = 838;
const BAG_C: [number, number] = [440, 546]; // fill centre in the bag sprite
const throwFollow = poseBox('throw_follow', GX, GY);
const HAND: [number, number] = [throwFollow.left + 870 * throwFollow.k, throwFollow.top + 268 * throwFollow.k];
const windup = poseBox('windup', GX, GY);
const WIND_BAG: [number, number] = [windup.left + 145 * windup.k, windup.top + 229 * windup.k];
const deadpan = poseBox('deadpan_bag', GX, GY);
const CATCH_BAG: [number, number] = [deadpan.left + 174.5 * deadpan.k, deadpan.top + 166 * deadpan.k];
const CATCH_W = 309 * deadpan.k;
const BAG_W = 55;

type BagState = {x: number; y: number; w: number; rot: number; show: boolean; layer: 'front' | 'world'};
const bagAt = (t: number): BagState => {
  const none: BagState = {x: 0, y: 0, w: BAG_W, rot: 0, show: false, layer: 'world'};
  if (t < T.swing) return none;
  if (t < T.release) {
    // swing over the head from the wind-up grip to the throwing hand
    const u = easeInOutCubic(prog(t, T.swing, T.release));
    const c: [number, number] = [640, 40];
    const x = (1 - u) * (1 - u) * WIND_BAG[0] + 2 * (1 - u) * u * c[0] + u * u * HAND[0];
    const y = (1 - u) * (1 - u) * WIND_BAG[1] + 2 * (1 - u) * u * c[1] + u * u * HAND[1];
    return {x, y, w: BAG_W, rot: -30 + 40 * u, show: true, layer: 'front'};
  }
  if (t < T.splash) {
    // projectile from the hand to the water (apex early in the flight)
    const TT = T.splash - T.release;
    const tau = t - T.release;
    const ta = 0.3 * TT;
    const y0 = HAND[1];
    const y1 = SPLASH[1] + 8;
    const g = (2 * (y0 - y1)) / (ta * ta - (TT - ta) * (TT - ta));
    const ya = y0 - 0.5 * g * ta * ta;
    const x = lerp(HAND[0], SPLASH[0], tau / TT);
    return {x, y: ya + 0.5 * g * (tau - ta) * (tau - ta), w: BAG_W, rot: 10 + 330 * (tau / TT), show: true, layer: 'front'};
  }
  if (t < T.land) {
    const u = prog(t, T.splash, T.land);
    const x = lerp(SPLASH[0], BAG_REST[0], easeOutCubic(u));
    const y = lerp(SPLASH[1] + 30, BAG_REST[1], easeInOutCubic(u));
    return {x, y, w: BAG_W, rot: 18 * Math.sin(2 * Math.PI * 1.3 * (t - T.splash)) * (1 - u), show: true, layer: 'world'};
  }
  // riding the plate: almost nothing until the time-lapse
  let p = 0;
  if (t >= T.slowSlide) p = 0.012 * prog(t, T.slowSlide, T.so);
  if (t >= T.countA) p = 0.012 + 0.988 * easeInOutCubic(prog(t, T.countA, T.tip));
  if (t < T.sinkMagma) {
    const [x, y, a] = along(SLAB_PATH, p);
    const land = t < T.land + 0.4 ? 0.06 * spring(t - T.land, 3, 6) : 0;
    return {x, y, w: BAG_W * (1 + land), rot: p > 0.02 ? (a * 180) / Math.PI - 30 : 0, show: true, layer: 'world'};
  }
  if (t < T.magma) {
    // melts into the magma: sinks, shrinks
    const u = prog(t, T.sinkMagma, T.magma);
    const x = lerp(SLAB_PATH[SLAB_PATH.length - 1][0], MELT_AT[0], u);
    const y = lerp(SLAB_PATH[SLAB_PATH.length - 1][1], MELT_AT[1], easeInCubic(u));
    return {x, y, w: BAG_W * (1 - 0.85 * easeInCubic(u)), rot: 12 * Math.sin(2 * Math.PI * 2 * t), show: u < 0.98, layer: 'world'};
  }
  if (t < T.boom + 0.08) return none;
  if (t < T.catch) {
    // spat out of the crater, back to the boat: comes toward the camera (grows) and lands in the hands
    const TT = T.catch - (T.boom + 0.08);
    const tau = t - (T.boom + 0.08);
    const y = arcY(CRATER[1] - 10, CATCH_BAG[1], -260, TT, tau);
    const u = tau / TT;
    const x = lerp(CRATER[0], CATCH_BAG[0], u);
    return {x, y, w: lerp(BAG_W, CATCH_W, easeInCubic(u)), rot: 360 * (1 - easeOutCubic(u)), show: true, layer: 'front'};
  }
  return none;
};

const BagImg: React.FC<{b: BagState}> = ({b}) => {
  if (!b.show) return null;
  const k = b.w / BAG_FILL_W;
  return (
    <Img
      src={F('bag')}
      style={{
        position: 'absolute',
        left: b.x - BAG_C[0] * k,
        top: b.y - BAG_C[1] * k,
        width: BAG.w * k,
        height: BAG.h * k,
        transformOrigin: `${BAG_C[0] * k}px ${BAG_C[1] * k}px`,
        transform: `rotate(${b.rot}deg)`,
      }}
    />
  );
};

// ---------- small effects ----------
const svgBox = {position: 'absolute' as const, left: -3000, top: -3000, width: 9000, height: 9000, overflow: 'visible' as const};
const SvgW: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg style={svgBox} viewBox="-3000 -3000 9000 9000">
    {children}
  </svg>
);

const Dashes: React.FC<{t: number}> = ({t}) => {
  // plate motion: fast "slides", crawl at "fingernails", fast again in the time-lapse
  const vis = Math.max(
    prog(t, 4.25, 4.45) * (1 - prog(t, 6.3, 6.42)),
    prog(t, T.butCut, T.butCut + 0.01) * (1 - prog(t, 13.7, 13.9)),
  );
  if (vis <= 0) return null;
  // integrate speed (world units / s)
  const seg = (a: number, b: number, v: number) => Math.max(0, Math.min(t, b) - a) * v;
  const off = seg(4.3, 6.42, 90) + seg(T.butCut, T.so, 1.5) + seg(T.so, 13.9, 260);
  const pts = (p: [number, number][]) => p.map((q) => q.join(',')).join(' ');
  const common = {fill: 'none', stroke: '#FFFFFF', strokeWidth: 9, strokeLinecap: 'round' as const, strokeDasharray: '22 40', strokeDashoffset: -off, opacity: 0.6 * vis};
  return (
    <SvgW>
      <polyline points={pts(DASH_SAND)} {...common} />
      <polyline points={pts(DASH_SLAB)} {...common} />
    </SvgW>
  );
};

const Splash: React.FC<{t: number}> = ({t}) => {
  const d = t - T.splash;
  if (d < 0 || d > 1.1) return null;
  const drops = Array.from({length: 11}, (_, i) => {
    const a = (-150 + (120 * i) / 10 + (rnd(i) - 0.5) * 14) * (Math.PI / 180);
    const v = 230 + rnd(i + 20) * 160;
    const x = SPLASH[0] + Math.cos(a) * v * d;
    const y = SPLASH[1] + Math.sin(a) * v * d + 0.5 * 900 * d * d;
    const r = (7 + rnd(i + 40) * 7) * (1 - prog(d, 0.5, 0.9));
    return {x, y, r};
  });
  const ring = easeOutCubic(prog(d, 0, 0.9));
  return (
    <SvgW>
      <ellipse cx={SPLASH[0]} cy={SPLASH[1] + 2} rx={20 + 90 * ring} ry={5 + 14 * ring} fill="none" stroke="#FFFFFF" strokeWidth={6 * (1 - ring)} opacity={0.9} />
      {drops.map((p, i) =>
        p.r > 0.5 && p.y < SPLASH[1] + 6 ? <circle key={i} cx={p.x} cy={p.y} r={p.r} fill="#5FB6F0" stroke="#000" strokeWidth={3} /> : null,
      )}
    </SvgW>
  );
};

const Bubbles: React.FC<{t: number; b: BagState}> = ({t, b}) => {
  const out: React.ReactNode[] = [];
  // trail while sinking
  for (let i = 0; i < 14; i++) {
    const born = T.splash + 0.1 + i * 0.12;
    const age = t - born;
    if (age < 0 || age > 1.1 || born > T.land) continue;
    const src = bagAt(born);
    const x = src.x + Math.sin(age * 6 + i) * 8 + (rnd(i) - 0.5) * 20;
    const y = src.y - 30 - age * 170;
    const r = 5 + rnd(i + 3) * 6;
    if (y < SURF + 10) continue;
    out.push(<circle key={`s${i}`} cx={x} cy={y} r={r} fill="#BFE6FF" stroke="#000" strokeWidth={2.5} />);
  }
  // magma bubbles while the bag melts
  for (let i = 0; i < 12; i++) {
    const born = T.sinkMagma + i * 0.11;
    const age = t - born;
    if (age < 0 || age > 0.55 || born > T.magma + 0.3) continue;
    const x = MELT_AT[0] + (rnd(i + 9) - 0.5) * 110;
    const y = MELT_AT[1] - 20 - age * 50;
    const r = (8 + rnd(i + 5) * 10) * Math.sin(Math.PI * (age / 0.55));
    out.push(<circle key={`m${i}`} cx={x} cy={y} r={r} fill="#FFA445" stroke="#E2501E" strokeWidth={3} />);
  }
  void b;
  return <SvgW>{out}</SvgW>;
};

// the melted bit of trash: a glowing blob with the bag's knot, rising to the volcano
const Blob: React.FC<{t: number}> = ({t}) => {
  if (t < T.magma - 0.25 || t > T.boom + 0.05) return null;
  const grow = pop(t, T.magma - 0.25, 0.4);
  const u = easeInOutCubic(prog(t, T.rise, 18.95));
  const [x, y] = along(CONDUIT, u);
  // the glowing trail behind it (no outline, like lava)
  const trailPts: string[] = [];
  for (let i = 0; i <= 40; i++) {
    const q = along(CONDUIT, (u * i) / 40);
    trailPts.push(`${q[0]},${q[1]}`);
  }
  const r = 26 * grow * (1 + 0.06 * Math.sin(2 * Math.PI * 3 * t));
  return (
    <SvgW>
      <defs>
        <radialGradient id="blobglow">
          <stop offset="0%" stopColor="#FFC867" stopOpacity={0.55} />
          <stop offset="100%" stopColor="#FF6A2B" stopOpacity={0} />
        </radialGradient>
      </defs>
      {u > 0.001 ? (
        <>
          <polyline points={trailPts.join(' ')} fill="none" stroke="#E2501E" strokeWidth={30} strokeLinecap="round" strokeLinejoin="round" />
          <polyline points={trailPts.join(' ')} fill="none" stroke="#FF6A2B" strokeWidth={20} strokeLinecap="round" strokeLinejoin="round" />
          <polyline points={trailPts.join(' ')} fill="none" stroke="#FFA445" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : null}
      <circle cx={x} cy={y} r={r * 3} fill="url(#blobglow)" />
      <circle cx={x} cy={y} r={r} fill="#FF6A2B" stroke="#000" strokeWidth={5} />
      <circle cx={x - r * 0.25} cy={y - r * 0.2} r={r * 0.45} fill="#FFC867" />
      {/* the little knot of the bag that survived */}
      <g transform={`translate(${x} ${y - r * 0.95}) scale(${grow})`}>
        <path d="M -12 -14 Q -2 -4 0 2 Q 2 -4 12 -14 Q 6 -2 0 6 Q -6 -2 -12 -14 Z" fill="#2A2A2A" stroke="#000" strokeWidth={4} strokeLinejoin="round" />
      </g>
    </SvgW>
  );
};

// trench face: eyes open on "eats", tongue licks the bag, then bored lids
const TrenchFace: React.FC<{t: number}> = ({t}) => {
  if (t < T.eats - 0.05 || t > 13.9) return null;
  const open = pop(t, T.eats, 0.28) * (1 - prog(t, 13.6, 13.9));
  let lid = 0;
  let look: [number, number] = [0.15, 0.55];
  if (t > T.everything) lid = 0.25;
  if (t > T.butCut) {
    lid = 0.55;
    look = [0.1, 0.65];
  }
  // blink
  const bl = (c: number) => (Math.abs(t - c) < 0.07 ? 1 - Math.abs(t - c) / 0.07 : 0);
  lid = Math.max(lid, bl(8.6), bl(12.4));
  if (t > T.countA) lid = Math.max(lid, 0.55 + 0.4 * prog(t, 12.6, 13.3));
  // tongue lick on "everything"
  const lk = prog(t, 5.95, 6.42);
  const len = 120 * Math.sin(Math.PI * lk);
  const [tx, ty] = TRENCH_TIP;
  return (
    <SvgW>
      {len > 2 ? (
        <g transform={`translate(${tx + 6} ${ty - 10}) rotate(${-20 + 40 * lk})`}>
          <rect x={-17} y={-len} width={34} height={len + 10} rx={17} fill="#FC8D90" stroke="#000" strokeWidth={5} />
          <line x1={0} y1={-len + 20} x2={0} y2={0} stroke="#D86A70" strokeWidth={4} strokeLinecap="round" />
        </g>
      ) : null}
      <Eye x={606} y={1150} r={30} open={open} lid={lid} look={look} side={-1} brow={0.5} browTilt={t > T.butCut ? -0.6 : 0.4} />
      <Eye x={820} y={1150} r={30} open={open} lid={lid} look={look} side={1} brow={0.5} browTilt={t > T.butCut ? -0.6 : 0.4} />
    </SvgW>
  );
};

// "about as fast as your fingernails grow": a snail strolls past and overtakes the plate
const Snail: React.FC<{t: number}> = ({t}) => {
  if (t < T.butCut || t > T.nailsCut) return null;
  const u = prog(t, T.butCut, T.nailsCut);
  const x = lerp(430, 575, u);
  const y = 958;
  const stretch = 1 + 0.08 * Math.sin(2 * Math.PI * 2.2 * t);
  return (
    <SvgW>
      <g transform={`translate(${x} ${y})`}>
        <g transform={`scale(${stretch} ${2 - stretch})`}>
          <path d="M -34 0 Q -36 -12 -20 -12 L 22 -12 Q 34 -12 36 -24 L 40 -4 Q 40 0 30 0 Z" fill="#B7DB6E" stroke="#000" strokeWidth={4} strokeLinejoin="round" />
        </g>
        <line x1={30} y1={-18} x2={36} y2={-40} stroke="#000" strokeWidth={4} strokeLinecap="round" />
        <line x1={38} y1={-16} x2={48} y2={-36} stroke="#000" strokeWidth={4} strokeLinecap="round" />
        <circle cx={36} cy={-42} r={5} fill="#000" />
        <circle cx={48} cy={-38} r={5} fill="#000" />
        <circle cx={-8} cy={-30} r={22} fill="#F2B84B" stroke="#000" strokeWidth={4} />
        <path d="M -8 -30 m 0 -12 a 12 12 0 1 1 -10 6 a 7 7 0 1 1 6 -2" fill="none" stroke="#000" strokeWidth={3.5} strokeLinecap="round" />
      </g>
    </SvgW>
  );
};

// eruption: crown of lava fingers + blob spray + dark smoke + sky glow
const Eruption: React.FC<{t: number}> = ({t}) => {
  const d = t - T.boom;
  if (d < -0.02 || d > 2.6) return null;
  const [cx, cy] = CRATER;
  const crown = easeOutCubic(prog(d, 0, 0.18)) * (1 - easeInCubic(prog(d, 0.75, 1.25)));
  const fingers = Array.from({length: 9}, (_, i) => {
    const a = ((-90 + (i - 4) * 15 + Math.sin(i * 2.1) * 4) * Math.PI) / 180;
    const L = (150 + 70 * Math.abs(Math.sin(i * 1.7)) + 30 * Math.sin(2 * Math.PI * 4 * d + i)) * crown;
    const bend = (i - 4) * 10;
    return {a, L, bend, w: 34 - Math.abs(i - 4) * 2};
  });
  const blobs = Array.from({length: 16}, (_, i) => {
    const a = ((-90 + (rnd(i + 1) - 0.5) * 90) * Math.PI) / 180;
    const v = 420 + rnd(i + 7) * 300;
    const dd = d - rnd(i + 3) * 0.15;
    if (dd < 0) return null;
    const x = cx + Math.cos(a) * v * dd;
    const y = cy - 20 + Math.sin(a) * v * dd + 0.5 * 1500 * dd * dd;
    const vy = Math.sin(a) * v + 1500 * dd;
    const ang = (Math.atan2(vy, Math.cos(a) * v) * 180) / Math.PI;
    const r = 10 + rnd(i + 11) * 10;
    if (y > SURF + 5) return null;
    return {x, y, r, ang};
  });
  const smoke: Puff[] = [];
  for (let i = 0; i < 9; i++) {
    const born = i * 0.07;
    const age = d - born;
    if (age < 0) continue;
    const life = 1.6;
    const g = age < 0.4 ? easeOutCubic(age / 0.4) : 1 - easeInCubic(prog(age, 0.9, life));
    smoke.push({x: cx + (rnd(i) - 0.5) * 140 + age * 70, y: cy - 120 - age * 230 - rnd(i + 2) * 90, r: (46 + rnd(i + 4) * 30) * Math.max(0, g)});
  }
  const glow = (1 - prog(d, 0.2, 2.0)) * prog(d, 0, 0.1);
  return (
    <SvgW>
      <defs>
        <radialGradient id="skyglow">
          <stop offset="0%" stopColor="#FFB060" stopOpacity={0.45} />
          <stop offset="100%" stopColor="#FFB060" stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy - 120} r={520} fill="url(#skyglow)" opacity={glow} />
      <PuffCluster puffs={smoke} fill="#6F6A68" shade="#5E5957" ink={6} />
      {fingers.map((f, i) => {
        if (f.L < 2) return null;
        const ex = cx + Math.cos(f.a) * f.L;
        const ey = cy + Math.sin(f.a) * f.L;
        const mx = cx + Math.cos(f.a) * f.L * 0.5 + f.bend;
        const my = cy + Math.sin(f.a) * f.L * 0.5;
        const p = `M ${cx + (i - 4) * 9} ${cy + 6} Q ${mx} ${my} ${ex} ${ey}`;
        return (
          <g key={i}>
            <path d={p} fill="none" stroke="#E2501E" strokeWidth={f.w + 10} strokeLinecap="round" />
            <path d={p} fill="none" stroke="#FF6A2B" strokeWidth={f.w} strokeLinecap="round" />
            <path d={p} fill="none" stroke="#FFA445" strokeWidth={f.w * 0.42} strokeLinecap="round" />
          </g>
        );
      })}
      {blobs.map((b, i) =>
        b ? (
          <g key={`b${i}`} transform={`translate(${b.x} ${b.y}) rotate(${b.ang})`}>
            <ellipse rx={b.r * 1.5} ry={b.r} fill="#FF6A2B" />
            <ellipse rx={b.r * 0.7} ry={b.r * 0.45} cx={-b.r * 0.2} fill="#FFC867" />
          </g>
        ) : null,
      )}
    </SvgW>
  );
};

// smug smoke ring after the catch
const SmokeRing: React.FC<{t: number}> = ({t}) => {
  const d = t - 20.55;
  if (d < 0 || d > 1.4) return null;
  const s = easeOutCubic(prog(d, 0, 1.2));
  const shrink = 1 - easeInCubic(prog(d, 1.0, 1.4));
  return (
    <SvgW>
      <ellipse cx={CRATER[0] - 40 * s} cy={CRATER[1] - 40 - 170 * s} rx={(30 + 50 * s) * shrink} ry={(12 + 18 * s) * shrink} fill="none" stroke="#000" strokeWidth={22 * shrink} />
      <ellipse cx={CRATER[0] - 40 * s} cy={CRATER[1] - 40 - 170 * s} rx={(30 + 50 * s) * shrink} ry={(12 + 18 * s) * shrink} fill="none" stroke="#8C8784" strokeWidth={13 * shrink} />
    </SvgW>
  );
};

const VolcanoFace: React.FC<{t: number}> = ({t}) => {
  if (t < T.comeBack - 0.05) return null;
  const open = pop(t, T.comeBack, 0.3);
  const squeeze = t > T.boom - 0.12 && t < T.boom + 0.32;
  let look: [number, number] = [0, 0.7];
  let lid = 0;
  let brow = 0.5;
  let browTilt = 0.3;
  if (t > T.boom + 0.32) look = [-0.8, 0.1];
  if (t > 20.45) {
    lid = 0.45;
    browTilt = -0.2;
    brow = 0.3;
    look = [-0.7, 0.2];
  }
  if (t > T.inhale && t < T.boom - 0.12) {
    look = [0, -0.2];
    browTilt = 0.8;
  }
  const y = V_TOP + 175 * V_S;
  return (
    <SvgW>
      <Eye x={V_LEFT + 430 * V_S} y={y} r={30} open={open} lid={lid} look={look} side={-1} squeeze={squeeze} brow={brow} browTilt={browTilt} />
      <Eye x={V_LEFT + 600 * V_S} y={y} r={30} open={open} lid={lid} look={look} side={1} squeeze={squeeze} brow={brow} browTilt={browTilt} />
    </SvgW>
  );
};

const Zzz: React.FC<{t: number}> = ({t}) => {
  if (t < T.sleep + 0.2 || t > T.boom) return null;
  const head = poseBox('sleep', GX, GY);
  const hx = head.left + 195 * head.k + 30;
  const hy = head.top + 180 * head.k - 50;
  return (
    <>
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => {
        const born = T.sleep + 0.2 + i * 0.7;
        const age = t - born;
        if (age < 0 || age > 2.0) return null;
        const s = Math.sin(Math.PI * clamp(age / 2.0)) * 1.0;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: hx + age * 40 + Math.sin(age * 4) * 10,
              top: hy - age * 90,
              fontFamily: FONT,
              fontSize: 72,
              color: '#FFFFFF',
              WebkitTextStroke: '12px #000',
              paintOrder: 'stroke fill',
              transform: `scale(${s}) rotate(${-10 + i * 7}deg)`,
              transformOrigin: '0 0',
              lineHeight: 1,
            }}
          >
            Z
          </div>
        );
      })}
    </>
  );
};

const WaterFront: React.FC<{t: number}> = ({t}) => {
  // a thin wavy strip of sea in front of the boat (same blue as the top band of the plate)
  const pts: string[] = [];
  for (let x = -600; x <= 2600; x += 20) {
    const y = SURF - 4 + 5 * Math.sin(x * 0.03 + t * 3.2) + 3 * Math.sin(x * 0.011 - t * 1.7);
    pts.push(`${x},${y}`);
  }
  const d = `M -600 ${SURF + 20} L ${pts.join(' L ')} L 2600 ${SURF + 20} Z`;
  return (
    <SvgW>
      <path d={d} fill="#178CE2" />
      <polyline points={pts.join(' ')} fill="none" stroke="#000" strokeWidth={4.5} strokeLinejoin="round" />
    </SvgW>
  );
};

const Guy: React.FC<{t: number}> = ({t}) => {
  const pose = poseAt(t);
  const b = poseBox(pose, GX, GY);
  const [sx, sy, rot] = poseScale(t);
  const fx = GX - b.left;
  const fy = GY - b.top;
  return (
    <Img
      src={F(pose)}
      style={{
        position: 'absolute',
        left: b.left,
        top: b.top,
        width: b.width,
        height: b.height,
        transformOrigin: `${fx}px ${fy}px`,
        transform: `rotate(${rot}deg) scale(${sx}, ${sy})`,
      }}
    />
  );
};

const Boat: React.FC = () => {
  const k = BOAT_W / SPR.boat.w;
  return (
    <Img
      src={F('boat')}
      style={{position: 'absolute', left: BX - BOAT_W / 2, top: SURF - 86, width: BOAT_W, height: SPR.boat.h * k}}
    />
  );
};

const Volcano: React.FC<{t: number}> = ({t}) => {
  // inhale (stretch up) before the blast, squash on the blast with a damped spring
  let sy = 1;
  let sx = 1;
  if (t > T.inhale && t < T.boom) {
    const u = easeOutCubic(prog(t, T.inhale, T.boom));
    sy += 0.06 * u;
    sx -= 0.025 * u;
  }
  if (t >= T.boom) {
    const s = spring(t - T.boom, 2.4, 4.5);
    sy = 1 - 0.1 * s;
    sx = 1 + 0.05 * s;
  }
  // rumble tremble
  const tr = t > 17.6 && t < T.boom ? 2.5 * prog(t, 17.6, T.boom) * Math.sin(2 * Math.PI * 21 * t) : 0;
  const ox = V_W / 2;
  const tintTop = SURF - V_TOP;
  const mask = `url(${F('volcano')})`;
  return (
    <div
      style={{
        position: 'absolute',
        left: V_LEFT + tr,
        top: V_TOP,
        width: V_W,
        height: V_H,
        transformOrigin: `${ox}px ${V_H}px`,
        transform: `scale(${sx}, ${sy})`,
      }}
    >
      <Img src={F('volcano')} style={{position: 'absolute', left: 0, top: 0, width: V_W, height: V_H}} />
      {/* underwater part tinted like the sea */}
      <div style={{position: 'absolute', left: 0, top: tintTop, width: V_W, height: V_H - tintTop, overflow: 'hidden'}}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: -tintTop,
            width: V_W,
            height: V_H,
            background: 'linear-gradient(#178CE2, #0A71C3 45%, #045FAD)',
            opacity: 0.55,
            WebkitMaskImage: mask,
            maskImage: mask,
            WebkitMaskSize: `${V_W}px ${V_H}px`,
            maskSize: `${V_W}px ${V_H}px`,
          }}
        />
      </div>
    </div>
  );
};

const Counter: React.FC<{t: number}> = ({t}) => {
  if (t < T.countA - 0.2 || t > 13.95) return null;
  const s = pop(t, T.countA - 0.2, 0.3) * (1 - prog(t, 13.75, 13.95));
  const n = Math.round((2000000 * easeInCubic(prog(t, T.countA, T.countB))) / 1000) * 1000;
  const bump = 1 + 0.08 * Math.sin(Math.PI * prog(t, T.countB, T.countB + 0.3));
  const txt = {
    fontFamily: FONT,
    color: '#FFFFFF',
    WebkitTextStroke: '16px #000',
    paintOrder: 'stroke fill',
    textAlign: 'center' as const,
    lineHeight: 1,
  };
  return (
    <AbsoluteFill style={{alignItems: 'center', top: 210, transform: `scale(${s * bump})`, transformOrigin: '540px 300px'}}>
      <div style={{...txt, fontSize: 118, fontVariantNumeric: 'tabular-nums'}}>{n.toLocaleString('en-US')}</div>
      <div style={{...txt, fontSize: 74, marginTop: 14, WebkitTextStroke: '12px #000'}}>YEARS</div>
    </AbsoluteFill>
  );
};

const SmugCut: React.FC<{t: number}> = ({t}) => {
  if (t < T.rightCut || t >= T.butCut) return null;
  const s = SPR.smug_cu;
  const k = 0.98;
  const bounce = 1 + 0.035 * spring(t - T.rightCut, 3, 5);
  const hx = 540;
  const hy = 800;
  return (
    <Img
      src={F('smug_cu')}
      style={{
        position: 'absolute',
        left: hx - s.head[0] * k,
        top: hy - s.head[1] * k,
        width: s.w * k,
        height: s.h * k,
        transformOrigin: `${s.head[0] * k}px ${s.feet[1] * k}px`,
        transform: `scale(${bounce}, ${2 - bounce})`,
      }}
    />
  );
};

export const WorldScene: React.FC<{t: number; noShake?: boolean; camOverride?: {x: number; y: number; k: number}}> = ({t, noShake, camOverride}) => {
  let cam = camOverride ?? camAt(t, CAM);
  // shake: rumble ramp, blast 30 px decaying, small bumps
  let amp = 0;
  if (t > 17.6 && t < T.boom) amp = 5 * prog(t, 17.6, T.boom);
  if (t >= T.boom) amp = 30 * Math.exp(-4 * (t - T.boom));
  if (t >= T.splash && t < T.splash + 0.3) amp = Math.max(amp, 4 * Math.exp(-12 * (t - T.splash)));
  if (t >= T.catch && t < T.catch + 0.4) amp = Math.max(amp, 6 * Math.exp(-10 * (t - T.catch)));
  const sh = noShake ? {x: 0, y: 0} : shake(t, amp);
  const smug = t >= T.rightCut && t < T.butCut;
  if (smug) cam = {x: 700, y: 140, k: 2.3};
  // depth of field: blur the plate on the character close-ups
  const close = smug || (t >= T.nailsCut && t < T.so + 0.5) || t > 20.6;
  const bgBlur = smug ? 10 : close ? 3.2 * (t > 20.6 ? prog(t, 20.6, 21.0) : 1) : 0;
  const b = bagAt(t);
  const bob = 4 * Math.sin(2 * Math.PI * 0.5 * t);
  const tilt = 1.4 * Math.sin(2 * Math.PI * 0.5 * t + 0.6);
  return (
    <AbsoluteFill style={{backgroundColor: '#8AD2F9'}}>
      <World cam={cam} blur={bgBlur} off={sh}>
        <div style={{position: 'absolute', left: -3000, top: -4000, width: 9000, height: 4002, background: '#8AD2F9'}} />
        <div style={{position: 'absolute', left: -3000, top: BG_H - 2, width: 9000, height: 3000, background: '#FD5E0C'}} />
        <Img src={F('bg')} style={{position: 'absolute', left: 0, top: 0, width: BG_W, height: BG_H}} />
        <Dashes t={t} />
        <Blob t={t} />
        <TrenchFace t={t} />
        <Snail t={t} />
        {b.layer === 'world' ? <BagImg b={b} /> : null}
        <Bubbles t={t} b={b} />
        <Volcano t={t} />
        <VolcanoFace t={t} />
        <SmokeRing t={t} />
        <Eruption t={t} />
      </World>
      <World cam={cam} blur={smug ? 10 : 0} off={sh}>
        <div style={{position: 'absolute', left: 0, top: 0, transformOrigin: `${BX}px ${SURF}px`, transform: `translateY(${bob}px) rotate(${tilt}deg)`}}>
          {smug ? null : <Guy t={t} />}
          <Boat />
        </div>
        <WaterFront t={t} />
        <Splash t={t} />
        {b.layer === 'front' ? <BagImg b={b} /> : null}
        <Zzz t={t} />
      </World>
      <SmugCut t={t} />
      <Counter t={t} />
    </AbsoluteFill>
  );
};

export const useTrenchFont = () => useFont(FONT, staticFile('fonts/Inter-Black.otf'));

export const OceanTrenchShort: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  useTrenchFont();
  return (
    <AbsoluteFill>
      <WorldScene t={t} />
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('ocean-trench/vo/take1.mp3')} />
      </Sequence>
      <SoundCues cues={CUES} dir="ocean-trench/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};

void BG_S;
void HR;
void V_BASE;
