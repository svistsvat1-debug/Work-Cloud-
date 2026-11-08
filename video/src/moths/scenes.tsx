import React from 'react';
import {AbsoluteFill} from 'remotion';
import {Cam, CamKey, E, Layer, camAt, clamp, lerp, rotRightTo, rotUpTo, seg, shake, spring, toScreen, wobble} from './lib';
import {Extra, Lamp, LAMP, Moon, MOON, Moth, MothExpr, Scientist, SCI} from './characters';
import {
  Arrow, Caption, ContactShadow, Dashed, DizzyStars, FarGround, GROUND, LAMP_S, LampGlow, LightPool, NearBand, NearGrass, Puff, RedX, Sky, Stars, Tag, Viewfinder,
} from './env';
import {T, DUR} from './timing';

const P = DUR; // loop period: every repeating motion makes a whole number of cycles in P -> last frame flows into frame 0
const impact = (t: number, t0: number, f = 3, d = 7) => (t < t0 ? 0 : Math.exp(-d * (t - t0)) * Math.cos(2 * Math.PI * f * (t - t0)));
const bump = (t: number, a: number, b: number) => (t < a || t > b ? 0 : Math.sin((Math.PI * (t - a)) / (b - a)));
const angLerp = (a: number, b: number, u: number) => {
  let d = ((b - a) % 360 + 540) % 360 - 180;
  return a + d * u;
};
const lanternOf = (bx: number, by: number) => ({x: bx + (LAMP.lantern[0] - LAMP.ax) * LAMP_S, y: by - (LAMP.ay - LAMP.lantern[1]) * LAMP_S});
const look = (fx: number, fy: number, tx: number, ty: number): [number, number] => {
  const dx = tx - fx, dy = ty - fy, d = Math.hypot(dx, dy) || 1;
  return [dx / d, dy / d];
};
const HERO_S = 0.2;
const HERO_HZ = 239 / P; // ~8 flaps / s, whole number per loop
const EXTRA_HZ = 179 / P;

// ---------------- world layout of the lamp shots (A and C share it, so C's last frame = A's first frame) ----------------
const BASE = {x: 540, y: GROUND.near};
const LC = lanternOf(BASE.x, BASE.y);
const MOON_POS = {x: 1200, y: -1170, z: 3000, s: 900 / 1134};

// ---------------- the swarm around the lamp ----------------
type SwarmM = {kind: 'hero' | 'hero2' | 'a' | 'b' | 'c'; R: number; e: number; n: number; ph: number; size: number; m: number};
const SWARM: SwarmM[] = [
  {kind: 'c', R: 430, e: 0.48, n: -14, ph: 1.1, size: 140, m: 4},
  {kind: 'a', R: 350, e: 0.58, n: -19, ph: 2.3, size: 150, m: 3},
  {kind: 'hero2', R: 315, e: 0.66, n: -21, ph: 3.4, size: 0.08, m: 3},
  {kind: 'b', R: 205, e: 0.92, n: -31, ph: 4.4, size: 150, m: 5},
  {kind: 'hero', R: 262, e: 0.74, n: -24, ph: 0.4, size: 0.105, m: 2},
];
const orbit = (o: SwarmM, t: number, L: {x: number; y: number}) => {
  const phi = o.ph + (2 * Math.PI * o.n * t) / P;
  const w = 1 + 0.07 * Math.sin((2 * Math.PI * o.m * t) / P + o.ph);
  return {x: L.x + o.R * w * Math.cos(phi), y: L.y + o.R * o.e * w * Math.sin(phi) + 22 * Math.sin((2 * Math.PI * (o.m + 4) * t) / P)};
};
const SwarmMoth: React.FC<{o: SwarmM; t: number; L: {x: number; y: number}; pos?: {x: number; y: number}; uid: string; tf?: number}> = ({o, t, L, pos, uid, tf}) => {
  const p = pos ?? orbit(o, t, L);
  const q = orbit(o, t + 1 / 120, L), q0 = orbit(o, t, L);
  if (o.kind === 'hero' || o.kind === 'hero2') {
    return <Moth uid={uid} x={p.x} y={p.y} s={o.size} t={tf ?? t} hz={HERO_HZ} seed={o.ph} rot={rotUpTo(L.x - p.x, L.y - p.y)}
      filter={o.kind === 'hero2' ? 'hue-rotate(-28deg) saturate(0.75) brightness(0.9)' : undefined} />;
  }
  return <Extra kind={o.kind} x={p.x} y={p.y} width={o.size} t={tf ?? t} hz={EXTRA_HZ} seed={o.ph * 3} rot={rotUpTo(q.x - q0.x, q.y - q0.y)} />;
};

