import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SPR} from './sprites';
import {CUT_F, CUT_G, DURATION, FPS, T, VO_AT} from './scene';
export {DURATION as SS_DURATION, FPS as SS_FPS} from './scene';
import {camAt, clamp, easeInCubic, easeInOutCubic, easeOutBack, easeOutCubic, lerp, pop, prog, rnd, shake, spring, type Cam, type CamKey} from '../shared/anim';
import {World} from '../shared/World';
import {Eye} from '../shared/Face';
import {PuffCluster} from '../shared/Puffs';
import {SweatDrop} from '../shared/SweatDrop';
import {SoundCues, type Cue} from '../shared/Sound';
import {useFont} from '../shared/useFont';

// "Why don't we just cover the Sahara in solar panels?" - one desert set (bg plate + code), one code jungle set.
// A: the guy (thumbs up) next to one panel, a bored camel, the Sun with a face; a thought bubble with the Earth.
// B: he points, panels pop in rows across the whole desert (camera pulls back).  C: the Sun winks, thumbs up.
// D: "But": push in - a sun ray bounces off the sand, the other one is swallowed by the dark panel (it gets eyes);
//    heat squiggles rise from every panel, the guy overheats.
// E: hot air rises, a rain cloud with a face is pulled in, rain, the sand turns green from his feet outward.
// F: "But": cut to the Amazon - the same kind of cloud is yanked away, the trees dry out (squash swaps), leaves fall.
// G: back in the green Sahara: shocked guy + camel, a thermometer pops up and boils over on "warm it up".

const F = (n: string) => staticFile(`sahara-solar/${n}.png`);
export const FONT = 'SSInter';
export const useSSFont = () => useFont(FONT, staticFile('fonts/Inter-Black.otf'));
const MIX_DB = -0.5;
const SKY = '#A4D9FD';
const SAND = '#FDD87E';
const GRASS = '#9BD45E';
const GRASS_D = '#6FB43C';
const TEXT_YEL = '#FFD23F';

// ---------- world: ground y = 0, 1 unit = 1 screen px at k = 1 ----------
const HR = 110; // guy head radius (world)
const GUY_X = -190;
const MAIN_X = 230; // the first panel (frame 0)
const PANEL_W = 300;
const CAMEL_X = 520;
const CAMEL_Y = -95;
const CAMEL_H = 270;
const SUN = {x: 300, y: -985, r: 125};
const THERMO_X = 40;
const PLATE_DEPTH = 1.25;
const HORIZON = -290; // plate-layer y of the horizon

// ---------- cameras ----------
export const CAM0: CamKey = {t: 0, x: 40, y: -400, k: 1.15};
const CAMS_A: CamKey[] = [
  CAM0,
  {t: 2.5, x: 42, y: -402, k: 1.16},
  {t: 4.7, x: 110, y: -440, k: 0.82, ease: 'io'},
  {t: T.but, x: 114, y: -442, k: 0.84},
  {t: 6.95, x: 105, y: -265, k: 1.42, ease: 'io'},
  {t: 9.3, x: 100, y: -262, k: 1.48},
  {t: 10.6, x: 0, y: -520, k: 0.8, ease: 'io'},
  {t: CUT_F, x: -15, y: -505, k: 0.83},
];
const CAMS_F: CamKey[] = [
  {t: CUT_F, x: 0, y: -430, k: 0.86},
  {t: CUT_G, x: 0, y: -405, k: 0.96},
];
const CAMS_G: CamKey[] = [
  {t: CUT_G, x: 0, y: -440, k: 0.92},
  {t: 18.9, x: 2, y: -438, k: 0.93},
  {t: 20.1, x: -20, y: -400, k: 1.12, ease: 'io'},
  {t: DURATION, x: -18, y: -402, k: 1.15},
];
export const camOf = (t: number): Cam => {
  if (t < CUT_F) return camAt(t, CAMS_A);
  if (t < CUT_G) return camAt(t, CAMS_F);
  return camAt(t, CAMS_G);
};

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

type SprName = keyof typeof SPR;
type SP = {w: number; h: number; feet: [number, number]; head?: number[]; left: number; right: number; top: number; bottom: number};
const sp = (n: SprName) => SPR[n] as unknown as SP;
const Spr: React.FC<{n: SprName; x: number; y: number; s: number; sx?: number; sy?: number; rot?: number; ax?: number; ay?: number; o?: number; filter?: string; flip?: boolean}> = ({
  n,
  x,
  y,
  s,
  sx = 1,
  sy = 1,
  rot: r = 0,
  ax,
  ay,
  o = 1,
  filter,
  flip = false,
}) => {
  const p = sp(n);
  const axx = ax ?? p.feet[0];
  const ayy = ay ?? p.feet[1];
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${r}deg) scale(${sx * (flip ? -1 : 1)}, ${sy})`, transformOrigin: '0 0', opacity: o}}>
      <Img src={F(n as string)} style={{position: 'absolute', left: -axx * s, top: -ayy * s, width: p.w * s, height: p.h * s, filter}} />
    </div>
  );
};
const Svg: React.FC<{children: React.ReactNode; r?: number}> = ({children, r = 4000}) => (
  <svg style={{position: 'absolute', left: -r, top: -r, overflow: 'visible'}} width={2 * r} height={2 * r} viewBox={`${-r} ${-r} ${2 * r} ${2 * r}`}>
    {children}
  </svg>
);
const Label: React.FC<{x: number; y: number; s: number; text: string; size?: number; rot?: number; color?: string}> = ({x, y, s, text, size = 64, rot = 0, color = TEXT_YEL}) =>
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
        color,
        WebkitTextStroke: `${size * 0.2}px #000`,
        paintOrder: 'stroke fill',
        whiteSpace: 'nowrap',
      }}
    >
      {text}
    </div>
  );

