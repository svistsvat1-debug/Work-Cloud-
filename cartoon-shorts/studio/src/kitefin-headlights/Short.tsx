import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SPR} from './sprites';
import {DURATION, FPS, T, VO_AT} from './scene';
export {DURATION as KITEFIN_DURATION, FPS as KITEFIN_FPS} from './scene';
import {camAt, clamp, easeInCubic, easeInOutCubic, easeOutBack, easeOutCubic, lerp, pop, prog, spring, type Cam, type CamKey} from '../shared/anim';
import {World} from '../shared/World';
import {SweatDrop} from '../shared/SweatDrop';
import {SoundCues, type Cue} from '../shared/Sound';
import {useFont} from '../shared/useFont';

// "Why does a shark with no enemies glow to hide?" - part 2 of the 2021 viral glowing shark.
// A six-foot shark glows in the pitch-black sea. Everyone said it's hiding: the glow erases its shadow from below. But
// nothing is known to hunt it. So who's it hiding from? Scientists bring up eight and measure the light. The belly hides it
// from prey below. But more light spills sideways from its face, like headlights. So maybe it sneaks up on dinner with the
// lights on. Facts: Claes et al. 2026, iScience, doi 10.1016/j.isci.2026.117089 (kitefin shark Dalatias licha: no natural
// predators recorded; 8 live sharks from Chatham Rise; belly glow matches the daylight at ~480-540 m; excess lateral
// emission strongest at the snout / jaw / pectoral fins, proposed as a 'biological searchlight' - unconfirmed);
// Mallefet et al. 2021, Front. Mar. Sci. 8: 633582 (kitefin up to ~1.8 m, the largest known luminous vertebrate).

const F = (n: string) => staticFile(`kitefin-headlights/${n}.png`);
export const FONT = 'KFInter';
export const useKitefinFont = () => useFont(FONT, staticFile('fonts/Inter-Black.otf'));
const MIX_DB = -1.0;
const INK = '#000';
const SEA = '#0B1C31';
const GLOW = '120,240,255';
const YEL = '#FFE45C';
const RED = '#FF5A4E';

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

type SprInfo = {w: number; h: number; feet: [number, number]; hd?: [number, number, number]; eyes?: number[][]; dots?: number[][]; snout?: [number, number]; meter?: [number, number]};
const S = (n: string) => (SPR as unknown as Record<string, SprInfo>)[n];

const Spr: React.FC<{n: string; x: number; y: number; s: number; sx?: number; sy?: number; rot?: number; ax?: number; ay?: number; opacity?: number; filter?: string}> = ({
  n,
  x,
  y,
  s,
  sx = 1,
  sy = 1,
  rot = 0,
  ax,
  ay,
  opacity = 1,
  filter,
}) => {
  const sp = S(n);
  const axx = ax ?? sp.feet[0];
  const ayy = ay ?? sp.feet[1];
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg) scale(${sx}, ${sy})`, transformOrigin: '0 0', opacity}}>
      <Img src={F(n)} style={{position: 'absolute', left: -axx * s, top: -ayy * s, width: sp.w * s, height: sp.h * s, filter}} />
    </div>
  );
};
const Svg: React.FC<{children: React.ReactNode; r?: number}> = ({children, r = 4000}) => (
  <svg style={{position: 'absolute', left: -r, top: -r, overflow: 'visible'}} width={2 * r} height={2 * r} viewBox={`${-r} ${-r} ${2 * r} ${2 * r}`}>
    {children}
  </svg>
);
export const Label: React.FC<{x: number; y: number; text: string; size: number; s: number; rot?: number; fill?: string}> = ({x, y, text, size, s, rot = 0, fill = '#fff'}) =>
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
        WebkitTextStroke: `${size * 0.2}px #000`,
        paintOrder: 'stroke fill',
      }}
    >
      {text}
    </div>
  );

// ---------- the shark ----------
const SH_W = 926;
const SH_H = 280;
const SNOUT_L: [number, number] = [12 - SH_W / 2, 122 - SH_H / 2];
const P_START: [number, number] = [560, 880];
const P_MAIN: [number, number] = [640, 790];
const P_LOW: [number, number] = [690, 1170];
const P_END: [number, number] = [740, 1320];
const S_MAIN = 0.9;

