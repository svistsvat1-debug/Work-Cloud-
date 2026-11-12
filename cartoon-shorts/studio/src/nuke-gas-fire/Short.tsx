import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SPR} from './sprites';
import {BG_S, BLAST, CAM, CAM0, DURATION, FPS, PIPE_TOP, SLANT_ANG, T, VO_AT, W, WELL_S, WW, poseBox, type PoseName} from './scene';
import {along, camAt, clamp, easeInCubic, easeInOutCubic, easeOutBack, easeOutCubic, lerp, pop, prog, rnd, shake, spring, type Cam} from '../shared/anim';
import {World} from '../shared/World';
import {Eye} from '../shared/Face';
import {PuffCluster, type Puff} from '../shared/Puffs';
import {SweatDrop} from '../shared/SweatDrop';
import {SoundCues, type Cue} from '../shared/Sound';
import {useFont} from '../shared/useFont';

const F = (n: string) => staticFile(`nuke-gas-fire/${n}.png`);
export const FONT = 'NukeFireInter';
export const useNukeFont = () => useFont(FONT, staticFile('fonts/Inter-Black.otf'));

// flame palette = the channel's lava palette (memory/STYLE.md): flat, no outline
const FL_DEEP = '#E2501E';
const FL = '#FF6A2B';
const FL_HOT = '#FFA445';
const FL_CORE = '#FFC867';
const FL_WHITE = '#FFF1BF';
const GAS = '#E9F59A';
const STEEL = '#6E6F75';
const STEEL_IN = '#2B2A2E';
const SMOKE = '#6F6A68';
const WATER = '#8FD8FF';
const HOSE = '#3FAE49';
const MIX_DB = 3.0; // Remotion's mix peaks low (lessons): lift voice + effects together

type P = [number, number];

// ---------- sounds (all ElevenLabs: new for this video + reused from sfx-library) ----------
const CUES: Cue[] = [
  {f: 'gas_roar', at: 0, db: -27, dur: 5.32, keys: [[0, -27], [5.2, -26], [5.32, -40]]},
  {f: 'pop', at: T.almost, db: -24, rate: 1.4},
  {f: 'pop', at: T.three, db: -24, rate: 1.5},
  {f: 'pop', at: T.years, db: -23, rate: 1.6},
  {f: 'sizzle', at: 1.6, db: -31},
  {f: 'whoosh', at: T.soviets, db: -27},
  {f: 'boing', at: T.nuked, db: -22},
  {f: 'whoosh', at: T.yank + 0.02, db: -26},
  {f: 'whoosh', at: 4.86, db: -29, rate: 0.8},
  {f: 'stamp', at: T.plug, db: -15},
  {f: 'squeeze', at: T.plug + 0.03, db: -23},
  {f: 'gas_roar', at: 5.4, db: -42, dur: 7.1, keys: [[5.4, -44], [7.3, -36], [10.5, -33], [12.5, -31]]},
  {f: 'rumble', at: 6.6, db: -36, dur: 2.0, keys: [[6.6, -40], [7.6, -31], [8.6, -38]]},
  {f: 'gas_hiss', at: 6.3, db: -36, rate: 1.2},
  {f: 'gas_hiss', at: 7.25, db: -33, rate: 1.1},
  {f: 'whoosh', at: 7.55, db: -31, rate: 0.7},
  {f: 'pop', at: T.whole, db: -21},
  {f: 'gas_hiss', at: T.escaped, db: -29},
  {f: 'pop', at: T.nearby, db: -20, rate: 1.2},
  {f: 'gas_hiss', at: T.nearby, db: -27},
  {f: 'pop', at: T.wells, db: -20, rate: 1.3},
  {f: 'gas_hiss', at: T.wells, db: -27},
  {f: 'pop', at: T.pop, db: -12, rate: 0.75},
  {f: 'whoosh', at: T.pop + 0.02, db: -24},
  {f: 'gas_roar', at: T.pop, db: -27, dur: 7.0, keys: [[T.pop, -24], [13.6, -29], [14.6, -36], [17.2, -38], [19.6, -40]]},
  {f: 'winch', at: 13.3, db: -24},
  {f: 'winch', at: 14.3, db: -26},
  {f: 'winch', at: 15.4, db: -27},
  {f: 'boing', at: T.right + 0.04, db: -25, rate: 0.8},
  {f: 'pop', at: 16.05, db: -23},
  {f: 'boom_low', at: T.blast - 0.02, db: -8},
  {f: 'rumble', at: T.blast + 0.1, db: -22, dur: 2.0, keys: [[17.35, -20], [18.4, -27], [19.3, -34]]},
  {f: 'squeeze', at: T.squeezed, db: -21, rate: 0.8},
  {f: 'squeeze', at: T.pinched, db: -19, rate: 0.7},
  {f: 'rock_crack', at: T.shut - 0.02, db: -17},
  {f: 'hose_spray', at: T.like, db: -28, dur: 0.24},
  {f: 'stamp', at: 20.95, db: -15},
  {f: 'sputter', at: 20.98, db: -18},
  {f: 'gas_roar', at: T.like, db: -30, dur: 3.1, keys: [[T.like, -32], [22.3, -28], [23.3, -33], [23.76, -50]]},
  {f: 'ticks', at: 22.72, db: -25, dur: 0.85},
  {f: 'flame_out', at: T.seconds - 0.05, db: -14},
  {f: 'crickets', at: 24.0, db: -25},
];

// ---------- small helpers ----------
const smooth = (pts: P[], closed = true) => {
  const n = pts.length;
  const g = (i: number) => (closed ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)]);
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = g(i - 1);
    const p1 = g(i);
    const p2 = g(i + 1);
    const p3 = g(i + 2);
    const c1: P = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: P = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return closed ? d + ' Z' : d;
};
const bump = (t: number, t0: number, dur = 0.22) => Math.sin(Math.PI * prog(t, t0, t0 + dur));
const mix = (a: string, b: string, u: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i], clamp(u)))).join(',')})`;
};
const Svg: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={WW} height={4700}>
    {children}
  </svg>
);
// a sprite placed by its anchor (ax, ay in sprite px) at world (x, y), scaled s
const Spr: React.FC<{n: string; x: number; y: number; s: number; ax: number; ay: number; rot?: number; sx?: number; sy?: number; flip?: boolean; op?: number}> = ({
  n,
  x,
  y,
  s,
  ax,
  ay,
  rot = 0,
  sx = 1,
  sy = 1,
  flip = false,
  op = 1,
}) => {
  const sp = SPR[n as keyof typeof SPR] as {w: number; h: number};
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg) scale(${sx * (flip ? -1 : 1)}, ${sy})`, transformOrigin: '0 0', opacity: op}}>
      <Img src={F(n)} style={{position: 'absolute', left: -ax * s, top: -ay * s, width: sp.w * s, height: sp.h * s}} />
    </div>
  );
};

// ---------- the flame character ----------
type FaceState = {open: number; look: P; lid?: number; lidTilt?: number; squeeze?: boolean; brow?: number; browTilt?: number; mouth: 'grin' | 'o' | 'wobble' | 'smile' | 'none'; sweat?: number};

