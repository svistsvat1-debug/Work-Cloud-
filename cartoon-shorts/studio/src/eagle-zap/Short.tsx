import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SPR} from './sprites';
import {CUT, FPS, T, VO_AT, ZAP} from './scene';
import {camAt, clamp, easeInOutCubic, easeOutBack, easeOutCubic, lerp, pop, prog, rnd, shake, spring, type Cam, type CamKey} from '../shared/anim';
import {World} from '../shared/World';
import {SweatDrop} from '../shared/SweatDrop';
import {PuffCluster} from '../shared/Puffs';
import {SoundCues, type Cue} from '../shared/Sound';
import {useFont} from '../shared/useFont';
import {Bolt, C, Eagle, Pulse, Spark, Sparrow, wingTip} from './Birds';

// "Birds don't get zapped. So why do eagles?"
// Shot A (side view): the guy points at three sparrows on a power line; an eagle swoops past ("why do eagles get
// zapped?"), the sparrows duck; close-up: little electricity pulses run along the wire under a sparrow's feet, one
// stops, looks up, shrugs ("?") and runs on - the sparrow is smug. Shot B (front view of a pole top): the eagle lands,
// spreads its wings (a "~6 FT" arrow), the wings come down on the two outer wires, sparks; the guy's close-up pops in;
// a pulse runs up the left wire and on "shortcut" the bolt goes wire -> wing -> body -> wing -> wire: flash, x-ray
// skeleton, a sooty frizzy dazed eagle, smoke, feathers; a sparrow lands on its head (loops to "small birds sit...").

const F = (n: string) => staticFile(`eagle-zap/${n}.png`);
export const FONT = 'EagleInter';
export const useEagleFont = () => useFont(FONT, staticFile('fonts/Inter-Black.otf'));
const MIX_DB = 4.0;
const INK = '#000';
const SKY = '#90D0F4';