// a wavy heat squiggle (orange over a black underlay), u = 0..1 life
const Squiggle: React.FC<{x: number; y: number; len: number; u: number; w?: number; ph?: number}> = ({x, y, len, u, w = 9, ph = 0}) => {
  if (u <= 0 || u >= 1) return null;
  const life = Math.sin(Math.PI * u);
  const L = len * (0.4 + 0.6 * life);
  const y0 = y - u * len * 1.2;
  const pts: string[] = [];
  for (let i = 0; i <= 12; i++) {
    const v = i / 12;
    pts.push(`${x + Math.sin(v * 2 * Math.PI * 1.5 + ph + u * 8) * len * 0.09} ${y0 - v * L}`);
  }
  const d = `M ${pts.join(' L ')}`;
  return (
    <g opacity={Math.min(1, life * 2)}>
      <path d={d} stroke="#000" strokeWidth={w * 1.9} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} stroke="#FF8A2B" strokeWidth={w} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};

// ---------- panels: rows across the desert (perspective by y) ----------
type PanelSpot = {x: number; y: number; sc: number; t0: number; main?: boolean};
const scAt = (y: number) => clamp(0.38 + 0.62 * (y + 300) / 560, 0.3, 1.3);
const PANELS: PanelSpot[] = (() => {
  const out: PanelSpot[] = [{x: MAIN_X, y: 0, sc: 1, t0: -9, main: true}];
  const rows = [-255, -215, -165, -105, -40, 120, 255, 420];
  rows.forEach((y, ri) => {
    const sc = scAt(y);
    const step = PANEL_W * sc * 1.18;
    const off = (ri % 2) * step * 0.5;
    for (let x = -1900 + off; x < 2100; x += step) {
      if (y > -60 && y < 200 && x > -560 && x < 130) continue; // keep the guy (and the thermometer) clear
      if (y > -120 && y < 200 && x > 300 && x < 700) continue; // keep the camel clear
      if (y > -60 && y < 200 && Math.abs(x - MAIN_X) < 330) continue; // the main panel
      const d = Math.abs(x - GUY_X) + Math.abs(y) * 0.8;
      out.push({x, y, sc, t0: T.cover + 1.45 * clamp(d / 2000) + 0.06 * rnd(x + y)});
    }
  });
  return out;
})();

const PanelSpr: React.FC<{p: PanelSpot; t: number; heat: number}> = ({p, t, heat}) => {
  const s0 = (PANEL_W * p.sc) / (sp('panel').right - sp('panel').left);
  const g = p.main ? 1 : pop(t, p.t0, 0.28);
  if (g <= 0.001) return null;
  const glow = heat > 0.01 ? `drop-shadow(0 0 ${14 * heat}px rgba(255, 90, 20, ${0.85 * heat}))` : undefined;
  return <Spr n="panel" x={p.x} y={p.y} s={s0} sx={g} sy={g} filter={glow} />;
};

// eyes on the main panel (it "swallows" the sun ray)
const PanelFace: React.FC<{t: number}> = ({t}) => {
  if (t < T.darker - 0.02 || t >= CUT_F) return null;
  const s0 = PANEL_W / (sp('panel').right - sp('panel').left);
  const P = sp('panel');
  const cx = MAIN_X + (0.53 * P.w - P.feet[0]) * s0;
  const cy = (0.4 * P.h - P.feet[1]) * s0;
  const o = pop(t, T.darker, 0.3);
  const gulp = bump(t, T.darker + 0.05, 0.3);
  const smug = t > T.soaks ? 0.45 : 0;
  return (
    <Svg>
      <Eye x={cx - 42} y={cy - 6 - gulp * 6} r={26} open={o} lid={smug} look={[0.5, -0.6]} side={-1} brow={0.6} />
      <Eye x={cx + 42} y={cy - 6 - gulp * 6} r={26} open={o} lid={smug} look={[0.5, -0.6]} side={1} brow={0.6} />
      <path d={`M ${cx - 30} ${cy + 46} Q ${cx} ${cy + 46 + 26 * (0.4 + gulp)} ${cx + 30} ${cy + 46}`} stroke="#000" strokeWidth={8} fill={gulp > 0.2 ? '#FC8D90' : 'none'} strokeLinecap="round" />
    </Svg>
  );
};

// ---------- the guy ----------
type Pose = 'hero' | 'point' | 'hot' | 'rain' | 'shock';
const poseAt = (t: number): [Pose, number] => {
  if (t < CUT_F) {
    if (t < T.so) return ['hero', -9];
    if (t < T.endless) return ['point', T.so];
    if (t < T.heat) return ['hero', T.endless];
    if (t < 11.95) return ['hot', T.heat];
    return ['rain', 11.95];
  }
  if (t < T.warm) return ['shock', -9];
  return ['hot', T.warm];
};
const headS = (n: Pose) => HR / (sp(n).head as number[])[2];
const guyHead = (pose: Pose): [number, number] => {
  const p = sp(pose);
  const s = headS(pose);
  return [GUY_X + ((p.head as number[])[0] - p.feet[0]) * s, ((p.head as number[])[1] - p.feet[1]) * s];
};