const Ground: React.FC<{cam: Cam; blur?: number; lamp?: React.ReactNode; pool?: number; poolX?: number; grass?: number[]; children?: React.ReactNode}> = ({cam, blur = 0, lamp, pool = 0, poolX = 540, grass, children}) => (
  <>
    <FarGround cam={cam} blur={blur} />
    <Layer cam={cam} z={1000}>
      {lamp}
      <NearBand />
      <LightPool x={poolX} a={pool} />
      <NearGrass xs={grass} />
      {children}
    </Layer>
  </>
);

// =====================================================================================================================
// SHOT A (0 - 8.05): frame 0 premise -> glide up to the Moon -> old theory -> spiral -> WRONG
// =====================================================================================================================
const CAM_A: CamKey[] = [
  {t: 0, x: 540, y: 960, z: 0}, {t: T.old, x: 540, y: 960, z: 0},
  {t: 3.85, x: 900, y: 30, z: 0}, {t: 5.2, x: 900, y: 30, z: 0},
  {t: 6.25, x: 640, y: 760, z: 60}, {t: 8.2, x: 640, y: 760, z: 60},
];
const TH0 = 3.9, THL = T.lamps, THE = 6.85;
const P0 = {x: 150 + 560 * (THL - TH0), y: 60};
const R0 = Math.hypot(P0.x - LC.x, P0.y - LC.y), TH_A0 = Math.atan2(P0.y - LC.y, P0.x - LC.x);
const BIGT = 2 * Math.PI * 1.25, R_END = 150, KAPPA = Math.log(R0 / R_END) / BIGT;
const theoryPos = (t: number) => {
  if (t < THL) return {x: 150 + 560 * (t - TH0), y: 60 + 12 * Math.sin(2 * Math.PI * 1.1 * (t - TH0))};
  if (t <= THE) {
    const u = Math.pow(clamp((t - THL) / (THE - THL)), 1.15);
    const th = -Math.log(1 - u * (1 - Math.exp(-KAPPA * BIGT))) / KAPPA; // constant speed along the log spiral
    const r = R0 * Math.exp(-KAPPA * th);
    return {x: LC.x + r * Math.cos(TH_A0 + th), y: LC.y + r * Math.sin(TH_A0 + th)};
  }
  const th = BIGT + 7.5 * (t - THE);
  return {x: LC.x + R_END * Math.cos(TH_A0 + th), y: LC.y + R_END * 0.8 * Math.sin(TH_A0 + th)};
};

