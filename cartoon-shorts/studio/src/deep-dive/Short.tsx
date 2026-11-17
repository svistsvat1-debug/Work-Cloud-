import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SPR} from './sprites';
import {CUT_B, CUT_C, CUT_E, CUT_F, CUT_J, DURATION, FLOOR, FPS, T, VO_AT} from './scene';
export {DURATION as DD_DURATION, FPS as DD_FPS} from './scene';
import {clamp, easeInCubic, easeInOutCubic, easeOutBack, easeOutCubic, lerp, pop, prog, rnd, shake, spring} from '../shared/anim';
import {World} from '../shared/World';
import {PuffCluster, type Puff} from '../shared/Puffs';
import {SoundCues, type Cue} from '../shared/Sound';
import {SweatDrop} from '../shared/SweatDrop';
import {Eye} from '../shared/Face';
import {useFont} from '../shared/useFont';

// "Why did the first dive to the deepest spot need gasoline?" - two men sink to the bottom of the Challenger Deep in a
// steel ball hanging under a float full of gasoline (lighter than water, barely squeezes - an air balloon gets crushed).
// Five miles down a bang: a window cracks. They keep sinking. After almost five hours they land, the mud they kick up
// turns the window milky white... and the deepest trip in history has not one photo.

const F = (n: string) => staticFile(`deep-dive/${n}.png`);
export const FONT = 'DDInter';
export const useDDFont = () => useFont(FONT, staticFile('fonts/Inter-Black.otf'));
const MIX_DB = -3.0;
const INK = '#000';
export const NAVY = '#0A2147';
const TEXT_YEL = '#FFD23F';

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
const smooth = (u: number) => u * u * (3 - 2 * u);
// piecewise value keys [t, v, ease?]: 'io' (default), 'lin', 'out', 'in'
type VK = [number, number, ('io' | 'lin' | 'out' | 'in')?];
const keyed = (t: number, keys: VK[]) => {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1, e] = keys[i];
    const [t0, v0] = keys[i - 1];
    if (t < t1) {
      const r = (t - t0) / (t1 - t0);
      const u = e === 'lin' ? r : e === 'out' ? easeOutCubic(r) : e === 'in' ? easeInCubic(r) : easeInOutCubic(r);
      return lerp(v0, v1, u);
    }
  }
  return keys[keys.length - 1][1];
};

type SprInfo = {w: number; h: number; feet: [number, number]; head?: [number, number, number]; bottom: number; left: number; right: number; top: number};
const S = (n: string) => (SPR as unknown as Record<string, SprInfo>)[n];

const Spr: React.FC<{n: string; x: number; y: number; s: number; sx?: number; sy?: number; rot?: number; ax?: number; ay?: number; op?: number}> = ({
  n,
  x,
  y,
  s,
  sx = 1,
  sy = 1,
  rot = 0,
  ax,
  ay,
  op = 1,
}) => {
  const sp = S(n);
  const axx = ax ?? sp.feet[0];
  const ayy = ay ?? sp.feet[1];
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg) scale(${sx}, ${sy})`, transformOrigin: '0 0', opacity: op}}>
      <Img src={F(n)} style={{position: 'absolute', left: -axx * s, top: -ayy * s, width: sp.w * s, height: sp.h * s}} />
    </div>
  );
};
const Svg: React.FC<{children: React.ReactNode; style?: React.CSSProperties}> = ({children, style}) => (
  <svg style={{position: 'absolute', left: -6000, top: -6000, overflow: 'visible', ...style}} width={12000} height={12000} viewBox="-6000 -6000 12000 12000">
    {children}
  </svg>
);
const ScreenSvg: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1080} height={1920} viewBox="0 0 1080 1920">
    {children}
  </svg>
);
const Txt: React.FC<{x: number; y: number; size: number; s?: number; text: string; rot?: number; fill?: string; sw?: number}> = ({x, y, size, s = 1, text, rot = 0, fill = '#fff', sw = 0.18}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <text x={0} y={size * 0.35} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={size} fill={fill} stroke={INK} strokeWidth={size * sw} paintOrder="stroke" strokeLinejoin="round">
        {text}
      </text>
    </g>
  );
// fat arrow pointing along +x (rotate it), white with a black outline
const Arrow: React.FC<{x: number; y: number; rot: number; s: number; len?: number; fill?: string}> = ({x, y, rot, s, len = 90, fill = '#FFFFFF'}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path
        d={`M ${-len / 2} -11 L ${len / 2 - 26} -11 L ${len / 2 - 26} -28 L ${len / 2} 0 L ${len / 2 - 26} 28 L ${len / 2 - 26} 11 L ${-len / 2} 11 Z`}
        fill={fill}
        stroke={INK}
        strokeWidth={7}
        strokeLinejoin="round"
      />
    </g>
  );

// ======================================================================================================
// WIDE: the descent (world: 1 unit = 1 px at k 1; the craft hangs at x CX, its feet (ball bottom) at y Y(t))
// ======================================================================================================
const CS = 0.62; // craft sprite scale in the world
const CX = 540;
const CR = S('craft') as SprInfo & {hole: number[]; float_box: number[]};
const HOLE = {x: (CR.hole[0] - CR.feet[0]) * CS, y: (CR.hole[1] - CR.feet[1]) * CS, r: CR.hole[2] * CS}; // relative to the feet
const FLT = {
  x: ((CR.float_box[0] + CR.float_box[2]) / 2 - CR.feet[0]) * CS,
  y: ((CR.float_box[1] + CR.float_box[3]) / 2 - CR.feet[1]) * CS,
  hw: ((CR.float_box[2] - CR.float_box[0]) / 2) * CS,
  hh: ((CR.float_box[3] - CR.float_box[1]) / 2) * CS,
};
const SURF_S = 1.4;
const SURF = {x: CX - (SPR.surface.w * SURF_S) / 2, y: 0, w: SPR.surface.w * SURF_S, h: SPR.surface.h * SURF_S, sea: SPR.surface.sea * SURF_S};
const BOT_S = 1.12;
const BOT_FLOOR_PX = 1231;
const BOT = {x: CX - (SPR.bottom.w * BOT_S) / 2, y: FLOOR - BOT_FLOOR_PX * BOT_S, w: SPR.bottom.w * BOT_S, h: SPR.bottom.h * BOT_S};
const rgb = (c: readonly number[]) => `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
const DEEP = rgb(SPR.bottom.top);

