import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SPR} from './sprites';
import {DURATION, FPS, T, VO_AT} from './scene';
export {DURATION as CCN_DURATION, FPS as CCN_FPS} from './scene';
import {arcY, camAt, clamp, easeInCubic, easeInOutCubic, easeOutCubic, lerp, pop, prog, rnd, shake, spring, type Cam, type CamKey} from '../shared/anim';
import {World} from '../shared/World';
import {PuffCluster, type Puff} from '../shared/Puffs';
import {SweatDrop} from '../shared/SweatDrop';
import {Eye} from '../shared/Face';
import {SoundCues, type Cue} from '../shared/Sound';
import {useFont} from '../shared/useFont';

// "What was the US Army hiding under Greenland's ice?" - Camp Century / Project Iceworm. A soldier digs a shaft on the
// Greenland ice sheet above a little town in a tunnel and drops in; a reactor with a face pops in and hums. Officially:
// a SCIENCE sign (innocent magnifier). Secretly: the sign flips to TOP SECRET (shh) and a blueprint unrolls under the
// ice with rows of rockets, counter 600. But the ice opens its eyes: the ceiling sags, the end wall creeps in, the
// soldier pushes, then scrapes the wall (chips fly) - and loses. He shrugs, walks off; the reactor hops after him; the
// lights go out. Decades of snow pile on top (1967 -> 2024); a NASA radar plane flies over, radar rings reveal the town,
// the plane does a double take; a 100 FT arrow; the ice winks.

const F = (n: string) => staticFile(`camp-century/${n}.png`);
export const FONT = 'CCNInter';
export const useCCNFont = () => useFont(FONT, staticFile('fonts/Inter-Black.otf'));
const MIX_DB = -0.5;
const INK = '#000';
const YEL = '#FFE45C';
const RED = '#E8382E';
const CYAN = '#7CF7FF';

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

type SprInfo = {w: number; h: number; feet: [number, number]; hd?: [number, number, number]; bottom: number; left: number; right: number; top: number};
const S = (n: string) => (SPR as unknown as Record<string, SprInfo & Record<string, unknown>>)[n];

