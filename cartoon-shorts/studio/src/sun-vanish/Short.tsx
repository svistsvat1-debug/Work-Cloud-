import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SPR} from './sprites';
import {CUT_B, CUT_C, CUT_D, CUT_E, CUT_F, CUT_G, CUT_H, CUT_J, DURATION, FPS, T, T_ARR, T_POOF, VO_AT} from './scene';
export {DURATION as SV_DURATION, FPS as SV_FPS} from './scene';
import {camAt, clamp, easeInCubic, easeInOutCubic, easeOutBack, easeOutCubic, lerp, pop, prog, rnd, spring, type Cam, type CamKey} from '../shared/anim';
import {World} from '../shared/World';
import {PuffCluster} from '../shared/Puffs';
import {SoundCues, type Cue} from '../shared/Sound';
import {useFont} from '../shared/useFont';
import {EarthBody, SunBody, type SunFace} from '../shared/Celestial';

// "What happens if the Sun suddenly vanishes?" - a guy tans on a beach; the Sun vanishes (space view), but on the beach
// nothing happens for 8 min 20 s: the Sun's last light and its pull (a rope) are still on the way, both at light speed.
// He keeps tanning, Earth keeps circling an empty spot; then the lights go out on the beach, the rope goes slack and Earth
// flies off in a straight line (+ a sling demo bubble). Ending: freezing in the dark with the last tan in history.

const F = (n: string) => staticFile(`sun-vanish/${n}.png`);
export const FONT = 'SVInter';
export const useSVFont = () => useFont(FONT, staticFile('fonts/Inter-Black.otf'));
const MIX_DB = -0.5;
const INK = '#000';
export const NAVY = '#0E1640';
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

type SprInfo = {w: number; h: number; feet: [number, number]; head?: [number, number, number]; bottom: number; left: number; right: number; top: number; eyes?: number[][]};
const S = (n: string) => (SPR as unknown as Record<string, SprInfo>)[n];