// craft feet y over time (the descent)
const Y_KEYS: VK[] = [
  [0, 1150],
  [3.0, 1640, 'lin'],
  [CUT_B, 1990, 'lin'],
  [CUT_C, 2250, 'lin'],
  [T.but, 3300, 'lin'],
  [10.4, 5200, 'io'],
  [T.bang, 5330, 'out'],
  [CUT_E, 5420, 'lin'],
  [CUT_F, 5600, 'lin'],
  [T.after, 5760, 'lin'],
  [T.land, FLOOR, 'io'],
];
const craftY = (t: number) => {
  const y = keyed(t, Y_KEYS);
  // landing: sinks 14 units into the mud and springs back a bit
  return t > T.land ? FLOOR + 10 * Math.max(0, spring(t - T.land, 1.6, 5)) : y;
};
const DEPTH_KEYS: VK[] = [
  [0, 0],
  [CUT_B, 2900, 'lin'],
  [CUT_C, 3600, 'lin'],
  [T.but, 14000, 'lin'],
  [T.miles, 26400, 'out'],
  [T.bang, 29000, 'lin'],
  [CUT_F, 30200, 'lin'],
  [T.after, 30600, 'lin'],
  [T.land, 35800, 'io'],
];
// camera offset from the craft feet + zoom
const DY_KEYS: VK[] = [
  [0, -270],
  [T.hanging, -275, 'lin'],
  [3.95, -400],
  [CUT_B, -398, 'lin'],
  [CUT_C, -300],
  [T.but - 0.05, -330],
  [10.4, -250],
  [T.bang, -250],
  [T.bang + 0.25, -170, 'out'],
  [CUT_E, -175],
  [CUT_F, -260],
  [T.after, -260],
  [T.land, -300],
  [T.kicking, -300],
  [CUT_J, -175],
];
const K_KEYS: VK[] = [
  [0, 1.2],
  [T.hanging, 1.22, 'lin'],
  [3.95, 1.32],
  [CUT_B, 1.36, 'lin'],
  [CUT_C, 0.97],
  [T.but - 0.05, 1.0, 'lin'],
  [10.4, 1.0],
  [T.bang, 1.02],
  [T.bang + 0.25, 1.45, 'out'],
  [CUT_E, 1.5, 'lin'],
  [CUT_F, 0.98],
  [T.after, 1.0, 'lin'],
  [T.land, 0.92],
  [T.kicking, 0.93, 'lin'],
  [CUT_J, 1.25],
];
const wideCam = (t: number) => {
  const y = craftY(t);
  const dy = keyed(t, DY_KEYS);
  const k = keyed(t, K_KEYS);
  const sh = shake(t, 26 * Math.exp(-3.5 * Math.max(0, t - T.bang)) * (t > T.bang ? 1 : 0) + 6 * bump(t, T.land - 0.02, 0.3));
  return {x: CX + sh.x * 0.6, y: y + dy + sh.y * 0.6, k};
};
// which shot: 'A' 'B' 'C' 'E' 'F' 'J'
const shotAt = (t: number) => (t < CUT_B ? 'A' : t < CUT_C ? 'B' : t < CUT_E ? 'C' : t < CUT_F ? 'E' : t < CUT_J ? 'F' : 'J');

// marine snow: world-space dots along the descent column
const SNOW = Array.from({length: 420}, (_, i) => ({x: -260 + rnd(i * 3 + 1) * 1600, y: 600 + rnd(i * 3 + 2) * 8700, r: 2.5 + rnd(i * 3 + 3) * 4.5, ph: rnd(i * 7) * 6.28}));

const WideBackground: React.FC<{t: number; cam: {x: number; y: number; k: number}}> = ({t, cam}) => {
  const vel = (craftY(t + 1 / 60) - craftY(t)) * 60; // world units / s
  const streak = clamp((vel - 900) / 2500) * 120;
  return (
    <World cam={cam}>
      <div style={{position: 'absolute', left: -3000, top: 1800, width: 7000, height: 9000, background: DEEP}} />
      <div
        style={{
          position: 'absolute',
          left: -3000,
          top: SURF.y + SURF.h - 40,
          width: 7000,
          height: 2600,
          background: `linear-gradient(${rgb(SPR.surface.bot)}, ${DEEP})`,
        }}
      />
      <div style={{position: 'absolute', left: -3000, top: -2000, width: 7000, height: 2000 + SURF.sea, background: '#9ED8F5'}} />
      <Img src={F('surface')} style={{position: 'absolute', left: SURF.x, top: SURF.y, width: SURF.w, height: SURF.h}} />
      <div style={{position: 'absolute', left: -3000, top: SURF.sea + 30, width: SURF.x + 3000 + 2, height: SURF.h, background: 'linear-gradient(#34A7DC, #1F5FA6 60%, #10336A)'}} />
      <div style={{position: 'absolute', left: SURF.x + SURF.w - 2, top: SURF.sea + 30, width: 3000, height: SURF.h, background: 'linear-gradient(#34A7DC, #1F5FA6 60%, #10336A)'}} />
      <Img
        src={F('bottom')}
        style={{
          position: 'absolute',
          left: BOT.x,
          top: BOT.y,
          width: BOT.w,
          height: BOT.h,
          WebkitMaskImage: 'linear-gradient(transparent, black 30%)',
          maskImage: 'linear-gradient(transparent, black 30%)',
        }}
      />
      <div style={{position: 'absolute', left: -3000, top: BOT.y + BOT.h - 4, width: 7000, height: 3000, background: 'rgb(191, 183, 162)'}} />
      {/* side fill for the bottom plate (rock walls continue off-plate) */}
      <div style={{position: 'absolute', left: BOT.x - 2000, top: BOT.y + BOT.h * 0.3, width: 2002, height: BOT.h, background: '#24324C'}} />
      <div style={{position: 'absolute', left: BOT.x + BOT.w - 2, top: BOT.y + BOT.h * 0.3, width: 2000, height: BOT.h, background: '#24324C'}} />
      <Svg>
        {SNOW.filter((p) => Math.abs(p.y - cam.y) < 1400 / cam.k && p.y > SURF.sea + 120).map((p, i) => {
          const x = p.x + 18 * Math.sin(t * 0.7 + p.ph);
          const y = p.y - t * 12;
          return streak > 4 ? (
            <line key={i} x1={x} y1={y} x2={x} y2={y + streak} stroke="rgba(230,240,255,0.55)" strokeWidth={p.r * 0.9} strokeLinecap="round" />
          ) : (
            <circle key={i} cx={x} cy={y} r={p.r} fill="rgba(230,240,255,0.5)" />
          );
        })}
      </Svg>
    </World>
  );
};

