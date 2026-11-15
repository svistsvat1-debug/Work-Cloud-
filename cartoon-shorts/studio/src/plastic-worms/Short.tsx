import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SPR} from './sprites';
import {CUT_B, CUT_C, CUT_E, CUT_F, DURATION, FPS, T, VO_AT} from './scene';
export {DURATION as PW_DURATION, FPS as PW_FPS} from './scene';
import {camAt, clamp, easeInCubic, easeInOutCubic, easeOutCubic, lerp, pop, prog, rnd, shake, spring, type Cam, type CamKey} from '../shared/anim';
import {World} from '../shared/World';
import {Eye} from '../shared/Face';
import {PuffCluster} from '../shared/Puffs';
import {SweatDrop} from '../shared/SweatDrop';
import {SoundCues, type Cue} from '../shared/Sound';
import {useFont} from '../shared/useFont';

// "Why don't we just feed our plastic to worms?" - one backyard set: the guy, a blue tub of mealworms with a
// mountain of foam trash dumped on it.
// A: foam rains onto the tub, the worms pop up.     B: close-up: they munch and burp little CO2 clouds.
// C: "But": wide again, x100 worms, ONE tiny foam pill a day (push in), facepalm.
// D: time-lapse (day/night): the guy sits and grows a beard, a kid with a beard, the worms fall asleep.
// E: x-ray magnifier on a worm's belly: tiny green bacteria do the chewing.
// F: wide: a flask of bacteria pops up, the guy points at it, the worms are sad. Ends back on frame 0.

const F = (n: string) => staticFile(`plastic-worms/${n}.png`);
export const FONT = 'PWInter';
export const usePWFont = () => useFont(FONT, staticFile('fonts/Inter-Black.otf'));
const MIX_DB = -0.5;
const SKY = '#83CCFA';
const LAWN = '#9CCC60';
const TEXT_YEL = '#FFD23F';
const BACT = '#8BD650';
const BACT_SH = '#6CB83A';

// ---------- world: ground y = 0, 1 unit = 1 screen px at k = 1 ----------
const HR = 110; // guy head radius (world)
const GUY_X = -280;
const TUB_X = 180;
const TUB_S = 560 / (SPR.tub.right - SPR.tub.left);
const MT_S = 640 / (SPR.foam.right - SPR.foam.left);
const MT_H = (SPR.foam.bottom - SPR.foam.top) * MT_S;
const MT_BASE = -150;
const WORM_L = 170;
const WORM_S = WORM_L / (SPR.worm.right - SPR.worm.left);
const WORMF_S = WORM_L / (SPR.wormfull.right - SPR.wormfull.left);
const FLASK_S = 230 / (SPR.flask.bottom - SPR.flask.top);
const FLASK_X = -45;
const FY = 40;
const WORMS: {x: number; y: number; r: number}[] = [
  {x: 50, y: -170, r: -12},
  {x: 195, y: -160, r: -6},
  {x: 340, y: -172, r: -14},
];
const KID_X = -118;

// ---------- cameras ----------
export const CAM0: CamKey = {t: 0, x: 45, y: -260, k: 1.15};
const CAMS_A: CamKey[] = [CAM0, {t: CUT_B, x: 60, y: -265, k: 1.22, ease: 'io'}];
const CAMS_B: CamKey[] = [
  {t: CUT_B, x: 195, y: -250, k: 1.75},
  {t: CUT_C, x: 195, y: -255, k: 1.86},
];
const CAMS_C: CamKey[] = [
  {t: CUT_C, x: 45, y: -260, k: 1.15},
  {t: 10.25, x: 47, y: -262, k: 1.17},
  {t: 10.85, x: 205, y: -255, k: 1.8, ease: 'io'},
  {t: 11.35, x: 205, y: -257, k: 1.84},
  {t: 11.95, x: 30, y: -262, k: 1.12, ease: 'io'},
  {t: CUT_E, x: 32, y: -262, k: 1.13},
];
const CAMS_F: CamKey[] = [
  {t: CUT_F, x: 45, y: -262, k: 1.17},
  {t: 22.8, x: 40, y: -265, k: 1.22},
  {t: DURATION, x: 45, y: -260, k: 1.15, ease: 'io'},
];
export const camOf = (t: number): Cam => {
  if (t < CUT_B) return camAt(t, CAMS_A);
  if (t < CUT_C) return camAt(t, CAMS_B);
  if (t < CUT_F) return camAt(t, CAMS_C);
  return camAt(t, CAMS_F);
};

