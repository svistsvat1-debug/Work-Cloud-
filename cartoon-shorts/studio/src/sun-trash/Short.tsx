import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SPR} from './sprites';
import {CUT_B4, CUT_B5, CUT_B6, DURATION, FPS, T, VO_AT} from './scene';
export {DURATION as SUN_DURATION, FPS as SUN_FPS} from './scene';
import {camAt, clamp, easeInCubic, easeInOutCubic, easeOutBack, easeOutCubic, lerp, pop, prog, rnd, shake, spring, type Cam, type CamKey} from '../shared/anim';
import {World} from '../shared/World';
import {Eye} from '../shared/Face';
import {PuffCluster} from '../shared/Puffs';
import {SweatDrop} from '../shared/SweatDrop';
import {SoundCues, type Cue} from '../shared/Sound';
import {useFont} from '../shared/useFont';

// "Why don't we shoot our trash into the Sun?" - a tiny cartoon Earth under a big Sun with a face.
// A: the guy tosses a bag onto his trash rocket and aims it at the Sun (a crosshair lands on the Sun's face, it wakes up).
// B: pull-out: Earth (with the rocket on it) is racing sideways around the Sun - 67,000 mph; the rocket launches and
//    just circles the Sun (the Sun gets dizzy), like Earth does.
// C: close-up: he yanks a BRAKE lever, the speed gauge must drop almost to zero to fall in.
// D: 55 fuel cans (to the Sun) vs 1 can (to Mars): facepalm.
// E: back under the Sun: the rocket turns around, one can of fuel, and it leaves the solar system; a new rocket pops up (loop).

const F = (n: string) => staticFile(`sun-trash/${n}.png`);
export const FONT = 'SunInter';
export const useSunFont = () => useFont(FONT, staticFile('fonts/Inter-Black.otf'));
const MIX_DB = -0.2;
const INK = '#000';
export const SPACE = `rgb(${SPR.bg.mid.join(',')})`;
const SUN = '#FFC93C';
const SUN_SHADE = '#FFAE21';
const SUN_RAY = '#FFD95E';
const EARTH = '#3E8EDE';
const EARTH_SHADE = '#2F74C0';
const LAND = '#5DBB4F';
const MARS = '#DA5A2C';
const MARS_SHADE = '#B6431E';
const SHADOW = 'rgba(10, 20, 60, 0.32)';
const TEXT_YEL = '#FFD23F';

// ---------- world: the Sun at (0, 0); 1 unit = 1 screen px at k = 1 ----------
const RS = 1000; // Sun radius
const D = 1900; // Earth's orbit radius (cartoon)
const RE = 420; // Earth radius
const HR = 58; // guy head radius
const ROCKET_H = 330;
const ROCKET_S = ROCKET_H / (SPR.rocket.bottom - SPR.rocket.top);
const BAG_S = 76 / (SPR.bag.right - SPR.bag.left);
const CAN_S = 90 / (SPR.can.bottom - SPR.can.top);
const GUY_A = -110; // guy's x on Earth in shots A/B
const PAD = 120; // rocket's x on Earth
const GUY_E = -120;

// Earth's orbit angle (deg, y down): still in the hook, then it races around once (counter-clockwise on screen)
const thetaDeg = (t: number) => {
  if (t < T.but || t >= CUT_B6) return 90;
  const u = t - T.but;
  const s = u < 0.8 ? (u * u) / 1.6 : u - 0.4;
  return 90 - 24.3 * s;
};
const earthAt = (t: number): [number, number] => {
  const a = (thetaDeg(t) * Math.PI) / 180;
  return [D * Math.cos(a), D * Math.sin(a)];
};
const surfY = (x: number) => -Math.sqrt(RE * RE - x * x); // Earth-local surface height
const tiltAt = (x: number) => (Math.asin(x / RE) * 180) / Math.PI;
const rotP = (x: number, y: number, deg: number): [number, number] => {
  const a = (deg * Math.PI) / 180;
  return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
};
const dirDeg = (dx: number, dy: number) => (Math.atan2(dx, -dy) * 180) / Math.PI; // 0 = up, clockwise +

// ---------- cameras ----------
export const CAM0: CamKey = {t: 0, x: 0, y: 1130, k: 1.846};
const CAMS_A: CamKey[] = [
  CAM0,
  {t: 3.25, x: 0, y: 1140, k: 1.9},
  {t: 5.5, x: 0, y: 90, k: 0.232, ease: 'io'},
  {t: CUT_B4, x: 0, y: 60, k: 0.24},
];
const CAMS_C: CamKey[] = [
  {t: CUT_B4, x: 40, y: -560, k: 1.55},
  {t: CUT_B5, x: 40, y: -565, k: 1.64},
];
const CAMS_D: CamKey[] = [
  {t: CUT_B5, x: 0, y: -770, k: 1.12},
  {t: CUT_B6, x: 0, y: -765, k: 1.16},
];
const CAMS_E: CamKey[] = [
  {t: CUT_B6, x: 0, y: 1350, k: 1.12},
  {t: 22.55, x: 10, y: 1345, k: 1.15},
  {t: DURATION, x: 0, y: 1130, k: 1.846, ease: 'io'},
];
export const camOf = (t: number): Cam => {
  if (t < CUT_B4) return camAt(t, CAMS_A);
  if (t < CUT_B5) return camAt(t, CAMS_C);
  if (t < CUT_B6) return camAt(t, CAMS_D);
  return camAt(t, CAMS_E);
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
// a sprite anchored at (ax, ay) sprite px (default: its feet), placed at world (x, y)
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
const Svg: React.FC<{x: number; y: number; r?: number; children: React.ReactNode}> = ({x, y, r = 4000, children}) => (
  <svg style={{position: 'absolute', left: x - r, top: y - r, overflow: 'visible'}} width={2 * r} height={2 * r} viewBox={`${x - r} ${y - r} ${2 * r} ${2 * r}`}>
    {children}
  </svg>
);
const Txt: React.FC<{x: number; y: number; size: number; s?: number; text: string; rot?: number; fill?: string; anchor?: 'middle' | 'start' | 'end'}> = ({
  x,
  y,
  size,
  s = 1,
  text,
  rot: r = 0,
  fill = '#fff',
  anchor = 'middle',
}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}>
      <text x={0} y={size * 0.35} textAnchor={anchor} fontFamily={FONT} fontWeight={900} fontSize={size} fill={fill} stroke={INK} strokeWidth={size * 0.18} paintOrder="stroke" strokeLinejoin="round">
        {text}
      </text>
    </g>
  );
const Sparkle: React.FC<{x: number; y: number; r: number; s: number; rot?: number; sw: number}> = ({x, y, r, s, rot: a = 0, sw}) => {
  if (s <= 0.001) return null;
  const p = `M 0 ${-r} Q ${r * 0.18} ${-r * 0.18} ${r} 0 Q ${r * 0.18} ${r * 0.18} 0 ${r} Q ${-r * 0.18} ${r * 0.18} ${-r} 0 Q ${-r * 0.18} ${-r * 0.18} 0 ${-r} Z`;
  return (
    <g transform={`translate(${x} ${y}) rotate(${a}) scale(${s})`}>
      <path d={p} fill="#FFF6B0" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    </g>
  );
};