// a red balloon full of AIR that gets crushed (code-drawn, world coords)
const Balloon: React.FC<{t: number; x: number; y: number}> = ({t, x, y}) => {
  const s = pop(t, T.and - 0.05, 0.3);
  if (s <= 0.001) return null;
  const crush = smooth(prog(t, T.air, T.barely + 0.05));
  const r = 92 * (1 - 0.62 * crush);
  const wob = (a: number) => 1 + crush * 0.16 * Math.sin(a * 7 + 1.3) + crush * 0.08 * Math.sin(a * 13);
  const pts = Array.from({length: 48}, (_, i) => {
    const a = (i / 48) * Math.PI * 2;
    return `${(Math.cos(a) * r * wob(a)).toFixed(1)},${(Math.sin(a) * r * 1.12 * wob(a + 0.5)).toFixed(1)}`;
  });
  const fadeOut = 1 - prog(t, T.but - 0.35, T.but);
  if (fadeOut <= 0) return null;
  return (
    <g transform={`translate(${x} ${y}) scale(${s * fadeOut})`}>
      <path d={`M 0 ${r * 1.12} q 10 30 -6 60 q -14 26 6 54`} fill="none" stroke={INK} strokeWidth={4} />
      <polygon points={pts.join(' ')} fill="#E8433A" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
      <ellipse cx={-r * 0.35} cy={-r * 0.45} rx={r * 0.18} ry={r * 0.3} fill="#FF8C83" transform={`rotate(25 ${-r * 0.35} ${-r * 0.45})`} />
      <path d={`M -9 ${r * 1.12 - 2} L 9 ${r * 1.12 - 2} L 0 ${r * 1.12 + 12} Z`} fill="#C9322B" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
      {crush < 0.25 ? (
        <>
          <Eye x={-r * 0.28} y={-r * 0.05} r={r * 0.2} open={1} look={[0.6, 0]} brow={NaN} side={-1} />
          <Eye x={r * 0.28} y={-r * 0.05} r={r * 0.2} open={1} look={[0.6, 0]} brow={NaN} side={1} />
        </>
      ) : (
        <>
          <Eye x={-r * 0.3} y={-r * 0.05} r={r * 0.28} open={1} squeeze side={-1} />
          <Eye x={r * 0.3} y={-r * 0.05} r={r * 0.28} open={1} squeeze side={1} />
        </>
      )}
    </g>
  );
};

// arrows pushing inward around a point (water pressure)
const Squeeze: React.FC<{t: number; x: number; y: number; rx: number; ry: number; t0: number; t1: number; n?: number; s?: number}> = ({t, x, y, rx, ry, t0, t1, n = 6, s = 1}) => {
  const a = popOut(t, t0, t1, 0.2) * s;
  if (a <= 0.001) return null;
  const push = 0.5 + 0.5 * Math.sin(2 * Math.PI * 3 * (t - t0));
  return (
    <g>
      {Array.from({length: n}, (_, i) => {
        const ang = (i / n) * Math.PI * 2 + 0.3;
        const d = 1.0 + 0.12 * push;
        return <Arrow key={i} x={x + Math.cos(ang) * rx * d} y={y + Math.sin(ang) * ry * d} rot={(ang * 180) / Math.PI + 180} s={a * 0.7} len={80} />;
      })}
    </g>
  );
};

// crack lines on a window (unit circle coords scaled by r), revealed by p 0..1
const CRACKS: [number, number][][] = [
  [[0.35, -0.3], [0.1, -0.12], [-0.05, 0.06], [-0.32, 0.12], [-0.6, 0.3]],
  [[0.1, -0.12], [0.22, 0.18], [0.18, 0.5]],
  [[-0.05, 0.06], [-0.12, 0.4], [-0.3, 0.62]],
  [[0.35, -0.3], [0.62, -0.42]],
  [[0.35, -0.3], [0.42, -0.62]],
  [[-0.32, 0.12], [-0.5, -0.12], [-0.7, -0.2]],
];
const Crack: React.FC<{x: number; y: number; r: number; p: number; sw: number}> = ({x, y, r, p, sw}) => {
  if (p <= 0.001) return null;
  return (
    <g transform={`translate(${x} ${y})`}>
      {CRACKS.map((c, i) => {
        const d = 'M ' + c.map(([a, b]) => `${(a * r).toFixed(1)} ${(b * r).toFixed(1)}`).join(' L ');
        const len = c.slice(1).reduce((acc, q, j) => acc + Math.hypot(q[0] - c[j][0], q[1] - c[j][1]) * r, 0);
        const u = clamp(p * 1.6 - i * 0.12);
        return (
          <g key={i}>
            <path d={d} fill="none" stroke={INK} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${len * u} ${len + 10}`} />
            <path d={d} fill="none" stroke="#FFFFFF" strokeWidth={sw * 0.35} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${len * u} ${len + 10}`} transform={`translate(${sw * 0.45} ${-sw * 0.3})`} />
          </g>
        );
      })}
      <circle cx={0.35 * r} cy={-0.3 * r} r={sw * 1.2 * clamp(p * 3)} fill={INK} />
    </g>
  );
};

// the two crew in the craft's window (tiny, wide shots): poses per time
const crewPoses = (t: number): [string, string] => {
  if (t < CUT_C) return ['point', 'b_smug'];
  if (t < T.bang) return ['point', 'b_smug'];
  if (t < T.land) return ['scared', 'b_scared'];
  if (t < T.kicking + 0.4) return ['cheer', 'b_smug'];
  return ['cheer', 'b_squint'];
};

