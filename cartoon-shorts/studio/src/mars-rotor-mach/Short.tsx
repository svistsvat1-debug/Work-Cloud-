import React from 'react';
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {SPR} from './sprites';
import {FPS, T, VO_AT} from './scene';
export {DURATION as MARS_ROTOR_DURATION, FPS as MARS_ROTOR_FPS} from './scene';
import {camAt, clamp, easeInCubic, easeInOutCubic, easeOutBack, easeOutCubic, lerp, pop, prog, shake, spring, type Cam, type CamKey} from '../shared/anim';
import {World} from '../shared/World';
import {PuffCluster} from '../shared/Puffs';
import {SoundCues, type Cue} from '../shared/Sound';
import {useFont} from '../shared/useFont';

// "Why couldn't the Mars helicopter spin faster?" - part 2 of Ingenuity's first flight (19 Apr 2021).
// A helicopter flies on Mars with one strict rule: its blades never spin past 2,700 rpm. Because sound is slower on Mars,
// a gust could push the tips faster than sound - and the physics there are unpredictable. So engineers fill a room with
// fake Mars air, shield the walls with metal and floor it: the tips break the sound barrier and hold - 30 % more lift.
// Facts: NASA/JPL release 2026-029 (7 May 2026) 'NASA Pushes Next-Gen Mars Helicopter Rotor Blades Past Mach 1':
// Ingenuity never exceeded 2,700 rpm in 72 flights (sound barrier + gusts); Mach 1 on Mars ~540 mph vs ~760 mph on Earth;
// March 2026 tests in JPL's 25-Foot Space Simulator with Mars-like CO2, part of it lined with sheet metal in case blades
// broke apart; 3,750 rpm = Mach 0.98, then tips to Mach 1.08 without breaking apart, +30 % lift.

const F = (n: string) => staticFile(`mars-rotor-mach/${n}.png`);
export const FONT = 'MRMInter';
export const useMrmFont = () => useFont(FONT, staticFile('fonts/Inter-Black.otf'));
const MIX_DB = -1.5;
const INK = '#000';
const RED = '#E8302A';
const YEL = '#FFE45C';
const BLADE = '#3B4048';
const GAS = '#F4C3AE';
const DUST = '#E2A06C';

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
const bump = (t: number, t0: number, d = 0.3, a = 0.08) => (t > t0 && t < t0 + d ? 1 + a * Math.pow(Math.sin((Math.PI * (t - t0)) / d), 2) : 1);

type SprInfo = {w: number; h: number; feet: [number, number]; hd?: [number, number, number]; bottom: number; left: number; right: number; top: number};
const S = (n: string) => (SPR as unknown as Record<string, SprInfo>)[n];

const Spr: React.FC<{n: string; x: number; y: number; s: number; sx?: number; sy?: number; rot?: number; ax?: number; ay?: number; clip?: string}> = ({
  n,
  x,
  y,
  s,
  sx = 1,
  sy = 1,
  rot = 0,
  ax,
  ay,
  clip,
}) => {
  const sp = S(n);
  const axx = ax ?? sp.feet[0];
  const ayy = ay ?? sp.feet[1];
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg) scale(${sx}, ${sy})`, transformOrigin: '0 0'}}>
      <div style={{position: 'absolute', left: -axx * s, top: -ayy * s, width: sp.w * s, height: sp.h * s, clipPath: clip}}>
        <Img src={F(n)} style={{width: sp.w * s, height: sp.h * s}} />
      </div>
    </div>
  );
};
const Svg: React.FC<{children: React.ReactNode; r?: number}> = ({children, r = 4000}) => (
  <svg style={{position: 'absolute', left: -r, top: -r, overflow: 'visible'}} width={2 * r} height={2 * r} viewBox={`${-r} ${-r} ${2 * r} ${2 * r}`}>
    {children}
  </svg>
);
const Label: React.FC<{x: number; y: number; text: string; size: number; s: number; rot?: number; fill?: string; bg?: string; color?: string}> = ({
  x,
  y,
  text,
  size,
  s,
  rot = 0,
  fill = '#fff',
  bg,
  color = '#000',
}) =>
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
        color: bg ? color : fill,
        WebkitTextStroke: bg ? undefined : `${size * 0.18}px #000`,
        paintOrder: 'stroke fill',
        background: bg,
        border: bg ? `${size * 0.1}px solid #000` : undefined,
        borderRadius: bg ? size * 0.25 : undefined,
        padding: bg ? `${size * 0.16}px ${size * 0.32}px ${size * 0.1}px` : undefined,
      }}
    >
      {text}
    </div>
  );