// ---------- the Sun (code) with a face that slides toward where it looks ----------
type SunFace = {
  look: [number, number]; // -1..1, the face slides that way
  open: number; // 0 closed (sleeping) .. 1 open
  mood: 'sleep' | 'calm' | 'worry' | 'dizzy' | 'happy' | 'smug';
  sweat?: number;
  pupil?: [number, number];
  t: number;
};
const SunBody: React.FC<{x: number; y: number; r: number; sw: number; t: number; face: SunFace; squash?: number; fs?: number}> = ({x, y, r, sw, t, face, squash = 1, fs = 1}) => {
  const n = 16;
  const spin = t * 6;
  const rays = Array.from({length: n}, (_, i) => {
    const a = ((i / n) * 360 + spin) * (Math.PI / 180);
    const w = (Math.PI / n) * 0.55;
    const r0 = r * 1.02;
    const r1 = r * (1.12 + 0.025 * Math.sin(t * 3 + i * 1.7));
    return `M ${Math.cos(a - w) * r0} ${Math.sin(a - w) * r0} L ${Math.cos(a) * r1} ${Math.sin(a) * r1} L ${Math.cos(a + w) * r0} ${Math.sin(a + w) * r0} Z`;
  }).join(' ');
  const L = Math.hypot(face.look[0], face.look[1]);
  const lk: [number, number] = L > 1 ? [face.look[0] / L, face.look[1] / L] : face.look;
  const off = 0.8 - 0.25 * clamp((fs - 0.6) / 0.4);
  const fx = lk[0] * r * off;
  const fy = lk[1] * r * off;
  const er = r * 0.1 * fs;
  const ex = r * 0.25 * fs;
  const fr = r * fs; // face feature unit
  const id = `sunclip-${Math.round(r)}`;
  const pupil = face.pupil ?? [lk[0] * 0.6, lk[1] * 0.6];
  const mood = face.mood;
  const eyeY = fy - r * 0.04 * fs;
  const mouthY = fy + r * 0.17 * fs;
  return (
    <g transform={`translate(${x} ${y}) scale(${1 / Math.sqrt(squash)}, ${squash})`}>
      <circle r={r * 1.7} fill="url(#sunglow)" />
      <path d={rays} fill={SUN_RAY} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
      <defs>
        <clipPath id={id}>
          <circle r={r} />
        </clipPath>
      </defs>
      <circle r={r} fill={SUN} />
      <g clipPath={`url(#${id})`}>
        <circle cx={r * 0.32} cy={r * 0.36} r={r * 1.0} fill="none" stroke={SUN_SHADE} strokeWidth={r * 0.28} opacity={0.75} />
        {/* face */}
        <ellipse cx={fx - ex * 1.55} cy={mouthY - fr * 0.04} rx={fr * 0.09} ry={fr * 0.055} fill="#FF8A5B" opacity={0.7} />
        <ellipse cx={fx + ex * 1.55} cy={mouthY - fr * 0.04} rx={fr * 0.09} ry={fr * 0.055} fill="#FF8A5B" opacity={0.7} />
        {mood === 'sleep' || face.open < 0.05 ? (
          <>
            <path d={`M ${fx - ex - er} ${eyeY} Q ${fx - ex} ${eyeY + er * 0.8} ${fx - ex + er} ${eyeY}`} fill="none" stroke={INK} strokeWidth={sw * 1.4} strokeLinecap="round" />
            <path d={`M ${fx + ex - er} ${eyeY} Q ${fx + ex} ${eyeY + er * 0.8} ${fx + ex + er} ${eyeY}`} fill="none" stroke={INK} strokeWidth={sw * 1.4} strokeLinecap="round" />
          </>
        ) : mood === 'happy' ? (
          <>
            <path d={`M ${fx - ex - er} ${eyeY + er * 0.3} Q ${fx - ex} ${eyeY - er} ${fx - ex + er} ${eyeY + er * 0.3}`} fill="none" stroke={INK} strokeWidth={sw * 1.5} strokeLinecap="round" />
            <path d={`M ${fx + ex - er} ${eyeY + er * 0.3} Q ${fx + ex} ${eyeY - er} ${fx + ex + er} ${eyeY + er * 0.3}`} fill="none" stroke={INK} strokeWidth={sw * 1.5} strokeLinecap="round" />
          </>
        ) : mood === 'dizzy' ? (
          [-1, 1].map((sd) => {
            const cx = fx + sd * ex;
            const pts = Array.from({length: 40}, (_, i) => {
              const a = i * 0.42 + t * 9 * sd;
              const rr = er * 1.1 * (i / 40);
              return `${i ? 'L' : 'M'} ${cx + Math.cos(a) * rr} ${eyeY + Math.sin(a) * rr}`;
            }).join(' ');
            return (
              <g key={sd}>
                <circle cx={cx} cy={eyeY} r={er * 1.15} fill="#FEFDFD" stroke={INK} strokeWidth={sw} />
                <path d={pts} fill="none" stroke={INK} strokeWidth={sw * 0.9} strokeLinecap="round" />
              </g>
            );
          })
        ) : (
          <>
            <Eye x={fx - ex} y={eyeY} r={er} open={face.open} look={pupil} side={-1} brow={0.75} browTilt={mood === 'worry' ? -1.6 : mood === 'smug' ? 0.4 : 0} lid={mood === 'smug' ? 0.45 : 0} ink={sw / er} />
            <Eye x={fx + ex} y={eyeY} r={er} open={face.open} look={pupil} side={1} brow={0.75} browTilt={mood === 'worry' ? -1.6 : mood === 'smug' ? 0.4 : 0} lid={mood === 'smug' ? 0.45 : 0} ink={sw / er} />
          </>
        )}
        {mood === 'sleep' ? (
          <path d={`M ${fx - fr * 0.06} ${mouthY} L ${fx + fr * 0.06} ${mouthY}`} stroke={INK} strokeWidth={sw * 1.3} strokeLinecap="round" />
        ) : mood === 'worry' || mood === 'dizzy' ? (
          <path
            d={`M ${fx - fr * 0.12} ${mouthY} q ${fr * 0.04} ${-fr * 0.04} ${fr * 0.08} 0 t ${fr * 0.08} 0 t ${fr * 0.08} 0`}
            fill="none"
            stroke={INK}
            strokeWidth={sw * 1.3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : mood === 'calm' ? (
          <ellipse cx={fx} cy={mouthY} rx={fr * 0.045} ry={fr * 0.055} fill="#7A2E1C" stroke={INK} strokeWidth={sw} />
        ) : (
          <path d={`M ${fx - fr * 0.13} ${mouthY - fr * 0.02} Q ${fx} ${mouthY + fr * 0.12} ${fx + fr * 0.13} ${mouthY - fr * 0.02} Z`} fill="#7A2E1C" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
        )}
      </g>
      <circle r={r} fill="none" stroke={INK} strokeWidth={sw * 1.2} />
      {face.sweat && face.sweat > 0.01 ? <SweatDrop x={fx + ex * 2.05} y={eyeY - er * 0.6 + 30 * (1 - face.sweat)} r={er * 0.6} s={face.sweat} rot={12} /> : null}
    </g>
  );
};

// ---------- Earth and Mars (code) ----------
const EarthBody: React.FC<{x: number; y: number; r: number; sw: number; spin: number; s?: number}> = ({x, y, r, sw, spin, s = 1}) => {
  const id = `earthclip-${Math.round(r)}`;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle r={r * 1.06} fill="#9FD3FF" opacity={0.35} />
      <defs>
        <clipPath id={id}>
          <circle r={r} />
        </clipPath>
      </defs>
      <circle r={r} fill={EARTH} />
      <g clipPath={`url(#${id})`}>
        <g transform={`rotate(${spin})`}>
          <path
            d={`M ${-r * 0.75} ${-r * 0.55} C ${-r * 0.4} ${-r * 0.85} ${-r * 0.05} ${-r * 0.7} ${-r * 0.12} ${-r * 0.4} C ${-r * 0.18} ${-r * 0.15} ${-r * 0.45} ${-r * 0.1} ${-r * 0.55} ${r * 0.15} C ${-r * 0.7} ${r * 0.35} ${-r * 0.95} ${r * 0.1} ${-r * 0.92} ${-r * 0.2} Z`}
            fill={LAND}
            stroke={INK}
            strokeWidth={sw}
            strokeLinejoin="round"
          />
          <path
            d={`M ${r * 0.2} ${-r * 0.25} C ${r * 0.55} ${-r * 0.45} ${r * 0.85} ${-r * 0.2} ${r * 0.75} ${r * 0.15} C ${r * 0.65} ${r * 0.45} ${r * 0.4} ${r * 0.75} ${r * 0.2} ${r * 0.55} C ${r * 0.05} ${r * 0.35} ${r * 0.3} ${r * 0.15} ${r * 0.1} ${r * 0.0} Z`}
            fill={LAND}
            stroke={INK}
            strokeWidth={sw}
            strokeLinejoin="round"
          />
          <path
            d={`M ${-r * 0.35} ${r * 0.55} C ${-r * 0.15} ${r * 0.5} ${0} ${r * 0.7} ${-r * 0.1} ${r * 0.85} C ${-r * 0.25} ${r * 0.95} ${-r * 0.45} ${r * 0.75} Z`}
            fill={LAND}
            stroke={INK}
            strokeWidth={sw}
            strokeLinejoin="round"
          />
          <ellipse cx={r * 0.05} cy={-r * 0.62} rx={r * 0.32} ry={r * 0.08} fill="#fff" opacity={0.9} />
          <ellipse cx={-r * 0.45} cy={r * 0.35} rx={r * 0.22} ry={r * 0.06} fill="#fff" opacity={0.9} />
        </g>
        <circle cx={r * 0.3} cy={r * 0.34} r={r * 1.0} fill="none" stroke={EARTH_SHADE} strokeWidth={r * 0.26} opacity={0.55} />
      </g>
      <circle r={r} fill="none" stroke={INK} strokeWidth={sw * 1.2} />
    </g>
  );
};
const MarsBody: React.FC<{x: number; y: number; r: number; sw: number}> = ({x, y, r, sw}) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r={r} fill={MARS} />
    <circle cx={-r * 0.3} cy={-r * 0.25} r={r * 0.17} fill={MARS_SHADE} stroke={INK} strokeWidth={sw * 0.6} />
    <circle cx={r * 0.35} cy={r * 0.1} r={r * 0.12} fill={MARS_SHADE} stroke={INK} strokeWidth={sw * 0.6} />
    <circle cx={-r * 0.05} cy={r * 0.45} r={r * 0.09} fill={MARS_SHADE} stroke={INK} strokeWidth={sw * 0.6} />
    <circle r={r} fill="none" stroke={INK} strokeWidth={sw * 1.2} />
  </g>
);