// ---------- small helpers ----------
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
const Spr: React.FC<{n: SprName; x: number; y: number; s: number; sx?: number; sy?: number; rot?: number; ax?: number; ay?: number; o?: number}> = ({
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
}) => {
  const sp = SPR[n] as unknown as {w: number; h: number; feet: [number, number]};
  const axx = ax ?? sp.feet[0];
  const ayy = ay ?? sp.feet[1];
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${r}deg) scale(${sx}, ${sy})`, transformOrigin: '0 0', opacity: o}}>
      <Img src={F(n as string)} style={{position: 'absolute', left: -axx * s, top: -ayy * s, width: sp.w * s, height: sp.h * s}} />
    </div>
  );
};
const Svg: React.FC<{children: React.ReactNode; r?: number}> = ({children, r = 3000}) => (
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

// ---------- the guy ----------
type Pose = 'hero' | 'shock' | 'palm' | 'bored' | 'point';
const poseAt = (t: number): [Pose, number] => {
  if (t < CUT_C) return ['hero', -9];
  if (t < CUT_F) {
    if (t < T.but + 0.05) return ['hero', -9];
    if (t < 11.75) return ['shock', T.but + 0.05];
    if (t < 12.4) return ['palm', 11.75];
    return ['bored', 12.4];
  }
  if (t < T.scientists) return ['hero', -9];
  if (t < 23.1) return ['point', T.scientists];
  return ['hero', 23.1];
};
const headS = (n: Pose) => HR / (SPR[n] as unknown as {head: number[]}).head[2];

const Beard: React.FC<{hx: number; hy: number; r: number; g: number; t: number}> = ({hx, hy, r, g, t}) => {
  if (g <= 0.001) return null;
  const L = r * 0.75 * g;
  const puffs = [] as {x: number; y: number; r: number}[];
  for (let i = 0; i < 7; i++) {
    const u = i / 6;
    const w = 0.42 * (1 - 0.6 * u);
    const sw = Math.sin(2 * Math.PI * 0.8 * t + i) * 4 * u;
    puffs.push({x: hx - r * w + sw, y: hy + r * 0.55 + L * u, r: r * 0.22 * (1 - 0.35 * u) * Math.min(1, g * 2)});
    puffs.push({x: hx + r * w + sw, y: hy + r * 0.55 + L * u, r: r * 0.22 * (1 - 0.35 * u) * Math.min(1, g * 2)});
    puffs.push({x: hx + sw, y: hy + r * 0.7 + L * u, r: r * 0.26 * (1 - 0.4 * u) * Math.min(1, g * 2)});
  }
  return <PuffCluster puffs={puffs} fill="#D3D8DE" ink={r * 0.07} shade="#BEC5CD" />;
};

const Guy: React.FC<{t: number}> = ({t}) => {
  const [pose, tSwap] = poseAt(t);
  const s = headS(pose);
  const [sqx, sqy] = squashSwap(t, tSwap);
  const tremble = pose === 'shock' ? Math.sin(2 * Math.PI * 9 * t) * 1.5 : 0;
  const by = breathe(t) * (1 + 0.025 * bump(t, T.dump, 0.3));
  const sp = SPR[pose] as unknown as {head: number[]; feet: number[]};
  const hx = GUY_X + (sp.head[0] - sp.feet[0]) * s;
  const hy = (sp.head[1] - sp.feet[1]) * s;
  const beard = pose === 'bored' ? easeOutCubic(prog(t, T.you, T.you + 0.7)) : 0;
  return (
    <>
      <div style={{position: 'absolute', left: GUY_X - 150, top: -18, width: 300, height: 36, borderRadius: '50%', background: 'rgba(60, 80, 30, 0.26)', filter: 'blur(3px)'}} />
      <Spr n={pose} x={GUY_X + tremble} y={0} s={s} sx={sqx} sy={sqy * by} />
      {pose === 'bored' ? (
        <Svg>
          <Beard hx={hx} hy={hy} r={HR} g={beard} t={t} />
        </Svg>
      ) : null}
      {pose === 'shock' ? (
        <Svg>
          <SweatDrop x={hx + HR * 0.95} y={hy - HR * 0.3 + 30 * prog(t, 8.5, 10.2)} r={18} s={popOut(t, 8.4, 10.2)} rot={10} />
        </Svg>
      ) : null}
    </>
  );
};

const Kid: React.FC<{t: number}> = ({t}) => {
  if (t < T.kids || t >= CUT_E) return null;
  const s = headS('bored') * 0.6;
  const p = pop(t, T.kids, 0.3);
  const sp = SPR.bored as unknown as {head: number[]; feet: number[]};
  const hx = KID_X + (sp.head[0] - sp.feet[0]) * s;
  const hy = (sp.head[1] - sp.feet[1]) * s * p;
  return (
    <>
      <Spr n="bored" x={KID_X} y={0} s={s} sx={p} sy={p * breathe(t, 1)} />
      <Svg>
        <Beard hx={hx} hy={hy} r={HR * 0.6} g={easeOutCubic(prog(t, 14.85, 15.45))} t={t + 0.4} />
      </Svg>
    </>
  );
};

// ---------- foam mountain + rain ----------
const mtGrow = (t: number) => {
  if (t < CUT_C) return 0.72 + 0.28 * easeOutCubic(prog(t, 0.1, 2.4));
  if (t < CUT_F) return 1 - 0.07 * easeInOutCubic(prog(t, 12.4, 15.6));
  return 0.93;
};
const mtTopAt = (x: number, g: number) => {
  const u = clamp(Math.abs(x - TUB_X) / 310, 0, 1);
  return MT_BASE - MT_H * g * 0.92 * (1 - u * u);
};
const Rain: React.FC<{t: number}> = ({t}) => {
  if (t > 2.6) return null;
  const items: React.ReactNode[] = [];
  const g = mtGrow(t);
  for (let i = 0; i < 20; i++) {
    const t0 = -0.45 + i * 0.12;
    const dur = 0.55 + 0.1 * rnd(i + 3);
    const x = TUB_X + (rnd(i) - 0.5) * 470;
    const yLand = mtTopAt(x, g) + 20;
    const u = (t - t0) / dur;
    if (u < 0 || u > 1.25) continue;
    const y = u < 1 ? lerp(-1350, yLand, u * u) : yLand;
    const sc = u < 1 ? 1 : 1 - (u - 1) / 0.25;
    const rot = (rnd(i + 9) - 0.5) * 720 * Math.min(u, 1);
    const kind = i % 3;
    items.push(
      <g key={i} transform={`translate(${x} ${y}) rotate(${rot}) scale(${sc})`}>
        {kind === 0 ? (
          <rect x={-30} y={-20} width={60} height={40} rx={9} fill="#FFFFFF" stroke="#000" strokeWidth={6} />
        ) : kind === 1 ? (
          <path d="M -26 -8 Q -14 -26 0 -10 Q 14 -26 26 -8 Q 30 14 0 10 Q -30 14 -26 -8 Z" fill="#FFFFFF" stroke="#000" strokeWidth={6} />
        ) : (
          <path d="M -22 -28 L 22 -28 L 15 26 L -15 26 Z" fill="#FFFFFF" stroke="#000" strokeWidth={6} strokeLinejoin="round" />
        )}
      </g>,
    );
  }
  return <Svg>{items}</Svg>;
};

// ---------- worms ----------
const Worms: React.FC<{t: number}> = ({t}) => {
  if (t < T.mealworms - 0.02) return null;
  const out: React.ReactNode[] = [];
  const asleep = t >= T.worms2 && t < CUT_F;
  WORMS.forEach((w, i) => {
    const p = t < CUT_C ? pop(t, T.mealworms + i * 0.08, 0.28) : 1;
    const chew = t >= T.eat && t < T.airEnd ? Math.sin(2 * Math.PI * 4.2 * t + i * 1.7) * 6 : 0;
    const chew2 = t >= 20.0 && t < T.not ? Math.sin(2 * Math.PI * 3 * t + i) * 3 : 0;
    const sad = t >= T.not ? 7 * easeOutCubic(prog(t, T.not, T.not + 0.3)) : 0;
    const n: SprName = asleep ? 'wormfull' : 'worm';
    const s = asleep ? WORMF_S : WORM_S;
    const sp = SPR[n] as unknown as {w: number; h: number};
    const by = 1 + 0.025 * Math.sin(2 * Math.PI * 1.1 * t + i * 2);
    out.push(
      <Spr key={i} n={n} x={w.x} y={w.y} s={s * p} sx={1} sy={by} rot={w.r + chew + chew2 + sad} ax={sp.w / 2} ay={sp.h * 0.85} />,
    );
  });
  return <>{out}</>;
};
// head of worm i in world coords (sprite head is at ~0.86 w, 0.35 h)
const wormHead = (i: number): [number, number] => {
  const w = WORMS[i];
  const sp = SPR.worm;
  const dx = (0.86 - 0.5) * sp.w * WORM_S;
  const dy = (0.35 - 0.85) * sp.h * WORM_S;
  const a = (w.r * Math.PI) / 180;
  return [w.x + dx * Math.cos(a) - dy * Math.sin(a), w.y + dx * Math.sin(a) + dy * Math.cos(a)];
};

const WormFx: React.FC<{t: number}> = ({t}) => {
  const g: React.ReactNode[] = [];
  // crumbs flying while they eat
  if (t >= T.eat && t < T.airEnd) {
    for (let i = 0; i < 3; i++) {
      const [hx, hy] = wormHead(i);
      for (let j = 0; j < 4; j++) {
        const t0 = T.eat + i * 0.13 + j * 0.42;
        const u = (t - t0) / 0.45;
        if (u < 0 || u > 1) continue;
        const vx = (rnd(i * 10 + j) - 0.3) * 120;
        g.push(<rect key={`c${i}${j}`} x={hx + 12 + vx * u - 6} y={hy - 10 - 140 * u + 220 * u * u - 6} width={12} height={10} rx={3} fill="#fff" stroke="#000" strokeWidth={3} />);
      }
    }
  }
  // burps: little CO2 clouds rising from each worm
  const burps = [T.half, T.out, T.air];
  burps.forEach((tb, i) => {
    const [hx, hy] = wormHead(i);
    const u = (t - tb) / 1.3;
    if (u < 0 || u > 1) return;
    const r = 40 * Math.min(1, u * 4) * (u > 0.75 ? 1 - (u - 0.75) / 0.25 : 1);
    const cx = hx + 20 + 30 * u;
    const cy = hy - 40 - 160 * u;
    g.push(
      <g key={`b${i}`}>
        <PuffCluster
          puffs={[
            {x: cx - r * 0.9, y: cy + r * 0.2, r: r * 0.8},
            {x: cx, y: cy - r * 0.3, r},
            {x: cx + r * 0.9, y: cy + r * 0.2, r: r * 0.8},
          ]}
          fill="#FFFFFF"
          ink={4}
          shade="#EEF1F4"
        />
        {r > 12 ? (
          <text x={cx} y={cy + r * 0.25} textAnchor="middle" fontFamily={FONT} fontSize={r * 0.62} fill="#7A8A99">
            CO₂
          </text>
        ) : null}
      </g>,
    );
  });
  // zzz while they sleep
  if (t >= T.worms2 && t < CUT_E) {
    for (let i = 0; i < 3; i++) {
      const w = WORMS[i];
      const u = ((t - T.worms2) * 0.9 + i * 0.3) % 1;
      g.push(
        <text key={`z${i}`} x={w.x + 70 + 20 * u} y={w.y - 60 - 90 * u} fontFamily={FONT} fontSize={30 + 14 * u} fill="#fff" stroke="#000" strokeWidth={6} paintOrder="stroke" opacity={1 - u * 0.6}>
          z
        </text>,
      );
    }
  }
  // sad sweat on "not the worms"
  if (t >= T.not - 0.05) {
    for (let i = 0; i < 3; i++) {
      const [hx, hy] = wormHead(i);
      g.push(<SweatDrop key={`s${i}`} x={hx - 6} y={hy - 34 + 14 * prog(t, T.not + 0.2, 23.1)} r={11} s={popOut(t, T.not + i * 0.07, 23.0)} />);
    }
  }
  return <Svg>{g}</Svg>;
};

// the tiny foam pill (one day of eating for 100 worms)
const Pill: React.FC<{t: number}> = ({t}) => {
  const p = popOut(t, T.pill - 0.05, 12.05, 0.3);
  if (p <= 0.001) return null;
  const x = 202;
  const y = -258;
  const ring = 0.5 + 0.5 * Math.sin(2 * Math.PI * 2 * t);
  return (
    <Svg>
      <g transform={`translate(${x} ${y}) scale(${p})`}>
        <circle cx={0} cy={0} r={34 + 4 * ring} fill="#2B3A55" stroke={TEXT_YEL} strokeWidth={6} />
        <g transform="rotate(-20) scale(1.35)">
          <rect x={-17} y={-8} width={34} height={16} rx={8} fill="#FFFFFF" stroke="#000" strokeWidth={3.5} />
          <line x1={0} y1={-8} x2={0} y2={8} stroke="#000" strokeWidth={2.5} />
        </g>
      </g>
    </Svg>
  );
};

// a bacterium with a face (x-ray and flask)
const Bug: React.FC<{x: number; y: number; r: number; s: number; t: number; ph: number; chomp?: boolean}> = ({x, y, r, s, t, ph, chomp}) => {
  if (s <= 0.001) return null;
  const wob = Math.sin(2 * Math.PI * 1.6 * t + ph);
  const mouth = chomp ? 0.5 + 0.5 * Math.sin(2 * Math.PI * 5 * t + ph) : 0.3;
  return (
    <g transform={`translate(${x} ${y + wob * r * 0.08}) rotate(${wob * 8}) scale(${s * (1 + 0.04 * wob)}, ${s * (1 - 0.04 * wob)})`}>
      <ellipse cx={0} cy={0} rx={r * 1.15} ry={r} fill={BACT} stroke="#000" strokeWidth={r * 0.14} />
      <ellipse cx={r * 0.25} cy={r * 0.3} rx={r * 0.7} ry={r * 0.45} fill={BACT_SH} opacity={0.6} />
      <Eye x={-r * 0.35} y={-r * 0.22} r={r * 0.28} open={1} brow={NaN} look={[0.3, 0]} side={-1} />
      <Eye x={r * 0.35} y={-r * 0.22} r={r * 0.28} open={1} brow={NaN} look={[0.3, 0]} side={1} />
      <ellipse cx={0} cy={r * 0.38} rx={r * 0.32} ry={r * 0.08 + r * 0.22 * mouth} fill="#000" />
    </g>
  );
};

// ---------- the x-ray close-up (screen space) ----------
const XRay: React.FC<{t: number}> = ({t}) => {
  const u = t - CUT_E;
  const z = 1 + 0.05 * easeInOutCubic(prog(t, CUT_E, CUT_F));
  const ws = 1.45;
  const W = SPR.worm.w * ws;
  const H = SPR.worm.h * ws;
  const wx = 540 - W / 2;
  const wy = 980 - H / 2;
  const chew = Math.sin(2 * Math.PI * 3.5 * t) * 2.5;
  const gx = wx + 0.45 * W;
  const gy = wy + 0.6 * H;
  const gp = pop(t, T.real, 0.35);
  const R = 215;
  const bugs = [
    [-95, -60, 0],
    [40, -95, 1],
    [110, 20, 2],
    [-30, 50, 3],
    [-120, 70, 4],
    [70, 110, 5],
  ];
  const crumbsGone = prog(t, T.guts, T.guts + 0.4);
  return (
    <AbsoluteFill style={{background: '#CFEBFF', overflow: 'hidden'}}>
      <div style={{position: 'absolute', left: 540 - 700, top: 980 - 700, width: 1400, height: 1400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 65%)'}} />
      <AbsoluteFill style={{transform: `scale(${z})`, transformOrigin: '540px 980px'}}>
        <div style={{position: 'absolute', left: wx, top: wy, transform: `rotate(${chew}deg) scale(${1 + 0.06 * (1 - easeOutCubic(clamp(u / 0.35)))})`, transformOrigin: '50% 60%'}}>
          <Img src={F('worm')} style={{width: W, height: H}} />
        </div>
        <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={1080} height={1920}>
          {gp > 0.001 ? (
            <g transform={`translate(${gx} ${gy}) scale(${gp})`}>
              <defs>
                <clipPath id="xr">
                  <circle cx={0} cy={0} r={R} />
                </clipPath>
              </defs>
              <line x1={R * 0.72} y1={R * 0.72} x2={R * 1.55} y2={R * 1.55} stroke="#000" strokeWidth={70} strokeLinecap="round" />
              <line x1={R * 0.78} y1={R * 0.78} x2={R * 1.5} y2={R * 1.5} stroke="#8B5A2B" strokeWidth={46} strokeLinecap="round" />
              <circle cx={0} cy={0} r={R} fill="#F7B7A8" />
              <g clipPath="url(#xr)">
                <path d={`M ${-R} ${-R * 0.55} Q 0 ${-R * 0.75} ${R} ${-R * 0.5}`} stroke="#E8958A" strokeWidth={22} fill="none" />
                <path d={`M ${-R} ${R * 0.55} Q 0 ${R * 0.75} ${R} ${R * 0.45}`} stroke="#E8958A" strokeWidth={22} fill="none" />
                {[...Array(12)].map((_, i) => {
                  const cx = (rnd(i + 40) - 0.5) * R * 1.5;
                  const cy = (rnd(i + 70) - 0.5) * R * 1.3;
                  const s = 1 - crumbsGone * (0.6 + 0.4 * rnd(i));
                  return s > 0.05 ? <rect key={i} x={cx - 9 * s} y={cy - 7 * s} width={18 * s} height={14 * s} rx={4} fill="#fff" stroke="#000" strokeWidth={3} /> : null;
                })}
                {bugs.map(([bx, by, k]) => (
                  <Bug key={k} x={bx} y={by} r={34} s={pop(t, T.tiny + k * 0.07, 0.3)} t={t} ph={k * 1.3} chomp={t > T.bacteria} />
                ))}
              </g>
              <circle cx={0} cy={0} r={R} fill="none" stroke="#000" strokeWidth={22} />
              <circle cx={0} cy={0} r={R - 14} fill="none" stroke="#C8D2DA" strokeWidth={8} />
              <path d={`M ${-R * 0.6} ${-R * 0.45} Q ${-R * 0.45} ${-R * 0.7} ${-R * 0.15} ${-R * 0.75}`} stroke="#fff" strokeWidth={12} fill="none" strokeLinecap="round" opacity={0.85} />
            </g>
          ) : null}
        </svg>
        <div style={{position: 'absolute', left: 0, top: 0}}>
          <Label x={gx} y={gy - R - 90} s={popOut(t, T.bacteria, 30, 0.3)} text="BACTERIA" size={84} rot={-3} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ---------- the flask of bacteria ----------
const Flask: React.FC<{t: number}> = ({t}) => {
  const p = popOut(t, T.bacteria2 - 0.05, 23.0, 0.3);
  if (p <= 0.001) return null;
  const s = FLASK_S;
  const sp = SPR.flask;
  const lx = (x: number) => FLASK_X + (x - sp.feet[0]) * s;
  const ly = (y: number) => FY + (y - sp.feet[1]) * s;
  return (
    <>
      <div style={{position: 'absolute', left: FLASK_X - 75, top: FY - 12, width: 150, height: 24, borderRadius: '50%', background: 'rgba(60, 80, 30, 0.24)', filter: 'blur(3px)', transform: `scaleX(${p})`}} />
      <div style={{position: 'absolute', left: 0, top: 0, transform: `translate(${FLASK_X}px, ${FY}px) scale(${p}) translate(${-FLASK_X}px, ${-FY}px)`, transformOrigin: '0 0'}}>
        <Spr n="flask" x={FLASK_X} y={FY} s={s} sy={1 + 0.02 * Math.sin(2 * Math.PI * 1.3 * t)} />
        <Svg>
          <Bug x={lx(175)} y={ly(500)} r={22} s={pop(t, T.bacteria2 + 0.15, 0.3)} t={t} ph={0} />
          <Bug x={lx(270)} y={ly(540)} r={20} s={pop(t, T.bacteria2 + 0.25, 0.3)} t={t} ph={2} />
          <Bug x={lx(220)} y={ly(590)} r={18} s={pop(t, T.bacteria2 + 0.35, 0.3)} t={t} ph={4} />
        </Svg>
      </div>
    </>
  );
};

// ---------- the whole world at time t ----------
export const Scene: React.FC<{t: number; cam: Cam; cover?: boolean}> = ({t, cam, cover}) => {
  const blur = 2.8 * clamp((cam.k - 1.3) / 0.4);
  const g = mtGrow(t);
  const sh = shake(t, 3 * bump(t, 0.5, 0.25) + 2 * bump(t, 1.4, 0.25));
  const camS = {x: cam.x - sh.x / cam.k, y: cam.y - sh.y / cam.k, k: cam.k};
  const night = t >= 12.3 && t < CUT_E ? 0.36 * (0.5 - 0.5 * Math.cos(2 * Math.PI * 1.25 * (t - 12.3))) * clamp((CUT_E - t) / 0.2) : 0;
  return (
    <AbsoluteFill style={{background: SKY}}>
      <World cam={camS} depth={1.3} blur={blur}>
        <div style={{position: 'absolute', left: -6000, top: -240, width: 12000, height: 6000, background: LAWN}} />
        <Img src={F('bg')} style={{position: 'absolute', left: -1024 * 2, top: -240 - 1600, width: 2048, height: 3072}} />
        <Img src={F('bg')} style={{position: 'absolute', left: 0, top: -240 - 1600, width: 2048, height: 3072, transform: 'scaleX(-1)'}} />
      </World>
      <World cam={camS}>
        {/* tub + mountain + worms */}
        <div style={{position: 'absolute', left: TUB_X - 320, top: -22, width: 640, height: 44, borderRadius: '50%', background: 'rgba(60, 80, 30, 0.26)', filter: 'blur(3px)'}} />
        <Spr n="tub" x={TUB_X} y={0} s={TUB_S} />
        <Spr n="foam" x={TUB_X} y={MT_BASE} s={MT_S} sy={g} />
        <Worms t={t} />
        {cover ? null : <WormFx t={t} />}
        {cover ? null : <Rain t={t} />}
        <Pill t={t} />
        <Flask t={t} />
        <Kid t={t} />
        <Guy t={t} />
        {/* labels */}
        <Label x={390} y={-330} s={t < CUT_E && t >= CUT_C ? popOut(t, T.hundred, 10.6, 0.3) : 0} text="×100" size={70} rot={6} />
        <Label x={202} y={-330} s={popOut(t, T.day - 0.1, 12.05, 0.3)} text="1 DAY" size={46} rot={-4} />
      </World>
      {night > 0.001 ? <AbsoluteFill style={{background: `rgba(20, 28, 80, ${night})`}} /> : null}
    </AbsoluteFill>
  );
};

const CUES: Cue[] = [
  {f: 'foam_dump', at: 0.3, db: -15},
  {f: 'foam_dump', at: 1.25, db: -21, rate: 1.12},
  {f: 'pop', at: 3.06, db: -22},
  {f: 'pop', at: 3.14, db: -23, rate: 1.15},
  {f: 'pop', at: 3.22, db: -23, rate: 1.3},
  {f: 'munch', at: 4.88, db: -16},
  {f: 'munch', at: 5.3, db: -19, rate: 1.15},
  {f: 'munch', at: 5.75, db: -21, rate: 0.9},
  {f: 'burp', at: T.half, db: -15},
  {f: 'burp', at: T.out, db: -18, rate: 1.2},
  {f: 'burp', at: T.air, db: -18, rate: 0.88},
  {f: 'gulp', at: 8.15, db: -18},
  {f: 'pop', at: T.hundred, db: -22},
  {f: 'whoosh', at: 10.3, db: -30},
  {f: 'pop', at: T.pill, db: -19, rate: 1.3},
  {f: 'ticks', at: 12.4, db: -27, dur: 2.0},
  {f: 'ticks', at: 14.4, db: -27, dur: 1.4, keys: [[14.4, -27], [15.6, -27], [15.8, -40]]},
  {f: 'flip', at: T.you, db: -24},
  {f: 'pop', at: T.kids, db: -22},
  {f: 'snore', at: T.worms2, db: -25, dur: 0.65},
  {f: 'whoosh', at: CUT_E - 0.1, db: -24},
  {f: 'pop', at: T.real, db: -19},
  {f: 'pop', at: T.tiny, db: -24, rate: 1.4},
  {f: 'pop', at: T.tiny + 0.14, db: -24, rate: 1.6},
  {f: 'pop', at: T.tiny + 0.28, db: -24, rate: 1.8},
  {f: 'munch', at: T.guts, db: -17, rate: 1.35},
  {f: 'whoosh', at: CUT_F - 0.1, db: -28},
  {f: 'boing', at: T.scientists, db: -26},
  {f: 'pop', at: T.bacteria2, db: -19},
  {f: 'bubbles', at: T.bacteria2 + 0.1, db: -26, dur: 1.2, keys: [[21.0, -26], [22.0, -26], [22.3, -40]]},
  {f: 'sad_horn', at: T.not, db: -22, dur: 1.4},
  {f: 'pop', at: 23.0, db: -27},
];

export const PlasticWormsShort: React.FC = () => {
  usePWFont();
  const f = useCurrentFrame();
  const t = f / FPS;
  return (
    <AbsoluteFill style={{background: SKY}}>
      {t >= CUT_E && t < CUT_F ? <XRay t={t} /> : <Scene t={t} cam={camOf(t)} />}
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('plastic-worms/vo/take1.mp3')} volume={Math.pow(10, MIX_DB / 20)} />
      </Sequence>
      <Audio src={staticFile('plastic-worms/music/bed.wav')} volume={Math.pow(10, MIX_DB / 20)} />
      <SoundCues cues={CUES.map((c) => ({...c, db: c.db + MIX_DB, keys: c.keys?.map(([a, b]) => [a, b + MIX_DB] as [number, number])}))} dir="plastic-worms/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};