export const SceneA: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(t, CAM_A);
  const sh = shake(t, [{t: T.wrong - 0.03, a: 26, d: 5}]);
  const showTheory = t >= TH0;
  const tp = theoryPos(t), tq = theoryPos(t + 1 / 120);
  let trot = rotRightTo(tq.x - tp.x, tq.y - tp.y);
  if (t < THL + 0.25) trot = angLerp(0, trot, seg(t, THL, THL + 0.25)) + (t < THL ? 4 * Math.sin(2 * Math.PI * 1.1 * (t - TH0)) : 0);
  const heroSw = orbit(SWARM[4], t, LC);
  const lampTarget = t >= THL ? tp : heroSw;
  const moonScr = toScreen(cam, MOON_POS.z, MOON_POS.x, MOON_POS.y);
  const tpS = toScreen(cam, 1000, tp.x, tp.y);
  const lcS = toScreen(cam, 1000, LC.x, LC.y);
  // trail (dashed) from where the moth appeared
  const trail: {x: number; y: number}[] = [];
  if (showTheory) for (let s = TH0 + 0.15; s <= Math.min(t, 7.2); s += 1 / 40) { const p = theoryPos(s); trail.push(toScreen(cam, 1000, p.x, p.y)); }
  const moonCover = t < 4.0 ? 0.58 : clamp(0.58 - 0.5 * spring(t, 4.0, 2.4, 8));
  const moonLook: [number, number] = t < 4.0 ? [-0.2, 0.4] : look(moonScr.x, moonScr.y, tpS.x, tpS.y);
  return (
    <AbsoluteFill>
      <Sky glow={0.25} />
      <AbsoluteFill style={{transform: `translate(${sh.x}px, ${sh.y}px)`}}>
        <Stars cam={cam} t={t} />
        <Layer cam={cam} z={MOON_POS.z}>
          <Moon uid="moonA" x={MOON_POS.x} y={MOON_POS.y} s={MOON_POS.s} cover={moonCover} look={moonLook} wince={t >= T.wrong - 0.03} />
        </Layer>
        <Ground cam={cam} pool={1} lamp={<>
          <LampGlow x={LC.x} y={LC.y} a={1} />
          <Lamp uid="lampA" x={BASE.x} y={BASE.y} s={LAMP_S} on cover={0.42} tilt={0.22} brow={-0.15} smirk={1}
            look={look(LC.x, LC.y, lampTarget.x, lampTarget.y)} />
        </>}>
          {SWARM.map((o, i) => <SwarmMoth key={i} o={o} t={t} L={LC} uid={`swA${i}`} />)}
          {showTheory && (
            <Moth uid="theory" x={tp.x} y={tp.y} s={0.16} t={t} rot={trot} hz={9} expr={t > 6.0 ? 'worried' : 'calm'} />
          )}
        </Ground>
        {showTheory && t < T.wrong + 1 && (
          <>
            <Dashed pts={trail} t={t} a={0.55} width={7} />
            {t > 4.1 && t < THL && <Dashed pts={[tpS, moonScr]} t={t} color="#FFE9A8" width={8} a={0.9 * seg(t, 4.1, 4.3)} />}
            {t >= THL && t < 7.25 && <Dashed pts={[tpS, lcS]} t={t} color="#FFE9A8" width={8} a={0.9} />}
          </>
        )}
      </AbsoluteFill>
      <Caption text="Moths aren't attracted to light." t={t} t0={0} t1={2.38} y={1655} instant />
      <Tag text="OLD THEORY" t={t} t0={2.62} t1={8.2} x={290} y={170} rot={-5} bg="#F4E6C3" fg="#2A2018" />
      <RedX x={lcS.x + 30} y={lcS.y - 10} size={520} t={t} t0={T.wrong - 0.03} />
      <Caption text="Wrong." t={t} t0={T.wrong - 0.03} t1={8.2} y={1500} size={150} />
    </AbsoluteFill>
  );
};

// =====================================================================================================================
// SHOT B (8.05 - 14.4): scientist films the lamp -> glide into the shot -> viewfinder: the moth turns its back to the light
// =====================================================================================================================
const CAM_B: CamKey[] = [
  {t: T.cutB, x: 760, y: 900, z: -300}, {t: 11.45, x: 760, y: 900, z: -300},
  {t: 12.3, x: 1115, y: 700, z: 500}, {t: 14.6, x: 1115, y: 700, z: 500},
];
const BASE_B = {x: 1250, y: 1580};
const LB = lanternOf(BASE_B.x, BASE_B.y);
const SCI_POS = {x: 470, y: 1620, s: 0.435};
const HOVER_B = {x: 985, y: 720};
const B_S = 0.12;
const SLOW = 12.0;
const slowT = (t: number, k = 0.22) => (t < SLOW ? t : SLOW + (t - SLOW) * k);