// rocket flame (code): outlined teardrop pointing out of the nozzle (local: nozzle at 0,0, flame goes +y)
const Flame: React.FC<{len: number; w: number; sw: number; t: number}> = ({len, w, sw, t}) => {
  if (len <= 1) return null;
  const f = 1 + 0.12 * Math.sin(t * 47) + 0.08 * Math.sin(t * 31 + 1);
  const L = len * f;
  const outer = `M ${-w} 0 Q ${-w * 0.9} ${L * 0.55} 0 ${L} Q ${w * 0.9} ${L * 0.55} ${w} 0 Z`;
  const inner = `M ${-w * 0.55} 0 Q ${-w * 0.45} ${L * 0.4} 0 ${L * 0.62} Q ${w * 0.45} ${L * 0.4} ${w * 0.55} 0 Z`;
  return (
    <g>
      <path d={outer} fill="#FF6A2B" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
      <path d={inner} fill="#FFD45E" />
    </g>
  );
};

// the rocket sprite drawn about its centre with an optional flame
const Rocket: React.FC<{x: number; y: number; rot: number; s: number; flame: number; sw: number; t: number; sx?: number; sy?: number}> = ({x, y, rot, s, flame, sw, t, sx = 1, sy = 1}) => {
  const h = (SPR.rocket.bottom - SPR.rocket.top) * ROCKET_S * s;
  const cx = (SPR.rocket.left + SPR.rocket.right) / 2;
  const cy = (SPR.rocket.top + SPR.rocket.bottom) / 2;
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg) scale(${sx}, ${sy})`, transformOrigin: '0 0'}}>
      {flame > 0.01 ? (
        <svg style={{position: 'absolute', left: -400, top: h * 0.44, overflow: 'visible'}} width={800} height={10} viewBox={`-400 0 800 10`}>
          <Flame len={h * 0.55 * flame} w={h * 0.11} sw={sw} t={t} />
        </svg>
      ) : null}
      <Img src={F('rocket')} style={{position: 'absolute', left: -cx * ROCKET_S * s, top: -cy * ROCKET_S * s, width: SPR.rocket.w * ROCKET_S * s, height: SPR.rocket.h * ROCKET_S * s}} />
    </div>
  );
};

// ---------- the guy ----------
type Pose = 'hero' | 'aim' | 'shock' | 'pull' | 'wave' | 'palm' | 'thumb';
const poseS = (p: Pose) => HR / (SPR[p] as unknown as {head: number[]}).head[2];
const Guy: React.FC<{p: Pose; x: number; y: number; sx?: number; sy?: number; rot?: number; shadow?: boolean}> = ({p, x, y, sx = 1, sy = 1, rot = 0, shadow = true}) => (
  <>
    {shadow ? (
      <div
        style={{
          position: 'absolute',
          left: x - 70,
          top: y - 9,
          width: 140,
          height: 18,
          borderRadius: '50%',
          background: SHADOW,
          filter: 'blur(3px)',
          transform: `rotate(${rot}deg)`,
        }}
      />
    ) : null}
    <Spr n={p} x={x} y={y} s={poseS(p)} sx={sx} sy={sy} rot={rot} />
  </>
);
// world position of a sprite point (px) for a guy pose standing at (x, y) with rotation rot
const guyPoint = (p: Pose, x: number, y: number, rot: number, px: number, py: number): [number, number] => {
  const sp = SPR[p] as unknown as {feet: [number, number]};
  const s = poseS(p);
  const [dx, dy] = rotP((px - sp.feet[0]) * s, (py - sp.feet[1]) * s, rot);
  return [x + dx, y + dy];
};

// ---------- background: the space plate (screen space, gentle parallax) ----------
const SpaceBg: React.FC<{cam: Cam}> = ({cam}) => {
  const sc = 1.32 * Math.pow(clamp(cam.k / 0.23, 1, 9), 0.06);
  const w = SPR.bg.w * sc;
  const h = SPR.bg.h * sc;
  const ox = ((-cam.x * 0.012) % 60) - (w - 1080) / 2;
  const oy = ((-cam.y * 0.012) % 60) - (h - 1920) / 2;
  return <Img src={F('bg')} style={{position: 'absolute', left: ox, top: oy, width: w, height: h}} />;
};

// ---------- rocket path ----------
const RA = 1700;
const RP = 1420;
const ORB_A = (RA + RP) / 2;
const ORB_E = (RA - RP) / (RA + RP);
const ORB_B = ORB_A * Math.sqrt(1 - ORB_E * ORB_E);
const ORB_P = 2.4;
const LAUNCH = T.so2;
const padBase = (t: number): [number, number] => {
  const [ex, ey] = earthAt(t);
  return [ex + PAD, ey + surfY(PAD)];
};
const padCenter = (t: number, rot: number): [number, number] => {
  const [bx, by] = padBase(t);
  const [dx, dy] = rotP(0, -ROCKET_H / 2, rot);
  return [bx + dx, by + dy];
};
const aimRotFrom = (x: number, y: number) => dirDeg(-x, -y);
const L0 = padBase(LAUNCH);
const PSI0 = Math.atan2(L0[1], L0[0]);
const orbitAt = (t: number): [number, number] => {
  const M = Math.PI + (2 * Math.PI * (t - LAUNCH)) / ORB_P;
  let E = M;
  for (let i = 0; i < 6; i++) E = E - (E - ORB_E * Math.sin(E) - M) / (1 - ORB_E * Math.cos(E));
  const ox = ORB_A * (Math.cos(E) - ORB_E);
  const oy = -ORB_B * Math.sin(E);
  // aphelion (E = pi) is at -x: rotate so it points at the launch direction
  const al = PSI0 - Math.PI;
  return [ox * Math.cos(al) - oy * Math.sin(al), ox * Math.sin(al) + oy * Math.cos(al)];
};
type RocketState = {x: number; y: number; rot: number; s: number; flame: number; sx: number; sy: number};
const AIM0 = tiltAt(PAD);
const rocketAB = (t: number): RocketState => {
  // on the pad: stands tilted on the round Earth, then aims at the Sun on "aim" (and keeps aiming as Earth moves)
  if (t < LAUNCH) {
    const [bx, by] = padBase(t);
    const aimTo = aimRotFrom(bx, by - ROCKET_H / 2);
    const u = easeOutBack(prog(t, T.aim, T.aim + 0.5), 2.5);
    const rot = t < T.aim ? AIM0 : lerp(AIM0, aimTo, u);
    const hit = t >= 1.72 ? spring(t - 1.72, 3, 6) : 0;
    const [cx, cy] = padCenter(t, rot);
    return {x: cx, y: cy, rot: rot + 3 * hit, s: 1, flame: 0, sx: 1 + 0.05 * hit, sy: 1 - 0.06 * hit};
  }
  const u = easeInOutCubic(prog(t, LAUNCH, LAUNCH + 0.75));
  const [bx, by] = padBase(t);
  const rot0 = aimRotFrom(bx, by - ROCKET_H / 2);
  const [px, py] = padCenter(t, rot0);
  const lift = 700 * easeInCubic(prog(t, LAUNCH, LAUNCH + 0.75));
  const [lx, ly] = rotP(0, -lift, rot0);
  const [ox, oy] = orbitAt(t);
  const x = lerp(px + lx, ox, u);
  const y = lerp(py + ly, oy, u);
  const s = lerp(1, 2.3, easeOutCubic(prog(t, LAUNCH, LAUNCH + 0.7)));
  const flame = t < LAUNCH + 0.9 ? Math.sin(Math.PI * prog(t, LAUNCH - 0.05, LAUNCH + 0.9)) * 1.2 : 0;
  return {x, y, rot: aimRotFrom(x, y), s, flame, sx: 1, sy: 1 + 0.08 * flame};
};
// shot E: the rocket passes under the Sun, turns around, takes one can of fuel and leaves
const RE_R = 1200;
const EY_E = (t: number) => lerp(2050, D, easeInOutCubic(prog(t, 22.55, DURATION)));
const psiE = (t: number) => {
  if (t < T.turn) return lerp(128, 96, easeOutCubic(prog(t, CUT_B6 - 0.1, T.turn)));
  if (t < T.fuel) return lerp(96, 92, prog(t, T.turn, T.fuel));
  if (t < T.leaves) return lerp(92, 82, easeInCubic(prog(t, T.fuel, T.leaves)) * 0.6 + 0.4 * prog(t, T.fuel, T.leaves));
  return lerp(82, 30, easeInCubic(prog(t, T.leaves, T.leaves + 0.65)));
};
const rocketE = (t: number): RocketState => {
  const psi = (psiE(t) * Math.PI) / 180;
  const r = t < T.leaves ? RE_R : lerp(RE_R, 1700, easeInCubic(prog(t, T.leaves, T.leaves + 0.65)));
  const x = r * Math.cos(psi);
  const y = r * Math.sin(psi);
  const aim = aimRotFrom(x, y);
  const pro = dirDeg(Math.sin(psi), -Math.cos(psi));
  let rot = aim;
  if (t >= T.turn) {
    const u = prog(t, T.turn, T.around + 0.3);
    rot = lerp(aim, pro - 360, easeInOutCubic(u)) + (u >= 1 ? 6 * spring(t - T.around - 0.3, 2.5, 5) : 0);
  }
  const flame = t < T.fuel ? 0 : t < T.leaves ? 0.45 * pop(t, T.fuel, 0.25) : lerp(0.45, 1.25, easeOutCubic(prog(t, T.leaves, T.leaves + 0.25)));
  const s = t < T.leaves ? 0.6 : lerp(0.6, 0.42, prog(t, T.leaves, T.leaves + 0.65));
  const gulp = t >= 20.5 ? spring(t - 20.5, 3, 6) : 0;
  return {x, y, rot, s, flame, sx: 1 + 0.08 * gulp, sy: 1 - 0.06 * gulp};
};

// ---------- trails ----------
const trailPath = (fn: (t: number) => [number, number], t0: number, t1: number, n = 90) => {
  if (t1 <= t0 + 0.02) return '';
  return Array.from({length: n + 1}, (_, i) => {
    const [x, y] = fn(lerp(t0, t1, i / n));
    return `${i ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(' ');
};

