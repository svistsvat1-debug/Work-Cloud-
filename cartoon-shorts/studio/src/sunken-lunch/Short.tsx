import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SPR} from './sprites';
import {C_DECK, C_DEEP, C_DEEP2, C_LAB, C_SURF2, DURATION, FPS, T, VO_AT} from './scene';
export {DURATION as SL_DURATION, FPS as SL_FPS} from './scene';
import {camAt, clamp, easeInCubic, easeInOutCubic, easeOutBack, easeOutCubic, lerp, pop, prog, rnd, shake, spring, type Cam, type CamKey} from '../shared/anim';
import {World} from '../shared/World';
import {PuffCluster, type Puff} from '../shared/Puffs';
import {Eye} from '../shared/Face';
import {SoundCues, type Cue} from '../shared/Sound';
import {useFont} from '../shared/useFont';

// "Why didn't this sandwich rot at the bottom of the sea?" - deep-ocean cluster. A tiny sub hangs from a ship's crane, the
// guy in its hatch shows off his sandwich (it has a face). The cables snap, the sub splashes in, the guy leaps onto the deck,
// the sandwich (tossed onto his head) drops into the hatch and sinks with the sub. 10 MONTHS LATER on the sea floor it sleeps
// behind the porthole; a hook hauls the sub up, it bursts out of the sea, the soggy sandwich pops up: almost fresh (sparkles),
// the guy's jaw drops; "Cold, right?" (thermometer, snowflake, shiver). BUT (cut): a lab fridge just as cold - germs pop onto
// a sandwich and chomp, UP TO x100, it turns rotten. The deep again: arrows of crushing pressure slam onto the sub; in a
// magnifier the germs on the sunken sandwich get squashed, slow down and fall asleep. So (cut): on the deck the guy smugly
// lowers a lunchbox (with a face) on a line into the sea.

const F = (n: string) => staticFile(`sunken-lunch/${n}.png`);
export const FONT = 'SLInter';
export const useSLFont = () => useFont(FONT, staticFile('fonts/Inter-Black.otf'));
const MIX_DB = -1.0;
const INK = '#000';
const YEL = '#FFE45C';
const RED = '#E8382E';
const CABLE = '#3A3A3A';
const GERM = '#7BC74D';
const GERM_SH = '#5DA437';
const FOAM = '#EAF6FF';
const DROP = '#BFE6FF';

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
const tremble = (t: number, a: number, ph = 0): [number, number] => [a * Math.sin(2 * Math.PI * 17 * t + ph), a * 0.7 * Math.sin(2 * Math.PI * 13 * t + 1.7 + ph)];

type SprInfo = {w: number; h: number; feet: [number, number]; hd?: [number, number, number]; bottom: number; left: number; right: number; top: number};
const S = (n: string) => (SPR as unknown as Record<string, SprInfo>)[n];