type Shark = {n: string; x: number; y: number; s: number; sx: number; rot: number; glow: number; sil: number; silA: number; belly: number; beam: number; beamLen: number};
export const sharkAt = (t: number): Shark => {
  const bob = Math.sin(2 * Math.PI * 0.5 * t);
  let [x, y] = P_START;
  let s = 1.0;
  let rot = 1.2 * Math.sin(2 * Math.PI * 0.5 * t + 1);
  if (t < T.everyone) {
    x = lerp(P_START[0], P_START[0] - 30, prog(t, 0, T.everyone));
  } else {
    const u = easeInOutCubic(prog(t, T.everyone - 0.05, T.everyone + 0.6));
    x = lerp(P_START[0] - 30, P_MAIN[0], u);
    y = lerp(P_START[1], P_MAIN[1], u);
    s = lerp(1.0, S_MAIN, u);
  }
  // B7: glide down-right and tip the nose down so the headlights reach the guy
  if (t >= T.but2 - 0.1) {
    const u = easeInOutCubic(prog(t, T.but2 - 0.1, T.light2 + 0.1));
    x = lerp(x, P_LOW[0], u);
    y = lerp(y, P_LOW[1], u);
    rot = lerp(rot, -15, u);
  }
  // B8: sneak lower, toward the squid
  if (t >= T.so3 + 0.3) {
    const u = easeInOutCubic(prog(t, T.so3 + 0.3, T.lights - 0.05));
    x = lerp(P_LOW[0], P_END[0], u);
    y = lerp(P_LOW[1], P_END[1], u);
    rot = lerp(-15, -9, u);
    y += -10 * Math.abs(Math.sin(2 * Math.PI * 1.6 * (t - T.so3))) * (1 - prog(t, T.lights - 0.2, T.lights)); // sneaky steps
  }
  y += 9 * bob;
  // sprite + look-around flips on "nothing is known to hunt it"
  let n = 'sh_calm';
  if (t >= T.but && t < T.so) n = 'sh_huh';
  if (t >= T.so3) n = 'sh_sneak';
  let sx = 1;
  const flip = (a: number, b: number) => Math.cos(Math.PI * easeInOutCubic(prog(t, a, b)));
  if (t >= T.known - 0.15 && t < T.hunt + 0.1) sx = flip(T.known - 0.15, T.known + 0.1);
  else if (t >= T.hunt + 0.1 && t < T.so) sx = -flip(T.hunt + 0.1, T.hunt + 0.35);
  if (Math.abs(sx) < 0.04) sx = 0.04 * Math.sign(sx || 1);
  // glow
  let glow = 0.85 + 0.35 * easeOutCubic(prog(t, T.glows - 0.05, T.glows + 0.35));
  glow *= 0.92 + 0.08 * Math.sin(2 * Math.PI * 0.8 * t);
  // view from below: black silhouette, then the glow erases it
  const sil = prog(t, T.hiding + 0.15, T.hiding + 0.5) * (1 - prog(t, T.below + 0.45, T.but));
  const silA = lerp(1, 0.1, easeInOutCubic(prog(t, T.erases, T.erases + 0.75)));
  // belly glow pointing down (hides it from prey below)
  const belly = prog(t, T.belly - 0.1, T.belly + 0.3) * (1 - prog(t, T.but2 - 0.2, T.but2 + 0.2));
  // headlights
  let beam = 0;
  let beamLen = 0;
  if (t >= T.light2 - 0.04) {
    beam = 0.55 * prog(t, T.light2 - 0.04, T.light2 + 0.06) + 0.45 * easeOutCubic(prog(t, T.spills, T.sideways + 0.4));
    beamLen = lerp(0.25, 1, easeOutCubic(prog(t, T.spills, T.sideways + 0.5)));
    const fl = (a: number) => (t >= a && t < a + 0.13 ? 0.6 : 0);
    beam += fl(T.headlights + 0.05) + fl(T.headlights + 0.3);
    if (t >= T.on + 0.06) beam += 0.35 * easeOutCubic(prog(t, T.on + 0.06, T.on + 0.2)) + fl(T.on + 0.08) + fl(T.on + 0.32);
  }
  return {n, x, y, s, sx, rot, glow, sil, silA, belly, beam, beamLen};
};
const snoutWorld = (k: Shark): [number, number] => {
  const lx = SNOUT_L[0] * k.s * k.sx;
  const ly = SNOUT_L[1] * k.s;
  const a = (k.rot * Math.PI) / 180;
  return [k.x + lx * Math.cos(a) - ly * Math.sin(a), k.y + lx * Math.sin(a) + ly * Math.cos(a)];
};