// ======================================================================================================
// shared: the guy (head radius HR world px in every pose), always facing LEFT (mirrored) toward the machine
// ======================================================================================================
const HR = 118;
const gS = (p: string) => HR / (S(p).hd as [number, number, number])[2];
const Guy: React.FC<{pose: string; x: number; y: number; t: number; swap: number; sx?: number}> = ({pose, x, y, t, swap, sx = -1}) => {
  const [qx, qy] = squashSwap(t, swap);
  const breathe = 1 + 0.009 * Math.sin(2 * Math.PI * 0.6 * t);
  return (
    <>
      <Svg>
        <ellipse cx={x} cy={y + 4} rx={95} ry={16} fill="rgba(72,54,42,0.26)" />
      </Svg>
      <Spr n={pose} x={x} y={y} s={gS(pose)} sx={sx * qx} sy={qy * breathe} />
    </>
  );
};

// rotor blades seen from the side: each blade = a bar whose tips trace a flat ellipse (no motion blur)
const Rotor: React.FC<{cx: number; cy: number; R: number; th: number; n: number; disc: number; w: number; glow?: number}> = ({cx, cy, R, th, n, disc, w, glow = 0}) => {
  const e = 0.13 * R;
  const blades = Array.from({length: n}, (_, i) => th + (i * 2 * Math.PI) / n);
  // draw the far blades first (sin < 0 = behind)
  const order = [...blades].sort((a, b) => Math.sin(a) - Math.sin(b));
  return (
    <g>
      {disc > 0.01 ? <ellipse cx={cx} cy={cy} rx={R} ry={e} fill="#fff" opacity={disc} stroke="#000" strokeOpacity={disc * 0.6} strokeWidth={4} /> : null}
      {order.map((a, i) => {
        const x2 = cx + R * Math.cos(a);
        const y2 = cy + e * Math.sin(a);
        return (
          <g key={i}>
            <line x1={cx} y1={cy} x2={x2} y2={y2} stroke={INK} strokeWidth={w + 10} strokeLinecap="round" />
            <line x1={cx} y1={cy} x2={x2} y2={y2} stroke={BLADE} strokeWidth={w} strokeLinecap="round" />
            {glow > 0.01 ? <circle cx={x2} cy={y2} r={w * 1.6} fill={RED} opacity={glow * (0.55 + 0.45 * Math.abs(Math.cos(a)))} /> : null}
          </g>
        );
      })}
      <ellipse cx={cx} cy={cy} rx={w * 1.3} ry={w * 0.8} fill="#8C949D" stroke={INK} strokeWidth={5} />
    </g>
  );
};

// ======================================================================================================
// SCENE A - Mars: the helicopter, its RULE sign, the guy
// ======================================================================================================
const MPL = S('mars') as unknown as {w: number; h: number};
const PSC = 1.3;
const HELI = S('heli');
const HS = 0.7; // heli world px per native px
const MAST_X = 347;
const SIGN = S('sign');
const SIGN_S = 0.6;
const SIGN_P: [number, number] = [205, 1690];
const GUY_M: [number, number] = [850, 1715];
const MARS_KEYS: CamKey[] = [
  {t: 0, x: 540, y: 960, k: 1.0},
  {t: 6.9, x: 540, y: 975, k: 1.06},
  {t: T.andThen - 0.05, x: 540, y: 975, k: 1.06},
  {t: T.andThen + 0.3, x: 790, y: 1360, k: 1.42, ease: 'out'},
  {t: 13.7, x: 800, y: 1365, k: 1.46},
];
const END_KEYS: CamKey[] = [
  {t: 23.5, x: 520, y: 990, k: 1.04},
  {t: 24.75, x: 520, y: 975, k: 1.01},
];

const heliAt = (t: number) => {
  let x = 540;
  let y = 1255 + 14 * Math.sin(2 * Math.PI * 0.55 * t);
  let rot = 2.5 * Math.sin(2 * Math.PI * 0.35 * t);
  // the gust pushes it sideways and makes it wobble
  if (t > T.gust && t < 12.2) {
    const u = prog(t, T.gust + 0.1, T.push + 0.4);
    const back = prog(t, 11.0, 12.2);
    const a = easeOutCubic(u) * (1 - easeInOutCubic(back));
    x += 95 * a;
    y -= 30 * a;
    rot += a * (13 + 6 * Math.sin(2 * Math.PI * 2.6 * t));
  }
  // the end: a happy hop when the rule breaks
  if (t > T.broken) {
    const u = prog(t, T.broken, T.broken + 0.5);
    y -= 70 * Math.sin(Math.PI * Math.min(u, 1)) * 0.9 + 25 * easeOutCubic(u);
    rot += 9 * Math.sin(2 * Math.PI * 1.6 * (t - T.broken)) * Math.exp(-2.2 * (t - T.broken));
  }
  return {x, y, rot};
};