// mud cloud puffs (world), born from the floor around the craft
const MUD = Array.from({length: 26}, (_, i) => ({
  x: (rnd(i * 5 + 1) - 0.5) * 1100,
  d: 0.05 + rnd(i * 5 + 2) * 0.55,
  r: 70 + rnd(i * 5 + 3) * 90,
  h: 60 + rnd(i * 5 + 4) * 520,
}));
const mudPuffs = (t: number, x0: number, y0: number): Puff[] =>
  MUD.map((m) => {
    const u = clamp((t - T.kicking - m.d) / 1.3);
    const e = easeOutCubic(u);
    return {x: x0 + m.x * (0.25 + 0.75 * e), y: y0 - m.h * e - 20, r: m.r * (0.15 + 0.85 * e)};
  });

const WideScene: React.FC<{t: number; coverMode?: boolean}> = ({t, coverMode}) => {
  const cam = wideCam(t);
  const Y = craftY(t);
  const deep = clamp((cam.y - 1400) / 2600);
  const lamp = clamp(prog(t, T.but - 0.2, T.but + 0.3));
  // craft body motion: bob + bang jolt + landing squash
  const bob = 6 * Math.sin(2 * Math.PI * 0.45 * t);
  const jolt = t > T.bang ? 10 * Math.exp(-4 * (t - T.bang)) * Math.sin(2 * Math.PI * 9 * (t - T.bang)) : 0;
  const land = t > T.land ? spring(t - T.land, 2.2, 6) : 0;
  const csx = 1 + 0.03 * land;
  const csy = 1 - 0.04 * land;
  // float squeeze test ("it barely squeezes") + buoyancy lift ("lighter than water")
  const fsq = 0.02 * bump(t, T.barely, 0.25) + 0.015 * bump(t, T.barely + 0.3, 0.25);
  const lift = -14 * bump(t, T.lighter, 0.7);
  const fx = CX + FLT.x;
  const fy = Y + FLT.y + bob + lift;
  const [pa, pb] = crewPoses(t);
  const hx = CX + HOLE.x;
  const hy = Y + HOLE.y + bob + jolt;
  const crackP = t > T.bang ? clamp((t - T.bang) / 0.3) : 0;
  const swapT = [T.bang, T.land, T.kicking + 0.4].find((s) => t >= s - 0.08 && t < s + 0.6) ?? -9;
  const [ssx, ssy] = squashSwap(t, swapT);
  const crewS = 0.17;
  // float face
  const fEyeOpen = pop(t, 0.35, 0.3);
  const squeezeEyes = (t > T.bang && t < T.bang + 0.7) || (t > T.land && t < T.land + 0.35);
  const smugLid = t > T.barely && t < T.but ? 0.45 : 0;
  // anglerfish (before the bang it swims up to the window; on the bang it flees)
  const angIn = prog(t, 9.75, 10.9);
  const angOut = easeInCubic(prog(t, T.bang + 0.05, T.bang + 0.7));
  const angX = CX + lerp(760, 330, easeOutCubic(angIn)) + angOut * 900;
  const angY = Y - 40 + 14 * Math.sin(t * 3) - angOut * 120;
  // jellyfish drifting up past the craft (two passes)
  const jelly1 = !coverMode && t > 0.6 && t < CUT_B ? {x: CX - 400 + 20 * Math.sin(t * 1.4), y: Y + 360 - (t - 0.6) * 160} : null;
  const jelly2 = t > CUT_F && t < 17.0 ? {x: CX - 360 + 25 * Math.sin(t * 1.3), y: Y + 520 - (t - CUT_F) * 820} : null;
  // sea cucumber on the floor
  const cuc = t > 16.2 ? {x: CX + 330, y: FLOOR + 6} : null;
  // bubbles from the float vent
  const bubbles = Array.from({length: 10}, (_, i) => {
    const ph = ((t * 0.9 + i / 10) % 1 + 1) % 1;
    const life = Math.sin(Math.PI * ph);
    return {x: fx - 60 + 30 * Math.sin(i * 2.1 + t * 2), y: fy - FLT.hh - 30 - ph * 330, r: (6 + 8 * rnd(i)) * life};
  });
  const mud = t > T.kicking ? mudPuffs(t, CX, FLOOR) : [];
  const fog = clamp((t - T.kicking - 0.3) / 1.1);
  return (
    <AbsoluteFill>
      <WideBackground t={t} cam={cam} />
      {/* depth darkness over the water (not over the craft) */}
      <AbsoluteFill style={{background: `rgba(2, 8, 24, ${0.42 * deep})`}} />
      <World cam={cam}>
        <Svg>
          {/* floodlight cone from the ball */}
          {lamp > 0.01 ? (
            <polygon
              points={`${hx + 110},${hy + 90} ${hx + 900},${hy + 760} ${hx + 260},${hy + 980}`}
              fill={`rgba(255, 236, 160, ${0.16 * lamp})`}
            />
          ) : null}
        </Svg>
        {jelly1 ? <Spr n="jelly" x={jelly1.x} y={jelly1.y} s={0.32} ax={160} ay={210} /> : null}
        {jelly2 ? <Spr n="jelly" x={jelly2.x} y={jelly2.y} s={0.3} ax={160} ay={210} rot={-8} /> : null}
        {cuc ? (
          <Spr n="cucumber" x={cuc.x} y={cuc.y - 70 * bump(t, T.land + 0.04, 0.42)} s={0.34 * (1 + 0.02 * Math.sin(t * 4))} sy={1 - 0.03 * Math.sin(t * 4) + 0.12 * bump(t, T.land + 0.04, 0.42)} rot={-12 * bump(t, T.land + 0.04, 0.42)} />
        ) : null}
        {cuc && t > T.land && t < T.kicking + 0.6 ? (
          <Svg>
            <Txt x={cuc.x + 40} y={cuc.y - 150} size={90} s={popOut(t, T.land + 0.08, T.kicking + 0.3, 0.2)} text="!" fill={TEXT_YEL} />
          </Svg>
        ) : null}
        {t > 9.6 && t < T.bang + 0.75 ? (
          <Spr n="angler" x={angX} y={angY} s={0.42} ax={250} ay={210} sx={-1} rot={angOut * -15} />
        ) : null}
        {/* the crew inside the window (behind the craft sprite, clipped to the hole) */}
        <div
          style={{
            position: 'absolute',
            left: hx - HOLE.r,
            top: hy - HOLE.r,
            width: HOLE.r * 2,
            height: HOLE.r * 2,
            borderRadius: '50%',
            overflow: 'hidden',
            background: 'radial-gradient(circle at 50% 30%, #3E6A7E, #1C3B4A 70%)',
          }}
        >
          {(
            [
              [pa, -0.36, 1],
              [pb, 0.36, 0],
            ] as [string, number, number][]
          ).map(([n, dx, isA]) => {
            const hd = S(n).head as [number, number, number];
            const s = (crewS * 140) / hd[2];
            const tr = t > T.bang && t < T.land ? 1.5 * Math.sin(2 * Math.PI * 14 * t + dx * 9) : 0;
            return (
              <div key={n + dx} style={{position: 'absolute', left: HOLE.r + dx * HOLE.r * 1.15 + tr, top: HOLE.r * 0.95}}>
                <Spr n={n} x={0} y={0} s={s} ax={hd[0]} ay={hd[1]} sx={isA ? ssx : ssx} sy={ssy} />
              </div>
            );
          })}
          {/* mud fog in the window */}
          <div style={{position: 'absolute', inset: 0, background: `rgba(236, 232, 222, ${0.92 * fog})`}} />
        </div>
        <Spr n="craft" x={CX} y={Y + bob} s={CS} sx={csx} sy={csy} />
        <Svg>
          {/* window glass + crack */}
          <circle cx={hx} cy={hy} r={HOLE.r} fill="rgba(190, 230, 255, 0.12)" />
          <path d={`M ${hx - HOLE.r * 0.6} ${hy - HOLE.r * 0.35} A ${HOLE.r * 0.7} ${HOLE.r * 0.7} 0 0 1 ${hx - HOLE.r * 0.1} ${hy - HOLE.r * 0.68}`} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={5} strokeLinecap="round" />
          <Crack x={hx} y={hy} r={HOLE.r} p={crackP} sw={4} />
          {/* float: squeeze test overlay (scaled copy of nothing: just the face rides on the float) */}
          <g transform={`translate(${fx} ${fy}) scale(${1 - fsq * 0.6} ${1 - fsq})`}>
            {/* gas badge */}
            <g transform={`translate(${-FLT.hw * 0.36} 4) scale(${coverMode ? 1 : pop(t, T.gasoline - 0.05, 0.3)})`}>
              <rect x={-118} y={-46} width={236} height={92} rx={22} fill="#FFFFFF" stroke={INK} strokeWidth={7} />
              <g transform="translate(-74 0)">
                <rect x={-22} y={-30} width={36} height={60} rx={6} fill="#E8433A" stroke={INK} strokeWidth={5} />
                <rect x={-14} y={-22} width={20} height={16} rx={3} fill="#FFFFFF" stroke={INK} strokeWidth={3} />
                <path d="M 14 -14 L 26 -6 L 26 22 L 32 22" fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
              </g>
              <text x={30} y={14} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={34} fill="#E8433A" stroke={INK} strokeWidth={2} paintOrder="stroke">
                GAS
              </text>
            </g>
            {/* face */}
            <Eye x={FLT.hw * 0.38} y={-12} r={24} open={fEyeOpen} squeeze={squeezeEyes} side={-1} lid={smugLid} look={t < CUT_C ? [-0.2, 0.7] : [0.3, 0.3]} brow={0.6} />
            <Eye x={FLT.hw * 0.56} y={-12} r={24} open={fEyeOpen} squeeze={squeezeEyes} side={1} lid={smugLid} look={t < CUT_C ? [-0.2, 0.7] : [0.3, 0.3]} brow={0.6} />
            {fEyeOpen > 0.5 ? (
              squeezeEyes ? (
                <ellipse cx={FLT.hw * 0.47} cy={30} rx={18} ry={14} fill="#7A2E1C" stroke={INK} strokeWidth={5} />
              ) : (
                <path d={`M ${FLT.hw * 0.4} 26 Q ${FLT.hw * 0.47} ${smugLid ? 34 : 44} ${FLT.hw * 0.54} 24`} fill="none" stroke={INK} strokeWidth={6} strokeLinecap="round" />
              )
            ) : null}
          </g>
          {/* buoyancy arrows (lighter than water) */}
          {[-1, 0, 1].map((i) => (
            <Arrow key={i} x={fx + i * 170} y={fy + FLT.hh + 70 - 60 * prog(t, T.lighter, T.water + 0.4)} rot={-90} s={popOut(t, T.lighter - 0.05, T.and - 0.1, 0.2) * 0.8} len={110} />
          ))}
          <Squeeze t={t} x={fx} y={fy} rx={FLT.hw + 70} ry={FLT.hh + 70} t0={T.barely - 0.05} t1={T.but - 0.25} n={8} s={0.9} />
          {/* air balloon gets crushed */}
          <Balloon t={t} x={CX - 320} y={Y - 60 + bob} />
          <Squeeze t={t} x={CX - 320} y={Y - 60 + bob} rx={165} ry={180} t0={T.unlike} t1={T.barely - 0.05} n={6} />
          {/* bubbles from the float vent */}
          {t < 17.2
            ? bubbles.map((b, i) => (b.r > 0.8 ? <circle key={i} cx={b.x} cy={b.y} r={b.r} fill="rgba(220,240,255,0.7)" stroke={INK} strokeWidth={3} /> : null))
            : null}
          {/* mud cloud */}
          {mud.length ? <PuffCluster puffs={mud} fill="#EDE8DD" ink={6} shade="#DED7C8" /> : null}
        </Svg>
      </World>
      {/* BANG */}
      {t > T.bang - 0.02 && t < T.bang + 1.0 ? (
        <AbsoluteFill style={{background: `rgba(255,255,255,${0.55 * (1 - prog(t, T.bang, T.bang + 0.12))})`}} />
      ) : null}
      <ScreenSvg>
        <BangBurst t={t} />
      </ScreenSvg>
      {coverMode ? null : <Hud t={t} />}
    </AbsoluteFill>
  );
};