const SharkSprite: React.FC<{k: Shark; t: number}> = ({k, t}) => {
  const sp = S(k.n);
  const g = k.glow * (1 - k.sil);
  const filter = `drop-shadow(0 0 ${12}px rgba(${GLOW},${Math.min(1, 0.95 * g)})) drop-shadow(0 ${10 + 26 * k.belly}px ${26 + 18 * k.belly}px rgba(${GLOW},${(0.55 + 0.45 * k.belly) * g}))`;
  return (
    <div style={{position: 'absolute', left: k.x, top: k.y, transform: `rotate(${k.rot}deg) scale(${k.s * k.sx}, ${k.s})`, transformOrigin: '0 0'}}>
      {k.sil < 0.999 ? (
        <div style={{position: 'absolute', left: -sp.w / 2, top: -sp.h / 2, width: sp.w, height: sp.h, opacity: 1 - k.sil}}>
          <Img src={F(k.n)} style={{position: 'absolute', left: 0, top: 0, width: sp.w, height: sp.h, filter}} />
          <svg style={{position: 'absolute', left: 0, top: 0, overflow: 'visible'}} width={sp.w} height={sp.h}>
            {(sp.dots ?? []).map((d, i) => {
              const tw = 0.55 + 0.45 * Math.sin(2 * Math.PI * (0.7 + (i % 5) * 0.17) * t + i * 1.7);
              return <circle key={i} cx={d[0]} cy={d[1]} r={4.2} fill="#C8FBFF" opacity={clamp(g * tw * (0.7 + 0.5 * k.belly))} />;
            })}
          </svg>
        </div>
      ) : null}
      {k.sil > 0.001 ? (
        <>
          <Img src={F(k.n)} style={{position: 'absolute', left: -sp.w / 2, top: -sp.h / 2, width: sp.w, height: sp.h, filter: 'brightness(0)', opacity: k.sil * k.silA}} />
          <Img
            src={F(k.n)}
            style={{position: 'absolute', left: -sp.w / 2, top: -sp.h / 2, width: sp.w, height: sp.h, filter: 'brightness(0) invert(1) blur(5px)', opacity: k.sil * 0.32 * (1 - k.silA)}}
          />
        </>
      ) : null}
    </div>
  );
};