const Guy: React.FC<{t: number}> = ({t}) => {
  const [pose, tSwap] = poseAt(t);
  const s = headS(pose);
  const [sqx, sqy] = squashSwap(t, tSwap);
  const tremble = pose === 'shock' ? Math.sin(2 * Math.PI * 9 * t) * 1.5 : pose === 'hot' ? Math.sin(2 * Math.PI * 1.4 * t) * 2 : 0;
  const by = breathe(t) * (1 + 0.025 * bump(t, T.right, 0.3) + 0.03 * bump(t, T.green, 0.3));
  const [hx, hy] = guyHead(pose);
  return (
    <>
      <div style={{position: 'absolute', left: GUY_X - 150, top: -18, width: 300, height: 36, borderRadius: '50%', background: 'rgba(120, 80, 30, 0.26)', filter: 'blur(3px)'}} />
      <Spr n={pose} x={GUY_X + tremble} y={0} s={s} sx={sqx} sy={sqy * by} />
      {pose === 'hot' && t > T.warm ? (
        <Svg>
          <SweatDrop x={hx + HR * 0.95} y={hy - HR * 0.2 + 30 * prog(t, T.warm + 0.1, DURATION)} r={20} s={pop(t, T.warm + 0.08, 0.25)} rot={10} />
        </Svg>
      ) : null}
      {pose === 'shock' ? (
        <Svg>
          <SweatDrop x={hx - HR * 0.95} y={hy - HR * 0.3 + 30 * prog(t, CUT_G + 0.2, T.warm)} r={18} s={popOut(t, CUT_G + 0.15, T.warm - 0.05)} rot={-10} />
        </Svg>
      ) : null}
    </>
  );
};

const Camel: React.FC<{t: number}> = ({t}) => {
  const shocked = t >= CUT_G;
  const n: SprName = shocked ? 'camelshock' : 'camel';
  const p = sp(n);
  const s = CAMEL_H / (p.bottom - p.top);
  const [sqx, sqy] = shocked ? squashSwap(t, CUT_G + 0.25) : [1, 1];
  const chew = shocked ? 0 : Math.sin(2 * Math.PI * 1.6 * t) * 1.2;
  return (
    <>
      <div style={{position: 'absolute', left: CAMEL_X - 120, top: CAMEL_Y - 12, width: 240, height: 24, borderRadius: '50%', background: 'rgba(120, 80, 30, 0.22)', filter: 'blur(3px)'}} />
      <Spr n={n} x={CAMEL_X} y={CAMEL_Y} s={s} sx={sqx} sy={sqy * breathe(t, 1.3)} rot={chew} />
    </>
  );
};

// ---------- the Sun with a face ----------
const Sun: React.FC<{t: number}> = ({t}) => {
  const {x, y, r} = SUN;
  const spin = t * 18 + 160 * easeInOutCubic(prog(t, T.sun, T.sun + 0.8));
  const pulse = 1 + 0.04 * Math.sin(2 * Math.PI * 0.9 * t) + 0.12 * bump(t, T.sun, 0.35) + 0.1 * bump(t, T.warm, 0.4);
  const wink = t > T.sun && t < T.right + 0.5 ? Math.sin(Math.PI * prog(t, T.sun + 0.05, T.right + 0.45)) : 0;
  const grin = t >= CUT_G ? 1 : t > T.soaks && t < CUT_F ? 0.6 : 0.3;
  const look: [number, number] = t > T.but && t < T.heat ? [-0.4, 0.7] : t >= CUT_G ? [-0.6, 0.5] : [-0.5, 0.3];
  const rays = [...Array(12)].map((_, i) => {
    const a = ((spin + i * 30) * Math.PI) / 180;
    const r0 = r * 1.12;
    const r1 = r * (1.42 + 0.06 * Math.sin(2 * Math.PI * 1.2 * t + i));
    const w = 0.13;
    return `M ${x + r0 * Math.cos(a - w)} ${y + r0 * Math.sin(a - w)} L ${x + r1 * Math.cos(a)} ${y + r1 * Math.sin(a)} L ${x + r0 * Math.cos(a + w)} ${y + r0 * Math.sin(a + w)} Z`;
  });
  return (
    <g transform={`translate(${x} ${y}) scale(${pulse}) translate(${-x} ${-y})`}>
      <circle cx={x} cy={y} r={r * 1.6} fill="#FFE07A" opacity={0.35} />
      {rays.map((d, i) => (
        <path key={i} d={d} fill="#FFC23A" stroke="#000" strokeWidth={7} strokeLinejoin="round" />
      ))}
      <circle cx={x} cy={y} r={r} fill="#FFD93D" stroke="#000" strokeWidth={9} />
      <circle cx={x - r * 0.18} cy={y + r * 0.2} r={r * 0.72} fill="#FFC72C" opacity={0.6} />
      <circle cx={x - r * 0.62} cy={y + r * 0.25} r={r * 0.14} fill="#FF9B6A" opacity={0.8} />
      <circle cx={x + r * 0.42} cy={y + r * 0.25} r={r * 0.14} fill="#FF9B6A" opacity={0.8} />
      <Eye x={x - r * 0.4} y={y - r * 0.18} r={r * 0.21} open={1} look={look} side={-1} brow={0.55} />
      <Eye x={x + r * 0.22} y={y - r * 0.18} r={r * 0.21} open={1} lid={wink * 0.95} look={look} side={1} brow={0.55} />
      <path
        d={`M ${x - r * 0.45} ${y + r * 0.3} Q ${x - r * 0.1} ${y + r * (0.45 + 0.35 * grin)} ${x + r * 0.3} ${y + r * 0.3}`}
        stroke="#000"
        strokeWidth={9}
        fill={grin > 0.5 ? '#C2412B' : 'none'}
        strokeLinecap="round"
      />
    </g>
  );
};