const flameProfile = (u: number) => Math.pow(u + 0.04, 0.5) * Math.pow(1 - u, 1.25) / 0.39;
// outline of one flame layer; wk / hk scale width / height of the layer
const flamePts = (x: number, y: number, H: number, w0: number, t: number, wk: number, hk: number, seed: number): P[] => {
  const N = 14;
  const Hl = H * hk * (1 + 0.035 * Math.sin(2 * Math.PI * 2.3 * t + seed));
  const left: P[] = [];
  const right: P[] = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const sway = H * (0.05 * Math.pow(u, 1.6) * Math.sin(2 * Math.PI * 0.9 * t - 3 * u + seed) + 0.018 * u * Math.sin(2 * Math.PI * 2.2 * t + seed * 2));
    const cx = x + sway;
    const yy = y - u * Hl;
    const hwBase = (w0 / 2) * Math.max(0, 1 - u * 4) + H * 0.16 * flameProfile(u);
    const rL = 1 + 0.07 * Math.sin(2 * Math.PI * 2.6 * t - 10 * u + seed) + 0.04 * Math.sin(2 * Math.PI * 4.1 * t - 17 * u + seed * 3);
    const rR = 1 + 0.07 * Math.sin(2 * Math.PI * 2.6 * t - 10 * u + seed + 1.7) + 0.04 * Math.sin(2 * Math.PI * 4.1 * t - 17 * u + seed * 3 + 2.3);
    if (i === N) {
      left.push([cx, yy]);
    } else {
      left.push([cx - hwBase * wk * rL, yy]);
      right.push([cx + hwBase * wk * rR, yy]);
    }
  }
  return [...left, ...right.reverse()];
};
const tonguePts = (x: number, y: number, H: number, t: number, side: number, seed: number): P[] => {
  // a small side tongue rooted on the flame body, leaning outward
  const N = 8;
  const L: P[] = [];
  const R: P[] = [];
  const h = H * (0.32 + 0.06 * Math.sin(2 * Math.PI * 1.7 * t + seed));
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const cx = x + side * (H * 0.05 * u + H * 0.03 * Math.sin(2 * Math.PI * 1.3 * t - 2 * u + seed) * u);
    const yy = y - u * h;
    const hw = H * 0.055 * Math.pow(1 - u, 0.9) * Math.pow(u + 0.15, 0.4);
    if (i === N) L.push([cx, yy]);
    else {
      L.push([cx - hw, yy]);
      R.push([cx + hw, yy]);
    }
  }
  return [...L, ...R.reverse()];
};

const FlameFace: React.FC<{x: number; y: number; H: number; f: FaceState}> = ({x, y, H, f}) => {
  const r = H * 0.036;
  const ey = y - H * 0.5;
  const dx = H * 0.062;
  const my = y - H * 0.405;
  const mw = H * 0.05;
  let mouth: React.ReactNode = null;
  const ink = r * 0.18;
  if (f.mouth === 'grin')
    mouth = (
      <g>
        <path d={`M ${x - mw} ${my - r * 0.15} Q ${x} ${my + r * 1.35} ${x + mw} ${my - r * 0.15} Z`} fill="#7A1A08" stroke="#000" strokeWidth={ink} strokeLinejoin="round" />
        <path d={`M ${x - mw * 0.45} ${my + r * 0.5} Q ${x} ${my + r * 0.95} ${x + mw * 0.45} ${my + r * 0.5}`} fill="none" stroke="#FC8D90" strokeWidth={r * 0.32} strokeLinecap="round" />
      </g>
    );
  if (f.mouth === 'smile') mouth = <path d={`M ${x - mw * 0.8} ${my} Q ${x} ${my + r * 0.9} ${x + mw * 0.8} ${my}`} fill="none" stroke="#000" strokeWidth={ink * 1.3} strokeLinecap="round" />;
  if (f.mouth === 'o') mouth = <ellipse cx={x} cy={my + r * 0.3} rx={r * 0.55} ry={r * 0.78} fill="#7A1A08" stroke="#000" strokeWidth={ink} />;
  if (f.mouth === 'wobble') {
    let d = `M ${x - mw * 0.8} ${my + r * 0.2}`;
    for (let i = 1; i <= 6; i++) d += ` L ${x - mw * 0.8 + (i * 1.6 * mw) / 6} ${my + r * 0.2 + (i % 2 ? -1 : 1) * r * 0.22}`;
    mouth = <path d={d} fill="none" stroke="#000" strokeWidth={ink * 1.3} strokeLinecap="round" strokeLinejoin="round" />;
  }
  return (
    <g>
      <Eye x={x - dx} y={ey} r={r} open={f.open} look={f.look} lid={f.lid} lidTilt={f.lidTilt} squeeze={f.squeeze} side={-1} brow={f.brow ?? 0.55} browTilt={f.browTilt ?? 0} />
      <Eye x={x + dx} y={ey} r={r} open={f.open} look={f.look} lid={f.lid} lidTilt={f.lidTilt} squeeze={f.squeeze} side={1} brow={f.brow ?? 0.55} browTilt={f.browTilt ?? 0} />
      {f.open > 0.5 ? mouth : null}
      {f.sweat ? <SweatDrop x={x + dx + r * 1.6} y={ey - r * 0.4} r={r * 0.45} s={f.sweat} /> : null}
    </g>
  );
};

const Flame: React.FC<{x: number; y: number; H: number; w0: number; t: number; seed: number; face?: FaceState; tongues?: boolean}> = ({x, y, H, w0, t, seed, face, tongues = true}) => {
  if (H < 4) return null;
  const outer = smooth(flamePts(x, y, H, w0, t, 1.08, 1.03, seed));
  const main = smooth(flamePts(x, y, H, w0, t, 1, 1, seed));
  const hot = smooth(flamePts(x, y + 4, H * 0.84, w0 * 0.7, t * 1.1, 0.72, 0.98, seed + 1.3));
  const core = smooth(flamePts(x, y + 4, H * 0.62, w0 * 0.5, t * 1.2, 0.5, 0.98, seed + 2.1));
  const white = smooth(flamePts(x, y + 4, H * 0.36, w0 * 0.3, t * 1.3, 0.3, 0.98, seed + 3.4));
  const ty = y - H * 0.16;
  const tw = H * 0.16 * flameProfile(0.16);
  return (
    <g>
      {tongues ? (
        <>
          <path d={smooth(tonguePts(x - tw * 0.8, ty, H, t, -1, seed + 0.5))} fill={FL_DEEP} />
          <path d={smooth(tonguePts(x + tw * 0.8, ty + H * 0.04, H * 0.9, t, 1, seed + 2.5))} fill={FL_DEEP} />
          <path d={smooth(tonguePts(x - tw * 0.8, ty, H * 0.94, t, -1, seed + 0.5))} fill={FL} />
          <path d={smooth(tonguePts(x + tw * 0.8, ty + H * 0.04, H * 0.85, t, 1, seed + 2.5))} fill={FL} />
        </>
      ) : null}
      <path d={outer} fill={FL_DEEP} />
      <path d={main} fill={FL} />
      <path d={hot} fill={FL_HOT} />
      <path d={core} fill={FL_CORE} />
      <path d={white} fill={FL_WHITE} />
      {face ? <FlameFace x={x + H * 0.05 * Math.pow(0.5, 1.6) * Math.sin(2 * Math.PI * 0.9 * t - 1.5 + seed)} y={y} H={H} f={face} /> : null}
    </g>
  );
};