// ---------- the guy (in a fishbowl diving helmet) ----------
const HEAD_R = 80;
const G_FEET: [number, number] = [172, 1745];
type Guy = {n: string; x: number; y: number; s: number; sx: number; sq: [number, number]; on: boolean};
export const guyAt = (t: number): Guy => {
  let n = 'shrug';
  let sw = T.everyone - 9;
  const seq: [number, string][] = [
    [T.so, 'scratch'],
    [T.scientists, 'hero'],
    [T.light + 0.15, 'read'],
    [T.belly - 0.05, 'idea'],
    [T.but2, 'hero'],
    [T.face, 'blind'],
    [T.so3, 'laugh'],
  ];
  for (const [ts, nn] of seq) if (t >= ts) {
    n = nn;
    sw = ts;
  }
  const sp = S(n);
  const s = HEAD_R / (sp.hd as [number, number, number])[2];
  const sx = n === 'blind' || n === 'laugh' ? -1 : 1;
  const inU = easeOutBack(prog(t, T.everyone - 0.1, T.everyone + 0.4), 1.2);
  const outU = easeInCubic(prog(t, T.sneaks - 0.15, T.sneaks + 0.35));
  const x = G_FEET[0] - 200 * outU;
  const y = G_FEET[1] + 800 * (1 - inU) + 900 * outU;
  const [qx, qy] = squashSwap(t, sw);
  const breath = 1 + 0.008 * Math.sin(2 * Math.PI * 0.6 * t);
  const trem = n === 'blind' ? 2 * Math.sin(2 * Math.PI * 9 * t) : 0;
  return {n, x: x + trem, y, s, sx, sq: [qx, qy * breath], on: t >= T.everyone - 0.1 && outU < 1};
};
const GuySprite: React.FC<{g: Guy; t: number}> = ({g, t}) => {
  if (!g.on) return null;
  const sp = S(g.n);
  const [hx, hy, hr] = sp.hd as [number, number, number];
  const fx = sp.feet[0];
  const fy = sp.feet[1];
  const cx = g.x + (hx - fx) * g.s * g.sx * g.sq[0];
  const cy = g.y + (hy - fy) * g.s * g.sq[1];
  const R = hr * g.s * 1.22;
  const bub = [0, 1, 2].map((i) => {
    const ph = ((t * 0.8 + i * 0.33) % 1 + 1) % 1;
    return {x: cx + 10 + 14 * Math.sin(6 * ph + i), y: cy - R - 10 - 260 * ph, r: 7 + 4 * i, o: (1 - ph) * 0.9};
  });
  return (
    <>
      <Spr n={g.n} x={g.x} y={g.y} s={g.s} sx={g.sx * g.sq[0]} sy={g.sq[1]} />
      <Svg>
        <circle cx={cx} cy={cy + 6} r={R} fill="rgba(190,235,255,0.14)" stroke={INK} strokeWidth={6} />
        <path d={`M ${cx - R * 0.7} ${cy - R * 0.25} A ${R * 0.78} ${R * 0.78} 0 0 1 ${cx - R * 0.15} ${cy - R * 0.72}`} fill="none" stroke="#fff" strokeWidth={9} strokeLinecap="round" opacity={0.85} />
        <rect x={cx - R * 0.8} y={cy + R * 0.82} width={R * 1.6} height={16} rx={8} fill="#9AA6B2" stroke={INK} strokeWidth={5} />
        {bub.map((b, i) => (
          <circle key={i} cx={b.x} cy={b.y} r={b.r} fill="rgba(200,240,255,0.25)" stroke="#CFF4FF" strokeWidth={3} opacity={b.o} />
        ))}
      </Svg>
    </>
  );
};

// ---------- the squid ----------
type Squid = {n: string; x: number; y: number; s: number; on: boolean; sweat: number};
export const squidAt = (t: number): Squid => {
  let n = 'sq_calm';
  if (t >= T.below2 && t < T.so3 + 0.1) n = 'sq_whistle';
  if (t >= T.lights) n = 'sq_scared';
  const inU = easeOutCubic(prog(t, T.belly - 0.15, T.belly + 0.4));
  let x = 545;
  let y = 1560 + 600 * (1 - inU);
  if (t >= T.so3 + 0.1) {
    const u = easeInOutCubic(prog(t, T.so3 + 0.1, T.dinner));
    x = lerp(545, 200, u);
    y = lerp(1560, 1500, u);
  }
  y += t < T.lights ? 10 * Math.sin(2 * Math.PI * 0.7 * t) : 2.5 * Math.sin(2 * Math.PI * 11 * t);
  return {n, x, y, s: 0.42, on: t >= T.belly - 0.15, sweat: pop(t, T.lights + 0.08, 0.3)};
};

// ---------- the world ----------
const CAM: CamKey[] = [
  {t: 0, x: 540, y: 960, k: 1.0},
  {t: T.sea + 0.6, x: 540, y: 950, k: 1.05},
  {t: T.everyone + 0.55, x: 540, y: 960, k: 1.0},
  {t: T.light + 0.5, x: 540, y: 960, k: 1.0},
  {t: T.belly + 0.45, x: 540, y: 1080, k: 1.0},
  {t: T.so3 + 0.3, x: 540, y: 1080, k: 1.0},
  {t: T.lights, x: 540, y: 1110, k: 1.04},
  {t: DURATION, x: 540, y: 1110, k: 1.04},
];