const BangBurst: React.FC<{t: number}> = ({t}) => {
  const s = popOut(t, T.bang, T.steel, 0.22);
  if (s <= 0.001) return null;
  const pts = Array.from({length: 24}, (_, i) => {
    const a = (i / 24) * Math.PI * 2;
    const r = i % 2 ? 150 : 250;
    return `${(Math.cos(a) * r * 1.25).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`;
  }).join(' ');
  return (
    <g transform={`translate(560 430) rotate(-6) scale(${s * 0.9})`}>
      <polygon points={pts} fill={TEXT_YEL} stroke={INK} strokeWidth={10} strokeLinejoin="round" />
      <Txt x={0} y={-8} size={150} text="BANG" fill="#E8433A" />
    </g>
  );
};

// ---------- HUD: depth gauge (+ "5 MILES" tag) and the five-hour clock ----------
const fmt = (n: number) => Math.round(n / 100) * 100;
const Hud: React.FC<{t: number}> = ({t}) => {
  const shot = shotAt(t);
  if (shot === 'B' || shot === 'E' || shot === 'J') return null;
  const s = pop(t, 0.25, 0.3);
  const d = fmt(keyed(t, DEPTH_KEYS));
  const miles = popOut(t, T.five, T.bang - 0.1, 0.25);
  const clk = popOut(t, T.after - 0.05, CUT_J - 0.3, 0.25);
  const hrs = keyed(t, [
    [T.after, 0],
    [T.land, 4 * 60 + 47, 'io'],
  ]);
  const hh = Math.floor(hrs / 60);
  const mm = Math.floor(hrs % 60);
  const landed = t >= T.land;
  return (
    <ScreenSvg>
      <g transform={`translate(60 120) scale(${s})`} style={{transformOrigin: '0 0'}}>
        <rect x={0} y={0} width={430} height={150} rx={28} fill="#0B1E3A" stroke={INK} strokeWidth={9} />
        <rect x={9} y={9} width={412} height={132} rx={22} fill="none" stroke="#2E5C8F" strokeWidth={4} />
        <text x={30} y={50} fontFamily={FONT} fontWeight={900} fontSize={30} fill={TEXT_YEL}>
          DEPTH
        </text>
        <text x={30} y={118} fontFamily={FONT} fontWeight={900} fontSize={64} fill={landed ? TEXT_YEL : '#FFFFFF'}>
          {d.toLocaleString('en-US')} FT
        </text>
      </g>
      {miles > 0.001 ? (
        <g transform={`translate(275 330) rotate(-5) scale(${miles})`}>
          <rect x={-150} y={-46} width={300} height={92} rx={20} fill="#E8433A" stroke={INK} strokeWidth={8} />
          <Txt x={0} y={0} size={58} text="5 MILES" sw={0.12} />
        </g>
      ) : null}
      {clk > 0.001 ? (
        <g transform={`translate(745 195) scale(${clk})`}>
          <circle r={78} fill="#FEFDFD" stroke={INK} strokeWidth={9} />
          {Array.from({length: 12}, (_, i) => {
            const b = (i / 12) * Math.PI * 2;
            return <line key={i} x1={Math.sin(b) * 56} y1={-Math.cos(b) * 56} x2={Math.sin(b) * 67} y2={-Math.cos(b) * 67} stroke={INK} strokeWidth={i % 3 === 0 ? 6 : 3} strokeLinecap="round" />;
          })}
          <line x1={0} y1={0} x2={Math.sin((hrs / 720) * Math.PI * 2) * 34} y2={-Math.cos((hrs / 720) * Math.PI * 2) * 34} stroke={INK} strokeWidth={8} strokeLinecap="round" />
          <line x1={0} y1={0} x2={Math.sin((hrs / 60) * Math.PI * 2) * 52} y2={-Math.cos((hrs / 60) * Math.PI * 2) * 52} stroke="#E8433A" strokeWidth={6} strokeLinecap="round" />
          <circle r={8} fill={INK} />
          <Txt x={0} y={128} size={54} text={`${hh} h ${String(mm).padStart(2, '0')}`} sw={0.16} />
        </g>
      ) : null}
    </ScreenSvg>
  );
};