// ---------- helpers ----------
const bump = (t: number, t0: number, dur = 0.22) => Math.sin(Math.PI * prog(t, t0, t0 + dur));
const squashSwap = (t: number, tSwap: number) => {
  if (t < tSwap - 0.08) return [1, 1];
  if (t < tSwap) {
    const u = prog(t, tSwap - 0.08, tSwap);
    return [1 + 0.05 * u, 1 - 0.06 * u];
  }
  const s = spring(t - tSwap, 3.2, 7);
  return [1 - 0.035 * s, 1 + 0.04 * s];
};
const breathe = (tr: number, ph = 0) => 1 + 0.009 * Math.sin(2 * Math.PI * 0.6 * tr + ph);
const Svg: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg style={{position: 'absolute', left: -3000, top: -3000, overflow: 'visible'}} width={9000} height={9000} viewBox="-3000 -3000 9000 9000">
    {children}
  </svg>
);
type SprName = 'happy' | 'scared' | 'shock_cu' | 'cheeks_cu';
const Spr: React.FC<{n: SprName; x: number; y: number; s: number; sx?: number; sy?: number; rot?: number}> = ({n, x, y, s, sx = 1, sy = 1, rot = 0}) => {
  const sp = SPR[n];
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg) scale(${sx}, ${sy})`, transformOrigin: '0 0'}}>
      <Img src={F(n)} style={{position: 'absolute', left: -sp.feet[0] * s, top: -sp.feet[1] * s, width: sp.w * s, height: sp.h * s}} />
    </div>
  );
};

// ======================================================================================
// SHOT A - side view
// ======================================================================================
const BG_S = 1.6;
const PW = SPR.bg.w * BG_S;
const PH = SPR.bg.h * BG_S;
const POLE_L = 420;
const POLE_R = 1300;
const WIRE_Y = 640;
const SAG = 70;
const POLE_BASE = 1560;
const wireY = (x: number) => {
  // one span between the poles + the next spans outside the frame
  const span = POLE_R - POLE_L;
  const u = (x - POLE_L) / span;
  const f = u - Math.floor(u);
  return WIRE_Y + 4 * SAG * f * (1 - f);
};
const SPARROWS = [
  {x: 640, face: 1 as 1 | -1, ph: 0},
  {x: 790, face: -1 as 1 | -1, ph: 1.7},
  {x: 940, face: -1 as 1 | -1, ph: 3.1},
];
const GUY = {x: 1085, y: 1500};
const HEAD = 80;
const sc = (n: 'happy' | 'scared') => HEAD / SPR[n].head[2];
export const CAM0: CamKey = {t: 0, x: 880, y: 975, k: 1.45};
const KEYS_A: CamKey[] = [
  CAM0,
  {t: 2.8, x: 872, y: 965, k: 1.5},
  {t: 3.3, x: 870, y: 960, k: 1.46},
  {t: 4.62, x: 868, y: 960, k: 1.46},
  {t: 5.55, x: 790, y: 676, k: 3.6},
  {t: 8.98, x: 794, y: 672, k: 3.75},
];

const SidePole: React.FC<{x: number}> = ({x}) => (
  <g>
    <rect x={x - 23} y={WIRE_Y + 4} width={46} height={POLE_BASE - WIRE_Y} fill="#9A6A43" stroke={INK} strokeWidth={6} />
    <rect x={x - 23} y={WIRE_Y + 4} width={16} height={POLE_BASE - WIRE_Y} fill="#7E5434" />
    <rect x={x - 70} y={WIRE_Y + 34} width={140} height={22} rx={4} fill="#9A6A43" stroke={INK} strokeWidth={6} />
    <path d={`M ${x - 12} ${WIRE_Y + 34} L ${x - 15} ${WIRE_Y + 8} Q ${x} ${WIRE_Y - 4} ${x + 15} ${WIRE_Y + 8} L ${x + 12} ${WIRE_Y + 34} Z`} fill="#A9D4C2" stroke={INK} strokeWidth={5} strokeLinejoin="round" />
  </g>
);

const wirePath = (x0: number, x1: number) => {
  let d = '';
  for (let x = x0; x <= x1; x += 10) d += `${x === x0 ? 'M' : 'L'} ${x} ${wireY(x).toFixed(1)} `;
  return d;
};

// pulses: [spawn time]; the special one (P*) stops under the middle sparrow on "no reason"
const PULSE_V = 240;
const PULSE_X0 = 560;
const REG = [5.7, 6.25, 7.35, 7.9, 8.45];
const STAR = {t0: 6.15, stopAt: 790, resume: 7.86};
const starX = (t: number) => {
  const arrive = STAR.t0 + (STAR.stopAt - PULSE_X0) / PULSE_V;
  if (t < arrive) return PULSE_X0 + PULSE_V * (t - STAR.t0);
  if (t < STAR.resume) return STAR.stopAt;
  return STAR.stopAt + PULSE_V * (t - STAR.resume);
};

const ShotA: React.FC<{t: number; tr: number; cam: Cam}> = ({t, tr, cam}) => {
  const blur = cam.k > 2 ? 3 : 0;
  // eagle: circles high in the sky in frame 0, then dives past the sparrows and leaves (continuous path + tilt)
  const DIVE = 2.85;
  const circPos = (tt: number): [number, number] => [1170 + 70 * Math.sin(0.9 * tt), 420 + 18 * Math.sin(1.8 * tt)];
  const ep = prog(t, DIVE, 4.6);
  const path: [number, number][] = [circPos(DIVE), [905, 560], [300, 250]];
  const seg = ep < 0.5 ? 0 : 1;
  const u = ep < 0.5 ? easeInOutCubic(ep * 2) : easeInOutCubic((ep - 0.5) * 2);
  const circ = t < DIVE;
  const [ccx, ccy] = circPos(tr);
  const cx = circ ? ccx : lerp(path[seg][0], path[seg + 1][0], u);
  const cy = circ ? ccy : lerp(path[seg][1], path[seg + 1][1], u);
  const cs = circ ? 0.3 : 0.3 + 0.2 * Math.sin(Math.PI * ep);
  const r0 = 6 * Math.sin(0.9 * DIVE);
  const crot = circ ? 6 * Math.sin(0.9 * tr) : lerp(lerp(r0, -12, easeInOutCubic(prog(ep, 0, 0.2))), 14, easeInOutCubic(prog(ep, 0.4, 0.6)));
  const flapA = -18 + 34 * Math.sin(2 * Math.PI * 3.2 * tr);
  const eagleVis = t < 4.62;
  // guy
  const scared = t >= T.zapped;
  const gn = scared ? 'scared' : 'happy';
  const sq = squashSwap(t, T.zapped);
  const tremble = scared ? 3 * Math.sin(2 * Math.PI * 9 * tr) * prog(t, T.zapped, T.zapped + 0.2) : 0;
  const hop = -10 * bump(t, T.small, 0.25) - 12 * bump(t, T.power, 0.25);
  return (
    <>
      <World cam={cam} blur={blur}>
        <Img src={F('bg')} style={{position: 'absolute', left: 0, top: 0, width: PW, height: PH}} />
      </World>
      <World cam={cam}>
        <Svg>
          <SidePole x={POLE_L} />
          <SidePole x={POLE_R} />
          <path d={wirePath(-800, 2600)} fill="none" stroke={INK} strokeWidth={7} strokeLinecap="round" />
          {/* electricity pulses */}
          {REG.map((t0, i) => {
            const x = PULSE_X0 + PULSE_V * (t - t0);
            if (t < t0 || x > 1100) return null;
            const s = Math.min(1, (t - t0) / 0.15);
            return (
              <g key={i} transform={`translate(${x} ${wireY(x) - 2})`}>
                <Pulse s={1.05 * s} t={tr + i} look={[1, 0]} />
              </g>
            );
          })}
          {t >= STAR.t0 && starX(t) < 1100 ? (
            <g transform={`translate(${starX(t)} ${wireY(starX(t)) - 2})`}>
              <Pulse
                s={1.05 * Math.min(1, (t - STAR.t0) / 0.15) * (1 + 0.12 * bump(t, 7.2, 0.25))}
                t={tr}
                look={t > 7.15 && t < 7.8 ? [0, -1] : [1, 0]}
              />
            </g>
          ) : null}
          {/* sparrows */}
          {SPARROWS.map((b, i) => {
            const duck = t > 3.45 && t < 5.2 ? prog(t, 3.45, 3.7) * (1 - prog(t, 4.8, 5.2)) : 0;
            const lookUp = t > 3.0 && t < 4.7;
            const mid = i === 1;
            const watching = mid && t > 6.0 && t < 7.9;
            const smug = mid && t > T.bird - 0.05 ? prog(t, T.bird - 0.05, T.bird + 0.15) : 0;
            const chirp = bump(t, 0.35 + i * 0.3, 0.18) + bump(t, 1.6 + i * 0.25, 0.18);
            const bob = -3 * Math.abs(Math.sin(2 * Math.PI * 0.9 * tr + b.ph)) - 6 * chirp;
            const faceAt = (tt: number) => {
              const lu = tt > 3.0 && tt < 4.7;
              if (!lu) return mid && tt > 5.5 ? -1 : b.face;
              const ex2 = tt < DIVE ? circPos(tt)[0] : (() => {
                const e2 = prog(tt, DIVE, 4.6);
                const sg = e2 < 0.5 ? 0 : 1;
                const uu = e2 < 0.5 ? easeInOutCubic(e2 * 2) : easeInOutCubic((e2 - 0.5) * 2);
                return lerp(path[sg][0], path[sg + 1][0], uu);
              })();
              return ex2 > b.x ? 1 : -1;
            };
            let fsum = 0;
            for (let k = 0; k < 7; k++) fsum += faceAt(t - k * 0.02);
            const fav = fsum / 7;
            const face = Math.sign(faceAt(t)) * Math.max(0.22, Math.abs(fav));
            const squeeze = t > T.zapped - 0.05 && t < 4.75;
            return (
              <g key={i} transform={`translate(${b.x} ${wireY(b.x) - 3 + bob}) scale(${1.25 * face} 1.25)`}>
                <Sparrow
                  lid={smug * 0.5}
                  look={lookUp ? [0.4, -1] : watching ? [0.6, 1] : [0.4, 0]}
                  squeeze={squeeze}
                  beakOpen={Math.max(chirp, mid ? 0.6 * bump(t, T.bird + 0.1, 0.5) : 0)}
                  duck={duck}
                  flap={0.5 * chirp}
                />
                {mid ? <SweatDrop x={-8} y={-118} r={9} s={pop(t, 3.8, 0.2) * (1 - prog(t, 4.9, 5.1))} /> : null}
              </g>
            );
          })}
          {/* the "?" above the stopped pulse */}
          {(() => {
            const s = pop(t, 7.3, 0.22) * (1 - prog(t, 7.78, 7.9));
            return s > 0.01 ? (
              <g transform={`translate(${STAR.stopAt + 66} ${wireY(STAR.stopAt) - 22}) scale(${s}) rotate(${8 * Math.sin(2 * Math.PI * 2 * tr)})`}>
                <text x={0} y={0} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={46} fill="#FFE34D" stroke={INK} strokeWidth={8} paintOrder="stroke" strokeLinejoin="round">
                  ?
                </text>
              </g>
            ) : null;
          })()}
          {/* eagle */}
          {eagleVis ? (
            <g transform={`translate(${cx} ${cy}) scale(${cs}) rotate(${crot})`}>
              <g transform="translate(0 170)">
                <Eagle wingL={flapA} wingR={flapA} fold={1} look={[0, 1]} t={tr} />
              </g>
            </g>
          ) : null}
        </Svg>
        {/* the guy */}
        <div
          style={{
            position: 'absolute',
            left: GUY.x - 90,
            top: GUY.y - 16,
            width: 180,
            height: 32,
            borderRadius: '50%',
            background: 'rgba(52, 80, 30, 0.26)',
            filter: 'blur(3px)',
          }}
        />
        <Spr n={gn} x={GUY.x + tremble} y={GUY.y + hop} s={sc(gn)} sx={sq[0]} sy={sq[1] * breathe(tr)} />
      </World>
    </>
  );
};

// ======================================================================================
// SHOT B - front view of the pole top
// ======================================================================================
const X0 = 819;
const VP: [number, number] = [X0, -150]; // horizon above: the two wires run away like rails // horizon vanishing point (ground level is below the frame)
const NEAR_L: [number, number] = [441, 800];
const NEAR_R: [number, number] = [1197, 800];
const FEET: [number, number] = [X0, 788];
const along = (p: [number, number], u: number): [number, number] => [VP[0] + (p[0] - VP[0]) * u, VP[1] + (p[1] - VP[1]) * u];

// wing angle (deg) at which the wing tip lies on the near wire line
const contactAngle = (side: 1 | -1) => {
  const n = side === 1 ? NEAR_R : NEAR_L;
  const dx = n[0] - VP[0];
  const dy = n[1] - VP[1];
  const f = (a: number) => {
    const tip = wingTip(side, a);
    const px = FEET[0] + tip[0] - VP[0];
    const py = FEET[1] + tip[1] - VP[1];
    return px * dy - py * dx;
  };
  let a0 = -20;
  let a1 = 70;
  const s0 = Math.sign(f(a0));
  for (let i = 0; i < 40; i++) {
    const m = (a0 + a1) / 2;
    if (Math.sign(f(m)) === s0) a0 = m;
    else a1 = m;
  }
  return (a0 + a1) / 2;
};
const A_CONTACT_L = contactAngle(-1);
const A_CONTACT_R = contactAngle(1);
const tipWorld = (side: 1 | -1, a: number): [number, number] => {
  const p = wingTip(side, a);
  return [FEET[0] + p[0], FEET[1] + p[1]];
};

const KEYS_B: CamKey[] = [
  {t: CUT, x: X0, y: 520, k: 1.12},
  {t: 9.75, x: X0, y: 560, k: 1.18},
  {t: 10.2, x: X0, y: 560, k: 1.2},
  {t: 10.95, x: X0, y: 700, k: 0.93, ease: 'out'},
  {t: 13.5, x: X0, y: 720, k: 0.95},
  {t: 14.66, x: X0, y: 650, k: 1.18},
  {t: 15.2, x: X0, y: 680, k: 0.98, ease: 'out'},
  {t: 16.1, x: X0, y: 680, k: 0.99},
];

// wooden pole + crossarm + two insulators, drawn at "near" scale (1) around the real pole
const PoleTop: React.FC = () => (
  <g>
    <rect x={X0 - 38} y={770} width={76} height={3600} fill="#9A6A43" stroke={INK} strokeWidth={8} />
    <rect x={X0 - 38} y={770} width={24} height={3600} fill="#7E5434" />
    <path d={`M ${X0 - 38} 770 Q ${X0} 748 ${X0 + 38} 770`} fill="#B5835A" stroke={INK} strokeWidth={8} />
    {[0, 1, 2].map((i) => (
      <path key={i} d={`M ${X0 + 10 + i * 6} ${940 + i * 120} q 8 40 0 80`} fill="none" stroke={INK} strokeWidth={4} opacity={0.35} />
    ))}
    <rect x={360} y={838} width={918} height={44} rx={6} fill="#9A6A43" stroke={INK} strokeWidth={8} />
    <rect x={360} y={862} width={918} height={16} fill="#7E5434" />
    {[NEAR_L, NEAR_R].map(([x], i) => (
      <g key={i}>
        <path d={`M ${x - 20} 840 L ${x - 26} 816 Q ${x} 790 ${x + 26} 816 L ${x + 20} 840 Z`} fill="#A9D4C2" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
        <path d={`M ${x - 24} 820 L ${x + 24} 820`} stroke={INK} strokeWidth={4} />
        <path d={`M ${x - 12} 808 Q ${x - 6} 800 ${x + 2} 798`} stroke="#fff" strokeWidth={4} fill="none" strokeLinecap="round" />
      </g>
    ))}
  </g>
);

const Wire: React.FC<{p: [number, number]; glow: number}> = ({p, glow}) => {
  // taper: thin near the horizon, thick toward the camera
  const segs = [];
  const us = [0, 0.15, 0.35, 0.6, 1, 1.5, 2.6];
  for (let i = 0; i < us.length - 1; i++) {
    const a = along(p, us[i]);
    const b = along(p, us[i + 1]);
    const w = 3 + 7 * Math.min(1.6, (us[i] + us[i + 1]) / 2);
    segs.push(
      <g key={i}>
        {glow > 0.01 ? <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#FFE34D" strokeWidth={w + 22 * glow} opacity={0.45 * glow} strokeLinecap="round" /> : null}
        <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={INK} strokeWidth={w} strokeLinecap="round" />
      </g>,
    );
  }
  return <g>{segs}</g>;
};

const Clouds: React.FC<{tr: number}> = ({tr}) => {
  const cl = [
    {x: 300, y: -330, s: 0.8},
    {x: 1350, y: -300, s: 0.7},
    {x: 900, y: -420, s: 0.55},
  ];
  return (
    <g>
      {cl.map((c, i) => (
        <g key={i} transform={`translate(${c.x + 12 * tr * (i % 2 ? -1 : 1)} ${c.y}) scale(${c.s})`}>
          <PuffCluster
            fill="#FFFFFF"
            ink={6}
            puffs={[
              {x: -70, y: 10, r: 46},
              {x: 0, y: -16, r: 62},
              {x: 72, y: 8, r: 48},
              {x: 20, y: 26, r: 44},
              {x: -30, y: 28, r: 40},
            ]}
          />
        </g>
      ))}
    </g>
  );
};

// a falling loose feather
const Feather: React.FC<{x: number; y: number; rot: number; s: number; fill: string}> = ({x, y, rot, s, fill}) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M 0 -34 Q 16 -8 6 30 Q 0 36 -6 30 Q -16 -8 0 -34 Z" fill={fill} stroke={INK} strokeWidth={4} strokeLinejoin="round" />
    <path d="M 0 -26 L 0 36" stroke={INK} strokeWidth={3} />
  </g>
);

const ShotB: React.FC<{t: number; tr: number; cam: Cam}> = ({t, tr, cam}) => {
  // --- eagle motion ---
  const landT = 9.62;
  const desc = prog(t, CUT, landT);
  const feetY = t < landT ? lerp(-420, FEET[1], easeOutCubic(desc)) : FEET[1];
  const landSq = t >= landT ? spring(t - landT, 3, 7) : 0;
  const flying = t < landT + 0.12;
  const flapA = -28 + 40 * Math.sin(2 * Math.PI * 3.6 * tr);
  // fold after landing, open wide on "six"
  const fold = flying ? 1 : t < T.six ? 1 - easeOutCubic(prog(t, landT + 0.05, landT + 0.4)) : easeOutBack(prog(t, T.six - 0.05, T.six + 0.35), 1.4);
  const spreadA = -8;
  // wings come down on the wires: left on "touch", right on "two"; after the zap they spring off
  const dropL = easeOutCubic(prog(t, T.touch - 0.05, T.touch + 0.2));
  const dropR = easeOutCubic(prog(t, T.two - 0.05, T.two + 0.2));
  const lift = easeOutBack(prog(t, ZAP + 0.34, ZAP + 0.62), 1.6);
  let wingL = flying ? flapA : t < T.six ? 0 : lerp(spreadA, A_CONTACT_L, dropL);
  let wingR = flying ? flapA : t < T.six ? 0 : lerp(spreadA, A_CONTACT_R, dropR);
  wingL = lerp(wingL, -14, lift);
  wingR = lerp(wingR, -14, lift);
  if (t > ZAP && t < ZAP + 0.34) {
    const j = 3 * Math.sin(2 * Math.PI * 23 * t);
    wingL += j;
    wingR -= j;
  }
  const xray = t >= ZAP && t < ZAP + 0.32 && Math.floor((t - ZAP) * 14) % 2 === 0;
  const zapped = t >= ZAP + 0.32 ? 1 : 0;
  // eyes
  const smug = t >= T.six && t < T.once ? prog(t, T.six, T.six + 0.2) : 0;
  const wide = t >= T.once && t < ZAP ? easeOutBack(prog(t, T.once, T.once + 0.18)) : 0;
  const look: [number, number] =
    t < landT ? [0, 1] : t < T.once ? [0, 0] : t < T.and ? [-1, 0.6] : t < T.becomes ? [1, 0.6] : [0, 0];
  const bodyScale = 1 + 0.06 * bump(t, T.six - 0.05, 0.3);
  // --- pulses up the left wire toward the contact ---
  const contactL = tipWorld(-1, A_CONTACT_L);
  const contactR = tipWorld(1, A_CONTACT_R);
  const touchedL = t >= T.touch + 0.12 && t < ZAP + 0.4;
  const touchedR = t >= T.two + 0.12 && t < ZAP + 0.4;
  const bothOn = t >= T.two + 0.12 && t < ZAP + 0.4;
  const glow = bothOn ? 0.35 + 0.25 * Math.sin(2 * Math.PI * 6 * tr) + 0.4 * prog(t, 13.6, ZAP) : 0;
  // param of the contact on the left wire line
  const uC = (contactL[0] - VP[0]) / (NEAR_L[0] - VP[0]);
  const pulses = [13.55, 13.85, 14.15, 14.4].map((t0, i) => {
    const u = lerp(0.08, uC, prog(t, t0, ZAP));
    return t >= t0 && t < ZAP ? {i, p: along(NEAR_L, u), s: 0.5 + 0.7 * u} : null;
  });
  // --- bolt ---
  const boltOn = t >= ZAP && t < ZAP + 0.38;
  const bodyC: [number, number] = [FEET[0], FEET[1] - 150];
  const shoulderL: [number, number] = [FEET[0] - 60, FEET[1] - 200];
  const shoulderR: [number, number] = [FEET[0] + 60, FEET[1] - 200];
  const midL: [number, number] = [(contactL[0] + shoulderL[0]) / 2, (contactL[1] + shoulderL[1]) / 2 - 20];
  const midR: [number, number] = [(contactR[0] + shoulderR[0]) / 2, (contactR[1] + shoulderR[1]) / 2 - 20];
  // --- 6 FT arrow ---
  const arrS = easeOutCubic(prog(t, T.six, T.six + 0.3)) * (1 - prog(t, 11.45, 11.6));
  const tagS = pop(t, T.feet, 0.24) * (1 - prog(t, 11.45, 11.6));
  const tl = tipWorld(-1, spreadA);
  const trp = tipWorld(1, spreadA);
  const arrY = tl[1] - 120;
  const half = ((trp[0] - tl[0]) / 2) * arrS;
  // --- smoke + feathers after the zap ---
  const smokeT = t - (ZAP + 0.3);
  // --- sparrow lands on the frizzy head at the end ---
  const spT = prog(t, 15.2, 15.62);
  const headTop: [number, number] = [FEET[0] + 6, FEET[1] - 372];
  const spX = lerp(1500, headTop[0], easeOutCubic(spT));
  const spY = lerp(-120, headTop[1], easeInOutCubic(spT)) - 40 * Math.sin(Math.PI * spT);
  const spLand = t >= 15.62 ? spring(t - 15.62, 3, 7) : 0;
  return (
    <>
      <AbsoluteFill style={{background: SKY}} />
      <World cam={cam} depth={2.2}>
        <Svg>
          <Clouds tr={tr} />
        </Svg>
      </World>
      <World cam={cam}>
        <Svg>
          {/* distant field below the horizon */}
          <rect x={-3000} y={VP[1]} width={9000} height={4000} fill="#8ECB5C" />
          <path d={`M -3000 ${VP[1] + 2} L 6000 ${VP[1] + 2}`} stroke={INK} strokeWidth={6} />
          <path d={`M -400 ${VP[1]} Q -100 ${VP[1] - 120} 260 ${VP[1]} Q 600 ${VP[1] - 90} 900 ${VP[1]} Q 1300 ${VP[1] - 140} 1700 ${VP[1]} Q 2000 ${VP[1] - 80} 2300 ${VP[1]} Z`} fill="#7FB86A" stroke={INK} strokeWidth={6} strokeLinejoin="round" />
          {/* far poles (the same drawing scaled about the vanishing point) */}
          {[0.12, 0.25, 0.45].map((s) => (
            <g key={s} transform={`translate(${VP[0] * (1 - s)} ${VP[1] * (1 - s)}) scale(${s})`}>
              <PoleTop />
            </g>
          ))}
          <Wire p={NEAR_L} glow={glow} />
          <Wire p={NEAR_R} glow={glow * 0.7} />
          <PoleTop />
          {pulses.map((p) =>
            p ? (
              <g key={p.i} transform={`translate(${p.p[0]} ${p.p[1] - 6})`}>
                <Pulse s={p.s} t={tr + p.i} look={[1, -0.6]} />
              </g>
            ) : null,
          )}
          {/* eagle */}
          <g transform={`translate(${FEET[0]} ${feetY}) scale(${(1 + 0.04 * landSq) * bodyScale} ${(1 - 0.06 * landSq) * bodyScale})`}>
            <Eagle
              wingL={wingL}
              wingR={wingR}
              fold={fold}
              look={look}
              lid={xray ? 0 : smug * 0.45}
              brow={wide}
              wide={wide}
              zapped={zapped}
              xray={xray}
              beakOpen={zapped ? 1 : 0}
              t={tr}
            />
            <SweatDrop x={70} y={-350} r={16} s={pop(t, T.becomes, 0.2) * (t < ZAP ? 1 : 0)} rot={10} />
          </g>
          {/* contact sparks */}
          <Spark x={contactL[0]} y={contactL[1]} s={touchedL ? (0.55 + 0.25 * Math.sin(2 * Math.PI * 7 * tr)) * pop(t, T.touch + 0.12, 0.2) : 0} t={tr} />
          <Spark x={contactR[0]} y={contactR[1]} s={touchedR ? (0.55 + 0.25 * Math.sin(2 * Math.PI * 7 * tr + 1)) * pop(t, T.two + 0.12, 0.2) : 0} t={tr + 0.3} />
          {boltOn ? (
            <>
              <Bolt pts={[contactL, midL, shoulderL, bodyC, shoulderR, midR, contactR]} t={t} w={1 - 0.5 * prog(t, ZAP + 0.2, ZAP + 0.38)} />
              <Spark x={contactL[0]} y={contactL[1]} s={1.6} t={t} />
              <Spark x={contactR[0]} y={contactR[1]} s={1.6} t={t + 0.2} />
            </>
          ) : null}
          {/* 6 FT arrow */}
          {arrS > 0.01 ? (
            <g>
              <g stroke={INK} strokeWidth={22} strokeLinecap="round">
                <line x1={X0 - half} y1={arrY} x2={X0 + half} y2={arrY} />
              </g>
              <line x1={X0 - half} y1={arrY} x2={X0 + half} y2={arrY} stroke="#FFD43B" strokeWidth={10} strokeLinecap="round" />
              {[-1, 1].map((s) => (
                <path key={s} d={`M ${X0 + s * half} ${arrY} l ${-s * 34} -24 l 0 48 Z`} fill="#FFD43B" stroke={INK} strokeWidth={7} strokeLinejoin="round" />
              ))}
              {tagS > 0.01 ? (
                <g transform={`translate(${X0} ${arrY - 70}) scale(${tagS}) rotate(${-4 + 2 * Math.sin(2 * Math.PI * 1.2 * tr)})`}>
                  <rect x={-150} y={-56} width={300} height={104} rx={18} fill="#FFFFFF" stroke={INK} strokeWidth={9} />
                  <text x={0} y={26} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={76} fill="#000">
                    ~6 FT
                  </text>
                </g>
              ) : null}
            </g>
          ) : null}
          {/* smoke puffs after the zap */}
          {smokeT > 0
            ? [
                [FEET[0] - 120, FEET[1] - 400, 0],
                [contactL[0] + 40, contactL[1] - 40, 0.1],
                [contactR[0] - 40, contactR[1] - 40, 0.18],
                [FEET[0] + 150, FEET[1] - 230, 0.3],
              ].map(([x, y, d], i) => {
                const u = clamp((smokeT - d) / 1.3);
                if (u <= 0 || u >= 1) return null;
                const r = 30 * Math.sin(Math.PI * u) + 4;
                return (
                  <g key={i} transform={`translate(${x + 20 * Math.sin(3 * u + i)} ${y - 160 * u})`}>
                    <PuffCluster
                      fill="#8C8784"
                      ink={5}
                      puffs={[
                        {x: -r * 0.8, y: 0, r},
                        {x: r * 0.7, y: -r * 0.3, r: r * 0.9},
                        {x: 0, y: -r * 0.8, r: r * 0.85},
                      ]}
                    />
                  </g>
                );
              })
            : null}
          {smokeT > 0
            ? [0, 1, 2].map((i) => {
                const u = smokeT - i * 0.12;
                if (u <= 0) return null;
                const x0 = [contactL[0] + 80, FEET[0] + 120, contactR[0] - 90][i];
                const y0 = [contactL[1] - 60, FEET[1] - 260, contactR[1] - 50][i];
                return (
                  <Feather
                    key={i}
                    x={x0 + 50 * Math.sin(2.4 * u + i)}
                    y={y0 + 230 * u}
                    rot={30 * Math.sin(2.4 * u + i)}
                    s={1.2}
                    fill={i === 1 ? C.ash : C.soot}
                  />
                );
              })
            : null}
          {/* sparrow lands on the eagle's head */}
          {t >= 15.2 ? (
            <g transform={`translate(${spX} ${spY + 6 * spLand}) scale(-1.5 ${1.5 * (1 - 0.08 * spLand)})`}>
              <Sparrow look={[0.4, 0.4]} flap={t < 15.62 ? 0.5 + 0.5 * Math.sin(2 * Math.PI * 7 * tr) : 0} beakOpen={bump(t, 15.7, 0.18) + bump(t, 15.92, 0.16)} lid={t > 15.75 ? 0.4 : 0} />
            </g>
          ) : null}
        </Svg>
      </World>
    </>
  );
};


// the guy pointing up at the sparrow during the wire close-up (screen space, bottom right)
const GuyPoint: React.FC<{t: number; tr: number}> = ({t, tr}) => {
  if (t < 5.4 || t >= CUT) return null;
  const inU = easeOutBack(prog(t, 5.4, 5.78), 1.4);
  const off = (1 - inU) * 900;
  const sp = SPR.happy;
  const R = 200;
  const s = R / sp.head[2];
  const nod = 10 * bump(t, T.no, 0.3) + 8 * bump(t, T.bird, 0.3);
  return (
    <div style={{position: 'absolute', left: 800, top: 1560 + off + nod, transform: `scale(1, ${breathe(tr)})`, transformOrigin: '0 0'}}>
      <Img src={F('happy')} style={{position: 'absolute', left: -sp.head[0] * s, top: -sp.head[1] * s, width: sp.w * s, height: sp.h * s}} />
    </div>
  );
};

// guy close-up in screen space (bottom-left), pops in on "once", swaps to hands-on-cheeks on the zap
const GuyCU: React.FC<{t: number; tr: number}> = ({t, tr}) => {
  if (t < T.once) return null;
  const inU = easeOutBack(prog(t, T.once, T.once + 0.32), 1.5);
  const off = (1 - inU) * 760;
  const swap = t >= ZAP + 0.06;
  const n: SprName = swap ? 'cheeks_cu' : 'shock_cu';
  const R = 250; // head radius on screen (the chest cut stays below the frame edge)
  const s = R / SPR[n].head[2];
  const hx = 250;
  const hy = 1520;
  const sp = SPR[n];
  const sq = squashSwap(t, ZAP + 0.06);
  const trem = (swap ? 4 : 2) * Math.sin(2 * Math.PI * 9 * tr);
  return (
    <div
      style={{
        position: 'absolute',
        left: hx + trem,
        top: hy + off,
        transform: `scale(${sq[0]}, ${sq[1]})`,
        transformOrigin: '0 0',
      }}
    >
      <Img src={F(n)} style={{position: 'absolute', left: -sp.head[0] * s, top: -sp.head[1] * s, width: sp.w * s, height: sp.h * s}} />
    </div>
  );
};

export const Scene: React.FC<{t: number; tr: number; cam: Cam}> = ({t, tr, cam}) => {
  const shot = t < CUT ? 'A' : 'B';
  const flash = t >= ZAP ? 0.8 * Math.exp(-14 * (t - ZAP)) : 0;
  return (
    <>
      {shot === 'A' ? <ShotA t={t} tr={tr} cam={cam} /> : <ShotB t={t} tr={tr} cam={cam} />}
      {shot === 'A' ? <GuyPoint t={t} tr={tr} /> : null}
      {shot === 'B' ? <GuyCU t={t} tr={tr} /> : null}
      {flash > 0.01 ? <AbsoluteFill style={{background: '#FFFBE0', opacity: flash}} /> : null}
    </>
  );
};

// ---------- sounds (ElevenLabs: 3 new for this video + reused ones from sfx-library) ----------
const CUES: Cue[] = [
  {f: 'hum', at: 0, db: -34, dur: 2.25},
  {f: 'hum', at: 2.25, db: -34, dur: 2.25},
  {f: 'peep', at: 0.32, db: -24},
  {f: 'peep', at: 1.58, db: -26, rate: 1.12},
  {f: 'flap', at: 3.02, db: -25},
  {f: 'flap', at: 3.33, db: -24, rate: 0.95},
  {f: 'whoosh', at: 3.6, db: -22, rate: 0.75},
  {f: 'pop', at: 3.72, db: -27, rate: 0.8},
  {f: 'crack', at: T.zapped + 0.02, db: -30, dur: 0.4},
  {f: 'pop', at: T.zapped, db: -25, rate: 0.9},
  {f: 'whoosh', at: 4.62, db: -32, rate: 1.4},
  {f: 'hum', at: 5.0, db: -30, dur: 2.25},
  {f: 'hum', at: 7.25, db: -30, dur: 1.73, keys: [[7.25, -30], [8.7, -30], [8.98, -50]]},
  {f: 'zip', at: 5.72, db: -32, rate: 1.4, dur: 0.6},
  {f: 'pop', at: 7.18, db: -26, rate: 0.7},
  {f: 'boing', at: 7.3, db: -30, rate: 1.5},
  {f: 'zip', at: 7.86, db: -31, rate: 1.5, dur: 0.6},
  {f: 'peep', at: T.bird + 0.1, db: -28, rate: 0.85},
  {f: 'whoosh', at: CUT, db: -30, rate: 1.3},
  {f: 'flap', at: 9.1, db: -21},
  {f: 'flap', at: 9.36, db: -21, rate: 0.95},
  {f: 'flap', at: 9.58, db: -20, rate: 0.9},
  {f: 'pop', at: 9.64, db: -24, rate: 0.6},
  {f: 'whoosh', at: T.six - 0.06, db: -25, rate: 1.1},
  {f: 'flap', at: T.six, db: -24, rate: 1.1},
  {f: 'pop', at: T.feet, db: -25, rate: 1.2},
  {f: 'crack', at: T.touch + 0.1, db: -24, dur: 0.45},
  {f: 'crack', at: T.two + 0.1, db: -24, dur: 0.45, rate: 1.1},
  {f: 'hum', at: 12.4, db: -30, dur: 2.25, keys: [[12.4, -32], [14.65, -22]]},
  {f: 'pop', at: T.once, db: -26, rate: 1.0},
  {f: 'zip', at: 13.55, db: -30, rate: 1.6, dur: 0.6},
  {f: 'zip', at: 14.15, db: -28, rate: 1.8, dur: 0.5},
  {f: 'zap', at: ZAP - 0.02, db: -7},
  {f: 'sizzle', at: ZAP + 0.3, db: -22, dur: 1.05, keys: [[ZAP + 0.3, -22], [15.9, -26], [16.05, -60]]},
  {f: 'boing', at: ZAP + 0.42, db: -27, rate: 0.9},
  {f: 'flap', at: 15.3, db: -30, rate: 1.6},
  {f: 'peep', at: 15.66, db: -23},
];

export const EagleZapShort: React.FC = () => {
  useEagleFont();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const shot = t < CUT ? 'A' : 'B';
  let cam = camAt(t, shot === 'A' ? KEYS_A : KEYS_B);
  let amp = 0;
  if (shot === 'A') {
    amp += t > T.zapped ? 5 * Math.exp(-9 * (t - T.zapped)) : 0;
  } else {
    amp += t > 9.62 ? 7 * Math.exp(-9 * (t - 9.62)) * (t < 10.2 ? 1 : 0) : 0;
    amp += t > ZAP ? 26 * Math.exp(-4.5 * (t - ZAP)) : 0;
    amp += t > T.two && t < ZAP ? 1.5 * prog(t, 13.4, ZAP) : 0;
  }
  const sh = shake(t, amp);
  cam = {x: cam.x - sh.x / cam.k, y: cam.y - sh.y / cam.k, k: cam.k};
  return (
    <AbsoluteFill style={{background: SKY}}>
      <Scene t={t} tr={t} cam={cam} />
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('eagle-zap/vo/take1.mp3')} volume={Math.pow(10, MIX_DB / 20)} />
      </Sequence>
      <SoundCues cues={CUES.map((c) => ({...c, db: c.db + MIX_DB, keys: c.keys?.map(([a, b]) => [a, b + MIX_DB] as [number, number])}))} dir="eagle-zap/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};

void rnd;