// ---------- sun rays in the "darker than sand" beat ----------
const Ray: React.FC<{x0: number; y0: number; x1: number; y1: number; head: number; tail: number}> = ({x0, y0, x1, y1, head, tail}) => {
  if (head <= tail + 0.001) return null;
  const hx = lerp(x0, x1, head);
  const hy = lerp(y0, y1, head);
  const tx = lerp(x0, x1, tail);
  const ty = lerp(y0, y1, tail);
  const a = Math.atan2(y1 - y0, x1 - x0);
  const L = 46;
  const ah = `M ${hx + Math.cos(a) * 18} ${hy + Math.sin(a) * 18} L ${hx - Math.cos(a - 0.55) * L} ${hy - Math.sin(a - 0.55) * L} L ${hx - Math.cos(a + 0.55) * L} ${hy - Math.sin(a + 0.55) * L} Z`;
  return (
    <g>
      <line x1={tx} y1={ty} x2={hx} y2={hy} stroke="#000" strokeWidth={30} strokeLinecap="round" />
      <path d={ah} fill="#000" stroke="#000" strokeWidth={14} strokeLinejoin="round" />
      <line x1={tx} y1={ty} x2={hx} y2={hy} stroke="#FFD23F" strokeWidth={16} strokeLinecap="round" />
      <path d={ah} fill="#FFD23F" />
    </g>
  );
};
const Rays: React.FC<{t: number}> = ({t}) => {
  if (t < T.panels2 || t > 8.8) return null;
  const sand: [number, number] = [55, 30];
  const panel: [number, number] = [MAIN_X + 10, -120];
  const st: [number, number] = [5, -900];
  const sp2: [number, number] = [380, -900];
  // ray 1 -> panel: arrives on "darker", then the tail runs into the panel (swallowed)
  const h1 = easeInOutCubic(prog(t, T.panels2, T.darker));
  const t1 = easeInCubic(prog(t, T.darker, T.darker + 0.35));
  // ray 2 -> sand: arrives on "sand", bounces back up
  const h2 = easeInOutCubic(prog(t, T.panels2 + 0.25, T.sand));
  const t2 = easeInCubic(prog(t, T.sand, T.sand + 0.3));
  const h3 = easeOutCubic(prog(t, T.sand, T.sand + 0.45));
  const t3 = easeInCubic(prog(t, T.sand + 0.45, 8.75));
  return (
    <Svg>
      <Ray x0={sp2[0]} y0={sp2[1]} x1={panel[0]} y1={panel[1]} head={h1} tail={t1} />
      <Ray x0={st[0]} y0={st[1]} x1={sand[0]} y1={sand[1]} head={h2} tail={t2} />
      <Ray x0={sand[0]} y0={sand[1]} x1={105} y1={-900} head={h3} tail={t3} />
      {t > T.sand && t < T.sand + 0.35 ? <circle cx={sand[0]} cy={sand[1]} r={30 + 60 * prog(t, T.sand, T.sand + 0.35)} fill="none" stroke="#fff" strokeWidth={8} opacity={1 - prog(t, T.sand, T.sand + 0.35)} /> : null}
    </Svg>
  );
};

// ---------- heat: squiggles from the panels, big rising air ----------
const Heat: React.FC<{t: number}> = ({t}) => {
  if (t < T.soaks - 0.1 || t > 12.6) return null;
  const out: React.ReactNode[] = [];
  const amp = clamp((12.5 - t) / 0.6);
  PANELS.forEach((p, i) => {
    if (i % 3 !== 0 && !p.main) return;
    const s0 = PANEL_W * p.sc;
    for (let j = 0; j < 2; j++) {
      const t0 = T.soaks + 0.25 * rnd(i * 3 + j) + j * 0.55;
      const u = ((t - t0) / 1.1) % 1;
      if (t < t0 || amp <= 0) continue;
      out.push(<Squiggle key={`${i}_${j}`} x={p.x + (rnd(i + j * 7) - 0.5) * s0 * 0.6} y={p.y - s0 * 0.55} len={s0 * 0.55} u={u} w={9 * p.sc} ph={i + j} />);
    }
  });
  return <Svg>{out}</Svg>;
};
// big squiggles that travel up into the sky (separate so they can move far)
const RisingAir: React.FC<{t: number}> = ({t}) => {
  if (t < T.rising - 0.2 || t > 12.3) return null;
  const out: React.ReactNode[] = [];
  for (let j = 0; j < 5; j++) {
    const t0 = T.rising - 0.15 + j * 0.22;
    const u = prog(t, t0, t0 + 1.5);
    if (u <= 0 || u >= 1) continue;
    const x = -620 + j * 300;
    const yb = -60 - easeInCubic(u) * 900;
    const life = Math.sin(Math.PI * u);
    const L = 260 * (0.5 + 0.5 * life);
    const pts: string[] = [];
    for (let i = 0; i <= 14; i++) {
      const v = i / 14;
      pts.push(`${x + Math.sin(v * 2 * Math.PI * 1.3 + j + u * 9) * 30} ${yb - v * L}`);
    }
    const d = `M ${pts.join(' L ')}`;
    out.push(
      <g key={j} opacity={Math.min(1, life * 2)}>
        <path d={d} stroke="#000" strokeWidth={30} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d={d} stroke="#FF8A2B" strokeWidth={16} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>,
    );
  }
  return <Svg>{out}</Svg>;
};