// ---------- flame timeline ----------
const H0 = W.flameH;
const flameH = (t: number) => {
  const breathe = 1 + 0.02 * Math.sin(2 * Math.PI * 0.7 * t);
  if (t < T.plug - 0.02) return H0 * breathe;
  if (t < T.plug + 0.12) return H0 * (1 - easeInCubic(prog(t, T.plug - 0.02, T.plug + 0.12)));
  if (t < T.pop) return 0;
  if (t < T.fire2) return H0 * easeOutBack(prog(t, T.pop, T.pop + 0.35), 1.6) * breathe;
  if (t < T.dead) {
    const u = prog(t, T.fire2 + 0.05, T.dead);
    return H0 * Math.pow(1 - u, 1.5) * (1 + 0.04 * Math.sin(t * 40) * u) * breathe;
  }
  return 0;
};
const blinkLid = (t: number, at: number[]) => at.reduce((m, b) => Math.max(m, Math.sin(Math.PI * prog(t, b, b + 0.16))), 0);
const flameFace = (t: number): FaceState => {
  const blink = blinkLid(t, [1.45, 2.65, 9.0, 14.8, 21.6]);
  if (t < 3.62)
    return {open: 1, look: [0.5, 0.55], mouth: 'grin', lid: blink, brow: 0.5};
  if (t < 4.62) return {open: 1, look: [0.85, 0.35], mouth: 'o', brow: 0.75, browTilt: -0.8, sweat: pop(t, 3.95, 0.25)};
  if (t < T.plug) return {open: 1, look: [0, -0.9], mouth: 'o', brow: 0.8, browTilt: -0.6};
  if (t < T.pop) return {open: 1, look: [0, 0], squeeze: true, mouth: 'wobble'};
  if (t < 13.5) return {open: 1, look: [0.2, -0.3], mouth: 'grin', lid: 0.35, lidTilt: 18, brow: 0.3, browTilt: 0.8};
  if (t < T.fire2) return {open: 1, look: [-0.7, 0.35], mouth: 'grin', lid: blink, brow: 0.5};
  if (t < 23.05) return {open: 1, look: [0, 0.2], mouth: 'wobble', brow: 0.75, browTilt: -0.9, sweat: pop(t, 22.5, 0.2)};
  return {open: 1, look: [0, 0], squeeze: true, mouth: 'wobble'};
};

// ---------- the guy ----------
type GuyState = {pose: PoseName; fx: number; fy: number; sx: number; sy: number; rot: number};
const SWAPS: {t: number; pose: PoseName; fx: number}[] = [
  {t: 0, pose: 'roast', fx: W.guy.x},
  {t: T.nuked, pose: 'shock', fx: W.guy.x + 10},
  {t: T.plug - 0.03, pose: 'push', fx: 563},
  {t: 6.62, pose: 'hero', fx: 545},
  {t: T.nearby, pose: 'shock', fx: 545},
  {t: 13.0, pose: 'hero', fx: 545},
  {t: T.like, pose: 'step', fx: W.guy.x},
  {t: 22.48, pose: 'sad', fx: W.guy.x},
];
const guyAt = (t: number, tr: number): GuyState => {
  let i = 0;
  while (i + 1 < SWAPS.length && t >= SWAPS[i + 1].t) i++;
  const s = SWAPS[i];
  const next = SWAPS[i + 1];
  let sx = 1;
  let sy = 1 + 0.009 * Math.sin(2 * Math.PI * 0.6 * tr); // breathing (real time, so the loop frames still move)
  // anticipation before the next swap, stretch + damped spring after this one (hidden by the swap)
  if (next && t > next.t - 0.07) {
    const u = prog(t, next.t - 0.07, next.t);
    sy *= 1 - 0.07 * u;
    sx *= 1 + 0.05 * u;
  }
  if (i > 0 && s.t !== T.like) {
    const sp = spring(t - s.t, 3.2, 5.5);
    sy *= 1 + 0.05 * sp;
    sx *= 1 - 0.035 * sp;
  }
  let fy = W.guy.y;
  if (s.pose === 'shock') fy -= 70 * Math.sin(Math.PI * prog(t, s.t, s.t + 0.32)) + 6 * Math.abs(Math.sin(2 * Math.PI * 2.6 * t)) * prog(t, s.t + 0.3, s.t + 0.55);
  let rot = 0;
  if (s.pose === 'push') rot = 2.5 * Math.sin(2 * Math.PI * 4 * t);
  if (s.pose === 'step') {
    // hop up, stamp down on "stepping", smug bounce on "hose"
    fy -= 46 * Math.sin(Math.PI * prog(t, T.like, 20.95));
    const land = spring(t - 20.95, 3.5, 6) * (t >= 20.95 ? 1 : 0);
    sy *= 1 - 0.07 * land;
    sx *= 1 + 0.05 * land;
    sy *= 1 + 0.03 * bump(t, T.hose, 0.3);
  }
  if (s.pose === 'sad' && t > 23.8) sy *= 1 - 0.015 * Math.sin(Math.PI * prog(t, 23.85, 24.4)); // a small sigh
  return {pose: s.pose, fx: s.fx, fy, sx, sy, rot};
};
const guyPoint = (g: GuyState, px: number, py: number): P => {
  const b = poseBox(g.pose, g.fx, g.fy, W.hr);
  const s = SPR[g.pose] as {feet: readonly number[]};
  const dx = (px - s.feet[0]) * b.k * g.sx;
  const dy = (py - s.feet[1]) * b.k * g.sy;
  const r = (g.rot * Math.PI) / 180;
  return [g.fx + dx * Math.cos(r) - dy * Math.sin(r), g.fy + dx * Math.sin(r) + dy * Math.cos(r)];
};
const Guy: React.FC<{g: GuyState}> = ({g}) => {
  const b = poseBox(g.pose, g.fx, g.fy, W.hr);
  const s = SPR[g.pose] as {feet: readonly number[]};
  const air = W.guy.y - g.fy;
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: g.fx - 120 + air * 0.2,
          top: W.guy.y - 16,
          width: 240 - air * 0.4,
          height: 34,
          borderRadius: '50%',
          background: 'rgba(72, 54, 42, 0.26)',
          filter: 'blur(3px)',
        }}
      />
      <div style={{position: 'absolute', left: g.fx, top: g.fy, transform: `rotate(${g.rot}deg) scale(${g.sx}, ${g.sy})`, transformOrigin: '0 0'}}>
        <Img src={F(g.pose)} style={{position: 'absolute', left: -s.feet[0] * b.k, top: -s.feet[1] * b.k, width: b.width, height: b.height}} />
      </div>
    </>
  );
};

// marshmallow on the stick tip: toasts while the fire burns, raw again at the end
const Marshmallow: React.FC<{at: P; ang: number; toast: number}> = ({at, ang, toast}) => {
  const c = toast < 0.33 ? mix('#FFFDF6', '#F2C27A', toast / 0.33) : toast < 0.66 ? mix('#F2C27A', '#A0602E', (toast - 0.33) / 0.33) : mix('#A0602E', '#2A1E1A', (toast - 0.66) / 0.34);
  return (
    <g transform={`translate(${at[0]} ${at[1]}) rotate(${ang})`}>
      <rect x={-8} y={-27} width={62} height={54} rx={18} fill={c} stroke="#000" strokeWidth={6} />
      <ellipse cx={14} cy={-12} rx={12} ry={6} fill="#fff" opacity={0.55 * (1 - toast)} />
    </g>
  );
};