export const SceneB: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(t, CAM_B);
  const ts = slowT(t);
  // hero orbits the lamp, then hovers next to it (slow motion), then turns its back to the light
  const phi = 2.0 - 2 * Math.PI * 0.85 * (ts - T.cutB);
  const orb = {x: LB.x + 230 * Math.cos(phi), y: LB.y + 190 * Math.sin(phi)};
  const hov = {x: HOVER_B.x + 10 * Math.sin(2 * Math.PI * 0.5 * ts), y: HOVER_B.y + 8 * Math.sin(2 * Math.PI * 0.9 * ts)};
  const u = seg(t, 11.45, 12.05);
  const hp = {x: lerp(orb.x, hov.x, u), y: lerp(orb.y, hov.y, u)};
  const orbRot = rotUpTo(LB.x - orb.x, LB.y - orb.y);
  let rot = angLerp(orbRot, 0, u);
  const tiltTo = rotUpTo(LB.x - hp.x, LB.y - hp.y);
  rot = lerp(rot, tiltTo, spring(t, T.tilt - 0.08, 1.6, 6));
  const tf = t < SLOW ? t : SLOW + (t - SLOW) * 0.2; // flapping slows down in the viewfinder
  const backDist = (MOTH_BACK) * B_S;
  const r = (rot * Math.PI) / 180;
  const back = {x: hp.x + Math.sin(r) * backDist, y: hp.y - Math.cos(r) * backDist};
  const backS = toScreen(cam, 1000, back.x, back.y), lbS = toScreen(cam, 1000, LB.x, LB.y);
  const glow = 1 + 0.7 * bump(t, T.brightest, T.brightest + 0.7);
  const recOn = t >= T.filmed;
  const camTop = {x: SCI_POS.x + (1480 - SCI.ax) * SCI_POS.s, y: SCI_POS.y - (SCI.ay - 330) * SCI_POS.s};
  const dof = 3 * seg(t, 11.8, 12.3);
  const arrowS = 0.55 * spring(t, T.backs - 0.05, 2.4, 9);
  const arrowAng = 215;
  const L = 300;
  const tail = {x: back.x - Math.sin((arrowAng * Math.PI) / 180) * L * 0.55, y: back.y + Math.cos((arrowAng * Math.PI) / 180) * L * 0.55};
  return (
    <AbsoluteFill>
      <Sky glow={0.25} />
      <Stars cam={cam} t={t} />
      <Ground cam={cam} blur={dof} pool={1} poolX={BASE_B.x} grass={[-400, 980, 1560, 1980]} lamp={<>
        <LampGlow x={LB.x} y={LB.y} a={glow} />
        <Lamp uid="lampB" x={BASE_B.x} y={BASE_B.y} s={LAMP_S} on cover={0.12} brow={0.25} smirk={0.4} look={look(LB.x, LB.y, hp.x, hp.y)} />
      </>}>
        <ContactShadow x={SCI_POS.x - 60} y={SCI_POS.y - 6} w={520} />
        <Scientist x={SCI_POS.x} y={SCI_POS.y} s={SCI_POS.s} t={t} bounceAt={T.scientists} />
        {recOn && t < 12 && (
          <div style={{position: 'absolute', left: camTop.x - 70, top: camTop.y - 52, transform: `scale(${spring(t, T.filmed, 2.6, 9)})`, transformOrigin: '70px 52px',
            fontFamily: '"Inter Display", "Inter", sans-serif', fontWeight: 900, fontSize: 52, color: '#FFFFFF', WebkitTextStroke: '10px #141414', paintOrder: 'stroke fill',
            display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap'}}>
            <span style={{display: 'inline-block', width: 40, height: 40, borderRadius: 20, border: '6px solid #141414',
              background: Math.floor((t - T.filmed) * 2.4) % 2 === 0 ? '#FF3B30' : '#7A2420'}} />REC
          </div>
        )}
        {[{kind: 'a' as const, R: 330, e: 0.62, w: 0.9, ph: 1.0}, {kind: 'c' as const, R: 400, e: 0.5, w: 0.7, ph: 3.9}].map((o, i) => {
          const f = o.ph - 2 * Math.PI * o.w * (ts - T.cutB), f2 = f - 0.02;
          const p = {x: LB.x + o.R * Math.cos(f), y: LB.y + o.R * o.e * Math.sin(f)};
          const q = {x: LB.x + o.R * Math.cos(f2), y: LB.y + o.R * o.e * Math.sin(f2)};
          return <Extra key={i} kind={o.kind} x={p.x} y={p.y} width={130} t={tf} hz={6} seed={i} rot={rotUpTo(q.x - p.x, q.y - p.y)} />;
        })}
        <Moth uid="heroB" x={hp.x} y={hp.y} s={B_S} t={tf} rot={rot} hz={8} expr="calm" />
        {t >= T.backs - 0.05 && <Arrow x={tail.x} y={tail.y} ang={arrowAng} L={L} s={arrowS} label="BACK" labelSide={1} />}
      </Ground>
      {t >= T.brightest && <Dashed pts={[backS, lbS]} t={t} color="#FFE9A8" width={9} a={seg(t, T.brightest, T.brightest + 0.15)} />}
      <Viewfinder t={t} t0={12.02} />
      <Tag text="2024" t={t} t0={T.year - 0.04} t1={11.5} x={540} y={300} rot={-5} bg="#FFE066" fg="#141414" size={120} />
    </AbsoluteFill>
  );
};
const MOTH_BACK = 470; // sprite px from the moth anchor to its back (top of the body)

// =====================================================================================================================
// SHOT C (14.4 - 29.8): open sky -> a lamp pops up -> circle, stall, flip, crash -> trapped -> pull back to frame 0
// =====================================================================================================================
const CAM_C: CamKey[] = [
  {t: T.cutC, x: 360, y: 760, z: 0}, {t: 17.85, x: 360, y: 760, z: 0},
  {t: 18.6, x: 470, y: 760, z: 0}, {t: 20.0, x: 470, y: 760, z: 0},
  {t: 21.1, x: 520, y: 700, z: 0}, {t: 21.9, x: 560, y: 520, z: 40}, {t: 22.75, x: 560, y: 520, z: 40},
  {t: 24.0, x: 600, y: 960, z: 120}, {t: 24.6, x: 640, y: 1040, z: 220, e: E.out}, {t: 26.75, x: 640, y: 1040, z: 220},
  {t: 28.15, x: 540, y: 960, z: 0, e: E.out}, {t: DUR + 1, x: 540, y: 960, z: 0},
];
const H0 = {x: 180, y: 900};
const ORB_C = {R: 300, e: 0.8};
const PHI_S = (150 * Math.PI) / 180, PHI_D = ((360 + 150) * Math.PI) / 180;
const P1 = {x: LC.x + ORB_C.R, y: LC.y};
const APEX = {x: 905, y: 300};
const LAND = {x: 760, y: 1555};
const FALL0 = 23.0;
const G = (2 * (LAND.y - APEX.y)) / Math.pow(T.land - FALL0, 2);
const JUMP = {x: 760, y: 1330};
const HERO_END = 27.95;

type HeroState = {x: number; y: number; rot: number; expr: MothExpr; hz: number; amp: number; wing?: number; sx: number; sy: number; sweat: number; look: [number, number]};
const heroC = (t: number): HeroState => {
  const hov = {x: H0.x + 16 * Math.sin(2 * Math.PI * 0.35 * t), y: H0.y + 14 * Math.sin(2 * Math.PI * 0.8 * t)};
  const tiltRot = rotUpTo(LC.x - hov.x, LC.y - hov.y) * 0.9;
  const exprHover: MothExpr = t < T.sky ? 'calm' : t < T.throws + 0.1 ? 'happy' : 'worried';
  if (t < T.circle) {
    const rot = 3 * Math.sin(2 * Math.PI * 0.6 * t) + tiltRot * clamp(spring(t, T.throws, 1.8, 6));
    return {...hov, rot: t < T.throws ? 3 * Math.sin(2 * Math.PI * 0.6 * t) : rot, expr: exprHover, hz: 8, amp: 1, sx: 1, sy: 1, sweat: 0,
      look: t > T.lamp ? look(hov.x, hov.y, LC.x, LC.y) : [0.3, -0.2]};
  }
  if (t < T.climb) {
    const phi = PHI_S - PHI_D * seg(t, T.circle, T.climb, E.inOutQ);
    const op = {x: LC.x + ORB_C.R * Math.cos(phi), y: LC.y + ORB_C.R * ORB_C.e * Math.sin(phi)};
    const u = seg(t, T.circle, T.circle + 0.3);
    const p = {x: lerp(hov.x, op.x, u), y: lerp(hov.y, op.y, u)};
    return {...p, rot: angLerp(tiltRot, rotUpTo(LC.x - p.x, LC.y - p.y), u), expr: 'worried', hz: 10, amp: 1, sx: 1, sy: 1, sweat: 0,
      look: look(p.x, p.y, LC.x, LC.y)};
  }
  if (t < 22.7) {
    const u = seg(t, T.climb, T.stall, E.out);
    const tr = t > T.stall ? 3 * Math.sin(2 * Math.PI * 17 * t) : 0;
    return {x: lerp(P1.x, APEX.x, u) + tr, y: lerp(P1.y, APEX.y, u), rot: lerp(-90, -78, u), expr: t < T.stall ? 'worried' : 'scared',
      hz: t < T.stall ? 11 : 17, amp: 1, sx: 1, sy: 1, sweat: seg(t, T.stall + 0.03, 22.65, E.lin), look: [0, 1]};
  }
  if (t < T.land) {
    const tau = Math.max(0, t - FALL0);
    const rot = lerp(-78, -540, seg(t, 22.7, 23.12, E.inOut)) + 8 * Math.sin(2 * Math.PI * 3 * t) * seg(t, 23.1, 23.3);
    return {x: lerp(APEX.x, LAND.x, tau / (T.land - FALL0)), y: APEX.y + 0.5 * G * tau * tau, rot, expr: 'scared', hz: 15, amp: 1, sx: 1, sy: 1, sweat: 0, look: [0, 1]};
  }
  if (t < 26.7) {
    const w = impact(t, T.land, 3, 7);
    const ant = seg(t, 26.6, 26.7);
    return {...LAND, rot: -540, expr: 'dizzy', hz: 0, amp: 0, wing: 0.55, sx: 1 + 0.16 * w + 0.08 * ant, sy: 1 - 0.22 * w - 0.12 * ant, sweat: 0, look: [0, 0]};
  }
  const sw = SWARM[4];
  const op = orbit(sw, t, LC);
  const swRot = rotUpTo(LC.x - op.x, LC.y - op.y);
  const uj = seg(t, 26.7, 27.0, E.out);
  const jp = {x: lerp(LAND.x, JUMP.x, uj), y: lerp(LAND.y, JUMP.y, uj)};
  const jr = lerp(-540, -360, seg(t, 26.7, 27.0, E.inOut));
  const uo = seg(t, 27.0, HERO_END, E.inOut);
  const st = spring(t, 26.7, 2.5, 8);
  return {x: lerp(jp.x, op.x, uo), y: lerp(jp.y, op.y, uo), rot: angLerp(jr, swRot, uo), expr: 'calm', hz: HERO_HZ, amp: 1,
    sx: lerp(0.9, 1, st), sy: lerp(1.12, 1, st), sweat: 0, look: [0, 0]};
};
const ENTRY = [{x: -700, y: 200}, {x: 1900, y: 300}, {x: 540, y: -900}, {x: -500, y: 1150}];

export const SceneC: React.FC<{t: number}> = ({t}) => {
  const cam = camAt(t, CAM_C);
  const sh = shake(t, [{t: 18.24, a: 7, d: 9}, {t: T.land, a: 16, d: 6}]);
  // lamp pops out of the ground
  const pop = t < T.nearby ? 1 : 1 - E.outBack(seg(t, T.nearby, T.nearby + 0.27, E.lin));
  const lampY = BASE.y + 1500 * pop;
  const land = impact(t, T.nearby + 0.27, 4, 8);
  const lampOn = t >= T.lamp - 0.04;
  const flick = 1 - 0.6 * bump(t, 18.47, 18.53) - 0.45 * bump(t, 18.6, 18.66);
  const glow = lampOn ? seg(t, T.lamp - 0.04, T.lamp + 0.05) * flick : 0;
  const eyesOpen = t < 18.18 ? 0 : clamp(spring(t, 18.18, 2.5, 9));
  const h = t < HERO_END ? heroC(t) : null;
  const heroPos = h ?? orbit(SWARM[4], t, LC);
  const smug = seg(t, 26.75, 27.0);
  const brow = t < 20.0 ? 0.8 : t < T.land ? 0.2 : t < 24.8 ? 1.25 : lerp(0.9, -0.15, smug);
  const cover = lerp(Math.max(0, 1 - eyesOpen), 0.42, smug);
  const skyGlow = 0.25 + 0.6 * seg(t, T.sky, T.sky + 0.5) * (1 - seg(t, T.lamp, T.lamp + 0.6));
  const dof = 2.6 * seg(t, 24.1, 24.6) * (1 - seg(t, 26.8, 27.6));
  // UP arrow from the moth's back: points at the sky, then swings to the lamp
  const r = ((h?.rot ?? 0) * Math.PI) / 180;
  const back = {x: heroPos.x + Math.sin(r) * MOTH_BACK * HERO_S * 0.9, y: heroPos.y - Math.cos(r) * MOTH_BACK * HERO_S * 0.9};
  const arrowAng = lerp(0, rotUpTo(LC.x - back.x, LC.y - back.y), clamp(spring(t, T.throws, 1.8, 6)));
  const arrowS = t < T.up - 0.05 ? 0 : spring(t, T.up - 0.05, 2.4, 9) * (1 - seg(t, 19.6, 19.8, E.in));
  return (
    <AbsoluteFill>
      <Sky glow={skyGlow} />
      <AbsoluteFill style={{transform: `translate(${sh.x}px, ${sh.y}px)`}}>
        <Stars cam={cam} t={t} />
        <Layer cam={cam} z={MOON_POS.z} blur={dof * 0.8}>
          <Moon uid="moonC" x={MOON_POS.x} y={MOON_POS.y} s={MOON_POS.s} cover={0.58} look={[-0.2, 0.4]} wince={false} />
        </Layer>
        <Ground cam={cam} blur={dof} pool={glow} lamp={<>
          <LampGlow x={LC.x} y={LC.y + (lampY - BASE.y)} a={glow} />
          <Lamp uid="lampC" x={BASE.x} y={lampY} s={LAMP_S} on={lampOn} cover={cover} tilt={0.22 * smug} brow={brow} smirk={smug}
            sx={1 + 0.05 * land} sy={1 - 0.06 * land} eyePop={wobble(t, 18.18, 3, 7)} look={look(LC.x, LC.y, heroPos.x, heroPos.y)} />
        </>}>
          {t > T.nearby && t < T.nearby + 0.9 && <Puff x={BASE.x} y={GROUND.near + 10} t={t} t0={T.nearby + 0.02} size={230} seed={7} />}
          {SWARM.slice(0, 4).map((o, i) => {
            const t0 = 26.8 + i * 0.12;
            if (t < t0) return null;
            const u = seg(t, t0, HERO_END, E.inOut);
            const op = orbit(o, t, LC);
            const pos = {x: lerp(ENTRY[i].x, op.x, u), y: lerp(ENTRY[i].y, op.y, u)};
            return <SwarmMoth key={i} o={o} t={t} L={LC} pos={pos} uid={`swC${i}`} />;
          })}
          <Puff x={LAND.x} y={GROUND.near + 60} t={t} t0={T.land} size={330} seed={3} />
          {h ? (
            <Moth uid="heroC" x={h.x} y={h.y} s={t < 26.7 ? HERO_S : lerp(HERO_S, SWARM[4].size, seg(t, 26.7, HERO_END, E.inOut))} t={t}
              rot={h.rot} hz={h.hz} amp={h.amp} wing={h.wing} expr={h.expr} sx={h.sx} sy={h.sy} sweat={h.sweat} look={h.look} seed={SWARM[4].ph} />
          ) : (
            <SwarmMoth o={SWARM[4]} t={t} L={LC} uid="swC4" />
          )}
          <DizzyStars x={LAND.x} y={LAND.y - 150} t={t} t0={T.land + 0.12} t1={26.62} rx={120} />
          <Arrow x={back.x} y={back.y - 10} ang={arrowAng} L={290} s={arrowS} label="UP" />
        </Ground>
      </AbsoluteFill>
      <Caption text="They're not attracted." t={t} t0={T.notAttracted - 0.05} t1={26.55} y={1010} />
      <Caption text="They're trapped." t={t} t0={T.trapped - 0.08} t1={27.98} y={1010} size={116} />
      <Caption text="What should I debunk next?" t={t} t0={T.next - 0.08} t1={DUR + 1} y={1655} />
    </AbsoluteFill>
  );
};