// ---------- shots A + B (one continuous camera): hook, pull-out, launch, circling ----------
const ShotAB: React.FC<{t: number; k: number; cover?: boolean}> = ({t, k, cover = false}) => {
  const sw = 5.5 / k;
  const th = thetaDeg(t);
  const [ex, ey] = earthAt(t);
  const R = rocketAB(t);
  // Sun face
  const sunLook: [number, number] = (() => {
    if (t < T.but) return [0, 1];
    const target = t < LAUNCH + 0.4 ? [ex, ey] : [R.x, R.y];
    const L = Math.hypot(target[0], target[1]);
    const v: [number, number] = [target[0] / L, target[1] / L];
    if (t < T.but + 0.6) {
      const u = easeInOutCubic(prog(t, T.but, T.but + 0.6));
      return [lerp(0, v[0], u), lerp(1, v[1], u)];
    }
    return v;
  })();
  const dizzy = t >= 10.2 && t < 11.0;
  const face: SunFace = {
    look: sunLook,
    open: t < T.sun ? 0 : pop(t, T.sun, 0.25),
    mood: t < T.sun ? 'sleep' : dizzy ? 'dizzy' : t < T.but ? 'worry' : t < 10.2 ? 'calm' : 'smug',
    sweat: t >= T.sunEnd && t < T.but + 0.4 ? popOut(t, T.sunEnd, T.but + 0.15) : 0,
    t,
  };
  // the guy on Earth
  let pose: Pose = 'hero';
  if (t >= 1.28) pose = 'aim';
  if (t >= T.but + 0.08) pose = 'shock';
  if (t >= LAUNCH + 0.05) pose = 'aim';
  const swaps = [1.28, T.but + 0.08, LAUNCH + 0.05];
  let sq: [number, number] = [1, 1];
  for (const s of swaps) {
    const q = squashSwap(t, s);
    if (q[0] !== 1 || q[1] !== 1) sq = q;
  }
  const windUp = t < 1.28 ? -4 * Math.sin(Math.PI * prog(t, 0.9, 1.28)) : 0;
  const gx = GUY_A;
  const gy = surfY(gx);
  const tilt = tiltAt(gx);
  const tremble = pose === 'shock' ? 1.6 * Math.sin(t * 2 * Math.PI * 9) : 0;
  const guyX = ex + gx + tremble;
  const guyY = ey + gy;
  // bag toss: from the hero's bag to the rocket's middle
  const bagT0 = 1.28;
  const bagT1 = 1.72;
  const bagStart = guyPoint('hero', ex + gx, ey + gy, tilt, (SPR.hero.bag[0] + SPR.hero.bag[2]) / 2, (SPR.hero.bag[1] + SPR.hero.bag[3]) / 2);
  const bagEnd = padCenter(t, AIM0);
  const bu = prog(t, bagT0, bagT1);
  const bagX = lerp(bagStart[0], bagEnd[0], bu);
  const bagY = lerp(bagStart[1], bagEnd[1], bu) - 260 * Math.sin(Math.PI * bu);
  // orbit trails
  const earthTrail = t > T.sideways - 0.3 && t < CUT_B4 ? trailPath(earthAt, Math.max(T.but, t - 6.5), t) : '';
  const rocketTrail = t > LAUNCH + 0.3 ? trailPath(orbitAt, Math.max(LAUNCH + 0.6, t - 2.3), t) : '';
  const trailO = clamp((t - T.sideways + 0.3) / 0.4);
  // big arrow ahead of Earth along its orbit
  const arrowS = popOut(t, T.sideways, LAUNCH - 0.1, 0.35);
  const a0 = th - 13;
  const a1 = th - 13 - 42 * arrowS;
  const arc = (a: number, r: number) => [r * Math.cos((a * Math.PI) / 180), r * Math.sin((a * Math.PI) / 180)];
  const arrowPts = Array.from({length: 25}, (_, i) => arc(lerp(a0, a1, i / 24), D));
  const arrowD = arrowPts.map((p, i) => `${i ? 'L' : 'M'} ${p[0]} ${p[1]}`).join(' ');
  const tip = arc(a1 - 5, D);
  const tipL = arc(a1, D - 200);
  const tipR = arc(a1, D + 200);
  // speed lines behind Earth
  const moving = t > T.but + 0.3 && t < CUT_B4;
  const crossS = popOut(t, T.aim + 0.4, T.but - 0.05, 0.3);
  const crossY = 835;
  const likePulse = 1 + 0.1 * bump(t, T.earth2, 0.35);
  return (
    <>
      <Svg x={0} y={0} r={6000}>
        <defs>
          <radialGradient id="sunglow">
            <stop offset="55%" stopColor="#FFE38A" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#FFE38A" stopOpacity={0} />
          </radialGradient>
        </defs>
        {earthTrail ? <path d={earthTrail} fill="none" stroke="#fff" strokeOpacity={0.55 * trailO} strokeWidth={14 / k / 2} strokeDasharray={`${40 / k} ${30 / k}`} strokeLinecap="round" /> : null}
        {rocketTrail ? <path d={rocketTrail} fill="none" stroke={TEXT_YEL} strokeOpacity={0.75} strokeWidth={8 / k} strokeDasharray={`${30 / k} ${24 / k}`} strokeLinecap="round" /> : null}
        <SunBody x={0} y={0} r={RS} sw={sw} t={t} face={face} fs={lerp(0.6, 1, easeInOutCubic(prog(t, T.but, 5.5)))} />
        {crossS > 0.01 ? (
          <g transform={`translate(0 ${crossY}) scale(${crossS}) rotate(${(1 - crossS) * 90})`}>
            <circle r={215} fill="none" stroke={INK} strokeWidth={26} />
            <circle r={215} fill="none" stroke="#FF3B3B" strokeWidth={13} />
            {[0, 90, 180, 270].map((a) => {
              const [x1, y1] = rotP(0, -175, a);
              const [x2, y2] = rotP(0, -262, a);
              return (
                <g key={a}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={INK} strokeWidth={26} strokeLinecap="round" />
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FF3B3B" strokeWidth={13} strokeLinecap="round" />
                </g>
              );
            })}
          </g>
        ) : null}
        {moving
          ? [-1, 0, 1].map((i) => {
              const r = D + i * 230;
              const ph = (t * 3 + i * 0.37) % 1;
              const s0 = th + 14 + 4 * ph;
              const s1 = s0 + 16 + 6 * Math.sin(t * 5 + i);
              const pts = Array.from({length: 9}, (_, j) => arc(lerp(s0, s1, j / 8), r));
              const d = pts.map((p, j) => `${j ? 'L' : 'M'} ${p[0]} ${p[1]}`).join(' ');
              return (
                <g key={i}>
                  <path d={d} fill="none" stroke={INK} strokeWidth={22 / k} strokeLinecap="round" />
                  <path d={d} fill="none" stroke="#fff" strokeWidth={11 / k} strokeLinecap="round" />
                </g>
              );
            })
          : null}
        {arrowS > 0.01 ? (
          <g>
            <path d={arrowD} fill="none" stroke={INK} strokeWidth={34 / k} strokeLinecap="round" />
            <path d={`M ${tip[0]} ${tip[1]} L ${tipL[0]} ${tipL[1]} L ${tipR[0]} ${tipR[1]} Z`} fill="#fff" stroke={INK} strokeWidth={9 / k} strokeLinejoin="round" />
            <path d={arrowD} fill="none" stroke="#fff" strokeWidth={18 / k} strokeLinecap="round" />
          </g>
        ) : null}
        <EarthBody x={ex} y={ey} r={RE} sw={sw} spin={-t * 8} s={likePulse} />
      </Svg>
      {/* the guy and the rocket on Earth */}
      <Guy p={pose} x={guyX} y={guyY} sx={sq[0]} sy={sq[1] * breathe(t)} rot={tilt + windUp} />
      {t < LAUNCH + 0.02 ? (
        <div style={{position: 'absolute', left: ex + PAD - 75, top: ey + surfY(PAD) - 10, width: 150, height: 20, borderRadius: '50%', background: SHADOW, filter: 'blur(3px)', transform: `rotate(${AIM0}deg)`}} />
      ) : null}
      {t >= bagT0 && t < bagT1 ? <Spr n="bag" x={bagX} y={bagY} s={BAG_S} rot={bu * 300} ax={SPR.bag.w / 2} ay={SPR.bag.h / 2} /> : null}
      {/* launch smoke */}
      {t >= LAUNCH - 0.05 && t < LAUNCH + 1.4 ? (
        <Svg x={0} y={0} r={6000}>
          <PuffCluster
            puffs={Array.from({length: 7}, (_, i) => {
              const age = t - LAUNCH - i * 0.05;
              if (age < 0) return {x: 0, y: 0, r: 0};
              const life = 1.2;
              const g = Math.sin(Math.PI * clamp(age / life));
              const [bx, by] = padBase(LAUNCH);
              return {x: bx + (i - 3) * 60 + (i - 3) * 90 * age, y: by - 20 - 60 * age - rnd(i) * 30, r: 70 * g * (0.7 + 0.5 * rnd(i + 4))};
            })}
            fill="#E9E9EE"
            ink={sw}
            shade="#D2D2DA"
          />
        </Svg>
      ) : null}
      <Rocket x={R.x} y={R.y} rot={R.rot} s={R.s} flame={R.flame} sw={sw} t={t} sx={R.sx} sy={R.sy} />
      {t >= bagT1 && t < bagT1 + 0.25 ? (
        <Svg x={0} y={0}>
          <Sparkle x={bagEnd[0] + 70} y={bagEnd[1] - 60} r={34} s={Math.sin(Math.PI * prog(t, bagT1, bagT1 + 0.25))} sw={sw} rot={t * 200} />
        </Svg>
      ) : null}
    </>
  );
};