const Beams: React.FC<{k: Shark}> = ({k}) => {
  if (k.beam <= 0.001) return null;
  const [px, py] = snoutWorld(k);
  const ax = Math.atan2(-Math.sin((k.rot * Math.PI) / 180), -Math.cos((k.rot * Math.PI) / 180));
  const L = 1150 * k.beamLen;
  const cone = (spread: number, len: number) => {
    const a1 = ax - (spread * Math.PI) / 180;
    const a2 = ax + (spread * Math.PI) / 180;
    return `M ${px} ${py - 14} L ${px + len * Math.cos(a1)} ${py + len * Math.sin(a1)} L ${px + len * Math.cos(a2)} ${py + len * Math.sin(a2)} L ${px} ${py + 14} Z`;
  };
  const b = Math.min(1.4, k.beam);
  return (
    <Svg>
      <defs>
        <radialGradient id="kfBeam" cx={px} cy={py} r={L} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#F2FEFF" stopOpacity={0.85} />
          <stop offset="0.45" stopColor="#BFF4FF" stopOpacity={0.4} />
          <stop offset="1" stopColor="#8FE6FF" stopOpacity={0} />
        </radialGradient>
        <filter id="kfBlur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={9} />
        </filter>
      </defs>
      <g filter="url(#kfBlur)" opacity={clamp(b)}>
        <path d={cone(40, L)} fill="url(#kfBeam)" />
        <path d={cone(16, L * 0.9)} fill="url(#kfBeam)" opacity={0.8} />
      </g>
      <circle cx={px} cy={py} r={34 + 10 * b} fill="#F4FFFF" opacity={0.55 * clamp(b)} filter="url(#kfBlur)" />
    </Svg>
  );
};

export const SeaScene: React.FC<{t: number; cam?: Cam; cover?: boolean}> = ({t, cam: camOver, cover}) => {
  const cam = camOver ?? camAt(t, CAM);
  const k = sharkAt(t);
  const g = guyAt(t);
  const q = squidAt(t);
  const PS = 1.36;
  const pw = 1024 * PS;
  const ph = 1536 * PS;
  const dark = cover ? 0.38 : lerp(0.22, 0.42, prog(t, T.pitch - 0.05, T.pitch + 0.45));
  // ruler under the shark ("six-foot")
  const rul = popOut(t, T.sixfoot, T.sea + 0.55, 0.3);
  const rx0 = k.x - (SH_W / 2 - 14) * k.s;
  const rx1 = k.x + (SH_W / 2 - 14) * k.s;
  const ry = k.y + 165 * k.s;
  // the light from above when we look up from below
  const disc = k.sil;
  // meter reading line
  const mline = t >= T.measure - 0.1 && t < T.light + 0.15 ? prog(t, T.measure - 0.1, T.measure + 0.2) : 0;
  const hm = S('hero').meter as [number, number];
  const mx = g.x + (hm[0] - S('hero').feet[0]) * g.s;
  const my = g.y + (hm[1] - S('hero').feet[1]) * g.s;
  // downward belly glow cone
  const bc = k.belly * k.glow;
  const sq = S(q.n);
  return (
    <AbsoluteFill style={{backgroundColor: SEA, overflow: 'hidden'}}>
      <Img
        src={staticFile('kitefin-headlights/plate.jpg')}
        style={{position: 'absolute', left: (1080 - pw) / 2 - 0.3 * (cam.x - 540), top: (1920 - ph) / 2 - 0.3 * (cam.y - 960), width: pw, height: ph}}
      />
      <AbsoluteFill style={{background: `rgba(2,8,20,${dark})`}} />
      <World cam={cam}>
        {disc > 0.001 ? (
          <div
            style={{
              position: 'absolute',
              left: k.x - 620,
              top: k.y - 620,
              width: 1240,
              height: 1240,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(150,205,245,0.95) 0%, rgba(110,175,230,0.75) 45%, rgba(70,130,190,0) 72%)',
              opacity: disc,
            }}
          />
        ) : null}
        {bc > 0.001 ? (
          <Svg>
            <defs>
              <linearGradient id="kfBelly" x1="0" y1={k.y} x2="0" y2={k.y + 700} gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#BFF6FF" stopOpacity={0.55} />
                <stop offset="1" stopColor="#7FD8FF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <path d={`M ${k.x - 330} ${k.y + 40} L ${k.x + 260} ${k.y + 40} L ${k.x + 340} ${k.y + 700} L ${k.x - 420} ${k.y + 700} Z`} fill="url(#kfBelly)" opacity={bc} />
          </Svg>
        ) : null}
        <Beams k={k} />
        {q.on && !cover ? (
          <Spr n={q.n} x={q.x} y={q.y} s={q.s} ax={sq.w / 2} ay={sq.h * 0.45} />
        ) : null}
        {q.on && q.sweat > 0 ? (
          <Svg>
            <SweatDrop x={q.x + 100} y={q.y - 120} r={24} s={q.sweat} rot={12} />
          </Svg>
        ) : null}
        <SharkSprite k={k} t={t} />
        {rul > 0.001 ? (
          <Svg>
            <g opacity={clamp(rul)}>
              <line x1={rx0} y1={ry} x2={rx1} y2={ry} stroke={INK} strokeWidth={14} strokeLinecap="round" />
              <line x1={rx0} y1={ry} x2={rx1} y2={ry} stroke="#fff" strokeWidth={6} strokeLinecap="round" />
              {[rx0, rx1].map((xx, i) => (
                <line key={i} x1={xx} y1={ry - 26} x2={xx} y2={ry + 26} stroke="#fff" strokeWidth={7} strokeLinecap="round" />
              ))}
            </g>
          </Svg>
        ) : null}
        {rul > 0.001 ? <Label x={(rx0 + rx1) / 2} y={ry + 70} text="6 FT" size={78} s={rul} fill={YEL} /> : null}
        {mline > 0.001 ? (
          <Svg>
            <line
              x1={mx}
              y1={my}
              x2={lerp(mx, k.x - 60, mline)}
              y2={lerp(my, k.y + 40, mline)}
              stroke={YEL}
              strokeWidth={8}
              strokeDasharray="22 18"
              strokeLinecap="round"
              strokeDashoffset={-t * 120}
            />
          </Svg>
        ) : null}
        <GuySprite g={g} t={t} />
      </World>
    </AbsoluteFill>
  );
};