const Spr: React.FC<{n: string; x: number; y: number; s: number; sx?: number; sy?: number; rot?: number; ax?: number; ay?: number; filter?: string; opacity?: number; children?: React.ReactNode}> = ({n, x, y, s, sx = 1, sy = 1, rot = 0, ax, ay, filter, opacity, children}) => {
  const sp = S(n);
  const axx = ax ?? sp.feet[0];
  const ayy = ay ?? sp.feet[1];
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg) scale(${sx}, ${sy})`, transformOrigin: '0 0', filter, opacity}}>
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
const Svg: React.FC<{children: React.ReactNode; r?: number}> = ({children, r = 7000}) => (
  <svg style={{position: 'absolute', left: -r, top: -r, overflow: 'visible'}} width={2 * r} height={2 * r} viewBox={`${-r} ${-r} ${2 * r} ${2 * r}`}>
    {children}
  </svg>
);
const Txt: React.FC<{x: number; y: number; size: number; s?: number; text: string; rot?: number; fill?: string; stroke?: string; sw?: number}> = ({x, y, size, s = 1, text, rot = 0, fill = '#fff', stroke = INK, sw = 0.2}) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <text x={0} y={size * 0.35} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={size} fill={fill} stroke={stroke} strokeWidth={size * sw} paintOrder="stroke" strokeLinejoin="round">
        {text}
      </text>
    </g>
  );

// ======================================================================================================
// THE WORLD = the ice-sheet cutaway plate at 2x (world px)
// ======================================================================================================
const PS = 2.0;
const PW = SPR.plate.w * PS; // 2048
const PH = SPR.plate.h * PS; // 3072
const SNOW = SPR.plate.snow as unknown as [number, number, number][];
const surfAt = (x: number) => {
  const px = clamp(x / PS, 0, SNOW[SNOW.length - 1][0]);
  for (let i = 1; i < SNOW.length; i++) {
    if (px <= SNOW[i][0]) {
      const u = (px - SNOW[i - 1][0]) / (SNOW[i][0] - SNOW[i - 1][0]);
      return lerp(SNOW[i - 1][1], SNOW[i][1], u) * PS;
    }
  }
  return SNOW[SNOW.length - 1][1] * PS;
};
const SKY = 'rgb(199,231,247)';
const ICE1 = 'rgb(176,220,242)'; // top ice band (plate band tinted in code so it differs from the sky)
const ICE2 = 'rgb(161,212,238)';
const ICE3 = 'rgb(134,194,225)';
const ICE_TOP = 1036; // lower outline of the snow band
const BAND12 = 1612;
const BAND23 = 2282;

// the tunnel ("Main Street" of the town)
const CEIL = 1250;
const FLOOR = 1740;
const TX0 = 330;
const TX1 = 1840;
const SAGX = 1520;
const SHAFT_X = 880;
const SHAFT_W = 210;
const HUTS = [470, 690];
const REACTOR_X = 1205;
const REACTOR_S = 0.5;
const SIGN = {x: 625, y: 1385};

// soldier
const HR = 85; // world radius of the head+helmet disc (equalised over all poses)
type Pose = 'hero' | 'dig' | 'tada' | 'innocent' | 'shh' | 'scared' | 'push' | 'scrape' | 'shrug' | 'walk';
const poseS = (p: Pose) => HR / (S(p).hd as [number, number, number])[2];

// ---------- timeline ----------
const JUMP = T.inside; // 2.02 hops into the shaft
const LAND = 2.55;
const BP0 = 8.1; // blueprint: camera pulls out
const CUT_BUT = T.but; // 11.14 back inside, the ice wakes up
const STROKES = [15.32, 15.92, 16.5];
const LIGHTS_OFF = 19.15;
const ACC0 = 19.42;
const ACC1 = 20.6;
const RADAR0 = T.spots; // 21.11
const TAKE = T.accident; // 21.87 double take

// ---------- tunnel geometry over time ----------
const creep = (t: number) => {
  // right end wall: creeps in while the ice squeezes, jumps back on every scrape stroke, keeps creeping later
  let x = 100 * easeInOutCubic(prog(t, T.slowly, 14.85));
  for (const s of STROKES) {
    if (t >= s) {
      const back = 44 * easeOutCubic(prog(t, s, s + 0.12));
      const again = 48 * easeInOutCubic(prog(t, s + 0.14, s + 0.58));
      x += -back + again;
    }
  }
  x += 25 * easeInOutCubic(prog(t, 16.95, 19.3)) + 70 * easeInOutCubic(prog(t, ACC0, ACC1));
  return x;
};
const wallX = (t: number) => TX1 - creep(t);
const bulge = (t: number) => 0.4 * creep(t);
const leftX = (t: number) => TX0 + 70 * easeInOutCubic(prog(t, ACC0, ACC1));
const sag = (t: number) => {
  const w = t > T.ice2 && t < T.it ? 6 * Math.sin(2 * Math.PI * 3.2 * t) * prog(t, T.ice2, T.wont) : 0; // the ice "won't sit still"
  return w + 85 * easeInOutCubic(prog(t, T.slowly, 14.85)) + 8 * Math.sin(2 * Math.PI * 1.7 * t) * (t > STROKES[0] && t < 17 ? 1 : 0) + 55 * easeInOutCubic(prog(t, ACC0, ACC1));
};
const sag2 = (t: number) => 40 * easeInOutCubic(prog(t, ACC0, ACC1)); // the whole roof settles over the decades
const ceilY = (x: number, t: number) => CEIL + sag(t) * Math.exp(-(((x - SAGX) / 420) ** 2)) + sag2(t) * Math.exp(-(((x - 900) / 600) ** 2));
const tunnelPath = (t: number, pad = 0) => {
  const x0 = leftX(t) - pad;
  const x1 = wallX(t) + pad;
  const R = 62;
  const fl = FLOOR + 32 + pad;
  const b = bulge(t);
  const pts: string[] = [];
  pts.push(`M ${x0} ${fl}`);
  pts.push(`L ${x0} ${ceilY(x0, t) + R - pad}`);
  pts.push(`Q ${x0} ${ceilY(x0, t) - pad} ${x0 + R} ${ceilY(x0 + R, t) - pad}`);
  for (let x = x0 + R + 20; x < x1 - R; x += 20) pts.push(`L ${x} ${ceilY(x, t) - pad}`);
  pts.push(`L ${x1 - R} ${ceilY(x1 - R, t) - pad}`);
  pts.push(`Q ${x1} ${ceilY(x1, t) - pad} ${x1} ${ceilY(x1, t) + R - pad}`);
  const mid = (ceilY(x1, t) + R + fl) / 2;
  pts.push(`Q ${x1 - 2 * b} ${mid} ${x1} ${fl}`);
  pts.push('Z');
  return pts.join(' ');
};
// the end wall's x at height y (for the hands / scraper contact)
const wallAt = (t: number, y: number) => {
  const x1 = wallX(t);
  const top = ceilY(x1, t) + 62;
  const fl = FLOOR + 32;
  const u = clamp((y - top) / (fl - top));
  // quadratic from (x1, top) via (x1 - 2b, mid) to (x1, fl): x = x1 - 2b * 2u(1-u)
  return x1 - 2 * bulge(t) * 2 * u * (1 - u);
};

// ---------- camera ----------
const KEYS: CamKey[] = [
  {t: 0, x: 730, y: 1185, k: 1.24},
  {t: 2.15, x: 760, y: 1215, k: 1.24},
  {t: 2.75, x: 960, y: 1440, k: 1.24},
  {t: 3.5, x: 1000, y: 1450, k: 1.24},
  {t: 4.7, x: 1000, y: 1455, k: 1.26},
  {t: 5.45, x: 865, y: 1455, k: 1.3},
  {t: 6.9, x: 860, y: 1455, k: 1.34},
  {t: BP0, x: 860, y: 1460, k: 1.34},
  {t: 9.05, x: 1025, y: 2060, k: 0.52},
  {t: CUT_BUT - 0.01, x: 1025, y: 2085, k: 0.53},
  {t: CUT_BUT, x: 1430, y: 1455, k: 1.28, ease: 'cut'},
  {t: 14.8, x: 1455, y: 1465, k: 1.32},
  {t: 17.1, x: 1445, y: 1465, k: 1.32},
  {t: 19.3, x: 1330, y: 1455, k: 1.22},
  {t: 20.35, x: 1060, y: 1090, k: 0.75},
  {t: 30, x: 1080, y: 1080, k: 0.77},
];
const camAtT = (t: number): Cam => {
  const c = camAt(t, KEYS);
  // squeeze rumble + small bumps on the scrape strokes and the landing
  let amp = t > T.ice2 && t < 14.9 ? 2.2 * Math.sin(Math.PI * prog(t, T.ice2, 14.9)) : 0;
  amp += 14 * Math.exp(-9 * Math.max(0, t - LAND)) * (t >= LAND ? 1 : 0);
  for (const s of STROKES) amp += 5 * Math.exp(-12 * Math.max(0, t - s)) * (t >= s ? 1 : 0);
  const sh = shake(t, amp);
  return {x: c.x + sh.x / c.k, y: c.y + sh.y / c.k, k: c.k};
};

// ======================================================================================================
// THE PLATE + extensions
// ======================================================================================================
const Plate: React.FC = () => (
  <>
    <div style={{position: 'absolute', left: -9000, top: -9000, width: 18000, height: 9000 + 960, background: SKY}} />
    <div style={{position: 'absolute', left: -9000, top: 960, width: 18000, height: ICE_TOP - 960 + 2, background: '#FFFFFF'}} />
    <div style={{position: 'absolute', left: -9000, top: ICE_TOP, width: 18000, height: BAND12 - ICE_TOP, background: ICE1}} />
    <div style={{position: 'absolute', left: -9000, top: BAND12, width: 18000, height: BAND23 - BAND12, background: ICE2}} />
    <div style={{position: 'absolute', left: -9000, top: BAND23, width: 18000, height: 9000, background: ICE3}} />
    <Img src={F('plate')} style={{position: 'absolute', left: 0, top: 0, width: PW, height: PH}} />
    {/* tint the top ice band so it reads as ice, not sky */}
    <div style={{position: 'absolute', left: -9000, top: ICE_TOP + 6, width: 18000, height: BAND12 - ICE_TOP - 6, background: 'rgba(120,186,226,0.22)'}} />
  </>
);

// snow piling up over the decades (a fresh layer on top of the old surface)
const acc = (t: number) => 150 * easeInOutCubic(prog(t, ACC0, ACC1));
const Accum: React.FC<{t: number}> = ({t}) => {
  const a = acc(t);
  if (a < 1) return null;
  const xs: number[] = [];
  for (let x = -400; x <= PW + 400; x += 40) xs.push(x);
  const top = xs.map((x) => `${x},${surfAt(x) - a + 8 * Math.sin(x / 130)}`).join(' L ');
  const base = xs
    .slice()
    .reverse()
    .map((x) => `${x},${surfAt(x) + 10}`)
    .join(' L ');
  const layers = [0.33, 0.66].map((f) => xs.map((x) => `${x},${surfAt(x) - a * f + 5 * Math.sin(x / 90 + f * 7)}`).join(' L '));
  return (
    <Svg>
      <path d={`M ${top} L ${base} Z`} fill="#FFFFFF" />
      {layers.map((l, i) => (
        <path key={i} d={`M ${l}`} fill="none" stroke="#D6E6F0" strokeWidth={7} strokeLinecap="round" />
      ))}
      <path d={`M ${top}`} fill="none" stroke={INK} strokeWidth={10} strokeLinejoin="round" />
    </Svg>
  );
};

// the shaft the soldier digs (from the snow surface down to the tunnel roof)
const shaftDepth = (t: number) => easeInOutCubic(prog(t, 0.15, 1.9));
const Shaft: React.FC<{t: number}> = ({t}) => {
  if (t > ACC0 + 0.4) return null;
  const top = surfAt(SHAFT_X) - 4;
  const bottom = lerp(top + 30, ceilY(SHAFT_X, t) + 40, shaftDepth(t));
  const x0 = SHAFT_X - SHAFT_W / 2;
  return (
    <Svg>
      <rect x={x0} y={top} width={SHAFT_W} height={bottom - top} fill="#2E4566" />
      <rect x={x0 + 14} y={top} width={22} height={bottom - top} fill="#3E5A80" />
      <line x1={x0} y1={top} x2={x0} y2={bottom - (shaftDepth(t) > 0.99 ? 40 : 0)} stroke={INK} strokeWidth={9} />
      <line x1={x0 + SHAFT_W} y1={top} x2={x0 + SHAFT_W} y2={bottom - (shaftDepth(t) > 0.99 ? 40 : 0)} stroke={INK} strokeWidth={9} />
      {shaftDepth(t) < 0.99 ? <line x1={x0} y1={bottom} x2={x0 + SHAFT_W} y2={bottom} stroke={INK} strokeWidth={9} /> : null}
      {/* a ladder down the shaft once it is open */}
      {shaftDepth(t) > 0.99
        ? Array.from({length: 7}).map((_, i) => <line key={i} x1={x0 + 40} x2={x0 + 92} y1={top + 40 + i * 42} y2={top + 40 + i * 42} stroke="#8A5A34" strokeWidth={8} strokeLinecap="round" />)
        : null}
    </Svg>
  );
};

// ======================================================================================================
// THE TUNNEL TOWN
// ======================================================================================================
const lightsOn = (t: number) => (t < LIGHTS_OFF ? 1 : 0);
const Tunnel: React.FC<{t: number}> = ({t}) => {
  const d = tunnelPath(t);
  const on = lightsOn(t);
  const x0 = leftX(t);
  const x1 = wallX(t);
  const bulbs: number[] = [];
  for (let x = x0 + 90; x < x1 - 60; x += 115) bulbs.push(x);
  return (
    <Svg>
      <defs>
        <clipPath id="ccn-tun">
          <path d={d} />
        </clipPath>
        <radialGradient id="ccn-bulb">
          <stop offset="0" stopColor="#FFF3A6" stopOpacity={0.75} />
          <stop offset="1" stopColor="#FFF3A6" stopOpacity={0} />
        </radialGradient>
      </defs>
      <path d={d} fill="#6E84A6" />
      <g clipPath="url(#ccn-tun)">
        {/* arched steel roof band with ribs */}
        <path d={`M ${x0 - 50} ${CEIL - 300} L ${x1 + 50} ${CEIL - 300} L ${x1 + 50} ${ceilY(x1, t) + 46} ${Array.from({length: Math.ceil((x1 - x0 + 100) / 20)}).map((_, i) => `L ${x1 + 50 - i * 20} ${ceilY(x1 + 50 - i * 20, t) + 46}`).join(' ')} Z`} fill="#56698B" />
        {Array.from({length: Math.ceil((x1 - x0) / 64)}).map((_, i) => {
          const x = x0 + 32 + i * 64;
          return <line key={i} x1={x} x2={x} y1={ceilY(x, t) - 10} y2={ceilY(x, t) + 46} stroke="#3E4F6E" strokeWidth={7} />;
        })}
        {/* string of lights */}
        <path d={`M ${x0} ${ceilY(x0, t) + 70} ${bulbs.map((x) => `Q ${x - 57} ${ceilY(x - 57, t) + 92} ${x} ${ceilY(x, t) + 70}`).join(' ')}`} fill="none" stroke="#2A2F3A" strokeWidth={5} />
        {bulbs.map((x, i) => (
          <g key={i}>
            {on ? <circle cx={x} cy={ceilY(x, t) + 84} r={70} fill="url(#ccn-bulb)" /> : null}
            <circle cx={x} cy={ceilY(x, t) + 84} r={13} fill={on ? '#FFE45C' : '#4A5468'} stroke={INK} strokeWidth={5} />
          </g>
        ))}
        {/* packed-snow floor */}
        <rect x={x0 - 50} y={FLOOR} width={x1 - x0 + 100} height={80} fill="#D7E2EE" />
        <line x1={x0 - 50} x2={x1 + 50} y1={FLOOR} y2={FLOOR} stroke={INK} strokeWidth={7} />
      </g>
      <path d={d} fill="none" stroke={INK} strokeWidth={11} strokeLinejoin="round" />
    </Svg>
  );
};
// prefab huts inside the trench
const HUT_W = 196;
const HUT_H = 168;
const Huts: React.FC<{t: number}> = ({t}) => {
  const on = lightsOn(t);
  return (
    <Svg>
      {HUTS.map((x, i) => {
        const b = 1 + 0.05 * Math.sin(Math.PI * clamp((t - (T.town + 0.12 * i)) / 0.3)) * (t < 2 ? 1 : 0); // bounce on "town"
        return (
          <g key={i} transform={`translate(${x} ${FLOOR}) scale(${2 - b} ${b})`}>
            <rect x={-HUT_W / 2} y={-HUT_H} width={HUT_W} height={HUT_H} fill={i ? '#C98B4E' : '#B9774A'} stroke={INK} strokeWidth={8} />
            <rect x={-HUT_W / 2 - 14} y={-HUT_H - 26} width={HUT_W + 28} height={30} rx={6} fill="#8B5A2B" stroke={INK} strokeWidth={8} />
            <rect x={-HUT_W / 2 + 22} y={-HUT_H + 36} width={58} height={46} fill={on ? YEL : '#2E3B58'} stroke={INK} strokeWidth={6} />
            <line x1={-HUT_W / 2 + 51} x2={-HUT_W / 2 + 51} y1={-HUT_H + 36} y2={-HUT_H + 82} stroke={INK} strokeWidth={4} />
            <rect x={HUT_W / 2 - 74} y={-104} width={50} height={104} fill="#6B4226" stroke={INK} strokeWidth={6} />
            <circle cx={HUT_W / 2 - 34} cy={-52} r={5} fill={YEL} />
            {/* a little chimney pipe with a puff when the town is alive */}
            <rect x={-20} y={-HUT_H - 62} width={22} height={40} fill="#7d8796" stroke={INK} strokeWidth={6} />
          </g>
        );
      })}
    </Svg>
  );
};

// hanging sign: SCIENCE (front) -> flips to TOP SECRET
const Sign: React.FC<{t: number}> = ({t}) => {
  const s = popOut(t, T.officially - 0.05, CUT_BUT - 0.02, 0.3);
  if (s <= 0) return null;
  const drop = 1 - easeOutCubic(prog(t, T.officially - 0.05, T.officially + 0.3));
  const flipU = prog(t, T.secretly, T.secretly + 0.3);
  const sx = Math.cos(Math.PI * flipU);
  const back = sx < 0;
  const W = 300;
  const H = 128;
  const y = SIGN.y - 260 * drop;
  const swing = 4 * Math.sin(2 * Math.PI * 1.1 * (t - T.officially)) * Math.exp(-1.5 * Math.max(0, t - T.officially));
  const bump = t > T.science ? 1 + 0.08 * Math.sin(Math.PI * clamp((t - T.science) / 0.25)) : 1;
  return (
    <Svg>
      <g transform={`rotate(${swing} ${SIGN.x} ${CEIL})`}>
        <line x1={SIGN.x - 100} y1={CEIL + 20} x2={SIGN.x - 100} y2={y - H / 2} stroke="#2A2F3A" strokeWidth={6} />
        <line x1={SIGN.x + 100} y1={CEIL + 20} x2={SIGN.x + 100} y2={y - H / 2} stroke="#2A2F3A" strokeWidth={6} />
        <g transform={`translate(${SIGN.x} ${y}) scale(${Math.max(0.02, Math.abs(sx)) * s * bump} ${s * bump})`}>
          <rect x={-W / 2} y={-H / 2} width={W} height={H} rx={14} fill={back ? '#FFF6E8' : '#FFFFFF'} stroke={INK} strokeWidth={10} />
          {!back ? (
            <>
              {/* a little flask icon */}
              <path d="M -118 -30 L -98 -30 L -98 -6 L -80 30 L -136 30 L -118 -6 Z" fill="#8FD3FF" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
              <text x={22} y={18} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={52} fill="#2B5BB0">
                SCIENCE
              </text>
            </>
          ) : (
            <g transform="rotate(-6)">
              <rect x={-W / 2 + 16} y={-H / 2 + 16} width={W - 32} height={H - 32} rx={8} fill="none" stroke={RED} strokeWidth={8} />
              <text x={0} y={17} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={44} fill={RED}>
                TOP SECRET
              </text>
            </g>
          )}
        </g>
      </g>
    </Svg>
  );
};

// ---------- the reactor with a face ----------
const reactorState = (t: number) => {
  if (t < T.nuclear - 0.05) return null;
  let x = REACTOR_X;
  let y = FLOOR;
  let sqx = 1;
  let sqy = 1;
  const p = pop(t, T.nuclear - 0.05, 0.3);
  sqx *= p;
  sqy *= p;
  // happy hum wobble
  const hum = t > T.reactor && t < LIGHTS_OFF ? 0.012 * Math.sin(2 * Math.PI * 7 * t) : 0;
  sqy *= 1 + hum;
  // hops away after the soldier: 3 hops to the left
  const H0 = T.so2 + 0.04;
  if (t > H0) {
    const k = (t - H0) / 0.22;
    const i = Math.floor(k);
    const u = k - i;
    x -= 165 * (i + u);
    y -= 70 * Math.sin(Math.PI * u);
    if (u < 0.15 || u > 0.85) {
      sqy *= 0.92;
      sqx *= 1.06;
    }
    if (x < 300) return null;
  }
  return {x, y, sqx, sqy};
};
const Reactor: React.FC<{t: number}> = ({t}) => {
  const r = reactorState(t);
  if (!r || t > 18.6) return null;
  const sp = S('reactor');
  const port = sp.port as unknown as number[];
  const pcx = (port[0] + port[2]) / 2;
  const pcy = (port[1] + port[3]) / 2;
  const eyesOpen = pop(t, T.reactor - 0.04, 0.22);
  const worried = t > T.ice2 && t < T.so2;
  const glow = t < LIGHTS_OFF ? 0.55 + 0.25 * Math.sin(2 * Math.PI * 2.2 * t) * (t > T.reactor ? 1 : 0) : 0;
  const look: [number, number] = worried ? [0.3, -0.7] : t > T.officially && t < CUT_BUT ? [-0.8, 0.1] : t > T.so2 ? [-0.9, 0] : [-0.5, 0.2];
  const blink = t > 9 && Math.abs(((t - 4.9) % 3.1) - 0.05) < 0.06 ? 0.9 : 0;
  return (
    <>
      <Spr n="reactor" x={r.x} y={r.y} s={REACTOR_S} sx={r.sqx} sy={r.sqy}>
        <defs>
          <radialGradient id="ccn-port">
            <stop offset="0" stopColor="#FFFBD0" stopOpacity={1} />
            <stop offset="1" stopColor="#FFE45C" stopOpacity={0} />
          </radialGradient>
        </defs>
        {glow > 0 ? <circle cx={pcx} cy={pcy} r={150} fill="url(#ccn-port)" opacity={glow} /> : null}
        <Eye x={288} y={150} r={44} open={eyesOpen} look={look} lid={blink} brow={0.55} browTilt={worried ? -0.9 : 0} side={-1} ink={0.17} />
        <Eye x={398} y={150} r={44} open={eyesOpen} look={look} lid={blink} brow={0.55} browTilt={worried ? -0.9 : 0} side={1} ink={0.17} />
        {/* radiation sign sticker on the dome */}
        <g transform={`translate(${pcx} 70) scale(0.55)`}>
          <circle r={46} fill={YEL} stroke={INK} strokeWidth={8} />
          {[0, 120, 240].map((a) => (
            <path key={a} d="M 0 0 L 36 -21 A 42 42 0 0 0 0 -42 Z" transform={`rotate(${a - 30})`} fill={INK} />
          ))}
          <circle r={9} fill={YEL} stroke={INK} strokeWidth={5} />
        </g>
      </Spr>
      {worried ? (
        <Svg>
          <SweatDrop x={r.x + 150} y={r.y - 250 + 40 * ((t * 0.9) % 1)} r={16} s={popOut(t, T.wont, T.so2 - 0.1, 0.2)} />
        </Svg>
      ) : null}
    </>
  );
};

// ---------- the ice wakes up ----------
const ICE_EYES: [number, number][] = [
  [1335, 1145],
  [1560, 1145],
];
const IceFace: React.FC<{t: number}> = ({t}) => {
  if (t < T.ice2 - 0.05) return null;
  const open = pop(t, T.ice2 - 0.05, 0.3);
  let lid = 0;
  let squeeze = false;
  let look: [number, number] = [0.2, 0.7];
  let browTilt = 0.9; // angry
  let brow = 0.5;
  if (t > T.squeezes - 0.05 && t < 14.75) squeeze = true;
  if (t > 14.75 && t < 17.9) {
    lid = 0.35;
    look = [0.7, 0.5];
  }
  if (t >= 17.9 && t < LIGHTS_OFF) {
    lid = 0.3;
    browTilt = -0.2;
    look = [-0.6, 0.4];
  }
  if (t >= LIGHTS_OFF) {
    lid = clamp((t - LIGHTS_OFF) / 0.4) * 0.97;
    browTilt = 0;
    brow = 0.45;
  }
  // the final wink: both open on "down", the right one winks
  if (t >= T.down - 0.15) {
    const o = easeOutCubic(prog(t, T.down - 0.15, T.down + 0.05));
    lid = 0.97 * (1 - o);
    look = [0.5, -0.7];
    browTilt = -0.3;
  }
  const wink = t > T.down + 0.3 && t < T.down + 0.75;
  return (
    <Svg>
      {ICE_EYES.map(([x, y], i) =>
        squeeze ? (
          <Eye key={i} x={x} y={y} r={66} open={open} squeeze side={i ? 1 : -1} brow={NaN} ink={0.17} />
        ) : (
          <Eye key={i} x={x} y={y} r={66} open={open} lid={i === 1 && wink ? 0.97 : lid} lidTilt={browTilt > 0 ? 18 : 0} look={look} brow={brow} browTilt={browTilt} side={i ? 1 : -1} ink={0.17} />
        ),
      )}
    </Svg>
  );
};
const Zzz: React.FC<{t: number}> = ({t}) => {
  if (t < LIGHTS_OFF + 0.5 || t > T.down - 0.2) return null;
  return (
    <Svg>
      {[0, 1, 2].map((i) => {
        const u = ((t - LIGHTS_OFF + i * 0.6) % 1.8) / 1.8;
        const s = Math.sin(Math.PI * u);
        return <Txt key={i} x={1430 + 110 * u + 25 * i} y={1060 - 170 * u} size={64 + 16 * i} s={s} text="Z" fill="#FFFFFF" />;
      })}
    </Svg>
  );
};

// ---------- the secret plan: a blueprint unrolls under the town ----------
const BX0 = 170;
const BX1 = 1880;
const BY0 = 1860;
const BY1 = 2960;
const ROWS = [2070, 2410, 2750];
const ROCKETS: {x: number; y: number; t0: number}[] = [];
{
  const n = 13;
  let k = 0;
  for (const y of ROWS) {
    for (let i = 0; i < n; i++) {
      ROCKETS.push({x: BX0 + 150 + (i * (BX1 - BX0 - 300)) / (n - 1), y: y + 60, t0: 0});
      k++;
    }
  }
  // pop order: row by row, left to right
  ROCKETS.forEach((r, i) => (r.t0 = T.hiding + (i * (T.missiles - T.hiding)) / ROCKETS.length));
}
const bpOn = (t: number) => (t >= T.test - 0.1 && t < CUT_BUT ? 1 : 0);
const Blueprint: React.FC<{t: number}> = ({t}) => {
  if (!bpOn(t)) return null;
  const reveal = easeOutCubic(prog(t, T.test - 0.1, T.test + 0.55));
  const yR = BY0 + (BY1 - BY0) * reveal;
  const grid: React.ReactNode[] = [];
  for (let x = BX0 + 60; x < BX1; x += 90) grid.push(<line key={`gx${x}`} x1={x} x2={x} y1={BY0} y2={BY1} stroke="#FFFFFF" strokeOpacity={0.16} strokeWidth={3} />);
  for (let y = BY0 + 60; y < BY1; y += 90) grid.push(<line key={`gy${y}`} x1={BX0} x2={BX1} y1={y} y2={y} stroke="#FFFFFF" strokeOpacity={0.16} strokeWidth={3} />);
  const bounce = t > T.missiles ? 1 + 0.12 * Math.sin(Math.PI * clamp((t - T.missiles) / 0.3)) : 1;
  return (
    <Svg>
      <defs>
        <clipPath id="ccn-bp">
          <rect x={BX0 - 20} y={BY0 - 20} width={BX1 - BX0 + 40} height={yR - BY0 + 20} />
        </clipPath>
      </defs>
      {/* a dashed shaft from the town down into the plan */}
      <line x1={1025} x2={1025} y1={FLOOR + 40} y2={BY0} stroke="#FFFFFF" strokeWidth={10} strokeDasharray="26 18" opacity={reveal} />
      <g clipPath="url(#ccn-bp)">
        <rect x={BX0} y={BY0} width={BX1 - BX0} height={BY1 - BY0} rx={18} fill="#1E5AA8" fillOpacity={0.93} />
        {grid}
        {ROWS.map((y) => (
          <rect key={y} x={BX0 + 70} y={y - 40} width={BX1 - BX0 - 140} height={150} rx={60} fill="none" stroke="#FFFFFF" strokeWidth={9} strokeDasharray="30 20" />
        ))}
        {[420, 1025, 1630].map((x) => (
          <line key={x} x1={x} x2={x} y1={ROWS[0] + 110} y2={ROWS[2] - 40} stroke="#FFFFFF" strokeWidth={9} strokeDasharray="30 20" />
        ))}
        <rect x={BX0 + 8} y={BY0 + 8} width={BX1 - BX0 - 16} height={BY1 - BY0 - 16} rx={14} fill="none" stroke="#FFFFFF" strokeWidth={6} />
      </g>
      {/* the paper roll at the reveal edge */}
      {reveal < 0.995 ? <rect x={BX0 - 24} y={yR - 34} width={BX1 - BX0 + 48} height={56} rx={28} fill="#3D78C4" stroke={INK} strokeWidth={8} /> : null}
      {ROCKETS.map((r, i) => {
        const s = pop(t, r.t0, 0.2) * bounce;
        if (s <= 0.001) return null;
        return (
          <g key={i} transform={`translate(${r.x} ${r.y}) scale(${s})`}>
            <path d="M 0 -96 C 14 -80 18 -60 18 -40 L 18 20 L 30 38 L 30 46 L -30 46 L -30 38 L -18 20 L -18 -40 C -18 -60 -14 -80 0 -96 Z" fill="#FFFFFF" stroke="#FFFFFF" strokeWidth={2} />
            <line x1={-18} x2={18} y1={-10} y2={-10} stroke="#1E5AA8" strokeWidth={5} />
          </g>
        );
      })}
    </Svg>
  );
};

// ---------- the soldier ----------
type GuyState = {pose: Pose; x: number; y: number; flip: boolean; sq: [number, number]; rot: number; vis: boolean};
const SURF_GUY_X = 700;
const pushX = (t: number) => {
  const sp = S('push');
  const palm = sp.palm as unknown as number[];
  const s = poseS('push');
  return wallAt(t, FLOOR - (sp.feet[1] - palm[1]) * s) - (palm[0] - sp.feet[0]) * s + 6;
};
const scrapeX = (t: number) => {
  const sp = S('scrape');
  const bl = sp.blade as unknown as number[];
  const s = poseS('scrape');
  return wallAt(t, FLOOR - (sp.feet[1] - bl[1]) * s) - (bl[0] - sp.feet[0]) * s + 10;
};
const SHRUG_T = T.gives;
const WALK_T = T.leaves;
const guyAt = (t: number): GuyState => {
  const y0 = surfAt(SURF_GUY_X) + 8;
  if (t < JUMP - 0.08) {
    const dig = Math.sin(2 * Math.PI * 1.65 * t);
    return {pose: 'dig', x: SURF_GUY_X, y: y0, flip: false, sq: [1 - 0.02 * dig, 1 + 0.025 * dig], rot: 3 * dig, vis: true};
  }
  if (t < JUMP) {
    const u = prog(t, JUMP - 0.08, JUMP);
    return {pose: 'dig', x: SURF_GUY_X, y: y0, flip: false, sq: [1 + 0.07 * u, 1 - 0.09 * u], rot: 0, vis: true};
  }
  if (t < LAND) {
    const tau = t - JUMP;
    const TT = LAND - JUMP;
    const y = arcY(y0, FLOOR, y0 - 70, TT, tau);
    const x = lerp(SURF_GUY_X, SHAFT_X, easeOutCubic(clamp(tau / (TT * 0.4))));
    return {pose: 'scared', x, y, flip: false, sq: [0.96, 1.05], rot: 0, vis: true};
  }
  if (t < 3.05) {
    const s = spring(t - LAND, 3.0, 6);
    return {pose: 'hero', x: SHAFT_X, y: FLOOR, flip: false, sq: [1 + 0.08 * s, 1 - 0.1 * s], rot: 0, vis: true};
  }
  if (t < 3.62) {
    // looks around at the town: turn on the narrowest squash frame
    const u = prog(t, 3.05, 3.17);
    const narrow = u < 1 ? 1 - 0.2 * Math.sin(Math.PI * u) : 1;
    return {pose: 'hero', x: SHAFT_X, y: FLOOR, flip: u >= 0.5, sq: [narrow, (u < 1 ? 1.03 : 1) * breathe(t)], rot: 0, vis: true};
  }
  if (t < T.officially) return {pose: 'tada', x: SHAFT_X, y: FLOOR, flip: false, sq: squashSwap(t, 3.62).map((v, i) => v * (i ? breathe(t) : 1)) as [number, number], rot: 0, vis: true};
  if (t < T.secretly) return {pose: 'innocent', x: SHAFT_X, y: FLOOR, flip: false, sq: squashSwap(t, T.officially), rot: 0, vis: true};
  if (t < CUT_BUT) return {pose: 'shh', x: SHAFT_X, y: FLOOR, flip: false, sq: squashSwap(t, T.secretly).map((v, i) => v * (i ? breathe(t) : 1)) as [number, number], rot: 0, vis: true};
  // --- after the cut: at the end wall ---
  const XS = pushX(T.squeezes);
  if (t < T.squeezes) {
    const tremble = t > T.wont ? 2 * Math.sin(2 * Math.PI * 9 * t) : 0;
    return {pose: 'scared', x: XS - 40 + tremble, y: FLOOR, flip: false, sq: [1, breathe(t)], rot: 0, vis: true};
  }
  if (t < 14.9) return {pose: 'push', x: pushX(t), y: FLOOR, flip: false, sq: squashSwap(t, T.squeezes), rot: 0, vis: true};
  if (t < T.soldiers) {
    const u = easeInOutCubic(prog(t, 14.9, T.soldiers));
    return {pose: 'push', x: lerp(pushX(t), scrapeX(t), u), y: FLOOR, flip: false, sq: [1, 1], rot: 0, vis: true};
  }
  if (t < SHRUG_T) {
    let fwd = 0;
    for (const s of STROKES) if (t > s - 0.12 && t < s + 0.2) fwd += 22 * Math.sin(Math.PI * clamp((t - s + 0.12) / 0.32));
    return {pose: 'scrape', x: scrapeX(t) + fwd, y: FLOOR, flip: false, sq: squashSwap(t, T.soldiers), rot: 0, vis: true};
  }
  const XSH = scrapeX(SHRUG_T);
  if (t < WALK_T) return {pose: 'shrug', x: XSH, y: FLOOR, flip: false, sq: squashSwap(t, SHRUG_T), rot: 0, vis: true};
  const wx = XSH - 590 * Math.max(0, t - WALK_T - 0.08);
  const bob = 10 * Math.abs(Math.sin(2 * Math.PI * 1.9 * (t - WALK_T)));
  return {pose: 'walk', x: wx, y: FLOOR - bob, flip: true, sq: squashSwap(t, WALK_T), rot: 0, vis: t < ACC0};
};
const Guy: React.FC<{g: GuyState; shadow?: boolean}> = ({g, shadow = true}) => {
  if (!g.vis) return null;
  const s = poseS(g.pose);
  return (
    <>
      {shadow && Math.abs(g.y - FLOOR) < 30 ? (
        <Svg>
          <ellipse cx={g.x} cy={FLOOR + 4} rx={120} ry={18} fill="rgba(30,45,80,0.25)" />
        </Svg>
      ) : null}
      <Spr n={g.pose} x={g.x} y={g.y} s={s} sx={g.sq[0] * (g.flip ? -1 : 1)} sy={g.sq[1]} rot={g.rot} />
    </>
  );
};

// snow thrown by the shovel + ice chips from the scraper
const SnowChunks: React.FC<{t: number}> = ({t}) => {
  if (t > 2.4) return null;
  const sp = S('dig');
  const bl = sp.blade as unknown as number[];
  const s = poseS('dig');
  const bx = SURF_GUY_X + (bl[0] - sp.feet[0]) * s;
  const by = surfAt(SURF_GUY_X) + 8 - (sp.feet[1] - bl[1]) * s;
  const out: Puff[] = [];
  [0.3, 0.92, 1.52].forEach((t0, j) => {
    for (let i = 0; i < 6; i++) {
      const u = t - t0 - i * 0.02;
      if (u < 0 || u > 0.75) continue;
      const vx = 230 + 300 * rnd(j * 10 + i);
      const vy = -760 - 300 * rnd(j * 10 + i + 5);
      out.push({x: bx + 10 + vx * u, y: by - 30 + vy * u + 0.5 * 2600 * u * u, r: (16 + 12 * rnd(i + j)) * (1 - 0.4 * u)});
    }
  });
  return (
    <Svg>
      <PuffCluster puffs={out} fill="#FFFFFF" ink={6} />
    </Svg>
  );
};
const Chips: React.FC<{t: number}> = ({t}) => {
  if (t < STROKES[0] || t > STROKES[2] + 1) return null;
  const out: React.ReactNode[] = [];
  STROKES.forEach((t0, j) => {
    const cx = wallAt(t0, FLOOR - 160);
    for (let i = 0; i < 8; i++) {
      const u = t - t0 - 0.04;
      if (u < 0 || u > 0.8) continue;
      const vx = -200 - 320 * rnd(j * 20 + i);
      const vy = -500 - 420 * rnd(j * 20 + i + 3);
      const x = cx - 20 + vx * u;
      const y = FLOOR - 170 + vy * u + 0.5 * 2600 * u * u;
      if (y > FLOOR - 6) continue;
      const r = 10 + 8 * rnd(i + 40);
      out.push(<path key={`${j}-${i}`} d={`M ${-r} 0 L 0 ${-r * 0.8} L ${r} ${r * 0.2} L ${r * 0.1} ${r * 0.9} Z`} transform={`translate(${x} ${y}) rotate(${600 * u + 40 * i})`} fill="#EAF7FF" stroke={INK} strokeWidth={4} strokeLinejoin="round" />);
    }
  });
  // a growing pile of shavings at the wall foot
  const pile = 18 * easeOutCubic(prog(t, STROKES[0], STROKES[2] + 0.4));
  return (
    <Svg>
      {out}
      {pile > 1 ? <path d={`M ${wallX(t) - 170} ${FLOOR + 2} Q ${wallX(t) - 90} ${FLOOR - pile * 2.2} ${wallX(t) - 6} ${FLOOR + 2} Z`} fill="#EAF7FF" stroke={INK} strokeWidth={6} /> : null}
    </Svg>
  );
};

// ---------- the dark after the lights go out ----------
const Dark: React.FC<{t: number}> = ({t}) => {
  if (t < LIGHTS_OFF) return null;
  const k = 0.62 * clamp((t - LIGHTS_OFF) / 0.12);
  return (
    <Svg>
      <path d={tunnelPath(t, -6)} fill="#0E1630" opacity={k} />
    </Svg>
  );
};

// ---------- NASA radar plane ----------
const PLANE_S = 0.62;
const planeAt = (t: number) => {
  const x = 1060 + (t - TAKE) * 480;
  const jolt = t > TAKE ? spring(t - TAKE, 2.2, 4.5) : 0;
  return {x, y: 430 + 8 * Math.sin(2 * Math.PI * 0.6 * t) - 34 * jolt, rot: -8 * jolt};
};
const Plane: React.FC<{t: number}> = ({t}) => {
  if (t < 19.9) return null;
  const p = planeAt(t);
  const sp = S('plane');
  const take = t > TAKE;
  const eyeS = take ? 1 + 0.35 * easeOutCubic(prog(t, TAKE, TAKE + 0.15)) : 1;
  const look: [number, number] = t > RADAR0 + 0.3 ? [0.1, 0.9] : [0.9, 0];
  return (
    <Spr n="plane" x={p.x} y={p.y} s={PLANE_S} rot={p.rot} ax={sp.w / 2} ay={sp.h / 2}>
      <text x={560} y={318} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={66} fill="#2B5BB0">
        NASA
      </text>
      <g transform={`translate(1336 250) scale(${eyeS}) translate(-1336 -250)`}>
        <Eye x={1296} y={246} r={50} open={1} look={look} brow={take ? 0.85 : 0.5} browTilt={take ? -0.6 : 0} side={-1} ink={0.17} />
        <Eye x={1392} y={246} r={50} open={1} look={look} brow={take ? 0.85 : 0.5} browTilt={take ? -0.6 : 0} side={1} ink={0.17} />
      </g>
    </Spr>
  );
};
const podAt = (t: number) => {
  const p = planeAt(t);
  const sp = S('plane');
  const pod = sp.pod as unknown as number[];
  return {x: p.x + ((pod[0] + pod[2]) / 2 - sp.w / 2) * PLANE_S, y: p.y + (pod[3] - sp.h / 2) * PLANE_S};
};
const Radar: React.FC<{t: number}> = ({t}) => {
  if (t < RADAR0 || t > 23.6) return null;
  const rings: React.ReactNode[] = [];
  for (let i = 0; i < 6; i++) {
    const t0 = RADAR0 + i * 0.19;
    const u = (t - t0) / 1.05;
    if (u < 0 || u > 1) continue;
    const c = podAt(t0);
    const R = 120 + 1500 * u;
    const dd = `M ${c.x - R * 0.85} ${c.y} A ${R * 0.85} ${R} 0 0 0 ${c.x + R * 0.85} ${c.y}`;
    rings.push(
      <g key={i} opacity={(1 - u) * 0.95}>
        <path d={dd} fill="none" stroke="#0B5E6E" strokeWidth={24} strokeLinecap="round" />
        <path d={dd} fill="none" stroke={CYAN} strokeWidth={12} strokeLinecap="round" />
      </g>,
    );
  }
  return <Svg>{rings}</Svg>;
};
// the radar "sees" the buried town: glowing cyan outlines
const glowAt = (t: number) => (t < 21.5 ? 0 : clamp((t - 21.5) / 0.25) * (0.75 + 0.25 * Math.sin(2 * Math.PI * 1.6 * t)));
const RadarImage: React.FC<{t: number}> = ({t}) => {
  const g = glowAt(t);
  if (g <= 0) return null;
  return (
    <Svg>
      <g opacity={g} style={{filter: 'drop-shadow(0 0 18px #7CF7FF)'}}>
        <path d={tunnelPath(t, 4)} fill="rgba(124,247,255,0.28)" stroke={CYAN} strokeWidth={16} strokeLinejoin="round" />
        {HUTS.map((x, i) => (
          <rect key={i} x={x - HUT_W / 2} y={FLOOR - HUT_H} width={HUT_W} height={HUT_H} fill="rgba(124,247,255,0.22)" stroke={CYAN} strokeWidth={11} />
        ))}
      </g>
    </Svg>
  );
};

// ---------- labels ----------
const GreenlandCard: React.FC<{t: number}> = ({t}) => {
  const s = popOut(t, T.greenland - 0.05, 3.75, 0.25);
  if (s <= 0) return null;
  return (
    <svg style={{position: 'absolute', left: 0, top: 0}} width={1080} height={1920}>
      <g transform={`translate(540 300) rotate(-4) scale(${s})`}>
        <rect x={-250} y={-80} width={500} height={160} rx={22} fill="#fff" stroke={INK} strokeWidth={12} />
        <text x={0} y={-8} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={62} fill={INK}>
          GREENLAND
        </text>
        <text x={0} y={56} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={52} fill={RED}>
          1959
        </text>
      </g>
    </svg>
  );
};
const Bang: React.FC<{t: number}> = ({t}) => {
  if (t < TAKE || t > 23.2) return null;
  const p = planeAt(t);
  return (
    <Svg>
      <Txt x={p.x + 235} y={p.y - 175} size={150} s={popOut(t, TAKE, 22.95, 0.22)} text="!" fill={YEL} rot={8} />
    </Svg>
  );
};
const DEPTH_X = 1000;
const DepthArrow: React.FC<{t: number}> = ({t}) => {
  if (t < T.hundred2 - 0.12) return null;
  const top = surfAt(DEPTH_X) - acc(t) + 18;
  const bot = ceilY(DEPTH_X, t) - 14;
  const u = easeOutCubic(prog(t, T.hundred2 - 0.12, T.feet + 0.1));
  const yb = lerp(top, bot, u);
  const s = pop(t, T.hundred2 - 0.12, 0.25);
  return (
    <Svg>
      <g>
        <line x1={DEPTH_X} x2={DEPTH_X} y1={top + 30} y2={yb - 26} stroke={INK} strokeWidth={30} strokeLinecap="round" />
        <line x1={DEPTH_X} x2={DEPTH_X} y1={top + 30} y2={yb - 26} stroke={YEL} strokeWidth={16} strokeLinecap="round" />
        <path d={`M ${DEPTH_X - 34} ${top + 44} L ${DEPTH_X} ${top} L ${DEPTH_X + 34} ${top + 44} Z`} fill={YEL} stroke={INK} strokeWidth={8} strokeLinejoin="round" />
        {u > 0.2 ? <path d={`M ${DEPTH_X - 34} ${yb - 44} L ${DEPTH_X} ${yb} L ${DEPTH_X + 34} ${yb - 44} Z`} fill={YEL} stroke={INK} strokeWidth={8} strokeLinejoin="round" /> : null}
      </g>
      <Txt x={DEPTH_X - 250} y={(top + bot) / 2} size={110} s={s} text="100 FT" fill={YEL} sw={0.22} />
    </Svg>
  );
};

// ======================================================================================================
// THE SCENE (world)
// ======================================================================================================
export const IceScene: React.FC<{t: number; cam: Cam; cover?: boolean}> = ({t, cam, cover}) => {
  const g = guyAt(t);
  return (
    <AbsoluteFill style={{background: SKY}}>
      <World cam={cam}>
        <Plate />
        <Shaft t={t} />
        <Tunnel t={t} />
        <Huts t={t} />
        <Sign t={t} />
        <Reactor t={t} />
        <Dark t={t} />
        <IceFace t={t} />
        {!cover ? <Zzz t={t} /> : null}
        <Blueprint t={t} />
        <Accum t={t} />
        <RadarImage t={t} />
        <Guy g={g} />
        <SnowChunks t={t} />
        <Chips t={t} />
        {g.vis && (g.pose === 'push' || g.pose === 'scrape') ? (
          <Svg>
            <SweatDrop x={g.x - 40} y={FLOOR - 400 + 40 * ((t * 1.2) % 1)} r={17} s={popOut(t, T.squeezes + 0.3, 17.8, 0.2)} />
          </Svg>
        ) : null}
        <Radar t={t} />
        <Plane t={t} />
        <Bang t={t} />
        <DepthArrow t={t} />
      </World>
    </AbsoluteFill>
  );
};

// ---------- screen-space overlays ----------
const Counter600: React.FC<{t: number}> = ({t}) => {
  const s = t >= CUT_BUT ? 0 : pop(t, T.six - 0.1, 0.25);
  if (s <= 0) return null;
  const v = Math.round(600 * easeOutCubic(prog(t, T.six, T.missiles)));
  const bump = t > T.missiles ? 1 + 0.15 * Math.sin(Math.PI * clamp((t - T.missiles) / 0.3)) : 1;
  return (
    <svg style={{position: 'absolute', left: 0, top: 0}} width={1080} height={1920}>
      <g transform={`translate(540 1660) scale(${s * bump})`}>
        <text x={0} y={70} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={230} fill={YEL} stroke={INK} strokeWidth={44} paintOrder="stroke" strokeLinejoin="round">
          {v}
        </text>
      </g>
    </svg>
  );
};
const YearCard: React.FC<{t: number}> = ({t}) => {
  const s = popOut(t, ACC0 - 0.05, 20.75, 0.25);
  if (s <= 0) return null;
  const y = Math.round(lerp(1967, 2024, easeInOutCubic(prog(t, ACC0 + 0.1, ACC1))));
  return (
    <svg style={{position: 'absolute', left: 0, top: 0}} width={1080} height={1920}>
      <g transform={`translate(540 250) rotate(-3) scale(${s})`}>
        <rect x={-210} y={-92} width={420} height={184} rx={22} fill="#fff" stroke={INK} strokeWidth={12} />
        <rect x={-210} y={-92} width={420} height={50} rx={22} fill={RED} stroke={INK} strokeWidth={12} />
        <text x={0} y={62} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={112} fill={INK}>
          {y}
        </text>
      </g>
    </svg>
  );
};

// ======================================================================================================
// SOUND
// ======================================================================================================
const CUES: Cue[] = [
  {f: 'polar_wind', at: 0.0, db: -27, keys: [[0, -27], [1.8, -29], [2.3, -40]], dur: 2.3},
  {f: 'snow_shovel', at: 0.26, db: -16},
  {f: 'snow_shovel', at: 0.88, db: -17, rate: 1.06},
  {f: 'snow_shovel', at: 1.48, db: -17, rate: 0.95},
  {f: 'whoosh', at: JUMP - 0.04, db: -24},
  {f: 'stone_step', at: LAND - 0.02, db: -14},
  {f: 'pop', at: T.town - 0.02, db: -26},
  {f: 'pop', at: T.town + 0.1, db: -27, rate: 1.15},
  {f: 'pop', at: T.greenland - 0.05, db: -24},
  {f: 'boing', at: T.nuclear - 0.05, db: -22},
  {f: 'hum', at: T.reactor - 0.05, db: -30, keys: [[T.reactor, -30], [5.2, -33]], dur: 2.25},
  {f: 'button', at: T.reactor + 0.02, db: -24},
  {f: 'flip', at: T.officially - 0.02, db: -24},
  {f: 'twinkle', at: T.science, db: -24},
  {f: 'whistle', at: 6.2, db: -28},
  {f: 'flip', at: T.secretly + 0.05, db: -20, rate: 1.1},
  {f: 'stamp', at: T.secretly + 0.3, db: -16},
  {f: 'whoosh', at: BP0 + 0.1, db: -27},
  {f: 'flip', at: T.test - 0.1, db: -22, rate: 0.8},
  {f: 'ticks', at: T.six - 0.05, db: -26, dur: T.missiles - T.six + 0.15},
  {f: 'pop', at: T.missiles, db: -20, rate: 0.9},
  {f: 'glacier_groan', at: T.ice2 - 0.08, db: -18, keys: [[T.ice2, -18], [12.8, -22]], dur: 1.9},
  {f: 'boing', at: T.ice2 - 0.05, db: -27, rate: 0.8},
  {f: 'rubber_stretch', at: T.squeezes - 0.25, db: -22},
  {f: 'glacier_groan', at: 13.4, db: -21, rate: 0.9, keys: [[13.4, -21], [14.9, -26]], dur: 1.6},
  {f: 'squeeze', at: 14.35, db: -22},
  {f: 'scrape', at: STROKES[0] - 0.08, db: -15},
  {f: 'scrape', at: STROKES[1] - 0.08, db: -16, rate: 1.05},
  {f: 'scrape', at: STROKES[2] - 0.08, db: -16, rate: 0.96},
  {f: 'sad_horn', at: SHRUG_T - 0.05, db: -25},
  {f: 'snow_steps', at: WALK_T + 0.05, db: -20},
  {f: 'snow_steps', at: WALK_T + 0.42, db: -22, rate: 1.05},
  {f: 'knees', at: T.so2 + 0.05, db: -24},
  {f: 'knees', at: T.so2 + 0.27, db: -25, rate: 1.1},
  {f: 'knees', at: T.so2 + 0.49, db: -26, rate: 0.95},
  {f: 'lights_out', at: LIGHTS_OFF - 0.04, db: -17},
  {f: 'polar_wind', at: ACC0 - 0.1, db: -27, keys: [[ACC0, -30], [20.3, -26], [21.4, -34]], dur: 2.0},
  {f: 'ticks', at: ACC0, db: -27, dur: ACC1 - ACC0},
  {f: 'jet', at: 20.15, db: -21},
  {f: 'radar', at: RADAR0 - 0.05, db: -18},
  {f: 'sonar', at: 21.5, db: -25},
  {f: 'boing', at: TAKE - 0.02, db: -19, rate: 1.1},
  {f: 'pop', at: T.hundred2 - 0.1, db: -22},
  {f: 'twinkle', at: T.down + 0.32, db: -21},
];

export const CampCenturyShort: React.FC = () => {
  useCCNFont();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cam = camAtT(t);
  return (
    <AbsoluteFill style={{background: SKY}}>
      <IceScene t={t} cam={cam} />
      <Counter600 t={t} />
      <GreenlandCard t={t} />
      <YearCard t={t} />
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('camp-century/vo/take1_fit.wav')} volume={Math.pow(10, MIX_DB / 20)} />
      </Sequence>
      <Audio src={staticFile('camp-century/music/bed.wav')} volume={Math.pow(10, MIX_DB / 20)} />
      <SoundCues cues={CUES.map((c) => ({...c, db: c.db + MIX_DB, keys: c.keys?.map(([kt, kd]) => [kt, kd + MIX_DB] as [number, number])}))} dir="camp-century/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};
export const CCN_TOTAL = Math.round(DURATION * FPS);