const Spr: React.FC<{n: string; x: number; y: number; s: number; sx?: number; sy?: number; rot?: number; ax?: number; ay?: number; children?: React.ReactNode}> = ({
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
  const sp = S(n);
  const axx = ax ?? sp.feet[0];
  const ayy = ay ?? sp.feet[1];
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg) scale(${sx}, ${sy})`, transformOrigin: '0 0'}}>
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
// world-space svg around a centre point
const Svg: React.FC<{children: React.ReactNode; cx?: number; cy?: number; r?: number}> = ({children, cx = 0, cy = 0, r = 6000}) => (
  <svg style={{position: 'absolute', left: cx - r, top: cy - r, overflow: 'visible'}} width={2 * r} height={2 * r} viewBox={`${cx - r} ${cy - r} ${2 * r} ${2 * r}`}>
    {children}
  </svg>
);
const Txt: React.FC<{x: number; y: number; size: number; s?: number; text: string; rot?: number; fill?: string; stroke?: string; sw?: number}> = ({
  x,
  y,
  size,
  s = 1,
  text,
  rot = 0,
  fill = '#fff',
  stroke = INK,
  sw = 0.2,
}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <text x={0} y={size * 0.35} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={size} fill={fill} stroke={stroke} strokeWidth={size * sw} paintOrder="stroke" strokeLinejoin="round">
        {text}
      </text>
    </g>
  );
const Star: React.FC<{x: number; y: number; r: number}> = ({x, y, r}) =>
  r <= 0.3 ? null : (
    <path
      d={`M ${x} ${y - r * 2} L ${x + r * 0.45} ${y - r * 0.45} L ${x + r * 2} ${y} L ${x + r * 0.45} ${y + r * 0.45} L ${x} ${y + r * 2} L ${x - r * 0.45} ${y + r * 0.45} L ${x - r * 2} ${y} L ${x - r * 0.45} ${y - r * 0.45} Z`}
      fill={YEL}
      stroke={INK}
      strokeWidth={Math.max(2, r * 0.22)}
      strokeLinejoin="round"
    />
  );
const Sparkles: React.FC<{x: number; y: number; s: number; t: number; size?: number}> = ({x, y, s, t, size = 1}) =>
  s <= 0.001 ? null : (
    <g>
      {[
        [-1.0, -0.55, 1],
        [1.05, -0.35, 0.8],
        [0.25, -1.05, 0.65],
        [-0.6, 0.45, 0.55],
      ].map(([dx, dy, k], i) => {
        const tw = 0.75 + 0.25 * Math.sin(2 * Math.PI * 2.5 * t + i * 1.7);
        return <Star key={i} x={x + dx * 150 * size} y={y + dy * 150 * size} r={20 * size * k * s * tw} />;
      })}
    </g>
  );
// splash: drops thrown up from a line, real gravity, shrinking; + white foam puffs that grow and shrink away
const splashDrops = (t: number, t0: number, x0: number, x1: number, y: number, n: number, seed: number, power = 1) => {
  const tau = t - t0;
  if (tau <= 0 || tau > 1.1) return null;
  const out: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const x = lerp(x0, x1, rnd(seed + i));
    const side = x < (x0 + x1) / 2 ? -1 : 1;
    const vx = side * (120 + 380 * rnd(seed + 40 + i)) * power;
    const vy = -(700 + 900 * rnd(seed + 80 + i)) * power;
    const px = x + vx * tau;
    const py = y + vy * tau + 0.5 * 3200 * tau * tau;
    if (py > y + 30) continue;
    const r = (10 + 16 * rnd(seed + 120 + i)) * power * (1 - 0.6 * clamp(tau / 1.1));
    out.push(<circle key={i} cx={px} cy={py} r={r} fill={DROP} stroke={INK} strokeWidth={Math.max(2, r * 0.28)} />);
  }
  return <g>{out}</g>;
};
const foamPuffs = (t: number, t0: number, x: number, y: number, w: number, n: number, seed: number): Puff[] => {
  // one merged mound of white foam: overlapping puffs, highest in the middle; grows, then shrinks away
  const u = (t - t0) / 0.9;
  if (u <= 0 || u >= 1) return [];
  const grow = Math.sin(Math.PI * Math.min(1, u * 1.1));
  const out: Puff[] = [];
  for (let i = 0; i < n; i++) {
    const f = i / (n - 1) - 0.5;
    const px = x + f * w * (0.75 + 0.35 * easeOutCubic(u));
    const r = w * (0.075 + 0.04 * rnd(seed + i)) * grow * (1 - 0.6 * Math.abs(f));
    const lift = w * 0.09 * (1 - 4 * f * f) * easeOutCubic(Math.min(1, u * 2)) * grow;
    out.push({x: px, y: y - r * 0.25 - lift, r: Math.max(0, r)});
  }
  return out;
};
// bubbles rising (outlined circles with a glint), deterministic
const Bubbles: React.FC<{t: number; t0: number; t1: number; x: number; y: number; w: number; n: number; seed: number; rise?: number}> = ({t, t0, t1, x, y, w, n, seed, rise = 700}) => {
  const out: React.ReactNode[] = [];
  for (let i = 0; i < n; i++) {
    const born = t0 + (t1 - t0) * rnd(seed + i);
    const tau = t - born;
    if (tau < 0 || tau > 1.4) continue;
    const r = 8 + 16 * rnd(seed + 30 + i);
    const px = x + (rnd(seed + 60 + i) - 0.5) * w + 14 * Math.sin(2 * Math.PI * 1.6 * tau + i);
    const py = y - rise * tau * (0.7 + 0.5 * rnd(seed + 90 + i));
    const s = Math.min(1, tau * 6) * (1 - clamp((tau - 1.1) / 0.3));
    out.push(
      <g key={i} transform={`translate(${px} ${py}) scale(${s})`}>
        <circle r={r} fill="rgba(220,245,255,0.35)" stroke={INK} strokeWidth={3} />
        <circle cx={-r * 0.35} cy={-r * 0.35} r={r * 0.22} fill="#fff" />
      </g>,
    );
  }
  return <g>{out}</g>;
};
const Zzz: React.FC<{t: number; t0: number; x: number; y: number; size: number}> = ({t, t0, x, y, size}) => (
  <g>
    {[0, 1, 2].map((i) => {
      const tau = (t - t0 - i * 0.35) % 1.05;
      if (t - t0 - i * 0.35 < 0) return null;
      const u = tau / 1.05;
      const s = Math.sin(Math.PI * u);
      return <Txt key={i} x={x + 40 * u + i * 8} y={y - 160 * u} size={size * (0.7 + 0.5 * u)} text="Z" s={s} fill="#fff" rot={-12} />;
    })}
  </g>
);

// ---------- the guy (all poses scaled to the same head radius) ----------
const RH = 110;
const gs = (p: string) => RH / (S(p).hd as [number, number, number])[2];
const Guy: React.FC<{p: string; x: number; y: number; sx?: number; sy?: number; rot?: number; ax?: number; ay?: number; children?: React.ReactNode}> = ({
  p,
  x,
  y,
  sx = 1,
  sy = 1,
  rot = 0,
  ax,
  ay,
  children,
}) => (
  <Spr n={p} x={x} y={y} s={gs(p)} sx={sx} sy={sy} rot={rot} ax={ax} ay={ay}>
    {children}
  </Spr>
);
const guyPt = (p: string, fx: number, fy: number, px: number, py: number, flip = 1) => {
  const sp = S(p);
  const s = gs(p);
  return {x: fx + flip * (px - sp.feet[0]) * s, y: fy + (py - sp.feet[1]) * s};
};

// ---------- the sandwich / lunchbox with a code face ----------
type Mouth = 'smile' | 'grin' | 'o' | 'gulp' | 'flat' | 'sleep' | 'wavy';
type FaceSt = {open?: number; look?: [number, number]; lid?: number; squeeze?: boolean; mouth?: Mouth; brow?: number; browTilt?: number};
const FACE: Record<string, {e1: [number, number]; e2: [number, number]; r: number; m: [number, number]; mw: number}> = {
  sw_fresh: {e1: [126, 60], e2: [218, 60], r: 19, m: [172, 86], mw: 44},
  sw_soggy: {e1: [128, 100], e2: [224, 100], r: 20, m: [176, 128], mw: 46},
  sw_rotten: {e1: [128, 64], e2: [222, 64], r: 19, m: [176, 90], mw: 44},
  lunchbox: {e1: [112, 112], e2: [206, 112], r: 23, m: [160, 145], mw: 52},
};
const MouthShape: React.FC<{m: Mouth; x: number; y: number; w: number}> = ({m, x, y, w}) => {
  const sw = w * 0.13;
  if (m === 'smile') return <path d={`M ${x - w / 2} ${y - w * 0.08} Q ${x} ${y + w * 0.45} ${x + w / 2} ${y - w * 0.08}`} fill="none" stroke={INK} strokeWidth={sw} strokeLinecap="round" />;
  if (m === 'grin')
    return (
      <g>
        <path d={`M ${x - w * 0.55} ${y - w * 0.12} Q ${x} ${y + w * 0.85} ${x + w * 0.55} ${y - w * 0.12} Z`} fill={INK} stroke={INK} strokeWidth={sw * 0.6} strokeLinejoin="round" />
        <ellipse cx={x} cy={y + w * 0.3} rx={w * 0.22} ry={w * 0.12} fill="#FC8D90" />
      </g>
    );
  if (m === 'o') return <ellipse cx={x} cy={y + w * 0.08} rx={w * 0.2} ry={w * 0.27} fill={INK} />;
  if (m === 'gulp')
    return <path d={`M ${x - w * 0.35} ${y} q ${w * 0.12} ${-w * 0.14} ${w * 0.23} 0 t ${w * 0.23} 0 t ${w * 0.23} 0`} fill="none" stroke={INK} strokeWidth={sw} strokeLinecap="round" />;
  if (m === 'wavy')
    return <path d={`M ${x - w * 0.45} ${y + w * 0.08} q ${w * 0.11} ${-w * 0.18} ${w * 0.225} 0 t ${w * 0.225} 0 t ${w * 0.225} 0 t ${w * 0.225} 0`} fill="none" stroke={INK} strokeWidth={sw} strokeLinecap="round" />;
  if (m === 'sleep') return <path d={`M ${x - w * 0.18} ${y + w * 0.05} Q ${x} ${y + w * 0.16} ${x + w * 0.18} ${y + w * 0.05}`} fill="none" stroke={INK} strokeWidth={sw} strokeLinecap="round" />;
  return <line x1={x - w * 0.3} x2={x + w * 0.3} y1={y + w * 0.05} y2={y + w * 0.05} stroke={INK} strokeWidth={sw} strokeLinecap="round" />;
};
const FaceOn: React.FC<{n: string; f: FaceSt}> = ({n, f}) => {
  const d = FACE[n];
  const open = f.open ?? 1;
  return (
    <g>
      <Eye x={d.e1[0]} y={d.e1[1]} r={d.r} open={open} lid={f.lid ?? 0} look={f.look ?? [0, 0]} squeeze={f.squeeze} side={-1} brow={f.brow ?? 0.55} browTilt={f.browTilt ?? 0} />
      <Eye x={d.e2[0]} y={d.e2[1]} r={d.r} open={open} lid={f.lid ?? 0} look={f.look ?? [0, 0]} squeeze={f.squeeze} side={1} brow={f.brow ?? 0.55} browTilt={f.browTilt ?? 0} />
      <MouthShape m={f.mouth ?? 'smile'} x={d.m[0]} y={d.m[1]} w={d.mw} />
    </g>
  );
};
const Food: React.FC<{n: string; x: number; y: number; s: number; sx?: number; sy?: number; rot?: number; f?: FaceSt}> = ({n, x, y, s, sx = 1, sy = 1, rot = 0, f}) => (
  <Spr n={n} x={x} y={y} s={s} sx={sx} sy={sy} rot={rot}>
    {f ? <FaceOn n={n} f={f} /> : null}
  </Spr>
);

// ---------- germs (code) ----------
const Germ: React.FC<{x: number; y: number; r: number; ph: number; chomp: number; eye?: number; sq?: number; yawn?: number; s?: number}> = ({
  x,
  y,
  r,
  ph,
  chomp,
  eye = 1,
  sq = 1,
  yawn = 0,
  s = 1,
}) => {
  if (s <= 0.001) return null;
  const bumps = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
    const a = (i / 8) * Math.PI * 2 + ph;
    return [Math.cos(a) * r * 0.95, Math.sin(a) * r * 0.95] as [number, number];
  });
  const open = clamp(yawn > 0 ? yawn : 0.15 + 0.85 * chomp);
  const mw = r * 0.95;
  const mh = r * (yawn > 0 ? 0.75 : 0.55) * open;
  return (
    <g transform={`translate(${x} ${y}) scale(${s * (1 + (1 - sq) * 0.6)} ${s * sq})`}>
      {bumps.map(([bx, by], i) => (
        <circle key={`i${i}`} cx={bx} cy={by} r={r * 0.28 + 5} fill={INK} />
      ))}
      <circle cx={0} cy={0} r={r + 5} fill={INK} />
      {bumps.map(([bx, by], i) => (
        <circle key={`f${i}`} cx={bx} cy={by} r={r * 0.28} fill={GERM} />
      ))}
      <circle cx={0} cy={0} r={r} fill={GERM} />
      <circle cx={r * 0.25} cy={r * 0.3} r={r * 0.5} fill={GERM_SH} opacity={0.55} />
      {eye > 0.15 ? (
        <g>
          <ellipse cx={-r * 0.33} cy={-r * 0.32} rx={r * 0.24} ry={r * 0.3 * eye} fill="#fff" stroke={INK} strokeWidth={3} />
          <ellipse cx={r * 0.33} cy={-r * 0.32} rx={r * 0.24} ry={r * 0.3 * eye} fill="#fff" stroke={INK} strokeWidth={3} />
          <circle cx={-r * 0.29} cy={-r * 0.28} r={r * 0.12 * Math.min(1, eye * 1.3)} fill={INK} />
          <circle cx={r * 0.37} cy={-r * 0.28} r={r * 0.12 * Math.min(1, eye * 1.3)} fill={INK} />
        </g>
      ) : (
        <g stroke={INK} strokeWidth={4} strokeLinecap="round" fill="none">
          <path d={`M ${-r * 0.52} ${-r * 0.3} q ${r * 0.19} ${r * 0.16} ${r * 0.38} 0`} />
          <path d={`M ${r * 0.14} ${-r * 0.3} q ${r * 0.19} ${r * 0.16} ${r * 0.38} 0`} />
        </g>
      )}
      <ellipse cx={0} cy={r * 0.3 + mh / 2} rx={mw / 2} ry={Math.max(2, mh / 2 + 2)} fill={INK} />
      {open > 0.25 && yawn <= 0 ? (
        <g fill="#fff">
          {[-0.3, -0.1, 0.1, 0.3].map((k, i) => (
            <path key={i} d={`M ${k * mw - mw * 0.08} ${r * 0.3 + 1} l ${mw * 0.08} ${mh * 0.45} l ${mw * 0.08} ${-mh * 0.45} Z`} />
          ))}
        </g>
      ) : null}
    </g>
  );
};

// ---------- the sub rig (sprite + clipped hatch occupant + porthole window) ----------
const SUB = SPR.sub;
const HATCH = {x: 740, y: 156};
const PORT = {x: SUB.port[0], y: SUB.port[1], r: SUB.port[2] * 0.9};
const PIV = {x: 640, y: 412};
const ATT1 = {x: 330, y: 372};
const ATT2 = {x: 1100, y: 373};
const LIFT = {x: 560, y: 352}; // lifting eye on the hull top, left of the tower (the hook takes it after 10 months)
const LiftEye: React.FC<{p: {x: number; y: number}}> = ({p}) => <circle cx={p.x} cy={p.y - 14} r={20} fill="none" stroke={INK} strokeWidth={14} />;
const hookAt = (eye: {x: number; y: number}) => ({x: eye.x + 22, y: eye.y - 92});
type Rig = {x: number; y: number; rot: number; sx?: number; sy?: number};
const subPt = (rig: Rig, px: number, py: number) => {
  const a = (rig.rot * Math.PI) / 180;
  const dx = (px - PIV.x) * (rig.sx ?? 1);
  const dy = (py - PIV.y) * (rig.sy ?? 1);
  return {x: rig.x + PIV.x + dx * Math.cos(a) - dy * Math.sin(a), y: rig.y + PIV.y + dx * Math.sin(a) + dy * Math.cos(a)};
};
const SubRig: React.FC<{rig: Rig; occupant?: React.ReactNode; port?: React.ReactNode}> = ({rig, occupant, port}) => (
  <div
    style={{
      position: 'absolute',
      left: rig.x,
      top: rig.y,
      width: SUB.w,
      height: SUB.h,
      transformOrigin: `${PIV.x}px ${PIV.y}px`,
      transform: `rotate(${rig.rot}deg) scale(${rig.sx ?? 1}, ${rig.sy ?? 1})`,
    }}
  >
    <Img src={F('sub')} style={{position: 'absolute', left: 0, top: 0, width: SUB.w, height: SUB.h}} />
    {port ? (
      <div style={{position: 'absolute', left: PORT.x - PORT.r, top: PORT.y - PORT.r, width: PORT.r * 2, height: PORT.r * 2, borderRadius: '50%', overflow: 'hidden', background: '#183F62'}}>
        {port}
        <svg style={{position: 'absolute', left: 0, top: 0}} width={PORT.r * 2} height={PORT.r * 2}>
          <circle cx={PORT.r} cy={PORT.r} r={PORT.r} fill="rgba(70,150,220,0.22)" />
          <path d={`M ${PORT.r * 0.45} ${PORT.r * 0.75} A ${PORT.r * 0.7} ${PORT.r * 0.7} 0 0 1 ${PORT.r * 0.95} ${PORT.r * 0.32}`} fill="none" stroke="#fff" strokeWidth={9} strokeLinecap="round" opacity={0.85} />
        </svg>
      </div>
    ) : null}
    {occupant ? (
      <div style={{position: 'absolute', left: -3000, top: -3000, width: 7000, height: 3000 + HATCH.y + 2, overflow: 'hidden'}}>
        <div style={{position: 'absolute', left: 3000, top: 3000}}>{occupant}</div>
      </div>
    ) : null}
  </div>
);
const Cable: React.FC<{pts: [number, number][]; w?: number}> = ({pts, w = 9}) => (
  <path d={pts.map((p, i) => `${i ? 'L' : 'M'} ${p[0]} ${p[1]}`).join(' ')} fill="none" stroke={CABLE} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" />
);
const Hook: React.FC<{x: number; y: number; s?: number}> = ({x, y, s = 1}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x={-16} y={-60} width={32} height={46} rx={8} fill="#9AA3AB" stroke={INK} strokeWidth={8} />
    <path d="M 0 -14 L 0 20 A 34 34 0 1 1 -58 44" fill="none" stroke={INK} strokeWidth={30} strokeLinecap="round" />
    <path d="M 0 -14 L 0 20 A 34 34 0 1 1 -58 44" fill="none" stroke="#B9C2CA" strokeWidth={16} strokeLinecap="round" />
  </g>
);

// ======================================================================================================
// THE SEA SET (side view). The sea plate is drawn 3x (1 plate px = 3 world px).
// ======================================================================================================
const PS = 3;
const WATER = SPR.sea.water * PS; // 2424
const PUL = {x: 670 * PS, y: 347 * PS, r: 24 * PS}; // crane pulley (read off the plate grid)
const DECK = 700 * PS;
const SKY = SPR.sea.cols.sky;
const SEA = SPR.sea.cols.sea;
const SUB_HANG = {x: PUL.x - 715, y: 1469};
const RING = {x: PUL.x, y: 1230};
const plateBlur = (k: number) => clamp((k * PS - 2.05) * 2.4, 0, 6);
const SeaPlate: React.FC<{cam: Cam}> = ({cam}) => (
  <World cam={cam} blur={plateBlur(cam.k)}>
    <div style={{position: 'absolute', left: -9000, top: -9000, width: 21072, height: 9000 + WATER, background: SKY}} />
    <div style={{position: 'absolute', left: -9000, top: WATER, width: 21072, height: 12000, background: SEA}} />
    <Img src={F('sea')} style={{position: 'absolute', left: 0, top: 0, width: 1024 * PS, height: 1536 * PS}} />
  </World>
);
// the front water: everything below the surface line is seen through tinted water
const WaterFront: React.FC<{t: number}> = ({t}) => (
  <Svg cx={1500} cy={WATER + 2000} r={9000}>
    <defs>
      <linearGradient id="wfg" x1="0" y1={WATER} x2="0" y2={WATER + 900} gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="rgb(48,131,204)" stopOpacity={0.5} />
        <stop offset="1" stopColor="rgb(18,72,140)" stopOpacity={0.93} />
      </linearGradient>
    </defs>
    <rect x={-7000} y={WATER} width={16000} height={12000} fill="url(#wfg)" />
    {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
      const x = 300 + i * 420 + 30 * Math.sin(t * 1.3 + i);
      return <path key={i} d={`M ${x} ${WATER + 70 + (i % 3) * 120} q 40 -22 80 0 t 80 0`} fill="none" stroke="#fff" strokeWidth={8} strokeLinecap="round" opacity={0.75} />;
    })}
  </Svg>
);

// ======================================================================================================
// SHOT 1 - the sub on the crane, the snap, the splash, the jump, the sandwich sinks
// ======================================================================================================
const SW = 0.6; // sandwich scale on the guy
const G = 6000;
const T_DROP = T.snap + 0.1;
const Y_ENTRY = WATER - (SUB_HANG.y + 811);
const YF = 443;
const T_ENTRY = T_DROP + Math.sqrt((2 * Y_ENTRY) / G);
const SINK0 = 6.95;
const T_UNDER = 7.38; // the hatch goes under the surface
const subFall = (t: number): {dy: number; rot: number} => {
  if (t < T.snap) return {dy: 0, rot: 0.6 * Math.sin(2 * Math.PI * 0.35 * t)};
  if (t < T_DROP) return {dy: 0, rot: -7 * easeOutCubic(prog(t, T.snap, T_DROP))};
  const tau = t - T_DROP;
  const te = T_ENTRY - T_DROP;
  if (tau < te) return {dy: 0.5 * G * tau * tau, rot: -7 + 4 * (tau / te)};
  const v0 = G * te;
  const w0 = 2 * Math.PI * 1.0;
  const z = 0.35;
  const wd = w0 * Math.sqrt(1 - z * z);
  const s = tau - te;
  let dy = YF + Math.exp(-z * w0 * s) * ((Y_ENTRY - YF) * Math.cos(wd * s) + ((v0 + z * w0 * (Y_ENTRY - YF)) / wd) * Math.sin(wd * s));
  const rot = -3 * Math.exp(-2 * s) * Math.cos(2 * Math.PI * 0.9 * s) + 1.5 * Math.sin(2 * Math.PI * 0.45 * s) * (1 - Math.exp(-2 * s));
  dy += 700 * Math.pow(prog(t, SINK0, 7.6), 1.6) + 500 * Math.max(0, t - 7.6);
  return {dy, rot};
};
const CAM1: CamKey[] = [
  {t: 0, x: 2010, y: 1640, k: 1.0},
  {t: 2.85, x: 1760, y: 1700, k: 0.62},
  {t: 3.95, x: 1770, y: 1710, k: 0.625},
  {t: 4.65, x: 1730, y: 1960, k: 0.62, ease: 'out'},
  {t: 5.12, x: 1730, y: 1960, k: 0.62},
  {t: 5.8, x: 1560, y: 1990, k: 0.6},
  {t: 6.12, x: 1565, y: 1995, k: 0.6},
  {t: 6.85, x: 1990, y: 2085, k: 1.12},
  {t: C_DEEP, x: 1990, y: 2330, k: 1.12, ease: 'in'},
];
// the guy in the hatch: hatch anchor (sprite px) = where the body meets the rim
const HERO_AT: [number, number] = [312, 700];
const HELP_AT: [number, number] = [249, 470];
const DECK_X = 1000;
const LEAP_T1 = T.jumps + 0.5;
const SurfaceScene: React.FC<{t: number}> = ({t}) => {
  const base = camAt(t, CAM1);
  const amp = t > T_ENTRY ? 22 * Math.exp(-(t - T_ENTRY) * 6) : 0;
  const sh = shake(t, amp);
  const cam: Cam = {x: base.x - sh.x / base.k, y: base.y - sh.y / base.k, k: base.k};
  const fall = subFall(t);
  const rig: Rig = {x: SUB_HANG.x, y: SUB_HANG.y + fall.dy, rot: fall.rot};
  const hatchW = subPt(rig, HATCH.x, HATCH.y);
  // ---- cables: pulley -> ring -> two bridles; the left one snaps at T.snap, the right one at T_DROP
  const a1 = subPt(rig, ATT1.x, ATT1.y);
  const a2 = subPt(rig, ATT2.x, ATT2.y);
  const creak = t > 3.45 && t < T.snap ? 3 * Math.sin(2 * Math.PI * 9 * t) : 0;
  const cables: React.ReactNode[] = [<Cable key="main" pts={[[PUL.x, PUL.y + PUL.r * 0.6], [RING.x, RING.y]]} w={11} />];
  const whip = (from: {x: number; y: number}, to: {x: number; y: number}, t0: number, key: string, dir: number) => {
    if (t < t0) return <Cable key={key} pts={[[from.x, from.y], [lerp(from.x, to.x, 0.5) + creak, lerp(from.y, to.y, 0.5)], [to.x, to.y]]} />;
    // snapped: the upper piece whips up, then falls back and hangs limp from the ring with a damped swing
    const tau = t - t0;
    const L = Math.hypot(to.x - from.x, to.y - from.y) * 0.4;
    const ang0 = Math.atan2(to.y - from.y, to.x - from.x);
    const up = ang0 - dir * 1.9;
    const down = Math.PI / 2 + dir * 0.12;
    const ang = tau < 0.18 ? lerp(ang0, up, easeOutCubic(tau / 0.18)) : down + (up - down) * Math.exp(-(tau - 0.18) * 4.5) * Math.cos(2 * Math.PI * 1.3 * (tau - 0.18));
    const mid = [from.x + Math.cos(ang + 0.18 * dir) * L * 0.5, from.y + Math.sin(ang + 0.18 * dir) * L * 0.5] as [number, number];
    const end = [from.x + Math.cos(ang) * L, from.y + Math.sin(ang) * L] as [number, number];
    return <Cable key={key} pts={[[from.x, from.y], mid, end]} />;
  };
  cables.push(whip(RING, a1, T.snap, 'b1', -1));
  cables.push(whip(RING, a2, T_DROP, 'b2', 1));
  const stubs =
    t >= T.snap ? (
      <g>
        <Cable pts={[[a1.x, a1.y], [a1.x + 40, a1.y - 70]]} w={8} />
        {t >= T_DROP ? <Cable pts={[[a2.x, a2.y], [a2.x - 40, a2.y - 70]]} w={8} /> : null}
      </g>
    ) : null;
  // ---- the guy
  let occupant: React.ReactNode = null;
  let guyWorld: React.ReactNode = null;
  if (t < T.snap) {
    const b = breathe(t);
    occupant = <Guy p="hero" x={HATCH.x} y={HATCH.y} ax={HERO_AT[0]} ay={HERO_AT[1]} sy={b} />;
  } else if (t < T.jumps) {
    const [sx, sy] = squashSwap(t, T.snap + 0.02);
    const [tx, ty] = tremble(t, 2.5);
    occupant = <Guy p="help" x={HATCH.x + tx} y={HATCH.y + ty} ax={HELP_AT[0]} ay={HELP_AT[1]} sx={sx} sy={sy} />;
  } else if (t < LEAP_T1) {
    // the leap: head travels on a parabola from the hatch to above the deck
    const u = prog(t, T.jumps, LEAP_T1);
    const h0 = {x: hatchW.x, y: hatchW.y - 160};
    const h1 = {x: DECK_X, y: DECK - 400};
    const hx = lerp(h0.x, h1.x, u);
    const hy = lerp(h0.y, h1.y, u) - 420 * Math.sin(Math.PI * u);
    const sp = S('leap');
    guyWorld = <Guy p="leap" x={hx} y={hy} ax={(sp.hd as number[])[0]} ay={(sp.hd as number[])[1]} rot={-14 * Math.sin(Math.PI * u)} />;
  } else {
    const [sx, sy] = squashSwap(t, LEAP_T1 + 0.02);
    const [tx] = tremble(t, 2);
    const hop = 18 * Math.abs(Math.sin(2 * Math.PI * 2.2 * (t - LEAP_T1))) * (t < 7.2 ? 1 : 0.4);
    guyWorld = <Guy p="help" x={DECK_X + tx} y={DECK - hop} sx={sx} sy={sy * breathe(t)} />;
  }
  // ---- the sandwich (sub-local coordinates, clipped with the occupant)
  const palm = {x: 905, y: 96};
  const headTop = {x: HATCH.x, y: HATCH.y + (235 - HELP_AT[1]) * gs('help') - RH + 8};
  let sw: React.ReactNode;
  if (t < T.snap) {
    const worried = t > T.bottom + 0.1;
    const blink = t > 1.4 && t < 1.52 ? 1 : 0;
    const f: FaceSt = worried
      ? {look: [0.35, 0.85], mouth: 'o', brow: 0.75, browTilt: -0.8}
      : {look: [-0.55, -0.25], lid: blink, mouth: t < 0.42 ? 'smile' : 'grin'};
    const wob = Math.sin(2 * Math.PI * 1.2 * t) * 1.5;
    sw = <Food n="sw_fresh" x={palm.x} y={palm.y} s={SW} rot={wob} f={f} />;
  } else if (t < T.snap + 0.33) {
    const u = prog(t, T.snap, T.snap + 0.33);
    const x = lerp(palm.x, headTop.x, u);
    const y = lerp(palm.y, headTop.y, u) - 330 * Math.sin(Math.PI * u);
    sw = <Food n="sw_fresh" x={x} y={y} s={SW} rot={360 * easeInOutCubic(u)} f={{look: [0, 0], mouth: 'o', open: 1.1}} />;
  } else if (t < T.jumps + 0.15) {
    const [tx, ty] = t < T.jumps ? tremble(t, 2.5) : [0, 0];
    const land = t < T.snap + 0.6 ? spring(t - T.snap - 0.33, 3, 6) : 0;
    sw = <Food n="sw_fresh" x={headTop.x + tx} y={headTop.y + ty} s={SW} sy={1 - 0.12 * land} sx={1 + 0.1 * land} f={{look: [0.6, 0.2], mouth: 'o'}} />;
  } else if (t < T.jumps + 0.42) {
    // the guy is gone: the sandwich hangs for a beat, looks down, drops into the hatch
    const u = easeInCubic(prog(t, T.jumps + 0.15, T.jumps + 0.42));
    sw = <Food n="sw_fresh" x={HATCH.x} y={lerp(headTop.y, HATCH.y + 42, u)} s={SW} f={{look: [0, 1], mouth: 'o', brow: 0.8}} />;
  } else {
    const land = spring(t - T.jumps - 0.42, 3, 6);
    const look: [number, number] = t < T.sandwich2 ? [-0.9, 0.1] : t < T.doesnt ? [0, 0] : [0, -0.9];
    const mouth: Mouth = t < T.doesnt - 0.05 ? 'wavy' : t < T.doesnt + 0.35 ? 'gulp' : 'o';
    const [tx, ty] = t > T.doesnt ? tremble(t, 2) : [0, 0];
    sw = <Food n="sw_fresh" x={HATCH.x + tx} y={HATCH.y + 42 + ty} s={SW} sy={1 - 0.1 * land} sx={1 + 0.08 * land} f={{look, mouth, open: t > T.doesnt ? 1.15 : 1, brow: 0.8, browTilt: -1}} />;
  }
  occupant = (
    <>
      {occupant}
      {sw}
    </>
  );
  const foam: Puff[] = foamPuffs(t, T_ENTRY, 1930, WATER, 1500, 14, 11);
  const swirl =
    t > T_UNDER - 0.05
      ? [0, 1, 2].map((i) => {
          const u = clamp((t - T_UNDER + 0.05 - i * 0.12) / 0.6);
          if (u <= 0 || u >= 1) return null;
          return <ellipse key={`sw${i}`} cx={hatchW.x} cy={WATER + 4} rx={60 + 300 * u} ry={12 + 16 * u} fill="none" stroke="#fff" strokeWidth={8} opacity={1 - u} />;
        })
      : null;
  const rings =
    t > T_ENTRY && t < SINK0 + 0.3
      ? [0, 1].map((i) => {
          const u = ((t - T_ENTRY) * 0.7 + i * 0.5) % 1;
          return <ellipse key={i} cx={hatchW.x - 90} cy={WATER + 4} rx={700 + 300 * u} ry={34 + 14 * u} fill="none" stroke="#fff" strokeWidth={7} opacity={0.8 * (1 - u)} />;
        })
      : null;
  return (
    <AbsoluteFill>
      <SeaPlate cam={cam} />
      <World cam={cam}>
        <Svg cx={1800} cy={1600} r={3000}>
          {cables}
          {stubs}
        </Svg>
        <SubRig rig={rig} occupant={occupant} />
        {guyWorld}
        <WaterFront t={t} />
        <Svg cx={1800} cy={WATER} r={2600}>
          {rings}
          {swirl}
          <PuffCluster puffs={foam} fill={FOAM} ink={6} />
          {splashDrops(t, T_ENTRY, 1500, 2420, WATER, 26, 3, 1.15)}
          {t > T_UNDER ? <Bubbles t={t} t0={T_UNDER} t1={C_DEEP} x={hatchW.x} y={Math.max(WATER + 60, hatchW.y)} w={360} n={12} seed={7} rise={600} /> : null}
        </Svg>
      </World>
    </AbsoluteFill>
  );
};

// ======================================================================================================
// THE DEEP SET (side view of the sea floor; deep plate 3x) - shots 2 and 5
// ======================================================================================================
const FLOOR = SPR.deep.floor * PS; // 3831
const DEEP_C = SPR.deep.cols;
const SUB_FLOOR: Rig = {x: 900, y: FLOOR + 32 - 811, rot: -3};
const DeepPlate: React.FC<{cam: Cam}> = ({cam}) => (
  <World cam={cam} blur={plateBlur(cam.k)}>
    <div style={{position: 'absolute', left: -9000, top: -9000, width: 21072, height: 9000, background: DEEP_C.top}} />
    <Img src={F('deep')} style={{position: 'absolute', left: 0, top: 0, width: 1024 * PS, height: 1536 * PS}} />
    <div style={{position: 'absolute', left: -9000, top: 1536 * PS - 36, width: 21072, height: 9000, background: DEEP_C.mud}} />
  </World>
);
// marine snow drifting down, mud strip in front of the sub's belly
const Snow: React.FC<{t: number; cx: number; cy: number}> = ({t, cx, cy}) => (
  <g>
    {Array.from({length: 46}).map((_, i) => {
      const x = cx - 1300 + 2600 * rnd(i + 3) + 40 * Math.sin(t * 0.8 + i);
      const y = cy - 2200 + ((4400 * rnd(i + 70) + t * 60 * (0.5 + rnd(i + 9))) % 4400);
      return <circle key={i} cx={x} cy={y} r={4 + 5 * rnd(i + 40)} fill="#BFD8F0" opacity={0.55} />;
    })}
  </g>
);
const MudFront: React.FC<{x0: number; x1: number}> = ({x0, x1}) => {
  // mud in front of the sub's belly: filled far below the frame, outlined only along its wavy top edge
  let top = `M ${x0} ${FLOOR + 10}`;
  for (let x = x0; x <= x1; x += 60) top += ` L ${x} ${FLOOR + 6 + 8 * Math.sin(x * 0.02)}`;
  const fill = `${top} L ${x1} ${FLOOR + 4000} L ${x0} ${FLOOR + 4000} Z`;
  return (
    <g>
      <path d={fill} fill={DEEP_C.mud} />
      <path d={top} fill="none" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
    </g>
  );
};
const Calendar: React.FC<{x: number; y: number; s: number; n: number}> = ({x, y, s, n}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-110} y={-120} width={220} height={240} rx={22} fill="#fff" stroke={INK} strokeWidth={10} />
      <path d="M -110 -60 L -110 -98 Q -110 -120 -88 -120 L 88 -120 Q 110 -120 110 -98 L 110 -60 Z" fill={RED} stroke={INK} strokeWidth={10} strokeLinejoin="round" />
      <rect x={-62} y={-148} width={20} height={50} rx={10} fill="#9AA3AB" stroke={INK} strokeWidth={7} />
      <rect x={42} y={-148} width={20} height={50} rx={10} fill="#9AA3AB" stroke={INK} strokeWidth={7} />
      <text x={0} y={-74} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={34} fill="#fff">
        MONTH
      </text>
      <text x={0} y={70} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={118} fill={INK}>
        {n}
      </text>
    </g>
  );
const CAM2: CamKey[] = [
  {t: C_DEEP, x: 1590, y: 3310, k: 0.82},
  {t: 9.0, x: 1600, y: 3335, k: 0.86},
  {t: C_SURF2, x: 1602, y: 3338, k: 0.865},
];
const portSandwich = (n: string, f: FaceSt, dx = 0, dy = 0) => (
  <div style={{position: 'absolute', left: PORT.r + dx, top: PORT.r + 62 + dy}}>
    <Food n={n} x={0} y={0} s={0.55} f={f} />
  </div>
);
const DeepScene: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(t, CAM2);
  // the hook drops in, catches, the sub is yanked up on "up"
  const hookTop = cam.y - 960 / cam.k - 300;
  const hatch0 = hookAt(subPt(SUB_FLOOR, LIFT.x, LIFT.y));
  const yank = 2600 * easeInCubic(prog(t, T.up - 0.02, T.up + 0.22));
  const rig: Rig = {...SUB_FLOOR, y: SUB_FLOOR.y - yank, rot: SUB_FLOOR.rot * (1 - prog(t, T.up, T.up + 0.1))};
  const eyeW = subPt(rig, LIFT.x, LIFT.y);
  const hk = hookAt(eyeW);
  const drop = easeInCubic(prog(t, T.they, T.haul));
  const hookY = t < T.haul ? lerp(hookTop, hatch0.y, drop) : hk.y;
  const hookX = t < T.haul ? hatch0.x : hk.x;
  const sleepy: FaceSt = {lid: 1, mouth: 'sleep', brow: 0.5};
  const woke: FaceSt = {open: 1.1, look: [0, -1], mouth: 'o', brow: 0.85};
  const face = t < T.haul ? sleepy : woke;
  const tug = t > T.haul && t < T.up ? 6 * spring(t - T.haul, 4, 6) : 0;
  const mud: Puff[] = [];
  const u = (t - T.up) / 0.8;
  if (u > 0 && u < 1)
    for (let i = 0; i < 9; i++) {
      const a = Math.PI + (i / 8) * Math.PI;
      const d = 300 * (0.4 + 1.2 * easeOutCubic(u)) * (0.7 + 0.5 * rnd(i + 5));
      mud.push({x: 1560 + Math.cos(a) * d * 1.6, y: FLOOR - 40 + Math.sin(a) * d * 0.4 - 60 * u, r: 70 * (0.7 + 0.5 * rnd(i + 20)) * Math.sin(Math.PI * Math.min(1, u * 1.15))});
    }
  const cal = popOut(t, T.ten + 0.05, T.they - 0.1, 0.25);
  const month = Math.max(1, Math.min(10, 1 + Math.floor(9 * easeInOutCubic(prog(t, 7.95, 8.75)))));
  const title = popOut(t, T.ten, T.they - 0.1, 0.25);
  return (
    <AbsoluteFill>
      <DeepPlate cam={cam} />
      <World cam={cam}>
        <Svg cx={1560} cy={3300} r={3000}>
          <Snow t={t} cx={1560} cy={3300} />
          {t > T.they ? (
            <g>
              <Cable pts={[[hookX, hookTop - 2000], [hookX, hookY - 50]]} w={12} />
              <Hook x={hookX} y={hookY + tug} s={1.5} />
            </g>
          ) : null}
        </Svg>
        <SubRig rig={{...rig, y: rig.y + tug}} port={portSandwich('sw_soggy', face)} />
        <Svg cx={1560} cy={3300} r={3000}>
          <LiftEye p={{x: eyeW.x, y: eyeW.y + tug}} />
        </Svg>
        <Svg cx={1560} cy={FLOOR} r={2600}>
          <MudFront x0={-400} x1={3600} />
          <PuffCluster puffs={mud} fill="#8B7B66" ink={6} />
          {t < T.they ? <Zzz t={t} t0={7.9} x={subPt(SUB_FLOOR, PORT.x, PORT.y).x + 60} y={subPt(SUB_FLOOR, PORT.x, PORT.y).y - 100} size={90} /> : null}
        </Svg>
      </World>
      <AbsoluteFill>
        <svg width={1080} height={1920}>
          <Txt x={540} y={300} size={94} s={title} text="10 MONTHS LATER" fill={YEL} sw={0.22} />
          <Calendar x={540} y={560} s={cal} n={month} />
        </svg>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ======================================================================================================
// SHOT 3 - back at the surface: the sub bursts up, the soggy sandwich pops up "almost fresh", "Cold, right?"
// ======================================================================================================
// wide (the sub bursts up, the guy hauls) -> cut on "Almost" to a close-up of the hatch with the guy in the foreground
const SUB3 = {x: PUL.x - LIFT.x, y: 1300};
const HATCH3 = {x: SUB3.x + HATCH.x, y: SUB3.y + HATCH.y};
const C_CLOSE = 10.0;
const CAM3: CamKey[] = [
  {t: C_SURF2, x: 1760, y: 1840, k: 0.6},
  {t: C_CLOSE, x: 1765, y: 1845, k: 0.605},
  {t: C_CLOSE + 0.001, x: HATCH3.x - 160 / 1.15, y: HATCH3.y - 20 / 1.15, k: 1.15, ease: 'cut'},
  {t: C_LAB, x: HATCH3.x - 160 / 1.2 + 10, y: HATCH3.y - 20 / 1.2 + 6, k: 1.2},
];
const GUY3_X = 1090;
const RISE1 = C_SURF2 + 0.42;
const SW3 = 0.75;
const Thermo: React.FC<{x: number; y: number; s: number; level?: number}> = ({x, y, s, level = 0.22}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-17} y={-190} width={34} height={200} rx={17} fill="#fff" stroke={INK} strokeWidth={9} />
      <rect x={-7} y={-180 + 170 * (1 - level)} width={14} height={180 - 170 * (1 - level)} rx={7} fill="#4AA3FF" />
      <circle cx={0} cy={28} r={30} fill="#4AA3FF" stroke={INK} strokeWidth={9} />
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1={17} x2={34} y1={-150 + i * 40} y2={-150 + i * 40} stroke={INK} strokeWidth={6} strokeLinecap="round" />
      ))}
    </g>
  );
const Snowflake: React.FC<{x: number; y: number; r: number; rot?: number}> = ({x, y, r, rot = 0}) =>
  r <= 0.5 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={i} transform={`rotate(${i * 60})`}>
          <path d={`M 0 0 L 0 ${-r} M 0 ${-r * 0.55} L ${-r * 0.28} ${-r * 0.8} M 0 ${-r * 0.55} L ${r * 0.28} ${-r * 0.8}`} stroke={INK} strokeWidth={r * 0.32} strokeLinecap="round" fill="none" />
        </g>
      ))}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={`w${i}`} transform={`rotate(${i * 60})`}>
          <path d={`M 0 0 L 0 ${-r} M 0 ${-r * 0.55} L ${-r * 0.28} ${-r * 0.8} M 0 ${-r * 0.55} L ${r * 0.28} ${-r * 0.8}`} stroke="#E8F7FF" strokeWidth={r * 0.15} strokeLinecap="round" fill="none" />
        </g>
      ))}
    </g>
  );
const Fish: React.FC<{x: number; y: number; rot: number; s?: number}> = ({x, y, rot, s = 1}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M 40 0 L 80 -34 L 80 34 Z" fill="#FF9A3C" stroke={INK} strokeWidth={8} strokeLinejoin="round" />
    <ellipse cx={0} cy={0} rx={58} ry={34} fill="#FF9A3C" stroke={INK} strokeWidth={8} />
    <circle cx={-26} cy={-8} r={9} fill={INK} />
    <circle cx={-29} cy={-11} r={3} fill="#fff" />
  </g>
);
const RecoverScene: React.FC<{t: number; cam?: Cam; still?: boolean}> = ({t, cam: camOver, still}) => {
  const cam = camOver ?? camAt(t, CAM3);
  const close = t >= C_CLOSE;
  // the sub bursts up out of the sea and swings into the hanging position
  const r1 = prog(t, C_SURF2, RISE1);
  const dy = t < RISE1 ? lerp(1250, -60, easeOutCubic(r1)) : -60 * Math.exp(-(t - RISE1) * 5) * Math.cos(2 * Math.PI * 1.4 * (t - RISE1));
  const rig: Rig = {x: SUB3.x, y: SUB3.y + dy, rot: 2.5 * Math.sin(2 * Math.PI * 0.6 * (t - C_SURF2)) * Math.exp(-(t - C_SURF2) * 0.8)};
  const eyeW = subPt(rig, LIFT.x, LIFT.y);
  const hookP = hookAt(eyeW);
  const hatchW = subPt(rig, HATCH.x, HATCH.y);
  // the guy on the deck hauls the rope (wide shot only)
  let guy: React.ReactNode = null;
  let rope: React.ReactNode = null;
  if (!close) {
    const pull = 0.5 + 0.5 * Math.sin(2 * Math.PI * 2.4 * (t - C_SURF2));
    const lean = -3 - 4 * pull * (t < RISE1 + 0.2 ? 1 : 0.3);
    guy = <Guy p="haul" x={GUY3_X} y={DECK} rot={lean} />;
    const fist = guyPt('haul', GUY3_X, DECK, ...(SPR.haul.fist as unknown as [number, number]));
    rope = <Cable pts={[[fist.x, fist.y], [PUL.x - PUL.r * 0.7, PUL.y + PUL.r * 0.6]]} w={8} />;
  }
  // the soggy sandwich rises out of the hatch, wakes up on "fresh", shivers on "Cold"
  const rise = easeOutBack(prog(t, T.almost + 0.05, T.almost + 0.38), 1.6);
  const swY = lerp(HATCH.y + 330, HATCH.y + 52, clamp(rise, 0, 1.2));
  const awake = t > T.fresh;
  const f: FaceSt =
    t < T.fresh
      ? {lid: 1, mouth: 'sleep'}
      : t < T.cold
        ? {open: 1 + 0.25 * spring(t - T.fresh, 3, 5), look: [-0.6, 0.2], mouth: 'grin', brow: 0.7}
        : {look: [-0.7, 0.2], mouth: 'wavy', brow: 0.6, browTilt: -0.6};
  const [shx, shy] = t > T.cold + 0.06 ? tremble(t, 3.6) : [0, 0];
  const occupant = t > T.almost ? <Food n="sw_soggy" x={HATCH.x + 10 + shx} y={swY + shy} s={SW3} f={f} /> : null;
  const sparkle = awake ? popOut(t, T.fresh, T.cold - 0.05, 0.25) : 0;
  const swW = subPt(rig, HATCH.x + 10, HATCH.y - 80);
  // water pouring off the hull + drips
  const streams =
    t > C_SURF2 && t < 11.0 ? (
      <g>
        {[0.12, 0.3, 0.52, 0.7, 0.86].map((fx, i) => {
          const p0 = subPt(rig, 80 + fx * 1100, 700 + 60 * Math.sin(fx * 7));
          const w = 22 * (1 - prog(t, RISE1, 11.0)) * (0.7 + 0.5 * rnd(i));
          if (w < 1) return null;
          return <path key={i} d={`M ${p0.x} ${p0.y} L ${p0.x + 6} ${WATER}`} stroke={DROP} strokeWidth={w} strokeLinecap="round" opacity={0.95} />;
        })}
      </g>
    ) : null;
  const drips =
    t > RISE1 ? (
      <g>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const p0 = subPt(rig, 200 + i * 170, 760 + 30 * Math.sin(i));
          const tau = (t - RISE1 - i * 0.13) % 0.7;
          if (t - RISE1 - i * 0.13 < 0) return null;
          const y = p0.y + 0.5 * 3000 * tau * tau;
          if (y > WATER) return null;
          return <path key={i} d={`M ${p0.x} ${y - 22} Q ${p0.x + 12} ${y} ${p0.x} ${y + 12} Q ${p0.x - 12} ${y} ${p0.x} ${y - 22} Z`} fill={DROP} stroke={INK} strokeWidth={4} />;
        })}
      </g>
    ) : null;
  // a fish flops out of the hatch and back into the sea (wide shot)
  const fu = prog(t, 9.62, 10.0);
  const fish =
    fu > 0 && fu < 1 ? (
      <Fish x={lerp(hatchW.x + 40, hatchW.x + 560, fu)} y={hatchW.y - 60 - 520 * Math.sin(Math.PI * fu) + 900 * fu * fu} rot={-30 + 260 * fu} s={1.1} />
    ) : null;
  const flake = pop(t, T.cold + 0.06, 0.3) * (t < C_LAB - 0.1 ? 1 : 0);
  // drops on the sandwich itself (close-up): little drips fall off its crust
  const swDrips =
    close && t > T.almost + 0.3 ? (
      <g>
        {[0, 1].map((i) => {
          const tau = (t - T.almost - 0.3 - i * 0.35) % 0.75;
          if (t - T.almost - 0.3 - i * 0.35 < 0) return null;
          const x = swW.x - 90 + i * 190;
          const y = swW.y + 120 + 0.5 * 2600 * tau * tau;
          return <path key={i} d={`M ${x} ${y - 18} Q ${x + 10} ${y} ${x} ${y + 10} Q ${x - 10} ${y} ${x} ${y - 18} Z`} fill={DROP} stroke={INK} strokeWidth={3.5} />;
        })}
      </g>
    ) : null;
  const foam: Puff[] = foamPuffs(t, C_SURF2 + 0.02, 2050, WATER, 1400, 14, 41);
  // the guy in the foreground of the close-up (screen space): pops up gasping, then asks "Cold, right?" with a thermometer
  let fg: React.ReactNode = null;
  if (close && t > 10.4) {
    const T_ASK = 11.16;
    const enter = easeOutBack(prog(t, 10.4, 10.66), 1.4);
    const oy = lerp(520, 0, clamp(enter, 0, 1.2));
    if (t < T_ASK) {
      const [sx, sy] = squashSwap(t, 10.5);
      const [tx] = tremble(t, 1.4);
      fg = <Spr n="wow" x={250 + tx} y={2075 + oy} s={1.07} sx={-sx} sy={sy * breathe(t)} />;
    } else {
      const [sx, sy] = squashSwap(t, T_ASK);
      const s = 1.21;
      const sp = S('ask');
      const fist = SPR.ask.fist as unknown as [number, number];
      const fx = 215 + (fist[0] - 22 - sp.feet[0]) * s;
      const fy = 2075 + (fist[1] - sp.feet[1]) * s;
      fg = (
        <>
          <Spr n="ask" x={215} y={2075} s={s} sx={sx} sy={sy * breathe(t)} />
          <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
            <Thermo x={fx} y={fy - 30} s={pop(t, T_ASK + 0.04, 0.25) * 1.25} level={0.22} />
          </svg>
        </>
      );
    }
  }
  return (
    <AbsoluteFill>
      <SeaPlate cam={cam} />
      <World cam={cam}>
        <Svg cx={1800} cy={1600} r={3000}>
          <Cable pts={[[PUL.x, PUL.y + PUL.r * 0.6], [hookP.x, hookP.y - 50]]} w={11} />
          {rope}
          <Hook x={hookP.x} y={hookP.y} s={1.5} />
        </Svg>
        <SubRig rig={rig} occupant={occupant} />
        <Svg cx={1800} cy={1600} r={3000}>
          <LiftEye p={eyeW} />
        </Svg>
        {guy}
        <Svg cx={1800} cy={1600} r={3000}>
          {streams}
          {drips}
          {swDrips}
          {fish}
          <Sparkles x={swW.x} y={swW.y - 30} s={sparkle} t={t} size={1.25} />
          <Snowflake x={swW.x + 230} y={swW.y - 230 + 20 * Math.sin(t * 3)} r={60 * flake} rot={t * 40} />
        </Svg>
        <WaterFront t={t} />
        <Svg cx={1800} cy={WATER} r={2600}>
          <PuffCluster puffs={foam} fill={FOAM} ink={6} />
          {still ? null : splashDrops(t, C_SURF2 + 0.02, 1650, 2650, WATER, 28, 21, 1.2)}
          {splashDrops(t, 9.98, hatchW.x + 500, hatchW.x + 600, WATER, 8, 61, 0.55)}
        </Svg>
      </World>
      <AbsoluteFill>{fg}</AbsoluteFill>
    </AbsoluteFill>
  );
};

// ======================================================================================================
// SHOT 4 - BUT: a lab fridge just as cold; germs eat a fresh sandwich up to 100x faster
// ======================================================================================================
const CAM4: CamKey[] = [
  {t: C_LAB, x: 0, y: -40, k: 0.95},
  {t: T.fridge, x: 0, y: -40, k: 0.95},
  {t: 13.75, x: 25, y: 110, k: 1.45},
  {t: C_DEEP2, x: 28, y: 112, k: 1.5},
];
const SW_LAB = {x: 20, y: 230, s: 0.95};
const GERMS: [number, number, number, number][] = [
  // sprite px on the sandwich (x, y), radius (world), phase
  [70, 24, 30, 0.2],
  [175, 6, 34, 1.4],
  [282, 22, 30, 2.6],
  [330, 98, 26, 0.9],
  [24, 112, 26, 3.1],
  [300, 178, 28, 1.9],
  [118, 196, 28, 4.2],
];
const fridgeAngle = (t: number) => (Math.PI / 180) * 102 * easeOutCubic(prog(t, T.fridge, T.fridge + 0.36));
const FridgeDoor: React.FC<{t: number}> = ({t}) => {
  const c = Math.cos(fridgeAngle(t));
  const W = 860;
  const L = -430;
  return c > 0 ? (
    <g>
      <rect x={L} y={-420} width={W * c} height={1180} rx={Math.min(46, 46 * c + 4)} fill={c > 0.98 ? '#F4F7FA' : '#E4EAF0'} stroke={INK} strokeWidth={12} />
      <rect x={L + W * c * 0.86 - 14} y={-300} width={28} height={300} rx={14} fill="#B8C3CC" stroke={INK} strokeWidth={8} />
    </g>
  ) : (
    <g>
      <rect x={L + W * c} y={-430} width={-W * c} height={1200} rx={30} fill="#DCE4EA" stroke={INK} strokeWidth={12} />
      {[-200, 120, 420].map((y) => (
        <rect key={y} x={L + W * c + 18} y={y} width={-W * c - 36} height={20} rx={8} fill="#C3D0DA" stroke={INK} strokeWidth={6} />
      ))}
    </g>
  );
};
const Fridge: React.FC<{t: number}> = ({t}) => {
  const th = fridgeAngle(t);
  const W = 860;
  const L = -430;
  const glow = clamp(th / 1.2);
  return (
    <g>
      {/* body */}
      <rect x={L} y={-880} width={W} height={1640} rx={60} fill="#F4F7FA" stroke={INK} strokeWidth={12} />
      <line x1={L} x2={L + W} y1={-430} y2={-430} stroke={INK} strokeWidth={12} />
      <rect x={L + W * 0.86 - 14} y={-800} width={28} height={250} rx={14} fill="#B8C3CC" stroke={INK} strokeWidth={8} />
      {/* interior */}
      <rect x={L + 34} y={-396} width={W - 68} height={1120} rx={26} fill="#E6F6FF" stroke={INK} strokeWidth={8} />
      <ellipse cx={0} cy={-330} rx={360} ry={160} fill="#FFFBE0" opacity={0.55 * glow} />
      <rect x={-60} y={-380} width={120} height={34} rx={14} fill="#FFF4B0" stroke={INK} strokeWidth={6} />
      {[-110, 230, 520].map((y) => (
        <rect key={y} x={L + 34} y={y} width={W - 68} height={22} rx={8} fill="#CFE3EF" stroke={INK} strokeWidth={7} />
      ))}
      <Thermo x={300} y={-150} s={0.85} level={0.22} />
      <Snowflake x={300} y={-330} r={40} rot={10} />
    </g>
  );
};
const LabScene: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(t, CAM4);
  const rotten = t >= T.faster;
  const [sx, sy] = squashSwap(t, T.faster);
  const fast = t > T.hundred;
  const rate = !fast ? 5 : 14;
  const swF: FaceSt =
    t < T.germs
      ? {look: [0.4, -0.2], mouth: 'smile'}
      : !rotten
        ? {look: [Math.sin(t * 6) * 0.8, 0.3], mouth: 'o', open: 1.1, brow: 0.6, browTilt: -0.6}
        : {squeeze: true, mouth: 'wavy', brow: 0.7};
  const sp = S(rotten ? 'sw_rotten' : 'sw_fresh');
  const germs = GERMS.map(([gx, gy, r, ph], i) => {
    const s = pop(t, T.germs + i * 0.05, 0.25) * (rotten ? 1 + 0.22 * easeOutCubic(prog(t, T.faster, T.faster + 0.3)) : 1);
    const chomp = 0.5 + 0.5 * Math.sin(2 * Math.PI * rate * (t - T.germs) + ph * 2);
    const jit = fast && !rotten ? 3 * Math.sin(2 * Math.PI * 23 * t + ph) : 0;
    const x = SW_LAB.x + (gx - sp.feet[0]) * SW_LAB.s + jit;
    const y = SW_LAB.y + (gy - sp.feet[1]) * SW_LAB.s;
    return <Germ key={i} x={x} y={y} r={r} ph={ph} chomp={t > T.eat ? chomp : 0.2} s={s} eye={rotten ? 0.1 : 1} />;
  });
  const stinkU = prog(t, T.faster + 0.05, T.faster + 0.9);
  const stink: Puff[] =
    rotten && stinkU < 1
      ? [0, 1, 2, 3, 4, 5].map((i) => ({x: SW_LAB.x - 150 + i * 60, y: SW_LAB.y - 200 - 120 * stinkU - 30 * rnd(i), r: 50 * Math.sin(Math.PI * stinkU) * (0.7 + 0.5 * rnd(i + 5))}))
      : [];
  return (
    <AbsoluteFill style={{background: '#E3EBF1'}}>
      <World cam={cam}>
        <Svg cx={0} cy={0} r={4000}>
          <rect x={-4000} y={-4000} width={8000} height={4760} fill="#E3EBF1" />
          {[-700, -350, 0, 350].map((y) => (
            <line key={y} x1={-4000} x2={4000} y1={y} y2={y} stroke="#D3DEE6" strokeWidth={10} />
          ))}
          <rect x={-4000} y={760} width={8000} height={3000} fill="#BAC7D1" />
          <line x1={-4000} x2={4000} y1={760} y2={760} stroke={INK} strokeWidth={10} />
          <Fridge t={t} />
        </Svg>
        <Food n={rotten ? 'sw_rotten' : 'sw_fresh'} x={SW_LAB.x} y={SW_LAB.y} s={SW_LAB.s} sx={sx} sy={sy} f={swF} />
        <Svg cx={0} cy={0} r={4000}>
          {germs}
          <PuffCluster puffs={stink} fill="#A9C25A" ink={6} />
          <FridgeDoor t={t} />
          {rotten
            ? [0, 1, 2].map((i) => {
                const u = ((t - T.faster) * 0.9 + i * 0.33) % 1;
                const x = SW_LAB.x - 110 + i * 110;
                const y = SW_LAB.y - 220 - 160 * u;
                return <path key={i} d={`M ${x} ${y} q 22 -26 0 -52 t 0 -52`} fill="none" stroke="#5E8C3A" strokeWidth={10} strokeLinecap="round" opacity={Math.sin(Math.PI * u)} />;
              })
            : null}
        </Svg>
      </World>
    </AbsoluteFill>
  );
};
const Times100: React.FC<{t: number}> = ({t}) => {
  const s = pop(t, T.hundred - 0.04, 0.3);
  if (s <= 0.001) return null;
  const n = Math.max(1, Math.round(100 * easeOutCubic(prog(t, T.hundred, T.hundred + 0.42))));
  const wob = 1 + 0.04 * Math.sin(2 * Math.PI * 3 * t);
  const pts = Array.from({length: 24}).map((_, i) => {
    const a = (i / 24) * Math.PI * 2;
    const r = i % 2 ? 150 : 185;
    return `${Math.cos(a) * r},${Math.sin(a) * r}`;
  });
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
      <g transform={`translate(285 330) rotate(-8) scale(${s * wob})`}>
        <polygon points={pts.join(' ')} fill={RED} stroke={INK} strokeWidth={12} strokeLinejoin="round" />
        <text x={0} y={-58} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={44} fill="#fff" stroke={INK} strokeWidth={9} paintOrder="stroke">
          UP TO
        </text>
        <text x={0} y={52} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={104} fill="#fff" stroke={INK} strokeWidth={16} paintOrder="stroke">
          {`×${n}`}
        </text>
      </g>
    </svg>
  );
};

// ======================================================================================================
// SHOT 5 - the deep again: arrows of crushing pressure; in a magnifier the germs get squashed, slow down, fall asleep
// ======================================================================================================
const CAM5: CamKey[] = [
  {t: C_DEEP2, x: 1560, y: 2900, k: 0.5},
  {t: 17.6, x: 1570, y: 2950, k: 0.52},
  {t: C_DECK, x: 1600, y: 3050, k: 0.56},
];
const Arrow: React.FC<{x: number; y: number; s: number; sy?: number}> = ({x, y, s, sy = 1}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) scale(${s} ${s * sy})`}>
      <path d="M -60 -560 L 60 -560 L 60 -200 L 150 -200 L 0 0 L -150 -200 L -60 -200 Z" fill="#fff" stroke={INK} strokeWidth={16} strokeLinejoin="round" />
      <path d="M -30 -530 L -30 -230" stroke="#C9E6FA" strokeWidth={18} strokeLinecap="round" />
    </g>
  );