// ======================================================================================================
// CLOSE-UP: the porthole seen from outside, the two crew inside (screen space)
// ======================================================================================================
const PH = {x: 540, y: 900, r: 400};
type CU = {a: string; b: string; ta: number; tb: number};
const cuPoses = (t: number): CU => {
  if (t < CUT_C) return {a: 'shrug', b: 'b_smug', ta: CUT_B, tb: CUT_B};
  if (t < CUT_F) return t < T.keep - 0.05 ? {a: 'scared', b: 'b_scared', ta: CUT_E, tb: CUT_E} : {a: 'thumbs', b: 'b_scared', ta: T.keep - 0.05, tb: CUT_E};
  if (t < T.so - 0.05) return {a: 'cheer', b: 'b_squint', ta: CUT_J, tb: CUT_J};
  return {a: 'camera', b: 'b_squint', ta: T.so - 0.05, tb: CUT_J};
};
const RIVETS = Array.from({length: 18}, (_, i) => (i / 18) * Math.PI * 2);

const Porthole: React.FC<{t: number}> = ({t}) => {
  const p = cuPoses(t);
  const scared = t >= CUT_E && t < CUT_F;
  const sh = shake(t, scared ? 5 * Math.exp(-2 * (t - CUT_E)) : 0);
  const crackP = t >= CUT_E && t < CUT_F ? smooth(prog(t, CUT_E + 0.05, T.cracked + 0.2)) : 0;
  const fogIn = t >= CUT_J ? smooth(prog(t, CUT_J - 0.1, T.white + 0.2)) : 0;
  const fogThin = t >= CUT_J ? 0.42 * smooth(prog(t, T.so - 0.15, T.so + 0.45)) : 0;
  const fog = fogIn * (1 - fogThin);
  const flash = t >= CUT_J ? Math.max(0, 1 - Math.abs(t - (T.world + 0.05)) / 0.16) : 0;
  const camK = t < CUT_C ? keyed(t, [[CUT_B, 1.0], [CUT_C, 1.04, 'lin']]) : t < CUT_F ? keyed(t, [[CUT_E, 1.06], [CUT_F, 1.1, 'lin']]) : keyed(t, [[CUT_J, 1.0], [DURATION, 1.06, 'lin']]);
  const crew: [string, number, number, number][] = [
    [p.a, PH.x - 165, PH.y - 20, p.ta],
    [p.b, PH.x + 170, PH.y - 10, p.tb],
  ];
  return (
    <AbsoluteFill style={{background: '#4E6A86', transform: `translate(${sh.x}px, ${sh.y}px) scale(${camK})`, transformOrigin: `${PH.x}px ${PH.y}px`}}>
      <ScreenSvg>
        <ellipse cx={300} cy={380} rx={900} ry={700} fill="#5B7895" />
        <ellipse cx={240} cy={300} rx={420} ry={260} fill="#6886A2" />
        <path d="M -40 1520 Q 540 1660 1120 1520" fill="none" stroke={INK} strokeWidth={10} />
        {Array.from({length: 9}, (_, i) => (
          <circle key={i} cx={60 + i * 120} cy={1600 - 40 * Math.sin((i / 8) * Math.PI)} r={16} fill="#8FA3B8" stroke={INK} strokeWidth={6} />
        ))}
        {RIVETS.map((a, i) => (
          <circle key={i} cx={PH.x + Math.cos(a) * 520} cy={PH.y + Math.sin(a) * 520} r={15} fill="#8FA3B8" stroke={INK} strokeWidth={6} />
        ))}
        <circle cx={PH.x} cy={PH.y} r={478} fill="#C9CFD6" stroke={INK} strokeWidth={13} />
        <circle cx={PH.x - 10} cy={PH.y - 10} r={455} fill="none" stroke="#E3E7EB" strokeWidth={14} />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
          const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
          return <circle key={i} cx={PH.x + Math.cos(a) * 440} cy={PH.y + Math.sin(a) * 440} r={17} fill="#9AA3AD" stroke={INK} strokeWidth={6} />;
        })}
      </ScreenSvg>
      {/* inside the glass */}
      <div style={{position: 'absolute', left: PH.x - PH.r, top: PH.y - PH.r, width: PH.r * 2, height: PH.r * 2, borderRadius: '50%', overflow: 'hidden', background: 'radial-gradient(circle at 50% 22%, #5C8BA0, #24495C 62%, #163240)'}}>
        {crew.map(([n, x, y, ts], i) => {
          const hd = S(n).head as [number, number, number];
          const s = 158 / hd[2];
          const [sx, sy] = squashSwap(t, ts);
          const tr = scared ? 2.2 * Math.sin(2 * Math.PI * 13 * t + i * 2) : 0;
          const br = breathe(t, i * 1.7);
          return (
            <div key={i} style={{position: 'absolute', left: x - (PH.x - PH.r) + tr, top: y - (PH.y - PH.r)}}>
              <Spr n={n} x={0} y={0} s={s} ax={hd[0]} ay={hd[1]} sx={sx * (2 - br)} sy={sy * br} />
            </div>
          );
        })}
        {/* flash of the camera inside */}
        {flash > 0.01 ? <div style={{position: 'absolute', inset: 0, background: `radial-gradient(circle at 36% 62%, rgba(255,255,255,${flash}), rgba(255,255,255,${0.6 * flash}) 55%, rgba(255,255,255,0))`}} /> : null}
      </div>
      <ScreenSvg>
        <defs>
          <clipPath id="ddglass">
            <circle cx={PH.x} cy={PH.y} r={PH.r} />
          </clipPath>
        </defs>
        <g clipPath="url(#ddglass)">
          {/* milky mud outside the glass */}
          {fog > 0.001 ? (
            <g opacity={clamp(fog * 1.15)}>
              <PuffCluster
                puffs={Array.from({length: 14}, (_, i) => {
                  const a = (i / 14) * Math.PI * 2;
                  const rr = lerp(560, 250, fogIn) + 40 * Math.sin(t * 1.3 + i);
                  return {x: PH.x + Math.cos(a) * rr, y: PH.y + Math.sin(a) * rr, r: 150 + 50 * fogIn};
                })}
                fill="#EDE8DD"
                ink={0}
                shade="#E2DBCD"
              />
              <circle cx={PH.x} cy={PH.y} r={PH.r} fill={`rgba(237, 232, 221, ${0.8 * fog})`} />
            </g>
          ) : null}
          <path d={`M ${PH.x - 300} ${PH.y - 150} A 330 330 0 0 1 ${PH.x - 90} ${PH.y - 320}`} fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth={22} strokeLinecap="round" />
          <path d={`M ${PH.x - 320} ${PH.y - 60} A 340 340 0 0 1 ${PH.x - 290} ${PH.y - 120}`} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={14} strokeLinecap="round" />
          <Crack x={PH.x} y={PH.y} r={PH.r} p={crackP} sw={9} />
          {flash > 0.01 ? <circle cx={PH.x - 160} cy={PH.y + 70} r={PH.r * 1.3} fill={`rgba(255,255,250,${0.92 * flash})`} /> : null}
          {flash > 0.01 ? (
            <g transform={`translate(${PH.x - 165} ${PH.y + 60}) scale(${0.6 + 0.6 * flash})`}>
              {Array.from({length: 8}, (_, i) => {
                const an = (i / 8) * Math.PI * 2;
                return <line key={i} x1={Math.cos(an) * 60} y1={Math.sin(an) * 60} x2={Math.cos(an) * 150} y2={Math.sin(an) * 150} stroke={TEXT_YEL} strokeWidth={14} strokeLinecap="round" opacity={flash} />;
              })}
            </g>
          ) : null}
        </g>
        <circle cx={PH.x} cy={PH.y} r={PH.r} fill="none" stroke={INK} strokeWidth={12} />
        {scared ? (
          <>
            <SweatDrop x={PH.x - 70} y={PH.y - 150 + 30 * prog(t, CUT_E + 0.2, CUT_F)} r={20} s={pop(t, CUT_E + 0.2, 0.25)} />
            <SweatDrop x={PH.x + 280} y={PH.y - 170 + 30 * prog(t, CUT_E + 0.4, CUT_F)} r={20} s={pop(t, CUT_E + 0.4, 0.25)} />
          </>
        ) : null}
        {t < CUT_C ? <Txt x={PH.x - 165} y={PH.y - 250 - 10 * Math.sin(t * 5)} size={130} s={pop(t, CUT_B + 0.12, 0.3)} text="?" fill={TEXT_YEL} /> : null}
        {/* the sea cucumber peeks in at the end */}
        {t > 23.75 ? <CucPeek t={t} /> : null}
      </ScreenSvg>
      <Photo t={t} />
    </AbsoluteFill>
  );
};
const CucPeek: React.FC<{t: number}> = ({t}) => {
  const u = easeOutBack(prog(t, 23.75, 24.15), 1.6);
  const blink = Math.abs(t - 24.35) < 0.06;
  return (
    <g transform={`translate(${PH.x - 470 + 150 * u} ${PH.y + 380}) rotate(${-30 + 10 * u})`}>
      <ellipse cx={0} cy={0} rx={120} ry={62} fill="#C77BB0" stroke={INK} strokeWidth={8} />
      <ellipse cx={-20} cy={18} rx={80} ry={26} fill="#B4679C" />
      {[-60, -10, 40].map((x) => (
        <circle key={x} cx={x} cy={-38} r={10} fill="#D893C2" stroke={INK} strokeWidth={4} />
      ))}
      {blink ? (
        <>
          <line x1={46} y1={-6} x2={66} y2={-6} stroke={INK} strokeWidth={6} />
          <line x1={78} y1={-6} x2={98} y2={-6} stroke={INK} strokeWidth={6} />
        </>
      ) : (
        <>
          <circle cx={56} cy={-8} r={9} fill={INK} />
          <circle cx={88} cy={-8} r={9} fill={INK} />
        </>
      )}
    </g>
  );
};