// ---------- bomb ----------
const BS = 125 / SPR.nuke.body[2]; // world units per bomb pixel (body 125 units wide)
const bombState = (t: number): {x: number; y: number; rot: number; vis: boolean; phase: 'teaser' | 'drop' | 'slant' | 'gone'} => {
  // teaser: lowered next to the fire on "nuked", yanked back up in the pause
  if (t < T.why) {
    const x = 1235;
    if (t < T.soviets) return {x, y: -600, rot: 0, vis: false, phase: 'teaser'};
    let y = lerp(-420, 1420, easeOutCubic(prog(t, T.soviets, T.nuked)));
    y += 26 * spring(t - T.nuked, 3, 4) * (t > T.nuked ? 1 : 0);
    y -= 2200 * easeInCubic(prog(t, T.yank, T.yank + 0.42));
    return {x, y, rot: 2 * Math.sin(2 * Math.PI * 1.4 * t), vis: y > -500, phase: 'teaser'};
  }
  if (t < 13.25) return {x: 0, y: 0, rot: 0, vis: false, phase: 'gone'};
  const ex = W.slant.x0;
  const ang = (SLANT_ANG * 180) / Math.PI;
  if (t < 14.15) {
    const y = lerp(1150, W.G + 60, easeInOutCubic(prog(t, 13.25, 14.15)));
    const r = ang * easeInOutCubic(prog(t, 13.95, 14.25));
    return {x: ex - Math.tan(SLANT_ANG) * Math.max(0, y - W.G), y, rot: r, vis: true, phase: 'drop'};
  }
  if (t < T.blast) {
    const L = Math.hypot(W.slant.x0 - W.slant.x1, W.slant.y1 - W.G);
    const u0 = 60 / Math.cos(SLANT_ANG) / L;
    let u = lerp(u0, 1, easeInOutCubic(prog(t, 14.15, T.right)));
    u += (14 / L) * spring(t - T.right, 3, 5) * (t > T.right ? 1 : 0);
    const tremble = t > 16.6 ? 2.2 * Math.sin(2 * Math.PI * 9 * t) : 0;
    return {x: lerp(W.slant.x0, W.slant.x1, u) + tremble, y: lerp(W.G, W.slant.y1, u), rot: ang * easeInOutCubic(prog(t, 13.95, 14.25)), vis: true, phase: 'slant'};
  }
  return {x: 0, y: 0, rot: 0, vis: false, phase: 'gone'};
};
const Bomb: React.FC<{t: number}> = ({t}) => {
  const b = bombState(t);
  if (!b.vis) return null;
  const n = SPR.nuke;
  const ringDy = (n.ring[1] - n.body[1]) * BS; // ring above the body centre (negative)
  const rr = (b.rot * Math.PI) / 180;
  const ring: P = [b.x - ringDy * Math.sin(rr), b.y + ringDy * Math.cos(rr)]; // (0, ringDy) rotated clockwise by rot
  // cable: straight up in the teaser / drop; in the slant it runs back up the hole to the entry, then up
  const cable: P[] = [ring];
  if (b.phase === 'slant') cable.push([W.slant.x0, W.G]);
  cable.push([cable[cable.length - 1][0], -1500]);
  const eyesOpen = b.phase === 'teaser' ? pop(t, T.nuked + 0.05, 0.25) : pop(t, T.nuke, 0.25);
  let look: P = [0, 0.3];
  if (b.phase === 'teaser') look = [-0.9, 0.1];
  else if (t > T.well2 - 0.05) look = [-0.95, 0.1];
  else if (t > T.mile) look = [0, 0.9];
  const squeeze = b.phase === 'slant' && t > 17.08;
  const sweat = b.phase === 'slant' ? pop(t, 16.62, 0.22) : 0;
  const ey = (480 - n.body[1]) * BS;
  const er = 24;
  return (
    <>
      <Svg>
        <path d={cable.map((p, i) => `${i ? 'L' : 'M'} ${p[0]} ${p[1]}`).join(' ')} fill="none" stroke="#000" strokeWidth={11} strokeLinejoin="round" />
        <path d={cable.map((p, i) => `${i ? 'L' : 'M'} ${p[0]} ${p[1]}`).join(' ')} fill="none" stroke="#9A9AA2" strokeWidth={5} strokeLinejoin="round" />
      </Svg>
      <Spr n="nuke" x={b.x} y={b.y} s={BS} ax={n.body[0]} ay={n.body[1]} rot={b.rot} />
      <Svg>
        <g transform={`translate(${b.x} ${b.y}) rotate(${b.rot})`}>
          <Eye x={-33} y={ey} r={er} open={eyesOpen} look={look} squeeze={squeeze} side={-1} brow={0.6} browTilt={b.phase === 'slant' && t > 16.5 ? -0.9 : 0} />
          <Eye x={33} y={ey} r={er} open={eyesOpen} look={look} squeeze={squeeze} side={1} brow={0.6} browTilt={b.phase === 'slant' && t > 16.5 ? -0.9 : 0} />
          <SweatDrop x={64} y={ey - 12} r={11} s={sweat} />
        </g>
      </Svg>
    </>
  );
};

// ---------- gas blobs ----------
const VG = 520; // gas speed in the pipe (world units / s)
const DT = 0.13;
const PY = BLAST.y;
const pinchAt = (t: number) => easeInOutCubic(prog(t, T.squeezed, T.shut));
const T_CLOSED = 20.0;
const Y0 = W.pipeBottom - 24;
type Blob = {x: number; y: number; r: number};
const gasBlobs = (t: number): {main: Blob[]; leak: Blob[]} => {
  const main: Blob[] = [];
  const leak: Blob[] = [];
  const iNow = Math.floor(t / DT);
  const iFirst = Math.floor((t - (Y0 - W.G) / VG) / DT) - 2;
  const i0 = Math.ceil((T_CLOSED - (Y0 - PY) / VG) / DT); // first blob that meets the closed pinch
  const left: P[] = [
    [W.wellX - 30, W.leakY],
    [760, W.leakY - 30],
    [520, W.leakY + 26],
    [W.valves[0].x + 40, W.leakY - 8],
    [W.valves[0].x, W.leakY - 40],
    [W.valves[0].x, W.G - 10],
  ];
  const right: P[] = [
    [W.wellX + 30, W.leakY],
    [1130, W.leakY + 24],
    [W.valves[1].x - 40, W.leakY - 10],
    [W.valves[1].x, W.leakY - 40],
    [W.valves[1].x, W.G - 10],
  ];
  for (let i = iFirst; i <= iNow; i++) {
    const s = i * DT;
    const r = 15 + 6 * rnd(i * 1.7);
    let y = Y0 - VG * (t - s);
    const x = W.wellX + 7 * Math.sin(i * 1.3 + t * 5);
    // stopped under the closed pinch: they stack up below it
    if (i >= i0) {
      const stop = PY + 30 + 34 * (i - i0);
      if (stop > Y0 - 10) continue;
      y = Math.max(y, stop);
    }
    const tl = s + (Y0 - W.leakY) / VG; // when it passes the leak depth
    const diverts = tl > T.escaped - 0.3 && tl < 13.0;
    if (diverts && t > tl) {
      const path = i % 2 === 0 ? left : right;
      const L = path.reduce((a, p, k) => (k ? a + Math.hypot(p[0] - path[k - 1][0], p[1] - path[k - 1][1]) : 0), 0);
      const u = ((t - tl) * 640) / L;
      if (u >= 1) continue;
      const [px, py] = along(path, u);
      leak.push({x: px, y: py, r: r * 1.15});
      continue;
    }
    if (y < W.G - 10) continue;
    main.push({x, y, r});
  }
  return {main, leak};
};
const BlobsSvg: React.FC<{blobs: Blob[]}> = ({blobs}) => (
  <g>
    {blobs.map((b, i) => (
      <circle key={`o${i}`} cx={b.x} cy={b.y} r={b.r + 4} fill="#000" />
    ))}
    {blobs.map((b, i) => (
      <circle key={`f${i}`} cx={b.x} cy={b.y} r={b.r} fill={GAS} />
    ))}
    {blobs.map((b, i) => (
      <circle key={`g${i}`} cx={b.x - b.r * 0.3} cy={b.y - b.r * 0.35} r={b.r * 0.28} fill="#fff" />
    ))}
  </g>
);