const MarsScene: React.FC<{t: number; cam?: Cam; cover?: boolean}> = ({t, cam: camIn, cover}) => {
  const hideSign = !!cover;
  const final = t >= 23.5;
  const camBase = camIn ?? (final ? camAt(t, END_KEYS) : camAt(t, MARS_KEYS));
  const sh = shake(t, t > T.gust && t < T.gust + 0.6 ? 6 * (1 - prog(t, T.gust, T.gust + 0.6)) : 0);
  const cam = {x: camBase.x - sh.x / camBase.k, y: camBase.y - sh.y / camBase.k, k: camBase.k};
  const h = heliAt(t);
  const th = 2 * Math.PI * 3.1 * t;
  const glow = t > T.faster - 0.15 && t < 11.6 ? Math.min(1, prog(t, T.faster - 0.15, T.faster + 0.1)) * (1 - prog(t, 11.3, 11.6)) * (0.75 + 0.25 * Math.sin(2 * Math.PI * 6 * t)) : 0;
  // guy pose
  let pose = 'hero';
  let swap = -9;
  if (!final && t >= T.gust) [pose, swap] = ['stunned', T.gust];
  if (!final && t >= T.nobody - 0.08) [pose, swap] = ['shrug', T.nobody - 0.08];
  if (final && t >= T.broken) [pose, swap] = ['cheer', T.broken];
  // sign
  const sb = bump(t, T.rule - 0.05, 0.32, 0.12);
  const broke = final && t >= T.broken;
  const bu = broke ? easeOutCubic(prog(t, T.broken, T.broken + 0.35)) : 0;
  const signTxtX = SIGN_P[0] + (SIGN.left + (SIGN.right - SIGN.left) / 2 - SIGN.feet[0]) * SIGN_S;
  const signTxtY = SIGN_P[1] - (SIGN.feet[1] - 150) * SIGN_S;
  const L = 'polygon(0% 0%, 52% 0%, 46% 18%, 55% 33%, 47% 50%, 53% 64%, 0% 64%)';
  const Rr = 'polygon(52% 0%, 100% 0%, 100% 64%, 53% 64%, 47% 50%, 55% 33%, 46% 18%)';
  const POST = 'polygon(0% 64%, 100% 64%, 100% 100%, 0% 100%)';
  // dust devil (code): a cone of tan puffs that sweeps in from the left
  const dd = t > T.gust - 0.35 && t < 11.9 ? prog(t, T.gust - 0.35, 11.9) : -1;
  // question marks
  const qs = [0, 1, 2].map((i) => (final ? 0 : popOut(t, T.nobody + 0.05 + i * 0.12, 13.55, 0.22)));
  const mach = final ? 0 : popOut(t, T.faster - 0.05, 11.5, 0.25);
  const headY = GUY_M[1] - 2.25 * 2 * HR;
  return (
    <AbsoluteFill style={{backgroundColor: '#E9B48A'}}>
      <World cam={cam}>
        <Img src={staticFile('mars-rotor-mach/mars.jpg')} style={{position: 'absolute', left: 540 - (MPL.w * PSC) / 2, top: 960 - (MPL.h * PSC) / 2, width: MPL.w * PSC, height: MPL.h * PSC}} />
        <Svg>
          {/* heli shadow on the ground */}
          <ellipse cx={h.x} cy={1560} rx={150 * (1 - (1255 - h.y) / 900)} ry={22} fill="rgba(90,40,20,0.28)" />
        </Svg>
        {/* sign (snaps in two at the end) */}
        {hideSign ? null : broke ? (
          <>
            <Spr n="sign" x={SIGN_P[0]} y={SIGN_P[1]} s={SIGN_S} clip={POST} />
            <div style={{position: 'absolute', left: 0, top: 0, transform: `translate(${-60 * bu}px, ${40 * bu}px) rotate(${-16 * bu}deg)`, transformOrigin: `${SIGN_P[0] - 60}px ${SIGN_P[1] - 200}px`}}>
              <Spr n="sign" x={SIGN_P[0]} y={SIGN_P[1]} s={SIGN_S} clip={L} />
              <Label x={signTxtX - 40} y={signTxtY - 28} text="MAX" size={44} s={1} fill="#000" />
            </div>
            <div style={{position: 'absolute', left: 0, top: 0, transform: `translate(${55 * bu}px, ${50 * bu}px) rotate(${19 * bu}deg)`, transformOrigin: `${SIGN_P[0] + 60}px ${SIGN_P[1] - 200}px`}}>
              <Spr n="sign" x={SIGN_P[0]} y={SIGN_P[1]} s={SIGN_S} clip={Rr} />
            </div>
          </>
        ) : (
          <div style={{position: 'absolute', left: 0, top: 0, transform: `scale(${sb})`, transformOrigin: `${SIGN_P[0]}px ${SIGN_P[1]}px`}}>
            <Spr n="sign" x={SIGN_P[0]} y={SIGN_P[1]} s={SIGN_S} />
            <div style={{position: 'absolute', left: signTxtX, top: signTxtY, transform: 'translate(-50%, -50%)', fontFamily: FONT, fontSize: 44, lineHeight: 1.08, textAlign: 'center', color: '#000', whiteSpace: 'nowrap'}}>
              MAX
              <br />
              <span style={{fontSize: 40}}>2,700 RPM</span>
            </div>
          </div>
        )}
        {/* the helicopter + its two counter-rotating rotors */}
        <div style={{position: 'absolute', left: h.x, top: h.y, transform: `rotate(${h.rot}deg)`, transformOrigin: '0 0'}}>
          <Img src={F('heli')} style={{position: 'absolute', left: -MAST_X * HS, top: -HELI.bottom * HS, width: HELI.w * HS, height: HELI.h * HS}} />
          <Svg>
            <Rotor cx={0} cy={-(HELI.bottom - 228) * HS} R={240} th={-th} n={2} disc={0.16} w={13} glow={glow} />
            <Rotor cx={0} cy={-(HELI.bottom - 158) * HS} R={240} th={th + 0.6} n={2} disc={0.16} w={13} glow={glow} />
          </Svg>
        </div>
        {/* dust devil */}
        {dd >= 0 ? (
          <Svg>
            {(() => {
              const cx = lerp(-260, 520, easeOutCubic(prog(dd, 0, 0.45))) + lerp(0, 700, easeInCubic(prog(dd, 0.6, 1)));
              const grow = Math.min(1, dd * 6) * (1 - easeInCubic(prog(dd, 0.82, 1)));
              const puffs = Array.from({length: 11}, (_, i) => {
                const f = i / 10;
                const a = 2 * Math.PI * (2.4 * t + f * 1.7);
                return {x: cx + Math.cos(a) * (30 + 120 * f), y: 1600 - f * 520, r: (34 + 46 * f) * grow};
              });
              return <PuffCluster puffs={puffs} fill={DUST} ink={5} shade="#D08A55" />;
            })()}
          </Svg>
        ) : null}
        <Label x={h.x} y={h.y - 640} text="MACH 1?" size={72} s={mach} fill={RED} rot={-4} />
        <Guy pose={pose} x={GUY_M[0]} y={GUY_M[1]} t={t} swap={swap} />
        {qs.map((s, i) => (
          <Label key={i} x={GUY_M[0] - 120 + i * 110} y={headY - 40 - (i === 1 ? 50 : 0)} text="?" size={110} s={s} fill={YEL} rot={(i - 1) * 14} />
        ))}
      </World>
      {cover ? null : <MarsOverlays t={t} />}
    </AbsoluteFill>
  );
};