// the instant photo: comes out of the bottom on "not one photo" - pure milky white
const Photo: React.FC<{t: number}> = ({t}) => {
  if (t < T.not - 0.1) return null;
  const u = easeOutBack(prog(t, T.not - 0.1, T.one + 0.15), 1.2);
  const y = lerp(2350, 1060, u);
  const rot = lerp(14, -5, u) + 1.5 * Math.sin(t * 2);
  return (
    <ScreenSvg>
      <g transform={`translate(540 ${y}) rotate(${rot})`}>
        <rect x={-300} y={-330} width={600} height={700} rx={14} fill="#FBFAF6" stroke={INK} strokeWidth={10} />
        <rect x={-260} y={-290} width={520} height={520} fill="#EDE8DD" stroke={INK} strokeWidth={6} />
        <PuffCluster
          puffs={[
            {x: -150, y: -160, r: 110},
            {x: 60, y: -60, r: 150},
            {x: 170, y: 120, r: 100},
            {x: -120, y: 130, r: 120},
          ]}
          fill="#F3EFE7"
          ink={0}
        />
        <text x={0} y={310} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={40} fill="#4A4A4A">
          BOTTOM OF THE WORLD
        </text>
      </g>
      <g transform={`translate(${540 + 230} ${y - 330}) rotate(12) scale(${pop(t, T.photo + 0.05, 0.25)})`}>
        <Txt x={0} y={0} size={96} text="?!" fill={TEXT_YEL} />
      </g>
    </ScreenSvg>
  );
};