// main pipe with the pinch: walls bend in around PY
const PipeMain: React.FC<{t: number; blobs: Blob[]}> = ({t, blobs}) => {
  const P = pinchAt(t);
  const cx = W.wellX;
  const half = W.pipeW / 2;
  const wall = 14;
  const N = 60;
  const ys: number[] = [];
  for (let i = 0; i <= N; i++) ys.push(lerp(PY - 320, PY + 320, i / N));
  const d = (y: number) => P * 34 * Math.exp(-Math.pow((y - PY) / 115, 2));
  const outerL: P[] = [[cx - half, W.G - 6], ...ys.map((y) => [cx - half + d(y), y] as P), [cx - half, W.pipeBottom]];
  const outerR: P[] = [[cx + half, W.pipeBottom], ...ys.slice().reverse().map((y) => [cx + half - d(y), y] as P), [cx + half, W.G - 6]];
  const outer = [...outerL, ...outerR];
  const inL: P[] = [[cx - half + wall, W.G - 6], ...ys.map((y) => [Math.min(cx - 0.5, cx - half + wall + d(y)), y] as P), [cx - half + wall, W.pipeBottom + 30]];
  const inR: P[] = [[cx + half - wall, W.pipeBottom + 30], ...ys.slice().reverse().map((y) => [Math.max(cx + 0.5, cx + half - wall - d(y)), y] as P), [cx + half - wall, W.G - 6]];
  const inner = [...inL, ...inR];
  const poly = (pts: P[]) => 'M ' + pts.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L ') + ' Z';
  return (
    <g>
      <defs>
        <clipPath id="pipein">
          <path d={poly(inner)} />
        </clipPath>
      </defs>
      <path d={poly(outer)} fill={STEEL} stroke="#000" strokeWidth={8} strokeLinejoin="round" />
      <path d={poly(inner)} fill={STEEL_IN} />
      <g clipPath="url(#pipein)">
        <BlobsSvg blobs={blobs} />
      </g>
      {/* open, torn bottom end in the gas rock */}
      <path d={`M ${cx - half - 4} ${W.pipeBottom} l 14 22 l 12 -16 l 14 20 l 12 -18 l 14 22 l 12 -14`} fill="none" stroke="#000" strokeWidth={6} strokeLinejoin="round" />
    </g>
  );
};
const PipeSmall: React.FC<{x: number; y0: number; y1: number}> = ({x, y0, y1}) => (
  <g>
    <rect x={x - 23} y={y0} width={46} height={y1 - y0} fill={STEEL} stroke="#000" strokeWidth={7} />
    <rect x={x - 13} y={y0} width={26} height={y1 - y0 - 4} fill={STEEL_IN} />
  </g>
);

// gas seeping up through the porous gas rock toward the pipe bottom
const seep = (t: number): Blob[] =>
  Array.from({length: 14}, (_, i) => {
    const ph = (t * 0.45 + rnd(i * 3.3)) % 1;
    const life = Math.sin(Math.PI * ph);
    const sx = W.wellX + (rnd(i * 5.1) - 0.5) * 900;
    return {x: lerp(sx, W.wellX, ph * 0.9), y: lerp(W.pipeBottom + 160 + 60 * rnd(i), W.pipeBottom + 30, ph), r: 13 * life};
  }).filter((b) => b.r > 1);