// a sprite anchored at (ax, ay) sprite px, placed at world (x, y); `tan` draws the code-tanned copy on top (same drawing)
const Spr: React.FC<{n: string; x: number; y: number; s: number; sx?: number; sy?: number; rot?: number; ax?: number; ay?: number; tan?: number}> = ({
  n,
  x,
  y,
  s,
  sx = 1,
  sy = 1,
  rot = 0,
  ax,
  ay,
  tan = 0,
}) => {
  const sp = S(n);
  const axx = ax ?? sp.feet[0];
  const ayy = ay ?? sp.feet[1];
  const st: React.CSSProperties = {position: 'absolute', left: -axx * s, top: -ayy * s, width: sp.w * s, height: sp.h * s};
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg) scale(${sx}, ${sy})`, transformOrigin: '0 0'}}>
      <Img src={F(n)} style={st} />
      {tan > 0.003 ? <Img src={F(`${n}_tan`)} style={{...st, opacity: clamp(tan)}} /> : null}
    </div>
  );
};
const Svg: React.FC<{x?: number; y?: number; r?: number; children: React.ReactNode}> = ({x = 0, y = 0, r = 6000, children}) => (
  <svg style={{position: 'absolute', left: x - r, top: y - r, overflow: 'visible'}} width={2 * r} height={2 * r} viewBox={`${x - r} ${y - r} ${2 * r} ${2 * r}`}>
    {children}
  </svg>
);
const Txt: React.FC<{x: number; y: number; size: number; s?: number; text: string; rot?: number; fill?: string}> = ({x, y, size, s = 1, text, rot = 0, fill = '#fff'}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <text x={0} y={size * 0.35} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={size} fill={fill} stroke={INK} strokeWidth={size * 0.18} paintOrder="stroke" strokeLinejoin="round">
        {text}
      </text>
    </g>
  );
const Sparkle: React.FC<{x: number; y: number; r: number; s: number; rot?: number; sw: number; fill?: string}> = ({x, y, r, s, rot = 0, sw, fill = '#FFF6B0'}) => {
  if (s <= 0.001) return null;
  const p = `M 0 ${-r} Q ${r * 0.18} ${-r * 0.18} ${r} 0 Q ${r * 0.18} ${r * 0.18} 0 ${r} Q ${-r * 0.18} ${r * 0.18} ${-r} 0 Q ${-r * 0.18} ${-r * 0.18} 0 ${-r} Z`;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d={p} fill={fill} stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
    </g>
  );
};
const Note: React.FC<{x: number; y: number; s: number; sw: number}> = ({x, y, s, sw}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M 10 -46 L 10 0 M 10 -46 Q 26 -40 30 -24" fill="none" stroke={INK} strokeWidth={sw * 1.6} strokeLinecap="round" />
      <ellipse cx={0} cy={2} rx={13} ry={10} fill={INK} transform="rotate(-20)" />
    </g>
  );

// ======================================================================================================
// BEACH (world = the plate at 1.35x; camera centre at screen 540, 960)
// ======================================================================================================
const PS = 1.35;
const PX0 = (1080 - SPR.beach.w * PS) / 2;
const GROUND = 1600; // towel top
const HEAD_X = 330; // lying / sitting poses: head centre x
const STAND_X = 540;
const HR = 112; // world head radius of the guy on the beach
const SKY_SUN: [number, number, number] = [300, 760, 130];
type Pose = 'hero' | 'peek' | 'roll' | 'belly' | 'situp' | 'hold' | 'hug' | 'shiver' | 'proud';
const STANDING: Pose[] = ['shiver', 'proud'];
const poseS = (p: Pose) => HR / (S(p).head as [number, number, number])[2];

const CAMS_A: CamKey[] = [
  {t: 0, x: 540, y: 1250, k: 1.28},
  {t: CUT_B, x: 552, y: 1262, k: 1.33},
];
const CAMS_C: CamKey[] = [
  {t: CUT_C, x: 540, y: 1265, k: 1.32},
  {t: CUT_D, x: 552, y: 1265, k: 1.36},
];
const CAMS_E: CamKey[] = [
  {t: CUT_E, x: 540, y: 1270, k: 1.36},
  {t: CUT_F, x: 548, y: 1272, k: 1.4},
];
const CAMS_G: CamKey[] = [
  {t: CUT_G, x: 540, y: 1250, k: 1.3},
  {t: T.out, x: 545, y: 1258, k: 1.33},
  {t: CUT_H, x: 540, y: 1280, k: 1.4, ease: 'out'},
];
const CAMS_J: CamKey[] = [
  {t: CUT_J, x: 540, y: 1300, k: 1.34},
  {t: DURATION, x: 540, y: 1295, k: 1.4},
];
const beachCam = (t: number): Cam => {
  if (t < CUT_B) return camAt(t, CAMS_A);
  if (t < CUT_D) return camAt(t, CAMS_C);
  if (t < CUT_F) return camAt(t, CAMS_E);
  if (t < CUT_H) return camAt(t, CAMS_G);
  return camAt(t, CAMS_J);
};

const poseAt = (t: number): [Pose, number] => {
  // returns the pose and the time of the last swap (for squash)
  if (t < CUT_C) return ['hero', -9];
  if (t < CUT_E) {
    if (t < T.nothing) return ['hero', -9];
    if (t < 4.42) return ['peek', T.nothing];
    return ['hero', 4.42];
  }
  if (t < CUT_J) {
    if (t < 8.86) return ['hero', -9];
    if (t < 9.16) return ['roll', 8.86];
    if (t < T.out + 0.04) return ['belly', 9.16];
    return ['situp', T.out + 0.04];
  }
  if (t < T.last) return ['hug', CUT_J];
  if (t < T.history) return ['shiver', T.last];
  return ['proud', T.history];
};
const tanAt = (t: number) => {
  if (t < CUT_B) return lerp(0, 0.12, prog(t, 0, CUT_B));
  if (t < CUT_E) return lerp(0.2, 0.3, prog(t, CUT_C, CUT_D));
  if (t < CUT_J) return lerp(0.35, 0.82, smooth(prog(t, 8.8, 9.9)));
  return 1;
};
const night = (t: number) => t >= T.out;

const Guy: React.FC<{t: number; p: Pose; tSwap: number}> = ({t, p, tSwap}) => {
  const sp = S(p);
  const s = poseS(p);
  const [qx, qy] = squashSwap(t, tSwap);
  const standing = STANDING.includes(p);
  const shiver = p === 'hug' || p === 'shiver' ? 1 : p === 'proud' ? 0.45 * prog(t, 21.6, 21.9) : 0;
  const jx = shiver * (2.2 * Math.sin(t * 61) + 1.2 * Math.sin(t * 37));
  const rot = shiver * 0.7 * Math.sin(t * 47);
  const br = breathe(t);
  const ax = standing ? sp.feet[0] : (sp.head as number[])[0];
  const ay = sp.bottom;
  const x = (standing ? STAND_X : HEAD_X) + jx;
  // a small bounce when he shrugs back down (C) / proud chest-out bump at the medal
  const by = p === 'hero' && tSwap === 4.42 ? -14 * bump(t, 4.42, 0.3) : 0;
  return (
    <>
      {standing ? (
        <div style={{position: 'absolute', left: x - 120, top: GROUND - 10, width: 240, height: 22, borderRadius: '50%', background: 'rgba(40, 30, 20, 0.28)', filter: 'blur(3px)'}} />
      ) : null}
      <Spr n={p} x={x} y={GROUND + by} s={s} sx={qx} sy={qy * br} rot={rot} ax={ax} ay={ay} tan={tanAt(t)} />
    </>
  );
};
// world point of a sprite pixel of the current pose (no squash)
const guyPt = (p: Pose, px: number, py: number): [number, number] => {
  const sp = S(p);
  const s = poseS(p);
  const standing = STANDING.includes(p);
  const ax = standing ? sp.feet[0] : (sp.head as number[])[0];
  return [(standing ? STAND_X : HEAD_X) + (px - ax) * s, GROUND + (py - sp.bottom) * s];
};

const Towel: React.FC = () => {
  const y0 = GROUND - 4;
  const y1 = GROUND + 34;
  const xl0 = 150;
  const xr0 = 900;
  const xl1 = 128;
  const xr1 = 924;
  const n = 7;
  const at = (u: number, top: boolean) => (top ? lerp(xl0, xr0, u) : lerp(xl1, xr1, u));
  return (
    <Svg>
      <path d={`M ${xl0} ${y0} L ${xr0} ${y0} L ${xr1} ${y1} L ${xl1} ${y1} Z`} fill="#FEFDFD" />
      {Array.from({length: n}, (_, i) =>
        i % 2 === 0 ? (
          <path key={i} d={`M ${at(i / n, true)} ${y0} L ${at((i + 1) / n, true)} ${y0} L ${at((i + 1) / n, false)} ${y1} L ${at(i / n, false)} ${y1} Z`} fill="#2FA8E0" />
        ) : null,
      )}
      <path d={`M ${xl0} ${y0} L ${xr0} ${y0} L ${xr1} ${y1} L ${xl1} ${y1} Z`} fill="none" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
      <path d={`M ${xl1} ${y1} L ${xr1} ${y1}`} stroke="#1B7FB0" strokeWidth={5} />
    </Svg>
  );
};

const skySunFace = (t: number): SunFace => {
  if (t < CUT_B) return {look: [0.35, 0.5], open: 1, mood: t > T.sun && t < T.sun + 0.45 ? 'wink' : 'happy'};
  if (t < CUT_E) return {look: [0.35, 0.5], open: 1, mood: t > T.nothing + 0.1 && t < 4.4 ? 'calm' : 'happy', pupil: [0.5, 0.6]};
  if (t < T.lights) return {look: [0.35, 0.5], open: 1, mood: 'happy'};
  // the 'old light' Sun notices it isn't really there any more (coyote moment)
  const looking = prog(t, T.lights + 0.05, T.lights + 0.25);
  return {look: [0.3 - 0.3 * looking, 0.5 + 0.3 * looking], open: 1, mood: 'worry', pupil: [0, 0.2 + 0.7 * looking], sweat: pop(t, T.lights + 0.1, 0.25)};
};

const NightSky: React.FC<{t: number}> = ({t}) => (
  <Svg>
    {Array.from({length: 46}, (_, i) => {
      const x = PX0 + rnd(i * 3.1) * SPR.beach.w * PS;
      const y = 40 + rnd(i * 7.7 + 2) * 1050;
      const big = i % 6 === 0;
      const tw = 0.75 + 0.25 * Math.sin(t * 5 + i);
      const sIn = pop(t, T.out + 0.02 + rnd(i) * 0.25, 0.2);
      return big ? (
        <Sparkle key={i} x={x} y={y} r={13} s={sIn * tw} sw={0} fill="#FFFFFF" />
      ) : (
        <circle key={i} cx={x} cy={y} r={3.4 * sIn * tw} fill="#fff" />
      );
    })}
  </Svg>
);

const Snow: React.FC<{t: number}> = ({t}) => {
  const u = t - CUT_J;
  return (
    <Svg>
      {Array.from({length: 26}, (_, i) => {
        const x0 = 150 + rnd(i * 5.3) * 800;
        const sp = 70 + rnd(i * 2.1) * 60;
        const y = 700 + ((rnd(i * 9.1) * 1100 + u * sp) % 1100);
        const x = x0 + 18 * Math.sin(u * 1.7 + i);
        const r = 6 + rnd(i * 4.4) * 5;
        return (
          <g key={i} transform={`translate(${x} ${y}) rotate(${u * 40 + i * 20})`} opacity={clamp(u * 3)}>
            {[0, 60, 120].map((a) => (
              <line key={a} x1={-r} y1={0} x2={r} y2={0} transform={`rotate(${a})`} stroke="#fff" strokeWidth={3} strokeLinecap="round" />
            ))}
          </g>
        );
      })}
    </Svg>
  );
};

// frost caps / icicles (code) on the umbrella and the castle in the cold ending
const Frost: React.FC<{t: number}> = ({t}) => {
  const g = easeOutCubic(prog(t, CUT_J + 0.05, CUT_J + 0.6));
  if (g <= 0.001) return null;
  const um = umbrellaBox();
  const icicles = [0.12, 0.3, 0.5, 0.7, 0.88].map((u, i) => {
    const x = lerp(um.l + 10, um.r - 10, u);
    const y = um.edge + 4;
    const h = (22 + 14 * rnd(i)) * g;
    return <path key={i} d={`M ${x - 9} ${y} L ${x + 9} ${y} L ${x} ${y + h} Z`} fill="#DDF3FF" stroke={INK} strokeWidth={4} strokeLinejoin="round" />;
  });
  return (
    <Svg>
      <path
        d={`M ${um.l + 30} ${um.top + 60} Q ${(um.l + um.r) / 2} ${um.top - 26 * g} ${um.r - 30} ${um.top + 60} Q ${um.r - 60} ${um.top + 72} ${(um.l + um.r) / 2} ${um.top + 40} Q ${um.l + 60} ${um.top + 72} ${um.l + 30} ${um.top + 60} Z`}
        fill="#F4FBFF"
        stroke={INK}
        strokeWidth={4.5}
        strokeLinejoin="round"
        opacity={g}
      />
      {icicles}
    </Svg>
  );
};
const UMB = {x: 1000, y: GROUND + 26, s: 0.72};
const umbrellaBox = () => {
  const sp = S('umbrella');
  const l = UMB.x + (sp.left - sp.feet[0]) * UMB.s;
  const r = UMB.x + (sp.right - sp.feet[0]) * UMB.s;
  const top = UMB.y + (sp.top - sp.feet[1]) * UMB.s;
  const edge = UMB.y + (sp.top + 0.42 * (sp.bottom - sp.top) - sp.feet[1]) * UMB.s;
  return {l, r, top, edge};
};

// steam wisps off his back while he 'sizzles' (E)
const Steam: React.FC<{t: number}> = ({t}) => {
  if (t < 9.2 || t > CUT_F) return null;
  const base = guyPt('belly', 420, 120);
  return (
    <Svg>
      {[0, 1, 2].map((i) => {
        const t0 = 9.22 + i * 0.22;
        const u = prog(t, t0, t0 + 0.75);
        if (u <= 0 || u >= 1) return null;
        const r = 16 * Math.sin(Math.PI * u) + 2;
        const x = base[0] + i * 70 + 10 * Math.sin(u * 7 + i);
        const y = base[1] - 30 - u * 120;
        return <PuffCluster key={i} puffs={[{x, y, r}, {x: x + r * 0.9, y: y + r * 0.4, r: r * 0.75}, {x: x - r * 0.8, y: y + r * 0.5, r: r * 0.7}]} fill="#FFFFFF" ink={4} />;
      })}
    </Svg>
  );
};

// cold breath puffs in the ending
const Breath: React.FC<{t: number; p: Pose}> = ({t, p}) => {
  if (t < CUT_J + 0.3) return null;
  const sp = S(p);
  const hd = sp.head as number[];
  const [mx, my] = guyPt(p, hd[0] + hd[2] * 0.15, hd[1] + hd[2] * 0.55);
  return (
    <Svg>
      {[0, 1, 2, 3].map((i) => {
        const t0 = CUT_J + 0.3 + i * 0.85;
        const u = prog(t, t0, t0 + 0.7);
        if (u <= 0 || u >= 1) return null;
        const r = 18 * Math.sin(Math.PI * u) + 1;
        const x = mx + 30 + u * 90;
        const y = my - u * 40;
        return <PuffCluster key={i} puffs={[{x, y, r}, {x: x + r, y: y - r * 0.3, r: r * 0.7}]} fill="#EAF6FF" ink={3.5} />;
      })}
    </Svg>
  );
};

// the 'last tan' medal (code)
const Medal: React.FC<{t: number}> = ({t}) => {
  const s = pop(t, T.history + 0.04, 0.35);
  if (s <= 0.001) return null;
  const sp = S('proud');
  const hd = sp.head as number[];
  const [nx, ny] = guyPt('proud', hd[0], hd[1] + hd[2] * 1.08);
  const [cx, cy] = guyPt('proud', hd[0], hd[1] + hd[2] * 1.7);
  const sw = 4.5;
  const sw2 = 1 + 0.08 * Math.sin((t - T.history) * 9) * Math.exp(-(t - T.history) * 2);
  const r = 40;
  return (
    <Svg>
      <g transform={`translate(${cx} ${cy}) scale(${s * sw2}) translate(${-cx} ${-cy})`}>
        <path d={`M ${nx - 34} ${ny} L ${cx - 12} ${cy - r + 6} L ${cx + 12} ${cy - r + 6} L ${nx + 34} ${ny} L ${nx + 14} ${ny} L ${cx} ${cy - r - 10} L ${nx - 14} ${ny} Z`} fill="#E8433A" stroke={INK} strokeWidth={sw} strokeLinejoin="round" />
        <circle cx={cx} cy={cy} r={r} fill="#FFC93C" stroke={INK} strokeWidth={sw} />
        <circle cx={cx} cy={cy} r={r * 0.68} fill="none" stroke="#E0A21C" strokeWidth={5} />
        {Array.from({length: 8}, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return <line key={i} x1={cx + Math.cos(a) * 12} y1={cy + Math.sin(a) * 12} x2={cx + Math.cos(a) * 21} y2={cy + Math.sin(a) * 21} stroke={INK} strokeWidth={3.5} strokeLinecap="round" />;
        })}
        <circle cx={cx} cy={cy} r={8} fill="#FFE58A" stroke={INK} strokeWidth={3.5} />
      </g>
      {[0, 1, 2, 3].map((i) => {
        const a = (-60 + i * 40) * (Math.PI / 180);
        const u = prog(t, T.history + 0.1, T.history + 0.7);
        return <Sparkle key={i} x={cx + Math.cos(a) * (60 + 70 * u)} y={cy - 30 + Math.sin(a) * (60 + 70 * u)} r={14} s={Math.sin(Math.PI * u)} sw={3} />;
      })}
    </Svg>
  );
};

const BeachScene: React.FC<{t: number; cover?: boolean; camOverride?: Cam}> = ({t, cover, camOverride}) => {
  const cam = camOverride ?? beachCam(t);
  const nt = night(t) && !cover;
  const [p, tSwap] = cover ? (['hero', -9] as [Pose, number]) : poseAt(t);
  const sunOn = !nt;
  const face = skySunFace(t);
  const sunPulse = t > T.lights ? 1 + 0.04 * Math.sin((t - T.lights) * 30) : 1;
  const bgFilter = nt ? 'brightness(0.62) saturate(0.7)' : undefined;
  const fgFilter = nt ? 'brightness(0.74) saturate(0.8)' : undefined;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{filter: bgFilter}}>
        <World cam={cam}>
          <Img src={F('beach')} style={{position: 'absolute', left: PX0, top: 0, width: SPR.beach.w * PS, height: SPR.beach.h * PS}} />
          {sunOn ? (
            <Svg>
              <SunBody x={SKY_SUN[0]} y={SKY_SUN[1]} r={SKY_SUN[2]} sw={6} t={t} face={face} sx={sunPulse} sy={sunPulse} id="skysun" />
            </Svg>
          ) : null}
          {cover ? null : <Spr n="castle" x={770} y={1500} s={0.34} />}
          {cover ? null : <Spr n="umbrella" x={UMB.x} y={UMB.y} s={UMB.s} />}
        </World>
        {nt ? <AbsoluteFill style={{background: '#34449A', mixBlendMode: 'multiply'}} /> : null}
      </AbsoluteFill>
      {nt ? (
        <>
          <AbsoluteFill style={{background: 'linear-gradient(180deg, rgba(4,8,30,0.92) 0%, rgba(6,10,36,0.7) 45%, rgba(6,10,36,0) 62%)'}} />
          <World cam={cam}>
            <NightSky t={t} />
          </World>
        </>
      ) : null}
      <AbsoluteFill style={{filter: fgFilter}}>
        <World cam={cam}>
          <Towel />
          {cover ? null : <Spr n="bottle" x={182} y={GROUND + 20} s={0.27} rot={-6} />}
          <Guy t={t} p={p} tSwap={tSwap} />
          <Steam t={t} />
          {t >= CUT_J ? <Breath t={t} p={p} /> : null}
          {t >= CUT_J ? <Medal t={t} /> : null}
          {t >= CUT_J ? <Frost t={t} /> : null}
        </World>
      </AbsoluteFill>
      {t >= CUT_J ? (
        <World cam={cam}>
          <Snow t={t} />
        </World>
      ) : null}
    </AbsoluteFill>
  );
};

// ======================================================================================================
// SPACE (world: the Sun at 0, 0)
// ======================================================================================================
const RS = 230;
const D = 1000;
const RE = 140;
const OMEGA = 2.6; // deg / s, cartoon orbit speed
const V = (D - RE - RS) / (T_ARR - T_POOF); // light-front speed (= the speed of the 'pull' front)
const thetaDeg = (t: number) => 90 - OMEGA * (Math.min(t, T_ARR) - CUT_B);
const TH_R = (thetaDeg(T_ARR) * Math.PI) / 180;
const E_R: [number, number] = [D * Math.cos(TH_R), D * Math.sin(TH_R)];
const DIR: [number, number] = [Math.sin(TH_R), -Math.cos(TH_R)];
const V_ORB = (D * OMEGA * Math.PI) / 180;
const speedAt = (t: number) => lerp(V_ORB, 640, easeInCubic(prog(t, T_ARR + 0.15, T_ARR + 0.75)) ** 0.8);
const distAfter = (t: number) => {
  let s = 0;
  const dt = 1 / 240;
  for (let u = T_ARR; u < t; u += dt) s += speedAt(u) * dt;
  return s;
};
export const earthAt = (t: number): [number, number] => {
  if (t <= T_ARR) {
    const a = (thetaDeg(t) * Math.PI) / 180;
    return [D * Math.cos(a), D * Math.sin(a)];
  }
  const s = distAfter(t);
  return [E_R[0] + DIR[0] * s, E_R[1] + DIR[1] * s];
};
const rFront = (t: number) => (t < T_POOF ? -1 : RS + V * (t - T_POOF));

const CAMS_B: CamKey[] = [
  {t: CUT_B, x: 0, y: 500, k: 0.95},
  {t: CUT_C, x: 0, y: 505, k: 0.98},
];
const CAMS_D: CamKey[] = [
  {t: CUT_D, x: 120, y: 500, k: 0.92},
  {t: CUT_E, x: 170, y: 505, k: 0.94},
];
const CAMS_F: CamKey[] = [
  {t: CUT_F, x: 230, y: 520, k: 0.92},
  {t: 11.0, x: 270, y: 520, k: 0.94},
  {t: 11.65, x: 60, y: 300, k: 1.05},
  {t: CUT_G, x: 55, y: 295, k: 1.08},
];
const CAM_H0: Cam = {x: 260, y: 560, k: 0.92};
const spaceCam = (t: number): Cam => {
  if (t < CUT_C) return camAt(t, CAMS_B);
  if (t < CUT_E) return camAt(t, CAMS_D);
  if (t < CUT_G) return camAt(t, CAMS_F);
  // H: hold, then follow Earth on its straight line (Earth kept a bit right of / below centre)
  const w = easeInOutCubic(prog(t, 14.7, 15.9));
  const k = lerp(0.92, 0.72, easeInOutCubic(prog(t, 14.7, 16.2)));
  const [ex, ey] = earthAt(t);
  const fx = ex - 130 / k;
  const fy = ey - 120 / k;
  return {x: lerp(CAM_H0.x, fx, w), y: lerp(CAM_H0.y, fy, w), k};
};

const SpaceBg: React.FC<{cam: Cam}> = ({cam}) => {
  const sc = 1.4;
  const w = SPR.space.w * sc;
  const h = SPR.space.h * sc;
  const ox = -(w - 1080) / 2 - clamp(cam.x * 0.035, -170, 170);
  const oy = -(h - 1920) / 2 - clamp((cam.y - 400) * 0.035, -110, 110);
  return <Img src={F('space')} style={{position: 'absolute', left: ox, top: oy, width: w, height: h}} />;
};

const Rope: React.FC<{t: number}> = ({t}) => {
  const [ex, ey] = t <= T_ARR ? earthAt(t) : E_R;
  const L = Math.hypot(ex, ey);
  const ux = ex / L;
  const uy = ey / L;
  const nx = -uy;
  const ny = ux;
  const rf = rFront(t);
  const after = t > T_ARR;
  const shrink = after ? 1 - easeInCubic(prog(t, T_ARR + 0.35, T_ARR + 1.2)) : 1;
  if (shrink <= 0.001) return null;
  const pts: string[] = [];
  for (let r = 0; r <= L + 0.1; r += 18) {
    let amp = 0;
    if (after) amp = 38;
    else if (rf > 0) amp = 38 * clamp((rf - r) / 170);
    const off = amp * Math.sin(r * 0.028 - t * 7 + 0.5) + (after ? 10 * Math.sin(t * 3 + r * 0.01) : 0);
    pts.push(`${pts.length ? 'L' : 'M'} ${ux * r + nx * off} ${uy * r + ny * off}`);
  }
  const d = pts.join(' ');
  const mx = ex / 2;
  const my = ey / 2;
  return (
    <g transform={`translate(${mx} ${my}) scale(${shrink}) translate(${-mx} ${-my})`}>
      <path d={d} fill="none" stroke={INK} strokeWidth={26} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke="#C07A3D" strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke="#E6A867" strokeWidth={5} strokeDasharray="12 18" strokeLinecap="round" />
    </g>
  );
};

const LightBeam: React.FC<{t: number}> = ({t}) => {
  if (t > T_ARR + 0.05) return null;
  const [ex, ey] = earthAt(t);
  const L = Math.hypot(ex, ey);
  const ux = ex / L;
  const uy = ey / L;
  const nx = -uy;
  const ny = ux;
  const span = L - RS - RE - 10;
  const rf = rFront(t);
  const GAP = 120;
  const lanes = [-70, 0, 70];
  const out: React.ReactNode[] = [];
  lanes.forEach((lo, li) => {
    const ph = li * 41;
    for (let i = 0; i < Math.ceil(span / GAP) + 1; i++) {
      const r = RS + 8 + ((((i * GAP + ph + V * t) % span) + span) % span);
      if (rf > 0 && r < rf) continue;
      const fade = clamp(Math.min((r - RS - 8) / 40, (RS + 8 + span - r) / 40));
      const len = 52 * fade;
      if (len < 2) continue;
      const x0 = ux * (r - len / 2) + nx * lo;
      const y0 = uy * (r - len / 2) + ny * lo;
      const x1 = ux * (r + len / 2) + nx * lo;
      const y1 = uy * (r + len / 2) + ny * lo;
      out.push(<line key={`k${li}-${i}`} x1={x0} y1={y0} x2={x1} y2={y1} stroke={INK} strokeWidth={27} strokeLinecap="round" />);
      out.push(<line key={`y${li}-${i}`} x1={x0} y1={y0} x2={x1} y2={y1} stroke="#FFE066" strokeWidth={15} strokeLinecap="round" />);
    }
  });
  return <g>{out}</g>;
};

const sunFaceSpace = (t: number): SunFace => {
  if (t < 2.44) return {look: [0.25, 0.35], open: 1, mood: 'happy'};
  return {look: [0, 0], open: 1, mood: 'shock', pupil: [0, 0]};
};

const Poof: React.FC<{t: number}> = ({t}) => {
  const u = prog(t, T_POOF - 0.02, T_POOF + 0.75);
  if (u <= 0 || u >= 1) return null;
  const grow = easeOutCubic(prog(u, 0, 0.35));
  const shrinkU = 1 - easeInCubic(prog(u, 0.45, 1));
  const puffs = Array.from({length: 12}, (_, i) => {
    const a = (i / 12) * Math.PI * 2 + 0.3;
    const rr = 60 + 190 * grow + 20 * rnd(i);
    return {x: Math.cos(a) * rr, y: Math.sin(a) * rr, r: (70 + 40 * rnd(i + 3)) * grow * shrinkU};
  });
  return (
    <g>
      <PuffCluster puffs={[...puffs, {x: 0, y: 0, r: 150 * grow * shrinkU}]} fill="#FFF3C4" ink={9} />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2;
        const rr = 200 + 260 * easeOutCubic(u);
        return <Sparkle key={i} x={Math.cos(a) * rr} y={Math.sin(a) * rr} r={30} s={Math.sin(Math.PI * u)} rot={u * 90} sw={6} />;
      })}
    </g>
  );
};

const Umbrellette: React.FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <g transform={`translate(${x} ${y}) rotate(-18) scale(${s})`}>
    <line x1={0} y1={0} x2={0} y2={-70} stroke={INK} strokeWidth={10} strokeLinecap="round" />
    <line x1={0} y1={0} x2={0} y2={-70} stroke="#FEFDFD" strokeWidth={4} strokeLinecap="round" />
    <path d="M -46 -64 A 46 34 0 0 1 46 -64 Z" fill="#E8433A" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
    <path d="M -15 -64 Q -8 -96 0 -98 Q 8 -96 15 -64 Z" fill="#FEFDFD" stroke={INK} strokeWidth={4} strokeLinejoin="round" />
  </g>
);

const SpaceScene: React.FC<{t: number}> = ({t}) => {
  const cam = spaceCam(t);
  const [ex, ey] = earthAt(t);
  const after = t > T_ARR;
  const sunS = t < T_POOF - 0.02 ? 1 : Math.max(0, 1 - prog(t, T_POOF - 0.02, T_POOF + 0.06));
  const inhale = 1 + 0.08 * easeInOutCubic(prog(t, 2.42, T_POOF - 0.02));
  const nightE = clamp((t - T_ARR) / 0.15);
  const shock = t > T_ARR + 0.05;
  const earthFace = {
    mood: (shock ? 'shock' : 'chill') as 'shock' | 'chill',
    glassesUp: shock ? easeOutBack(prog(t, T_ARR + 0.05, T_ARR + 0.3)) : 0,
    look: (shock ? [-0.6, 0.35] : [0, 0]) as [number, number],
    open: 1,
  };
  const eSquash = shock ? 1 + 0.12 * spring(t - T_ARR - 0.05, 3, 6) : 1;
  const qS = pop(t, T_POOF + 0.35, 0.3);
  const qBump = 1 + 0.18 * bump(t, T.empty, 0.3) + 0.12 * bump(t, T.spot, 0.3);
  const dotsA = t * 8;
  const speedLines = after ? clamp((speedAt(t) - 200) / 300) : 0;
  return (
    <AbsoluteFill style={{background: NAVY}}>
      <SpaceBg cam={cam} />
      <World cam={cam}>
        <Svg>
          {/* the orbit (dotted) */}
          <circle r={D} fill="none" stroke="#7D89C4" strokeWidth={6} strokeDasharray="4 26" strokeLinecap="round" opacity={0.85} />
          {/* straight path after the release */}
          {after ? (
            <line x1={E_R[0]} y1={E_R[1]} x2={ex} y2={ey} stroke={t > T.straight && t < T.line + 0.5 ? TEXT_YEL : '#FFFFFF'} strokeWidth={7} strokeDasharray="22 18" strokeLinecap="round" />
          ) : null}
          {after && t > T.straight - 0.1 ? (
            <line x1={ex} y1={ey} x2={ex + DIR[0] * 900 * easeOutCubic(prog(t, T.straight - 0.1, T.straight + 0.4))} y2={ey + DIR[1] * 900 * easeOutCubic(prog(t, T.straight - 0.1, T.straight + 0.4))} stroke={TEXT_YEL} strokeWidth={7} strokeDasharray="22 18" strokeLinecap="round" opacity={0.9 * (1 - prog(t, T.like + 0.3, T.like + 0.8))} />
          ) : null}
          <LightBeam t={t} />
          <Rope t={t} />
          {/* the Sun / the empty spot */}
          {t >= T_POOF - 0.05 ? (
            <g transform={`rotate(${dotsA})`}>
              <circle r={RS} fill="none" stroke="#9AA6DA" strokeWidth={8} strokeDasharray="26 22" strokeLinecap="round" opacity={clamp((t - T_POOF) / 0.3)} />
            </g>
          ) : null}
          {sunS > 0.001 ? <SunBody x={0} y={0} r={RS} sw={10} t={t} face={sunFaceSpace(t)} sx={sunS / Math.sqrt(inhale)} sy={sunS * inhale} id="spacesun" /> : null}
          <Poof t={t} />
          <Txt x={0} y={-10} size={190} s={qS * qBump} text="?" fill={TEXT_YEL} />
          {/* labels on 'light' and 'pull' */}
          {t < CUT_E ? (
            <>
              <Txt x={0.6 * ex + (-ey / D) * 150} y={0.6 * ey + (ex / D) * 150} size={90} s={popOut(t, T.light, CUT_E)} text="LIGHT" fill={TEXT_YEL} rot={-8} />
              <Txt x={0.42 * ex - (-ey / D) * 150} y={0.42 * ey - (ex / D) * 150} size={90} s={popOut(t, T.pull, CUT_E)} text="PULL" fill="#F2994A" rot={6} />
            </>
          ) : null}
          {/* speed lines behind Earth */}
          {speedLines > 0.01
            ? [-1, 0, 1].map((i) => {
                const px = -DIR[1] * i * 55;
                const py = DIR[0] * i * 55;
                const L0 = RE + 30 + 25 * Math.abs(i);
                const L1 = L0 + (180 + 60 * Math.sin(t * 9 + i)) * speedLines;
                return <line key={i} x1={ex + px - DIR[0] * L0} y1={ey + py - DIR[1] * L0} x2={ex + px - DIR[0] * L1} y2={ey + py - DIR[1] * L1} stroke="#FFFFFF" strokeWidth={9} strokeLinecap="round" />;
              })
            : null}
          {/* the snap where the pull lets go of Earth */}
          {t > T_ARR - 0.02 && t < T_ARR + 0.5
            ? (() => {
                const u = prog(t, T_ARR - 0.02, T_ARR + 0.45);
                const L0 = Math.hypot(E_R[0], E_R[1]);
                const cx0 = E_R[0] - (E_R[0] / L0) * (RE + 10);
                const cy0 = E_R[1] - (E_R[1] / L0) * (RE + 10);
                return (
                  <g>
                    {Array.from({length: 7}, (_, i) => {
                      const a = (i / 7) * Math.PI * 2 + 0.4;
                      const r0 = 30 + 90 * easeOutCubic(u);
                      const r1 = r0 + 60 * (1 - u);
                      return <line key={i} x1={cx0 + Math.cos(a) * r0} y1={cy0 + Math.sin(a) * r0} x2={cx0 + Math.cos(a) * r1} y2={cy0 + Math.sin(a) * r1} stroke="#FFFFFF" strokeWidth={10} strokeLinecap="round" />;
                    })}
                    <Sparkle x={cx0} y={cy0} r={60} s={Math.sin(Math.PI * u)} rot={u * 60} sw={7} />
                  </g>
                );
              })()
            : null}
          {/* Earth */}
          <Umbrellette x={ex - 50} y={ey - RE + 10} s={1.15} />
          <EarthBody x={ex} y={ey} r={RE} sw={9} id="earth" face={earthFace} night={nightE} sx={1 / Math.sqrt(eSquash)} sy={eSquash} />
          {/* Earth hums happily while it circles the empty spot */}
          {t > CUT_F && t < CUT_G
            ? [0, 1].map((i) => {
                const t0 = CUT_F + 0.15 + i * 0.7;
                const u = ((t - t0) % 1.4) / 1.4;
                if (t < t0) return null;
                return <Note key={i} x={ex + 120 + 30 * Math.sin(u * 6)} y={ey - 90 - 130 * u} s={Math.sin(Math.PI * u) * 1.2} sw={5} />;
              })
            : null}
        </Svg>
      </World>
      {t >= 17.0 ? <SlingBubble t={t} /> : null}
    </AbsoluteFill>
  );
};

// ---------- the sling demo bubble (screen space) ----------
const SlingBubble: React.FC<{t: number}> = ({t}) => {
  const s = popOut(t, T.like, CUT_J - 0.18, 0.3);
  if (s <= 0.001) return null;
  const cx = 310;
  const cy = 520;
  const R = 235;
  const hx = cx - 40;
  const hy = cy + 30;
  const Rr = 130;
  const th0 = (thetaDeg(T_ARR) * Math.PI) / 180;
  const rel = t < T.sling;
  const phi = rel ? th0 + 2 * Math.PI * 1.8 * (T.sling - t) : th0;
  const sx0 = hx + Rr * Math.cos(phi);
  const sy0 = hy + Rr * Math.sin(phi);
  const d = t > T.sling ? 700 * (t - T.sling) : 0;
  const stx = sx0 + DIR[0] * d;
  const sty = sy0 + DIR[1] * d;
  // cords: to the pouch while whirling; after release they flop down and swing
  const flop = t > T.sling ? easeOutCubic(prog(t, T.sling, T.sling + 0.35)) : 0;
  const swing = t > T.sling ? 0.5 * spring(t - T.sling - 0.35, 1.4, 2.5) : 0;
  const pa = lerp(phi, Math.PI / 2 + swing, flop);
  const pr = rel ? Rr : Rr * 0.8;
  const px = hx + pr * Math.cos(pa);
  const py = hy + pr * Math.sin(pa);
  const nX = -Math.sin(pa) * 24;
  const nY = Math.cos(pa) * 24;
  const cord = `M ${hx} ${hy} L ${px + nX} ${py + nY} M ${hx} ${hy} L ${px - nX} ${py - nY}`;
  const pouch = `M ${px + nX} ${py + nY} Q ${px + Math.cos(pa) * 40} ${py + Math.sin(pa) * 40} ${px - nX} ${py - nY}`;
  const blur = rel ? [0.25, 0.5, 0.75] : [];
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <defs>
        <clipPath id="slingclip">
          <circle cx={cx} cy={cy} r={R - 5} />
        </clipPath>
      </defs>
      <g transform={`translate(${cx} ${cy}) scale(${s}) translate(${-cx} ${-cy})`}>
        <circle cx={cx + 175} cy={cy + 235} r={26} fill="#FFF6DC" stroke={INK} strokeWidth={7} />
        <circle cx={cx + 225} cy={cy + 290} r={15} fill="#FFF6DC" stroke={INK} strokeWidth={6} />
        <circle cx={cx} cy={cy} r={R} fill="#FFF6DC" stroke={INK} strokeWidth={10} />
        <g clipPath="url(#slingclip)">
          {rel ? <circle cx={hx} cy={hy} r={Rr} fill="none" stroke="#C9CDE3" strokeWidth={6} strokeDasharray="8 14" /> : null}
          {/* whirl streaks behind the stone */}
          {blur.map((b2, i) => {
            const a2 = phi + b2 * 0.9;
            return <circle key={i} cx={hx + Rr * Math.cos(a2)} cy={hy + Rr * Math.sin(a2)} r={30 - 6 * i} fill="#B9BCCB" opacity={0.6 - 0.15 * i} />;
          })}
          {t > T.sling ? <line x1={sx0} y1={sy0} x2={stx} y2={sty} stroke="#7F8AC4" strokeWidth={8} strokeDasharray="18 14" strokeLinecap="round" /> : null}
          {/* the arm + mitten hand (code) */}
          <path d={`M ${hx - 30} ${cy + R + 20} L ${hx - 6} ${hy + 20}`} stroke={INK} strokeWidth={46} strokeLinecap="round" />
          <path d={`M ${hx - 30} ${cy + R + 20} L ${hx - 6} ${hy + 20}`} stroke="#FEFDFD" strokeWidth={32} strokeLinecap="round" />
          <path d={cord} stroke={INK} strokeWidth={13} strokeLinecap="round" />
          <path d={cord} stroke="#C07A3D" strokeWidth={6} strokeLinecap="round" />
          <path d={pouch} fill="none" stroke={INK} strokeWidth={17} strokeLinecap="round" />
          <path d={pouch} fill="none" stroke="#8A5226" strokeWidth={9} strokeLinecap="round" />
          <circle cx={stx} cy={sty} r={30} fill="#9C9C9C" stroke={INK} strokeWidth={7} />
          <circle cx={stx - 9} cy={sty - 9} r={8} fill="#C4C4C4" />
          <ellipse cx={hx} cy={hy + 4} rx={40} ry={44} fill="#FEFDFD" stroke={INK} strokeWidth={7} />
          <ellipse cx={hx - 32} cy={hy - 10} rx={14} ry={22} fill="#FEFDFD" stroke={INK} strokeWidth={6} transform={`rotate(-30 ${hx - 32} ${hy - 10})`} />
          <path d={`M ${hx - 12} ${hy - 22} Q ${hx + 8} ${hy - 18} ${hx + 22} ${hy - 4}`} fill="none" stroke={INK} strokeWidth={5} strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
};

// ---------- HUD stopwatch (screen space): 0:00 at the vanish -> 8:20 when the lights go out ----------
const Stopwatch: React.FC<{t: number}> = ({t}) => {
  const s = popOut(t, T_POOF + 0.3, CUT_H + 0.35, 0.3);
  if (s <= 0.001) return null;
  const secs = 500 * clamp((t - T_POOF) / (T.out - T_POOF));
  const done = t >= T.out;
  const mm = Math.floor(secs / 60);
  const ss = Math.floor(secs % 60);
  const txt = `${mm}:${String(ss).padStart(2, '0')}`;
  const cx = 880;
  const cy = 300;
  const r = 88;
  const pulse = 1 + 0.12 * bump(t, T.eight, 0.35) + 0.1 * bump(t, T.minutes, 0.3) + 0.22 * bump(t, T.out, 0.35);
  const a = (secs / 60) * 2 * Math.PI;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}}>
      <g transform={`translate(${cx} ${cy}) scale(${s * pulse})`}>
        <rect x={-16} y={-r - 34} width={32} height={26} rx={6} fill="#E8433A" stroke={INK} strokeWidth={6} />
        <circle r={r} fill="#FEFDFD" stroke={INK} strokeWidth={9} />
        {Array.from({length: 12}, (_, i) => {
          const b = (i / 12) * Math.PI * 2;
          return <line key={i} x1={Math.sin(b) * r * 0.72} y1={-Math.cos(b) * r * 0.72} x2={Math.sin(b) * r * 0.86} y2={-Math.cos(b) * r * 0.86} stroke={INK} strokeWidth={i % 3 === 0 ? 7 : 4} strokeLinecap="round" />;
        })}
        <line x1={0} y1={0} x2={Math.sin(a) * r * 0.68} y2={-Math.cos(a) * r * 0.68} stroke={done ? '#E8433A' : INK} strokeWidth={8} strokeLinecap="round" />
        <circle r={10} fill={INK} />
        <text x={0} y={r + 78} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={70} fill={done ? '#FF6B5E' : '#FFFFFF'} stroke={INK} strokeWidth={13} paintOrder="stroke" strokeLinejoin="round">
          {txt}
        </text>
      </g>
    </svg>
  );
};

// ---------- sound ----------
export const CUES: Cue[] = [
  {f: 'beach_bed', at: 0.0, db: -27, dur: CUT_B},
  {f: 'twinkle', at: T.sun + 0.08, db: -28},
  {f: 'sun_poof', at: T_POOF - 0.03, db: -12},
  {f: 'pop', at: T_POOF + 0.3, db: -24},
  {f: 'beach_bed', at: CUT_C, db: -29, dur: CUT_D - CUT_C},
  {f: 'crickets', at: T.but + 0.06, db: -19},
  {f: 'pop', at: T.light + 0.02, db: -23},
  {f: 'pop', at: T.pull + 0.02, db: -23, rate: 0.9},
  {f: 'ticks', at: T.eight - 0.1, db: -31, dur: 1.4, keys: [[T.eight - 0.1, -31], [T.eight + 1.0, -31], [T.eight + 1.3, -45]]},
  {f: 'beach_bed', at: CUT_E, db: -29, dur: CUT_F - CUT_E},
  {f: 'flop', at: 8.86, db: -18},
  {f: 'flop', at: 9.16, db: -15},
  {f: 'swoop', at: CUT_F + 0.6, db: -32},
  {f: 'pop', at: T.empty + 0.02, db: -25, rate: 1.1},
  {f: 'beach_bed', at: CUT_G, db: -29, dur: T.out - CUT_G},
  {f: 'gulp', at: T.lights + 0.2, db: -14},
  {f: 'lights_out', at: T.out - 0.03, db: -11},
  {f: 'sling', at: CUT_H - 0.05, db: -20},
  {f: 'pop', at: T_ARR - 0.02, db: -15, rate: 0.8},
  {f: 'boing', at: T_ARR, db: -24, rate: 0.85},
  {f: 'whoosh', at: T_ARR + 0.2, db: -16},
  {f: 'zoomaway', at: T.dark - 0.15, db: -22},
  {f: 'sling', at: T.sling - 0.88, db: -19},
  {f: 'freeze', at: CUT_J + 0.02, db: -19},
  {f: 'chatter', at: CUT_J + 0.15, db: -16},
  {f: 'chatter', at: T.last + 0.05, db: -18, rate: 1.05},
  {f: 'twinkle', at: T.history + 0.04, db: -15},
  {f: 'chatter', at: 22.05, db: -22, dur: 0.75},
];

// ======================================================================================================
export const SceneAt: React.FC<{t: number}> = ({t}) => {
  const beach = t < CUT_B || (t >= CUT_C && t < CUT_D) || (t >= CUT_E && t < CUT_F) || (t >= CUT_G && t < CUT_H) || t >= CUT_J;
  return (
    <AbsoluteFill>
      {beach ? <BeachScene t={t} /> : <SpaceScene t={t} />}
      <Stopwatch t={t} />
    </AbsoluteFill>
  );
};

export const CoverScene: React.FC<{cam?: Cam}> = ({cam}) => <BeachScene t={1.2} cover camOverride={cam} />;

export const SunVanishShort: React.FC = () => {
  useSVFont();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  return (
    <AbsoluteFill style={{background: NAVY}}>
      <SceneAt t={t} />
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('sun-vanish/vo/take1.mp3')} volume={Math.pow(10, MIX_DB / 20)} />
      </Sequence>
      <Sequence from={Math.round(0.1 * FPS)} layout="none">
        <Audio src={staticFile('sun-vanish/music/bed.wav')} volume={Math.pow(10, MIX_DB / 20)} />
      </Sequence>
      <SoundCues cues={CUES.map((c) => ({...c, db: c.db + MIX_DB, keys: c.keys?.map(([kt, kd]) => [kt, kd + MIX_DB] as [number, number])}))} dir="sun-vanish/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};