// the speed badge and the "like Earth" label (screen space, follows Earth's screen position)
const OverlayAB: React.FC<{t: number; cam: Cam}> = ({t, cam}) => {
  const [ex, ey] = earthAt(t);
  const sx = 540 + (ex - cam.x) * cam.k;
  const sy = 960 + (ey - cam.y) * cam.k;
  const badge = popOut(t, T.sixty, LAUNCH - 0.15, 0.3);
  void sx;
  void sy;
  const bx = 540;
  const by = 330;
  return (
    <svg style={{position: 'absolute', left: 0, top: 0}} width={1080} height={1920} viewBox="0 0 1080 1920">
      <Txt x={bx} y={by} size={112} s={badge} text="67,000 MPH" fill={TEXT_YEL} rot={-4} />
    </svg>
  );
};

// ---------- shot C: the brake lever + speed gauge ----------
const LEVER_X = 100;
const ShotC: React.FC<{t: number; k: number}> = ({t, k}) => {
  const sw = 5.5 / k;
  const gx = -70;
  const tilt = tiltAt(gx);
  const strain = prog(t, T.fall - 0.1, T.speedEnd);
  const lean = -4 - 10 * easeOutCubic(strain) + 2.2 * Math.sin(t * 2 * Math.PI * 7) * (strain > 0 && t < T.speedEnd ? 1 : 0);
  const gy = surfY(gx);
  const rot = tilt + lean;
  const sq = squashSwap(t, CUT_B4 + 0.02);
  const hand = guyPoint('pull', gx, gy, rot, SPR.pull.hand[0], SPR.pull.hand[1]);
  const pivot: [number, number] = [LEVER_X, surfY(LEVER_X) - 62];
  const boxRot = tiltAt(LEVER_X);
  const sweat1 = popOut(t, T.almost, T.almost + 0.7);
  const sweat2 = popOut(t, T.speed - 0.2, CUT_B5);
  const head = guyPoint('pull', gx, gy, rot, SPR.pull.head[0], SPR.pull.head[1]);
  return (
    <>
      <Svg x={0} y={0} r={3000}>
        <defs>
          <radialGradient id="sunglow">
            <stop offset="55%" stopColor="#FFE38A" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#FFE38A" stopOpacity={0} />
          </radialGradient>
        </defs>
        <EarthBody x={0} y={0} r={RE} sw={sw} spin={-t * 8} />
        {/* lever box */}
        <g transform={`translate(${LEVER_X} ${surfY(LEVER_X)}) rotate(${boxRot})`}>
          <rect x={-58} y={-70} width={116} height={74} rx={10} fill="#A7B0C2" stroke={INK} strokeWidth={sw} />
          <rect x={-46} y={-56} width={92} height={30} rx={6} fill="#E8433A" stroke={INK} strokeWidth={sw * 0.7} />
          <text x={0} y={-34} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={22} fill="#fff">
            BRAKE
          </text>
        </g>
      </Svg>
      <Guy p="pull" x={gx} y={gy} sx={sq[0]} sy={sq[1]} rot={rot} />
      <Svg x={0} y={0} r={3000}>
        <line x1={pivot[0]} y1={pivot[1]} x2={hand[0]} y2={hand[1]} stroke={INK} strokeWidth={24} strokeLinecap="round" />
        <line x1={pivot[0]} y1={pivot[1]} x2={hand[0]} y2={hand[1]} stroke="#7D8699" strokeWidth={13} strokeLinecap="round" />
        <circle cx={pivot[0]} cy={pivot[1]} r={13} fill="#5B6375" stroke={INK} strokeWidth={sw * 0.8} />
        <circle cx={hand[0]} cy={hand[1]} r={19} fill="#FF3B3B" stroke={INK} strokeWidth={sw} />
        <SweatDrop x={head[0] - 62} y={head[1] - 40 + 40 * prog(t, T.almost, T.almost + 0.7)} r={13} s={sweat1} rot={-20} />
        <SweatDrop x={head[0] + 58} y={head[1] - 50 + 40 * prog(t, T.speed - 0.2, CUT_B5)} r={13} s={sweat2} rot={20} />
      </Svg>
    </>
  );
};
const GaugeC: React.FC<{t: number}> = ({t}) => {
  const cx = 540;
  const cy = 600;
  const R = 330;
  const v0 = 1 - 0.92 * Math.pow(prog(t, T.lose - 0.05, T.speed + 0.1), 0.85);
  const struggling = t > T.lose && t < T.speedEnd + 0.2 ? 1 : 0;
  const v = clamp(v0 + 0.025 * Math.sin(t * 2 * Math.PI * 6.5) * struggling);
  const ang = Math.PI * (1 - v); // 0 = right (max)
  const at = (vv: number, r: number): [number, number] => {
    const a = Math.PI * vv; // 0 at left (v=0) .. PI at right (v=1)
    return [cx - Math.cos(a) * r, cy - Math.sin(a) * r];
  };
  void ang;
  const arcD = (v1: number, v2: number, r: number) => {
    const p1 = at(v1, r);
    const p2 = at(v2, r);
    return `M ${p1[0]} ${p1[1]} A ${r} ${r} 0 0 1 ${p2[0]} ${p2[1]}`;
  };
  const s = pop(t, CUT_B4 + 0.05, 0.3);
  const n = at(v, R * 0.82);
  const zone = 0.12;
  return (
    <svg style={{position: 'absolute', left: 0, top: 0}} width={1080} height={1920} viewBox="0 0 1080 1920">
      <g transform={`translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`}>
        <path d={`${arcD(0, 1, R)} L ${cx + R} ${cy + 40} L ${cx - R} ${cy + 40} Z`} fill="#FEFDFD" stroke={INK} strokeWidth={12} strokeLinejoin="round" />
        <path d={arcD(0.005, zone, R - 40)} fill="none" stroke={INK} strokeWidth={58} />
        <path d={arcD(0.005, zone, R - 40)} fill="none" stroke={SUN} strokeWidth={44} />
        {Array.from({length: 11}, (_, i) => {
          const p1 = at(i / 10, R - 8);
          const p2 = at(i / 10, R - (i % 5 === 0 ? 70 : 44));
          return <line key={i} x1={p1[0]} y1={p1[1]} x2={p2[0]} y2={p2[1]} stroke={INK} strokeWidth={i % 5 === 0 ? 10 : 6} strokeLinecap="round" />;
        })}
        <Txt x={at(0.07, R - 125)[0]} y={at(0.07, R - 125)[1]} size={36} text="FALL IN" fill={SUN} rot={-75} />
        <Txt x={cx} y={cy - R - 64} size={64} text="ROCKET SPEED" />
        <Txt x={cx + R - 10} y={cy + 92} size={50} text="67,000" fill={TEXT_YEL} />
        <Txt x={cx - R + 10} y={cy + 92} size={50} text="0" fill={TEXT_YEL} />
        <line x1={cx} y1={cy} x2={n[0]} y2={n[1]} stroke={INK} strokeWidth={26} strokeLinecap="round" />
        <line x1={cx} y1={cy} x2={n[0]} y2={n[1]} stroke="#FF3B3B" strokeWidth={12} strokeLinecap="round" />
        <circle cx={cx} cy={cy} r={30} fill="#444" stroke={INK} strokeWidth={10} />
      </g>
    </svg>
  );
};