// ---------- a dial gauge (screen space) ----------
const Gauge: React.FC<{x: number; y: number; s: number; v: number; label: string; mark: string; shakeA?: number; readout?: string; hot?: boolean}> = ({
  x,
  y,
  s,
  v,
  label,
  mark,
  shakeA = 0,
  readout,
  hot,
}) => {
  if (s <= 0.001) return null;
  const R = 175;
  const ang = (u: number) => Math.PI + u * Math.PI;
  const pt = (u: number, r: number) => [R * 0 + r * Math.cos(ang(u)), r * Math.sin(ang(u))];
  const arc = (u0: number, u1: number, r: number) => {
    const [x0, y0] = pt(u0, r);
    const [x1, y1] = pt(u1, r);
    return `M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`;
  };
  const a = ang(clamp(v, 0, 1.02)) + shakeA;
  return (
    <div style={{position: 'absolute', left: x, top: y, transform: `scale(${s})`, transformOrigin: '0 0'}}>
      <svg style={{position: 'absolute', left: -260, top: -260, overflow: 'visible'}} width={520} height={520} viewBox="-260 -260 520 520">
        <path d={`${arc(0, 1, R)} L ${R} 30 L ${-R} 30 Z`} fill="#fff" stroke={INK} strokeWidth={12} strokeLinejoin="round" />
        <path d={arc(0.8, 1, R - 30)} stroke={RED} strokeWidth={44} fill="none" />
        {Array.from({length: 11}, (_, i) => {
          const [x0, y0] = pt(i / 10, R - 8);
          const [x1, y1] = pt(i / 10, R - (i % 5 === 0 ? 52 : 34));
          return <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} stroke={INK} strokeWidth={i % 5 === 0 ? 9 : 6} strokeLinecap="round" />;
        })}
        <line x1={0} y1={0} x2={(R - 40) * Math.cos(a)} y2={(R - 40) * Math.sin(a)} stroke={INK} strokeWidth={22} strokeLinecap="round" />
        <line x1={0} y1={0} x2={(R - 40) * Math.cos(a)} y2={(R - 40) * Math.sin(a)} stroke={hot ? RED : '#3B4048'} strokeWidth={10} strokeLinecap="round" />
        <circle r={26} fill={INK} />
      </svg>
      <Label x={pt(0.8, R + 52)[0] + 6} y={pt(0.8, R + 52)[1] - 6} text={mark} size={42} s={1} />
      <Label x={0} y={70} text={label} size={46} s={1} />
      {readout ? <Label x={0} y={150} text={readout} size={58} s={1} bg={hot ? RED : '#fff'} color={hot ? '#fff' : '#000'} /> : null}
    </div>
  );
};