const PressureScene: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(t, CAM5);
  const slam = (t0: number) => (t < t0 ? 0 : 1);
  const hit = (t0: number) => (t > t0 ? spring(t - t0, 3, 6) : 0);
  const ss = 0.05 * (hit(T.crushing + 0.12) + hit(T.pressure + 0.1));
  const rig: Rig = {...SUB_FLOOR, sy: 1 - ss, sx: 1 + ss * 0.6};
  const subTop = SUB_FLOOR.y + 80;
  const arrows = [1150, 1560, 1970].map((x, i) => {
    const t0 = T.crushing - 0.12 + i * 0.05;
    const u = easeInCubic(prog(t, t0, t0 + 0.16));
    const push = t > T.pressure - 0.1 ? 50 * Math.max(0, Math.sin(Math.PI * prog(t, T.pressure - 0.1, T.pressure + 0.25))) : 0;
    const y = lerp(subTop - 1800, subTop - 40, u) + push + (slam(t0 + 0.16) ? -10 * hit(t0 + 0.16) : 0);
    const s = t < 18.0 ? 1 : Math.max(0, 1 - easeInCubic(prog(t, 18.0, 18.3)));
    return <Arrow key={i} x={x} y={y} s={s} sy={1 - 0.15 * hit(t0 + 0.16)} />;
  });
  const sleepy: FaceSt = {lid: 0.65, mouth: 'sleep', brow: 0.5};
  return (
    <AbsoluteFill>
      <DeepPlate cam={cam} />
      <World cam={cam}>
        <Svg cx={1560} cy={3300} r={3200}>
          <Snow t={t} cx={1560} cy={3300} />
          {arrows}
        </Svg>
        <SubRig rig={rig} port={portSandwich('sw_soggy', sleepy)} />
        <Svg cx={1560} cy={FLOOR} r={2600}>
          <MudFront x0={-400} x1={3600} />
        </Svg>
      </World>
      <Magnifier t={t} cam={cam} />
    </AbsoluteFill>
  );
};
// the magnifier: a big round inset over the porthole with the soggy sandwich + germs (screen space)
const MAG = {x: 540, y: 700, r: 360};
const chompPhase = (tt: number) => {
  // chomps per second: 3.2 until "slows", then eases down to 0.35 over 0.6 s (integrated so the phase never jumps)
  const t0 = 17.62;
  if (tt < T.slows) return 3.2 * (tt - t0);
  const k = 0.6;
  const x = Math.min(tt - T.slows, k);
  let acc = 0;
  const n = 12;
  for (let i = 0; i < n; i++) {
    const a = (x * i) / n;
    const b = (x * (i + 1)) / n;
    acc += ((lerp(3.2, 0.35, easeOutCubic(a / k)) + lerp(3.2, 0.35, easeOutCubic(b / k))) / 2) * (b - a);
  }
  return 3.2 * (T.slows - t0) + acc + Math.max(0, tt - T.slows - k) * 0.35;
};
const Magnifier: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const s = pop(t, 17.62, 0.32);
  if (s <= 0.001) return null;
  const portW = subPt(SUB_FLOOR, PORT.x, PORT.y);
  const px = 540 + (portW.x - cam.x) * cam.k;
  const py = 960 + (portW.y - cam.y) * cam.k;
  const squash = 1 - 0.38 * easeOutCubic(prog(t, 17.82, 18.05)) + 0.06 * (t > 17.82 ? spring(t - 17.82, 3, 5) : 0);
  const ph = chompPhase(t);
  const eye = t < T.even ? lerp(1, 0.55, easeOutCubic(prog(t, T.slows, T.slows + 0.5))) : Math.max(0, lerp(0.55, 0, easeInOutCubic(prog(t, T.even + 0.3, T.more + 0.5))));
  const yawnU = prog(t, T.even, T.even + 0.9);
  const yawn = yawnU > 0 && yawnU < 1 ? Math.sin(Math.PI * yawnU) : 0;
  const sp = S('sw_soggy');
  const SWS = 1.05;
  const R = MAG.r;
  // local coordinates inside the circle div: (0,0) = top-left of the circle box
  const cx = R;
  const cy = R + 90;
  const G5: [number, number, number][] = [
    [80, 52, 0.3],
    [180, 40, 1.7],
    [276, 50, 2.9],
    [40, 170, 4.1],
    [312, 176, 0.8],
  ];
  const germs = G5.map(([gx, gy, gph], i) => {
    const chomp = 0.5 + 0.5 * Math.sin(2 * Math.PI * ph + gph * 2);
    return <Germ key={i} x={cx + (gx - sp.feet[0]) * SWS} y={cy + (gy - sp.feet[1]) * SWS - 10} r={38} ph={gph} chomp={chomp} eye={eye} sq={squash} yawn={i % 2 === 0 ? yawn : yawn * 0.7} />;
  });
  const sleeping = t > T.more + 0.2;
  const ang = Math.atan2(py - MAG.y, px - MAG.x);
  const tip = {x: MAG.x + Math.cos(ang) * (R + 80), y: MAG.y + Math.sin(ang) * (R + 80)};
  const b1 = {x: MAG.x + Math.cos(ang - 0.2) * R, y: MAG.y + Math.sin(ang - 0.2) * R};
  const b2 = {x: MAG.x + Math.cos(ang + 0.2) * R, y: MAG.y + Math.sin(ang + 0.2) * R};
  const arrows = [cx - 150, cx, cx + 150].map((x, i) => {
    const u = easeInCubic(prog(t, 17.66 + i * 0.04, 17.82 + i * 0.04));
    const y = lerp(-200, cy - 270, u);
    const s2 = t < 18.2 ? 0.42 : Math.max(0, 0.42 * (1 - prog(t, 18.2, 18.45)));
    return <Arrow key={i} x={x} y={y} s={s2} />;
  });
  return (
    <AbsoluteFill style={{transform: `scale(${s})`, transformOrigin: `${MAG.x}px ${MAG.y}px`}}>
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
        <path d={`M ${b1.x} ${b1.y} L ${tip.x} ${tip.y} L ${b2.x} ${b2.y} Z`} fill="#fff" stroke={INK} strokeWidth={14} strokeLinejoin="round" />
        <circle cx={MAG.x} cy={MAG.y} r={R + 12} fill="#fff" stroke={INK} strokeWidth={14} />
      </svg>
      <div style={{position: 'absolute', left: MAG.x - R, top: MAG.y - R, width: 2 * R, height: 2 * R, borderRadius: '50%', overflow: 'hidden', background: '#173D60'}}>
        <Food n="sw_soggy" x={cx} y={cy} s={SWS} f={{lid: sleeping ? 1 : 0.45, mouth: 'sleep', brow: 0.5}} />
        <svg width={2 * R} height={2 * R} style={{position: 'absolute', left: 0, top: 0}}>
          {germs}
          {arrows}
          <circle cx={R} cy={R} r={R} fill="rgba(80,160,230,0.12)" />
        </svg>
      </div>
      <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0}}>
        <circle cx={MAG.x} cy={MAG.y} r={R} fill="none" stroke={INK} strokeWidth={14} />
        <path d={`M ${MAG.x - R * 0.62} ${MAG.y - R * 0.42} A ${R * 0.78} ${R * 0.78} 0 0 1 ${MAG.x - R * 0.2} ${MAG.y - R * 0.74}`} fill="none" stroke="#fff" strokeWidth={16} strokeLinecap="round" opacity={0.8} />
        {t > T.more - 0.1 ? <Zzz t={t} t0={T.more - 0.1} x={MAG.x + 150} y={MAG.y - 120} size={70} /> : null}
      </svg>
    </AbsoluteFill>
  );
};