// ---------- sound ----------
export const CUES: Cue[] = [
  {f: 'bubbles', at: 0.0, db: -24, keys: [[0, -30], [0.6, -24], [1.7, -27], [2.0, -40]]},
  {f: 'sonar', at: 0.35, db: -24},
  {f: 'bubbles', at: 2.0, db: -27, keys: [[2.0, -40], [2.3, -27], [3.6, -28], [4.0, -40]]},
  {f: 'pop', at: T.gasoline - 0.02, db: -20},
  {f: 'boing', at: T.why + 0.1, db: -26, rate: 1.2},
  {f: 'whoosh', at: T.lighter - 0.05, db: -27, rate: 0.8},
  {f: 'pop', at: T.and - 0.02, db: -22, rate: 0.9},
  {f: 'squeeze', at: T.air + 0.02, db: -16},
  {f: 'squeeze', at: T.barely - 0.18, db: -20, rate: 0.8},
  {f: 'boing', at: T.barely + 0.05, db: -27, rate: 0.7},
  {f: 'whoosh', at: T.but + 0.05, db: -22, rate: 0.7},
  {f: 'sonar', at: T.miles - 0.05, db: -20},
  {f: 'creak', at: T.down - 0.15, db: -19},
  {f: 'bang_crack', at: T.bang - 0.06, db: -7},
  {f: 'creak', at: T.steel - 0.2, db: -24, rate: 0.9},
  {f: 'crack', at: T.cracked - 0.02, db: -14},
  {f: 'gulp', at: T.keep - 0.03, db: -13},
  {f: 'bubbles', at: CUT_F, db: -28, keys: [[CUT_F, -40], [CUT_F + 0.2, -28], [16.6, -27], [17.0, -40]]},
  {f: 'ticks', at: T.after, db: -29, dur: T.land - T.after, keys: [[T.after, -32], [16.8, -27], [T.land - 0.05, -40]]},
  {f: 'whoosh', at: 16.35, db: -26, rate: 0.6},
  {f: 'mud_whoomp', at: T.land - 0.2, db: -10},
  {f: 'mud_whoomp', at: T.kicking - 0.15, db: -17, rate: 0.85},
  {f: 'bubbles', at: T.mud, db: -30, keys: [[T.mud, -30], [19.6, -32], [20.0, -45]]},
  {f: 'camera', at: T.world + 0.0, db: -11},
  {f: 'whoosh', at: T.not - 0.05, db: -24},
  {f: 'crickets', at: 23.78, db: -19},
  {f: 'pop', at: 23.95, db: -24, rate: 1.2},
];

// ======================================================================================================
export const SceneAt: React.FC<{t: number}> = ({t}) => {
  const shot = shotAt(t);
  return <AbsoluteFill>{shot === 'B' || shot === 'E' || shot === 'J' ? <Porthole t={t} /> : <WideScene t={t} />}</AbsoluteFill>;
};

export const CoverScene: React.FC = () => <WideScene t={1.0} coverMode />;

export const DeepDiveShort: React.FC = () => {
  useDDFont();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  return (
    <AbsoluteFill style={{background: NAVY}}>
      <SceneAt t={t} />
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('deep-dive/vo/take1_fit.wav')} volume={Math.pow(10, MIX_DB / 20)} />
      </Sequence>
      <Sequence from={Math.round(0.1 * FPS)} layout="none">
        <Audio src={staticFile('deep-dive/music/bed.wav')} volume={Math.pow(10, MIX_DB / 20)} />
      </Sequence>
      <SoundCues cues={CUES.map((c) => ({...c, db: c.db + MIX_DB, keys: c.keys?.map(([kt, kd]) => [kt, kd + MIX_DB] as [number, number])}))} dir="deep-dive/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};