// ---------- shot D: 1 can to Mars vs 55 cans to the Sun ----------
const ShotD: React.FC<{t: number; k: number}> = ({t, k}) => {
  const sw = 5.5 / k;
  const pose: Pose = t >= T.energy - 0.1 ? 'palm' : 'shock';
  const sq = squashSwap(t, T.energy - 0.1);
  const sq0 = squashSwap(t, CUT_B5 + 0.02);
  const tremble = pose === 'shock' ? 1.6 * Math.sin(t * 2 * Math.PI * 9) : 0;
  const slump = pose === 'palm' ? 1 - 0.03 * easeOutCubic(prog(t, T.energy, T.energy + 0.4)) : 1;
  return (
    <>
      <Svg x={0} y={0} r={3000}>
        <EarthBody x={0} y={0} r={RE} sw={sw} spin={-t * 8} />
      </Svg>
      <Guy p={pose} x={tremble} y={surfY(0)} sx={sq[0] * sq0[0]} sy={sq[1] * sq0[1] * breathe(t) * slump} />
    </>
  );
};
const CanImg: React.FC<{x: number; y: number; h: number; rot?: number; s?: number}> = ({x, y, h, rot = 0, s = 1}) => {
  const sc = (h / (SPR.can.bottom - SPR.can.top)) * s;
  if (s <= 0.001) return null;
  return (
    <Img
      src={F('can')}
      style={{
        position: 'absolute',
        left: x - (SPR.can.w * sc) / 2,
        top: y - SPR.can.feet[1] * sc,
        width: SPR.can.w * sc,
        height: SPR.can.h * sc,
        transform: `rotate(${rot}deg)`,
        transformOrigin: `50% ${(SPR.can.feet[1] / SPR.can.h) * 100}%`,
      }}
    />
  );
};
const OverlayD: React.FC<{t: number}> = ({t}) => {
  const CAN_H = 118;
  const STEP = CAN_H * 0.86;
  const n = t < T.fifty ? 1 : Math.round(1 + 54 * Math.pow(prog(t, T.fifty, T.times + 0.05), 1.4));
  const baseY = 990; // bottom of the tower (screen)
  const visible = 9;
  const scroll = Math.max(0, n - visible) * STEP;
  const marsS = pop(t, CUT_B5 + 0.05, 0.3);
  const sunS = pop(t, CUT_B5 + 0.15, 0.3);
  const marsBounce = bump(t, T.mars, 0.3);
  const countS = pop(t, T.fifty, 0.25) * (1 + 0.12 * bump(t, T.times, 0.25));
  return (
    <AbsoluteFill>
      <svg style={{position: 'absolute', left: 0, top: 0}} width={1080} height={1920} viewBox="0 0 1080 1920">
        <defs>
          <radialGradient id="sunglow">
            <stop offset="55%" stopColor="#FFE38A" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#FFE38A" stopOpacity={0} />
          </radialGradient>
        </defs>
        <g transform={`translate(240 1090) scale(${marsS})`}>
          <MarsBody x={0} y={0} r={88} sw={6} />
        </g>
        <Txt x={240} y={1230} size={58} s={marsS} text="TO MARS" />
        <g transform={`translate(830 1090) scale(${sunS})`}>
          
          <SunBody x={0} y={0} r={88} sw={6} t={t} face={{look: [0, -0.4], open: 1, mood: t >= T.times ? 'smug' : 'calm', t, pupil: [0, -0.7]}} />
        </g>
        <Txt x={830} y={1230} size={58} s={sunS} text="TO THE SUN" />
        <Txt x={240} y={860 - CAN_H - 40 - 30 * marsBounce} size={84} s={marsS} text="×1" fill={TEXT_YEL} />
        <Txt x={600} y={260} size={150} s={countS} text={`×${n}`} fill={TEXT_YEL} rot={-6} />
      </svg>
      {/* 1 can on Mars */}
      <CanImg x={240} y={985 - 26 * marsBounce} h={CAN_H} s={marsS} rot={-6 * marsBounce} />
      {/* the tower of cans on the Sun (clipped above the Sun icon, scrolls as it grows past the top) */}
      <div style={{position: 'absolute', left: 0, top: 0, width: 1080, height: baseY, overflow: 'hidden'}}>
        {Array.from({length: n}, (_, i) => {
          const y = baseY - i * STEP + scroll;
          if (y < -40 || y > baseY + CAN_H) return null;
          const wob = Math.sin(t * 5 + i * 0.7) * Math.min(1, i / 20) * 7;
          return <CanImg key={i} x={830 + wob} y={y} h={CAN_H} rot={wob * 0.6} />;
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------- shot E: under the Sun again: turn around, one can of fuel, gone; a new rocket pops up ----------
const ShotE: React.FC<{t: number; k: number; cover?: boolean}> = ({t, k, cover = false}) => {
  const sw = 5.5 / k;
  const ex = 0;
  const ey = EY_E(t);
  const R = rocketE(t);
  const gone = t > T.leaves + 0.7;
  const back = easeInOutCubic(prog(t, 22.9, 23.6));
  const face: SunFace = {
    look: gone ? [lerp(0.35, 0, back), lerp(0.94, 1, back)] : [clamp(R.x / 900, -0.8, 0.8), 0.9],
    open: 1,
    mood: t >= 23.45 ? 'sleep' : t >= T.leaves + 0.2 ? 'happy' : t >= T.turn && t < T.around + 0.4 ? 'worry' : 'calm',
    t,
    pupil: gone ? [0.6, 0.5] : [clamp(R.x / 500, -0.8, 0.8), 0.6],
  };
  let pose: Pose = 'aim';
  if (t >= T.less) pose = 'thumb';
  if (t >= T.leaves) pose = 'wave';
  if (t >= T.end + 0.02) pose = 'hero';
  const swaps = [CUT_B6 + 0.02, T.less, T.leaves, T.end + 0.02];
  let sq: [number, number] = [1, 1];
  for (const s of swaps) {
    const q = squashSwap(t, s);
    if (q[0] !== 1 || q[1] !== 1) sq = q;
  }
  const gx = GUY_E;
  const gy = surfY(gx);
  const tilt = tiltAt(gx);
  const waving = pose === 'wave' ? 4 * Math.sin(t * 2 * Math.PI * 2.2) : 0;
  // one can of fuel drops into the rocket
  const canS = popOut(t, T.way - 0.15, 20.42, 0.25);
  const canDrop = prog(t, 20.22, 20.48);
  const canX = R.x;
  const canY = R.y - 230 + 190 * easeInCubic(canDrop);
  // turn-around puff
  const puffAge = t - T.turn - 0.05;
  const newRocket = pop(t, T.end + 0.05, 0.3);
  const twinkle = t > 22.6 ? Math.sin(Math.PI * prog(t, 22.6, 23.35)) : 0;
  return (
    <>
      <Svg x={0} y={0} r={6000}>
        <defs>
          <radialGradient id="sunglow">
            <stop offset="55%" stopColor="#FFE38A" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#FFE38A" stopOpacity={0} />
          </radialGradient>
        </defs>
        <SunBody x={0} y={0} r={RS} sw={sw} t={t} face={face} fs={0.6} />
        <EarthBody x={ex} y={ey} r={RE} sw={sw} spin={-t * 8} />
        {puffAge > 0 && puffAge < 1.0 ? (
          <PuffCluster
            puffs={Array.from({length: 6}, (_, i) => {
              // small puffs left behind at the tail while it spins
              const g = Math.sin(Math.PI * clamp((puffAge - i * 0.06) / 0.6));
              const [tx, ty] = rotP(0, 75, R.rot - i * 40);
              return {x: R.x + tx * (1 + 0.6 * puffAge), y: R.y + ty * (1 + 0.6 * puffAge) - 20 * puffAge, r: Math.max(0, 22 * g)};
            })}
            fill="#E9E9EE"
            ink={sw}
          />
        ) : null}
        <Sparkle x={400} y={1000} r={42} s={cover ? 0 : twinkle} sw={sw} rot={t * 120} />
      </Svg>
      {!gone && !cover ? <Rocket x={R.x} y={R.y} rot={R.rot} s={R.s} flame={R.flame} sw={sw} t={t} sx={R.sx} sy={R.sy} /> : null}
      {canS > 0.01 && !cover ? <Spr n="can" x={canX} y={canY} s={1.5 * CAN_S * canS * (1 - 0.6 * canDrop)} ax={SPR.can.w / 2} ay={SPR.can.h / 2} rot={150 * canDrop} /> : null}
      {!cover ? (
        <Svg x={0} y={0} r={6000}>
          <Txt x={canX + 150} y={R.y - 230} size={78} s={popOut(t, T.way - 0.1, T.trash3, 0.25)} text="×1" fill={TEXT_YEL} rot={-5} />
        </Svg>
      ) : null}
      <Guy p={pose} x={ex + gx} y={ey + gy} sx={sq[0]} sy={sq[1] * breathe(t)} rot={tilt + waving} />
      {newRocket > 0.01 ? (
        <>
          <div style={{position: 'absolute', left: ex + PAD - 75, top: ey + surfY(PAD) - 10, width: 150, height: 20, borderRadius: '50%', background: SHADOW, filter: 'blur(3px)', transform: `rotate(${AIM0}deg)`}} />
          <Spr n="rocket" x={ex + PAD} y={ey + surfY(PAD)} s={ROCKET_S} sx={newRocket} sy={newRocket} rot={AIM0} />
        </>
      ) : null}
    </>
  );
};
export const Scene: React.FC<{t: number; cam: Cam; cover?: boolean}> = ({t, cam, cover = false}) => {
  const shot = t < CUT_B4 ? 'AB' : t < CUT_B5 ? 'C' : t < CUT_B6 ? 'D' : 'E';
  return (
    <AbsoluteFill style={{background: SPACE, overflow: 'hidden'}}>
      <SpaceBg cam={cam} />
      <World cam={cam}>
        {shot === 'AB' ? <ShotAB t={t} k={cam.k} cover={cover} /> : null}
        {shot === 'C' ? <ShotC t={t} k={cam.k} /> : null}
        {shot === 'D' ? <ShotD t={t} k={cam.k} /> : null}
        {shot === 'E' ? <ShotE t={t} k={cam.k} cover={cover} /> : null}
      </World>
      {shot === 'AB' && !cover ? <OverlayAB t={t} cam={cam} /> : null}
      {shot === 'C' ? <GaugeC t={t} /> : null}
      {shot === 'D' ? <OverlayD t={t} /> : null}
    </AbsoluteFill>
  );
};

// ---------- sound ----------
const CUES: Cue[] = [
  {f: 'whoosh', at: 1.14, db: -27},
  {f: 'catch', at: 1.71, db: -21},
  {f: 'pop', at: 2.5, db: -22},
  {f: 'flip', at: T.aim - 0.2, db: -30},
  {f: 'pop', at: T.sun, db: -21, rate: 0.85},
  {f: 'gulp', at: T.sunEnd + 0.05, db: -20},
  {f: 'whoosh', at: T.but - 0.05, db: -28, rate: 0.7},
  {f: 'swoop', at: T.sideways - 0.13, db: -23},
  {f: 'swoop', at: 6.9, db: -29, rate: 0.9},
  {f: 'pop', at: T.sixty, db: -21},
  {f: 'launch', at: LAUNCH - 0.05, db: -19, keys: [[LAUNCH, -19], [LAUNCH + 1.0, -22], [LAUNCH + 1.9, -40]]},
  {f: 'swoop', at: 9.75, db: -24},
  {f: 'dizzy', at: 10.2, db: -21},
  {f: 'swoop', at: 11.0, db: -26, rate: 1.1},
  {f: 'pop', at: T.earth2, db: -22, rate: 1.1},
  {f: 'whoosh', at: CUT_B4 - 0.12, db: -30},
  {f: 'lever', at: T.fall - 0.05, db: -19},
  {f: 'lever', at: T.almost - 0.05, db: -21, rate: 0.9},
  {f: 'lever', at: T.speed - 0.1, db: -22, rate: 0.8},
  {f: 'whoosh', at: CUT_B5 - 0.12, db: -30},
  {f: 'pop', at: CUT_B5 + 0.05, db: -24},
  {f: 'clank', at: T.fifty - 0.02, db: -19},
  {f: 'clank', at: T.fifty + 0.45, db: -21, rate: 1.15},
  {f: 'gulp', at: T.energy - 0.05, db: -20},
  {f: 'boing', at: T.mars, db: -23},
  {f: 'whoosh', at: CUT_B6 - 0.12, db: -29},
  {f: 'swoop', at: T.turn - 0.05, db: -23, rate: 1.25},
  {f: 'pop', at: T.around + 0.15, db: -22},
  {f: 'pop', at: T.way - 0.15, db: -22},
  {f: 'catch', at: 20.45, db: -21},
  {f: 'thruster', at: T.fuel, db: -25, keys: [[T.fuel, -27], [T.leaves, -25], [T.leaves + 0.6, -40]]},
  {f: 'zoomaway', at: T.leaves - 0.05, db: -19},
  {f: 'pop', at: T.end + 0.05, db: -21},
  {f: 'boing', at: T.end + 0.08, db: -25},
];

export const SunTrashShort: React.FC = () => {
  useSunFont();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam0 = camOf(t);
  const env = (t >= LAUNCH ? 6 * Math.exp(-5 * (t - LAUNCH)) : 0) + (t >= T.leaves ? 4 * Math.exp(-6 * (t - T.leaves)) : 0) + (t >= 1.72 ? 3 * Math.exp(-12 * (t - 1.72)) : 0);
  const sh = shake(t, env);
  const cam = {x: cam0.x + sh.x / cam0.k, y: cam0.y + sh.y / cam0.k, k: cam0.k};
  return (
    <AbsoluteFill style={{background: SPACE}}>
      <Scene t={t} cam={cam} />
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('sun-trash/vo/take1.mp3')} volume={Math.pow(10, MIX_DB / 20)} />
      </Sequence>
      <Audio src={staticFile('sun-trash/music/bed.wav')} volume={Math.pow(10, MIX_DB / 20)} />
      <SoundCues cues={CUES.map((c) => ({...c, db: c.db + MIX_DB, keys: c.keys?.map(([a, b]) => [a, b + MIX_DB] as [number, number])}))} dir="sun-trash/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};