// ======================================================================================================
// SHOT 6 - So: on the deck the guy smugly lowers a lunchbox on a line into the sea
// ======================================================================================================
const CAM6: CamKey[] = [
  {t: C_DECK, x: 1340, y: 2060, k: 1.0},
  {t: 21.1, x: 1350, y: 2080, k: 1.0},
  {t: 22.4, x: 1370, y: 2200, k: 1.02},
  {t: DURATION, x: 1372, y: 2215, k: 1.03},
];
const GUY6_X = 1222;
const LB_S = 0.6;
const DeckScene: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(t, CAM6);
  const [sx, sy] = squashSwap(t, C_DECK + 0.02);
  const nod = t > T.purpose && t < T.purpose + 0.4 ? 10 * Math.sin(Math.PI * prog(t, T.purpose, T.purpose + 0.4)) : 0;
  const fist = guyPt('smug', GUY6_X, DECK, ...(SPR.smug.fist as unknown as [number, number]));
  const lb = S('lunchbox');
  const hOff = (lb.feet[1] - (SPR.lunchbox.handleTop as unknown as [number, number])[1]) * LB_S; // handle top -> box bottom
  const L0 = 90;
  const Ltouch = WATER - hOff - fist.y;
  const L =
    t < T.sinking
      ? L0
      : t < T.lunch
        ? lerp(L0, Ltouch, easeInCubic(prog(t, T.sinking, T.lunch)))
        : Ltouch + 330 * easeOutCubic(prog(t, T.lunch, T.end + 0.3));
  const swing = 4 * Math.sin(2 * Math.PI * 0.8 * (t - C_DECK)) * (t < T.lunch ? 1 : 0.3);
  const bx = fist.x + Math.sin((swing * Math.PI) / 180) * L;
  const by = fist.y + L;
  const under = t > T.lunch;
  const f: FaceSt = t < T.sinking ? {look: [0, 0.7], mouth: 'grin'} : t < T.lunch ? {look: [0, 1], mouth: 'o', open: 1.1} : t < T.lunch + 0.3 ? {squeeze: true, mouth: 'grin'} : {look: [-0.5, -0.8], mouth: 'smile'};
  const splash = t > T.lunch ? (
    <g>
      {splashDrops(t, T.lunch, bx - 90, bx + 90, WATER, 12, 77, 0.6)}
      {[0, 1].map((i) => {
        const u = clamp((t - T.lunch - i * 0.25) / 0.9);
        if (u <= 0 || u >= 1) return null;
        return <ellipse key={i} cx={bx} cy={WATER + 6} rx={90 + 260 * u} ry={14 + 8 * u} fill="none" stroke="#fff" strokeWidth={7} opacity={1 - u} />;
      })}
    </g>
  ) : null;
  const twinkle = popOut(t, T.purpose, DURATION + 1, 0.25);
  const face = guyPt('smug', GUY6_X, DECK, 190, 140);
  return (
    <AbsoluteFill>
      <SeaPlate cam={cam} />
      <World cam={cam}>
        <Svg cx={1800} cy={1600} r={3000}>
          <Cable pts={[[PUL.x, PUL.y + PUL.r * 0.6], [PUL.x, 1420]]} w={11} />
          <Hook x={PUL.x} y={1470} s={1.5} />
          <path d={`M ${fist.x} ${fist.y} L ${bx} ${by}`} stroke="#F2EEE6" strokeWidth={10} strokeLinecap="round" />
          <path d={`M ${fist.x} ${fist.y} L ${bx} ${by}`} stroke={INK} strokeWidth={4} strokeLinecap="round" opacity={0.6} />
        </Svg>
        <Guy p="smug" x={GUY6_X} y={DECK - nod * 0.4} sx={sx} sy={sy * breathe(t)} />
        <Food n="lunchbox" x={bx} y={by + hOff} s={LB_S} rot={swing} f={f} />
        <Svg cx={1800} cy={1600} r={3000}>
          <Sparkles x={face.x + 40} y={face.y - 20} s={twinkle} t={t} size={0.7} />
        </Svg>
        <WaterFront t={t} />
        <Svg cx={1800} cy={WATER} r={2600}>
          {splash}
          {under ? <Bubbles t={t} t0={T.lunch + 0.1} t1={DURATION} x={bx} y={by + hOff * 0.5} w={140} n={10} seed={91} rise={420} /> : null}
        </Svg>
      </World>
    </AbsoluteFill>
  );
};