// ---------- the rain cloud with a face ----------
const CLOUD_PUFFS = [
  {x: -230, y: 30, r: 110},
  {x: -90, y: -40, r: 150},
  {x: 90, y: -50, r: 165},
  {x: 240, y: 25, r: 115},
  {x: 0, y: 60, r: 130},
];
const Cloud: React.FC<{x: number; y: number; s: number; t: number; squeeze?: boolean; look?: [number, number]; rot?: number; sad?: boolean}> = ({x, y, s, t, squeeze = false, look = [0.4, 0.5], rot = 0, sad = false}) => {
  if (s <= 0.001) return null;
  const wob = Math.sin(2 * Math.PI * 0.8 * t);
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s * (1 + 0.02 * wob)}, ${s * (1 - 0.02 * wob)})`}>
      <PuffCluster puffs={CLOUD_PUFFS} fill="#8E9AAB" ink={10} shade="#7A8698" />
      <Eye x={-55} y={0} r={34} open={1} look={look} side={-1} squeeze={squeeze} brow={sad ? 0.5 : 0.6} browTilt={sad ? -1 : 0} />
      <Eye x={55} y={0} r={34} open={1} look={look} side={1} squeeze={squeeze} brow={sad ? 0.5 : 0.6} browTilt={sad ? -1 : 0} />
      {squeeze ? (
        <ellipse cx={0} cy={68} rx={30} ry={26} fill="#000" />
      ) : (
        <path d={`M -32 62 Q 0 ${sad ? 46 : 84} 32 62`} stroke="#000" strokeWidth={9} fill="none" strokeLinecap="round" />
      )}
    </g>
  );
};
const RainDrops: React.FC<{t: number; t0: number; t1: number; cx: number; cy: number; w: number; ground: number; seed?: number}> = ({t, t0, t1, cx, cy, w, ground, seed = 0}) => {
  if (t < t0 || t > t1 + 0.6) return null;
  const out: React.ReactNode[] = [];
  const H = ground - cy;
  for (let i = 0; i < 46; i++) {
    const ph = rnd(i + seed);
    const x = cx + (rnd(i * 3 + 1 + seed) - 0.5) * w;
    const period = 0.55 + 0.15 * rnd(i * 7 + seed);
    const local = (t - t0) / period + ph;
    const k = Math.floor(local);
    const u = local - k;
    const born = t0 + (k - ph) * period;
    if (born < t0 - 0.01 || born > t1) continue;
    const y = cy + u * H;
    out.push(<line key={i} x1={x - 6} y1={y} x2={x + 6} y2={y + 60} stroke="#000" strokeWidth={14} strokeLinecap="round" />);
    out.push(<line key={`f${i}`} x1={x - 6} y1={y} x2={x + 6} y2={y + 60} stroke="#6EC3FF" strokeWidth={7} strokeLinecap="round" />);
  }
  return <>{out}</>;
};
const cloudPos = (t: number): [number, number, number] => {
  // Sahara: pulled in from the left on "pulls", arrives on "rain"
  const u = prog(t, T.pulls - 0.15, T.rain);
  const x = lerp(-1700, -120, easeOutBack(u, 1.2));
  return [x, -1080 + 20 * Math.sin(2 * Math.PI * 0.5 * t), u];
};

// ---------- green: the sand turns green from his feet outward ----------
const GREEN_T0 = T.sand2;
const greenR = (t: number) => 3600 * easeOutCubic(prog(t, GREEN_T0, GREEN_T0 + 1.2)) ** 1.4;
const TUFTS = [...Array(70)].map((_, i) => {
  const y = -270 + 560 * rnd(i * 5 + 2);
  return {x: -1500 + 3200 * rnd(i * 3 + 1), y, sc: scAt(y), kind: i % 4};
});
const Tuft: React.FC<{x: number; y: number; s: number; kind: number}> = ({x, y, s, kind}) => {
  if (s <= 0.001) return null;
  if (kind === 3)
    return (
      <g transform={`translate(${x} ${y}) scale(${s})`}>
        <circle cx={-16} cy={-18} r={22} fill={GRASS_D} stroke="#000" strokeWidth={5} />
        <circle cx={16} cy={-20} r={24} fill={GRASS_D} stroke="#000" strokeWidth={5} />
        <circle cx={0} cy={-34} r={24} fill={GRASS_D} stroke="#000" strokeWidth={5} />
        <circle cx={-16} cy={-18} r={18} fill={GRASS_D} />
        <circle cx={16} cy={-20} r={20} fill={GRASS_D} />
        <circle cx={6} cy={-38} r={8} fill="#FF7FA8" stroke="#000" strokeWidth={3} />
      </g>
    );
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M -22 0 Q -26 -30 -34 -46 Q -14 -30 -8 0 Z M -8 0 Q -4 -40 2 -62 Q 8 -36 8 0 Z M 8 0 Q 18 -30 32 -44 Q 24 -22 22 0 Z" fill={GRASS_D} stroke="#000" strokeWidth={5} strokeLinejoin="round" />
    </g>
  );
};
const Greenery: React.FC<{t: number}> = ({t}) => {
  if (t < GREEN_T0) return null;
  const R = greenR(t);
  return (
    <Svg>
      {TUFTS.map((p, i) => {
        const d = Math.hypot(p.x - GUY_X, (p.y - 0) * 2.6);
        const tb = GREEN_T0 + 1.2 * (1 - Math.cbrt(1 - Math.min(1, Math.pow(d / 3600, 1 / 1.4))));
        const s = R > d ? pop(t, tb, 0.3) : 0;
        return <Tuft key={i} x={p.x} y={p.y} s={s * p.sc * 1.3} kind={p.kind} />;
      })}
    </Svg>
  );
};

// ---------- the thermometer (G) ----------
const Thermo: React.FC<{t: number}> = ({t}) => {
  const p = pop(t, T.cool - 0.05, 0.3);
  if (p <= 0.001) return null;
  const x = THERMO_X;
  const H = 400;
  const lvl = 0.22 + 0.78 * easeInCubic(prog(t, T.warm - 0.05, 20.95));
  const boil = t > 20.95;
  const capU = prog(t, 20.95, 21.5);
  const wob = boil ? Math.sin(2 * Math.PI * 7 * t) * 3 : Math.sin(2 * Math.PI * 1.1 * t) * 1.2;
  const top = -H;
  const bulbY = -55;
  const tubeTop = top + 30;
  const fillTop = lerp(bulbY - 40, tubeTop + 6, lvl);
  return (
    <g transform={`translate(${x} 0) rotate(${wob}) scale(${p}) translate(${-x} 0)`}>
      <ellipse cx={x} cy={2} rx={70} ry={14} fill="rgba(120, 80, 30, 0.25)" />
      <rect x={x - 32} y={tubeTop - 30} width={64} height={-tubeTop + bulbY + 30} rx={32} fill="#FFFFFF" stroke="#000" strokeWidth={10} />
      <circle cx={x} cy={bulbY} r={55} fill="#E8382D" stroke="#000" strokeWidth={10} />
      <rect x={x - 16} y={fillTop} width={32} height={bulbY - fillTop} rx={10} fill="#E8382D" />
      <circle cx={x} cy={bulbY} r={44} fill="#E8382D" />
      <circle cx={x - 16} cy={bulbY - 16} r={11} fill="#FF8A80" />
      {[0.2, 0.4, 0.6, 0.8].map((v) => (
        <line key={v} x1={x + 32} x2={x + 52} y1={lerp(bulbY - 40, tubeTop + 6, v)} y2={lerp(bulbY - 40, tubeTop + 6, v)} stroke="#000" strokeWidth={7} strokeLinecap="round" />
      ))}
      {/* the cap pops off and steam puffs out */}
      <g transform={`translate(${x + 120 * capU} ${tubeTop - 30 - 260 * capU + 420 * capU * capU}) rotate(${300 * capU})`}>
        <rect x={-34} y={-10} width={68} height={22} rx={8} fill="#C9CFD6" stroke="#000" strokeWidth={8} />
      </g>
      {boil ? (
        <PuffCluster
          puffs={[0, 1, 2].map((i) => {
            const u = ((t - 20.95) * 1.6 + i * 0.33) % 1;
            return {x: x + (i - 1) * 26 + 20 * u, y: tubeTop - 50 - u * 180, r: 30 * Math.sin(Math.PI * u) + 4};
          })}
          fill="#FFFFFF"
          ink={7}
          shade="#E8ECF0"
        />
      ) : null}
    </g>
  );
};

// thought bubble with the Earth + a power bolt (A)
const Thought: React.FC<{t: number}> = ({t}) => {
  const s = popOut(t, T.whole - 0.1, 2.45, 0.3);
  if (s <= 0.001) return null;
  const [hx, hy] = guyHead('hero');
  const cx = hx + 230;
  const cy = hy - 260;
  const spin = t * 30;
  return (
    <g>
      <circle cx={hx + 120} cy={hy - 120} r={14 * s} fill="#fff" stroke="#000" strokeWidth={6} />
      <circle cx={hx + 165} cy={hy - 170} r={22 * s} fill="#fff" stroke="#000" strokeWidth={7} />
      <g transform={`translate(${cx} ${cy}) scale(${s})`}>
        <ellipse cx={0} cy={0} rx={165} ry={135} fill="#fff" stroke="#000" strokeWidth={10} />
        <clipPath id="earthclip">
          <circle cx={0} cy={0} r={88} />
        </clipPath>
        <circle cx={0} cy={0} r={88} fill="#3FA7F5" />
        <g clipPath="url(#earthclip)">
          <g transform={`translate(${((spin % 60) - 30) * 0.6} 0)`}>
            <path d="M -70 -40 Q -40 -70 -10 -50 Q 10 -20 -20 0 Q -40 30 -60 10 Z" fill="#7CCB4A" stroke="#000" strokeWidth={5} />
            <path d="M 20 -10 Q 60 -30 80 10 Q 60 60 30 50 Q 10 30 20 -10 Z" fill="#7CCB4A" stroke="#000" strokeWidth={5} />
            <path d="M -30 50 Q -10 40 0 70 Q -20 90 -40 70 Z" fill="#7CCB4A" stroke="#000" strokeWidth={5} />
          </g>
        </g>
        <circle cx={0} cy={0} r={88} fill="none" stroke="#000" strokeWidth={9} />
        <path d="M 72 -100 L 40 -30 L 70 -30 L 46 40 L 118 -48 L 86 -48 L 112 -100 Z" fill={TEXT_YEL} stroke="#000" strokeWidth={8} strokeLinejoin="round" transform={`rotate(${8 * Math.sin(2 * Math.PI * 2 * t)} 80 -30)`} />
      </g>
    </g>
  );
};

// ---------- the Sahara set ----------
const SaharaSet: React.FC<{t: number; cam: Cam; cover?: boolean}> = ({t, cam, cover}) => {
  const blur = 2.6 * clamp((cam.k - 1.3) / 0.3);
  const R = t >= CUT_G ? 6000 : greenR(t);
  const heat = t >= CUT_G ? 0.3 + 0.7 * prog(t, T.warm, 20.9) : clamp((t - T.soaks) / 0.6) * clamp((12.4 - t) / 0.8);
  const [cx, cy, cu] = t >= CUT_G ? [-80, -1080 + 20 * Math.sin(2 * Math.PI * 0.5 * t), 1] : cloudPos(t);
  const raining = t >= CUT_G || t >= T.rain;
  const items: {y: number; node: React.ReactNode}[] = [];
  PANELS.forEach((p, i) => items.push({y: p.y, node: <PanelSpr key={`p${i}`} p={p} t={t} heat={p.main ? heat : heat * 0.7} />}));
  if (!cover) items.push({y: CAMEL_Y, node: <Camel key="camel" t={t} />});
  items.push({y: 1, node: <Guy key="guy" t={t} />});
  items.sort((a, b) => a.y - b.y);
  return (
    <AbsoluteFill style={{background: SKY}}>
      <World cam={cam} depth={PLATE_DEPTH} blur={blur}>
        <div style={{position: 'absolute', left: -9000, top: -9000, width: 18000, height: 9000 - 1690 + 40, background: SKY}} />
        <div style={{position: 'absolute', left: -9000, top: 1300, width: 18000, height: 6000, background: SAND}} />
        <Img src={F('bg')} style={{position: 'absolute', left: -3072, top: -1690, width: 2048, height: 3072, transform: 'scaleX(-1)'}} />
        <Img src={F('bg')} style={{position: 'absolute', left: -1024, top: -1690, width: 2048, height: 3072}} />
        <Img src={F('bg')} style={{position: 'absolute', left: 1024, top: -1690, width: 2048, height: 3072, transform: 'scaleX(-1)'}} />
        {R > 1 ? (
          <div style={{position: 'absolute', left: -9000, top: HORIZON + 22, width: 18000, height: 9000, overflow: 'hidden'}}>
            <div
              style={{
                position: 'absolute',
                left: 9000 + GUY_X / PLATE_DEPTH - R,
                top: 400 - R * 0.36,
                width: 2 * R,
                height: 2 * R * 0.36,
                borderRadius: '50%',
                background: GRASS,
                opacity: 0.92,
              }}
            />
          </div>
        ) : null}
      </World>
      <World cam={cam}>
        <Svg>{cover ? null : <Sun t={t} />}</Svg>
        <Svg>
          <Greenery t={t} />
        </Svg>
        {items.map((it) => it.node)}
        {cover ? null : <PanelFace t={t} />}
        {cover ? null : <Rays t={t} />}
        {cover ? null : <Heat t={t} />}
        {cover ? null : <RisingAir t={t} />}
        {cover ? null : (
          <Svg>
            <Thought t={t} />
            {raining ? <RainDrops t={t} t0={t >= CUT_G ? CUT_G - 1 : T.rain} t1={t >= CUT_G ? 19.75 : CUT_F} cx={cx} cy={cy + 90} w={620} ground={60} /> : null}
            <Cloud x={cx} y={cy} s={cu > 0 ? 1 : 0} t={t} look={[0.2, 0.7]} />
            <Thermo t={t} />
          </Svg>
        )}
      </World>
      {heat > 0.01 ? <AbsoluteFill style={{background: `rgba(255, 120, 30, ${0.13 * heat})`}} /> : null}
    </AbsoluteFill>
  );
};

// ---------- the Amazon set (code) ----------
const TREES = [
  {x: -560, y: -170, h: 520},
  {x: -180, y: -190, h: 500},
  {x: 210, y: -175, h: 540},
  {x: 580, y: -185, h: 500},
  {x: -380, y: 30, h: 660},
  {x: 30, y: 50, h: 700},
  {x: 430, y: 35, h: 660},
];
const AmazonSet: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const dry = prog(t, T.drying - 0.1, T.drying + 0.9);
  const ground = `rgb(${Math.round(lerp(62, 176, dry))}, ${Math.round(lerp(142, 146, dry))}, ${Math.round(lerp(58, 74, dry))})`;
  const hills = `rgb(${Math.round(lerp(46, 150, dry))}, ${Math.round(lerp(120, 130, dry))}, ${Math.round(lerp(52, 70, dry))})`;
  // the cloud gets yanked away toward the Sahara on "taken"
  const yu = easeInCubic(prog(t, T.taken - 0.05, T.amazon + 0.15));
  const cx = lerp(-40, 1900, yu);
  const cy = -1060 - 120 * yu;
  const squeeze = t > T.taken - 0.1;
  const sunP = pop(t, T.so3, 0.4);
  return (
    <AbsoluteFill style={{background: '#9ED8FF'}}>
      <World cam={cam} depth={1.3}>
        <svg style={{position: 'absolute', left: -4000, top: -4000, overflow: 'visible'}} width={8000} height={8000} viewBox="-4000 -4000 8000 8000">
          <path d="M -4000 -260 Q -2600 -420 -1600 -300 Q -900 -460 -200 -310 Q 500 -470 1300 -300 Q 2200 -440 4000 -280 L 4000 4000 L -4000 4000 Z" fill={hills} stroke="#000" strokeWidth={10} />
          <path d="M -4000 -230 L 4000 -230 L 4000 4000 L -4000 4000 Z" fill={ground} />
          {/* a winding river */}
          <path d="M -4000 330 Q -1200 200 -500 380 Q 200 560 900 380 Q 1800 160 4000 300" stroke="#000" strokeWidth={96} fill="none" />
          <path d="M -4000 330 Q -1200 200 -500 380 Q 200 560 900 380 Q 1800 160 4000 300" stroke={`rgb(${Math.round(lerp(64, 120, dry))}, ${Math.round(lerp(160, 150, dry))}, ${Math.round(lerp(230, 170, dry))})`} strokeWidth={76 - 34 * dry} fill="none" />
        </svg>
      </World>
      <World cam={cam}>
        <Svg>
          {sunP > 0.001 ? (
            <g transform={`translate(380 -1060) scale(${sunP})`}>
              <circle cx={0} cy={0} r={95} fill="#FFD93D" stroke="#000" strokeWidth={9} />
              <Eye x={-30} y={-14} r={20} open={1} lidTilt={25} lid={0.35} look={[-0.6, 0.6]} side={-1} brow={0.5} browTilt={1} />
              <Eye x={30} y={-14} r={20} open={1} lidTilt={25} lid={0.35} look={[-0.6, 0.6]} side={1} brow={0.5} browTilt={1} />
              <path d="M -26 36 Q 0 52 26 36" stroke="#000" strokeWidth={8} fill="none" strokeLinecap="round" />
            </g>
          ) : null}
        </Svg>
        {TREES.map((tr, i) => {
          const tSwap = T.drying + i * 0.07;
          const isDry = t >= tSwap;
          const n: SprName = isDry ? 'treedry' : 'tree';
          const p = sp(n);
          const s = (tr.h * (isDry ? 0.86 : 1)) / (p.bottom - p.top);
          const [sqx, sqy] = squashSwap(t, tSwap);
          const sway = Math.sin(2 * Math.PI * 0.5 * t + i) * (isDry ? 0.5 : 1.5);
          return <Spr key={i} n={n} x={tr.x} y={tr.y} s={s} sx={sqx} sy={sqy} rot={sway} />;
        })}
        <Svg>
          {/* falling leaves */}
          {t > T.drying
            ? [...Array(16)].map((_, i) => {
                const tr = TREES[i % TREES.length];
                const t0 = T.drying + 0.1 + 0.06 * i;
                const u = prog(t, t0, t0 + 1.0);
                if (u <= 0 || u >= 1) return null;
                const x = tr.x + (rnd(i) - 0.5) * 260 + Math.sin(u * 9 + i) * 30;
                const y = tr.y - tr.h * 0.65 + u * tr.h * 0.7;
                return <ellipse key={i} cx={x} cy={y} rx={16} ry={9} fill={i % 2 ? '#E8892A' : '#C9662A'} stroke="#000" strokeWidth={4} transform={`rotate(${u * 400 + i * 40} ${x} ${y})`} />;
              })
            : null}
          <RainDrops t={t} t0={CUT_F - 1} t1={T.taken + 0.1} cx={cx} cy={cy + 90} w={620} ground={-20} seed={11} />
          <Cloud x={cx} y={cy} s={1} t={t} squeeze={squeeze} look={[0.6, 0.4]} rot={yu * 14} />
          {t > T.taken - 0.05 && t < T.amazon + 0.3 ? (
            <g opacity={1 - prog(t, T.amazon, T.amazon + 0.3)}>
              {[0, 1, 2].map((i) => (
                <line key={i} x1={cx - 330 - i * 40} x2={cx - 520 - i * 90} y1={cy - 60 + i * 60} y2={cy - 60 + i * 60} stroke="#fff" strokeWidth={14} strokeLinecap="round" />
              ))}
            </g>
          ) : null}
        </Svg>
        <Label x={0} y={-860} s={pop(t, T.amazon, 0.3)} text="AMAZON" size={110} rot={-3} />
      </World>
      {dry > 0.01 ? <AbsoluteFill style={{background: `rgba(255, 140, 40, ${0.1 * dry})`}} /> : null}
    </AbsoluteFill>
  );
};

export const Scene: React.FC<{t: number; cam: Cam; cover?: boolean}> = ({t, cam, cover}) => {
  const sh = shake(t, 3 * bump(t, T.rain - 0.6, 0.35) + 2 * bump(t, 20.95, 0.3));
  const camS = {x: cam.x - sh.x / cam.k, y: cam.y - sh.y / cam.k, k: cam.k};
  if (t >= CUT_F && t < CUT_G) return <AmazonSet t={t} cam={camS} />;
  return <SaharaSet t={t} cam={camS} cover={cover} />;
};

const CUES: Cue[] = [
  {f: 'pop', at: T.whole - 0.08, db: -22},
  {f: 'pop', at: 2.83, db: -22, rate: 0.9},
  {f: 'pop', at: 3.05, db: -22, rate: 1.0},
  {f: 'pop', at: 3.25, db: -23, rate: 1.1},
  {f: 'pop', at: 3.45, db: -23, rate: 1.2},
  {f: 'pop', at: 3.65, db: -24, rate: 1.3},
  {f: 'pop', at: 3.85, db: -24, rate: 1.4},
  {f: 'pop', at: 4.05, db: -25, rate: 1.5},
  {f: 'clank', at: 3.3, db: -27, dur: 1.2, keys: [[3.3, -27], [4.2, -27], [4.5, -40]]},
  {f: 'boing', at: T.sun + 0.05, db: -25},
  {f: 'whoosh', at: T.panels2 - 0.05, db: -28},
  {f: 'gulp', at: T.darker + 0.02, db: -17},
  {f: 'boing', at: T.sand + 0.02, db: -23, rate: 1.4},
  {f: 'sizzle', at: T.soaks, db: -24, dur: 1.9, keys: [[8.94, -24], [10.3, -24], [10.85, -40]]},
  {f: 'whoosh', at: 9.45, db: -31},
  {f: 'thunder', at: 11.0, db: -19},
  {f: 'rain', at: T.rain - 0.05, db: -24, dur: 2.0, keys: [[11.8, -24], [13.5, -24], [13.8, -40]]},
  {f: 'sprout', at: T.sand2, db: -18},
  {f: 'sprout', at: 12.95, db: -22, rate: 1.2},
  {f: 'whoosh', at: CUT_F - 0.1, db: -24},
  {f: 'rain', at: CUT_F, db: -28, dur: 1.0, keys: [[13.82, -28], [14.6, -28], [14.85, -45]]},
  {f: 'whoosh', at: T.taken - 0.05, db: -21, rate: 0.9},
  {f: 'gulp', at: T.taken - 0.1, db: -21, rate: 1.3},
  {f: 'pop', at: T.amazon, db: -21},
  {f: 'wilt', at: T.drying - 0.05, db: -16},
  {f: 'wilt', at: T.drying + 0.3, db: -23, rate: 1.15},
  {f: 'whoosh', at: CUT_G - 0.1, db: -26},
  {f: 'gulp', at: CUT_G + 0.25, db: -20, rate: 0.85},
  {f: 'rain', at: CUT_G, db: -30, dur: 2.0, keys: [[17.9, -30], [19.6, -30], [19.9, -45]]},
  {f: 'pop', at: T.cool - 0.05, db: -20},
  {f: 'kettle', at: T.warm - 0.1, db: -21, keys: [[20.16, -27], [20.9, -19], [21.4, -24]]},
  {f: 'pop', at: 20.95, db: -15, rate: 0.9},
];

export const SaharaSolarShort: React.FC = () => {
  useSSFont();
  const f = useCurrentFrame();
  const t = f / FPS;
  return (
    <AbsoluteFill style={{background: SKY}}>
      <Scene t={t} cam={camOf(t)} />
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('sahara-solar/vo/take1.mp3')} volume={Math.pow(10, MIX_DB / 20)} />
      </Sequence>
      <Audio src={staticFile('sahara-solar/music/bed.wav')} volume={Math.pow(10, MIX_DB / 20)} />
      <SoundCues cues={CUES.map((c) => ({...c, db: c.db + MIX_DB, keys: c.keys?.map(([a, b]) => [a, b + MIX_DB] as [number, number])}))} dir="sahara-solar/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};