const MarsOverlays: React.FC<{t: number}> = ({t}) => {
  if (t >= 23.5) return null;
  const g1 = popOut(t, T.blades, T.because - 0.1, 0.28);
  const g2 = popOut(t, T.gust + 0.2, 11.5, 0.25);
  let v = 0.62;
  let sa = 0;
  if (t < T.because) {
    v = 0.6 + 0.12 * easeInOutCubic(prog(t, T.blades + 0.1, T.rpm - 0.3)) + 0.008 * Math.sin(2 * Math.PI * 3 * t);
    if (t > T.rpm - 0.1 && t < T.rpm + 0.45) v += 0.075 * Math.sin((Math.PI * (t - T.rpm + 0.1)) / 0.55);
  } else {
    v = 0.72 + 0.27 * easeOutCubic(prog(t, T.push - 0.05, T.faster)) - 0.2 * easeInOutCubic(prog(t, 11.0, 11.5));
    sa = t > T.push ? 0.04 * Math.sin(2 * Math.PI * 13 * t) : 0;
  }
  const hot = v > 0.8;
  // speed of sound panel
  const pS = popOut(t, T.because - 0.02, T.gust - 0.05, 0.25);
  const b1 = easeOutCubic(prog(t, T.because + 0.1, T.because + 0.5));
  const b2 = easeOutCubic(prog(t, T.slower - 0.05, T.slower + 0.4));
  return (
    <AbsoluteFill>
      <Gauge x={540} y={300} s={Math.max(g1, g2)} v={v} label="RPM" mark="2,700" shakeA={sa} hot={hot} />
      {pS > 0.001 ? (
        <div style={{position: 'absolute', left: 540, top: 330, transform: `translate(-50%, -50%) scale(${pS})`, width: 900, height: 360, background: '#fff', border: '12px solid #000', borderRadius: 40}}>
          <div style={{position: 'absolute', left: 0, right: 0, top: 22, textAlign: 'center', fontFamily: FONT, fontSize: 46, color: '#000'}}>SPEED OF SOUND</div>
          {[
            {n: 'EARTH', c: '#4D8FD6', w: 400 * b1, txt: '760 MPH', y: 110},
            {n: 'MARS', c: '#D8743F', w: 284 * b2, txt: '540 MPH', y: 220},
          ].map((r) => (
            <div key={r.n}>
              <div style={{position: 'absolute', left: 30, top: r.y + 18, fontFamily: FONT, fontSize: 44, color: '#000'}}>{r.n}</div>
              <div style={{position: 'absolute', left: 230, top: r.y, width: Math.max(0, r.w), height: 80, background: r.c, border: r.w > 4 ? '8px solid #000' : undefined, borderRadius: 20, boxSizing: 'border-box'}} />
              {r.w > 30 ? <div style={{position: 'absolute', left: 230 + r.w + 18, top: r.y + 18, fontFamily: FONT, fontSize: 44, color: '#000', whiteSpace: 'nowrap'}}>{r.txt}</div> : null}
            </div>
          ))}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

// ======================================================================================================
// SCENE B - the test chamber
// ======================================================================================================
const CPL = S('chamber') as unknown as {w: number; h: number};
const STAND_TOP = 960 - (1536 * PSC) / 2 + 985 * PSC; // top of the plate's test-stand pillar (world y)
const HUB: [number, number] = [540, 1000];
const GUY_C: [number, number] = [815, 1745];
const TANK_P: [number, number] = [300, 1712];
const TB = 20.02; // the sonic boom
const CH_KEYS: CamKey[] = [
  {t: 13.71, x: 540, y: 980, k: 1.0},
  {t: 17.5, x: 560, y: 1000, k: 1.05},
  {t: 18.0, x: 665, y: 1080, k: 1.1},
  {t: TB - 0.02, x: 640, y: 1040, k: 1.14},
  {t: TB + 0.45, x: 540, y: 990, k: 1.0, ease: 'out'},
  {t: 21.7, x: 540, y: 985, k: 1.0},
  {t: 22.5, x: 540, y: 960, k: 1.06},
  {t: 23.5, x: 540, y: 960, k: 1.07},
];
// rotor speed (rev/s shown) and Mach
const revAt = (t: number) => (t < T.floor ? 0 : t < 19.2 ? 2.8 * easeInCubic(prog(t, T.floor, 19.2)) : 2.8);
const angleAt = (t: number) => {
  // integral of revAt (numerical, fine for 60 fps)
  let a = 0.4;
  const dt = 1 / 120;
  for (let s = T.floor; s < t; s += dt) a += 2 * Math.PI * revAt(s) * dt;
  return a;
};
const machAt = (t: number) => {
  if (t < T.floor) return 0;
  if (t < 18.9) return 0.7 * easeOutCubic(prog(t, T.floor, 18.9));
  if (t < 19.6) return lerp(0.7, 0.98, easeInOutCubic(prog(t, 18.9, 19.6)));
  if (t < TB - 0.05) return 0.98 + 0.005 * Math.sin(2 * Math.PI * 7 * t);
  return lerp(0.98, 1.08, easeOutCubic(prog(t, TB - 0.05, TB + 0.1)));
};
// lever: pivot on a floor base; handle where the (mirrored) fists of the pull pose are
const PULL = S('pull');
const handleRel: [number, number] = [-(PULL.right - 18 - PULL.feet[0]) * gS('pull'), -(PULL.feet[1] - 0.43 * PULL.h) * gS('pull')];

const ChamberScene: React.FC<{t: number}> = ({t}) => {
  const camBase = camAt(t, CH_KEYS);
  const amp = (t > TB ? 26 * Math.exp(-5 * (t - TB)) : 0) + (t > 16.5 && t < 17.3 ? 7 * Math.exp(-9 * Math.min(Math.abs(t - 16.62), Math.abs(t - 17.04))) : 0) + (t > 19.0 && t < TB ? 2.5 : 0);
  const sh = shake(t, amp);
  const cam = {x: camBase.x - sh.x / camBase.k, y: camBase.y - sh.y / camBase.k, k: camBase.k};
  const th = angleAt(t);
  const rev = revAt(t);
  const disc = clamp(rev / 2.8) * 0.3;
  // lift: the rotor strains upward
  const lift = t > T.thirty ? easeOutBack(prog(t, T.thirty, T.thirty + 0.6), 1.6) * 34 + 3 * Math.sin(2 * Math.PI * 9 * t) : 0;
  const hub: [number, number] = [HUB[0], HUB[1] - lift];
  // guy
  let pose = 'hero';
  let swap = -9;
  if (t >= 17.45) [pose, swap] = ['pull', 17.45];
  if (t >= TB - 0.06) [pose, swap] = ['duck', TB - 0.06];
  if (t >= T.hold - 0.05) [pose, swap] = ['peek', T.hold - 0.05];
  if (t >= T.lift - 0.05) [pose, swap] = ['cheer', T.lift - 0.05];
  // lever arm: upright (leaning toward the machine) -> pulled toward the guy on 'floor'
  const pull = easeInOutCubic(prog(t, T.floor - 0.15, T.floor + 0.12));
  const leverAng = lerp(-22, 26, pull) * (Math.PI / 180); // from vertical, + = toward the guy (right)
  const LEN = 230;
  const handle0: [number, number] = [GUY_C[0] + handleRel[0], GUY_C[1] + handleRel[1]];
  const pivot: [number, number] = [handle0[0] - LEN * Math.sin((-22 * Math.PI) / 180) * 0 - LEN * Math.sin(-22 * (Math.PI / 180)), handle0[1] + LEN * Math.cos(-22 * (Math.PI / 180))];
  const handle: [number, number] = [pivot[0] + LEN * Math.sin(leverAng), pivot[1] - LEN * Math.cos(leverAng)];
  const guyDx = pose === 'pull' ? handle[0] - handle0[0] : 0;
  const guyDy = pose === 'pull' ? handle[1] - handle0[1] : 0;
  // shields drop from the ceiling and slam onto the walls
  const sh1 = easeInCubic(prog(t, T.walls - 0.32, T.walls - 0.02));
  const sh2 = easeInCubic(prog(t, T.metal - 0.3, T.metal));
  const tint = 0.2 * easeInOutCubic(prog(t, T.fill + 0.1, T.air + 0.3));
  // gas puffs from the tank valve
  const valve: [number, number] = [TANK_P[0], TANK_P[1] - S('tank').h * 0.5 + 30];
  const gasOn = t > T.fill - 0.05 && t < T.shield + 0.9;
  return (
    <AbsoluteFill style={{backgroundColor: '#B8C0C8'}}>
      <World cam={cam}>
        <Img src={staticFile('mars-rotor-mach/chamber.jpg')} style={{position: 'absolute', left: 540 - (CPL.w * PSC) / 2, top: 960 - (CPL.h * PSC) / 2, width: CPL.w * PSC, height: CPL.h * PSC}} />
        {/* metal shields */}
        <Spr n="shield" x={185} y={lerp(-300, 1500, sh1)} s={0.55} rot={-3} />
        <Spr n="shield" x={905} y={lerp(-300, 1500, sh2)} s={0.55} sx={-1} rot={3} />
        <Spr n="tank" x={TANK_P[0]} y={TANK_P[1]} s={0.5} sx={bump(t, T.fill - 0.05, 0.3, 0.05)} />
        {/* mast + rotor on the stand */}
        <Svg>
          <rect x={hub[0] - 19} y={hub[1]} width={38} height={STAND_TOP - hub[1] + 4} fill="#9AA3AD" stroke={INK} strokeWidth={8} />
          <Rotor cx={hub[0]} cy={hub[1]} R={330} th={th} n={3} disc={disc} w={20} />
          {/* sonic boom: shock rings around the rotor disc + tip cones */}
          {t > TB - 0.02 && t < TB + 0.9
            ? [0, 1, 2].map((i) => {
                const u = prog(t, TB + i * 0.09, TB + 0.65 + i * 0.09);
                if (u <= 0 || u >= 1) return null;
                const rx = 330 * (1.05 + 1.5 * easeOutCubic(u));
                return (
                  <g key={i} opacity={1 - u}>
                    <ellipse cx={hub[0]} cy={hub[1]} rx={rx} ry={rx * 0.24} fill="none" stroke={INK} strokeWidth={22} />
                    <ellipse cx={hub[0]} cy={hub[1]} rx={rx} ry={rx * 0.24} fill="none" stroke="#fff" strokeWidth={11} />
                  </g>
                );
              })
            : null}
          {t > T.hold - 0.05 && t < T.hold + 0.7
            ? [-1, 1, -0.5, 0.5].map((f, i) => {
                const u = prog(t, T.hold - 0.05 + i * 0.07, T.hold + 0.45 + i * 0.07);
                if (u <= 0 || u >= 1) return null;
                const sc = Math.sin(Math.PI * u) * 1.2;
                const cx = hub[0] + f * 330;
                const cy = hub[1] - 50 - 40 * u - (i % 2) * 30;
                return <path key={i} d={`M ${cx} ${cy - 34 * sc} L ${cx + 9 * sc} ${cy - 9 * sc} L ${cx + 34 * sc} ${cy} L ${cx + 9 * sc} ${cy + 9 * sc} L ${cx} ${cy + 34 * sc} L ${cx - 9 * sc} ${cy + 9 * sc} L ${cx - 34 * sc} ${cy} L ${cx - 9 * sc} ${cy - 9 * sc} Z`} fill={YEL} stroke={INK} strokeWidth={6} strokeLinejoin="round" />;
              })
            : null}
          {lift > 1
            ? [-1, 1].map((sgn) => {
                const ax = hub[0] + sgn * 400;
                const ay = hub[1] + 40 - 30 * ((t * 1.6) % 1);
                const o = Math.min(1, prog(t, T.thirty, T.thirty + 0.3)) * (1 - prog(t, 23.2, 23.45));
                return <path key={sgn} d={`M ${ax} ${ay - 70} L ${ax + 46} ${ay - 10} L ${ax + 18} ${ay - 10} L ${ax + 18} ${ay + 50} L ${ax - 18} ${ay + 50} L ${ax - 18} ${ay - 10} L ${ax - 46} ${ay - 10} Z`} fill={YEL} stroke={INK} strokeWidth={8} strokeLinejoin="round" opacity={o} />;
              })
            : null}
          {gasOn
            ? [0, 1, 2, 3, 4, 5, 6].map((i) => {
                const born = T.fill + i * 0.24;
                const u = prog(t, born, born + 1.5);
                if (u <= 0 || u >= 1) return null;
                const r = 95 * Math.sin(Math.PI * u) + 10;
                const cx = valve[0] + 30 + (i % 2 ? -260 : 560) * easeOutCubic(u) * (0.7 + 0.08 * i);
                const cy = valve[1] - 40 - (300 + 60 * (i % 3)) * easeOutCubic(u);
                return <PuffCluster key={i} puffs={[{x: cx, y: cy, r}, {x: cx + r * 0.9, y: cy + r * 0.25, r: r * 0.75}, {x: cx - r * 0.8, y: cy + r * 0.3, r: r * 0.7}]} fill={GAS} ink={5} shade="#E8AE97" />;
              })
            : null}
          {/* lever */}
          <rect x={pivot[0] - 55} y={pivot[1] - 10} width={110} height={GUY_C[1] - pivot[1] + 10} rx={12} fill="#5A6068" stroke={INK} strokeWidth={8} />
          <line x1={pivot[0]} y1={pivot[1]} x2={handle[0]} y2={handle[1]} stroke={INK} strokeWidth={30} strokeLinecap="round" />
          <line x1={pivot[0]} y1={pivot[1]} x2={handle[0]} y2={handle[1]} stroke="#9AA3AD" strokeWidth={16} strokeLinecap="round" />
          <circle cx={pivot[0]} cy={pivot[1]} r={16} fill="#5A6068" stroke={INK} strokeWidth={7} />
          <circle cx={handle[0]} cy={handle[1]} r={34} fill={RED} stroke={INK} strokeWidth={8} />
        </Svg>
        <Guy pose={pose} x={GUY_C[0] + guyDx} y={GUY_C[1] + guyDy * 0.3} t={t} swap={swap} />
        <Label x={340} y={1150} text="FAKE MARS AIR" size={56} s={popOut(t, T.fake - 0.05, T.shield - 0.05, 0.25)} bg="#fff" rot={-3} />
      </World>
      {tint > 0.001 ? <AbsoluteFill style={{background: `rgba(230,120,70,${tint})`}} /> : null}
      {t > TB - 0.02 && t < TB + 0.3 ? <AbsoluteFill style={{background: `rgba(255,255,255,${0.55 * (1 - prog(t, TB, TB + 0.3))})`}} /> : null}
      <ChamberOverlays t={t} />
    </AbsoluteFill>
  );
};

const ChamberOverlays: React.FC<{t: number}> = ({t}) => {
  const g = popOut(t, T.floor + 0.05, T.thirty - 0.15, 0.28);
  const m = machAt(t);
  const hot = m >= 1.0;
  const badge = popOut(t, T.thirty + 0.02, 23.45, 0.3);
  return (
    <AbsoluteFill>
      <Gauge x={540} y={300} s={g} v={m / 1.25} label="MACH" mark="1.0" hot={hot} readout={`MACH ${m.toFixed(2)}`} shakeA={t > 19.0 && t < TB ? 0.02 * Math.sin(2 * Math.PI * 15 * t) : 0} />
      <Label x={540} y={330} text="+30% LIFT" size={130} s={badge * bump(t, T.lift - 0.05, 0.3, 0.1)} fill={YEL} rot={-4} />
    </AbsoluteFill>
  );
};

// ---------- sound ----------
const CUES: Cue[] = [
  {f: 'rotor', at: 0, db: -28, dur: T.so - 0.02, keys: [[0, -28], [T.gust, -28], [T.gust + 0.2, -22], [11.4, -22], [11.7, -30]]},
  {f: 'pop', at: T.rule - 0.05, db: -21},
  {f: 'pop', at: T.blades, db: -24},
  {f: 'needle', at: T.rpm - 0.1, db: -20},
  {f: 'whoosh', at: T.because - 0.1, db: -29},
  {f: 'pop', at: T.because + 0.1, db: -25},
  {f: 'pop', at: T.slower - 0.05, db: -25},
  {f: 'gust', at: T.gust - 0.35, db: -16},
  {f: 'alert', at: T.faster - 0.05, db: -22},
  {f: 'scratch', at: T.andThen - 0.03, db: -19},
  {f: 'crickets', at: T.nobody + 0.15, db: -26, dur: 0.95},
  {f: 'gas_hiss', at: T.fill - 0.03, db: -21},
  {f: 'gas_hiss', at: T.fill + 0.85, db: -23, rate: 0.92},
  {f: 'whoosh', at: T.walls - 0.4, db: -28, rate: 1.2},
  {f: 'clang', at: T.walls - 0.03, db: -15},
  {f: 'clang', at: T.metal - 0.02, db: -16, rate: 1.08},
  {f: 'lever', at: T.floor - 0.45, db: -17},
  {f: 'spinup', at: T.floor, db: -18, keys: [[T.floor, -32], [19.6, -15], [TB, -14], [TB + 0.1, -26]]},
  {f: 'sonicboom', at: TB - 0.02, db: -10},
  {f: 'rotor', at: TB + 0.05, db: -26, rate: 0.75, dur: 3.3, keys: [[TB, -30], [TB + 0.5, -24], [23.0, -24], [23.45, -40]]},
  {f: 'twinkle', at: T.hold, db: -21},
  {f: 'pop', at: T.thirty + 0.02, db: -19},
  {f: 'whoosh', at: T.lift - 0.2, db: -27, rate: 0.85},
  {f: 'rotor', at: 23.5, db: -28, dur: 1.2, keys: [[23.5, -28], [24.5, -28], [24.74, -45]]},
  {f: 'snap', at: T.broken - 0.01, db: -14},
  {f: 'boing', at: T.broken + 0.05, db: -25},
];

export const MarsRotorMachShort: React.FC = () => {
  useMrmFont();
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const chamber = t >= T.so && t < 23.5;
  return (
    <AbsoluteFill style={{backgroundColor: '#E9B48A'}}>
      {chamber ? <ChamberScene t={t} /> : <MarsScene t={t} />}
      <Sequence from={Math.round(VO_AT * FPS)} layout="none">
        <Audio src={staticFile('mars-rotor-mach/vo/take1_fit.wav')} volume={Math.pow(10, MIX_DB / 20)} />
      </Sequence>
      <Sequence from={Math.round(0.1 * FPS)} layout="none">
        <Audio src={staticFile('mars-rotor-mach/music/bed.wav')} />
      </Sequence>
      <SoundCues cues={CUES} dir="mars-rotor-mach/sfx" fps={FPS} />
    </AbsoluteFill>
  );
};

export {MarsScene};