// ======================================================================================================
// sound cues (new ElevenLabs sfx + library) and the composition
// ======================================================================================================
const CUES: Cue[] = [
  {f: 'beach_bed', at: 0, db: -32},
  {f: 'beach_bed', at: 5.9, db: -32, keys: [[5.9, -32], [7.2, -32], [7.6, -70]]},
  {f: 'twinkle', at: T.sandwich, db: -27},
  {f: 'rope_creak', at: 3.48, db: -24},
  {f: 'rope_creak', at: 3.76, db: -23},
  {f: 'cable_snap', at: T.snap, db: -14},
  {f: 'cable_snap', at: T_DROP, db: -16, rate: 1.12},
  {f: 'whoosh', at: T_DROP + 0.02, db: -28},
  {f: 'splash', at: T_ENTRY - 0.01, db: -11},
  {f: 'whoosh', at: T.jumps - 0.02, db: -25},
  {f: 'flop', at: LEAP_T1, db: -20},
  {f: 'pop', at: T.jumps + 0.42, db: -22},
  {f: 'gulp', at: T.doesnt, db: -18},
  {f: 'bubbles', at: T_UNDER - 0.04, db: -20, keys: [[T_UNDER - 0.04, -20], [7.5, -20], [7.62, -70]]},
  {f: 'deep_bed', at: C_DEEP, db: -24, keys: [[C_DEEP, -24], [9.3, -24], [9.5, -70]]},
  {f: 'snore', at: 7.9, db: -30},
  {f: 'flip', at: 7.95, db: -20},
  {f: 'ticks', at: 8.0, db: -27, keys: [[8.0, -27], [8.65, -27], [8.85, -70]]},
  {f: 'flip', at: 8.45, db: -22},
  {f: 'winch', at: T.they, db: -24},
  {f: 'clank', at: T.haul, db: -18, dur: 0.35},
  {f: 'whoosh', at: T.up - 0.03, db: -19},
  {f: 'sub_surface', at: C_SURF2 + 0.01, db: -12},
  {f: 'beach_bed', at: C_SURF2, db: -32, keys: [[C_SURF2, -32], [11.9, -32], [12.24, -70]]},
  {f: 'drip', at: 10.3, db: -23},
  {f: 'gulp', at: 10.52, db: -24, rate: 0.9},
  {f: 'splash', at: 9.98, db: -25, rate: 1.35},
  {f: 'pop', at: T.almost + 0.08, db: -24},
  {f: 'twinkle', at: T.fresh, db: -17},
  {f: 'magic', at: T.fresh + 0.04, db: -27},
  {f: 'freeze', at: T.cold + 0.04, db: -26, dur: 0.8},
  {f: 'chatter', at: T.cold + 0.08, db: -22},
  {f: 'fridge_open', at: T.fridge - 0.02, db: -15},
  {f: 'pop', at: T.germs, db: -24},
  {f: 'pop', at: T.germs + 0.1, db: -25, rate: 1.15},
  {f: 'pop', at: T.germs + 0.2, db: -25, rate: 1.3},
  {f: 'germ_frenzy', at: T.eat, db: -19},
  {f: 'ticks', at: T.hundred, db: -25, dur: 0.45},
  {f: 'germ_frenzy', at: T.hundred + 0.3, db: -17, rate: 1.25},
  {f: 'stink', at: T.faster, db: -15},
  {f: 'deep_bed', at: C_DEEP2, db: -23, keys: [[C_DEEP2, -23], [19.7, -23], [19.95, -70]]},
  {f: 'squash_down', at: T.crushing + 0.04, db: -14},
  {f: 'squash_down', at: T.pressure + 0.02, db: -15},
  {f: 'pop', at: 17.62, db: -23},
  {f: 'slowmo', at: T.slows, db: -19},
  {f: 'snore', at: T.more, db: -21},
  {f: 'beach_bed', at: C_DECK, db: -32, keys: [[C_DECK, -32], [22.9, -32], [23.45, -70]]},
  {f: 'winch', at: T.sinking, db: -26},
  {f: 'splash', at: T.lunch - 0.02, db: -16, rate: 1.25},
  {f: 'bubbles', at: T.lunch + 0.12, db: -24, keys: [[T.lunch + 0.12, -24], [23.0, -26], [23.45, -70]]},
  {f: 'twinkle', at: T.purpose, db: -22},
];