// ---------- screen-space overlays ----------
const MINI: [number, number][] = [
  [175, 250],
  [415, 250],
  [655, 250],
  [895, 250],
  [175, 360],
  [415, 360],
  [655, 360],
  [895, 360],
];
const Overlays: React.FC<{t: number}> = ({t}) => {
  const fromBelow = popOut(t, T.hiding + 0.25, T.below + 0.45, 0.3);
  const enemies = popOut(t, T.nothing, T.so - 0.05, 0.3);
  const qm = popOut(t, T.whos, T.scientists - 0.1, 0.28);
  const g = guyAt(t);
  const gsp = S(g.n);
  const headY = g.y + ((gsp.hd as number[])[1] - gsp.feet[1]) * g.s - 960 + 960;
  const cam = camAt(t, CAM);
  return (
    <AbsoluteFill>
      {fromBelow > 0.001 ? (
        <>
          <Label x={650} y={1560} text="VIEW FROM BELOW" size={64} s={fromBelow} />
          <svg style={{position: 'absolute', left: 650, top: 1460, overflow: 'visible'}} width={10} height={10}>
            <g transform={`scale(${fromBelow})`}>
              <path d="M 0 -70 L 46 -10 L 18 -10 L 18 50 L -18 50 L -18 -10 L -46 -10 Z" fill="#fff" stroke={INK} strokeWidth={10} strokeLinejoin="round" />
            </g>
          </svg>
        </>
      ) : null}
      {enemies > 0.001 ? (
        <>
          <Label x={540} y={300} text="KNOWN ENEMIES:" size={70} s={enemies} />
          <Label x={540} y={420} text="0" size={130} s={enemies * (1 + 0.1 * Math.sin(2 * Math.PI * 2 * t))} fill={RED} />
        </>
      ) : null}
      {qm > 0.001 ? <Label x={g.x - cam.x + 540 + 30} y={headY - cam.y + 960 - 190} text="?" size={190} s={qm} rot={8 * Math.sin(2 * Math.PI * 1.5 * t)} fill={YEL} /> : null}
      {MINI.map(([x, y], i) => {
        const p = popOut(t, T.eight - 0.12 + 0.07 * i, T.light + 0.55, 0.25);
        if (p <= 0.001) return null;
        return (
          <div key={i} style={{position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${p})`}}>
            <Img src={F('sh_calm')} style={{width: 200, height: (200 * SH_H) / SH_W, filter: `drop-shadow(0 0 6px rgba(${GLOW},0.9)) drop-shadow(0 6px 10px rgba(${GLOW},0.7))`}} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ---------- sound ----------
const CUES: Cue[] = [
  {f: 'deep_bed', at: 0.0, db: -30},
  {f: 'deep_bed', at: 2.95, db: -30},
  {f: 'deep_bed', at: 5.9, db: -31},
  {f: 'deep_bed', at: 8.85, db: -32},
  {f: 'deep_bed', at: 11.8, db: -32},
  {f: 'deep_bed', at: 14.75, db: -32},
  {f: 'deep_bed', at: 17.7, db: -32},
  {f: 'deep_bed', at: 20.65, db: -32, keys: [[20.65, -32], [23.2, -32], [23.7, -60]], dur: 3.05},
  {f: 'pop', at: T.sixfoot, db: -23},
  {f: 'glow_on', at: T.glows - 0.12, db: -18},
  {f: 'twinkle', at: T.glows + 0.1, db: -25},
  {f: 'whoosh', at: T.everyone - 0.25, db: -26},
  {f: 'pop', at: T.hiding + 0.2, db: -22},
  {f: 'glow_on', at: T.erases - 0.05, db: -19},
  {f: 'magic', at: T.erases + 0.25, db: -24},
  {f: 'scratch', at: T.but - 0.03, db: -17},
  {f: 'pop', at: T.nothing, db: -21},
  {f: 'dart', at: T.known - 0.12, db: -24},
  {f: 'dart', at: T.hunt + 0.08, db: -25},
  {f: 'crickets', at: T.it, db: -24, dur: 0.6},
  {f: 'pop', at: T.whos, db: -21},
  {f: 'winch', at: T.bring - 0.1, db: -24},
  {f: 'pop', at: T.eight - 0.1, db: -24},
  {f: 'pop', at: T.eight + 0.18, db: -24},
  {f: 'pop', at: T.eight + 0.46, db: -24},
  {f: 'ping', at: T.measure - 0.05, db: -23},
  {f: 'button', at: T.light + 0.15, db: -20},
  {f: 'pop', at: T.belly - 0.1, db: -24},
  {f: 'glow_on', at: T.belly + 0.05, db: -22},
  {f: 'whistle', at: T.below2 + 0.02, db: -24, dur: 1.4},
  {f: 'scratch', at: T.but2 - 0.03, db: -18},
  {f: 'lamp_on', at: T.light2 - 0.06, db: -16},
  {f: 'whoosh', at: T.spills, db: -25},
  {f: 'gulp', at: T.face + 0.05, db: -21},
  {f: 'button', at: T.headlights + 0.03, db: -19},
  {f: 'button', at: T.headlights + 0.28, db: -19},
  {f: 'tiptoe', at: T.sneaks - 0.2, db: -22},
  {f: 'gulp', at: T.lights + 0.08, db: -18},
  {f: 'car_horn', at: T.on + 0.08, db: -15},
  {f: 'lamp_on', at: T.on + 0.02, db: -22},
];

export const KitefinHeadlightsShort: React.FC = () => {
  useKitefinFont();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  return (
    <AbsoluteFill style={{backgroundColor: SEA}}>
      <SeaScene t={t} />
      <Overlays t={t} />
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('kitefin-headlights/vo/take1.mp3')} volume={Math.pow(10, MIX_DB / 20)} />
      </Sequence>
      <Sequence from={Math.round(0.1 * FPS)} layout="none">
        <Audio src={staticFile('kitefin-headlights/music/bed.wav')} />
      </Sequence>
      <SoundCues cues={CUES} dir="kitefin-headlights/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};