// ---------- blast ----------
const Blast: React.FC<{t: number}> = ({t}) => {
  if (t < T.blast) return null;
  const {x, y} = BLAST;
  const fl = prog(t, T.blast, T.blast + 0.14);
  const flashR = t < T.blast + 0.14 ? 620 * easeOutCubic(fl) : 620 * (1 - easeInCubic(prog(t, T.blast + 0.14, T.blast + 0.55)));
  const cavC = t < 18.3 ? mix('#FFC867', '#FF6A2B', prog(t, 17.4, 18.3)) : t < 20.4 ? mix('#FF6A2B', '#8E3420', prog(t, 18.3, 20.4)) : mix('#8E3420', '#4A2A22', prog(t, 20.4, 22));
  const cavR = 112 * easeOutBack(prog(t, T.blast, T.blast + 0.3), 2) * (1 - 0.12 * pinchAt(t));
  const rings = [T.blast, T.blast + 0.16, T.blast + 0.32].map((t0, i) => {
    const u = prog(t, t0, t0 + 0.9);
    return u > 0 && u < 1 ? <circle key={i} cx={x} cy={y} r={120 + 820 * easeOutCubic(u)} fill="none" stroke="#000" strokeWidth={16 * (1 - u)} opacity={0.85} /> : null;
  });
  const cracks = Array.from({length: 9}, (_, i) => {
    const a = (i / 9) * Math.PI * 2 + 0.3;
    const L = 170 + 120 * rnd(i * 2.3);
    const u = easeOutCubic(prog(t, T.blast + 0.05, T.blast + 0.45));
    const pts: P[] = [];
    for (let k = 0; k <= 4; k++) {
      const rr = 100 + (L * k) / 4;
      const j = (k % 2 ? 1 : -1) * 16 * rnd(i * 7 + k);
      pts.push([x + Math.cos(a) * rr - Math.sin(a) * j, y + Math.sin(a) * rr + Math.cos(a) * j]);
    }
    const d = 'M ' + pts.map((p) => `${p[0]} ${p[1]}`).join(' L ');
    return <path key={i} d={d} fill="none" stroke="#000" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${u} 2`} />;
  });
  // squeeze marks pressing the pipe on "squeezed" and "pinched"
  const marks = [T.squeezed, T.pinched].map((t0, j) => {
    const s = pop(t, t0, 0.2) * (1 - prog(t, t0 + 0.9, t0 + 1.1));
    if (s <= 0.01) return null;
    const push = 26 * easeOutCubic(prog(t, t0, t0 + 0.5));
    return (
      <g key={j}>
        {[-1].map((side) =>
          [-70, 0, 70].map((dy) => (
            <line
              key={`${side}${dy}`}
              x1={W.wellX + side * (150 - push)}
              y1={PY + dy}
              x2={W.wellX + side * (95 - push)}
              y2={PY + dy * 0.6}
              stroke="#000"
              strokeWidth={12 * s}
              strokeLinecap="round"
            />
          )),
        )}
      </g>
    );
  });
  return (
    <g>
      {cracks}
      <circle cx={x} cy={y} r={cavR + 70} fill={FL} opacity={0.25 * (1 - prog(t, 18.5, 21))} />
      <circle cx={x} cy={y} r={cavR} fill={cavC} stroke="#000" strokeWidth={7} />
      <circle cx={x - cavR * 0.12} cy={y + cavR * 0.1} r={cavR * 0.55 * (1 - prog(t, 18.0, 21.0))} fill={FL_CORE} opacity={0.9} />
      <circle cx={x - cavR * 0.2} cy={y + cavR * 0.15} r={cavR * 0.25 * (1 - prog(t, 17.8, 20.0))} fill={FL_WHITE} />
      {rings}
      {marks}
      {flashR > 1 ? (
        <g>
          <circle cx={x} cy={y} r={flashR} fill={FL_CORE} opacity={0.9} />
          <circle cx={x} cy={y} r={flashR * 0.7} fill={FL_WHITE} />
        </g>
      ) : null}
    </g>
  );
};

// ---------- year tag (screen) ----------
const YEARS = [
  {t: 0, y: '1963'},
  {t: T.almost, y: '1964'},
  {t: T.three, y: '1965'},
  {t: T.years, y: '1966'},
];
const YearTag: React.FC<{t: number}> = ({t}) => {
  const s = 1 - easeInCubic(prog(t, 4.35, 4.62));
  if (s <= 0.01) return null;
  let i = 0;
  while (i + 1 < YEARS.length && t >= YEARS[i + 1].t) i++;
  const flip = YEARS.slice(1).reduce((m, e) => Math.max(m, Math.abs(Math.sin(Math.PI * prog(t, e.t - 0.06, e.t + 0.06)))), 0);
  return (
    <div
      style={{
        position: 'absolute',
        left: 50,
        top: 110,
        fontFamily: FONT,
        fontSize: 132,
        color: '#FFFFFF',
        WebkitTextStroke: '20px #000',
        paintOrder: 'stroke fill',
        transform: `rotate(-5deg) scale(${s}, ${s * (1 - 0.95 * flip)})`,
        transformOrigin: '160px 70px',
      }}
    >
      {YEARS[i].y}
    </div>
  );
};

// ---------- hose ----------
const HOSE_PTS: P[] = [
  [250, 2092],
  [410, 2062],
  [590, 1996],
  [700, 2040],
  [800, 2056],
];
const Hose: React.FC<{t: number}> = ({t}) => {
  const d = smooth(HOSE_PTS, false);
  const nz: P = [812, 2052];
  const w = t >= T.like - 0.3 && t < 21.15 ? 22 * (1 - prog(t, 20.97, 21.15)) : 0; // spraying until the stamp
  const end: P = [912, 1985];
  const ctrl: P = [862, 1500];
  const drops = t > 20.98 && t < 21.7 ? [0, 1, 2].map((k) => {
    const tt = t - 21.0 - k * 0.15;
    if (tt < 0 || tt > 0.4) return null;
    return <circle key={k} cx={nz[0] + 20 + tt * 60} cy={nz[1] - 10 + 300 * tt * tt} r={8} fill={WATER} stroke="#000" strokeWidth={4} />;
  }) : null;
  return (
    <g>
      <path d={d} fill="none" stroke="#000" strokeWidth={30} strokeLinecap="round" />
      <path d={d} fill="none" stroke={HOSE} strokeWidth={19} strokeLinecap="round" />
      <path d={d} fill="none" stroke="#7FD488" strokeWidth={5} strokeLinecap="round" transform="translate(-2 -5)" />
      <rect x={nz[0] - 16} y={nz[1] - 13} width={44} height={26} rx={6} fill="#C9C9CF" stroke="#000" strokeWidth={6} transform={`rotate(-28 ${nz[0]} ${nz[1]})`} />
      {w > 0.5 ? (
        <g fill="none" strokeLinecap="round">
          <path d={`M ${nz[0] + 24} ${nz[1] - 14} Q ${ctrl[0]} ${ctrl[1]} ${end[0]} ${end[1]}`} stroke="#000" strokeWidth={w + 10} />
          <path d={`M ${nz[0] + 24} ${nz[1] - 14} Q ${ctrl[0]} ${ctrl[1]} ${end[0]} ${end[1]}`} stroke={WATER} strokeWidth={w} />
          <path d={`M ${nz[0] + 24} ${nz[1] - 14} Q ${ctrl[0]} ${ctrl[1]} ${end[0]} ${end[1]}`} stroke="#fff" strokeWidth={w * 0.3} strokeDasharray={`${w * 1.6} ${w * 1.4}`} strokeDashoffset={-t * w * 20} />
        </g>
      ) : null}
      {drops}
    </g>
  );
};

// ---------- screen overlays ----------
const CityBadge: React.FC<{t: number}> = ({t}) => {
  const s = pop(t, T.whole, 0.3) * (1 - easeInCubic(prog(t, 10.5, 10.75)));
  if (s <= 0.01) return null;
  const lit = prog(t, T.city, T.city + 0.4);
  const bld = [
    [20, 70, 46],
    [74, 30, 52],
    [134, 90, 40],
    [182, 50, 50],
    [240, 80, 42],
  ];
  return (
    <div style={{position: 'absolute', left: 300 - 190, top: 1300 - 150, width: 380, height: 300, transform: `scale(${1.25 * s}) rotate(-4deg)`, transformOrigin: '190px 150px'}}>
      <svg width={380} height={300} style={{overflow: 'visible'}}>
        <rect x={6} y={6} width={368} height={288} rx={34} fill="#FFFDF6" stroke="#000" strokeWidth={10} />
        <g transform="translate(46 30)">
          {bld.map(([x, y, w], i) => (
            <g key={i}>
              <rect x={x} y={y} width={w} height={150 - y} fill="#2E3A59" stroke="#000" strokeWidth={6} />
              {[0, 1, 2, 3].map((r) =>
                [0, 1].map((c) => (y + 14 + r * 28 < 140 ? <rect key={`${r}${c}`} x={x + 9 + c * (w / 2 - 4)} y={y + 14 + r * 28} width={10} height={12} fill={rnd(i * 9 + r * 3 + c) < lit ? '#FFD54F' : '#4A587A'} /> : null)),
              )}
            </g>
          ))}
          <line x1={-10} y1={150} x2={300} y2={150} stroke="#000" strokeWidth={8} strokeLinecap="round" />
        </g>
        <text x={190} y={238} textAnchor="middle" fontFamily={FONT} fontSize={58} fill="#000">
          1 CITY
        </text>
        <text x={190} y={278} textAnchor="middle" fontFamily={FONT} fontSize={30} fill="#7A3B12" opacity={pop(t, T.every, 0.2)}>
          EVERY DAY
        </text>
      </svg>
    </div>
  );
};
const Stopwatch: React.FC<{t: number}> = ({t}) => {
  const s = 1.3 * pop(t, T.out, 0.3) * (1 - easeInCubic(prog(t, 24.3, 24.6))) * (1 + 0.08 * bump(t, T.seconds, 0.25));
  if (s <= 0.01) return null;
  const n = Math.round(23 * easeInOutCubic(prog(t, 22.75, 23.5)));
  const a = (n / 60) * 360;
  return (
    <div style={{position: 'absolute', left: 250 - 150, top: 380 - 170, width: 300, height: 340, transform: `scale(${s}) rotate(-6deg)`, transformOrigin: '150px 190px'}}>
      <svg width={300} height={340} style={{overflow: 'visible'}}>
        <rect x={128} y={10} width={44} height={36} rx={8} fill="#D33" stroke="#000" strokeWidth={8} />
        <circle cx={150} cy={190} r={132} fill="#FFFDF6" stroke="#000" strokeWidth={12} />
        {Array.from({length: 12}, (_, i) => {
          const aa = (i / 12) * Math.PI * 2;
          return <line key={i} x1={150 + Math.sin(aa) * 104} y1={190 - Math.cos(aa) * 104} x2={150 + Math.sin(aa) * 120} y2={190 - Math.cos(aa) * 120} stroke="#000" strokeWidth={i % 3 ? 5 : 9} strokeLinecap="round" />;
        })}
        <path d={`M 150 190 L 150 72 A 118 118 0 ${a > 180 ? 1 : 0} 1 ${150 + Math.sin((a * Math.PI) / 180) * 118} ${190 - Math.cos((a * Math.PI) / 180) * 118} Z`} fill="#FFB347" opacity={0.55} />
        <line x1={150} y1={190} x2={150 + Math.sin((a * Math.PI) / 180) * 100} y2={190 - Math.cos((a * Math.PI) / 180) * 100} stroke="#000" strokeWidth={10} strokeLinecap="round" />
        <circle cx={150} cy={190} r={14} fill="#000" />
        <text x={102} y={256} textAnchor="middle" fontFamily={FONT} fontSize={50} fill="#000">
          {n} s
        </text>
      </svg>
    </div>
  );
};

// ---------- the whole scene for one time t ----------
export const Scene: React.FC<{t: number; tr: number; cam: Cam; sh?: P; cover?: boolean}> = ({t, tr, cam, sh = [0, 0], cover = false}) => {
  const H = flameH(t);
  const g = guyAt(t, tr);
  const {main, leak} = gasBlobs(t);
  const corkLand = PIPE_TOP + 40; // cork bottom sits 40 units inside the torn pipe
  const CS = 0.42;
  const cork = SPR.cork;
  // cork: falls on "plug", trembles while the gas pushes, pops off in the pause after "wells"
  let corkY = -9999;
  let corkRot = 0;
  if (t >= 4.86 && t < T.pop + 1.2) {
    if (t < T.plug) corkY = lerp(PIPE_TOP - 1150, corkLand, Math.pow(prog(t, 4.86, T.plug), 2));
    else if (t < T.pop) {
      const amp = lerp(0.4, 3.5, prog(t, 6.4, T.pop));
      corkY = corkLand - 4 * amp * Math.abs(Math.sin(2 * Math.PI * 7 * t)) + 10 * spring(t - T.plug, 4, 7);
      corkRot = amp * Math.sin(2 * Math.PI * 11 * t);
    } else {
      const tau = t - T.pop;
      corkY = corkLand - (2600 * tau - 0.5 * 2000 * tau * tau);
      corkRot = 420 * tau;
    }
  }
  const valveFlame = (t0: number) => {
    const h = 260 * easeOutBack(prog(t, t0, t0 + 0.3), 1.8) * (1 - easeInCubic(prog(t, 12.95, 13.4)));
    return h;
  };
  const roastTip = g.pose === 'roast' ? guyPoint(g, SPR.roast.tip[0], SPR.roast.tip[1]) : null;
  const sadTip = g.pose === 'sad' ? guyPoint(g, SPR.sad.tip[0], SPR.sad.tip[1]) : null;
  const toast = clamp(t / 2.6);
  const smokeT = t - T.dead;
  const backBlur = t >= T.like && t < 23.2 ? 3 * (1 - prog(t, 22.3, 23.0)) : 0;
  const glowO = 0.42 * clamp(H / H0);
  const showCut = !cover;
  const smoke: Puff[] =
    smokeT > 0 && smokeT < 1.0
      ? [0, 1, 2, 3, 4].map((i) => {
          const a = smokeT / 1.0;
          const gr = a < 0.4 ? easeOutCubic(a / 0.4) : 1 - easeInCubic((a - 0.4) / 0.6);
          return {x: W.wellX + (i - 2) * 34 + 20 * Math.sin(i * 2 + smokeT * 3), y: PIPE_TOP - 40 - a * 160 - 25 * rnd(i), r: (38 + 16 * rnd(i * 3)) * gr};
        })
      : [];
  const ringU = clamp((t - T.dead - 0.15) / 1.0);
  const corkPuffs: Puff[] = [];
  if (t > 6.2 && t < T.pop) {
    const press = prog(t, 6.2, T.pop);
    for (let i = Math.floor((t - 0.7 - 6.2) / 0.16); i <= Math.floor((t - 6.2) / 0.16); i++) {
      const b = 6.2 + i * 0.16;
      const a = (t - b) / 0.7;
      if (a < 0 || a >= 1 || b < 6.2) continue;
      const side = i % 2 ? 1 : -1;
      const gr = a < 0.35 ? easeOutCubic(a / 0.35) : 1 - easeInCubic((a - 0.35) / 0.65);
      corkPuffs.push({x: W.wellX + side * (48 + 110 * a * (0.7 + 0.6 * rnd(i))), y: corkY - 14 - 90 * a * (0.5 + rnd(i * 3)), r: (17 + 20 * press) * gr * (0.8 + 0.4 * rnd(i * 5))});
    }
  }
  const off = {x: sh[0], y: sh[1]};
  return (
    <AbsoluteFill style={{backgroundColor: SPR.bg_desert.sky}}>
      {/* back layer: plate, glow, far props, derrick, the flame, the well (blurred during the hose close-up) */}
      <World cam={cam} off={off} blur={backBlur}>
        <Img src={F('bg_desert')} style={{position: 'absolute', left: 0, top: 0, width: 1024 * BG_S, height: 1536 * BG_S}} />
        <Svg>
          <defs>
            <radialGradient id="glow">
              <stop offset="0%" stopColor="#FFC867" stopOpacity={1} />
              <stop offset="100%" stopColor="#FFC867" stopOpacity={0} />
            </radialGradient>
          </defs>
          <ellipse cx={W.wellX} cy={PIPE_TOP - H * 0.35} rx={H * 0.75 + 60} ry={H * 0.85 + 60} fill="url(#glow)" opacity={glowO} />
          <ellipse cx={W.wellX} cy={W.wellBase - 20} rx={520} ry={120} fill="url(#glow)" opacity={glowO * 1.2} />
        </Svg>
        {(cover ? [] : W.valves).map((v, k) => (
          <React.Fragment key={k}>
            <Svg>
              <Flame x={v.x} y={v.base - (SPR.valve1.base - SPR.valve1.top) * v.s + 18} H={valveFlame(k ? T.wells : T.nearby)} w0={34} t={t} seed={3 + k * 2} tongues={false}
                face={{open: pop(t, (k ? T.wells : T.nearby) + 0.1, 0.25), look: [k ? -0.6 : 0.6, 0.2], mouth: 'grin', brow: 0.5}} />
            </Svg>
            <Spr n={k ? 'valve2' : 'valve1'} x={v.x} y={v.base} s={v.s} ax={SPR.valve1.body[0]} ay={SPR.valve1.base} />
          </React.Fragment>
        ))}
        <Spr n="derrick" x={W.derrick.x} y={W.derrick.base} s={W.derrick.s} ax={SPR.derrick.w} ay={SPR.derrick.base} flip />
        <Svg>
          <Flame x={W.wellX} y={PIPE_TOP + 30} H={H} w0={W.pipeW * 0.9} t={t} seed={0.7} face={H > 60 ? flameFace(t) : undefined} />
        </Svg>
        <Spr n="well" x={W.wellX} y={W.wellBase} s={WELL_S} ax={SPR.well.pipe[0]} ay={SPR.well.base} />
        {corkY > -9000 ? (
          <Spr n="cork" x={W.wellX} y={corkY} s={CS} ax={cork.w / 2} ay={cork.base} rot={corkRot} />
        ) : null}
        <Svg>
          <PuffCluster puffs={smoke} fill={SMOKE} ink={6} />
          <PuffCluster puffs={corkPuffs} fill={GAS} ink={5} />
          {ringU > 0 && ringU < 1 ? (
            <ellipse cx={W.wellX + 10 * Math.sin(ringU * 4)} cy={PIPE_TOP - 120 - 420 * ringU} rx={60 + 90 * ringU} ry={22 + 26 * ringU} fill="none" stroke="#000" strokeWidth={30 * (1 - ringU * 0.5)} opacity={1 - easeInCubic(prog(ringU, 0.75, 1))} />
          ) : null}
          {ringU > 0 && ringU < 1 ? (
            <ellipse cx={W.wellX + 10 * Math.sin(ringU * 4)} cy={PIPE_TOP - 120 - 420 * ringU} rx={60 + 90 * ringU} ry={22 + 26 * ringU} fill="none" stroke={SMOKE} strokeWidth={17 * (1 - ringU * 0.5)} opacity={1 - easeInCubic(prog(ringU, 0.75, 1))} />
          ) : null}
        </Svg>
        <Spr n="beams" x={W.beams.x} y={W.beams.base} s={W.beams.s} ax={0} ay={SPR.beams.base} />
      </World>
      {/* front layer: sign, hose, the guy, his marshmallow */}
      <World cam={cam} off={off}>
        <Svg>
          {cover ? null : <Hose t={t} />}
        </Svg>
        <Guy g={g} />
        <Svg>
          {roastTip ? <Marshmallow at={roastTip} ang={SPR.roast.ang} toast={toast} /> : null}
          {sadTip ? <Marshmallow at={sadTip} ang={SPR.sad.ang} toast={0} /> : null}
          {roastTip && t > 2.2 && t < 3.7
            ? [0, 1, 2].map((k) => {
                const a = ((t - 2.2) * 1.1 + k / 3) % 1;
                const life = Math.sin(Math.PI * a);
                return <circle key={k} cx={roastTip[0] + 30 + 20 * a} cy={roastTip[1] - 30 - 120 * a} r={14 * life} fill={SMOKE} stroke="#000" strokeWidth={4} />;
              })
            : null}
          {g.pose === 'step' && t > 20.95 && t < 21.5
            ? [-1, 1].map((sd) => {
                const a = prog(t, 20.95, 21.5);
                const r = 26 * Math.sin(Math.PI * a);
                const fp = guyPoint(g, SPR.step.foot[0], SPR.step.foot[1]);
                return <circle key={sd} cx={fp[0] + sd * (70 + 60 * a)} cy={fp[1] - 10 - 30 * a} r={r} fill="#EAC682" stroke="#000" strokeWidth={5} />;
              })
            : null}
        </Svg>
      </World>
      {/* the cut-away: underground plate below the front edge, pipes, gas, slant hole, gauge, blast */}
      {showCut ? (
        <World cam={cam} off={off}>
          <Img src={F('bg_under')} style={{position: 'absolute', left: 0, top: W.G, width: 1024 * BG_S, height: 1536 * BG_S}} />
          <Svg>
            <defs>
              <clipPath id="belowG">
                <rect x={-200} y={W.G} width={WW + 400} height={3000} />
              </clipPath>
            </defs>
            <line x1={-20} y1={W.G} x2={WW + 20} y2={W.G} stroke="#000" strokeWidth={12} />
            {/* leak cracks */}
            {t > T.escaped - 0.3
              ? [0, 1].map((k) => {
                  const pts: P[] =
                    k === 0
                      ? [[W.wellX - 30, W.leakY], [760, W.leakY - 30], [520, W.leakY + 26], [W.valves[0].x + 40, W.leakY - 8]]
                      : [[W.wellX + 30, W.leakY], [1130, W.leakY + 24], [W.valves[1].x - 40, W.leakY - 10]];
                  const u = easeOutCubic(prog(t, T.escaped - 0.3, T.escaped + 0.4));
                  return <path key={k} d={smooth(pts, false)} fill="none" stroke="#000" strokeWidth={10} strokeLinecap="round" pathLength={1} strokeDasharray={`${u} 2`} />;
                })
              : null}
            {(cover ? [] : W.valves).map((v, k) => (
              <PipeSmall key={k} x={v.x} y0={W.G - 6} y1={W.leakY - 12} />
            ))}
            <BlobsSvg blobs={leak} />
            <BlobsSvg blobs={seep(t)} />
            <PipeMain t={t} blobs={main} />
            {/* slant hole: drilled just ahead of the bomb */}
            {t > 13.2 ? (
              (() => {
                const u = easeOutCubic(prog(t, 13.25, 14.6));
                const d = `M ${W.slant.x0} ${W.G} L ${W.slant.x1} ${W.slant.y1}`;
                return (
                  <>
                  <g clipPath="url(#belowG)">
                    <path d={d} stroke="#000" strokeWidth={164} strokeLinecap="round" pathLength={1} strokeDasharray={`${u} 2`} fill="none" />
                    <path d={d} stroke="#4A3428" strokeWidth={150} strokeLinecap="round" pathLength={1} strokeDasharray={`${u} 2`} fill="none" />
                  </g>
                  {t < T.like ? <ellipse cx={W.slant.x0} cy={W.G} rx={92} ry={20} fill="#2A1E18" stroke="#000" strokeWidth={8} /> : null}
                  </>
                );
              })()
            ) : null}
            {/* depth gauge, grows with the bomb */}
            {t > 13.9 && t < 21 ? (
              (() => {
                const b = bombState(t);
                const yb = b.phase === 'slant' ? b.y : t >= T.blast ? BLAST.y : W.G;
                const s = pop(t, 16.05, 0.25);
                return (
                  <g>
                    <line x1={W.gauge.x} y1={W.G + 10} x2={W.gauge.x} y2={yb} stroke="#000" strokeWidth={14} strokeLinecap="round" />
                    <line x1={W.gauge.x} y1={W.G + 10} x2={W.gauge.x} y2={yb} stroke="#FFFDF6" strokeWidth={6} strokeLinecap="round" strokeDasharray="30 22" />
                    {Array.from({length: 13}, (_, i) => W.G + 100 * (i + 1))
                      .filter((y) => y < yb)
                      .map((y) => (
                        <line key={y} x1={W.gauge.x - 22} y1={y} x2={W.gauge.x + 22} y2={y} stroke="#000" strokeWidth={8} strokeLinecap="round" />
                      ))}
                    {s > 0.01 ? (
                      <g transform={`translate(${W.gauge.x} ${BLAST.y + 96}) scale(${s})`}>
                        <text x={0} y={0} textAnchor="middle" fontFamily={FONT} fontSize={66} fill="#FFFDF6" stroke="#000" strokeWidth={16} paintOrder="stroke">
                          1.5 km
                        </text>
                      </g>
                    ) : null}
                  </g>
                );
              })()
            ) : null}
            <Blast t={t} />
          </Svg>
        </World>
      ) : null}
      {/* the bomb rides over everything (surface and cut-away) */}
      <World cam={cam} off={off}>
        <Bomb t={t} />
      </World>
      <AbsoluteFill style={{backgroundColor: '#FFF6D8', opacity: 0.75 * (1 - prog(t, T.blast, T.blast + 0.3)) * (t >= T.blast ? 1 : 0)}} />
      {!cover ? (
        <>
          <YearTag t={t} />
          <CityBadge t={t} />
          <Stopwatch t={t} />
        </>
      ) : null}
    </AbsoluteFill>
  );
};

// story time: the last 0.0 s just keep playing; idle motion uses real time
export const NukeGasFireShort: React.FC = () => {
  useNukeFont();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = camAt(t, CAM);
  // shake: cork landing, cork pop, the blast (sums of sines with envelopes)
  const env =
    3 * bump(t, T.plug, 0.25) +
    5 * bump(t, T.pop, 0.3) +
    30 * Math.exp(-4 * Math.max(0, t - T.blast)) * (t >= T.blast ? 1 : 0) * (t < 19.5 ? 1 : 0) +
    3 * bump(t, 20.95, 0.2);
  const s = shake(t, env);
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <Scene t={t} tr={t} cam={cam} sh={[s.x, s.y]} />
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('nuke-gas-fire/vo/take1.mp3')} volume={Math.pow(10, MIX_DB / 20)} />
      </Sequence>
      <SoundCues cues={CUES.map((c) => ({...c, db: c.db + MIX_DB, keys: c.keys?.map(([kt, kd]) => [kt, kd + MIX_DB] as [number, number])}))} dir="nuke-gas-fire/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};

export {CAM0, DURATION};