export const SunkenLunchShort: React.FC = () => {
  useSLFont();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  let scene: React.ReactNode;
  if (t < C_DEEP) scene = <SurfaceScene t={t} />;
  else if (t < C_SURF2) scene = <DeepScene t={t} />;
  else if (t < C_LAB) scene = <RecoverScene t={t} />;
  else if (t < C_DEEP2) scene = <LabScene t={t} />;
  else if (t < C_DECK) scene = <PressureScene t={t} />;
  else scene = <DeckScene t={t} />;
  return (
    <AbsoluteFill style={{background: SKY}}>
      {scene}
      {t >= C_LAB && t < C_DEEP2 ? <Times100 t={t} /> : null}
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('sunken-lunch/vo/take1.mp3')} volume={Math.pow(10, MIX_DB / 20)} />
      </Sequence>
      <Audio src={staticFile('sunken-lunch/music/bed.wav')} volume={Math.pow(10, MIX_DB / 20)} />
      <SoundCues cues={CUES.map((c) => ({...c, db: c.db + MIX_DB, keys: c.keys?.map(([kt, kd]) => [kt, kd + MIX_DB] as [number, number])}))} dir="sunken-lunch/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};
export const SL_TOTAL = Math.round(DURATION * FPS);
export {RecoverScene, SKY as SL_SKY};
